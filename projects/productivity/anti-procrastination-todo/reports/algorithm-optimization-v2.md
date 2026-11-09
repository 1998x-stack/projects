# Start-First｜起步建议算法深度优化设计 v2.0

> **状态**：已编码工程原型；测试覆盖的是规则不变量与合成案例，不是用户行为改善的证据。  
> **日期**：2026-11-09 · **产品阶段**：Local-First Prototype · **代码**：[suggest.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/algorithm/suggest.js) · **测试**：[algorithm-regression.test.js](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/algorithm-regression.test.js)  
> **依赖产品合同**：[PRD v1.0](prd-mvp-v1.0.md) · [功能验收](mvp-functional-spec-v1.0.md) · [初版算法架构](architecture-algorithm-v1.0.md)

## 0. 执行摘要

Start-First 的算法不试图推断用户心理健康、懒惰程度或未来完成概率，而是解一个更狭窄的问题：

**给定一条用户自己写的任务与用户自选的卡点，确定性地生成一条能修改、能观察、容易开始的最小行动建议。**

v2 从 v1 的简单关键词与模板轮换，优化为：**保守分类 → 专业敏感场景保护 → blocker × kind 双维模板 → 有界候选与稳定轮换 → 建议可修改 → 不开始/部分进展后缩小重试**。整个链路运行在浏览器，零 AI API，零用户画像，零任务正文网络依赖。

### 产品价值与算法价值的区分

- 算法**能保证**（在已执行测试边界内）：同输入同版本稳定结果、建议文本长度符合约束、没有任务原文拼接、所有 36 个 blocker×kind 组合有候选。
- 算法**尚不能保证**：用户一定愿意做、2 分钟内完成、更少拖延、更高留存、更好的心理状态。
- 行为结果必须按照 PRD 的合格启动率定义，以真实用户对照研究来判定；模板覆盖率不是疗效或 PMF。

## 1. v1 的问题与 v2 优先级

| 先前潜在问题 | 风险 | v2 处理 | 验收途径 |
| --- | --- | --- | --- |
| 英语模糊子串误分类 | contactless 被识别为“沟通” | 使用词边界与更保守的明确动作线索 | 分类边界用例 |
| 一个任务触发多场景 | 错误代入工作上下文 | 多类强匹配降级 generic；不强行选择一种 | 模糊任务用例 |
| 专业敏感词触发具体建议 | 非专业医疗、法律、财务内容误导 | 专业场景统一走流程型小步，不提供领域建议 | 专业提示用例 |
| 卡点下只有少量建议 | 轮换重复、体验同质化 | 36 类组合，每个组合至少两条人工审核的模板 | 完整性遍历 |
| 建议 index=NaN/Infinity | 非预期轮换或 silent fallback | 0～1,000,000 的安全整数校验 | 边界与异常测试 |
| 没能开始后建议可能原样返回 | “重试”缺少真实调整 | outcome-specific 的更小一条建议 | 浏览器 E2E + Session 历史校验 |
| 同一 Step 被算法覆盖 | 用户主动修改的成果丢失 | Candidate 与 confirmed Step 分离；新修订保留旧历史 | 数据层/端到端测试 |

## 2. 核心决策：不建预测模型

“哪条建议最能让用户开始”需要真实观察数据与实验随机化才能学习；当前数据不存在。因此首版不设置伪装成准确概率的分数，也不构造逐用户行为画像。排序采用**人工维护的优先级**：

1. 精确 blocker + 精确 kind 的已审模板。
2. 同 blocker 的 generic 候选。
3. skip/generic 兜底候选。
4. 保留顺序去重、删除不合格候选。
5. 用 \`index % candidates.length\` 确定性轮换。

候选数量为零时返回保守兜底；用户始终可以自行重写并拒绝建议。v2 的 \`RULES_VERSION="2.0.0"\` 可作为测试和未来实验的冻结版本标识，不代表算法被训练或线上评估。

## 3. 数据契约与纯函数边界

~~~ts
type Blocker =
  | "too_big" | "unclear" | "perfectionism"
  | "low_energy" | "distraction" | "skipped";

type Kind =
  | "writing" | "communication" | "study"
  | "organization" | "preparation" | "generic";

interface Proposal {
  text: string;                     // 模板，自然语言、最多160字
  kind: Kind;
  blocker: Blocker;
  templateId: string;               // blocker:kind:index
  rulesVersion: "2.0.0";
  source: "template";
  suggestedMinutes: 2 | 5;
  requiresConfirmation: true;
  explanation: string;              // 文案仅用于 UX，不证明成功率
}

function classifyTaskDetails(title: string): {
  kind: Kind;
  reason: "explicit_action" | "ambiguous"
        | "no_strong_match" | "professional_context_guard";
  ambiguous: boolean;
};

function proposeStep(args: {
  title: string; blocker?: Blocker; index?: number;
}): Proposal;

function proposeRetry(args: {
  title: string;
  blocker?: Blocker;
  outcome: "partial" | "not_started";
  priorStepText?: string;
}): Proposal;
~~~

**输入合同**：Task 标题需通过 Domain 层 1～200 字校验；卡点只来自六枚举；index 必须是有限安全非负整数。任一不合法输入明确拒绝，不生成貌似成功的空动作。

**输出合同**：仅产生候选文本与静态元数据，不创建用户任务、不修改 Step、不开始 Session、不上传日志或遥测，不提交推断后的医疗/心理结论。

## 4. 任务分类：保守优先

### 4.1 标题归一化

只用于匹配的临时字符串：Unicode NFC、首尾空白去除、连续空白折叠、英文小写；用户输入的 Task 标题原样存在 IndexedDB，算法不静默改写。

### 4.2 明确动作线索

| Kind | 明确短语示例 | 期望建议 |
| --- | --- | --- |
| writing | 写文章、写报告、draft、essay | 只写标题/一句已知信息 |
| communication | 回复邮件、联系、reply、email | 写下需要回答的一件事/不发送的草稿 |
| study | 复习、做题、exam、study | 写下一个概念/问题 |
| organization | 整理、打扫、organize、tidy | 选一件物品/一个区域 |
| preparation | 准备面试、排练、prepare、presentation | 写下一条准备问题 |
| generic | 未识别、同时识别多个、专业敏感上下文 | 写下一个具体的小动作 |

**判定规则**：0 个匹配或 ≥2 个匹配都返回 generic；对医疗用药/法律建议/税务报税/投资决策等关键词触发专业上下文保护。此保护是**静态词表限缩**，不是通用安全模型，不能宣称所有高风险输入均可被识别。

## 5. 模板库：36 个确定性单元

覆盖 6 个 blocker × 6 个 kind。每个组合至少两条候选；跨组合用 generic 与 skipped 兜底。模板始终以可观察动词组织，鼓励“写一个标题／列一个问题／挑一件物品”，而非“彻底解决／变得专注／证明自律”。

### 5.1 例子

| 输入任务 | 用户卡点 | 输出动作例子 | 原因 |
| --- | --- | --- | --- |
| 写报告 | 事情太大 | 写出三个小标题，先不用展开 | 降低产出范围 |
| 回复邮件 | 担心做错 | 先写两句不会发送的回复草稿 | 降低公开与评价压力 |
| 复习数学 | 不知道第一步 | 写下目前最不理解的一个概念 | 先识别问题而非解决全部 |
| 整理文件 | 没精力 | 先选择一件需要处理的物品 | 减少体力与切换成本 |
| 准备面试 | 容易分心 | 只写下第一条准备事项 | 限定单一动作 |
| 做年度报税 | 暂时跳过 | 写下一件现在能动手的最小动作 | 不生成税务建议 |

**重要**：“建议 2 分钟/5 分钟”是行动尝试长度，不是任务耗时估计，不得用于指示任务必然完成。

## 6. 重试策略与状态隔离

以前 \`partial/not_started\` 回顾后常得到同一条起步建议，容易形成原地循环。v2 在用户主动选择回顾结果后生成更小的候选，且**不会立即持久化**：

~~~mermaid
flowchart TD
  A["会话结束：awaiting review"] --> B{"用户选择结果"}
  B -->|step_done| C["仅 Step 完成"]
  B -->|task_done + 确认| D["Task 完成"]
  B -->|partial| E["写下做到哪里，再选更小的一步"]
  B -->|not_started| F["按当前 blocker 缩小行动"]
  E --> G["用户修改/确认"]
  F --> G
  G --> H["新 Step revision；旧 Step/Session 不覆盖"]
~~~

- \`partial\` → 先记录进展，选择一个更小的后续动作。
- \`not_started + too_big\` → 只写下一个最小动作，不强迫执行整个子计划。
- \`not_started + perfectionism\` → 先写一个不会发送的草稿标题。
- \`not_started + low_energy\` → 只写下下一步需要的一样东西。
- \`not_started + distraction\` → 移开一个干扰，再尝试两分钟。
- \`not_started + unclear/skipped\` → 写下一个问题/两分钟动作。

\`proposeRetry\` 纯函数永不改变 Task 状态；前端保存用户再次确认后的 Step，使用 \`templateId=retry:generic:0|1\` 关联模板版本。用户在重试建议中改字则保留手工版本；不应因此收集输入内容。

## 7. 安全、防误导与反馈环

### 7.1 必须禁止

- 根据标题推断 ADHD、抑郁或个人性格，再以此变更建议或上报分类；
- 拼接原始任务文字到建议或公开链接；
- 以完成概率、用户自律评分或累计工作时间作为压迫式激励；
- 在 \`step_done\` 时自动将母任务设为 \`done\`；
- 默认对用户进行 LLM/API 请求或第三方行为分析。

### 7.2 人工编辑优先

\`text\` 仅是候选。任何确认前手工修改必须优先；换卡点或换候选需防止编辑丢失。已确认 Step 由持久化层管理修订，重试只创建新 Step，Session 永远指向当时的 Step ID。

## 8. 测试协议与验证分级

### 8.1 已实现的自动化测试

- **36 个模板单元完整性**：6 blocker × 6 kind，至少两条候选。
- **144 个合成输入组合**：6 kind × 每类 4 个任务 × 6 blocker。检查结果可重复、合法、长度、可编辑、不直接包含任务秘密。
- **敏感保护**：医疗/法律/税务等静态关键词回退 generic；不提供专业行动建议。
- **异常属性**：NaN、Infinity、负数、非整数、超大 index 明确拒绝。
- **缩小重试**：no-start/partial 返回待用户确认的较小动作，不改变母任务完成状态。
- **浏览器级 E2E**：实际输入→开始→回顾“未开始/部分尝试”→生成重试候选→保存新 Step；检查旧 Session 与旧 Step 仍存在。

### 8.2 必须另外做的人工测试

| 指标 | 当前证据 | 下一步验证 |
| --- | --- | --- |
| 候选结构完整 | 合成自动化测试 | 继续构建真实失败案例库 |
| 行动可理解性 | 未做双人盲评 | ≥2 人按可操作、可观察、无假设标注 120+ 真实或授权改写样例 |
| 候选偏好 | 未获真实用户评价 | 录屏/访谈 12–15 名自愿参与者 |
| 合格启动率改善 | 没有数据 | 随机对照组测试，冻结 24h 口径和排除标准 |
| 压力/被评价感 | 没有数据 | 采集主观压力反馈与退出原因 |
| 算法冷启动耗时 | 有可执行 Node microbenchmark | 在真实低端手机上收集 P95，而非只看 CI 机器 |

## 9. 性能基准

运行：

~~~bash
npm run benchmark:algorithm
~~~

脚本使用 8 种人工合成标题 × 6 类 blocker，在 Node 环境预热 1000 次后执行 12,000 次“建议 + 分类”调用，输出运行时间与吞吐量。**结果受 CI 硬件、Node 版本、系统负载影响**，仅用于后续同环境回归，不是用户启动时间或生产 SLO。

不设置“未实测却已通过”的阈值。若进入真实设备开发阶段，建议另测 320px 手机上首次建议响应时间、输入焦点可用性和复杂任务标题回退延迟。

## 10. P1 AI 增强的准入条件

必须先有证据说明 v2 静态模板在实际任务上无法满足多数目标用户，并设计独立授权流程。AI 只能输出一条 JSON 候选 Step，须经本地长度/格式校验、人工确认和规则回退；不得默认发送任务正文，不得训练用户心理画像，也不得替用户对外发送消息。

**实施状态边界**：本轮实现的是 v2 模板与重试代码、合成和端到端测试；没有训练数据、线上模型、学习排名、用户收益实验或医疗有效性结论。

## 11. 文件与版本

- [算法实现](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/code/algorithm/suggest.js) — \`RULES_VERSION=2.0.0\`
- [算法原有测试](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/algorithm.test.js)
- [算法深度回归](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/algorithm-regression.test.js)
- [重试浏览器 E2E](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/tests/browser/retry.spec.js)
- [基准脚本](https://github.com/1998x-stack/anti-procrastination-todo/blob/main/scripts/benchmark-algorithm.mjs)
- [既有算法设计 v1](architecture-algorithm-v1.0.md)

> 设计中声明的阈值均为建议，不意味着已在真实用户或生产环境达标。
