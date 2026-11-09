# Start-First｜后端、数据一致性与隐私 API 深度优化设计 v2.0

> **状态**：浏览器本地数据层已加强校验；可选遥测服务仅实现**本机内存参考版本**，尚未部署生产。  
> **日期**：2026-11-09 · **代码仓库**：[anti-procrastination-todo](https://github.com/1998x-stack/anti-procrastination-todo)  
> **关联**：[PRD](prd-mvp-v1.0.md) · [功能验收](mvp-functional-spec-v1.0.md) · [后端初版架构](architecture-backend-v1.0.md) · [算法 v2](algorithm-optimization-v2.md)

## 0. 核心决策

Start-First 不需要依赖服务端的 To-Do CRUD。首版用户承诺是“浏览器中快速开始”，不是“云端管理系统”。

**业务事实源**：IndexedDB（Task / Step / Session 的本地事务）。  
**建议引擎**：浏览器中的纯函数，离线可运行。  
**可选研究服务**：用户未来独立同意后才能接入的伪匿名事件 API。本轮已实现可单机测试的参考服务，但**前端没有连接它，也没有运行线上收集**。  
**生产数据层**：提供 PostgreSQL DDL 蓝图，不声称已经接库、迁移、压测或上线。

~~~mermaid
flowchart LR
  U["用户浏览器"] --> UI["页面 / Domain commands"]
  UI --> S["IndexedDB 事务\n唯一业务事实源"]
  UI --> ALG["本地规则建议 v2"]
  S --> EX["用户手动导出 JSON"]
  UI -. "当前未连接；将来单独授权" .-> API["可选研究 API"]
  API --> G["Schema / Token / 幂等"]
  G --> M["本机测试：内存适配器"]
  G -. "生产方案未实现" .-> PG["PostgreSQL 迁移蓝图"]
~~~

**隐私边界**：没有任务正文出站 API，不意味着静态资源托管方天然“零网络日志”，也不意味着浏览器本地数据自动加密或云备份。

## 1. 目标、非目标与部署拓扑

### 1.1 目标

- 本地命令在**事务提交成功后**才告诉用户“已保存”。
- 旧版本/损坏数据不得被静默清空或伪装成空任务。
- 全库只存在一个 active Task、一个未完结 Session；历史引用不能悬空。
- 可选研究接口只接受事件枚举，不接收任务 title、note、Step 文本、地址、邮箱、错误堆栈。
- 注册后的写入凭证和删除凭证**彼此独立**；删除主事件和撤销 token 是原子操作。
- 重复事件幂等；不同内容共用同一个 Event ID 是明确冲突。
- 不需要账号、云同步、第三方 AI 和付费系统。

### 1.2 明确非目标

- 生产公网研究服务部署、真实参与者招募或真实研究事件收集。
- 基于 IP/设备指纹跟踪用户；分析个人拖延程度或精神状态。
- 完全防止具有合法凭证的恶意客户端伪造研究事件（需单独统计/风控研究）。
- 备份级“立即永久删除”；生产备份保留与删除必须单独实施。

## 2. 本地数据后台（已实现）

MVP 的“后端职责”有一部分由 IndexedDB 事务扮演，不能因其运行在浏览器就忽略数据完整性。

### 2.1 事实源与事务

~~~text
UI command
  → repository.transact(command, uniqueCommandId)
  → read snapshot in IndexedDB readwrite transaction
  → validate existing schema and invariants
  → clone and run synchronous domain command
  → validate new snapshot
  → write snapshot
  → IndexedDB transaction complete
  → UI reports saved
  → BroadcastChannel: prompt other tabs to reread
~~~

**为什么不只依赖 UI state？** 不同标签能在不同页面同时操作；只有数据库事务能序列化对同一 IndexedDB 记录的读改写。BroadcastChannel 只是通知，绝不是锁或一致性事实源。

### 2.2 v2 新增提交前不变量

[validateSnapshot](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/persistence/invariants.js) 在读取和写入时阻断以下不一致：

| 分类 | 不变量 | 故障处理 |
| --- | --- | --- |
| Schema | 仅接受已支持的 \`schemaVersion=1\`；revision 为非负安全整数 | 明确报错，不重置数据库 |
| 身份 | Task、Step、Session ID 唯一且非空 | 拒绝事务 |
| 活跃任务 | 最多一个 active；\`activeTaskId\` 与 active 实体一致 | 拒绝事务 |
| 步骤引用 | \`Task.currentStepId\` 必须属于该任务；Step 有合法母任务 | 拒绝事务 |
| 会话 | running / paused / 待回顾 Session 最多一个；指针一致 | 拒绝事务 |
| 时长 | Session.activeMs 非负且有限；目标时长仅 2/5/10 分钟 | 拒绝事务 |
| 状态 | Task/Step/Session 仅允许合法状态值 | 拒绝事务 |
| 指令重放 | 已处理 commandId 不会重复执行；历史保留上限 512 | 去重与有界维护 |
| 异步操作 | domain command 必须同步，不接受 Promise 作为内部事务变更 | 立即拒绝 |
| 数据导出 | 先验证 snapshot，再建立 JSON 快照 | 不导出已知损坏的假数据 |

**重要边界**：这些是不变量校验，**不是全量数据恢复器**。旧版本不受支持时应提供独立迁移/只读导出，不能为保证体验“无错误”而清空用户任务。

### 2.3 单记录 snapshot 的性能权衡

当前对象存储采用一个版本化 snapshot。优点是写入原子性容易验证、结构简单；代价是每次写入都克隆并重写任务/步骤/会话集合，时间和内存通常随记录规模增长。此设计适合早期小规模本地 MVP，**不应宣称支持无限规模**。

**何时升级为独立 object stores？** 在 500 Task + 2000 Session 等代表性数据量的真实设备实验出现可观的 P95 保存延迟/配额问题时，再设计：
- \`tasks / steps / sessions / batches / commands\` 分 store；
- 单次域命令在同一 readwrite transaction 中维护跨表不变量；
- 完整迁移测试、导出兼容性、跨标签更新策略与可回滚版本号；
- 不能牺牲会话唯一性换取表面写入性能。

### 2.4 浏览器恢复与可靠性

- 刷新 / 后台中断：停止确认活跃时长计入；从已持久化 checkpoint 恢复暂停或回顾状态。
- 配额失败：输入框内容不得被误显示为已保存。
- 异常 Schema：不自动 \`clear()\`。
- 导出：完整本地 JSON 快照，不包含访问 token、事件上报 outbox。
- 删除：必须独立确认，本地清除不等同于未来的远端事件删除。
- 本地数据存在浏览器清理/设备遗失风险；“本地优先”不等于“端到端加密备份”。

## 3. 可选研究事件 API（仅供本机验证）

### 3.1 本轮代码

| 文件 | 责任 |
| --- | --- |
| [event-schema.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/backend/event-schema.js) | 逐事件属性白名单、枚举值与时间类型校验 |
| [telemetry-service.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/backend/telemetry-service.js) | 凭证生成/哈希、注册、事件幂等、容量约束、90 天测试保留、删除 |
| [server.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/backend/server.js) | Node HTTP 路由、64KB body 上限、方法/媒体类型约束、无数据回显 |
| [dev-server.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/backend/dev-server.js) | **默认关闭**；只有显式环境变量才在 127.0.0.1 本机监听，生产环境拒绝启动 |
| [schema.sql](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/backend/schema.sql) | 将来生产 PostgreSQL 存储蓝图，**未执行迁移** |
| [telemetry-service.test.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/telemetry-service.test.js) | 授权、隐私、幂等、删除、过期、容量、真实 HTTP 测试 |

### 3.2 服务启用限制

默认情况下 **没有研究 API 在运行**；应用的 \`index.html\` 不引用任何 HTTP 上报客户端。为研发单机测试：

~~~bash
START_FIRST_LOCAL_TELEMETRY=1 node code/backend/dev-server.js
# 仅监听 127.0.0.1:4317；不能作为公网线上服务使用
~~~

该进程使用**内存适配器**，重启会丢失事件与 token；不支持多实例数据一致性、可用性保证、管理权限、生产化速率限制、审计与备份。开发者不应把它指向公网，也不能在没有隐私政策、真实 opt-in UI 和 durable 数据库时采集真实用户事件。

### 3.3 API 版本与路由

| Method / Path | 鉴权 | 用途 | 成功状态 |
| --- | --- | --- | --- |
| \`GET /healthz\` | 无 | 进程健康探测（不暴露用户数据） | 200 |
| \`POST /api/v1/telemetry/registrations\` | 无；仅在同意后由未来客户端调用 | 颁发随机研究身份及两套 token | 201 |
| \`POST /api/v1/telemetry/events:batch\` | Bearer **writeToken** | 同一身份下批量事件校验、去重、写入 | 202 |
| \`POST /api/v1/privacy/delete-events\` | Bearer **deletionToken** | 删除安装身份的事件并撤销两个 token | 200 |

未提供账号端点、Task CRUD、任务正文上报、公开个人指标仪表盘或公开管理接口。非列出的路径返回 404；只接受 JSON POST，响应带 \`no-store\`、\`nosniff\`、\`no-referrer\` 等安全头。

#### 注册请求

~~~json
{
  "consent": true,
  "policyVersion": "2026-11-09",
  "researchPurpose": "product-improvement"
}
~~~

响应给出 \`installationId\`、\`writeToken\`、\`deletionToken\`、\`policyVersion\`。Token 是独立随机高熵值，后端只保留 SHA-256 hash；不通过 Cookie 自动跟踪。服务端无法密码学证明客户端真的展示过同意选项，因此**“请求自称同意”不是可靠合法同意的替代品**。

#### 事件请求

~~~json
{
  "schemaVersion": 1,
  "events": [
    {
      "eventId": "f74d428d-b551-4666-ae51-6373f8bdf7f6",
      "eventName": "session_ended",
      "occurredAt": "2026-11-09T12:00:00.000Z",
      "attributes": {
        "confirmedActiveBucket": "60-119s",
        "estimatedTime": false,
        "outcome": "partial"
      }
    }
  ]
}
~~~

- 每批 1～30 条，正文 64KiB 上限。
- eventId 必须是 UUID 格式；\`UNIQUE(installationId, eventId)\` 是未来真实数据库里的严格约束。
- 时间不得比服务端时钟超前 5 分钟、不得早于保留窗口。
- \`eventName\` 和 \`attributes\` 必须全部属于显式白名单。禁止 title、note、text、email、URL、stack、任意 JSON 属性、自由文本。
- 完全相同 eventId + 内容重传 → duplicate，不增加事件；相同 ID 但内容不同 → 409，**拒绝覆盖**。
- 若一批中任何事件非法，**整批不入库**，避免“看似成功但漏掉部分数据”的统计失真。
- capacity 测试默认最多 1000 安装、每安装 10,000 事件；这些仅是内存保护上限，不等于公网滥用防护。

#### 删除与撤回

~~~json
{}
~~~

正确 deletionToken 删除该安装身份的全部事件及凭证；旧 writeToken 和 deletionToken 随即失效。响应有随机删除收据 ID。测试只证明单进程内存里的行为；未来生产环境要额外覆盖数据库副本、备份轮换、日志及恢复演练。

## 4. 服务端事件与指标口径

研究服务只被设计成**最小化结构化数据接口**，**当前还不能严谨计算 PRD 定义的 24 小时合格启动率**：没有足够的连续活跃时段证据、可校准的客户端时间与试验分流分母；不能把 \`session_ended\` 桶粗略当成 24 小时效果。

正式开展研究前至少需要：

1. 产品研究伦理/隐私负责人明确目的、最小数据字段与基线对照；
2. 预注册 \`task_created\` 发生时间、用户是否自愿困难任务、\`qualified_start\` 的定义与去重窗口；
3. 确保“累计 ≥60 秒的已确认活动”与“明确确认第一步完成”的时间点能够区分；
4. 设计同意者偏差、重复任务、跨浏览器、脱网延迟上报和时钟回拨处理；
5. 以独立 token 删除和退订流程保护参与者；
6. 在文档中披露只统计自愿参与者，绝不把个人使用轨迹当作心理特征评分。

## 5. PostgreSQL 生产演进方案（未实现）

[生产 DDL 蓝图](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/backend/schema.sql) 包含：

~~~text
telemetry_installations:
  installation_id UUID PK
  policy_version
  write_token_hash UNIQUE
  deletion_token_hash UNIQUE
  created_at / last_activity_at / revoked_at

telemetry_events:
  installation_id UUID FK ON DELETE CASCADE
  event_id UUID
  event_name / schema_version
  occurred_at / received_at
  attributes JSONB
  PK (installation_id, event_id)
~~~

不建 Task、Step、Title、Note、Email、IP 等列。**JSONB 不是自动隐私保护**，接口必须在写入前执行逐事件 Schema 校验；对于合法事件还需数据库约束、事务与慢查询预算。

必要的 production adapter 工作：单次批量原子入库、正确的冲突等价比较、删除 ON DELETE CASCADE、token 哈希索引、密钥轮换、备份 TTL、迁移回滚、管理权限隔离、数据库连接限制以及多实例并发与负载测试。

## 6. 威胁模型

| 威胁 | 影响 | 已实现的本机防线 | 生产仍缺 |
| --- | --- | --- | --- |
| 任意任务正文被误上报 | 隐私泄漏 | 严格事件名/属性/枚举校验、HTTP 不回显请求字段 | 独立出站审计、SDK 约束、DLP/日志审查 |
| 盗用访问令牌 | 事件伪造/删除 | 32-byte 随机 token、哈希存储、写删分权 | HTTPS/WAF、泄漏应急、密钥存储审查 |
| 同 eventId 重放 | 事件重复，指标膨胀 | 幂等去重与 payload 冲突检测 | DB UNIQUE + 多实例事务 |
| 伪造同意 | 隐私合规问题 | 请求需声明 consent & policyVersion | 真正的客户端同意门、审计和法律评审 |
| 大请求和批量刷量 | 内存/费用耗尽 | 64KiB body、30 事件限制、容量上限 | 边缘限速、配额、IP 最小化处理与成本报警 |
| 越权删除 | 他人事件被删除 | 独立 delete token；不同安装隔离 | 备份删除与人工申诉流程 |
| 数据保留过久 | 不必要链路识别 | 内存适配器 90 天清理逻辑 | 定期后台作业、备份 TTL、隐私政策 |
| 管理接口泄漏 | 研究参与者明细泄漏 | 无公开 admin API | 有权访问者身份与审计 |

**概念区分**：带随机安装 ID 的事件是伪匿名而非严格匿名，不得在公关文本中承诺“绝对匿名”。浏览器扩展和 XSS 仍可能读取本地数据或 token；当前实现不构成完整安全审计。

## 7. 已实现的测试矩阵

| 测试类 | 具体检查 |
| --- | --- |
| 本地存储结构 | 旧版 schema、重复 active、悬空 Step/Session、负时长、异步命令和失败回滚 |
| 注册授权 | 未同意、版本错误、额外敏感字段被拒绝；颁发独立写删 token |
| 事件隐私 | 任意字段、自由文本、异常属性值、无效 eventName / eventId / 时间被拒绝 |
| 幂等原子性 | 相同事件重传 dedupe；同 ID 不同结果冲突；整批非法不产生部分记录 |
| 删除隔离 | writeToken 不可删除、deleteToken 不可写入、删除后旧 token 不可复活 |
| 边界/保留 | 31 条事件、超出容量、未来时间、超过 90 天事件、过期安装清理 |
| HTTP 实测 | 本机真实 HTTP 路由、415 media type、401 未授权、413 超大 body、404 未知路径、安全头 |
| 浏览器隔离 | 原有主任务可脱网运行；算法重试不增加重复 Session，旧 Step 记录保留 |

- [服务器测试](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/telemetry-service.test.js)
- [持久化校验测试](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/invariants.test.js)
- [保留原有 17 项浏览器流程与新增重试 E2E](https://github.com/1998x-stack/anti-procrastination-todo/tree/main/tests/browser)
- [自动化测试运行入口](https://github.com/1998x-stack/anti-procrastination-todo/actions/workflows/ci.yml)

## 8. 上线前阻断条件（当前均不可视为通过）

- [ ] 真实同意 UI、独立撤回入口、研究目的/保留期/联系人的隐私政策。
- [ ] Durable database adapter + 原子批处理 / 批量幂等 / 多实例冲突测试。
- [ ] Edge Rate Limit、DoS/请求超时、密钥轮换、应用安全审计。
- [ ] 公网 HTTPS 和实际托管/崩溃日志检查；不能只测代码未上报。
- [ ] 数据备份、恢复与删除 TTL 演练；处理丢失 deletionToken 的权利申请。
- [ ] 不录个人正文的监控/报警、成本预算、事故处置人和审计权限。
- [ ] 研究指标严格可复算，并能解释 opt-in 的选择偏差。
- [ ] 在 staging 做故障注入、加载和高并发压测，然后再考虑 production 部署。

## 9. 运行与验证

~~~bash
npm run verify            # 领域/算法/隐私/存储单元与合同测试
npm run test:e2e          # Chromium 浏览器主流程和重试测试
npm run benchmark:algorithm

# 可选、仅用于本机参考环境，不会被前端调用：
START_FIRST_LOCAL_TELEMETRY=1 node code/backend/dev-server.js
~~~

**本轮完成的边界**：端到端可测试的参考后端、浏览器本地数据完整性约束、静态生产 SQL 蓝图与安全测试。**未实现**：线上 API、真实 opt-in 采集、PostgreSQL 应用适配器、生产审计或跨端账户/云同步。
