/**
 * Build script: turns the two dynamic-plugin halves (src/dynamic-host.js and
 * src/dynamic-client.js, extracted verbatim from the running Cordis plugin)
 * into a permanent profile-bundle plugin:
 *
 *   lib/index.js   ESM host module  (name / inject / apply exports)
 *   lib/client.js  window.__ModuleLoader__.load({ id, factory }) bundle
 *
 * The transformation is deliberately mechanical — every dynamic-harness
 * primitive maps onto a first-party API:
 *
 *   harness.registerTool(ctx, harness.defineTool(x))  ->  ctx.tools.register(defineTool(x))
 *   harness.handle(name, fn)                          ->  handle(name, fn)   [local registry]
 *   host.call(name, args)  (client)                   ->  fetch POST /plugins/dsh-window/rpc
 *   styles.insert(CSS)     (client)                   ->  <style data-plugin-css> in document.head
 *   React  (ambient)                                  ->  const React = require('react')
 *
 * Run: node src/build.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const lib = path.join(root, 'lib')
fs.mkdirSync(lib, { recursive: true })

const readLines = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').split('\n')
const count = (text, needle) => text.split(needle).length - 1

/** Split a dynamic-plugin body into head / apply-body, asserting the shape. */
function splitBody(lines, file) {
  const ret = lines.findIndex((line) => line === 'return {')
  if (ret < 0) throw new Error(file + ': no top-level "return {"')
  let app = -1
  for (let i = ret + 1; i < Math.min(ret + 5, lines.length); i++) {
    if (/^\s*(async\s+)?apply\s*\(/.test(lines[i])) { app = i; break }
  }
  if (app < 0) throw new Error(file + ': no apply( within 4 lines after "return {"')
  // Ignore trailing blank lines so the tail is the real close of apply + object.
  let end = lines.length
  while (end > 0 && lines[end - 1].trim() === '') end--
  const tail = lines.slice(end - 2, end)
  if (tail[1].trim() !== '}' || !/^\s*\},?\s*$/.test(tail[0])) {
    throw new Error(file + ': unexpected tail ' + JSON.stringify(tail))
  }
  return {
    head: lines.slice(0, ret),
    pre: lines.slice(ret + 1, app),
    body: lines.slice(app + 1, end - 2),
    applyLine: lines[app],
  }
}

// ─────────────────────────────────────────────────────────── host half ──
const hostSrc = path.join(here, 'dynamic-host.js')
const host = splitBody(readLines(hostSrc), hostSrc)
let hostHead = host.head.join('\n')
let hostBody = host.body.join('\n')

const hostToolHits = count(hostBody, 'harness.registerTool(ctx, harness.defineTool(')
hostBody = hostBody.replaceAll('harness.registerTool(ctx, harness.defineTool(', 'ctx.tools.register(defineTool(')
const hostHandleHits = count(hostBody, 'harness.handle(')
hostBody = hostBody.replaceAll('harness.handle(', 'handle(')
if (hostToolHits !== 6) throw new Error('host: expected 6 tool registrations, saw ' + hostToolHits)
// state / saveText / addSelection / removeSelection / clearSelections / commit / asset / reload
if (hostHandleHits !== 8) throw new Error('host: expected 8 rpc handlers, saw ' + hostHandleHits)
if (hostBody.includes('harness.')) throw new Error('host: a harness.* reference survived')

// ── late-bound services ──
// A permanent row mounts during composition, so ctx.get(...) at apply time
// returns undefined for services that register later (verified live: `fs` was
// missing and every RPC would answer "fs 服务不可用"). Re-read them instead of
// capturing once; every `x === undefined` guard in the body stays intact.
const captureBlock = [
  "    const fs = ctx.get('fs')",
  "    const shell = ctx.get('shell')",
  "    const systemPrompt = ctx.get('systemPrompt')",
  "    const policy = ctx.get('sandboxPolicy')",
  "    const agents = ctx.get('agents')",
  "    const sessions = ctx.get('sessions')",
].join('\n')
if (!hostBody.includes(captureBlock)) throw new Error('host: service capture block not found')
hostBody = hostBody.replace(captureBlock, [
  '    let fs, shell, systemPrompt, policy, agents, sessions',
  '    function refreshServices() {',
  "      fs = ctx.get('fs')",
  "      shell = ctx.get('shell')",
  "      systemPrompt = ctx.get('systemPrompt')",
  "      policy = ctx.get('sandboxPolicy')",
  "      agents = ctx.get('agents')",
  "      sessions = ctx.get('sessions')",
  '    }',
  '    refreshServices()',
].join('\n'))

// ── the system-prompt section becomes re-installable ──
const sectionMarker = '    if (systemPrompt !== undefined) {'
const sectionStart = hostBody.indexOf(sectionMarker)
if (sectionStart < 0) throw new Error('host: prompt section block not found')
const catchEnd = hostBody.indexOf('\n', hostBody.indexOf("fail('注册段落失败', err)", sectionStart))
const sectionEnd = hostBody.indexOf('\n    }', catchEnd)
if (catchEnd < 0 || sectionEnd < 0) throw new Error('host: prompt section block is not shaped as expected')
const promptSectionBlock = hostBody.slice(sectionStart, sectionEnd + '\n    }'.length)
hostBody = hostBody.slice(0, sectionStart) + hostBody.slice(sectionEnd + '\n    }'.length)
//

const hostModule = [
  '/**',
  ' * dsh-window — host half (permanent profile bundle).',
  ' *',
  ' * Generated from src/dynamic-host.js by src/build.mjs — edit the source and',
  ' * rebuild rather than editing this file directly.',
  ' *',
  ' * Registers the `note_*` model tools, one system-prompt section, and the',
  ' * `/plugins/dsh-window/rpc` route the browser card talks to.',
  ' *',
  ' * @module dsh-window',
  ' */',
  "import { defineTool } from '@deepseek-ai/dsh-tools'",
  "import { readFile } from 'node:fs/promises'",
  "import { createRequire } from 'node:module'",
  '',
  "const RPC_PATH = '/plugins/dsh-window/rpc'",
  "const VENDOR_PATH = '/plugins/dsh-window/vendor/mermaid.min.js'",
  '',
  '/** Resolver for the dependencies of this package. */',
  'const ownRequire = createRequire(import.meta.url)',
  '',
  '/**',
  ' * Absolute path of the mermaid bundle that ships as a declared dependency, or',
  ' * an empty string when it is not installed. Resolved lazily, so a missing',
  ' * asset degrades to the built-in renderer instead of breaking activation.',
  ' * @returns the bundle path, or an empty string.',
  ' */',
  'function mermaidAsset() {',
  "  try { return ownRequire.resolve('mermaid/dist/mermaid.min.js') } catch (err) { return '' }",
  '}',
  '',
  '/** Method name -> handler, filled by `handle()` during apply. */',
  'const handlers = new Map()',
  '',
  '/** The permanent-plugin counterpart of `harness.handle`. */',
  'function handle(name, fn) { handlers.set(name, fn) }',
  '',
  '/**',
  ' * Build an idempotent installer for the JSON-RPC route the browser calls.',
  ' *',
  ' * This row mounts early in the host composition — before `webServer` exists —',
  ' * so registration is retried whenever a service appears instead of assuming',
  ' * the service is already there. One POST endpoint dispatching',
  ' * `{ method, args }` keeps the client side a drop-in replacement for the',
  ' * dynamic `host.call(method, args)`.',
  ' * @param ctx - the plugin context owning the route.',
  ' * @returns a function registering the route at most once.',
  ' */',
  'function makeRpcInstaller(ctx) {',
  '  let installed = false',
  '  return function installRpcRoute() {',
  '    if (installed) return',
  "    const webServer = ctx.get('webServer') ?? ctx.get('httpServer')",
  '    if (webServer === undefined) return',
  '    installed = true',
  '    ctx.effect(function () {',
  '      const stopRpc = webServer.register({',
  "      kind: 'exact',",
  '      path: RPC_PATH,',
  '      handler: async function (req, res) {',
  '        const send = function (code, payload) {',
  "          res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })",
  '          res.end(JSON.stringify(payload))',
  '        }',
  "        if (req.method !== 'POST') { send(405, { ok: false, error: 'POST only' }); return }",
  '        let raw = \'\'',
  '        try {',
  '          // Deliberately NOT `raw = await new Promise(...)`: resolving with no',
  '          // argument would assign undefined over the accumulated body.',
  '          await new Promise(function (resolve, reject) {',
  "            req.on('data', function (chunk) {",
  '              raw += chunk',
  "              if (raw.length > 4e6) { reject(new Error('payload too large')); try { req.destroy() } catch (err) { } }",
  '            })',
  "            req.on('end', function () { resolve() })",
  "            req.on('error', reject)",
  '          })',
  '        } catch (err) {',
  "          send(400, { ok: false, error: 'read body: ' + (err && err.message ? err.message : String(err)) })",
  '          return',
  '        }',
  '        let payload = null',
  "        try { payload = JSON.parse(raw || '{}') } catch (err) { send(400, { ok: false, error: 'bad json' }); return }",
  '        const method = payload && payload.method',
  '        const fn = handlers.get(method)',
  "        if (typeof fn !== 'function') { send(404, { ok: false, error: 'unknown method: ' + String(method) }); return }",
  '        try {',
  '          const result = await fn(payload.args === undefined ? null : payload.args)',
  '          send(200, { ok: true, result: result === undefined ? null : result })',
  '        } catch (err) {',
  "          send(200, { ok: false, error: err && err.message ? err.message : String(err) })",
  '        }',
  '      },',
  '      })',
  '      // Mermaid is a declared dependency, served straight out of',
  '      // node_modules so the published package vendors no bundle of its own.',
  '      const stopVendor = webServer.register({',
  "        kind: 'exact',",
  '        path: VENDOR_PATH,',
  '        handler: async function (req, res) {',
  '          const file = mermaidAsset()',
  "          if (file === '') {",
  "            res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })",
  "            res.end('mermaid is not installed')",
  '            return',
  '          }',
  '          try {',
  '            const bytes = await readFile(file)',
  "            res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=604800' })",
  '            res.end(bytes)',
  '          } catch (err) {',
  "            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })",
  '            res.end(String(err && err.message ? err.message : err))',
  '          }',
  '        },',
  '      })',
  '      return function () { try { stopRpc() } catch (err) { } try { stopVendor() } catch (err) { } }',
  "    }, 'dsh-window: rpc + vendor routes')",
  '  }',
  '}',
  '',
  hostHead,
  '',
  "export const name = 'dsh-window'",
  "export const inject = ['tools']",
  'export function apply(ctx) {',
  hostBody,
  '',
  '  // This row can activate before the services it talks to exist, so the route',
  '  // and the system-prompt section are (re)installed whenever a service appears.',
  '  const installRpcRoute = makeRpcInstaller(ctx)',
  '  function registerPromptSection() {',
  '    if (registerPromptSection.done || systemPrompt === undefined) return',
  '    registerPromptSection.done = true',
  promptSectionBlock,
  '  }',
  '  function wireLateServices() {',
  '    refreshServices()',
  '    installRpcRoute()',
  '    registerPromptSection()',
  '  }',
  '  wireLateServices()',
  "  ctx.on('internal/service', wireLateServices)",
  '}',
  '',
].join('\n')

fs.writeFileSync(path.join(lib, 'index.js'), hostModule)

// ───────────────────────────────────────────────────────── client half ──
const clientSrc = path.join(here, 'dynamic-client.js')
const client = splitBody(readLines(clientSrc), clientSrc)
let clientHead = client.head.join('\n')
let clientBody = client.body.join('\n')

const styleHits = count(clientBody, 'styles.insert(CSS)')
if (styleHits !== 1) throw new Error('client: expected 1 styles.insert(CSS), saw ' + styleHits)
clientBody = clientBody.replace('styles.insert(CSS)', [
  '// Own the plugin stylesheet: the permanent bundle has no `styles` service,',
  '// so the injection is explicit and disposed with this fiber.',
  "const STYLE_ID = 'dsh-window'",
  "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=\"' + STYLE_ID + '\"]') === null) {",
  "  const styleTag = document.createElement('style')",
  "  styleTag.setAttribute('data-plugin-css', STYLE_ID)",
  "  styleTag.textContent = String(CSS)",
  '  document.head.appendChild(styleTag)',
  '  ctx.effect(function () { return function () { try { styleTag.remove() } catch (err) { } } })',
  '}',
].join('\n'))

const clientHostCalls = count(clientBody, 'host.call(')
if (clientHostCalls === 0) throw new Error('client: no host.call( sites found')

const clientModule = [
  '// dsh-window — client half (permanent profile bundle).',
  '// Generated from src/dynamic-client.js by src/build.mjs — edit the source',
  '// and rebuild rather than editing this file directly.',
  '//',
  '// Loaded by the DSH web shell through window.__ModuleLoader__, the same',
  '// carrier every installed plugin client half uses. `require` resolves the',
  "// shell's shared React instance; `host.call` is served by the host half's",
  '// /plugins/dsh-window/rpc route.',
  'window.__ModuleLoader__.load({',
  "  id: 'dsh-window',",
  '  factory: (require) => {',
  "    const React = require('react')",
  '    var module = { exports: {} }',
  '    var exports = module.exports',
  "    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })",
  '',
  "    const RPC_URL = '/plugins/dsh-window/rpc'",
  '    // Client -> host: the permanent-plugin counterpart of `host.call`.',
  '    const host = {',
  '      call: async function (method, args) {',
  '        const response = await fetch(RPC_URL, {',
  "          method: 'POST',",
  "          headers: { 'content-type': 'application/json' },",
  '          body: JSON.stringify({ method: method, args: args === undefined ? null : args }),',
  '        })',
  "        if (!response.ok) throw new Error('note-card host HTTP ' + response.status)",
  '        const payload = await response.json()',
  "        if (payload === null || typeof payload !== 'object') throw new Error('note-card host bad payload')",
  "        if (payload.ok !== true) throw new Error(payload.error || 'note-card host error')",
  '        return payload.result',
  '      },',
  '    }',
  '',
  clientHead,
  '',
  "    // Wait for both services before apply runs. The dynamic version only",
  "    // injected 'timer' and read slots through ctx.get, which silently skips",
  "    // the card if slots is not up yet.",
  "    const inject = ['slots', 'timer']",
  '    function apply(ctx) {',
  clientBody,
  '    }',
  '',
  '    exports.apply = apply',
  '    exports.inject = inject',
  '    return module.exports',
  '  },',
  '})',
  '',
].join('\n')

fs.writeFileSync(path.join(lib, 'client.js'), clientModule)

console.log('host   : ' + hostModule.split('\n').length + ' lines  (' + hostToolHits + ' tools, ' + hostHandleHits + ' rpc handlers)')
console.log('client : ' + clientModule.split('\n').length + ' lines  (' + clientHostCalls + ' host.call sites, ' + styleHits + ' style injection)')
console.log('wrote  : ' + path.join(lib, 'index.js'))
console.log('wrote  : ' + path.join(lib, 'client.js'))
