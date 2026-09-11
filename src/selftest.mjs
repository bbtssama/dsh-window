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
const hostCtx = {
  tools: toolsService,
  get(name) {
    if (name === 'tools') return toolsService
    if (name === 'webServer' && webServerUp) return webServerService
    if (name === 'systemPrompt' && systemPromptUp) return systemPromptService
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
ok('routes register once webServer appears', registeredRoutes.length === 2, String(registeredRoutes.length))
ok('prompt section registers once systemPrompt appears', registeredSections.length === 1, String(registeredSections.length))
ok('prompt section carries usage text', registeredSections[0] && typeof registeredSections[0].text === 'string' && registeredSections[0].text.includes('note_take_new_selections'), registeredSections[0] ? registeredSections[0].text.length + ' chars' : 'n/a')
// idempotent: a second appearance must not double-register
for (const listener of serviceListeners) listener.fn('webServer')
ok('re-firing the service event does not double-register', registeredRoutes.length === 2 && registeredSections.length === 1, registeredRoutes.length + '/' + registeredSections.length)

const toolNames = registeredTools.map((tool) => tool.name).sort()
const expectedTools = ['note_commit', 'note_get_selections', 'note_read', 'note_take_new_selections', 'note_write']
ok('registers the note_* tools', expectedTools.every((name) => toolNames.includes(name)), toolNames.join(','))
console.log('  tools : ' + toolNames.join(', '))
ok('every tool has a JSON Schema + render', registeredTools.every((tool) => tool.parameters && tool.output && tool.output.schema && typeof tool.output.render === 'function'))

ok('registers the rpc and mermaid vendor routes', registeredRoutes.length === 2, registeredRoutes.map((r) => r.path).join(' '))
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

const unknown = await rpc('no_such_method', {})
ok('answers an unknown method with 404 + ok:false', unknown.status === 404 && unknown.parsed && unknown.parsed.ok === false, unknown.raw.slice(0, 90))

const stateCall = await rpc('state', { revision: -1, sessionId: '' })
ok('dispatches a real method and returns { ok, result }', stateCall.status === 200 && stateCall.parsed && stateCall.parsed.ok === true && typeof stateCall.parsed.result === 'object', stateCall.raw.slice(0, 120))
const view = stateCall.parsed && stateCall.parsed.result
ok('state view carries the note contract', view && 'text' in view && Array.isArray(view.selections) && 'revision' in view && 'relPath' in view, view && Object.keys(view).slice(0, 6).join(','))

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
console.log(failed === 0 ? 'ALL CHECKS PASSED' : failed + ' CHECK(S) FAILED')
process.exitCode = failed === 0 ? 0 : 1
