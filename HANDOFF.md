# Focus Physics 项目交接

交接日期：2026-10-10

## 1. 项目概览

Focus Physics 是一个面向 ADHD/注意力波动学生的 GCSE Physics 微步骤学习演示。当前版本使用一道固定的一维受力题，把完整解题过程拆成 5 个很短的步骤，并尽量降低视觉噪音、工作记忆负担和答错焦虑。

- 线上地址：https://focus-physics-demo.meixi-guo.chatgpt.site
- Sites Project ID：`appgprj_6ac8dfb9968c8191935ce885b1f97dc6`
- 当前线上访问模式：public，请保持现有受众设置，除非项目所有者明确要求修改。
- 本地项目目录：`/Users/guomeixi/Documents/Codex/2026-10-07/ban/work/sites/focus-physics`
- 当前已发布源码提交：发布后以 `git log -1 --format=%H` 和 Sites 最新版本为准。
- 技术栈：Cloudflare Worker ESM + 原生 HTML/CSS/JavaScript；构建脚本将前端嵌入 Worker artifact。

## 2. 主要文件

- `site/index.html`：页面结构、题干、侧栏、帮助弹窗和暂停弹窗。
- `site/styles.css`：全部视觉样式、响应式布局和动画降级设置。
- `site/app.js`：5 步题目数据、答题逻辑、Mistake Detective、Adaptive Hint Ladder、fallback、推理记录和本地保存。
- `worker/index.js`：页面资源路由与 `/api/hint`、`/api/understanding` 服务端接口；调用 Groq，但不把密钥暴露给浏览器。
- `scripts/build.mjs`：生成 `dist/server/index.js` Worker artifact。
- `.openai/hosting.json`：Sites 项目标识与静态目录配置。不要更换其中的 `project_id`。
- `focus-physics-site-v11.tar.gz`：上一次发布生成的本地打包产物，目前未被 Git 跟踪；不是源码，不要手工编辑。

## 3. 当前已经完成的体验

### 学习流程

选择 `Forces` 后会先进入双卡牌页面：

1. `Take the 5-step test`：进入原有结构化测试。
2. `Tell AI what you think`：无需进入新页面，直接输入对该 topic 的任意理解、半理解或疑问；AI 返回“已经理解的部分 / 需要澄清的部分”。

结构化测试本身仍为：预测方向 → 计算合力 → 选择 `Fnet = ma` → 计算加速度 → 检查 units、sign 和 magnitude。

### ADHD 友好设计

- 首屏是低饱和像素风 topic world 选择页；目前 `Forces` 是唯一完整可玩的 demo，其余主题明确标记为 next world，不伪装成已完成内容。
- 每屏只要求一个动作，并显示 `PREDICT / CHOOSE / CALCULATE / CHECK`。
- 长题干拆成 `GIVEN / FORCES / FIND`，数量、单位和 command words 分层高亮。
- 左侧 `Reasoning so far` 始终保留已经验证的推理步骤，刷新或中断后可恢复当前进度。
- `I’m stuck!` 是固定在右下角、低干扰的不规则黄色按钮；没有外轮廓线。
- 帮助分为：简化文字、帮我开始、找回推理链。
- 左侧标题与步骤之间固定显示一个 `PRINCIPLE`：`Fnet = ma`；整节课不再切换不同原则，也没有阶段导航条。
- Scratchpad 内容保存在浏览器本地。
- `Pause & save` 会显示当前步骤摘要。
- 顶部 `Reset lesson` 可随时回到 Step 1，只重置答题进度，不删除 Scratchpad；窄屏时三个顶部操作缩成可访问图标。
- 三个不同步骤答对后会永久解锁右侧 `Force Lab`。学生可实时调节推力、摩擦力与质量，观察合力、加速度大小和方向；同一步重复答对不会重复计数。
- 正确与错误反馈使用轻量 Gen Alpha 语气，例如 `Big W`、`caught in 4K`，但每条都紧跟准确物理解释，不能嘲笑学生。
- 页面支持移动端，并遵守 `prefers-reduced-motion`。

### 浏览器本地状态

- `focusPhysicsStep`：当前步骤编号。
- `focusPhysicsNotes`：Scratchpad 内容。
- `focusPhysicsCorrectSteps`：已答对过的不同步骤编号数组，用于计算 `0/3 → 3/3` 奖励进度。
- `focusPhysicsExperimentUnlocked`：Force Lab 是否已经永久解锁；`Reset lesson` 不会删除该奖励。

如果改变状态结构，请考虑旧值兼容或提供安全回退。

## 4. AI 提示接口

答错后，Mistake Detective 会把当前题目步骤、当前答案、尝试次数和已验证的 reasoning trail 发送到 `/api/hint`，判断可观察到的错误类型，例如 direction/sign、units、calculation 或 equation choice。`I’m stuck!` 使用同一接口提供三级 Adaptive Hint Ladder：Nudge → Scaffold → Worked example。Scratchpad、姓名、邮箱和 ADHD 信息不会发送。

建议只做一个可靠的核心能力：`misconception-aware hint`。

1. Worker 从 secret `GROQ_API_KEY` 读取密钥，并使用 `AI_BASE_URL`、`AI_MODEL` 调用兼容 Chat Completions 的服务。
2. 模型返回短 JSON：`mistakeType`、`label`、`hint`、`why`、`nextAction`。前两级提示不计算目标答案；第三级只演示一组不同数字的平行例题。
3. 后端验证字段与长度，设置 7 秒超时和轻量每-IP 限流。
4. API 失败时自动退回本地 Mistake Detective 分类和 `steps[currentStep].ladder`，保证评委仍能看到完整体验。

`/api/understanding` 只接收 `topic` 和用户在双卡牌页 textarea 中主动输入的 `thought`（最多 800 字符）。返回严格 JSON：`understood`、`clarify`。前端会分两段展示；请求失败时明确显示内置 backup，不假装 AI 已成功响应。该功能不会读取 Scratchpad、测试答案、身份信息或诊断信息。

开局页的其他 topic world 暂时只作未来方向展示。若来得及扩展，应优先增加一条完整的 Energy 或 Waves 路径；不要让 AI 即兴生成未经验证的物理答案。

## 5. 代码入口提示

- 题目内容、正确/错误文案和三级 fallback 位于 `site/app.js` 顶部的 `steps` 数组。
- 正确/错误判断位于 `check.addEventListener("click", ...)`。
- 页面切换与状态重置位于 `renderStep()` 和 `hideFeedback()`。
- `Reasoning so far` 由 `updateReasoningTrail()` 生成。
- 开局页结构在 `site/index.html` 的 `#topicGate`；双卡牌页是 `#modeGate`。`site/app.js` 的 `setView()` 在 topics、choose-mode、lesson 三种视图之间切换。
- 现有三栏布局位于 `.app-shell`；在 `1120px`、`780px` 和 `520px` 媒体查询中同步检查。

## 6. 本地运行与检查

本项目不需要安装依赖。

```bash
cd /Users/guomeixi/Documents/Codex/2026-10-07/ban/work/sites/focus-physics
node scripts/build.mjs
node scripts/preview.mjs
```

浏览器打开：`http://127.0.0.1:4173/`

JavaScript 与差异检查：

```bash
node scripts/build.mjs
node --check site/app.js
node --check worker/index.js
node scripts/validate-artifact.mjs
git diff --check
git status --short
```

测试时至少覆盖：

- 5 个学习步骤全部可以继续前进并重新开始。
- 前三个不同步骤答对后只触发一次解锁弹窗；刷新和 Reset 后 Force Lab 仍可打开；滑杆可正确更新 `Fnet`、`a` 和方向。
- 从 Forces 进入双卡牌页；左卡进入原测试；右卡可在原地输入文字并展示 AI 或 fallback 的三段反馈；浏览器后退能正确返回。
- `I’m stuck!`、Scratchpad、Pause & save 和 Reasoning so far 没有被破坏。
- 典型错误会显示 Mistake Detective；连续求助会显示 Hint 1/3、2/3、3/3，答错后第一次求助会自动提升到合适层级。
- 桌面、窄屏和 `prefers-reduced-motion`。
- 键盘可操作、焦点可见、反应文字可被屏幕阅读器读到。

## 7. 发布说明

该站点通过 OpenAI Sites 发布。修改完成后应：

1. 保持 `.openai/hosting.json` 的项目 ID 不变。
2. 使用对应账号获取该 Sites 项目的源码写入凭据。
3. 将本地源码推送并打包成包含 `.openai/hosting.json` 与 `dist/` 的部署 archive。
4. 使用当前完整 commit SHA 保存新版本，并保持 public 受众部署。
5. 部署成功后打开线上地址检查。不要在文档或 Git 中保存任何临时凭据。

如果接手者没有 Sites 发布权限，可以先完成本地修改和测试，再由项目所有者执行最终发布。

## 8. 设计底线

- 不要因答错而羞辱学生；错误反应可以顽皮，但必须同时给出清楚的下一步。
- 不要删掉目前已有的单位、sign/magnitude 检查、推理记录和左侧固定原则卡。
- 页面目前是英文 UI；新增伙伴文案也应保持英文，除非项目所有者决定整体本地化。
