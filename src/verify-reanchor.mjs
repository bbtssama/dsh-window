/**
 * Regression tests for selection re-anchoring when the note body changes.
 *
 * The reported bug: a black "select everything" object plus a few inserted lines in
 * the middle left the whole note covered in black, because re-anchoring looked up the
 * selection's text with indexOf — the FIRST occurrence anywhere in the document — so a
 * long selection snapped back to the top instead of following its own content.
 *
 * Run: node src/verify-reanchor.mjs
 */
import path from 'node:path'

const lib = path.join('D:\\DSH\\profiles\\web\\node_modules\\dsh-window\\lib')
// remapSelections is not exported; mount the host half and drive it through the RPC
// surface, which is the same path the card and the agent tools use.
const host = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href)

let failed = 0
const ok = (label, cond, detail) => {
  if (cond) console.log('  PASS  ' + label)
  else { failed++; console.log('  FAIL  ' + label + (detail === undefined ? '' : '  -> ' + detail)) }
}

const k = (p) => String(p).replace(/\\/g, '/')
const ROOT = 'C:/WS/rev'
const SID = 'sess-owner'
// The note lives in the per-session layout the plugin now uses.
const NOTE = ROOT + '/dsh-window/note/' + SID + '/note/note.md'
const STATE = ROOT + '/dsh-window/note/' + SID + '/note/.note-state.json'

const files = new Map()
const written = []
const tools = new Map()
let routeHandler = null
const fs = {
  async lstat(p) { return files.has(k(p)) ? { size: files.get(k(p)).length, type: 'file' } : undefined },
  async resolve(p) { return k(p) },
  async readText(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return files.get(k(p)) },
  async readBytes(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return Buffer.from(files.get(k(p))) },
  async writeText(p, c) { files.set(k(p), String(c)); written.push(k(p)) },
  async listDir(target) {
    const prefix = k(target).replace(/\/$/, '') + '/'
    const seen = new Map()
    for (const f of files.keys()) {
      if (!f.startsWith(prefix)) continue
      const rest = f.slice(prefix.length)
      const seg = rest.split('/')[0]
      if (seg && !seen.has(seg)) seen.set(seg, rest.indexOf('/') < 0 ? 'file' : 'directory')
    }
    if (seen.size === 0) { const e = new Error('ENOENT ' + target); e.code = 'FS_NOT_FOUND'; throw e }
    return [...seen.entries()].map(([name, type]) => ({ name, type }))
  },
}
const shell = { resolve: (r) => r, async run() { return { exitCode: 0, stdout: { text: 'true\n' }, stderr: { text: '' } } } }
const policy = { workspaceRoot: ROOT, resolve(a) { const s = a && a.session; return { workspaceRoot: s && s.header && s.header.cwd ? s.header.cwd : ROOT } } }
const sessions = { get: (id) => (id === SID ? { header: { id: SID, cwd: ROOT } } : null) }
const lateWiring = []

const ctx = {
  get(name) {
    if (name === 'fs') return fs
    if (name === 'shell') return shell
    if (name === 'sandboxPolicy') return policy
    if (name === 'sessions') return sessions
    if (name === 'agents') return { currentInitiator: () => null, list: () => [] }
    if (name === 'webServer') {
      return { register(spec) { if (String(spec.path).indexOf('/rpc') >= 0) routeHandler = spec.handler; return () => { } } }
    }
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

// A note where the SAME short phrase occurs twice, which is what defeats indexOf.
const LINES = []
for (let i = 1; i <= 40; i++) LINES.push('line ' + i + ' 普通内容')
LINES[2] = '重复标记：这是第一次出现'
LINES[29] = '重复标记：这是第二次出现'
const baseText = LINES.join('\n') + '\n'
files.set(NOTE, baseText)
files.set(STATE, JSON.stringify({
  v: 1, seq: 3,
  selections: [
    // 1. a long selection near the BOTTOM that contains the duplicated phrase
    { id: 'sel-bottom', seq: 1, startLine: 28, startCol: 0, endLine: 32, endCol: 5, text: LINES.slice(27, 31).join('\n') + '\nline ', createdAt: 'x', color: 'black' },
    // 2. a short selection at the very top, well before any edit
    { id: 'sel-top', seq: 2, startLine: 1, startCol: 0, endLine: 1, endCol: 8, text: 'line 1', createdAt: 'x', color: 'yellow' },
    // 3. a selection wholly inside the edited region
    { id: 'sel-mid', seq: 3, startLine: 20, startCol: 0, endLine: 21, endCol: 9, text: LINES[19] + '\n' + LINES[20], createdAt: 'x', color: 'green' },
  ],
}) + '\n')

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

// Take ownership the explicit way, then load the store.
await tools.get('note_read').execute({}, { agent: { session: { header: { id: SID, cwd: ROOT } } } })
const st0 = await rpc('state', { revision: -1, sessionId: SID })
ok('fixture loaded with 3 selections', st0.result.selections.length === 3, String(st0.result.selections.length))

console.log('re-anchor on an edit')

// The user's scenario: insert 3 lines into the MIDDLE of the note.
const grown = LINES.slice(0, 19).concat(['新增的 1', '新增的 2', '新增的 3']).concat(LINES.slice(19)).join('\n') + '\n'
const save = await rpc('saveText', { text: grown, baseRevision: st0.result.revision, sessionId: SID })
ok('saveText accepted', save.result && save.result.ok === true, JSON.stringify(save.result && save.result.error))

const st1 = await rpc('state', { revision: -1, sessionId: SID })
const byId = {}
for (const s of st1.result.selections) byId[s.id] = s

// Expected: everything at/after the insertion point moves down by 3 lines.
const bottom = byId['sel-bottom']
const top = byId['sel-top']
const mid = byId['sel-mid']

ok('untouched top selection does not move',
  top && top.startLine === 1 && top.endLine === 1, JSON.stringify(top && [top.startLine, top.endLine]))
ok('selection below the insertion shifts down by 3',
  bottom && bottom.startLine === 31 && bottom.endLine === 35, JSON.stringify(bottom && [bottom.startLine, bottom.endLine]))
ok('selection crossing the insertion still anchors to its own text',
  bottom && /line 29 普通内容/.test(bottom.text) && !bottom.stale, JSON.stringify(bottom && { stale: bottom.stale, head: String(bottom.text).slice(0, 20) }))
ok('a long selection does not snap back to the top of the note',
  bottom && bottom.startLine > 20, 'startLine=' + (bottom && bottom.startLine))
ok('the edited region keeps a sensible anchor',
  mid && mid.startLine >= 20 && mid.startLine <= 25, JSON.stringify(mid && [mid.startLine, mid.endLine, mid.stale]))
ok('no selection silently becomes stale when its text still exists',
  st1.result.selections.filter((s) => s.stale).length === 0,
  JSON.stringify(st1.result.selections.filter((s) => s.stale).map((s) => s.id)))

// The black "cover everything" case: one selection spanning the whole document must
// still span the whole (now longer) document, not collapse to the top.
console.log('whole-document cover')
files.set(NOTE, baseText)
files.set(STATE, JSON.stringify({
  v: 1, seq: 1,
  selections: [{ id: 'sel-all', seq: 1, startLine: 1, startCol: 0, endLine: 40, endCol: LINES[39].length, text: baseText, createdAt: 'x', color: 'black' }],
}) + '\n')
// Remount to pick up the new fixture.
const host2 = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href + '?v=2')
routeHandler = null
tools.clear()
host2.apply(ctx, {})
for (const fn of lateWiring.slice(1)) fn()
await tools.get('note_read').execute({}, { agent: { session: { header: { id: SID, cwd: ROOT } } } })
const st2 = await rpc('state', { revision: -1, sessionId: SID })
const grown2 = ['插入 A', '插入 B'].concat(LINES).join('\n') + '\n'
const save2 = await rpc('saveText', { text: grown2, baseRevision: st2.result.revision, sessionId: SID })
ok('whole-document save accepted', save2.result && save2.result.ok === true, JSON.stringify(save2.result && save2.result.error))
const st3 = await rpc('state', { revision: -1, sessionId: SID })
const all = st3.result.selections[0]
ok('a whole-document cover follows the document, not the old end line',
  all && all.startLine <= 3 && all.endLine >= 42, JSON.stringify(all && [all.startLine, all.startCol, all.endLine, all.endCol]))
ok('a whole-document cover is not marked stale',
  all && all.stale === false, JSON.stringify(all && all.stale))

// The reported case was "I appended/inserted text and the black cover broke". The
// shift path above is correct; the suspect is the boundary arithmetic in
// remapSelections, whose "middle" runs to `lines(prev).length - s`. An insertion at
// the very end leaves trailing common lines, so the tail can fall inside the middle
// and be re-anchored by indexOf instead of shifted.
console.log('append at the end (reported case)')
files.set(NOTE, baseText)
files.set(STATE, JSON.stringify({
  v: 1, seq: 2,
  selections: [
    { id: 'sel-all', seq: 1, startLine: 1, startCol: 0, endLine: 40, endCol: LINES[39].length, text: baseText, createdAt: 'x', color: 'black' },
    { id: 'sel-tail', seq: 2, startLine: 38, startCol: 0, endLine: 40, endCol: LINES[39].length, text: LINES.slice(37).join('\n') + '\n', createdAt: 'x', color: 'pink' },
  ],
}) + '\n')
const host3 = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href + '?v=3')
routeHandler = null
tools.clear()
host3.apply(ctx, {})
for (const fn of lateWiring.slice(2)) fn()
await tools.get('note_read').execute({}, { agent: { session: { header: { id: SID, cwd: ROOT } } } })
const st4 = await rpc('state', { revision: -1, sessionId: SID })
const appended = baseText + '新追加的一行\n'
const save4 = await rpc('saveText', { text: appended, baseRevision: st4.result.revision, sessionId: SID })
ok('append save accepted', save4.result && save4.result.ok === true, JSON.stringify(save4.result && save4.result.error))
const st5 = await rpc('state', { revision: -1, sessionId: SID })
const onDisk = files.get(NOTE)
ok('the appended line reached the store', /\u65b0\u8ffd\u52a0\u7684\u4e00\u884c/.test(String(onDisk)) && String(onDisk).split('\n').length === 42,
  'disk lines=' + String(onDisk).split('\n').length)
const gone = {}
for (const s of st5.result.selections) gone[s.id] = s
ok('a tail selection at the end shifts down by the added line',
  gone['sel-tail'] && gone['sel-tail'].startLine === 38 && gone['sel-tail'].endLine === 40,
  JSON.stringify(gone['sel-tail'] && [gone['sel-tail'].startLine, gone['sel-tail'].endLine]))
ok('a tail selection is not left covering the appended line',
  gone['sel-tail'] && gone['sel-tail'].endLine === 40 && !gone['sel-tail'].stale,
  JSON.stringify(gone['sel-tail'] && { end: gone['sel-tail'].endLine, stale: gone['sel-tail'].stale }))
ok('the whole-document cover grows to include the appended line',
  gone['sel-all'] && gone['sel-all'].endLine >= 41, JSON.stringify(gone['sel-all'] && [gone['sel-all'].startLine, gone['sel-all'].endLine, gone['sel-all'].stale]))

console.log(failed === 0 ? '\nALL RE-ANCHOR CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
