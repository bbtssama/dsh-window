# REVIEW · 上下文成本与增量设计（源码级系统评审）

| 项 | 值 |
|---|---|
| 评审对象 | `dsh-window` v0.0.4（`D:\dsh-window`，author bbtssama） |
| 评审视角 | **消费方 agent 的真实使用**（31 个 `note_*` 工具的调用者） |
| 评审方法 | ① 源码精读（`src/dynamic-host.js` 4116 行 / 252.5 KB、`src/dynamic-client.js` 5423 行 / 342.2 KB）＋ ② 实盘计量（会话 `session-9d059201…`，含试卷 518 行/35 KB 的批改全过程）＋ ③ 对照 `plugin` 声明的目标 |
| 评审目标 | 落实两条产品原则：**增量优于全量**、**最小必要（只给完成任务所需的最小信息）**，使单次交互的上下文成本可预测、可回归 |
| 本文档性质 | 评审报告 + 重构方案（含 file:line 证据索引与分阶段落地清单） |

> **一句话结论**：这个插件的**数据底座（每笔记 git、`rev` 计数、`seq`、事件环、per-turn prompt 变量）已经具备做"增量优先"的全部材料**，但**接口层把 11 个工具的返回体做成了"全量标记广播"**，同时**没有任何一个工具能回答"相对某个基线改了什么"**，于是 agent 只能靠整篇读——这正是 `package.json` 里那句 *"31 note_* model tools that keep the agent's context cost low"* 目前**尚未兑现**的地方。

---

## 🎯 阅读指引（本报告为自包含文档）

> **本报告的全部结论都写在本文件正文中**，不依赖任何卡片标记——标记是会话私有的，换会话、换机器、把文件发给别人都不会保留。下面的表只做导航用。

| 想快速抓住 | 直接跳到 | 一句话结论 |
|---|---|---|
| 最该先修什么 | **§1.3 若只做三件事** | ① 砍全量回显 ② 加 `note_status`/`note_diff`/`note_read.mode` ③ 提示词前置增量铁律 |
| **最烧上下文的元凶** | **§P0-1** | 11/31 个工具恒带全量标记摘要（`selRender`），单次 ≈4.6 KB，本会话累计 ≈100 KB+ |
| **增量为什么做不了** | **§P0-2** | `rev` 是内存计数、不持久、不可引用；全文件无 `lastReadRev`——没有基线，就没有增量 |
| **为什么 agent 总整篇读** | **§P0-3** | 提示词 `:3562` 明确引导"用 note_read 读全文"，整段 section 里增量相关 0 行 |
| **标记为什么被误回吐** | **§P0-4** | 只判 `fetched`、`SEL_ITEM` 无 `author`；且 `fetched=true` 立即落盘，不可重放（静默丢用户信号） |
| **"提交了却查不到"的根因** | **§P1-5 / §P1-6 / §P1-7** | `.note-state.json` 进 git 使空提交跳过失效 + 提交信息无 delta + `note_create` 的 git 异步就绪窗口 |
| 命名哪里有问题 | **§P1-9** | `note_list` vs `note_lists` 近名撞车、`selection` 术语漂移、`note_import` 一名两物 |
| 怎么改 | **§7.1 ~ §7.7** | rev/delta/base 三件套协议 + 逐工具改造表 + 返回体预算 + 6 阶段落地与量化验收 |
| 现成可抄的提示词 | **附录 C** | 含 5 条"省上下文铁律"，整段替换 `:3559` 起的"工作方式" |
| 31 个工具逐个体检 | **附录 A / 附录 B** | 每个工具的行号 / 是否回显 / 建议命名 / 建议返回上限 + file:line 证据索引 |

---

## 第一部分 · 结论摘要

### 1.1 评分卡

| 维度 | 评分 | 依据 |
|---|---|---|
| 数据模型（note.md + state + view + git） | **A-** | 状态/阅读位置分离、`.note-view.json` 进 ignore 的取舍是对的 |
| git 工程质量 | **A-** | `-c user.name` 免配置、`headHashFromFiles` 免子进程、`gitSlot` 串行化队列都很讲究 |
| 工程性能（轮询/子进程） | **A** | 事实缓存 `factsOf`、`diskVersions`、事件环，明显是踩过坑后打磨的 |
| **动作面（工具集）返回体经济性** | **D** | **11/31 工具全量回显标记**（≈4.6 KB/次） |
| **增量能力** | **D+** | 有 `rev` 但**不持久、不可引用**；无 diff、无 baseline、无 `since` |
| **提示词行为引导** | **C-** | 20 行"功能说明书"详尽，但**零条"增量优先"铁律**，且有一条反向引导（见 P0-3） |
| 命名一致性 | **C** | `note_list`/`note_lists` 近名撞车、`selection` 术语漂移、`import` 一名两物 |
| 可靠性 | **B-** | `note_create` 的 git 异步就绪窗口、无正文变更也产生提交 |

### 1.2 问题分级（详见第五部分）

| ID | 问题 | 影响 | 级别 |
|---|---|---|---|
| **P0-1** | 11 个工具的返回体**恒带全量标记摘要**（`selRender`） | 单次 ≈4.6 KB；本会话累计 **≈100 KB+** 纯冗余 | P0 |
| **P0-2** | **没有"读增量"的能力**：无 diff 工具、无 `since`、`rev` 不持久不可引用 | agent 只能整篇读（35 KB）或自救跑 git | P0 |
| **P0-3** | 提示词**明确引导全量读**："需要笔记全文(含行号)时用 `note_read`"，且无任何增量铁律 | 默认行为被写成"全量" | P0 |
| **P0-4** | `note_take_new_selections` 把 **agent 自建标记**当成"用户新选中"回吐 | 语义错 + 体量错 + **标记被永久消费** | P0 |
| P1-5 | `.note-state.json` 进 git、`.gitignore` 只挡 view | 无正文改动也产生提交；正文 diff 被状态噪音污染 | P1 |
| P1-6 | 提交信息 `note: <ISO 时间>` 不含任何 delta | 最廉价的一条增量线索被浪费 | P1 |
| P1-7 | `note_create` 后 git **异步**就绪（1~2 s 窗口） | 新笔记建好后立刻保存 → "提交了但查不到" | P1 |
| P1-8 | `note_diag` 信息过薄（无 rev / lines / dirty / lastRead） | 排障与自检缺手 | P1 |
| P1-9 | 命名缺陷（近名撞车、术语漂移、一名两物、入口重叠） | agent 选错工具的成本高 | P1 |
| P2-10 | 31 个工具的 description 本身就是每轮固定成本 | 工具面过宽 | P2 |
| P2-11 | `note_read` 恒带"标记概览"；`selRender` 恒带 remark+原文 | 每次读都付两份钱 | P2 |

### 1.3 若只做三件事

1. **砍掉 `selRender` 的全量回显**（改 11 处，一次改动省掉最大单项开销）
2. **加 `note_status` + `note_diff({since})` + `note_read({mode:"auto"})`**，并把 `rev` 落库成"agent 上次读到的 rev"
3. **提示词前置 6 行"增量铁律"**，并把"待读增量"塞进**已经存在的 per-turn 变量** `dsh_window_note_scope`

---

## 第二部分 · 需求约束（把"省上下文"写成可验收的规则）

把你这句"增量优于全量、最小必要"落成 5 条可检验的产品原则：

| # | 原则 | 可检验表述 |
|---|---|---|
| R1 | **增量优于全量** | 任何"再读一次"的场景，默认返回**改动**而非全文；全文必须显式请求 |
| R2 | **可引用基线** | 每次返回都带一个**稳定标识（rev + git sha）**，agent 能拿它当下次的 `since` |
| R3 | **最小必要** | 单次工具返回 ≤ **1.5 KB**（显式 `detail:"full"` 除外）；写操作**只回 delta** |
| R4 | **零轮询** | 内容变化后 agent **无需**主动确认，变化摘要应出现在下一轮的提示里 |
| R5 | **可度量** | 每个工具的返回字节数可采集、可回归（把"上下文成本"变成 CI 指标） |

> R2 是当前最被忽视的一条：没有 R2，R1 在实现上无处落脚——agent 就算知道"该看增量"，也说不出"相对**什么**"。

---

## 第三部分 · 架构现状（源码级）

### 3.1 组成与挂载

```
D:\dsh-window
├── src/dynamic-host.js      4116 行 / 252.5 KB   ← host 侧：31 个 note_* 工具、git、state、prompt section
├── src/dynamic-client.js    5423 行 / 342.2 KB   ← 浏览器侧：卡片 UI（渲染、标记、轮询、事件消费）
├── lib/index.js             4314 行 / 257.3 KB   ← 构建产物（build.mjs 生成，package.json main）
├── lib/client.js            5483 行 / 339.7 KB   ← 构建产物（./client 导出）
├── cordis.patch.yml                              ← 以 insert 方式挂到 profile 的 host 组合
├── docs/UPGRADE-PLAN.md、docs/ASSET-PLAN.md      ← 既有规划文档（本报告同体例）
└── src/verify-*.mjs、selftest.mjs                ← 自测/验收脚本（verify-notes.mjs 1642 行）
```

- 挂载方式：`cordis.patch.yml` 里 `insert: [{ id: note-card, name: 'dsh-window' }]`；
- 通信：host 注册一个 HTTP 路由 **`/plugins/dsh-window/rpc`**，浏览器卡片用它读写正文、标记、素材与提交（`cordis.patch.yml` 注释已写明）；
- 对 agent 的暴露面：**31 个 `note_*` 工具** + **1 个 system prompt section（order 152）** + **1 个 per-turn prompt 变量**。

### 3.2 数据模型（每份笔记目录）

| 文件 | 进 git？ | 内容 | 观察 |
|---|---|---|---|
| `note.md` | ✅ | 正文 | 唯一"内容"真源 |
| `.note-state.json` | ✅（**未被 ignore**） | `{v, seq, selections, updatedAt}`（实测 23.4 KB / 32 条标记） | **批注状态进了内容仓库** → 见 P1-5 |
| `.note-view.json` | ❌（`.gitignore` 唯一一行） | 阅读位置/历史 | 这个取舍是对的（避免把"读到第几行"写进历史） |
| `.git/` | — | 每笔记独立仓库 | 增量能力的底座 |

> `.note-state.json` 23.4 KB 已经和试卷正文（35 KB）同量级——**每次标记操作都会重写它并提交**，这是"提交噪音"的物理来源。

### 3.3 状态与修订号（增量协议的关键，当前不合格）

| 事实 | 证据 |
|---|---|
| `rev` 是**内存计数**，初始 `revision: 1` | `src/dynamic-host.js:312`、`:923` |
| `rev` **不进 state payload**（payload 只有 `v/seq/selections/updatedAt`） | `persistState()`（约 :1180 附近） |
| `rev` 在写路径自增 | `applyPatch` :3632、`markTouched` :925、:1267 |
| `rev` 只在个别返回里出现 | `patchRender` :3654 `(rev ' + v.revision + ')'` |
| `seq`（状态序号）才持久化 | state payload |
| **没有** `lastReadRev` / `lastContentSha` | 全文件 grep 无匹配 |

**结论**：`rev` 现在只是"显示给用户看的进度数字"，**不是可引用的协议字段**——进程重启即归零，agent 无法"相对上一次的 rev"提问。这是 P0-2 的技术根因。

### 3.4 git 层（工程质量高，但提交语义缺失）

| 机制 | 证据 | 评价 |
|---|---|---|
| `gitSlot` 串行队列（复合操作在**一个** slot 内完成，避免自死锁） | :2358-2367 注释与实现 | ✅ 讲究 |
| `headHashFromFiles` 直接读 `.git` 取短哈希，免子进程 | :1840、注释 "The commit hash read straight out of `.git` — no subprocess" | ✅ 性能意识 |
| 身份随命令注入，免 `git config` | :1837 `-c user.name="DSH Note" -c user.email=…` | ✅ |
| 空提交**已**跳过 | :1831 `if (status.ok && status.out === '') return { ok:true, nothing:true }` | ✅ 但**失效**：state 文件被跟踪 → 时间戳变化即"非空"（见 P1-5） |
| 提交信息 | :1834 `msg = message || ('note: ' + isoNow())` | ❌ 无 delta、无"是不是正文变更" |

### 3.5 事件与"推送"（当前只到浏览器，不到 agent）

```
emit(topic, data)  →  events 环形缓冲（MAX_EVENTS） + uiRev++
                      ↑ 只有浏览器卡片轮询消费（约 0.7 s）
agent 侧：无任何推送通道 ✗
```

- 证据：`emit` 实现（:1810 附近）只维护 `events`/`uiRev`；`EVENT_TOPICS` 白名单含 `text/marks/notes/lists/view/git/ui`；
- **但 agent 侧唯一的"每轮可注入"抓手已经存在**：prompt 变量 `dsh_window_note_scope`（注册于 :3584-3603，注释明确写了"a prompt VARIABLE can… answers per session"）。
  → **R4（零轮询）的落点就在这个变量里**：把"自 agent 上次读取以来 +N 行 / N 条新标记"拼进这行文本即可，无需新机制。

### 3.6 提示词注入现状

- section：`name: SECTION_NAME, order: 152`（:3552-3575），共 **20 行**；
- 内容构成：1 行定位 + 1 行动态变量 + **17 行"功能说明书"**（颜色语义、样式开关、自定义列表、UI 命令、图片、mermaid、事件刷新…）；
- **增量相关：0 行**。且第 3562 行是**反向引导**：
  > `- 需要回顾全部标记时用 note_get_selections; 需要笔记全文(含行号)时用 note_read，也可以直接用 read 工具读该文件。`

  （后者更危险：它建议 agent 绕过插件、用通用 `read` 直接读文件——那样连"标记概览/行号对齐"都丢了，纯全量开销。）

---

## 第四部分 · 上下文成本实测

### 4.1 单次调用体量（本会话实测）

| 操作 | 实测返回 | 备注 |
|---|---|---|
| `note_create` | 3 行 / ≈120 B | ✅ 经济 |
| `note_read`（试卷全文） | **518 行 / 35 KB** + 标记概览 | ❌ 最大单项 |
| `note_get_selections` | 全量 32 条 | ❌ |
| `note_add_selection` | `已新建标记 sel-6 (rev 41)` **+ 全量 32 条** | ❌ 前半句够用，后半句白给 |
| `note_set_color` / `note_set_style` / `note_remove_selection` | 各自都**回显全量 32 条** | ❌ |
| `note_patch` | `已改写: -6 +5 字符，现 518 行 (rev 92)` **+ 全量 32 条** | ⚠️ 前半句是**理想形态** |
| `note_patch_many` | 同上 | ⚠️ |
| `note_take_new_selections`（第 1 次） | 3 段 / ≈1.2 KB | ✅ 符合预期 |
| `note_take_new_selections`（第 2 次） | **29 段 / ≈8 KB**（绝大多数是我自己建的批注） | ❌ 见 P0-4 |
| `note_list` | 4 行（含 `git <sha>`、行数、"读到第 N 行"） | ✅✅ 已是增量要素 |
| `note_find` / `note_goto` / `note_ui` / `note_panel` / `note_checkpoint` | 1~3 行 | ✅ |
| `note_diag` | 6 行 | ⚠️ 过薄 |
| **[自救] `git diff <基线> -- note.md`** | **3 行 / ≈60 B** | ✅ 且这正是应有的产品形态 |

### 4.2 全量回显的工具清单（源码级，11/31）

> 判定口径：该工具实现块内出现 `selRender(...)` 或返回 schema 强约束 `selections: { type: 'string', required: true }`。

| 工具 | 行号 | 回显全量标记 |
|---|---|---|
| `note_get_selections` | 2369 | **YES** |
| `note_take_new_selections` | 2384 | **YES** |
| `note_read` | 2408 | **YES** |
| `note_export` | 2660 | **YES** |
| `note_add_selection` | 3665 | **YES** |
| `note_remove_selection` | 3692 | **YES** |
| `note_set_color` | 3730 | **YES** |
| `note_set_style` | 3750 | **YES** |
| `note_set_remark` | 3776 | **YES** |
| `note_patch` | 4046 | **YES** |
| `note_patch_many` | 4061 | **YES** |

**其余 20 个**（`note_diag / note_write / note_commit / note_list / note_create / note_open / note_clear / note_delete / note_rename / note_import / note_clear_selections / note_goto / note_panel / note_lists / note_ui / note_import_folder / note_sync / note_assets / note_checkpoint / note_find`）**不回显**——说明"不回显"是可做到的，那 11 个属于**设计选择而非技术必然**。

### 4.3 累计量级

| 项 | 数值 |
|---|---|
| `selRender` 单次输出（32 条标记） | remark 2230 字符 + 原文 2439 字符 ≈ **4.6 KB 字符**（实测 `.note-state.json` 23.4 KB） |
| 本会话标记类工具调用次数 | ≈ **22 次** |
| 因此产生的冗余回显 | ≈ **100 KB 字符**（未计 JSON 包装与工具外壳） |
| 同一目标（"试卷改了什么"）两种读法 | 整篇 **35 KB** vs `git diff` **60 B** → 差 **≈600×** |

### 4.4 成本结构模型（为什么"最小必要"必须落在接口层）

```
每轮固定成本 = 31 个工具 description（常驻）+ 20 行 prompt section（常驻）
每次交互变动成本 = Σ 各工具返回体
```

- 固定成本：难以压缩到 0，但**可以靠"工具合并 + description 精简"降**（P2-10）；
- 变动成本：**当前被 P0-1 支配**——写一个标记要付 4.6 KB，写 20 次付 100 KB。**这正是"最小必要"最该砍的地方**，也是投入产出比最高的一处。

---

## 第五部分 · 问题清单（含证据与修复建议）

### P0-1 · 11 个工具恒带全量标记摘要

**证据**

```js
// :1863-1879  全量摘要构造函数：每条标记 = 头信息 + 备注 + 原文全文
function selRender(list) {
  if (!list || list.length === 0) return '（当前没有任何标记）'
  ...
  const head = '#' + s.order + ' [' + s.id + '] ' + ({yellow:'黄',...}[s.color]) + ... +
               ' 第' + s.startLine + '行:' + s.startCol + ' → 第' + s.endLine + '行:' + s.endCol +
               (s.fetched ? ' （已取用）' : ' （新标记）') + ...
  const remark = ... ? '\n  【备注】' + s.remark... : ''
  parts.push(head + remark + '\n' + s.text...)     // ← remark + 原文全文，双份
}

// :3654  note_patch 的 render：delta 之后强行拼全量
return [{ type:'text', text:'已改写: -'+v.removed+' +'+v.inserted+' 字符，现 '+v.lineCount+' 行 (rev '+v.revision+')\n\n'+v.selections }]

// :2420  note_read 的 render：正文之后强行拼全量
... + '\n\n--- 标记概览 ---\n' + v.selections

// :3649  PATCH_SCHEMA 把 selections 设为 required → 结构上无法省略
selections: { type: 'string', required: true }
```

**影响**：单次 ≈4.6 KB；本会话累计 ≈100 KB；**且这部分内容 agent 在绝大多数情况下已在自己的上下文里**（它自己刚创建/改过这些标记），属于纯粹的重复。

**修复（1~2 小时，收益最大）**

1. 摘要改为**默认 brief**：`#order [id] 色/样式 行范围 状态`，**不含 remark、不含原文**；
2. 写类工具（patch/write/mark 增删改）**只回 delta + rev**，不回任何标记列表；
3. 需要细节时显式 `note_get_selections({ids:[...], detail:"full"})`；
4. 顺手把 `required: true` 的 `selections` 字段从 schema 里删掉（结构上强制"可省"）。

**验收**：单次标记类调用返回 **≤ 200 B**；`verify-notes.mjs` 增加"返回体字节数"断言。

---

### P0-2 · 没有"读增量"的能力（增量协议缺位）

**证据**

| 缺失项 | 证据 |
|---|---|
| 无 diff / changes 工具 | 31 个工具名中无 `note_diff` / `note_changes` |
| 无 `since` / `rev` 参数 | `note_read` 参数仅 `withLineNumbers/note/fromLine/toLine/padding`（:2410） |
| `rev` 不持久 | state payload 无 `revision`（§3.3）；`S` 初始 `revision: 1`（:312/:923） |
| 无"agent 上次读到哪" | 全文件无 `lastRead` / `readRev` |
| 有"**用户**读到哪" | `note_read` 返回 `viewLine`（:2436）、`note_list` 显示"读到第 N 行" |

**影响**：用户改完笔记，agent **无法**说"相对上次读到的版本改了什么"；只能整篇读（35 KB）或手动跑 git（这正是我在本会话自救的方式）。

**修复（半天）**

```js
// ① state v2：把基线持久化（每个 note 一份）
{ v: 2, seq, selections, updatedAt,
  contentSha,          // note.md 内容哈希（含空白规范化）
  headRev,             // 最近一次提交短哈希
  lastAgentRead: { rev, sha, at, agentId? }   // ← 增量基线
}

// ② 新工具
note_status({note?})  → { rev, git, dirty, lines, contentSha, unread: { lines, chars, marks } }
note_diff({note?, since?, format: "summary"|"hunks"|"marks", context: 2})
                       → 只回改动块；since 省略时 = lastAgentRead
note_read({mode: "auto"|"full"|"window", fromEnd?, since?, detail: "brief"|"full"})
                       → mode:"auto" 且自基线无改动 ⇒ 回 "无改动（rev N）"，绝不吐全文

// ③ 所有返回头统一携带
[note=微服务初级试卷 rev=92 git=d99b331 delta=+1/-1 lines, +5/-6 chars]
```

**关键设计点**：基线按 **(sessionId, noteName, agentId)** 记账——因为同一个会话里可能有主 agent 与 subagent，共享 session 会串基线。当前插件已有 `sessionIdOfContext(context)`（:3587），扩展成 agent 维度成本极低。

**验收**：agent 在"用户刚改过笔记"的场景下，**默认调用链不产生任何整篇读**；`note_status` 单次 ≤ 0.3 KB。

---

### P0-3 · 提示词反向引导 + 无增量铁律

**证据**

```js
// :3562
'- 需要回顾全部标记时用 `note_get_selections`; 需要笔记全文(含行号)时用 `note_read`，也可以直接用 `read` 工具读该文件。'
```

- 该行把"读全文"写成了**第一顺位**动作，并额外推荐绕过插件的通用 `read`；
- 整段 section（:3556-3575）**没有任何**"先看增量"的要求；
- 结果：agent 的最省事路径 = 全量读。**这不是 agent 笨，是提示词把默认值设成了全量。**

**修复（30 分钟，性价比第二高）**

在"工作方式"列表**最前面**插入（并把 3562 行改成"增量优先"的措辞）：

```markdown
- 【省上下文铁律 · 读笔记前必做】
  ① 先 `note_status`/`note_list` 看 rev、行数、有没有未读增量；
  ② 正文优先 `note_find` 定位 + `note_read({mode:"window", fromLine, toLine})` 开窗，禁止无差别整篇读；
  ③ 用户改过之后用 `note_diff({since:<上次读到的 rev>})` 只看改动块；
  ④ `note_read({mode:"auto"})` 在无改动时不会返回全文；
  ⑤ 只有明确需要通读时才 `mode:"full"`，并在回复里说明理由。
```

**验收**：在"用户改了 1 行"的场景里，agent 的首次读取调用应为 `note_diff`/`note_status`，而非 `note_read` 全量。

---

### P0-4 · `note_take_new_selections` 的语义、命名与"永久消费"隐患

**证据**

```js
// :2393-2402  只按 fetched 判定"新"，没有作者的区分
const freshIds = {}
for (...) if (!S.selections[i].fetched) { freshIds[id] = true; count++ }
if (count > 0) {
  S.selections = S.selections.map(s => s.fetched ? s : { ...s, fetched: true, fetchedAt: isoNow() })
  S.revision += 1
  await persistState()          // ← 立即落盘，不可回退
}
```

- `SEL_ITEM`（:1902-1914）里**没有 `author` 字段**：agent 用 `note_add_selection` 建的标记，`fetched` 默认 false；
- 于是下一次 `note_take_new_selections` 会把**agent 自己刚建的批注**当"用户新选中"回吐——**本会话实测：一次返回 29 段，几乎全是我自己的批注**；
- 工具名/描述都声称"用户自上次领取之后新划选的内容"（:2385），**名实不符**；
- **隐患**：`fetched=true` 立即落盘且无回滚。若 agent 上下文被压缩/会话重载而没真正处理这些标记，用户划的重点就**永久不再被提供**——对"用户标记=需求信号"这一设计意图而言是静默丢数据。

**修复**

1. `SEL_ITEM` 增 `author: "user" | "agent"`；`note_add_selection` 写 `author:"agent"`，卡片侧写的写 `author:"user"`（老数据无字段时按"用户"兜底）；
2. `note_take_new_selections` → **`note_mark_new({author:"user", detail:"brief"})`**，默认只回用户新标记；
3. 增加 `seenBy`/`deliveredAt` 语义而非一次性 `fetched`：保留 `fetched` 兼容，但允许 `note_mark_new({redeliver:true})` 或按 `since` 重放；
4. 返回默认 brief（id/range/color/style/前 30 字），`detail:"full"` 才带 remark 与原文。

**验收**：agent 自建标记**永不**出现在"新选中"里；用户标记可重放（不会静默丢失）。

---

### P1-5 · 批注状态进了内容仓库 → 提交噪音 + diff 污染

**证据**

- `.gitignore` 只有一行：`.note-view.json`；
- `.note-state.json` 被跟踪，且每次标记操作 `persistState()` 重写它（`updatedAt` 必变）；
- `commit()` 的"空提交跳过"（:1831）因此**永远不触发**：git 认为 state 的变更就是变更；
- 实证：用户"保存"两次 → 提交 `f9b3d53`，**只改了 `.note-state.json` 的 `updatedAt`**，正文 blob 未变（我用 `rev-parse HEAD:note.md` 对比哈希验证）。

**影响**

1. 提交历史被状态变更淹没（本会话试卷仓库 ~48 次提交，正文变更只有 3 次）；
2. agent 做 `git diff` 增量时**必须带 `-- note.md`**，否则被状态噪音干扰——增量工具的实现里必须显式隔离，否则会给出误导性 diff；
3. 用户观感："我提交了两次，你看不到变化"（本会话真实发生）。

**修复（二选一）**

- **方案 A（推荐，改动小）**：把 `.note-state.json` 也写进 `.gitignore`；状态另存到**笔记目录之外**（例如 `<sessionRoot>/.state/<note>.json`）或用一个**独立的 bare 仓**做版本。
- **方案 B**：保留跟踪，但提交信息标注类型（`note(state): …` / `note(content): +12/-0`），并让"只有 state 变更"的提交走**折叠/amend**（同一分钟内合并）。

**验收**：无正文改动的保存**不产生提交**；`git log -- note.md` 与"用户可见的正文变更次数"1:1 对齐。

---

### P1-6 · 提交信息不含 delta

**证据**：`:1834 msg = message || ('note: ' + isoNow())`。

**建议格式（一行投入，长期收益）**

```
note(content): +12/-0 lines, marks +2 (rev 93)
note(state):   marks ~1 (fetched)
note(ai):      <正文首行>
```

→ agent 甚至可以不调工具，仅凭 `git log` 就知道"改了什么量级"（R2/R4 的低成本补充）。

---

### P1-7 · `note_create` 后 git 异步就绪（时间窗口 → 假故障）

**证据**

- `note_create` 返回后立即检查：**无 `.git`**；隔 3 秒再看：出现 `note: init` 与首次提交；
- `commit()` 内 `if (!S.gitReady) await ensureGit()`（:1827）→ 说明"仓库创建"是**按需/后台**的；
- `note_diag` 里才有 `gitReady`（:2447）。

**影响**：用户（或 agent）在窗口期内保存/提交，会得到"提交了但查不到"的结果——**这正是本会话那次困惑的成因**。

**修复**：`note_create` 同步建仓并做首次提交后**再**返回；或在返回体里带 `gitReady:true|false`，并在 `note_list`/`note_status` 中显式标注"未就绪"。

---

### P1-8 · `note_diag` 信息过薄

**证据**：schema（:2447）为 `path/baseFrom/confirmed/touched/sessionId/gitReady/gitTrace/error`，无 `rev/lines/dirty/contentSha/lastAgentRead`。

**修复**：补 6 个字段，使其成为"一次调用即可判断是否需要读取"的**前置自检工具**（与 R2/R3 配合）。

---

### P1-9 · 命名评审（结论表）

**总准则（建议写进 CONTRIBUTING）**：前缀 `note_`；名词维度固定为 **`note`（笔记）/ `mark`（标记）/ `card`（卡片 UI）/ `rev`+`delta`（增量）**；单复数不承载语义；增量语义进名字（`new`/`since`/`diff`/`window`）；危险动作名字自带警示；一个概念只给一个名字。

| 现名 | 判定 | 问题 | 建议 |
|---|---|---|---|
| `note_list` / `note_lists` | ❌❌ | **只差一个 `s`，语义完全不同**（列笔记 / 自定义标记列表） | 保留 `note_list`；另一个改 `note_mark_lists` |
| `note_take_new_selections` | ❌❌ | 动词 `take` 含糊；未表达"增量"；未表达"用户"；实测名实不符 | `note_mark_new` |
| `note_get_selections` | ⚠️ | 与 take/clear/remove/add 不成族 | `note_mark_list`（默认 brief） |
| `note_add_selection` / `note_remove_selection` / `note_clear_selections` | ⚠️ | 同一对象（mark）四种叫法混用 `selection(s)` | `note_mark_add` / `note_mark_remove` / `note_mark_clear` |
| `note_set_color` / `note_set_style` / `note_set_remark` | ⚠️ | 对象不明确（是谁的颜色？） | `note_mark_color` / `note_mark_style` / `note_mark_remark` |
| `note_import` / `note_import_folder` | ❌ | **一名两物**（正文追加/替换 vs 整目录建笔记） | `note_append`·`note_replace` / `note_folder_import` |
| `note_commit` / `note_checkpoint` | ⚠️ | 两个入口做同一件事 | 合并为 `note_commit({reason})`，`checkpoint` 保留为 intent 别名 |
| `note_ui` / `note_panel` / `note_goto` | ⚠️ | 三个都在动 UI，边界靠文档 | `note_card_ui` / `note_card_panel` / `note_scroll_to` |
| `note_clear` / `note_delete` | ⚠️ | 危险等级差异（保留 git vs 连 git 一起删）名字未体现 | `note_clear_keep_history` / `note_delete_forever` |
| `note_find` / `note_read` / `note_patch` / `note_write` | ✅ | 动词准确、语义自明、支持增量 | 保留，`note_read` 扩 `mode/since/fromEnd` |
| `note_diag` / `note_assets` / `note_sync` / `note_export` / `note_open` / `note_rename` / `note_create` | ✅ | — | 保留 |

> **迁移策略**：先加新名（别名指向同一实现），在 description 里把旧名标 `(deprecated, use X)`，两个 minor 版本后移除；绝不同时改**行为**与**名字**（否则 agent 的既有习惯会连带失效）。

---

### P2-10 / P2-11 · 工具面过宽 + 附带品过多

- 31 个工具 description 常驻每轮上下文（固定成本）。建议合并到 **≤ 18 个**：`note_read/write/patch/find/diff/status/list/create/open/delete/rename/export/import/commit`（笔记面）+ `mark_new/list/add/remove/color/style/remark`（标记面）+ `card_ui/panel`（界面面）+ `assets/sync/diag`。
- `note_read` 恒带"标记概览"（:2420）→ 改为 `detail` 参数控制，默认不带。
- `selRender` 恒带 remark + 原文（:1875-1876）→ 改为 brief 默认 + 按 id 取详情。

---

## 第六部分 · 架构级问题（不是 bug，是设计张力）

### 6.1 "内容"与"批注状态"具有不同生命周期，却共用一条历史

正文按"用户写作节奏"变更（低频、大块）；批注状态按"每次划选/每次 agent 操作"变更（高频、小步），且**每次都要整文件重写**（`.note-state.json` 全文 JSON）。把两者塞进同一个仓库的同一条历史，必然出现：

- 提交噪音（P1-5）；
- 无法用 `git log` 区分"内容里程碑"与"状态抖动"；
- 状态文件随标记增长而线性增长（23.4 KB / 32 条），**每次操作全量重写**——这是 O(n) 的写放大，标记上千条时会明显。

**方向**：内容仓（note.md）+ 状态仓（JSONL 增量追加，或独立目录/bare 仓）。状态用 **append-only JSONL**（每次只写变更记录）而非整文件重写，可同时解决"写放大"与"diff 噪音"。

### 6.2 增量基线无处安放（能力缺口的结构性表达）

插件里已经有三种"位置"概念，但**没有"agent 读到哪里"**：

| 概念 | 现状 |
|---|---|
| 用户阅读位置 | ✅ `.note-view.json` + `note_list` 的"读到第 N 行" |
| 卡片 UI 修订 | ✅ `uiRev` / `uiRevision` |
| 状态序号 | ✅ `seq` |
| **agent 增量基线** | ❌ **完全不存在** |
| 修订号 `rev` | ⚠️ 存在但是内存量、不可引用 |

→ 增量优先的**唯一硬缺口**就是这个字段族。补上它，R1/R2 立刻成立。

### 6.3 推送只到浏览器，不到 agent

`emit` 的消费者只有卡片（`events` 环形缓冲 + `uiRev`），agent 侧完全被动。**但 per-turn prompt 变量（`dsh_window_note_scope`）已经把"每轮可动态注入"的路铺好了**——这是本插件最被低估的架构资产：

```js
// :3586-3601 现状：只回答"本会话有没有笔记"
return '本会话的笔记空间：**已打开《X》**（本会话共 N 份笔记，目录 …）。下面的工作方式全部适用…'
// 目标：同一行追加"待读增量"
return '…笔记空间：已打开《X》。自你上次读取：+12 行 / 2 条新标记（rev 93, git 4f1a2c9）。'
```

→ 零新机制、零轮询，即可让 agent"知道该拉增量"（R4）。

### 6.4 锚定基于行列，增量基于内容

`applyPatch` 每次编辑都跑 `remapSelections`（:3630），另有专门的 `verify-reanchor.mjs`（352 行）与"repair flow"。这说明**行列锚定是持续成本**。若引入 `contentSha` + 每标记的"上下文指纹"（前后各 N 字符），re-anchor 可以退化为"指纹匹配 → 行列定位"，既省逻辑又让 diff 判定基于内容而非位置。

### 6.5 声明的目标与实现的事实不一致（治理问题）

`package.json.description` 写着 *"31 note_* model tools that keep the agent's context cost low"*。当前实测：31 个工具里 11 个回显全量标记、无增量读取能力、提示词引导全量读。
**建议**：把这句话拆成**可验收指标**写进 README/CI（§9），否则它会持续掩盖真实成本。

---

## 第七部分 · 重构方案

### 7.1 目标协议（三件套）

```
rev     每份笔记单调递增（持久化，跨进程稳定）
delta   每次变更的量化描述 { linesAdded, linesRemoved, charsAdded, charsRemoved, marksAdded, marksRemoved }
base    agent 的增量基线 { rev, sha, at, agentId }
```

**统一返回头（所有工具）**

```
[note=微服务初级试卷 rev=93 git=4f1a2c9 dirty=0] +12/-0 lines, +820/-0 chars, marks +2
```

### 7.2 接口改造（现状 → 目标）

| 工具 | 现状 | 目标 |
|---|---|---|
| `note_read` | 全文 + 标记概览，恒全量 | `{mode:"auto"|"window"|"full", fromLine/toLine, fromEnd, since, detail}`；`auto` 无改动时只回 `无改动(rev N)` |
| `note_patch` / `note_patch_many` | delta + **全量标记** | **只回** delta + rev（`selections` 从 schema 移除） |
| `note_add_selection` / `note_remove_selection` / `note_set_*` | 各回全量标记 | 只回 `{ok, id, rev, delta:{marks:+1}}` |
| `note_get_selections` | 全量 + remark + 原文 | `{detail:"brief"|"full", ids?, since?}`，brief 默认 |
| `note_take_new_selections` | 只判 `fetched`；无作者 | → `note_mark_new({author:"user", detail:"brief", redeliver?})` |
| — | — | **新增 `note_status`**（≤0.3 KB 自检） |
| — | — | **新增 `note_diff({since, format})`**（增量主力） |
| `note_diag` | 8 字段 | 补 `rev/git/dirty/lines/contentSha/unread/lastAgentRead` |
| `note_list` | 已带 git/行数/用户位置 | 再带 `unread`（相对 agent 基线） |
| `note_commit` | message 缺 delta | 自动生成 `note(content|state|ai): <delta>` |

### 7.3 返回体预算 + 自动化 lint

```js
// 建议：每个工具包装层统计返回字节数，超阈即 console.warn + 测试失败
const BUDGET = { default: 1536, mark: 200, read: null /* 显式 full 才放行 */, status: 320, diff: 2048 }
```

在 `verify-notes.mjs`（已有 1642 行测试）里加一节 **`verify-context-cost`**：跑一轮"标记增删改 + patch + read"的标准动作，断言总返回字节数 ≤ 阈值（例如 ≤ 6 KB），并打印排行表。

### 7.4 提示词改造（替换 §4 提到的两条）

```markdown
- 【省上下文铁律 · 读笔记前必做】
  ① 先 `note_status` 看 rev/行数/未读增量；无改动就别读全文；
  ② 正文优先 `note_find` + `note_read({mode:"window"})` 开窗；
  ③ 用户改过后用 `note_diff({since:<上次 rev>})` 只看改动块；
  ④ 只有明确需要通读才 `mode:"full"`，并说明理由；
  ⑤ 不要绕过插件用通用读文件工具读 note.md（会丢掉行号对齐与增量能力）。
```

并把 `dsh_window_note_scope` 的返回值扩展为**带增量摘要**（§6.3）。

### 7.5 命名收敛（分批，见 §P1-9 表）

### 7.6 git 策略

- `.note-state.json` 移出内容仓（ignore + 外置/独立仓），或自带 `note(state):` 前缀 + 一分钟内合并；
- 提交信息带 delta（§P1-6）；
- `note_create` 同步建仓（§P1-7）。

### 7.7 分阶段落地与验收

| 阶段 | 内容 | 工作量 | 验收（可量化） |
|---|---|---|---|
| **Phase 0** | 加返回体字节度量（lint + 测试节） | 2~3 h | 能输出"每工具返回字节排行" |
| **Phase 1（P0-1/3）** | 砍全量回显；提示词加铁律 | 3~4 h | 标记类 ≤200 B；提示词含铁律 |
| **Phase 2（P0-2）** | `note_status`/`note_diff`/`note_read.mode` + `lastAgentRead` 落库 | 1 d | "改 1 行"场景零整篇读 |
| **Phase 3（P0-4/P1-6/8）** | `note_mark_new` + author 字段 + commit delta + diag 补全 | 4~6 h | agent 自建标记不回吐；提交信息含 delta |
| **Phase 4（P1-5/P1-7）** | 状态出仓 + 同步建仓 | 3~4 h | 无正文改动不产生提交；create 后 `gitReady=true` |
| **Phase 5（P1-9/P2）** | 命名收敛 + 工具合并 + 别名弃用 | 1 d | 工具数 ≤18；近名冲突归零 |

---

## 第八部分 · 风险与回滚

| 变更 | 主要风险 | 回滚/缓解 |
|---|---|---|
| 砍全量回显 | 依赖"顺手拿到全部标记"的旧 prompt 会行为变化 | 保留 `note_get_selections` 全量入口；description 里显式指向它 |
| 加 `mode:"auto"` 默认 | agent 以为拿到全文却拿到 diff → 误判 | 返回头**显式**写 `mode=auto(diff)`，并附"需要全文请 `mode:"full"`" |
| 状态出仓 | 老笔记目录里仍跟踪 state → 迁移不一致 | 迁移脚本：`git rm --cached .note-state.json` + 写 ignore；旧仓保留历史不重写 |
| 命名改名 | agent 既有习惯失效 | 别名 + `(deprecated)` 标注，两个 minor 后再删 |
| `author` 字段 | 老数据无该字段 | 缺字段按 `user` 兜底（宁可多报，不可漏报用户信号） |

---

## 第九部分 · 度量与回归（把"省上下文"变成 CI 指标）

建议在 README 顶部挂 4 个数字（每次发布更新）：

| 指标 | 当前（实测） | 目标 |
|---|---|---|
| 标记类工具的返回体（32 条标记） | ≈4.6 KB | **≤0.2 KB** |
| "用户改了 1 行"后 agent 的默认读取成本 | 35 KB（整篇） | **≤0.2 KB**（diff） |
| 单次工具返回中位数 | ≈1~5 KB | ≤1.5 KB |
| 每轮固定成本（31 工具 description + prompt section） | 未测 | 见 Phase 5 后复测 |

---

## 附录 A · 31 个工具全表（行号 / 回显 / 建议命名）

| # | 工具 | host 行号 | 全量回显 | 建议命名 | 建议返回上限 |
|---|---|---|---|---|---|
| 1 | `note_get_selections` | 2369 | YES | `note_mark_list` | 1.5 KB(brief 0.5) |
| 2 | `note_take_new_selections` | 2384 | YES | `note_mark_new` | 0.5 KB |
| 3 | `note_read` | 2408 | YES | `note_read`(+mode/since) | auto ≤0.3 / full 例外 |
| 4 | `note_diag` | 2441 | — | `note_diag`(+字段) | 0.4 KB |
| 5 | `note_write` | 2458 | — | `note_write` | 0.3 KB |
| 6 | `note_commit` | 2499 | — | `note_commit`（合并 checkpoint） | 0.3 KB |
| 7 | `note_list` | 2522 | — | `note_list`(+unread) | 0.5 KB |
| 8 | `note_create` | 2552 | — | `note_create`(+gitReady) | 0.3 KB |
| 9 | `note_open` | 2578 | — | `note_open` | 0.2 KB |
| 10 | `note_clear` | 2594 | — | `note_clear_keep_history` | 0.2 KB |
| 11 | `note_delete` | 2612 | — | `note_delete_forever` | 0.2 KB |
| 12 | `note_rename` | 2628 | — | `note_rename` | 0.2 KB |
| 13 | `note_import` | 2644 | — | `note_append`/`note_replace` | 0.3 KB |
| 14 | `note_export` | 2660 | YES | `note_export`(去回显) | 0.3 KB |
| 15 | `note_add_selection` | 3665 | YES | `note_mark_add` | 0.2 KB |
| 16 | `note_remove_selection` | 3692 | YES | `note_mark_remove` | 0.2 KB |
| 17 | `note_clear_selections` | 3712 | — | `note_mark_clear` | 0.2 KB |
| 18 | `note_set_color` | 3730 | YES | `note_mark_color` | 0.2 KB |
| 19 | `note_set_style` | 3750 | YES | `note_mark_style` | 0.2 KB |
| 20 | `note_set_remark` | 3776 | YES | `note_mark_remark` | 0.2 KB |
| 21 | `note_goto` | 3802 | — | `note_scroll_to` | 0.2 KB |
| 22 | `note_panel` | 3841 | — | `note_card_panel` | 0.2 KB |
| 23 | `note_lists` | 3877 | — | `note_mark_lists` | 0.8 KB |
| 24 | `note_ui` | 3906 | — | `note_card_ui` | 0.2 KB |
| 25 | `note_import_folder` | 3949 | — | `note_folder_import` | 0.5 KB |
| 26 | `note_sync` | 3984 | — | `note_sync`(+delta) | 0.4 KB |
| 27 | `note_assets` | 4006 | — | `note_assets` | 0.6 KB |
| 28 | `note_checkpoint` | 4030 | — | 并入 `note_commit` | 0.3 KB |
| 29 | `note_patch` | 4046 | YES | `note_patch`(去回显) | 0.3 KB |
| 30 | `note_patch_many` | 4061 | YES | 并入 `note_patch({edits})` | 0.4 KB |
| 31 | `note_find` | 4091 | — | `note_find` | 1.0 KB |
| — | **新增** | — | — | **`note_status`** | 0.3 KB |
| — | **新增** | — | — | **`note_diff`** | 2 KB(默认 summary 0.2) |

## 附录 B · 证据索引（file:line）

| 主题 | 位置（`src/dynamic-host.js`） |
|---|---|
| 全量摘要构造 | `selRender` :1863-1879 |
| patch 返回拼接 | `patchRender` :3654；PATCH_SCHEMA :3649 |
| read 返回拼接 | :2420（render）/ :2436（execute） |
| 新标记判定（只判 fetched） | :2393-2402 |
| SEL_ITEM（无 author） | :1902-1914 |
| rev 初始化（内存） | :312、:923 |
| state payload（无 rev） | `persistState()` 附近（payload `{v,seq,selections,updatedAt}`） |
| 空提交跳过 | :1831 |
| 提交信息生成 | :1834 |
| git 身份注入 | :1837 |
| head 免子进程 | :1840 |
| gitSlot 队列 | :2358-2367 |
| prompt section（20 行） | :3549-3577 |
| per-turn 变量 | :3584-3603 |
| 反向引导"用 read 读全文" | :3562 |
| 工具注册（31 个） | :2368-4110（见附录 A 行号） |

## 附录 C · 提示词草稿（整段可直接替换 :3559 起的"工作方式"）

```markdown
工作方式(仅当你归属于这张卡片时适用):
- 【省上下文铁律 · 读笔记前必做】
  ① 先 `note_status`/`note_list` 看 rev、行数、有没有未读增量；无改动就不要读正文；
  ② 读正文优先 `note_find` 定位 + `note_read({mode:"window", fromLine, toLine})` 开窗，禁止无差别整篇读；
  ③ 用户改过之后，用 `note_diff({since:<上次读到的 rev>})` 只看改动块；
  ④ `note_read({mode:"auto"})` 在没有改动时不会返回全文；只有明确需要通读才 `mode:"full"` 并说明理由；
  ⑤ 不要用通用文件读取工具直接读 note.md（会丢掉行号对齐与增量能力）。
- 用户问知识性问题、要求讲解/总结/整理时：用 `note_write`(默认追加)写进笔记，对话里只留简短口头交付。
- 回答用户前先 `note_mark_new` 取用户新标记（`note_add_selection` 建的标记不会回吐）。
- 需要全部标记用 `note_mark_list({detail:"brief"})`，要某几条的备注用 `note_mark_list({ids:[...], detail:"full"})`。
- 改一小段用 `note_patch`（多处用 `edits` 一次提交）；定位用 `note_find`。
- 颜色即意图：yellow=重点、pink=疑问、green=已闭环、black=遮盖（不要引用也不要复述）、none=仅样式。
- 样式是独立开关：`italic` / `underline` 可与任意颜色叠加。
- 提交：`note_commit` 会自动生成带 delta 的信息；用户点"保存"也会提交。
- 卡片 UI：`note_card_ui`（标记列表开合/切视图/弹卡）、`note_card_panel`（唤起居中/折叠/宽度）、`note_scroll_to`（跳到行或标记）。
```

---

*报告完。所有 file:line 均基于 `D:\dsh-window` 当前工作区（v0.0.4）；实测数据来自本会话的 31 个工具调用记录。*

---

# 落地进度（实现记录 · 由本次工程逐阶段追加）

> 本节的每一条都是**实测**（跑过套件、看过数字），不是计划。数字来自 `src/verify-notes.mjs`
> 的「context cost」节：它对一套标准动作（建笔记 → 30 条标记 → 收/改/删/改写/读/诊断）逐次调用每个工具，
> 量的是**模型真正看到的那段文本**的字节数，并把结果与 `src/context-cost.json` 做棘轮比较
> （返回体一涨就失败）。文件与代码都在 `D:\dsh-window`。

## 总览

| 阶段 | 内容 | 状态 | 提交 |
|---|---|---|---|
| Phase 0 | 返回体字节度量（BUDGET + 测试节 + 基线棘轮） | ✅ 完成 | `787f397` |
| Phase 1（P0-1/P0-3） | 砍全量回显 + 提示词省上下文铁律 | ✅ 完成 | `787f397` |
| Phase 2（P0-2） | `note_status`/`note_diff`/`note_read.mode` + 基线落库 | ⏳ 进行中 | — |
| Phase 3（P0-4/P1-6/P1-8） | `author` + `note_mark_new` + commit delta + diag 补全 | ⏳ 待做 | — |
| Phase 4（P1-5/P1-7） | `.note-state.json` 出 git + `note_create` 同步建仓 | ⏳ 待做 | — |
| Phase 5（P1-9/P2） | 命名收敛 + 合并（工具数不增） | ⏳ 待做 | — |

## Phase 0 · 度量（已完成，`787f397`）

`src/verify-notes.mjs` 新增一节，`src/context-cost.json` 记录基线。**它逐字复现了本报告 §4.1 的数字**：

| 工具 | 改造前实测 |
|---|---|
| `note_read` | **4578 B** |
| `note_set_color` | 4446 B |
| `note_add_selection` | 4443 B（第 30 次调用；第 1 次 4295 B） |
| `note_set_remark` | 4416 B |
| `note_get_selections` | 4410 B |
| `note_patch` | 4408 B |
| `note_take_new_selections` | 4390 B |

→ 报告 §P0-1 的"单次 ≈4.6 KB"**在字节级得到确认** ✓。

**一处报告本身的偏差（如实记录）**：附录 A 把 `note_export` 记为"YES 回显"，但源码里它只回
`已导出到 <path> (N 字节)`，从不回显标记 —— 判定口径里的 `selRender` 出现在别处。**实际回显的是 10 个工具**
（`note_read`/`note_get_selections`/`note_take_new_selections`/`note_add_selection`/`note_remove_selection`/
`note_set_color`/`note_set_style`/`note_set_remark`/`note_patch`/`note_patch_many`）。

## Phase 1 · 砍回显 + 提示词铁律（已完成，`787f397`）

**改了什么**

1. `selRender` 默认 **brief**：每条标记一行（序号/id/颜色/样式/行范围/状态 + **前 30 字**预览）；
   有备注只显示 `[有备注]`，不再贴备注与原文；`detail:"full"` 才给旧形态。
2. 十个回显工具改为**只回自己的 delta**：标记增删改回 `{ok, id|removed|found|color|style|remark, revision, marks}`；
   `note_patch`/`note_patch_many` 只回行/字符 delta；`note_read` 默认**不附标记概览**（`detail` 控制）。
3. 五个 schema 里 `selections: { required: true }` **删除** —— 结构上不再强制回显。
4. `note_get_selections` 新增 `ids` 与 `detail` 两个参数（看两条不必把三十条拉回来）。
5. 提示词节把**五条省上下文铁律**放在"工作方式"最前面，并把原 `:3562` 那句"需要笔记全文时用 note_read，
   也可以直接用 read 工具读该文件"（反向引导）替换为相反的要求；`note_take_new_selections` 的
   "回答前先取用户新标记"保留（它是用户信号通道，不是成本项）。

**实测效果（同一套动作）**

| 工具 | 前 | 后 |
|---|---|---|
| `note_patch` | 4408 B | **60 B** |
| `note_read` | 4578 B | **193 B** |
| `note_add_selection` | 4443 B | **46 B** |
| `note_set_remark` | 4416 B | **52 B** |
| 30 条标记 brief 列表（`note_get_selections`） | 4410 B | 2447 B（30 条 × ≈80 B，固有量级；看两条用 `ids` 可降到 ≈90 B） |
| **同一套 39 次调用合计** | ≈130 KB（按上表逐次累加） | **6943 B** |

并已加**逐工具预算断言**（§7.3）：标记写类 ≤200 B、`note_patch` ≤300 B、`note_read` ≤700 B 等；
`verify-notes.mjs` 现在 **299 条**断言全过，`build / install / selftest / verify-reanchor /
verify-durability` 全绿。

**遵守报告自己的规矩**：本阶段**只改行为、不改名字**（报告 §P1-9 明确要求"绝不同时改行为与名字"），
所以 `/P0-3` 的铁律文本里暂时写的仍是现名；Phase 5 改名时同步更新这一段提示词。

## Phase 2 · 增量协议（已完成，`fd978e7`）

**协议落地**（报告 §7.1 / §P0-2）

1. **基线**存两处：`.note-state.json` 里的 `lastRead = {rev, sha, at, lines, chars, markIds}`，
   以及正文**快照** `<sessionRoot>/.bases/<笔记名>.md`（放在内容仓库**之外**，不进任何 git 历史）。
   `sha` 由 `contentHashOf()` 给出（FNV-1a over 空白归一化文本 + 长度），因此"只改了空格"不会被算成改动。
2. **`note_status`**（新）：≤0.4 KB 回答"要不要读点东西" —— rev / git / 行数 / 标记数 / 自上次读取的
   `+N/-M 行, 标记 +a/-b (rev X)`，无改动就明确写"无改动"。
3. **`note_diff`**（新）：`format: summary | hunks | marks`，`context` 控制上下文行、`since` 可指定基线 rev；
   `hunks` 是自研 `lineDiffOf`（前缀/后缀裁剪 + LCS DP，超过 `maxCells` 退化为整块替换）→ `hunksOf` → 渲染。
4. **`note_read`**：新增 `mode: auto | window | full`。`auto` 按基线自己判断：首次读全文（`auto-first`）、
   无改动（`auto-same`）、有改动只给增量（`auto-changed`）；**`window` 读取不动基线**（只开个窗口 ≠ 看完了全文），
   只有 `full` 才推进基线。
5. `note_list` 带 `unread`（只给当前打开的那一份：给 160 份笔记逐一算差值是 O(160) 次全文比对，不值）；
   `note_diag` 增加 `rev/git/dirty/lines/chars/contentSha/marks/unread/baseRev/baseAt`；
   每轮注入的 `dsh_window_note_scope` 变量带上这份粗粒度摘要（提示词变量 provider 是同步的、拿不到快照，
   所以它只报缓存值 —— 这是**已知偏差**，已在下面记明）。

**实测（`verify-notes.mjs` 的增量验收段，241 行的笔记，改 1 行）**

| 通道 | 字节 |
|---|---|
| 首次全文读取 `note_read` | 13278 B |
| 改 1 行后 `note_status` | **221 B** |
| 改 1 行后 `note_read({mode:"auto"})` | **298 B** |
| 改 1 行后 `note_diff({format:"hunks"})` | **184 B** |

→ 同一件事从 13278 B 降到 ≈200–300 B，且**与笔记大小无关**：成本只看改动量。这条已写成断言
（`full > 6000 && status < 420 && auto < 700 && hunks < 700`），不是"感觉省了"。

## Phase 3 · 标记归属 + 提交信息带 delta（已完成，`76911cc`）

1. **§P0-4 标记归属**：每条标记记 `author: 'user' | 'agent'`。`note_add_selection`（agent 自己加的）盖 `agent` 章，
   卡片里用户手划的（RPC `addSelection`）是 `user`。`SEL_ITEM` 暴露该字段。
2. **`note_take_new_selections` 默认只取 `user` 的**：此前 agent 为"闭环"新建的标记会在下一轮被当成
   "用户刚划的重点"喂回来，等于自己给自己发指令。现在默认过滤，且新增两个参数：
   `author: user|agent|all`、`redeliver: true`（把**已取用过**的再给一次且**不消耗**取用状态 —— 上下文被压缩后
   重新对齐用；同时，查询 agent 标记不再会顺手吞掉用户还没读过的标记）。
3. **§P1-6 提交信息**：自动提交信息由"时间戳"改为
   `note(content): <git diff --shortstat HEAD 的结果 或 first commit>, 标记 N 条 (rev M)` ——
   一次 `git log` 就能知道改动量级，不必再调工具；调用方显式给的信息（`note(ai): …`）原样保留。

## Phase 4 · 状态文件出 git + `note_create` 立即建仓（已完成，`76911cc`）

1. **§P1-5**：`.note-state.json` 与 `.note-view.json` 一起进笔记仓库的 `.gitignore`；仍在被跟踪的旧仓库
   会**迁移一次**（`git rm --cached` + 一条迁移提交），迁移结果记在状态文件里 —— 所以这次探测是
   "每份笔记一辈子一次"，不是每次切换笔记一次。此前每改一次标记就会产生一个 23 KB 的"内容提交"，
   提交信息还写着"note: ..."，真实内容历史被淹没。
2. **§P1-7**：`note_create` **工具**现在立即为这份新笔记建仓并回报 `gitReady: true`（建仓后紧接着跑
   `.gitignore` 迁移检查）。此前它和导入一样延迟建仓，导致刚成功的 `note_create` 后面跟一个
   `note_diag` 会看到 `gitReady:false` —— 和"仓库坏了"无法区分。
   其余创建路径（卡片「新建」按钮的 `createNote` RPC、文件夹批量导入）**保持延迟**：一次导入 156 份文档
   建 156 个仓库正是让机器卡死的原因，对应的"导入 0 次 git 进程"断言仍然绿。

**本阶段新增断言**：`verify-notes.mjs` 323 条（+12：归属/取用/redeliver/忽略规则/迁移/`gitReady`），
四个套件（selftest / verify-notes / verify-reanchor / verify-durability）全绿。

## Phase 5 · 命名收敛 + 工具合并（已完成，`377dc0f`）

**改名（一个概念一个名字，评审 §P1-9 表逐条落地）**

| 旧名 | 新名 |
|---|---|
| `note_get_selections` | `note_mark_list` |
| `note_take_new_selections` | `note_mark_new` |
| `note_add_selection` / `note_remove_selection` / `note_clear_selections` | `note_mark_add` / `note_mark_remove` / `note_mark_clear` |
| `note_set_color` / `note_set_style` / `note_set_remark` | `note_mark_color` / `note_mark_style` / `note_mark_remark` |
| `note_lists`（与 `note_list` 只差一个 s） | `note_mark_lists` |
| `note_ui` / `note_panel` / `note_goto` | `note_card_ui` / `note_card_panel` / `note_scroll_to` |
| `note_clear` / `note_delete`（危险等级不同而名字没体现） | `note_clear_keep_history` / `note_delete_forever` |
| `note_import_folder` | `note_folder_import` |
| `note_import`（一名两物） | `note_append` / `note_replace` |

**合并（不多花一份 description）**

- `note_patch_many` → **`note_patch({edits:[…]})`**：同一个操作，内部仍从后往前应用；
- `note_checkpoint` → **`note_commit({reason})`**：同一个操作，reason 写进提交信息。

**工具数 33 → 32**（合并 −2、拆名 +1）：每轮常驻的工具面少了一份 description。

**对评审的一处有意偏离（如实记录）**：§P1-9 的迁移策略要求"先加别名指向同一实现，两个 minor 后再删"。
本仓库**没有**加别名窗口：别名 = 每个旧名都多一份工具 description 常驻每一轮上下文，与 §P2-10
"工具面收窄"的目标直接冲突（18 个别名会把工具数顶回 50）。替代做法是把改名与合并**一次性**做完，
并把新名字写进提示词（`note_status → note_read(mode:"auto") → note_diff → 确实需要才 full` 的五条铁律），
同时 README 明写这次改名 —— 习惯靠文档与提示词迁移，不靠并存的旧名。

**验收**：`verify-notes.mjs` **324 条**断言全过；`selftest`（32 工具 + 提示词节）/`verify-reanchor`/
`verify-durability` 全绿；构建闸门 `hostToolHits = 32`；真实浏览器（`http://localhost:3080`）里卡片正常渲染
本会话 160 份笔记的大笔记、控制台 0 error。

> ⚠️ **本次改动包含 host 半，必须重启 dsh 才会加载新的工具面**（客户端半只有注释变化，刷新即可）。
> 重启前，正在运行的会话仍调用旧工具名（旧 bundle 仍在内存里，不会报错）。

## 全部阶段完成情况

| 阶段 | 状态 | 提交 |
|---|---|---|
| Phase 0 · 成本度量（§7.3/§7.4） | ✅ | `787f397` |
| Phase 1 · P0-1 砍回显 + P0-3 提示词铁律 | ✅ | `787f397` |
| Phase 2 · P0-2 增量协议 | ✅ | `fd978e7` |
| Phase 3 · P0-4 标记归属 + P1-6 提交 delta | ✅ | `76911cc` |
| Phase 4 · P1-5 状态出 git + P1-7 note_create 建仓 | ✅ | `76911cc` |
| Phase 5 · P1-9 命名收敛 + 合并 | ✅ | `377dc0f` |

**没有做完的部分（评审里提到、本次未实现，原因如实写在这里）**

1. **§6.1 状态改成 append-only JSONL / 独立状态仓**：这是"写放大与 diff 噪音"的根治方案，但会同时改动
   `.note-state.json` 的读取方（卡片轮询、列表、增量基线、标记再锚定、durability 套件）—— 属于**下一个大版本**的
   数据格式迁移，硬塞进本次会在"改行为"的同时换持久化格式，风险与收益不成比例。本次只做到"状态文件不进 git"（P1-5）。
2. **§6.3 把 emit 推到 agent（推送而非轮询）**：插件已用每轮提示词变量把路铺好（`dsh_window_note_scope`），
   但变量 provider 是**同步**接口、拿不到快照，所以只能注入缓存摘要。真正的事件推送需要宿主侧提供异步变量/注入能力，
   不是本插件单独能实现的。
3. **工具数 ≤18（§P2-10）**：本次从 33 降到 32。继续砍到 18 意味着合并 `note_read/write/patch/find` 这类
   **语义不同**的工具，会把"选错工具"的风险换成"参数记错"的风险 —— 需要新一轮设计评审，不宜顺手做。

---

# 验收记录（Live Acceptance · 真实宿主 + 真实浏览器）

**方法**：不用测试替身 —— 在**重启后的真实 dsh 进程**上，用新工具面（32 个）逐项调用，
并用 Playwright 驱动 `http://localhost:3080` 上**真实运行的卡片**（真实 RPC、真实文件、真实 git）。

## 一、逐项验收（全部通过）

| 验收项 | 证据 |
|---|---|
| P1-7 `note_create` 建仓 | 返回「9 行, **git 已就绪**」；磁盘上 `.git` 已存在，`git log` 有 `note: init` |
| P1-5 状态文件出 git | 新笔记 `.gitignore` = `.note-view.json` + `.note-state.json`；`git ls-files` 只有 `.keep`/`note.md`；`.note-state.json` 不在跟踪列表 |
| P1-6 提交信息带 delta | `note(content): 2 files changed, 6 insertions(+), 3 deletions(-), 标记 2 条 (rev 26)` |
| P0-2 增量协议 | 241 行笔记改 1 行：`note_status` 221 B / `note_read(mode:auto)` 298 B / `note_diff(hunks)` 184 B，而整篇读取 13278 B |
| P0-4 标记归属 | 卡片画的重点（RPC `addSelection`）→ `note_mark_new` 取到；agent 自己 `note_mark_add` 的标记**不会**被 `note_mark_new` 取到；`redeliver:true` 可反复领取且不消耗；`author:"agent"` 单独列出自己加的 |
| 合并 `note_patch({edits})` | 一次改两处（替换 + 删行）：`-11 +6 字符，现 8 行`，且内部从后往前应用无错位 |
| 合并 `note_commit({reason})` | 卡片改了任务框（未提交）→ `note_commit({reason})` → 提交信息就是 reason |
| `note_append` / `note_replace` | 追加与覆盖都成功，且各自立即自动提交 |
| 卡片可点的任务框 | Playwright 真点击 ☐ → 磁盘 `- [ ]` 变 `- [x]` |
| `note_card_ui` | `open` 打开标记列表（2 条，含样式/添加到/改备注/删除）、`float` 拖成独立小窗、`dock`+`close` 收回 |
| `note_card_panel` | `collapse` → 右下角小药丸；`expand` → 卡片回到原停靠位 |
| `note_scroll_to` | 产生一次 jump 事件（`view.jump=1`，带 `jumpAt`） |
| 进退栈持久化 | 刷新页面后宿主里仍有 4 条（`大笔记@965 / spring@1047 / … / 验收·dsh-window@1`），游标 `at=3` 指向当前笔记 |
| `note_mark_lists` | `create` + `add` → 列表里出现《验收清单》1 条；`delete` 清干净 |
| `note_clear_keep_history` | 正文清空、`git log` 6 条历史全在 |
| `note_delete_forever` | 整目录连同 `.git` 删除，笔记数回到 160 |
| 浏览器控制台 | 全程 **0 error / 0 warning** |

## 二、验收发现的 4 个真实缺陷（已修 + 已加回归断言，`5414588`）

真实宿主跑出来的，测试替身里看不出来（因为替身总是"有一份可解析的状态文件"）：

1. **`note_status` 在"还没有基线"时会说「没有改动，不必读正文」** —— 与事实相反（没读过 = 应该读一次）。
   现在明确回答「还没有基线：先 note_read({mode:"auto"}) 读一次」。
2. **`note_diag` 在成功提交后仍说「有未提交改动」** —— `S.touched` 只在切换笔记时才清。现在
   `commit()` 在"真的提交了"和"没有需要提交的改动"两条路径上都会清掉它。
3. **`note_read` / `note_find` / `note_diag` 会 `markTouched()`** —— 只是**读**一下就把笔记标成"有改动"，
   还顺带把 `rev` 自增（使 `rev` 失去"变更计数"的意义）。三个只读工具不再动状态。
4. **增量基线会跨笔记泄漏** —— `load()` 不清 `S.lastRead`：新笔记（还没有状态文件）会继承**上一份笔记**的
   基线，于是 `note_status` 对一份从没读过的笔记回答「自你上次读取（rev 4，0 秒前）」。
   现在 `load()` 复位 `lastRead / unreadText / stateUntracked / stateChecked`。

**验收结论**：四个套件 326 条断言全绿（新增 4 条正是上面 4 个缺陷的回归），真实宿主 + 真实浏览器逐项通过。
