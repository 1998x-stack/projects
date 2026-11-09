# 高考志愿 AI｜算法与决策安全架构 v1.0

> 文档编号 GKA-ALG-001 · 2026-11-09 · 状态 **Proposed / 设计草案，未实现、未通过录取预测验证**  
> 产品定位：志愿草表风险审计与家庭决策支持；依据：[市场调研](../reports/research-2026-11.md) · [总览](README.md) · [后端](backend-architecture-v1.0.md) · [前端](frontend-architecture-v1.0.md) · [契约与验收](contracts-testing-v1.0.md)

## 0. 一句话原则

**招生资格由版本化官方数据与确定性规则裁决；模型只解释已验证事实，不生成资格、投档结果或虚假的百分比。** 本系统不替代各省教育考试院的正式志愿系统，也不代用户填报。

### 首版范围与不可越界事项

- **一个省份 × 一个普通本科批次 × 一种志愿单位（院校专业组/专业(类)+院校等依实际省份规则选定）**；具体省份、年份、规则和数据合法使用条件，在实施前由研究/政策负责人签字确认。
- **2026 历史数据**可用于离线回测/练习；实际下一年度服务只有在该年度、省份、批次的官方计划及政策入库、双人核验并激活后才能开放。历史数据不能冒充当年建议。
- MVP 的用户价值主线：录入考生条件 → 导入或编辑已有草表 → 按官方来源审计硬限制 → 提示相对历史位置和数据缺口 → 解释/对比 → 导出带状态水印的辅助草表。
- 暂不做全国通用推荐、录取百分比承诺、AI 自动投档、自动登录考试院、跨省复制录取口径、未经回测的个人适配评分、复杂 Agent 多轮自主执行。

## 1. 输入、输出与安全边界

| 对象 | 必备字段 | 风险与校验 |
| --- | --- | --- |
| StudentProfileSnapshot | profile_id、province、exam_year、batch、subject_selection、rank（或仅分数 + 无法比较标记）、preference_constraints、revision | 当前高考位次在可用时优先；不从分数凭空推算位次；敏感字段最少化 |
| OfficialSourceVersion | source_id、publisher、official_url、document_sha256、effective_year、province、batch、retrieved_at、verified_at、license_status、reviewers | 任何重要数字/限制必须可定位来源；缺来源不得标为 VERIFIED |
| CatalogSnapshot | catalog_id、source_bundle_id、schema_version、effective_year、scope、checksum、published_at、activated_at | 入库只追加新快照，旧快照可重放；同一服务请求仅引用一份完整快照 |
| RulePack | rule_pack_id、catalog_id、admission_unit_type、version、digest、rules、approved_by | 禁止模型在线改写规则；无人工批准不可激活 |
| DraftRevision | draft_id、revision、ordered_unit_ids、user_confirmations、created_at | 顺序/代码/单位必须符合当省规则；修改 revision+1 |
| AuditRun | audit_id、input_fingerprint、engine_version、status、rule_results、coverage_summary、explanation_version | 审计引用固定源、规则、画像与草表，不跨版本拼凑 |
| AuditFinding | code、unit_id、severity、eligibility_status、facts、source_refs、rule_ids、next_action | 未知要明确，不能从信息缺失推出“可报” |
| DraftExport | draft_revision、audit_id、watermark、generated_at、hash | 用于讨论与复核，不是官方报考凭证 |

**输出三个互相独立的维度**：① 硬规则状态 ELIGIBLE / INELIGIBLE / UNKNOWN；② 统计位置/波动信息；③ 偏好契合度（用户可更改的定性标签）。三者不合并成 0–100 的“综合录取可能性”。

## 2. 决策管线

~~~mermaid
flowchart TD
    A[考生画像 + 有序志愿草表] --> G{省份/年份/批次/志愿单位完整?}
    G -- 否 --> Z[UNKNOWN: 补充信息 / 停止当年判定]
    G -- 是 --> B[绑定 CatalogSnapshot + RulePack]
    B --> C{官方来源完整且已核验、当年激活?}
    C -- 否 --> H[HISTORICAL_ONLY / UNVERIFIED: 禁止当年可报宣称]
    C -- 是 --> D[确定性规则引擎]
    D --> E[逐项 rule_results + 覆盖证明]
    E --> F[历史相对位置与敏感性分析]
    F --> I[只读证据摘要]
    I --> J[可选 LLM 结构化解释]
    J --> K{事实/引证/数值/边界验证通过?}
    K -- 否 --> L[模板解释 + 标记人工复核]
    K -- 是 --> M[解释卡与可追溯来源]
    L --> N[审计报告 + 手动复核]
    M --> N
    H --> N
~~~

**强不变量：** 审计出具结果时始终先执行资格/数据完整性闸门；任何来源不足或模型失败都不能自动降级为“通过”。业务逻辑即使关闭 LLM 仍可完成核心审计。

## 3. 官方数据：双人校验与版本治理

### 3.1 接入顺序与许可闸门

1. 建立该省份的政策来源目录：省考试院当年招生计划、志愿单位及编码、选科/体检/单科/外语/专项资格限制、填报顺序与投档录取规则、高校招生章程及修订公告。
2. 逐条记录获取方式、网站条款、公开/授权范围、政策生效时间、抓取时间、内容哈希、页码或表格锚点。**公开可浏览不自动等于允许批量抓取/再分发**，许可不明则保留人工审核，不启用对应数据。
3. 分两条管道：**Raw Source**（原件不可变）→ **Staging**（解析+字段映射+质检）→ **Reviewed Bundle**（双人独立抽检/签核）→ **Active Snapshot**（事务原子切换）。新来源抵达不直接覆盖线上快照。
4. 校验：year/province/batch 一致、招生单元唯一键一致、代码字符串保留前导零、字段完整率、计划数合理范围、单位级约束可解释、变更记录与公告版本差异、source_ref 可打开。
5. 发现撤销/补充通知：生成新版本、撤销旧版的 **current** 标记，并将依赖旧版的审计标为 STALE；不静默篡改历史报告。若关键字段不一致，暂停该单元“可报”结论。
6. 不允许人工随意“补”缺失数据；人工更正必须记录来源、差异、双人审批和生效快照。

### 3.2 主键与志愿单元

**AdmissionUnitKey** = (province, exam_year, batch, admission_unit_type, university_code, unit_code, optional_major_code)。所有代码在数据库和前端都视为 **字符串**，禁止自动数值化。省份可能以“院校专业组”、以“专业(类)+学校”或其他组合为填报单位；**不得在实现前偷设全国统一粒度**。

限制条件采取 **适用范围、证据与解释并存** 的规则表达，例如 subject_required_any / subject_required_all、physical_requirement、single_subject_min、language_requirement、quota_qualification；其语义只在省级审定规则本中启用。不能覆盖的政策由人工核查而不是模糊正则强行结构化。

### 3.3 可信等级

- VERIFIED_CURRENT：当年、当前省批次、已签核且生效的完整来源快照；允许执行当年硬规则核验。
- VERIFIED_HISTORICAL：已签核的历史来源；只用于历史对照，必须显示年份标签。
- PARTIAL / CONFLICTED / EXPIRED / LICENSE_UNCLEAR：禁止以可填报结论输出，具体缺口进入覆盖报告。
- OUT_OF_SCOPE：省份/批次/志愿单位未支持，停止并给出官方查询入口。

**不得**用任意网页搜索结果、LLM 记忆、非官方自媒体或无源统计数字替代核心目录字段。

## 4. 可执行的确定性规则引擎

规则分为四层（优先级从上至下）：

| 层级 | 示例 | 失败行为 |
| --- | --- | --- |
| R00 Scope & provenance | 省份、年份、批次、单位类型、源快照生效和许可 | UNKNOWN / OUT_OF_SCOPE；不能宣布符合资格 |
| R10 Identity & structure | 官方学校/专业组/专业代码存在、草表顺序与该省配置匹配、数量限制、重复单位 | BLOCKER 或 UNKNOWN；给出字段级定位 |
| R20 Eligibility | 选科、体检、专项资格、单科与语言条件（仅当规则覆盖） | 确认不符→INELIGIBLE；缺用户信息或不能解析→UNKNOWN |
| R30 Information & preference | 当年计划变化、风险提示、地域/费用/专业偏好冲突 | WARNING / INFO，不冒充资格裁定 |

**三值逻辑**（PASS、FAIL、UNKNOWN）：

- 只有检查所需字段已验证、适用范围已确定，才可产生 PASS；
- 有明确、可回溯的硬约束不符时为 FAIL；
- 缺失、来源互斥、解析失败或用户条件未确认时为 UNKNOWN；
- 组合：任一 FAIL → INELIGIBLE；否则若存在必检 UNKNOWN → UNKNOWN；全部 PASS → ELIGIBLE；即便 ELIGIBLE 也**不是保证录取**。

~~~python
def audit_unit(profile, unit, catalog, rule_pack):
    if not same_scope(profile, unit, catalog, rule_pack):
        return "UNKNOWN", [finding("SCOPE_MISMATCH", "BLOCKER")]
    results = []
    for rule in rule_pack.applicable_rules(unit):
        result = rule.evaluate(profile=profile, unit=unit, catalog=catalog)
        assert result.outcome in {"PASS", "FAIL", "UNKNOWN"}
        assert result.rule_id and result.coverage_record
        results.append(result)
    if any(r.outcome == "FAIL" and r.kind == "HARD" for r in results):
        eligibility = "INELIGIBLE"
    elif any(r.outcome == "UNKNOWN" and r.kind == "HARD" for r in results):
        eligibility = "UNKNOWN"
    else:
        eligibility = "ELIGIBLE"
    return eligibility, results
~~~

**规则版本样例（示意，不构成任何省份的真实政策）：**

~~~json
{
  "rule_id": "SUBJECT-REQUIRED-ALL-001",
  "kind": "HARD",
  "scope": {"province": "PILOT_PROVINCE", "exam_year": 2027, "batch": "PILOT_BATCH"},
  "input_fields": ["profile.subject_selection", "unit.subject_required_all"],
  "operator": "set_contains_all",
  "on_missing": "UNKNOWN",
  "source_ids": ["official_document_version_123"],
  "approved_by": "policy_reviewer_2"
}
~~~

注意：规则只按 **已批准 DSL 运算符集合** 解释，不执行数据库中自由脚本；规则版本 hash 固定。类别“体检/资格特殊条件”若不能可靠结构化，应输出人工必核项而非 PASS。

## 5. 历史位置与不确定性：绝不伪精确

### 5.1 最小可信信息

历史数据在同省、同批次、兼容的志愿单位和口径下才可比较。展示 **历年最低位次与本年考生位次的差**、变化方向、招生计划变化及缺失年份；必须注明位次序列定义与同分处理口径。遇新设/合并专业组、专业拆分、选科政策更改、批次变更、录取规则变更 → 标为 **NOT_COMPARABLE**，不能强行拼接时间序列。

位次差示例：在位次越小越靠前的前提下，**relative_margin = last_admitted_rank - student_rank**；数值为正代表考生历史相对位置靠前，**不是概率**，也不意味着当前一定录取。使用方需显示原始年份、位次与公式，避免“领先 1200 位”被误读为有确定名额。

### 5.2 统计风险输出策略

首版只提供 **位置描述**：HISTORICAL_AHEAD / HISTORICAL_NEAR / HISTORICAL_BEHIND / INSUFFICIENT_HISTORY / NOT_COMPARABLE，界值依据事前定义的省份方案并显示范围。它是“与历史最低位次的距离”而非学术意义上校准的概率；禁止直接映射“冲 20% / 稳 70% / 保 95%”。

若后续确实需要概率估计，必须先满足：
1. 具有合法可用、跨多届可比的逐专业组/专业录取与招生计划数据；
2. 按时间前推滚动验证，特征只使用当年填报决策时点已知的信息（防止 **year-T 录取结果泄漏到预测 year-T**）；
3. 评价分位段、院校类型、新设专业、政策变更 cohort 的覆盖率/校准误差，并发布样本量与置信区间；
4. 数据漂移、样本外与极低样本单元默认弃答，且经业务/政策负责人批准后才能在 UI 展示估计值。

在上述门槛之前，不训练也不展示“个人录取率模型”。可用蒙特卡洛情景对**输入假设**做敏感性演示，但必须标注人为假设、不得冒充概率分布。

## 6. 家庭偏好与草表排序

偏好 **独立于资格和录取统计**：用户可声明城市倾向、学科兴趣、预算上限、是否接受调剂等。排序优先执行硬约束过滤，再在明确可比较的候选之间做透明的属性排序；权重默认对用户可见、可重设，不把“热门程度”包装为人生建议。家庭协作仅允许显示各自的偏好分歧，不推断未输入的人格、家庭收入或就业前景。

**偏好冲突类型**：PREFERENCE_CONFLICT（用户已确认不接受的专业/地区）、COST_INFORMATION_MISSING（学费/住宿信息未核实）、FAMILY_DISAGREEMENT（明确的双人偏好冲突）、UNVERIFIED_POLICY（官方依据不足）。这些只影响决策提醒，不把可报规则推翻成模型判断。

排序不变式：任一 INELIGIBLE/UNKNOWN 单元不能自动进入“核验通过”列表；草表编辑/排序不能覆盖原始审计状态，必须生成新 revision 并重审计。

## 7. LLM 层：受约束解释，不是独立推荐器

**输入**由服务端生成：已核实的 profile **非敏感最小摘要**、审核发现代码、规则说明、可引用官方片段及来源 id、可供选择的下一步问题。**未经来源解析的 HTML/PDF/用户导入备注均是不可信文本**。AI 不拥有实时网页搜索、写数据库、外部系统提交或替换数据权限。

**输出 schema（示意）**：

~~~json
{
  "finding_id": "f_001",
  "plain_language_explanation": "该志愿单位的选科要求尚未得到完整验证，请先核对官方计划。",
  "cited_source_ids": ["official_document_version_123"],
  "next_action": "VERIFY_SUBJECT_RULE",
  "uncertainty_label": "MISSING_INPUT",
  "no_admission_guarantee": true
}
~~~

校验器拒绝以下输出：未在 allowlist 的 cited_source_ids、未出现于来源中的数值/年份/代码、声称“保证录取”或没有依据的概率、改变 eligibility、未经授权的用户敏感信息、带外部跳转/注入指令的文本。拒绝时给出规则模板解释，不允许模型反复试探以绕过验证。

**提示注入安全**：所有外部政策文本和备注放入明确 data 区域；系统策略不接受其中的指令。只读来源锚点、上下文裁剪、无工具调用、输出 schema 与二次验证是互补控制；采用人工红队样例检验。模型输出与原始提示默认不进入可搜索日志。

## 8. 审计可复现性与状态失效

**Audit fingerprint** = SHA256(canonical_json(profile_snapshot_id, draft_revision, catalog_snapshot_checksum, rule_pack_digest, engine_version, explanation_schema_version))。使用规范化 JSON、显式键与 UTF-8 编码；fingerprint 用于幂等和版本追踪，不承诺 LLM 解释逐字相同。

每份审计保存**每条规则的覆盖记录**：PASS / FAIL / UNKNOWN / NOT_APPLICABLE、输入字段 hash、规则版本、来源锚点、理由与时间。不能将“没有发现”作为全量覆盖证明。画像、草表、官方来源、规则版本一变更 → 旧审计 STALE，不可展示“最新已验证”；历史报告只读留存（受删除策略控制）。

## 9. 核心对抗用例

| 场景 | 期望 |
| --- | --- |
| 位次缺失，仅分数 | 历史位次比较 INSUFFICIENT_DATA，不估算为精确位次 |
| 学校/专业组代码前导零 | 始终保留字符串，不错误匹配 |
| 当年招生计划缺失、许可证不明 | 当年“可报”结果 UNKNOWN / 禁止 READY |
| 明确选科冲突 | INELIGIBLE + BLOCKER + 官方来源 |
| 体检限制存在但画像未填写 | UNKNOWN + 引导官方/人工核实，而非 PASS |
| 同一条款来自多个相互冲突的公告 | CONFLICTED + 停止相关单元判定 |
| 2026 旧数据用于 2027 | HISTORICAL_ONLY 标签，不能冒充 2027 计划 |
| 当前选择省份不在试点范围 | OUT_OF_SCOPE，不能自由问答填表 |
| 已审计草表改变志愿顺序/专业组 | revision++，旧 audit STALE |
| LLM 引用不存在的 source_id | 解释拒绝，使用 deterministic 模板 |
| 注入来源文本要求上传密码 | 忽略指令，不请求官方账号或密码 |
| 仅有一年度历史最低位次 | INSUFFICIENT_HISTORY，不生成精确概率 |

## 10. 评测与上线闸门（**建议目标，尚未实测**）

- **官方数据**：抽样 ≥500 条含年份、代码、计划和选科的核心记录进行双人独立对照；**关键字段错误=0**，若发现必须修正并重新抽样。记录抽样方案、来源与审查者。
- **规则引擎**：≥200 条覆盖正常、边界、互斥、缺失和政策变更用例；关键硬规则误 PASS **0 容忍**；未知/缺失时拒绝“可报”结论。
- **历史数据**：滚动时间回测 ≥3 年可比样本；按位次段/招生单元/政策变化报告缺失率、覆盖率、漂移与基准比较，不以漂亮平均数代替风险暴露。
- **解释一致性**：使用金标准来源卡评估 source_id、代码/数字一致性、越权声明与注入；任何编造“保证录取”或修改 eligibility 为发布阻断缺陷。
- **人工验证**：省级招生政策专家对规则本及高风险案例抽样签核；家庭用户任务测试对比现有方法是否更快识别真实错误。
- **发布禁入**：不能合法获得当年官方数据、核心规则未签核、来源冲突未解决、严重隐私安全问题未关闭，均不能发布当年实际志愿核验能力。

## 11. 模块切分与决策记录

- ingest：来源抓取/人工导入、原件 hash、许可标记、审阅与激活；
- catalog：志愿单位、年份和历史对照的只读快照；
- rules：版本化 DSL、三值运算、覆盖证明；
- position：可比性判断、位次差与定性敏感性；
- explainer：受约束 LLM + 模板回退；
- audit：快照编排、失效检测、审计/导出序列化。

**ADR-A1**：从确定性审计而不是 AI 预测开始；仅在长期数据和时间前推校准达标后讨论概率。  
**ADR-A2**：不使用向量数据库作为关键招生事实的真值来源；政策条款和证据 id 必须结构化并可定位。  
**ADR-A3**：第一阶段只覆盖一个省批次，后续每个省份是**独立规则包与数据验证工程**，不是加一个配置字符串。

> 该设计是工程与政策负责人讨论的实现提案，不证明相关省份规则已结构化、数据已授权、算法已经验证或可以真实填报。
