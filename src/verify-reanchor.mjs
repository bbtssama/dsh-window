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
import fsSync from 'node:fs'

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

// ── the two functions the warning badge offers ────────────────────────────────────────────────
// Reported need: a mark whose text was edited under it says 「原文已变动」, and the reader wants to
// decide what happens next — put the text BACK (an edit of the note), or ACCEPT the new text (a
// change of the mark's memory, no note edit). Both live behind the badge.
console.log('the two functions on a 「原文已变动」 mark (恢复原文 / 确认变动)')

const M1 = '甲 保留的一段'
const M2 = '乙 会被删掉的一段'
const M3 = '丙 也会删掉的一段'
const M4 = '丁 结尾'
const M5 = '   '
const staleBase = [M1, M2, M3, M4, M5].join('\n') + '\n'
const E1 = '甲 保留的一段'
const E2 = '乙 已经改过的一段的内容'
const E3 = '丙 已经换掉这里的内容'
const staleEdited = [E1, E2, E3, M4, M5].join('\n') + '\n'
files.set(NOTE, staleBase)
files.set(STATE, JSON.stringify({
  v: 1, seq: 3,
  selections: [
    { id: 'sel-gone', seq: 1, startLine: 2, startCol: 2, endLine: 2, endCol: 9, text: '会被删掉的一段', createdAt: 'x', color: 'yellow' },
    { id: 'sel-gone2', seq: 2, startLine: 3, startCol: 2, endLine: 3, endCol: 9, text: '也会删掉的一段', createdAt: 'x', color: 'green' },
    { id: 'sel-blank', seq: 3, startLine: 5, startCol: 0, endLine: 5, endCol: 3, text: '   ', createdAt: 'x', color: 'pink' },
  ],
}) + '\n')

const host4 = await import(new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href + '?v=4')
routeHandler = null
tools.clear()
host4.apply(ctx, {})
for (const fn of lateWiring.slice(3)) fn()
await tools.get('note_read').execute({}, { agent: { session: { header: { id: SID, cwd: ROOT } } } })
const st6 = await rpc('state', { revision: -1, sessionId: SID })
ok('the stale fixture loaded with its three marks', st6.result.selections.length === 3, String(st6.result.selections.length))

// Edit the two marked lines so their remembered text is gone: both marks go stale.
const saveStale = await rpc('saveText', { text: staleEdited, baseRevision: st6.result.revision, sessionId: SID })
ok('the edit that orphans those two marks was accepted', saveStale.result && saveStale.result.ok === true, JSON.stringify(saveStale.result && saveStale.result.error))
const st7 = await rpc('state', { revision: -1, sessionId: SID })
const st7by = {}
for (const s of st7.result.selections) st7by[s.id] = s
ok('a mark whose text was overwritten reports stale',
  st7by['sel-gone'] && st7by['sel-gone'].stale === true, JSON.stringify(st7by['sel-gone'] && st7by['sel-gone'].stale))
ok('and its neighbour does too, while the untouched whitespace mark does not',
  st7by['sel-gone2'] && st7by['sel-gone2'].stale === true && st7by['sel-blank'] && st7by['sel-blank'].stale === false,
  JSON.stringify({ g2: st7by['sel-gone2'] && st7by['sel-gone2'].stale, blank: st7by['sel-blank'] && st7by['sel-blank'].stale }))

// ── 确认变动 ──
const confirmed = await rpc('confirmSelection', { id: 'sel-gone', sessionId: SID })
ok('【确认变动】 is answered by the host', confirmed.result && confirmed.result.ok === true, JSON.stringify(confirmed.result && confirmed.result.error))
const afterConfirm = {}
for (const s of (confirmed.result && confirmed.result.selections) || []) afterConfirm[s.id] = s
const expectSlice = E2.slice(2, 9)
ok('it clears stale and makes the text under the mark the new remembered text',
  afterConfirm['sel-gone'] && afterConfirm['sel-gone'].stale === false && afterConfirm['sel-gone'].text === expectSlice,
  JSON.stringify(afterConfirm['sel-gone'] && { stale: afterConfirm['sel-gone'].stale, text: afterConfirm['sel-gone'].text, want: expectSlice }))
ok('it does NOT touch the note itself',
  files.get(NOTE) === staleEdited, JSON.stringify(String(files.get(NOTE)).slice(0, 24)))
const st8 = await rpc('state', { revision: -1, sessionId: SID })
ok('the confirmation survives a reload',
  st8.result.selections.filter((s) => s.id === 'sel-gone')[0].stale === false, 'from disk')

// ── 恢复原文 (the text the card would write, exercised through the real save) ──
const src = fsSync.readFileSync(new URL('./dynamic-client.js', import.meta.url), 'utf8')
const pureStart = src.indexOf('/* STALE-PURE-START */')
const pureEnd = src.indexOf('/* STALE-PURE-END */')
let splice = null
try {
  splice = new Function(src.slice(pureStart + '/* STALE-PURE-START */'.length, pureEnd) + '\nreturn staleRestoreText')()
} catch (err) { }
ok('the 恢复原文 text builder is extractable from the client source',
  typeof splice === 'function', String(pureStart) + ',' + String(pureEnd))
if (splice) {
  const mark2 = st7by['sel-gone2']
  const restored = splice(staleEdited, mark2)
  // The span the mark covers is replaced, the rest of that line is left alone — which is what the
  // orange band shows: cols 2..9 are the mark, `内容` beyond them is not.
  const restoredLine3 = '丙 也会删掉的一段内容'
  ok('it splices the remembered text back at the range the mark now has',
    typeof restored === 'string' && restored.split('\n')[2] === restoredLine3,
    JSON.stringify(restored && restored.split('\n').slice(1, 3)))
  ok('and the rest of the note is untouched',
    restored && restored.split('\n')[0] === E1 && restored.split('\n')[3] === M4, 'lines 1 and 4')
  ok('nothing to do when that range already holds the remembered text',
    splice(staleEdited, { startLine: 1, startCol: 0, endLine: 1, endCol: 1, text: '甲' }) === null, 'no-op')
  ok('a mark with no remembered text is refused instead of writing an empty string',
    splice(staleEdited, { startLine: 1, startCol: 0, endLine: 1, endCol: 1, text: '' }) === null, 'empty')
  const clamped = splice(staleEdited, { startLine: 999, startCol: 999, endLine: 999, endCol: 999, text: 'X' })
  ok('out-of-range coordinates are clamped rather than throwing',
    typeof clamped === 'string' && clamped.indexOf(staleEdited) === 0 && clamped.endsWith('X'),
    JSON.stringify(clamped && clamped.slice(-8)))
  // The end the reader actually gets: the client saves that text, and the host re-anchors on save,
  // which is what makes the mark stop being stale — no second mechanism involved.
  const back = await rpc('saveText', { text: restored, baseRevision: (await rpc('state', { revision: -1, sessionId: SID })).result.revision, sessionId: SID })
  ok('saving it back is accepted', back.result && back.result.ok === true, JSON.stringify(back.result && back.result.error))
  const st9 = await rpc('state', { revision: -1, sessionId: SID })
  const back2 = st9.result.selections.filter((s) => s.id === 'sel-gone2')[0]
  ok('bringing the text back clears stale by itself (the host re-anchors on every save)',
    back2 && back2.stale === false, JSON.stringify(back2 && back2.stale))
  ok('and the mark remembers the text that is really there again',
    back2 && back2.text === '也会删掉的一段', JSON.stringify(back2 && back2.text))
  ok('the note on disk carries the original phrase again',
    String(files.get(NOTE)).split('\n')[2] === restoredLine3, JSON.stringify(String(files.get(NOTE)).split('\n')[2]))
}

// ── 确认变动 refuses what it cannot do honestly ──
const blank = await rpc('confirmSelection', { id: 'sel-blank', sessionId: SID })
ok('confirming a mark that now covers only whitespace fails with a reason',
  blank.result && blank.result.ok === false && /空白/.test(String(blank.result.error)), JSON.stringify(blank.result && blank.result.error))
const missingConfirm = await rpc('confirmSelection', { id: 'sel-does-not-exist', sessionId: SID })
ok('confirming an unknown mark answers found:false instead of pretending',
  missingConfirm.result && missingConfirm.result.ok === false && missingConfirm.result.found === false,
  JSON.stringify(missingConfirm.result && { ok: missingConfirm.result.ok, found: missingConfirm.result.found }))

// ── the stack the HOST keeps for the session (what a reload picks up) ─────────────────────────
// Browser storage is a fast path, not the truth: the reported "刷新后栈就没了" could not be told apart
// from a browser that refuses storage at all, so the stack now lives in the session's own file and
// rides every state answer — the same channel the reading position and the mark lists already use.
console.log('the visit stack is persisted by the HOST (no browser storage involved)')

const sessFile = ROOT + '/dsh-window/note/' + SID + '/.session.json'
const sn1 = await rpc('saveNav', { sessionId: SID, list: [{ name: 'note', line: 42 }, { name: 'note', line: 7 }], at: 1 })
ok('saveNav is answered by the host', sn1.result && sn1.result.ok === true && sn1.result.entries === 2, JSON.stringify(sn1.result))
ok('and the stack reached the session file',
  /"nav"/.test(String(files.get(sessFile))) && /"line": 42/.test(String(files.get(sessFile))),
  String(files.get(sessFile)).slice(0, 120))
const stN = await rpc('state', { revision: -1, sessionId: SID })
ok('the state answer carries it back, entries and cursor intact',
  stN.result && stN.result.nav && stN.result.nav.list.length === 2 &&
  stN.result.nav.list[0].line === 42 && stN.result.nav.at === 1,
  JSON.stringify(stN.result && stN.result.nav))
// The open note and the stack share one file: any other write of it must keep the stack.
const kept = await (async () => { await rpc('selectNote', { sessionId: SID, name: 'note' }); return String(files.get(sessFile)) })()
ok('another session-file write keeps the stack intact',
  /"nav"/.test(kept) && /"line": 42/.test(kept), kept.slice(0, 120))
const many = [{ name: '../evil', line: 1 }]
for (let i = 0; i < 60; i++) many.push({ name: 'n' + i, line: i + 1 })
const capped = await rpc('saveNav', { sessionId: SID, list: many, at: 999 })
ok('a name that could escape the session subtree is dropped and the list is capped at 50',
  capped.result && capped.result.ok === true && capped.result.entries === 50, JSON.stringify(capped.result))
// The reported bug, exactly: on every page load the card's own stack is empty until the state answer
// hands the saved one back, and it used to write that emptiness out — erasing the stack every refresh.
const emptyWrite = await rpc('saveNav', { sessionId: SID, list: [], at: -1 })
const afterEmpty = await rpc('state', { revision: -1, sessionId: SID })
ok('an EMPTY stack never erases what the host already keeps',
  emptyWrite.result && emptyWrite.result.ok === true && emptyWrite.result.ignored === true &&
  afterEmpty.result.nav && afterEmpty.result.nav.list.length === 50,
  JSON.stringify({ write: emptyWrite.result, kept: afterEmpty.result.nav && afterEmpty.result.nav.list.length }))

// A jump is an EVENT: the nonce alone cannot tell the card "this happened while you were watching",
// which is what let a stale nonce push a phantom entry (and wipe a recorded line) on every return.
const j1 = await rpc('saveView', { sessionId: SID, line: 12, anchor: 'x', jump: true })
const stJ = await rpc('state', { revision: -1, sessionId: SID })
ok('a jump carries a monotonic nonce AND the moment it happened',
  stJ.result.view && stJ.result.view.jump === 1 && typeof stJ.result.view.jumpAt === 'number' && stJ.result.view.jumpAt > 0,
  JSON.stringify(stJ.result.view) + ' save=' + JSON.stringify(j1.result))
const j2 = await rpc('saveView', { sessionId: SID, line: 30, anchor: 'y' })
const stJ2 = await rpc('state', { revision: -1, sessionId: SID })
ok('a plain scroll moves the line but keeps both the nonce and its timestamp',
  stJ2.result.view.line === 30 && stJ2.result.view.jump === 1 && stJ2.result.view.jumpAt === stJ.result.view.jumpAt,
  JSON.stringify(stJ2.result.view))

console.log(failed === 0 ? '\nALL RE-ANCHOR CHECKS PASSED' : '\n' + failed + ' CHECK(S) FAILED')
process.exit(failed === 0 ? 0 : 1)
