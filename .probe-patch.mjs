// Throwaway diagnostic: instrument the INSTALLED copy of the bundle with two probes
// that append to a file (stdout from the boot is not reliably visible).
//   [apply]     -> the row's apply() ran, and what ctx.get('webServer') was then
//   [installer] -> the route installer ran, and what it saw
// Run: node .probe-patch.mjs
import fs from 'node:fs'

const target = 'D:/DSH/profiles/web/node_modules/dsh-window/lib/index.js'
const log = 'D:/DSH/probe.log'
fs.rmSync(log, { force: true })

let src = fs.readFileSync(target, 'utf8')

const probe = (tag) => "try{ownRequire('node:fs').appendFileSync('" + log + "','[" + tag + "] '+" +
  "(typeof ctx!=='undefined'&&ctx.get?('ws='+typeof ctx.get('webServer')+' hs='+typeof ctx.get('httpServer')):'')+String.fromCharCode(10))}catch(e){}"

const a1 = '  void config'
const a2 = "    const webServer = ctx.get('webServer') ?? ctx.get('httpServer')"
if (!src.includes(a1)) throw new Error('anchor 1 missing')
if (!src.includes(a2)) throw new Error('anchor 2 missing')

src = src.replace(a1, a1 + '\n  ' + probe('apply'))
src = src.replace(a2, a2 + '\n    ' + probe('installer'))

fs.writeFileSync(target, src)
console.log('probes installed; occurrences:', (src.match(/appendFileSync/g) || []).length)
