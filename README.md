# dsh-window

A Typora-like floating Markdown note window for the **DeepSeek Harness (DSH)** web GUI.
It docks beside the conversation, renders the note the way Typora does (tables, code,
Mermaid diagrams, inline HTML), lets you long-press to highlight text, and exposes the
note to the model through `note_*` tools. The note itself is a git repository.

DSH Web GUI 的**悬浮 Markdown 笔记窗**：靠右停靠、可拖动、可折叠成药丸；长按划选重点并持久化；
渲染贴近 Typora（表格滑动卡、代码高亮、Mermaid 图、行内 HTML）；笔记是 `dsh-note/note.md`，受 git 管理，
模型通过 `note_*` 工具读写它。

## 特性

- **停靠 / 浮动 / 折叠**：停靠时正文自动让位（`--dn-shift`）；折叠后变成右下角小药丸，带选中数量角标。
- **宽度切换（W 键按钮）**：标准 430 / 宽版 620 / 超宽 900，位置与宽度记在 `localStorage`。
- **防误触**：单击不进入编辑；双击进入编辑，并且**光标落在双击的那个字符上**。
- **长按划选**：约 0.4s 出双游标选择器；操作条**懒显示**（鼠标松开才出现，触屏则游标静止 1.5s 后出现），且
  从上往下选出现在选区下方、从下往上选出现在上方。
- **高亮用覆盖层绘制**：不拆分文本节点，所以选中不会让字距/断行发生位移；几何按字符盒缓存，指针→列号是纯 JS 二分。
- **持久化的选中对象**：`{id, seq, 行/列, 原文, createdAt, fetched, stale}`，按正文先后排序；文本被改动时自动重新锚定
  （找不到原文才标记 `stale`）。
- **渲染**：表格横向滑动卡、按语言高亮的代码块、Mermaid（见下）、`b/i/em/u/s/del/mark/kbd/sub/sup/code/span/a/...`
  等行内 HTML 白名单、在线图片与工作区相对路径图片（由 host 读成 data URL）。
- **模型工具**：`note_read` / `note_write` / `note_get_selections` / `note_take_new_selections` / `note_commit` / `note_diag`，
  并向系统提示注入一段使用说明，所以「把讲解写进笔记」「用户划了什么」对模型是原生能力。

## 安装

```sh
dsh plugin --profile <profile> add dsh-window
```

随后**重启 DSH**（profile 的组合只在启动时读取）。安装后浏览器端由 shell 自动投递，无需手动引脚本。

要求：Node.js ≥ 20；profile 的依赖树需能解析 `@deepseek-ai/dsh-tools`（任何挂载了 `dsh-base` 的 profile 都满足）。

## 数据放在哪

| 内容 | 位置 |
| --- | --- |
| 笔记正文 | `<会话工作区>/dsh-note/note.md` |
| 选中对象 | `<会话工作区>/dsh-note/.note-state.json`（损坏时另存 `.note-state.bad.json`） |
| 笔记历史 | `<会话工作区>/dsh-note/.git`（独立仓库，只跟踪该目录） |
| 面板位置/宽度 | 浏览器 `localStorage`：`dsh-note-card:layout:v1`（键名保留自旧版，改名不影响你的布局） |

## Mermaid

Mermaid 是**可选依赖**，按需懒加载：

- `dependencies.mermaid` 固定版本；host 半边把 `node_modules/mermaid/dist/mermaid.min.js` 通过
  `/plugins/dsh-window/vendor/mermaid.min.js` 供给浏览器（带长期缓存），**仓库里不放 vendored 产物**。
- 客户端只在笔记里真的出现 ```` ```mermaid ```` 块时才注入该脚本；渲染使用 `securityLevel: 'strict'` + `htmlLabels: false`。
- 未安装或渲染失败时，自动回退到内置的手写渲染器（支持 `graph`/`flowchart` 的分层排列），并给出源码卡片。

## 开发

```sh
node src/build.mjs      # src/dynamic-*.js  ->  lib/（host + client 两半）
node src/install.mjs    # 发布到当前 profile 并注册 bundle 行
node src/selftest.mjs   # 30+ 项自测：工具注册、路由、晚绑定、样式注入、slot 注册、渲染冒烟
node src/verify-live.mjs # 对运行中的 GUI 做端到端验证（路由 + 页面清单）
```

`src/dynamic-host.js` 与 `src/dynamic-client.js` 是这个插件最初作为**动态 Cordis 插件**时的两半源码，
`build.mjs` 把动态运行时的原语机械地映射成永久插件的对应 API：

| 动态插件 | 永久 bundle |
| --- | --- |
| `harness.defineTool` | `defineTool` from `@deepseek-ai/dsh-tools` + `ctx.tools.register` |
| `harness.handle(name, fn)` | HTTP 路由 `/plugins/dsh-window/rpc`（单端点分发） |
| `host.call(m, a)`（客户端） | 同源 `fetch` POST（调用点零改动） |
| `styles.insert(CSS)` | 自持 `<style data-plugin-css>`，随 fiber 销毁 |
| 环境变量 `React` | `window.__ModuleLoader__.load({factory})` + `require('react')` |

两个只会在**永久**形态下出现的坑，代码里都有注释与回归测试：① bundle row 在 host 组合里挂载得比
`fs`/`shell`/`systemPrompt` 等**服务早**，所以它们必须延迟重读（`refreshServices` + `internal/service` 事件）；
② 从 React effect 里用 cordis 的 `ctx.timeout` 排的定时器不会触发，落点类逻辑要用 `window.setTimeout`。

## 已知限制

- Mermaid 之外的图种走内置渲染器时只支持 `graph`/`flowchart`（其余降级为源码卡片，不报错）。
- 代码高亮是行内的（不跟踪跨行字符串/注释）。
- 工作区相对路径图片首次读取有延迟（host 读字节 → base64）。
- 停靠让步用的是会话区的 `padding-right`；若同装 AgentTeams 面板，两者会互相覆盖而不是叠加。

## 许可

MIT。第三方：**Mermaid**（MIT, © 2014-2022 Knut Sveidqvist）作为可选运行时依赖引入，未随本仓库分发。