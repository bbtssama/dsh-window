/**
 * Tests for the per-session, multi-note storage model.
 *
 *   <workspace>/dsh-window/note/<sessionId>/<noteName>/{note.md,.note-state.json,.git}
 *
 * The properties under test:
 *   - isolation is the PATH: two sessions in one workspace cannot see each other,
 *     with no permission logic involved;
 *   - a session may hold several notes: create / select / import / clear / rename / delete;
 *   - clear keeps the note's git history, delete removes it with the directory;
 *   - the legacy single-note layout (dsh-note/note.md + state + git) migrates once,
 *     non-destructively.
 *
 * The fake fs deliberately omits mkdir/rm/rename (the real service has none either), so
 * the plugin's fallbacks — writing a file to create a directory, shell Remove-Item and
 * Move-Item for delete/rename — are the paths actually exercised here.
 *
 * Run: node src/verify-notes.mjs
 */
import path from 'node:path'

const lib = path.join('D:\\DSH\\profiles\\web\\node_modules\\dsh-window\\lib')
const host = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href)

let failed = 0
const ok = (label, cond, detail) => {
  if (cond) console.log('  PASS  ' + label)
  else { failed++; console.log('  FAIL  ' + label + (detail === undefined ? '' : '  -> ' + detail)) }
}

const k = (p) => String(p).replace(/\\/g, '/').replace(/\/+/g, '/')
const WS = 'C:/WS/proj'
const SID_A = 'session-aaaa-1111'
const SID_B = 'session-bbbb-2222'
const NEST = '/dsh-window/note/'

// ── fake filesystem ────────────────────────────────────────────────────────────
const files = new Map()
const dirs = new Set()
function putDir(p) {
  let cur = ''
  for (const seg of k(p).split('/')) {
    cur = cur ? cur + '/' + seg : seg
    if (cur) dirs.add(cur)
  }
}
function writeFile(p, content) {
  const key = k(p)
  files.set(key, String(content))
  putDir(key.slice(0, key.lastIndexOf('/')))
}
function isDir(p) { return dirs.has(k(p)) }
function childrenOf(p) {
  const prefix = k(p).replace(/\/$/, '') + '/'
  const out = new Map()
  for (const f of files.keys()) {
    if (!f.startsWith(prefix)) continue
    const rest = f.slice(prefix.length)
    const seg = rest.split('/')[0]
    out.set(seg, rest.indexOf('/') < 0 ? 'file' : 'directory')
  }
  for (const d of dirs) {
    if (!d.startsWith(prefix)) continue
    const rest = d.slice(prefix.length)
    if (!rest) continue
    const seg = rest.split('/')[0]
    if (!out.has(seg)) out.set(seg, 'directory')
  }
  return out
}
function removeSubtree(p) {
  const key = k(p)
  for (const f of [...files.keys()]) if (f === key || f.startsWith(key + '/')) files.delete(f)
  for (const d of [...dirs]) if (d === key || d.startsWith(key + '/')) dirs.delete(d)
}
function moveSubtree(from, to) {
  const f0 = k(from)
  const t0 = k(to)
  for (const f of [...files.keys()]) if (f === f0 || f.startsWith(f0 + '/')) { const v = files.get(f); files.delete(f); writeFile(t0 + f.slice(f0.length), v) }
  for (const d of [...dirs]) if (d === f0 || d.startsWith(f0 + '/')) { dirs.delete(d); putDir(t0 + d.slice(f0.length)) }
  putDir(t0)
}

let versionSeq = 100
const versions = new Map()
function bumpVersion(key) { versionSeq += 1; versions.set(key, 'v' + versionSeq); return versions.get(key) }
const fs = {
  async lstat(p) { const key = k(p); return (files.has(key) || isDir(key)) ? { version: versions.get(key), type: files.has(key) ? 'file' : 'directory', size: (files.get(key) || '').length } : undefined },
  async resolve(p) { return k(p) },
  async readText(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return files.get(k(p)) },
  async readBytes(p) { if (!files.has(k(p))) throw new Error('ENOENT ' + p); return Buffer.from(files.get(k(p))) },
  async writeText(target, content, expected) {
    const key = k(target)
    if (expected && expected.kind === 'replaceIfVersion') {
      if (!files.has(key)) { const e = new Error('cannot write: file no longer exists'); e.code = 'FS_STALE_VERSION'; throw e }
      if (versions.get(key) !== expected.version) { const e = new Error('cannot write: file changed since it was read'); e.code = 'FS_STALE_VERSION'; throw e }
    }
    writeFile(key, content)
    return { operation: 'update', version: bumpVersion(key), before: null, after: String(content) }
  },
  async listDir(target) {
    const key = k(target)
    if (!isDir(key)) { const e = new Error('ENOENT ' + target); e.code = 'FS_NOT_FOUND'; throw e }
    return [...childrenOf(key).entries()].map(([name, type]) => ({ name, type }))
  },
}

// ── fake shell: git is a no-op, but directory operations really happen ──────────
const gitCalls = []
const shell = {
  resolve: (r) => r,
  async run(req) {
    const cmd = String(req.command || '')
    const cwd = String(req.workdir || '')
    if (cmd.startsWith('git ')) {
      gitCalls.push({ dir: k(cwd), args: cmd.slice(4) })
      if (cmd.indexOf('rev-parse --short HEAD') >= 0) return { exitCode: 0, stdout: { text: 'abc1234\n' }, stderr: { text: '' } }
      if (cmd.indexOf('rev-parse --is-inside-work-tree') >= 0) { const inside = isDir(k(cwd) + '/.git'); return { exitCode: inside ? 0 : 128, stdout: { text: inside ? 'true' : '' }, stderr: { text: inside ? '' : 'fatal: not a git repository' } } }
      if (cmd === 'git init -q') { putDir(k(cwd) + '/.git'); return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } } }
      return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } }
    }
    const rm = /Remove-Item -LiteralPath "([^"]+)"/.exec(cmd)
    if (rm) { removeSubtree(rm[1]); return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } } }
    const cp = /Copy-Item -LiteralPath "([^"]+)" -Destination "([^"]+)" -Recurse/.exec(cmd)
    if (cp) {
      const srcKey = k(cp[1])
      const dstKey = k(cp[2])
      for (const f of [...files.keys()]) if (f === srcKey || f.startsWith(srcKey + '/')) writeFile(dstKey + f.slice(srcKey.length), files.get(f))
      for (const d of [...dirs]) if (d === srcKey || d.startsWith(srcKey + '/')) putDir(dstKey + d.slice(srcKey.length))
      putDir(dstKey)
      return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } }
    }
    const mv = /Move-Item -LiteralPath "([^"]+)" -Destination "([^"]+)"/.exec(cmd)
    if (mv) { moveSubtree(mv[1], mv[2]); return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } } }
    return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } }
  },
}

const sessions = { _m: new Map(), get(id) { return this._m.get(id) || null } }
function sessionWith(id, cwd) { return { header: { id, cwd } } }
sessions._m.set(SID_A, sessionWith(SID_A, WS))
sessions._m.set(SID_B, sessionWith(SID_B, WS))
const policy = { workspaceRoot: WS, resolve(a) { const s = a && a.session; return { workspaceRoot: s && s.header && s.header.cwd ? s.header.cwd : WS } } }
const tools = new Map()
let routeHandler = null
const promptVariables = new Map()
const ctx = {
  get(name) {
    if (name === 'fs') return fs
    if (name === 'shell') return shell
    if (name === 'sandboxPolicy') return policy
    if (name === 'sessions') return sessions
    if (name === 'agents') return { currentInitiator: () => null, list: () => [] }
    if (name === 'tools') return { register(t) { tools.set(t.name, t) } }
    if (name === 'webServer') return { register(spec) { if (String(spec.path).indexOf('/rpc') >= 0) routeHandler = spec.handler; return () => { } } }
    if (name === 'systemPrompt') return { section() { return () => { } }, variable(n, p) { promptVariables.set(n, p); return () => { } }, add() { return () => { } } }
    return undefined
  },
  effect(fn) { if (typeof fn === 'function') fn() },
  on() { return () => { } },
  timeout: (fn, ms) => setTimeout(fn, ms),
  interval: (fn, ms) => setInterval(fn, ms),
  logger: { info() { }, warn() { }, error() { } },
}
ctx.tools = ctx.get('tools')

host.apply(ctx, {})

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
const asTool = (name, args, sid) => tools.get(name).execute(args || {}, { agent: { session: sessionWith(sid, WS) } })
const noteDirOf = (sid, name) => WS + NEST + sid + '/' + name

console.log('a fresh session')
const st0 = await rpc('state', { revision: -1, sessionId: SID_A })
ok('a session with no notes gets an empty note space, not an error',
  st0.result && st0.result.notes && st0.result.notes.length === 0 && st0.result.text === '' && st0.result.active === '',
  JSON.stringify(st0.result && { notes: st0.result.notes, active: st0.result.active, text: st0.result.text }))
ok('and it is told its own note space path',
  st0.result && st0.result.notesDir === WS + NEST + SID_A, JSON.stringify(st0.result && st0.result.notesDir))
let noNote = ''
try { await asTool('note_read', {}, SID_A) } catch (e) { noNote = String(e.message || e) }
ok('a read without any note fails loudly and says how to fix it',
  /还没有任何笔记/.test(noNote) && /note_create/.test(noNote), noNote.slice(0, 90))

console.log('creating notes in a session')
const c1 = await asTool('note_create', { name: '会议纪要' }, SID_A)
ok('note_create makes a note directory under the session subtree',
  c1 && c1.ok === true && files.has(k(noteDirOf(SID_A, '会议纪要') + '/note.md')), JSON.stringify(c1 && { ok: c1.ok, dir: c1.dir }))
ok('a new note is opened automatically', c1 && c1.active === '会议纪要', JSON.stringify(c1 && c1.active))
ok('and a git repository is initialised for it',
  isDir(noteDirOf(SID_A, '会议纪要') + '/.git') && gitCalls.some((c) => c.args === 'init -q' && c.dir === noteDirOf(SID_A, '会议纪要')),
  'git init in ' + noteDirOf(SID_A, '会议纪要'))
const c2 = await asTool('note_create', { name: '读书笔记', text: '第一章\n要点甲\n' }, SID_A)
ok('a second note can be created from text', c2 && c2.ok === true && /要点甲/.test(files.get(k(noteDirOf(SID_A, '读书笔记') + '/note.md'))), JSON.stringify(c2 && c2.ok))
const listed = await asTool('note_list', {}, SID_A)
ok('note_list shows both notes and marks the open one',
  listed.notes.length === 2 && listed.active === '读书笔记' && listed.notes.filter((n) => n.active).length === 1,
  JSON.stringify(listed && { n: listed.notes.length, active: listed.active }))

console.log('isolation between sessions')
const stB = await rpc('state', { revision: -1, sessionId: SID_B })
ok('another session in the same workspace sees no notes',
  stB.result && stB.result.notes.length === 0 && stB.result.text === '', JSON.stringify(stB.result && { notes: stB.result.notes, text: stB.result.text }))
ok("and its note space is a different path", stB.result && stB.result.notesDir === WS + NEST + SID_B, JSON.stringify(stB.result && stB.result.notesDir))
const listB = await asTool('note_list', {}, SID_B)
ok('a tool call in the other session also sees none', listB.notes.length === 0, JSON.stringify(listB.notes))
ok('the first session still sees its own two notes',
  (await asTool('note_list', {}, SID_A)).notes.length === 2, 'session A intact')

console.log('switching, importing, clearing')
const sel = await asTool('note_open', { name: '会议纪要' }, SID_A)
ok('note_open switches the active note', sel.ok === true && sel.active === '会议纪要', JSON.stringify(sel && { ok: sel.ok, active: sel.active }))
const imp = await asTool('note_import', { text: '导入的一段\n', mode: 'append' }, SID_A)
ok('note_import appends into the active note', imp.ok === true && /导入的一段/.test(files.get(k(noteDirOf(SID_A, '会议纪要') + '/note.md'))), JSON.stringify(imp && imp.ok))
const before = files.get(k(noteDirOf(SID_A, '会议纪要') + '/note.md'))
const cleared = await asTool('note_clear', {}, SID_A)
ok('note_clear replaces the body', cleared.ok === true && files.get(k(noteDirOf(SID_A, '会议纪要') + '/note.md')) === '# 会议纪要\n', JSON.stringify(files.get(k(noteDirOf(SID_A, '会议纪要') + '/note.md'))))
ok('note_clear reports how much it removed', cleared.clearedLines >= 2, JSON.stringify(cleared.clearedLines))
ok('note_clear keeps the note directory and its git',
  isDir(noteDirOf(SID_A, '会议纪要') + '/.git') && !!before.endsWith('\n'), 'directory + .git still present')

console.log('renaming and deleting')
const ren = await asTool('note_rename', { from: '读书笔记', to: '读书笔记2' }, SID_A)
ok('note_rename moves the directory', ren.ok === true && files.has(k(noteDirOf(SID_A, '读书笔记2') + '/note.md')) && !files.has(k(noteDirOf(SID_A, '读书笔记') + '/note.md')), JSON.stringify(ren && ren.ok))
const del0 = await asTool('note_delete', { name: '读书笔记2' }, SID_A)
ok('note_delete without confirm is refused', del0.ok === false && del0.needsConfirm === true, JSON.stringify(del0))
ok('and nothing was removed', files.has(k(noteDirOf(SID_A, '读书笔记2') + '/note.md')), 'still there')
const del = await asTool('note_delete', { name: '读书笔记2', confirm: true }, SID_A)
ok('note_delete with confirm removes the whole tree including .git',
  del.ok === true && !files.has(k(noteDirOf(SID_A, '读书笔记2') + '/note.md')) && !isDir(noteDirOf(SID_A, '读书笔记2') + '/.git'),
  JSON.stringify(del && { ok: del.ok, deleted: del.deleted, remaining: del.remaining }))
const last = await asTool('note_list', {}, SID_A)
ok('the session keeps working with what is left', last.notes.length === 1 && last.notes[0].name === '会议纪要', JSON.stringify(last.notes))

console.log('legacy migration')
const WS2 = 'C:/WS/legacy'
const SID_L = 'session-legacy-3333'
sessions._m.set(SID_L, sessionWith(SID_L, WS2))
writeFile(WS2 + '/dsh-note/note.md', '# 旧笔记\n\n这是升级前的内容\n')
writeFile(WS2 + '/dsh-note/.note-state.json', JSON.stringify({ v: 1, seq: 1, selections: [{ id: 'sel-1', seq: 1, startLine: 3, startCol: 0, endLine: 3, endCol: 6, text: '旧内容', createdAt: 'x', color: 'yellow' }] }) + '\n')
writeFile(WS2 + '/dsh-note/.git/HEAD', 'ref: refs/heads/main\n')
const migrated = await asTool('note_read', {}, SID_L)
ok('the legacy note migrates on first use in a session', /这是升级前的内容/.test(migrated.text), JSON.stringify(migrated.text && migrated.text.slice(0, 24)))
ok('the migrated note lands in the new layout',
  files.has(k(WS2 + NEST + SID_L + '/note/note.md')), WS2 + NEST + SID_L + '/note/note.md')
ok('the legacy git repository came along',
  files.has(k(WS2 + NEST + SID_L + '/note/.git/HEAD')), 'history preserved')
ok('the legacy selections came along',
  (await rpc('state', { revision: -1, sessionId: SID_L })).result.selections.length === 1, 'one selection')
ok('the legacy directory is left intact', files.has(k(WS2 + '/dsh-note/note.md')), 'original untouched')

console.log('name safety')
const bad = await asTool('note_create', { name: '../../evil' }, SID_A)
// The name is folded into ONE safe path segment (separators and dots are neutralised),
// so what matters is that the created directory is a single segment inside this session.
ok('a traversal name cannot escape the session subtree',
  bad.ok === false || (typeof bad.name === 'string' && bad.name.indexOf('/') < 0 && bad.name.indexOf('..') < 0 && files.has(k(noteDirOf(SID_A, bad.name) + '/note.md'))),
  JSON.stringify(bad && { ok: bad.ok, name: bad.name, err: bad.error }))
ok('nothing was written outside the session subtree',
  ![...files.keys()].some((f) => f.indexOf('/WS/evil') >= 0), 'no escaped path')

console.log(failed === 0 ? '\nALL NOTE-MODEL CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
