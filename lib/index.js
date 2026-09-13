/**
 * dsh-window — host half (permanent profile bundle).
 *
 * Generated from src/dynamic-host.js by src/build.mjs — edit the source and
 * rebuild rather than editing this file directly.
 *
 * Registers the `note_*` model tools, one system-prompt section, and the
 * `/plugins/dsh-window/rpc` route the browser card talks to.
 *
 * @module dsh-window
 */
import { defineTool } from '@deepseek-ai/dsh-tools'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const RPC_PATH = '/plugins/dsh-window/rpc'
const VENDOR_PATH = '/plugins/dsh-window/vendor/mermaid.min.js'
const VENDOR_DIR = '/plugins/dsh-window/vendor/mermaid'

/** Resolver for the dependencies of this package. */
const ownRequire = createRequire(import.meta.url)

/**
 * Absolute path of the mermaid bundle that ships as a declared dependency, or
 * an empty string when it is not installed. Resolved lazily, so a missing
 * asset degrades to the built-in renderer instead of breaking activation.
 * @returns the bundle path, or an empty string.
 */
function mermaidAsset() {
  try { return ownRequire.resolve('mermaid/dist/mermaid.min.js') } catch (err) { return '' }
}

/**
 * Absolute path of the mermaid dist directory, or an empty string when the
 * dependency is absent. The split ESM build lives here and is served as a
 * prefix route so a phone downloads the tiny entry plus only the chunks a
 * diagram needs, instead of the 5.4 MB single-file bundle.
 * @returns the directory path, or an empty string.
 */
function mermaidDistDir() {
  try { return path.dirname(ownRequire.resolve('mermaid/dist/mermaid.esm.min.mjs')) } catch (err) { return '' }
}

/** Method name -> handler, filled by `handle()` during apply. */
const handlers = new Map()

/** The permanent-plugin counterpart of `harness.handle`. */
function handle(name, fn) { handlers.set(name, fn) }

/**
 * Build an idempotent installer for the JSON-RPC route the browser calls.
 *
 * This row mounts early in the host composition — before `webServer` exists —
 * so registration is retried whenever a service appears instead of assuming
 * the service is already there. One POST endpoint dispatching
 * `{ method, args }` keeps the client side a drop-in replacement for the
 * dynamic `host.call(method, args)`.
 * @param ctx - the plugin context owning the route.
 * @returns a function registering the route at most once.
 */
function makeRpcInstaller(ctx) {
  let installed = false
  return function installRpcRoute() {
    if (installed) return
    const webServer = ctx.get('webServer') ?? ctx.get('httpServer')
    if (webServer === undefined) return
    installed = true
    ctx.effect(function () {
      const stopRpc = webServer.register({
      kind: 'exact',
      path: RPC_PATH,
      handler: async function (req, res) {
        const send = function (code, payload) {
          res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          res.end(JSON.stringify(payload))
        }
        if (req.method !== 'POST') { send(405, { ok: false, error: 'POST only' }); return }
        let raw = ''
        try {
          // Deliberately NOT `raw = await new Promise(...)`: resolving with no
          // argument would assign undefined over the accumulated body.
          await new Promise(function (resolve, reject) {
            req.on('data', function (chunk) {
              raw += chunk
              if (raw.length > 4e6) { reject(new Error('payload too large')); try { req.destroy() } catch (err) { } }
            })
            req.on('end', function () { resolve() })
            req.on('error', reject)
          })
        } catch (err) {
          send(400, { ok: false, error: 'read body: ' + (err && err.message ? err.message : String(err)) })
          return
        }
        let payload = null
        try { payload = JSON.parse(raw || '{}') } catch (err) { send(400, { ok: false, error: 'bad json' }); return }
        const method = payload && payload.method
        const fn = handlers.get(method)
        if (typeof fn !== 'function') { send(404, { ok: false, error: 'unknown method: ' + String(method) }); return }
        try {
          const result = await fn(payload.args === undefined ? null : payload.args)
          send(200, { ok: true, result: result === undefined ? null : result })
        } catch (err) {
          send(200, { ok: false, error: err && err.message ? err.message : String(err) })
        }
      },
      })
      // Mermaid is a declared dependency, served straight out of
      // node_modules so the published package vendors no bundle of its own.
      const stopVendor = webServer.register({
        kind: 'exact',
        path: VENDOR_PATH,
        handler: async function (req, res) {
          const file = mermaidAsset()
          if (file === '') {
            res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
            res.end('mermaid is not installed')
            return
          }
          try {
            const bytes = await readFile(file)
            res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=604800' })
            res.end(bytes)
          } catch (err) {
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
            res.end(String(err && err.message ? err.message : err))
          }
        },
      })
      // Split ESM carrier: /plugins/dsh-window/vendor/mermaid/<file>
      const stopVendorDir = webServer.register({
        kind: 'prefix',
        path: VENDOR_DIR,
        handler: async function (req, res) {
          const dir = mermaidDistDir()
          if (dir === '') {
            res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
            res.end('mermaid is not installed')
            return
          }
          let rel = String(req.url || '').split('?')[0]
          if (rel.indexOf(VENDOR_DIR) === 0) rel = rel.slice(VENDOR_DIR.length)
          while (rel.charAt(0) === '/') rel = rel.slice(1)
          let safe = rel !== '' && rel.indexOf('..') < 0
          const ALLOWED = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-/';
          for (let i = 0; i < rel.length && safe; i++) if (ALLOWED.indexOf(rel.charAt(i)) < 0) safe = false
          if (!safe) {
            res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
            res.end('bad path')
            return
          }
          try {
            const bytes = await readFile(path.join(dir, rel))
            const type = /.mjs$/.test(rel) ? 'text/javascript; charset=utf-8' : 'application/octet-stream'
            res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=604800' })
            res.end(bytes)
          } catch (err) {
            res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
            res.end('not found')
          }
        },
      })
      return function () { try { stopRpc() } catch (err) { } try { stopVendor() } catch (err) { } try { stopVendorDir() } catch (err) { } }
    }, 'dsh-window: rpc + vendor routes')
  }
}

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
const STATE_VERSION = 1
const SESSION_STATE_VERSION = 1
const MAX_NAME_LEN = 48
const MAX_IMPORT_BYTES = 8 * 1024 * 1024
// Highlight colour a selection carries. Agent-visible enum; the client paints it
// as an overlay behind the text, so overlapping ranges simply blend.
const COLORS = { yellow: 1, pink: 1, green: 1, black: 1 }
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
  }
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

export const name = 'dsh-window'
export const inject = ['tools']
export function apply(ctx, config) {
  // `config` is the `config:` a composition passes for this row. It is ignored
  // on purpose: the note space is per-session and fixed (ROOT_DIR / NOTES_DIR /
  // NOTE_FILE in the storage-model block above), so there is nothing to bind.
  // The retired `noteDir`/`noteFile` bindings used to run right here and named a
  // NOTE_DIR that the storage model had dropped — a config-only ReferenceError
  // that killed the whole plugin tree at boot ("NOTE_DIR is not defined").
  void config
    let fs, shell, systemPrompt, policy, agents, sessions
    function refreshServices() {
      fs = ctx.get('fs')
      shell = ctx.get('shell')
      systemPrompt = ctx.get('systemPrompt')
      policy = ctx.get('sandboxPolicy')
      agents = ctx.get('agents')
      sessions = ctx.get('sessions')
    }
    refreshServices()
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
        activeNote: '', sessionNotes: null,
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
      return ctx.tools.register(def)
    }
    /** Register an RPC handler whose whole body runs inside the store lock. */
    function handleLocked(method, fn) {
      return handle(method, async function (args) {
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
    async function runGit(args) {
      if (shell === undefined) return { ok: false, out: '', err: 'shell 服务不可用' }
      const req = { command: 'git ' + args, workdir: paths().dir, timeoutMs: 30000 }
      if (policyCache !== null) req.sandboxPolicy = policyCache
      const spec = shell.resolve(req)
      const r = await shell.run(spec)
      const out = r && r.stdout && typeof r.stdout.text === 'string' ? r.stdout.text : ''
      const err = r && r.stderr && typeof r.stderr.text === 'string' ? r.stderr.text : ''
      return { ok: r && r.exitCode === 0, out: out.trim(), err: err.trim() }
    }
    async function ensureGit() {
      if (shell === undefined) { S.gitReady = false; return }
      if (!canWrite()) { S.gitReady = false; return }
      const wasReady = S.gitReady
      try {
        if (!S.fileExists) { await writeAt(paths().note, S.text || SEED_TEXT); S.fileExists = true }
        const probe = await runGit('rev-parse --is-inside-work-tree')
        if (!probe.ok) {
          const init = await runGit('init -q')
          if (!init.ok) { S.gitReady = false; fail('git init', new Error(init.err || init.out)); return }
          await runGit('config user.email "dsh-note@local"')
          await runGit('config user.name "DSH Note"')
        }
        const head = await runGit('rev-parse --verify HEAD')
        if (!head.ok) { await runGit('add -A'); await runGit('commit -q -m "note: init"') }
        const rev = await runGit('rev-parse --short HEAD')
        S.commitHash = rev.ok ? rev.out : ''
        if (rev.ok) S.committedAt = isoNow()
        S.gitReady = true
        if (!wasReady) S.revision += 1
      } catch (err) { S.gitReady = false; fail('git', err) }
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
      const names = await listNoteDirs()
      sessionNotes = names
      if (want && names.indexOf(want) >= 0) activeNote = want
      else activeNote = names.length ? names[0] : ''
      pathCache = null
    }
    async function writeSessionState() {
      if (!sessionId) return
      try {
        const payload = { v: SESSION_STATE_VERSION, sessionId: sessionId, active: activeNote || '', summoned: summoned === true, updatedAt: isoNow() }
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
      if (canWrite()) await ensureGit()
    }
    function ensureLoaded() {
      if (loading !== null) return loading
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
      S.view = { line: line, anchor: anchor, updatedAt: isoNow() }
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
        out.push({ id: s.id, order: i + 1, seq: s.seq, text: s.text, startLine: s.startLine, startCol: s.startCol, endLine: s.endLine, endCol: s.endCol, createdAt: s.createdAt, color: s.color || 'yellow', fetched: s.fetched === true, stale: s.stale === true })
      }
      return out
    }
    function stateView(callerId) {
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
          if (!S.gitReady) await ensureGit()
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
      const sel = { id: 'sel-' + S.seq, seq: S.seq, startLine: first.line, startCol: first.col, endLine: last.line, endCol: last.col, text: text, createdAt: isoNow(), color: COLORS[a.color] ? a.color : 'yellow', fetched: false, stale: false }
      S.selections = sortSelections(S.selections.concat([sel]))
      S.revision += 1
      try { await persistState() } catch (err) { fail('写入选中记录', err) }
      return { ok: true, id: sel.id, revision: S.revision, selections: viewSelections() }
    }
    async function commit(message) {
      await ensureLoaded()
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
      const c = await runGit('commit -q -m "' + msg + '"')
      if (!c.ok) return { ok: false, error: 'git commit 失败: ' + (c.err || c.out) }
      const rev = await runGit('rev-parse --short HEAD')
      S.commitHash = rev.ok ? rev.out : ''
      S.committedAt = isoNow()
      return { ok: true, hash: S.commitHash, message: msg }
    }
    function selRender(list) {
      if (!list || list.length === 0) return '（当前没有任何选中内容）'
      const parts = []
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        // The colour is part of the message the agent receives: it is the intent
        // channel (yellow focus / pink question / green done / black masked), so it
        // has to appear in the text render, not only in the stored object.
        const head = '#' + s.order + ' [' + s.id + '] ' + ({ yellow: '黄', pink: '粉', green: '绿', black: '黑' }[s.color] || '黄') + ' 第' + s.startLine + '行:' + s.startCol + ' → 第' + s.endLine + '行:' + s.endCol + (s.fetched ? ' （已取用）' : ' （新选中）') + (s.stale ? ' [!]原文已变动' : '')
        parts.push(head + '\n' + s.text.split('\n').map(function (l) { return '    ' + l }).join('\n'))
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
        await load()
        if (canWrite()) {
          try { await ensureGit() } catch (err) { }
          try { await commit('note: 新建 ' + name + (kind === 'empty' ? '' : '（来自' + kind + '）')) } catch (err) { }
        }
      } else sessionNotes = null
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
    async function notesView() {
      const names = await listNoteDirs()
      sessionNotes = names
      const out = []
      for (let i = 0; i < names.length; i++) {
        const name = names[i]
        const dir = sessionRoot() + '/' + name
        let lines = 0
        let bytes = 0
        try {
          const raw = await readIfExists(dir + '/' + NOTE_FILE)
          if (raw !== null) { lines = linesOf(raw).length; bytes = raw.length }
        } catch (err) { }
        let selections = 0
        try {
          const rawState = await readIfExists(dir + '/' + STATE_FILE)
          if (rawState !== null) { const parsed = JSON.parse(rawState); if (parsed && Array.isArray(parsed.selections)) selections = parsed.selections.length }
        } catch (err) { }
        let commitHash = ''
        if (name === activeNote) commitHash = S.commitHash
        else {
          const r = await runGitIn(dir, 'rev-parse --short HEAD')
          if (r.ok) commitHash = r.out
        }
        out.push({ name: name, active: name === activeNote, lines: lines, bytes: bytes, commitHash: commitHash, selections: selections })
      }
      return out
    }
    async function runGitIn(dir, args) {
      if (shell === undefined) return { ok: false, out: '', err: 'shell 服务不可用' }
      const req = { command: 'git ' + args, workdir: dir, timeoutMs: 30000 }
      if (policyCache !== null) req.sandboxPolicy = policyCache
      const spec = shell.resolve(req)
      const r = await shell.run(spec)
      const out = r && r.stdout && typeof r.stdout.text === 'string' ? r.stdout.text : ''
      const err = r && r.stderr && typeof r.stderr.text === 'string' ? r.stderr.text : ''
      return { ok: r && r.exitCode === 0, out: out.trim(), err: err.trim() }
    }
    registerToolLocked(defineTool({
      name: 'note_get_selections',
      description: '读取笔记卡片里用户划选过的全部内容(按正文先后排序的对象数组)。每项含 id、序号 order、起止行/列(1 基行号、0 基列号)、选中时间 createdAt、原文 text、是否已被取用过 fetched、原文是否已变动 stale。',
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
    registerToolLocked(defineTool({
      name: 'note_take_new_selections',
      description: '领取用户自上次领取之后新划选的内容(只返回 fetched=false 的对象，并立即把它们标记为已取用，避免重复返回)。回答用户问题前应先调用它，看看用户新划了哪些重点。',
      parameters: { note: { type: 'string', description: '取哪一份笔记的新划线（默认当前打开的）' } },
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
    registerToolLocked(defineTool({
      name: 'note_read',
      description: '读取笔记卡片当前正文(磁盘文件 note.md 的实时内容)。返回内容带行号，方便与选中对象的行号对应;也包含选中内容概览。',
      parameters: { withLineNumbers: { type: 'boolean', description: '是否在正文前加行号，默认 true。' }, note: { type: 'string', description: '要看哪一份笔记（默认当前打开的；指定别的名字不会切换卡片）' }, fromLine: { type: 'integer', description: '只读这一段的第一行(1 基，含)。省略则从头。' }, toLine: { type: 'integer', description: '读到这一行(1 基，含)。省略则到底。' }, padding: { type: 'integer', description: '上下各多读几行，默认 0。' } },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: { path: { type: 'string', required: true }, lineCount: { type: 'integer', required: true }, fromLine: { type: 'integer', required: true }, toLine: { type: 'integer', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true }, text: { type: 'string', required: true } },
        },
        render: function (a, v) {
          const numbered = v.text.split('\n').map(function (l, i) { return ('    ' + String(i + v.fromLine)).slice(-5) + '| ' + l }).join('\n')
          const range = (v.fromLine === 1 && v.toLine === v.lineCount) ? '' : (' 第 ' + v.fromLine + '-' + v.toLine + ' 行')
          return [{ type: 'text', text: '笔记文件: ' + v.path + (range ? range : '') + ' (共 ' + v.lineCount + ' 行)\n\n' + numbered + '\n\n--- 选中概览 ---\n' + v.selections }]
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
        return { path: paths().note, lineCount: all.length, fromLine: from, toLine: to, revision: S.revision, selections: selRender(viewSelections()), text: all.slice(from - 1, to).join('\n') }
        })
      },
    }))
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
                properties: { name: { type: 'string', required: true }, active: { type: 'boolean', required: true }, lines: { type: 'integer', required: true }, bytes: { type: 'integer', required: true }, commitHash: { type: 'string', required: true }, selections: { type: 'integer', required: true } },
              },
            },
          },
        },
        render: function (a, v) {
          const rows = (v.notes || []).map(function (n) { return (n.active ? '* ' : '- ') + n.name + '  ' + n.lines + ' 行' + (n.commitHash ? '  git ' + n.commitHash : '') })
          return [{ type: 'text', text: '会话 ' + v.notesDir.split('/').slice(-1)[0] + ' 的笔记（' + (v.notes || []).length + ' 份）' + (v.active ? '，当前打开: ' + v.active : '，当前没有打开任何笔记') + '\n' + (rows.length ? rows.join('\n') : '(还没有笔记，用 note_create 新建)') }]
        },
      },
      async execute(args, exec) {
        await enterFromTool('note_list', exec, { allowEmpty: true })
        const notes = await notesView()
        return { notesDir: sessionRoot(), active: activeNote, notes: notes }
      },
    }))
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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
      if (rev === S.revision) return { unchanged: true, revision: S.revision }
      // The panel needs full note rows (name, lines, commit), not just the names the
      // store keeps for itself — merging a name list over them rendered "undefined".
      const v = stateView(callerId)
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
    // Where the reader is, so switching notes (or coming back tomorrow) resumes in place.
    // Deliberately NOT part of the guarded selection state and not a revision bump: it is
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
    // "清空全部选中功能失效". verify-notes now calls all 15 RPCs so this cannot come back.
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
    handleLocked('asset', async function (args) {
      await ensureLoaded()
      const p = String((args && args.path) || '')
      if (!p) return { ok: false, error: 'empty path' }
      if (/^[a-z]+:\/\//i.test(p)) return { ok: false, error: 'not a local path' }
      try {
        if (fs === undefined) return { ok: false, error: 'fs 不可用' }
        const target = await fs.resolve(p, { cwd: paths().dir })
        const bytes = await fs.readBytes(target, undefined, 16 * 1024 * 1024)
        const mime = mimeOf(p)
        return { ok: true, mime: mime, size: bytes.length, dataUrl: 'data:' + mime + ';base64,' + b64(bytes) }
      } catch (err) { return { ok: false, error: (err && err.message) ? err.message : String(err) } }
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
                        : '笔记卡片已收起（本会话的笔记与划线都没有动）。',
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


    // ── 协同工具：精确写入 / 搜索 / 划线管理 ────────────────────────────────
    // 全部复用上面的 helper，所以位置换算、重新锚定、落盘与 git 语义完全一致。
    const COLOR_SET = { yellow: 1, pink: 1, green: 1, black: 1 }
    function colorOf(v) { return COLOR_SET[v] ? v : 'yellow' }

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
    /** 落盘（笔记 + 划线状态），返回是否成功。 */
    async function flushAfterWrite() {
      if (!canWrite()) return true
      try { await writeAt(paths().note, S.text); S.fileExists = true; S.savedAt = isoNow() }
      catch (err) { fail('写入笔记', err); return false }
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
    registerToolLocked(defineTool({
      name: 'note_add_selection',
      description: '由 agent 新建一条划线（高亮）。用于标注你要用户注意、或后续要跟进的区间。color: yellow(默认) / pink / green / black(黑色是遮盖，字会被挡住)。',
      parameters: {
        startLine: { type: 'integer', required: true, description: '起始行（1 基）' },
        startCol: { type: 'integer', required: true, description: '起始列（0 基）' },
        endLine: { type: 'integer', required: true, description: '结束行（1 基，含）' },
        endCol: { type: 'integer', required: true, description: '结束列（0 基，不含）' },
        color: { type: 'string', description: 'yellow / pink / green / black，默认 yellow。' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, id: { type: 'string', required: true }, revision: { type: 'integer', required: true }, reason: { type: 'string', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('已新建划线 ' + v.id + ' (rev ' + v.revision + ')\n\n' + v.selections) : ('未新建: ' + (v.reason === 'empty' ? '该区间为空' : v.reason)) }] },
      },
      async execute(args, exec) {
        return await withNoteLock(noteLockKey(), async function () {
        await enterFromTool('note_add_selection', exec); markTouched()
        const r = await addSelection(Object.assign({}, args || {}, { color: colorOf((args || {}).color) }))
        return { ok: r.ok === true, id: r.ok ? r.id : '', revision: S.revision, reason: r.ok ? '' : String(r.reason || ''), selections: selRender(viewSelections()) }
        })
      },
    }))
    registerToolLocked(defineTool({
      name: 'note_remove_selection',
      description: '删除一条划线（按 id，id 来自 note_get_selections）。',
      parameters: { id: { type: 'string', required: true, description: '划线 id，如 sel-9' } },
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
    registerToolLocked(defineTool({
      name: 'note_clear_selections',
      description: '清空全部划线。',
      parameters: {},
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, cleared: { type: 'integer', required: true }, revision: { type: 'integer', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: '已清空 ' + v.cleared + ' 条划线' }] },
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
    registerToolLocked(defineTool({
      name: 'note_set_color',
      description: '修改一条划线的颜色：yellow / pink / green / black。可用它把已处理的划线转成绿色、或把要屏蔽的区间涂黑。',
      parameters: { id: { type: 'string', required: true, description: '划线 id' }, color: { type: 'string', required: true, description: 'yellow / pink / green / black' } },
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
      name: 'note_patch',
      description: '按区间精确改写笔记的一小段，无需输出全文——这是首选的写入方式（省上下文）。行 1 基、列 0 基、列以该行原文为准，列到行尾可用 endLine 下一行:0。写入后会自动重新锚定已有划线。',
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
    registerToolLocked(defineTool({
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
    registerToolLocked(defineTool({
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

  // This row can activate before the services it talks to exist, so the route
  // and the system-prompt section are (re)installed whenever a service appears.
  const installRpcRoute = makeRpcInstaller(ctx)
  function registerPromptSection() {
    if (registerPromptSection.done || systemPrompt === undefined) return
    registerPromptSection.done = true
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
              '- 每次回答用户之前，先调用 `note_take_new_selections`: 它返回用户自上次取用以来新划选的重点(含行号与原文)，并把这些对象标记为已取用。用户划线往往就是"这里我不懂/我要你展开"。',
              '- 需要回顾全部划线时用 `note_get_selections`; 需要笔记全文(含行号)时用 `note_read`，也可以直接用 `read` 工具读该文件。',
              '- 用户在卡片里手动编辑会立刻落盘; 点"保存"按钮会 git 提交。你写入后默认也会自动提交一次。',
              '- 卡片支持图片：`![alt](./x.png)` 这类本地相对路径会由 host 读成 data URL 渲染；在线 http(s) 图片直接渲染。引用整张图时，选中范围会自动吸附到整段图片语法。',
              '- 代码块按语言做语法高亮；`mermaid` 代码块会渲染成图（支持 graph/flowchart 的 TD/TB/LR/RL 分层图），其余图种降级为源码卡片。',
              '- 行号是 1 基，列号是 0 基，都以该行文本为基准。引用划线内容时请原样引用，不要编造用户没有划过的内容。',
              '- 改一小段就用 `note_patch`（按区间替换，不必输出全文）；多处一起改用 `note_patch_many`（内部从后往前应用）。',
              '- 要定位"关于某话题的那段"用 `note_find`，拿到行号列号后直接 `note_patch`，不要先读全文；只读窗口用 `note_read({fromLine,toLine,padding})`。',
              '- 你也能管理划线：`note_add_selection`（新建，可指定颜色）/ `note_remove_selection` / `note_set_color` / `note_clear_selections`。',
              '- 颜色即意图：yellow=重点、pink=疑问（要我展开）、green=已确认/已处理、black=遮盖（这段不要引用也不要复述）。处理完一条划线后，可用 `note_set_color` 把它转成 green 作为闭环信号。',
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
                return '本会话的笔记空间：**已打开《' + st.activeNote + '》**（本会话共 ' + String((st.sessionNotes || []).length) + ' 份笔记，目录 ' + st.base + '/' + ROOT_DIR + '/' + NOTES_DIR + '/' + sid + '）。下面的工作方式全部适用，包括回答前先取用户的新划线。'
              }
              return '本会话的笔记空间：**本会话还没有笔记**。不要主动创建；只有用户明确要求记笔记时，才用 note_create 建一份（或用 /window-note 打开面板）。'
            })
          })
        }
      } catch (err) { fail('注册段落失败', err) }
    }
  }
  function wireLateServices() {
    refreshServices()
    installRpcRoute()
    registerPromptSection()
  }
  wireLateServices()
  ctx.on('internal/service', wireLateServices)
}
