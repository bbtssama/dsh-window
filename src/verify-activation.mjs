/**
 * Live-ish proof of the accidental-activation fix, without restarting dsh.
 *
 * Loads the built host half, mounts it on a mock ctx, and drives the two entry
 * points a session can arrive through:
 *
 *   1. the RPC the browser card polls (`state`) with no sessionId
 *   2. the `state` RPC naming a session that does not own this store
 *   3. `note_*` tool calls with and without a calling agent
 *
 * The property under test: a session that never explicitly acted gets `inactive`
 * and NO note content, and every write is refused. This is what stops the card
 * appearing in a session that never asked for it.
 *
 * Run: node src/verify-activation.mjs
 */
import path from 'node:path'

const lib = path.join('D:\\DSH\\profiles\\web\\node_modules\\dsh-window\\lib')
const host = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href)

let failed = 0
const ok = (label, cond, detail) => {
  if (cond) console.log('  PASS  ' + label)
  else { failed++; console.log('  FAIL  ' + label + (detail === undefined ? '' : '  -> ' + detail)) }
}

// ── mock services ──────────────────────────────────────────────────────
const files = new Map()
const tools = new Map()
let routeHandler = null
const written = []

// The host half registers its model tools through this service.
const toolsRegistry = {
  register(t) { tools.set(t.name, t) },
}

// The plugin composes paths with '/', so normalise keys in the fake fs.
const k = (p) => String(p).replace(/\\/g, '/')
const fs = {
  async lstat(p) { return files.has(k(p)) ? { size: files.get(k(p)).length, type: 'file' } : undefined },
  async resolve(p) { return k(p) },
  async readText(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return files.get(k(p)) },
  async readBytes(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return Buffer.from(files.get(k(p))) },
  async writeText(p, c) { files.set(k(p), String(c)); written.push(k(p)) },
}
const shell = {
  resolve: (r) => r,
  async run(req) { return { exitCode: 0, stdout: { text: 'true\n' }, stderr: { text: '' } } },
}
// A workspace that DOES contain a note, plus a policy for it.
// Forward slashes on purpose: the plugin composes paths with '/', and the fake fs
// keys by the normalised string, so a backslash root would seed a different key than
// the one the plugin reads (it would then see "no note" and write a fresh seed).
const WORKSPACE = 'C:/WS/own'
const OTHER = 'C:/WS/other'
files.set(WORKSPACE + '/dsh-note/note.md', '# 我的知识笔记\n\n机密内容：这条只应该归属会话 A。\n')
files.set(WORKSPACE + '/dsh-note/.note-state.json', JSON.stringify({ v: 1, seq: 1, selections: [{ id: 'sel-1', seq: 1, startLine: 3, startCol: 0, endLine: 3, endCol: 5, text: '机密内容', createdAt: 'x', color: 'yellow' }] }) + '\n')

// The sandbox policy resolves a session to its workspace root; adoptFrom() reads
// `workspaceRoot` from that resolution, so the mock must answer per session.
const policy = {
  workspaceRoot: OTHER,
  resolve(args) {
    const ses = args && args.session ? args.session : null
    const cwd = ses && ses.header && typeof ses.header.cwd === 'string' ? ses.header.cwd : ''
    return { workspaceRoot: cwd || this.workspaceRoot }
  },
}
const sessions = {
  _m: new Map(),
  get(id) { return this._m.get(id) || null },
}
function sessionWith(id, cwd) { return { header: { id, cwd } } }
const OWNER = 'sess-owner-111'
sessions._m.set(OWNER, sessionWith(OWNER, WORKSPACE))
// The plugin captures its services when apply() runs, so the live-agent list has to be
// reachable through the SAME object the whole time — mutating it is how these tests
// simulate "the owning session is still running" vs "it has ended".
let liveList = [{ session: sessionWith(OWNER, WORKSPACE) }]
const agentsService = { currentInitiator: () => null, list: () => liveList }
// systemPrompt.section(...) plus the variable provider the section interpolates.
const promptSections = []
const promptVariables = new Map()
const promptService = {
  section(spec) { promptSections.push(spec); return () => { } },
  variable(name, provider) { promptVariables.set(name, provider); return () => { } },
  add() { return () => { } },
}

const ctx = {
  get(name) {
    if (name === 'fs') return fs
    if (name === 'shell') return shell
    if (name === 'sandboxPolicy') return policy
    if (name === 'sessions') return sessions
    if (name === 'agents') return agentsService
    if (name === 'tools') return toolsRegistry
    // The real webServer contract: register({ kind, path, handler }) -> disposer.
    if (name === 'webServer') {
      return {
        register(spec) {
          if (!spec || String(spec.path).indexOf('/rpc') < 0) return () => { }
          routeHandler = spec.handler
          return () => { routeHandler = null }
        },
      }
    }
    if (name === 'systemPrompt') return promptService
    return undefined
  },
  // The plugin wraps its route registration in ctx.effect(...), so the effect must
  // actually run for the routes to be installed.
  effect(fn) { if (typeof fn === 'function') fn() },
  on(ev, fn) { if (ev === 'internal/service') lateWiring.push(fn); return () => { } },
  timeout: (fn, ms) => setTimeout(fn, ms),
  interval: (fn, ms) => setInterval(fn, ms),
  logger: { info() { }, warn() { }, error() { } },
}
// Model tools are registered through the ctx property, not a service lookup.
ctx.tools = toolsRegistry

const lateWiring = []
host.apply(ctx, {})
// The plugin installs its routes from `wireLateServices`; in a real host that runs
// when the service appears after mount. Here the webServer is declared up front, so
// replay the event the way the host would.
for (const fn of lateWiring) fn()

// Drive the route the way the card does: a POST whose body is JSON.
const rpc = async (method, args) => {
  if (!routeHandler) throw new Error('route not registered')
  const raw = JSON.stringify({ method, args })
  const listeners = {}
  const req = {
    method: 'POST',
    on(ev, fn) { listeners[ev] = fn; return this },
    destroy() { },
  }
  let out = null
  const res = {
    writeHead() { return this },
    end(body) { out = body; return this },
  }
  const p = routeHandler(req, res)
  listeners.data(Buffer.from(raw))
  listeners.end()
  await p
  return JSON.parse(out)
}

console.log('accidental activation')

// 1. A poll from a page that names no session must learn nothing.
const idle = await rpc('state', { revision: -1, sessionId: '' })
const idleR = idle && idle.result
ok('idle session: reported inactive', idleR && idleR.inactive === true, JSON.stringify(idleR && { inactive: idleR.inactive }))
ok('idle session: no note text leaks', idleR && idleR.text === '', JSON.stringify(idleR && idleR.text))
ok('idle session: no selections leak', idleR && Array.isArray(idleR.selections) && idleR.selections.length === 0, JSON.stringify(idleR && idleR.selections && idleR.selections.length))
ok('idle session: no owner and no path leak', idleR && idleR.sessionId === '' && idleR.path === '', JSON.stringify(idleR && { sid: idleR.sessionId, path: idleR.path }))

// 2. Writes from an unidentified page are refused, and touch nothing.
const before = written.length
const w1 = await rpc('saveText', { text: 'pwned', sessionId: '' })
const w2 = await rpc('addSelection', { sessionId: '', startLine: 1, startCol: 0, endLine: 1, endCol: 1 })
const w3 = await rpc('clearSelections', { sessionId: '' })
ok('idle session: saveText refused', w1 && w1.result && w1.result.ok === false && w1.result.error === 'inactive', JSON.stringify(w1 && w1.result))
ok('idle session: addSelection refused', w2 && w2.result && w2.result.ok === false, JSON.stringify(w2 && w2.result))
ok('idle session: clearSelections refused', w3 && w3.result && w3.result.ok === false, JSON.stringify(w3 && w3.result))
ok('idle session: nothing was written', written.length === before, written.length + ' writes')

// 3. An unknown session id cannot claim the store either.
const alien = await rpc('state', { revision: -1, sessionId: 'sess-nobody-999' })
ok('unknown session id: still inactive', alien && alien.result && alien.result.inactive === true, JSON.stringify(alien && alien.result && alien.result.inactive))

// 4. A tool call with no calling agent must fail loudly instead of guessing.
const t = tools.get('note_read')
let threw = ''
try { await t.execute({}, { agent: undefined }) } catch (e) { threw = String(e.message || e) }
ok('note_read without a calling agent fails loudly', /工作区/.test(threw) && /note_read/.test(threw), threw.slice(0, 90))

// 5. A tool call from a real session adopts THAT session's workspace (explicit act).
const r5 = await t.execute({}, { agent: { session: sessionWith(OWNER, WORKSPACE) } })
ok('explicit tool call adopts the caller workspace', r5 && typeof r5.path === 'string' && k(r5.path).indexOf('WS/own') > 0, JSON.stringify(r5 && r5.path))
ok('explicit tool call returns the real note', r5 && /机密内容/.test(r5.text), JSON.stringify(r5 && r5.text && r5.text.slice(0, 40)))

// 6. And now that store IS owned, so the card may render for that session.
const owned = await rpc('state', { revision: -1, sessionId: OWNER })
ok('participating session sees its note', owned && owned.result && owned.result.inactive !== true && /机密内容/.test(owned.result.text), JSON.stringify(owned && owned.result && owned.result.text.slice(0, 20)))

// 7. A different session cannot see it — and now gets the opaque answer with the owner
//    named, rather than the note plus the owner id.
const other = await rpc('state', { revision: -1, sessionId: 'sess-someone-else' })
ok('a different session is refused and told who owns it',
  other && other.result && other.result.inactive === true && other.result.text === '' && other.result.ownerSessionId === OWNER,
  JSON.stringify(other && other.result && { inactive: other.result.inactive, textLen: (other.result.text || '').length, owner: other.result.ownerSessionId }))

// ── a LIVE owner must be protected from takeover ────────────────────────────────
// This is the reported symptom: a brand-new session in the same workspace got the card.
console.log('live-owner protection')
const FOREIGN = 'sess-newcomer-222'
sessions._m.set(FOREIGN, sessionWith(FOREIGN, WORKSPACE))

const newcomer = await rpc('state', { revision: -1, sessionId: FOREIGN })
ok('a newcomer in the same workspace is told nothing',
  newcomer && newcomer.result && newcomer.result.inactive === true && newcomer.result.text === '' && newcomer.result.ownerSessionId === OWNER,
  JSON.stringify(newcomer && newcomer.result && { inactive: newcomer.result.inactive, textLen: newcomer.result.text.length, owner: newcomer.result.ownerSessionId }))
const newcomerWrite = await rpc('saveText', { text: 'stolen', sessionId: FOREIGN })
ok('a newcomer cannot write', newcomerWrite && newcomerWrite.result && newcomerWrite.result.ok === false && newcomerWrite.result.error === 'inactive', JSON.stringify(newcomerWrite && newcomerWrite.result))

let refused = ''
try { await t.execute({}, { agent: { session: sessionWith(FOREIGN, WORKSPACE) } }) } catch (e) { refused = String(e.message || e) }
ok('a newcomer tool call is refused loudly', /被拒绝/.test(refused) && /note_read/.test(refused), refused.slice(0, 100))
ok('the refusal left the note untouched', /机密内容/.test(files.get('C:/WS/own/dsh-note/note.md')), 'note.md on disk is intact')
ok('the prompt tells a newcomer not to call note tools',
  (() => { const f = promptVariables.get('dsh_window_note_scope'); return !!f && /不要调用任何/.test(String(f({ agent: { session: sessionWith(FOREIGN, WORKSPACE) } }))) })(),
  'variable dsh_window_note_scope answers per session')
ok('the prompt tells the owner to use them',
  (() => { const f = promptVariables.get('dsh_window_note_scope'); return !!f && /归属会话/.test(String(f({ agent: { session: sessionWith(OWNER, WORKSPACE) } }))) })(),
  'owner text present')

// ── once the owner has ended, the store becomes adoptable again ─────────────────
console.log('takeover after the owner ends')
liveList = []
const reclaimed = await t.execute({}, { agent: { session: sessionWith(FOREIGN, WORKSPACE) } })
ok('a tool call takes over once the owner has ended', !!reclaimed && /机密内容/.test(reclaimed.text), JSON.stringify(reclaimed && String(reclaimed.text).slice(0, 24)))
const nowForeign = await rpc('state', { revision: -1, sessionId: OWNER })
ok('and the old owner is now the foreign one', nowForeign && nowForeign.result && nowForeign.result.inactive === true && nowForeign.result.ownerSessionId === FOREIGN, JSON.stringify(nowForeign && nowForeign.result && { inactive: nowForeign.result.inactive, owner: nowForeign.result.ownerSessionId }))

console.log(failed === 0 ? '\nALL ACTIVATION CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
