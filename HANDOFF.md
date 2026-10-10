# Focus Physics 项目交接

交接日期：2026-10-10

## 1. 项目概览

Focus Physics 是一个面向 ADHD/注意力波动学生的 GCSE Physics 微步骤学习演示。当前版本使用一道固定的一维受力题，把完整解题过程拆成 5 个很短的步骤，并尽量降低视觉噪音、工作记忆负担和答错焦虑。

- 线上地址：https://focus-physics-demo.meixi-guo.chatgpt.site
- Sites Project ID：`appgprj_6ac8dfb9968c8191935ce885b1f97dc6`
- 当前线上访问模式：public，请保持现有受众设置，除非项目所有者明确要求修改。
- 本地项目目录：`/Users/guomeixi/Documents/Codex/2026-10-07/ban/work/sites/focus-physics`
- 当前已发布源码提交：发布后以 `git log -1 --format=%H` 和 Sites 最新版本为准。
- 技术栈：无构建步骤的静态 HTML/CSS/JavaScript。

## 2. 主要文件

- `dist/index.html`：页面结构、题干、侧栏、帮助弹窗和暂停弹窗。
- `dist/styles.css`：全部视觉样式、响应式布局和动画降级设置。
- `dist/app.js`：5 步题目数据、答题逻辑、反馈、推理记录、帮助菜单和本地保存。
- `.openai/hosting.json`：Sites 项目标识与静态目录配置。不要更换其中的 `project_id`。
- `focus-physics-site-v11.tar.gz`：上一次发布生成的本地打包产物，目前未被 Git 跟踪；不是源码，不要手工编辑。

## 3. 当前已经完成的体验

### 学习流程

1. 计算前预测加速度方向。
2. 计算合力，输入框固定显示单位 `N`。
3. 选择相关物理定律 `Fnet = ma`。
4. 计算加速度，输入框固定显示单位 `m/s²`。
5. 同时检查 units、sign 和 magnitude。

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
- 正确与错误反馈使用轻量 Gen Alpha 语气，例如 `Big W`、`caught in 4K`，但每条都紧跟准确物理解释，不能嘲笑学生。
- 页面支持移动端，并遵守 `prefers-reduced-motion`。

### 即时奖励伙伴

- 首次进入完整课时前选择 Einstein、Cat 或 Dog；选择保存在 `focusPhysicsCompanion`。
- Einstein：正确时眨眼、错误时吐舌头；Cat 和 Dog 使用互换的 meow/woof 反应。
- 伙伴位于右栏 Scratchpad 上方，并保留 `Change buddy`。
- 默认不自动播放声音；奖励通过短动画、气泡文字和 `aria-live` 提供。

### 浏览器本地状态

- `focusPhysicsStep`：当前步骤编号。
- `focusPhysicsNotes`：Scratchpad 内容。
- `focusPhysicsCompanion`：当前伙伴。

如果改变状态结构，请考虑旧值兼容或提供安全回退。

## 4. 下一优先级：真正接入 AI

比赛要求 AI 在产品中执行有用工作；编码时使用 AI 工具本身不算产品功能。当前静态 demo 尚未调用模型 API。

建议只做一个可靠的核心能力：`misconception-aware hint`。

1. 浏览器把 topic、题干、当前步骤、学生答案、已经验证的 reasoning trail 和所选帮助类型发送到 `/api/hint`。
2. 服务端 Worker 从环境变量读取 API key，再调用模型；绝对不要把 key 写进 `dist/app.js`。
3. 模型返回短 JSON：`hint`、`why`、`next_action`。第一次提示不直接给最终答案；保持物理准确、非羞辱、每次只给一个动作。
4. 后端验证字段、长度和允许的步骤，并设置超时/速率限制。
5. API 失败时退回现有静态 `steps[currentStep].help`，保证评委仍能完整操作。

开局页的其他 topic world 暂时只作未来方向展示。若来得及扩展，应优先增加一条完整的 Energy 或 Waves 路径；不要让 AI 即兴生成未经验证的物理答案。

## 5. 代码入口提示

- 题目内容和所有正确/错误文案位于 `dist/app.js` 顶部的 `steps` 数组。
- 正确/错误判断位于 `check.addEventListener("click", ...)`。
- 页面切换与状态重置位于 `renderStep()` 和 `hideFeedback()`。
- `Reasoning so far` 由 `updateReasoningTrail()` 生成。
- 开局页结构在 `dist/index.html` 的 `#topicGate`；显示/隐藏逻辑位于 `setTopicGate()`。
- 现有三栏布局位于 `.app-shell`；在 `1120px`、`780px` 和 `520px` 媒体查询中同步检查。

## 6. 本地运行与检查

本项目不需要安装依赖。

```bash
cd /Users/guomeixi/Documents/Codex/2026-10-07/ban/work/sites/focus-physics
python3 -m http.server 4173 --directory dist
```

浏览器打开：`http://127.0.0.1:4173/`

JavaScript 与差异检查：

```bash
node --check dist/app.js
git diff --check
git status --short
```

测试时至少覆盖：

- 三个伙伴的首次选择和再次更换。
- 每个伙伴的正确与错误反应。
- 选择刷新后仍保留。
- 5 个学习步骤全部可以继续前进并重新开始。
- `I’m stuck!`、Scratchpad、Pause & save 和 Reasoning so far 没有被破坏。
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

- 伙伴奖励要快、短、轻，不要用高饱和闪烁、粒子雨、连续音效或长动画。
- 不要因答错而羞辱学生；错误反应可以顽皮，但必须同时给出清楚的下一步。
- 不要让奖励卡遮挡题目、反馈、单位或帮助入口。
- 不要删掉目前已有的单位、sign/magnitude 检查、推理记录和左侧固定原则卡。
- 页面目前是英文 UI；新增伙伴文案也应保持英文，除非项目所有者决定整体本地化。
