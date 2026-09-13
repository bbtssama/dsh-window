/**
 * Installer: publishes this package into the web profile as a permanent
 * profile bundle.
 *
 * Two deliberate choices, both learned the hard way:
 *
 * 1. The installed copy is a real directory, not a pnpm symlink. Node resolves
 *    a symlink to its realpath before walking up for bare imports, so a linked
 *    install located outside the profile cannot resolve
 *    `@deepseek-ai/dsh-tools` (verified: it throws MODULE_NOT_FOUND). A real
 *    directory under the profile's node_modules resolves it.
 *
 * 2. The bundle is registered by editing `dsh.profile.bundles` directly rather
 *    than through `dsh plugin add`, which would record a `file:` dependency and
 *    replace the directory with exactly the symlink that breaks resolution.
 *
 * Run after `node src/build.mjs`:  node src/install.mjs
 * A DSH restart is required for the profile composition to pick the row up.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const profileDir = process.argv[2] || 'D:\\DSH\\profiles\\web'
const dest = path.join(profileDir, 'node_modules', 'dsh-window')

const PACKAGE = 'dsh-window'
// node_modules/mermaid MUST be copied: the destructive rmSync above would
// otherwise delete the vendor asset on every reinstall, and the host route that
// serves Mermaid would 404 -> diagrams silently fail to render everywhere.
const COPY = ['package.json', 'cordis.patch.yml', 'lib', 'node_modules/mermaid']

// ── 1. publish the files as a real directory ────────────────────────────────
fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })
for (const entry of COPY) {
  const from = path.join(root, entry)
  if (!fs.existsSync(from)) throw new Error('missing build artifact: ' + from + ' (run src/build.mjs first)')
  fs.cpSync(from, path.join(dest, entry), { recursive: true })
}
const installed = fs.lstatSync(dest)
if (installed.isSymbolicLink()) throw new Error('refusing to install through a symlink: ' + dest)
for (const file of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'package.json']) {
  if (!fs.existsSync(path.join(dest, file))) throw new Error('install is missing ' + file)
}

// Publishing is the last gate before a profile boots, so a BOM must not get through:
// dsh JSON.parses the bundle's package.json, JSON.parse rejects a BOM, and `dsh web`
// dies with "… is not valid JSON" before it can compose anything. Strip it here and
// name the file, so the source can be cleaned up too (src/build.mjs fails on one).
for (const rel of ['package.json', 'cordis.patch.yml']) {
  const file = path.join(dest, rel)
  const bytes = fs.readFileSync(file)
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    fs.writeFileSync(file, bytes.subarray(3))
    console.log('  note  : stripped a UTF-8 BOM from ' + rel + ' (a BOM stops dsh from booting)')
  }
}

// ── 2. reconcile the profile bundle list ────────────────────────────────────
const manifestPath = path.join(profileDir, 'package.json')
// Strip a BOM: editors and PowerShell write one, and JSON.parse rejects it.
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''))
manifest.dsh = manifest.dsh || {}
manifest.dsh.profile = manifest.dsh.profile || {}
const bundles = manifest.dsh.profile.bundles || []
const before = bundles.slice()
if (!bundles.includes(PACKAGE)) bundles.push(PACKAGE)
manifest.dsh.profile.bundles = bundles
if (bundles.join('\u0000') !== before.join('\u0000')) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
}

console.log('installed  : ' + dest)
console.log('bundles    : ' + bundles.join(', '))
console.log('bundle row : ' + (before.includes(PACKAGE) ? 'already registered' : 'added to dsh.profile.bundles'))
