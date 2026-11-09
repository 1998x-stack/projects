# 老龄社会可信陪诊平台 · Eldercare Medical Escort

**阶段：公开桌面研究 + PRD + MVP 功能规格（尚未开发 / 尚未验证付费模式）**  
**更新时间：2026-11-09** · **分类：Health & Aging / 健康与老龄服务**

> **产品论点**：面向老龄家庭，以单城、低医疗风险的常规门诊为切口，通过经过核验的线下陪诊人员、透明报价、分层授权与人工应急，建立可被异地子女与老年人共同信任的陪同就医服务。

## Why this project / 为什么值得研究

中国老龄人口持续增长，但不能以全国老龄人口直接推算陪诊付费市场。医院流程复杂、子女工作和异地居住限制，以及“需要院内陪同而不只是叫车”的具体场景，形成值得验证的服务需求。上海浦东、南京等案例显示行业已有实践和价格锚点；没有证据证明本项目已经获得用户、合作医院、收入或利润。

**Core insight:** Trust, safety, dispatch coverage, local hospital know-how and repeatable unit economics matter more than AI sophistication.

## Deliverables / 研究与产品文档

| Document | Scope | Link |
| --- | --- | --- |
| **Deep research · 2026-11** | HN / Product Hunt / Reddit, domestic and overseas analogues, regulations, policy, risk, unit economics and 90-day pilot; 31 public source entries | [Read full research](reports/research-2026-11.md) |
| **PRD v1.0** | Problem statement, personas, market assumptions, positioning, P0/P1/P2 scope, release gates, safety/privacy, business KPIs | [Read product requirements](reports/prd-mvp-v1.0.md) |
| **MVP functional specification v1.0** | F01–F09 acceptance cases, order and consent states, service journey, exception flows, data/API contracts, 15 E2E tests | [Read MVP functional spec](reports/mvp-functional-spec-v1.0.md) |

## MVP / 单城最小闭环

1. **Appointment**：子女 H5/微信、老人电话申请低风险常规门诊陪诊。
2. **Suitability**：经培训的人工调度先做风险评估；不合适时明确拒接或转介专业服务。
3. **Consent and quote**：服务对象知情同意、可选的健康信息家属共享许可、明细报价和退改规则**分别确认**。
4. **Verified dispatch**：人工派核验人员，确认集合时间并准备备援。
5. **In-person fulfillment**：签到确认老人身份、院内非医疗事务协助、按节点记录；发生紧急情况优先现场呼救和人工接管。
6. **Authorized updates and aftercare**：家属仅看到获授权内容；诊后可查行政待办、账单、售后与评价。

**No medical practice**：不提供诊断、医疗建议、临床操作、医疗文书代签、违规抢号/加号、诊室默认录音录像。不承诺医院官方合作或医疗数据接口。AI 仅作为未来非临床效率辅助候选。

## Who it serves / 目标用户

| User | Real job | User-first requirement |
| --- | --- | --- |
| Adult child / 子女 | 无法请假时安排父母安全就医 | 可靠人员、清晰进度、账单和异常 |
| Elder / 老人 | 自主、体面地完成门诊流程 | 电话可用、个人意愿优先、隐私保护 |
| Escort / 陪诊员 | 有边界地完成服务 | 规范 SOP、清晰任务、备援和应急 |
| Dispatcher / 调度 | 不让订单无人负责 | 人工风控、改派、事件升级、质检 |

## Validation plan / 待验证

- **W1–2**：访谈至少 30 位子女、15 位老人、10 位候选陪诊员及 5 位机构/流程相关人员；核验目标城市规则。
- **W3–4**：单城 2–3 家邻近医院，搭建人工调度、合同、人员安全机制。
- **W5–8**：争取至少 50 单真实付费低风险服务，逐单记录从出发到回程工时、CAC、退款、投诉和安全异常。
- **W9–12**：基于真实成本和安全审查决定 Go/No-Go，目标约 100–150 单作为创业验证的假设，不代表已有业绩。

### Risks and evidence integrity

本研究是公开资料桌面研究，不是实地访谈、竞品试单、医学/法律/保险意见、财务审计或平台实现。引用数据的口径差异、单城运营成本、医院现场准入、人员法律关系、隐私授权和安全处置尚须验证。**文档发布不代表产品上线或取得 PMF。**

国家推荐性标准 GB/T 47801—2026 是设计参考，不应被误称为统一强制医疗职业资格。请参阅研究报告和 PRD 的原始资料及边界说明。

**GitHub Pages:** [Project dossier](https://1998x-stack.github.io/projects/projects/healthcare/eldercare-medical-escort/) · [Portfolio index](../../../README.md) · [Research standards](../../../CONTRIBUTING.md)

*1998X Projects — evidence before conviction.*
