/**
 * Post-restart verification against the RUNNING dsh web server.
 *
 * Proves the permanent bundle is actually mounted, not merely installed:
 *
 *   1. the host half answers on its RPC route (proves the bundle row was read
 *      from dsh.profile.bundles, the plugin mounted, and the route registered);
 *   2. the client half is advertised in the page boot manifest (proves the
 *      shell will deliver lib/client.js to the browser).
 *
 * Run: node src/verify-live.mjs [http://127.0.0.1:3080]
 * Before a restart it reports "not mounted yet" — that is the negative control.
 */
const origin = (process.argv[2] || 'http://127.0.0.1:3080').replace(/\/+$/, '')
let failed = 0
const ok = (label, condition, detail) => {
  if (condition) console.log('  PASS  ' + label)
  else { failed++; console.log('  FAIL  ' + label + (detail === undefined ? '' : '  -> ' + detail)) }
}

console.log('verifying ' + origin)

// ── 1. host half: the RPC route ─────────────────────────────────────────────
let rpcStatus = 0
let rpcBody = ''
try {
  const response = await fetch(origin + '/plugins/dsh-window/rpc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method: 'state', args: { revision: -1, sessionId: '' } }),
  })
  rpcStatus = response.status
  rpcBody = await response.text()
} catch (err) {
  console.log('  FAIL  could not reach the server: ' + err.message)
  process.exit(1)
}

ok('rpc route answers (host half mounted)', rpcStatus === 200, 'HTTP ' + rpcStatus)
let parsed = null
try { parsed = JSON.parse(rpcBody) } catch (err) { parsed = null }
ok('reply is JSON with ok:true', parsed !== null && parsed.ok === true, rpcBody.slice(0, 140))
const view = parsed && parsed.result
ok('state view carries text + selections', view && typeof view.text === 'string' && Array.isArray(view.selections), view && Object.keys(view).slice(0, 6).join(','))
if (view) {
  console.log('  note   : ' + (view.relPath || '?') + '  lines=' + view.lineCount + '  selections=' + view.selections.length + '  git=' + (view.commitHash || 'n/a'))
  console.log('  source : ' + (view.baseFrom || '?') + (view.error ? '   error=' + view.error : ''))
}

// ── 2. client half: the boot manifest ───────────────────────────────────────
const page = await (await fetch(origin + '/')).text()
ok('page advertises dsh-window to the shell', page.includes('dsh-window'), page.length + ' bytes fetched')

console.log('')
console.log(failed === 0 ? 'PERMANENT PLUGIN IS LIVE' : failed + ' CHECK(S) FAILED — the bundle is not mounted yet')
process.exitCode = failed === 0 ? 0 : 1
