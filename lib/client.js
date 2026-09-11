// dsh-window — client half (permanent profile bundle).
// Generated from src/dynamic-client.js by src/build.mjs — edit the source
// and rebuild rather than editing this file directly.
//
// Loaded by the DSH web shell through window.__ModuleLoader__, the same
// carrier every installed plugin client half uses. `require` resolves the
// shell's shared React instance; `host.call` is served by the host half's
// /plugins/dsh-window/rpc route.
window.__ModuleLoader__.load({
  id: 'dsh-window',
  factory: (require) => {
    const React = require('react')
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const RPC_URL = '/plugins/dsh-window/rpc'
    // Client -> host: the permanent-plugin counterpart of `host.call`.
    const host = {
      call: async function (method, args) {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ method: method, args: args === undefined ? null : args }),
        })
        if (!response.ok) throw new Error('note-card host HTTP ' + response.status)
        const payload = await response.json()
        if (payload === null || typeof payload !== 'object') throw new Error('note-card host bad payload')
        if (payload.ok !== true) throw new Error(payload.error || 'note-card host error')
        return payload.result
      },
    }

const CSS = [
'.dn-root{position:fixed;pointer-events:auto;z-index:60;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1b1b1b);border:1px solid var(--dsw-alias-line-normal,var(--dsw-alias-border-l1,rgba(0,0,0,.12)));border-radius:14px;box-shadow:0 14px 44px rgba(0,0,0,.2);overflow:hidden;font-size:13.5px;line-height:1.72;}',
'.dn-root *{box-sizing:border-box;}',
// overflow-x is hidden on purpose: tables, code blocks and diagrams scroll
// inside their own boxes, so any horizontal overflow here is a stray overlay or
// an unbreakable token — neither may raise a scrollbar on the whole card.
// overflow-wrap:anywhere makes long inline tokens (paths, a/b/c/... runs) wrap
// instead of stretching the row past the card edge.
'.dn-body{position:relative;z-index:0;isolation:isolate;flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overflow-wrap:anywhere;padding:12px 14px 40px;cursor:default;-webkit-user-select:none;user-select:none;touch-action:pan-y;-webkit-touch-callout:none;}',
'.dn-hlo{position:absolute;z-index:-1;pointer-events:none;border-radius:2px;background:rgba(255,214,0,.42);}',
'.dn-hlo[data-kind=stale]{background:rgba(255,120,0,.3);}',
'.dn-hlo[data-kind=live]{background:rgba(90,150,255,.38);}',
'.dn-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;padding:0 10px 0 14px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));border-bottom:1px solid var(--dsw-alias-line-normal,rgba(0,0,0,.12));cursor:grab;touch-action:none;user-select:none;}',
'.dn-head[data-dragging=true]{cursor:grabbing;}',
'.dn-head[data-compact=true]{cursor:default;touch-action:auto;}',
'.dn-headtitle{display:inline-flex;align-items:center;gap:8px;min-width:0;font-size:14px;font-weight:600;line-height:20px;}',
'.dn-headsub{font-size:11px;color:var(--dsw-alias-label-tertiary,#8a8f98);max-width:132px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'.dn-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-tertiary,#b9bec7);flex:none;}',
'.dn-dot[data-dirty=true]{background:#e08700;}',
'.dn-controls{flex:none;display:inline-flex;align-items:center;gap:2px;}',
'.dn-iconbtn{width:28px;height:28px;color:var(--dsw-alias-label-tertiary,#8a8f98);cursor:pointer;background:0 0;border:0;border-radius:7px;display:inline-flex;justify-content:center;align-items:center;padding:0;transition:background-color .12s,color .12s,transform .12s;}',
'.dn-iconbtn:hover{background:rgba(0,0,0,.06);color:var(--dsw-alias-label-primary,#1b1b1b);}',
'.dn-iconbtn:active{transform:scale(.94);}',
'.dn-iconbtn[data-control=dock][data-mode=docked] svg{transform:scaleX(-1);}',
'.dn-wglyph{font-size:11px;font-weight:700;letter-spacing:-.3px;}',
'.dn-actions{flex:0 0 auto;display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:5px 10px;border-bottom:1px solid var(--dsw-alias-line-normal,rgba(0,0,0,.1));}',
'.dn-btn{border:1px solid var(--dsw-alias-line-normal,rgba(0,0,0,.16));background:0 0;color:inherit;font-size:11.5px;line-height:1;padding:5px 8px;border-radius:7px;cursor:pointer;font-family:inherit;}',
'.dn-btn:hover{background:rgba(0,0,0,.06);}',
'.dn-btn-on{background:var(--dsw-alias-brand-primary,#4f7cff);border-color:transparent;color:#fff;}',
'.dn-p{margin:0;}',
'.dn-h{margin:14px 0 6px;font-weight:650;line-height:1.4;}',
'.dn-h1{font-size:20px;}',
'.dn-h2{font-size:17px;}',
'.dn-h3{font-size:15px;}',
'.dn-h4,.dn-h5,.dn-h6{font-size:13.5px;}',
'.dn-blank{height:8px;}',
'.dn-hr{height:1px;background:rgba(0,0,0,.14);margin:12px 0;}',
'.dn-quote{border-left:3px solid rgba(0,0,0,.2);padding-left:9px;color:var(--dsw-alias-label-secondary,#555);margin:2px 0;}',
'.dn-li{display:flex;align-items:flex-start;gap:7px;margin:1px 0;}',
'.dn-li-body{flex:1 1 auto;min-width:0;}',
'.dn-bullet{color:var(--dsw-alias-label-secondary,#888);flex:0 0 auto;min-width:12px;text-align:center;}',
'.dn-pre{background:rgba(0,0,0,.045);border:1px solid rgba(0,0,0,.08);border-radius:8px;padding:8px 10px;margin:8px 0;overflow:auto;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.6;}',
'.dn-code-line{white-space:pre;}',
'.dn-i{white-space:pre-wrap;}',
'.dn-code{background:rgba(0,0,0,.06);padding:1px 4px;border-radius:4px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;}',
'.tk-c{color:#7c8794;font-style:italic;}',
'.tk-s{color:#0a7d3c;}',
'.tk-k{color:#a626a4;font-weight:600;}',
'.tk-n{color:#b76b01;}',
'.tk-f{color:#3b6fe0;}',
'.tk-t{color:#b8860b;}',
'.tk-a{color:#c18401;}',
'.dn-b{font-weight:700;}',
'.dn-em{font-style:italic;}',
'.dn-del{text-decoration:line-through;opacity:.7;}',
'.dn-lnk{color:#3b6fe0;text-decoration:underline;}',
'.dn-img{max-width:100%;height:auto;border-radius:8px;display:block;margin:8px auto;background:rgba(0,0,0,.03);}',
'.dn-img-hl{outline:3px solid rgba(255,214,0,.9);outline-offset:2px;}',
'.dn-img-hl-live{outline:3px solid rgba(90,150,255,.95);outline-offset:2px;}',
'.dn-imgfail{display:flex;gap:6px;align-items:center;justify-content:center;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#8a8f98);border:1px dashed rgba(0,0,0,.18);border-radius:8px;padding:8px 10px;margin:8px 0;word-break:break-all;}',
'.dn-html-kbd{border:1px solid rgba(0,0,0,.2);border-bottom-width:2px;border-radius:5px;padding:0 4px;font-family:ui-monospace,Consolas,monospace;font-size:12px;}',
'.dn-html-mark{background:rgba(255,214,0,.5);border-radius:2px;}',
'.dn-twrap{overflow:auto;margin:10px 0;border:1px solid rgba(0,0,0,.12);border-radius:9px;background:rgba(0,0,0,.02);}',
'.dn-table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:12.5px;line-height:1.6;}',
'.dn-th,.dn-td{border-right:1px solid rgba(0,0,0,.1);border-bottom:1px solid rgba(0,0,0,.1);padding:6px 10px;vertical-align:top;}',
'.dn-th{font-weight:650;background:rgba(0,0,0,.035);white-space:nowrap;}',
'.dn-td{white-space:normal;word-break:break-word;max-width:340px;}',
'.dn-editor{width:100%;height:100%;min-height:320px;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:10px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.6;resize:none;background:transparent;color:inherit;outline:none;}',
'.dn-foot{flex:0 0 auto;padding:5px 12px;border-top:1px solid rgba(0,0,0,.1);font-size:11px;color:var(--dsw-alias-label-tertiary,#8a8f98);display:flex;gap:8px;align-items:center;overflow:hidden;white-space:nowrap;}',
'.dn-handle{position:absolute;width:16px;height:16px;margin-left:-8px;margin-top:-8px;border-radius:50%;background:#3b6fe0;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);pointer-events:auto;cursor:grab;z-index:5;touch-action:none;}',
'.dn-handle:after{content:"";position:absolute;left:-11px;top:-11px;right:-11px;bottom:-11px;}',
'.dn-bar{position:absolute;display:inline-flex;gap:3px;background:#20242c;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:4px;box-shadow:0 10px 28px rgba(0,0,0,.4);pointer-events:auto;z-index:6;}',
'.dn-bar button{border:0;background:0 0;color:#fff;font-size:12.5px;font-weight:600;line-height:1.2;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:inherit;}',
'.dn-bar button:hover{background:rgba(255,255,255,.18);}',
'.dn-bar button[data-act=pick]{background:#4f7cff;}',
'.dn-bar button[data-act=cancel]{color:rgba(255,255,255,.72);font-weight:500;}',
'.dn-sel-list{max-height:36%;overflow:auto;border-top:1px solid rgba(0,0,0,.1);padding:8px 12px;font-size:12px;flex:0 0 auto;}',
'.dn-sel-item{border:1px solid rgba(0,0,0,.1);border-radius:7px;padding:5px 7px;margin-bottom:6px;background:rgba(255,214,0,.1);}',
'.dn-sel-meta{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#8a8f98);display:flex;gap:6px;align-items:center;}',
'.dn-sel-text{white-space:pre-wrap;word-break:break-word;max-height:52px;overflow:hidden;}',
'.dn-x{margin-left:auto;border:0;background:transparent;color:#d33;cursor:pointer;font-size:12px;padding:4px 6px;}',
'.dn-pill{position:fixed;right:16px;bottom:20px;pointer-events:auto;z-index:60;height:34px;border:1px solid rgba(0,0,0,.16);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 92%,transparent);backdrop-filter:blur(16px);box-shadow:0 8px 28px rgba(0,0,0,.16);color:var(--dsw-alias-label-secondary,#555);font:inherit;font-size:12px;font-weight:600;line-height:20px;cursor:pointer;border-radius:999px;display:inline-flex;align-items:center;gap:7px;padding:0 12px;}',
'.dn-pill:hover{transform:translateY(-1px);}',
'.dn-pillcount{color:#3b6fe0;}',
'.dn-toast{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);background:rgba(0,0,0,.82);color:#fff;font-size:12px;padding:6px 12px;border-radius:8px;pointer-events:none;z-index:9;max-width:90%;}',
'.dn-mmd{border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:10px;margin:10px 0;background:rgba(0,0,0,.02);overflow:auto;}',
// Diagram labels are SVG text: the browser would happily drag-select them,
// which left a stray native selection behind after dragging inside a diagram.
'.dn-mmd svg,.dn-mmd svg text,.dn-mmd svg tspan{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;}',
'.dn-mmd-svg{display:flex;justify-content:center;max-width:100%;}',
'.dn-mmd-svg svg{max-width:100%;height:auto;}',
'.dn-mmd-tag{font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,#8a8f98);margin-bottom:6px;}',
'.dn-mmd-v{display:flex;flex-direction:column;align-items:center;gap:2px;}',
'.dn-mmd-h{display:flex;flex-direction:row;align-items:center;gap:6px;}',
'.dn-mmd-layer{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;}',
'.dn-mmd-col{display:flex;flex-direction:column;gap:6px;align-items:center;}',
'.dn-mmd-node{border:1.5px solid rgba(0,0,0,.22);border-radius:8px;padding:4px 10px;font-size:12px;background:var(--dsw-alias-bg-layer-1,#fff);white-space:nowrap;}',
'.dn-mmd-node[data-shape=diamond]{border-color:#e08700;}',
'.dn-mmd-node[data-shape=round]{border-radius:999px;}',
'.dn-mmd-arrow{color:var(--dsw-alias-label-tertiary,#9aa0a6);font-size:12px;white-space:nowrap;}',
'.dn-mmd-src{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;white-space:pre-wrap;word-break:break-word;color:#666;max-height:180px;overflow:auto;}',
'.dn-blk-hl{outline:3px solid rgba(255,214,0,.9);outline-offset:2px;border-radius:10px;}',
'.dn-blk-hl-live{outline:3px solid rgba(90,150,255,.95);outline-offset:2px;border-radius:10px;}',
'html[data-dn-open] [data-phase=active]{box-sizing:border-box;padding-right:var(--dn-shift,0px);transition:padding-right .18s ease;}',
'@media (max-width:640px){html[data-dn-open] [data-phase=active]{padding-right:0;}',
'.dn-root{left:8px;right:8px;top:56px;bottom:8px;width:auto;max-height:none;height:auto;border-radius:12px;font-size:13px;}',
'.dn-head{min-height:40px;padding:0 8px 0 12px;}',
'.dn-headsub{display:none;}',
'.dn-btn{font-size:11px;padding:6px 8px;}',
'.dn-body{padding:10px 12px 48px;line-height:1.75;}',
'.dn-h1{font-size:18px;}',
'.dn-h2{font-size:16px;}',
'.dn-handle{width:22px;height:22px;margin-left:-11px;margin-top:-11px;}',
'.dn-bar button{font-size:13px;padding:6px 14px;}',
'.dn-foot{font-size:10.5px;gap:6px;padding:4px 10px;}',
'.dn-pill{right:12px;bottom:14px;}}',
].join("\n")
const LAYOUT_KEY = 'dsh-note-card:layout:v1'
const COMPACT_W = 640, DOCK_TOP = 78, DOCK_RIGHT = 18, DOCK_BOTTOM = 18
const FLOAT_MARGIN = 10, CONV_GAP = 14, MIN_W = 320, MAX_W = 1000, MIN_CHAT = 380, THROTTLE_MS = 16
const SIZES = [{ id: 'std', w: 430, label: '标准' }, { id: 'wide', w: 620, label: '宽版' }, { id: 'xl', w: 900, label: '超宽' }]
const DEFAULT_LAYOUT = { mode: 'docked', x: null, y: null, w: 430, h: null, size: 'std' }
const HTML_TAGS = { b: 1, strong: 1, i: 1, em: 1, u: 1, s: 1, del: 1, mark: 1, kbd: 1, sub: 1, sup: 1, small: 1, code: 1, span: 1, a: 1, cite: 1, q: 1, abbr: 1, ins: 1 }
const assetCache = {}
// Mermaid is a declared npm dependency, served by the host half from
// node_modules at /plugins/dsh-window/vendor/mermaid.min.js. It is loaded on
// demand, so a note without diagrams never pays for the runtime, and a failed
// load simply leaves the hand-rolled renderer in place.
let mermaidPromise = null
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
function loadMermaid() {
  if (mermaidPromise !== null) return mermaidPromise
  mermaidPromise = new Promise(function (resolve, reject) {
    try {
      if (window.mermaid) { resolve(window.mermaid); return }
      const s = document.createElement('script')
      s.src = '/plugins/dsh-window/vendor/mermaid.min.js'
      s.async = true
      s.onload = function () { if (window.mermaid) resolve(window.mermaid); else reject(new Error('mermaid 未暴露全局')) }
      s.onerror = function () { reject(new Error('mermaid 脚本加载失败')) }
      document.head.appendChild(s)
    } catch (err) { reject(err) }
  })
  return mermaidPromise
}
const KW_COMMON = 'if else for while do break continue return switch case default try catch finally throw new delete typeof instanceof in of this super null undefined true false await async yield'
const KW_JS = KW_COMMON + ' var let const function class extends import export from as static get set void'
const KW_TS = KW_JS + ' interface type enum implements public private protected readonly namespace declare abstract keyof infer satisfies'
const KW_PY = 'def class return if elif else for while import from as pass break continue try except finally with lambda yield global nonlocal assert del raise in not and or is None True False async await self match case'
const KW_GO = 'package import func var const type struct interface return if else for range switch case default go defer chan map make new nil true false break continue'
const KW_JAVA = 'public private protected class interface extends implements static final void int long double float boolean char String new return if else for while do switch case default try catch finally throw throws import package this super null true false abstract synchronized enum'
const KW_SQL = 'select from where insert into values update set delete create table alter drop join left right inner outer on group by order having limit offset as and or not null distinct union all'
function kwSet(s) { const o = {}; const p = s.split(' '); for (let i = 0; i < p.length; i++) if (p[i]) o[p[i]] = 1; return o }
const KW = { js: kwSet(KW_JS), javascript: kwSet(KW_JS), jsx: kwSet(KW_JS), mjs: kwSet(KW_JS), ts: kwSet(KW_TS), typescript: kwSet(KW_TS), tsx: kwSet(KW_TS), py: kwSet(KW_PY), python: kwSet(KW_PY), go: kwSet(KW_GO), golang: kwSet(KW_GO), java: kwSet(KW_JAVA), kt: kwSet(KW_JAVA), sql: kwSet(KW_SQL), sh: kwSet('if then else fi for while do done case esac function return export local echo cd source set unset'), bash: kwSet('if then else fi for while do done case esac function return export local echo cd source set unset'), json: kwSet('true false null'), yaml: kwSet('true false null') }
function commentOf(lang) {
  const l = String(lang || '').toLowerCase()
  if (l === 'py' || l === 'python' || l === 'yaml' || l === 'sh' || l === 'bash' || l === 'toml' || l === 'ini') return { line: ['#'], block: null }
  if (l === 'sql') return { line: ['--'], block: null }
  if (l === 'html' || l === 'xml' || l === 'md' || l === 'markdown') return { line: [], block: ['<!--', '-->'] }
  if (l === 'css' || l === 'scss' || l === 'less') return { line: [], block: ['/*', '*/'] }
  return { line: ['//'], block: ['/*', '*/'] }
}
function hlTokens(line, lang) {
  const l = String(lang || '').toLowerCase()
  if (!l || l === 'text' || l === 'txt' || l === 'plain') return [{ k: 'code', t: line, off: 0 }]
  const cm = commentOf(l)
  const kw = KW[l] || null
  const isCss = l === 'css' || l === 'scss' || l === 'less'
  const isHtml = l === 'html' || l === 'xml'
  const out = []
  const n = line.length
  let i = 0
  function push(cls, from, to) { if (to > from) out.push({ k: 'code', t: line.slice(from, to), off: from, cls: cls || undefined }) }
  while (i < n) {
    const c = line[i]
    let hit = false
    for (let ci = 0; ci < cm.line.length; ci++) { if (line.startsWith(cm.line[ci], i)) { push('tk-c', i, n); i = n; hit = true; break } }
    if (hit) break
    if (cm.block && line.startsWith(cm.block[0], i)) {
      const end = line.indexOf(cm.block[1], i + cm.block[0].length)
      const to = end < 0 ? n : end + cm.block[1].length
      push('tk-c', i, to); i = to; continue
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1
      while (j < n && line[j] !== c) { if (line[j] === '\\') j++; j++ }
      push('tk-s', i, Math.min(n, j + 1)); i = Math.min(n, j + 1); continue
    }
    if (/[0-9]/.test(c) && !/[A-Za-z_$]/.test(line[i - 1] || '')) {
      let j = i
      while (j < n && /[0-9a-fA-FxX._]/.test(line[j])) j++
      push('tk-n', i, j); i = j; continue
    }
    if (/[A-Za-z_$@#\-.]/.test(c)) {
      let j = i
      while (j < n && /[A-Za-z0-9_$@#\-.]/.test(line[j])) j++
      const word = line.slice(i, j)
      const lower = word.toLowerCase()
      let cls = null
      if (isHtml && i > 0 && line[i - 1] === '<') cls = 'tk-k'
      else if (isHtml && line[j] === '=') cls = 'tk-a'
      else if (isCss && (line[j] === ':' || line[i - 1] === ':')) cls = 'tk-a'
      else if (kw && (kw[word] || kw[lower])) cls = 'tk-k'
      else if (line[j] === '(') cls = 'tk-f'
      else if (/^[A-Z][A-Za-z0-9_$]*$/.test(word)) cls = 'tk-t'
      push(cls, i, j); i = j; continue
    }
    i++
  }
  return out.length ? out : [{ k: 'code', t: line, off: 0 }]
}
function parseMermaid(body) {
  const lines = []
  for (let i = 0; i < body.length; i++) { const s = String(body[i]).trim(); if (s && !s.startsWith('%%')) lines.push(s) }
  if (!lines.length) return { ok: false, reason: 'empty' }
  const head = /^(graph|flowchart)\s+(TD|TB|LR|RL|BT)?/i.exec(lines[0])
  if (!head) return { ok: false, reason: 'unsupported' }
  const dir = (head[2] || 'TD').toUpperCase()
  const nodes = {}, order = [], edges = []
  function node(id, label, shape) {
    if (!id) return null
    if (!nodes[id]) { nodes[id] = { id: id, label: label || id, shape: shape || 'rect' }; order.push(id) }
    else if (label) { nodes[id].label = label; if (shape) nodes[id].shape = shape }
    return nodes[id]
  }
  const pick = (a, b, c, d, e) => a || b || c || d || e
  const shapePick = (b, c, d, e) => (b ? 'rect' : (c ? 'diamond' : ((d || e) ? 'round' : 'rect')))
  const RE = /^([A-Za-z0-9_\-]+)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(\(([^)]*)\)\)|\(([^)]*)\))?\s*(-->|---|-\.->|==>|--x|--o)\s*(?:\|([^|]*)\|\s*)?([A-Za-z0-9_\-]+)\s*(?:\[([^\]]*)\]|\{([^}]*)\}|\(\(([^)]*)\)\)|\(([^)]*)\))?/
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i]
    if (/^(subgraph|end|classDef|class|style|click|linkStyle|direction)\b/i.test(ln)) continue
    const m = RE.exec(ln)
    if (!m) continue
    const from = node(m[1], pick(m[2], m[3], m[4], m[5]), shapePick(m[2], m[3], m[4], m[5]))
    const to = node(m[8], pick(m[9], m[10], m[11], m[12]), shapePick(m[9], m[10], m[11], m[12]))
    if (from && to) edges.push({ from: from.id, to: to.id, label: m[7] || '' })
  }
  if (!order.length) return { ok: false, reason: 'no-nodes' }
  const depth = {}
  for (let i = 0; i < order.length; i++) depth[order[i]] = 0
  for (let pass = 0; pass < order.length + 1; pass++) {
    let changed = false
    for (let i = 0; i < edges.length; i++) { const e = edges[i]; if (depth[e.to] < depth[e.from] + 1) { depth[e.to] = depth[e.from] + 1; changed = true } }
    if (!changed) break
  }
  const levels = []
  for (let i = 0; i < order.length; i++) { const d = depth[order[i]]; if (!levels[d]) levels[d] = []; levels[d].push(order[i]) }
  const clean = []
  for (let i = 0; i < levels.length; i++) if (levels[i]) clean.push(levels[i])
  return { ok: true, dir: dir, nodes: nodes, edges: edges, levels: clean }
}
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi) }
function finite(v) { return typeof v === 'number' && Number.isFinite(v) }
function sizeOf(w) {
  let best = 'std', dist = 1e9, bestW = SIZES[0].w
  for (let i = 0; i < SIZES.length; i++) { const d = Math.abs(SIZES[i].w - w); if (d < dist) { dist = d; best = SIZES[i].id; bestW = SIZES[i].w } }
  return dist <= 60 ? { id: best, w: bestW } : { id: 'custom', w: Math.round(w) }
}
function parseLayout(raw) {
  if (raw === null || raw === undefined) return Object.assign({}, DEFAULT_LAYOUT)
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return Object.assign({}, DEFAULT_LAYOUT)
    if (p.mode !== 'docked' && p.mode !== 'floating') return Object.assign({}, DEFAULT_LAYOUT)
    const w = finite(p.w) ? clamp(p.w, MIN_W, MAX_W) : 430
    const x = finite(p.x) ? p.x : null, y = finite(p.y) ? p.y : null, hh = finite(p.h) ? p.h : null
    const size = (p.size === 'std' || p.size === 'wide' || p.size === 'xl' || p.size === 'custom') ? p.size : 'std'
    if (p.mode === 'floating' && (x === null || y === null)) return Object.assign({}, DEFAULT_LAYOUT)
    return { mode: p.mode, x: x, y: y, w: w, h: hh, size: size }
  } catch (err) { return Object.assign({}, DEFAULT_LAYOUT) }
}
function readLayout() { try { return parseLayout(window.localStorage.getItem(LAYOUT_KEY)) } catch (err) { return Object.assign({}, DEFAULT_LAYOUT) } }
function writeLayout(o) { try { window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(o)) } catch (err) { } }
function resolveGeo(layout, vw, vh) {
  const compact = vw <= COMPACT_W
  if (compact) return { compact: true, mode: 'compact', width: vw, shift: 0, style: null, dockable: false }
  const maxW = Math.max(1, Math.min(MAX_W, vw - FLOAT_MARGIN * 2))
  const width = clamp(layout.w, Math.min(MIN_W, maxW), maxW)
  const shift = width + CONV_GAP + DOCK_RIGHT
  const dockable = vw - shift >= MIN_CHAT
  if (layout.mode === 'docked' && dockable) {
    return { compact: false, mode: 'docked', width: width, shift: shift, dockable: dockable, style: { right: DOCK_RIGHT + 'px', top: DOCK_TOP + 'px', width: width + 'px', maxHeight: Math.max(200, vh - DOCK_TOP - DOCK_BOTTOM) + 'px' } }
  }
  const height = clamp(finite(layout.h) ? layout.h : Math.round(vh * 0.6), 200, Math.max(200, Math.round(vh * 0.75)))
  const maxX = Math.max(FLOAT_MARGIN, vw - width - FLOAT_MARGIN)
  const x = clamp(finite(layout.x) ? layout.x : Math.max(FLOAT_MARGIN, vw - width - DOCK_RIGHT), FLOAT_MARGIN, maxX)
  const maxY = Math.max(FLOAT_MARGIN, vh - height - FLOAT_MARGIN)
  const y = clamp(finite(layout.y) ? layout.y : DOCK_TOP, FLOAT_MARGIN, maxY)
  return { compact: false, mode: 'floating', width: width, shift: 0, dockable: dockable, style: { left: x + 'px', top: y + 'px', width: width + 'px', height: height + 'px' } }
}
function cmpPos(a, b) { if (a.line !== b.line) return a.line - b.line; return a.col - b.col }
/** Absolute offset of a 1-based line / 0-based column inside a text block. */
function offsetOfPos(text, line, col) {
  const ls = String(text).split('\n')
  let n = 0
  for (let i = 0; i < Math.min(line - 1, ls.length); i++) n += ls[i].length + 1
  return n + Math.max(0, col)
}
const WORD = /[A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff\uff10-\uff5a]/
function isLocalRef(href) { return !!href && !/^(https?:|data:|blob:|\/\/)/i.test(href) }
function imgSrc(href) { return /^\/\//.test(href) ? 'https:' + href : href }
function inlineTokens(raw) {
  const out = []
  const n = raw.length
  let i = 0
  function pushText(from, to) {
    if (to <= from) return
    const prev = out.length ? out[out.length - 1] : null
    if (prev && prev.k === 'text' && prev.off + prev.t.length === from) prev.t += raw.slice(from, to)
    else out.push({ k: 'text', t: raw.slice(from, to), off: from })
  }
  while (i < n) {
    const ch = raw[i]
    if (ch === '!' && raw[i + 1] === '[') {
      const close = raw.indexOf(']', i + 2)
      if (close > -1 && raw[close + 1] === '(') {
        const pe = raw.indexOf(')', close + 2)
        if (pe > -1) { out.push({ k: 'img', t: raw.slice(i + 2, close), href: raw.slice(close + 2, pe), off: i, len: pe - i + 1 }); i = pe + 1; continue }
      }
    }
    if (ch === '<') {
      const m = /^<(\/?)([A-Za-z][A-Za-z0-9]*)((?:\s[^<>]*)?)\/?>/.exec(raw.slice(i))
      if (m) {
        const full = m[0], tag = m[2].toLowerCase(), closing = m[1] === '/', attrs = m[3] || '', selfClose = /\/>$/.test(full)
        if (!closing && tag === 'br') { out.push({ k: 'br', t: full, off: i, len: full.length }); i += full.length; continue }
        if (!closing && tag === 'img') {
          const src = /src\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs)
          const alt = /alt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs)
          out.push({ k: 'img', t: alt ? (alt[2] || alt[3] || alt[4] || '') : '', href: src ? (src[2] || src[3] || src[4] || '') : '', off: i, len: full.length })
          i += full.length; continue
        }
        if (!closing && HTML_TAGS[tag] && !selfClose) {
          const closeAt = raw.indexOf('</' + tag, i + full.length)
          if (closeAt > -1) {
            const endM = new RegExp('^</' + tag + '\\s*>', 'i').exec(raw.slice(closeAt))
            if (endM) {
              const innerStart = i + full.length
              out.push({ k: 'html', tag: tag, t: raw.slice(innerStart, closeAt), off: i, len: closeAt + endM[0].length - i, inner: innerStart, href: tag === 'a' ? ((/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs) || [])[2] || '') : '' })
              i = closeAt + endM[0].length; continue
            }
          }
        }
      }
    }
    if (ch === '`') { const j = raw.indexOf('`', i + 1); if (j > i) { out.push({ k: 'code', t: raw.slice(i + 1, j), off: i + 1 }); i = j + 1; continue } }
    if ((ch === '*' || ch === '_') && raw[i + 1] === ch) { const j = raw.indexOf(ch + ch, i + 2); if (j > i + 1) { out.push({ k: 'strong', t: raw.slice(i + 2, j), off: i + 2 }); i = j + 2; continue } }
    if (ch === '*' || ch === '_') { const j = raw.indexOf(ch, i + 1); if (j > i + 1) { out.push({ k: 'em', t: raw.slice(i + 1, j), off: i + 1 }); i = j + 1; continue } }
    if (ch === '~' && raw[i + 1] === '~') { const j = raw.indexOf('~~', i + 2); if (j > i + 1) { out.push({ k: 'del', t: raw.slice(i + 2, j), off: i + 2 }); i = j + 2; continue } }
    if (ch === '[') {
      const close = raw.indexOf(']', i + 1)
      if (close > -1 && raw[close + 1] === '(') { const pe = raw.indexOf(')', close + 2); if (pe > -1) { out.push({ k: 'link', t: raw.slice(i + 1, close), href: raw.slice(close + 2, pe), off: i + 1 }); i = pe + 1; continue } }
    }
    let j = i + 1
    while (j < n && '`*_~[<!'.indexOf(raw[j]) === -1) j++
    pushText(i, j)
    i = j
  }
  return out
}
function parseBlocks(text) {
  const ls = String(text).split('\n')
  const blocks = []
  let i = 0
  const isSep = (s) => /^[\s|:-]+$/.test(s) && s.indexOf('-') >= 0 && s.indexOf('|') >= 0
  function alignOf(sep) {
    return sep.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) {
      const t = c.trim(), l = t.charAt(0) === ':', r = t.charAt(t.length - 1) === ':'
      return (l && r) ? 'center' : (r ? 'right' : 'left')
    })
  }
  while (i < ls.length) {
    const line = ls[i], t = line.trim()
    const fence = /^\s*(```|~~~)\s*(.*)$/.exec(line)
    if (fence) {
      const mark = fence[1], lang = fence[2].trim(), start = i
      i++
      const body = []
      while (i < ls.length) {
        const f2 = /^\s*(```|~~~)\s*$/.exec(ls[i])
        if (f2 && f2[1] === mark) break
        body.push(ls[i]); i++
      }
      if (i < ls.length) i++
      blocks.push({ k: 'code', line: start + 1, lang: lang, body: body, endLine: start + 1 + body.length })
      continue
    }
    if (t === '') { blocks.push({ k: 'blank', line: i + 1 }); i++; continue }
    const hm = /^(#{1,6})\s+(.*)$/.exec(line)
    if (hm) { const txt = hm[2], at = line.indexOf(txt); blocks.push({ k: 'h', line: i + 1, level: hm[1].length, raw: txt, base: at < 0 ? line.length : at }); i++; continue }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { blocks.push({ k: 'hr', line: i + 1 }); i++; continue }
    if (line.indexOf('|') >= 0 && i + 1 < ls.length && isSep(ls[i + 1])) {
      const start = i, align = alignOf(ls[i + 1]), rows = []
      let first = true
      i += 2
      while (i < ls.length && ls[i].indexOf('|') >= 0 && ls[i].trim() !== '') { rows.push({ raw: ls[i], line: i + 1, head: first }); first = false; i++ }
      blocks.push({ k: 'table', line: start + 1, rows: rows, align: align })
      continue
    }
    const bq = /^(\s*)>\s?(.*)$/.exec(line)
    if (bq) { const txt = bq[2], at = line.indexOf(txt); blocks.push({ k: 'quote', line: i + 1, raw: txt, base: at < 0 ? line.length : at }); i++; continue }
    const task = /^(\s*)([-*+])\s+\[([ xX])\]\s+(.*)$/.exec(line)
    if (task) { const txt = task[4], at = line.indexOf(txt); blocks.push({ k: 'li', line: i + 1, task: true, checked: task[3] !== ' ', marker: '-', raw: txt, base: at < 0 ? line.length : at }); i++; continue }
    const lm = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/.exec(line)
    if (lm) { const txt = lm[3], at = line.indexOf(txt); blocks.push({ k: 'li', line: i + 1, marker: lm[2], ordered: /\d/.test(lm[2]), raw: txt, base: at < 0 ? line.length : at }); i++; continue }
    blocks.push({ k: 'p', line: i + 1, raw: line, base: 0 })
    i++
  }
  return blocks
}
function IconPanelLeft() {
  return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' }, [
    React.createElement('rect', { key: 'r', x: 2.25, y: 3.25, width: 11.5, height: 9.5, rx: 1.75, stroke: 'currentColor', strokeWidth: 1.3 }),
    React.createElement('path', { key: 'd', d: 'M6.4 3.6v8.8', stroke: 'currentColor', strokeWidth: 1.3 }),
  ])
}
function IconChevronDown() {
  return React.createElement('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': 'true' }, [
    React.createElement('path', { key: 'p', d: 'M3.4 5.4 7 9l3.6-3.6', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
  ])
}

    // Wait for both services before apply runs. The dynamic version only
    // injected 'timer' and read slots through ctx.get, which silently skips
    // the card if slots is not up yet.
    const inject = ['slots', 'timer']
    function apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    // Own the plugin stylesheet: the permanent bundle has no `styles` service,
// so the injection is explicit and disposed with this fiber.
const STYLE_ID = 'dsh-window'
if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]') === null) {
  const styleTag = document.createElement('style')
  styleTag.setAttribute('data-plugin-css', STYLE_ID)
  styleTag.textContent = String(CSS)
  document.head.appendChild(styleTag)
  ctx.effect(function () { return function () { try { styleTag.remove() } catch (err) { } } })
}
    const h = React.createElement
    function NoteImage(props) {
      const [state, setState] = React.useState(props.href && isLocalRef(props.href) ? 'local' : 'ok')
      const [dataUrl, setDataUrl] = React.useState('')
      const [failed, setFailed] = React.useState(false)
      React.useEffect(function () {
        if (!props.href || !isLocalRef(props.href)) return undefined
        const key = props.href
        if (assetCache[key] !== undefined) {
          if (assetCache[key] === null) setFailed(true)
          else { setDataUrl(assetCache[key]); setState('ok') }
          return undefined
        }
        let alive = true
        host.call('asset', { path: key }).then(function (r) {
          if (r && r.ok && r.dataUrl) { assetCache[key] = r.dataUrl; if (alive) { setDataUrl(r.dataUrl); setState('ok') } }
          else { assetCache[key] = null; if (alive) setFailed(true) }
        }).catch(function () { assetCache[key] = null; if (alive) setFailed(true) })
        return function () { alive = false }
      }, [props.href])
      if (failed) return h('span', { className: 'dn-imgfail' }, ['\ud83d\uddbc 图片无法读取：' + String(props.href || '')])
      if (state === 'ok' && (dataUrl || !isLocalRef(props.href))) {
        return h('img', { className: props.cls, src: dataUrl || imgSrc(props.href), alt: props.alt || '', 'data-soff': props.soff, 'data-img-len': props.len, loading: 'lazy', onError: function () { setFailed(true) } })
      }
      return h('span', { className: 'dn-imgfail', 'data-soff': props.soff, 'data-img-len': props.len }, ['\ud83d\uddbc 读取中… ' + String(props.href || '')])
    }
    function MermaidBlock(props) {
      const parsed = React.useMemo(function () { return parseMermaid(props.body) }, [props.text])
      // Preferred path: the real mermaid runtime, which covers sequence/class/
      // state/gantt/pie/ER on top of graph/flowchart. The hand-rolled renderer
      // below stays as the fallback for a missing runtime or a failed diagram.
      const [mmdSvg, setMmdSvg] = React.useState('')
      const mmdSource = props.body.join('\n')
      React.useEffect(function () {
        let alive = true
        if (mmdSource.trim() === '') return undefined
        loadMermaid().then(function (mm) {
          mm.initialize({ startOnLoad: false, securityLevel: 'strict', htmlLabels: false, theme: 'default', fontFamily: 'inherit' })
          return mm.render('dnm-' + props.line + '-' + hashStr(mmdSource), mmdSource)
        }).then(function (out) {
          if (alive && out && typeof out.svg === 'string') setMmdSvg(out.svg)
        }).catch(function () { if (alive) setMmdSvg('') })
        return function () { alive = false }
      }, [mmdSource, props.line])
      const hlCls = props.hl ? (props.live ? ' dn-blk-hl-live' : ' dn-blk-hl') : ''
      if (mmdSvg !== '') {
        return h('div', { className: 'dn-mmd' + hlCls, 'data-line': props.line, ref: props.innerRef }, [
          h('div', { className: 'dn-mmd-svg', key: 'v', dangerouslySetInnerHTML: { __html: mmdSvg } }),
        ])
      }
      if (!parsed.ok) {
        return h('div', { className: 'dn-mmd' + hlCls, 'data-line': props.line, ref: props.innerRef }, [
          h('div', { className: 'dn-mmd-tag', key: 't' }, 'mermaid · 显示源码'),
          h('div', { className: 'dn-mmd-src', key: 's' }, props.body.join('\n')),
        ])
      }
      const nodes = parsed.nodes, layers = parsed.levels, isLR = parsed.dir === 'LR' || parsed.dir === 'RL'
      const layerEls = []
      for (let li = 0; li < layers.length; li++) {
        const ids = layers[li], chips = []
        for (let i = 0; i < ids.length; i++) { const nd = nodes[ids[i]]; chips.push(h('span', { className: 'dn-mmd-node', key: ids[i], 'data-shape': nd.shape }, nd.label)) }
        layerEls.push(h('div', { className: isLR ? 'dn-mmd-col' : 'dn-mmd-layer', key: 'L' + li }, chips))
        if (li < layers.length - 1) {
          const labels = []
          for (let ei = 0; ei < parsed.edges.length; ei++) {
            const e = parsed.edges[ei]
            if (layers[li].indexOf(e.from) >= 0 && layers[li + 1].indexOf(e.to) >= 0 && e.label) labels.push(e.label)
          }
          const uniq = []
          for (let i = 0; i < labels.length; i++) if (uniq.indexOf(labels[i]) < 0) uniq.push(labels[i])
          layerEls.push(h('div', { className: 'dn-mmd-arrow', key: 'A' + li }, (isLR ? '\u2192' : '\u2193') + (uniq.length ? ' ' + uniq.join('/') : '')))
        }
      }
      return h('div', { className: 'dn-mmd' + hlCls, 'data-line': props.line, ref: props.innerRef }, [
        h('div', { className: 'dn-mmd-tag', key: 't' }, 'mermaid · ' + parsed.dir + ' · ' + Object.keys(nodes).length + ' 节点 · ' + parsed.edges.length + ' 边'),
        h('div', { className: isLR ? 'dn-mmd-h' : 'dn-mmd-v', key: 'g' }, layerEls),
      ])
    }
    function NoteCard(props) {
      const [st, setSt] = React.useState(null)
      const [mode, setMode] = React.useState('read')
      const [draft, setDraft] = React.useState('')
      const [dirty, setDirty] = React.useState(false)
      const [hidden, setHidden] = React.useState(false)
      const [live, setLive] = React.useState(null)
      const [pressing, setPressing] = React.useState(false)
      // Lazy action-bar reveal: hidden while a gesture is in motion, shown on
      // mouse release, or after the caret has been still for 1.5s on touch.
      const [barReady, setBarReady] = React.useState(false)
      const barTimerRef = React.useRef(null)
      const modRef = React.useRef('mouse')
      const [toast, setToast] = React.useState('')
      const [panel, setPanel] = React.useState(false)
      const [busy, setBusy] = React.useState('')
      const [offline, setOffline] = React.useState(false)
      const [layout, setLayout] = React.useState(readLayout)
      const [geoVer, setGeoVer] = React.useState(0)
      const [bounds, setBounds] = React.useState(function () { try { return { w: window.innerWidth, h: window.innerHeight } } catch (err) { return { w: 1280, h: 800 } } })
      const [dragging, setDragging] = React.useState(false)
      const useSessionsHook = (props && typeof props.useSessions === 'function') ? props.useSessions : function () { return undefined }
      const shownSessionId = useSessionsHook(function (s) { return s ? s.current : undefined })
      const rootRef = React.useRef(null)
      const bodyRef = React.useRef(null)
      const lineEls = React.useRef({})
      const refCbs = React.useRef({})
      const revRef = React.useRef(-1)
      const draftRef = React.useRef('')
      const dirtyRef = React.useRef(false)
      const saveTimer = React.useRef(null)
      const lpTimer = React.useRef(null)
      const drag = React.useRef(null)
      const moveDrag = React.useRef(null)
      const textRef = React.useRef('')
      const unbindRef = React.useRef(null)
      const sidRef = React.useRef('')
      const firstLayoutRef = React.useRef(true)
      const editorRef = React.useRef(null)
      const caretRef = React.useRef(null)
      const throttleRef = React.useRef(0)
      const pendingRef = React.useRef(null)
      const liveRef = React.useRef(null)
      const geoRef = React.useRef({ ver: -1, lines: {} })
      sidRef.current = shownSessionId || ''
      function notify(msg) { setToast(msg) }
      /** Hide the action bar and cancel any pending reveal. */
      function hideBar() {
        setBarReady(false)
        if (barTimerRef.current !== null) { try { window.clearTimeout(barTimerRef.current) } catch (err) { } barTimerRef.current = null }
      }
      /** Reveal the action bar now (delay 0) or after `delay` ms of stillness. */
      function revealBar(delay) {
        if (barTimerRef.current !== null) { try { window.clearTimeout(barTimerRef.current) } catch (err) { } barTimerRef.current = null }
        if (!delay) { setBarReady(true); return }
        barTimerRef.current = window.setTimeout(function () { barTimerRef.current = null; setBarReady(true) }, delay)
      }
      function selCount() { return st && st.selections ? st.selections.length : 0 }
      function bump() { setGeoVer(function (v) { return v + 1 }) }
      // Declared before its first use: a useEffect dependency array is evaluated
      // during render, so resolving it after the hooks that read it threw
      // "Cannot access 'geo' before initialization" and crashed the whole card.
      const geo = resolveGeo(layout, bounds.w, bounds.h)
      React.useEffect(function () {
        let win = null
        try { win = window } catch (err) { win = null }
        if (!win) return undefined
        const apply = function () { setBounds({ w: win.innerWidth, h: win.innerHeight }); bump() }
        apply()
        win.addEventListener('resize', apply)
        return function () { win.removeEventListener('resize', apply) }
      }, [])
      React.useEffect(function () {
        if (firstLayoutRef.current) { firstLayoutRef.current = false; return }
        writeLayout(layout)
      }, [layout])
      // st.revision is in the deps so the first content render re-measures: refs
      // attach after that render, so without this the saved highlights of a
      // freshly loaded note stayed invisible until some later geometry change.
      React.useEffect(function () { bump() }, [geo.width, geo.mode, panel, hidden, mode, bounds.w, bounds.h, st ? st.revision : -1])
      function applyState(r) {
        if (!r || r.unchanged) return
        revRef.current = r.revision
        textRef.current = r.text
        setSt(r)
        bump()
        if (!dirtyRef.current) { draftRef.current = r.text; setDraft(r.text) }
      }
      React.useEffect(function () {
        let alive = true
        const tick = function () {
          host.call('state', { revision: revRef.current, sessionId: sidRef.current }).then(function (r) {
            if (!alive) return
            setOffline(false)
            applyState(r)
          }).catch(function () { if (alive) setOffline(true) })
        }
        tick()
        const stop = ctx.interval(tick, 2000)
        return function () { alive = false; stop() }
      }, [])
      React.useEffect(function () {
        if (!toast) return undefined
        return ctx.timeout(function () { setToast('') }, 3200)
      }, [toast])
      const visible = !!st && !hidden && !(st.sessionId && shownSessionId && st.sessionId !== shownSessionId)
      const shouldYield = visible && !geo.compact && geo.mode === 'docked'
      React.useEffect(function () {
        let root = null
        try { root = document.documentElement } catch (err) { root = null }
        if (!root) return undefined
        if (shouldYield) root.setAttribute('data-dn-open', '')
        else root.removeAttribute('data-dn-open')
        if (shouldYield) root.style.setProperty('--dn-shift', geo.shift + 'px')
        else root.style.removeProperty('--dn-shift')
        return function () { root.removeAttribute('data-dn-open'); root.style.removeProperty('--dn-shift') }
      }, [shouldYield, geo.shift])
      function firstTextNode(el) { for (let i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) return el.childNodes[i]; return null }
      function bodyOrigin() {
        const body = bodyRef.current
        const br = body.getBoundingClientRect()
        return { left: br.left - body.scrollLeft, top: br.top - body.scrollTop }
      }
      // Per-line character boxes, measured once and cached. Pointer->column,
      // column->handle and the highlight rectangles all read this cache, so
      // they can never disagree and moving the pointer does no layout work.
      function cellsOf(line) {
        const cache = geoRef.current
        // Key on the geometry itself, not just the version counter: bump() only
        // runs after paint, so a width change reused character boxes measured at
        // the previous width and flashed the highlights over the wrong text for
        // one frame (reported as "clicking W momentarily selects some text").
        const key = geoVer + '|' + Math.round(geo.width) + '|' + geo.mode + '|' + (geo.compact ? 1 : 0)
        if (cache.key !== key) { cache.key = key; cache.lines = {} }
        const hit = cache.lines[line]
        if (hit !== undefined) return hit
        const rec = { cells: [], rect: null }
        const el = lineEls.current[line]
        const body = bodyRef.current
        if (el && el.isConnected && body) {
          const o = bodyOrigin()
          const er = el.getBoundingClientRect()
          rec.rect = { left: er.left - o.left, top: er.top - o.top, right: er.right - o.left, bottom: er.bottom - o.top, height: er.height }
          const spans = el.querySelectorAll('[data-soff]')
          const cells = []
          for (let i = 0; i < spans.length; i++) {
            const s = spans[i]
            const soff = Number(s.getAttribute('data-soff'))
            const imgLen = Number(s.getAttribute('data-img-len'))
            if (!Number.isFinite(soff)) continue
            const tn = firstTextNode(s)
            if (!tn) {
              if (Number.isFinite(imgLen)) {
                const r = s.getBoundingClientRect()
                cells.push({ off: soff, len: imgLen, img: true, top: r.top - o.top, bottom: r.bottom - o.top, left: r.left - o.left, right: r.right - o.left })
              }
              continue
            }
            const txt = tn.nodeValue || ''
            const d = s.ownerDocument
            for (let k = 0; k < txt.length; k++) {
              let r = null
              try { const rg = d.createRange(); rg.setStart(tn, k); rg.setEnd(tn, k + 1); const rs = rg.getClientRects(); if (rs && rs.length) r = rs[0] } catch (err) { r = null }
              if (!r) continue
              cells.push({ off: soff + k, len: 1, top: r.top - o.top, bottom: r.bottom - o.top, left: r.left - o.left, right: r.right - o.left })
            }
          }
          cells.sort(function (a, b) { return a.off - b.off })
          rec.cells = cells
        }
        cache.lines[line] = rec
        return rec
      }
      function cellScore(c, x, y) {
        const dy = y < c.top ? c.top - y : (y > c.bottom ? y - c.bottom : 0)
        const dx = x < c.left ? c.left - x : (x > c.right ? x - c.right : 0)
        return dy * 1000 + dx
      }
      function snapCol(line, col) {
        const cells = cellsOf(line).cells
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i]
          if (!c.img) continue
          if (col > c.off && col < c.off + c.len) return (col - c.off) * 2 < c.len ? c.off : c.off + c.len
        }
        return col
      }
      // The line is chosen from the pointer's y band only; x never pulls the
      // caret into another line. Inside the line a binary search over character
      // boxes (ordered by visual row then x) finds the exact character, and
      // anything past the last box clamps to the line end instead of flipping
      // back to an earlier span — that heuristic caused both the flicker in
      // empty areas and the backwards jump when moving right.
      function pointToPos(clientX, clientY) {
        const body = bodyRef.current
        if (!body) return null
        const o = bodyOrigin()
        const x = clientX - o.left, y = clientY - o.top
        let pick = null, pickScore = 1e12
        const keys = Object.keys(lineEls.current)
        for (let i = 0; i < keys.length; i++) {
          const el = lineEls.current[keys[i]]
          if (!el || !el.isConnected) continue
          const r = el.getBoundingClientRect()
          if (r.height <= 0) continue
          const top = r.top - o.top, bottom = r.bottom - o.top
          const score = (y >= top && y <= bottom) ? (-1 - 1 / (1 + (bottom - top))) : (y < top ? (top - y) : (y - bottom))
          if (score < pickScore) { pickScore = score; pick = Number(keys[i]) }
        }
        if (pick === null) return null
        const cells = cellsOf(pick).cells
        if (!cells.length) return { line: pick, col: 0 }
        let lo = 0, hi = cells.length
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          const c = cells[mid]
          let side
          if (c.bottom <= y) side = -1
          else if (c.top >= y) side = 1
          else if (c.right <= x) side = -1
          else if (c.left >= x) side = 1
          else side = 0
          if (side >= 0) hi = mid; else lo = mid + 1
        }
        let best = Math.min(lo, cells.length - 1)
        let bestScore = cellScore(cells[best], x, y)
        for (let k = Math.max(0, best - 2); k <= Math.min(cells.length - 1, best + 2); k++) {
          const s = cellScore(cells[k], x, y)
          if (s < bestScore) { bestScore = s; best = k }
        }
        const c = cells[best]
        const col = c.img ? (x >= (c.left + c.right) / 2 ? c.off + c.len : c.off) : (c.off + (x >= (c.left + c.right) / 2 ? 1 : 0))
        return { line: pick, col: Math.max(0, snapCol(pick, col)) }
      }
      function posToPoint(line, col) {
        const rec = cellsOf(line)
        const cells = rec.cells
        if (!cells.length) { return rec.rect ? { x: rec.rect.left, y: rec.rect.top, h: rec.rect.height || 18 } : null }
        let best = -1
        for (let i = 0; i < cells.length; i++) { if (cells[i].off <= col) best = i; else break }
        if (best < 0) best = 0
        const c = cells[best]
        const atEnd = col >= c.off + c.len
        return { x: atEnd ? c.right : c.left, y: c.top, h: Math.max(12, c.bottom - c.top) }
      }
      function highlightRects(line, ranges) {
        const cells = cellsOf(line).cells
        const out = []
        for (let ri = 0; ri < ranges.length; ri++) {
          const r = ranges[ri]
          if (r.to <= r.from) continue
          let run = null
          for (let i = 0; i < cells.length; i++) {
            const c = cells[i]
            if (c.off + c.len <= r.from || c.off >= r.to) continue
            const row = Math.round(c.top)
            if (run && run.row === row && c.left - run.right <= 3) { run.right = Math.max(run.right, c.right); run.bottom = Math.max(run.bottom, c.bottom) }
            else { if (run) out.push(run); run = { row: row, kind: r.kind, left: c.left, right: c.right, top: c.top, bottom: c.bottom } }
          }
          if (run) out.push(run)
        }
        return out
      }
      function wordRange(pt) {
        const ls = String(textRef.current).split('\n')
        const rawLine = ls[pt.line - 1] || ''
        let a = Math.min(pt.col, rawLine.length)
        if (a >= rawLine.length || !WORD.test(rawLine.charAt(a))) return { from: a, to: a }
        let b = a
        while (a > 0 && WORD.test(rawLine.charAt(a - 1))) a--
        while (b < rawLine.length && WORD.test(rawLine.charAt(b))) b++
        return { from: a, to: b }
      }
      function copyText(t) {
        let d = null
        try { d = document } catch (err) { d = null }
        if (!d) return Promise.resolve(false)
        let nav = null
        try { nav = window.navigator } catch (err) { nav = null }
        if (nav && nav.clipboard && nav.clipboard.writeText) return nav.clipboard.writeText(t).then(function () { return true }).catch(function () { return legacyCopy(d, t) })
        return Promise.resolve(legacyCopy(d, t))
      }
      function legacyCopy(d, t) {
        try {
          const ta = d.createElement('textarea')
          ta.value = t; ta.style.position = 'fixed'; ta.style.left = '-9999px'
          d.body.appendChild(ta); ta.select()
          const ok = d.execCommand('copy')
          d.body.removeChild(ta)
          return ok
        } catch (err) { return false }
      }
      function liveText() {
        if (!live) return ''
        const first = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
        const last = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
        const ls = String(textRef.current).split('\n')
        if (first.line === last.line) return (ls[first.line - 1] || '').slice(first.col, last.col)
        const parts = [(ls[first.line - 1] || '').slice(first.col)]
        for (let i = first.line; i < last.line - 1; i++) parts.push(ls[i] || '')
        parts.push((ls[last.line - 1] || '').slice(0, last.col))
        return parts.join('\n')
      }
      function commitLive() {
        if (!live) return
        const first = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
        const last = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
        if (first.line === last.line && first.col === last.col) { notify('没有选中文字：可拖动圆点确定范围'); return }
        host.call('addSelection', { startLine: first.line, startCol: first.col, endLine: last.line, endCol: last.col }).then(function (r) {
          if (r && r.ok) {
            revRef.current = r.revision
            setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev })
            setLive(null)
            notify('已选中 第' + first.line + '~' + last.line + ' 行')
          } else notify(r && r.reason === 'empty' ? '选中的是空白内容' : '选中失败')
        }).catch(function (err) { notify('选中失败: ' + err.message) })
      }
      function flush(silent) {
        if (saveTimer.current) { saveTimer.current(); saveTimer.current = null }
        const text = draftRef.current
        if (st && text === st.text) { setDirty(false); dirtyRef.current = false; return Promise.resolve(true) }
        setBusy('保存中')
        return host.call('saveText', { text: text, baseRevision: revRef.current, sessionId: sidRef.current }).then(function (r) {
          setBusy('')
          if (r && r.conflict) { notify('笔记已被外部改动，本次未写入，请点[重载]'); return false }
          if (r && r.ok) {
            revRef.current = r.revision
            textRef.current = text
            setSt(function (prev) { return prev ? Object.assign({}, prev, { text: text, revision: r.revision, lineCount: r.lineCount, selections: r.selections, savedAt: r.savedAt }) : prev })
            bump()
            setDirty(false); dirtyRef.current = false
            if (!silent) notify('已写入磁盘')
            return true
          }
          notify('写入失败: ' + ((r && r.error) || '未知错误'))
          return false
        }).catch(function (err) { setBusy(''); notify('写入失败: ' + err.message); return false })
      }
      function doCommit() {
        const go = mode === 'edit' ? flush(true) : Promise.resolve(true)
        return go.then(function (ok) {
          if (!ok) return undefined
          setBusy('提交中')
          return host.call('commit', { message: 'note: ' + new Date().toLocaleString() }).then(function (r) {
            setBusy('')
            if (r && r.ok) {
              if (r.nothing) notify('没有需要提交的改动')
              else {
                notify('已提交 ' + r.hash)
                setSt(function (prev) { return prev ? Object.assign({}, prev, { commitHash: r.hash, committedAt: new Date().toISOString() }) : prev })
              }
            } else notify('提交失败: ' + ((r && r.error) || '未知错误'))
          })
        }).catch(function (err) { setBusy(''); notify('提交失败: ' + err.message) })
      }
      function doReload() {
        host.call('reload', {}).then(function (r) {
          if (r && r.ok) {
            revRef.current = r.revision; textRef.current = r.text
            setSt(r); draftRef.current = r.text; setDraft(r.text)
            bump(); setDirty(false); dirtyRef.current = false
            notify('已重载磁盘内容')
          } else notify('重载失败')
        }).catch(function (err) { notify('重载失败: ' + err.message) })
      }
      function clearSelections() {
        host.call('clearSelections', {}).then(function (r) {
          if (r && r.ok) { revRef.current = r.revision; setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev }); notify('已清空全部选中') }
        })
      }
      function removeSelection(id) {
        host.call('removeSelection', { id: id }).then(function (r) {
          if (r && r.ok) { revRef.current = r.revision; setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev }) }
        })
      }
      function enterEdit(pt) {
        setLive(null); setPressing(false)
        draftRef.current = st ? st.text : ''
        setDraft(draftRef.current)
        // Remember where the double click landed: the editor opens with the
        // caret on that character instead of at the top of the note.
        caretRef.current = pt || null
        dirtyRef.current = false; setDirty(false); setMode('edit')
      }
      // Place the caret once the editor exists. Double clicking a block must
      // open editing at the clicked character, scrolled into view. Deferred to a
      // macrotask because the browser's own double-click handling (focus/selection
      // default action) runs after this event and would otherwise win.
      React.useEffect(function () {
        if (mode !== 'edit') return undefined
        const pt = caretRef.current
        if (!pt) return undefined
        caretRef.current = null
        const place = function () {
          const ta = editorRef.current
          if (!ta) return
          const off = offsetOfPos(draftRef.current, pt.line, pt.col)
          try {
            ta.focus()
            ta.setSelectionRange(off, off)
            ta.scrollTop = Math.max(0, (pt.line - 2) * 20 - ta.clientHeight / 3)
          } catch (err) { }
        }
        // window.setTimeout, not ctx.timeout: a cordis timer scheduled from inside
        // a React effect never fired here (verified — the callback below was
        // reached only after switching to the native timer). Applied twice
        // because the browser's double-click default action can still take focus
        // back after the first attempt.
        const id = window.setTimeout(place, 40)
        const retry = window.setTimeout(place, 180)
        const settle = window.setTimeout(place, 520)
        return function () { try { window.clearTimeout(id); window.clearTimeout(retry); window.clearTimeout(settle) } catch (err) { } }
      }, [mode])
      function onDraft(e) {
        const v = e.target.value
        draftRef.current = v; setDraft(v); setDirty(true); dirtyRef.current = true
        if (saveTimer.current) saveTimer.current()
        saveTimer.current = ctx.timeout(function () { saveTimer.current = null; flush(true) }, 900)
      }
      function pointFromEvent(e) {
        if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
        if (e.changedTouches && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        return { x: e.clientX, y: e.clientY }
      }
      function samePos(a, b) { return !!a && !!b && a.line === b.line && a.col === b.col }
      function flushPending() {
        throttleRef.current = 0
        const p = pendingRef.current, d = drag.current
        if (!p || !d) return
        if (d.mode === 'drag') {
          setLive(function (prev) { if (!prev) return prev; if (samePos(prev.f, p)) return prev; return { a: prev.a, f: p } })
        } else if (d.mode === 'handle') {
          const which = d.which
          setLive(function (prev) {
            if (!prev) return prev
            if (which === 'a') { if (samePos(prev.a, p)) return prev; return { a: p, f: prev.f } }
            if (samePos(prev.f, p)) return prev
            return { a: prev.a, f: p }
          })
        }
      }
      function scheduleLive(pt) {
        pendingRef.current = pt
        const now = Date.now()
        if (now - (liveRef.current || 0) >= THROTTLE_MS) { liveRef.current = now; flushPending(); return }
        if (throttleRef.current) return
        throttleRef.current = ctx.timeout(function () { throttleRef.current = 0; liveRef.current = Date.now(); flushPending() }, THROTTLE_MS)
      }
      function onDragMove(ev) {
        const d = drag.current
        if (!d) return
        if (d.mode === 'press') {
          const p0 = pointFromEvent(ev)
          if (Math.abs(p0.x - d.x) > 8 || Math.abs(p0.y - d.y) > 8) {
            if (lpTimer.current) { lpTimer.current(); lpTimer.current = null }
            drag.current = null; setPressing(false)
            if (unbindRef.current) { const u = unbindRef.current; unbindRef.current = null; u() }
          }
          return
        }
        const p = pointFromEvent(ev)
        const pt = pointToPos(p.x, p.y)
        if (!pt) return
        scheduleLive(pt)
        hideBar()
        if (modRef.current === 'touch') revealBar(1500)
      }
      function onDragEnd() {
        if (lpTimer.current) { lpTimer.current(); lpTimer.current = null }
        if (throttleRef.current) { throttleRef.current(); throttleRef.current = 0 }
        if (pendingRef.current && drag.current) flushPending()
        drag.current = null; setPressing(false)
        revealBar(modRef.current === 'touch' ? 1500 : 0)
      }
      function bindPointer(el) {
        if (unbindRef.current) { const u = unbindRef.current; unbindRef.current = null; u() }
        const move = function (ev) { onDragMove(ev) }
        const end = function () { unbind(); onDragEnd() }
        function unbind() {
          try {
            el.removeEventListener('pointermove', move); el.removeEventListener('mousemove', move); el.removeEventListener('touchmove', move)
            el.removeEventListener('pointerup', end); el.removeEventListener('mouseup', end); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', end); el.removeEventListener('pointercancel', end)
          } catch (err) { }
          if (unbindRef.current === unbind) unbindRef.current = null
        }
        try {
          el.addEventListener('pointermove', move); el.addEventListener('mousemove', move); el.addEventListener('touchmove', move, { passive: true })
          el.addEventListener('pointerup', end); el.addEventListener('mouseup', end); el.addEventListener('touchend', end); el.addEventListener('touchcancel', end); el.addEventListener('pointercancel', end)
        } catch (err) { }
        unbindRef.current = unbind
      }
      function onBodyDown(e) {
        if (mode !== 'read') return
        if (e.button !== undefined && e.button !== 0) return
        const tgt = e.target
        if (tgt && tgt.closest && tgt.closest('a,button')) return
        // Never begin a selection gesture on a scrollbar: dragging the table's
        // horizontal scrollbar used to run the long-press timer and leave a
        // stray selection behind. Only the scrollbar strip is excluded, so text
        // inside a wide table stays selectable.
        const scroller = tgt && tgt.closest ? tgt.closest('.dn-twrap,.dn-pre,.dn-mmd') : null
        if (scroller && (tgt === scroller || e.clientY >= scroller.getBoundingClientRect().bottom - 12)) return
        if (live) setLive(null)
        modRef.current = e.pointerType === 'touch' ? 'touch' : 'mouse'
        hideBar()
        const pt = pointToPos(e.clientX, e.clientY)
        if (!pt) return
        const el = e.currentTarget
        try { el.setPointerCapture(e.pointerId) } catch (err) { }
        drag.current = { mode: 'press', x: e.clientX, y: e.clientY, pt: pt }
        setPressing(true)
        if (lpTimer.current) { lpTimer.current(); lpTimer.current = null }
        lpTimer.current = ctx.timeout(function () {
          lpTimer.current = null
          const d = drag.current
          if (!d || d.mode !== 'press') return
          d.mode = 'drag'
          const w = wordRange(d.pt)
          const a = Math.min(w.from, w.to), f = Math.max(w.from, w.to)
          setLive({ a: { line: d.pt.line, col: snapCol(d.pt.line, a) }, f: { line: d.pt.line, col: snapCol(d.pt.line, f) } })
        }, 400)
        bindPointer(el)
      }
      function handleDown(which) {
        return function (e) {
          e.preventDefault(); e.stopPropagation()
          hideBar()
          const el = e.currentTarget
          try { el.setPointerCapture(e.pointerId) } catch (err) { }
          drag.current = { mode: 'handle', which: which }
          bindPointer(el)
        }
      }
      function onDoubleClick(e) {
        if (mode !== 'read') return
        const tgt = e.target
        if (tgt && tgt.closest) { const a = tgt.closest('a'); if (a && a.getAttribute('href') && a.getAttribute('href') !== '#') return }
        enterEdit(pointToPos(e.clientX, e.clientY))
      }
      function headDown(e) {
        if (geo.compact) return
        if (e.button !== undefined && e.button !== 0) return
        const tgt = e.target
        if (tgt && tgt.closest && tgt.closest('button')) return
        const node = rootRef.current
        if (!node) return
        const r = node.getBoundingClientRect()
        const vw = bounds.w, vh = bounds.h
        const startRect = { x: r.left, y: r.top, width: r.width, height: r.height }
        const el = e.currentTarget
        moveDrag.current = { sx: e.clientX, sy: e.clientY, rect: startRect, moved: false }
        try { el.setPointerCapture(e.pointerId) } catch (err) { }
        const move = function (ev) {
          const d = moveDrag.current
          if (!d) return
          const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy
          if (!d.moved) {
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
            d.moved = true; setDragging(true)
          }
          const sz = sizeOf(d.rect.width)
          const w = Math.min(sz.w, vw - FLOAT_MARGIN * 2)
          const h = Math.min(d.rect.height, Math.max(200, Math.round(vh * 0.75)))
          const maxX = Math.max(FLOAT_MARGIN, vw - w - FLOAT_MARGIN), maxY = Math.max(FLOAT_MARGIN, vh - h - FLOAT_MARGIN)
          const nx = clamp(clamp(d.rect.x, FLOAT_MARGIN, maxX) + dx, FLOAT_MARGIN, maxX)
          const ny = clamp(clamp(d.rect.y, FLOAT_MARGIN, maxY) + dy, FLOAT_MARGIN, maxY)
          setLayout(function (prev) { return Object.assign({}, prev, { mode: 'floating', x: nx, y: ny, w: w, h: h, size: sz.id }) })
        }
        const end = function () {
          try { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', end); el.removeEventListener('pointercancel', end) } catch (err) { }
          moveDrag.current = null; setDragging(false); bump()
        }
        try { el.addEventListener('pointermove', move); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end) } catch (err) { }
      }
      function resetDock() { setLayout(function (prev) { return { mode: 'docked', x: null, y: null, w: prev.w, h: null, size: prev.size } }) }
      function cycleSize() {
        setLayout(function (prev) {
          const ids = SIZES.map(function (s) { return s.id })
          const next = SIZES[(ids.indexOf(prev.size) + 1) % SIZES.length]
          return Object.assign({}, prev, { size: next.id, w: next.w })
        })
      }
      function btn(label, onClick, opts) {
        const o = opts || {}
        return h('button', { className: 'dn-btn' + (o.active ? ' dn-btn-on' : ''), onClick: onClick, title: o.title || label, key: label }, label)
      }
      if (!st) return null
      if (st.sessionId && sidRef.current && st.sessionId !== sidRef.current) return null
      if (hidden) {
        return h('button', { className: 'dn-pill', title: '展开笔记卡片', onClick: function () { setHidden(false) }, 'data-note-pill': '' }, [
          h('span', { key: 'i' }, '\ud83d\udcdd'), h('span', { key: 't' }, '笔记'),
          selCount() > 0 ? h('span', { className: 'dn-pillcount', key: 'c' }, String(selCount())) : null,
        ])
      }
      const selList = st.selections || []
      function lineElsFor(line) {
        let cb = refCbs.current[line]
        if (cb === undefined) { cb = function (el) { if (el) lineEls.current[line] = el }; refCbs.current[line] = cb }
        return cb
      }
      function renderTokens(toks, keyPrefix) {
        const out = []
        let n = 0
        for (let i = 0; i < toks.length; i++) {
          const tk = toks[i]
          if (tk.k === 'img') {
            out.push(h(NoteImage, { key: keyPrefix + 'img' + i, href: tk.href, alt: tk.t, soff: tk.base + tk.off, len: tk.len || (tk.t ? tk.t.length : 0), cls: 'dn-img' }))
            continue
          }
          if (tk.k === 'br') { out.push(h('br', { key: keyPrefix + 'br' + i })); continue }
          if (tk.k === 'html') {
            const inner = renderTokens(inlineTokens(tk.t).map(function (x) { x.base = tk.base + tk.inner; return x }), keyPrefix + 'h' + i + '_')
            const t = tk.tag
            const pcls = t === 'kbd' ? 'dn-html-kbd' : (t === 'mark' ? 'dn-html-mark' : '')
            if (t === 'a') out.push(h('a', { className: 'dn-lnk', href: tk.href || '#', target: '_blank', rel: 'noreferrer', key: keyPrefix + 'a' + i }, inner))
            else out.push(h(t, { className: pcls || undefined, key: keyPrefix + 't' + i }, inner))
            continue
          }
          const cls = ['dn-i']
          if (tk.k === 'strong') cls.push('dn-b')
          if (tk.k === 'em') cls.push('dn-em')
          if (tk.k === 'del') cls.push('dn-del')
          if (tk.k === 'code' && !tk.cls) cls.push('dn-code')
          if (tk.k === 'link') cls.push('dn-lnk')
          if (tk.cls) cls.push(tk.cls)
          const props = { className: cls.join(' '), 'data-soff': (tk.base || 0) + tk.off, key: keyPrefix + 's' + (n++) }
          if (tk.k === 'link') { props.href = tk.href || '#'; props.target = '_blank'; props.rel = 'noreferrer'; out.push(h('a', props, tk.t)) }
          else out.push(h('span', props, tk.t))
        }
        return out
      }
      function withBase(toks, base) { for (let i = 0; i < toks.length; i++) toks[i].base = base; return toks }
      function lineSpans(raw, base, plain) { return renderTokens(withBase(plain ? [{ k: 'code', t: raw, off: 0 }] : inlineTokens(raw), base), 'l' + base + '_') }
      function renderBlocks() {
        const sels = st.selections
        const blocks = parseBlocks(st.text)
        const out = []
        for (let bi = 0; bi < blocks.length; bi++) {
          const b = blocks[bi]
          const key = 'b' + bi
          if (b.k === 'blank') { out.push(h('div', { className: 'dn-blank', 'data-line': b.line, key: key, ref: lineElsFor(b.line) })); continue }
          if (b.k === 'hr') { out.push(h('div', { className: 'dn-hr', 'data-line': b.line, key: key, ref: lineElsFor(b.line) })); continue }
          if (b.k === 'h') { out.push(h('div', { className: 'dn-h dn-h' + b.level, 'data-line': b.line, key: key, ref: lineElsFor(b.line) }, lineSpans(b.raw, b.base, false))); continue }
          if (b.k === 'quote') { out.push(h('div', { className: 'dn-quote', 'data-line': b.line, key: key, ref: lineElsFor(b.line) }, lineSpans(b.raw, b.base, false))); continue }
          if (b.k === 'li') {
            const marker = b.task
              ? h('span', { className: 'dn-bullet', key: 'm' }, b.checked ? '\u2611' : '\u2610')
              : h('span', { className: 'dn-bullet', key: 'm' }, b.ordered ? b.marker : '\u2022')
            out.push(h('div', { className: 'dn-li', 'data-line': b.line, key: key, ref: lineElsFor(b.line) },
              [marker, h('div', { className: 'dn-li-body', key: 'b' }, lineSpans(b.raw, b.base, false))]))
            continue
          }
          if (b.k === 'code') {
            const lang = (b.lang || '').toLowerCase()
            if (lang === 'mermaid') {
              let hlKind = null
              for (let i = 0; i < sels.length; i++) { const s = sels[i]; if (s.startLine <= b.endLine && s.endLine >= b.line) hlKind = 'saved' }
              if (live) {
                const lo = Math.min(live.a.line, live.f.line), hi = Math.max(live.a.line, live.f.line)
                if (lo <= b.endLine && hi >= b.line) hlKind = 'live'
              }
              out.push(h(MermaidBlock, { key: key, line: b.line, body: b.body, text: st.text, hl: !!hlKind, live: hlKind === 'live', innerRef: lineElsFor(b.line) }))
              continue
            }
            const rows = []
            for (let i = 0; i < b.body.length; i++) {
              const ln = b.line + 1 + i
              rows.push(h('div', { className: 'dn-code-line', 'data-line': ln, key: 'c' + i, ref: lineElsFor(ln) }, renderTokens(withBase(hlTokens(b.body[i], lang), 0), 'c' + ln + '_')))
            }
            out.push(h('pre', { className: 'dn-pre', key: key, 'data-line': b.line, ref: lineElsFor(b.line) }, rows.length ? rows : [h('div', { className: 'dn-code-line', 'data-line': b.line + 1, key: 'e' }, ' ')]))
            continue
          }
          if (b.k === 'table') {
            const rows = []
            for (let ri = 0; ri < b.rows.length; ri++) {
              const row = b.rows[ri]
              const cells = row.raw.split('|')
              const kids = []
              let search = 0
              for (let ci = 0; ci < cells.length; ci++) {
                const txt = cells[ci].trim()
                if (txt === '' && (ci === 0 || ci === cells.length - 1) && cells.length > 2) continue
                const at = row.raw.indexOf(txt, search)
                const base = at < 0 ? search : at
                search = base + txt.length
                kids.push(h(row.head ? 'th' : 'td', {
                  className: row.head ? 'dn-th' : 'dn-td',
                  key: 'd' + ci,
                  style: { textAlign: b.align && b.align[ci] ? b.align[ci] : 'left' },
                }, lineSpans(txt, base, false)))
              }
              rows.push(h('tr', { className: 'dn-tr', 'data-line': row.line, key: 'r' + ri, ref: lineElsFor(row.line) }, kids))
            }
            out.push(h('div', { className: 'dn-twrap', key: key, 'data-dn-table': '', title: '可左右滑动查看完整表格' }, [h('table', { className: 'dn-table', key: 't' }, [h('tbody', { key: 'b' }, rows)])]))
            continue
          }
          out.push(h('div', { className: 'dn-p', 'data-line': b.line, key: key, ref: lineElsFor(b.line) }, lineSpans(b.raw, b.base, false)))
        }
        return out
      }
      const bodyKids = mode === 'edit'
        ? [h('textarea', { className: 'dn-editor', key: 'ed', ref: editorRef, value: draft, onChange: onDraft, onPointerDown: function (e) { e.stopPropagation() }, onDoubleClick: function (e) { e.stopPropagation() }, spellCheck: false })]
        : renderBlocks()
      if (mode === 'read') {
        const byLine = {}
        const lines = String(st.text).split('\n')
        for (let i = 0; i < selList.length; i++) {
          const s = selList[i]
          for (let ln = s.startLine; ln <= s.endLine; ln++) {
            if (!byLine[ln]) byLine[ln] = []
            byLine[ln].push({ from: ln === s.startLine ? s.startCol : 0, to: ln === s.endLine ? s.endCol : (lines[ln - 1] || '').length, kind: s.stale ? 'stale' : 'saved' })
          }
        }
        if (live) {
          const lo = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
          const hi = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
          for (let ln = lo.line; ln <= hi.line; ln++) {
            if (!byLine[ln]) byLine[ln] = []
            byLine[ln].push({ from: ln === lo.line ? lo.col : 0, to: ln === hi.line ? hi.col : (lines[ln - 1] || '').length, kind: 'live' })
          }
        }
        const keys = Object.keys(byLine)
        for (let i = 0; i < keys.length; i++) {
          const ln = Number(keys[i])
          const rects = highlightRects(ln, byLine[ln])
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k]
            bodyKids.push(h('div', { className: 'dn-hlo', 'data-kind': r.kind, key: 'o' + ln + '_' + k, style: { left: r.left + 'px', top: r.top + 'px', width: Math.max(1, r.right - r.left) + 'px', height: Math.max(2, r.bottom - r.top) + 'px' } }))
          }
        }
      }
      if (live && mode === 'read') {
        const first = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
        const last = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
        const p1 = posToPoint(first.line, first.col)
        const p2 = posToPoint(last.line, last.col)
        const ovPe = pressing ? 'none' : 'auto'
        if (p1) bodyKids.push(h('div', { className: 'dn-handle', key: 'ha', style: { left: p1.x + 'px', top: (p1.y + (p1.h || 18) / 2) + 'px', pointerEvents: ovPe }, onPointerDown: handleDown('a') }))
        if (p2) bodyKids.push(h('div', { className: 'dn-handle', key: 'hf', style: { left: p2.x + 'px', top: (p2.y + (p2.h || 18) / 2) + 'px', pointerEvents: ovPe }, onPointerDown: handleDown('f') }))
        // Follow the caret the gesture finished on: dragging down puts the bar
        // under the selection, dragging up puts it above it, so the toolbar never
        // covers the text being selected and never jumps to the far end.
        const focusUp = cmpPos(live.f, live.a) <= 0
        const focusPt = posToPoint(live.f.line, live.f.col)
        const anchor = focusPt || p1 || p2
        if (anchor && barReady) {
          const barHost = bodyRef.current
          const belowY = anchor.y + (anchor.h || 18) + 6
          const aboveY = Math.max(4, anchor.y - 42)
          const visibleBelow = barHost ? belowY - barHost.scrollTop + 42 : 0
          const fitsBelow = !barHost || visibleBelow < barHost.clientHeight
          const barTop = focusUp ? aboveY : (fitsBelow ? belowY : aboveY)
          bodyKids.push(h('div', { className: 'dn-bar', key: 'bar', style: { left: Math.max(4, anchor.x - 10) + 'px', top: barTop + 'px', pointerEvents: ovPe } }, [
            h('button', { key: 'copy', 'data-act': 'copy', onClick: function () { copyText(liveText()).then(function (ok) { notify(ok ? '已复制' : '复制失败') }) } }, '复制'),
            h('button', { key: 'pick', 'data-act': 'pick', onClick: function () { hideBar(); commitLive() } }, '选中'),
            h('button', { key: 'cancel', 'data-act': 'cancel', onClick: function () { hideBar(); setLive(null) } }, '取消'),
          ]))
        }
      }
      let sizeLabel = Math.round(geo.width) + 'px'
      for (let i = 0; i < SIZES.length; i++) if (SIZES[i].id === layout.size) sizeLabel = SIZES[i].label
      const head = h('div', {
        className: 'dn-head', key: 'head',
        'data-dragging': dragging ? 'true' : 'false',
        'data-compact': geo.compact ? 'true' : 'false',
        onPointerDown: headDown,
        onDoubleClick: function (e) { e.stopPropagation() },
      }, [
        h('span', { className: 'dn-headtitle', key: 't' }, [
          h('span', { key: 'dot', className: 'dn-dot', 'data-dirty': dirty ? 'true' : 'false', 'aria-hidden': 'true' }),
          h('span', { key: 'n' }, '\ud83d\udcdd 笔记'),
          h('span', { className: 'dn-headsub', key: 's', title: st.path || '' }, (st.relPath || '') + (geo.mode === 'floating' ? ' · 浮层' : '')),
        ]),
        h('span', { className: 'dn-controls', key: 'c' }, [
          geo.compact ? null : h('button', { className: 'dn-iconbtn', key: 'size', type: 'button', 'data-control': 'size', title: '卡片宽度：' + sizeLabel + '（点击切换 标准 430 / 宽版 620 / 超宽 900）', 'aria-label': '切换卡片宽度', onClick: function (e) { e.stopPropagation(); cycleSize() } }, [h('span', { className: 'dn-wglyph', key: 'w' }, 'W')]),
          geo.compact ? null : h('button', { className: 'dn-iconbtn', key: 'dock', type: 'button', 'data-control': 'dock', 'data-mode': geo.mode, title: '恢复默认位置（靠右停靠）', 'aria-label': '恢复默认位置', onClick: function (e) { e.stopPropagation(); resetDock() } }, [h(IconPanelLeft, { key: 'i' })]),
          h('button', { className: 'dn-iconbtn', key: 'collapse', type: 'button', 'data-control': 'collapse', title: '折叠为右下角小图标', 'aria-label': '折叠', onClick: function (e) { e.stopPropagation(); setHidden(true) } }, [h(IconChevronDown, { key: 'i' })]),
        ]),
      ])
      const actions = h('div', { className: 'dn-actions', key: 'actions' }, [
        mode === 'read' ? btn('编辑', function () { enterEdit() }, { title: '进入编辑(也可双击正文)' }) : btn('完成', function () { flush(true).then(function () { setMode('read') }) }, { active: true, title: '保存并退出编辑' }),
        btn('保存', function () { doCommit() }, { title: '写入磁盘并 git 提交' }),
        btn('选中' + (selList.length ? ' ' + selList.length : ''), function () { setPanel(!panel) }, { active: panel, title: '查看/管理已选中的内容' }),
        btn('清空', function () { clearSelections() }, { title: '清空全部选中' }),
        btn('重载', function () { doReload() }, { title: '从磁盘重新读取(AI 修改后可用)' }),
      ])
      const foot = h('div', { className: 'dn-foot', key: 'foot' }, [
        h('span', { key: 'a' }, st.gitReady ? ('git ' + (st.commitHash || '未提交')) : (st.error ? 'git 异常' : 'git 未就绪')),
        h('span', { key: 'b' }, st.lineCount + ' 行'),
        h('span', { key: 'c' }, '选中 ' + selList.length),
        h('span', { key: 'd' }, offline ? '连接中断' : (busy ? busy : (dirty ? '未落盘' : '已落盘'))),
        h('span', { key: 'e' }, (geo.compact ? '窄屏' : (geo.mode === 'docked' ? ('停靠 ' + Math.round(geo.width) + 'px') : '浮层')) + ' · ' + sizeLabel),
        h('span', { key: 'f', style: { overflow: 'hidden', textOverflow: 'ellipsis', color: '#d33' } }, st.error || ''),
      ])
      const panelEl = panel ? h('div', { className: 'dn-sel-list', key: 'sel' }, selList.length
        ? selList.map(function (s) {
          return h('div', { className: 'dn-sel-item', key: s.id }, [
            h('div', { className: 'dn-sel-meta', key: 'm' }, [
              h('span', { key: 'o' }, '#' + s.order),
              h('span', { key: 'l' }, '第' + s.startLine + ':' + s.startCol + ' -> ' + s.endLine + ':' + s.endCol),
              h('span', { key: 'f' }, s.fetched ? '已取用' : '新'),
              s.stale ? h('span', { key: 'st', style: { color: '#d80' } }, '原文已变动') : null,
              h('button', { className: 'dn-x', key: 'x', onClick: function () { removeSelection(s.id) } }, '删除'),
            ]),
            h('div', { className: 'dn-sel-text', key: 't' }, s.text),
          ])
        })
        : [h('div', { key: 'none', style: { color: '#8a8f98' } }, '还没有选中内容。长按正文约 0.4 秒出现选择器，拖动两个圆点确定范围，再点[选中]。')]) : null
      return h('div', { className: 'dn-root', ref: rootRef, style: geo.style || undefined, 'data-panel-mode': geo.mode }, [
        head, actions,
        h('div', { className: 'dn-body', key: 'body', ref: bodyRef, onPointerDown: onBodyDown, onDoubleClick: onDoubleClick }, bodyKids),
        panelEl, foot,
        toast ? h('div', { className: 'dn-toast', key: 'toast' }, toast) : null,
      ])
    }
    slots.inject('shell.overlay', function () {
      return slots.register({ name: 'shell.overlay', id: 'note-card', order: 60, label: '笔记卡片' }, function (props) { return h(NoteCard, props || {}) })
    })
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
