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
- **一个会话多份笔记**：卡片顶部切换、新建、**从文件夹导入**、导入（粘贴 / 拖文件 / 选文件）、重命名、清空正文（保留 git）、删除整份（连同它的 git）。
- **素材镜像**：从文件夹导入时，**整个目录**被镜像到 `note/_assets/<素材根>/`（保留原相对结构，排除 `.git`/`node_modules` 等），同一目录里的多个 `.md` **共享同一份镜像**（不重复复制）；`![](./img/a.png)` 这类相对引用直接可用。素材渲染**只读 `note/` 之内**，越界路径一律拒绝。
- **镜像里不会装着镜像**：被导入的文件夹里本身就带一个笔记空间时（它内部含一个工作区，或它自己那份 `dsh-window`），那层 `<…>/note/_assets` 在**复制时**就被排除，已经躺在镜像里的也会被清掉（超长路径用 `\\?\` 删除）。实测：某真实镜像因此从 3542 文件 / 74.08 MB 降到 1169 文件 / 24.29 MB，而**源目录一个字节没动**。
- **路径打错会告诉你想选哪个**：目录不存在时不甩一句干巴巴的 ENOENT，而是把**最近的存在祖先**下的目录列出来，名字以你输入内容开头的排最前（`linux学习` → 「你是不是想要 linux学习一站式笔记」）。这条兜底很实用：DSH 自带的选择器只要碰到码位低字节为 `0x00` 的汉字（`一`、`最`、`开`、`刀` 等 82 个）就会把路径**截断**在那个字上。
- **跟着链接走**：点击正文里的**本地** `.md` 链接（例如 `[详解](知识库/Spring-IoC与Bean详解.md)`）会把它**打开成一份笔记**并共享同一个素材根 —— 于是那篇文档自己的图片、以及它指向邻居的相对链接都照常工作；再点一次就是切回那份笔记。在线链接不受影响。
- **与来源同步**：`与来源文件夹重新同步`（或 `note_sync`）会**增量**再镜像一次（只复制有变化的文件，Windows 走 robocopy `/XO`）；来源 `.md` 变过就取回新正文（标记自动重新锚定、阅读位置按那一行的文本找回），并报告「引用 N 处 · 命中 X · 缺失 Y」—— 哪张图没了会直接说出来。
- **阅读位置记忆**：每份笔记记住你读到的行，切换笔记、折叠后再展开、下次打开都回到原位；外部编辑在它上方插入/删除行也不会丢（按保存时的行文本重新锚定）。**从磁盘重载同样保持你正在读的那一行**。

**标记与备注**
- 长按正文约 0.4 秒进入标记，两个圆形把手定范围；操作条**懒显示**（不是一按就弹）。
- 三种标记手段**互相独立、可以叠加**：**底色**（黄/粉/绿/黑/**无色**）、**斜体**、**下划线** —— 同一段文字可以既是绿底又是斜体还带下划线，而且**在创建标记时就能一起选**（操作条上有独立的底色盘与 I/U 开关），事后再改也行。
- 底色画在**独立覆盖层**里，不拆分文本节点；斜体/下划线按字符区间切开文本 span，二者都不会让字距、断行发生位移。
- **单击一段标记文字**弹出功能卡：底色 / 斜体 / 下划线（各自可开可关）/ 复制 / 备注 / 添加到 / 删除 / 取消。弹出层固定在卡片内、**永不压住底栏**。
- **标记列表**是卡内面板，也可**拖动标题栏**成独立小窗（一次手势即拖出并继续拖，可缩放、位置与尺寸记住），这样长列表不再挤占笔记的正文高度。
- 列表视图：**本笔记** / **本会话**（所有笔记的所有标记，点击跨笔记跳转）/ **任意多个自定义列表** —— 顶栏那颗按钮就是视图入口（点开切视图、新建/删除自定义列表、刷新）；行里的「添加到」把这条标记收进某个列表（或当场新建一个），在自定义列表里同一位置变成「移出」。每行最左侧的竖条同时显示**底色 + 斜体 I + 下划线 U**。列表面板自带 **✕** 关闭按钮；列表的**滚动位置会记住**，关闭再打开、刷新页面都回到原处。
- 顶栏「点标记→列表」开关（**默认关**，插件级持久化）：开启后，单击标记文字会**自动呼出**悬浮标记列表并定位到该条；关闭时若列表已经打开，单击标记文字**仍然会定位**。
- **agent 能操纵这套界面**：`note_ui` 可以打开/关闭列表、切视图、拖出/收回、改开关、把列表定位到某条标记；`note_panel` 能唤起/收起、折叠/展开卡片、切宽度。命令走 host 队列、卡片执行后按 id 回执，不会重复执行。
- **长按 [标记]** 弹出输入框给这段写备注；短按仍是直接标记。备注会随标记一起交给模型。

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

## 模型工具（30 个）

**读取（低上下文成本）**

| 工具 | 用途 |
| --- | --- |
| `note_read` | 读正文，支持 `fromLine/toLine/padding` 只读窗口，也可按 `note` 名字读别的笔记而不动卡片 |
| `note_find` | 在笔记里搜子串，返回行号列号与上下文片段 |
| `note_get_selections` | 取全部标记对象（含颜色、样式、备注、是否已取用、是否 stale） |
| `note_take_new_selections` | 只取**用户新标**的部分（默认取完即标记已取用） |
| `note_list` / `note_diag` / `note_export` | 列出本会话的笔记 / 诊断落盘与 git 状态 / 导出正文到文件 |

**写入**

| 工具 | 用途 |
| --- | --- |
| `note_write` | 整篇覆盖 / 追加 / 前插 |
| `note_patch` | 按 `startLine/startCol → endLine/endCol` 精确替换一段（首选，省上下文） |
| `note_patch_many` | 一次改多处 |
| `note_commit` / `note_checkpoint` | 提交到该笔记的 git（检查点用于长任务回溯） |

**标记与笔记管理**

| 工具 | 用途 |
| --- | --- |
| `note_add_selection` | 由 agent 新建标记（可带 `color`、`italic`、`underline`、`remark`），三种手段可以一起给 |
| `note_remove_selection` / `note_clear_selections` / `note_set_color` | 删除 / 清空 / 改颜色（绿=已处理，黑=遮盖，none=不铺底） |
| `note_set_style` | 独立开关斜体 / 下划线（`italic`、`underline` 各给各的；也给得了旧的 `style: highlight/italic/underline/both`） |
| `note_set_remark` | 写或清除某条标记的备注（用户长按 [标记] 写的就是这个字段） |
| `note_import_folder` | 把一个**文件夹整目录镜像**进 `note/_assets/`，并为选中的每个 `.md` 各建一份笔记（同一目录共享一份镜像，不重复复制） |
| `note_assets` | 看当前笔记的素材根、来源目录、镜像的文件数/字节数，以及本会话的所有素材根 |
| `note_lists` | 自定义标记列表：`list`（看全部）/ `create` / `rename` / `delete` / `add` / `remove`，能把任意笔记里的任意标记收进一个命名列表 |
| `note_ui` | 操纵卡片的标记列表界面：`open` / `close` / `tab` / `float` / `dock` / `summon` / `focus`（定位到某条标记）/ `refresh` |
| `note_goto` / `note_panel` | 跳到某行**或某条标记**（`markId`）；唤起/收起/折叠/展开卡片、切宽度档位 |
| `note_create` / `note_open` / `note_rename` / `note_clear` / `note_delete` / `note_import` | 新建（可来自文件/内容）/ 切换 / 重命名 / 清空正文（保留历史）/ 删除整份（含 git）/ 导入追加 |

给模型的那份文本里，每条标记对象长这样（`【备注】`就是用户自己写的话，斜体/下划线会标注出来）：

```text
#2 [sel-6] 粉·斜体 第318行:13 → 第327行:51 （新标记）
  【备注】这里我总记混，面试被问到要提一下
    ```indexOfPos/posOfIndex` 已具备，改动很小。…
```

---

## 数据放在哪

| 内容 | 位置 |
| --- | --- |
| 笔记正文 | `<工作区>/dsh-window/note/<会话 id>/<笔记名>/note.md` |
| 标记对象（含颜色/样式/备注） | 同目录 `.note-state.json`；损坏时先另存 `.note-state.bad.json` |
| 阅读位置 | 同目录 `.note-view.json`（自动写进该笔记的 `.gitignore`，不会变成提交） |
| 笔记历史 | 同目录 `.git`（**独立仓库**，只跟踪这个笔记目录） |
| 会话状态 | `<会话 id>/.session.json`：`{ 当前打开的笔记, 是否被 /window-note start 唤起 }` |
| 卡片布局 / 画笔颜色 | 浏览器 `localStorage`（`dsh-note-card:layout:v1`、`dsh-window:pen`） |
| 标记列表偏好（点标记呼出开关 / 独立小窗位置 / 列表滚动位置） | `localStorage` 的 `dsh-window:marks:v1`（**插件级**，所有会话共用） |
| 自定义标记列表 | 会话状态文件里的 `lists`：`<会话 id>/.session.json`（每个列表是 `{name, items:[{note, markId}]}`） |
| 阅读位置的浏览器镜像 | `dsh-note-card:view:v1`（仅在 host 没给出位置时使用，见下） |

---

## 细粒度刷新通知

卡片不需要等定时轮询去"猜"哪里变了。**每一个会改数据的工具/RPC 都会追加一条带主题的事件**，卡片在下一次轮询里读到它，并且**只刷新那一条主题对应的部分**：

| 主题 | 由谁产生 | 卡片刷新什么 |
| --- | --- | --- |
| `text` | `note_write` `note_patch` `note_patch_many` `note_import` `note_clear` `note_open`（以及卡片自己的编辑落盘） | 正文（阅读位置保持不变） |
| `marks` | 任何改标记的调用（`addSelection` / `note_set_color` / `note_set_style` / `note_set_remark` / 删除 / 清空 / 取用） | 标记底色与斜体下划线、标记列表行 |
| `notes` | 新建 / 重命名 / 删除 / 切换笔记 | 笔记选择器 |
| `lists` | `note_lists` 与卡片上的「添加到 / 移出 / 新建 / 删除」 | 自定义列表与视图入口 |
| `view` | `note_goto`（以及任何带 `jump` 的阅读位置请求） | 卡片真的滚到那一行（按行文本重新锚定） |
| `git` | `note_commit` / `note_checkpoint` | 底栏的 commit 号 |
| `ui` | `note_ui` / `note_panel` 的命令 | 执行那条界面命令（按 id 回执，不重复执行） |

事件**搭在已有的 state 轮询上**返回（不新开通道），并且**不会被 `unchanged` 短路**：只有当"两个 revision 都没变**且**没有新事件"时，host 才回那个最省流量的答复。
卡片可见且有焦点时轮询间隔 **0.7s**，切到后台 2.6s，所以 agent 的一次 `note_patch` 几乎是立刻出现在眼前。

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
  （rejection 会被 shell 抛出来，必须两边都挂错误分支）。现在 19 个 handler 全部被调用并断言 `ok:true`。
- **一个 UTF-8 BOM 能让整个 dsh 起不来**：dsh 组合 profile 时会 `JSON.parse` 每个 bundle 的 `package.json`，
  而 `JSON.parse` 拒绝 BOM —— `dsh web` 直接死在 `SyntaxError: Unexpected token '﻿'`，整个 harness 都进不去。
  真实事故来源是 PowerShell 5.1 的 `Set-Content -Encoding utf8` 写版本号。现在三处独立把关：
  `build.mjs` 见到 BOM 直接抛、`install.mjs` 在装出去前剥掉并打印、`selftest` 检查**仓库与已安装两份**的全部产物
  （`package.json` / `cordis.patch.yml` / `README.md` / `lib/*.js`）以及 profile 清单。

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
