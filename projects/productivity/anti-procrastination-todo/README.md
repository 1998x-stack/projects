# Beyond the To-Do List｜Start-First · 先开始

**Published research + runnable engineering prototype + proposed system architecture** · Research: 2026-11-08 · PRD v1.0: 2026-11-09 · Category: Human Productivity

> **One-line promise**：当你明知道有件重要的事却开始不了，帮你在约一分钟内确定一个 2～5 分钟、能真正动手的第一步。

Start-First now has a **runnable local-first engineering prototype**, but it remains unvalidated as a product: no public launch, clinical intervention, retention or behavioral effectiveness result is claimed. It explores a narrow gap identified in a 26-source Hacker News / Product Hunt study: task managers help people remember and organize work, but may not help them **begin an aversive or ambiguous task**.

## 1. Deliverables / 完整文档

| 文档 | 阅读对象 | 内容 |
| --- | --- | --- |
| **[PRD v1.0 — 产品需求文档](reports/prd-mvp-v1.0.md)** | 创始人、PM、设计师 | 产品定位、用户画像、JTBD、目标与非目标、页面、P0/P1/P2、指标、风险和版本门槛 |
| **[核心 MVP 功能规格 v1.0](reports/mvp-functional-spec-v1.0.md)** | 设计、工程、QA | F01–F08 规则、Task/Step/Session 状态模型、异常场景、隐私事件、**76 条 AC**、6 条 E2E |
| **[Code repository — runnable prototype](https://github.com/1998x-stack/anti-procrastination-todo)** | 工程、QA、合作开发者 | `code/algorithm`、`domain`、`persistence`、`frontend`、`backend`、自动化测试及 CI；本地运行说明见代码仓库 README |
| **[算法深度优化 v2.0](reports/algorithm-optimization-v2.md)** | 算法、工程、测试 | 保守中英分类、36 类模板、144 个合成组合、结果缩小重试、安全与微基准 |
| **[后端与数据深度优化 v2.0](reports/backend-optimization-v2.md)** | 后端、安全、数据与隐私 | IndexedDB 不变量、非生产本机 HTTP 参考、独立写删 token、事件幂等/删除、SQL 蓝图与测试 |
| **[算法设计 v1.0](reports/architecture-algorithm-v1.0.md)** | 算法、产品与 QA | 五类卡点 × 任务场景模板、排序与校验、伪代码、Golden Set、质量门槛与 AI 后续条件 |
| **[后端与数据架构 v1.0](reports/architecture-backend-v1.0.md)** | 后端、隐私与研究负责人 | Local-First 数据模型、事务/并发、可选研究遥测 API、数据库、同意/删除、安全和发布检查 |
| **[前端与交互架构 v1.0](reports/architecture-frontend-v1.0.md)** | 前端、UI/UX 与 QA | React/TypeScript 分层、S0–S5 页面、状态机、计时/刷新、多标签、设计系统、E2E 与可访问性 |
| **[Calm Focus UI/UX 深度优化 v2.0](reports/ui-design-v2.md)** | 产品、设计、工程、QA | 情绪基调、信息架构、响应式视觉系统、卡点编辑、计时及回顾、无障碍规则、代码与视觉 QA 入口 |
| [市场与竞品调研（Markdown）](reports/research-2026-11.md) | 产品与投资研究 | 8 款竞品深拆 + 3 个补充案例、用户评论与 26 条原始来源 |
| [市场与竞品调研（Word）](reports/research-2026-11.docx) | 审阅与批注 | 11 页可编辑文档 |

## Engineering implementation / 代码进度

- **Repository:** [1998x-stack/anti-procrastination-todo](https://github.com/1998x-stack/anti-procrastination-todo) · [source folders](https://github.com/1998x-stack/anti-procrastination-todo/tree/main/code).
- **Tested revision (2026-11-09):** [71071bf](https://github.com/1998x-stack/anti-procrastination-todo/commit/71071bfed912fd023ac45e68bc5e87b8398e600c); [GitHub Actions](https://github.com/1998x-stack/anti-procrastination-todo/actions/runs/42567018611) confirmed **53/53 Node unit and API contract tests**, **19/19 Chromium browser tests** and a **12,000-sample algorithm microbenchmark** (71.13 ms on that CI machine). The synthetic tests are not evidence of improved real-life task starting.
- **Implemented:** task capture, batch import/undo, edit, single focus, user-selected blocker, editable rule-based first step, short session, pause/restore, review, IndexedDB, export, local deletion and Calm Focus v2 responsive/accessible-first UI with optional local appearance preference.
- **Not implemented:** production research analytics / opt-in client, durable HTTP backend database adapter, AI API, cloud sync, JSON restore, PWA cold-start support, clinical/behavioral outcome studies. The HTTP reference server is loopback-only, not deployed or connected to user UI.
- **Architecture note:** the first tested slice deliberately uses dependency-free browser ES modules instead of the proposed React/TypeScript stack; domain responsibilities remain separated for future migration.

A passing test suite validates the tested code paths, **not** all 76 PRD acceptance criteria or product-market fit.

## Deep optimization v2 / 算法与数据工程深度优化

- **算法**：[v2 设计文档](reports/algorithm-optimization-v2.md) 与 [代码](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/algorithm/suggest.js)。36 个 blocker × kind 单元、144 个合成任务组合、专业敏感上下文兜底、`partial/not_started` 缩小重试，旧 Step/Session 不会被覆盖。
- **浏览器数据层**：[v2 设计文档](reports/backend-optimization-v2.md) 与 [快照校验](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/persistence/invariants.js)。每次事务校验 Schema、活跃任务/会话唯一性、引用一致性和非法累计时间；旧版本不静默清空。
- **可选后端**：[本机参考 HTTP 服务](https://github.com/1998x-stack/anti-procrastination-todo/tree/main/code/backend) 有授权、写删凭证隔离、幂等与请求限制测试；**并未上线，用户端也没有接入**。
- **性能/效果的边界**：CI 合成微基准仅说明 Node 环境下算法可执行，不能用于承诺实际启动时长或减少拖延。真实用户验证依旧是下一阶段任务。

## 2. Product Thesis / 产品假设

**To-do list ≠ task initiation.** 产品目标不是重新造一个 Todoist，也不是把拖延归结为懒惰。核心问题是：用户已有明确任务，但因任务太大、第一步不清楚、害怕做错、精力低或注意力易分散，迟迟没有开始。

Start-First 提供一个可退出、可编辑、无羞辱的行动辅助闭环：

1. **Capture**：输入一件难事或粘贴已有任务，零登录。
2. **Focus**：只看现在要处理的一项，而非整个 backlog。
3. **Identify**：选择当前阻力（五选一或跳过）。
4. **Shrink**：获取可编辑的 2～5 分钟起步建议；首版规则式而非强依赖 AI。
5. **Start**：开始 2/5/10 分钟短会话，允许暂停、隐藏计时和退出。
6. **Recover**：区分第一步完成、部分尝试、尚未开始与整项完成；不惩罚中断。

## 3. Scope / MVP 与非目标

| P0 必须具备 | P1 验证后考虑 | P2 明确不做 |
| --- | --- | --- |
| 快速捕获/批量粘贴、单任务聚焦、五类阻力、可编辑起步动作、短会话、温和回顾、本地保存与导出、自愿匿名遥测开关 | AI 个性化第一步、JSON 恢复导入、PWA 安装、正计时实验 | 跨端云同步、复杂项目管理、Todoist 双向 API、日历自动排程、强制屏蔽、社交监督和收费 |

MVP 首版为**mobile-first 本地优先 Web**，无需账户。任务正文默认不上传；本地存储并不代表云备份，清除浏览器数据可能造成丢失，必须明确告知。

## 4. Success ≠ App Opens / 测量真正的开始

**北极星建议**：困难任务的“合格启动率”，在创建后 24 小时内有主动开始且累计 ≥60 秒的确认活动，或用户自行确认第一步完成；每个母任务只计一次。该指标只是可观测行为代理，需与访谈、对照实验和负面体验反馈共同解读。

**可靠性优先于游戏化**：无静默任务丢失、Session 重复、未授权正文上传；如果无法兑现这些约束，不应发布给真实用户。

## 5. Handoff / 给设计与工程团队

- 从 [PRD](reports/prd-mvp-v1.0.md) 的 F01–F08、S0–S5 确定范围与端到端黄金路径。
- 使用 [功能规格](reports/mvp-functional-spec-v1.0.md) 的 AC-01～AC-76 编写测试；先搭 Task/Step/Session 状态模型，再实现计时与视图。
- 首先完成“捕获 → 卡点 → 小步 → 计时 → 回顾 → 恢复”，避免提前构建账户、计费、社交和跨端同步。
- 在招募真实用户前完成数据丢失、隐私与多标签竞态专项 QA；研究数据采用自愿同意原则。
- 实验结果尚不存在：**不能把文档发布视为已验证产品市场契合（PMF）或真实使用收益。**

## 6. Architecture decisions / 算法、后端、前端

三份架构文档分别给出**规则、数据与界面的实现合同**，但不是已实现系统：

- **算法**：本地确定性候选建议（五类卡点、六种场景），只建议一个动作；用户改写永不被自动覆盖。详情：[算法设计](reports/architecture-algorithm-v1.0.md)。
- **后端**：P0 核心业务无需服务端 API；Task/Step/Session 仅存 IndexedDB。研究参与者主动同意后才可启用结构化事件上报。详情：[后端与数据](reports/architecture-backend-v1.0.md)。
- **前端**：Mobile-first Web；状态机与 IndexedDB 事务为事实源，解决后台计时、多标签竞争、失败保存与温和恢复。详情：[前端与交互](reports/architecture-frontend-v1.0.md)。

**工程对齐顺序**：先按 [功能规格](reports/mvp-functional-spec-v1.0.md) 固定 F01–F08 / AC-01～76，再并行实现本地规则、领域状态与页面；把遥测 API 作为非阻断实验能力。产品、数据与效果尚未得到真实验收。

## 7. Research integrity / 研究限制

原始研究是公开社区的目的性抽样，评论不具总体代表性；尚无亲自试用全部竞品、用户留存、付费意愿、临床疗效或实测生产力提升数据。PRD 中目标/指标/发布门槛均为设计建议，应在可用性测试和行为实验中验证。

**Portfolio dossier**：[1998X Projects / Human Productivity](https://1998x-stack.github.io/projects/projects/productivity/anti-procrastination-todo/)
