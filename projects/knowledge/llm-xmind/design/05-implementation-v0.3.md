# TraceMap v0.3｜后端与算法已实现优化 / Verified Engineering Update

> **2026-11-09 · 本地开发原型，不是生产 SaaS。** 对应的研究与 PRD 请看 [项目首页](../README.md)；源代码在 [1998x-stack/TraceMap](https://github.com/1998x-stack/TraceMap)。

## 1. 交付范围与真实证据

本次不是新的概念设计：实际代码实现了更严格的树结构、引文 Unicode/哈希校验、AI Patch 子树保护、用户核验失效、来源审计、词面相关性排序，以及开发接口的本地访问保护。

- **实现提交：** [235bdb9](https://github.com/1998x-stack/TraceMap/commit/235bdb902309455ae5aa69d2f48f3da9cd88e897)
- **远端测试：** [GitHub Actions Run 42567240816](https://github.com/1998x-stack/TraceMap/actions/runs/42567240816) — Python **27 passed**；Chromium **3 passed**；TypeScript/Vite build **passed**。
- **API 契约：** 19 路径 / 22 操作；CI 比较稳定路由签名。不同 FastAPI/Pydantic 版本的 Schema 文本变化不属于当前 CI 检查范围。
- **合成检索：** 5 来源 × 50 段，其中相关段落位于每个来源第 43 段；规则检索找到 **5/5**。这是刻意构造的代码测试，**不是真实检索召回率**。
- **合成微基准：** 120 次规则生成加树校验，GitHub Python 3.12 Runner 约 **3.288 ms median / 3.505 ms p95**；不包含 API/数据库/PDF/LLM/网络。

## 2. 规范文档与代码

| 交付 | 位置 |
|---|---|
| 算法与证据管线 v0.3 | [ALGORITHM_OPTIMIZATION_V0.3.md](https://github.com/1998x-stack/TraceMap/blob/main/docs/ALGORITHM_OPTIMIZATION_V0.3.md) |
| 后端事务与安全 v0.3 | [BACKEND_OPTIMIZATION_V0.3.md](https://github.com/1998x-stack/TraceMap/blob/main/docs/BACKEND_OPTIMIZATION_V0.3.md) |
| 测试矩阵与局限 | [VERIFICATION_V0.3.md](https://github.com/1998x-stack/TraceMap/blob/main/docs/VERIFICATION_V0.3.md) |
| 算法实现 | [core.py](https://github.com/1998x-stack/TraceMap/blob/main/apps/api/tracemap/core.py) |
| API 实现 | [main.py](https://github.com/1998x-stack/TraceMap/blob/main/apps/api/tracemap/main.py) |
| 对抗测试 | [test_hardening.py](https://github.com/1998x-stack/TraceMap/blob/main/apps/api/tests/test_hardening.py) |
| 实际路由快照 | [openapi.generated.json](https://github.com/1998x-stack/TraceMap/blob/main/packages/contracts/openapi.generated.json) |

## 3. 三项绝对边界

1. **原文可定位不代表来源事实真实。** AI/规则不可自行把主张升级为用户已核验。
2. **AI 只提议而不直接写正式地图。** 用户显式确认、版本 CAS 和全子树保护约束不被 prompt 或模型输出绕过。
3. **开发测试通过不代表可运营。** 目前仍使用本地 SQLite、仅开发认证和同步 PDF 解析；没有正式 PostgreSQL/Worker、真实 LLM、完整隐私删除治理、Xmind 导入实测或用户试验。**删除来源也不保证地图和历史中所有衍生文字已经清除。**

## 4. 下一阶段

优先执行 [G1 正式认证与隔离资料处理](https://github.com/1998x-stack/TraceMap/issues/1)、[G2 PostgreSQL/Worker](https://github.com/1998x-stack/TraceMap/issues/2)、[G3 真实 LLM 与黄金集](https://github.com/1998x-stack/TraceMap/issues/3)。禁止将词面检索合成测试包装为模型评测或商业验证。
