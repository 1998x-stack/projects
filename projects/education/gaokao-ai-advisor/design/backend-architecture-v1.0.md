# 高考志愿 AI｜后端、数据与安全架构 v1.0

> 文档编号 GKA-BE-001 · 2026-11-09 · 状态 **Proposed / 未实施、未部署**  
> 上位依据：[市场调研](../reports/research-2026-11.md) · [架构总览](README.md) · [算法](algorithm-architecture-v1.0.md) · [前端](frontend-architecture-v1.0.md) · [API 与测试](contracts-testing-v1.0.md)

## 0. 目标：最小可用、可回放、无危险的自动化

服务端负责**授权、官方数据版本、硬规则决策、异步审计、风险证据、草表快照、导出和删除**。浏览器与 LLM 不是事实真值源。产品**不是省考试院系统、不得提交志愿，也不得要求用户交出考试报名账号/密码**。

支持范围：选定单一试点省份的一个普通本科批次与一种志愿单位；试点省份尚未确定。只有该年度经授权、核验、批准的官方来源及政策版本全部覆盖时，才允许标记 VERIFIED_CURRENT。任何范围外或旧数据请求必须显式拒绝/降级到历史学习状态。

## 1. 建议技术选型与不做

| 层 | MVP 方案 | 设计理由/替代 |
| --- | --- | --- |
| API | Python 3.12 + FastAPI + Pydantic v2 | API 契约类型化、易与规则与数据分析共享类型 |
| 数据库 | PostgreSQL 16 + SQLAlchemy 2 + Alembic | 事务、约束、关系模型、版本化和审计便于维护 |
| 异步任务 | PostgreSQL jobs + 独立 Python worker | 初期少一个队列基础设施；负载提升后再评估 Redis |
| 文件存储 | 私有兼容 S3 对象存储，开发可用本地受限目录 | 存政策原件/导出；私有 bucket、短时签名下载、hash |
| 数据分析 | pandas/Polars 可选，核心规则纯 Python | 清洗数据与确定性计算分离；热路径不依赖长运行模型 |
| 模型适配 | Provider adapter（禁工具、结构化 JSON、受限上下文） | 供应商可替换；核心审计无需模型也能完成 |
| 部署 | Docker + 单区域 API/worker + 托管 PostgreSQL + 反向代理 | 可恢复备份、分环境密钥、可观测；不是微服务 |
| Web | React + TypeScript；OpenAPI 生成客户端 | 前后端一致的 enum/错误契约 |

**不引入：** Kafka、Kubernetes、向量数据库作为事实仓库、自主多 Agent、实时第三方考试院登录、昂贵的多模型投票、全国并行省份服务。明确复杂度收益后再增量扩展。

## 2. 系统边界与模块化单体

~~~mermaid
flowchart LR
 B[React/TS 志愿工作台] -->|OIDC session / JSON API| A[FastAPI BFF + AuthZ]
 A --> P[(PostgreSQL)]
 A --> S[(私有对象存储)]
 A --> Q[Jobs 表]
 Q --> W[Python Worker]
 W --> C[已审核 Catalog/RulePack]
 W --> E[确定性规则引擎]
 E --> F[Audit Findings + Coverage]
 F --> X[受约束 LLM / 模板解释]
 X --> P
 K[政策数据管理员] --> I[受限导入/审核 UI 或 CLI]
 I --> S
 I --> P
 R[官方来源站点或授权文件] --> I
~~~

所有客户端 API 先校验会话及资源所属关系；所有审计与导出记录固定 source_bundle、rule_pack、profile_revision、draft_revision。业务域模块建议：

- **identity**：外部 OIDC 认证、session、workspace/member 权限与删除；
- **profile**：考生画像的版本化快照及明确同意；
- **catalog**：只读当前/历史官方来源、许可标记、快照索引；
- **policy**：规则 DSL、适用范围、人工签核、激活与撤销；
- **draft**：有序志愿单位草表、导入与修订；
- **audit**：审计指纹、worker、三值规则、证据卡和状态失效；
- **explanation**：模型受限摘要、事实检查、模板回退；
- **export**：仅辅助材料，带版本、日期、水印和官方入口；
- **admin**：人工审核/来源发布，不允许普通用户调用。

逻辑上分层，不预设多微服务。API 不直接执行长时间 AI 调用；读取已计算的确定性结果也不依赖模型服务存活。

## 3. 数据模型（建议最小 17 个核心表）

| 表 | 核心字段 | 不可违反的数据库/服务层条件 |
| --- | --- | --- |
| users | id, oidc_subject, created_at, deleted_at | 外部身份映射唯一；不存考试院密码 |
| workspaces | id, owner_id, created_at | 资源默认私有 |
| workspace_members | workspace_id, user_id, role, invited_at, accepted_at | 仅成员可见，邀请未确认不得访问；角色 owner/editor/viewer |
| profile_snapshots | id, workspace_id, revision, province, exam_year, batch, subjects, rank_encrypted, preferences_encrypted, digest | 不可变快照；唯一 (workspace_id,revision) |
| official_sources | id, official_url, province, year, batch, object_sha256, retrieved_at, verified_at, license_status, metadata | 原件 hash 与来源必填；来源不能被普通用户编辑 |
| source_reviews | source_id, reviewer_id, verdict, reviewed_at, comments | 重要数据至少两名不同审核者确认 |
| catalog_snapshots | id, scope, year, source_bundle_digest, state, activated_at, schema_version | 同一 scope/year 同时仅一个 current（按策略） |
| admission_units | id, snapshot_id, unit_type, university_code, unit_code, major_code?, plan?, data_quality_state | 唯一业务复合键、代码字符串，外键到 snapshot |
| unit_source_refs | unit_id, source_id, anchor, field_names, confidence | 每个关键事实绑定一个可复核来源 |
| rule_packs | id, catalog_snapshot_id, version, digest, approved_by, effective_at, is_active | 只读版本；不得由 LLM 修改 |
| rule_definitions | rule_pack_id, rule_id, kind, operator, inputs, source_ids, on_missing | 运算符白名单；check kind = HARD/SOFT |
| drafts | id, workspace_id, active_revision, created_at, deleted_at | 写操作带 revision 并按 workspace 授权 |
| draft_revisions | id, draft_id, revision, profile_snapshot_id, snapshot_id, ordered_items, digest | 不可变；旧 revision 不覆盖 |
| audit_runs | id, draft_revision_id, profile_snapshot_id, catalog_snapshot_id, rule_pack_id, fingerprint, status, engine_version | 绑定单一事实快照；任务完成和资格状态分离 |
| audit_findings | id, audit_id, unit_id, code, severity, eligibility_status, source_refs, explanation_state | BLOCKER / WARNING / INFO；不得无来源发核心事实 |
| audit_coverage | audit_id, unit_id, rule_id, result, reason, input_digest, source_refs | 每条适用规则的 PASS/FAIL/UNKNOWN/NOT_APPLICABLE |
| jobs | id, type, aggregate_id, run_after, lease_until, attempt, status | 幂等领取+重试；死信标记 |
| exports | id, draft_revision_id, audit_id, object_key, sha256, watermark, status | 固定旧版本可追踪；对象存储私有 |
| audit_events | id, workspace_id, actor_id, action, resource_type, resource_id, result, created_at | 最少必要日志，不记成绩、全文提示词和原始文件 |
| deletion_requests | id, workspace_id, requested_by, status, requested_at, completed_at | 主数据删除与异步清理记录可追踪 |

这里列的是**逻辑表集合**，不是最终物理迁移。隐私字段可以单独密文表；不要将个人位次写入 source/URL/可分享导出文件名。数据库约束必须覆盖 FK、复合唯一性和必要索引，服务层事务覆盖复杂业务条件。

### 3.1 核心字段建议与索引

- admission_units：unique(snapshot_id, unit_type, university_code, unit_code, normalized_major_code)。可空专业代码需规范化为明确占位字段（避免 PostgreSQL unique NULL 语义造成漏判）。
- drafts：index(workspace_id, updated_at desc)，revision 通过 CAS/version 乐观锁更新。
- audit_runs：unique(draft_revision_id, catalog_snapshot_id, rule_pack_id, engine_version) for **deterministic rule result**；如强制重新跑则用 generation 区分；模型解释缓存另有版本。
- jobs：index(status, run_after)，worker 用 FOR UPDATE SKIP LOCKED 领取并 lease；失败退避、超限转 FAILED。
- audit_coverage：unique(audit_id,unit_id,rule_id)，关键规则无覆盖记录不能产生最终标记。
- audit_events：按 workspace 和时间检索；不留明文 prompt 或敏感申请信息。

**原子性**：activate_catalog_snapshot 与 freeze_rule_pack 在同一管理变更事务中验证依赖；用户审计领取时保存 catalog_id 与 rule_pack_id，执行中不能因新版本上线而混入数据。

## 4. 状态机：分清“计算完成”与“可核验”

~~~mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> RUNNING
    RUNNING --> COMPLETED
    RUNNING --> FAILED
    FAILED --> QUEUED: retry allowed
    COMPLETED --> STALE: profile/draft/rules/catalog changed
    FAILED --> STALE: source invalidated
    STALE --> [*]
~~~

AuditRun.status 只表示处理进度（QUEUED、RUNNING、COMPLETED、FAILED、STALE）。**它不意味着全部符合资格**。结果的全局字段由后端计算：

- **scope_status** = CURRENT_VERIFIED / HISTORICAL_ONLY / PARTIAL / OUT_OF_SCOPE；
- **eligibility_status**（每一志愿单元）= ELIGIBLE / INELIGIBLE / UNKNOWN；
- **overall_readiness** = REVIEWABLE / BLOCKED / NEEDS_INPUT / OUT_OF_SCOPE；
- **official_submission_supported = false** 永远为 false（MVP）；
- **confidence**：禁止使用没有校准依据的数值录取概率。

规则：CURRENT_VERIFIED 且所有必检规则覆盖完成、没有 FAIL/UNKNOWN 时才可能 REVIEWABLE。若有 FAIL → BLOCKED；无 FAIL 但有 UNKNOWN → NEEDS_INPUT；超范围 → OUT_OF_SCOPE。对于历史数据，无论历史对照多漂亮也不能 REVIEWABLE 当年申报。

**版本失效**：草表 revision、画像快照、catalog 快照、rule pack 一变更，旧审计标记 STALE。为防竞态，响应还必须包含 input_digest，并在请求时与最新指针校验，不只依赖异步标旧。

## 5. API 设计：稳定资源，显式版本与错误

所有路径以 /v1 开头，采用 JSON + HTTPS，认证会话使用 OIDC 登录后服务器创建的 Secure/HttpOnly/SameSite cookie（并满足 CSRF 防护）。写操作带 Idempotency-Key（用于创建/排队）或 If-Match/revision（用于编辑）；服务端生成 resource_id。建议契约摘要：

| 方法/路径 | 作用 | 成功/关键失败 |
| --- | --- | --- |
| GET /v1/capabilities | 当前支持省份/年份/批次/志愿单位、可用范围 | 200；未初始化给历史练习说明 |
| POST /v1/profiles | 创建画像快照 | 201；422 不支持 scope/缺必填 |
| POST /v1/drafts | 创建草表，绑定 profile_snapshot 与 scope | 201；409 不兼容 scope |
| PUT /v1/drafts/{draft_id}/items | 编辑有序志愿单位，提供 expected_revision | 200 返回新 revision；409 VERSION_CONFLICT |
| POST /v1/drafts/{draft_id}/audits | 启动只读固定版本审计 | 202 + audit_id；409 STALE_INPUT；422 SCOPE_UNSUPPORTED |
| GET /v1/audits/{audit_id} | 获取状态、源版本、摘要与完整结果 | 200 / 404，不泄露资源存在性 |
| GET /v1/audits/{audit_id}/findings | 分页取证据卡和覆盖记录 | 200 / 404 |
| POST /v1/audits/{audit_id}/explanations | 为已生成发现生成**可选**解释 | 202；失败仍保留模板解释 |
| GET /v1/sources/{source_id} | 返回 allowlist 官方来源 URL、发布日期、版本、定位信息 | 200（按权限和来源许可过滤） |
| POST /v1/drafts/{draft_id}/exports | 生成辅助草表导出 | 202；不因 BLOCKED/UNKNOWN 伪装“可正式提交” |
| GET /v1/exports/{export_id} | 查询导出状态/受控下载 | 200 / 404 |
| DELETE /v1/workspaces/{workspace_id} | 启动授权删除流程 | 202；二次确认+权限校验 |

**每个接口均校验 workspace_id、成员身份、scope 与资源归属**；前端隐藏按钮不是授权。与 admin ingestion/approval API 完全分离、单独 RBAC 与多因素认证。

### 5.1 代表性请求响应

~~~json
{
  "request": {
    "method": "POST",
    "path": "/v1/drafts/d_001/audits",
    "headers": { "Idempotency-Key": "unique-client-key" },
    "body": { "expected_draft_revision": 4, "profile_snapshot_id": "p_003" }
  },
  "response": {
    "http_status": 202,
    "audit_id": "a_017",
    "status": "QUEUED",
    "draft_revision": 4,
    "catalog_snapshot_id": "c_2027_1",
    "rule_pack_id": "rules_v2"
  }
}
~~~

~~~json
{
  "audit_id": "a_017",
  "status": "COMPLETED",
  "scope_status": "CURRENT_VERIFIED",
  "overall_readiness": "NEEDS_INPUT",
  "official_submission_supported": false,
  "items": [
    {
      "unit_id": "u_01",
      "eligibility_status": "UNKNOWN",
      "finding_codes": ["PHYSICAL_CONDITION_UNCONFIRMED"],
      "source_refs": ["s_02"],
      "historical_position": "INSUFFICIENT_HISTORY"
    }
  ],
  "display_disclaimer": "辅助核验结果，不等同于省级官方志愿提交或录取保证。"
}
~~~

**标准错误**：HTTP status + {error:{code,message,field?,request_id,retryable}}。客户端不得根据中文 message 作逻辑判断，仅根据 code。409 VERSION_CONFLICT 附最新 revision（已授权时）；503 SOURCE_NOT_READY 禁止当年结论；429 RATE_LIMITED；422 INVALID_ADMISSION_UNIT；403 FORBIDDEN 或统一 404 防资源枚举。

## 6. 异步任务、重试与幂等

- API 接收审计请求，在单事务中冻结输入引用、创建 audit_run + jobs row、提交后返回 **202 QUEUED**。不因模型超时把规则审计失败。
- worker 使用租约领取、心跳和失败退避。确定性引擎以固定输入快照重放；失败可再次计算，同一生成版本写入需 upsert 或唯一约束防重。
- 在 **COMPLETED** 前必须检查每个适用规则的覆盖记录和结果签名；worker 中途异常 → FAILED，不写“0 风险”。
- model explanation 作为独立可选 jobs 运行，状态由解释子资源承担。模型超时→模板解释，**不改变 eligibility**。
- 快照激活事务提交后通过 outbox 发布 source_updated 事件，异步将依赖旧快照的 audit_runs 标为 STALE；读路径同步比对当前指针保证无窗口期误显。
- 失败可观测指标：导入冲突率、UNKNOWN 比率、audit 状态耗时、rule 覆盖缺口、源 freshness、LLM 引证校验拒绝率、错误码分布；不在 metrics 标签中塞分数/个人标识。

## 7. 官方数据导入、审核与回滚

**导入只能走管理员受控通道**：手工审核政策原件及许可→离线解析 staging→批次字段校验→双人抽查→审批 source bundle→生成 RulePack→dry-run 2026 历史案例→发布候选快照→审批激活。

- 标准 source manifest：publisher / url / province / batch / exam_year / content_sha256 / retrieval_time / license_basis / exact_anchor / reviewer_ids / release_tag。
- 省考试院补充/更正规则：新快照替代旧快照，记录 diff（新增/删除/计划数/资格/代码变化）。旧原件保留审计（遵从存储期限），历史使用状态明确降级。
- 回滚：保留上一**已核验且仍有效**的可用快照；如果政策已作废，宁可退回 SOURCE_NOT_READY 而非回滚到不再适用的错误规则。
- 导入的文本/附件被视为不可信数据，不执行宏、脚本、外部链接加载；恶意或格式错误文件在隔离解析环境拒绝；政策文本对模型仅作可引用内容而非指令。
- 审核工具至少区分 importer、reviewer、approver；测试环境禁止误用生产密钥和真实考生数据。

## 8. 安全、隐私与合规前置

高考相关资料可能涉及未成年人个人信息。上线前必须由专业人员评估适用的**个人信息保护法、未成年人个人信息要求、数据出境、第三方模型处理条款、隐私告知与监护人同意机制（如适用）**。本文件是工程设计建议，**不是法律合规认证**。

- **最少收集**：支持匿名无账号历史演示；保存画像的实名/学校名/身份证号均非 MVP 必需字段；禁止采集考试院用户名、密码和验证码。
- **权限**：OIDC + MFA 管理后台；workspace owner/editor/viewer；接受邀请前不赋权；按资源归属在服务层强制校验，资源外泄请求统一返回非可枚举响应。
- **保护**：TLS、密钥托管、数据库备份加密、位次/联系方式等敏感字段加密、短时下载签名、CSP/CSRF/XSS 防护、输入限长、上传类型检查、API 速率限制。
- **模型**：发送最小脱敏事实，不传完整家庭敏感信息；供应商、区域、训练使用条款、删除协议和出境问题评审通过前禁止真实用户数据调用外部模型。可以关闭 LLM 仍可运行核心能力。
- **日志**：request_id、耗时、错误码、资源 id（不含明文个人资料）；禁止记录成绩、位次、导出正文、上传文件全文、模型完整提示。
- **删除**：用户可请求删除画像、草表、导出与 workspace；后台任务 tombstone 后不得重新写入；对象存储与数据库按规定清理。备份清除依照明确轮换周期，**不承诺瞬间清除所有历史备份**。
- **公共链接**：官方来源的 URL 只在 allowlist 中开放；用户备注及被导入文件中的任意 URL 不自动展示为可信链接，禁止 SSRF。

## 9. 导出语义、审计证据和可追溯性

导出 PDF/CSV 草表时包含：用户确认的省份、年份、批次、志愿单位、顺序、数据快照版本、审计时间、每条 BLOCKER/UNKNOWN 明示、官方来源链接与报告 ID。显著水印：**“辅助志愿草表，仅供核对，不可替代省考试院正式填报”**。

- BLOCKED/NEEDS_INPUT 状态可以导出供人工核查的文件，但**不能**标记“已核验可提交”。
- CURRENT_VERIFIED 且 REVIEWABLE 也只是“本工具已覆盖规则核查”，不代表录取、投档或考试院接受。
- 导出总是来自冻结的 draft_revision + audit_id；若结果被标 STALE，导出历史副本必须醒目提示其非当前有效性，拒绝发出“最新核验通过”版本。
- 正式网站地址由用户自行访问官方入口；服务端不代理提交。

## 10. 质量属性、观测与灾备（工程建议目标，不是实测 SLA）

| 关注点 | 建议验收标准 |
| --- | --- |
| 可用性 | 单机故障时读历史报告可恢复，队列任务不会重放出重复草表或错误成功态 |
| 接口响应 | 普通非生成类 API p95 < 500 ms（试点性能目标，不含网络与任务耗时） |
| 审计正确性 | 关键硬规则错 PASS = 0；规则覆盖记录的外键与 source_id 完整率 = 100% |
| 来源一致性 | 关键招生字段经样本 ≥500 的双人独立对照，零未解决错误才允许激活 |
| 任务健壮性 | 幂等重试无重复用户可见任务，FAILED/STALE 在 UI 不能冒充完成 |
| 隐私与授权 | 跨 workspace/未接受邀请访问 0 成功；日志 PII 扫描 0 高危项 |
| 灾备 | 备份恢复演练、对象存储 hash 校验；RPO/RTO 先基于实际资源评审确定，不虚报数值 |

监控报警优先级：错 PASS/缺引用/错误源发布 > 越权/PII 泄漏 > 长时间积压 > 性能；出现关键事实错误时支持按 scope/快照 **kill switch** 一键停止当年核验。

## 11. 测试金字塔、交付顺序与 ADR

测试层次：
1. **单位测试**：三值运算、前导零、时间/批次适用、缺失字段、位次可比性、指纹规范化；
2. **集成测试**：PG 迁移、唯一约束、并发 revision CAS、job lease、outbox、快照激活和回滚；
3. **契约测试**：OpenAPI schema、HTTP 错误码/枚举、前端生成客户端、202/COMPLETED/STale 路径；
4. **安全测试**：跨 workspace 枚举、未接受邀请、会话劫持/CSRF、恶意 CSV、上传文件/URL 注入、数据删除；
5. **端到端**：历史只读练习、有效当年来源、冲突/缺失源、草表修改后失效、LLM 不可用、导出水印。

**工程纵向切片（建议）**：
- P0a：官方来源手工导入 + 双人审核 + 冻结一份历史快照 + 10 条硬规则金标准；
- P0b：匿名/受控试点画像 + 草表编辑 + 规则引擎 + findings/source_refs + 审计状态；
- P0c：任务队列 + 模板解释 + 快照失效 + 带警示导出 + 授权与删除；
- P0d：引入可选 LLM 解读，并执行引文、数字与注入的发布门禁；
- 下一阶段：家庭协作、批量导入与跨版本差异、更多省份；必须先有实际用户验证。

| ADR | 选择 | 未来重评触发 |
| --- | --- | --- |
| BE-001 | FastAPI 模块化单体 | 组织/负载使模块独立扩缩容确有收益 |
| BE-002 | PostgreSQL job queue | 排队延迟和吞吐经负载测量出现瓶颈 |
| BE-003 | 版本化官方事实 + 只读 RulePack | 证据导入合法性或业务规则变化要求更严格审批 |
| BE-004 | LLM 独立附加解释，模板可回退 | 专家试点验证到解释层可靠且有成本收益 |
| BE-005 | 不自动提交、不采集官方凭证 | 未来如变更须独立合规与风险审查，不属于当前范围 |

**发布前不得声称**有实时官方接口、全国数据授权、通过等保认证、真实录取正确率或已部署服务。所有建议阈值均需真实测量。
