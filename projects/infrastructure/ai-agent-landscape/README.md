# AI-Agent Landscape · 产品市场深度调研

**Status:** Published research + product design · **Date:** 2026-11-09 · **Category:** Tools & Infrastructure · **Product build:** Not started

> **Research thesis:** The real competition among AI agents is shifting from autonomy demos to reliable, inspectable, economically justified work delivery.

**研究主题：** AI-Agent 的核心产品定位、优缺点、产品设计、Hacker News / Product Hunt 用户评价，以及不同 Agent 的能力边界与商业机会。

## Executive highlights / 核心发现

- **Agent 不是单一品类。** 通用执行、研究浏览器、软件工程、个人常驻助手和企业工作流存在不同的任务验收方式，不能仅按一个“能力榜”比较。
- **控制面影响产品体验。** IDE、命令行、云计算环境、本地网关和可视工作流决定了任务授权、检查、恢复和协作方式。
- **可核验交付比演示更重要。** 需要衡量任务成功率、人工审查时间、失败重试成本、权限控制与可回滚性。
- **创业机会是待检验的假设。** 优先选择结果可验证的垂直业务流程，用真实任务测试 ROI；这不是已验证的产品市场契合度。

## Research / 研究报告

| Artifact | Description |
| --- | --- |
| [**Full report · 中文 Markdown**](reports/research-2026-11.md) | 深度竞品表、14 个产品/产品线分析、HN/PH 用户反馈、Agent 交互设计和测评方法 |
| [**Product PRD · v1.0**](reports/prd-2026-11.md) | EvidenceFlow Agent 产品定位、目标用户、核心路径、P0/P1、指标与 Go/No-Go 评审 |
| [**MVP functional spec · v1.0**](reports/mvp-functional-spec-2026-11.md) | 功能展开、页面线框、数据模型、状态机、API、许可闸门、24 条验收测试 |

## Proposed MVP / 研发产品方案（尚未实现）

**EvidenceFlow Agent** 是由市场研究推导出的垂直产品假设：帮助 AI/SaaS 创始人和 PM 对 3–5 家竞品开展只读调研，把关键结论绑定到可查看的来源片段、提供冲突/时效提示、人工审核门禁，最后导出 Markdown 报告。

首版**不做**通用浏览器电脑操作、自动发帖/写 CRM、多 Agent 自治或未经授权的数据抓取。Product Hunt API 默认不允许商业使用，需先取得相应许可；MVP 在无授权情况下仅允许人工提供链接和合法笔记。

**开发状态：** 已发布产品设计文档与验收标准；未提供可运行原型、无用户数据/收入或效率实验结论。

## What is covered / 报告范围

| Dimension | Included |
| --- | --- |
| Market map | Manus, ChatGPT Work / Workspace Agents, Genspark, Perplexity, Claude Code, Cursor, Codex, Devin, OpenCode, OpenHands, OpenClaw, n8n, Zapier, Lindy |
| Product design | 执行环境、交互模型、人机确认、权限治理、异常恢复、成果验收 |
| Voice of customer | HN 公开讨论与 PH 评价，分别说明样本量及评价偏差 |
| Comparative framework | 通用 vs 垂直、IDE vs CLI、云端 vs 自托管、Agent vs 确定性工作流 |
| Validation | 可复用的 14 天竞品测试方案、标准化任务与评价指标 |

## Evidence & limitations / 证据边界

- 共 **36 条可定位的来源条目**，涵盖 HN、PH、官方文档、OWASP 和独立研究；在[完整报告附录](reports/research-2026-11.md#附录-a原始来源与核验入口)查看网址。
- 这是 **desk research / 桌面调研**，并非对 14 个 Agent 运行相同任务后的实测排名。
- PH 评分和评论数量是特定时点的产品页快照，不代表真实成功率或用户总体满意度。
- 产品功能和价格可能变化；高风险工作流应先在沙盒中做独立验证。

## Suggested next experiment / 下一步验证

选择一种能够客观验收的垂直任务，比较人工基线与 2–3 个候选 Agent，跟踪完成率、错误率、人工干预分钟数、执行费用及审批/回滚日志。只有具备可重复证据时，才将“效率提升”用于对外陈述。

**Website:** [Read project dossier on GitHub Pages](https://1998x-stack.github.io/projects/projects/infrastructure/ai-agent-landscape/)

**Portfolio:** [1998X / PROJECTS](../../../README.md)
