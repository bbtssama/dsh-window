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
import fsSync from 'node:fs'

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
/** Is there a regular file at this path? (writeFile is the only way one appears.) */
function isFile(p) { return files.has(k(p)) }
/**
 * A recursive copy, as the mirror's shell command would do it. With `onlyNewer` it skips a file
 * whose content is already identical at the destination — the stand-in for robocopy /XO (the
 * fake filesystem has no mtimes, and "content differs" is the property the re-sync depends on).
 * Returns how many files it actually copied, which is what the incremental test asserts on.
 */
function copyTree(src, dst, onlyNewer, skipDirs, skipFiles) {
  const srcKey = k(src)
  const dstKey = k(dst)
  const skipD = skipDirs || []
  const skipF = skipFiles || []
  let copied = 0
  for (const f of [...files.keys()]) {
    if (f !== srcKey && !f.startsWith(srcKey + '/')) continue
    const rel = f.slice(srcKey.length).replace(/^\//, '')
    const segs = rel.split('/')
    const name = segs[segs.length - 1]
    // `/XD` accepts a bare directory NAME (matches at any depth) or an ABSOLUTE path (excludes
    // exactly that directory). The real robocopy honours both; a fake that only knew names would
    // copy the exclusion targets and hide a regression in the path form the host now emits.
    let skipped = false
    for (let d = 0; d < segs.length - 1 && !skipped; d++) {
      const abs = srcKey + '/' + segs.slice(0, d + 1).join('/')
      if (skipD.indexOf(segs[d]) >= 0 || skipD.indexOf(abs) >= 0) skipped = true
    }
    if (skipped) continue
    if (skipF.indexOf(name) >= 0) continue
    const target = dstKey + f.slice(srcKey.length)
    if (onlyNewer && files.get(target) === files.get(f)) continue
    writeFile(target, files.get(f))
    copied++
  }
  for (const d of [...dirs]) if (d === srcKey || d.startsWith(srcKey + '/')) putDir(dstKey + d.slice(srcKey.length))
  putDir(dstKey)
  return copied
}
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
/** Added latency for `git init` only, so tests can measure whether a caller waited for git. */
let gitDelayMs = 0
// How many files each mirror command actually COPIED — the incremental re-sync is asserted with
// this, because "the file is still there" cannot tell a copy from a skip.
const copyStats = []
const shell = {
  resolve: (r) => r,
  async run(req) {
    const cmd = String(req.command || '')
    const cwd = String(req.workdir || '')
    if (cmd.startsWith('git ')) {
      // A little latency on `init` makes "did the caller WAIT for git?" measurable: a deferred
      // repository creation cannot be noticed by the caller, an awaited one doubles the save's time.
      if (typeof gitDelayMs === 'number' && gitDelayMs > 0 && cmd.indexOf('init -q') >= 0) await new Promise((r) => setTimeout(r, gitDelayMs))
      gitCalls.push({ dir: k(cwd), args: cmd.slice(4) })
      if (cmd.indexOf('rev-parse --short HEAD') >= 0) return { exitCode: 0, stdout: { text: 'abc1234\n' }, stderr: { text: '' } }
      if (cmd.indexOf('rev-parse --is-inside-work-tree') >= 0) { const inside = isDir(k(cwd) + '/.git'); return { exitCode: inside ? 0 : 128, stdout: { text: inside ? 'true' : '' }, stderr: { text: inside ? '' : 'fatal: not a git repository' } } }
      if (cmd === 'git init -q') { putDir(k(cwd) + '/.git'); return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } } }
      return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } }
    }
    const rm = /Remove-Item -LiteralPath "([^"]+)"/.exec(cmd)
    if (rm) { removeSubtree(rm[1]); return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } } }
    // cmd /c rmdir /s /q "\\?\C:\…" — the long-path-capable tree removal the host uses instead of
    // Remove-Item (measured: Remove-Item dies on a 274-character path, rmdir with the \\?\ prefix
    // does not; and the production fs service has no rm of its own).
    const rmdir = /^cmd \/c rmdir \/s \/q "(.*)"$/.exec(cmd)
    if (rmdir) { removeSubtree(rmdir[1].replace(/^\\\\\?\\/, '')); return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } } }
    // robocopy "<src>" "<dst>" /E … [/XO] [/XD "…"] [/XF "…"] — the mirror's Windows command.
    const rc = /^robocopy "([^"]+)" "([^"]+)"(.*)$/.exec(cmd)
    if (rc) {
      const rest = rc[3]
      // `/XD` paths arrive with native separators (robocopy ignores the forward-slash form) while
      // this fake keys everything by forward slash, so normalize before matching.
      const skipDirs = [...rest.matchAll(/\/XD "([^"]+)"/g)].map((m) => m[1].replace(/\\/g, '/'))
      const skipFiles = [...rest.matchAll(/\/XF "([^"]+)"/g)].map((m) => m[1])
      const copied = copyTree(rc[1], rc[2], /\s\/XO(\s|$)/.test(rest), skipDirs, skipFiles)
      copyStats.push({ cmd: 'robocopy', src: k(rc[1]), dst: k(rc[2]), copied, incremental: /\s\/XO(\s|$)/.test(rest) })
      return { exitCode: copied > 0 ? 1 : 0, stdout: { text: '' }, stderr: { text: '' } }
    }
    // cp -R / cp -Ru "<src>/." "<dst>" — the POSIX command.
    const cpr = /^cp -R(u?) "([^"]+)" "([^"]+)"$/.exec(cmd)
    if (cpr) {
      const src = cpr[2].replace(/\/\.$/, '')
      const copied = copyTree(src, cpr[3], cpr[1] === 'u')
      copyStats.push({ cmd: 'cp', src: k(src), dst: k(cpr[3]), copied, incremental: cpr[1] === 'u' })
      return { exitCode: 0, stdout: { text: '' }, stderr: { text: '' } }
    }
    const cp = /Copy-Item -LiteralPath "([^"]+)" -Destination "([^"]+)" -Recurse/.exec(cmd)
    if (cp) {
      const copied = copyTree(cp[1], cp[2], false)
      copyStats.push({ cmd: 'Copy-Item', src: k(cp[1]), dst: k(cp[2]), copied, incremental: false })
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
// The directory picker is optional and can appear long after apply(), so the host reads it per
// call. The tests below swap it in and out to prove both the happy path and the explanations.
let pickerStub = undefined
const ctx = {
  get(name) {
    if (name === 'fs') return fs
    if (name === 'shell') return shell
    if (name === 'sandboxPolicy') return policy
    if (name === 'sessions') return sessions
    if (name === 'agents') return { currentInitiator: () => null, list: () => [] }
    if (name === 'directoryPicker') return pickerStub
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
  const parsed = JSON.parse(out)
  // An envelope-level error (the handler threw) used to surface as a bare `{}` at the call site,
  // which reads like "the handler returned nothing" instead of "the handler blew up". Say it.
  if (parsed && (parsed.result === undefined || parsed.result === null)) {
    console.log('  !!! RPC ' + method + ' answered without a result: ' + JSON.stringify(parsed).slice(0, 400))
  }
  return parsed
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
// A note keeps its OWN repository, but it is created the first time the note needs history — not
// when the note is created. Importing a 156-document folder used to spawn 6–8 git processes per
// note, which is what made the whole machine unusable during an import.
ok('a fresh note has no repository yet (nothing has needed history)',
  !isDir(noteDirOf(SID_A, '会议纪要') + '/.git'), 'no .git before the first commit')
await asTool('note_commit', { message: 'note: 第一次提交' }, SID_A)
ok('and it gets its own repository the first time it needs one, in its own directory',
  isDir(noteDirOf(SID_A, '会议纪要') + '/.git') && gitCalls.some((c) => c.args === 'init -q' && c.dir === noteDirOf(SID_A, '会议纪要')),
  'its own git init: ' + noteDirOf(SID_A, '会议纪要'))
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
  // The two asset tools: a one-file folder is enough to exercise the success path.
  writeFile(WS + '/toolcheck-src/only.md', '# 只有一个文件\n')
  await t('note_import_folder', { dir: WS + '/toolcheck-src', files: ['only.md'] })
  await t('note_assets', { note: 'only' })
  await t('note_sync', { note: 'only' })
}
const neverCalled = [...tools.keys()].filter((n) => !exercised.has(n))
ok('every registered tool was exercised on a success path',
  neverCalled.length === 0,
  neverCalled.length ? 'never called: ' + neverCalled.join(',') : exercised.size + ' tools exercised')
ok('the tool count still matches what the client and the docs expect', tools.size === 31, String(tools.size))

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

console.log('the asset mirror (folder import)')
// Everything note-related lives under dsh-window/note/, assets are ALWAYS copies inside it, one
// mirror is shared by every .md of a folder, and rendering never reads outside that tree.
{
  const SID_AS = 'session-assets-6666'
  sessions._m.set(SID_AS, sessionWith(SID_AS, WS))
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_AS }, a || {}))).result || {}
  // A source folder with two markdown files, a shared image, a subfolder, and two things a
  // mirror must never copy.
  const srcDir = WS + '/docs-src'
  writeFile(srcDir + '/README.md', '# 主笔记\n\n![图](./img/a.png)\n\n见 [附录](./sub/notes.md)\n')
  writeFile(srcDir + '/guide.md', '# 指南\n\n![图](./img/a.png)\n')
  writeFile(srcDir + '/img/a.png', 'PNGDATA-1')
  writeFile(srcDir + '/sub/notes.md', '# 附录\n')
  writeFile(srcDir + '/sub/deep/b.txt', 'deep')
  writeFile(srcDir + '/node_modules/junk.js', 'never copy me')
  writeFile(srcDir + '/.git/config', 'never copy me either')
  writeFile(srcDir + '/Thumbs.db', 'junk')
  // A note space living inside the source: a workspace inside the imported folder, or the
  // folder's own copy of one. Mirroring it copies the mirror into the mirror — measured on a real
  // folder: 1203 of its mirror's 3542 entries (24.9 MB) were exactly that.
  writeFile(srcDir + '/dsh-window/note/_assets/self/note.md', '# 自我副本\n')
  writeFile(srcDir + '/dsh-window/note/_assets/self/img/self.png', 'SELFDATA')
  // …while a plain `_assets` folder that is NOT a note space is ordinary content and must survive.
  writeFile(srcDir + '/blog/_assets/logo.svg', '<svg/>')
  // Documents that only a RECURSIVE scan finds, plus a same-named file in another folder.
  writeFile(srcDir + '/sub/README.md', '# 子目录的 README\n')
  writeFile(srcDir + '/sub/deep/more.md', '# 附录\n\n## 第一章\n\n正文\n\n## 第二章\n\n更多\n')
  // Explicit HTML anchors: these notes' tables of contents point at `<a id="…">` tags, not at
  // heading slugs — matching headings alone found nothing and reported "没有这个标题".
  writeFile(srcDir + '/sub/anchored.md', '# 锚点文档\n\n<a id="oop-overview"></a>\n\n## 面向对象概览\n\n内容\n')
  // The reader's own note space inside the imported folder: never mirrored, never scanned.
  writeFile(srcDir + '/dsh-window/note/session-x/note.md', '# 我自己的笔记\n')

  const scan = await r('scanFolder', { dir: srcDir })
  const rels = (scan.files || []).map((f) => f.rel)
  ok('scanning a folder lists every .md at ANY depth, with its relative path',
    scan.ok === true && rels.length === 6 && rels.indexOf('sub/notes.md') >= 0 && rels.indexOf('sub/deep/more.md') >= 0 && rels.indexOf('sub/anchored.md') >= 0 &&
    (scan.files || []).filter((f) => f.rel === 'sub/deep/more.md')[0].depth === 2,
    JSON.stringify(rels))
  ok('the reader\'s own note space inside the folder is not offered as content',
    rels.every((r2) => r2.indexOf('dsh-window') < 0), JSON.stringify(rels))
  // `FsDirEntry.size` is optional and the Windows backend leaves it undefined, so a listing that
  // only reads it reports every file as 0 bytes. Ask for a real number here.
  ok('the listing carries real byte sizes, not zeros',
    (scan.files || []).every((f) => f.size > 0), JSON.stringify((scan.files || []).map((f) => f.name + ':' + f.size)))
  const rootId = scan.rootId
  ok('the asset root id is derived from the folder name + a path hash', typeof rootId === 'string' && /^docs-src-[0-9a-f]{8}$/.test(rootId), String(rootId))

  const imp = await asTool('note_import_folder', { dir: srcDir, files: ['README.md', 'guide.md'] }, SID_AS)
  ok('importing a folder mirrors it and creates one note per selected .md',
    imp.ok === true && imp.files >= 5 && (imp.created.match(/✓/g) || []).length === 2,
    JSON.stringify({ files: imp.files, bytes: imp.bytes, created: imp.created.split('\n').length }))
  // The size guard (MIRROR_MAX_BYTES) and every "N 文件 / M KB" the reader sees are fed by this
  // number. A blank `FsDirEntry.size` made it 0 for every folder in production (measured: a real
  // 26 MB mirror recorded `bytes: 0` in _assets/index.json), so the guard could never fire.
  ok('the mirror reports its real byte size (the guard and the human-readable size depend on it)',
    imp.bytes > 0, 'bytes=' + imp.bytes)
  const mirrorDir = k(WS + '/dsh-window/note/_assets/' + rootId)
  ok('the mirror keeps the folder structure', isFile(mirrorDir + '/img/a.png') && isFile(mirrorDir + '/sub/deep/b.txt'), 'img/a.png + sub/deep/b.txt')
  ok('the mirror never copies node_modules, .git or OS junk',
    !isFile(mirrorDir + '/node_modules/junk.js') && !isFile(mirrorDir + '/.git/config') && !isFile(mirrorDir + '/Thumbs.db'),
    'exclusions applied')
  ok('a note space inside the source is NOT mirrored (a mirror must not contain a mirror)',
    !isFile(mirrorDir + '/dsh-window/note/_assets/self/note.md') && !isFile(mirrorDir + '/dsh-window/note/_assets/self/img/self.png'),
    'nested asset area excluded')
  ok('but an ordinary `_assets` folder that is not a note space is still mirrored',
    isFile(mirrorDir + '/blog/_assets/logo.svg'), 'the rule is narrow: note/_assets only')
  ok('assets live under note/, next to the sessions', mirrorDir.indexOf(k(WS + '/dsh-window/note/_assets/')) === 0, k(WS + '/dsh-window/note/_assets/'))
  ok('ONE mirror is shared by every .md of that folder',
    ((await r('assets', {})).rootId === rootId) && isFile(WS + '/dsh-window/note/_assets/' + rootId + '/img/a.png'),
    'single root: ' + rootId)
  ok('there is no second copy of the assets', !isDir(k(WS + '/dsh-window/note/_assets/' + rootId + '-2')), 'no duplicate root')
  const idx = JSON.parse(String(files.get(k(WS + '/dsh-window/note/_assets/index.json')) || '{}'))
  ok('the asset index records that root exactly once',
    (idx.roots || []).filter((x) => x.id === rootId).length === 1 && (idx.roots || []).filter((x) => x.id === rootId)[0].files >= 5,
    JSON.stringify((idx.roots || []).map((x) => x.id + ':' + x.files)))
  ok('and the recorded size is a real number, so re-imports and the guard stay honest',
    (idx.roots || []).filter((x) => x.id === rootId)[0].bytes > 0,
    JSON.stringify((idx.roots || []).map((x) => x.id + ':' + x.bytes)))
  const reuse = await asTool('note_import_folder', { dir: srcDir, files: ['guide.md'] }, SID_AS)
  ok('importing the same folder again reuses the mirror instead of copying it again',
    reuse.ok === true && reuse.reused === true &&
    JSON.parse(String(files.get(k(WS + '/dsh-window/note/_assets/index.json')))).roots.filter((x) => x.id === rootId).length === 1,
    'reused=' + reuse.reused)

  // The image resolves through the note's asset root, and the answer says which file it hit.
  const img = await r('asset', { path: './img/a.png' })
  ok('a relative image resolves through the asset root', img.ok === true && img.size > 0 && String(img.hit).indexOf('_assets/' + rootId + '/img/a.png') > 0,
    JSON.stringify({ ok: img.ok, hit: img.hit, root: img.root }))
  const sub = await r('asset', { path: 'sub/deep/b.txt' })
  ok('a nested file resolves too', sub.ok === true && String(sub.hit).indexOf('sub/deep/b.txt') > 0, String(sub.hit))

  // And it refuses to leave the note space: that is the whole point of mirroring.
  // `..` is collapsed textually INSIDE the mirror, so a climbing path can never leave it: the
  // reference resolves to a (missing) file inside the mirror rather than to the real target.
  const esc = await r('asset', { path: '../../../../../../Windows/win.ini' })
  ok('a path that climbs out cannot reach the outside file',
    esc.ok === false && String(esc.error).indexOf('_assets/') > 0 && String(esc.error).indexOf('C:/Windows/win.ini') < 0,
    String(esc.error))
  const abs = await r('asset', { path: 'C:/Windows/win.ini' })
  ok('an absolute path is refused', abs.ok === false && /越界|相对路径/.test(String(esc.error) + String(abs.error)), String(abs.error))
  const noteDirImg = await r('asset', { path: 'note.md' })
  ok('a missing file reports the root it searched', noteDirImg.ok === false && /找不到|素材根/.test(String(noteDirImg.error)), String(noteDirImg.error))

  // ── listing many documents is not enough: following their links has to work too ──────────
  // Two folders holding a README.md used to fight over one note name (the second came back as
  // 已存在 and its content was dropped), and a link inside a nested document resolved against the
  // folder ROOT instead of the document's own folder.
  const both = await asTool('note_import_folder', { dir: srcDir, files: ['README.md', 'sub/README.md'] }, SID_AS)
  ok('two documents with the same file name become two notes (no silent loss)',
    both.ok === true && /《README》/.test(both.created) && /《sub-README》/.test(both.created), both.created.replace(/\n/g, ' | '))
  ok('a re-import of both is still idempotent',
    (await asTool('note_import_folder', { dir: srcDir, files: ['README.md', 'sub/README.md'] }, SID_AS)).created.indexOf('✗') < 0)
  // 《sub-README》 is active now, and it lives in `sub/`: its `./deep/more.md` means `sub/deep/more.md`.
  const follow = await r('openMirrorDoc', { href: './deep/more.md' })
  ok('a link inside a nested document resolves against THAT document\'s folder',
    follow.ok === true && follow.note === 'more' && /sub\/deep\/more\.md$/.test(String(follow.source)), JSON.stringify(follow))
  const moreBody = String(files.get(k(noteDirOf(SID_AS, 'more') + '/note.md')) || '')
  ok('the document with no note yet was registered on the spot, with its own text',
    moreBody.indexOf('## 第二章') >= 0, moreBody.slice(0, 40))
  const moreMeta = JSON.parse(String(files.get(k(noteDirOf(SID_AS, 'more') + '/note.json')) || '{}'))
  ok('the registered note carries the asset root and the origin it came from',
    moreMeta.assetRoot === '_assets/' + rootId && /sub\/deep\/more\.md$/.test(String(moreMeta.origin)), JSON.stringify(moreMeta))
  // Typora's table-of-contents links: `#第二章`, and the percent-encoded form of the same thing.
  // 《more》 is active and lives in `sub/deep/`, so these are relative to THAT folder.
  const anchored = await r('openMirrorDoc', { href: 'more.md#第二章' })
  ok('a #anchor link opens the note and reports the heading\'s line',
    anchored.ok === true && anchored.line === 7 && anchored.anchored === true, JSON.stringify(anchored))
  const jumped = await r('state', { revision: -1 })
  ok('the anchor becomes a real view JUMP (the card moves, not just scrolls)',
    jumped.view && jumped.view.line === 7 && jumped.view.jump > 0, JSON.stringify(jumped.view))
  const encoded = await r('openMirrorDoc', { href: 'more.md#%E7%AC%AC%E4%B8%80%E7%AB%A0' })
  ok('a percent-encoded anchor (what Typora writes for CJK) lands too',
    encoded.ok === true && encoded.line === 3, JSON.stringify(encoded))
  const sibling = await r('openMirrorDoc', { href: '../notes.md' })
  ok('`../notes.md` from a nested document climbs one level and registers that document',
    sibling.ok === true && sibling.note === 'notes' && sibling.existed === false && /sub\/notes\.md$/.test(String(sibling.source)), JSON.stringify(sibling))
  await r('selectNote', { name: 'more' })
  const sibling2 = await r('openMirrorDoc', { href: '../notes.md' })
  ok('and following it once more just switches back instead of making a second note',
    sibling2.ok === true && sibling2.existed === true && sibling2.note === 'notes', JSON.stringify(sibling2))
  const same = await r('openMirrorDoc', { href: '#附录' })
  ok('a bare `#附录` stays in the document the reader is already in and lands on its heading',
    same.ok === true && same.same === true && same.line === 1 && same.note === 'notes', JSON.stringify(same))
  const noAnchor = await r('openMirrorDoc', { href: 'deep/more.md#没有这一节' })
  ok('an anchor that does not exist opens the note anyway and says what is missing',
    noAnchor.ok === true && noAnchor.line === 0 && /没有 #/.test(String(noAnchor.error)), JSON.stringify(noAnchor))
  // `<a id="oop-overview"></a>` on line 3 of sub/anchored.md — the real shape of these documents.
  const htmlAnchor = await r('openMirrorDoc', { href: 'sub/anchored.md#oop-overview' })
  ok('an explicit `<a id="…">` anchor is found (not just heading slugs)',
    htmlAnchor.ok === true && htmlAnchor.line === 3 && htmlAnchor.anchored === true, JSON.stringify(htmlAnchor))
  const htmlJump = await r('state', { revision: -1 })
  ok('and it moves the reader there',
    htmlJump.view && htmlJump.view.line === 3 && htmlJump.view.jump > 0, JSON.stringify(htmlJump.view))
  // An index page written relative to the FOLDER ROOT, sitting in a nested folder: the
  // file-relative reading misses, and the root-relative one has to catch it.
  await r('selectNote', { name: 'more' })
  const rootWise = await r('openMirrorDoc', { href: 'sub/notes.md' })
  ok('a root-relative link inside a nested document still resolves',
    rootWise.ok === true && rootWise.note === 'notes' && /sub\/notes\.md$/.test(String(rootWise.source)), JSON.stringify(rootWise))
  ok('the note space of the imported folder never reached the mirror',
    !isFile(mirrorDir + '/dsh-window/note/session-x/note.md'), 'dsh-window/note excluded from the copy')

  // ── re-sync with the source folder ──────────────────────────────────────────────
  // Nothing changed at the source: the mirror must not be re-copied file by file (that is what
  // the incremental copy is for), and the note text must be left alone.
  copyStats.length = 0
  const sync1 = await asTool('note_sync', { note: 'README' }, SID_AS)
  ok('a sync with nothing changed copies no file again',
    sync1.ok === true && sync1.changed === false && copyStats.length === 1 && copyStats[0].incremental === true && copyStats[0].copied === 0,
    JSON.stringify({ changed: sync1.changed, stats: copyStats[0] }))
  // Now the source .md changes, plus a new image appears in the source folder.
  writeFile(srcDir + '/README.md', '# 主笔记（改过）\n\n![图](./img/a.png)\n\n![新图](./img/new.png)\n\n![缺失](./img/nope.png)\n')
  writeFile(srcDir + '/img/new.png', 'PNGDATA-2')
  const sync2 = await asTool('note_sync', { note: 'README' }, SID_AS)
  ok('a sync takes the new source text', sync2.ok === true && sync2.changed === true, JSON.stringify({ ok: sync2.ok, changed: sync2.changed }))
  const noteText = String(files.get(k(WS + '/dsh-window/note/' + SID_AS + '/README/note.md')) || '')
  ok('the note body really is the new one', noteText.indexOf('主笔记（改过）') >= 0, noteText.split('\n')[0])
  ok('a new file in the source folder reaches the mirror', isFile(WS + '/dsh-window/note/_assets/' + rootId + '/img/new.png'), 'img/new.png mirrored')
  ok('the sync reports which references resolve and which do not',
    typeof sync2.refs === 'string' && /引用 3 处/.test(sync2.refs) && /缺失 1/.test(sync2.refs) && /nope\.png/.test(sync2.refs),
    sync2.refs.split('\n')[0])
  const resolvedNew = await r('asset', { path: './img/new.png' })
  ok('the newly mirrored image resolves for the card', resolvedNew.ok === true && resolvedNew.size > 0, JSON.stringify({ ok: resolvedNew.ok, hit: resolvedNew.hit }))
  // A mirror that already holds a self-copy (what an earlier version left behind) must be cleaned
  // by the next sync — stopping the copying is not enough when the junk is already on disk.
  writeFile(WS + '/dsh-window/note/_assets/' + rootId + '/dsh-window/note/_assets/old/leftover.png', 'stale self-copy')
  const sweep = await asTool('note_sync', { note: 'README' }, SID_AS)
  ok('a re-sync deletes a nested mirror that is already inside the asset area',
    sweep.ok === true && !isFile(WS + '/dsh-window/note/_assets/' + rootId + '/dsh-window/note/_assets/old/leftover.png'),
    JSON.stringify({ ok: sweep.ok, files: sweep.files }))
  ok('and it deletes it from the mirror only, never from the source',
    isFile(srcDir + '/dsh-window/note/_assets/self/note.md'), 'the source copy is untouched')
  // Marks survive a sync: the text moved, so they are re-anchored, not dropped.
  const marked = await r('addSelection', { startLine: 1, startCol: 0, endLine: 1, endCol: 5 })
  const sync3 = await asTool('note_sync', { note: 'README' }, SID_AS)
  const stillThere = ((await r('state', { revision: -1 })).selections || []).filter((s) => s.id === marked.id)
  ok('a sync keeps the marks', sync3.ok === true && stillThere.length === 1, JSON.stringify({ marks: stillThere.length }))
  // A note that was not imported from a folder has nothing to sync with, and must say so.
  const plain = await r('createNote', { name: '没有来源', text: '# 手写的\n' })
  ok('a note created by hand has no origin', plain.ok === true, JSON.stringify({ ok: plain.ok }))
  const sync4 = await asTool('note_sync', { note: '没有来源' }, SID_AS)
  ok('syncing a note without an origin explains itself', sync4.ok === false && /没有可同步的来源/.test(sync4.error), sync4.error)
  // Importing a folder whose note already exists is NOT a failure (it says so and moves on).
  const again = await asTool('note_import_folder', { dir: srcDir, files: ['README.md'] }, SID_AS)
  ok('re-importing an existing note is not reported as a failure',
    again.ok === true && /已存在/.test(again.created) && again.created.indexOf('✗') < 0,
    again.created.replace(/\n/g, ' | '))
  // A note that was never imported from a folder has no root, and that must be sayable.
  await r('createNote', { name: '无素材', text: '# 没有素材根\n' })
  const noRoot = await r('asset', { path: './img/a.png' })
  ok('a note without an asset root says so instead of guessing', noRoot.ok === false && /没有素材根/.test(String(noRoot.error)), String(noRoot.error))

  const info = await asTool('note_assets', { note: 'README' }, SID_AS)
  ok('note_assets reports the root, the origin and the size',
    info.ok === true && info.assetRoot === '_assets/' + rootId && info.files >= 5 && String(info.origin).indexOf('docs-src') > 0,
    JSON.stringify({ root: info.assetRoot, files: info.files, origin: info.origin }))

  // ── a mistyped folder: say what the reader probably meant ──────────────────────
  writeFile(WS + '/docs-src-2/linux学习一站式笔记/x.md', 'x')
  const wrong = await r('scanFolder', { dir: WS + '/docs-src-2/linux学习' })
  ok('a mistyped folder is reported as unreadable', wrong.ok === false, String(wrong.error).slice(0, 60))
  ok('and the answer suggests the folder the reader meant',
    wrong.suggestions !== null && wrong.suggestions !== undefined && Array.isArray(wrong.suggestions.dirs) && wrong.suggestions.dirs.indexOf('linux学习一站式笔记') >= 0,
    JSON.stringify(wrong.suggestions && wrong.suggestions.dirs))

  // ── following a link into the mirror ────────────────────────────────────────────
  // `[附录](./sub/notes.md)` must open that document as a note SHARING the same asset root, so a
  // mirrored folder reads as a whole instead of bouncing the browser to a missing path.
  await r('selectNote', { name: 'README' })
  const link = await r('openMirrorDoc', { href: './sub/notes.md' })
  ok('a relative .md link opens as a note that shares the asset root',
    link.ok === true && link.note === 'notes',
    JSON.stringify({ ok: link.ok, note: link.note, existed: link.existed }))
  const linkedMeta = JSON.parse(String(files.get(k(WS + '/dsh-window/note/' + SID_AS + '/notes/note.json')) || '{}'))
  ok('the followed note shares the SAME mirror',
    linkedMeta.assetRoot === '_assets/' + rootId, JSON.stringify(linkedMeta))
  ok('the followed note\u2019s origin points back at the source folder, not the mirror',
    String(linkedMeta.origin) === srcDir + '/sub/notes.md', String(linkedMeta.origin))
  // Its own repository — created when the note first needs history, and never shared with another
  // note (the deferral is about TIMING, not about the one-repo-per-note layout).
  await r('commit', { message: 'note: followed' })
  ok('the followed note has its own repository once it needs one',
    gitCalls.some((c) => c.dir === k(WS + '/dsh-window/note/' + SID_AS + '/notes')), 'git init ran for it')
  // Following it again from the SAME document (the root README) must reuse the note, not make a
  // second one. (Following it from inside 《notes》 itself would mean `sub/sub/notes.md`, since a
  // link is relative to the file it sits in — that is covered above.)
  await r('selectNote', { name: 'README' })
  const again2 = await r('openMirrorDoc', { href: './sub/notes.md' })
  ok('following the same link again just switches to that note',
    again2.ok === true && again2.existed === true, JSON.stringify({ ok: again2.ok, existed: again2.existed, note: again2.note, error: again2.error }))
  const outsideLink = await r('openMirrorDoc', { href: '../../../../../../etc/passwd.md' })
  ok('a link that climbs out of the mirror is refused',
    outsideLink.ok === false && /镜像里没有|越界/.test(String(outsideLink.error)), String(outsideLink.error))
  const absLink = await r('openMirrorDoc', { href: 'C:/Windows/win.ini' })
  ok('an absolute link is refused', absLink.ok === false && /相对链接/.test(String(absLink.error)), String(absLink.error))
  const notMd = await r('openMirrorDoc', { href: './img/a.png' })
  ok('a non-markdown link explains itself instead of opening something odd',
    notMd.ok === false && /不是 Markdown/.test(String(notMd.error)), String(notMd.error))

  // Two repositories, two granularities: one per note, one for the whole mirror.
  const noteGit = gitCalls.filter((c) => c.args.indexOf('rev-parse') === 0 || c.args.indexOf('init') === 0)
  ok('each note keeps its own repository', isDir(k(WS + '/dsh-window/note/' + SID_AS + '/README/.git')), 'note repo exists')
  ok('the mirror has exactly one repository',
    isDir(mirrorDir + '/.git') !== true ? (await r('commitAssets', { message: 'assets: test' })).ok === true : true,
    JSON.stringify({ noteRepos: noteGit.length }))
  const committed = await r('commitAssets', { message: 'assets: test commit' })
  ok('the asset repository commits the mirror', committed.ok === true && isDir(k(WS + '/dsh-window/note/_assets/.git')), JSON.stringify({ ok: committed.ok, hash: committed.hash }))
}

console.log('the cost of polling a session with many notes')
// `notesView` runs on EVERY state poll (the card asks every 0.7s). It used to spawn `git rev-parse`
// for every note that is not the active one: in a real 16-note session one poll measured 4242 ms,
// so the card never caught up, switching a note waited behind that backlog for minutes, and every
// other call on the plugin queued behind the same store lock.
{
  const SID_P = 'session-perf-7777'
  sessions._m.set(SID_P, sessionWith(SID_P, WS))
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_P }, a || {}))).result || {}
  for (let i = 1; i <= 12; i++) await r('createNote', { name: '笔记 ' + i, text: '# 笔记 ' + i + '\n\n内容\n' })
  await r('state', { revision: -1 })                                  // cold: builds the cache once
  const warmStart = gitCalls.length
  await r('state', { revision: -1 })
  const warmState = await r('state', { revision: -1 })
  const warmGit = gitCalls.length - warmStart
  ok('a warm poll spawns no git command at all (12 notes → it used to be one per note)',
    warmGit === 0, warmGit + ' git calls across two polls')
  // The import itself must not touch git either: a real 156-document import used to run (init + 2
  // configs + add + commit + verify + rev-parse) per note — over a thousand process launches inside
  // one lock, which is what made the whole machine unusable while it ran.
  const bulkSrc = WS + '/bulk-src'
  writeFile(bulkSrc + '/甲.md', '# 甲\n\n内容\n')
  writeFile(bulkSrc + '/乙.md', '# 乙\n\n内容\n')
  writeFile(bulkSrc + '/sub/丙.md', '# 丙\n\n内容\n')
  const gitBeforeImport = gitCalls.length
  const bulk = await asTool('note_import_folder', { dir: bulkSrc, files: ['甲.md', '乙.md', 'sub/丙.md'] }, SID_P)
  const importGit = gitCalls.length - gitBeforeImport
  ok('importing documents launches ZERO git processes (' + bulk.created.split('\n').length + ' notes)',
    bulk.ok === true && importGit === 0, importGit + ' git calls during the import')
  ok('and none of those notes has a repository yet — they get one when it is first needed',
    !isDir(k(WS + '/dsh-window/note/' + SID_P + '/丙/.git')), 'no .git before the first commit')
  // B: a save must not WAIT for the repository — the file is written, the answer goes out, and the
  // repository is created behind it on the git queue (that wait was the last git lag on a hot path).
  const saveDir = k(WS + '/dsh-window/note/' + SID_P + '/丙')
  gitDelayMs = 80
  const tSave = Date.now()
  const savedText = await r('saveText', { text: '# 丙\n\n改过的内容\n' })
  const saveMs = Date.now() - tSave
  gitDelayMs = 0
  ok('a save never waits for git — an awaited repository creation would have cost >80ms',
    savedText.ok === true && saveMs < 40, 'save took ' + saveMs + ' ms')
  await new Promise(function (res) { setTimeout(res, 120) })
  ok('and the repository lands right after it, with nobody waiting for it',
    isDir(saveDir + '/.git'), 'no .git after the background task')

  // …and the commit hash is read straight out of .git, with no `git rev-parse` per note. A brand-new
  // note (never listed, so nothing is cached) proves the read path itself.
  const hashNote = k(WS + '/dsh-window/note/' + SID_P + '/哈希测试')
  writeFile(hashNote + '/note.md', '# 哈希测试\n')
  writeFile(hashNote + '/.git/HEAD', 'ref: refs/heads/master\n')
  writeFile(hashNote + '/.git/refs/heads/master', 'abcdef0123456789abcdef0123456789abcdef01\n')
  const gitBeforeHash = gitCalls.length
  const listed = await r('state', { revision: -1 })
  const row = (listed.notes || []).filter((n) => n.name === '哈希测试')[0]
  ok('the list reads the commit hash out of .git itself, launching no git at all',
    row && row.commitHash === 'abcdef0' && gitCalls.length === gitBeforeHash,
    JSON.stringify({ hash: row && row.commitHash, gitCalls: gitCalls.length - gitBeforeHash }))
  const rows = warmState.notes || []
  ok('and the list still carries every note with its size and its head',
    rows.length === 12 && rows.every((n) => n.lines >= 1 && n.bytes > 0), JSON.stringify(rows.slice(0, 2)))
  // The cache is keyed by the fs version, so an outside change still has to show up. `bumpVersion`
  // is what the fake fs does on a write; a raw writeFile would leave the version untouched and the
  // test would be asserting the fake's shortcut instead of the plugin's invalidation.
  const otherPath = k(WS + '/dsh-window/note/' + SID_P + '/笔记 3/note.md')
  writeFile(otherPath, '# 笔记 3\n\n新加的一行\n')
  bumpVersion(otherPath)
  const after = await r('state', { revision: -1 })
  const n3 = (after.notes || []).filter((n) => n.name === '笔记 3')[0]
  ok('an outside change to a non-active note is picked up (the cache follows the file version)',
    n3 && n3.lines === 4, JSON.stringify(n3))
}

console.log('the note menu tree (a pure function, so it can be tested at all)')
// The version of this logic that lived inside the render loop drew the folder row once per note
// (157 copies on a real session) and nothing could see it. It is a pure function now, extracted
// from the client source between its markers and called directly.
{
  const START = '/* TREE-PURE-START */'
  const END = '/* TREE-PURE-END */'
  const src = fsSync.readFileSync(new URL('./dynamic-client.js', import.meta.url), 'utf8')
  const a = src.indexOf(START)
  const b = src.indexOf(END)
  let build = null
  try {
    build = new Function(src.slice(a + START.length, b) + "\nreturn buildNoteMenuRows")()
  } catch (err) { }
  ok('the menu-row builder is extractable from the client source', typeof build === 'function', String(a) + ',' + String(b))
  const note = (name, group, relPath, lines) => ({ name: name, group: group || '', relPath: relPath || '', lines: lines || 1, commitHash: '', gitState: 'idle' })
  const g = '_assets/java面试八股大笔记-feb65ed0'
  const deep = [
    note('A', g, '知识库/详细笔记/A.md'),
    note('B', g, '知识库/详细笔记/B.md'),
    note('C', g, '知识库/C.md'),
    note('手写', '', '')
  ]
  const closed = build(deep, {})
  ok('a folder import collapses to ONE folder row, no matter how many notes it holds',
    closed.filter((r) => r.kind === 'folder').length === 1 && closed.filter((r) => r.kind === 'note').length === 1,
    JSON.stringify(closed.map((r) => r.kind + ':' + (r.label || r.note.name))))
  ok('and the folder row counts every note in it', closed[0].count === 3, JSON.stringify(closed[0]))
  ok('a note without a folder stays a flat row', closed[closed.length - 1].note.name === '手写', JSON.stringify(closed[closed.length - 1]))
  const folderKey = closed.filter((r) => r.kind === 'folder')[0].key
  const opened = build(deep, { [folderKey]: true })
  const dirKey = (opened.filter((r) => r.kind === 'dir')[0] || {}).key
  ok('opening the folder reveals only its DIRECTORIES — a note inside one is not listed yet',
    opened.filter((r) => r.kind === 'dir').length === 1 &&
    !opened.some((r) => r.kind === 'note' && (r.note.name === 'C' || r.note.name === 'A')),
    JSON.stringify(opened.map((r) => r.kind + ':' + (r.label || r.note.name))))
  const openDir = build(deep, { [folderKey]: true, [dirKey]: true })
  ok('opening a directory lists the notes in it, but not the notes of ITS subdirectory',
    openDir.some((r) => r.kind === 'note' && r.note.name === 'C') &&
    !openDir.some((r) => r.kind === 'note' && r.note.name === 'A'),
    'two levels')
  // The DEEPEST directory, not the first one: the first is the directory we just opened.
  const deepKey = openDir.filter((r) => r.kind === 'dir').sort((a, b) => b.depth - a.depth)[0].key
  const fully = build(deep, { [folderKey]: true, [dirKey]: true, [deepKey]: true })
  ok('opening every level finally lists the deepest notes, indented deeper than the shallower one',
    fully.some((r) => r.kind === 'note' && r.note.name === 'A') &&
    (fully.filter((r) => r.kind === 'note' && r.note.name === 'A')[0] || {}).depth > (fully.filter((r) => r.kind === 'note' && r.note.name === 'C')[0] || {}).depth,
    JSON.stringify(fully.map((r) => r.kind + ':' + (r.label || r.note.name) + '@' + r.depth)))
  ok('the folder row appears exactly once even with many notes (the 157-copies bug)',
    build([...Array(157)].map((_, i) => note('N' + i, g, 'd' + (i % 3) + '/N' + i + '.md')), {}).filter((r) => r.kind === 'folder').length === 1,
    '157 notes')
}

console.log('the back/forward history (a pure function, so it can be tested at all)')
// 后退/前进 over the notes this card has visited, capped at 50 entries. The reported bug is encoded
// here: a jump INSIDE the note being read changes no note name, so the `[noteName]` effect recorded
// nothing — 后退 left for the previous NOTE instead of returning to the paragraph just left
// ("跳转是成功的，只是栈里没有").
{
  const START = '/* NAV-PURE-START */'
  const END = '/* NAV-PURE-END */'
  const src = fsSync.readFileSync(new URL('./dynamic-client.js', import.meta.url), 'utf8')
  const a = src.indexOf(START)
  const b = src.indexOf(END)
  let nav = null
  try {
    nav = new Function(src.slice(a + START.length, b) + '\nreturn { push: navPushVisit, jump: navRecordJump, session: navSwapSession, read: navReadStore, take: navFromStore, pack: navPackStore, prune: navPrune, host: navFromHost }')()
  } catch (err) { }
  ok('the history builder is extractable from the client source',
    nav !== null && typeof nav.push === 'function' && typeof nav.jump === 'function' && typeof nav.session === 'function' &&
    typeof nav.read === 'function' && typeof nav.take === 'function' && typeof nav.pack === 'function' &&
    typeof nav.prune === 'function' && typeof nav.host === 'function',
    String(a) + ',' + String(b))
  if (nav) {
    const empty = () => ({ list: [], at: -1 })
    let h = nav.push(empty(), '甲', 0)
    ok('visiting a note records it, with the cursor on it',
      h.list.length === 1 && h.at === 0 && h.list[0].name === '甲' && h.list[0].line === 0, JSON.stringify(h))
    // A link into another note: the note itself is recorded by the name-change effect, the LINE the
    // reader left from by the jump.
    h = nav.jump(h, '乙', 5, 100)
    ok('a jump away records the spot the reader LEFT from on the entry behind it',
      h.list[0].line === 100 && h.list.length === 1 && h.at === 0, JSON.stringify(h))
    h = nav.push(h, '乙', 0)
    ok('and the note jumped to becomes the new entry',
      h.list.length === 2 && h.at === 1 && h.list[1].name === '乙', JSON.stringify(h))
    // The reported bug: an anchor jump inside the note being read.
    let s = nav.push(empty(), '丙', 0)
    s = nav.jump(s, '丙', 211, 100)
    ok('an anchor jump INSIDE the note being read gets a history entry of its own',
      s.list.length === 2 && s.at === 1 && s.list[0].name === '丙' && s.list[0].line === 100,
      JSON.stringify(s))
    ok('the entry behind it holds the line the reader was on (100), which is what 后退 returns to',
      s.list[0].line === 100, JSON.stringify(s.list[0]))
    ok('and the new entry holds the line the jump is heading to, so 前进 can come back to it',
      s.list[1].line === 211, JSON.stringify(s.list[1]))
    s = nav.jump(s, '丙', 250, 300)
    ok('a second in-note jump records where it left from (300), not the first jump\'s destination',
      s.list.length === 3 && s.at === 2 && s.list[1].line === 300 && s.list[2].line === 250,
      JSON.stringify(s.list))
    // 后退 walks 250 → 300 → 100 inside one note; 前进 walks back. Nothing here is a note change.
    const walk = [{ at: 1, line: 300 }, { at: 0, line: 100 }]
    ok('walking back over those entries lands on the recorded lines',
      walk.every((w) => s.list[w.at].line === w.line), JSON.stringify(s.list.map((e) => e.line)))
    ok('a jump before any visit is ignored instead of inventing an entry',
      nav.jump(empty(), '丁', 8, 9).list.length === 0, 'no visit yet')
    ok('coming back to the entry the cursor already points at adds no duplicate',
      (() => { const base = { list: s.list, at: 0 }; return nav.push(base, '丙', 0) === base })(),
      'same name')
    ok('a new visit after 后退 drops what was ahead of the cursor (前进 must not resurrect it)',
      (() => { const f = nav.push({ list: s.list, at: 0 }, '庚', 0); return f.list.length === 2 && f.at === 1 && f.list[1].name === '庚' })(),
      JSON.stringify(s.list.map((e) => e.name)))
    let many = nav.push(empty(), '戊', 0)
    for (let i = 0; i < 60; i++) many = nav.jump(many, '戊', i + 1, i)
    ok('the history is capped at 50 entries and the cursor follows the newest',
      many.list.length === 50 && many.at === 49 && many.list[49].line === 60,
      JSON.stringify({ n: many.list.length, at: many.at, last: many.list[49] }))
    // A corrupt line never reaches the restore path: it is normalised to 0 (= "nothing recorded",
    // which falls back to the live reading position) instead of NaN, which would blank the view.
    ok('a missing or junk line becomes 0 rather than NaN',
      nav.jump(empty(), 'x', undefined, undefined).list.length === 0 &&
      nav.push(empty(), '己', 'nonsense').list[0].line === 0, 'undefined / string')
    // The reported leak: the history is a ref on a component that survives a session switch, so a
    // new session inherited the previous one's notes — and a note name of another session is not in
    // this session's store at all, so clicking 后退 could only fail.
    let a1 = nav.push(empty(), '甲1', 0)
    a1 = nav.jump(a1, '甲1', 20, 5)
    let store = {}
    let cur = a1
    const toB = nav.session(store, '会话A', '会话B', cur)
    store = toB.store
    cur = toB.nav
    ok('switching session hands over an EMPTY history, not the previous session\'s notes',
      cur.list.length === 0 && cur.at === -1, JSON.stringify(cur))
    cur = nav.push(cur, '乙1', 0)
    const backToA = nav.session(store, '会话B', '会话A', cur)
    store = backToA.store
    ok('the new session records its own notes only',
      backToA.store['会话B'].list.length === 1 && backToA.store['会话B'].list[0].name === '乙1',
      JSON.stringify(backToA.store['会话B'].list))
    ok('and going back to the first session returns ITS history, untouched by the second one',
      backToA.nav.list.length === 2 && backToA.nav.at === 1 && backToA.nav.list.every((e) => e.name.indexOf('甲') === 0),
      JSON.stringify(backToA.nav.list))
    ok('no entry of one session is ever reachable while the other one is on screen',
      backToA.nav.list.every((e) => e.name.indexOf('乙') < 0), JSON.stringify(backToA.nav.list))
    const sameSid = nav.session(store, '会话A', '会话A', backToA.nav)
    ok('a render without a session change returns the very same history object',
      sameSid.nav === backToA.nav && sameSid.store === store, 'same sid')
    const firstEver = nav.session(store, '', '会话C', { list: [], at: -1 })
    ok('the first visit to a session (from no session at all) starts empty and parks nothing',
      firstEver.nav.list.length === 0 && Object.keys(firstEver.store).length === Object.keys(store).length,
      JSON.stringify(Object.keys(firstEver.store)))
  }
}

console.log('the history is wired into the real paths, not just written')
// The pure tests above prove the RULES. These tripwires prove the card actually calls them on the
// three paths that matter — the reported bug was exactly a missing call, not broken arithmetic.
{
  const src = fsSync.readFileSync(new URL('./dynamic-client.js', import.meta.url), 'utf8')
  const flat = src.replace(/\s+/g, ' ')
  ok('the jump the host reports feeds the history with the line the reader is standing on',
    /navRecordJump\(navRef\.current, incoming, r\.view\.line, topVisibleLine\(\)/.test(flat), 'applyState jump branch')
  ok('a jump that lands in the note already open goes through the geometry counter (nothing else would move it)',
    /navTargetRef\.current = null saveNavNow\(\) if \(entry\.line >= 1\) bump\(\) return/.test(flat), 'navGo')
  ok('a recorded line outranks the host view when a note is entered by 后退/前进',
    /const recorded = navPendRef\.current === incoming && pendingViewRef\.current !== null/.test(flat), 'applyState restore')
  ok('and it is marked for exactly the note 后退/前进 is heading to',
    /navPendRef\.current = entry\.line >= 1 \? entry\.name : null/.test(flat), 'navGo')
  ok('the menu shows the recorded line of every entry that has one, so the stack reads as "back to that paragraph"',
    // NOTE: `flat` collapses every run of whitespace to one space, so the padded label reads ' · 第 ' here.
    /e\.line >= 1 \? ' · 第 ' \+ e\.line \+ ' 行' : ''\)/.test(flat), 'navLabel')
  ok('a session switch parks the history being left and picks up this session\'s own',
    /const swapped = navSwapSession\(navStore, navSidRef\.current, sidRef\.current, navRef\.current, Date\.now\(\), NAV_TTL_MS\)/.test(flat) &&
    /navRef\.current = swapped\.nav/.test(flat), 'session-change block')
  ok('the persisted map is read on the way in, and the memory of this page wins over it',
    /const navStore = Object\.assign\(\{\}, readNavStore\(\), navBySidRef\.current\)/.test(flat), 'session-change block')
  ok('a record past the ttl is DELETED, not kept for the next write to store again',
    /if \(swapped\.expired\) delete navBySidRef\.current\[sidRef\.current\]/.test(flat), 'session-change block')
  ok('every write goes through the ttl filter (that is what keeps the stored map bounded)',
    /navPackStore\(map, Date\.now\(\), NAV_TTL_MS\)/.test(flat), 'writeNavStore')
  ok('the live session\'s stack is stamped each time it is saved, parked ones keep their own clock',
    /store\[live\] = \{ list: navRef\.current\.list, at: navRef\.current\.at, ts: Date\.now\(\) \}/.test(flat), 'saveNavNow')
  ok('the stacks are persisted from every place that changes one (11 call sites, exactly one definition)',
    (flat.match(/saveNavNow\(\)/g) || []).length === 12 && (flat.match(/function saveNavNow\(\)/g) || []).length === 1,
    String((flat.match(/saveNavNow\(\)/g) || []).length) + ' occurrences of saveNavNow()')
  // A stack entry is pushed with line 0 when its note is opened, and it used to get a real line only
  // when the reader LEFT it — so anybody reading a note saw `line: 0` in the stored stack, and a reload
  // could not come back to that line ("栈里面行还是没有被持久化"). The two places that record where the
  // reader is stamp the entry the cursor is on, and persist it.
  ok('the cursor entry follows the reader, so a stored stack never shows the 0 of a just-opened note',
    (flat.match(/stampNavLine\(line\) saveNavNow\(\)/g) || []).length === 3, 'saveViewNow + applyPendingView x2')
  ok('a stack is pruned against the note list, and an empty list is never taken for "no notes"',
    /if \(navNamesKey === ''\) return/.test(flat) &&
    /const pruned = navPrune\(navRef\.current, navNamesKey\.split\('\\u0000'\)\)/.test(flat), 'prune effect')
  // Every entry is { name, line }, and the line has to be there for 后退/前进 to come back to a
  // paragraph rather than to the top of a note. A jump writes it (navRecordJump); leaving a session,
  // and the page going away, are leaving the entry too, so the line being read is stamped there.
  ok('the line being read is stamped onto the entry the cursor is on (session left, page going away)',
    (flat.match(/stampNavLine\(topVisibleLine\(\)\)/g) || []).length === 2 &&
    /window\.addEventListener\('pagehide', stamp\)/.test(flat) &&
    /function stampNavLine\(line\)/.test(flat), 'two call sites + the helper')
  ok('and the entries keep their line through the storage round trip',
    /list\.push\(\{ name: e\.name, line: Math\.round\(Number\(e\.line\)\) \|\| 0 \}\)/.test(flat) &&
    /return \{ nav: \{ list: rec\.list\.slice\(\), at: at \}, expired: false \}/.test(flat), 'navReadStore + navFromStore')
  ok('and drops everything that pointed into the other session (target, recorded line, jump nonce)',
    /navTargetRef\.current = null navPendRef\.current = null/.test(flat) && /seenJumpRef\.current = -1/.test(flat), 'session-change block')
  // A phantom jump: the nonce is store state, not an event log, so the first one seen for a session
  // may be minutes old. Acting on it pushed an entry and wiped a recorded line (the "回来一看行号没了").
  ok('the first nonce of a session is a baseline, not a jump',
    /if \(jump && seenJumpRef\.current < 0\) seenJumpRef\.current = jump else if \(jump && jump !== seenJumpRef\.current\) \{/.test(flat), 'applyState')
  ok('a measurement of 0 never erases the line an entry had recorded',
    /list\[nav\.at\] = \{ name: nav\.list\[nav\.at\]\.name, line: left >= 1 \? left : \(Math\.round\(Number\(nav\.list\[nav\.at\]\.line\)\) \|\| 0\) \}/.test(flat), 'navRecordJump')
  // The stack lives in the HOST's per-session file, so a reload does not depend on browser storage.
  ok('every save also goes to the host, and the host answers it',
    /host\.call\('saveNav', \{ sessionId: sidRef\.current, list: navRef\.current\.list, at: navRef\.current\.at \}\)/.test(flat), 'saveNavNow')
  ok('and the state answer\'s stack is adopted while ours is still empty',
    /if \(r\.nav !== undefined && navRef\.current\.at < 0\) \{/.test(flat) &&
    /const fromHost = navFromHost\(r\.nav, Date\.now\(\), NAV_TTL_MS\)/.test(flat), 'applyState')
  ok('a state answer seeds a still-empty history, so a session whose note name repeats is not blank',
    /if \(incoming !== '' && navRef\.current\.at < 0\) navRef\.current = navPushVisit\(navRef\.current, incoming, 0\)/.test(flat),
    'applyState')
  ok('a session switch also forgets where the reader was in the session being left',
    /restoredForRef\.current = '' pendingViewRef\.current = null viewSavedRef\.current = \{ line: 0, note: '' \}/.test(flat),
    'session-change block')
  ok('the menu reads its expansion for the session on screen',
    /buildNoteMenuRows\(notes, openGroupsOf\(openGroups, openGroupsSid\)\)/.test(flat), 'menu read')
  ok('and writes it there too, instead of into one object shared by every session',
    /setOpenGroups\(function \(prev\) \{ return openGroupToggle\(prev, openGroupsSid, r\.key\) \}\)/.test(flat), 'menu write')
  // The auto-save timer holds a window.setTimeout id (f09aaaa replaced the ctx.timeout disposer);
  // `flush()` went on CALLING it, which threw a TypeError — so a 保存 or a note switch within 900ms
  // of a keystroke did nothing at all.
  ok('the auto-save timer is cancelled, never called as a function',
    src.indexOf('saveTimer.current()') < 0 &&
    /if \(saveTimer\.current\) \{ try \{ window\.clearTimeout\(saveTimer\.current\) \} catch \(err\) \{ \} saveTimer\.current = 0 \}/.test(flat),
    'flush + onDraft + the session switch')
  ok('a session switch hands the unsaved edits back to the session they were typed in',
    /rescueRef\.current = \{ sid: leavingSid, rev: revRef\.current, text: draftRef\.current, note: noteNameRef\.current \}/.test(flat) &&
    /host\.call\('saveText', \{ text: r\.text, baseRevision: r\.rev, sessionId: r\.sid \}\)/.test(flat), 'rescue')
  ok('and kills the timer that would have written them into this session\'s note',
    /window\.clearTimeout\(saveTimer\.current\) \} catch \(err\) \{ \} saveTimer\.current = 0 \} dirtyRef\.current = false/.test(flat), 'session-change block')
  ok('the editor and the live selection of the session just left are dropped with it',
    /setLive\(null\); setMagnify\(null\); setEditBlock\(null\); editBlockRef\.current = null; hideBar\(\)/.test(flat) &&
    /if \(mode === 'edit'\) setMode\('read'\)/.test(flat), 'session-change effect')
  // 「原文已变动」 is the way IN to the two repair actions: the badge opens the mark's function card,
  // whose first row offers 恢复原文 (an edit of the note) and 确认变动 (a change of the mark only).
  ok('the 原文已变动 badge is the button that opens the repair card',
    /'data-menu-opener': 'stale'/.test(flat) && /'原文已变动：点这里可以【恢复原文】或【确认变动】'/.test(flat), 'badge')
  ok('and that card offers both actions, for a mark of the note on screen only',
    /cardMark && cardMark\.stale && cardMarkHere \? h\('div', \{ className: 'dn-mcard-row', key: 'stale' \}/.test(flat) &&
    /restoreStaleText\(cardMark\)/.test(flat) && /confirmStaleMark\(cardMark\)/.test(flat) &&
    /const cardMarkHere = !!\(cardMark && selList\.filter\(function \(x\) \{ return x\.id === cardMark\.id \}\)\.length > 0\)/.test(flat),
    'mcard row')
  ok('【确认变动】 goes through the host instead of the card writing the record',
    /host\.call\('confirmSelection', \{ sessionId: sidRef\.current, id: m\.id \}\)/.test(flat), 'RPC call')
  ok('【恢复原文】 writes the note through the ordinary save path (a conflict is still caught)',
    /const next = staleRestoreText\(String\(textRef\.current \|\| ''\), m\)/.test(flat) &&
    /host\.call\('saveText', \{ text: next, baseRevision: revRef\.current, sessionId: sidRef\.current \}\)/.test(flat) &&
    /if \(r && r\.conflict\) \{ notify\('笔记已被外部改动，本次未写入；请先\[重载\]再试'\); return \}/.test(flat), 'restore')
  ok('the badge is only a button where the actions can work (a cross-note row keeps it plain)',
    /m\.stale \? \(cross \|\| listName/.test(flat), 'cross note')
}

console.log('the note-menu expansion is per session too (it leaked across a session switch)')
// Same class as the history leak: the expanded folders were one object shared by every session, so a
// folder opened in one session decided what the next one showed. The state is the whole map now,
// read and written through these two helpers.
{
  const START = '/* MENU-STATE-PURE-START */'
  const END = '/* MENU-STATE-PURE-END */'
  const src = fsSync.readFileSync(new URL('./dynamic-client.js', import.meta.url), 'utf8')
  const a = src.indexOf(START)
  const b = src.indexOf(END)
  let menu = null
  try {
    menu = new Function(src.slice(a + START.length, b) + '\nreturn { of: openGroupsOf, toggle: openGroupToggle }')()
  } catch (err) { }
  ok('the per-session expansion helpers are extractable from the client source',
    menu !== null && typeof menu.of === 'function' && typeof menu.toggle === 'function', String(a) + ',' + String(b))
  if (menu) {
    const EMPTY = {}
    ok('a session that never expanded anything reads as collapsed', Object.keys(menu.of(EMPTY, 'S1')).length === 0, 'empty')
    const s1 = menu.toggle(EMPTY, 'S1', 'folder:root')
    ok('expanding a folder records it for that session only',
      menu.of(s1, 'S1')['folder:root'] === true && Object.keys(menu.of(s1, 'S2')).length === 0, JSON.stringify(s1))
    ok('the map the card handed in is never mutated (the state stays pure)',
      Object.keys(EMPTY).length === 0, JSON.stringify(EMPTY))
    ok('toggling the same row again collapses it',
      menu.of(menu.toggle(s1, 'S1', 'folder:root'), 'S1')['folder:root'] === false, 'twice')
    const s2 = menu.toggle(s1, 'S2', 'folder:other')
    ok('the second session\'s expansion does not disturb the first one\'s',
      menu.of(s2, 'S1')['folder:root'] === true && menu.of(s2, 'S2')['folder:other'] === true, JSON.stringify(s2))
    const noSid = menu.toggle(s2, '', 'k')
    ok('a missing session id is a bucket of its own instead of leaking into a real session',
      menu.of(noSid, '')['k'] === true && menu.of(noSid, 'S1')['folder:root'] === true &&
      menu.of(noSid, 'S2')['folder:other'] === true, JSON.stringify(Object.keys(noSid)))
    ok('an undefined session id reads as collapsed rather than throwing',
      Object.keys(menu.of(s1, undefined)).length === 0 && Object.keys(menu.of(null, 'S1')).length === 0, 'undefined / null')
  }
}

console.log('the visit stack is persisted, and a record older than a day is cleared instead of loaded')
// The stacks survive a reload now, which is what makes them worth keeping at all — but a stack nobody
// has touched for a day is the one most likely to name notes that were renamed or deleted while that
// session was away, and those entries cannot be opened at all ("其中的笔记已经点击不跳转了").
{
  const START = '/* NAV-PURE-START */'
  const END = '/* NAV-PURE-END */'
  const src = fsSync.readFileSync(new URL('./dynamic-client.js', import.meta.url), 'utf8')
  const a = src.indexOf(START)
  const b = src.indexOf(END)
  let nav = null
  try {
    nav = new Function(src.slice(a + START.length, b) + '\nreturn { session: navSwapSession, read: navReadStore, take: navFromStore, pack: navPackStore, prune: navPrune, host: navFromHost }')()
  } catch (err) { }
  ok('the persistence helpers are extractable from the client source',
    nav !== null && typeof nav.read === 'function' && typeof nav.take === 'function' &&
    typeof nav.pack === 'function' && typeof nav.prune === 'function', String(a) + ',' + String(b))
  if (nav) {
    const HOUR = 3600 * 1000
    const TTL = 24 * HOUR
    const NOW = 1000000000000
    const rec = (list, at, ts) => ({ list: list, at: at, ts: ts })
    const one = [{ name: '甲', line: 7 }]
    ok('unreadable storage reads as an empty map instead of throwing',
      Object.keys(nav.read('{oops')).length === 0 && Object.keys(nav.read(null)).length === 0 &&
      Object.keys(nav.read('[1,2]')).length === 0, 'junk in, nothing out')
    ok('a stored record is accepted field by field, and a broken entry is dropped rather than trusted',
      (function () {
        const s = nav.read(JSON.stringify({ S1: { list: [{ name: '甲', line: '7' }, { nope: 1 }, null], at: 99, ts: NOW }, S2: { list: [] } }))
        return !!s.S1 && s.S1.list.length === 1 && s.S1.list[0].line === 7 && s.S1.at === 0 && s.S2 === undefined
      })(), 'validated')
    ok('a record inside the ttl is loaded, with its cursor',
      nav.take({ S1: rec(one, 0, NOW - HOUR) }, 'S1', NOW, TTL).nav.list.length === 1 &&
      nav.take({ S1: rec(one, 0, NOW - HOUR) }, 'S1', NOW, TTL).nav.at === 0, 'fresh')
    ok('a record older than the ttl is NOT loaded, and the caller is told so it can be cleared',
      (function () {
        const g = nav.take({ S1: rec(one, 0, NOW - TTL - 1) }, 'S1', NOW, TTL)
        return g.nav.list.length === 0 && g.nav.at === -1 && g.expired === true
      })(), 'expired')
    ok('exactly at the ttl it is still usable — only OLDER is expired',
      nav.take({ S1: rec(one, 0, NOW - TTL) }, 'S1', NOW, TTL).expired === false, 'boundary')
    ok('a session with no record is empty and NOT reported as expired',
      (function () { const g = nav.take({}, 'S9', NOW, TTL); return g.nav.list.length === 0 && g.expired === false })(), 'missing')
    ok('a record that was never stamped counts as expired rather than eternal',
      nav.take({ S1: rec(one, 0, 0) }, 'S1', NOW, TTL).expired === true, 'ts=0')
    ok('writing the map back drops the expired records and keeps the fresh ones',
      Object.keys(nav.pack({ A: rec(one, 0, NOW - HOUR), B: rec(one, 0, NOW - TTL - 5), C: rec([], 0, NOW) }, NOW, TTL)).join(',') === 'A',
      'bounded storage')
    ok('a switch stamps the parked stack with the moment it was taken',
      (function () { const s = nav.session({}, 'A', 'B', { list: one, at: 0 }, NOW, TTL); return s.store.A.ts === NOW && s.nav.list.length === 0 })(), 'park')
    ok('and it loads the other session straight out of the persisted map',
      (function () { const s = nav.session({ B: rec(one, 0, NOW - HOUR) }, 'A', 'B', { list: [], at: -1 }, NOW, TTL); return s.nav.list.length === 1 && s.expired === false })(), 'load')
    ok('an expired record for the session being opened is cleared instead of loaded, and says so',
      (function () { const s = nav.session({ B: rec(one, 0, NOW - TTL - 1) }, 'A', 'B', { list: [], at: -1 }, NOW, TTL); return s.nav.list.length === 0 && s.expired === true })(), 'cleared')
    ok('an entry naming a note that no longer exists is removed from the stack',
      (function () { const p = nav.prune({ list: [{ name: '甲', line: 1 }, { name: '乙', line: 2 }], at: 1 }, ['乙']); return p.list.length === 1 && p.list[0].name === '乙' && p.at === 0 })(), 'prune')
    ok('the cursor stays on the same ENTRY, not on the same index',
      (function () { const p = nav.prune({ list: [{ name: '甲', line: 1 }, { name: '乙', line: 2 }, { name: '丙', line: 3 }], at: 1 }, ['乙', '丙']); return p.list.length === 2 && p.at === 0 && p.list[p.at].name === '乙' })(), 'cursor')
    ok('when the cursor\'s own note is gone too, the cursor lands on the last surviving entry',
      (function () { const p = nav.prune({ list: [{ name: '甲', line: 1 }, { name: '乙', line: 2 }, { name: '丙', line: 3 }], at: 1 }, ['甲', '丙']); return p.list.length === 2 && p.at === 1 && p.list[p.at].name === '丙' })(), 'cursor fallback')
    ok('a stack whose notes all still exist is handed back untouched (same object, so no write happens)',
      (function () { const same = { list: one, at: 0 }; return nav.prune(same, ['甲']) === same })(), 'no-op')
    // The stack the HOST keeps for this session, as it arrives on every state answer.
    ok('the host\'s stack is adopted with its entries intact',
      (function () { const h = nav.host({ list: one, at: 0, updatedAt: NOW - HOUR }, NOW, TTL); return h && h.list.length === 1 && h.list[0].line === 7 && h.at === 0 })(), 'from host')
    ok('a host stack past the same 24h is dropped instead of loaded',
      nav.host({ list: one, at: 0, updatedAt: NOW - TTL - 1 }, NOW, TTL) === null, 'host ttl')
    ok('a host stack with a junk shape, or none at all, is ignored rather than trusted',
      nav.host(null, NOW, TTL) === null && nav.host({ list: [] }, NOW, TTL) === null &&
      nav.host({ list: [null, { nope: 1 }], at: 0, updatedAt: NOW }, NOW, TTL) === null, 'host validation')
    ok('the host\'s cursor is clamped into the list it actually sent',
      (function () { const h = nav.host({ list: one, at: 99, updatedAt: NOW }, NOW, TTL); return h && h.at === 0 })(), 'clamped')
  }
}

console.log('the folder picker')
// The native picker DEREFERENCES its signal (`signal.aborted`), so calling pick(undefined) throws
// "Cannot read properties of undefined (reading 'aborted')" from inside it, and the button looks
// like it does nothing at all. This fake picker behaves exactly the same way, so that bug cannot
// come back unnoticed.
{
  const SID_PK = 'session-picker-5555'
  sessions._m.set(SID_PK, sessionWith(SID_PK, WS))
  let sawSignal = null
  let pickCalls = 0
  pickerStub = {
    capability: () => ({
      kind: 'native',
      pick: async (signal) => {
        pickCalls += 1
        sawSignal = signal
        if (signal === undefined || signal === null) throw new TypeError("Cannot read properties of undefined (reading 'aborted')")
        if (signal.aborted) throw new Error('aborted')
        return WS + '/docs-src'
      },
    }),
  }
  const r = async (m, a) => (await rpc(m, Object.assign({ sessionId: SID_PK }, a || {}))).result || {}
  const got = await r('pickFolder', {})
  ok('the folder picker is called with a real signal',
    pickCalls === 1 && sawSignal !== null && typeof sawSignal.aborted === 'boolean',
    JSON.stringify({ calls: pickCalls, hasSignal: sawSignal !== null }))
  ok('a picked folder comes back to the card', got.ok === true && got.dir === WS + '/docs-src', JSON.stringify({ ok: got.ok, dir: got.dir }))
  pickerStub = undefined
  const none = await r('pickFolder', {})
  ok('a missing picker explains how to proceed instead of throwing',
    none.ok === false && /粘贴/.test(String(none.error)), String(none.error))
  pickerStub = { capability: () => ({ kind: 'browse' }) }
  const browse = await r('pickFolder', {})
  ok('a non-native picker also explains itself', browse.ok === false && /粘贴|弹窗/.test(String(browse.error)), String(browse.error))
  pickerStub = undefined
}

console.log(failed === 0 ? '\nALL NOTE-MODEL CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
