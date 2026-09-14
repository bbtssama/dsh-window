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
/** Tool names that reached the schema-checking wrapper at least once. */
const exercised = new Set()
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

// ── output-schema conformance, exactly as the harness enforces it ────────────────
// defineTool COMPILES the authored schema: a per-property `required: true` is moved into a
// top-level `required: [...]` array (dsh-tools: "task.required.push(task.key"), and the
// runtime enforces that array ("missing required property ..."). Reading only the
// per-property flag made this checker blind to missing properties — it saw every property
// as optional, so note_create/note_clear shipped returning no `error` on success and the
// live harness rejected them. Honour BOTH forms.
function checkSchema(schema, value, path, errs) {
  if (!schema) return
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) { errs.push(path + ' is not an object'); return }
    const props = schema.properties || {}
    const reqArr = Array.isArray(schema.required) ? schema.required : []
    for (const k of Object.keys(props)) {
      const required = props[k].required === true || reqArr.indexOf(k) >= 0
      if (required && !(k in value)) errs.push(path + '.' + k + ' is missing')
    }
    if (schema.additionalProperties === false) for (const k of Object.keys(value)) if (!(k in props)) errs.push(path + '.' + k + ' is not a declared property')
    for (const k of Object.keys(value)) if (props[k]) checkSchema(props[k], value[k], path + '.' + k, errs)
    return
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) { errs.push(path + ' is not an array'); return }
    for (let i = 0; i < value.length; i++) checkSchema(schema.items, value[i], path + '[' + i + ']', errs)
    return
  }
  if (schema.type === 'string' && typeof value !== 'string') errs.push(path + ' is not a string')
  if (schema.type === 'integer' && !Number.isInteger(value)) errs.push(path + ' is not an integer')
  if (schema.type === 'boolean' && typeof value !== 'boolean') errs.push(path + ' is not a boolean')
}
/** Reject a tool result the harness would reject. */
function wrapSchemaChecked(t) {
  const inner = t.execute
  t.execute = async function (args, exec) {
    const value = await inner.call(t, args, exec)
    exercised.add(t.name)
    const errs = []
    checkSchema(t.output && t.output.schema, value, t.name, errs)
    if (errs.length) {
      failed++
      console.log('  FAIL  ' + t.name + ' output violates its schema  -> ' + errs.slice(0, 3).join('; '))
    }
    return value
  }
  return t
}
function sessionWith(id, cwd) { return { header: { id, cwd } } }
sessions._m.set(SID_A, sessionWith(SID_A, WS))
sessions._m.set(SID_B, sessionWith(SID_B, WS))
const policy = { workspaceRoot: WS, resolve(a) { const s = a && a.session; return { workspaceRoot: s && s.header && s.header.cwd ? s.header.cwd : WS } } }
const tools = new Map()
let routeHandler = null
let commandSpec = null
const commandCtx = { commands: { register(spec) { commandSpec = spec; return () => { } }, unregister() { commandSpec = null; return () => { } } } }
const promptVariables = new Map()
const ctx = {
  get(name) {
    if (name === 'fs') return fs
    if (name === 'shell') return shell
    if (name === 'sandboxPolicy') return policy
    if (name === 'sessions') return sessions
    if (name === 'agents') return { currentInitiator: () => null, list: () => [] }
    if (name === 'tools') return { register(t) { tools.set(t.name, wrapSchemaChecked(t)) } }
    if (name === 'webServer') return { register(spec) { if (String(spec.path).indexOf('/rpc') >= 0) routeHandler = spec.handler; return () => { } } }
    if (name === 'systemPrompt') return { section() { return () => { } }, variable(n, p) { promptVariables.set(n, p); return () => { } }, add() { return () => { } } }
    return undefined
  },
  effect(fn) { if (typeof fn === 'function') fn() },
  // Cordis-style optional injection: the plugin calls ctx.inject(['commands'], cb).
  inject(deps, cb) { if (deps.indexOf('commands') >= 0 && commandCtx) cb(commandCtx) },
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

console.log('selections are per note')
// The selection set belongs to ONE note: switching notes must show that note's own
// highlights (and the tools must never mix them up).
await tools.get('note_open').execute({ name: '会议纪要' }, { agent: { session: sessionWith(SID_A, WS) } })
await tools.get('note_write').execute({ content: '第一行内容\n第二行内容\n', mode: 'replace', commit: false }, { agent: { session: sessionWith(SID_A, WS) } })
const selA = await tools.get('note_add_selection').execute({ startLine: 1, startCol: 0, endLine: 1, endCol: 3, color: 'yellow' }, { agent: { session: sessionWith(SID_A, WS) } })
ok('a selection can be added to the open note', selA && selA.ok === true, JSON.stringify(selA && selA.ok))
const gotA = await tools.get('note_get_selections').execute({}, { agent: { session: sessionWith(SID_A, WS) } })
ok('note_get_selections returns it', gotA.length === 1 && gotA[0].startLine === 1, JSON.stringify(gotA.map((x) => x.startLine + ':' + x.startCol)))
const created = await tools.get('note_create').execute({ name: '另一份', text: '# 另一份\n别的正文\n' }, { agent: { session: sessionWith(SID_A, WS) } })
ok('a second note can be opened', created.ok === true, JSON.stringify(created && created.ok))
const gotB = await tools.get('note_get_selections').execute({}, { agent: { session: sessionWith(SID_A, WS) } })
ok('the other note has NO selections of its own', gotB.length === 0, JSON.stringify(gotB.length))
const found = await tools.get('note_find').execute({ query: '别的正文' }, { agent: { session: sessionWith(SID_A, WS) } })
ok('note_find searched the newly opened note', found && found.hits && found.hits.length === 1, JSON.stringify(found && found.hits))
await tools.get('note_open').execute({ name: '会议纪要' }, { agent: { session: sessionWith(SID_A, WS) } })
const backA = await tools.get('note_get_selections').execute({}, { agent: { session: sessionWith(SID_A, WS) } })
ok('switching back restores the earlier note selections', backA.length === 1 && backA[0].startLine === 1, JSON.stringify(backA.length))
ok('the notes list reports rows, not bare names',
  (await tools.get('note_list').execute({}, { agent: { session: sessionWith(SID_A, WS) } })).notes.every((n) => typeof n.name === 'string' && typeof n.lines === 'number'),
  'every row has name/lines')

console.log('name safety')
const bad = await asTool('note_create', { name: '../../evil' }, SID_A)
// The name is folded into ONE safe path segment (separators and dots are neutralised),
// so what matters is that the created directory is a single segment inside this session.
ok('a traversal name cannot escape the session subtree',
  bad.ok === false || (typeof bad.name === 'string' && bad.name.indexOf('/') < 0 && bad.name.indexOf('..') < 0 && files.has(k(noteDirOf(SID_A, bad.name) + '/note.md'))),
  JSON.stringify(bad && { ok: bad.ok, name: bad.name, err: bad.error }))
ok('nothing was written outside the session subtree',
  ![...files.keys()].some((f) => f.indexOf('/WS/evil') >= 0), 'no escaped path')

console.log('/window-note command')
const SID_C = 'session-cmd-4444'
sessions._m.set(SID_C, sessionWith(SID_C, WS))
ok('the command is registered', !!commandSpec && commandSpec.name === 'window-note', JSON.stringify(commandSpec && commandSpec.name))
const runCmd = async (rawInput, sid) => await commandSpec.handler({ agent: { session: sessionWith(sid, WS) }, rawInput: rawInput })
const r1 = await runCmd('', SID_C)
ok('running it in an empty session creates the default note', r1 && r1.kind === 'success' && /已为你新建并打开/.test(r1.text), JSON.stringify(r1 && r1.text))
ok('and that session now has exactly one note', (await asTool('note_list', {}, SID_C)).notes.length === 1, 'one note')
const r2 = await runCmd('new 论文', SID_C)
ok('new <name> creates another note', r2 && r2.kind === 'success' && /论文/.test(r2.text), JSON.stringify(r2 && r2.text))
const r3 = await runCmd('list', SID_C)
ok('list reports both notes', r3 && r3.kind === 'success' && /论文/.test(r3.text) && /2 份/.test(r3.text), JSON.stringify(r3 && r3.text))
const r4 = await runCmd('open note', SID_C)
ok('open <name> switches the active note', r4 && r4.kind === 'success' && /note/.test(r4.text), JSON.stringify(r4 && r4.text))
const r5 = await runCmd('open 不存在', SID_C)
ok('opening a missing note is an error, not a crash', r5 && r5.kind === 'error', JSON.stringify(r5 && r5.kind))
ok('the command did not leak into another session',
  (await asTool('note_list', {}, SID_A)).notes.every((n) => n.name !== '论文'), 'session A untouched')

console.log('summoning the card in a session with no notes')
// The card's rule: it loads for a session that HAS a note, otherwise only when summoned
// explicitly. `start` is that explicit ask, and it has to survive a reload, so the flag is
// part of the session file rather than of the process.
const SID_G = 'session-summon-8888'
sessions._m.set(SID_G, sessionWith(SID_G, WS))
{
  const st0 = await rpc('state', { revision: -1, sessionId: SID_G })
  ok('an empty session is not summoned by default',
    st0.result && st0.result.summoned === false && (st0.result.notes || []).length === 0,
    JSON.stringify({ summoned: st0.result && st0.result.summoned, notes: st0.result && (st0.result.notes || []).length }))
  const s1 = await runCmd('start', SID_G)
  ok('start summons the card', s1 && s1.kind === 'success', JSON.stringify(s1 && s1.text))
  const st1 = await rpc('state', { revision: -1, sessionId: SID_G })
  ok('the state says it was summoned, with still no note created',
    st1.result && st1.result.summoned === true && (st1.result.notes || []).length === 0,
    JSON.stringify({ summoned: st1.result && st1.result.summoned, notes: st1.result && (st1.result.notes || []).length }))
  const sessFile = WS + NEST + SID_G + '/' + '.session.json'
  const raw = String(files.get(k(sessFile)) || '')
  ok('the summon is written to the session file, so a reload keeps it',
    /"summoned": true/.test(raw), raw.slice(0, 120))
  const s2 = await runCmd('stop', SID_G)
  const st2 = await rpc('state', { revision: -1, sessionId: SID_G })
  ok('stop dismisses it again',
    s2 && s2.kind === 'success' && st2.result && st2.result.summoned === false,
    JSON.stringify({ kind: s2 && s2.kind, summoned: st2.result && st2.result.summoned }))
  const s3 = await runCmd('nonsense', SID_G)
  ok('an unknown subcommand explains itself',
    s3 && s3.kind === 'error' && /start/.test(s3.text), JSON.stringify(s3 && s3.text))

  // The card polls `state` with the note revision. Neither start nor stop touches the note
  // text, so the host used to answer "unchanged" and the summon only took effect after a full
  // page reload (whose first request sends revision -1). These two assertions are exactly that
  // poll: one with a matching pair (skipped) and one after a summon (delivered).
  await runCmd('stop', SID_G)
  const base = (await rpc('state', { revision: -1, sessionId: SID_G })).result
  const idlePoll = await rpc('state', { revision: base.revision, uiRevision: base.uiRevision, note: base.active, sessionId: SID_G })
  ok('a poll with nothing changed is still skipped',
    idlePoll.result && idlePoll.result.unchanged === true,
    JSON.stringify(idlePoll.result && { unchanged: idlePoll.result.unchanged }))
  // The client echoes the note it is displaying. A revision is only a per-note in-memory
  // counter, so "same revision, different note" must NOT be mistaken for "nothing changed" —
  // that is the "笔记第一次加载很久都不会加载出来" report.
  const otherNote = await rpc('state', { revision: base.revision, uiRevision: base.uiRevision, note: 'another-note', sessionId: SID_G })
  ok('the same revision for a different note is answered in full',
    otherNote.result && otherNote.result.unchanged !== true,
    JSON.stringify(otherNote.result && { unchanged: otherNote.result.unchanged, active: otherNote.result.active }))
  await runCmd('start', SID_G)
  const pollAfterSummon = await rpc('state', { revision: base.revision, uiRevision: base.uiRevision, note: base.active, sessionId: SID_G })
  ok('summoning reaches the next poll, with no reload',
    pollAfterSummon.result && pollAfterSummon.result.unchanged !== true &&
    pollAfterSummon.result.summoned === true && pollAfterSummon.result.uiRevision > base.uiRevision,
    JSON.stringify(pollAfterSummon.result && { unchanged: pollAfterSummon.result.unchanged, summoned: pollAfterSummon.result.summoned, ui: pollAfterSummon.result.uiRevision, was: base.uiRevision }))
  await runCmd('stop', SID_G)
  const pollAfterStop = await rpc('state', { revision: base.revision, uiRevision: pollAfterSummon.result.uiRevision, note: base.active, sessionId: SID_G })
  ok('dismissing reaches the next poll too',
    pollAfterStop.result && pollAfterStop.result.unchanged !== true && pollAfterStop.result.summoned === false,
    JSON.stringify(pollAfterStop.result && { unchanged: pollAfterStop.result.unchanged, summoned: pollAfterStop.result.summoned }))
}

console.log('reading another note by name')
// The agent must be able to inspect note B while the card keeps showing note A.
const activeBefore = (await tools.get('note_list').execute({}, { agent: { session: sessionWith(SID_A, WS) } })).active
const otherSels = await tools.get('note_get_selections').execute({ note: '另一份' }, { agent: { session: sessionWith(SID_A, WS) } })
ok('selections of a named note can be read', Array.isArray(otherSels), JSON.stringify(otherSels && otherSels.length))
const otherText = await tools.get('note_read').execute({ note: '另一份' }, { agent: { session: sessionWith(SID_A, WS) } })
ok('the named note body can be read', /别的正文/.test(otherText.text), JSON.stringify(otherText && otherText.text.slice(0, 20)))
const activeAfter = (await tools.get('note_list').execute({}, { agent: { session: sessionWith(SID_A, WS) } })).active
ok('and the open note did not change', activeAfter === activeBefore, JSON.stringify({ activeBefore: activeBefore, activeAfter: activeAfter }))
const rows = await tools.get('note_list').execute({}, { agent: { session: sessionWith(SID_A, WS) } })
ok('note rows report their selection counts', rows.notes.every((n) => typeof n.selections === 'number'), JSON.stringify(rows.notes.map((n) => n.name + ':' + n.selections)))
let missingErr = ''
try { await tools.get('note_read').execute({ note: '不存在' }, { agent: { session: sessionWith(SID_A, WS) } }) } catch (e) { missingErr = String(e.message || e) }
ok('a missing note name fails loudly', /没有名为/.test(missingErr), missingErr.slice(0, 70))

console.log('every tool answers with a schema-valid success value')
// The wrapper above only validates the tools this file actually calls, and most of them were
// never called on a SUCCESS path — which is exactly how note_create and note_clear shipped
// returning no `error` on success while their output schema required it: the live harness
// rejected those calls ("missing required property value.error") even though the note had
// been created. Call every registered tool once, on the path that succeeds.
const SID_D = 'session-tools-5555'
sessions._m.set(SID_D, sessionWith(SID_D, WS))
{
  const t = (name, args) => asTool(name, args || {}, SID_D)
  await t('note_create', { name: '全量工具' })
  await t('note_write', { content: '# 全量工具\n第二行有内容\n第三行有内容\n' })
  await t('note_patch', { startLine: 2, startCol: 0, endLine: 2, endCol: 3, text: '第二行' })
  await t('note_patch_many', { edits: [{ startLine: 3, startCol: 0, endLine: 3, endCol: 3, text: '第三行' }] })
  await t('note_find', { query: '三行' })
  const added = await t('note_add_selection', { startLine: 1, startCol: 0, endLine: 1, endCol: 6, color: 'pink' })
  await t('note_set_remark', { id: added && added.id, remark: '工具写的备注' })
  await t('note_set_style', { id: added && added.id, style: 'italic' })
  const goto = await t('note_goto', { line: 3 })
  ok('note_goto moves the card and is reported back', goto.ok === true && goto.line === 3 && typeof goto.anchor === 'string', JSON.stringify({ ok: goto.ok, line: goto.line }))
  const gotoMark = await t('note_goto', { markId: added && added.id })
  ok('note_goto can jump straight to a mark id',
    gotoMark.ok === true && gotoMark.line === 1 && gotoMark.markId === (added && added.id),
    JSON.stringify({ ok: gotoMark.ok, line: gotoMark.line, markId: gotoMark.markId }))
  await t('note_goto', { line: 3 })
  const lists0 = await t('note_lists', { action: 'create', name: '工具检查' })
  ok('note_lists creates a named list', lists0.ok === true && lists0.lists.indexOf('《工具检查》') >= 0, lists0.lists.split('\n')[0])
  const added1 = await t('note_lists', { action: 'add', name: '工具检查', markId: added && added.id, note: '全量工具' })
  ok('note_lists adds a mark to it', added1.ok === true && /《工具检查》 1 条/.test(added1.lists), added1.lists.split('\n')[0])
  const dupe = await t('note_lists', { action: 'add', name: '工具检查', markId: added && added.id, note: '全量工具' })
  ok('adding the same mark twice is a no-op, not a duplicate', dupe.ok === true && /《工具检查》 1 条/.test(dupe.lists), dupe.lists.split('\n')[0])
  const bad = await t('note_lists', { action: 'add', name: '工具检查', markId: 'sel-nope' })
  ok('adding a mark that does not exist is refused', bad.ok === false && /没有标记/.test(bad.error), bad.error)
  await t('note_lists', { action: 'list' })
  await t('note_lists', { action: 'remove', name: '工具检查', markId: added && added.id })
  await t('note_lists', { action: 'rename', name: '工具检查', to: '工具检查2' })
  await t('note_lists', { action: 'delete', name: '工具检查2' })
  await t('note_ui', { action: 'open' })
  await t('note_ui', { action: 'tab', tab: 'session' })
  await t('note_ui', { action: 'focus', markId: added && added.id })
  const uiCard = await t('note_ui', { action: 'card', markId: added && added.id })
  ok('note_ui can raise the function card on a mark', uiCard.ok === true && uiCard.id > 0, JSON.stringify({ ok: uiCard.ok, id: uiCard.id }))
  const uiCardBad = await t('note_ui', { action: 'card', markId: 'sel-nope' })
  ok('note_ui refuses to raise a card on a mark that does not exist', uiCardBad.ok === false && /没有标记/.test(uiCardBad.error), uiCardBad.error)
  const uiBadTab = await t('note_ui', { action: 'tab', tab: '不存在的视图' })
  ok('note_ui refuses a view that does not exist', uiBadTab.ok === false && /没有这个视图/.test(uiBadTab.error), uiBadTab.error)
  await t('note_ui', { action: 'float' })
  await t('note_ui', { action: 'dock' })
  await t('note_ui', { action: 'summon', on: true })
  await t('note_ui', { action: 'close' })
  const panel = await t('note_panel', { action: 'start' })
  ok('note_panel summons the card', panel.ok === true && panel.summoned === true, JSON.stringify({ ok: panel.ok, summoned: panel.summoned }))
  ok('note_list reports where the reader is in each note', (await t('note_list')).notes.every(function (n) { return typeof n.line === 'number' }), 'rows carry a line')
  const readAfterGoto = await t('note_read')
  ok('note_read tells the agent which line the user is on', readAfterGoto.viewLine === 3, JSON.stringify({ viewLine: readAfterGoto.viewLine }))
  await t('note_get_selections')
  await t('note_take_new_selections')
  await t('note_set_color', { id: added && added.id, color: 'green' })
  await t('note_remove_selection', { id: added && added.id })
  await t('note_add_selection', { startLine: 1, startCol: 0, endLine: 1, endCol: 6, color: 'yellow' })
  await t('note_clear_selections')
  await t('note_commit', { message: 'tool check' })
  await t('note_checkpoint', { message: 'tool check' })
  await t('note_diag')
  await t('note_export', { to: WS + '/exported-toolcheck.md' })
  await t('note_read')
  await t('note_list')
  await t('note_open', { name: '全量工具' })
  await t('note_import', { text: '导入\n', mode: 'append' })
  await t('note_rename', { from: '全量工具', to: '全量工具2' })
  await t('note_clear', { title: '全量工具2' })
  await t('note_delete', { name: '全量工具2', confirm: true })
}
const neverCalled = [...tools.keys()].filter((n) => !exercised.has(n))
ok('every registered tool was exercised on a success path',
  neverCalled.length === 0,
  neverCalled.length ? 'never called: ' + neverCalled.join(',') : exercised.size + ' tools exercised')
ok('the tool count still matches what the client and the docs expect', tools.size === 28, String(tools.size))

console.log('every RPC handler answers')
// One handler, clearSelections, was declared without its `args` parameter while its body used
// `args && args.sessionId`. Every call threw a ReferenceError inside the handler and answered
// { ok:false, error: "args is not defined" }; the card only reacts to ok:true, so the toolbar's
// "清空全部选中" did nothing and reported nothing at all. Exercise all 15 handlers, and check
// the behaviour rather than just "it answered".
const SID_E = 'session-rpc-6666'
sessions._m.set(SID_E, sessionWith(SID_E, WS))
{
  const internal = []
  const results = {}
  const call = async (m, a) => {
    let res = null
    try { res = (await rpc(m, Object.assign({ sessionId: SID_E }, a || {}))).result } catch (e) { internal.push(m + ' threw ' + ((e && e.message) || e)); return {} }
    const msg = String((res && res.error) || '')
    // A handler-level crash reads as a JS error; a legitimate refusal does not.
    if (/is not defined|is not a function|Cannot read|undefined is not/.test(msg)) internal.push(m + ': ' + msg)
    results[m] = res || {}
    return res || {}
  }
  await call('createNote', { name: 'rpc测试', text: '# rpc测试\n第二行\n第三行\n' })
  const st = await call('state', { revision: -1 })
  await call('saveText', { text: '# rpc测试\n第二行改\n第三行\n', baseRevision: st.revision })
  const added = await call('addSelection', { startLine: 1, startCol: 0, endLine: 1, endCol: 3, color: 'pink' })
  const afterAdd = (await call('state', { revision: -1 })).selections || []
  const cleared = await call('clearSelections')
  const afterClear = (await call('state', { revision: -1 })).selections || []
  await call('addSelection', { startLine: 2, startCol: 0, endLine: 2, endCol: 3, color: 'green' })
  const cur = (await call('state', { revision: -1 })).selections || []
  await call('removeSelection', { id: cur.length ? cur[0].id : 'sel-none' })
  const fresh = await call('addSelection', { startLine: 2, startCol: 0, endLine: 2, endCol: 3, color: 'green' })
  await call('setRemark', { id: fresh.id, remark: '这条是备注' })
  await call('saveView', { line: 2, anchor: '第二行改' })
  await call('commit', {})
  await call('importNote', { text: '导入\n', mode: 'append' })
  await call('renameNote', { from: 'rpc测试', to: 'rpc测试2' })
  await call('listNotes', {})
  await call('allMarks', {})
  await call('selectNote', { name: 'rpc测试2' })
  await call('asset', { path: 'no/such/asset.js' })
  await call('clearNote', {})
  await call('deleteNote', { name: 'rpc测试2', confirm: true })
  await call('reload', {})
  // Every MUTATING handler answers { ok: true } when it is given a valid session and sane
  // arguments — that is the contract the card codes against (it acts only on ok:true). A
  // handler that crashes internally, or one that refuses for no visible reason, shows up here
  // even when the mock swallows the thrown error. This is what clearSelections failed.
  const mutating = ['createNote', 'saveText', 'addSelection', 'removeSelection', 'clearSelections', 'setRemark', 'saveView', 'commit', 'importNote', 'renameNote', 'selectNote', 'clearNote', 'deleteNote', 'reload']
  const notOk = mutating.filter((m) => results[m].ok !== true)
  ok('every mutating RPC answers ok:true on a valid session',
    notOk.length === 0,
    notOk.length ? notOk.map((m) => m + ' -> ' + JSON.stringify(results[m])).join(' | ') : mutating.length + ' handlers answered ok')
  ok('no RPC handler throws an internal error', internal.length === 0, internal.length ? internal.join(' | ') : '16 handlers called')
  ok('addSelection then clearSelections really empties the list',
    added.ok === true && afterAdd.length === 1 && cleared.ok === true && afterClear.length === 0,
    JSON.stringify({ added: added.ok, afterAdd: afterAdd.length, cleared: cleared.ok, afterClear: afterClear.length, err: cleared.error || '' }))
}

console.log('the reading position')
// Every note remembers the line the reader had reached, silently, and switching notes (or
// coming back later) resumes in place. Per note means per note: one note's position must
// never leak into another.
const SID_F = 'session-view-7777'
sessions._m.set(SID_F, sessionWith(SID_F, WS))
{
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_F }, a || {}))).result || {}
  const body = (n) => { const out = []; for (let i = 1; i <= n; i++) out.push('行 ' + i); return out.join('\n') + '\n' }
  await r('createNote', { name: '甲', text: body(80) })
  await r('saveView', { line: 40, anchor: '行 40' })
  const inA = await r('state', { revision: -1 })
  const fileA = noteDirOf(SID_F, '甲') + '/.note-view.json'
  const ignored = String(files.get(k(noteDirOf(SID_F, '甲') + '/.gitignore')) || '')
  await r('createNote', { name: '乙', text: body(10) })
  const inB = await r('state', { revision: -1 })
  await r('saveView', { line: 3, anchor: '行 3' })
  const back = await r('state', { revision: -1 })
  await r('selectNote', { name: '甲' })
  const againA = await r('state', { revision: -1 })
  ok('a note remembers the line it was left at',
    inA.view && inA.view.line === 40 && inA.view.anchor === '行 40',
    JSON.stringify(inA.view))
  ok('it is written to the note directory, not into the note text',
    files.has(k(fileA)) && /"line": 40/.test(String(files.get(k(fileA)))) && !/'行 40'/.test(String(files.get(k(noteDirOf(SID_F, '甲') + '/note.md')))),
    fileA)
  ok('the position is kept out of the note git repo',
    ignored.indexOf('.note-view.json') >= 0,
    JSON.stringify(ignored))
  ok('a note that was never opened has no position of its own',
    inB.view === null || inB.view === undefined,
    JSON.stringify(inB.view))
  ok('each note keeps its own position',
    back.view && back.view.line === 3 && againA.view && againA.view.line === 40,
    JSON.stringify({ b: back.view && back.view.line, a: againA.view && againA.view.line }))
  await r('saveView', { line: 0, anchor: 'x' })
  const clamped = await r('state', { revision: -1 })
  ok('a nonsense line is clamped instead of stored',
    clamped.view && clamped.view.line === 1,
    JSON.stringify(clamped.view))
}

console.log('selection remarks')
// A remark is the reader's own note about one passage (the long press on [选中] opens the
// input). Two things matter: it must persist with the selection, and it must reach the model
// together with the selection text — otherwise the feature is a dead end.
const SID_H = 'session-remark-9999'
sessions._m.set(SID_H, sessionWith(SID_H, WS))
{
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_H }, a || {}))).result || {}
  await r('createNote', { name: '备注', text: '# 备注\n第一行\n第二行\n第三行\n' })
  const added = await r('addSelection', { startLine: 2, startCol: 0, endLine: 3, endCol: 3, color: 'pink', remark: '这里我总记混' })
  const st = await r('state', { revision: -1 })
  const sel = (st.selections || [])[0] || {}
  ok('a remark can be written while the selection is created',
    added.ok === true && sel.remark === '这里我总记混',
    JSON.stringify({ ok: added.ok, remark: sel.remark }))
  const stateFile = String(files.get(k(noteDirOf(SID_H, '备注') + '/.note-state.json')) || '')
  ok('the remark is persisted with the selection',
    stateFile.indexOf('这里我总记混') >= 0, stateFile.length + ' bytes')
  // What the MODEL sees: the render function of note_get_selections, not the raw object.
  const got = await asTool('note_get_selections', {}, SID_H)
  const tool = tools.get('note_get_selections')
  const rendered = tool.output.render({}, got).map((p) => p.text).join('\n')
  ok('the model is given the remark with the selection text',
    rendered.indexOf('【备注】这里我总记混') >= 0 && rendered.indexOf('第二行') >= 0,
    rendered.split('\n').slice(0, 4).join(' | '))
  const plain = await r('addSelection', { startLine: 3, startCol: 0, endLine: 3, endCol: 3 })
  const plainSel = ((await r('state', { revision: -1 })).selections || []).find((s) => s.id === plain.id) || {}
  ok('a selection without a remark still reports the field as an empty string',
    plainSel.remark === '',
    JSON.stringify({ remark: plainSel.remark }))
  const changed = await r('setRemark', { id: sel.id, remark: '改过的备注' })
  const after = (await r('state', { revision: -1 })).selections || []
  ok('an existing remark can be changed and cleared',
    changed.ok === true && after[0].remark === '改过的备注' && (await r('setRemark', { id: sel.id, remark: '' })).ok === true && ((await r('state', { revision: -1 })).selections || [])[0].remark === '',
    JSON.stringify({ changed: changed.ok, now: after[0].remark }))
  const missing = await r('setRemark', { id: 'sel-nope', remark: 'x' })
  ok('a remark for a selection that does not exist is refused, not silently created',
    missing.ok === false && /没有这条选中记录/.test(String(missing.error)),
    JSON.stringify({ ok: missing.ok, error: missing.error }))
  const long = await r('addSelection', { startLine: 1, startCol: 0, endLine: 1, endCol: 3, color: 'green', remark: 'x'.repeat(5000) })
  const longSel = ((await r('state', { revision: -1 })).selections || []).find((s) => s.id === long.id) || {}
  ok('a remark is bounded in length',
    typeof longSel.remark === 'string' && longSel.remark.length === 1000,
    String(longSel.remark && longSel.remark.length))
}

console.log('mark styles (colour, italic, underline — independent, all combinable)')
// The three dimensions are independent flags on the same record: a passage can be pink AND
// italic AND underlined at once, and the retired single `style` field still reads and writes
// as "both flags" so an older caller keeps working.
{
  const SID_I = 'session-style-8888'
  sessions._m.set(SID_I, sessionWith(SID_I, WS))
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_I }, a || {}))).result || {}
  await r('createNote', { name: '样式', text: '# 样式\n第一行内容\n第二行内容\n第三行内容\n' })
  const hl = await r('addSelection', { startLine: 2, startCol: 0, endLine: 2, endCol: 5 })
  const it = await r('addSelection', { startLine: 2, startCol: 0, endLine: 2, endCol: 5, italic: true })
  const ul = await r('addSelection', { startLine: 3, startCol: 0, endLine: 3, endCol: 5, underline: true, color: 'pink' })
  const both = await r('addSelection', { startLine: 3, startCol: 0, endLine: 3, endCol: 5, italic: true, underline: true, color: 'green' })
  const legacy = await r('addSelection', { startLine: 1, startCol: 0, endLine: 1, endCol: 3, style: 'italic' })
  const sels = (await r('state', { revision: -1 })).selections || []
  const byId = (id) => sels.find((s) => s.id === id) || {}
  ok('a mark created without any flag has no text style',
    byId(hl.id).italic === false && byId(hl.id).underline === false,
    JSON.stringify({ italic: byId(hl.id).italic, underline: byId(hl.id).underline }))
  ok('italic and underline are independent flags on the mark',
    byId(it.id).italic === true && byId(it.id).underline === false && byId(ul.id).underline === true && byId(ul.id).italic === false,
    JSON.stringify({ it: byId(it.id), ul: byId(ul.id) }))
  ok('BOTH flags can be set on one mark, together with a colour',
    byId(both.id).italic === true && byId(both.id).underline === true && byId(both.id).color === 'green',
    JSON.stringify({ italic: byId(both.id).italic, underline: byId(both.id).underline, color: byId(both.id).color }))
  ok('the retired `style` argument still works',
    byId(legacy.id).italic === true && byId(legacy.id).underline === false, JSON.stringify(byId(legacy.id).style))
  ok('several marks of different looks can cover the same words',
    byId(hl.id).startLine === byId(it.id).startLine && byId(hl.id).startCol === byId(it.id).startCol && hl.id !== it.id && ul.id !== both.id,
    hl.id + ' + ' + it.id + ' over the same range, ' + ul.id + ' + ' + both.id + ' over another')
  const stateFile = String(files.get(k(noteDirOf(SID_I, '样式') + '/.note-state.json')) || '')
  ok('the flags are persisted to disk',
    /"italic":\s*true/.test(stateFile) && /"underline":\s*true/.test(stateFile) && !/"style":/.test(stateFile),
    stateFile.length + ' bytes')
  // Toggling one flag must leave the other alone — that is what a single I / U button does.
  const toggledIt = await r('setMarkLook', { id: both.id, italic: false })
  const afterToggle = (await r('state', { revision: -1 })).selections || []
  const t = afterToggle.find((s) => s.id === both.id) || {}
  ok('toggling one style leaves the other one alone',
    toggledIt.ok === true && t.italic === false && t.underline === true && t.color === 'green' && t.style === 'underline',
    JSON.stringify({ style: t.style, italic: t.italic, underline: t.underline }))
  const coloured = await r('setMarkLook', { id: both.id, color: 'black' })
  const afterColour = ((await r('state', { revision: -1 })).selections || []).find((s) => s.id === both.id) || {}
  ok('a colour change keeps the text styles',
    coloured.ok === true && afterColour.color === 'black' && afterColour.underline === true,
    JSON.stringify({ color: afterColour.color, style: afterColour.style }))
  ok('a colour of `none` means no wash at all',
    (await r('setMarkLook', { id: hl.id, color: 'none' })).ok === true && ((await r('state', { revision: -1 })).selections || []).find((s) => s.id === hl.id).color === 'none',
    'none accepted')
  const resetLegacy = await r('setMarkLook', { id: both.id, style: 'highlight' })
  const afterReset = ((await r('state', { revision: -1 })).selections || []).find((s) => s.id === both.id) || {}
  ok('the legacy `style: highlight` clears both flags',
    resetLegacy.ok === true && afterReset.italic === false && afterReset.underline === false,
    JSON.stringify({ style: afterReset.style }))
  const badStyle = await r('setMarkLook', { id: hl.id, style: 'sparkle' })
  const badColor = await r('setMarkLook', { id: hl.id, color: 'chartreuse' })
  const none = await r('setMarkLook', { id: hl.id })
  ok('an invalid style or colour is refused, not silently coerced',
    badStyle.ok === false && badColor.ok === false && none.ok === false,
    JSON.stringify({ style: badStyle.error, color: badColor.error, neither: none.error }))
  const ghost = await r('setMarkLook', { id: 'sel-nope', italic: true })
  ok('a style change for a mark that does not exist is refused',
    ghost.ok === false && /没有这条标记记录/.test(String(ghost.error)), JSON.stringify({ error: ghost.error }))
  const all = await r('allMarks', {})
  const group = (all.notes || []).find((g) => g.note === '样式') || {}
  const anyStyle = (group.marks || []).some((m) => m.italic === true || m.underline === true)
  ok('the session view carries the flags too', anyStyle === true, JSON.stringify((group.marks || []).map((m) => m.id + ':' + m.style)))
  const styled = await asTool('note_set_style', { id: hl.id, italic: true }, SID_I)
  ok('note_set_style toggles one flag', styled.style === 'italic' && styled.italic === true && styled.underline === false && styled.ok === true, JSON.stringify({ ok: styled.ok, style: styled.style }))
  const styledBoth = await asTool('note_set_style', { id: hl.id, style: 'both' }, SID_I)
  ok('note_set_style still accepts the legacy single value', styledBoth.style === 'italic+underline' && styledBoth.italic === true && styledBoth.underline === true, JSON.stringify({ style: styledBoth.style }))
  const addedStyled = await asTool('note_add_selection', { startLine: 4, startCol: 0, endLine: 4, endCol: 5, italic: true, underline: true, color: 'pink' }, SID_I)
  const madeStyle = ((await r('state', { revision: -1 })).selections || []).find((s) => s.id === addedStyled.id) || {}
  ok('note_add_selection can create a fully combined mark directly',
    madeStyle.italic === true && madeStyle.underline === true && madeStyle.color === 'pink',
    JSON.stringify({ style: madeStyle.style, color: madeStyle.color }))
  const tool = tools.get('note_get_selections')
  const rendered = tool.output.render({}, await asTool('note_get_selections', {}, SID_I)).map((p) => p.text).join('\n')
  ok('the model is told which mark is italic and which is underlined',
    rendered.indexOf('·斜体') >= 0 && rendered.indexOf('·下划线') >= 0, rendered.split('\n').slice(0, 3).join(' | '))
}

console.log('fine-grained change events')
// Every mutating tool/RPC appends a topic, and the card refreshes only the part that topic names.
// The events ride the state poll, so they must survive the "unchanged" shortcut.
{
  const SID_EV = 'session-events-7777'
  sessions._m.set(SID_EV, sessionWith(SID_EV, WS))
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_EV }, a || {}))).result || {}
  await r('createNote', { name: '事件', text: '# 事件\n第一行\n第二行\n' })
  const base = await r('state', { revision: -1, since: 0 })
  const baseId = base.eventId
  ok('the state answer carries an event id', typeof baseId === 'number' && baseId > 0, String(baseId))
  await r('addSelection', { startLine: 2, startCol: 0, endLine: 2, endCol: 3 })
  const afterMark = await r('state', { revision: -1, since: baseId })
  const markTopics = (afterMark.events || []).map((e) => e.topic)
  ok('adding a mark announces the marks topic', markTopics.indexOf('marks') >= 0, JSON.stringify(markTopics))
  const sinceMark = afterMark.eventId
  await r('listCreate', { name: '事件列表' })
  const afterList = await r('state', { revision: -1, since: sinceMark })
  ok('creating a custom list announces the lists topic',
    (afterList.events || []).some((e) => e.topic === 'lists'), JSON.stringify((afterList.events || []).map((e) => e.topic)))
  const listId = afterList.eventId
  await r('saveView', { line: 3, anchor: '第三行', jump: true })
  const afterView = await r('state', { revision: -1, since: listId })
  const viewEv = (afterView.events || []).filter((e) => e.topic === 'view')[0]
  ok('a jump announces the view topic with its line',
    viewEv !== undefined && viewEv.data && viewEv.data.line === 3,
    JSON.stringify(viewEv && viewEv.data))
  const viewId = afterView.eventId
  const patched = await asTool('note_patch', { startLine: 2, startCol: 0, endLine: 2, endCol: 3, text: '第一行改' }, SID_EV)
  ok('note_patch succeeded', patched.ok === true, JSON.stringify({ ok: patched.ok }))
  const afterText = await r('state', { revision: -1, since: viewId })
  ok('a text write announces the text topic',
    (afterText.events || []).some((e) => e.topic === 'text'), JSON.stringify((afterText.events || []).map((e) => e.topic)))
  const quiet = await r('state', { revision: afterText.revision, uiRevision: afterText.uiRevision, note: afterText.active, since: afterText.eventId })
  ok('nothing new is answered as unchanged, with the current event id',
    quiet.unchanged === true && quiet.eventId === afterText.eventId, JSON.stringify({ unchanged: quiet.unchanged, eventId: quiet.eventId }))
  const behind = await r('state', { revision: afterText.revision, uiRevision: afterText.uiRevision, note: afterText.active, since: 0 })
  ok('a client that missed events is not told "unchanged"',
    behind.unchanged !== true && Array.isArray(behind.events) && behind.events.length > 0,
    JSON.stringify({ unchanged: behind.unchanged, n: (behind.events || []).length }))
}

console.log(failed === 0 ? '\nALL NOTE-MODEL CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
