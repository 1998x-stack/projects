# Beyond the To-Do List｜Start-First · 先开始

**Published research + proposed MVP design** · Research: 2026-11-08 · PRD v1.0: 2026-11-09 · Category: Human Productivity

> **One-line promise**：当你明知道有件重要的事却开始不了，帮你在约一分钟内确定一个 2～5 分钟、能真正动手的第一步。

Start-First is an **unvalidated product concept**, not a released app or a clinical intervention. It explores a narrow gap identified in a 26-source Hacker News / Product Hunt study: task managers help people remember and organize work, but may not help them **begin an aversive or ambiguous task**.

## 1. Deliverables / 完整文档

| 文档 | 阅读对象 | 内容 |
| --- | --- | --- |
| **[PRD v1.0 — 产品需求文档](reports/prd-mvp-v1.0.md)** | 创始人、PM、设计师 | 产品定位、用户画像、JTBD、目标与非目标、页面、P0/P1/P2、指标、风险和版本门槛 |
| **[核心 MVP 功能规格 v1.0](reports/mvp-functional-spec-v1.0.md)** | 设计、工程、QA | F01–F08 规则、Task/Step/Session 状态模型、异常场景、隐私事件、**76 条 AC**、6 条 E2E |
| [市场与竞品调研（Markdown）](reports/research-2026-11.md) | 产品与投资研究 | 8 款竞品深拆 + 3 个补充案例、用户评论与 26 条原始来源 |
| [市场与竞品调研（Word）](reports/research-2026-11.docx) | 审阅与批注 | 11 页可编辑文档 |

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

## 6. Research integrity / 研究限制

原始研究是公开社区的目的性抽样，评论不具总体代表性；尚无亲自试用全部竞品、用户留存、付费意愿、临床疗效或实测生产力提升数据。PRD 中目标/指标/发布门槛均为设计建议，应在可用性测试和行为实验中验证。

**Portfolio dossier**：[1998X Projects / Human Productivity](https://1998x-stack.github.io/projects/projects/productivity/anti-procrastination-todo/)
