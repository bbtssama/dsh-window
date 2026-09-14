// ── storage model ───────────────────────────────────────────────────────────────
// Per session, per note:
//   <workspace>/<ROOT_DIR>/<NOTES_DIR>/<sessionId>/<noteName>/{note.md,.note-state.json,.git}
// Session isolation is the PATH, not a permission check: another session's note is not
// under this session's subtree at all. Each note owns its own git repository, which is
// what makes "clear keeps history" and "delete removes history too" both exact.
let ROOT_DIR = 'dsh-window'
let NOTES_DIR = 'note'
let DEFAULT_NOTE = 'note'
let NOTE_FILE = 'note.md'
const SESSION_FILE = '.session.json'
const STATE_FILE = '.note-state.json'
const BAD_STATE_FILE = '.note-state.bad.json'
// Where the reader had got to in this note (a line number plus a short anchor). It is a
// separate file on purpose: the selection state is written under a version guard, and a
// scroll position is written far more often and must never fight that guard. It is also
// added to the note's own .gitignore, so a reading position never shows up in the note's
// history as a commit.
const VIEW_FILE = '.note-view.json'
// A remark is a margin note the reader types about one selected passage. Long enough for a
// sentence or a short list, short enough that it cannot become a second note.
const MAX_REMARK_LEN = 1000
const STATE_VERSION = 1
const SESSION_STATE_VERSION = 1
const MAX_NAME_LEN = 48
const MAX_IMPORT_BYTES = 8 * 1024 * 1024
// Highlight colour a selection carries. Agent-visible enum; the client paints it
// as an overlay behind the text, so overlapping ranges simply blend.
const COLORS = { yellow: 1, pink: 1, green: 1, black: 1, none: 1 }
/**
 * How a mark draws itself. The colour is the wash behind the text (`none` = no wash at all),
 * and the two text styles change the glyphs themselves. They are INDEPENDENT flags, not one
 * choice: a passage can be pink AND italic AND underlined at once. The retired single `style`
 * field (highlight / italic / underline) is migrated into the two flags on read.
 */
const STYLES = { highlight: 1, italic: 1, underline: 1, both: 1, 'italic+underline': 1 }
/** Read the two flags out of a record that may still carry the retired single `style` field. */
function lookFlags(raw) {
  const legacy = raw && typeof raw.style === 'string' ? raw.style : ''
  const both = legacy === 'both' || legacy === 'italic+underline'
  return {
    italic: (raw && raw.italic === true) || legacy === 'italic' || both,
    underline: (raw && raw.underline === true) || legacy === 'underline' || both,
  }
}
/** The retired single field, derived, so an older reader still understands the mark. */
function styleLabel(italic, underline) {
  if (italic && underline) return 'italic+underline'
  if (italic) return 'italic'
  if (underline) return 'underline'
  return 'highlight'
}
const SEED_TEXT = '# 我的知识笔记\n\n> 在对话里向 DeepSeek 提知识性问题，讲解会自动写进这份笔记。\n> 在卡片里长按文本可以「选中」重点，选中的内容会以荧光标出并同步给 AI。\n'
const SECTION_NAME = 'dsh-window'
const B64T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function linesOf(t) { return String(t).replace(/\r\n?/g, '\n').split('\n') }
function isoNow() { return new Date().toISOString() }
function intOr(v, d) { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : d }
function b64(u8) {
  let out = ''
  for (let i = 0; i < u8.length; i += 3) {
    const b0 = u8[i]
    const b1 = i + 1 < u8.length ? u8[i + 1] : undefined
    const b2 = i + 2 < u8.length ? u8[i + 2] : undefined
    const e0 = b0 >> 2
    const e1 = ((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)
    const e2 = b1 === undefined ? 64 : (((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6))
    const e3 = b2 === undefined ? 64 : (b2 & 63)
    out += B64T[e0] + B64T[e1] + (e2 === 64 ? '=' : B64T[e2]) + (e3 === 64 ? '=' : B64T[e3])
  }
  return out
}
function mimeOf(p) {
  const s = String(p).toLowerCase()
  if (/\.png$/.test(s)) return 'image/png'
  if (/\.jpe?g$/.test(s)) return 'image/jpeg'
  if (/\.gif$/.test(s)) return 'image/gif'
  if (/\.webp$/.test(s)) return 'image/webp'
  if (/\.svg$/.test(s)) return 'image/svg+xml'
  if (/\.bmp$/.test(s)) return 'image/bmp'
  if (/\.avif$/.test(s)) return 'image/avif'
  if (/\.ico$/.test(s)) return 'image/x-icon'
  return 'application/octet-stream'
}
function indexOfPos(text, line, col) {
  const ls = linesOf(text)
  let idx = 0
  const upto = Math.max(1, line) - 1
  for (let i = 0; i < upto && i < ls.length; i++) idx += ls[i].length + 1
  return idx + Math.max(0, col)
}
function posOfIndex(text, index) {
  const ls = linesOf(text)
  let acc = 0
  const lim = Math.max(0, index)
  for (let i = 0; i < ls.length; i++) {
    const end = acc + ls[i].length
    if (lim <= end) return { line: i + 1, col: lim - acc }
    acc = end + 1
  }
  const last = ls.length
  return { line: last, col: ls[last - 1].length }
}
function sliceRange(text, s) {
  const a = indexOfPos(text, s.startLine, s.startCol)
  const b = indexOfPos(text, s.endLine, s.endCol)
  return text.slice(Math.min(a, b), Math.max(a, b))
}
function sortSelections(list) {
  return list.slice().sort(function (x, y) { return (x.startLine - y.startLine) || (x.startCol - y.startCol) || (x.seq - y.seq) })
}
function normalizeSel(raw) {
  if (raw === null || typeof raw !== 'object') return null
  const text = typeof raw.text === 'string' ? raw.text : ''
  const seq = intOr(raw.seq, 0)
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : 'sel-' + seq,
    seq: seq,
    startLine: Math.max(1, intOr(raw.startLine, 1)),
    startCol: Math.max(0, intOr(raw.startCol, 0)),
    endLine: Math.max(1, intOr(raw.endLine, 1)),
    endCol: Math.max(0, intOr(raw.endCol, 0)),
    text: text,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : isoNow(),
    fetched: raw.fetched === true,
    stale: raw.stale === true,
    color: COLORS[raw.color] ? raw.color : 'yellow',
    italic: lookFlags(raw).italic,
    underline: lookFlags(raw).underline,
    // A remark the reader typed about this passage ("this is the part I keep forgetting",
    // "ask about this in the interview"). Free text, delivered to the agent together with
    // the selection: it is the one field that carries the user's own words.
    remark: cleanRemark(raw.remark),
  }
}
/** One place that decides what a remark may look like, so every path agrees. */
function cleanRemark(raw) {
  if (typeof raw !== 'string') return ''
  // Newlines are kept (a remark may be a short list) but the length is bounded: this is a
  // margin note, not a second note.
  return raw.replace(/\r\n?/g, '\n').trim().slice(0, MAX_REMARK_LEN)
}
// How many custom mark lists a session may keep, how long a name may be and how many marks a
// list may hold. A collection the reader builds by hand needs a ceiling for the same reason a
// remark does: the whole thing travels inside every state poll.
const MAX_LISTS = 20
const MAX_LIST_NAME = 40
const MAX_LIST_ITEMS = 500
/** One place that decides what a custom mark list may look like, so every path agrees. */
function cleanLists(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  const seen = {}
  for (let i = 0; i < raw.length && out.length < MAX_LISTS; i++) {
    const r = raw[i]
    if (r === null || typeof r !== 'object' || Array.isArray(r)) continue
    const name = String(r.name === undefined ? '' : r.name).replace(/\s+/g, ' ').trim().slice(0, MAX_LIST_NAME)
    if (name === '' || seen[name] === 1) continue
    seen[name] = 1
    const items = []
    const rawItems = Array.isArray(r.items) ? r.items : []
    for (let k = 0; k < rawItems.length && items.length < MAX_LIST_ITEMS; k++) {
      const it = rawItems[k]
      if (it === null || typeof it !== 'object' || Array.isArray(it)) continue
      const note = sanitizeNoteName(it.note)
      const markId = String(it.markId === undefined ? '' : it.markId).replace(/\s+/g, '').slice(0, 60)
      if (note === '' || markId === '') continue
      let dup = false
      for (let d = 0; d < items.length; d++) if (items[d].note === note && items[d].markId === markId) dup = true
      if (dup) continue
      items.push({ note: note, markId: markId, addedAt: typeof it.addedAt === 'string' ? it.addedAt : isoNow() })
    }
    out.push({ id: typeof r.id === 'string' && r.id !== '' ? r.id.slice(0, 48) : 'list-' + (out.length + 1), name: name, items: items })
  }
  return out
}
function reanchor(sel, next) {
  const needle = sel.text
  if (typeof needle === 'string' && needle.length > 0) {
    const at = next.indexOf(needle)
    if (at >= 0) {
      const st = posOfIndex(next, at)
      const en = posOfIndex(next, at + needle.length)
      return Object.assign({}, sel, { startLine: st.line, startCol: st.col, endLine: en.line, endCol: en.col, stale: false })
    }
  }
  const nl = linesOf(next).length
  return Object.assign({}, sel, { startLine: Math.min(Math.max(1, sel.startLine), nl), endLine: Math.min(Math.max(1, sel.endLine), nl), stale: true })
}
/**
 * True when a selection was a cover of the entire previous document. Tolerance is
 * deliberately loose on the tail: an append adds a line, and the trailing newline
 * makes `linesOf` one longer than the visible text, so an exact match on the final
 * line number would miss the very case this exists to fix. The start must be at the
 * document's first character, which cannot happen by accident for a partial selection.
 */
function isWholeDocCover(sel, prevLines) {
  if (sel.startLine !== 1 || sel.startCol !== 0) return false
  const last = prevLines.length
  // Either it already reaches the last line, or it reaches the last non-empty line
  // (the shape the card produces before the trailing newline is counted).
  if (sel.endLine >= last) return true
  if (sel.endLine >= last - 1) {
    const tail = prevLines[last - 1]
    // The line after it must be empty, i.e. the selection really did run to the end.
    return tail === '' || sel.endCol >= (prevLines[sel.endLine - 1] || '').length
  }
  return false
}
function remapSelections(list, prev, next) {  if (prev === next) return list
  const a = linesOf(prev)
  const b = linesOf(next)
  let p = 0
  while (p < a.length && p < b.length && a[p] === b[p]) p++
  let s = 0
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++
  const midStart = p
  const midEnd = a.length - s
  const shift = b.length - a.length
  const out = []
  for (let i = 0; i < list.length; i++) {
    const sel = list[i]
    const s0 = sel.startLine - 1
    const e0 = sel.endLine - 1
    // A selection that covered the *whole* document is content-defined, not
    // coordinate-defined: what it means is "all of the note". Shifting or freezing its
    // endpoints is wrong in both directions — appending a line left a black cover stuck
    // at the old final line (it fell into the "before the edit" fast path, since the
    // appended line counted as trailing common context and p landed past it), and
    // prepending text made it start mid-document. Re-derive it from the new document.
    // Checked first, before every coordinate shortcut.
    if (isWholeDocCover(sel, a) && b.length !== a.length) {
      out.push(Object.assign({}, sel, { startLine: 1, startCol: 0, endLine: b.length, endCol: b[b.length - 1].length, stale: false }))
      continue
    }
    if (e0 < midStart) { out.push(sel); continue }
    if (s0 >= midEnd) { out.push(Object.assign({}, sel, { startLine: sel.startLine + shift, endLine: sel.endLine + shift })); continue }
    out.push(reanchor(sel, next))
  }
  return sortSelections(out)
}
return {
  apply(ctx) {
    const fs = ctx.get('fs')
    const shell = ctx.get('shell')
    const systemPrompt = ctx.get('systemPrompt')
    const policy = ctx.get('sandboxPolicy')
    const agents = ctx.get('agents')
    const sessions = ctx.get('sessions')
    let base = ''
    let baseFrom = ''
    let confirmed = false
    let pathCache = null
    let loadedBase = ''
    let policyCache = null
    let sessionId = ''
    let stateCorrupt = false
    // The note this session currently has open. Resolved from `<sessionRoot>/.session.json`;
    // '' means "this session has no note yet".
    let activeNote = ''
    let sessionNotes = null
    // True only after `/window-note start` (or `stop` to undo it). The card's rule is: show
    // itself when this session HAS a note, otherwise only when it was summoned explicitly.
    // Without it a session with no notes would show an empty panel the user never asked for.
    let summoned = false
    // A revision for state that is NOT the note text — the summon flag, the note list, the
    // active note. The card polls `state` with the note revision and the host answered
    // "unchanged" whenever the text matched, so `/window-note start` only took effect after a
    // full page reload (the first request sends revision -1 and therefore always gets a full
    // answer). Comparing this counter as well makes such changes land on the next poll.
    let uiRev = 0
    // ── custom mark lists (per session) ──────────────────────────────────────────────
    // Two built-in views (this note / this session) are not enough for the reader who is
    // collecting "面试要背的" out of a whole session: a custom list is a NAMED collection of
    // marks, each entry pointing at (note, markId), and it lives in the session state so it
    // survives a reload and is visible to the agent as data rather than as a UI accident.
    let lists = []
    // ── fine-grained change events (per session) ─────────────────────────────────────
    // Every tool and RPC that mutates something appends a topic here, and the card reads them on
    // its (now much faster, when visible) state poll. A topic says WHICH part of the UI went
    // stale, so the card refreshes that part instead of guessing from a revision counter:
    //   text  note content        marks  marks of the active note   notes  the note list
    //   lists custom mark lists   view   a requested reading position  git  commit state
    //   ui    a queued view command (note_ui / note_panel)
    let events = []
    let eventSeq = 0
    // ── UI commands (per session) ────────────────────────────────────────────────────
    // The card owns its own view state (which tab, whether the list is floating, the
    // click-to-summon switch), all of it in browser localStorage that the host cannot touch.
    // So the agent asks for a view change here and the card performs it on its next poll:
    // an append-only queue with ids, which the card acknowledges by id.
    let uiQueue = []
    let uiSeq = 0
    // ── per-session stores ───────────────────────────────────────────────────────────
    // This plugin instance is shared by every session of the profile, so all of the state
    // above is really per session: the bound workspace, the open note, the loaded text and
    // selections, the on-disk versions and the initialisation promise. A closure cannot
    // re-point its own variables, so the live values above are swapped in and out of a
    // record while a single global lock is held for the whole operation (registerToolLocked
    // / handleLocked below). That lock is what makes the swap safe: nothing else can swap
    // the pointers while a body is awaiting file I/O.
    const stores = new Map()
    let currentStore = null
    function freshState() {
      return { text: '', selections: [], seq: 0, revision: 1, savedAt: null, commitHash: '', committedAt: null, gitReady: false, gitTrace: '', error: '', fileExists: false, touched: false, stateVersion: STATE_VERSION }
    }
    function newStore(sid) {
      return {
        sid: sid, base: '', baseFrom: '', confirmed: false, pathCache: null, loadedBase: '',
        policyCache: null, sessionId: sid, stateCorrupt: false,
        activeNote: '', sessionNotes: null, summoned: false, uiRev: 0,
        lists: [], uiQueue: [], uiSeq: 0, events: [], eventSeq: 0,
        S: freshState(), diskVersions: new Map(), loading: null,
      }
    }
    function saveCurrent() {
      const st = currentStore
      if (!st) return
      st.base = base; st.baseFrom = baseFrom; st.confirmed = confirmed
      st.pathCache = pathCache; st.loadedBase = loadedBase; st.policyCache = policyCache
      st.sessionId = sessionId; st.stateCorrupt = stateCorrupt
      st.activeNote = activeNote; st.sessionNotes = sessionNotes
      st.summoned = summoned; st.uiRev = uiRev
      st.lists = lists; st.uiQueue = uiQueue; st.uiSeq = uiSeq
      st.events = events; st.eventSeq = eventSeq
      st.S = S; st.diskVersions = diskVersions; st.loading = loading
    }
    function activate(sid) {
      if (currentStore && currentStore.sid === sid) { currentStore.sessionId = sessionId; return currentStore }
      saveCurrent()
      let st = stores.get(sid)
      if (st === undefined) { st = newStore(sid); stores.set(sid, st) }
      base = st.base; baseFrom = st.baseFrom; confirmed = st.confirmed
      pathCache = st.pathCache; loadedBase = st.loadedBase; policyCache = st.policyCache
      sessionId = st.sessionId; stateCorrupt = st.stateCorrupt
      activeNote = st.activeNote; sessionNotes = st.sessionNotes
      summoned = st.summoned === true; uiRev = intOr(st.uiRev, 0)
      lists = Array.isArray(st.lists) ? st.lists : []
      uiQueue = Array.isArray(st.uiQueue) ? st.uiQueue : []
      uiSeq = intOr(st.uiSeq, 0)
      events = Array.isArray(st.events) ? st.events : []
      eventSeq = intOr(st.eventSeq, 0)
      S = st.S; diskVersions = st.diskVersions; loading = st.loading
      currentStore = st
      return st
    }
    /** Serialize every store-touching operation, then activate one session inside it. */
    async function withStore(sid, fn) {
      return await withNoteLock('note-store', async function () {
        if (sid) {
          activate(sid)
          // First touch of a session: resolve its workspace and load its note space.
          if (!confirmed) bindSession(sid)
          await ensureLoaded()
        }
        try { return await fn() } finally { saveCurrent() }
      })
    }
    /** Register a model tool whose whole body runs inside the store lock. */
    function registerToolLocked(def) {
      const inner = def.execute
      def.execute = async function (args, exec) {
        const sid = sessionIdOfExec(exec)
        return await withStore(sid, function () { return inner.call(def, args, exec) })
      }
      return harness.registerTool(ctx, def)
    }
    /** Register an RPC handler whose whole body runs inside the store lock. */
    function handleLocked(method, fn) {
      return harness.handle(method, async function (args) {
        const sid = args && typeof args.sessionId === 'string' ? args.sessionId : ''
        return await withStore(sid, function () { return fn(args) })
      })
    }
    function headerOf(a) { try { return a && a.session && a.session.header ? a.session.header : null } catch (err) { return null } }
    function cwdOfSession(ses) { try { const hd = ses && ses.header ? ses.header : null; return hd && typeof hd.cwd === 'string' ? hd.cwd : '' } catch (err) { return '' } }
    function fallbackBase() { try { if (policy && typeof policy.workspaceRoot === 'string' && policy.workspaceRoot) return policy.workspaceRoot } catch (err) { } return '.' }
    function setBase(next, from) {
      const n = String(next).replace(/[\\/]+$/, '') || '.'
      if (n === base) { baseFrom = from; return false }
      base = n
      baseFrom = from
      pathCache = null
      return true
    }
    /**
     * Fold a note name into a safe directory segment. CJK/letters/digits survive so
     * "会议纪要" stays readable; separators, control characters and Windows-reserved
     * characters fold to '-'. A name that folds to nothing is rejected by the caller.
     */
    function sanitizeNoteName(raw) {
      let s = String(raw === null || raw === undefined ? '' : raw).normalize('NFC').trim()
      s = s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
      s = s.replace(/\s+/g, ' ')
      // A name must be ONE path segment: no separators (folded above), no ".." anywhere
      // (folded here) and no leading/trailing punctuation that Windows dislikes.
      s = s.replace(/\.{2,}/g, '-').replace(/^\.+/, '').replace(/\.+$/, '')
      s = s.replace(/-{2,}/g, '-').replace(/^-+/, '').replace(/-+$/, '').trim()
      if (s.length > MAX_NAME_LEN) s = s.slice(0, MAX_NAME_LEN).replace(/[-. ]+$/, '')
      return s
    }
    function noteNameError(raw) {
      const s = sanitizeNoteName(raw)
      if (!s) return '笔记名不能为空（或只包含路径分隔符/保留字符）'
      if (s !== String(raw === null || raw === undefined ? '' : raw).trim()) return ''
      return ''
    }
    function sessionRoot() {
      if (!sessionId) return ''
      return base + '/' + ROOT_DIR + '/' + NOTES_DIR + '/' + sessionId
    }
    // ── the asset mirror ─────────────────────────────────────────────────────────────
    // Everything note-related lives under `<工作区>/dsh-window/note/`: one directory per session,
    // and the mirror at `note/_assets/`. Assets are ALWAYS copies inside that tree — rendering
    // never reads a path outside it — and one coarse repository (`note/_assets/.git`) tracks the
    // whole mirror, while each note keeps its own repository for its own text.
    const ASSETS_DIR = '_assets'
    const ASSETS_INDEX = 'index.json'
    const NOTE_META = 'note.json'
    // What a mirror never copies: other version-control stores and dependency/build caches. Kept
    // deliberately short — everything else IS copied, because a reference may point anywhere.
    const MIRROR_SKIP_DIRS = ['.git', '.hg', '.svn', 'node_modules', '__pycache__', '.venv', 'venv', '.tox', '.idea', '.vscode', '$RECYCLE.BIN', 'System Volume Information']
    const MIRROR_SKIP_FILES = ['Thumbs.db', 'desktop.ini', '.DS_Store']
    // A guard, not a policy: pointing the import at a whole drive must fail loudly instead of
    // filling the disk. Both are far above any real note folder.
    const MIRROR_MAX_FILES = 20000
    const MIRROR_MAX_BYTES = 4 * 1024 * 1024 * 1024
    /** `<工作区>/dsh-window/note` — the root of every note-related file. */
    function noteSpaceRoot() { return base + '/' + ROOT_DIR + '/' + NOTES_DIR }
    function assetsRoot() { return noteSpaceRoot() + '/' + ASSETS_DIR }
    function assetsIndexPath() { return assetsRoot() + '/' + ASSETS_INDEX }
    function noteMetaPath(forName) {
      const name = forName === undefined || forName === null || forName === '' ? activeNote : String(forName)
      return sessionRoot() + '/' + name + '/' + NOTE_META
    }
    /** A stable, filesystem-safe id for one source folder: name + a hash of its absolute path. */
    function assetRootIdFor(dir) {
      const norm = String(dir).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
      const seg = norm.split('/').filter(function (x) { return x !== '' })
      const base0 = sanitizeNoteName(seg.length ? seg[seg.length - 1] : 'root') || 'root'
      // FNV-1a, 32-bit: no crypto service is needed and the id only has to be stable and unique
      // enough to keep two different folders apart.
      let h = 0x811c9dc5
      for (let i = 0; i < norm.length; i++) { h ^= norm.charCodeAt(i); h = (h * 0x01000193) >>> 0 }
      return base0 + '-' + h.toString(16).padStart(8, '0')
    }
    async function readAssetsIndex() {
      try {
        const raw = await readIfExists(assetsIndexPath())
        if (raw === null) return { v: 1, roots: [] }
        const parsed = JSON.parse(raw)
        const roots = parsed && Array.isArray(parsed.roots) ? parsed.roots : []
        return { v: 1, roots: roots }
      } catch (err) { return { v: 1, roots: [] } }
    }
    async function writeAssetsIndex(index) {
      await mkdirAt(assetsRoot())
      const payload = { v: 1, roots: (index && index.roots) || [] }
      const text = JSON.stringify(payload, null, 2) + '\n'
      try { await writeAt(assetsIndexPath(), text) } catch (err) { fail('写入素材索引', err) }
    }
    async function readNoteMeta(forName) {
      try {
        const raw = await readIfExists(noteMetaPath(forName))
        if (raw === null) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (err) { return {} }
    }
    async function writeNoteMeta(patch, forName) {
      const cur = await readNoteMeta(forName)
      const next = Object.assign({}, cur, patch || {}, { v: 1 })
      try { await writeAt(noteMetaPath(forName), JSON.stringify(next, null, 2) + '\n') } catch (err) { fail('写入笔记元数据', err) }
      return next
    }
    /** Recursive size/count of a mirrored tree (for the report, and for the guard). */
    /**
     * The byte size of one listed entry. `FsDirEntry.size` is OPTIONAL in the fs contract and the
     * Windows implementation leaves it undefined, so reading it alone reported "0 字节" for every
     * folder: a real 26 MB mirror recorded `bytes: 0` in `_assets/index.json`, every import/sync
     * said "0 KB", and the MIRROR_MAX_BYTES guard could never fire. Ask the entry first — it is
     * free when a backend does fill it — and lstat it when the entry stays silent.
     */
    async function entrySize(e, full) {
      const direct = e && (e.size !== undefined ? e.size : e.bytes)
      if (direct !== undefined) return intOr(direct, 0)
      try {
        const target = await fs.resolve(full, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
        const st = await fs.lstat(target, undefined)
        return intOr(st && (st.size !== undefined ? st.size : st.bytes), 0)
      } catch (err) { return 0 }
    }
    async function countTree(dir) {
      let files = 0
      let bytes = 0
      const stack = [dir]
      while (stack.length) {
        const cur = stack.pop()
        let entries = []
        try {
          const target = await fs.resolve(cur, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
          entries = await fs.listDir(target, undefined)
        } catch (err) { continue }
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i]
          const name = e && e.name ? String(e.name) : ''
          if (name === '') continue
          const full = cur + '/' + name
          const isDir = e && (e.kind === 'directory' || e.type === 'directory' || e.isDirectory === true)
          if (isDir) { stack.push(full); continue }
          files += 1
          bytes += await entrySize(e, full)
        }
      }
      return { files: files, bytes: bytes }
    }
    /**
     * Every note space inside a tree — the plugin's own furniture, see isNoteSpaceDir.
     *
     * A folder being mirrored can CONTAIN a note space: a workspace that lives inside it, or the
     * folder's own copy of one. Mirroring that copies the mirror into the mirror. Measured on a
     * real 2374-file folder: 1203 of the 3542 entries in its mirror (24.9 MB) were exactly such a
     * self-copy, and a workspace holding the mirror grows one level deeper per import. Skipping it
     * is not a speed-up, it is what keeps a mirror finite. Directories that hold one are not
     * descended into, so the walk stays cheap even when it finds a whole copy of itself.
     */
    async function findNoteSpaceDirs(dir) {
      const out = []
      const stack = [String(dir).replace(/\\/g, '/').replace(/\/+$/, '')]
      let seen = 0
      while (stack.length && seen < 50000) {
        const cur = stack.pop()
        let entries = []
        try {
          const target = await fs.resolve(cur, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
          entries = await fs.listDir(target, undefined)
        } catch (err) { continue }
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i]
          const name = e && e.name ? String(e.name) : ''
          if (name === '' || MIRROR_SKIP_DIRS.indexOf(name) >= 0) continue
          const isDir = e && (e.kind === 'directory' || e.type === 'directory' || e.isDirectory === true)
          if (!isDir) continue
          seen += 1
          const full = cur + '/' + name
          if (isNoteSpaceDir(name, cur)) { out.push(full); continue }
          stack.push(full)
        }
      }
      return out
    }
    /**
     * Mirror one source folder into the asset area.
     *
     * The copy itself goes through the shell (robocopy / `cp -R`) because the fs service can read
     * bytes but has no binary WRITE — a text write would corrupt an image. The exclusion list is
     * applied after the copy, which also keeps the command simple enough for the test shell.
     *
     * `opts.incremental` copies only files that are newer at the source (robocopy /XO, cp -Ru):
     * re-syncing a 26MB folder must not re-copy 26MB every time.
     */
    /**
     * The shell command that deletes a directory tree.
     *
     * The fs service cannot do it: the shipped Windows implementation exposes only resolve / stat /
     * lstat / readText / streamText / readBytes / listDir / writeText / editText — no rm, no mkdir —
     * so every removal goes through the shell. And `Remove-Item` is not enough on its own: it fails
     * on a tree whose deepest path passes MAX_PATH ("Could not find a part of the path
     * '.gitignore'", measured on a 274-character path), which is how 1185 files / 24.99 MB of a
     * nested mirror survived its own deletion. `cmd /c rmdir /s /q "\\?\<path>"` removes those
     * (also measured, on the same tree).
     */
    function removeTreeCmd(p, win) {
      const s = String(p).replace(/\/+$/, '')
      if (win) return 'cmd /c rmdir /s /q "' + '\\\\?\\' + s.replace(/\//g, '\\') + '"'
      return 'rm -rf "' + s + '"'
    }
    async function mirrorFolder(srcDir, rootId, opts) {
      const incremental = !!(opts && opts.incremental)
      const src = String(srcDir).replace(/\\/g, '/').replace(/\/+$/, '')
      const dest = assetsRoot() + '/' + rootId
      await mkdirAt(assetsRoot())
      await mkdirAt(dest)
      if (shell === undefined) return { ok: false, error: 'shell 服务不可用（镜像需要它来复制文件）' }
      const q = function (p) { return '"' + String(p) + '"' }
      const isWin = /^[A-Za-z]:/.test(src) || String(srcDir).indexOf('\\') >= 0
      const commands = []
      // A note space inside the source is excluded by its absolute path: a bare name would also
      // skip a legitimate `_assets` folder, and robocopy refuses a wildcard in a path component
      // (`/XD "*\note\_assets"` exits 16 without copying anything — measured).
      const nested = await findNoteSpaceDirs(src)
      if (isWin) {
        // robocopy: /E keeps the tree, /XO skips files that are not newer, /XD and /XF keep the
        // junk out of the copy entirely (copy-then-delete re-copied every excluded file on every
        // sync). Exit codes 0..7 mean success (1 = copied, 2 = extras present, 3 = both…).
        // The nested paths go in with BACKSLASHES: robocopy silently ignores a `/XD` whose path
        // uses forward slashes (measured — everything was copied anyway), while the same path with
        // native separators excludes exactly that directory. Getting this wrong still produced a
        // clean mirror, because the post-copy sweep deleted the nested copy — after copying 25 MB
        // on every single sync.
        const xd = MIRROR_SKIP_DIRS.map(function (d) { return '/XD ' + q(d) }).concat(nested.map(function (d) { return '/XD ' + q(d.replace(/\//g, '\\')) })).join(' ')
        const xf = MIRROR_SKIP_FILES.map(function (f) { return '/XF ' + q(f) }).join(' ')
        commands.push('robocopy ' + q(src) + ' ' + q(dest) + ' /E /NFL /NDL /NJH /NJS /NP /R:1 /W:1 ' + xd + ' ' + xf + (incremental ? ' /XO' : ''))
      } else {
        commands.push('cp -R' + (incremental ? 'u' : '') + ' ' + q(src + '/.') + ' ' + q(dest))
      }
      for (let i = 0; i < MIRROR_SKIP_DIRS.length; i++) {
        const junk = dest + '/' + MIRROR_SKIP_DIRS[i]
        commands.push(removeTreeCmd(junk, isWin))
      }
      for (let i = 0; i < MIRROR_SKIP_FILES.length; i++) {
        const junk = dest + '/' + MIRROR_SKIP_FILES[i]
        commands.push(isWin ? 'Remove-Item -LiteralPath ' + q(junk) + ' -Force -ErrorAction SilentlyContinue' : 'rm -f ' + q(junk))
      }      for (let i = 0; i < commands.length; i++) {
        const req = { command: commands[i], workdir: base, timeoutMs: 600000 }
        if (policyCache !== null) req.sandboxPolicy = policyCache
        let res = null
        try {
          const spec = shell.resolve(req)
          res = await shell.run(spec)
        } catch (err) {
          if (i === 0) return { ok: false, error: '镜像失败: ' + ((err && err.message) || String(err)) }
          continue
        }
        const code = res && typeof res.exitCode === 'number' ? res.exitCode : 0
        const copyOk = isWin ? code < 8 : code === 0
        if (i === 0 && !copyOk) {
          const errText = res && res.stderr && typeof res.stderr.text === 'string' ? res.stderr.text.trim() : ''
          return { ok: false, error: '镜像失败（退出码 ' + code + '）: ' + errText.slice(0, 300) }
        }
        // The copy has landed: drop every nested asset area the mirror now holds. This enforces
        // the exclusion on a backend that has none (`cp -R` copies first) and cleans up what an
        // earlier version already copied. Only the MIRROR is touched — the source keeps its own.
        if (i === 0) {
          const junk = await findNoteSpaceDirs(dest)
          for (let j = 0; j < junk.length; j++) commands.push(removeTreeCmd(junk[j], isWin))
        }
      }
      return { ok: true, dest: dest, incremental: incremental }
    }
    /** The mirror has ONE repository, and it tracks the whole asset area. */
    async function ensureAssetsGit() {
      if (shell === undefined) return false
      const dir = assetsRoot()
      await mkdirAt(dir)
      const probe = await runGitIn(dir, 'rev-parse --is-inside-work-tree')
      if (probe.ok) return true
      const init = await runGitIn(dir, 'init -q')
      if (!init.ok) return false
      await runGitIn(dir, 'config user.name "dsh-window"')
      await runGitIn(dir, 'config user.email "dsh-window@local"')
      return true
    }
    async function commitAssets(message) {
      if (!(await ensureAssetsGit())) return { ok: false, error: '素材仓库未就绪' }
      const dir = assetsRoot()
      await runGitIn(dir, 'add -A')
      const status = await runGitIn(dir, 'status --porcelain')
      if (status.ok && status.out === '') return { ok: true, nothing: true, hash: '' }
      const msg = String(message || ('assets: ' + isoNow())).replace(/"/g, "'")
      const c = await runGitIn(dir, 'commit -q -m "' + msg + '"')
      if (!c.ok) return { ok: false, error: '素材仓库提交失败: ' + (c.err || c.out) }
      const rev = await runGitIn(dir, 'rev-parse --short HEAD')
      return { ok: true, hash: rev.ok ? rev.out : '' }
    }
    /** Every local (non-http) reference in a note's text: images, and other files it links to. */
    function localRefsOf(text) {
      const out = []
      const seen = {}
      const push = function (raw, kind) {
        const p = String(raw || '').trim()
        if (p === '' || /^[a-z]+:\/\//i.test(p) || p.charAt(0) === '#' || p.indexOf('mailto:') === 0) return
        if (seen[p]) return
        seen[p] = 1
        out.push({ raw: p, kind: kind })
      }
      const md = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
      let m = md.exec(text)
      while (m !== null) { push(m[1], 'image'); m = md.exec(text) }
      const html = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi
      m = html.exec(text)
      while (m !== null) { push(m[1], 'image'); m = html.exec(text) }
      const link = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
      m = link.exec(text)
      while (m !== null) { push(m[1], /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(m[1]) ? 'image' : 'file'); m = link.exec(text) }
      return out
    }
    /** Which of a note's references actually exist in its mirror — the "图没了" report. */
    async function referenceReport(forName) {
      const meta = await readNoteMeta(forName)
      const root = typeof meta.assetRoot === 'string' ? meta.assetRoot : ''
      const noteName = forName === undefined || forName === null || forName === '' ? activeNote : String(forName)
      let text = ''
      if (noteName === activeNote) text = String(S.text)
      else {
        try {
          const raw = await readIfExists(sessionRoot() + '/' + noteName + '/' + NOTE_FILE)
          if (raw !== null) text = String(raw)
        } catch (err) { }
      }
      const refs = localRefsOf(text)
      const missing = []
      let hit = 0
      const mirrorBase = root === '' ? '' : (noteSpaceRoot() + '/' + root.replace(/^.*?_assets\//, ASSETS_DIR + '/'))
      for (let i = 0; i < refs.length; i++) {
        const r = refs[i]
        // The same textual normalisation the asset resolver uses, so this report cannot disagree
        // with what the card will actually do.
        const rel = r.raw.replace(/\\/g, '/').split('/').reduce(function (acc, seg) {
          if (seg === '' || seg === '.') return acc
          if (seg === '..') { acc.pop(); return acc }
          acc.push(seg)
          return acc
        }, []).join('/')
        let found = false
        if (mirrorBase !== '' && rel !== '') {
          try {
            const target = await fs.resolve(mirrorBase + '/' + rel)
            const st = await fs.lstat(target)
            found = st !== undefined && st !== null
          } catch (err) { found = false }
        }
        if (found) hit += 1
        else if (r.kind === 'image') missing.push(r.raw)
      }
      return { total: refs.length, images: refs.filter(function (x) { return x.kind === 'image' }).length, hit: hit, missing: missing, root: root }
    }
    /**
     * Re-sync one note with the folder it was imported from: mirror the folder again (incrementally)
     * and, if the source `.md` changed, take its new text — re-anchoring the marks and putting the
     * reader back where they were (the anchor text decides, so an inserted paragraph does not
     * throw the position away).
     */
    async function syncNoteFromOrigin(name) {
      const meta = await readNoteMeta(name)
      const origin = typeof meta.origin === 'string' ? meta.origin : ''
      const root = typeof meta.assetRoot === 'string' ? meta.assetRoot : ''
      if (origin === '') return { ok: false, error: '这份笔记不是从文件夹导入的，没有可同步的来源', changed: false, files: 0, bytes: 0, refs: null }
      const cut = origin.lastIndexOf('/')
      const sourceDir = cut > 0 ? origin.slice(0, cut) : origin
      const sourceFile = origin
      const rootId = root.replace(/^.*?_assets\//, '')
      const mirror = await mirrorFolder(sourceDir, rootId, { incremental: true })
      if (!mirror.ok) return { ok: false, error: String(mirror.error), changed: false, files: 0, bytes: 0, refs: null }
      const counted = await countTree(assetsRoot() + '/' + rootId)
      const index = await readAssetsIndex()
      const roots = index.roots.map(function (r) {
        if (r && r.id === rootId) return Object.assign({}, r, { files: counted.files, bytes: counted.bytes, mirroredAt: isoNow() })
        return r
      })
      await writeAssetsIndex({ roots: roots })
      let sourceText = null
      try {
        const raw = await readIfExists(sourceFile)
        if (raw !== null) sourceText = String(raw).replace(/\r\n?/g, '\n')
      } catch (err) { }
      if (sourceText === null) return { ok: true, changed: false, files: counted.files, bytes: counted.bytes, refs: null, warn: '镜像已更新，但读不到来源 .md：' + sourceFile }
      let changed = false
      await useNote(name, async function () {
        if (sourceText !== S.text) {
          const before = String(S.view && typeof S.view.line === 'number' ? S.view.line : 0)
          const r = await saveText(sourceText, undefined)
          changed = r && r.ok === true
          // Put the reader back: the view is unchanged, so an explicit event makes the card
          // re-anchor onto the same sentence even though the text just moved under it.
          if (S.view && S.view.line) emit('view', { line: S.view.line, anchor: S.view.anchor || '', jump: 0, sync: true })
          else if (before) emit('view', { line: before, anchor: '', jump: 0, sync: true })
        }
      })
      const refs = await referenceReport(name)
      emit('marks', { revision: S.revision })
      return {
        ok: true, changed: changed, files: counted.files, bytes: counted.bytes, refs: refs,
        note: name, source: sourceFile,
        warn: changed ? '' : '来源 .md 与笔记内容一致，只更新了素材镜像',
      }
    }
    /**
     * Is this directory the plugin's own note space — something a mirror and a scan must never
     * descend into?
     *
     * Two shapes, both of them the plugin's own furniture rather than the reader's content:
     *   <…>/dsh-window/note           the note space itself (session subtrees, note bodies)
     *   <…>/note/_assets              an asset area without the dsh-window level above it
     * Mirroring one is how a mirror ends up containing a copy of itself, and scanning one offers
     * the reader their own notes as if they were files of the folder they are importing.
     */
    function isNoteSpaceDir(name, parentDir) {
      const parent = String(parentDir).replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop()
      if (name === NOTES_DIR && parent === ROOT_DIR) return true
      if (name === ASSETS_DIR && parent === NOTES_DIR) return true
      return false
    }
    /**
     * Every `.md` under a folder, at ANY depth — the reader picks which of them become notes.
     *
     * The first version listed one level, so importing a knowledge folder offered its README and
     * hid the sixty documents underneath. Each entry carries `rel` (its path inside the folder,
     * which is what the import and the mirror resolve against) and `depth` (for the indented list).
     */
    async function listMarkdownIn(dir) {
      const base = String(dir).replace(/\\/g, '/').replace(/\/+$/, '')
      const out = []
      const stack = [{ path: base, rel: '' }]
      let visited = 0
      while (stack.length && visited < 20000) {
        const cur = stack.pop()
        let entries = []
        try {
          const target = await fs.resolve(cur.path)
          entries = await fs.listDir(target, undefined)
        } catch (err) {
          if (cur.rel === '') {
            // Say what the reader probably MEANT: the closest existing ancestor's directories,
            // with the ones containing what was typed first. "linux学习" →
            // 「你是不是想要 linux学习一站式笔记」 beats a bare "not found".
            const hint = await suggestFolders(dir)
            return { ok: false, error: '读不到这个目录（它不存在，或读取被拒绝）: ' + ((err && err.message) || String(err)), files: [], suggestions: hint }
          }
          continue
        }
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i]
          const name = e && e.name ? String(e.name) : ''
          if (name === '' || MIRROR_SKIP_FILES.indexOf(name) >= 0) continue
          const isDir = e && (e.kind === 'directory' || e.type === 'directory' || e.isDirectory === true)
          const rel = cur.rel === '' ? name : cur.rel + '/' + name
          if (isDir) {
            if (MIRROR_SKIP_DIRS.indexOf(name) >= 0 || isNoteSpaceDir(name, cur.path)) continue
            visited += 1
            stack.push({ path: cur.path + '/' + name, rel: rel })
            continue
          }
          if (!/\.(md|markdown)$/i.test(name)) continue
          out.push({ name: name, rel: rel, size: await entrySize(e, cur.path + '/' + name), depth: rel.split('/').length - 1 })
        }
      }
      out.sort(function (a, b) { return a.rel.localeCompare(b.rel) })
      return { ok: true, files: out, count: out.length, rootId: assetRootIdFor(base) }
    }
    /**
     * When a folder cannot be read, say what the reader probably MEANT: walk up to the closest
     * existing ancestor, list its directories, and put the ones containing what was typed at the
     * front. "linux学习" → 「你是不是想要 linux学习一站式笔记」 beats "not found".
     */
    async function suggestFolders(missingDir) {
      const norm = String(missingDir).replace(/\\/g, '/')
      const parts = norm.split('/').filter(function (x) { return x !== '' })
      if (parts.length < 2) return null
      const wanted = parts[parts.length - 1].toLowerCase()
      const ancestors = []
      for (let i = parts.length - 1; i >= 1; i--) ancestors.push(parts.slice(0, i).join('/'))
      for (let a = 0; a < ancestors.length; a++) {
        const ancestor = ancestors[a]
        let entries = []
        try {
          const target = await fs.resolve(ancestor)
          entries = await fs.listDir(target, undefined)
        } catch (err) { continue }
        const names = []
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i]
          const name = e && e.name ? String(e.name) : ''
          const isDir = e && (e.kind === 'directory' || e.type === 'directory' || e.isDirectory === true)
          if (!name || !isDir || MIRROR_SKIP_DIRS.indexOf(name) >= 0) continue
          names.push(name)
        }
        if (!names.length) continue
        const starts = names.filter(function (n) { return n.toLowerCase().indexOf(wanted) === 0 })
        const contains = names.filter(function (n) { return starts.indexOf(n) < 0 && n.toLowerCase().indexOf(wanted) >= 0 })
        const rest = names.filter(function (n) { return starts.indexOf(n) < 0 && contains.indexOf(n) < 0 }).sort()
        const ordered = starts.concat(contains, rest).slice(0, 8)
        if (!ordered.length) continue
        return { ancestor: ancestor, dirs: ordered, wanted: wanted }
      }
      return null
    }
    /** Paths of the ACTIVE note for the active session. */
    function paths() {
      const key = base + '|' + sessionId + '|' + activeNote
      if (pathCache === null || pathCache.key !== key) {
        const sroot = sessionRoot()
        const name = activeNote || DEFAULT_NOTE
        const dir = sroot + '/' + name
        const p = {
          key: key,
          sessionRoot: sroot,
          dir: dir,
          note: dir + '/' + NOTE_FILE,
          state: dir + '/' + STATE_FILE,
          bad: dir + '/' + BAD_STATE_FILE,
          view: dir + '/' + VIEW_FILE,
          session: sroot ? sroot + '/' + SESSION_FILE : '',
          name: name,
        }
        pathsCacheSet(p)
        pathCache = p
      }
      return pathCache
    }
    function pathsCacheSet(p) { pathsRef = p }
    let pathsRef = null
    function sessionStatePath() { return sessionRoot() + '/' + SESSION_FILE }
    // `candidateFromInitiator()` and `candidateFromLiveAgents()` were removed with
    // ownFromAgents(): both guessed a workspace from ambient agent state ("who is the
    // current initiator", "there is exactly one agent so it must be them"). A store
    // that guesses its own owner cannot be trusted to stay inside one session, so the
    // only remaining source is the deployment fallback, which adopts nothing — it just
    // gives paths() something to compute while this store is inactive.
    function pickBase() {
      setBase(fallbackBase(), 'deployment')
    }
    pickBase()
    // `let`, not `const`: the live value is swapped in and out per session (see activate).
    let S = { text: '', selections: [], seq: 0, revision: 1, savedAt: null, commitHash: '', committedAt: null, gitReady: false, gitTrace: '', error: '', fileExists: false, touched: false, stateVersion: STATE_VERSION }
    function fail(where, err) { S.error = where + ': ' + (err && err.message ? err.message : String(err)); console.error(S.error) }
    function markTouched() { if (S.touched) return; S.touched = true; S.revision += 1 }
    // ── durability ────────────────────────────────────────────────────────────
    // Two guarantees ported from AgentTeams, adapted to the `fs` service.
    //
    // 1. Serialization. AgentTeams wraps every mutation in withTeamLock(key, fn), an
    //    in-process FIFO promise chain, because its mutations are read-modify-write
    //    sequences. Ours are too (load state, change it, write both files), and nothing
    //    serialized them: two browser tabs, or a note_* tool call racing the card's
    //    save, could interleave and silently lose one side's change — the selection
    //    mutations had no revision guard at all.
    const locks = new Map()
    function withNoteLock(key, fn) {
      const previous = locks.get(key) || Promise.resolve()
      let release = null
      const gate = new Promise(function (resolve) { release = resolve })
      locks.set(key, previous.then(function () { return gate }))
      return previous.then(function () { return fn() }).finally(function () {
        release()
        if (locks.get(key) === gate) locks.delete(key)
      })
    }
    // 2. Version guard. AgentTeams hand-rolls temp-file + rename (atomicWriteText) and
    //    has no compare-and-swap. The `fs` service already publishes writes atomically
    //    (staging dir, fsync, rename/ReplaceFile with DACL preservation), so porting
    //    that by hand would only duplicate it — and bypass the sandbox policy, since
    //    AgentTeams writes through node:fs directly. What was genuinely missing is the
    //    version guard: we compared our own in-memory counter, which cannot see an
    //    external edit. The service offers `expected: { kind: 'replaceIfVersion' }`,
    //    which throws FS_STALE_VERSION if the file changed since we read it.
    // `let`: swapped per session together with the rest of the store (see activate).
    let diskVersions = new Map()
    function isStaleVersion(err) {
      return !!err && (err.code === 'FS_STALE_VERSION' || /changed since it was read/.test(String(err.message || '')))
    }
    // The version we compare against must be the version of the text we actually hold
    // as our basis — i.e. what load() read into S.text, or what we last wrote. An
    // incidental read must NOT move it: `adoptFromHint` probes whether this session's
    // workspace owns a note on every RPC (including the card's 2-second poll), and if
    // that probe recorded a version, the guard would compare against a file we never
    // loaded and silently accept overwriting someone else's edit.
    async function readIfExists(path, opts) {
      if (fs === undefined) throw new Error('fs 服务不可用')
      const info = await fs.lstat(path)
      const track = !!(opts && opts.track)
      if (info === undefined) { if (track) diskVersions.delete(path); return null }
      if (track) {
        if (info.version !== undefined) diskVersions.set(path, info.version)
        else diskVersions.delete(path)
      }
      const target = await fs.resolve(path)
      return await fs.readText(target)
    }
    /** Existence probe that deliberately touches no version state. */
    async function existsAt(path) {
      if (fs === undefined) return false
      try { return (await fs.lstat(path)) !== undefined } catch (err) { return false }
    }
    async function writeAt(path, content) {
      if (fs === undefined) throw new Error('fs 服务不可用')
      const target = await fs.resolve(path, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
      const known = diskVersions.get(path)
      const expected = known === undefined ? undefined : { kind: 'replaceIfVersion', version: known }
      const res = await fs.writeText(target, content, expected, undefined, policyCache !== null ? policyCache : undefined)
      if (res && res.version !== undefined) diskVersions.set(path, res.version)
      else diskVersions.delete(path)
      return res
    }
    function canWrite() { return confirmed && policyCache !== null }
    /**
     * ONE git subprocess at a time, for the whole plugin.
     *
     * Every git call here runs in a different working directory — each note owns its repository, so
     * there is no way to hand 156 notes to a single `git` invocation. But there is also no reason for
     * two of them to overlap: a launch costs tens of milliseconds, and hundreds at once (which is
     * what a bulk import used to do) saturate the machine until even the mouse stutters. This queue
     * is what makes "one git process" true for the plugin's own work.
     */
    let gitQueue = Promise.resolve()
    function gitSlot(run) {
      const next = gitQueue.then(run, run)
      gitQueue = next.then(function () { }, function () { })
      return next
    }
    async function runGit(args) {
      if (shell === undefined) return { ok: false, out: '', err: 'shell 服务不可用' }
      const req = { command: 'git ' + args, workdir: paths().dir, timeoutMs: 30000 }
      if (policyCache !== null) req.sandboxPolicy = policyCache
      return await gitSlot(async function () {
        const spec = shell.resolve(req)
        const r = await shell.run(spec)
        const out = r && r.stdout && typeof r.stdout.text === 'string' ? r.stdout.text : ''
        const err = r && r.stderr && typeof r.stderr.text === 'string' ? r.stderr.text : ''
        return { ok: r && r.exitCode === 0, out: out.trim(), err: err.trim() }
      })
    }
    async function ensureGit() {
      if (shell === undefined) { S.gitReady = false; return }
      if (!canWrite()) { S.gitReady = false; return }
      const wasReady = S.gitReady
      const dir = activeNote ? sessionRoot() + '/' + activeNote : ''
      const f = dir === '' ? null : factsOf(dir)
      try {
        if (!S.fileExists) { await writeAt(paths().note, S.text || SEED_TEXT); S.fileExists = true }
        // Cheap path: this note's repository is known and has a commit. Nothing to do, no process.
        if (f !== null && f.gitProbed === true && f.gitHasHead === true) {
          S.commitHash = typeof f.hash === 'string' ? f.hash : ''
          S.gitReady = true
          if (!wasReady) S.revision += 1
          return
        }
        // `f.gitHasHead === false` with `gitProbed` set means the lstat already told us there is no
        // `.git` here, so the is-inside-work-tree probe would be a subprocess spent on a known
        // answer. Only an unknown state is worth asking about.
        const knownNoRepo = f !== null && f.gitProbed === true && f.gitHasHead === false
        if (!knownNoRepo) {
          const probe = await runGit('rev-parse --is-inside-work-tree')
          if (probe.ok) {
            const rev0 = await runGit('rev-parse --short HEAD')
            S.commitHash = rev0.ok ? rev0.out : ''
            S.gitReady = true
            if (f !== null) { f.gitProbed = true; f.gitHasHead = rev0.ok === true; f.hash = S.commitHash; f.gitFor = f.textV }
            if (!wasReady) S.revision += 1
            return
          }
        }
        const init = await runGit('init -q')
        if (!init.ok) { S.gitReady = false; fail('git init', new Error(init.err || init.out)); return }
        // Three subprocesses for a fresh repository: init, add, commit. The author identity rides
        // the commit with `-c` instead of two `git config` calls, and a repository that was just
        // created has no HEAD to verify — the commit creates it.
        await runGit('add -A')
        await runGit('-c user.name="DSH Note" -c user.email="dsh-note@local" commit -q -m "note: init"')
        // The hash comes out of the ref file, not out of a fourth subprocess.
        const rev = { ok: true, out: (await headHashFromFiles(dir)) || '' }
        if (rev.out === '') { const p = await runGit('rev-parse --short HEAD'); rev.out = p.ok ? p.out : ''; rev.ok = p.ok }
        S.commitHash = rev.ok ? rev.out : ''
        if (rev.ok) S.committedAt = isoNow()
        S.gitReady = rev.ok === true
        if (f !== null) {
          f.gitProbed = true
          f.gitHasHead = rev.ok === true
          f.hash = S.commitHash
          f.gitFor = f.textV
        }
        if (!wasReady) S.revision += 1
      } catch (err) {
        S.gitReady = false
        if (f !== null) { f.gitProbed = false; f.gitHasHead = false }
        fail('git', err)
      }
    }
    /**
     * Session id of a tool caller / RPC payload, or '' when unidentified.
     */
    function sessionIdOfExec(exec) {
      try { const hd = exec && exec.agent && exec.agent.session && exec.agent.session.header ? exec.agent.session.header : null; return hd && typeof hd.id === 'string' ? hd.id : '' } catch (err) { return '' }
    }
    /** Session id from a systemPrompt assembly context (`{ agent, scope }`). */
    function sessionIdOfContext(context) {
      try { const hd = context && context.agent && context.agent.session && context.agent.session.header ? context.agent.session.header : null; return hd && typeof hd.id === 'string' ? hd.id : '' } catch (err) { return '' }
    }
    /**
     * Bind this store to one session. That is the whole "ownership" model now: the
     * session id is a path segment, so isolation is structural and there is nothing to
     * protect or steal. Refuses (returns false) when the session or its workspace cannot
     * be resolved — the caller then reports that loudly instead of guessing.
     */
    function bindSession(sid) {
      if (typeof sid !== 'string' || !sid) return false
      if (sessionId && sessionId !== sid) return false
      let ses = null
      try { if (sessions && typeof sessions.get === 'function') ses = sessions.get(sid) } catch (err) { ses = null }
      const cwd = ses ? cwdOfSession(ses) : ''
      let pol = null
      try { if (policy && typeof policy.resolve === 'function') pol = policy.resolve({ session: ses || { header: { id: sid, cwd: base } } }) } catch (err) { pol = null }
      let root = ''
      try { root = pol && typeof pol.workspaceRoot === 'string' ? pol.workspaceRoot : '' } catch (err) { root = '' }
      if (!root) root = cwd || fallbackBase()
      if (!root) return false
      sessionId = sid
      policyCache = pol
      // Binding IS activation: the store can now read/write and create its directories.
      confirmed = true
      setBase(root, 'session')
      return true
    }
    function bindSessionFromExec(exec) {
      return bindSession(sessionIdOfExec(exec))
    }
    /** Note directories that actually contain a note file. */
    async function listNoteDirs() {
      const sroot = sessionRoot()
      if (!sroot || fs === undefined) return []
      if (typeof fs.listDir !== 'function') throw new Error('fs 服务没有 listDir，无法列出本会话的笔记')
      let entries = []
      try {
        const target = await fs.resolve(sroot, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
        entries = await fs.listDir(target, undefined)
      } catch (err) {
        // A missing session directory is the normal "no notes yet" case. Anything else is
        // a real failure and must NOT be reported as "no notes" — that silently empties a
        // session's note space, which is exactly the kind of bug this suite exists to catch.
        const code = err && err.code ? String(err.code) : ''
        const missing = code === 'FS_NOT_FOUND' || code === 'ENOENT' || /ENOENT|not found/i.test(String(err && err.message))
        if (missing) return []
        throw err
      }
      const out = []
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i]
        const name = e && typeof e.name === 'string' ? e.name : ''
        const type = e && e.type ? e.type : ''
        if (!name || name.charAt(0) === '.') continue
        if (type && type !== 'directory') continue
        const notePath = sroot + '/' + name + '/' + NOTE_FILE
        if (await existsAt(notePath)) out.push(name)
      }
      out.sort(function (a, b) { return a.localeCompare(b) })
      return out
    }
    async function readSessionState() {
      if (!sessionId) return
      let parsed = null
      try {
        const raw = await readIfExists(sessionStatePath())
        if (raw !== null) parsed = JSON.parse(raw)
      } catch (err) { parsed = null }
      const want = parsed && typeof parsed.active === 'string' ? sanitizeNoteName(parsed.active) : ''
      // Whether the card was summoned explicitly with /window-note start. It is remembered
      // per session so a reload does not lose the panel in a session that has no note yet.
      summoned = !!(parsed && parsed.summoned === true)
      lists = cleanLists(parsed && parsed.lists)
      const names = await listNoteDirs()
      sessionNotes = names
      if (want && names.indexOf(want) >= 0) activeNote = want
      else activeNote = names.length ? names[0] : ''
      pathCache = null
    }
    async function writeSessionState() {
      if (!sessionId) return
      // The session file holds everything about a session that is not note text: the open
      // note, the summon flag. Any write here is a change the card must hear about, so bump
      // the UI revision in the same place instead of hunting for every caller.
      uiRev += 1
      try {
        const payload = { v: SESSION_STATE_VERSION, sessionId: sessionId, active: activeNote || '', summoned: summoned === true, lists: lists, updatedAt: isoNow() }
        await writeAt(sessionStatePath(), JSON.stringify(payload, null, 2) + '\n')
      } catch (err) { fail('写入会话状态', err) }
    }
    /**
     * Run `fn` against a NAMED note of this session, leaving the active note untouched.
     *
     * With one note per session this was unnecessary; with several it matters: the agent
     * has to be able to look at note B's highlights without switching the card the user is
     * looking at. Same swap trick as per-session activation, and it is safe for the same
     * reason: every store operation already runs inside one global serialization point.
     */
    async function useNote(name, fn) {
      const clean = sanitizeNoteName(name)
      if (!clean || clean === activeNote) return await fn()
      const names = await listNoteDirs()
      if (names.indexOf(clean) < 0) throw new Error('本会话没有名为《' + String(name) + '》的笔记；用 note_list 看有哪些。')
      const prev = { activeNote: activeNote, S: S, pathCache: pathCache, loadedBase: loadedBase, diskVersions: diskVersions, gitReady: S.gitReady, commitHash: S.commitHash }
      activeNote = clean
      pathCache = null
      loadedBase = ''
      S = freshState()
      diskVersions = new Map()
      await load()
      try { return await fn() } finally {
        activeNote = prev.activeNote
        S = prev.S
        pathCache = prev.pathCache
        loadedBase = prev.loadedBase
        diskVersions = prev.diskVersions
      }
    }
    /** Make `name` the active note of this session (must exist). */
    async function selectNote(name) {
      const clean = sanitizeNoteName(name)
      const names = await listNoteDirs()
      if (names.indexOf(clean) < 0) return { ok: false, error: '笔记不存在: ' + String(name) }
      activeNote = clean
      sessionNotes = names
      pathCache = null
      loadedBase = ''
      // Switching notes has to reset the whole per-note view, not only the text: git
      // status, error text and the selection cache all belong to the note being left.
      S.text = ''
      S.selections = []
      S.seq = 0
      S.gitReady = false
      S.commitHash = ''
      S.committedAt = null
      S.gitTrace = ''
      S.touched = false
      S.error = ''
      stateCorrupt = false
      diskVersions.clear()
      S.revision += 1
      await writeSessionState()
      await load()
      // The card is showing a different note now: announce both dimensions, so it refreshes the
      // picker and the body without waiting for the next poll.
      emit('notes', { active: activeNote })
      emit('text', { revision: S.revision, active: activeNote })
      return { ok: true, active: activeNote }
    }
    /** Create a directory by writing into it    /** Create a directory by writing into it: the abstract fs service has no mkdir. */
    async function mkdirAt(path) {
      if (fs === undefined) throw new Error('fs 服务不可用')
      if (typeof fs.mkdir === 'function') {
        const target = await fs.resolve(path, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
        await fs.mkdir(target, undefined, policyCache !== null ? policyCache : undefined)
        return
      }
      // The abstract service has no mkdir on some deployments; writing a file into the
      // directory creates it (the service creates parents for an atomic write).
      await writeAt(path.replace(/\/+$/, '') + '/.keep', '')
    }
    function sessionStateView() {
      return {
        sessionId: sessionId,
        notesDir: sessionRoot(),
        notes: sessionNotes || [],
        active: activeNote,
      }
    }
    let loading = null
    async function load() {
      if (fs === undefined) { S.error = 'fs 服务不可用'; return }
      loadedBase = base
      const p = paths()
      S.text = ''
      S.selections = []
      S.view = null
      S.fileExists = false
      // No active note is a normal state now (a session starts with none), not an error:
      // the card shows its empty state and the tools report "create one first".
      if (!activeNote) {
        S.savedAt = isoNow()
        S.gitReady = false
        S.commitHash = ''
        S.committedAt = null
        S.revision += 1
        return
      }
      try {
        const raw = await readIfExists(p.note, { track: true })
        if (raw === null) { S.text = SEED_TEXT; S.fileExists = false }
        else { S.text = String(raw).replace(/\r\n?/g, '\n'); S.fileExists = true }
        S.savedAt = isoNow()
      } catch (err) { fail('读取笔记', err) }
      try {
        const rawState = await readIfExists(p.state, { track: true })
        if (rawState !== null) {
          let parsed = null
          let ok = true
          try { parsed = JSON.parse(rawState) } catch (err) { ok = false }
          if (ok && parsed && Array.isArray(parsed.selections)) {
            const list = []
            for (let i = 0; i < parsed.selections.length; i++) {
              const s = normalizeSel(parsed.selections[i])
              if (s !== null) list.push(s)
            }
            S.selections = sortSelections(list)
            S.seq = intOr(parsed.seq, list.length)
            S.stateVersion = intOr(parsed.v, 0)
          } else if (!ok) {
            stateCorrupt = true
            fail('读取选中记录', new Error('JSON 解析失败，下次写入前会把原文件备份为 ' + BAD_STATE_FILE))
          }
        }
      } catch (err) { fail('读取选中记录', err) }
      // Where the reader had got to. Absent or damaged simply means "no saved position",
      // which is not worth an error: the card then starts at the top as before.
      S.view = null
      try {
        const rawView = await readIfExists(p.view)
        if (rawView !== null) {
          let pv = null
          try { pv = JSON.parse(rawView) } catch (err) { pv = null }
          const line = pv && Number.isFinite(Number(pv.line)) ? Math.round(Number(pv.line)) : 0
          if (line >= 1) S.view = { line: line, anchor: typeof pv.anchor === 'string' ? pv.anchor : '', updatedAt: typeof pv.updatedAt === 'string' ? pv.updatedAt : '' }
        }
      } catch (err) { }
      // NO ensureGit() here: creating a repository costs several subprocesses and `load()` runs for
      // every note that is opened, which is what turned "import 156 documents" into over a thousand
      // git processes and dragged the whole machine down (「干什么都是 signal timeout, 鼠标移动都卡」).
      // A note keeps its OWN repository — it is simply created the first time that note needs
      // history (a save, a commit, a clear-snapshot) instead of at import time.
      if (canWrite()) {
        const dir = activeNote ? sessionRoot() + '/' + activeNote : ''
        S.gitReady = dir !== '' && (await noteHasRepo(dir))
        const f = dir === '' ? null : factsOf(dir)
        if (S.gitReady && f !== null && typeof f.hash === 'string' && f.hash !== '') S.commitHash = f.hash
      }
    }
    /** Is this note directory already a git repository? One lstat, no subprocess. */
    async function noteHasRepo(dir) {
      if (fs === undefined || dir === '') return false
      try {
        const target = await fs.resolve(dir + '/.git', policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
        const st = await fs.lstat(target)
        return st !== undefined && st !== null
      } catch (err) { return false }
    }
    function ensureLoaded() {
      // A load must not stick when it ran against a DIFFERENT workspace root. At startup the
      // session's workspace can resolve a moment after the first request; a load that ran
      // against the fallback base saw an empty note space, cached itself in `loading`, and the
      // store then believed this session had no note at all — the card showed a blank note
      // until the user manually switched notes ("dsh web 启动后，需要切换笔记才显示笔记").
      // Reload whenever the base the store was loaded for no longer matches the live one.
      if (loading !== null && base && loadedBase === base) return loading
      if (loading !== null) loading = null
      loading = (async function () {
        if (!sessionId) { S.error = '本会话没有可用的会话 id'; return }
        await readSessionState()
        await load()
      })().catch(function (err) { loading = null; fail('初始化', err) })
      return loading
    }
    // The old `migrate()` moved one shared note when the workspace base changed. With
    // per-session, per-note directories there is nothing to move: a different session or
    // a different note is simply a different path, and load() reads it fresh.
    async function persistState() {
      if (fs === undefined) return
      if (!canWrite()) return
      if (stateCorrupt) {
        try { const rawBad = await readIfExists(paths().state); if (rawBad !== null) await writeAt(paths().bad, String(rawBad)) } catch (err) { }
        stateCorrupt = false
      }
      // One place announces mark changes: every tool and RPC that touches the marks goes through
      // this function, so each change is announced exactly once (see emit).
      emit('marks', { revision: S.revision })
      const payload = { v: STATE_VERSION, seq: S.seq, selections: S.selections, updatedAt: isoNow() }
      await writeAt(paths().state, JSON.stringify(payload, null, 2) + '\n')
    }
    /**
     * Keep the reading position out of the note's git history. The note repo commits with
     * `git add -A`, so without an ignore rule every scroll position would become a commit
     * the next time the user commits the note. Created on demand and never surfaced: a
     * failure just means the position may get committed, which is cosmetic.
     */
    async function ensureViewIgnored() {
      if (fs === undefined) return
      try {
        const gi = paths().dir + '/.gitignore'
        const raw = await readIfExists(gi)
        const cur = raw === null ? '' : String(raw)
        if (cur.indexOf(VIEW_FILE) >= 0) return
        const head = cur === '' ? '' : cur.replace(/\s*$/, '') + '\n'
        await writeAt(gi, head + VIEW_FILE + '\n')
      } catch (err) { }
    }
    /** Persist where the reader is in the active note. Silent by design. */
    async function saveView(input) {
      const a = input || {}
      const line = Math.max(1, intOr(a.line, 1))
      const anchor = typeof a.anchor === 'string' ? a.anchor.slice(0, 80) : ''
      // A JUMP is different from a scroll: the card must actually move, even though the note
      // text and the revision are unchanged. The nonce is what the client compares against, and
      // the UI revision is what makes the card poll again without waiting for a page reload.
      const jump = a.jump === true
      const prevJump = S.view && typeof S.view.jump === 'number' ? S.view.jump : 0
      S.view = { line: line, anchor: anchor, updatedAt: isoNow(), jump: jump ? prevJump + 1 : prevJump }
      // An announcement, not a plain scroll save: only a JUMP asks the card to move (note_goto),
      // while the periodic scroll save must stay silent or the reader would be dragged back to
      // wherever the last save happened to land.
      if (jump) { uiRev += 1; emit('view', { line: line, anchor: anchor, jump: S.view.jump }) }
      if (fs === undefined || !canWrite() || !activeNote) return { ok: true, line: line }
      await ensureViewIgnored()
      const payload = { v: 1, line: line, anchor: anchor, updatedAt: S.view.updatedAt }
      // No version guard: a reading position is last-writer-wins, and it must never
      // conflict with the guarded selection state (that conflict is what
      // FS_STALE_VERSION means).
      await writeAt(paths().view, JSON.stringify(payload, null, 2) + '\n')
      return { ok: true, line: line }
    }
    function viewSelections() {
      const out = []
      for (let i = 0; i < S.selections.length; i++) {
        const s = S.selections[i]
        const look = lookFlags(s)
        out.push({ id: s.id, order: i + 1, seq: s.seq, text: s.text, startLine: s.startLine, startCol: s.startCol, endLine: s.endLine, endCol: s.endCol, createdAt: s.createdAt, color: s.color || 'yellow', italic: look.italic, underline: look.underline, style: styleLabel(look.italic, look.underline), fetched: s.fetched === true, stale: s.stale === true, remark: s.remark || '' })
      }
      return out
    }
    function stateView(callerId, callerSince) {
      // A store that is not bound to a session has nothing to report: the session id is
      // the note-space path segment, so without one there is no note space to describe.
      // (Cross-session visibility needs no branch here any more: each session has its own
      // subtree, and withStore() always activates the caller's own record.)
      if (!confirmed || !sessionId) {
        return {
          revision: S.revision,
          text: '',
          lineCount: 0,
          selections: [],
          path: '',
          relPath: '',
          baseFrom: '',
          confirmed: false,
          touched: false,
          sessionId: '',
          notes: [],
          active: '',
          notesDir: '',
          inactive: true,
          view: null,
        }
      }
      return {
        revision: S.revision,
        text: S.text,
        lineCount: linesOf(S.text).length,
        selections: viewSelections(),
        // The reading position travels with every state answer, so switching a note (and a
        // page reload, which asks for the state again) gets it for free.
        view: S.view || null,
        path: activeNote ? paths().note : '',
        relPath: activeNote ? (ROOT_DIR + '/' + NOTES_DIR + '/' + sessionId + '/' + activeNote + '/' + NOTE_FILE) : '',
        notesDir: sessionRoot(),
        active: activeNote,
        baseFrom: baseFrom,
        confirmed: confirmed,
        touched: S.touched === true,
        sessionId: sessionId,
        savedAt: S.savedAt,
        commitHash: S.commitHash,
        committedAt: S.committedAt,
        gitReady: S.gitReady,
        gitTrace: S.gitTrace,
        stateVersion: S.stateVersion,
        shellOk: shell !== undefined,
        fsOk: fs !== undefined,
        // The card decides from these two whether it exists at all: a note, or an explicit
        // summon. `notes` rides along (see notesView) so the client can tell them apart.
        summoned: summoned === true,
        // Non-content state revision, see `let uiRev`.
        uiRevision: uiRev,
        // Moves when a note's BACKGROUND git state changes: the rows' status light.
        gitRevision: gitStatusRev,
        // Custom mark lists (this session) and any view commands still waiting for the card to
        // perform them. Both ride the poll the card already makes every two seconds.
        lists: viewLists(),
        ui: uiQueue,
        // Fine-grained change events newer than the client's `since`. They ride the poll the card
        // already makes, so no second channel is introduced, and they arrive even when the note
        // revision is unchanged ("unchanged" is only sent when neither events nor revisions moved).
        events: eventsSince(callerSince),
        eventId: eventSeq,
        error: S.error,
      }
    }
    async function saveText(nextRaw, baseRevision) {
      await ensureLoaded()
      // Never conjure a note out of a save: the card only exists while this session has a
      // note open, so a save that arrives without one is stale (a note was just deleted,
      // or another tab switched away) and must be refused rather than silently creating a
      // "note" directory the user never asked for.
      if (!activeNote) return { ok: false, error: 'no-note', revision: S.revision, selections: viewSelections() }
      if (typeof baseRevision === 'number' && baseRevision !== S.revision) return { ok: false, conflict: true, revision: S.revision, selections: viewSelections() }
      const next = String(nextRaw === null || nextRaw === undefined ? '' : nextRaw).replace(/\r\n?/g, '\n')
      const prev = S.text
      if (next !== prev) {
        const remapped = remapSelections(S.selections, prev, next)
        if (canWrite()) {
          try { await writeAt(paths().note, next); }
          catch (err) {
            // FS_STALE_VERSION: the file changed on disk since we read it — an external
            // editor, another dsh process, or a second card. Report it as the conflict the
            // client already knows how to resolve (prompting a reload) instead of
            // overwriting it, and leave the in-memory text alone so a reload is truthful.
            if (isStaleVersion(err)) { fail('写入笔记', err); return { ok: false, conflict: true, stale: true, revision: S.revision, selections: viewSelections() } }
            fail('写入笔记', err); return { ok: false, error: S.error, revision: S.revision, selections: viewSelections() }
          }
          S.fileExists = true; S.savedAt = isoNow()
          S.selections = remapped
          S.text = next
          S.revision += 1
          try { await persistState() } catch (err) { fail('写入选中记录', err) }
          // The file is written; the repository can be created behind us. Awaiting it here was the
          // last place a save waited on git (three subprocesses, once per note) — the card's status
          // light shows the wait instead of imposing it.
          if (!S.gitReady && activeNote) queueRepoCreation(sessionRoot() + '/' + activeNote)
        } else {
          S.selections = remapped
          S.text = next
          S.revision += 1
        }
      }
      return { ok: true, revision: S.revision, savedAt: S.savedAt, lineCount: linesOf(S.text).length, selections: viewSelections() }
    }
    async function addSelection(input) {
      await ensureLoaded()
      const a = input || {}
      const l1 = Math.max(1, intOr(a.startLine, 1))
      const c1 = Math.max(0, intOr(a.startCol, 0))
      const l2 = Math.max(1, intOr(a.endLine, l1))
      const c2 = Math.max(0, intOr(a.endCol, c1))
      const forward = (l2 > l1) || (l2 === l1 && c2 >= c1)
      const first = forward ? { line: l1, col: c1 } : { line: l2, col: c2 }
      const last = forward ? { line: l2, col: c2 } : { line: l1, col: c1 }
      const text = sliceRange(S.text, { startLine: first.line, startCol: first.col, endLine: last.line, endCol: last.col })
      if (text.trim() === '') return { ok: false, reason: 'empty', revision: S.revision, selections: viewSelections() }
      S.seq += 1
      const sel = { id: 'sel-' + S.seq, seq: S.seq, startLine: first.line, startCol: first.col, endLine: last.line, endCol: last.col, text: text, createdAt: isoNow(), color: COLORS[a.color] ? a.color : 'yellow', italic: lookFlags(a).italic, underline: lookFlags(a).underline, fetched: false, stale: false, remark: cleanRemark(a.remark) }
      S.selections = sortSelections(S.selections.concat([sel]))
      S.revision += 1
      try { await persistState() } catch (err) { fail('写入选中记录', err) }
      return { ok: true, id: sel.id, revision: S.revision, selections: viewSelections() }
    }
    /**
     * Set (or clear) the remark of one selection. A remark is metadata about a passage the
     * user already selected, so this is a targeted update rather than a new selection.
     */
    /**
     * Change how one existing mark is drawn — its colour, its italic flag, its underline flag,
     * any combination. The three are independent dimensions of the same mark, so one targeted
     * update covers every button on the reader's function card. A missing/undefined field means
     * "leave this dimension alone" (that is how a single toggle button works), while a value
     * that is not in the table is refused rather than silently coerced.
     */
    async function setMarkLook(id, patch) {
      await ensureLoaded()
      const want = String(id || '')
      const p = patch && typeof patch === 'object' ? patch : {}
      const hasColor = p.color !== undefined && p.color !== null && p.color !== ''
      const hasItalic = p.italic === true || p.italic === false
      const hasUnderline = p.underline === true || p.underline === false
      // The retired single field still arrives from an older client (or the note_set_style tool).
      const legacy = typeof p.style === 'string' && p.style !== '' ? p.style : ''
      const legacyFlags = legacy === '' ? null : lookFlags({ style: legacy })
      const hasLegacy = legacyFlags !== null
      if (!hasColor && !hasItalic && !hasUnderline && !hasLegacy) {
        return { ok: false, found: false, error: '至少要给一个 color / italic / underline', revision: S.revision, selections: viewSelections() }
      }
      if (hasColor && !COLORS[p.color]) {
        return { ok: false, found: false, error: 'color 只能是 yellow/pink/green/black/none', revision: S.revision, selections: viewSelections() }
      }
      if (hasLegacy && !STYLES[legacy]) {
        return { ok: false, found: false, error: 'style 只能是 highlight/italic/underline/both', revision: S.revision, selections: viewSelections() }
      }
      let found = false
      let outColor = ''
      let outItalic = false
      let outUnderline = false
      for (let i = 0; i < S.selections.length; i++) {
        const s = S.selections[i]
        if (s.id !== want) continue
        found = true
        if (hasColor && (s.color || 'yellow') !== p.color) { s.color = p.color; S.revision += 1 }
        const now = lookFlags(s)
        let nextItalic = hasItalic ? p.italic === true : now.italic
        let nextUnderline = hasUnderline ? p.underline === true : now.underline
        // A legacy `style` is an assignment of BOTH flags, which is how a caller clears them
        // again (`style: 'highlight'`).
        if (hasLegacy) { nextItalic = legacyFlags.italic; nextUnderline = legacyFlags.underline }
        if (nextItalic !== now.italic) { s.italic = nextItalic; S.revision += 1 }
        if (nextUnderline !== now.underline) { s.underline = nextUnderline; S.revision += 1 }
        // The retired field never survives a write: the flags are the truth from here on.
        if (s.style !== undefined) delete s.style
        outColor = s.color || 'yellow'
        outItalic = nextItalic
        outUnderline = nextUnderline
      }
      if (!found) return { ok: false, found: false, error: '没有这条标记记录: ' + want, revision: S.revision, selections: viewSelections() }
      try { await persistState() } catch (err) { fail('写入标记记录', err) }
      return { ok: true, found: true, id: want, color: outColor, italic: outItalic, underline: outUnderline, style: styleLabel(outItalic, outUnderline), revision: S.revision, selections: viewSelections() }
    }
    async function setRemark(id, raw) {
      await ensureLoaded()
      const want = String(id || '')
      const remark = cleanRemark(raw)
      let found = false
      for (let i = 0; i < S.selections.length; i++) {
        if (S.selections[i].id !== want) continue
        found = true
        if ((S.selections[i].remark || '') !== remark) { S.selections[i].remark = remark; S.revision += 1 }
      }
      if (!found) return { ok: false, found: false, error: '没有这条选中记录: ' + want, revision: S.revision, selections: viewSelections() }
      try { await persistState() } catch (err) { fail('写入选中记录', err) }
      return { ok: true, found: true, id: want, remark: remark, revision: S.revision, selections: viewSelections() }
    }
    // ── custom mark lists ────────────────────────────────────────────────────────────
    // A named collection of marks, each entry pointing at (note, markId). Built by the reader
    // from the list's own 添加到 button, or by the agent through note_lists — same store, same
    // rules, one code path.
    function findList(name) {
      const want = String(name === undefined || name === null ? '' : name).trim()
      for (let i = 0; i < lists.length; i++) if (lists[i].name === want) return lists[i]
      return null
    }
    function viewLists() {
      return lists.map(function (l) {
        return {
          id: l.id, name: l.name, count: l.items.length,
          items: l.items.map(function (it) { return { note: it.note, markId: it.markId, addedAt: it.addedAt } }),
        }
      })
    }
    /** Does this mark exist in that note? The active note answers from memory, others from disk. */
    async function markExists(note, markId) {
      const id = String(markId || '')
      if (note === activeNote) return S.selections.some(function (s) { return s.id === id })
      try {
        const raw = await readIfExists(sessionRoot() + '/' + note + '/' + STATE_FILE)
        if (raw === null) return false
        const parsed = JSON.parse(raw)
        const list = parsed && Array.isArray(parsed.selections) ? parsed.selections : []
        return list.some(function (s) { return s && s.id === id })
      } catch (err) { return false }
    }
    async function listCreate(name) {
      const clean = String(name === undefined || name === null ? '' : name).replace(/\s+/g, ' ').trim().slice(0, MAX_LIST_NAME)
      if (clean === '') return { ok: false, error: '列表名不能为空' }
      if (findList(clean) !== null) return { ok: false, error: '已经有同名列表：《' + clean + '》' }
      if (lists.length >= MAX_LISTS) return { ok: false, error: '最多 ' + MAX_LISTS + ' 个列表' }
      lists = lists.concat([{ id: 'list-' + (lists.length + 1) + '-' + Date.now().toString(36), name: clean, items: [] }])
      await writeSessionState()
      emit('lists', { name: clean, lists: viewLists() })
      return { ok: true, name: clean, lists: viewLists() }
    }
    async function listRename(from, to) {
      const l = findList(from)
      if (l === null) return { ok: false, error: '没有名为《' + String(from) + '》的列表' }
      const clean = String(to === undefined || to === null ? '' : to).replace(/\s+/g, ' ').trim().slice(0, MAX_LIST_NAME)
      if (clean === '') return { ok: false, error: '新名字不能为空' }
      const other = findList(clean)
      if (other !== null && other !== l) return { ok: false, error: '已经有同名列表：《' + clean + '》' }
      l.name = clean
      await writeSessionState()
      emit('lists', { name: clean, renamedFrom: String(from), lists: viewLists() })
      return { ok: true, from: String(from), name: clean, lists: viewLists() }
    }
    async function listDelete(name) {
      const l = findList(name)
      if (l === null) return { ok: false, error: '没有名为《' + String(name) + '》的列表' }
      lists = lists.filter(function (x) { return x !== l })
      await writeSessionState()
      emit('lists', { name: l.name, deleted: true })
      return { ok: true, removed: l.items.length, lists: viewLists() }
    }
    async function listAdd(name, note, markId) {
      const l = findList(name)
      if (l === null) return { ok: false, error: '没有名为《' + String(name) + '》的列表' }
      const target = note === undefined || note === null || note === '' ? activeNote : sanitizeNoteName(note)
      if (target === '') return { ok: false, error: '这份笔记还没有名字' }
      const id = String(markId || '')
      if (id === '') return { ok: false, error: '要指定一条标记的 id' }
      if (!(await markExists(target, id))) return { ok: false, error: '《' + target + '》里没有标记 ' + id }
      const already = l.items.some(function (it) { return it.note === target && it.markId === id })
      if (already) return { ok: true, added: false, duplicate: true, name: l.name, count: l.items.length, lists: viewLists() }
      if (l.items.length >= MAX_LIST_ITEMS) return { ok: false, error: '一个列表最多 ' + MAX_LIST_ITEMS + ' 条' }
      l.items = l.items.concat([{ note: target, markId: id, addedAt: isoNow() }])
      await writeSessionState()
      emit('lists', { name: l.name, count: l.items.length, markId: id, note: target })
      return { ok: true, added: true, name: l.name, count: l.items.length, lists: viewLists() }
    }
    async function listRemove(name, note, markId) {
      const l = findList(name)
      if (l === null) return { ok: false, error: '没有名为《' + String(name) + '》的列表' }
      const target = note === undefined || note === null || note === '' ? activeNote : sanitizeNoteName(note)
      const id = String(markId || '')
      const before = l.items.length
      l.items = l.items.filter(function (it) { return !(it.note === target && it.markId === id) })
      const removed = l.items.length !== before
      if (removed) { await writeSessionState(); emit('lists', { name: l.name, count: l.items.length, removedId: id, note: target }) }
      return { ok: true, removed: removed, name: l.name, count: l.items.length, lists: viewLists() }
    }
    // ── fine-grained change events ───────────────────────────────────────────────────
    const EVENT_TOPICS = { text: 1, marks: 1, notes: 1, lists: 1, view: 1, git: 1, ui: 1 }
    const MAX_EVENTS = 200
    /**
     * Announce that one part of the reader's view went stale. Called from the same helpers the
     * tools and the RPCs share, so a change is announced exactly once no matter who made it.
     * `data` carries just enough for the card to act without another round trip (a requested
     * reading position, a renamed note, the list name that changed).
     */
    function emit(topic, data) {
      if (!EVENT_TOPICS[topic]) return
      eventSeq += 1
      const entry = { id: eventSeq, topic: topic, at: isoNow() }
      if (data && typeof data === 'object') entry.data = data
      events = events.concat([entry])
      if (events.length > MAX_EVENTS) events = events.slice(events.length - MAX_EVENTS)
      uiRev += 1
      return entry.id
    }
    /** The events a client that has seen `since` has not seen yet. */
    function eventsSince(since) {
      const from = intOr(since, 0)
      const out = []
      for (let i = 0; i < events.length; i++) if (intOr(events[i] && events[i].id, 0) > from) out.push(events[i])
      return out.slice(-60)
    }
    // ── UI commands the card performs on its next poll ───────────────────────────────
    function pushUi(cmd) {
      uiSeq += 1
      const entry = { id: uiSeq, cmd: cmd, at: isoNow() }
      uiQueue = uiQueue.concat([entry]).slice(-20)
      uiRev += 1
      emit('ui', { id: entry.id, kind: cmd && cmd.kind ? String(cmd.kind) : '' })
      return { ok: true, id: entry.id, uiRevision: uiRev, queued: uiQueue.length }
    }
    function ackUi(id) {
      const upTo = intOr(id, 0)
      const before = uiQueue.length
      uiQueue = uiQueue.filter(function (e) { return intOr(e && e.id, 0) > upTo })
      return { ok: true, dropped: before - uiQueue.length, uiRevision: uiRev }
    }
    async function commit(message) {
      if (shell === undefined) return { ok: false, error: 'shell 服务不可用（无法执行 git）' }
      if (!S.fileExists) {
        try { await writeAt(paths().note, S.text || SEED_TEXT); S.fileExists = true } catch (err) { fail('写入笔记', err); return { ok: false, error: S.error } }
      }
      if (!S.gitReady) await ensureGit()
      if (!S.gitReady) return { ok: false, error: 'git 未就绪（笔记已落盘）' }
      try { await writeAt(paths().note, S.text); await persistState() } catch (err) { fail('提交前落盘', err) }
      const status = await runGit('status --porcelain')
      if (status.ok && status.out === '') return { ok: true, nothing: true, hash: S.commitHash, message: '没有需要提交的改动' }
      const add = await runGit('add -A')
      if (!add.ok) return { ok: false, error: 'git add 失败: ' + (add.err || add.out) }
      const msg = String(message && String(message).trim() ? message : ('note: ' + isoNow())).replace(/"/g, "'")
      // The identity rides the command: a repository this plugin creates gets no `git config`
      // subprocesses of its own (three spawns per note, multiplied by a 156-document import).
      const c = await runGit('-c user.name="DSH Note" -c user.email="dsh-note@local" commit -q -m "' + msg + '"')
      if (!c.ok) return { ok: false, error: 'git commit 失败: ' + (c.err || c.out) }
      // Two subprocesses for a commit (add, commit): the hash is the ref file git just updated.
      let hash = (activeNote ? await headHashFromFiles(sessionRoot() + '/' + activeNote) : null) || ''
      let ok = hash !== ''
      if (hash === '') {
        const rev = await runGit('rev-parse --short HEAD')
        hash = rev.ok ? rev.out : ''
        ok = rev.ok === true
      }
      const rev = { ok: ok, out: hash }
      S.commitHash = rev.ok ? rev.out : ''
      S.committedAt = isoNow()
      // Keep the per-note facts in step with the commit this plugin just made, so neither the
      // notes list nor the next note switch has to ask git again.
      if (activeNote) {
        const f = factsOf(sessionRoot() + '/' + activeNote)
        f.gitProbed = true
        f.gitHasHead = rev.ok === true
        f.hash = S.commitHash
        f.gitFor = f.textV
      }
      emit('git', { hash: S.commitHash })
      return { ok: true, hash: S.commitHash, message: msg }
    }
    function selRender(list) {
      if (!list || list.length === 0) return '（当前没有任何标记）'
      const parts = []
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        // The colour is part of the message the agent receives: it is the intent
        // channel (yellow focus / pink question / green done / black masked), so it
        // has to appear in the text render, not only in the stored object.
        const flags = lookFlags(s)
        const head = '#' + s.order + ' [' + s.id + '] ' + ({ yellow: '黄', pink: '粉', green: '绿', black: '黑', none: '无色' }[s.color] || '黄') + (flags.italic ? '·斜体' : '') + (flags.underline ? '·下划线' : '') + ' 第' + s.startLine + '行:' + s.startCol + ' → 第' + s.endLine + '行:' + s.endCol + (s.fetched ? ' （已取用）' : ' （新标记）') + (s.stale ? ' [!]原文已变动' : '')
        // The remark is the user's own words about this passage, so it travels with the
        // selection text into every prompt — that is the whole point of the field.
        const remark = typeof s.remark === 'string' && s.remark !== '' ? '\n  【备注】' + s.remark.split('\n').join('\n  ') : ''
        parts.push(head + remark + '\n' + s.text.split('\n').map(function (l) { return '    ' + l }).join('\n'))
      }
      return parts.join('\n\n')
    }
    /** Text render of the "reference → hit" table: what the card will be able to show. */
    function refRender(refs) {
      if (!refs) return ''
      const head = '引用 ' + refs.total + ' 处（图片 ' + refs.images + '）· 命中 ' + refs.hit
      if (!refs.missing || !refs.missing.length) return head + ' · 没有缺失'
      const list = refs.missing.slice(0, 12).map(function (x) { return '    ✗ ' + x }).join('\n')
      return head + ' · 缺失 ' + refs.missing.length + '：\n' + list + (refs.missing.length > 12 ? '\n    …还有 ' + (refs.missing.length - 12) + ' 处' : '')
    }
    /** Text render of the custom lists, for note_lists and the tool card. */
    function listRender(listsView) {
      if (!listsView || listsView.length === 0) return '（本会话还没有自定义列表。用 note_lists action=create name=… 建一个）'
      const parts = []
      for (let i = 0; i < listsView.length; i++) {
        const l = listsView[i]
        let block = '[' + (i + 1) + '] 《' + l.name + '》 ' + l.count + ' 条'
        const show = l.items.slice(0, 30)
        for (let k = 0; k < show.length; k++) block += '\n    - ' + show[k].note + ' · ' + show[k].markId
        if (l.count > show.length) block += '\n    …还有 ' + (l.count - show.length) + ' 条'
        parts.push(block)
      }
      return parts.join('\n\n')
    }
    const SEL_ITEM = {
      type: 'object', additionalProperties: false,
      properties: {
        id: { type: 'string', required: true }, order: { type: 'integer', required: true }, seq: { type: 'integer', required: true },
        startLine: { type: 'integer', required: true }, startCol: { type: 'integer', required: true },
        endLine: { type: 'integer', required: true }, endCol: { type: 'integer', required: true },
        createdAt: { type: 'string', required: true }, fetched: { type: 'boolean', required: true },
        stale: { type: 'boolean', required: true }, text: { type: 'string', required: true },
        color: { type: 'string', required: true },
        // The two text styles are independent flags, so a mark can carry colour + italic +
        // underline at once. `style` stays as the derived single-word summary for readability.
        italic: { type: 'boolean', required: true },
        underline: { type: 'boolean', required: true },
        style: { type: 'string', required: true },
        // The reader's own note about this passage. Always present (empty string when there
        // is none) so the agent never has to guess whether the field exists.
        remark: { type: 'string', required: true },
      },
    }
    function firstLineOf(s) { const t = String(s).replace(/^\s+/, '').split('\n')[0]; return t.length > 48 ? t.slice(0, 48) + ' ...' : t }
    // A note_* tool call is the explicit act that binds this plugin to the calling
    // session. The session id is a PATH SEGMENT now, so binding is all that is needed:
    // there is no owner to protect and nothing to steal, and a session that never acts
    // is simply a session with no notes. Resolution stays loud — a tool that quietly
    // guessed a workspace is how a session once read a note it never asked for.
    async function enterFromTool(where, exec, opts) {
      if (!bindSessionFromExec(exec)) {
        throw new Error(where + ' 无法确定本会话：调用方没有可用的 agent/会话上下文（需要 session id 与工作区）。请在正常会话里调用，或先用 note_diag 确认。')
      }
      confirmed = true
      await ensureLoaded()
      // Management tools (list/create/open) must work in a session that has no note yet.
      if (!(opts && opts.allowEmpty)) await requireActiveNote(where)
    }
    /** Refuse (loudly) when the session has no note open, and say how to fix that. */
    async function requireActiveNote(where) {
      if (activeNote) return activeNote
      const names = await listNoteDirs()
      if (names.length) { await selectNote(names[0]); return activeNote }
      throw new Error(where + ' 失败：本会话还没有任何笔记。先用 note_create 建一份（可以 from=<文件路径> 从文件导入），note_list 可以看本会话有哪些笔记。')
    }
    /**
     * Create one note from text that is already in memory, plus its metadata (the asset root an
     * imported folder needs). Kept separate from createNote() so the folder import can make N
     * notes without re-reading the sources through the createNote() arguments.
     */
    async function createNoteFromText(nameRaw, text, meta) {
      const name = sanitizeNoteName(nameRaw)
      if (!name) return { ok: false, error: '笔记名不能为空' }
      const names = await listNoteDirs()
      if (names.indexOf(name) >= 0) return { ok: false, error: '已存在同名笔记: ' + name }
      const dir = sessionRoot() + '/' + name
      try {
        await mkdirAt(dir)
        await writeAt(dir + '/' + NOTE_FILE, String(text))
      } catch (err) { return { ok: false, error: '创建失败: ' + ((err && err.message) || String(err)) } }
      try {
        await writeAt(dir + '/' + NOTE_META, JSON.stringify(Object.assign({ v: 1 }, meta || {}), null, 2) + '\n')
      } catch (err) { fail('写入笔记元数据', err) }
      activeNote = name
      pathCache = null
      loadedBase = ''
      sessionNotes = null
      await writeSessionState()
      // No git here either: an imported note gets its repository when it first needs history. The
      // content and the metadata are what the import is for; 156 repositories are not.
      await load()
      return { ok: true, name: name, dir: dir }
    }
    /** Body of note_create: empty | text | file(path) | base64 upload. */
    async function createNote(input) {
      const a = input || {}
      const name = sanitizeNoteName(a.name)
      if (!name) return { ok: false, error: '笔记名不能为空（或只含路径分隔符/保留字符）' }
      const names = await listNoteDirs()
      if (names.indexOf(name) >= 0) return { ok: false, error: '已存在同名笔记: ' + name }
      let content = ''
      let kind = 'empty'
      if (typeof a.text === 'string' && a.text !== '') { content = a.text; kind = 'text' }
      else if (typeof a.from === 'string' && a.from) {
        const raw = await readIfExists(a.from)
        if (raw === null) return { ok: false, error: '导入失败：读不到文件 ' + a.from }
        content = String(raw).replace(/\r\n?/g, '\n')
        kind = 'file'
      } else if (typeof a.base64 === 'string' && a.base64) {
        content = Buffer.from(a.base64, 'base64').toString('utf8').replace(/\r\n?/g, '\n')
        kind = 'upload'
      }
      if (kind === 'empty') content = '# ' + name + '\n'
      const dir = sessionRoot() + '/' + name
      try {
        await mkdirAt(dir)
        await writeAt(dir + '/' + NOTE_FILE, content)
      } catch (err) { return { ok: false, error: '创建失败: ' + ((err && err.message) || String(err)) } }
      if (a.open !== false) {
        activeNote = name
        pathCache = null
        loadedBase = ''
        await writeSessionState()
        // Same deferral as an imported note: the repository appears the first time this note needs
        // history. Creating one here cost 6–8 subprocesses per note, which is a lot of nothing when
        // the caller is bulk-creating notes.
        await load()
      } else sessionNotes = null
      emit('notes', { active: activeNote, created: name })
      return { ok: true, name: name, active: activeNote, source: kind, lineCount: linesOf(content).length, dir: dir }
    }
    /** Clear the active note's body, keeping its git history (a commit records it). */
    async function clearNote(opts) {
      const a = opts || {}
      const name = activeNote
      if (!name) return { ok: false, error: '本会话没有打开的笔记' }
      const lines = linesOf(S.text).length
      const title = typeof a.title === 'string' && a.title ? String(a.title) : name
      const next = '# ' + title + '\n'
      if (canWrite()) {
        try { await commit('note: 清空前快照（' + lines + ' 行）') } catch (err) { }
        try { await writeAt(paths().note, next) } catch (err) { return { ok: false, error: '清空失败: ' + ((err && err.message) || String(err)) } }
        S.text = next; S.fileExists = true; S.savedAt = isoNow()
        S.selections = []
        S.revision += 1
        try { await persistState() } catch (err) { }
        try { await commit('note: 清空 ' + name + '（保留历史）') } catch (err) { }
      } else { S.text = next; S.selections = []; S.revision += 1 }
      emit('text', { revision: S.revision, active: activeNote })
      emit('notes', { active: activeNote })
      return { ok: true, name: name, clearedLines: lines, keptHistory: true }
    }
    /** Delete a note entirely — its directory, its state file and its git repository. */
    async function deleteNote(name, confirm) {
      const clean = sanitizeNoteName(name)
      if (!clean) return { ok: false, error: '笔记名非法' }
      const names = await listNoteDirs()
      if (names.indexOf(clean) < 0) return { ok: false, error: '笔记不存在: ' + String(name) }
      if (confirm !== true) return { ok: false, error: '删除需要显式确认（confirm: true）：整个目录连同 git 历史都会被删除，无法恢复。', needsConfirm: true, name: clean }
      try { await removeTree(sessionRoot() + '/' + clean) } catch (err) { return { ok: false, error: '删除失败: ' + ((err && err.message) || String(err)) } }
      const left = await listNoteDirs()
      sessionNotes = left
      if (activeNote === clean) {
        activeNote = left.length ? left[0] : ''
        pathCache = null
        loadedBase = ''
        await writeSessionState()
        await load()
      }
      emit('notes', { active: activeNote, deleted: clean })
      return { ok: true, deleted: clean, remaining: left, active: activeNote }
    }
    /** Rename a note's directory (its git history moves with it). */
    async function renameNote(from, to) {
      const a = sanitizeNoteName(from)
      const b = sanitizeNoteName(to)
      if (!a || !b) return { ok: false, error: '笔记名非法' }
      const names = await listNoteDirs()
      if (names.indexOf(a) < 0) return { ok: false, error: '笔记不存在: ' + String(from) }
      if (names.indexOf(b) >= 0) return { ok: false, error: '目标名已存在: ' + b }
      try { await moveTree(sessionRoot() + '/' + a, sessionRoot() + '/' + b) } catch (err) { return { ok: false, error: '重命名失败: ' + ((err && err.message) || String(err)) } }
      if (activeNote === a) {
        activeNote = b
        pathCache = null
        loadedBase = ''
        await writeSessionState()
        await load()
      }
      emit('notes', { active: activeNote, from: a, to: b })
      return { ok: true, from: a, to: b, active: activeNote }
    }
    /** Import text/file/upload into the ACTIVE note (append or replace). */
    async function importIntoActiveNote(input) {
      const a = input || {}
      if (!activeNote) return { ok: false, error: '本会话没有打开的笔记' }
      let content = ''
      let kind = ''
      if (typeof a.text === 'string' && a.text !== '') { content = a.text; kind = 'text' }
      else if (typeof a.from === 'string' && a.from) {
        const raw = await readIfExists(a.from)
        if (raw === null) return { ok: false, error: '导入失败：读不到文件 ' + a.from }
        content = String(raw).replace(/\r\n?/g, '\n'); kind = 'file'
      } else if (typeof a.base64 === 'string' && a.base64) {
        content = Buffer.from(a.base64, 'base64').toString('utf8').replace(/\r\n?/g, '\n'); kind = 'upload'
      } else return { ok: false, error: '需要 text、from 或 base64 之一' }
      const mode = a.mode === 'replace' ? 'replace' : 'append'
      const cur = String(S.text)
      const next = mode === 'replace' ? content : (cur.replace(/\s+$/, '') === '' ? content.replace(/^\s+/, '') : cur.replace(/\s+$/, '') + '\n\n' + content.replace(/^\s+/, ''))
      const r = await saveText(next, undefined)
      if (!r || r.ok !== true) return { ok: false, error: (r && r.error) || '写入失败' }
      if (canWrite()) { try { await commit('note: 导入到 ' + activeNote + '（' + kind + '）') } catch (err) { } }
      emit('text', { revision: S.revision, active: activeNote, source: kind })
      return { ok: true, name: activeNote, mode: mode, source: kind, lineCount: linesOf(next).length }
    }
    /** Remove a directory tree (note_delete). Prefers the fs service, falls back to shell. */
    async function removeTree(dir) {
      if (fs === undefined) throw new Error('fs 服务不可用')
      if (typeof fs.rm === 'function') {
        const target = await fs.resolve(dir, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
        await fs.rm(target, { recursive: true, force: true }, policyCache !== null ? policyCache : undefined)
        return
      }
      const r = await runShell('Remove-Item -LiteralPath "' + dir.replace(/"/g, '`"') + '" -Recurse -Force -ErrorAction Stop')
      if (!r.ok) throw new Error(r.err || '删除目录失败（fs.rm 与 shell 都不可用）')
    }
    /** Move/rename a directory tree. */
    async function moveTree(from, to) {
      const r = await runShell('Move-Item -LiteralPath "' + from.replace(/"/g, '`"') + '" -Destination "' + to.replace(/"/g, '`"') + '" -ErrorAction Stop')
      if (!r.ok) throw new Error(r.err || 'Move-Item 失败')
    }
    /** Run a raw shell command in the workspace root (directory operations only). */
    async function runShell(command) {
      if (shell === undefined) return { ok: false, err: 'shell 服务不可用' }
      const req = { command: command, workdir: base, timeoutMs: 30000 }
      if (policyCache !== null) req.sandboxPolicy = policyCache
      const spec = shell.resolve(req)
      const r = await shell.run(spec)
      const out = r && r.stdout && typeof r.stdout.text === 'string' ? r.stdout.text : ''
      const err = r && r.stderr && typeof r.stderr.text === 'string' ? r.stderr.text : ''
      return { ok: r && r.exitCode === 0, out: out.trim(), err: err.trim() }
    }
    /** Per-note summary rows for the panel and note_list. */
    /**
     * Derived per-note facts, keyed by the note's directory and validated by the fs version of the
     * file each one came from.
     *
     * `notesView` runs on every `state`, and the card polls `state` every 0.7 s. It used to read
     * three files per note and spawn `git rev-parse --short HEAD` for every note that is not the
     * active one: in a session with 16 notes a single poll measured 4242 ms, so the card was
     * permanently behind, a note switch queued behind that backlog into "超过一分钟", and every
     * other call on the plugin waited behind the same store lock. None of these facts change
     * unless the file behind them changes — and a commit is something only THIS plugin does, so
     * even the git head needs no subprocess per poll.
     */
    const noteFacts = new Map()
    /**
     * A counter that moves when a note's BACKGROUND git status changes, so the card's next poll
     * gets a full answer instead of `unchanged`. It is closure-level on purpose: the background task
     * finishes after the call that started it has already answered, so it must not touch store state.
     */
    let gitStatusRev = 0
    function factsOf(dir) {
      let f = noteFacts.get(dir)
      if (f === undefined) { f = {}; noteFacts.set(dir, f) }
      return f
    }
    /**
     * Create a note's repository on the git queue, after the caller has already answered.
     *
     * A note's own repository is what "one repository per note" means, and creating it costs three
     * subprocesses. Making the reader wait for those three is the last piece of git lag left, so the
     * save returns as soon as the file is written and this runs behind it — the status light in the
     * card's note menu reports yellow while it is in flight and green when it lands.
     */
    function queueRepoCreation(dir) {
      if (shell === undefined || dir === '') return
      const f = factsOf(dir)
      if (f.state === 'pending') return
      f.state = 'pending'
      gitStatusRev += 1
      // ONE slot for the whole sequence: the three commands share it instead of each queueing behind
      // the slot this task is already holding (which deadlocks).
      gitSlot(async function () {
        try {
          const init = await spawnGitIn(dir, 'init -q')
          if (!init.ok) { f.state = 'error'; gitStatusRev += 1; return }
          await spawnGitIn(dir, 'add -A')
          const c = await spawnGitIn(dir, '-c user.name="DSH Note" -c user.email="dsh-note@local" commit -q -m "note: init"')
          if (!c.ok) { f.state = 'error'; gitStatusRev += 1; return }
          const hash = (await headHashFromFiles(dir)) || ''
          f.hash = hash
          f.gitProbed = true
          f.gitHasHead = hash !== ''
          f.gitFor = f.textV
          f.state = 'ok'
          gitStatusRev += 1
        } catch (err) { f.state = 'error'; gitStatusRev += 1 }
      })
    }
    /**
     * The fs version of a file, or '' when it cannot be learned.
     *
     * '' means "unknown", and every caller treats it as "always re-read": an empty version must
     * never be mistaken for "unchanged", or a backend without lstat would cache forever.
     */
    /**
     * The commit hash read straight out of `.git` — no subprocess at all.
     *
     * `git rev-parse --short HEAD` is a process launch to read two small files: HEAD names a ref,
     * and that ref holds the 40-hex hash. Reading them through the fs service costs microseconds and
     * works for any number of notes, which is what finally takes git off the polling path. Anything
     * unusual (a packed ref is handled; a worktree's `.git` file is not) returns null and the caller
     * falls back to asking git for real.
     */
    async function headHashFromFiles(dir) {
      if (fs === undefined || dir === '') return null
      try {
        const head = await readIfExists(dir + '/.git/HEAD')
        if (head === null) return null
        const text = String(head).trim()
        if (/^[0-9a-f]{40}$/i.test(text)) return text.slice(0, 7)
        const m = /^ref:\s*(\S+)\s*$/.exec(text)
        if (m === null) return null
        const ref = m[1]
        const direct = await readIfExists(dir + '/.git/' + ref)
        if (direct !== null && /^[0-9a-f]{40}/i.test(String(direct).trim())) return String(direct).trim().slice(0, 7)
        const packed = await readIfExists(dir + '/.git/packed-refs')
        if (packed !== null) {
          const lines = String(packed).split('\n')
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line !== '' && line.charAt(0) !== '#' && line.slice(-ref.length) === ref) return line.slice(0, 7)
          }
        }
        return null
      } catch (err) { return null }
    }
    async function versionOf(p) {
      if (fs === undefined) return ''
      try {
        const target = await fs.resolve(p, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
        const st = await fs.lstat(target)
        if (!st) return ''
        if (st.version !== undefined && st.version !== null) return String(st.version)
        if (st.mtimeMs !== undefined) return String(st.mtimeMs) + '-' + String(st.size)
        return ''
      } catch (err) { return '' }
    }
    async function noteRow(dir, name, rootDirs) {
      const f = factsOf(dir)
      const isActive = name === activeNote
      const textV = await versionOf(dir + '/' + NOTE_FILE)
      if (f.textV !== textV || textV === '') {
        f.textV = textV
        f.lines = 0
        f.bytes = 0
        try {
          const raw = await readIfExists(dir + '/' + NOTE_FILE)
          if (raw !== null) { f.lines = linesOf(raw).length; f.bytes = raw.length }
        } catch (err) { }
        // A commit always follows a save, so the head is re-asked once per text change — never
        // once per poll.
        f.gitFor = undefined
      }
      const stateV = await versionOf(dir + '/' + STATE_FILE)
      if (f.stateV !== stateV || stateV === '') {
        f.stateV = stateV
        f.selections = 0
        try {
          const rawState = await readIfExists(dir + '/' + STATE_FILE)
          if (rawState !== null) {
            const parsed = JSON.parse(rawState)
            if (parsed && Array.isArray(parsed.selections)) f.selections = parsed.selections.length
          }
        } catch (err) { }
      }
      // Which imported folder this note came from, and where it sits inside it: both are already in
      // note.json. Cached by file version — no git, no subprocess, one tiny read the first time.
      const metaV = await versionOf(dir + '/' + NOTE_META)
      if (f.metaV !== metaV || metaV === '') {
        f.metaV = metaV
        f.group = ''
        f.origin = ''
        try {
          const rawMeta = await readIfExists(dir + '/' + NOTE_META)
          if (rawMeta !== null) {
            const m = JSON.parse(rawMeta)
            if (m && typeof m.assetRoot === 'string') f.group = m.assetRoot
            if (m && typeof m.origin === 'string') f.origin = m.origin
          }
        } catch (err) { }
      }
      // The path inside the imported folder, computed right here so nothing has to be ordered.
      const relPath = (function () {
        const key = typeof f.group === 'string' ? f.group.replace(/^.*?_assets\//, '') : ''
        const src = key !== '' && rootDirs && typeof rootDirs[key] === 'string' ? rootDirs[key].replace(/\\/g, '/').replace(/\/+$/, '') : ''
        const org = typeof f.origin === 'string' ? f.origin.replace(/\\/g, '/') : ''
        if (src === '' || org === '' || org.slice(0, src.length + 1) !== src + '/') return ''
        return org.slice(src.length + 1)
      })()
      const viewV = await versionOf(dir + '/' + VIEW_FILE)
      if (f.viewV !== viewV || viewV === '') {
        f.viewV = viewV
        f.viewLine = 0
        try {
          const rawView = await readIfExists(dir + '/' + VIEW_FILE)
          if (rawView !== null) {
            const pv = JSON.parse(rawView)
            if (pv && Number.isFinite(Number(pv.line))) f.viewLine = Math.max(1, Math.round(Number(pv.line)))
          }
        } catch (err) { }
      }
      if (isActive) f.hash = S.commitHash
      else if (f.gitFor !== f.textV) {
        f.gitFor = f.textV
        // Read the hash out of `.git` instead of launching `git rev-parse` once per note: with
        // 156 imported documents that difference is 156 process launches per pass.
        const fromFiles = await headHashFromFiles(dir)
        if (fromFiles !== null) {
          f.hash = fromFiles
          f.gitProbed = true
          f.gitHasHead = true
        } else if (!(await noteHasRepo(dir))) {
          // No repository yet — an imported note gets one when it first needs history.
          f.hash = ''
          f.gitProbed = true
          f.gitHasHead = false
        } else {
          // Unusual layout (worktree, packed ref we could not read): ask git, once.
          const r = await runGitIn(dir, 'rev-parse --short HEAD')
          f.hash = r.ok ? r.out : ''
          if (r.ok) { f.gitProbed = true; f.gitHasHead = true }
        }
      }
      return {
        name: name, active: isActive,
        lines: intOr(f.lines, 0), bytes: intOr(f.bytes, 0),
        commitHash: typeof f.hash === 'string' ? f.hash : '',
        selections: intOr(f.selections, 0), line: intOr(f.viewLine, 0),
        // The imported folder this note belongs to, and its path inside it (the menu's tree).
        group: typeof f.group === 'string' ? f.group : '',
        relPath: relPath,
      }
    }
    async function notesView() {
      const names = await listNoteDirs()
      sessionNotes = names
      // In parallel: the first poll of a session pays for all the git heads at once instead of in
      // a row, and every poll after that pays nothing at all.
      // One small read of the asset index per list, so each row can say where it sits inside the
      // folder it came from. Same file the import already keeps up to date.
      const rootDirs = {}
      try {
        const idx = await readAssetsIndex()
        for (let i = 0; i < (idx.roots || []).length; i++) {
          const r = idx.roots[i]
          if (r && typeof r.id === 'string' && typeof r.source === 'string') rootDirs[r.id] = r.source
        }
      } catch (err) { }
      return await Promise.all(names.map(function (name) { return noteRow(sessionRoot() + '/' + name, name, rootDirs) }))
    }
    /** The raw spawn, WITHOUT taking a queue slot. Only call this from inside a slot. */
    async function spawnGitIn(dir, args) {
      if (shell === undefined) return { ok: false, out: '', err: 'shell 服务不可用' }
      const req = { command: 'git ' + args, workdir: dir, timeoutMs: 30000 }
      if (policyCache !== null) req.sandboxPolicy = policyCache
      const spec = shell.resolve(req)
      const r = await shell.run(spec)
      const out = r && r.stdout && typeof r.stdout.text === 'string' ? r.stdout.text : ''
      const err = r && r.stderr && typeof r.stderr.text === 'string' ? r.stderr.text : ''
      return { ok: r && r.exitCode === 0, out: out.trim(), err: err.trim() }
    }
    /**
     * One git command, holding the queue slot for its duration.
     *
     * A compound operation must call {@link spawnGitIn} inside ONE slot instead of nesting calls: a
     * slot that waits for the queue it is already holding deadlocks (a background repository-creation
     * task hung the whole suite that way).
     */
    async function runGitIn(dir, args) {
      return await gitSlot(function () { return spawnGitIn(dir, args) })
    }
    registerToolLocked(harness.defineTool({
      name: 'note_get_selections',
      description: '读取笔记卡片里用户做过的全部标记(按正文先后排序的对象数组)。每项含 id、序号 order、起止行/列(1 基行号、0 基列号)、选中时间 createdAt、原文 text、是否已被取用过 fetched、原文是否已变动 stale。',
      parameters: { includeText: { type: 'boolean', description: '是否返回原文 text，默认 true。' }, note: { type: 'string', description: '要看哪一份笔记（默认当前打开的；指定别的名字不会切换卡片）' } },
      output: { schema: { type: 'array', items: SEL_ITEM }, render: function (a, v) { return [{ type: 'text', text: selRender(v) }] } },
      async execute(args, exec) {
        await enterFromTool('note_get_selections', exec)
        return await useNote(args && args.note, async function () {
        markTouched()
        const list = viewSelections()
        if (args && args.includeText === false) return list.map(function (s) { return Object.assign({}, s, { text: '' }) })
        return list
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_take_new_selections',
      description: '领取用户自上次领取之后新划选的内容(只返回 fetched=false 的对象，并立即把它们标记为已取用，避免重复返回)。回答用户问题前应先调用它，看看用户新划了哪些重点。',
      parameters: { note: { type: 'string', description: '取哪一份笔记的新标记（默认当前打开的）' } },
      output: { schema: { type: 'array', items: SEL_ITEM }, render: function (a, v) { return [{ type: 'text', text: v.length ? ('用户新选中了 ' + v.length + ' 段:\n\n' + selRender(v)) : '(没有新的选中内容)' }] } },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_take_new_selections', exec)
        return await useNote(args && args.note, async function () {
        markTouched()
        const freshIds = {}
        let count = 0
        for (let i = 0; i < S.selections.length; i++) if (!S.selections[i].fetched) { freshIds[S.selections[i].id] = true; count++ }
        const view = viewSelections()
        if (count > 0) {
          S.selections = S.selections.map(function (s) { return s.fetched ? s : Object.assign({}, s, { fetched: true, fetchedAt: isoNow() }) })
          S.revision += 1
          try { await persistState() } catch (err) { fail('写入选中记录', err) }
        }
        return view.filter(function (s) { return freshIds[s.id] === true })
        })
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_read',
      description: '读取笔记卡片当前正文(磁盘文件 note.md 的实时内容)。返回内容带行号，方便与选中对象的行号对应;也包含选中内容概览。',
      parameters: { withLineNumbers: { type: 'boolean', description: '是否在正文前加行号，默认 true。' }, note: { type: 'string', description: '要看哪一份笔记（默认当前打开的；指定别的名字不会切换卡片）' }, fromLine: { type: 'integer', description: '只读这一段的第一行(1 基，含)。省略则从头。' }, toLine: { type: 'integer', description: '读到这一行(1 基，含)。省略则到底。' }, padding: { type: 'integer', description: '上下各多读几行，默认 0。' } },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: { path: { type: 'string', required: true }, lineCount: { type: 'integer', required: true }, fromLine: { type: 'integer', required: true }, toLine: { type: 'integer', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true }, text: { type: 'string', required: true }, viewLine: { type: 'integer', required: true } },
        },
        render: function (a, v) {
          const numbered = v.text.split('\n').map(function (l, i) { return ('    ' + String(i + v.fromLine)).slice(-5) + '| ' + l }).join('\n')
          const range = (v.fromLine === 1 && v.toLine === v.lineCount) ? '' : (' 第 ' + v.fromLine + '-' + v.toLine + ' 行')
          const where = v.viewLine ? ('\n用户当前读到: 第 ' + v.viewLine + ' 行') : ''
          return [{ type: 'text', text: '笔记文件: ' + v.path + (range ? range : '') + ' (共 ' + v.lineCount + ' 行)' + where + '\n\n' + numbered + '\n\n--- 标记概览 ---\n' + v.selections }]
        },
      },
      async execute(args, exec) {
        await enterFromTool('note_read', exec)
        return await useNote(args && args.note, async function () {
        markTouched()
        const a = args || {}
        const all = linesOf(S.text)
        const pad = Math.max(0, intOr(a.padding, 0))
        let from = 1, to = all.length
        if (a.fromLine !== undefined || a.toLine !== undefined) {
          from = Math.max(1, intOr(a.fromLine, 1) - pad)
          to = Math.min(all.length, intOr(a.toLine, all.length) + pad)
          if (to < from) to = from
        }
        return { path: paths().note, lineCount: all.length, fromLine: from, toLine: to, revision: S.revision, selections: selRender(viewSelections()), text: all.slice(from - 1, to).join('\n'), viewLine: S.view && Number.isFinite(Number(S.view.line)) ? Math.max(1, Math.round(Number(S.view.line))) : 0 }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_diag',
      description: '诊断笔记卡片的运行环境（只读）：返回落盘路径、所属会话、git 状态与最后一次错误。',
      parameters: {},
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: { path: { type: 'string', required: true }, baseFrom: { type: 'string', required: true }, confirmed: { type: 'boolean', required: true }, touched: { type: 'boolean', required: true }, sessionId: { type: 'string', required: true }, gitReady: { type: 'boolean', required: true }, gitTrace: { type: 'string', required: true }, error: { type: 'string', required: true } },
        },
        render: function (a, v) { return [{ type: 'text', text: 'path=' + v.path + '\nbaseFrom=' + v.baseFrom + ' confirmed=' + v.confirmed + ' touched=' + v.touched + '\nownerSessionId=' + v.sessionId + '\ngitReady=' + v.gitReady + '\nerror=' + v.error }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_diag', exec, { allowEmpty: true })
        markTouched()
        return { path: paths().note, baseFrom: baseFrom, confirmed: confirmed, touched: S.touched === true, sessionId: sessionId, gitReady: S.gitReady, gitTrace: S.gitTrace, error: S.error }
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_write',
      description: '把 Markdown 内容写进笔记卡片(也就是磁盘上的 note.md)，写完立刻显示在卡片里。mode=append 追加到末尾(默认)、replace 整篇覆盖、prepend 插到最前面。默认会自动 git 提交一次;用户已有的选中对象行号会自动跟着重算。',
      parameters: {
        content: { type: 'string', required: true, description: '要写入的 Markdown 文本。' },
        mode: { type: 'string', enum: ['append', 'replace', 'prepend'], description: '写入方式，默认 append。' },
        commit: { type: 'boolean', description: '是否写完后自动 git 提交，默认 true。' },
      },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: { path: { type: 'string', required: true }, lineCount: { type: 'integer', required: true }, revision: { type: 'integer', required: true }, committed: { type: 'boolean', required: true }, commit: { type: 'string', required: true } },
        },
        render: function (a, v) { return [{ type: 'text', text: '已写入 ' + v.path + ' (现在共 ' + v.lineCount + ' 行)' + (v.committed ? '; git: ' + v.commit : '; 未提交 ' + v.commit) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_write', exec)
        markTouched()
        const content = String(args && args.content !== undefined ? args.content : '')
        const mode = args && args.mode ? String(args.mode) : 'append'
        const cur = S.text
        const trimmed = cur.replace(/\s+$/, '')
        let next
        if (mode === 'replace') next = content
        else if (mode === 'prepend') next = content.replace(/\s+$/, '') + '\n\n' + cur
        else next = (trimmed === '' ? '' : trimmed + '\n\n') + content.replace(/^\s+/, '')
        const r = await saveText(next)
        let committed = false
        let info = ''
        if (r && r.ok) {
          if (!args || args.commit !== false) {
            const c = await commit('note(ai): ' + firstLineOf(content))
            committed = c.ok === true && c.nothing !== true
            info = c.ok ? (c.hash || 'ok') : (c.error || 'commit failed')
          } else info = 'skipped'
        } else info = (r && r.error) || 'write failed'
        return { path: paths().note, lineCount: linesOf(S.text).length, revision: S.revision, committed: committed, commit: info }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_commit',
      description: '把笔记卡片当前内容 git 提交一次(用户点保存按钮做的是同一件事)。',
      parameters: { message: { type: 'string', description: '提交信息，省略则自动生成。' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, hash: { type: 'string', required: true }, message: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('git 提交: ' + v.hash + ' ' + v.message) : ('提交失败: ' + v.message) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        // This one called adoptFromExec but never ensureLoaded, so committing before
        // any other note call ran against an unloaded store.
        await enterFromTool('note_commit', exec)
        markTouched()
        const r = await commit(args && args.message ? args.message : '')
        return { ok: r.ok === true, hash: r.hash || '', message: r.ok ? (r.nothing ? '没有需要提交的改动' : String(r.message || '')) : String(r.error || '未知错误') }
        })
      },
    }))

    // ── 笔记管理工具（本次升级新增）────────────────────────────────────────────
    // These act on the calling session's own note space, so they work even when the
    // session has no note yet (opts.allowEmpty).
    registerToolLocked(harness.defineTool({
      name: 'note_list',
      description: '列出本会话的所有笔记（每份笔记是 dsh-window/note/<会话id>/<笔记名>/ 下的一个目录，各有自己的 git）。标注当前打开的是哪一份。',
      parameters: {},
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            notesDir: { type: 'string', required: true },
            active: { type: 'string', required: true },
            notes: {
              type: 'array', required: true,
              items: {
                type: 'object', additionalProperties: false,
                properties: { name: { type: 'string', required: true }, active: { type: 'boolean', required: true }, group: { type: 'string' }, relPath: { type: 'string' }, lines: { type: 'integer', required: true }, bytes: { type: 'integer', required: true }, commitHash: { type: 'string', required: true }, selections: { type: 'integer', required: true }, line: { type: 'integer', required: true } },
              },
            },
          },
        },
        render: function (a, v) {
          const rows = (v.notes || []).map(function (n) { return (n.active ? '* ' : '- ') + n.name + '  ' + n.lines + ' 行' + (n.line ? '  (读到第 ' + n.line + ' 行)' : '') + (n.commitHash ? '  git ' + n.commitHash : '') })
          return [{ type: 'text', text: '会话 ' + v.notesDir.split('/').slice(-1)[0] + ' 的笔记（' + (v.notes || []).length + ' 份）' + (v.active ? '，当前打开: ' + v.active : '，当前没有打开任何笔记') + '\n' + (rows.length ? rows.join('\n') : '(还没有笔记，用 note_create 新建)') }]
        },
      },
      async execute(args, exec) {
        await enterFromTool('note_list', exec, { allowEmpty: true })
        const notes = await notesView()
        return { notesDir: sessionRoot(), active: activeNote, notes: notes }
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_create',
      description: '在本会话新建一份笔记并默认打开它。支持三种来源：空笔记(默认)、从工作区里的文件导入(from=<路径>)、或直接给内容(text)。新建后会在该笔记目录初始化 git 并提交一次。',
      parameters: {
        name: { type: 'string', required: true, description: '笔记名（作为目录名；中文可用，路径分隔符会自动替换为 -）' },
        from: { type: 'string', description: '从哪个文件导入内容（绝对路径或相对工作区）' },
        text: { type: 'string', description: '直接作为初始内容' },
        open: { type: 'boolean', description: '是否立即打开，默认 true' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, name: { type: 'string', required: true }, active: { type: 'string', required: true }, source: { type: 'string', required: true }, lineCount: { type: 'integer', required: true }, dir: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已新建笔记《' + v.name + '》(' + v.source + ', ' + v.lineCount + ' 行)' + (v.active === v.name ? '，并已打开' : '') + '\n目录: ' + v.dir) : ('新建失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_create', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const r = await createNote(args || {})
          // Every property of this output is required, `error` included, and the harness
          // validates the output of a SUCCESSFUL call too: returning createNote()'s raw
          // success shape (which has no `error`) made the whole call fail with "missing
          // required property value.error" — the note WAS created, but the model was told
          // it had failed. Normalize both paths instead of relaxing the schema.
          return Object.assign({ ok: false, name: String((args && args.name) || ''), active: activeNote, source: '', lineCount: 0, dir: '', error: '' }, r)
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_open',
      description: '切换本会话当前打开的笔记（之后所有 note_* 工具都作用于它）。',
      parameters: { name: { type: 'string', required: true, description: '本会话已有的笔记名' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, active: { type: 'string', required: true }, lineCount: { type: 'integer', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已切换到《' + v.active + '》(' + v.lineCount + ' 行)') : ('切换失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_open', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const r = await selectNote(args && args.name)
          return r.ok ? { ok: true, active: activeNote, lineCount: linesOf(S.text).length, error: '' } : { ok: false, active: activeNote, lineCount: 0, error: r.error }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_clear',
      description: '清空当前笔记的正文，但**保留它的 git 历史**（清空前会自动提交一次快照，清空后再提交一次）。想彻底删除整份笔记请用 note_delete。',
      parameters: { title: { type: 'string', description: '清空后写入的标题，默认用笔记名' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, name: { type: 'string', required: true }, clearedLines: { type: 'integer', required: true }, keptHistory: { type: 'boolean', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已清空《' + v.name + '》(' + v.clearedLines + ' 行被清掉，git 历史保留)') : ('清空失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_clear', exec)
        return await withNoteLock(noteLockKey(), async function () {
          const r = await clearNote(args || {})
          // Same reason as note_create: the schema requires `error` on both paths, so a
          // successful clear has to carry it (see the comment there).
          return Object.assign({ ok: false, name: activeNote, clearedLines: 0, keptHistory: true, error: '' }, r)
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_delete',
      description: '永久删除某份笔记：整个目录（note.md、选中记录、以及它自己的 .git 历史）都会被删除，无法恢复。必须带 confirm: true。',
      parameters: { name: { type: 'string', required: true, description: '要删除的笔记名' }, confirm: { type: 'boolean', description: '必须为 true 才会真的删除' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, deleted: { type: 'string', required: true }, name: { type: 'string' }, active: { type: 'string', required: true }, remaining: { type: 'array', required: true, items: { type: 'string' } }, needsConfirm: { type: 'boolean', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已删除《' + v.deleted + '》连同其 git；本会话还剩 ' + v.remaining.length + ' 份' + (v.active ? '，当前打开《' + v.active + '》' : '')) : ('删除失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_delete', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const r = await deleteNote(args && args.name, !!(args && args.confirm))
          return Object.assign({ deleted: '', active: activeNote, remaining: sessionNotes || [], needsConfirm: false, error: '' }, r)
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_rename',
      description: '重命名一份笔记（目录改名，它的 git 历史随之保留）。',
      parameters: { from: { type: 'string', required: true }, to: { type: 'string', required: true } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, from: { type: 'string', required: true }, to: { type: 'string', required: true }, active: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已重命名: ' + v.from + ' -> ' + v.to) : ('重命名失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_rename', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const r = await renameNote(args && args.from, args && args.to)
          return Object.assign({ from: '', to: '', active: activeNote, error: '' }, r)
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_import',
      description: '把外部内容导入到当前笔记：from=<文件路径> 或 text=<直接内容>；mode=append(默认,追加) / replace(覆盖)。',
      parameters: { from: { type: 'string', description: '源文件路径' }, text: { type: 'string', description: '直接给内容' }, mode: { type: 'string', enum: ['append', 'replace'], description: '导入方式' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, name: { type: 'string', required: true }, mode: { type: 'string', required: true }, source: { type: 'string', required: true }, lineCount: { type: 'integer', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已导入到《' + v.name + '》(' + v.mode + ', 来源 ' + v.source + ')，现在 ' + v.lineCount + ' 行') : ('导入失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_import', exec)
        return await withNoteLock(noteLockKey(), async function () {
          const r = await importIntoActiveNote(args || {})
          return Object.assign({ name: activeNote, mode: 'append', source: '', lineCount: 0, error: '' }, r)
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_export',
      description: '把当前笔记正文导出（复制）到一个外部文件路径，方便交给别的会话/工具。',
      parameters: { to: { type: 'string', required: true, description: '目标文件路径' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, to: { type: 'string', required: true }, bytes: { type: 'integer', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已导出到 ' + v.to + ' (' + v.bytes + ' 字节)') : ('导出失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_export', exec)
        const to = String((args && args.to) || '')
        if (!to) return { ok: false, to: '', bytes: 0, error: '需要 to 参数' }
        try { await writeAt(to, S.text) } catch (err) { return { ok: false, to: to, bytes: 0, error: (err && err.message) || String(err) } }
        return { ok: true, to: to, bytes: S.text.length, error: '' }
      },
    }))


    // ── 面板用的笔记管理 RPC（本次升级新增）──────────────────────────────────
    handleLocked('listNotes', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('listNotes')
      confirmed = true
      await ensureLoaded()
      return { ok: true, notesDir: sessionRoot(), active: activeNote, notes: await notesView(), sessionId: sessionId }
    })
    handleLocked('createNote', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('createNote')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await createNote(a)
        return Object.assign({}, r, { notes: await notesView(), active: activeNote })
      })
    })
    handleLocked('selectNote', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('selectNote')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await selectNote(a.name)
        if (!r.ok) return { ok: false, error: r.error }
        const v = stateView(a.sessionId)
        v.notes = await notesView()
        v.active = activeNote
        v.ok = true
        return v
      })
    })
    handleLocked('clearNote', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('clearNote')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await clearNote(a)
        return Object.assign({}, r, { notes: await notesView(), active: activeNote })
      })
    })
    handleLocked('deleteNote', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('deleteNote')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await deleteNote(a.name, !!(a.confirm))
        return Object.assign({}, r, { notes: await notesView(), active: activeNote })
      })
    })
    handleLocked('renameNote', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('renameNote')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await renameNote(a.from, a.to)
        return Object.assign({}, r, { notes: await notesView(), active: activeNote })
      })
    })
    handleLocked('importNote', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('importNote')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await importIntoActiveNote(a)
        return Object.assign({}, r, { notes: await notesView(), active: activeNote, lineCount: linesOf(S.text).length, revision: S.revision })
      })
    })

    handleLocked('state', async function (args) {
      const callerId = args && typeof args.sessionId === 'string' ? args.sessionId : ''
      if (!bindSession(callerId)) return { ok: false, error: 'no-session', inactive: true }
      confirmed = true
      await ensureLoaded()
      const rev = args && typeof args.revision === 'number' ? args.revision : -1
      // A client that does not send a uiRevision gets a full answer every time: correct, just
      // chattier. The alternative (treating a missing value as "unchanged") is what made
      // /window-note start/stop need a browser refresh.
      const uiArg = args && typeof args.uiRevision === 'number' ? args.uiRevision : -1
      // `revision` alone is NOT proof that the client already holds this content: it counts per
      // store, in memory, so two different notes (or two sessions) easily reach the same number.
      // A card showing note X at revision 7 that then asked about note Y — also at 7 — was told
      // "unchanged" and kept the stale text, which is the reported "笔记第一次加载很久都不会加载
      // 出来，只有换一个笔记再换回来才行". So the client echoes the note it is displaying, and a
      // mismatch forces a full answer.
      const noteArg = args && typeof args.note === 'string' ? args.note : null
      const sinceArg = args && typeof args.since === 'number' ? args.since : 0
      // The status light of the note rows changes on a background completion, when neither the text
      // nor the note moved. A client that echoes what it last saw gets told about it; one that does
      // not (an older bundle) is treated as up to date, so it stays as cheap as before.
      const gitArg = args && typeof args.gitRevision === 'number' ? args.gitRevision : gitStatusRev
      const fresh = eventsSince(sinceArg)
      // "unchanged" only when the revisions match AND nothing happened since the client's last
      // event id: otherwise a fine-grained event (a rename, a mark, a reading position) would be
      // swallowed by the cheap answer.
      // A background repository finished (or failed) since the client last asked: the note rows carry
      // a status light, so that change has to reach the card even though the text and the note did
      // not move. It is a closure-level counter, not store state, because the background task runs
      // after the call that started it has already answered.
      if (rev === S.revision && uiArg === uiRev && noteArg === activeNote && fresh.length === 0 && gitStatusRev === gitArg) {
        return { unchanged: true, revision: S.revision, uiRevision: uiRev, gitRevision: gitStatusRev, active: activeNote, eventId: eventSeq }
      }
      // The panel needs full note rows (name, lines, commit), not just the names the
      // store keeps for itself — merging a name list over them rendered "undefined".
      const v = stateView(callerId, sinceArg)
      v.notes = await notesView()
      v.active = activeNote
      return v
    })
    // Writes must never happen on behalf of a session that did not identify itself:
    // without this, a poll from an unrelated session could mutate the store of
    // whoever owns it. Reads stay available (state answers `inactive`).
    function notMine(where) { return { ok: false, error: 'inactive', where: where } }
    /** Serialize every mutation of this note (see withNoteLock) under one key. */
    function noteLockKey() { return 'note:' + base }
    handleLocked('saveText', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('saveText')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), function () {
        return saveText(a.text, typeof a.baseRevision === 'number' ? a.baseRevision : undefined)
      })
    })
    handleLocked('addSelection', async function (args) {
      const a = args || {}
      if (!bindSession(a.sessionId)) return notMine('addSelection')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), function () { return addSelection(a) })
    })
    handleLocked('removeSelection', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('removeSelection')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const id = args && args.id ? String(args.id) : ''
        S.selections = S.selections.filter(function (s) { return s.id !== id })
        S.revision += 1
        try { await persistState() } catch (err) { fail('写入选中记录', err) }
        return { ok: true, revision: S.revision, selections: viewSelections() }
      })
    })
    // Every mark of every note in this session, for the card's session view. Read-only: it
    // touches no store, so it cannot disturb the note the user is looking at.
    handleLocked('allMarks', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('allMarks')
      confirmed = true
      await ensureLoaded()
      const names = await listNoteDirs()
      const out = []
      for (let i = 0; i < names.length; i++) {
        const name = names[i]
        const dir = sessionRoot() + '/' + name
        let marks = []
        let lines = 0
        try {
          const rawNote = await readIfExists(dir + '/' + NOTE_FILE)
          if (rawNote !== null) lines = linesOf(rawNote).length
        } catch (err) { }
        try {
          const rawState = await readIfExists(dir + '/' + STATE_FILE)
          if (rawState !== null) {
            const parsed = JSON.parse(rawState)
            const list = parsed && Array.isArray(parsed.selections) ? parsed.selections : []
            for (let k = 0; k < list.length; k++) {
              const s = normalizeSel(list[k])
              if (s !== null) marks.push(s)
            }
            marks = sortSelections(marks)
          }
        } catch (err) { }
        out.push({ note: name, active: name === activeNote, lines: lines, marks: marks })
      }
      return { ok: true, notes: out, active: activeNote }
    })
    // ── custom lists over RPC (the card's own 添加到 / 新建列表 buttons) ──────────────
    handleLocked('lists', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('lists')
      confirmed = true
      await ensureLoaded()
      return { ok: true, lists: viewLists() }
    })
    handleLocked('listCreate', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('listCreate')
      confirmed = true
      await ensureLoaded()
      const r = await listCreate(args && args.name)
      return Object.assign({ lists: viewLists() }, r)
    })
    handleLocked('listRename', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('listRename')
      confirmed = true
      await ensureLoaded()
      const r = await listRename(args && args.from, args && args.to)
      return Object.assign({ lists: viewLists() }, r)
    })
    handleLocked('listDelete', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('listDelete')
      confirmed = true
      await ensureLoaded()
      const r = await listDelete(args && args.name)
      return Object.assign({ lists: viewLists() }, r)
    })
    handleLocked('listAdd', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('listAdd')
      confirmed = true
      await ensureLoaded()
      const r = await listAdd(args && args.name, args && args.note, args && args.markId)
      return Object.assign({ lists: viewLists() }, r)
    })
    handleLocked('listRemove', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('listRemove')
      confirmed = true
      await ensureLoaded()
      const r = await listRemove(args && args.name, args && args.note, args && args.markId)
      return Object.assign({ lists: viewLists() }, r)
    })
    // The agent's view commands: the card performs them on its next poll and acknowledges by id.
    handleLocked('uiPush', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('uiPush')
      confirmed = true
      await ensureLoaded()
      const cmd = args && args.cmd
      if (cmd === null || typeof cmd !== 'object' || Array.isArray(cmd)) return { ok: false, error: 'cmd 必须是一个对象' }
      return pushUi(cmd)
    })
    handleLocked('uiAck', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('uiAck')
      confirmed = true
      return ackUi(args && args.id)
    })
    // The remark the reader typed for a selection (the long press on [选中] opens the input).
    handleLocked('setRemark', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('setRemark')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await setRemark(args && args.id, args && args.remark)
        return { ok: r.ok === true, found: r.found === true, id: String((args && args.id) || ''), remark: typeof r.remark === 'string' ? r.remark : '', revision: r.revision, selections: r.selections, error: r.ok ? '' : String(r.error || '') }
      })
    })
    // The reader's function card on a mark: change its colour, its style, or both. One RPC for
    // every button, because the store treats both as fields of the same record.
    handleLocked('setMarkLook', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('setMarkLook')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        const r = await setMarkLook(args && args.id, args || {})
        return { ok: r.ok === true, found: r.found === true, id: String((args && args.id) || ''), color: typeof r.color === 'string' ? r.color : '', italic: r.italic === true, underline: r.underline === true, style: typeof r.style === 'string' ? r.style : '', revision: r.revision, selections: r.selections, error: r.ok ? '' : String(r.error || '') }
      })
    })
    // Where the reader is, so switching notes (or coming back tomorrow) resumes in place.    // Deliberately NOT part of the guarded selection state and not a revision bump: it is
    // written silently, often, and must not disturb the text/selection bookkeeping.
    handleLocked('saveView', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('saveView')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        try { return await saveView(args) } catch (err) { return { ok: false, error: '写入阅读位置失败: ' + ((err && err.message) || String(err)) } }
      })
    })
    // `args` MUST be declared: this handler was the only one without the parameter, so
    // `args && args.sessionId` threw a ReferenceError inside the handler and every call
    // answered { ok:false, error:"args is not defined" }. The card only reacts to ok:true,
    // so the button did nothing at all and said nothing — the reported
    // "清空全部标记功能失效". verify-notes now calls all 15 RPCs so this cannot come back.
    handleLocked('clearSelections', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('clearSelections')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), async function () {
        S.selections = []
        S.revision += 1
        try { await persistState() } catch (err) { fail('写入选中记录', err) }
        return { ok: true, revision: S.revision, selections: viewSelections() }
      })
    })
    handleLocked('commit', async function (args) {
      if (!bindSession(args && args.sessionId)) return notMine('commit')
      confirmed = true
      await ensureLoaded()
      return await withNoteLock(noteLockKey(), function () {
        return commit(args && args.message ? args.message : '')
      })
    })
    /**
     * Serve one image (or other file) referenced by the note.
     *
     * Resolution is ONE rule, deliberately: relative references resolve against the note's asset
     * root inside the mirror (`note/_assets/<rootId>/…`). There is no fallback to the note's own
     * directory and none to the original folder on disk — rendering reads the mirror or nothing,
     * because "the card can read any path on this machine" is exactly what mirroring is meant to
     * remove. The resolved target is checked to be inside `note/` before anything is read.
     */
    handleLocked('asset', async function (args) {
      await ensureLoaded()
      const p = String((args && args.path) || '')
      if (!p) return { ok: false, error: 'empty path' }
      if (/^[a-z]+:\/\//i.test(p)) return { ok: false, error: 'not a local path' }
      if (/^[A-Za-z]:/.test(p) || p.indexOf('\\') >= 0) return { ok: false, error: '越界：只允许相对路径（素材必须镜像在 note/ 里）' }
      try {
        if (fs === undefined) return { ok: false, error: 'fs 不可用' }
        const meta = await readNoteMeta(activeNote)
        const root = typeof meta.assetRoot === 'string' ? meta.assetRoot : ''
        if (root === '') return { ok: false, error: '这份笔记没有素材根（用「导入文件夹」创建才有）' }
        // Normalise the reference first (`.` and `..` are resolved textually), then build the
        // ABSOLUTE target and check that it is inside the mirror. Comparing a relative path
        // against the absolute note-space prefix is a bug that refuses every single image.
        const rel = joinInsideMirror(p)
        if (rel === '') return { ok: false, error: '空路径' }
        const mirrorPrefix = noteSpaceRoot() + '/' + ASSETS_DIR + '/'
        const safe = mirrorPrefix + String(root).replace(/^.*?_assets\//, '') + '/' + rel
        const norm = joinInsideMirror(safe)
        // Compare like with like: `mirrorPrefix` is built from the session's workspace (native
        // separators on Windows) while the resolved path is always forward-slash, so a raw prefix
        // test rejected EVERY image with 越界 — measured on a real note whose mirror was present and
        // correct (218 files, images/ holding 216). My own acceptance harness passed because it fed
        // the workspace with forward slashes: the test normalised what the real world does not.
        if (norm.indexOf(mirrorPrefix.replace(/\\/g, '/')) !== 0) return { ok: false, error: '越界：' + p + ' 解析到了 note/_assets 之外，已拒绝' }
        let lastErr = ''
        try {
          const target = await fs.resolve(norm)
          const bytes = await fs.readBytes(target, undefined, 32 * 1024 * 1024)
          const mime = mimeOf(p)
          return { ok: true, mime: mime, size: bytes.length, hit: norm, root: root, dataUrl: 'data:' + mime + ';base64,' + b64(bytes) }
        } catch (err) { lastErr = (err && err.message) ? err.message : String(err) }
        return { ok: false, error: '找不到 ' + p + '（素材根 ' + root + '）: ' + lastErr }
      } catch (err) { return { ok: false, error: (err && err.message) ? err.message : String(err) } }
    })
    /** Re-sync a note with its source folder: mirror + take the source .md if it changed. */
    handleLocked('syncNote', async function (args) {
      await ensureLoaded()
      const note = args && args.note ? sanitizeNoteName(args.note) : activeNote
      if (!note) return { ok: false, error: '本会话没有打开的笔记' }
      const r = await syncNoteFromOrigin(note)
      return {
        ok: r.ok === true, note: note, changed: r.changed === true, files: intOr(r.files, 0), bytes: intOr(r.bytes, 0),
        refs: r.refs || null, source: typeof r.source === 'string' ? r.source : '',
        warn: typeof r.warn === 'string' ? r.warn : '',
        error: r.ok ? '' : String(r.error || ''),
      }
    })
    /** What the card and the tools need to know about this note's assets. */
    handleLocked('assets', async function (args) {
      await ensureLoaded()
      const note = args && args.note ? sanitizeNoteName(args.note) : activeNote
      if (!note) return { ok: false, error: '本会话没有打开的笔记' }
      const meta = await readNoteMeta(note)
      const index = await readAssetsIndex()
      const rootId = typeof meta.assetRoot === 'string' ? meta.assetRoot.replace(ASSETS_DIR + '/', '') : ''
      const entry = index.roots.filter(function (r) { return r && r.id === rootId })[0] || null
      return {
        ok: true,
        note: note,
        assetRoot: typeof meta.assetRoot === 'string' ? meta.assetRoot : '',
        origin: typeof meta.origin === 'string' ? meta.origin : '',
        rootId: rootId,
        files: entry ? intOr(entry.files, 0) : 0,
        bytes: entry ? intOr(entry.bytes, 0) : 0,
        source: entry && typeof entry.source === 'string' ? entry.source : '',
        roots: index.roots,
      }
    })
    /** `.md` files inside a folder, so the card can offer them as a checklist. */
    handleLocked('scanFolder', async function (args) {
      await ensureLoaded()
      const dir = String((args && args.dir) || '').trim()
      if (dir === '') return { ok: false, error: '需要 dir', files: [] }
      const r = await listMarkdownIn(dir)
      return Object.assign({ dir: dir, suggestions: r.suggestions || null }, r)
    })
    /**
     * Import a folder: mirror it once into the asset area, then create one note per selected
     * `.md`. Every note of that folder SHARES the single mirrored root, which is what stops a
     * folder with ten markdown files from being copied ten times.
     *
     * ONE implementation for the card's RPC and the agent's tool. They used to be two copies, and
     * the RPC one still reported "already exists" as a failure — so pressing the button twice said
     * 没有任何笔记被创建 even though the note was there (reported as "导入老是失败").
     */
    async function runFolderImport(a) {
      const dir = String((a && a.dir) || '').trim()
      const files = Array.isArray(a && a.files) ? a.files.filter(function (f) { return typeof f === 'string' && f !== '' }) : []
      if (dir === '') return { ok: false, rootId: '', assetRoot: '', reused: false, files: 0, bytes: 0, created: [], error: '需要 dir' }
      if (!files.length) return { ok: false, rootId: '', assetRoot: '', reused: false, files: 0, bytes: 0, created: [], error: '至少选一个 .md 文件' }
      const rootId = assetRootIdFor(dir)
      const dest = assetsRoot() + '/' + rootId
      const index = await readAssetsIndex()
      const known = index.roots.filter(function (r) { return r && r.id === rootId })[0] || null
      const mirror = await mirrorFolder(dir, rootId, { incremental: known !== null })
      if (!mirror.ok) return { ok: false, rootId: rootId, assetRoot: '', reused: known !== null, files: 0, bytes: 0, created: [], error: String(mirror.error) }
      const counted = await countTree(dest)
      if (counted.files > MIRROR_MAX_FILES) return { ok: false, rootId: rootId, assetRoot: '', reused: known !== null, files: counted.files, bytes: counted.bytes, created: [], error: '这个目录有 ' + counted.files + ' 个文件，超过镜像上限 ' + MIRROR_MAX_FILES }
      if (counted.bytes > MIRROR_MAX_BYTES) return { ok: false, rootId: rootId, assetRoot: '', reused: known !== null, files: counted.files, bytes: counted.bytes, created: [], error: '这个目录约 ' + Math.round(counted.bytes / 1048576) + ' MB，超过镜像上限 ' + Math.round(MIRROR_MAX_BYTES / 1048576) + ' MB' }
      const roots = index.roots.filter(function (r) { return r && r.id !== rootId })
      roots.push({ id: rootId, label: sanitizeNoteName(String((a && a.label) || '')) || rootId, source: dir, mirroredAt: isoNow(), files: counted.files, bytes: counted.bytes, mode: 'all', reuse: known !== null })
      await writeAssetsIndex({ roots: roots })
      const created = []
      let made = 0
      let existing = 0
      let firstFail = ''
      const notesNow = await noteIndex()
      const taken = []
      const rootDirArg = dir.replace(/\\/g, '/').replace(/\/+$/, '')
      for (let i = 0; i < files.length; i++) {
        const raw = String(files[i])
        const rel = raw.replace(/\\/g, '/')
        const origin = rootDirArg + '/' + rel
        const plan = planNoteName(notesNow, rel, origin, taken)
        if (plan === null) { created.push({ file: raw, ok: false, error: '名字不合法' }); if (!firstFail) firstFail = raw + '：名字不合法'; continue }
        if (plan.reuse) { existing += 1; created.push({ file: raw, note: plan.name, ok: true, existing: true, error: '' }); continue }
        taken.push(plan.name)
        // Keep the REAL read error (readIfExists swallows it) and retry once: a file can be
        // momentarily busy while something else is writing it.
        let text = null
        let readErr = ''
        for (let attempt = 0; attempt < 2 && text === null; attempt++) {
          try {
            const source = await readIfExists(origin)
            if (source === null) readErr = '读不到（文件不存在，或读取被拒绝）'
            else text = String(source).replace(/\r\n?/g, '\n')
          } catch (err) { readErr = (err && err.message) ? err.message : String(err) }
          if (text === null && attempt === 0) await new Promise(function (r) { setTimeout(r, 300) })
        }
        if (text === null) { created.push({ file: raw, ok: false, error: readErr }); if (!firstFail) firstFail = raw + '：' + readErr; continue }
        const r = await createNoteFromText(plan.name, text, { assetRoot: ASSETS_DIR + '/' + rootId, origin: origin })
        if (r.ok) { made += 1; created.push({ file: raw, note: plan.name, ok: true, renamed: plan.name !== sanitizeNoteName(rel.split('/').pop().replace(/\.(md|markdown)$/i, '')), error: '' }) }
        else if (/已存在同名笔记/.test(String(r.error || ''))) { existing += 1; created.push({ file: raw, note: plan.name, ok: true, existing: true, error: '' }) }
        else { created.push({ file: raw, note: plan.name, ok: false, error: String(r.error || '') }); if (!firstFail) firstFail = raw + '：' + String(r.error || '') }
      }
      emit('notes', { imported: made, root: rootId })
      return {
        ok: made > 0 || existing > 0, rootId: rootId, assetRoot: ASSETS_DIR + '/' + rootId, reused: known !== null,
        files: counted.files, bytes: counted.bytes, created: created, made: made, existing: existing,
        error: (made + existing) > 0 ? '' : ('没有任何笔记被创建' + (firstFail ? ' —— ' + firstFail : '')),
      }
    }
    function normPathKey(p) { return String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() }
    /** Every note of this session with the origin it was made from. */
    async function noteIndex() {
      const names = await listNoteDirs()
      const out = []
      for (let i = 0; i < names.length; i++) {
        const meta = await readNoteMeta(names[i])
        out.push({ name: names[i], origin: normPathKey(meta.origin), assetRoot: typeof meta.assetRoot === 'string' ? meta.assetRoot : '' })
      }
      return out
    }
    /**
     * Which note should hold this document?
     *
     * A scan returns files from EVERY level now, so two folders can each hold a `README.md`. Under
     * the old "one note per file name" rule the second one came back as 已存在 and its content was
     * quietly dropped. Three answers, in order:
     *   reuse   — a note already made from THIS file, so a re-import stays idempotent;
     *   prefix  — the plain name belongs to a DIFFERENT file, so the parent folder is prefixed
     *             (`详细笔记-README`);
     *   counter — that is taken as well, so a number is appended (`详细笔记-README-2`).
     * `taken` holds the names claimed earlier in the same run, so two files of one import cannot
     * fight over the same new name either.
     */
    function planNoteName(index, rel, origin, taken) {
      const segs = String(rel).replace(/\\/g, '/').split('/')
      const stem = segs[segs.length - 1].replace(/\.(md|markdown)$/i, '')
      const base = sanitizeNoteName(stem)
      if (base === '') return null
      const key = normPathKey(origin)
      for (let i = 0; i < index.length; i++) {
        if (key !== '' && index[i].origin === key) return { name: index[i].name, reuse: true, origin: key }
      }
      const busy = function (n) {
        if (taken.indexOf(n) >= 0) return true
        for (let i = 0; i < index.length; i++) if (index[i].name === n) return true
        return false
      }
      if (!busy(base)) return { name: base, reuse: false, origin: key }
      const parent = segs.length > 1 ? sanitizeNoteName(segs[segs.length - 2]) : ''
      const prefixed = parent === '' ? base : sanitizeNoteName(parent + '-' + stem)
      if (prefixed !== '' && !busy(prefixed)) return { name: prefixed, reuse: false, origin: key }
      for (let n = 2; n < 200; n++) {
        const cand = prefixed + '-' + n
        if (!busy(cand)) return { name: cand, reuse: false, origin: key }
      }
      return null
    }
    /** The card's import: same logic, plus the lines rendered for a human. */
    handleLocked('importFolder', async function (args) {
      await ensureLoaded()
      const r = await runFolderImport(args || {})
      const lines = (r.created || []).map(function (c) {
        if (c.ok && c.existing) return '  = ' + c.file + ' → 《' + c.note + '》已存在，跳过（镜像已更新）'
        if (c.ok) return '  ✓ ' + c.file + ' → 《' + c.note + '》'
        return '  ✗ ' + c.file + ' —— ' + c.error
      }).join('\n')
      return {
        ok: r.ok, rootId: r.rootId, assetRoot: r.assetRoot, reused: r.reused, files: r.files, bytes: r.bytes,
        made: intOr(r.made, 0), existing: intOr(r.existing, 0), created: lines, error: r.error,
      }
    })
    /** `dsh-window/note/_assets/root/知识库/a.md` → `知识库/a.md`; '' when it is not under the root. */
    async function mirrorRelOf(meta, rootId) {
      const origin = typeof meta.origin === 'string' ? normPathKey(meta.origin) : ''
      if (origin === '') return ''
      const index = await readAssetsIndex()
      const entry = index.roots.filter(function (r) { return r && r.id === rootId })[0] || null
      const src = entry && typeof entry.source === 'string' ? normPathKey(entry.source) : ''
      if (src === '' || origin.indexOf(src + '/') !== 0) return ''
      return origin.slice(src.length + 1)
    }
    /**
     * Collapse `.` / `..` textually, so a climbing path can never leave the mirror: it resolves to
     * a (missing) file inside it instead. One rule for both the asset resolver and link following.
     */
    function joinInsideMirror(p) {
      return String(p).replace(/\\/g, '/').split('/').reduce(function (acc, seg) {
        if (seg === '' || seg === '.') return acc
        if (seg === '..') { acc.pop(); return acc }
        acc.push(seg)
        return acc
      }, []).join('/')
    }
    /** An anchor as written, tolerating the percent-encoding Typora writes for CJK links. */
    function decodeAnchor(raw) {
      const s = String(raw || '').trim()
      if (s === '') return ''
      try { return decodeURIComponent(s) } catch (err) { return s }
    }
    /**
     * Typora's heading id: lowercased, spaces to dashes, punctuation dropped, CJK kept. A repeated
     * heading gets `-1`, `-2` … in document order, which is what the generated links point at.
     */
    function slugifyHeading(text) {
      return String(text)
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_~]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s\u3000]+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    /** Headings of a document with the ids a reader's link would use, in document order. */
    function headingIds(text) {
      const lines = String(text).split('\n')
      const out = []
      const seen = {}
      let inFence = false
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }
        if (inFence) continue
        const m = /^(#{1,6})\s+(.*?)\s*$/.exec(line)
        if (!m) continue
        let title = m[2]
        let forced = ''
        const explicit = /\s*\{#([^}]+)\}\s*$/.exec(title)
        if (explicit) { forced = explicit[1]; title = title.slice(0, explicit.index) }
        let slug = slugifyHeading(title)
        if (forced !== '') slug = slugifyHeading(forced)
        if (slug === '') continue
        const n = seen[slug] === undefined ? 0 : seen[slug] + 1
        seen[slug] = n
        out.push({ line: i + 1, id: n === 0 ? slug : slug + '-' + n, title: title })
      }
      return out
    }
    /**
     * Explicit HTML anchors — `<a id="oop-overview"></a>`, `<span id=…>`, `<a name=…>`.
     *
     * These notes do not rely on heading slugs at all: the table of contents points at
     * `#oop-overview` and the document carries `<a id="oop-overview"></a>` one line above the
     * heading it belongs to. Matching headings alone found nothing and reported "没有这个标题".
     */
    function htmlAnchorIds(text) {
      const lines = String(text).split('\n')
      const out = []
      for (let i = 0; i < lines.length; i++) {
        const re = /<(a|span|div|p|h[1-6]|section)\b[^>]*\b(?:id|name)\s*=\s*["']?([^"'\s>]+)/gi
        let m = re.exec(lines[i])
        while (m !== null) {
          out.push({ line: i + 1, id: decodeAnchor(m[2]) })
          m = re.exec(lines[i])
        }
      }
      return out
    }
    /**
     * The line a `file.md#anchor` link should land on: an explicit HTML anchor first (that is what
     * these documents use), then a heading id including Typora's `-1` numbering, then a prefix
     * match in either direction so `#并发-线程池详解` still finds `## 并发-线程池详解（重点）`.
     */
    function anchorLineOf(text, anchor) {
      const raw = decodeAnchor(anchor)
      const want = slugifyHeading(raw)
      if (want === '') return 0
      const htmls = htmlAnchorIds(text)
      for (let i = 0; i < htmls.length; i++) if (htmls[i].id === raw) return htmls[i].line
      const heads = headingIds(text)
      for (let i = 0; i < heads.length; i++) if (heads[i].id === want) return heads[i].line
      for (let i = 0; i < htmls.length; i++) if (slugifyHeading(htmls[i].id) === want) return htmls[i].line
      for (let i = 0; i < heads.length; i++) {
        if (heads[i].id.indexOf(want) === 0 || want.indexOf(heads[i].id) === 0) return heads[i].line
      }
      for (let i = 0; i < htmls.length; i++) {
        const s = slugifyHeading(htmls[i].id)
        if (s.indexOf(want) === 0 || want.indexOf(s) === 0) return htmls[i].line
      }
      for (let i = 0; i < heads.length; i++) if (slugifyHeading(heads[i].title).indexOf(want) >= 0) return heads[i].line
      return 0
    }
    /**
     * Follow a link into the mirror: a local `.md` reference becomes (or reopens) a note that
     * SHARES the same asset root, so the document's own images and its relative links to its
     * neighbours keep working. This is what makes a mirrored folder readable as a whole instead
     * of one isolated file.
     *
     * Three things the first version got wrong, all reported from real folders:
     *   - a link is relative to the FILE it sits in, not to the folder root, so a nested document's
     *     `./详细笔记/x.md` opened the wrong file (or nothing);
     *   - a target that has no note yet must be registered there and then, carrying the asset root
     *     and its origin, instead of refusing ("还没有为它注册笔记");
     *   - `file.md#第二章` (Typora's table-of-contents links, which these folders are full of) must
     *     open the note AND land on that heading, via the same view-jump nonce the agent's
     *     note_goto uses.
     */
    handleLocked('openMirrorDoc', async function (args) {
      await ensureLoaded()
      const href = String((args && args.href) || '').trim()
      if (href === '') return { ok: false, error: '需要 href' }
      if (/^[a-z]+:\/\//i.test(href) || /^[A-Za-z]:/.test(href) || href.indexOf('\\') >= 0) {
        return { ok: false, error: '只支持笔记内的相对链接' }
      }
      const hashAt = href.indexOf('#')
      const rawPath = hashAt >= 0 ? href.slice(0, hashAt) : href
      const anchor = hashAt >= 0 ? decodeAnchor(href.slice(hashAt + 1)) : ''
      const meta = await readNoteMeta(activeNote)
      const root = typeof meta.assetRoot === 'string' ? meta.assetRoot : ''
      if (root === '') return { ok: false, error: '这份笔记没有素材根，无法跟随链接' }
      const rootId = root.replace(/^.*?_assets\//, '')
      const mirrorPrefix = noteSpaceRoot() + '/' + ASSETS_DIR + '/'
      // `#第二章` — no path at all — is a link inside the document the reader is already in.
      if (rawPath === '') {
        if (anchor === '') return { ok: false, error: '链接指向了空路径' }
        const here = await readIfExists(sessionRoot() + '/' + activeNote + '/' + NOTE_FILE)
        const at = here === null ? 0 : anchorLineOf(String(here), anchor)
        if (at > 0) await saveView({ line: at, anchor: anchor, jump: true })
        return { ok: true, note: activeNote, existed: true, same: true, line: at, anchor: anchor, anchored: at > 0, error: at > 0 ? '' : ('这份笔记里没有 #' + anchor + ' 对应的标题') }
      }
      const selfRel = await mirrorRelOf(meta, rootId)
      const selfDir = selfRel.indexOf('/') >= 0 ? selfRel.slice(0, selfRel.lastIndexOf('/')) : ''
      // A link is relative to the FILE it sits in — that is the Markdown rule, and it is what makes
      // a sibling reference inside a nested document work at all. These folders' index pages,
      // though, are often written relative to the FOLDER ROOT (`知识库/README.md` linking
      // `知识库/详细笔记/x.md`), which is the same thing only while the file sits at the root. So
      // the file-relative form is tried first and the root-relative one right after; a link that
      // exists under neither is still reported as missing rather than guessed at.
      const candidates = []
      if (rawPath.charAt(0) === '/') candidates.push(joinInsideMirror(rawPath))
      else {
        if (selfDir !== '') candidates.push(joinInsideMirror(selfDir + '/' + rawPath))
        candidates.push(joinInsideMirror(rawPath))
      }
      let rel = ''
      let text = null
      for (let i = 0; i < candidates.length && text === null; i++) {
        const cand = candidates[i]
        if (cand === '' || !/\.(md|markdown)$/i.test(cand)) continue
        const probe = mirrorPrefix + rootId + '/' + cand
        if (probe.indexOf(mirrorPrefix) !== 0) continue
        try {
          const raw = await readIfExists(probe)
          if (raw !== null) { rel = cand; text = String(raw).replace(/\r\n?/g, '\n') }
        } catch (err) { }
      }
      if (text === null) {
        const first = candidates[0] || joinInsideMirror(rawPath)
        if (first === '') return { ok: false, error: '链接指向了空路径' }
        if (!/\.(md|markdown)$/i.test(first)) return { ok: false, error: '这不是 Markdown 文档：' + first + '（素材文件不在这里打开）' }
        return { ok: false, error: '镜像里没有这个文件：' + first }
      }
      // The ORIGIN is the source-folder path this mirror entry came from, so a later sync of the
      // new note re-reads the user's own file rather than the mirror.
      const index = await readAssetsIndex()
      const entry = index.roots.filter(function (r) { return r && r.id === rootId })[0] || null
      const sourceDir = entry && typeof entry.source === 'string' ? entry.source.replace(/\\/g, '/').replace(/\/+$/, '') : ''
      const origin = sourceDir === '' ? '' : sourceDir + '/' + rel
      const plan = planNoteName(await noteIndex(), rel, origin, [])
      if (plan === null) return { ok: false, note: '', error: '这个文件名不能作为笔记名：' + rel.split('/').pop() }
      const noteName = plan.name
      if (plan.reuse) {
        const r = await selectNote(noteName)
        if (!(r && r.ok === true)) return { ok: false, note: noteName, error: String((r && r.error) || '打不开这份笔记') }
      } else {
        // Not registered yet: register it HERE, with the asset root and the origin, so its own
        // images and its own relative links work before the reader asks for anything else.
        const made = await createNoteFromText(noteName, text, { assetRoot: ASSETS_DIR + '/' + rootId, origin: origin, followedFrom: String(href) })
        if (!made.ok) return { ok: false, note: noteName, error: String(made.error || '') }
      }
      let line = 0
      if (anchor !== '') {
        const body = await readIfExists(sessionRoot() + '/' + noteName + '/' + NOTE_FILE)
        line = body === null ? 0 : anchorLineOf(String(body), anchor)
        if (line > 0) await saveView({ line: line, anchor: anchor, jump: true })
      }
      return {
        ok: true, note: noteName, existed: plan.reuse, source: origin, line: line, anchor: anchor, anchored: line > 0,
        error: (anchor !== '' && line === 0) ? ('已打开《' + noteName + '》，但里面没有 #' + anchor + ' 对应的标题') : '',
      }
    })
    /** The asset mirror's one repository: commit what the mirror holds right now. */
    handleLocked('commitAssets', async function (args) {
      await ensureLoaded()
      const r = await commitAssets((args && args.message) || '')
      return { ok: r.ok === true, hash: r.hash || '', nothing: r.nothing === true, error: r.ok ? '' : String(r.error || ''), root: assetsRoot() }
    })
    /** Which folder should the card offer to import? Native picker when the host has a display. */
    handleLocked('pickFolder', async function () {
      const picker = ctx.get('directoryPicker')
      if (picker === undefined) return { ok: false, error: '这台机器没有可用的目录选择器，请把文件夹路径粘贴到输入框里' }
      try {
        const cap = typeof picker.capability === 'function' ? picker.capability() : null
        if (!cap || cap.kind !== 'native') {
          return { ok: false, error: '当前目录选择器不支持弹窗（kind=' + String(cap && cap.kind) + '），请把文件夹路径粘贴到输入框里' }
        }
        // `pick(signal)` DEREFERENCES its signal — it reads `signal.aborted` to notice a caller
        // that went away — so passing undefined throws "Cannot read properties of undefined
        // (reading 'aborted')" from inside the picker instead of ever opening a dialog. Give it a
        // real signal, and abort on a timer so a dialog nobody answers cannot pin the store lock.
        const controller = typeof AbortController === 'function' ? new AbortController() : null
        const timer = controller ? setTimeout(function () { try { controller.abort() } catch (err) { } }, 180000) : null
        try {
          const picked = await cap.pick(controller ? controller.signal : undefined)
          if (!picked) return { ok: false, error: '没有选择目录' }
          return { ok: true, dir: String(picked) }
        } finally {
          if (timer !== null) { try { clearTimeout(timer) } catch (err) { } }
        }
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err)
        return { ok: false, error: '目录选择失败（' + msg + '）；也可以把路径直接粘贴到输入框' }
      }
    })
    handleLocked('reload', async function () {
      await ensureLoaded()
      try {
        // Reload replaces our basis with what is on disk, so this is exactly the read
        // that must adopt the new version — otherwise the next save would conflict
        // forever against the version we just accepted.
        const raw = await readIfExists(paths().note, { track: true })
        if (raw !== null) {
          const next = String(raw).replace(/\r\n?/g, '\n')
          S.fileExists = true
          if (next !== S.text) {
            S.selections = remapSelections(S.selections, S.text, next)
            S.text = next
            S.revision += 1
            try { await persistState() } catch (err) { fail('写入选中记录', err) }
          }
        }
        return Object.assign({ ok: true }, stateView())
      } catch (err) { fail('重载笔记', err); return { ok: false, error: S.error } }
    })
    // `/window-note` — the explicit way to open this session's note space (and therefore
    // the card, which only appears once a session actually has a note). `commands` is
    // optional: a composition without it simply never gains the slash command.
    try {
      if (typeof ctx.inject === 'function') {
        ctx.inject(['commands'], function (commandCtx) {
          try {
            commandCtx.commands.register({
              name: 'window-note',
              description: '打开本会话的笔记卡片（每个会话一份独立的笔记空间）',
              input: { hint: '[list | new <名字> | open <名字> | start | stop]' },
              handler: function (invocation) {
                const sid = sessionIdOfExec({ agent: invocation && invocation.agent })
                if (!sid) return { kind: 'error', text: '拿不到本会话的 session id，无法打开笔记空间。' }
                const raw = String((invocation && invocation.rawInput) || '').trim()
                const parts = raw.split(/\s+/).filter(function (x) { return x !== '' })
                const sub = parts[0] || 'open'
                const name = parts.slice(1).join(' ')
                return withStore(sid, async function () {
                  if (sub === 'list') {
                    const rows = await notesView()
                    const body = rows.length
                      ? rows.map(function (n) { return (n.active ? '* ' : '- ') + n.name + '（' + n.lines + ' 行' + (n.commitHash ? ' · ' + n.commitHash : '') + '）' }).join('\n')
                      : '(还没有笔记：用 /window-note new <名字> 新建)'
                    return { kind: 'success', text: '本会话的笔记（' + rows.length + ' 份）：\n' + body }
                  }
                  if (sub === 'new') {
                    const want = name || DEFAULT_NOTE
                    const r = await createNote({ name: want, open: true })
                    if (!r.ok) return { kind: 'error', text: '新建失败：' + r.error }
                    return { kind: 'success', text: '已新建并打开《' + r.name + '》——卡片已在本会话出现。' }
                  }
                  if (sub === 'open') {
                    if (!name) {
                      if (activeNote) return { kind: 'success', text: '已打开本会话的笔记《' + activeNote + '》。' }
                      const names = await listNoteDirs()
                      if (names.length) { await selectNote(names[0]); return { kind: 'success', text: '已打开本会话的笔记《' + activeNote + '》。' } }
                      // No note in this session yet: opening the card is the explicit ask,
                      // so create the default one instead of showing nothing.
                      const r = await createNote({ name: DEFAULT_NOTE, open: true })
                      if (!r.ok) return { kind: 'error', text: '打开失败：' + r.error }
                      return { kind: 'success', text: '本会话还没有笔记，已为你新建并打开《' + r.name + '》。' }
                    }
                    const r = await selectNote(name)
                    if (!r.ok) return { kind: 'error', text: '打开失败：' + r.error }
                    return { kind: 'success', text: '已打开《' + activeNote + '》。' }
                  }
                  if (sub === 'start' || sub === 'stop') {
                    // Summon (or dismiss) the card itself, without touching any note. This is
                    // the only way to get the button in a session that has no note yet.
                    summoned = sub === 'start'
                    await writeSessionState()
                    return {
                      kind: 'success',
                      text: summoned
                        ? '笔记卡片已出现（本会话' + (activeNote ? '当前打开《' + activeNote + '》' : '还没有笔记，点卡片里的[新建]即可') + '）。不想看时用 /window-note stop 收起。'
                        : '笔记卡片已收起（本会话的笔记与标记都没有动）。',
                    }
                  }
                  return { kind: 'error', text: '用法：/window-note [list | new <名字> | open <名字> | start | stop]' }
                })
              },
            })
            ctx.effect(function () { return function () { try { commandCtx.commands.unregister('window-note') } catch (err) { } } })
          } catch (err) { fail('注册命令', err) }
        })
      }
    } catch (err) { fail('注册命令', err) }
    if (systemPrompt !== undefined) {
      try {
        ctx.effect(function () {
          return systemPrompt.section({
            name: SECTION_NAME,
            order: 152,
            text: [
              '## 右侧笔记卡片(note.md 知识笔记)',
              '这个会话的界面右侧可能悬浮着一张 Markdown 笔记卡片，它是**本会话私有**的：正文在 `' + ROOT_DIR + '/' + NOTES_DIR + '/<本会话id>/<笔记名>/' + NOTE_FILE + '`，每份笔记各自受 git 管理，其他会话看不到。用 note_list 看本会话有哪些笔记。',
              '{{dsh_window_note_scope}}',
              '工作方式(仅当你归属于这张卡片时适用):',
              '- 用户问知识性问题、要求讲解/总结/整理时，不要只在对话里长篇回复: 用 `note_write`(默认追加)把讲解写进笔记，内容会立刻显示在卡片里，用户就不必往上翻聊天记录。对话里只留简短的口头交付与要点提示。',
              '- 每次回答用户之前，先调用 `note_take_new_selections`: 它返回用户自上次取用以来新标记的重点(含行号与原文)，并把这些对象标记为已取用。用户标记往往就是"这里我不懂/我要你展开"。',
              '- 需要回顾全部标记时用 `note_get_selections`; 需要笔记全文(含行号)时用 `note_read`，也可以直接用 `read` 工具读该文件。',
              '- 用户在卡片里手动编辑会立刻落盘; 点"保存"按钮会 git 提交。你写入后默认也会自动提交一次。',
              '- 卡片支持图片：`![alt](./x.png)` 这类本地相对路径会由 host 读成 data URL 渲染；在线 http(s) 图片直接渲染。引用整张图时，选中范围会自动吸附到整段图片语法。',
              '- 代码块按语言做语法高亮；`mermaid` 代码块会渲染成图（支持 graph/flowchart 的 TD/TB/LR/RL 分层图），其余图种降级为源码卡片。',
              '- 行号是 1 基，列号是 0 基，都以该行文本为基准。引用标记内容时请原样引用，不要编造用户没有划过的内容。',
              '- 改一小段就用 `note_patch`（按区间替换，不必输出全文）；多处一起改用 `note_patch_many`（内部从后往前应用）。',
              '- 要定位"关于某话题的那段"用 `note_find`，拿到行号列号后直接 `note_patch`，不要先读全文；只读窗口用 `note_read({fromLine,toLine,padding})`。',
              '- 你也能管理标记：`note_add_selection`（新建，可指定颜色与样式）/ `note_remove_selection` / `note_set_color` / `note_set_style` / `note_clear_selections`。',
              '- 颜色即意图：yellow=重点、pink=疑问（要我展开）、green=已确认/已处理、black=遮盖（这段不要引用也不要复述）、none=不铺底色（只保留样式）。处理完一条标记后，可用 `note_set_color` 把它转成 green 作为闭环信号。',
              '- 样式是**两个独立开关**：`note_set_style({id, italic:true})` 只改斜体、`underline:true` 只改下划线，两者可以同时开，并且**和任何颜色叠加**（例如绿底+斜体+下划线）。它们直接改文字本身、不抢注意力。新建时也能一起给：`note_add_selection({…, color:"pink", italic:true, underline:true})`。',
              '- 自定义标记列表：`note_lists`（action = list/create/rename/delete/add/remove）能把任意笔记里的任意标记收进一个命名列表（例如"面试要背的"），写的是同一份会话数据，用户在卡片里点的「添加到」也是它。',
              '- 卡片界面也能由你驱动：`note_ui`（open/close/tab/float/dock/summon/focus/card/refresh —— 打开或关闭标记列表、切视图、拖出成独立小窗、改"点标记→列表"开关、把列表定位到某条标记、直接把功能卡弹在某条标记上）、`note_panel`（start/stop/collapse/expand/width）、`note_goto`（给 line 或 markId 跳转）。命令会排队并在卡片下一次轮询时执行。',
              '- 你每调用一次写工具，卡片都会收到一条**带主题的事件**并只刷新受影响的那一块：正文（text）/ 标记（marks）/ 笔记列表（notes）/ 自定义列表（lists）/ 阅读位置（view）/ git（git）/ 界面命令（ui）。卡片在可见时约 0.7 秒轮询一次，所以你的改动几乎是立刻出现在用户眼前 —— 不需要让用户手动刷新，也不要用"刷新页面"来敷衍。',
            ].join('\n'),
          })
        })
        // Which session owns the card cannot be decided when the section is registered —
        // it changes as sessions come and go. A prompt VARIABLE can: the assembly context
        // carries the agent (`assembleContextFor` returns `{ agent, scope: agent }`), so
        // the provider below answers per session, and the section above interpolates it.
        // This is what keeps a brand-new session from being told to call note_* tools at
        // all, while the owning session keeps its proactive workflow.
        if (typeof systemPrompt.variable === 'function') {
          ctx.effect(function () {
            return systemPrompt.variable('dsh_window_note_scope', function (context) {
              const sid = sessionIdOfContext(context)
              // Every session has its own note space; there is nothing to own or share.
              // The only question that changes the instructions is whether THIS session
              // has a note yet — a session with none must not be told to write one.
              if (!sid) return '本会话的笔记空间：未知（拿不到会话 id）。不要调用 note_* 工具。'
              // Look THIS session's record up directly: the module-level store belongs to
              // whichever session was served last, so comparing against it reported the
              // wrong answer as soon as two sessions were active.
              const st = stores.get(sid)
              if (!st) return '本会话的笔记空间：未加载。只有在用户明确要求记录/整理笔记、或用 /window-note 打开之后，才用 note_list / note_create 开始。'
              if (st.activeNote) {
                return '本会话的笔记空间：**已打开《' + st.activeNote + '》**（本会话共 ' + String((st.sessionNotes || []).length) + ' 份笔记，目录 ' + st.base + '/' + ROOT_DIR + '/' + NOTES_DIR + '/' + sid + '）。下面的工作方式全部适用，包括回答前先取用户的新标记。'
              }
              return '本会话的笔记空间：**本会话还没有笔记**。不要主动创建；只有用户明确要求记笔记时，才用 note_create 建一份（或用 /window-note 打开面板）。'
            })
          })
        }
      } catch (err) { fail('注册段落失败', err) }
    }

    // ── 协同工具：精确写入 / 搜索 / 标记管理 ────────────────────────────────
    // 全部复用上面的 helper，所以位置换算、重新锚定、落盘与 git 语义完全一致。
    const COLOR_SET = { yellow: 1, pink: 1, green: 1, black: 1, none: 1 }
    function colorOf(v) { return COLOR_SET[v] ? v : 'yellow' }
    const STYLE_SET = { highlight: 1, italic: 1, underline: 1, both: 1, 'italic+underline': 1 }
    function styleOf(v) { return STYLE_SET[v] ? v : 'highlight' }
    /** The two flags a legacy `style` string asks for (used by the tool surfaces only). */
    function styleWants(v) { return lookFlags({ style: styleOf(v) }) }

    /** 应用一处区间替换；行/列越界会被夹到有效范围。 */
    function applyPatch(p) {
      const all = linesOf(S.text)
      const l1 = Math.min(Math.max(1, intOr(p.startLine, 1)), all.length)
      const c1 = Math.max(0, intOr(p.startCol, 0))
      const l2 = Math.min(Math.max(l1, intOr(p.endLine, l1)), all.length)
      const c2 = Math.max(0, intOr(p.endCol, c1))
      const a = indexOfPos(S.text, l1, c1)
      const b = indexOfPos(S.text, l2, c2)
      const lo = Math.min(a, b), hi = Math.max(a, b)
      const ins = p.text === undefined || p.text === null ? '' : String(p.text)
      const before = S.text
      const next = before.slice(0, lo) + ins + before.slice(hi)
      if (next === before) return { changed: false, removed: 0, inserted: 0 }
      S.selections = remapSelections(S.selections, before, next)
      S.text = next
      S.revision += 1
      S.touched = true
      return { changed: true, removed: hi - lo, inserted: ins.length }
    }
    /** 落盘（笔记 + 标记状态），返回是否成功。 */
    async function flushAfterWrite() {
      if (!canWrite()) return true
      try { await writeAt(paths().note, S.text); S.fileExists = true; S.savedAt = isoNow() }
      catch (err) { fail('写入笔记', err); return false }
      // The note text changed: one announcement for every write path (patch, write, import,
      // clear, reload), because they all flush through here.
      emit('text', { revision: S.revision })
      try { await persistState() } catch (err) { fail('写入选中记录', err) }
      return true
    }
    const PATCH_SCHEMA = {
      type: 'object', additionalProperties: false,
      properties: { ok: { type: 'boolean', required: true }, changed: { type: 'boolean', required: true }, removed: { type: 'integer', required: true }, inserted: { type: 'integer', required: true }, revision: { type: 'integer', required: true }, lineCount: { type: 'integer', required: true }, selections: { type: 'string', required: true }, error: { type: 'string', required: true } },
    }
    function patchRender(a, v) {
      if (!v.ok) return [{ type: 'text', text: '失败: ' + v.error }]
      if (!v.changed) return [{ type: 'text', text: '无变化（区间内容与替换文本相同）' }]
      return [{ type: 'text', text: '已改写: -' + v.removed + ' +' + v.inserted + ' 字符，现 ' + v.lineCount + ' 行 (rev ' + v.revision + ')\n\n' + v.selections }]
    }
    const RANGE_PARAMS = {
      startLine: { type: 'integer', required: true, description: '起始行（1 基）' },
      startCol: { type: 'integer', required: true, description: '起始列（0 基）' },
      endLine: { type: 'integer', required: true, description: '结束行（1 基，含）' },
      endCol: { type: 'integer', required: true, description: '结束列（0 基，不含）' },
    }

    const SEL_HIT = { type: 'object', additionalProperties: false, properties: { id: { type: 'string', required: true }, color: { type: 'string', required: true }, range: { type: 'string', required: true }, text: { type: 'string', required: true } } }
    registerToolLocked(harness.defineTool({
      name: 'note_add_selection',
      description: '由 agent 新建一个标记。用于标注你要用户注意、或后续要跟进的区间。remark 可写这段的备注（会随标记一起给到 llm，也是用户长按标记能填的那个字段）。color: yellow(默认) / pink / green / black(黑色是遮盖，字会被挡住) / none(完全不铺底色)；italic 与 underline 是**独立的两个开关**，可以和任意颜色同时使用（例如黄底 + 斜体 + 下划线）。',
      parameters: {
        startLine: { type: 'integer', required: true, description: '起始行（1 基）' },
        startCol: { type: 'integer', required: true, description: '起始列（0 基）' },
        endLine: { type: 'integer', required: true, description: '结束行（1 基，含）' },
        endCol: { type: 'integer', required: true, description: '结束列（0 基，不含）' },
        color: { type: 'string', description: 'yellow / pink / green / black / none（none = 不铺底色），默认 yellow。' },
        italic: { type: 'boolean', description: '把这段字改成斜体（可与颜色、下划线同时使用）。' },
        underline: { type: 'boolean', description: '给这段字加下划线（可与颜色、斜体同时使用）。' },
        style: { type: 'string', description: '（旧写法）highlight / italic / underline / both，等价于设置这两个开关。' },
        remark: { type: 'string', description: '这条标记的备注（可空）。用户自己写的备注也在这个字段里。' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, id: { type: 'string', required: true }, revision: { type: 'integer', required: true }, reason: { type: 'string', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已新建标记 ' + v.id + ' (rev ' + v.revision + ')\n\n' + v.selections) : ('未新建: ' + (v.reason === 'empty' ? '该区间为空' : v.reason)) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_add_selection', exec); markTouched()
        const a = args || {}
        const r = await addSelection(Object.assign({}, a, { color: colorOf(a.color), italic: a.italic === true || styleWants(a.style).italic, underline: a.underline === true || styleWants(a.style).underline }))
        return { ok: r.ok === true, id: r.ok ? r.id : '', revision: S.revision, reason: r.ok ? '' : String(r.reason || ''), selections: selRender(viewSelections()) }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_remove_selection',
      description: '删除一条标记（按 id，id 来自 note_get_selections）。',
      parameters: { id: { type: 'string', required: true, description: '标记 id，如 sel-9' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, removed: { type: 'boolean', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: (v.ok ? (v.removed ? '已删除 ' + a.id : '未找到 ' + a.id) : '失败') + ' (rev ' + v.revision + ')\n\n' + v.selections }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_remove_selection', exec); markTouched()
        const id = String((args || {}).id || '')
        const before = S.selections.length
        S.selections = S.selections.filter(function (x) { return x.id !== id })
        const removed = S.selections.length !== before
        if (removed) { S.revision += 1; if (canWrite()) { try { await persistState() } catch (err) { fail('写入选中记录', err) } } }
        return { ok: true, removed: removed, revision: S.revision, selections: selRender(viewSelections()) }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_clear_selections',
      description: '清空全部标记。',
      parameters: {},
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, cleared: { type: 'integer', required: true }, revision: { type: 'integer', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: '已清空 ' + v.cleared + ' 条标记' }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_clear_selections', exec); markTouched()
        const n = S.selections.length
        S.selections = []
        if (n > 0) { S.revision += 1; if (canWrite()) { try { await persistState() } catch (err) { fail('写入选中记录', err) } } }
        return { ok: true, cleared: n, revision: S.revision }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_set_color',
      description: '修改一个标记的底色：yellow / pink / green / black / none（none = 完全不铺底色，只保留斜体/下划线样式）。可用它把已处理的标记转成绿色、或把要屏蔽的区间涂黑。',
      parameters: { id: { type: 'string', required: true, description: '标记 id' }, color: { type: 'string', required: true, description: 'yellow / pink / green / black / none' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, found: { type: 'boolean', required: true }, color: { type: 'string', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: (v.ok ? (v.found ? ('已把 ' + a.id + ' 改为 ' + v.color) : ('未找到 ' + a.id)) : '失败') + ' (rev ' + v.revision + ')\n\n' + v.selections }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_set_color', exec); markTouched()
        const a = args || {}
        const c = colorOf(a.color)
        let found = false
        for (let i = 0; i < S.selections.length; i++) if (S.selections[i].id === String(a.id || '')) { if (S.selections[i].color !== c) { S.selections[i].color = c; found = true } }
        if (found) { S.revision += 1; if (canWrite()) { try { await persistState() } catch (err) { fail('写入选中记录', err) } } }
        return { ok: true, found: found, color: c, revision: S.revision, selections: selRender(viewSelections()) }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_set_style',
      description: '改变一个标记在文字上的样式（斜体 / 下划线），和颜色互不干扰、可以同时存在。给 italic / underline 就单独开关那一个（另一个保持不动），给 style 则两个一起设：highlight（都不加，默认）/ italic / underline / both。适合"这句要背下来""这里是我错了"这类不需要抢注意力的标注。',
      parameters: {
        id: { type: 'string', required: true, description: '标记 id' },
        italic: { type: 'boolean', description: '是否斜体（省略则不改这一项）。' },
        underline: { type: 'boolean', description: '是否下划线（省略则不改这一项）。' },
        style: { type: 'string', description: '（旧写法）highlight / italic / underline / both —— 一次设定两个开关。' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, found: { type: 'boolean', required: true }, style: { type: 'string', required: true }, italic: { type: 'boolean', required: true }, underline: { type: 'boolean', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: (v.ok ? (v.found ? ('已把 ' + a.id + ' 的样式改为 ' + v.style + '（斜体=' + (v.italic ? '开' : '关') + ' 下划线=' + (v.underline ? '开' : '关') + '）') : ('未找到 ' + a.id)) : '失败') + ' (rev ' + v.revision + ')\n\n' + v.selections }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_set_style', exec); markTouched()
        const a = args || {}
        const patch = {}
        if (a.italic === true || a.italic === false) patch.italic = a.italic
        if (a.underline === true || a.underline === false) patch.underline = a.underline
        if (typeof a.style === 'string' && a.style !== '') patch.style = a.style
        const r = await setMarkLook(a.id, patch)
        return { ok: r.ok === true, found: r.found === true, style: typeof r.style === 'string' ? r.style : '', italic: r.italic === true, underline: r.underline === true, revision: S.revision, selections: selRender(viewSelections()) }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_set_remark',
      description: '给一个标记写/改备注（用户在卡片里长按[标记]弹出的输入框写的就是这个字段）。备注会随标记一起提供给 llm。传空字符串即清除备注。',
      parameters: {
        id: { type: 'string', required: true, description: '标记 id' },
        remark: { type: 'string', required: true, description: '备注内容；空字符串表示清除。' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, found: { type: 'boolean', required: true }, id: { type: 'string', required: true }, remark: { type: 'string', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) {
          const what = v.remark === '' ? '已清除备注' : ('已写备注「' + v.remark + '」')
          return [{ type: 'text', text: (v.ok ? (what + ' → ' + v.id) : ('失败: ' + v.error)) + ' (rev ' + v.revision + ')\n\n' + v.selections }]
        },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
          await enterFromTool('note_set_remark', exec); markTouched()
          const a = args || {}
          const r = await setRemark(a.id, a.remark)
          return {
            ok: r.ok === true, found: r.found === true, id: String(a.id || ''), remark: typeof r.remark === 'string' ? r.remark : '',
            revision: r.revision, selections: selRender(r.selections), error: r.ok ? '' : String(r.error || ''),
          }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_goto',
      description: '让卡片跳到笔记的某个位置（和用户自己滚动到那一样，只是由 agent 发起）。可以给 line，也可以给 markId（标记 id，来自 note_get_selections）直接跳到那条标记。可选 note 参数先切到那份笔记。用于"看这里"、"我把改好的地方给你翻出来"。',
      parameters: {
        line: { type: 'integer', description: '要跳到的行号（1 基）；给了 markId 时可以省略' },
        markId: { type: 'string', description: '跳到这条标记所在的行（如 sel-3），优先于 line' },
        note: { type: 'string', description: '先切到这份笔记（省略则用当前打开的）' },
        anchor: { type: 'string', description: '那一行的文本片段（省略则自动取该行开头，用于原文变动后重新定位）' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, line: { type: 'integer', required: true }, lineCount: { type: 'integer', required: true }, active: { type: 'string', required: true }, anchor: { type: 'string', required: true }, markId: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已把《' + v.active + '》翻到第 ' + v.line + ' 行' + (v.markId ? '（标记 ' + v.markId + '）' : '') + '（共 ' + v.lineCount + ' 行）') : ('跳转失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_goto', exec)
        return await withNoteLock(noteLockKey(), async function () {
          const a = args || {}
          if (a.note) {
            const r = await selectNote(a.note)
            if (!r.ok) return { ok: false, line: 0, lineCount: 0, active: activeNote, anchor: '', markId: '', error: r.error }
          }
          if (!activeNote) return { ok: false, line: 0, lineCount: 0, active: '', anchor: '', markId: '', error: '本会话还没有打开任何笔记' }
          const all = linesOf(S.text)
          let wantLine = intOr(a.line, 0)
          let usedMark = ''
          if (typeof a.markId === 'string' && a.markId !== '') {
            const hit = S.selections.filter(function (s) { return s.id === a.markId })[0]
            if (hit === undefined) return { ok: false, line: 0, lineCount: all.length, active: activeNote, anchor: '', markId: '', error: '这份笔记里没有标记 ' + a.markId }
            wantLine = hit.startLine
            usedMark = hit.id
          }
          if (!wantLine) return { ok: false, line: 0, lineCount: all.length, active: activeNote, anchor: '', markId: '', error: '要么给 line，要么给本笔记里存在的 markId' }
          const line = Math.min(Math.max(1, wantLine), all.length)
          const anchor = typeof a.anchor === 'string' && a.anchor ? a.anchor.slice(0, 80) : String(all[line - 1] || '').trim().slice(0, 40)
          const r = await saveView({ line: line, anchor: anchor, jump: true })
          return { ok: r.ok === true, line: line, lineCount: all.length, active: activeNote, anchor: anchor, markId: usedMark, error: r.ok ? '' : String(r.error || '') }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_panel',
      description: '操纵笔记卡片本身：唤起/收起（等价 /window-note start / stop）、折叠成小药丸/展开、切宽度档位。start 在没有笔记的会话里也能让卡片出现，用户就能点[新建]；不会创建或删除任何笔记。',
      parameters: {
        action: { type: 'string', required: true, description: 'start = 唤起；stop = 收起；collapse = 折叠成药丸；expand = 展开；width = 切宽度（std 430 / wide 620 / xl 900）' },
        size: { type: 'string', description: 'action=width 时用：std / wide / xl（省略则循环到下一档）' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, action: { type: 'string', required: true }, summoned: { type: 'boolean', required: true }, notes: { type: 'integer', required: true }, active: { type: 'string', required: true }, size: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) {
          if (!v.ok) return [{ type: 'text', text: '失败: ' + v.error }]
          const what = v.action === 'stop' ? '笔记卡片已收起（笔记与标记都没有动）'
            : (v.action === 'start' ? ('笔记卡片已出现（本会话 ' + v.notes + ' 份笔记' + (v.active ? '，当前《' + v.active + '》' : '') + '）')
              : (v.action === 'collapse' ? '笔记卡片已折叠成右下角小药丸' : (v.action === 'expand' ? '笔记卡片已展开' : ('卡片宽度已切到 ' + v.size))))
          return [{ type: 'text', text: what }]
        },
      },
      async execute(args, exec) {
        await enterFromTool('note_panel', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const a = args || {}
          const act = ['start', 'stop', 'collapse', 'expand', 'width'].indexOf(String(a.action)) >= 0 ? String(a.action) : ''
          if (!act) return { ok: false, action: String(a.action || ''), summoned: summoned === true, notes: (await listNoteDirs()).length, active: activeNote, size: '', error: 'action 必须是 start / stop / collapse / expand / width' }
          if (act === 'start' || act === 'stop') {
            summoned = act === 'start'
            await writeSessionState()
            return { ok: true, action: act, summoned: summoned, notes: (await listNoteDirs()).length, active: activeNote, size: '', error: '' }
          }
          // The rest are view commands the card performs on its next poll: it owns the pill and
          // the width (browser layout), the host only asks.
          const cmd = act === 'width' ? { kind: 'width', size: typeof a.size === 'string' ? a.size : '' } : { kind: act }
          const pushed = pushUi(cmd)
          return { ok: true, action: act, summoned: summoned === true, notes: (await listNoteDirs()).length, active: activeNote, size: String(a.size || ''), error: pushed.ok ? '' : String(pushed.error || '') }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_lists',
      description: '自定义标记列表（本会话共用一套）：把任意笔记里的任意标记收集进一个命名列表，比如"面试要背的"。action：list（看全部，默认）/ create / rename / delete / add / remove。add/remove 需要 name + markId，note 省略则用当前打开的笔记。',
      parameters: {
        action: { type: 'string', description: 'list（默认）/ create / rename / delete / add / remove' },
        name: { type: 'string', description: '列表名（create/add/remove/rename/delete 用）' },
        to: { type: 'string', description: 'action=rename 时的新名字' },
        note: { type: 'string', description: '标记所在笔记（省略则用当前打开的这份）' },
        markId: { type: 'string', description: '标记 id，如 sel-3（add/remove 用）' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, action: { type: 'string', required: true }, lists: { type: 'string', required: true }, count: { type: 'integer', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: (v.ok ? (v.action + ' 完成') : ('失败: ' + v.error)) + (v.lists ? '\n\n' + v.lists : '') }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_lists', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const a = args || {}
          const act = ['list', 'create', 'rename', 'delete', 'add', 'remove'].indexOf(String(a.action || 'list')) >= 0 ? String(a.action || 'list') : 'list'
          let r = { ok: true }
          if (act === 'create') r = await listCreate(a.name)
          else if (act === 'rename') r = await listRename(a.name, a.to)
          else if (act === 'delete') r = await listDelete(a.name)
          else if (act === 'add') r = await listAdd(a.name, a.note, a.markId)
          else if (act === 'remove') r = await listRemove(a.name, a.note, a.markId)
          return { ok: r.ok === true, action: act, lists: listRender(viewLists()), count: viewLists().length, error: r.ok ? '' : String(r.error || '') }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_ui',
      description: '操纵卡片的标记列表界面（等价于用户点那几个按钮）：open/close（打开或关闭标记列表）、tab（切到 本笔记 / 本会话 / 某个自定义列表）、float/dock（把列表拖出成独立小窗 / 收回卡片内）、summon（"点标记→列表"开关）、focus（把列表滚到某条标记并高亮）、card（直接在正文里那条标记上弹出功能卡）、refresh（重新拉取）。',
      parameters: {
        action: { type: 'string', required: true, description: 'open / close / tab / float / dock / summon / focus / card / refresh' },
        tab: { type: 'string', description: 'action=tab：note（本笔记）/ session（本会话）/ 自定义列表名' },
        markId: { type: 'string', description: 'action=focus / card：要定位或弹卡的标记 id（可带 note）' },
        note: { type: 'string', description: 'action=focus / card：标记所在笔记（省略则当前打开的）' },
        on: { type: 'boolean', description: 'action=summon：开关的目标状态（省略则取反）' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, action: { type: 'string', required: true }, id: { type: 'integer', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已让卡片执行 ' + v.action + '（下一次轮询生效，约 2 秒内）') : ('失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_ui', exec, { allowEmpty: true })
        return await withNoteLock(noteLockKey(), async function () {
          const a = args || {}
          const act = String(a.action || '')
          const allowed = ['open', 'close', 'tab', 'float', 'dock', 'summon', 'focus', 'card', 'refresh']
          if (allowed.indexOf(act) < 0) return { ok: false, action: act, id: 0, error: 'action 必须是 ' + allowed.join(' / ') }
          const cmd = { kind: act }
          if (act === 'tab') {
            const tab = String(a.tab || '')
            if (tab === '') return { ok: false, action: act, id: 0, error: 'action=tab 需要 tab（note / session / 自定义列表名）' }
            if (tab !== 'note' && tab !== 'session' && findList(tab) === null) return { ok: false, action: act, id: 0, error: '没有这个视图：' + tab }
            cmd.tab = tab
          }
          if (act === 'summon') cmd.on = a.on === undefined ? null : a.on === true
          if (act === 'refresh') cmd.tab = String(a.tab || '')
          if (act === 'focus' || act === 'card') {
            const note = a.note ? sanitizeNoteName(a.note) : activeNote
            const id = String(a.markId || '')
            if (id === '') return { ok: false, action: act, id: 0, error: 'action=' + act + ' 需要 markId' }
            if (!(await markExists(note, id))) return { ok: false, action: act, id: 0, error: '《' + note + '》里没有标记 ' + id }
            cmd.note = note
            cmd.markId = id
          }
          const pushed = pushUi(cmd)
          return { ok: pushed.ok === true, action: act, id: intOr(pushed.id, 0), error: pushed.ok ? '' : String(pushed.error || '') }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_import_folder',
      description: '把一个**文件夹**导入成本会话的笔记：整个目录会被镜像进 note/_assets/<素材根>/（保持原有相对结构），然后在其中选中的 .md 里，每个文件建一份笔记（各自一个 git 仓库）。同一目录里的多个 .md **共享同一份镜像**，不会各复制一份。镜像后的图片按相对路径直接可用（`![](./img/a.png)`）。`files` 用**相对该目录的路径**（可以含子目录）；先用 `list: true` 看一眼这个目录里**递归**都有哪些 .md（子目录里的也算），再挑要注册的。同名不同目录的文件不会互相顶掉：第二份会自动带上父目录名。',
      parameters: {
        dir: { type: 'string', required: true, description: '要导入的文件夹（绝对路径）。' },
        list: { type: 'boolean', description: '只要清单：递归列出这个目录下所有 .md（相对路径 + 字节数），不导入。' },
        files: { type: 'array', description: '要建笔记的 .md 文件（相对该目录的路径，可含子目录）。', items: { type: 'string' } },
        label: { type: 'string', description: '素材根的可读名字（省略则用目录名）。' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, rootId: { type: 'string', required: true }, assetRoot: { type: 'string', required: true }, reused: { type: 'boolean', required: true }, files: { type: 'integer', required: true }, bytes: { type: 'integer', required: true }, created: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ((a && a.list === true ? ('这个目录里有 ' + v.files + ' 个 .md：\n' + v.created) : ('已镜像 ' + v.files + ' 个文件 / ' + Math.round(v.bytes / 1024) + ' KB 到 ' + v.assetRoot + (v.reused ? '（复用已有素材根）' : '') + '\n\n' + v.created))) : ('导入失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_import_folder', exec, { allowEmpty: true })
        const a = args || {}
        if (a.list === true) {
          const scan = await listMarkdownIn(String(a.dir || ''))
          if (scan.ok !== true) return { ok: false, rootId: '', assetRoot: '', reused: false, files: 0, bytes: 0, created: '', error: String(scan.error || '扫描失败') }
          const lines = (scan.files || []).map(function (f) { return '  ' + f.rel + '  (' + Math.round((f.size || 0) / 1024) + 'KB)' }).join('\n')
          return { ok: true, rootId: scan.rootId, assetRoot: '', reused: false, files: (scan.files || []).length, bytes: 0, created: lines, error: '' }
        }
        // The SAME implementation the card's RPC uses (see runFolderImport): two copies of this
        // logic is how the RPC one kept reporting a present note as "nothing was created".
        const r = await runFolderImport(a)
        const lines = (r.created || []).map(function (c) {
          if (c.ok && c.existing) return '  = ' + c.file + ' → 《' + c.note + '》已存在，跳过（镜像已更新）'
          if (c.ok) return '  ✓ ' + c.file + ' → 《' + c.note + '》' + (c.renamed ? '（同名已被别的文件占用，自动改名）' : '')
          return '  ✗ ' + c.file + ' —— ' + c.error
        }).join('\n')
        return { ok: r.ok, rootId: r.rootId, assetRoot: r.assetRoot, reused: r.reused, files: r.files, bytes: r.bytes, created: lines, error: r.error }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_sync',
      description: '把一份从文件夹导入的笔记与它的**来源文件夹**重新同步：增量镜像（只复制更新的文件）+ 如果来源 .md 变过就把新正文取回来（标记会重新锚定，用户的阅读位置也会尽力保持）。用于用户在别处编辑了原始笔记、或素材文件夹里新增了图片之后。',
      parameters: { note: { type: 'string', description: '同步哪份笔记（默认当前打开的）' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, note: { type: 'string', required: true }, changed: { type: 'boolean', required: true }, files: { type: 'integer', required: true }, bytes: { type: 'integer', required: true }, refs: { type: 'string', required: true }, warn: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('《' + v.note + '》同步完成：' + (v.changed ? '正文已更新' : '正文无变化') + '；镜像 ' + v.files + ' 文件 / ' + Math.round(v.bytes / 1024) + ' KB\n' + v.refs + (v.warn ? '\n注意：' + v.warn : '')) : ('同步失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_sync', exec, { allowEmpty: true })
        const note = args && args.note ? sanitizeNoteName(args.note) : activeNote
        if (!note) return { ok: false, note: '', changed: false, files: 0, bytes: 0, refs: '', warn: '', error: '本会话没有打开的笔记' }
        const r = await syncNoteFromOrigin(note)
        return {
          ok: r.ok === true, note: note, changed: r.changed === true, files: intOr(r.files, 0), bytes: intOr(r.bytes, 0),
          refs: refRender(r.refs), warn: typeof r.warn === 'string' ? r.warn : '',
          error: r.ok ? '' : String(r.error || ''),
        }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_assets',
      description: '查看当前笔记的素材情况：素材根（镜像目录）、原始文件夹、镜像的文件数/字节数，以及本会话已知的素材根清单。图片必须镜像在 note/_assets/ 里，渲染不会读取 note/ 之外的任何路径。',
      parameters: { note: { type: 'string', description: '看哪份笔记（默认当前打开的；不会切换卡片）' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, note: { type: 'string', required: true }, assetRoot: { type: 'string', required: true }, origin: { type: 'string', required: true }, files: { type: 'integer', required: true }, bytes: { type: 'integer', required: true }, roots: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('《' + v.note + '》\n  素材根: ' + (v.assetRoot || '（没有）') + '\n  来源: ' + (v.origin || '—') + '\n  镜像: ' + v.files + ' 文件 / ' + Math.round(v.bytes / 1024) + ' KB' + (v.roots ? '\n\n本会话的素材根:\n' + v.roots : '')) : ('失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_assets', exec, { allowEmpty: true })
        const note = args && args.note ? sanitizeNoteName(args.note) : activeNote
        if (!note) return { ok: false, note: '', assetRoot: '', origin: '', files: 0, bytes: 0, roots: '', error: '本会话没有打开的笔记' }
        const meta = await readNoteMeta(note)
        const index = await readAssetsIndex()
        const rootId = typeof meta.assetRoot === 'string' ? String(meta.assetRoot).replace(ASSETS_DIR + '/', '') : ''
        const all = index.roots.map(function (r) {
          return '  ' + (r.id === rootId ? '* ' : '  ') + r.id + '  ' + r.files + ' 文件 / ' + Math.round(r.bytes / 1024) + ' KB  ← ' + String(r.source || '')
        }).join('\n')
        const entry = index.roots.filter(function (r) { return r && r.id === rootId })[0] || null
        return { ok: true, note: note, assetRoot: typeof meta.assetRoot === 'string' ? meta.assetRoot : '', origin: typeof meta.origin === 'string' ? meta.origin : '', files: entry ? intOr(entry.files, 0) : 0, bytes: entry ? intOr(entry.bytes, 0) : 0, roots: all, error: '' }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_checkpoint',
      description: '在长任务里把当前笔记状态提交一次 git 检查点，便于回溯。',
      parameters: { message: { type: 'string', description: '提交信息，省略则自动生成。' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, hash: { type: 'string', required: true }, nothing: { type: 'boolean', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? (v.nothing ? '没有需要提交的改动' : ('已提交 ' + v.hash)) : ('失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_checkpoint', exec); markTouched()
        const r = await commit((args || {}).message)
        return { ok: r.ok === true, hash: r.hash || '', nothing: r.nothing === true, error: r.ok ? '' : String(r.error || '') }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_patch',
      description: '按区间精确改写笔记的一小段，无需输出全文——这是首选的写入方式（省上下文）。行 1 基、列 0 基、列以该行原文为准，列到行尾可用 endLine 下一行:0。写入后会自动重新锚定已有标记。',
      parameters: { startLine: RANGE_PARAMS.startLine, startCol: RANGE_PARAMS.startCol, endLine: RANGE_PARAMS.endLine, endCol: RANGE_PARAMS.endCol, text: { type: 'string', description: '替换文本；空串表示删除该区间。' } },
      output: { schema: PATCH_SCHEMA, render: patchRender },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_patch', exec); markTouched()
        const r = applyPatch(args || {})
        if (!r.changed) return { ok: true, changed: false, removed: 0, inserted: 0, revision: S.revision, lineCount: linesOf(S.text).length, selections: selRender(viewSelections()), error: '' }
        const wrote = await flushAfterWrite()
        return { ok: wrote, changed: true, removed: r.removed, inserted: r.inserted, revision: S.revision, lineCount: linesOf(S.text).length, selections: selRender(viewSelections()), error: wrote ? '' : S.error }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_patch_many',
      description: '一次改多处：给出多个区间替换，内部从后往前应用以免位置错位。适合一次处理用户划的若干条重点。',
      parameters: {
        edits: {
          type: 'array', required: true, description: '每项含 startLine/startCol/endLine/endCol/text，按你给出的顺序即可。',
          items: { type: 'object', additionalProperties: false, properties: { startLine: { type: 'integer', required: true }, startCol: { type: 'integer', required: true }, endLine: { type: 'integer', required: true }, endCol: { type: 'integer', required: true }, text: { type: 'string' } } },
        },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, applied: { type: 'integer', required: true }, changed: { type: 'boolean', required: true }, removed: { type: 'integer', required: true }, inserted: { type: 'integer', required: true }, revision: { type: 'integer', required: true }, lineCount: { type: 'integer', required: true }, selections: { type: 'string', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已应用 ' + v.applied + ' 处改写: -' + v.removed + ' +' + v.inserted + ' 字符，现 ' + v.lineCount + ' 行 (rev ' + v.revision + ')\n\n' + v.selections) : ('失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_patch_many', exec); markTouched()
        const list = ((args || {}).edits || []).slice()
        const withIdx = list.map(function (e) { return { e: e, at: indexOfPos(S.text, Math.max(1, intOr(e.startLine, 1)), Math.max(0, intOr(e.startCol, 0))) } })
        withIdx.sort(function (x, y) { return y.at - x.at })
        let applied = 0, removed = 0, inserted = 0, changed = false
        for (let i = 0; i < withIdx.length; i++) {
          const r = applyPatch(withIdx[i].e)
          applied += 1
          if (r.changed) { changed = true; removed += r.removed; inserted += r.inserted }
        }
        const wrote = changed ? await flushAfterWrite() : true
        return { ok: wrote, applied: applied, changed: changed, removed: removed, inserted: inserted, revision: S.revision, lineCount: linesOf(S.text).length, selections: selRender(viewSelections()), error: wrote ? '' : S.error }
        })
      },
    }))
    registerToolLocked(harness.defineTool({
      name: 'note_find',
      description: '在笔记里搜索子串，返回命中的行号、列号与上下文片段。用它定位「关于 X 的那段」而不必读全文，再配合 note_patch 精确改写。区分大小写。',
      parameters: { query: { type: 'string', required: true, description: '要搜索的文字' }, note: { type: 'string', description: '在哪一份笔记里搜（默认当前打开的；不切换卡片）' }, limit: { type: 'integer', description: '最多返回条数，默认 20，上限 100。' }, contextChars: { type: 'integer', description: '片段两侧各保留多少字符，默认 40。' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, total: { type: 'integer', required: true }, text: { type: 'string', required: true }, hits: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { line: { type: 'integer', required: true }, col: { type: 'integer', required: true }, snippet: { type: 'string', required: true }, lineText: { type: 'string', required: true } } } } } },
        render: function (a, v) { return [{ type: 'text', text: v.total === 0 ? ('没有匹配 «' + a.query + '»') : ('匹配 ' + v.total + ' 处:\n' + v.text) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_find', exec); markTouched()
        return await useNote(args && args.note, async function () {
        const a = args || {}
        const q = String(a.query || '')
        const limit = Math.min(100, Math.max(1, intOr(a.limit, 20)))
        const ctxN = Math.min(400, Math.max(0, intOr(a.contextChars, 40)))
        const hits = []
        if (q !== '') {
          const all = linesOf(S.text)
          for (let i = 0; i < all.length && hits.length < limit; i++) {
            const line = all[i]
            let at = line.indexOf(q)
            while (at >= 0 && hits.length < limit) {
              const s0 = Math.max(0, at - ctxN), e0 = Math.min(line.length, at + q.length + ctxN)
              hits.push({ line: i + 1, col: at, snippet: (s0 > 0 ? '…' : '') + line.slice(s0, e0) + (e0 < line.length ? '…' : ''), lineText: line.length > 200 ? line.slice(0, 200) + '…' : line })
              at = line.indexOf(q, at + q.length)
            }
          }
        }
        return { ok: true, total: hits.length, hits: hits, text: hits.map(function (h) { return '第' + h.line + '行:' + h.col + '  ' + h.snippet }).join('\n') }
        })
      },
    }))
  },
}
