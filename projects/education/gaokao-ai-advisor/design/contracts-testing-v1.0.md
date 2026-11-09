# 高考志愿 AI｜跨端契约、验收与风险门禁 v1.0

> 文档编号 GKA-QA-001 · 2026-11-09 · **Proposed / 未编程实现、未执行测试**  
> 关联：[总览](README.md) · [算法](algorithm-architecture-v1.0.md) · [后端](backend-architecture-v1.0.md) · [前端](frontend-architecture-v1.0.md) · [OpenAPI 3.1 草案](contracts/openapi.yaml)

## 1. 首版统一场景与术语

**场景**：经政策负责人选定并审定的**一个省份 + 一个普通本科批次 + 一种志愿单位**，支持考生画像、已有志愿草表核验、官方证据查看、历史位置展示与草表导出。没有当年合法、完整、经核验的数据时，系统仅保留历史学习能力，**绝不声称可以得出当年可报结论**。

### 1.1 三组不可混淆的状态

| 名称 | 枚举 | 语义 | 谁拥有真值 |
| --- | --- | --- | --- |
| AuditRun.status | QUEUED, RUNNING, COMPLETED, FAILED, STALE | 检查任务计算进度 | 后端 |
| AuditUnit.eligibility_status | ELIGIBLE, INELIGIBLE, UNKNOWN | 覆盖的硬约束满足/不满足/不能确认 | 确定性规则引擎 |
| Audit.overall_readiness | REVIEWABLE, BLOCKED, NEEDS_INPUT, OUT_OF_SCOPE | 是否具备人工复核前提 | 后端规则汇总 |
| Audit.scope_status | CURRENT_VERIFIED, HISTORICAL_ONLY, PARTIAL, OUT_OF_SCOPE | 来源对本年本省本批的适用性 | 官方数据治理 |
| Finding.severity | BLOCKER, WARNING, INFO | 当前审计的处理优先级 | 后端依据规则 |
| RuleCoverage.result | PASS, FAIL, UNKNOWN, NOT_APPLICABLE | 逐条可追踪的规则覆盖情况 | 确定性规则引擎 |
| HistoricalPosition.label | HISTORICAL_AHEAD, HISTORICAL_NEAR, HISTORICAL_BEHIND, INSUFFICIENT_HISTORY, NOT_COMPARABLE | 与可比历史最低位次的相对位置，不是概率 | 后端统计模块 |

**内部映射说明：** 算法文档所述原始来源等级 **VERIFIED_CURRENT** 对应公开 API 的 **CURRENT_VERIFIED**；**VERIFIED_HISTORICAL** 仅作为内部元数据，API 以 HISTORICAL_ONLY 呈现。前后端 API 只使用表内公共枚举。

### 1.2 强不变量

- 任何 BLOCKER/UNKNOWN 均不能通过模型解释或 UI 改为 ELIGIBLE。
- 202 QUEUED/COMPLETED **不意味着** REVIEWABLE；REVIEWABLE 也不是政府正式填报状态。
- 无官方数据、缺用户字段、源冲突、规则不覆盖 → UNKNOWN/NEEDS_INPUT 或 OUT_OF_SCOPE；**绝不能 PASS**。
- 只比较相同省份/批次/志愿单位且同口径的历史位次；不展示未经校准的录取百分比。
- source_bundle、rule_pack、profile_snapshot 和 draft_revision 一经审计固定，源或草表变更使旧审计 STALE。
- 代码均为 **字符串**（包括前导零）；不允许模型自造学校/专业组/当年计划数字。
- 导出允许 **“待核对草表”**，不允许写成“已正式提交”“已录取”。official_submission_supported 恒为 false。
- 外部来源正文与考生上传文本视为不可信数据；模型无执行、修改规则、外部提交权限。
- 官方政策、招生计划或完整性不满足发布前置检查，必须拒绝当年核验功能，而非服务端容错降级为“可报”。

## 2. 业务功能追踪矩阵（作为未来 PRD 草案输入）

| ID | 功能与用户目标 | 算法责任 | 后端责任 | 前端责任 | P0 验收点 |
| --- | --- | --- | --- | --- | --- |
| F01 | 确认范围与政策年份 | scope gate | capabilities / current snapshot | S01 来源状态 banner | 范围不支持时只允许历史练习 |
| F02 | 保存画像与偏好 | 关键字段完整性 | profile snapshots / 加密 | S01 动态表单 | 位次缺失不伪造 |
| F03 | 建立/修改有序志愿草表 | 单位代码/数量/顺序 | draft revisions / CAS | S02 列表与键盘排序 | 代码前导零、冲突处理 |
| F04 | 按官方规则核验 | 三值规则与 coverage | audit job / 严格快照 | S03 状态/风险卡 | 关键硬规则错 PASS 为 0 |
| F05 | 历史相对位置 | 可比性与位次差 | historical snapshot | S03 历史年份解释 | 政策变更时 NOT_COMPARABLE |
| F06 | 可追溯解释 | LLM 只读、引证验证 | explanation job / 模板回退 | S03 来源与补充动作 | 假 source_id 禁止显示 |
| F07 | 版本对比与失效 | fingerprint/version | STALE / diff | S04 版本差异 | 旧已核验状态不残留 |
| F08 | 供人工复核的导出 | 固定结果序列化 | export job / 水印 | S05 报告与下载 | 不可成为正式提交凭证 |
| F09 | 隐私/权限/故障 | 模型数据最小化 | workspace ACL / 删除 / 监控 | 全局错误态/隐私说明 | 跨家庭越权/敏感日志为 0 |

F01–F09 是**本次架构文档定义的暂行编号**，并非已经批准的正式 PRD；后续如创建 PRD，必须校准一致性。

## 3. API 契约重点

OpenAPI 文件位于 [contracts/openapi.yaml](contracts/openapi.yaml)。版本字段及异常规则必须体现在实现与测试中：

| API | 输入契约 | 响应契约 | 防御 |
| --- | --- | --- | --- |
| GET /v1/capabilities | 无需敏感考生数据 | 支持的 scope、source scope、官方链接 | 不支持省份不得暗示支持 |
| POST /v1/profiles | province/year/batch/subjects/rank? | profile_snapshot_id + revision | 输入校验、用户同意、最小化收集 |
| POST /v1/drafts | profile_snapshot_id + scope | draft_id + revision | scope 绑定/所有权 |
| PUT /v1/drafts/{id}/items | expected_revision + ordered_unit_ids | 新 revision | 409 CAS 冲突、代码字符串 |
| POST /v1/drafts/{id}/audits | expected_draft_revision + profile_snapshot_id | 202 QUEUED + audit_id | Idempotency-Key；scope gate |
| GET /v1/audits/{id} | audit_id | status + readiness + source/规则版本 | 旧版本必须 STALE |
| GET /v1/audits/{id}/findings | audit_id + 分页 | rule coverage + source refs + action | 不可从完成状态推断全通过 |
| POST /v1/audits/{id}/explanations | audit_id | 202 解释任务状态 | 模型失效只降级解释 |
| GET /v1/sources/{source_id} | 来源 id | 官方 URL、版本、锚点 | allowlist、许可审核 |
| POST /v1/drafts/{id}/exports | audit_id + draft_revision | 202 生成任务 | 加水印、固定版本 |
| GET /v1/exports/{id} | export_id | pending/complete/failed + 受控链接 | 导出下载鉴权与时效 |
| DELETE /v1/workspaces/{id} | 当前 owner 二次确认 | 202 删除受理 | 资源 tombstone、后台任务终止 |

**错误结构**：error.code, error.message, error.field?, error.request_id, error.retryable。前端依赖 code 和 HTTP status，不能解析自由中文错误消息。“无权限”和“目标不存在”对非成员保持不可枚举。**Idempotency-Key** 用于重复提交；草表编辑用 revision 乐观锁。统一返回服务端时间、版本状态；不在 URL query 泄露位次或成绩。

## 4. 规范测试基准与 fixture

至少准备四个独立、可重复的数据集：

1. **golden_rules/**：由省级政策负责人与第二审核人签核的政策条款及 200+ 三值规则案例，包括缺输入、冲突、撤销条款、批次和选科变化。
2. **official_catalog/**：已获得合法使用依据的官方 500+ 随机关键字段记录与来源锚点，带校验者、时间和原件 digest。
3. **historical_replay/**：至少三年同范围、同口径且**随时间前推**的记录；模拟每年当时已知信息，保留不能比较和新设专业组的样本。
4. **adversarial_inputs/**：精心构造的假官方公告、HTML 注入、LLM 篡改、重复代码/Unicode、前导零、跨用户 ID、任务中断/重试与过期版本。

Fixture 禁止包含真实身份证、官方登录凭证或未经授权的可识别学生隐私记录。合规前使用合成数据。**建议规模是上线验收设计，不代表当前已制作数据集。**

## 5. P0 核心验收用例（T01–T24）

| ID | 给定 | 操作 | 预期 |
| --- | --- | --- | --- |
| T01 | 不在试点范围省份 | 请求 capabilities/审计 | OUT_OF_SCOPE；不显示本年可报 |
| T02 | 只有 2026 历史数据 | 创建 2027 草表并审计 | HISTORICAL_ONLY，不能 REVIEWABLE |
| T03 | 2027 计划未审核 | 查询并审计 | PARTIAL/503 SOURCE_NOT_READY |
| T04 | 志愿单位代码 0012 | 保存/读取/CSV 导出 | 保留字符串 0012，无数值化 |
| T05 | 明确不满足选科要求 | 运行规则引擎 | INELIGIBLE + BLOCKER + source_ref |
| T06 | 体检要求存在但用户不提供信息 | 运行规则引擎 | UNKNOWN + NEEDS_INPUT |
| T07 | 有资格规则无法结构化 | 运行规则引擎 | UNKNOWN，不产生 PASS |
| T08 | 两份当年政策相互矛盾 | 试图激活 catalog | 激活失败/该 unit 被暂停 |
| T09 | 新增/合并专业组跨年编码不同 | 历史对比 | NOT_COMPARABLE |
| T10 | 用户只输入分数无位次 | 计算历史位置 | INSUFFICIENT_HISTORY 或显式数据不足 |
| T11 | 已审计 v3 草表改顺序为 v4 | GET 旧 audit | STALE，前端移除“已核验” |
| T12 | 画像选科改变 | GET 旧 audit | STALE，重审计 |
| T13 | 新公告替代旧 catalog | 读取历史 audit | 旧审计不能视为 CURRENT |
| T14 | LLM 自造校名/计划/百分比 | 解析解释结果 | 拒绝解释，模板回退 |
| T15 | 模型引用 source_id 不存在 | 解析解释结果 | 拒绝并记录校验失败码 |
| T16 | 官方原件包含“忽略系统提示” | 调用可选模型 | 无执行外部指令，无规则篡改 |
| T17 | 异步 audit 异常中止 | 查询状态 | FAILED，不能返回“未发现风险” |
| T18 | 相同 Idempotency-Key 连点审计 | 并发两次请求 | 相同可追踪任务，不产生重复写入 |
| T19 | 两个编辑者同时修改 v4 | PUT/items | 一个成功，另一个 409 |
| T20 | 未授权家庭用户知道他人 draft_id | GET/export/delete | 403 或 404，不能泄露存在性 |
| T21 | BLOCKED 草表请求导出 | 导出 | 水印+问题清单，不声称提交 |
| T22 | 用户发起删除后 worker 仍在运行 | 写入完成回调 | 删除墓碑阻断复写，清理可追踪 |
| T23 | 手机上无法拖拽 | 键盘上移/下移并保存 | 能无障碍完成排序 |
| T24 | 用户询问“这是不是已提交志愿” | 查看完成态/导出 | 明确答否，提示省考试院官方入口 |

**数据完整性与法规/政策误判是发布阻断级问题**；不能按简单“24 用例通过 23 就上线”的平均通过率处理。每个用例需登记自动/人工执行者、结果、证据截图/日志的脱敏引用、修复版本和复测结论。

## 6. 非功能质量验收

- 性能目标：无生成任务的 API p95 < 500ms（本地/试点环境的建议初始目标，不是 SLA），全量审计耗时的 p50/p95 单独统计且不含前端声称的“实时保证”。
- 稳定性：重复请求幂等，崩溃后 worker 无重复有效写入；任何状态机中断都可从 FAILED/QUEUED 显式恢复。
- 数据质量：critical field 500+ 样本双人查错；任一重要错误修复后重新抽样，不掩盖失败数。
- 算法：至少 200 条经专家签核的关键规则样例，**错 PASS = 0**；UNKNOWN/NOT_APPLICABLE 覆盖都要计数。
- 安全：越权可复现访问成功数 = 0；PII/log 检查无高危泄漏；模型供应商与跨境处理评估未通过前关闭真实数据推理。
- 无障碍：主要交互满足键盘可达、焦点恢复、含义不依赖色彩、读屏可读；WCAG 2.2 AA 是设计目标，未认证。
- 用户：建议 ≥20 组真实考生/家长任务，对照现有渠道测量错误识别率、误解率、完成时间、核验来源能力；若没有改善则调整产品方向。

## 7. 运行故障与安全关闭策略

| 事件 | 服务端 | 前端 | 是否可发布当前年结论 |
| --- | --- | --- | --- |
| 数据源授权/完整性不足 | 标 source 不可用、503 | 不支持当年审计；可历史学习 | 否 |
| 官方修订公告 | 新 bundle，旧审计 STALE | 明确需重新核验 | 直到新 bundle 批准前否 |
| RulePack 被撤销 | kill switch + 禁激活 | 显示规则暂不可用 | 否 |
| LLM 不可用 | 模板解释 | 展示可验证规则结果 | 若规则/数据合格则可 |
| worker 超时 | FAILED 与可重试 | 错误码与恢复 | 否（该运行） |
| 对象存储异常 | 报导出失败 | 保留审计记录、允许后续重试 | 不影响既有确定性结论 |
| 明文敏感日志被发现 | 立即关停对应链路并安全处置 | 暂停风险功能并告知适用对象 | 需安全复核 |

## 8. CI 合并门禁与研发交付顺序

**每次 PR**：
- OpenAPI 结构校验（例如 Spectral / OpenAPI parser）、生成 TS SDK 并确保类型检查通过；
- Python ruff、mypy、pytest（规则、数据治理、API、worker、权限/删除）、数据库迁移往返和 schema 约束；
- React TypeScript、Vitest、Playwright、axe 测试；无未审查的生产数据 fixture；
- 依赖扫描、秘密扫描、CSV/HTML injection 与权限测试；
- Site build 保留仓库的 **Node.js 22 + BASE_PATH** 站点生成校验；
- 关键安全和数据质量测试任一失败直接禁止合并发布。

**建议里程碑（未来计划，不是当前进度）**：
- **M0 证据可得性**：定一省/批次/单位、数据许可与官方版本审核、规则审核负责人签字；
- **M1 纵向通路**：一个假数据案例可从画像→草表→规则→来源卡→警示导出；
- **M2 历史金标准**：建立完整可比历史数据、500 条双核/200+ 规则案例，修复关键错误；
- **M3 隐私安全试点**：端到端身份/删除/越权/模型回退，真实考生小规模任务观察；
- **M4 审慎上线**：仅在当年官方数据与规则获批、质量门槛通过后开放相应范围。

## 9. 变更控制与证据诚实

变更优先记录需求编号/省份政策版本、ADRs 和 API schema，再同步算法、后端、前端与测试。涉及源口径、规则三值语义、状态名称和导出措辞的改动必须跨文档审阅，不能局部优化 UI 以至改变真实业务含义。

**已完成：** 设计文档与建议测试计划。  
**尚未完成：** 软件实现、政策规则集、数据授权、专业评审、实机/单元/端到端测试、真实用户试点、算法校准、合规审查与生产部署。

> 发布这些 Markdown 文件不是软件测试通过或产品上线的证据。所有数值门槛均为建议性设计目标，需要实施后用真实评测报告呈现。
