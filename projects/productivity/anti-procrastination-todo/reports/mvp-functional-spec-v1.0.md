# Start-First｜核心 MVP 功能规格、状态机与验收标准 v1.0

> **文档定位**：Engineering-ready functional specification / 供产品、设计、前端、QA 共同使用。  
> **范围**：只覆盖 [PRD v1.0](prd-mvp-v1.0.md) 定义的 P0；不表示代码已实现。  
> **版本**：1.0 · **日期**：2026-11-09 · **状态**：待评审  
> **关联证据**：[Hacker News / Product Hunt 竞品调研](research-2026-11.md)

## 0. 需求可追踪矩阵

| Feature ID | P0 功能 | 主界面 | 领域对象 | 核心验收 | 事件（仅授权后） |
| --- | --- | --- | --- | --- | --- |
| F01 | 捕获与多行导入 | S0/S1 | Task | AC-01~06 | task_created, task_import_confirmed |
| F02 | 聚焦一个难事 | S1/S2 | Task | AC-07~11 | focus_task_selected |
| F03 | 五类卡点识别 | S2 | Task/Step | AC-12~17 | blocker_selected, blocker_skipped |
| F04 | 建议/编辑第一动作 | S2 | Step | AC-18~26 | step_suggested, step_confirmed, step_edited |
| F05 | 短会话计时 | S3 | Session | AC-27~40 | session_started, session_paused, session_resumed, session_ended |
| F06 | 回顾与温和恢复 | S4 | Step/Session/Task | AC-41~51 | outcome_recorded, retry_started |
| F07 | 本地数据与可信操作 | 全局/S5 | Store/Consent | AC-52~67 | export_requested, local_data_deleted |
| F08 | 可撤回匿名实验授权 | S5/初次研究招募 | Consent/Event | AC-68~76 | telemetry_consent_changed |

每条需求需具备可复现的 happy path、边界条件、失败反馈和 QA 用例。数据表、事件和验收 ID 是 v1.0 的合同；更改时同步修订 PRD、实现、测试。

## 1. 设计假设与环境边界

**最小技术假设**：现代支持 IndexedDB 的 Chrome、Safari、Edge、Firefox；手机优先；静态资源加载后可操作。暂不保证 Safari 私密浏览模式持久化、跨设备同步或用户清理浏览器数据后的恢复。

**数据约束**：所有任务/起步动作正文保留在浏览器本地。会话计时不是专门的计费记录；后台挂起、设备睡眠可能影响精确活跃时间，统计时需标记估算来源。任务正文不会进入遥测或远端错误日志。

**时间语义**：创建时间统一 ISO 8601 UTC，展示为设备本地时区；会话累计时间以运行时单调计时为准，恢复时用墙钟差估算并标明估算；不承诺后台一直在真实工作。

**基本对象**：Task 是“要完成的母目标”，Step 是“接下来 2～5 分钟能动手做的动作”，Session 是一次围绕 Step 的尝试。Step 完成不能自动完成 Task；Session 超时不能自动完成 Step。

## 2. 功能 F01｜零登录捕获、编辑和批量粘贴

### 2.1 UI 契约

- S0 顶部标题：“今天哪件事最难开始？”；聚焦单行输入框，Enter 保存并进入 S2；Shift+Enter 保留输入语义（如采用多行 textarea）。
- S1 主操作：“添加一件难事”；次操作“从其他清单粘贴”；只展示标题、最后修改时间、最近起步状态，不要求优先级/日期/标签。
- 单条标题 1～200 个 Unicode 字符，备注 0～1,000；仅空白/换行视为无效，保留用户可见的内部空格。超限时阻止保存、解释还可删除多少字符。
- 批量粘贴：仅按换行拆分，trim 首尾空白，过滤空行，最多 20 行，超出时显示全部原文本编辑区但不创建超过上限的任务。确认页展示将创建 N 条；用户可以逐条编辑/取消；重复标题**允许**，不静默合并。
- 创建操作与列表更新处于同一持久化事务；若保存失败，不跳转“成功页”，保留输入供重试与复制。
- 批量撤销：创建后提供“撤销本次导入”；仅删除此次新建条目，不能影响原有同名条目；若其中有条目已经开始会话，撤销需明确确认关联数据影响。

### 2.2 边界和错误

- 粘贴带序号的文本（“1. 做A”）：MVP 保留原字符，不智能猜测解析；避免误删合法文本。
- HTML/Markdown 富文本粘贴：只收纯文本，在所有展示页面做安全转义。
- 两个浏览器标签页同时修改：P0 采用版本号/最后修改时间检查，冲突时拒绝静默覆盖并提供“重新载入/复制我的内容”。
- 浏览器不支持 IndexedDB：阻止“永久保存”承诺，进入受限模式并提示可复制内容；P0 测试范围要求主流受支持浏览器正常持久化。

### 2.3 验收

- **AC-01**：无登录、无教程拦截，输入合法标题并确认，可从 S1 查到唯一新 Task ID。
- **AC-02**：空格标题不能提交；200 字可提交、201 字显示错误；备注 1,001 字被阻止并保留编辑内容。
- **AC-03**：粘贴 5 行（含空行、两条同名）仅生成四条可预览条目；取消后生成零条。
- **AC-04**：21 行粘贴不静默遗漏，提示上限、可编辑并重复确认。
- **AC-05**：模拟 IndexedDB 写入异常，界面显示未保存，原输入可复制，未发生页面跳转。
- **AC-06**：批量撤销只影响该 batchId 的记录；刷新后不存在半导入状态。

## 3. 功能 F02｜单任务聚焦视图

### 3.1 规则

- 从 S1 选择一条任务进入 S2，Task 状态从 inbox → active；其他任务仍在 inbox / archived / done 中。
- 全局最多一个 active Task。若已有 active，再点击另一条，展示“切换到这件事？上一个任务和记录都会保留”；确认后将旧任务还原 inbox，新任务 active。
- 在 S2/S3 返回清单不等于结束/完成；若会话 running，弹窗提供“继续当前会话 / 暂停并返回”。
- 归档只是从默认清单隐藏，可以恢复；删除属于破坏性操作，需确认。
- 用户可以手工标记母任务完成；**只有用户显式确认**，系统才能把 Task 改为 done。

### 3.2 验收

- **AC-07**：新任务选中后，S2 只展示该任务与聚焦动作，不展示其他任务内容。
- **AC-08**：切换 Task 不丢失旧 Task 的 Step、Session 和编辑记录。
- **AC-09**：running 期间切换必须有明确暂停/结束策略，不能产生两个并发 running Session。
- **AC-10**：归档/恢复不等价于完成，已存历史和事件一致。
- **AC-11**：刷新后聚焦任务指向唯一有效 Task；若旧 Task 被删除，安全回到 S1。

## 4. 功能 F03｜卡点识别（可跳过、非诊断）

### 4.1 五类选项和 UI

| Blocker enum | 用户文案 | 设计意图 |
| --- | --- | --- |
| too_big | 事情太大 | 缩小范围和产出 |
| unclear | 不知道第一步 | 给出可观察的起手动作 |
| perfectionism | 担心做错 | 建立无须发布的草稿/练习 |
| low_energy | 没精力 | 降低准备成本、缩短持续要求 |
| distraction | 容易分心 | 指定单一场景、去除眼前一个阻碍 |
| skipped | 暂时说不清 / 跳过 | 不强迫贴心理标签 |

- 交互最多一屏，单选，默认不预填。
- “跳过”与选择同权重；跳过不降低产品功能，仅采用通用候选模板。
- 卡点仅作用于此任务当前 Step 候选，不作为永久心理画像；用户可修改/清空。
- 明确免责声明：不是心理诊断；不展示“你有 ADHD / 焦虑症”等推断。

### 4.2 验收

- **AC-12**：所有选项支持键盘和触控；屏幕阅读器有选中提示。
- **AC-13**：跳过卡点仍可收到通用建议或手动填写 Step。
- **AC-14**：取消/修改选择不会删除现有 Task。
- **AC-15**：更改卡点只影响新候选，用户已手改并确认的 Step 不被覆盖。
- **AC-16**：页面没有诊断性提示、羞辱性措辞或隐性锁定提醒。
- **AC-17**：卡点值仅在当前设备存储；未授权遥测时不得上报。

## 5. 功能 F04｜规则式第一步建议与编辑

### 5.1 生成规则（Deterministic-first）

目标是生成 **2～5 分钟、动词起头、有明确动作对象、结果可观察** 的 Step。MVP 不猜测用户所处环境，不生成专业判断、医学法律财务建议，不假定持有文档或访问权限。建议只是候选，不是事实。

| 卡点 | 默认候选格式 | 示例（用户任务：准备年度总结） | 兜底 |
| --- | --- | --- | --- |
| too_big | 只确定最小部分，不做整体 | “写出年度总结的 3 个章节标题” | “把这件事拆成 3 个小标题” |
| unclear | 找到入口 / 列出已知信息 | “打开空白文档，写下要回答的一个问题” | “写下这件事最先需要知道的一个问题” |
| perfectionism | 允许粗糙草稿，不提交 | “写 3 句不会公开的草稿” | “写一段只给自己看的粗糙版本” |
| low_energy | 降低到准备动作 | “打开上次文件，标出下一处要改的位置” | “只准备需要用到的一个文件或工具” |
| distraction | 一次消除一个当前干扰 | “关闭一个无关标签页，写下第一个要处理的点” | “打开任务材料，只做其中一个小动作” |
| skipped | 默认最低成本入口 | “用一句话写下这件事的第一步” | “写下你现在能做的一件最小动作” |

**实现建议**：内置有限的动词/模板库，不要求基于自由文本理解复杂语义。对“写邮件”等常见任务类型可按可解释关键词选择更具体模板；否则使用兜底。每个候选要通过文本规则校验：非空、长度 ≤160 字、不得与母任务标题完全相同、不得包含“必须成功/彻底解决”一类过大指令。

### 5.2 人工决策优先级

1. 自动生成的候选永不立即写入“已确认步骤”，用户必须点击“用这一小步”或修改。
2. 用户可编辑成任意 1～160 字动作；若“这一步需要 10 分钟以上”，UI 建议更小，但不阻止继续。
3. “换一个建议”只替换**尚未编辑**的候选；一旦变成 userEdited = true，必须先确认才可以覆盖。
4. 任意任务都支持“我自己写第一步”；未成功生成建议时正常使用手写能力。
5. 编辑确认形成不可变版本号，之前完成的 Session 仍引用当时的 Step 版本，不得追溯修改历史文案。
6. 避免记录羞耻、精力、注意力的长期统计画像；无可选聊天框或云端 AI 分析。

### 5.3 验收

- **AC-18**：五类卡点与跳过都能在可控逻辑下得到可读候选或明确手动入口。
- **AC-19**：提示内容必须具体可执行；在用户测试中筛出“提高效率/努力做完”等空泛输出。
- **AC-20**：自编辑候选不会被卡点更改自动覆盖。
- **AC-21**：手动输入优先；不依赖网络可创建、确认和启动。
- **AC-22**：相同输入与相同规则版本生成同一候选序列；可回归测试。
- **AC-23**：生成失败显示“自己写一步”入口，不造成任务丢失或会话阻断。
- **AC-24**：空白 Step 被阻止；160 字合法，161 字提示。
- **AC-25**：Step 完成仅更新 Step，不自动标记 Task done。
- **AC-26**：历史 Session 关联 Step 的原确认版本，修改后不更改旧记录。

## 6. 功能 F05｜2/5/10 分钟短会话

### 6.1 界面与行为

S3 只显示：母任务小标题、当下 Step（可查看不能在 running 中直接覆盖）、可切换的时间显示、一个主按钮、次级“结束并回顾”。默认 5 分钟；允许启动前选 2/5/10 分钟。用户可在计时进行中隐藏时间显示，但不能停掉真实记录状态。

**计时语义**：进行中累计 activeElapsedMs；暂停不累计；时长到达只改变 timerReached = true 并提示继续/结束，不产生自动 completion。自动到时仍保持 running，用户按“结束并回顾”后才收尾，防止后台挂机产生假完成。

**暂停规则**：running → paused；再次点击继续恢复。暂停期间关闭浏览器，重开提示“继续这一步 / 结束并回顾”。不播放声音、不强制网页通知。

**退出规则**：运行中导航走时，弹窗：“这一步还在进行中，想先暂停吗？”返回原页、暂停并返回、结束并回顾三项，均有取消途径。

**刷新规则**：在页面开始计时前将 Session 写入本地；页面刷新后根据 sessionId 重新恢复，不重复创建。同一时间最多一个 running Session；从另一个标签页启动必须通过锁/事务或单实例仲裁。

### 6.2 会话状态机

| 当前状态 | 命令 | 新状态 | 必须持久化 |
| --- | --- | --- | --- |
| idle | start | running | new sessionId, taskId, stepId, startedAt, targetMs |
| running | pause | paused | activeElapsedMs, pausedAt, updatedAt |
| paused | resume | running | resumedAt, lastActiveStart |
| running | reached target | running | timerReached=true（不自动结束） |
| running / paused | end | ended | endedAt, activeElapsedMs, estimatedClock=false/true, outcomePending=true |
| ended | record outcome | ended | outcome, outcomeRecordedAt, outcomePending=false |
| any | reload | same persisted state | no new session, restore task/step relation |

**强制不变量**：一个任务最多一个进行中会话；全库最多一个 running；Session 一旦 ended 不可 resume（新尝试需新 sessionId）；ended 后允许修正 outcome 但需可追溯更新时间；所有操作幂等。

### 6.3 计时与后台边界

- 前台累计使用单调时钟（如 performance.now）避免 Date.now 被手动修改影响。
- 进入后台/刷新时存储 checkpoint；恢复时通过 UTC 时间差估算间隔，**默认不把不可观测的后台时间计入“合格启动的实际 active 秒数”**。必要时提供“继续计时/从暂停处继续”让用户选择。
- 设备睡眠/时区变化与后台冻结均不得导致负数或超过 24 小时的异常累积；未确认的后台段计入 estimatedDurationMs 而非 confirmedActiveMs。
- 达到目标时允许继续；不是新的 session，统计一次 start。
- 连续点击 10 次开始，必须只有一个 sessionId 与一条 session_started（在授权数据中）。

### 6.4 验收

- **AC-27**：默认 5 分钟，2/10 可选并记录 targetMs。
- **AC-28**：开始必须成功持久化后才进入 running 状态，失败有重试。
- **AC-29**：连续点击/网络重复调用不创建多个 Session。
- **AC-30**：暂停期间不累计确认活跃时间。
- **AC-31**：到达目标时不自动结束、完成 Step 或 Task。
- **AC-32**：隐藏倒计时不会影响 pause / resume / end。
- **AC-33**：刷新仍为同一 Session；不会双启动。
- **AC-34**：退出时可选择暂停/结束/取消；旧会话不被新会话静默覆盖。
- **AC-35**：多标签页不能出现两个 running；冲突时告知用户。
- **AC-36**：设备时间回拨不产生负时长或极大时长。
- **AC-37**：离线状态可运行和结束并正确保存。
- **AC-38**：running/paused 可结束进入回顾，不得丢弃 Step。
- **AC-39**：Session 的 outcome 与 Step/Task 状态按不变量一致。
- **AC-40**：计时结束后的操作屏幕阅读器可感知，无强制音效。

## 7. 功能 F06｜回顾、延期与重启

### 7.1 四种结果与转换

| Result enum | UI 文案 | Step 变化 | Task 变化 | 下一步 |
| --- | --- | --- | --- | --- |
| step_done | 第一小步完成了 | completed | 保持 active/inbox，非自动 done | 新建下一步/返回列表 |
| partial | 做了一部分 | attempted | 不变 | 保存现有 Step，再试/缩小 |
| not_started | 还是没能开始 | attempted | 不变 | “让第一步更小一些” |
| task_done | 整件任务已经完成 | completed | done（必须二次确认） | 返回列表 |

**避免自责**：不存在“失败天数”“错过天数”或连胜惩罚。用户可以不填写原因；不提供“没开始就不能退出”的阻碍。

**重复尝试**：当用户选择“缩小再试”，生成一个新的 Step revision 或新的 Step 与原 Step 关联，不覆盖已有 Session 的历史引用。

**恢复入口**：用户再次打开 S1 时，最近未完成的任务可提示“继续上次那一步”；不自动进入 running，不自动推送通知。

### 7.2 验收

- **AC-41**：不选择结果就关闭 S4 时，Session 保留 ended + outcomePending，重新打开可补填。
- **AC-42**：选择 step_done，Task 不自动变 done。
- **AC-43**：选择 task_done 需要用户明确二次确认。
- **AC-44**：partial/not_started 提供缩小或稍后继续；无羞辱文案。
- **AC-45**：同一 Session outcome 只能有一个当前值，修改后不生成重复 Session。
- **AC-46**：归档后仍能查看历史，恢复后可继续。
- **AC-47**：用户可以中止任务而非强迫“完成”；取消/删除有明确确认。
- **AC-48**：回顾结果只用于自愿分析且不收集自由文本。
- **AC-49**：离线结束并保存后刷新仍可查看 outcome。
- **AC-50**：旧 Step 的完成度不会被新 Step 改写。
- **AC-51**：异常关闭后恢复提示，不自动开始计时或自动标记完成。

## 8. 功能 F07｜数据可靠性、删除与导出

### 8.1 推荐逻辑数据模型

| Entity | 核心字段 | 约束 |
| --- | --- | --- |
| Task | id(UUID), title, note?, status, isDifficult?, blocker?, createdAt, updatedAt, version | status ∈ inbox/active/done/archived；标题必填；软删除可选 |
| Step | id, taskId, text, revision, source(template/manual), status, createdAt, confirmedAt | 不可变已确认正文；修改以 revision 或新 Step 表示 |
| Session | id, taskId, stepId, status, targetMs, confirmedActiveMs, estimatedDurationMs, startedAt, endedAt?, outcome?, outcomePending, version | ended 不可恢复为 running；Step/Task ID 必须存在 |
| Batch | id, taskIds[], createdAt, undoneAt? | 仅用于批量导入撤销 |
| Consent | installId, telemetryEnabled, consentVersion, consentedAt?, withdrawnAt? | 默认 telemetryEnabled=false |
| Meta | schemaVersion, migratedAt, lastSavedAt | 向前迁移必须可测试 |

**注意**：以上字段为逻辑 schema，不限定 TypeScript/数据库表实现，但必须保留引用完整性和唯一性。存储层可使用独立 object stores + transaction，重要写入动作将 Task/Step/Session 原子提交。

### 8.2 数据操作

- **保存**：每个突变先验证版本，事务提交成功后发 UI 成功提示；失败保留表单，不丢用户输入。
- **编辑**：对已确认 Step 采用新 revision，历史 Session 仍引用旧版本；Task 标题变更不影响历史 Session 关系。
- **撤销**：批量导入 1 次撤销可回滚该批所有新记录；删除重要数据前二次确认。
- **导出**：JSON 带 schemaVersion、exportedAt、Task/Step/Session 数组，UTF-8 文件；可由用户自行保管，不自动上传服务器。
- **导入备份**：不在 P0；P0 明确注明 JSON 文件可导出但不能通过 UI 自动恢复，这不是双向备份能力。
- **删除**：设置页“删除本设备全部数据”，确认后清空本地数据并撤回分析授权；若遥测已有服务端匿名事件，说明当前是否支持按 installId 请求删除，不得假装本地删除等于远端已删除。
- **数据驱逐**：浏览器清缓存、操作系统回收和私密模式都可能移除本地数据；首个保存后应有非惊吓式提醒，设置中持续可见。

### 8.3 验收

- **AC-52**：刷新后 Task、Step、Session、Consent 语义一致。
- **AC-53**：模拟多标签并发写入，冲突不得静默覆盖或重复创建会话。
- **AC-54**：模拟事务失败，不出现 Task 已更新但 Step/Session 未更新的半状态。
- **AC-55**：删除全部数据要求二次确认，取消不删任何数据。
- **AC-56**：导出的 JSON 可以通过标准 JSON parser 解析并通过 schema 校验。
- **AC-57**：导出文件不含遥测 installId 等非用户任务必要字段，除非明确需要；不得含 access token。
- **AC-58**：对用户显示“此设备本地存储，无跨设备同步、数据可能丢失”的明示文案。
- **AC-59**：500 条 Task/2,000 条 Session 的测试夹具下基本交互仍可用，不需一次渲染所有历史。
- **AC-60**：schemaVersion 旧数据升级成功且保留原 ID；升级失败进入只读/导出救援路径，不强制清库。
- **AC-61**：所有用户正文都经过转义，不因恶意任务文本触发脚本。
- **AC-62**：离线时可新增/编辑/完成当前任务和短会话（在应用资源已经加载的受支持环境）。
- **AC-63**：不暴露未保存 UI 为已保存的“假成功”状态。
- **AC-64**：删除后刷新不会恢复旧记录或重建旧任务。
- **AC-65**：导出任务结构完整，Task/Step/Session 引用无悬挂指针。
- **AC-66**：已结束会话修改结果不会改变真实开始时刻或累计时长。
- **AC-67**：浏览器存储不足等故障有明确“复制文本/导出已有数据”的救援路径。

## 9. 功能 F08｜自愿匿名实验遥测

### 9.1 同意机制

- 默认关闭；设置页独立选择“帮助改进产品：分享不含任务文字的匿名使用事件”。
- 明示收集字段（事件名、时间、耗时区间、卡点 enum、界面版本、随机 installId），用途与撤回方式；不使用易误解的“完全无法识别”绝对表述。
- 不上传 Task title/note、Step text、任何私人自由文本、通讯录、浏览器历史、地理位置、精确设备指纹。
- 未勾选时不得发送，即使错误报告模块也不能绕过同意，必要的技术服务日志应另列合法性与最小化策略。
- 撤回后停止后续上传，清空尚未发送的本地事件队列；明确告知既有数据的处理边界。
- 实验对照分组仅在用户主动参加研究时创建；退出实验不影响核心功能。

### 9.2 事件字典（示意）

| Event | 触发 | 允许属性 | 禁止项 |
| --- | --- | --- | --- |
| task_created | Task 事务成功提交 | channel=manual/batch, difficultFlag | title、note |
| focus_task_selected | 聚焦 Task 成功 | taskRandomId, existingTaskFlag | 任务全文 |
| blocker_selected | 选择卡点 | blocker enum | 原因自由文本 |
| blocker_skipped | 选择跳过 | sourcePage | 用户背景推断 |
| step_suggested | 展示可编辑候选 | templateId, templateVersion | 候选文本 |
| step_confirmed | 用户确认 Step | source, editedFlag | 最终 Step 文本 |
| session_started | Session 持久化成功 | durationBucket, sessionId, source | 任务正文 |
| session_paused | 用户主动暂停成功 | activeMsBucket | 自由文本 |
| session_resumed | 用户继续成功 | activeMsBucket | 设备其他 App 记录 |
| session_ended | Session 结束成功 | confirmedActiveMsBucket, estimatedTimeFlag | 隐含“完成任务”推断 |
| outcome_recorded | 回顾结果成功保存 | outcome enum, retryPlanFlag | 私人备注 |
| retry_started | 从未完成结果开始新尝试 | priorOutcome enum | 原始 Step 文本 |
| export_requested | 用户点击导出且成功 | exportEntityCountsBucket | JSON 正文 |
| local_data_deleted | 本地删除成功 | deletedBucket | 已删除内容 |
| telemetry_consent_changed | 同意/撤回操作 | enabledFlag, policyVersion | 任务内容 |

**计算逻辑**：所有事件需带 eventId 去重、schemaVersion 和客户端时间；服务端接收时间与本地时间都可保留以识别时钟异常。不要使用任务标题作为 ID 或事件去重键。分析中对 consent-only 样本设置明显标注。

### 9.3 验收

- **AC-68**：未同意情况下，捕获→开始→回顾全流程没有遥测请求。
- **AC-69**：用户主动同意后只发送白名单字段；使用构造的敏感字符串测试出站请求，结果不包含该字符串。
- **AC-70**：撤回同意后后续事件不再上传，待发队列清空。
- **AC-71**：断网时事件可丢弃或安全重试；不能阻断核心任务路径。
- **AC-72**：重复事件 eventId 服务端去重，不能因断网重发夸大启动次数。
- **AC-73**：旧 consentVersion 变更后要求重新告知，不默默扩展用途。
- **AC-74**：实验参与同意与常规遥测同意分开记录。
- **AC-75**：任务/步骤正文绝不出现在 URL、analytics、错误堆栈或浏览器控制台输出。
- **AC-76**：能关闭统计服务器仍完整使用本地核心功能。

## 10. 端到端验收情境（Gherkin 风格）

### E2E-01｜首次启动：困难邮件

**Given** 新用户无数据且未同意遥测  
**When** 输入“回复客户延期投诉”、选择“担心做错”、将建议编辑为“写一封不会发送的两句话草稿”、开始 2 分钟、结束选“做了一部分”  
**Then** 任务被保存、第一步可找回、Session 结束状态明确、母任务仍未完成、没有向遥测服务器发送正文或任何事件。

### E2E-02｜重复点击与刷新

**Given** 已有一个 ready Step  
**When** 连点 10 次开始、运行 30 秒后刷新页面、暂停再继续、手动结束  
**Then** 只有一个 sessionId、confirmedActiveMs 非负且不包含暂停时间、回顾可保存、重复事件不会抬高指标。

### E2E-03｜无法开始时缩小动作

**Given** 用户选择“准备演讲”、选“太大”  
**When** 短会话结束后选择“还是没能开始”、点击“缩小这一步”、确认“只写演讲标题”并再次开始  
**Then** 原 Session 保持 not_started，新 Step 与前一版本可追溯，新 Session 独立；界面无羞辱或欠账惩罚。

### E2E-04｜数据损坏与迁移

**Given** 本地存在老版 schema 数据和进行中 Session  
**When** 模拟迁移失败或存储配额错误  
**Then** 展示无法安全保存/迁移的信息和现有数据救援入口，禁止静默重建空数据库并宣称成功。

### E2E-05｜浏览器多标签

**Given** 标签 A 正在 running  
**When** 标签 B 进入同一设备并尝试开始另一任务  
**Then** 标签 B 提示已有会话，不能新增第二个 running；标签 A 结束后 B 可正常开始。

### E2E-06｜隐私撤回

**Given** 用户已授权匿名事件  
**When** 用户关闭同意并在本地删除数据  
**Then** 不再发送行为事件；显示服务端先前采集记录的实际处理政策；不会暗示已删除服务端所有历史事件。

## 11. 实验与分析口径

### 11.1 指标 SQL/分析规则的产品约束

- Eligible task：用户明确标记 difficulty flag（例如进入“很难开始”流程并确认），taskId 去重。
- Start event：Session 持久化成功；只有开始按钮不算 qualified。
- Qualified start：同一 Task 首个 Session 的 confirmedActiveMs ≥60,000，或用户显式记录 first Step completed；Task 创建后 24 小时窗口内。
- No start：进入分母但 24 小时内无合格启动，必须保留而不能剔除。
- Recovery：报告 not_started 或 partial 后 7 天内再次开始新 Session。
- 首次尝试 vs 复访：分别报告，避免复访者自选择扭曲。
- 无同意数据：不进入自动上传事件分析；以实验参与者的自愿日志/访谈作补充，明确非随机缺失。

### 11.2 对照实验最小方案

- **对照组**：同样的捕获页面和“直接开始 5 分钟”按钮；无卡点/建议步骤。
- **实验组**：卡点→可编辑步骤→短会话。
- 两组必须有相同持久化、提醒、数据保护与结尾回顾，避免混杂；以随机分组固定用户而非每次刷新分组。
- 主要终点：合格启动率；次要：到首次启动时间、主观阻力、负面压力反馈、实际重复使用。
- 试验前冻结假设、样本与观察窗、排除/退出标准、统计方法；小样本报告不确定区间，不用事后任意挑阈值“证明有效”。
- 因为任务内容高度隐私，研究招募采用自愿记录；不要要求用户提交工作邮件全文或私人任务文本。

## 12. QA 优先级与非功能测试矩阵

| QA 维度 | P0 样本测试 | 发布阻断条件 |
| --- | --- | --- |
| 状态一致性 | 高频开始/暂停/结束、重复点击、A/B 标签页竞争 | 两个 running Session、Session 指向不存在 Step |
| 持久化 | 刷新、断网、浏览器重启、quota 错误、旧 schema 迁移 | 静默丢失或 UI 显示虚假的已保存 |
| 隐私 | 抓取网络请求、检查错误日志、撤回授权与删除 | 用户正文外泄或未授权请求 |
| 安全 | XSS 任务标题、超长字符、恶意 JSON 导出/未来导入 | 注入、执行脚本、数据越权 |
| 可访问性 | 无鼠标键盘操作、200% 缩放、语义标签、焦点顺序 | 主路径无法操作、无法理解状态 |
| 时间正确性 | 时间回拨、系统睡眠、后台冻结、暂停恢复 | 负时长、到时自动误判完成 |
| 响应式 | 320/375/768/1440 宽度、触屏键盘弹起 | CTA 遮挡或无法触达 |
| 性能 | 500 Task / 2,000 Session 的构造数据 | 核心输入卡顿至无法操作 |
| 内容伦理 | 模板误建议、责备型微文案、医疗暗示 | 自动诊断、羞辱与强迫机制 |

**可用性观察表（每位访谈对象）**：任务类型、是否顺利确认第一步、是否理解 Step/Task 完成区别、能否暂停/恢复、主观阻力变化（自报量表）、困惑点、是否想再次使用；不要仅凭好评数量宣布有效。

## 13. 交付时的代码与设计包清单

- **Design**：S0～S5 mobile/desktop 框图、主/次 CTA、空/加载/保存失败/离线/恢复/删除确认状态、键盘与屏幕阅读器规范。
- **Frontend**：Task/Step/Session/Consent 类型与状态服务、路由/页面、计时器、IndexedDB adapter、导出、用户授权设置。
- **Test**：所有 AC 自动/手工覆盖、6 条 E2E、跨标签和旧 schema fixture、隐私网络检查。
- **Analytics（仅实验启用）**：事件 schema、白名单过滤、去重、预注册分组规则、分母查询和删除/撤回说明。
- **Docs**：面向用户的“本地存储风险”说明、隐私政策、如何导出、意见反馈路径、版本说明。
- **Release owner**：未指定；需在创建工程 Sprint 前分配负责人和每条 AC 的验收人。

## 14. Release Gate 与后续优先级

### P0 退出检查

- [ ] F01–F07 全部 AC-01 至 AC-67 已验证（无缺项）。
- [ ] F08 AC-68 至 AC-76 在启用遥测/实验时全部通过；若不启用遥测，证明完全没有事件请求。
- [ ] E2E-01～06 完成；无静默数据丢失、两个 running 会话或未授权文本外泄。
- [ ] 功能和营销内容都不宣称“已治疗拖延症/ADHD”，只承诺帮助尝试开始。
- [ ] 研究样本、指标和隐私说明可被外部审阅；未获取数据时只标记“待验证”。

### P1 触发条件

只有当 P0 的“起步动作”得到真实复用证据，才评估：AI 个性化建议（明确额外授权、失败回退）、JSON 备份导入、PWA 安装、低压力正计时实验。P2 才讨论 Todoist/TickTick API、日历自动安排、社交共工、商业化和跨设备账户。

---

**版本记录**：2026-11-09 v1.0 创建。  
**变更规则**：任何更改 Task/Step/Session 状态、事件语义或数据收集范围的需求，必须提交 PRD + 本文 + 端到端验收一起更新。  
**研究诚信**：本文是实施规格和测试计划，不是已通过的验收报告、真实用户测试或已上线功能声明。
