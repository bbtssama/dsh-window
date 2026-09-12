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

let NOTE_DIR = 'dsh-note'
let NOTE_FILE = 'note.md'
const STATE_FILE = '.note-state.json'
const BAD_STATE_FILE = '.note-state.bad.json'
const STATE_VERSION = 1
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
  // Row config from cordis.patch.yml (`config:`), the same pattern AgentTeams
  // uses for stateDir. Defaults keep the historical dsh-note/note.md layout, so
  // existing notes are untouched.
  if (config) {
    if (typeof config.noteDir === 'string' && config.noteDir.trim() !== '') NOTE_DIR = config.noteDir.trim()
    if (typeof config.noteFile === 'string' && config.noteFile.trim() !== '') NOTE_FILE = config.noteFile.trim()
  }
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
    // `candidateFromInitiator()` and `candidateFromLiveAgents()` were removed with
    // ownFromAgents(): both guessed a workspace from ambient agent state ("who is the
    // current initiator", "there is exactly one agent so it must be them"). A store
    // that guesses its own owner cannot be trusted to stay inside one session, so the
    // only remaining source is the deployment fallback, which adopts nothing — it just
    // gives paths() something to compute while this store is inactive.
    function pickBase() {
      setBase(fallbackBase(), 'deployment')
    }
    function paths() {
      if (pathCache === null) {
        pathCache = {
          dir: base + '/' + NOTE_DIR,
          note: base + '/' + NOTE_DIR + '/' + NOTE_FILE,
          state: base + '/' + NOTE_DIR + '/' + STATE_FILE,
          bad: base + '/' + NOTE_DIR + '/' + BAD_STATE_FILE,
        }
      }
      return pathCache
    }
    pickBase()
    const S = { text: '', selections: [], seq: 0, revision: 1, savedAt: null, commitHash: '', committedAt: null, gitReady: false, gitTrace: '', error: '', fileExists: false, touched: false, stateVersion: STATE_VERSION }
    function fail(where, err) { S.error = where + ': ' + (err && err.message ? err.message : String(err)); console.error(S.error) }
    function markTouched() { if (S.touched) return; S.touched = true; S.revision += 1 }
    async function readIfExists(path) {
      if (fs === undefined) throw new Error('fs 服务不可用')
      const info = await fs.lstat(path)
      if (info === undefined) return null
      const target = await fs.resolve(path)
      return await fs.readText(target)
    }
    async function writeAt(path, content) {
      if (fs === undefined) throw new Error('fs 服务不可用')
      const target = await fs.resolve(path, policyCache !== null ? { cwd: policyCache.workspaceRoot } : undefined)
      await fs.writeText(target, content, undefined, undefined, policyCache !== null ? policyCache : undefined)
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
    function adoptFrom(ses, authority) {
      if (!ses) return false
      let sid = ''
      try { const hd = ses.header || {}; if (typeof hd.id === 'string') sid = hd.id } catch (err) { sid = '' }
      if (sid) {
        if (authority) sessionId = sid
        else {
          if (sessionId && sid !== sessionId) return false
          if (!sessionId) sessionId = sid
        }
      }
      let pol = null
      try { if (policy && typeof policy.resolve === 'function') pol = policy.resolve({ session: ses }) } catch (err) { pol = null }
      let root = ''
      try { root = pol && typeof pol.workspaceRoot === 'string' ? pol.workspaceRoot : '' } catch (err) { root = '' }
      if (!root) return false
      const already = canWrite() && base === root
      policyCache = pol
      confirmed = true
      const moved = setBase(root, authority ? 'session-tool' : 'session')
      return moved || !already
    }
    function adoptFromExec(exec) {
      let ses = null
      try { ses = exec && exec.agent && exec.agent.session ? exec.agent.session : null } catch (err) { ses = null }
      return adoptFrom(ses, true)
    }
    // Removed: ownFromAgents(). It adopted whichever session happened to be the only
    // live agent (`agents.currentInitiator()` / a single-entry `agents.list()`), and it
    // ran from ensureLoaded() — so an incidental tool call or RPC poll in an unrelated
    // session could claim that session as this store's owner, making the card appear
    // where it was never requested. AgentTeams has no such path: its workspace comes
    // only from `agent.session.header.cwd` of the explicit tool caller. Ownership here
    // is likewise explicit now — adoptFromHint (the card naming its own session) or
    // adoptFromExec (a note_* tool call, with authority).
    async function adoptFromHint(id) {
      if (typeof id !== 'string' || !id) return false
      if (sessionId && sessionId !== id) return false
      let ses = null
      try { if (!sessions || typeof sessions.get !== 'function') return false; ses = sessions.get(id) } catch (err) { ses = null }
      if (!ses) return false
      const cwd = cwdOfSession(ses)
      if (!cwd) return false
      let owns = false
      try { const raw = await readIfExists(cwd.replace(/[\\/]+$/, '') + '/' + NOTE_DIR + '/' + NOTE_FILE); owns = raw !== null } catch (err) { owns = false }
      if (!owns) return false
      return adoptFrom(ses, false)
    }
    let loading = null
    async function load() {
      if (fs === undefined) { S.error = 'fs 服务不可用'; return }
      loadedBase = base
      const p = paths()
      try {
        const raw = await readIfExists(p.note)
        if (raw === null) { S.text = SEED_TEXT; S.fileExists = false }
        else { S.text = String(raw).replace(/\r\n?/g, '\n'); S.fileExists = true }
        S.savedAt = isoNow()
      } catch (err) { fail('读取笔记', err) }
      try {
        const rawState = await readIfExists(p.state)
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
      if (canWrite()) await ensureGit()
    }
    function ensureLoaded() {
      if (loading !== null) return loading
      // No ambient adoption here. `ownFromAgents()` used to run on *every* load —
      // "the profile has exactly one live agent, so that must be the owner" — which
      // meant any incidental call (a tool, an RPC poll) could claim the session as
      // this store's owner and make the card appear in a session that never asked
      // for it. Ownership is now established only by an explicit action: the card
      // naming its own session in an RPC (adoptFromHint) or a note_* tool call
      // (adoptFromExec, which is authority). Without either, a session is simply
      // not a participant and reads are reported as such (see stateView).
      if (!confirmed) pickBase()
      loading = load().catch(function (err) { loading = null; fail('初始化', err) })
      return loading
    }
    async function migrate() {
      if (loadedBase === base) return
      const prevText = S.text
      const prevSels = S.selections
      loadedBase = base
      S.gitReady = false
      S.commitHash = ''
      S.committedAt = null
      try {
        const raw = await readIfExists(paths().note)
        if (raw === null) {
          if (prevText) { await writeAt(paths().note, prevText); S.fileExists = true }
          else { S.text = SEED_TEXT; S.fileExists = false }
        } else {
          const nt = String(raw).replace(/\r\n?/g, '\n')
          S.fileExists = true
          if (nt !== prevText) {
            S.selections = prevSels.length > 0 ? remapSelections(prevSels, prevText, nt) : prevSels
            S.text = nt
          }
        }
        S.savedAt = isoNow()
        S.revision += 1
        await persistState()
      } catch (err) { fail('迁移笔记位置', err) }
      await ensureGit()
    }
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
    function viewSelections() {
      const out = []
      for (let i = 0; i < S.selections.length; i++) {
        const s = S.selections[i]
        out.push({ id: s.id, order: i + 1, seq: s.seq, text: s.text, startLine: s.startLine, startCol: s.startCol, endLine: s.endLine, endCol: s.endCol, createdAt: s.createdAt, color: s.color || 'yellow', fetched: s.fetched === true, stale: s.stale === true })
      }
      return out
    }
    function stateView() {
      // A session that never took part in this store must not learn that a note
      // exists at all: reporting an owner is what let a brand-new session render the
      // card and read another workspace's note. Participation is granted only by an
      // explicit action (see ensureLoaded), so before that this is a plain "not mine".
      if (!confirmed) {
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
          // Deliberately opaque: no path, no owner, no content.
          inactive: true,
        }
      }
      return {
        revision: S.revision,
        text: S.text,
        lineCount: linesOf(S.text).length,
        selections: viewSelections(),
        path: paths().note,
        relPath: NOTE_DIR + '/' + NOTE_FILE,
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
        error: S.error,
      }
    }
    async function saveText(nextRaw, baseRevision) {
      await ensureLoaded()
      if (typeof baseRevision === 'number' && baseRevision !== S.revision) return { ok: false, conflict: true, revision: S.revision, selections: viewSelections() }
      const next = String(nextRaw === null || nextRaw === undefined ? '' : nextRaw).replace(/\r\n?/g, '\n')
      const prev = S.text
      if (next !== prev) {
        S.selections = remapSelections(S.selections, prev, next)
        S.text = next
        S.revision += 1
        if (canWrite()) {
          try { await writeAt(paths().note, next); S.fileExists = true; S.savedAt = isoNow() }
          catch (err) { fail('写入笔记', err); return { ok: false, error: S.error, revision: S.revision, selections: viewSelections() } }
          try { await persistState() } catch (err) { fail('写入选中记录', err) }
          if (!S.gitReady) await ensureGit()
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
    // A note_* tool call is the explicit act that makes a session a participant
    // (adoptFromExec is authority: it carries the calling agent's own workspace).
    // Resolving it must be loud rather than silent, exactly like AgentTeams'
    // requireCaptain: a tool that quietly picked a workspace by guessing is how a
    // session ended up reading a note it never asked for.
    async function enterFromTool(where, exec) {
      const moved = adoptFromExec(exec)
      if (!confirmed) {
        throw new Error(where + ' 无法确定本会话的工作区：调用方没有可用的 agent/会话上下文。请在正常会话里调用，或先用 note_diag 确认归属。')
      }
      await ensureLoaded()
      if (moved) await migrate()
    }
    ctx.tools.register(defineTool({
      name: 'note_get_selections',
      description: '读取笔记卡片里用户划选过的全部内容(按正文先后排序的对象数组)。每项含 id、序号 order、起止行/列(1 基行号、0 基列号)、选中时间 createdAt、原文 text、是否已被取用过 fetched、原文是否已变动 stale。',
      parameters: { includeText: { type: 'boolean', description: '是否返回原文 text，默认 true。' } },
      output: { schema: { type: 'array', items: SEL_ITEM }, render: function (a, v) { return [{ type: 'text', text: selRender(v) }] } },
      async execute(args, exec) {
        await enterFromTool('note_get_selections', exec)
        markTouched()
        const list = viewSelections()
        if (args && args.includeText === false) return list.map(function (s) { return Object.assign({}, s, { text: '' }) })
        return list
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_take_new_selections',
      description: '领取用户自上次领取之后新划选的内容(只返回 fetched=false 的对象，并立即把它们标记为已取用，避免重复返回)。回答用户问题前应先调用它，看看用户新划了哪些重点。',
      parameters: {},
      output: { schema: { type: 'array', items: SEL_ITEM }, render: function (a, v) { return [{ type: 'text', text: v.length ? ('用户新选中了 ' + v.length + ' 段:\n\n' + selRender(v)) : '(没有新的选中内容)' }] } },
      async execute(args, exec) {
        await enterFromTool('note_take_new_selections', exec)
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
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_read',
      description: '读取笔记卡片当前正文(磁盘文件 note.md 的实时内容)。返回内容带行号，方便与选中对象的行号对应;也包含选中内容概览。',
      parameters: { withLineNumbers: { type: 'boolean', description: '是否在正文前加行号，默认 true。' }, fromLine: { type: 'integer', description: '只读这一段的第一行(1 基，含)。省略则从头。' }, toLine: { type: 'integer', description: '读到这一行(1 基，含)。省略则到底。' }, padding: { type: 'integer', description: '上下各多读几行，默认 0。' } },
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
      },
    }))
    ctx.tools.register(defineTool({
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
        await enterFromTool('note_diag', exec)
        markTouched()
        return { path: paths().note, baseFrom: baseFrom, confirmed: confirmed, touched: S.touched === true, sessionId: sessionId, gitReady: S.gitReady, gitTrace: S.gitTrace, error: S.error }
      },
    }))
    ctx.tools.register(defineTool({
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
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_commit',
      description: '把笔记卡片当前内容 git 提交一次(用户点保存按钮做的是同一件事)。',
      parameters: { message: { type: 'string', description: '提交信息，省略则自动生成。' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, hash: { type: 'string', required: true }, message: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? ('git 提交: ' + v.hash + ' ' + v.message) : ('提交失败: ' + v.message) }] },
      },
      async execute(args, exec) {
        // This one called adoptFromExec but never ensureLoaded, so committing before
        // any other note call ran against an unloaded store.
        await enterFromTool('note_commit', exec)
        markTouched()
        const r = await commit(args && args.message ? args.message : '')
        return { ok: r.ok === true, hash: r.hash || '', message: r.ok ? (r.nothing ? '没有需要提交的改动' : String(r.message || '')) : String(r.error || '未知错误') }
      },
    }))
    handle('state', async function (args) {
      const moved = await adoptFromHint(args && args.sessionId)
      await ensureLoaded()
      if (moved) await migrate()
      const rev = args && typeof args.revision === 'number' ? args.revision : -1
      if (rev === S.revision) return { unchanged: true, revision: S.revision }
      return stateView()
    })
    // Writes must never happen on behalf of a session that did not identify itself:
    // without this, a poll from an unrelated session could mutate the store of
    // whoever owns it. Reads stay available (state answers `inactive`).
    function notMine(where) { return { ok: false, error: 'inactive', where: where } }
    handle('saveText', async function (args) {
      const a = args || {}
      const moved = await adoptFromHint(a.sessionId)
      if (moved) { await ensureLoaded(); await migrate() }
      if (!confirmed) return notMine('saveText')
      return await saveText(a.text, typeof a.baseRevision === 'number' ? a.baseRevision : undefined)
    })
    handle('addSelection', async function (args) {
      const a = args || {}
      const moved = await adoptFromHint(a.sessionId)
      if (moved) { await ensureLoaded(); await migrate() }
      if (!confirmed) return notMine('addSelection')
      return await addSelection(a)
    })
    handle('removeSelection', async function (args) {
      await ensureLoaded()
      if (!confirmed) return notMine('removeSelection')
      const id = args && args.id ? String(args.id) : ''
      S.selections = S.selections.filter(function (s) { return s.id !== id })
      S.revision += 1
      try { await persistState() } catch (err) { fail('写入选中记录', err) }
      return { ok: true, revision: S.revision, selections: viewSelections() }
    })
    handle('clearSelections', async function () {
      await ensureLoaded()
      if (!confirmed) return notMine('clearSelections')
      S.selections = []
      S.revision += 1
      try { await persistState() } catch (err) { fail('写入选中记录', err) }
      return { ok: true, revision: S.revision, selections: viewSelections() }
    })
    handle('commit', async function (args) {
      await ensureLoaded()
      if (!confirmed) return notMine('commit')
      return await commit(args && args.message ? args.message : '')
    })
    handle('asset', async function (args) {
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
    handle('reload', async function () {
      await ensureLoaded()
      try {
        const raw = await readIfExists(paths().note)
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
    ctx.tools.register(defineTool({
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
        await enterFromTool('note_add_selection', exec); markTouched()
        const r = await addSelection(Object.assign({}, args || {}, { color: colorOf((args || {}).color) }))
        return { ok: r.ok === true, id: r.ok ? r.id : '', revision: S.revision, reason: r.ok ? '' : String(r.reason || ''), selections: selRender(viewSelections()) }
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_remove_selection',
      description: '删除一条划线（按 id，id 来自 note_get_selections）。',
      parameters: { id: { type: 'string', required: true, description: '划线 id，如 sel-9' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, removed: { type: 'boolean', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: (v.ok ? (v.removed ? '已删除 ' + a.id : '未找到 ' + a.id) : '失败') + ' (rev ' + v.revision + ')\n\n' + v.selections }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_remove_selection', exec); markTouched()
        const id = String((args || {}).id || '')
        const before = S.selections.length
        S.selections = S.selections.filter(function (x) { return x.id !== id })
        const removed = S.selections.length !== before
        if (removed) { S.revision += 1; if (canWrite()) { try { await persistState() } catch (err) { fail('写入选中记录', err) } } }
        return { ok: true, removed: removed, revision: S.revision, selections: selRender(viewSelections()) }
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_clear_selections',
      description: '清空全部划线。',
      parameters: {},
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, cleared: { type: 'integer', required: true }, revision: { type: 'integer', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: '已清空 ' + v.cleared + ' 条划线' }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_clear_selections', exec); markTouched()
        const n = S.selections.length
        S.selections = []
        if (n > 0) { S.revision += 1; if (canWrite()) { try { await persistState() } catch (err) { fail('写入选中记录', err) } } }
        return { ok: true, cleared: n, revision: S.revision }
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_set_color',
      description: '修改一条划线的颜色：yellow / pink / green / black。可用它把已处理的划线转成绿色、或把要屏蔽的区间涂黑。',
      parameters: { id: { type: 'string', required: true, description: '划线 id' }, color: { type: 'string', required: true, description: 'yellow / pink / green / black' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, found: { type: 'boolean', required: true }, color: { type: 'string', required: true }, revision: { type: 'integer', required: true }, selections: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: (v.ok ? (v.found ? ('已把 ' + a.id + ' 改为 ' + v.color) : ('未找到 ' + a.id)) : '失败') + ' (rev ' + v.revision + ')\n\n' + v.selections }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_set_color', exec); markTouched()
        const a = args || {}
        const c = colorOf(a.color)
        let found = false
        for (let i = 0; i < S.selections.length; i++) if (S.selections[i].id === String(a.id || '')) { if (S.selections[i].color !== c) { S.selections[i].color = c; found = true } }
        if (found) { S.revision += 1; if (canWrite()) { try { await persistState() } catch (err) { fail('写入选中记录', err) } } }
        return { ok: true, found: found, color: c, revision: S.revision, selections: selRender(viewSelections()) }
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_checkpoint',
      description: '在长任务里把当前笔记状态提交一次 git 检查点，便于回溯。',
      parameters: { message: { type: 'string', description: '提交信息，省略则自动生成。' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, hash: { type: 'string', required: true }, nothing: { type: 'boolean', required: true }, error: { type: 'string', required: true } } },
        render: function (a, v) { return [{ type: 'text', text: v.ok ? (v.nothing ? '没有需要提交的改动' : ('已提交 ' + v.hash)) : ('失败: ' + v.error) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_checkpoint', exec); markTouched()
        const r = await commit((args || {}).message)
        return { ok: r.ok === true, hash: r.hash || '', nothing: r.nothing === true, error: r.ok ? '' : String(r.error || '') }
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_patch',
      description: '按区间精确改写笔记的一小段，无需输出全文——这是首选的写入方式（省上下文）。行 1 基、列 0 基、列以该行原文为准，列到行尾可用 endLine 下一行:0。写入后会自动重新锚定已有划线。',
      parameters: { startLine: RANGE_PARAMS.startLine, startCol: RANGE_PARAMS.startCol, endLine: RANGE_PARAMS.endLine, endCol: RANGE_PARAMS.endCol, text: { type: 'string', description: '替换文本；空串表示删除该区间。' } },
      output: { schema: PATCH_SCHEMA, render: patchRender },
      async execute(args, exec) {
        await enterFromTool('note_patch', exec); markTouched()
        const r = applyPatch(args || {})
        if (!r.changed) return { ok: true, changed: false, removed: 0, inserted: 0, revision: S.revision, lineCount: linesOf(S.text).length, selections: selRender(viewSelections()), error: '' }
        const wrote = await flushAfterWrite()
        return { ok: wrote, changed: true, removed: r.removed, inserted: r.inserted, revision: S.revision, lineCount: linesOf(S.text).length, selections: selRender(viewSelections()), error: wrote ? '' : S.error }
      },
    }))
    ctx.tools.register(defineTool({
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
      },
    }))
    ctx.tools.register(defineTool({
      name: 'note_find',
      description: '在笔记里搜索子串，返回命中的行号、列号与上下文片段。用它定位「关于 X 的那段」而不必读全文，再配合 note_patch 精确改写。区分大小写。',
      parameters: { query: { type: 'string', required: true, description: '要搜索的文字' }, limit: { type: 'integer', description: '最多返回条数，默认 20，上限 100。' }, contextChars: { type: 'integer', description: '片段两侧各保留多少字符，默认 40。' } },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, total: { type: 'integer', required: true }, text: { type: 'string', required: true }, hits: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { line: { type: 'integer', required: true }, col: { type: 'integer', required: true }, snippet: { type: 'string', required: true }, lineText: { type: 'string', required: true } } } } } },
        render: function (a, v) { return [{ type: 'text', text: v.total === 0 ? ('没有匹配 «' + a.query + '»') : ('匹配 ' + v.total + ' 处:\n' + v.text) }] },
      },
      async execute(args, exec) {
        await enterFromTool('note_find', exec); markTouched()
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
              '这个会话的界面右侧悬浮着一张 Markdown 笔记卡片，它的正文就是当前工作目录下的 `' + NOTE_DIR + '/' + NOTE_FILE + '`，受 git 管理。',
              '工作方式:',
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
