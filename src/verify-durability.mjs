/**
 * Durability tests: the two guarantees ported from AgentTeams.
 *
 *  1. Serialization — concurrent mutations must not lose an update. AgentTeams uses
 *     withTeamLock; here two `saveText` calls and a selection mutation are fired
 *     concurrently against one store and every one of them must survive.
 *  2. Version guard — an edit made outside the plugin (another process, an external
 *     editor) must be reported as a conflict instead of being silently overwritten.
 *     The `fs` service already publishes writes atomically; what we added is the
 *     compare-and-swap that detects the external change.
 *
 * Run: node src/verify-durability.mjs
 */
import path from 'node:path'

const lib = path.join('D:\\DSH\\profiles\\web\\node_modules\\dsh-window\\lib')
const host = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href)

let failed = 0
const ok = (label, cond, detail) => {
  if (cond) console.log('  PASS  ' + label)
  else { failed++; console.log('  FAIL  ' + label + (detail === undefined ? '' : '  -> ' + detail)) }
}

const k = (p) => String(p).replace(/\\/g, '/')
const ROOT = 'C:/WS/dur'
const NOTE = ROOT + '/dsh-note/note.md'
const STATE = ROOT + '/dsh-note/.note-state.json'
const SID = 'sess-dur'

// The fake fs mirrors the real contract that matters here: lstat returns a version,
// writeText honours expected.replaceIfVersion, and both are serialized per target.
const files = new Map()
let writeCount = 0
let versionSeq = 100
const versions = new Map()
const targetLocks = new Map()
function withTargetLock(key, fn) {
  const prev = targetLocks.get(key) || Promise.resolve()
  const run = prev.then(fn, fn)
  targetLocks.set(key, run.then(() => undefined, () => undefined))
  return run
}
function bumpVersion(p) { versionSeq += 1; versions.set(p, 'v' + versionSeq); return versions.get(p) }

const fs = {
  async lstat(p) {
    const key = k(p)
    return files.has(key) ? { version: versions.get(key), type: 'file', size: files.get(key).length } : undefined
  },
  async resolve(p) { return k(p) },
  async readText(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return files.get(k(p)) },
  async readBytes(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return Buffer.from(files.get(k(p))) },
  async writeText(target, content, expected) {
    const key = k(target)
    return withTargetLock(key, async () => {
      const exists = files.has(key)
      if (process.env.DBG) console.log('    [dbg] write ' + key.slice(-12) + ' expected=' + JSON.stringify(expected) + ' actual=' + versions.get(key))
      if (expected && expected.kind === 'replaceIfVersion') {
        if (!exists) { const e = new Error('cannot write: file no longer exists'); e.code = 'FS_STALE_VERSION'; throw e }
        if (versions.get(key) !== expected.version) { const e = new Error('cannot write: file changed since it was read'); e.code = 'FS_STALE_VERSION'; throw e }
      }
      // A real fsync-equivalent pause: this is where an unserialized interleaving lands.
      await new Promise((r) => setTimeout(r, 5))
      files.set(key, String(content))
      writeCount++
      return { operation: exists ? 'update' : 'create', version: bumpVersion(key), before: null, after: String(content) }
    })
  },
}
const shell = { resolve: (r) => r, async run() { return { exitCode: 0, stdout: { text: 'true\n' }, stderr: { text: '' } } } }
const policy = { workspaceRoot: ROOT, resolve(a) { const s = a && a.session; return { workspaceRoot: s && s.header && s.header.cwd ? s.header.cwd : ROOT } } }
const tools = new Map()
const sessions = { get: (id) => (id === SID ? { header: { id: SID, cwd: ROOT } } : null) }
let routeHandler = null
const lateWiring = []
const ctx = {
  get(name) {
    if (name === 'fs') return fs
    if (name === 'shell') return shell
    if (name === 'sandboxPolicy') return policy
    if (name === 'sessions') return sessions
    if (name === 'agents') return { currentInitiator: () => null, list: () => [] }
    if (name === 'webServer') return { register(spec) { if (String(spec.path).indexOf('/rpc') >= 0) routeHandler = spec.handler; return () => { } } }
    if (name === 'systemPrompt') return { section() { return () => { } }, add() { return () => { } } }
    return undefined
  },
  effect(fn) { if (typeof fn === 'function') fn() },
  on(ev, fn) { if (ev === 'internal/service') lateWiring.push(fn); return () => { } },
  timeout: (fn, ms) => setTimeout(fn, ms),
  interval: (fn, ms) => setInterval(fn, ms),
  logger: { info() { }, warn() { }, error() { } },
}
ctx.tools = { register(t) { tools.set(t.name, t) } }

files.set(NOTE, 'original line\n')
bumpVersion(NOTE)

host.apply(ctx, {})
for (const fn of lateWiring) fn()

const rpc = async (method, args) => {
  const raw = JSON.stringify({ method, args })
  const listeners = {}
  const req = { method: 'POST', on(ev, fn) { listeners[ev] = fn; return this }, destroy() { } }
  let out = null
  const res = { writeHead() { return this }, end(b) { out = b; return this } }
  const p = routeHandler(req, res)
  listeners.data(Buffer.from(raw))
  listeners.end()
  await p
  return JSON.parse(out)
}

// Claim the store the explicit way.
await tools.get('note_read').execute({}, { agent: { session: { header: { id: SID, cwd: ROOT } } } })

console.log('serialization')
// Two saves and a selection mutation, all in flight at once. Without the lock the
// saves race on the same read-modify-write and one selection edit is lost.
const base = (await rpc('state', { revision: -1, sessionId: SID })).result.revision
const [s1, s2, s3] = await Promise.all([
  rpc('saveText', { text: 'first\n', baseRevision: base, sessionId: SID }),
  rpc('addSelection', { sessionId: SID, startLine: 1, startCol: 0, endLine: 1, endCol: 5, color: 'yellow' }),
  rpc('saveText', { text: 'second\n', baseRevision: base, sessionId: SID }),
])
ok('at least one concurrent save succeeded', !!(s1.result && s1.result.ok) || !!(s3.result && s3.result.ok), JSON.stringify([s1.result && { ok: s1.result.ok, conflict: s1.result.conflict }, s3.result && { ok: s3.result.ok, conflict: s3.result.conflict }]))
ok('the concurrent selection was not lost', !!(s2.result && s2.result.ok) && (s2.result.selections || []).length === 1, JSON.stringify(s2.result && { ok: s2.result.ok, n: (s2.result.selections || []).length, error: s2.result.error }))
const after = await rpc('state', { revision: -1, sessionId: SID })
ok('the selection survives in the store', (after.result.selections || []).length === 1, JSON.stringify((after.result.selections || []).length))
ok('the note on disk is one of the two saves, not a torn mix', ['first\n', 'second\n'].indexOf(files.get(NOTE)) >= 0, JSON.stringify(files.get(NOTE)))
ok('the in-memory text matches the disk', after.result.text === files.get(NOTE), JSON.stringify({ mem: after.result.text, disk: files.get(NOTE) }))

// Every frame of the state file must be parseable — a torn write would not be.
let stateParses = true
try { JSON.parse(files.get(STATE)) } catch (e) { stateParses = false }
ok('the selection file is always valid JSON', stateParses, String(files.get(STATE)).slice(0, 60))

console.log('version guard')
// Someone else edits note.md behind our back.
files.set(NOTE, 'edited outside the plugin\n')
bumpVersion(NOTE)
const stale = await rpc('saveText', { text: 'from the card\n', baseRevision: after.result.revision, sessionId: SID })
ok('an external edit is reported as a conflict', !!(stale.result && stale.result.conflict === true), JSON.stringify(stale.result && { ok: stale.result.ok, conflict: stale.result.conflict, error: stale.result.error }))
ok('the external edit was NOT overwritten', files.get(NOTE) === 'edited outside the plugin\n', JSON.stringify(files.get(NOTE)))
ok('the conflict is flagged as a disk-version conflict', stale.result && stale.result.stale === true, JSON.stringify(stale.result && stale.result.stale))

// After a reload the card sees the external text and may write again.
const reloaded = await rpc('reload', {}, )
const seen = await rpc('state', { revision: -1, sessionId: SID })
ok('reload picks up the external text', seen.result.text === 'edited outside the plugin\n', JSON.stringify(seen.result.text))
const retry = await rpc('saveText', { text: 'after reload\n', baseRevision: seen.result.revision, sessionId: SID })
ok('a save after reload succeeds', !!(retry.result && retry.result.ok === true), JSON.stringify(retry.result && retry.result.error))
ok('and reaches the disk', files.get(NOTE) === 'after reload\n', JSON.stringify(files.get(NOTE)))

console.log(failed === 0 ? '\nALL DURABILITY CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
