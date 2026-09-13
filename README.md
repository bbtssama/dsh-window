# dsh-window

A floating Markdown note card for the **DeepSeek Harness (DSH)** web GUI — built so that a
human and an agent can write in the same note without either of them paying for the whole
document. You highlight what matters, you may add a remark to any highlight, and the agent
reads exactly that: the quoted text, where it is, and your own words about it.

DSH Web GUI 的**悬浮 Markdown 笔记卡片**：会话隔离的多笔记空间、Typora 级渲染、长按划选并持久化高亮、
给任意高亮写备注，并通过 23 个 `note_*` 工具把这些原样交给模型。每份笔记是一个独立的 git 仓库。

```text
工作区/dsh-window/note/<会话 id>/<笔记名>/
    note.md              笔记正文（纯文本 UTF-8、LF）
    .note-state.json      选中对象（含颜色、备注、是否已取用）
    .note-view.json       上次读到的行（已 gitignore，不进历史）
    .git                  只跟踪这个目录的独立仓库
工作区/dsh-window/note/<会话 id>/.session.json    { 当前笔记, 是否显式唤起 }
```

---

## 为什么做成这样

把笔记丢给模型最容易踩的坑是**上下文成本**：把整份笔记塞进对话，模型才有上下文，但很快就撑爆了。
dsh-window 的取舍是反过来的 —— **只有你划过的部分才会被送进上下文**：

- 你划一段 → 存成一条「选中对象」（`{id, 行/列, 原文, 颜色, 备注, 是否已取用}`）；
- 模型用 `note_take_new_selections` 只取**你新划的部分**，用 `note_read({fromLine, toLine})` 只读需要的窗口，而不是整篇；
- 你写的**备注**和选中文本一起交给模型 —— 这是唯一携带"你自己的话"的字段，比任何颜色编码都准确；
- 反过来，模型用 `note_write` / `note_patch` 写讲解，你就在旁边读，**不需要来回粘贴**。

颜色即意图，且会原样出现在模型收到的文本里：
🟡 黄 = 重点 · 🌸 粉 = 有疑问（要展开）· 🟢 绿 = 已确认/已处理 · ⬛ 黑 = 遮盖（这段不要引用也不要复述）。

---

## 特性

**笔记空间**
- **按会话隔离**：`<会话 id>` 就是路径的一段，天然互不干扰，没有任何"归属"逻辑需要抢。
- **一个会话多份笔记**：卡片顶部切换、新建、导入（粘贴 / 拖文件 / 选文件）、重命名、清空正文（保留 git）、删除整份（连同它的 git）。
- **阅读位置记忆**：每份笔记记住你读到的行，切换笔记或下次打开直接回到原位；外部编辑在它上方插入/删除行也不会丢（按保存时的行文本重新锚定）。

**划选与备注**
- 长按正文约 0.4 秒进入划选，两个圆形把手定范围；操作条**懒显示**（不是一按就弹）。
- 高亮画在**独立覆盖层**里，不拆分文本节点 —— 所以划选不会让字距、断行发生位移。
- **长按 [选中]** 弹出输入框，给这段写备注；短按仍是直接选中。备注会随选中对象一起交给模型。
- 选中面板里可以逐条改备注、改颜色、删除；原文被改动时自动重新锚定，找不到才标记 `stale`。

**渲染**
- 标题/列表/引用/表格（横向滑动卡）/任务框/分隔线/图片；
- 代码块按语言做行内高亮；**Mermaid**（`graph`/`flowchart` 支持最好，其余降级为源码卡片，不报错）；
- 行内 HTML 白名单（`b/i/em/u/s/del/mark/kbd/sub/sup/code/span/a/...`）；
- 在线图片，以及工作区相对路径图片（由 host 读成 data URL）。

**窗体**
- 停靠（正文自动让位）/ 浮动，宽度三档（430 / 620 / 900），折叠成右下角小药丸（带选中数量角标）。
- 只有**当前会话有笔记**，或用 `/window-note start` 显式唤起时，卡片才存在 —— 没笔记的会话不会多出一个空面板。

**手机端**
- 窄屏自动整屏布局；正文 `touch-action: pan-y`，**竖着拖是滚动、不会误扩选**，横向拖才扩选；
- 把手 44×44、操作条按钮与备注框按钮 ≥44px（Apple 的最小舒适触达尺寸）；
- 备注输入框 16px 字号 —— 避免 iOS 聚焦时把页面放大。

---

## 安装

```sh
dsh plugin --profile <profile> add dsh-window
```

然后**重启 DSH**：profile 的组合只在启动时读取，浏览器端的半边由 shell 自动投递。

- 要求 Node.js ≥ 20，且 profile 的依赖树能解析 `@deepseek-ai/dsh-tools`（挂了 `dsh-base` 的 profile 都满足）。
- 安装后请确认装出来的是一份**真实目录**而不是符号链接：Node 按 realpath 解析，指向 profile `node_modules` 之外的链接会解析不到 `@deepseek-ai/dsh-tools`。

---

## 快速上手

1. 打开卡片：`/window-note`（本会话没有笔记时会顺手建一份默认笔记）；
   只想先要个按钮、不想建笔记：`/window-note start`；收起：`/window-note stop`。
   其他子命令：`list` / `new <名字>` / `open <名字>`。
2. 划重点：**长按**正文 → 拖两个圆点 → **[选中]**。
   想加一句话说明：**长按 [选中]**，在输入框里写完再点 [选中并保存]。
3. 让模型讲：直接说「把刚才划的这段讲清楚，写进笔记」——它会用 `note_take_new_selections` 只拿你新划的部分，
   用 `note_write`/`note_patch` 写到对应位置，而不是把整篇读一遍。

---

## 模型工具（23 个）

**读取（低上下文成本）**

| 工具 | 用途 |
| --- | --- |
| `note_read` | 读正文，支持 `fromLine/toLine/padding` 只读窗口，也可按 `note` 名字读别的笔记而不动卡片 |
| `note_find` | 在笔记里搜子串，返回行号列号与上下文片段 |
| `note_get_selections` | 取全部选中对象（含颜色、备注、是否已取用、是否 stale） |
| `note_take_new_selections` | 只取**用户新划**的部分（默认取完即标记已取用） |
| `note_list` / `note_diag` / `note_export` | 列出本会话的笔记 / 诊断落盘与 git 状态 / 导出正文到文件 |

**写入**

| 工具 | 用途 |
| --- | --- |
| `note_write` | 整篇覆盖 / 追加 / 前插 |
| `note_patch` | 按 `startLine/startCol → endLine/endCol` 精确替换一段（首选，省上下文） |
| `note_patch_many` | 一次改多处 |
| `note_commit` / `note_checkpoint` | 提交到该笔记的 git（检查点用于长任务回溯） |

**选区与笔记管理**

| 工具 | 用途 |
| --- | --- |
| `note_add_selection` | 由 agent 新建划线（可带 `remark`），例如标注"这段要跟进" |
| `note_remove_selection` / `note_clear_selections` / `note_set_color` | 删除 / 清空 / 改颜色（绿=已处理，黑=遮盖） |
| `note_set_remark` | 写或清除某条划线的备注（用户长按 [选中] 写的就是这个字段） |
| `note_create` / `note_open` / `note_rename` / `note_clear` / `note_delete` / `note_import` | 新建（可来自文件/内容）/ 切换 / 重命名 / 清空正文（保留历史）/ 删除整份（含 git）/ 导入追加 |

给模型的那份文本里，每条选中对象长这样（`【备注】`就是用户自己写的话）：

```text
#2 [sel-6] 粉 第318行:13 → 第327行:51 （新选中）
  【备注】这里我总记混，面试被问到要提一下
    ```indexOfPos/posOfIndex` 已具备，改动很小。…
```

---

## 数据放在哪

| 内容 | 位置 |
| --- | --- |
| 笔记正文 | `<工作区>/dsh-window/note/<会话 id>/<笔记名>/note.md` |
| 选中对象（含备注） | 同目录 `.note-state.json`；损坏时先另存 `.note-state.bad.json` |
| 阅读位置 | 同目录 `.note-view.json`（自动写进该笔记的 `.gitignore`，不会变成提交） |
| 笔记历史 | 同目录 `.git`（**独立仓库**，只跟踪这个笔记目录） |
| 会话状态 | `<会话 id>/.session.json`：`{ 当前打开的笔记, 是否被 /window-note start 唤起 }` |
| 卡片布局 / 画笔颜色 | 浏览器 `localStorage`（`dsh-note-card:layout:v1`、`dsh-window:pen`） |
| 阅读位置的浏览器镜像 | `dsh-note-card:view:v1`（仅在 host 没给出位置时使用，见下） |

---

## 设计要点

**两半结构**：host 半边跑在 DSH 进程里（工具、HTTP 路由、文件与 git）；client 半边是浏览器里的 React 卡片，
经 `/plugins/dsh-window/rpc` 与 host 通话。`src/dynamic-host.js` 与 `src/dynamic-client.js` 是最初作为
**动态 Cordis 插件**写的两半源码，`build.mjs` 把它们机械地映射成永久 bundle：

| 动态插件 | 永久 bundle |
| --- | --- |
| `harness.defineTool` | `defineTool` from `@deepseek-ai/dsh-tools` + `ctx.tools.register` |
| `harness.handle(name, fn)` | 单端点 HTTP 路由 `/plugins/dsh-window/rpc` |
| `host.call(m, a)`（客户端） | 同源 `fetch` POST（调用点零改动） |
| `styles.insert(CSS)` | 自持 `<style data-plugin-css>`，随 fiber 销毁 |
| 环境里的 `React` | `window.__ModuleLoader__.load({factory})` + `require('react')` |

**为什么高亮不在正文里**：覆盖层如果是滚动容器的子节点，**每次 pointermove 插入 div 都会让整篇笔记重新布局**。
实测（1532 行笔记、4× CPU 限速、40 次插入+强制布局）：插进滚动容器 **4266ms（107ms/次）**，
插进旁边的兄弟层 **12.5ms（0.3ms/次）** —— 350 倍。所以高亮、把手、放大镜、操作条都住在正文旁边的两个层里
（彩色层在文字**下面**、遮盖与把手在**上面**），层内用一个零尺寸盒子按滚动偏移平移，
于是所有覆盖层仍然使用**内容坐标**，坐标数学一行都不用改。

**几何缓存**：行条带与字符盒都按"几何版本 + 宽度 + 模式"缓存，指针→列号是纯 JS 二分，
只有可见窗口内的行才去测量（`Range` 逐字符测量很贵）。正文滚动单独触发一次廉价重渲染 ——
条带和字符盒都在内容坐标系里，滚动不改任何测量值，只改"哪些行值得画"。

**两个存储，一条优先级规则**：阅读位置以笔记目录里的 `.note-view.json` 为准（手机与桌面共享同一份），
浏览器里再留一份镜像，只在 host 没有给出位置时使用。

**每份笔记一个 git 仓库**：`git init` 的 workdir 就是笔记目录，所以笔记的版本历史与工作区代码历史互不干扰；
清空正文保留历史，删除整份才连历史一起删。

**写入是有守卫的**：笔记正文与选中记录的写入都带版本校验（读到之后文件被别人改过就拒绝写入并提示重载），
避免两个标签页互相覆盖；阅读位置是"最后写者赢"，刻意**不带**守卫，也刻意**不共享**那个状态文件。

---

## 测试

```sh
node src/build.mjs          # src/ -> lib/（host + client 两半）
node src/install.mjs        # 安装到当前 profile 并注册 bundle 行
node src/selftest.mjs       # 契约自测：工具注册、路由、晚绑定、样式注入、slot、启动路径
node src/verify-notes.mjs   # 笔记模型：多笔记、会话隔离、选中、备注、阅读位置、命令、全量工具/RPC 覆盖
node src/verify-durability.mjs  # 持久化：版本守卫、损坏备份、原子写入
node src/verify-reanchor.mjs    # 重新锚定：外部编辑后选中对象如何跟随
```

> ⚠️ `selftest` 与 `verify-*` **默认测的是已安装的那份**。改了 `src/` 之后先 `node src/build.mjs && node src/install.mjs`，否则你会对着旧代码得到绿灯。

这些套件里有几处**故意设的绊线**（数字对不上就直接失败）：工具数、RPC handler 数、`enterFromTool`
守卫数、以及"shipped 代码里不得出现退役标识符"。它们不是形式主义 —— 每一条都对应一次真实事故：

- **`defineTool` 会编译 schema**：属性级 `required: true` 被搬进顶层 `required: [...]` 数组，运行时校验的是那个数组。
  只读属性级标记的检查器会把每个字段都当可选 —— `note_create` / `note_clear` 就是这样带着"成功返回缺字段"的问题出厂的
  （真实 harness 拒收，而笔记其实建好了）。现在校验器两种形式都认，并且**每个注册的工具都至少被成功调用一次**。
- **RPC handler 少写一个形参就是"点了没反应"**：`clearSelections` 曾经是唯一一个写成 `async function ()`
  却用 `args` 的 handler，每次调用都抛错；而客户端只认 `ok:true`、又没有 `.catch`，于是按钮既不生效也不报错
  （rejection 会被 shell 抛出来，必须两边都挂错误分支）。现在 17 个 handler 全部被调用并断言 `ok:true`。

---

## 已知限制

- 代码高亮是**行内**的（不跟踪跨行字符串/注释）。
- Mermaid 之外的图种走内置渲染器时只支持 `graph`/`flowchart`，其余降级为源码卡片（不报错）。
- 工作区相对路径图片首次读取有延迟（host 读字节 → base64）。
- 停靠让步用的是会话区的 `padding-right`；若同时装 AgentTeams 面板，两者会互相覆盖而不是叠加。
- 手机端次要按钮（卡片头部 33px、笔记行 35px）小于 44px 的理想触达尺寸 —— 这是窄屏下的密度取舍，
  主要手势（把手、操作条、备注框、药丸）都在 44px 以上。
- 阅读位置的**磁盘**那份由 host 保存；host 半边的版本更新后需要重启 DSH 才会启用（旧版会把位置只留在浏览器镜像里）。

---

## 许可

MIT。第三方：**Mermaid**（MIT, © 2014-2022 Knut Sveidqvist）作为运行时依赖引入但**按需懒加载**，
缺失或渲染失败时自动回退到内置渲染器；本仓库不分发它的构建产物。
