/**
 * Self-test for the built permanent bundle. Runs both halves against mock
 * contexts, so the two seams this port actually changed are proven in Node
 * before a DSH restart is requested:
 *
 *   host   tool registration (ctx.tools.register + defineTool) and the
 *          /plugins/dsh-window/rpc dispatch route
 *   client the __ModuleLoader__ contract, the slots registration, the owned
 *          stylesheet, and the fetch-based host.call shim
 *
 * Run: node src/selftest.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
// Test what is actually installed by default: the source tree cannot resolve
// `@deepseek-ai/dsh-tools`, only the profile's node_modules copy can.
const lib = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join('D:\\DSH\\profiles\\web\\node_modules\\dsh-window\\lib')

let failed = 0
const ok = (label, condition, detail) => {
  if (condition) console.log('  PASS  ' + label)
  else { failed++; console.log('  FAIL  ' + label + (detail === undefined ? '' : '  -> ' + detail)) }
}

// ─────────────────────────────────────────────────────────── host half ──
console.log('host half')

const hostUrl = new URL('file:///' + path.join(lib, 'index.js').replace(/\\/g, '/')).href
const hostModule = await import(hostUrl)
ok('exports name/inject/apply', hostModule.name === 'dsh-window' && hostModule.apply instanceof Function && Array.isArray(hostModule.inject), Object.keys(hostModule).join(','))

// ── the boot path a composition actually takes ───────────────────────────────
// A profile row is applied with the `config:` its composition carries — not with
// nothing. This block used to call apply(ctx) bare, so a config-only crash stayed
// invisible here and only appeared when the real profile booted with
// `noteDir: dsh-note` and took the entire plugin tree down with
// "NOTE_DIR is not defined" (`dsh web` would not start at all).
console.log('boot path')

/** Pull the note-card row's `config:` mapping out of a composition patch. */
function readNoteCardConfig(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n')
  const at = lines.findIndex((l) => /^\s*config\s*:\s*$/.test(l))
  if (at < 0) return {}
  const indent = lines[at].match(/^\s*/)[0].length
  const spec = {}
  for (let i = at + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || /^\s*#/.test(line)) continue
    if (line.match(/^\s*/)[0].length <= indent) break
    const m = /^\s*([A-Za-z_$][\w$]*)\s*:\s*(.+?)\s*$/.exec(line)
    if (m) spec[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return spec
}

/** The smallest ctx that lets apply() run its whole prologue to completion. */
function bootCtx() {
  return {
    // `inject = ['tools']` means cordis hands this in before apply runs.
    tools: { register: () => () => { } },
    get: () => undefined,
    on: () => () => { },
    effect: (fn) => { try { return fn() } catch (err) { return undefined } },
  }
}

const patchPath = path.join(path.resolve(lib, '..'), 'cordis.patch.yml')
ok('the shipped composition patch sits next to the bundle', fs.existsSync(patchPath), patchPath)
const compositionConfig = fs.existsSync(patchPath) ? readNoteCardConfig(fs.readFileSync(patchPath, 'utf8')) : {}
console.log('  config: ' + JSON.stringify(compositionConfig))

for (const [label, config] of [
  ['the shipped composition config', compositionConfig],
  ['no config at all', undefined],
  // An already-installed older patch file may still carry the retired names; the
  // plugin must shrug them off rather than die while the tree is loading.
  ['a retired legacy config', { noteDir: 'dsh-note', noteFile: 'note.md' }],
]) {
  let failure = null
  try { hostModule.apply(bootCtx(), config) } catch (err) { failure = err && err.message ? err.message : String(err) }
  ok('apply() boots through ' + label, failure === null, failure)
}

const registeredTools = []
const registeredRoutes = []
const registeredSections = []
const serviceListeners = []
const toolsService = { register: (tool) => { registeredTools.push(tool); return () => { } } }
const webServerService = { register: (route) => { registeredRoutes.push(route); return () => { } } }
const systemPromptService = { section: (spec) => { registeredSections.push(spec); return () => { } } }
// `webServer` and `systemPrompt` are deliberately ABSENT at apply time: a
// permanent row mounts during composition, before those services exist. This
// reproduces the live failure where every RPC answered "fs 服务不可用" because
// the services had been captured once as undefined.
let webServerUp = false
let systemPromptUp = false
// Faithful to Cordis: an injected service is readable as ctx.<name>, which is
// what `export const inject = ['tools']` buys the host half.
const SELFTEST_SID = 'session-selftest-0001'
const SELFTEST_WS = 'C:/WS/selftest'

const hostCtx = {
  tools: toolsService,
  get(name) {
    if (name === 'tools') return toolsService
    if (name === 'webServer' && webServerUp) return webServerService
    if (name === 'systemPrompt' && systemPromptUp) return systemPromptService
    // A minimal session + policy pair, so the state contract can be checked for a real
    // session: the session id is the note-space path segment and must resolve.
    if (name === 'sessions') return { get: (id) => (id === SELFTEST_SID ? { header: { id, cwd: SELFTEST_WS } } : null) }
    if (name === 'sandboxPolicy') return { workspaceRoot: SELFTEST_WS, resolve: () => ({ workspaceRoot: SELFTEST_WS }) }
    return undefined
  },
  effect(fn) { try { return fn() } catch (err) { return undefined } },
  on(name, fn) { serviceListeners.push({ name, fn }); return () => { } },
}

hostModule.apply(hostCtx)

ok('route is not registered while webServer is absent', registeredRoutes.length === 0, String(registeredRoutes.length))
ok('prompt section is not registered while systemPrompt is absent', registeredSections.length === 0, String(registeredSections.length))
ok('subscribes to internal/service for late wiring', serviceListeners.some((l) => l.name === 'internal/service'), serviceListeners.map((l) => l.name).join(','))

// now the services appear, exactly as they do a moment after boot
webServerUp = true
systemPromptUp = true
for (const listener of serviceListeners) listener.fn('webServer')
ok('routes register once webServer appears', registeredRoutes.length === 3, String(registeredRoutes.length))
ok('prompt section registers once systemPrompt appears', registeredSections.length === 1, String(registeredSections.length))
ok('prompt section carries usage text', registeredSections[0] && typeof registeredSections[0].text === 'string' && registeredSections[0].text.includes('note_mark_new'), registeredSections[0] ? registeredSections[0].text.length + ' chars' : 'n/a')
// idempotent: a second appearance must not double-register
for (const listener of serviceListeners) listener.fn('webServer')
ok('re-firing the service event does not double-register', registeredRoutes.length === 3 && registeredSections.length === 1, registeredRoutes.length + '/' + registeredSections.length)

const toolNames = registeredTools.map((tool) => tool.name).sort()
// The names are the §P1-9 converged surface: `note_` + one of note / mark / card / rev-delta,
// one concept per name (note_append and note_replace are the old note_import's two halves).
const expectedTools = ['note_commit', 'note_mark_list', 'note_read', 'note_mark_new', 'note_write', 'note_list', 'note_create', 'note_open', 'note_clear_keep_history', 'note_delete_forever', 'note_rename', 'note_append', 'note_replace', 'note_export', 'note_patch', 'note_diff', 'note_status', 'note_mark_lists', 'note_folder_import']
ok('registers the note_* tools', expectedTools.every((name) => toolNames.includes(name)), toolNames.join(','))
ok('and nothing but note_* tools', toolNames.every((name) => name.indexOf('note_') === 0), toolNames.filter((n) => n.indexOf('note_') !== 0).join(','))
console.log('  tools : ' + toolNames.join(', '))
ok('every tool has a JSON Schema + render', registeredTools.every((tool) => tool.parameters && tool.output && tool.output.schema && typeof tool.output.render === 'function'))

ok('registers the rpc + vendor file + vendor prefix routes', registeredRoutes.length === 3, registeredRoutes.map((r) => r.path).join(' '))
const route = registeredRoutes[0]
ok('route path is /plugins/dsh-window/rpc', route && route.path === '/plugins/dsh-window/rpc', route && route.path)
ok('route is an exact match', route && route.kind === 'exact', route && route.kind)
ok('route has a handler', route && route.handler instanceof Function)
const vendorRoute = registeredRoutes[1]
ok('vendor route serves mermaid from node_modules', vendorRoute && vendorRoute.path === '/plugins/dsh-window/vendor/mermaid.min.js' && vendorRoute.handler instanceof Function, vendorRoute && vendorRoute.path)

/** Drive the route handler with a synthetic request and collect the reply. */
async function rpc(method, args, httpMethod = 'POST') {
  const req = new EventEmitter()
  req.method = httpMethod
  let status = 0
  let body = ''
  const res = {
    writeHead(code) { status = code },
    end(chunk) { body = chunk === undefined ? '' : String(chunk) },
  }
  const pending = Promise.resolve(route.handler(req, res))
  if (httpMethod === 'POST') {
    req.emit('data', Buffer.from(JSON.stringify({ method, args })))
    req.emit('end')
  }
  await pending
  let parsed = null
  try { parsed = JSON.parse(body) } catch (err) { parsed = null }
  return { status, parsed, raw: body }
}

const notPost = await rpc('state', null, 'GET')
ok('rejects a non-POST request with 405', notPost.status === 405, String(notPost.status))

// A UTF-8 BOM in a shipped file is not cosmetic: dsh JSON.parses each bundle's package.json
// while composing the profile, and JSON.parse rejects a BOM, so ONE BOM makes `dsh web` die
// with "… is not valid JSON" and the whole harness never boots. That happened for real (a
// PowerShell `Set-Content -Encoding utf8` version bump wrote one), so every shipped file —
// in the repo AND in the installed copy, which is what the profile actually loads — is
// checked here, together with the profile manifest that lists this bundle.
const repoRoot = path.resolve(here, '..')
const installedRoot = path.resolve(lib, '..')
const profileRoot = path.resolve(lib, '..', '..', '..')
const bomFiles = []
const checkBom = (file, label) => {
  let bytes = null
  try { bytes = fs.readFileSync(file) } catch (err) { return }
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) bomFiles.push(label)
}
const exists = (file) => { try { return fs.statSync(file).isFile() } catch (err) { return false } }
for (const rel of ['package.json', 'cordis.patch.yml', 'README.md', 'lib/index.js', 'lib/client.js']) {
  checkBom(path.join(repoRoot, rel), 'repo ' + rel)
  checkBom(path.join(installedRoot, rel), 'installed ' + rel)
}
checkBom(path.join(profileRoot, 'package.json'), 'profile manifest')
ok('no shipped file carries a UTF-8 BOM', bomFiles.length === 0, bomFiles.length ? bomFiles.join(', ') : 'clean')
// The exact file dsh parses at boot: parse it the same way it does.
const installedManifest = path.join(installedRoot, 'package.json')
if (exists(installedManifest)) {
  let why = ''
  try { JSON.parse(fs.readFileSync(installedManifest, 'utf8')) } catch (err) { why = String((err && err.message) || err) }
  ok('the installed package.json parses as JSON (dsh does this at boot)', why === '', why || 'ok')
}
// The profile runs the INSTALLED copy, so "the tests are green" only means something if that
// copy is the one this build produced. It has been otherwise: a local diagnostic patched the
// installed bundle with probe instrumentation (including a `throw`), and every check here kept
// passing against a repo build the harness was not actually loading.
const drifted = []
for (const rel of ['lib/index.js', 'lib/client.js', 'package.json', 'cordis.patch.yml']) {
  const a = path.join(repoRoot, rel)
  const b = path.join(installedRoot, rel)
  if (!exists(a) || !exists(b)) continue
  if (!fs.readFileSync(a).equals(fs.readFileSync(b))) drifted.push(rel)
}
ok('the installed copy is byte-identical to this build', drifted.length === 0,
  drifted.length ? 'differs: ' + drifted.join(', ') + ' — run: node src/install.mjs' : 'index.js / client.js / package.json / cordis.patch.yml')
const installedHostSrc = fs.readFileSync(path.join(installedRoot, 'lib', 'index.js'), 'utf8')
const probeMarkers = ['DWPROBE', '__PROBE', 'probe.log'].filter((m) => installedHostSrc.indexOf(m) >= 0)
ok('the installed host carries no probe instrumentation', probeMarkers.length === 0, probeMarkers.join(',') || 'clean')


const unknown = await rpc('no_such_method', {})
ok('answers an unknown method with 404 + ok:false', unknown.status === 404 && unknown.parsed && unknown.parsed.ok === false, unknown.raw.slice(0, 90))

const stateCall = await rpc('state', { revision: -1, sessionId: SELFTEST_SID })
ok('dispatches a real method and returns { ok, result }', stateCall.status === 200 && stateCall.parsed && stateCall.parsed.ok === true && typeof stateCall.parsed.result === 'object', stateCall.raw.slice(0, 120))
const view = stateCall.parsed && stateCall.parsed.result
ok('state view carries the note contract', view && 'text' in view && Array.isArray(view.selections) && 'revision' in view && 'notes' in view && 'active' in view, view && Object.keys(view).slice(0, 8).join(','))
ok('state view reports the session note space', view && typeof view.notesDir === 'string' && view.notesDir.indexOf(SELFTEST_SID) > 0, JSON.stringify(view && view.notesDir))

// A caller that names no session cannot be served: the session id IS the note-space
// path now, so there is nothing to resolve. Regression guard for accidental activation.
const idleCall = await rpc('state', { revision: -1, sessionId: '' })
const idleView = idleCall.parsed && idleCall.parsed.result
ok('a caller without a session id is refused, not guessed',
  idleView && idleView.ok === false && idleView.error === 'no-session',
  JSON.stringify(idleView && { ok: idleView.ok, error: idleView.error }))
ok('a caller without a session id cannot mutate anything',
  (await rpc('saveText', { text: 'x', sessionId: '' })).parsed.result.ok === false &&
  (await rpc('addSelection', { sessionId: '' })).parsed.result.ok === false &&
  (await rpc('createNote', { name: 'x', sessionId: '' })).parsed.result.ok === false,
  'write RPCs answered ok:false')

// The implicit adoption path must be gone: "exactly one live agent" used to be enough
// to claim a session, which is what made the card appear in unrelated sessions.
// Comments legitimately mention the removed names, so strip them before asserting.
const hostSource = fs.readFileSync(path.join(lib, 'index.js'), 'utf8')
const hostCode = hostSource.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
ok('no implicit session adoption remains',
  !/\bownFromAgents\b/.test(hostCode) && !/\bcurrentInitiator\b/.test(hostCode) && !/\bcandidateFromLiveAgents\b/.test(hostCode),
  'ownFromAgents/currentInitiator/candidateFromLiveAgents absent from the host code')
// A retired identifier must not survive in executable code: the crash this guards
// against ("NOTE_DIR is not defined") came from build.mjs still emitting an assignment
// to a name the storage model had dropped. Comments may mention it; code may not.
const retiredNames = ['NOTE_DIR', 'noteDir', 'adoptFromExec', 'ownFromAgents', 'foreignCaller', 'ownerIsLive']
const leaked = retiredNames.filter((n) => new RegExp('\\b' + n + '\\b').test(hostCode))
ok('no retired identifier survives in shipped code', leaked.length === 0, leaked.join(','))

ok('every note tool resolves its workspace explicitly and loudly',
  (hostSource.match(/await enterFromTool\('note_/g) || []).length === 32,
  String((hostSource.match(/await enterFromTool\('note_/g) || []).length) + ' guarded tool entry points')

// The panel and the host must agree on method names, and every note-space call must
// identify its session — the session id IS the path, so a call without one has no target.
const clientSource2 = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
const clientCalls = [...new Set((clientSource2.match(/host\.call\('([a-zA-Z]+)'/g) || []).map((m) => /'([a-zA-Z]+)'/.exec(m)[1]))]
const hostMethods = [...new Set((hostSource.match(/handleLocked\('([a-zA-Z]+)'/g) || []).map((m) => /'([a-zA-Z]+)'/.exec(m)[1]))]
const missingOnHost = clientCalls.filter((m) => !hostMethods.includes(m))
ok('every RPC the card calls exists on the host',
  missingOnHost.length === 0,
  missingOnHost.length ? 'missing: ' + missingOnHost.join(',') : clientCalls.length + ' card RPCs vs ' + hostMethods.length + ' host handlers')
const sessionScoped = ['state', 'saveText', 'addSelection', 'removeSelection', 'clearSelections', 'commit', 'listNotes', 'createNote', 'selectNote', 'clearNote', 'deleteNote', 'renameNote', 'importNote']
const unscoped = sessionScoped.filter((m) => clientCalls.includes(m) && !new RegExp("host\\.call\\('" + m + "',[\\s\\S]{0,120}?sessionId").test(clientSource2))
ok('every note-space RPC carries the session id',
  unscoped.length === 0,
  unscoped.length ? 'no sessionId: ' + unscoped.join(',') : sessionScoped.length + ' scoped methods checked')

// A selection can cover source lines that own no element of their own: a table's header
// and separator rows are drawn as part of its first body row, and a blank source line is
// legitimately selected as the whole line (range 0..0). Without both fallbacks the card
// tinted some lines of a multi-line selection and nothing on the others — the reported
// "我选了 141 到 168 行，渲染出来竟然只有这几行". Verified in the live page: with the
// fallbacks a 6→24 selection paints every blank line, the --- rule and all table rows.
ok('a selected line with no element of its own paints its owning block instead',
  /blockRangeAt\(ln\)/.test(clientSource2) && /for \(let probe = blk\.from/.test(clientSource2),
  'absorbed lines (table header/separator) fall back to the block that contains them')
ok('a blank line inside a selection is tinted rather than suppressed',
  /rawLine\.trim\(\) !== ''/.test(clientSource2),
  'an empty source line stays paintable inside a multi-line selection')

// Durability: mutations are serialized (AgentTeams' withTeamLock) and every write
// carries a version guard, so an external edit is detected rather than overwritten.
ok('mutations are serialized through one note lock',
  /function withNoteLock\(/.test(hostCode) && (hostCode.match(/withNoteLock\(noteLockKey\(\)/g) || []).length >= 15,
  String((hostCode.match(/withNoteLock\(noteLockKey\(\)/g) || []).length) + ' locked entry points')
ok('writes carry a compare-and-swap version guard',
  /replaceIfVersion/.test(hostCode) && /FS_STALE_VERSION/.test(hostCode),
  'replaceIfVersion + FS_STALE_VERSION present')
ok('an incidental probe cannot move the write basis',
  /async function existsAt\(/.test(hostCode) && /readIfExists\(path, opts\)/.test(hostCode),
  'existsAt() + track-only readIfExists present')

// ───────────────────────────────────────────────────────── client half ──
console.log('client half')

const clientSource = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
const styleTags = []
const slotRegistrations = []
const fakeDocument = {
  querySelector: () => null,
  createElement: () => ({ setAttribute() { }, remove() { }, textContent: '' }),
  head: { appendChild: (tag) => { styleTags.push(tag) } },
}
let loaded = null
const fakeWindow = { __ModuleLoader__: { load: (spec) => { loaded = spec } } }

const requireStub = createRequire(path.join(lib, 'index.js'))
const factory = new Function('window', 'document', 'require', 'console', clientSource)
factory(fakeWindow, fakeDocument, requireStub, console)

ok('calls window.__ModuleLoader__.load', loaded !== null)
ok('declares the package id', loaded && loaded.id === 'dsh-window', loaded && loaded.id)
ok('factory is a function', loaded && loaded.factory instanceof Function)

const clientModule = loaded.factory(requireStub)
ok('exports apply + inject', clientModule.apply instanceof Function && Array.isArray(clientModule.inject), Object.keys(clientModule).join(','))
ok('waits for the slots and timer services', clientModule.inject.includes('slots') && clientModule.inject.includes('timer'), clientModule.inject.join(','))

const clientCtx = {
  effect(fn) { try { return fn() } catch (err) { return undefined } },
  timeout: () => () => { },
  interval: () => () => { },
  get(name) {
    if (name !== 'slots') return undefined
    return {
      inject: (slotName, cb) => cb(),
      register: (options, component) => { slotRegistrations.push({ options, component }); return () => { } },
    }
  },
}

clientModule.apply(clientCtx)

ok('injects one stylesheet into document.head', styleTags.length === 1, String(styleTags.length))
const css = styleTags[0] && styleTags[0].textContent
ok('stylesheet carries the .dn-root rules', typeof css === 'string' && css.includes('.dn-root{') && css.includes('.dn-hlo{'), typeof css === 'string' ? css.length + ' chars' : String(css))

const reg = slotRegistrations[0]
ok('registers into shell.overlay', reg && reg.options.name === 'shell.overlay', reg && reg.options.name)
ok('registers under the note-card key', reg && reg.options.id === 'note-card', reg && JSON.stringify(reg.options))
ok('registers a component function', reg && reg.component instanceof Function)

// ── render smoke test ──
// A dependency array is evaluated during render, so this is what catches the
// "Cannot access 'geo' before initialization" class of bug: apply() alone never
// renders, and the browser reported it as a slot crash long after a clean build.
let ReactDOMServer = null
let reactVersion = ''
let domVersion = ''
const versionOf = (spec) => {
  try {
    let dir = requireStub.resolve(spec)
    for (let i = 0; i < 6 && dir !== path.dirname(dir); i++) {
      const pkg = path.join(dir, 'package.json')
      if (fs.existsSync(pkg)) return JSON.parse(fs.readFileSync(pkg, 'utf8')).version
      dir = path.dirname(dir)
    }
  } catch (err) { }
  return ''
}
try { ReactDOMServer = requireStub('react-dom/server') } catch (err) { ReactDOMServer = null }
if (ReactDOMServer !== null) { reactVersion = versionOf('react'); domVersion = versionOf('react-dom') }

if (ReactDOMServer === null) {
  console.log('  SKIP  component renders without throwing (react-dom/server not resolvable)')
} else if (!reg || !(reg.component instanceof Function)) {
  console.log('  SKIP  component renders without throwing (no registered component)')
} else {
  const React = requireStub('react')
  let html = null
  let renderError = null
  try {
    html = ReactDOMServer.renderToStaticMarkup(React.createElement(reg.component, {}))
  } catch (err) {
    renderError = err && err.message ? err.message : String(err)
  }
  // This deployment hoists react 18 while a nested plugin ships react-dom 19;
  // react-dom 19's server renderer rejects react 18 elements, which would read
  // as a plugin bug. Only that mismatch is excused — every other throw, which is
  // where a render-time ReferenceError (the "geo" TDZ crash) lands, still fails.
  const major = (v) => String(v).split('.')[0]
  const crossMajor = reactVersion !== '' && domVersion !== '' && major(reactVersion) !== major(domVersion)
  const versionArtifact = crossMajor && renderError !== null && /not valid as a React child/.test(renderError)
  if (versionArtifact) {
    console.log('  SKIP  component renders without throwing (react ' + reactVersion + ' vs react-dom ' + domVersion + ' copy mismatch)')
  } else {
    ok('component renders without throwing', renderError === null, renderError)
    // No state yet on a cold start, so the card renders nothing until the first
    // /state reply lands — an empty string here is the correct initial output.
    ok('cold render produces no markup (waiting for state)', renderError === null && typeof html === 'string', html === null ? 'n/a' : JSON.stringify(html.slice(0, 60)))
  }
}

console.log('')
console.log('client render: marks that live in the text')// The italic/underline renderer is pure arithmetic over a mark list plus a rendered text span,
// so it is testable without a browser. This is the part that decides WHICH characters carry
// WHICH style, and getting it wrong paints the wrong words.
{
  const src = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
  const extract = (name) => {
    const at = src.indexOf('function ' + name + '(')
    if (at < 0) return ''
    let depth = 0
    for (let k = src.indexOf('{', at); k < src.length; k++) {
      const c = src[k]
      if (c === '{') depth++
      else if (c === '}') { depth--; if (depth === 0) return src.slice(at, k + 1) }
    }
    return ''
  }
  const fns = ['markLook', 'textStyleRuns', 'textStyleSegments'].map(extract)
  ok('the style renderer is present in the shipped client',
    fns.every((f) => f.length > 40) && src.indexOf('data-mkid') > 0 && src.indexOf("'.dn-mki{font-style:italic;}'") > 0,
    fns.map((f) => f.length).join('/') + ' chars extracted')
  let api = null
  try {
    api = eval('(function(){' + fns.join('\n') + '\nreturn { markLook: markLook, textStyleRuns: textStyleRuns, textStyleSegments: textStyleSegments }})()')
  } catch (err) { api = null }
  ok('the style helpers evaluate standalone', api !== null, api === null ? 'eval failed' : 'ok')
  if (api !== null) {
    const { markLook, textStyleRuns, textStyleSegments } = api
    // The three dimensions are independent: a plain mark has no text styles, a legacy `style`
    // field still describes one, and the two flags win when they are present.
    ok('a mark with no flags carries no text style',
      markLook({}).italic === false && markLook({}).underline === false && markLook({ style: 'junk' }).italic === false,
      JSON.stringify([markLook({}), markLook({ style: 'junk' })]))
    ok('the retired single style field still describes a mark',
      markLook({ style: 'italic' }).italic === true && markLook({ style: 'underline' }).underline === true && markLook({ style: 'both' }).italic === true && markLook({ style: 'both' }).underline === true,
      JSON.stringify([markLook({ style: 'italic' }), markLook({ style: 'both' })]))
    ok('the two flags are read independently and can both be on',
      markLook({ italic: true, underline: false }).italic === true && markLook({ italic: true, underline: false }).underline === false && markLook({ italic: true, underline: true }).underline === true,
      JSON.stringify([markLook({ italic: true }), markLook({ italic: true, underline: true })]))
    const sels = [
      { id: 'a', italic: true, startLine: 2, startCol: 3, endLine: 2, endCol: 8 },
      { id: 'b', underline: true, startLine: 2, startCol: 6, endLine: 4, endCol: 2 },
      { id: 'c', italic: true, underline: true, startLine: 2, startCol: 0, endLine: 2, endCol: 2 },
    ]
    const runs = textStyleRuns(sels)
    ok('one run per flag, keyed by line',
      Object.keys(runs.byLine).join(',') === '2,3,4' && runs.byLine[2].length === 4 && runs.byLine[3].length === 1,
      JSON.stringify({ lines: Object.keys(runs.byLine), per: runs.byLine[2].length }))
    const seg = textStyleSegments(runs.byLine[2], 3, 5)
    ok('a span is split at the run boundaries, and one mark can stack both styles',
      seg !== null && seg.map((s) => s.off + '+' + s.len + ':' + s.styles.join('&')).join(' ') === '0+3:italic 3+2:italic&underline',
      seg === null ? 'null' : seg.map((s) => s.off + '+' + s.len + ':' + s.styles.join('&')).join(' '))
    ok('overlapping marks of different styles stack on the same characters',
      textStyleSegments(runs.byLine[2], 6, 2).every((s) => s.styles.length === 2 && s.ids.length === 2),
      JSON.stringify(textStyleSegments(runs.byLine[2], 6, 2)))
    ok('a line in the middle of a multi-line mark is fully covered',
      textStyleSegments(runs.byLine[3], 0, 50).every((s) => s.styles.indexOf('underline') >= 0),
      JSON.stringify(textStyleSegments(runs.byLine[3], 0, 1)))
    ok('a span outside every run is left alone', textStyleSegments(runs.byLine[4], 5, 20) === null, 'null')
    ok('an empty span is never styled', textStyleSegments(runs.byLine[2], 3, 0) === null, 'null')
  }
}

console.log('')
console.log('client render: in-place editing (the mirror layer under the transparent textarea)')
// The mirror layer is what makes a code block editable WITH its colours: the textarea that receives
// the keystrokes has transparent glyphs, and every visible character comes from this HTML. So the
// escaping and the "one span per token, never an empty span" rule are correctness, not cosmetics —
// an unescaped `<` or a dropped space would put the caret on a character that is not there.
{
  const src = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
  const inline = /\/\* INLINE-PURE-START \*\/([\s\S]*?)\/\* INLINE-PURE-END \*\//.exec(src)
  ok('the inline-editing helpers ship with the card', inline !== null && inline[1].indexOf('function codeLineHtml(') > 0, inline === null ? 'markers missing' : inline[1].length + ' chars')
  let api = null
  try {
    api = eval('(function(){' + (inline ? inline[1] : '') + '\nreturn { escHtml: escHtml, codeLineHtml: codeLineHtml, textLineHtml: textLineHtml, inlineLinesOf: inlineLinesOf }})()')
  } catch (err) { api = null }
  ok('and they evaluate standalone', api !== null, api === null ? 'eval failed' : 'ok')
  if (api !== null) {
    const { escHtml, codeLineHtml, textLineHtml, inlineLinesOf } = api
    ok('markup in the source is escaped, never injected',
      escHtml('<b>&"') === '&lt;b&gt;&amp;"' && textLineHtml('a < b') === 'a &lt; b',
      escHtml('<b>&"'))
    const fake = (line) => [{ t: 'public', cls: 'tk-k', off: 0 }, { t: ' ', off: 6 }, { t: 'x', cls: 'tk-n', off: 7 }]
    ok('a code line becomes one span per token, and the plain runs survive',
      codeLineHtml('public x', 'java', fake) === '<span class="dn-i tk-k" data-soff="0">public</span><span class="dn-i" data-soff="6"> </span><span class="dn-i tk-n" data-soff="7">x</span>',
      codeLineHtml('public x', 'java', fake))
    ok('a tokenizer that returns nothing never loses the line',
      codeLineHtml('a<b', 'java', () => []) === '<span class="dn-i">a&lt;b</span>' &&
      codeLineHtml('a<b', 'text', null) === '<span class="dn-i">a&lt;b</span>',
      codeLineHtml('a<b', 'java', () => []))
    ok('every code span carries the source offset the mark overlay measures against',
      codeLineHtml('public x', 'java', fake).indexOf('data-soff="7"') > 0,
      codeLineHtml('public x', 'java', fake))
    ok('an empty line is a non-breaking space, so the caret has something to sit on',
      codeLineHtml('', 'java', () => []) === '\u00a0' && textLineHtml('') === '\u00a0', 'nbsp')
    ok('the buffer is split exactly the way the textarea splits it',
      inlineLinesOf('a\nb\n').length === 3 && inlineLinesOf('a\nb\n')[2] === '' && inlineLinesOf('one').length === 1,
      JSON.stringify(inlineLinesOf('a\nb\n')))
  }
  // …and the wiring has to be there, or the helpers are dead code: the editor is used for text and
  // code blocks, the click gesture enters it, and the caret offset is translated into the buffer.
  ok('the in-place editor is wired into the block renderer',
    src.indexOf('h(InlineEditor, shared)') > 0 && src.indexOf('dn-li-body dn-inl dn-inl-text') > 0 &&
    src.indexOf('startInlineEdit(pointToPos(') > 0 && src.indexOf('function bufferInlineEdit(') > 0,
    'InlineEditor/renderBlocks/startInlineEdit present')
  ok('a table and a mermaid block keep the plain source box',
    /inPlace = b\.k === 'code' \? \(String\(b\.lang \|\| ''\)\.toLowerCase\(\) !== 'mermaid'\)/.test(src),
    'mermaid excluded from in-place editing')
  ok('the two layers share every metric that decides where a glyph lands',
    src.indexOf('.dn-inl-ta-code{padding:8px 10px;') > 0 && src.indexOf('border:1px solid transparent;box-sizing:border-box') > 0 &&
    src.indexOf('.dn-inl-ta{') > 0 && src.indexOf('color:transparent;caret-color:') > 0,
    'shared metrics present')
}

console.log('')
console.log('settings: the edit gesture is a choice (单击 or 双击), default 双击')
// The single-click gesture is opt-in. The default must be the SAFE one — a stray click in the text
// used to open an editor, which is why the switch exists at all.
{
  const src = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
  ok('the single-click edit is gated on the preference, and the default is OFF',
    src.indexOf('if (!mod && clickToEditRef.current) startInlineEdit(pointToPos(e.clientX, e.clientY))') > 0 &&
    src.indexOf("readMarksPref().clickToEdit === true") > 0,
    'gate + default present')
  ok('double click still edits regardless of the switch (it sits before any gate)',
    /function onDoubleClick\(e\) \{[\s\S]*?if \(startInlineEdit\(pt\)\) return/.test(src),
    'onDoubleClick keeps its own path')
  ok('the switch lives in the ⋯ menu and is persisted with the card preferences',
    src.indexOf("items.push(mi('set', '设置…'") > 0 && src.indexOf("writeMarksPref({ clickToEdit: on })") > 0 &&
    src.indexOf("mi('cb', '提交到 git'") < 0,
    'menu entry + persistence + no duplicate 提交')
  ok('the settings card renders the switch from live state, not a stale copy',
    src.indexOf("checked: clickToEdit,") > 0 && src.indexOf("setClickToEditPref(e.target.checked)") > 0,
    'checkbox bound to state')
}

console.log('')
console.log('an editor belongs to the note it was opened on')
// The bug this guards against: the active note can change from the HOST (the agent calling note_open)
// while an in-place editor is open. Nothing used to close it, so the box stayed on screen holding the
// other note's text — and committing would have spliced that text into the note being displayed.
{
  const src = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
  ok('the edit payload records which note it was opened on',
    src.indexOf("note: noteNameRef.current || ''") > 0 && (src.match(/note: noteNameRef\.current \|\| ''/g) || []).length >= 2,
    'both entry points tag the note')
  ok('the renderer refuses to draw an editor that belongs to another note',
    src.indexOf("(!editBlock.note || editBlock.note === noteName)") > 0, 'render guard present')
  ok('and an effect closes it when the note changes',
    /React\.useEffect\(function \(\) \{\s*const eb = editBlockRef\.current\s*const ce = cellEditRef\.current\s*if \(eb && eb\.note && eb\.note !== noteName\) \{ editBlockRef\.current = null; setEditBlock\(null\) \}/.test(src),
    'close-on-note-change effect present (block + cell)')
  ok('a new edit session starts from the current buffer, not from a reused instance',
    src.indexOf('}, [props.session])') > 0 && src.indexOf('lastRef.current = String(propsRef.current.value') > 0,
    'session-keyed refill present')
  ok('the editor key includes the note and the session (a reopen cannot inherit a cancelled buffer)',
    src.indexOf("key: key + '_' + (editBlock.note || '') + '_' + (editBlock.openedAt || 0)") > 0,
    'note + openedAt in the key')
}

console.log('')
console.log('local images: the cache is per note, and a failure is retried')
// Reported as 「本地素材的图片无法加载」 although the host resolved every file: the card cached the
// answer under the bare href. A relative path means a different file in every note, and a failure was
// remembered forever, so one miss (a note without an asset root, a host answering mid-restart) left
// the same path broken for the rest of the page's life.
{
  const src = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
  ok('the image cache key includes the note',
    src.indexOf('function assetCacheKey(note, href) { return String(note || \'\') + \'\\u0000\' + String(href || \'\') }') > 0 ||
    src.indexOf('function assetCacheKey(note, href)') > 0,
    'assetCacheKey present')
  ok('the note is threaded from the renderer into every image',
    src.indexOf("note: noteName, href: tk.href") > 0 && src.indexOf('assetCacheKey(props.note, props.href)') > 0,
    'note passed + used')
  ok('a failure is never permanent: it is remembered briefly and then retried',
    src.indexOf('assetFail[key] = Date.now()') > 0 && src.indexOf('ASSET_RETRY_MS') > 0 &&
    src.indexOf('Date.now() - failedAt < ASSET_RETRY_MS') > 0,
    'retry window present')
  ok('nothing stores a permanent null anymore',
    src.indexOf('assetCache[key] = null') < 0, 'no null poisoning')
  ok('a reload and a sync drop the cached bytes',
    (src.match(/clearAssetCache\(\)/g) || []).length >= 3, (src.match(/clearAssetCache\(\)/g) || []).length + ' call sites')
  ok('the failure carries the host\'s reason as a tooltip',
    src.indexOf('setFailReason(String((r && r.error) || ') > 0 && src.indexOf('title: failReason') > 0,
    'reason surfaced')
}

console.log('')
console.log('tables: the header row is a row, and cells edit in place')
{
  const src = fs.readFileSync(path.join(lib, 'client.js'), 'utf8')
  let parseBlocks = null
  const at = src.indexOf('function parseBlocks(text)')
  let end = -1, depth = 0
  for (let k = src.indexOf('{', at); k < src.length; k++) {
    if (src[k] === '{') depth++
    else if (src[k] === '}') { depth--; if (depth === 0) { end = k + 1; break } }
  }
  try { parseBlocks = eval('(' + src.slice(at, end) + ')') } catch (err) { parseBlocks = null }
  if (typeof parseBlocks === 'function') {
    const normal = parseBlocks(['| 算法 | 内存状态 |', '| --- | --- |', '| 标记-清除 | 有碎片 |', '| 标记-复制 | 无碎片 |'].join('\n'))
    const t1 = normal.filter((b) => b.k === 'table')[0]
    ok('a table keeps its REAL header row (it used to be dropped, and the first data row promoted)',
      !!t1 && t1.rows.length === 3 && t1.rows[0].head === true && t1.rows[0].line === 1 &&
      t1.rows[1].head === false && t1.rows[1].line === 3 && t1.rows[2].line === 4,
      JSON.stringify(t1 ? t1.rows.map((r) => r.line + ':' + r.head) : null))
    const emptyHead = parseBlocks(['|  |  |', '| --- | --- |', '| 算法 | 内存状态 |', '| 标记-整理 | 规整 |'].join('\n'))
    const t2 = emptyHead.filter((b) => b.k === 'table')[0]
    ok('an EMPTY header line is skipped and the first data row keeps the header slot (unchanged behaviour)',
      !!t2 && t2.rows.length === 2 && t2.rows[0].head === true && t2.rows[0].line === 3 && t2.rows[1].head === false,
      JSON.stringify(t2 ? t2.rows.map((r) => r.line + ':' + r.head) : null))
  }
  ok('every cell carries the source offsets the editor splices back into',
    src.indexOf("'data-cell-line': String(row.line)") > 0 && src.indexOf("'data-cell-at': String(base)") > 0 &&
    src.indexOf("'data-cell-len': String(txt.length)") > 0 && src.indexOf("'data-cell-ci': String(ci)") > 0,
    'cell offsets present')
  ok('the cell input is visible (a transparent one hid every typed character)',
    src.indexOf('.dn-cell-in{') > 0 && src.indexOf('.dn-cell-edit .dn-cell-mirror{visibility:hidden;}') > 0 &&
    src.indexOf('color:inherit;caret-color:') > 0, 'visible input + hidden mirror')
  ok('a cell follows the SAME click/double-click switch as every other block',
    src.indexOf('if (!mod && clickToEditRef.current && startCellEdit(hitAt(e.clientX, e.clientY) || e.target') > 0 &&
    src.indexOf('if (!mod && clickToEditRef.current) startInlineEdit') > 0 &&
    src.indexOf('if (!(e.ctrlKey || e.metaKey) && startCellEdit(hit, { x: e.clientX, y: e.clientY })) return') > 0,
    'switch gates the single click; the double click always edits')
  ok('clicking another cell commits the one being edited (it used to drop the buffer)',
    src.indexOf('if (open && (open.line !== line || open.at !== at)) commitCellEdit(0)') > 0, 'handover commit')
  ok('the commit splices into the LIVE text and refuses when the cell moved under it',
    src.indexOf('String(textRef.current || st.text).split') > 0 &&
    src.indexOf("if (src.substr(ce.at, ce.len) !== ce.wasText)") > 0, 'live text + stale guard')
  ok('Tab / Enter walk the grid, wrapping to the neighbouring row',
    src.indexOf('function nextCell(ce, value, dir)') > 0 && src.indexOf("rows.findIndex(function (tr) { return Number(tr.getAttribute('data-line')) === ce.line })") > 0,
    'cross-row navigation')
  ok('the cell editor is bound to its note and closed when the note changes',
    src.indexOf("cellEdit && cellEdit.note === noteName") > 0 &&
    src.indexOf('if (ce && ce.note && ce.note !== noteName) { cellEditRef.current = null; setCellEdit(null) }') > 0,
    'note binding present')
  // The bug that made a REAL click do nothing while every synthetic test passed: the body takes
  // pointer capture on pointerdown, which retargets pointerup — and the click derived from it — to the
  // capturing element, so `e.target` was `.dn-body` and `closest('[data-cell-at]')` found nothing.
  ok('the clicked cell is found by COORDINATES, not through the event target',
    src.indexOf('function hitAt(x, y)') > 0 &&
    src.indexOf('startCellEdit(hitAt(e.clientX, e.clientY) || e.target') > 0 &&
    src.indexOf('if (!(e.ctrlKey || e.metaKey) && startCellEdit(hit, { x: e.clientX, y: e.clientY })) return') > 0,
    'coordinate hit-testing used by both click paths')
  ok('Ctrl/Cmd asks for the table source instead of a cell (structure edits stay reachable)',
    src.indexOf('const mod = e.ctrlKey || e.metaKey') > 0 &&
    src.indexOf('if (!(e.ctrlKey || e.metaKey) && startCellEdit(') > 0,
    'modifier honoured in both paths')
}

console.log('')
console.log(failed === 0 ? 'ALL CHECKS PASSED' : failed + ' CHECK(S) FAILED')
process.exitCode = failed === 0 ? 0 : 1
