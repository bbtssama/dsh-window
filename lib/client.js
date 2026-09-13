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
// The highlight layer lives OUTSIDE the scrolling body, and that is not cosmetic: inserting
// an overlay as a child of the body invalidated the layout of the whole note (6079 nodes,
// 1211 direct children) on every pointermove. Measured on a 1532-line note under a 4x CPU
// throttle: "append one overlay into .dn-body + flush" cost 107ms, the same append into a
// layer next to the body cost 0.3ms — a 350x difference, and the reason dragging felt
// broken on big notes. The layers are clipped to the body's box and translated by the scroll
// offset, so overlay coordinates stay in content coordinates (see the render).
'.dn-wrap{position:relative;display:flex;flex:1 1 auto;min-height:0;min-width:0;}',
'.dn-lay{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;pointer-events:none;}',
'.dn-lay-back{z-index:-1;}',
'.dn-lay-front{z-index:3;}',
'.dn-lay-in{position:absolute;left:0;top:0;width:0;height:0;}',
'.dn-hlo{position:absolute;pointer-events:none;border-radius:2px;background:rgba(255,214,0,.42);}',
'.dn-hlo[data-color=pink]{background:rgba(255,138,190,.45);}',
'.dn-hlo[data-color=green]{background:rgba(112,214,140,.45);}',
'.dn-hlo[data-kind=stale]{background:rgba(255,120,0,.3);}',
'.dn-hlo[data-kind=live]{background:rgba(90,150,255,.38);}',
// Pure black is a MASK, not a tint: opaque fill painted ABOVE the text, so the
// covered characters cannot be read. It goes into the FRONT layer for that reason
// (the coloured tints go into the back one); nothing else distinguishes them now.
'.dn-hlo[data-color=black]{background:#000;}',
'.dn-blk-editor{width:100%;box-sizing:border-box;border:1px dashed rgba(0,0,0,.3);border-radius:8px;padding:8px 10px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.6;background:rgba(255,214,0,.08);color:inherit;outline:none;resize:vertical;overflow:auto;}',
'.dn-blk-editor:focus{border-color:var(--dsw-alias-label-primary,#1b1b1b);}',
// Handle: 44x44 invisible hit area, visual drawn inside as dot + stem (tip on the
// caret). Overrides the old 12px circle rule regardless of source order.
'.dn-root .dn-lay .dn-handle{position:absolute;width:44px;height:44px;margin:0;padding:0;background:none;border:0;border-radius:0;box-shadow:none;transform:none;cursor:grab;}',
'.dn-root .dn-lay .dn-handle-dot{position:absolute;left:50%;width:15px;height:15px;margin-left:-7.5px;border-radius:50%;background:var(--dsw-alias-label-primary,#1b1b1b);box-shadow:0 1px 4px rgba(0,0,0,.35);}',
'.dn-root .dn-lay .dn-handle-tail{position:absolute;left:50%;width:2px;height:13px;margin-left:-1px;background:var(--dsw-alias-label-primary,#1b1b1b);}',
'.dn-root .dn-lay .dn-handle[data-tip=down] .dn-handle-dot{top:5px;}',
'.dn-root .dn-lay .dn-handle[data-tip=down] .dn-handle-tail{top:18px;}',
'.dn-root .dn-lay .dn-handle[data-tip=up] .dn-handle-dot{bottom:5px;}',
'.dn-root .dn-lay .dn-handle[data-tip=up] .dn-handle-tail{bottom:18px;}',
'.dn-root .dn-lay .dn-loupe{position:absolute;padding:5px 10px;border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid rgba(0,0,0,.2);box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:9;pointer-events:none;font-size:16px;line-height:1.45;white-space:nowrap;overflow:hidden;text-align:center;color:inherit;}',
'.dn-root .dn-lay .dn-loupe-caret{display:inline-block;width:2px;height:1.1em;vertical-align:-.18em;background:#e5484d;margin:0 0.5px;}',
'.dn-pen{display:inline-flex;align-items:center;position:relative;}',
'.dn-pen-sw{width:18px;height:18px;border-radius:4px;border:1px solid rgba(0,0,0,.28);cursor:pointer;padding:0;margin:0 1px;}',
'.dn-pen-sw[data-c=yellow]{background:rgba(255,214,0,.95);}',
'.dn-pen-sw[data-c=pink]{background:rgba(255,138,190,.95);}',
'.dn-pen-sw[data-c=green]{background:rgba(112,214,140,.95);}',
'.dn-pen-sw[data-c=black]{background:rgba(22,24,28,.95);}',
'.dn-pen-sw[data-on=true]{outline:2px solid var(--dsw-alias-label-primary,#1b1b1b);outline-offset:1px;}',
'.dn-bar{z-index:6;}',
'.dn-handle{z-index:6;}',
'.dn-pen-pop{position:absolute;bottom:26px;left:-4px;display:flex;padding:5px;border-radius:8px;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid rgba(0,0,0,.14);box-shadow:0 6px 18px rgba(0,0,0,.18);z-index:3;}',
// The notes row: session-scoped note list plus the actions that create, import, rename,
// clear or delete one. Each note is its own directory with its own git history.
'.dn-notes{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.015);flex-wrap:wrap;}',
'.dn-notes[data-drag=true]{background:rgba(90,150,255,.14);outline:2px dashed rgba(90,150,255,.6);outline-offset:-2px;}',
'.dn-notes-label{font-size:11.5px;color:var(--dsw-alias-label-tertiary,#8a8f98);}',
'.dn-notes-none{font-size:12px;color:var(--dsw-alias-label-tertiary,#8a8f98);}',
'.dn-notes-pick{max-width:190px;font-size:12px;padding:3px 4px;border:1px solid rgba(0,0,0,.16);border-radius:7px;background:transparent;color:inherit;font-family:inherit;}',
'.dn-mini{font-size:11.5px;padding:3px 8px;border:1px solid rgba(0,0,0,.16);border-radius:7px;background:transparent;color:inherit;cursor:pointer;font-family:inherit;touch-action:manipulation;}',
'.dn-mini:hover{background:rgba(0,0,0,.05);}',
'.dn-mini-primary{background:#4f7cff;border-color:#4f7cff;color:#fff;}',
'.dn-mini-danger{color:#c0392b;border-color:rgba(192,57,43,.4);}',
'.dn-empty{padding:26px 18px;text-align:center;color:var(--dsw-alias-label-secondary,#555);}',
'.dn-empty-title{font-size:14px;font-weight:600;margin-bottom:6px;}',
'.dn-empty-sub{font-size:12px;color:var(--dsw-alias-label-tertiary,#8a8f98);margin-bottom:14px;}',
'.dn-empty-actions{display:flex;gap:8px;justify-content:center;}',
'.dn-modal{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.28);padding:12px;}',
'.dn-modal-box{width:100%;max-width:420px;background:var(--dsw-alias-bg-layer-1,#fff);border-radius:12px;padding:14px;box-shadow:0 16px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:8px;max-height:100%;overflow:auto;}',
'.dn-modal-title{font-size:13.5px;font-weight:600;}',
'.dn-modal-input{font-size:13px;padding:6px 8px;border:1px solid rgba(0,0,0,.18);border-radius:8px;background:transparent;color:inherit;font-family:inherit;}',
'.dn-modal-text{font-size:12.5px;min-height:110px;padding:6px 8px;border:1px solid rgba(0,0,0,.18);border-radius:8px;background:transparent;color:inherit;font-family:ui-monospace,Consolas,monospace;resize:vertical;}',
'.dn-modal-row{display:flex;align-items:center;gap:6px;font-size:12px;}',
'.dn-modal-file{font-size:12px;color:#4f7cff;}',
'.dn-modal-actions{display:flex;align-items:center;gap:8px;}',
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
// `min-width:0` matters inside a flex/grid parent: without it the intrinsic width of a
// wide image can push the box wider than the card, which is how images ended up
// clipped past the right edge on a narrow screen. `object-fit` plus `max-width:100%`
// keeps an oversized image inside its column.
'.dn-img{max-width:100%;min-width:0;height:auto;border-radius:8px;display:block;margin:8px auto;background:rgba(0,0,0,.03);}',
'.dn-imglink{display:block;min-width:0;max-width:100%;text-decoration:none;cursor:pointer;-webkit-touch-callout:none;-webkit-user-drag:none;}',
'.dn-imglink img{-webkit-touch-callout:none;-webkit-user-drag:none;}',
'.dn-imglink:hover .dn-img{outline:2px solid rgba(90,150,255,.55);outline-offset:2px;}',
// A tint behind an image is invisible: the image is opaque and covers it. An image
// selection therefore outlines the box instead, in the overlay layer (so a selection
// change never has to re-render the image element itself), and black — whose whole
// point is an opaque mask — still covers it.
'.dn-hlo[data-img="1"]{background:transparent;border:3px solid rgba(255,214,0,.95);box-sizing:border-box;}',
'.dn-hlo[data-img="1"][data-color=pink]{border-color:rgba(255,138,190,.95);}',
'.dn-hlo[data-img="1"][data-color=green]{border-color:rgba(112,214,140,.95);}',
'.dn-hlo[data-img="1"][data-kind=live]{border-color:rgba(90,150,255,.95);border-style:dashed;}',
'.dn-hlo[data-img="1"][data-kind=stale]{border-color:rgba(255,120,0,.85);border-style:dashed;}',
'.dn-hlo[data-img="1"][data-color=black]{background:#000;border-color:#000;}',
'.dn-img-hl{outline:3px solid rgba(255,214,0,.9);outline-offset:2px;}',
'.dn-img-hl-live{outline:3px solid rgba(90,150,255,.95);outline-offset:2px;}',
// A flex row cannot wrap a long URL: the icon stayed on one line and the text ran out
// of the dashed box (".png" visibly outside it). inline-block with wrapping text keeps
// the whole message inside the border.
'.dn-imgfail{display:block;font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#8a8f98);border:1px dashed rgba(0,0,0,.18);border-radius:8px;padding:8px 10px;margin:8px 0;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;white-space:normal;}',
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
'.dn-bar{position:absolute;display:inline-flex;gap:3px;background:#20242c;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:4px;box-shadow:0 10px 28px rgba(0,0,0,.4);pointer-events:auto;z-index:6;touch-action:none;overscroll-behavior:contain;}',
'.dn-bar button{border:0;background:0 0;color:#fff;font-size:12.5px;font-weight:600;line-height:1.2;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:inherit;touch-action:none;-webkit-tap-highlight-color:transparent;}',
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
// Last used highlight colour, remembered locally. Defaults to yellow.
const PEN_KEY = 'dsh-window:pen'
const PEN_COLORS = ['yellow', 'pink', 'green', 'black']
function readPenColor() { try { const v = window.localStorage.getItem(PEN_KEY); return PEN_COLORS.indexOf(v) >= 0 ? v : 'yellow' } catch (err) { return 'yellow' } }
function writePenColor(c) { try { window.localStorage.setItem(PEN_KEY, c) } catch (err) { } }
const COMPACT_W = 640, DOCK_TOP = 34, DOCK_RIGHT = 18, DOCK_BOTTOM = 18
// Compact (phone) layout has its own offsets: it never used the dock constants,
// it just sat at the overlay slot's natural position, so it could not be tuned.
const COMPACT_TOP = 12, COMPACT_INSET = 8
const FLOAT_MARGIN = 10, CONV_GAP = 14, MIN_W = 320, MAX_W = 1000, MIN_CHAT = 380, THROTTLE_MS = 16
// How far the pointer may wander after a long press before it stops being a jitter.
// The two axes are treated differently on purpose: vertical movement is the body's
// scroll gesture, so a unit selection never follows it (see onDragMove); a horizontal
// drag has to travel this far before it counts as a deliberate extension.
const UNIT_SLOP_Y = 14
const UNIT_SLOP_X = 60
const SIZES = [{ id: 'std', w: 430, label: '标准' }, { id: 'wide', w: 620, label: '宽版' }, { id: 'xl', w: 900, label: '超宽' }]
const DEFAULT_LAYOUT = { mode: 'docked', x: null, y: null, w: 430, h: null, size: 'std' }
const HTML_TAGS = { b: 1, strong: 1, i: 1, em: 1, u: 1, s: 1, del: 1, mark: 1, kbd: 1, sub: 1, sup: 1, small: 1, code: 1, span: 1, a: 1, cite: 1, q: 1, abbr: 1, ins: 1 }
const assetCache = {}
// Geometry of the rendered note is cached per measured version (see cellsOf). Content
// that changes size *after* its first paint — a Mermaid diagram finishing its render, a
// lazily-loaded image decoding — has to invalidate that cache or the highlights and
// handles keep the stale boxes. The card owns the version counter, so it publishes its
// bump function here; children defined outside the component (NoteImage, MermaidBlock)
// call it instead of reaching for a name that is not in their scope.
const geoBump = { fn: function () { } }
function bumpGeometry() { try { geoBump.fn() } catch (err) { } }
// Mermaid is a declared npm dependency, served by the host half from
// node_modules at /plugins/dsh-window/vendor/mermaid.min.js. It is loaded on
// demand, so a note without diagrams never pays for the runtime, and a failed
// load simply leaves the hand-rolled renderer in place.
let mermaidPromise = null
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
const VENDOR_ESM = '/plugins/dsh-window/vendor/mermaid/mermaid.esm.min.mjs'
function loadMermaidRuntime() {
  if (mermaidRuntime !== null) return mermaidRuntime
  mermaidRuntime = import(VENDOR_ESM).then(function (mod) {
    const mm = mod && (mod.default || mod)
    if (mm && typeof mm.render === 'function') return mm
    throw new Error('分包未导出 render')
  }).catch(function (esmErr) {
    return loadMermaid().catch(function (scriptErr) {
      throw new Error('分包失败: ' + String((esmErr && esmErr.message) || esmErr) + ' / 单文件回退失败: ' + String((scriptErr && scriptErr.message) || scriptErr))
    })
  })
  return mermaidRuntime
}
let mermaidRuntime = null
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
  if (compact) return { compact: true, mode: 'compact', width: vw, shift: 0, dockable: false, style: { left: COMPACT_INSET + 'px', right: COMPACT_INSET + 'px', top: COMPACT_TOP + 'px', bottom: COMPACT_INSET + 'px' } }
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
/** `url "title"` -> `url`: a Markdown title must never leak into an href. */
function hrefOnly(s) {
  const m = /^\s*(\S+?)(?:\s+["'][^"']*["'])?\s*$/.exec(s)
  return m ? m[1] : s
}
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
    // `[![alt](src)](href)` — a clickable image. It has to be tested before the plain
    // image and plain link branches: the link branch matched first and produced an
    // anchor whose label was the literal text "![alt", so the example on line 354 of
    // the image test block rendered as broken text with no image at all.
    if (ch === '[' && raw[i + 1] === '!' && raw[i + 2] === '[') {
      const m = /^\[!\[([^\]]*)\]\(\s*([^\s()]+)(?:\s+["'][^"']*["'])?\s*\)\]\(\s*([^\s()]+)(?:\s+["'][^"']*["'])?\s*\)/.exec(raw.slice(i))
      if (m) { out.push({ k: 'img', t: m[1], href: m[2], link: m[3], off: i, len: m[0].length }); i += m[0].length; continue }
    }
    if (ch === '!' && raw[i + 1] === '[') {
      const close = raw.indexOf(']', i + 2)
      if (close > -1 && raw[close + 1] === '(') {
        const pe = raw.indexOf(')', close + 2)
        if (pe > -1) { out.push({ k: 'img', t: raw.slice(i + 2, close), href: hrefOnly(raw.slice(close + 2, pe)), off: i, len: pe - i + 1 }); i = pe + 1; continue }
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
      if (close > -1 && raw[close + 1] === '(') { const pe = raw.indexOf(')', close + 2); if (pe > -1) { out.push({ k: 'link', t: raw.slice(i + 1, close), href: hrefOnly(raw.slice(close + 2, pe)), off: i + 1 }); i = pe + 1; continue } }
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
      // A key on the resolved source forces a fresh <img> element when the source
      // changes (a local path resolving to its data URL). Reusing one node while the
      // src is still empty leaves the browser's own broken-image glyph and the alt
      // text on screen — the "broken 本地 png" look — because the node was created
      // before a usable src existed.
      const src = dataUrl || (isLocalRef(props.href) ? '' : imgSrc(props.href))
      if (failed) return h('span', { className: 'dn-imgfail' }, ['\ud83d\uddbc 图片无法读取：' + String(props.href || '')])
      if (state === 'ok' && src) {
        return h('img', {
          key: src.length > 64 ? src.slice(0, 64) + src.length : src,
          className: props.cls, src: src, alt: props.alt || '',
          'data-soff': props.soff, 'data-img-len': props.len, loading: 'lazy', decoding: 'async', draggable: false,
          // A lazy image is 0x0 until it decodes, so everything below it sits higher than
          // it will afterwards. Re-measure once the real box exists, otherwise a highlight
          // made while the image was unloaded keeps the wrong y and the handles drift.
          onLoad: function () { bumpGeometry() },
          onError: function () { setFailed(true); bumpGeometry() },
        })
      }
      return h('span', { className: 'dn-imgfail', 'data-soff': props.soff, 'data-img-len': props.len }, ['\ud83d\uddbc 读取中… ' + String(props.href || '')])
    }
    function MermaidBlock(props) {
      const parsed = React.useMemo(function () { return parseMermaid(props.body) }, [props.text])
      // Preferred path: the real mermaid runtime, which covers sequence/class/
      // state/gantt/pie/ER on top of graph/flowchart. The hand-rolled renderer
      // below stays as the fallback for a missing runtime or a failed diagram.
      const [mmdSvg, setMmdSvg] = React.useState('')
      const [mmdErr, setMmdErr] = React.useState('')
      const mmdSource = props.body.join('\n')
      React.useEffect(function () {
        let alive = true
        if (mmdSource.trim() === '') return undefined
        loadMermaidRuntime().then(function (mm) {
          mm.initialize({ startOnLoad: false, securityLevel: 'strict', htmlLabels: false, theme: 'default', fontFamily: 'inherit' })
          return mm.render('dnm-' + props.line + '-' + hashStr(mmdSource), mmdSource)
        }).then(function (out) {
          if (alive && out && typeof out.svg === 'string') {
            setMmdSvg(out.svg)
            // The diagram's real height only exists now, so drop the cached geometry
            // and re-measure — otherwise a block selection (and the overlay drawn from
            // it) keeps the pre-render size. (This used to call a `bump` that is scoped
            // to the card component, not here, so it threw and was swallowed by the
            // catch below: the re-measure only ever happened via the ResizeObserver.)
            bumpGeometry()
          }
        }).catch(function (err) {
          // Surface the reason. Silently falling back to the built-in renderer is
          // exactly why the mobile failure looked like "原因不明".
          const msg = String((err && err.message) || err)
          try { console.warn('dsh-window: mermaid render failed: ' + msg) } catch (e) { }
          if (alive) { setMmdErr(msg.slice(0, 200)); setMmdSvg('') }
        })
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
          h('div', { className: 'dn-mmd-tag', key: 't' }, 'mermaid · 显示源码' + (mmdErr ? ' — 渲染失败: ' + mmdErr : '')),
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
        h('div', { className: 'dn-mmd-tag', key: 't' }, 'mermaid · ' + parsed.dir + ' · ' + Object.keys(nodes).length + ' 节点 · ' + parsed.edges.length + ' 边' + (mmdErr ? ' — 渲染失败: ' + mmdErr : '')),
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
      const [penColor, setPenColor] = React.useState(readPenColor)
      // In-place block editing: double clicking a block opens just that block's
      // markdown, with everything else left rendered (Typora style).
      const [editBlock, setEditBlock] = React.useState(null)
      // Loupe shown while a selection handle is being dragged (iOS-style precise
      // positioning); null when no drag is in flight.
      const [magnify, setMagnify] = React.useState(null)
      const editBlockRef = React.useRef(null)
      // Which caret the last gesture moved. The action bar must follow THAT caret:
      // it used to always anchor at the focus end, so dragging the start handle
      // popped the bar up at the other end of the selection.
      const barAtRef = React.useRef('f')
      const blockEditorRef = React.useRef(null)
      // Render cache for the note body (see the call site): the same element
      // objects let React skip those subtrees on a live-selection update.
      const blocksCache = React.useRef({ key: '', kids: [] })
      const [penOpen, setPenOpen] = React.useState(false)
      const barTimerRef = React.useRef(null)
      // Timestamp of the last action already run from a pointerdown, so the click the
      // browser may still deliver does not repeat it. See press()/tap() below.
      const actedRef = React.useRef(0)
      const modRef = React.useRef('mouse')
      const [toast, setToast] = React.useState('')
      const [panel, setPanel] = React.useState(false)
      const [busy, setBusy] = React.useState('')
      const [offline, setOffline] = React.useState(false)
      const [layout, setLayout] = React.useState(readLayout)
      const [geoVer, setGeoVer] = React.useState(0)
      // Scrolling the note body needs a render of its own, and it must NOT be the geometry
      // bump: the overlay layer paints only the lines inside the visible window, and every
      // cache it reads (line bands, character cells) is in CONTENT coordinates, so a scroll
      // changes nothing they measured — only which lines are worth painting. Bumping geoVer
      // would re-measure all ~1400 lines on every scroll frame; this counter re-renders the
      // overlay layer and lets the block/band caches hit.
      const [, setScrollTick] = React.useState(0)
      const [notes, setNotes] = React.useState([])
      const [noteName, setNoteName] = React.useState('')
      const [noteModal, setNoteModal] = React.useState(null)
      const [noteDrag, setNoteDrag] = React.useState(false)
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
      const VIEW_KEY = 'dsh-note-card:view:v1'
      const liveRef = React.useRef(null)
      // Set when a long press fires; the click the browser emits on release is then
      // swallowed so long-pressing a linked image selects it instead of opening it.
      const navGuardRef = React.useRef(false)
      const geoRef = React.useRef({ ver: -1, lines: {} })
      // Reading position: `pending` holds the line to scroll back to for the note that is
      // being opened; `restoredFor` remembers which note that was, so a background state
      // refresh (the poll, an external edit) never yanks the reader back mid-page.
      const pendingViewRef = React.useRef(null)
      const restoredForRef = React.useRef('')
      const viewSaveTimerRef = React.useRef(null)
      const viewSavedRef = React.useRef({ line: 0, note: '' })
      // Whether the host half knows saveView. A host that predates it answers 404 (and the
      // browser logs that as a console error), so the browser-local mirror carries the
      // feature alone until a state answer actually carries a `view` field.
      const hostViewRef = React.useRef(false)
      const noteNameRef = React.useRef('')
      sidRef.current = shownSessionId || ''
      noteNameRef.current = noteName || ''
      function notify(msg) { setToast(msg) }
      /** Hide the action bar and cancel any pending reveal. */
      function hideBar() {
        setPenOpen(false)
        setBarReady(false)
        if (barTimerRef.current !== null) { try { window.clearTimeout(barTimerRef.current) } catch (err) { } barTimerRef.current = null }
      }
      // Acting on a bar button's click was unreliable on a phone: the bar lives inside
      // `.dn-body`, which is `touch-action: pan-y`, so a tap whose finger drifts a few
      // pixels gets reinterpreted as a scroll — the browser fires pointercancel and no
      // click at all, and the button silently did nothing ("取消 sometimes needs two
      // taps"). Running the action on pointerdown takes the click out of the path, and
      // the timestamp guard stops the follow-up click from running it a second time
      // (keyboard activation still arrives as a click, so it keeps working).
      function press(act) {
        return function (e) {
          if (e) {
            if (e.stopPropagation) e.stopPropagation()
            if (e.preventDefault) e.preventDefault()
          }
          actedRef.current = Date.now()
          act()
        }
      }
      function tap(act) {
        return function (e) {
          if (e && e.stopPropagation) e.stopPropagation()
          if (Date.now() - actedRef.current < 800) return
          act()
        }
      }
      /** Reveal the action bar now (delay 0) or after `delay` ms of stillness. */
      function revealBar(delay) {
        if (barTimerRef.current !== null) { try { window.clearTimeout(barTimerRef.current) } catch (err) { } barTimerRef.current = null }
        if (!delay) { setBarReady(true); return }
        barTimerRef.current = window.setTimeout(function () { barTimerRef.current = null; setBarReady(true) }, delay)
      }
      function selCount() { return st && st.selections ? st.selections.length : 0 }
      function bump() { setGeoVer(function (v) { return v + 1 }) }
      // Publish the version bump for the out-of-component children (images, Mermaid).
      geoBump.fn = bump
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
      // A table (also code blocks and diagrams) scrolls horizontally INSIDE its own
      // wrapper. The geometry cache is keyed by the card's width/mode, so it stayed
      // valid across such a scroll and the overlay kept the pre-scroll coordinates:
      // the highlight did not follow the table and the handles pointed at the wrong
      // column. Re-measuring on every wrapper scroll fixes both, and the render
      // cache means this costs only the overlay layer, not the 340 note blocks.
      // The reading position is written 700ms after scrolling stops, so closing the card or
      // the tab right after a scroll must flush what is pending (best effort — an async RPC
      // during pagehide may not complete, but the debounce already covers most of it).
      React.useEffect(function () {
        const onHide = function () { if (document.visibilityState === 'hidden') saveViewNow() }
        document.addEventListener('visibilitychange', onHide)
        window.addEventListener('pagehide', saveViewNow)
        return function () {
          document.removeEventListener('visibilitychange', onHide)
          window.removeEventListener('pagehide', saveViewNow)
          if (viewSaveTimerRef.current !== null) { try { window.clearTimeout(viewSaveTimerRef.current) } catch (err) { } viewSaveTimerRef.current = null }
        }
      }, [])
      React.useEffect(function () {
        const host = bodyRef.current
        if (!host) return undefined
        const nodes = host.querySelectorAll('[data-dn-table], .dn-pre, .dn-mmd')
        const onScroll = function () { bump() }
        for (let i = 0; i < nodes.length; i++) { try { nodes[i].addEventListener('scroll', onScroll, { passive: true }) } catch (err) { } }
        // The body scrolls vertically and had NO listener at all: the overlay layer only
        // paints the lines inside the visible window, so once the note was scrolled the
        // window stayed where the last render had left it and the highlights of the lines
        // that came into view were never drawn (a saved selection appeared to vanish as
        // soon as you scrolled away and back). A body scroll changes no measurement — the
        // bands and cells are content coordinates — so it only needs a re-render.
        const onBodyScroll = function () {
          setScrollTick(function (v) { return v + 1 })
          scheduleViewSave()
        }
        try { host.addEventListener('scroll', onBodyScroll, { passive: true }) } catch (err) { }
        // Content that grows after the first measurement (a Mermaid diagram whose SVG
        // arrives asynchronously, a remote image that loads later) left a stale rect in
        // the geometry cache — a block selection then covered only the old height. A
        // ResizeObserver on those boxes invalidates the cache whenever they resize.
        let ro = null
        try {
          ro = new ResizeObserver(function () { bump() })
          for (let i = 0; i < nodes.length; i++) ro.observe(nodes[i])
        } catch (err) { ro = null }
        return function () {
          for (let i = 0; i < nodes.length; i++) { try { nodes[i].removeEventListener('scroll', onScroll) } catch (err) { } }
          try { host.removeEventListener('scroll', onBodyScroll) } catch (err) { }
          try { if (ro) ro.disconnect() } catch (err) { }
        }
      }, [st ? st.text : ''])
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
        // `inactive` means this store does not belong to this session (the note now
        // requires an explicit action before it participates). Clearing the state is
        // what removes the card; without it the last known note kept being rendered.
        if (r.inactive) { revRef.current = r.revision; textRef.current = ''; setSt(null); return }
        revRef.current = r.revision
        textRef.current = r.text
        // A DIFFERENT note (or the first one after a page load) resumes where it was left.
        // Same note + a plain refresh must not touch the scroll position: that is the
        // background poll and the external-edit refresh.
        const incoming = String(r.active || '')
        if (Object.prototype.hasOwnProperty.call(r, 'view')) hostViewRef.current = true
        if (incoming !== restoredForRef.current) {
          restoredForRef.current = incoming
          const fromHost = r.view && Number(r.view.line) >= 1 ? r.view : null
          const v = fromHost || readLocalView(sidRef.current, incoming)
          pendingViewRef.current = v ? { line: Math.round(Number(v.line)), anchor: String(v.anchor || ''), tries: 0, from: fromHost ? 'note' : 'browser' } : null
          viewSavedRef.current = { line: 0, note: incoming }
        }
        setSt(r)
        applyNotes(r)
        bump()
        if (!dirtyRef.current) { draftRef.current = r.text; setDraft(r.text) }
      }
      // Runs after every geometry bump: the first bump that finds the target line measured
      // performs the restore, the rest are no-ops.
      React.useEffect(function () { applyPendingView() }, [geoVer])
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
      // A session with no note shows no card at all: the note space is per session and
      // starts empty, and /window-note (or note_create) is the explicit way to begin.
      const visible = !!st && !hidden && notes.length > 0
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
      // Keep the action bar inside the card. The un-clamped `left` pushed the
      // buttons past the body's right edge when the caret sat near it, where
      // overflow-x:hidden cut them off. Measured after paint and shifted back by
      // exactly the overflow, so it holds for any button count or width.
      // The bar now lives in the front overlay layer, not inside the body, so the
      // search starts at the card root and only the WIDTH comes from the body.
      React.useEffect(function () {
        const card = rootRef.current
        const host = bodyRef.current
        if (!card || !host) return undefined
        const bar = card.querySelector('.dn-bar')
        if (!bar) return undefined
        bar.style.transform = ''
        const over = bar.offsetLeft + bar.offsetWidth - (host.clientWidth - 6)
        if (over > 0) bar.style.transform = 'translateX(-' + over + 'px)'
        return undefined
      }, [live, barReady, penOpen])
      // Focus the block editor and drop the caret where the double click landed.
      React.useEffect(function () {
        if (editBlock === null) return undefined
        const grab = function () {
          const ta = blockEditorRef.current
          const eb = editBlockRef.current
          if (!ta || !eb) return
          try {
            ta.focus()
            if (eb.caret) {
              const off = offsetOfPos(eb.value, Math.max(1, eb.caret.line - eb.from + 1), eb.caret.col)
              ta.setSelectionRange(off, off)
            }
          } catch (err) { }
        }
        // The shell grabs focus back right after a click, so focus is re-taken a
        // few times; Escape / Ctrl+Enter are also bound at document level so they
        // work even if focus ends up elsewhere.
        const ids = [40, 180, 520].map(function (ms) { return window.setTimeout(grab, ms) })
        const onKey = function (ev) {
          if (ev.key === 'Escape') { ev.preventDefault(); cancelBlockEdit() }
          else if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); commitBlockEdit() }
        }
        document.addEventListener('keydown', onKey, true)
        const onDown = function (ev) {
          const ta = blockEditorRef.current
          if (!ta) return
          const node = ev.target
          if (node === ta || (node && ta.contains && ta.contains(node))) return
          if (node && node.closest && node.closest('.dn-bar, .dn-handle')) return
          commitBlockEdit()
        }
        document.addEventListener('pointerdown', onDown, true)
        return function () {
          for (let i = 0; i < ids.length; i++) { try { window.clearTimeout(ids[i]) } catch (err) { } }
          try { document.removeEventListener('keydown', onKey, true) } catch (err) { }
          try { document.removeEventListener('pointerdown', onDown, true) } catch (err) { }
        }
      }, [editBlock === null ? -1 : editBlock.from])
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
                // A lazy image that has not loaded yet measures 0x0. Recording it as a
                // cell gave the overlay a phantom zero-height box, and the block-level
                // fallback then tinted the element — the blue rectangle sitting where a
                // photo was still loading. Skip it until it has a real box; `onLoad`
                // bumps the geometry so the cell appears once it does.
                const isImg = s.tagName === 'IMG' || (imgLen > 0 && !tn)
                if (isImg && (r.width < 1 || r.height < 1)) continue
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
      // Line-element bands in CONTENT coordinates, measured once per geometry version.
      //
      // pointToPos() runs on every throttled pointer move, and it used to call
      // getBoundingClientRect() on every line element — ~1400 layout-forcing reads per
      // frame on a long note, which is what made dragging feel sluggish there. The bands
      // only change when the geometry does (bump(): scroll, resize, width, re-render), so
      // they are cached against the same version counter cellsOf uses.
      const bandsRef = React.useRef({ key: '', bands: [], byLine: {} })
      function lineBands() {
        const cache = bandsRef.current
        const key = geoVer + '|' + Math.round(geo.width) + '|' + geo.mode + '|' + (geo.compact ? 1 : 0)
        if (cache.key === key) return cache
        // Called from the render path, so it can run before the body ref is attached (the
        // first paint). Measuring then is impossible and unnecessary: return an empty set
        // WITHOUT caching it, and the mount effect's bump() re-renders with real bands.
        const host = bodyRef.current
        if (!host) return { key: cache.key, bands: [], byLine: {} }
        const o = bodyOrigin()
        const bands = []
        const byLine = {}
        const keys = Object.keys(lineEls.current)
        for (let i = 0; i < keys.length; i++) {
          const line = Number(keys[i])
          const el = lineEls.current[keys[i]]
          if (!el || !el.isConnected) continue
          const r = el.getBoundingClientRect()
          if (r.height <= 0) continue
          bands.push({ line: line, top: r.top - o.top, bottom: r.bottom - o.top })
          byLine[line] = bands[bands.length - 1]
        }
        cache.key = key
        cache.bands = bands
        cache.byLine = byLine
        return cache
      }
      function pointToPos(clientX, clientY) {
        const body = bodyRef.current
        if (!body) return null
        const o = bodyOrigin()
        const x = clientX - o.left, y = clientY - o.top
        let pick = null, pickScore = 1e12
        const bands = lineBands().bands
        for (let i = 0; i < bands.length; i++) {
          const b = bands[i]
          const score = (y >= b.top && y <= b.bottom) ? (-1 - 1 / (1 + (b.bottom - b.top))) : (y < b.top ? (b.top - y) : (y - b.bottom))
          if (score < pickScore) { pickScore = score; pick = b.line }
        }
        if (pick === null) return null
        // Dead space (gaps between blocks, the body's bottom padding) must not
        // snap the caret onto whatever line happens to be nearest: a long press
        // there used to select a word far away. Within a line height of the text
        // the press still clamps to that line as before.
        if (pickScore > 120) return null
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
            if (run && run.row === row && c.left - run.right <= 3) { run.right = Math.max(run.right, c.right); run.bottom = Math.max(run.bottom, c.bottom); if (c.img) run.img = true }
            else { if (run) out.push(run); run = { row: row, kind: r.kind, color: r.color, left: c.left, right: c.right, top: c.top, bottom: c.bottom, img: c.img ? true : undefined } }
          }
          if (run) out.push(run)
        }
        // Rows of one WRAPPED line are painted from their character boxes, whose height is
        // smaller than the line pitch, so the tint came out striped: a ~5px unpainted seam
        // between the rows of the same paragraph. Close such a seam at its midpoint — no
        // overlap, so the tint cannot double-darken. Rows of two different source lines sit a
        // whole pitch apart (>= 16px) and are never merged, which is what keeps separate
        // lines looking like separate highlighted lines.
        const closed = []
        for (let i = 0; i < out.length; i++) {
          const cur = out[i]
          const prev = closed[closed.length - 1]
          if (prev && prev.kind === cur.kind && (prev.color || 'yellow') === (cur.color || 'yellow') &&
            cur.top >= prev.bottom && cur.top - prev.bottom < 12 && cur.left <= prev.right && cur.right >= prev.left) {
            const mid = (prev.bottom + cur.top) / 2
            prev.bottom = mid
            cur.top = mid
          }
          closed.push(cur)
        }
        return closed
      }
      function wordRange(pt) {
        const ls = String(textRef.current).split('\n')
        const rawLine = ls[pt.line - 1] || ''
        // An image is a selection unit of its own: its Markdown source `![alt](src)`.
        // The syntax around it is not a "word", so without this a long press on an image
        // collapsed to a zero-width range (both endpoints on the same column) and 选中
        // answered "没有选中文字" even though the highlight and handles looked right.
        const cells = cellsOf(pt.line).cells
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i]
          if (c.img && pt.col >= c.off && pt.col <= c.off + c.len) return { from: c.off, to: c.off + c.len }
        }
        let a = Math.min(pt.col, rawLine.length)
        if (a >= rawLine.length || !WORD.test(rawLine.charAt(a))) {
          // The press landed on a separator — a space, punctuation, the end of the line.
          // Returning a zero-width range there meant the long press selected NOTHING
          // (no highlight at all once a degenerate range stopped painting the element),
          // and dragging then extended from a column the user never aimed at, which is
          // what made the result feel arbitrary. Take the word just before the press,
          // else the one just after; only a line with no word at all stays degenerate.
          let back = a
          while (back > 0 && !WORD.test(rawLine.charAt(back - 1))) back--
          if (back > 0) { a = back - 1 } else {
            let fwd = a
            while (fwd < rawLine.length && !WORD.test(rawLine.charAt(fwd))) fwd++
            if (fwd >= rawLine.length) return { from: a, to: a }
            a = fwd
          }
        }
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
        // Same reason as commitLive: a block selection has no useful a/f columns, so
        // copying has to take the block's source lines.
        if (live.block) {
          const rg = blockRangeAt(live.a.line)
          if (rg) return String(textRef.current).split(String.fromCharCode(10)).slice(rg.from - 1, rg.to).join(String.fromCharCode(10))
        }
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
        // A block selection stores both endpoints as {line, col: 0} on purpose (columns
        // are meaningless for a diagram/image), so this guard must not fire for it —
        // doing so was what produced "没有选中文字" on a long-pressed Mermaid block.
        if (!live.block && first.line === last.line && first.col === last.col) { notify('没有选中文字：可拖动圆点确定范围'); return }
        // A block selection carries no meaningful a/f columns (both sit on the fence
        // line), so committing it through line/column produced an empty slice and the
        // host answered "empty" ("没有选中文字"). Submit the block's whole source range
        // instead — fences included, so the diagram's source is what gets stored.
        const blkRange = live && live.block ? blockRangeAt(live.a.line) : null
        const blkLines = blkRange ? String(textRef.current).split(String.fromCharCode(10)) : null
        const rangeArgs = blkRange
          ? { startLine: blkRange.from, startCol: 0, endLine: blkRange.to, endCol: (blkLines[blkRange.to - 1] || '').length }
          : { startLine: first.line, startCol: first.col, endLine: last.line, endCol: last.col }
        host.call('addSelection', Object.assign({ color: penColor, sessionId: sidRef.current }, rangeArgs)).then(function (r) {
          if (r && r.ok) {
            revRef.current = r.revision
            setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev })
            setLive(null)
            notify('已选中 第' + (blkRange ? blkRange.from : first.line) + '~' + (blkRange ? blkRange.to : last.line) + ' 行')
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
          return host.call('commit', { message: 'note: ' + new Date().toLocaleString(), sessionId: sidRef.current }).then(function (r) {
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
      // ── reading position ────────────────────────────────────────────────────────────
      // Which line sits at the top of the card, remembered per note and restored when the
      // note is opened again. Everything here is silent: no state, no toast, no re-render
      // (a scroll position is not something the user asked to see).
      //
      // Two stores, one precedence rule: the note's own file on the host is authoritative
      // (that is what makes the position follow the user between the phone and the desktop),
      // and a browser-local mirror is used only when the host has no position for that note
      // — which is also what makes this work on a host that predates the saveView RPC.
      function localViewKey(sid, note) { return String(sid || '') + '/' + String(note || '') }
      function readLocalViews() { try { return JSON.parse(window.localStorage.getItem(VIEW_KEY) || '{}') || {} } catch (err) { return {} } }
      function readLocalView(sid, note) {
        if (!note) return null
        const v = readLocalViews()[localViewKey(sid, note)]
        return v && Number(v.line) >= 1 ? { line: Math.round(Number(v.line)), anchor: String(v.anchor || '') } : null
      }
      function writeLocalView(sid, note, line, anchor) {
        if (!note) return
        try {
          const all = readLocalViews()
          const cut = Date.now() - 60 * 24 * 3600 * 1000
          const keys = Object.keys(all)
          for (let i = 0; i < keys.length; i++) { const e = all[keys[i]]; if (!e || !(e.at >= cut)) delete all[keys[i]] }
          all[localViewKey(sid, note)] = { line: line, anchor: anchor, at: Date.now() }
          window.localStorage.setItem(VIEW_KEY, JSON.stringify(all))
        } catch (err) { }
      }
      function anchorOfLine(line) {
        const lines = String(textRef.current || '').split(String.fromCharCode(10))
        return String(lines[line - 1] || '').trim().slice(0, 40)
      }
      /** The first line whose band is at least partly below the top edge of the viewport. */
      function topVisibleLine() {
        const host = bodyRef.current
        if (!host) return 0
        const bands = lineBands().byLine
        const keys = Object.keys(bands)
        if (!keys.length) return 0
        const edge = host.scrollTop + 4
        let best = 0, bestTop = Infinity
        for (let i = 0; i < keys.length; i++) {
          const b = bands[keys[i]]
          if (!b || b.bottom < edge) continue
          if (b.top < bestTop) { bestTop = b.top; best = Number(keys[i]) }
        }
        return best
      }
      function saveViewNow() {
        if (viewSaveTimerRef.current !== null) { try { window.clearTimeout(viewSaveTimerRef.current) } catch (err) { } viewSaveTimerRef.current = null }
        if (!sidRef.current) return
        const line = topVisibleLine()
        if (!line) return
        const note = String(noteNameRef.current || '')
        if (viewSavedRef.current.line === line && viewSavedRef.current.note === note) return
        viewSavedRef.current = { line: line, note: note }
        writeLocalView(sidRef.current, note, line, anchorOfLine(line))
        // Deliberately no .catch toast: the position is a convenience, and a failure to
        // store it must never interrupt reading. The browser-local mirror above already
        // holds it, and an older host (no saveView handler) is not called at all.
        if (hostViewRef.current) {
          try { host.call('saveView', { sessionId: sidRef.current, line: line, anchor: anchorOfLine(line) }).catch(function () { }) } catch (err) { }
        }
      }
      function scheduleViewSave() {
        if (viewSaveTimerRef.current !== null) { try { window.clearTimeout(viewSaveTimerRef.current) } catch (err) { } }
        viewSaveTimerRef.current = window.setTimeout(saveViewNow, 700)
      }
      /** Scroll the restored line to the top of the card, once, when a note is opened. */
      function applyPendingView() {
        const p = pendingViewRef.current
        if (!p) return
        const host = bodyRef.current
        if (!host) return
        const text = String(textRef.current || '')
        const lines = text.split(String.fromCharCode(10))
        if (!lines.length) { pendingViewRef.current = null; return }
        let line = Math.max(1, Math.min(p.line, lines.length))
        // The line number is a hint, the anchor text is the truth: an external edit that
        // inserted or removed lines above moves the number but not the sentence.
        if (p.anchor && anchorOfLine(line) !== p.anchor) {
          let found = 0
          for (let d = 1; d <= Math.min(600, lines.length) && !found; d++) {
            if (line - d >= 1 && String(lines[line - d - 1] || '').trim().slice(0, 40) === p.anchor) found = line - d
            else if (line + d <= lines.length && String(lines[line + d - 1] || '').trim().slice(0, 40) === p.anchor) found = line + d
          }
          if (found) line = found
          else { pendingViewRef.current = null; return }
        }
        const bands = lineBands().byLine
        let top = null
        for (let probe = line; probe <= Math.min(lines.length, line + 30) && top === null; probe++) {
          const b = bands[probe]
          if (b) { top = b.top; break }
          const el = lineEls.current[probe]
          if (el && el.isConnected) { const rec = cellsOf(probe); if (rec && rec.rect) top = rec.rect.top }
        }
        if (top === null) {
          // Not measured yet (the blocks render before the bands exist). Give the geometry
          // a few more chances as it bumps, then give up rather than fight the reader.
          p.tries = (p.tries || 0) + 1
          if (p.tries > 12) pendingViewRef.current = null
          return
        }
        pendingViewRef.current = null
        host.scrollTop = Math.max(0, top - 16)
        viewSavedRef.current = { line: line, note: String(noteNameRef.current || '') }
      }
      function clearSelections() {
        // Two lessons from the "清空全部选中功能失效" report, both about failing silently:
        // the host handler answered { ok:false, error:"args is not defined" } and this
        // function only reacted to ok:true, so the button did nothing AND said nothing.
        // Now a failure is always reported, and if the bulk RPC fails (an older host that
        // still carries that bug) the entries are removed one by one instead, which works
        // on any host. The id list comes from the HOST, not from this component's state:
        // the rest of the call is answered by the host, so it may not agree with a state
        // snapshot taken in an earlier render.
        const done = function (out) {
          revRef.current = out.revision
          setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: out.revision, selections: out.selections }) : prev })
          notify('已清空全部选中')
        }
        // The shell surfaces a handler's { ok:false, error } as a REJECTED promise, not as a
        // resolved value: with the original code (no .catch at all) the rejection was swallowed
        // and the button did nothing and said nothing — the reported 功能失效. So the fallback
        // hangs off both the refusal branch and the rejection branch.
        const fallback = function (why) {
          host.call('state', { revision: -1, sessionId: sidRef.current }).then(function (s) {
            const ids = ((s && s.selections) || []).map(function (x) { return x.id })
            if (!ids.length) { notify('清空失败: ' + (why || '未知原因')); return }
            let chain = Promise.resolve(null)
            for (let i = 0; i < ids.length; i++) {
              const id = ids[i]
              chain = chain.then(function () { return host.call('removeSelection', { id: id, sessionId: sidRef.current }) })
            }
            chain.then(function (last) {
              if (last && last.ok) { done(last); return }
              notify('清空失败: ' + ((last && last.error) || why || '未知原因'))
            }).catch(function (err) { notify('清空失败: ' + ((err && err.message) || String(err))) })
          }).catch(function (err) { notify('清空失败: ' + ((err && err.message) || String(err))) })
        }
        host.call('clearSelections', { sessionId: sidRef.current }).then(function (r) {
          if (r && r.ok) { done(r); return }
          fallback((r && r.error) || '')
        }).catch(function (err) { fallback((err && err.message) || String(err)) })
      }
      function removeSelection(id) {
        host.call('removeSelection', { id: id, sessionId: sidRef.current }).then(function (r) {
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
        barAtRef.current = d.mode === 'handle' ? d.which : 'f'
        if (d.mode === 'drag') {
          // `block` must survive: dropping it turned a whole-diagram selection back into
          // a line/column range the moment anything moved.
          setLive(function (prev) { if (!prev) return prev; if (samePos(prev.f, p)) return prev; return { a: prev.a, f: p, block: prev.block } })
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
        // A long press picks a unit — a word, an image's Markdown source, a whole
        // diagram — and the gesture continues from there. What happens on movement has
        // to differ by input device:
        //
        // - Mouse: dragging means "extend the selection". A mouse drag is never straight,
        //   so anything that gates extension on axis and tolerance kills it outright
        //   (that regression: no live update, no loupe, and the range only jumped when a
        //   lucky horizontal move got through — reported as "长按并拖动不好用了，选中内容
        //   随机性太强"). The unit therefore converts on the first move, exactly as it
        //   always did.
        // - Touch: a press-and-drag IS the scroll gesture (`.dn-body{touch-action:pan-y}`),
        //   so a unit must not follow the finger down the document — that is what stretched
        //   a selection into a huge span. There the unit is held until a deliberate
        //   horizontal drag commits to extending it.
        //
        // A block never extends on either input: dragging out of a diagram means nothing.
        const isTouch = (ev && ev.pointerType === 'touch') || modRef.current === 'touch'
        const p0 = pointFromEvent(ev)
        if (d.unit && d.unit !== 'block' && isTouch) {
          const dx = Math.abs(p0.x - d.x)
          const dy = Math.abs(p0.y - d.y)
          if (dy > UNIT_SLOP_Y || dx <= UNIT_SLOP_X) return
        }
        if (d.unit === 'block') return
        d.unit = null
        const p = p0
        const pt = pointToPos(p.x, p.y)
        if (!pt) return
        scheduleLive(pt)
        setMagnify({ x: p.x, y: p.y, line: pt.line, col: pt.col })
        // Dragging against a table's edge scrolls it, so the caret can reach columns
        // that are currently out of view — the scrolling then re-measures geometry
        // (see the scroll listener), so the highlight and handles stay in sync.
        const lineEl = lineEls.current[pt.line]
        const wrapEl = lineEl && lineEl.closest ? lineEl.closest('[data-dn-table]') : null
        if (wrapEl && wrapEl.scrollWidth > wrapEl.clientWidth) {
          const wr = wrapEl.getBoundingClientRect()
          const EDGE = 30
          if (p.x > wr.right - EDGE) {
            wrapEl.scrollLeft = Math.min(wrapEl.scrollWidth - wrapEl.clientWidth, wrapEl.scrollLeft + Math.max(6, p.x - (wr.right - EDGE)))
          } else if (p.x < wr.left + EDGE) {
            wrapEl.scrollLeft = Math.max(0, wrapEl.scrollLeft - Math.max(6, (wr.left + EDGE) - p.x))
          }
        }
        hideBar()
        if (modRef.current === 'touch') revealBar(500)
      }
      function onDragEnd() {
        if (lpTimer.current) { lpTimer.current(); lpTimer.current = null }
        if (throttleRef.current) { throttleRef.current(); throttleRef.current = 0 }
        if (pendingRef.current && drag.current) flushPending()
        drag.current = null; setPressing(false)
        setMagnify(null)
        revealBar(modRef.current === 'touch' ? 500 : 0)
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
        if (tgt && tgt.closest && tgt.closest('button')) return
        // Ordinary links and buttons must keep working as links/buttons. A linked image
        // (`[![alt](src)](href)` renders as a.dn-imglink) is content though: bailing out on
        // it made the image impossible to long-press at all — no live selection, no bar.
        const anchor = tgt && tgt.closest ? tgt.closest('a') : null
        if (anchor && !(anchor.classList && anchor.classList.contains('dn-imglink'))) return
        // A long press on that anchor must select the image rather than follow the link,
        // so the click the browser fires on release is swallowed (see onClickCapture).
        navGuardRef.current = false
        // Never begin a selection gesture on a scrollbar: dragging the table's
        // horizontal scrollbar used to run the long-press timer and leave a
        // stray selection behind. Only the scrollbar strip is excluded, so text
        // inside a wide table stays selectable.
        const scroller = tgt && tgt.closest ? tgt.closest('.dn-twrap,.dn-pre,.dn-mmd') : null
        if (scroller && (tgt === scroller || e.clientY >= scroller.getBoundingClientRect().bottom - 12)) return
        // The body's own vertical scrollbar lives in the right gutter. Dragging it
        // used to run the long-press timer and leave a large selection behind, so
        // the gutter is excluded whenever a scrollbar is actually present.
        const bodyHost = bodyRef.current
        if (bodyHost) {
          const gutter = bodyHost.offsetWidth - bodyHost.clientWidth
          if (gutter > 0) {
            const hr = bodyHost.getBoundingClientRect()
            if (e.clientX >= hr.right - gutter - 2) return
          }
        }
        // Deliberately does NOT clear an existing live highlight: on touch, a
        // scroll drag begins with a pointerdown, and that used to throw the
        // selection away. Only the bar's [取消] button (or committing it) clears
        // it now, which makes desktop and mobile behave identically.
        modRef.current = e.pointerType === 'touch' ? 'touch' : 'mouse'
        // Same reasoning one step further: the bar is the only affordance that acts on
        // the live selection (取消 in particular), so hiding it while that selection is
        // still on screen left the user tapping an empty spot — which reads as "取消
        // needs two taps". Keep it while a live selection exists; a new long press
        // replaces the selection and re-anchors the bar anyway. The colour popup always
        // closes, so a stray pen menu cannot linger.
        if (live) { setPenOpen(false) } else { hideBar() }
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
          if (!d || !d.pt || d.mode !== 'press') return
          d.mode = 'drag'
          navGuardRef.current = true
          // Marks this gesture as "one unit, not a free range" — see onDragMove.
          d.unit = 'block'
          if (!cellsOf(d.pt.line).cells.length) {
            // A block with no character boxes (a Mermaid diagram, an image) cannot be
            // word-selected, and line/column math cannot express "this whole block":
            // only the opening fence line owns a rendered element, so an end position
            // on an inner line produced no second handle and no highlight. The
            // selection is carried as a flag and rendered from the element's rect.
            const rangeBlock = blockRangeAt(d.pt.line)
            const lineBlock = rangeBlock ? rangeBlock.from : d.pt.line
            setLive({ a: { line: lineBlock, col: 0 }, f: { line: lineBlock, col: 0 }, block: true })
            return
          }
          const w = wordRange(d.pt)
          const a = Math.min(w.from, w.to), f = Math.max(w.from, w.to)
          // An image's own source range is a unit too (`snapCol` would otherwise collapse
          // it to a zero-width range as the finger drifts), a word is as well.
          d.unit = cellsOf(d.pt.line).cells.length === 1 && cellsOf(d.pt.line).cells[0].img ? 'image' : 'word'
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
      /** Source line range of the block containing \`line\`. */
      function blockRangeAt(line) {
        const blocks = parseBlocks(String(textRef.current || ''))
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i]
          let to = b.line
          if (b.k === 'code') to = b.endLine ? b.endLine : (b.line + (b.body ? b.body.length : 0) + 1)
          if (b.k === 'table' && b.rows && b.rows.length) to = b.rows[b.rows.length - 1].line
          if (line >= b.line && line <= to) return { from: b.line, to: to, kind: b.k }
        }
        return null
      }
      function cancelBlockEdit() { editBlockRef.current = null; setEditBlock(null) }
      function commitBlockEdit() {
        const eb = editBlockRef.current
        editBlockRef.current = null
        setEditBlock(null)
        if (!eb || !st) return
        const lines = String(st.text).split(String.fromCharCode(10))
        const next = lines.slice(0, eb.from - 1).concat(String(eb.value).split(String.fromCharCode(10))).concat(lines.slice(eb.to))
        const text = next.join(String.fromCharCode(10))
        if (text === st.text) return
        setBusy('保存中')
        host.call('saveText', { text: text, baseRevision: revRef.current, sessionId: sidRef.current }).then(function (r) {
          setBusy('')
          if (r && r.ok) {
            revRef.current = r.revision
            textRef.current = text
            setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, text: text, lineCount: text.split(String.fromCharCode(10)).length, selections: r.selections }) : prev })
            setToast('已保存这一块')
          } else {
            setToast(r && r.conflict ? '笔记已被别处修改，请先重载' : '保存失败')
          }
        }).catch(function () { setBusy(''); setOffline(true) })
      }
      function onDoubleClick(e) {
        if (mode !== 'read') return
        const tgt = e.target
        if (tgt && tgt.closest) { const a = tgt.closest('a'); if (a && a.getAttribute('href') && a.getAttribute('href') !== '#') return }
        const pt = pointToPos(e.clientX, e.clientY)
        if (!pt) { enterEdit(null); return }
        const range = blockRangeAt(pt.line)
        if (!range) { enterEdit(pt); return }
        // A table cell edits its own row, with the caret landing in that cell.
        const lines = String(st.text).split(String.fromCharCode(10))
        const eb = { from: range.from, to: range.to, kind: range.kind, value: lines.slice(range.from - 1, range.to).join(String.fromCharCode(10)), caret: pt, openedAt: Date.now() }
        editBlockRef.current = eb
        setEditBlock(eb)
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
      // The card loads for a session that HAS a note, or when the user summoned it
      // explicitly with `/window-note start` (st.summoned, remembered per session). Any
      // other session with no notes gets nothing at all — no panel, no pill. A host that
      // predates `summoned` simply reports nothing, and the rule collapses to "has a note",
      // which is the same behaviour it had before.
      if (!(notes.length > 0) && st.summoned !== true) return null
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
            const img = h(NoteImage, { key: keyPrefix + 'img' + i, href: tk.href, alt: tk.t, soff: tk.base + tk.off, len: tk.len || (tk.t ? tk.t.length : 0), cls: 'dn-img' })
            // A linked image keeps its click-through. The anchor is a bare wrapper: the
            // data-soff/data-img-len stay on the <img> so the geometry cache sees one
            // cell for the image rather than two for the same box.
            out.push(tk.link ? h('a', { className: 'dn-imglink', key: keyPrefix + 'imgl' + i, href: tk.link, target: '_blank', rel: 'noreferrer', title: tk.link }, [img]) : img)
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
          if (editBlock && b.line === editBlock.from) {
            out.push(h('textarea', {
              className: 'dn-blk-editor', key: key, ref: blockEditorRef, value: editBlock.value,
              rows: Math.min(30, Math.max(1, editBlock.value.split(String.fromCharCode(10)).length + 1)),
              onChange: function (ev) {
                const nb = Object.assign({}, editBlockRef.current, { value: ev.target.value })
                editBlockRef.current = nb
                setEditBlock(nb)
              },
              // No commit on blur: the DSH shell re-takes focus on its own
              // schedule, so a blur is not a reliable "user finished" signal.
              // Committing happens on an outside click or Ctrl/Cmd+Enter below.
              onKeyDown: function (ev) {
                if (ev.key === 'Escape') { ev.preventDefault(); cancelBlockEdit() }
                if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); commitBlockEdit() }
              },
              onPointerDown: function (ev) { ev.stopPropagation() },
              onDoubleClick: function (ev) { ev.stopPropagation() },
              spellCheck: false,
            }))
            continue
          }
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
              // Highlighting for blocks is painted by the overlay layer (which is
              // not memoized), so the memoized block itself must not carry it.
              out.push(h(MermaidBlock, { key: key, line: b.line, body: b.body, text: st.text, hl: false, live: false, innerRef: lineElsFor(b.line) }))
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
      // Hand-rolled cache instead of useMemo: renderBlocks() has to run here and
      // not earlier, because it closes over consts initialised above but used far
      // below, and a hook added at this point would change the hook order between
      // renders (which unmounts the whole card). Reusing the element objects makes
      // React bail out of those subtrees, so a pointermove-driven live selection
      // re-renders only the overlay/handle layer — the mobile-jank fix.
      const blocksKey = (st ? st.text : '') + '|' + mode + '|' + (editBlock ? editBlock.from + ':' + editBlock.to : '')
      if (blocksCache.current.key !== blocksKey) blocksCache.current = { key: blocksKey, kids: renderBlocks() }
      const bodyKids = mode === 'edit'
        ? [h('textarea', { className: 'dn-editor', key: 'ed', ref: editorRef, value: draft, onChange: onDraft, onPointerDown: function (e) { e.stopPropagation() }, onDoubleClick: function (e) { e.stopPropagation() }, spellCheck: false })]
        : blocksCache.current.kids.slice()
      // Overlays, handles, the loupe and the action bar are NOT children of the body any
      // more: appending to the 1211-child scroller forced a full re-layout of the note on
      // every pointermove (measured: 107ms per insert under a 4x CPU throttle, versus 0.3ms
      // into a sibling layer). `bind` puts each element into the layer that decides whether
      // it paints behind the text (tints) or above it (the black mask, image outlines,
      // handles, loupe, bar). Coordinates stay in content coordinates because the layer's
      // inner box is translated by the scroll offset below.
      const layBack = []
      const layFront = []
      const bind = function (el, color) { (color === 'black' ? layFront : layBack).push(el); return el }
      if (mode === 'read') {
        const byLine = {}
        const lines = String(st.text).split('\n')
        for (let i = 0; i < selList.length; i++) {
          const s = selList[i]
          for (let ln = s.startLine; ln <= s.endLine; ln++) {
            if (!byLine[ln]) byLine[ln] = []
            byLine[ln].push({ from: ln === s.startLine ? s.startCol : 0, to: ln === s.endLine ? s.endCol : (lines[ln - 1] || '').length, kind: s.stale ? 'stale' : 'saved', color: s.color || 'yellow' })
          }
        }
        if (live && !live.block) {
          const lo = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
          const hi = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
          for (let ln = lo.line; ln <= hi.line; ln++) {
            if (!byLine[ln]) byLine[ln] = []
            byLine[ln].push({ from: ln === lo.line ? lo.col : 0, to: ln === hi.line ? hi.col : (lines[ln - 1] || '').length, kind: 'live', color: penColor })
          }
        }
        const keys = Object.keys(byLine)
        const srcLines = String(st.text).split(String.fromCharCode(10))
        // Only lines that can actually be seen need measuring: cellsOf() measures every
        // character of a line with a Range on first use, and during a drag across a long
        // note that cost was paid for the whole document even though the body clips
        // everything outside its window. Skipping them changes nothing visually — the
        // overlays would be clipped away — and keeps a drag responsive on big notes.
        // This window therefore has to be recomputed whenever the scrollbar moves, which is
        // what the setScrollTick listener on the body is for; without it the window froze at
        // the last render's position and the highlights of newly visible lines never appeared.
        const visHost = bodyRef.current
        const visTop = visHost ? visHost.scrollTop - 40 : -Infinity
        const visBottom = visHost ? visHost.scrollTop + visHost.clientHeight + 40 : Infinity
        const bands = lineBands().byLine
        // A selection can cover source lines that own no element of their own: a table's
        // header and separator rows are rendered as part of the first body row, and some
        // constructs absorb their own lines. Those lines used to produce NO overlay at
        // all, so a selection over such a region showed colour on some lines and nothing
        // on others ("我选了 141 到 168 行，渲染出来只有这几行"). Map every such line onto
        // the element of the block that contains it, and remember the target so the two
        // source lines sharing one element cannot stack two tints on the same band.
        const drawnRects = {}
        for (let i = 0; i < keys.length; i++) {
          let ln = Number(keys[i])
          let band = bands[ln]
          if (!band) {
            const el = lineEls.current[ln]
            if (el && el.isConnected) {
              const rec = cellsOf(ln)
              if (rec.rect) band = { line: ln, top: rec.rect.top, bottom: rec.rect.bottom }
            }
          }
          if (!band) {
            // No element for this line: fall back to the block that owns it.
            const blk = blockRangeAt(ln)
            if (blk && blk.from !== ln) {
              let target = blk.from
              // The block's first line may itself be absorbed (a table's header line):
              // walk forward to the first line of the block that really has an element.
              for (let probe = blk.from; probe <= blk.to && probe <= blk.from + 8; probe++) {
                const el2 = lineEls.current[probe]
                if (el2 && el2.isConnected) { target = probe; break }
              }
              const rec2 = cellsOf(target)
              if (rec2.rect) { band = { line: target, top: rec2.rect.top, bottom: rec2.rect.bottom }; ln = target }
            }
          }
          if (!band) continue
          if (band.bottom < visTop || band.top > visBottom) continue
          const rects = highlightRects(ln, byLine[Number(keys[i])])
          const lineElForClip = lineEls.current[ln]
          const wrapForClip = lineElForClip && lineElForClip.closest ? lineElForClip.closest('[data-dn-table]') : null
          let clipBox = null
          if (wrapForClip && bodyRef.current) {
            const wr = wrapForClip.getBoundingClientRect()
            const hr = bodyRef.current.getBoundingClientRect()
            const base = hr.left - bodyRef.current.scrollLeft
            clipBox = { left: wr.left - base + 1, right: wr.right - base - 1 }
          }
          if (rects.length === 0) {
            // Mermaid diagrams and images have no character boxes, so they get a
            // single block-level tint over the whole element instead — a colour on
            // a diagram then reads as a faint mask laid across the graphic.
            // Not for a degenerate *live* range on a line that HAS text: that painted a
            // whole blue block over the element while the range was empty, which is why a
            // broken long press looked "selected" and then answered "没有选中文字".
            // A BLANK line is the exception — an empty source line is selected as the
            // whole line, its range is legitimately 0..0, and suppressing it left the gaps
            // in a multi-line selection that are the bug being fixed here.
            const ranges = byLine[Number(keys[i])] || byLine[ln]
            const rawLine = srcLines[ln - 1] === undefined ? '' : String(srcLines[ln - 1])
            const emptyLiveOnly = ranges.length === 1 && ranges[0].kind === 'live' && ranges[0].to <= ranges[0].from && rawLine.trim() !== ''
            const rec = emptyLiveOnly ? null : cellsOf(ln)
            if (rec && rec.rect) {
              const first = (byLine[Number(keys[i])] || byLine[ln])[0]
              rects.push({ row: Math.round(rec.rect.top), kind: first.kind, color: first.color, left: rec.rect.left, right: rec.rect.right, top: rec.rect.top, bottom: rec.rect.bottom })
            }
          }
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k]
            let lo = r.left, hi = r.right
            if (clipBox) {
              if (hi <= clipBox.left || lo >= clipBox.right) continue
              lo = Math.max(lo, clipBox.left)
              hi = Math.min(hi, clipBox.right)
            }
            // Two source lines that share one element (a table header plus its first body
            // row, say) must not stack two tints on the same band: the area would darken.
            const rectKey = r.kind + '|' + (r.color || 'yellow') + '|' + Math.round(lo) + '|' + Math.round(hi) + '|' + Math.round(r.top) + '|' + Math.round(r.bottom)
            if (drawnRects[rectKey]) continue
            drawnRects[rectKey] = true
            bind(h('div', { className: 'dn-hlo', 'data-kind': r.kind, 'data-color': r.color || 'yellow', 'data-img': r.img ? '1' : undefined, key: 'o' + ln + '_' + k, style: { left: lo + 'px', top: r.top + 'px', width: Math.max(1, hi - lo) + 'px', height: Math.max(2, r.bottom - r.top) + 'px' } }), r.color)
          }
        }
      }
      if (live && live.block && mode === 'read') {
        // One overlay covering the element, and handles on its top-left and
        // bottom-left corners — "select the whole diagram" without any line maths.
        const blkRec = cellsOf(live.a.line)
        if (blkRec.rect) {
          bind(h('div', {
            className: 'dn-hlo', 'data-kind': 'live', 'data-color': penColor, key: 'oblk',
            style: { left: blkRec.rect.left + 'px', top: blkRec.rect.top + 'px', width: Math.max(1, blkRec.rect.right - blkRec.rect.left) + 'px', height: Math.max(2, blkRec.rect.bottom - blkRec.rect.top) + 'px' },
          }), penColor)
        }
      }
      if (live && mode === 'read') {
        const first = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
        const last = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
        let p1 = posToPoint(first.line, first.col)
        let p2 = posToPoint(last.line, last.col)
        if (live.block) {
          const blk = cellsOf(live.a.line).rect
          if (blk) {
            const lh = 18
            p1 = { x: blk.left, y: blk.top, h: lh }
            p2 = { x: blk.left, y: Math.max(blk.top, blk.bottom - lh), h: lh }
          }
        }
        const ovPe = pressing ? 'none' : 'auto'
        // Native-style handles: a small dot with a stem whose tip sits exactly on
        // the caret (start handle above it, end handle below), wrapped in a 44x44
        // hit area — Apple's minimum touch target, and the reason a finger could
        // not reliably grab the old 12px circles.
        function teardropHandle(which, pt, key) {
          const up = which === 'a'
          // Keep the handle inside whatever is actually visible. Inside a table the
          // caret's x can far exceed the body's width (the table scrolls on its own),
          // so the clamp uses the wrapper's visible box there — otherwise the handle
          // was clipped away by overflow-x and could not be grabbed at all.
          const hostEl = bodyRef.current
          const lineEl = lineEls.current[pt.line]
          const wrapEl = lineEl && lineEl.closest ? lineEl.closest('[data-dn-table]') : null
          let minX = 24, maxX = (hostEl ? hostEl.clientWidth : geo.width) - 24
          if (wrapEl && hostEl) {
            const wr = wrapEl.getBoundingClientRect()
            const hr = hostEl.getBoundingClientRect()
            const base = hr.left - hostEl.scrollLeft
            minX = (wr.left - base) + 24
            maxX = (wr.right - base) - 24
          }
          const tipX = Math.min(Math.max(pt.x, minX), Math.max(minX, maxX))
          const tipY = pt.y + (pt.h || 18) / 2
          return h('div', {
            className: 'dn-handle', key: key, 'data-tip': up ? 'down' : 'up',
            style: { left: (tipX - 22) + 'px', top: (tipY - (up ? 31 : 13)) + 'px', pointerEvents: ovPe },
            onPointerDown: handleDown(which),
          }, [
            h('span', { className: 'dn-handle-tail', key: 't' }),
            h('span', { className: 'dn-handle-dot', key: 'd' }),
          ])
        }
        if (p1) layFront.push(teardropHandle('a', p1, 'ha'))
        if (p2) layFront.push(teardropHandle('f', p2, 'hf'))
        if (magnify) {
          const o = bodyOrigin()
          const raw = String(textRef.current).split(String.fromCharCode(10))[magnify.line - 1] || ''
          const col = Math.max(0, Math.min(magnify.col, raw.length))
          const half = 6
          const from = Math.max(0, col - half)
          const snippet = (raw.slice(from, from + half * 2) + '  ').slice(0, half * 2 + 2)
          const at = col - from
          const w = Math.min(210, Math.max(96, snippet.length * 9 + 24))
          layFront.push(h('div', {
            className: 'dn-loupe', key: 'loupe',
            style: { left: Math.min(Math.max(4, magnify.x - o.left - w / 2), Math.max(4, (bodyRef.current ? bodyRef.current.clientWidth : geo.width) - w - 4)) + 'px', top: (magnify.y - o.top - 62) + 'px', width: w + 'px' },
          }, [
            h('span', { key: 'a' }, snippet.slice(0, at)),
            h('span', { className: 'dn-loupe-caret', key: 'c' }),
            h('span', { key: 'b' }, snippet.slice(at)),
          ]))
        }
        // Anchor the bar on the caret the gesture actually moved: the dragged handle
        // when a handle is dragged, the pointer otherwise. It sits above the
        // selection when that caret is the upper end, below it when it is the lower
        // end, so it never covers the text being selected.
        const anchorAtStart = barAtRef.current === 'a'
        const anchorCaret = anchorAtStart ? live.a : live.f
        const otherCaret = anchorAtStart ? live.f : live.a
        const anchorUp = cmpPos(anchorCaret, otherCaret) <= 0
        const anchorPt = posToPoint(anchorCaret.line, anchorCaret.col)
        const anchor = anchorPt || p1 || p2
        if (anchor && barReady) {
          const barHost = bodyRef.current
          const BAR_H = 36
          const belowY = anchor.y + (anchor.h || 18) + 6
          const aboveY = Math.max(4, anchor.y - 42)
          const visibleBelow = barHost ? belowY - barHost.scrollTop + BAR_H : 0
          const fitsBelow = !barHost || visibleBelow < barHost.clientHeight
          const aboveVisible = !barHost || aboveY >= barHost.scrollTop + 2
          let barTop = anchorUp ? (aboveVisible ? aboveY : belowY) : (fitsBelow ? belowY : aboveY)
          // Above/below the caret is not enough when neither side is inside the scrolled
          // window — a block taller than the card (a long Mermaid diagram, a big table).
          // The bar then landed past the body's bottom edge, overflow clipped it, and its
          // buttons were unclickable, so 选中 could never be pressed. Clamp it into view.
          if (barHost) {
            const minTop = barHost.scrollTop + 2
            const maxTop = barHost.scrollTop + barHost.clientHeight - BAR_H - 6
            barTop = Math.min(Math.max(barTop, minTop), Math.max(minTop, maxTop))
          }
          layFront.push(h('div', { className: 'dn-bar', key: 'bar', style: { left: Math.max(4, anchor.x - 10) + 'px', top: barTop + 'px', pointerEvents: ovPe } }, [
            h('span', { className: 'dn-pen', key: 'pen' }, [
              h('button', { className: 'dn-pen-sw', key: 'cur', 'data-c': penColor, 'data-on': 'true', title: '本次高亮颜色（默认黄）', onPointerDown: press(function () { setPenOpen(!penOpen) }), onClick: tap(function () { setPenOpen(!penOpen) }) }),
              penOpen ? h('span', { className: 'dn-pen-pop', key: 'pop' }, PEN_COLORS.map(function (c) {
                return h('button', { className: 'dn-pen-sw', key: c, 'data-c': c, title: c, 'data-on': c === penColor ? 'true' : 'false', onPointerDown: press(function () { setPenColor(c); writePenColor(c); setPenOpen(false) }), onClick: tap(function () { setPenColor(c); writePenColor(c); setPenOpen(false) }) })
              })) : null,
            ]),
            h('button', { key: 'copy', 'data-act': 'copy', onPointerDown: press(function () { copyText(liveText()).then(function (ok) { notify(ok ? '已复制' : '复制失败') }) }), onClick: tap(function () { copyText(liveText()).then(function (ok) { notify(ok ? '已复制' : '复制失败') }) }) }, '复制'),
            h('button', { key: 'pick', 'data-act': 'pick', onPointerDown: press(function () { hideBar(); commitLive() }), onClick: tap(function () { hideBar(); commitLive() }) }, '选中'),
            h('button', { key: 'cancel', 'data-act': 'cancel', onPointerDown: press(function () { hideBar(); setLive(null) }), onClick: tap(function () { hideBar(); setLive(null) }) }, '取消'),
          ]))
        }
      }
      let sizeLabel = Math.round(geo.width) + 'px'
      for (let i = 0; i < SIZES.length; i++) if (SIZES[i].id === layout.size) sizeLabel = SIZES[i].label
      // ── 笔记（多笔记 + 会话隔离）──────────────────────────────────────────────
      // The session id is the path segment on the host, so every call carries it. The
      // panel is the only place that creates, switches, imports, clears or deletes notes.
      function applyNotes(r) {
        if (!r) return
        if (Array.isArray(r.notes)) setNotes(r.notes)
        if (typeof r.active === 'string') setNoteName(r.active)
      }
      function refreshNotes() {
        return host.call('listNotes', { sessionId: sidRef.current }).then(function (r) {
          if (r && r.ok) { setNotes(r.notes || []); setNoteName(r.active || '') }
          return r
        }).catch(function () { return null })
      }
      function switchNote(name) {
        if (!name || name === noteName) return
        // Everything the selection UI holds belongs to the note being LEFT: a live (blue)
        // selection, its action bar, the magnifier and an open block editor are all
        // meaningless on the note we switch to. They used to survive the switch — exactly
        // the kind of state that was designed when a session had a single note.
        setLive(null); setMagnify(null); hideBar()
        editBlockRef.current = null; setEditBlock(null)
        setPanel(false)
        const go = function () {
          setBusy('切换中')
          // Remember where the reader was in the note being left BEFORE it changes.
          saveViewNow()
          host.call('selectNote', { sessionId: sidRef.current, name: name }).then(function (r) {
            setBusy('')
            if (r && r.ok) {
              applyState(r)
              setNoteName(r.active || name)
              draftRef.current = r.text || ''
              setDraft(r.text || '')
              setDirty(false); dirtyRef.current = false
              if (mode === 'edit') setMode('read')
              // No scroll reset any more: the note being opened restores its own reading
              // position (applyState queued it), and a note opened for the first time
              // simply stays where it is — the top.
              bump()
              notify('已打开《' + (r.active || name) + '》')
              return refreshNotes()
            }
            notify((r && r.error) || '切换失败')
          }).catch(function (err) { setBusy(''); notify('切换失败: ' + err.message) })
        }
        // Unsaved edits belong to the note being left, so save them before switching.
        if (dirtyRef.current) flush(true).then(go)
        else go()
      }
      /** Read a dropped/picked File as UTF-8 text (base64 for the wire). */
      function fileToBase64(file) {
        return new Promise(function (resolve, reject) {
          try {
            const fr = new FileReader()
            fr.onload = function () {
              const s = String(fr.result || '')
              const at = s.indexOf(',')
              resolve({ name: file && file.name ? file.name : 'pasted', base64: at >= 0 ? s.slice(at + 1) : s })
            }
            fr.onerror = function () { reject(new Error('读取文件失败')) }
            fr.readAsDataURL(file)
          } catch (err) { reject(err) }
        })
      }
      function submitCreate() {
        const m = noteModal || {}
        const name = String(m.name || '').trim()
        if (!name) { notify('请填写笔记名'); return }
        setBusy('创建中')
        host.call('createNote', { sessionId: sidRef.current, name: name, text: m.text || '', base64: m.base64 || '', open: true }).then(function (r) {
          setBusy('')
          if (r && r.ok) {
            setNoteModal(null)
            notify('已新建《' + r.name + '》' + (r.source !== 'empty' ? '（来自' + r.source + '）' : ''))
            setNoteName(r.name)
            return refreshNotes().then(function () { return doReload() })
          }
          notify((r && r.error) || '创建失败')
        }).catch(function (err) { setBusy(''); notify('创建失败: ' + err.message) })
      }
      function submitImport() {
        const m = noteModal || {}
        if (!m.text && !m.base64) { notify('请粘贴内容或选择文件'); return }
        setBusy('导入中')
        host.call('importNote', { sessionId: sidRef.current, text: m.text || '', base64: m.base64 || '', mode: m.mode || 'append' }).then(function (r) {
          setBusy('')
          if (r && r.ok) { setNoteModal(null); notify('已导入到《' + r.name + '》'); return doReload() }
          notify((r && r.error) || '导入失败')
        }).catch(function (err) { setBusy(''); notify('导入失败: ' + err.message) })
      }
      function submitRename() {
        const m = noteModal || {}
        const to = String(m.name || '').trim()
        if (!to) { notify('请填写新名字'); return }
        setBusy('重命名中')
        host.call('renameNote', { sessionId: sidRef.current, from: noteName, to: to }).then(function (r) {
          setBusy('')
          if (r && r.ok) { setNoteModal(null); setNoteName(r.to); notify('已重命名为《' + r.to + '》'); return refreshNotes() }
          notify((r && r.error) || '重命名失败')
        }).catch(function (err) { setBusy(''); notify('重命名失败: ' + err.message) })
      }
      function doClearNote() {
        const sure = window.confirm('清空《' + noteName + '》的正文？\n\ngit 历史会保留（清空前后各提交一次），正文则被替换为标题行。')
        if (!sure) return
        setBusy('清空中')
        host.call('clearNote', { sessionId: sidRef.current }).then(function (r) {
          setBusy('')
          if (r && r.ok) { notify('已清空《' + r.name + '》（清掉 ' + r.clearedLines + ' 行，历史保留）'); return doReload() }
          notify((r && r.error) || '清空失败')
        }).catch(function (err) { setBusy(''); notify('清空失败: ' + err.message) })
      }
      function doDeleteNote() {
        const sure = window.confirm('彻底删除《' + noteName + '》？\n\n整个目录都会被删除，包括它的 .git 历史，无法恢复。')
        if (!sure) return
        setBusy('删除中')
        host.call('deleteNote', { sessionId: sidRef.current, name: noteName, confirm: true }).then(function (r) {
          setBusy('')
          if (r && r.ok) {
            notify('已删除《' + r.deleted + '》' + (r.active ? '，现在打开《' + r.active + '》' : '，本会话已没有笔记'))
            setNotes(r.notes || []); setNoteName(r.active || '')
            if (r.active) return doReload()
            revRef.current = -1
            return refreshNotes()
          }
          notify((r && r.error) || '删除失败')
        }).catch(function (err) { setBusy(''); notify('删除失败: ' + err.message) })
      }
      /** Drop/paste a file onto the card while a modal is open, or import directly. */
      function takeDroppedFiles(files, intoModal) {
        const list = Array.prototype.slice.call(files || [])
        if (!list.length) return
        const f = list[0]
        fileToBase64(f).then(function (res) {
          const base = f.name ? f.name.replace(/\.[^.]+$/, '') : '导入'
          if (intoModal === 'create') setNoteModal(function (prev) { return Object.assign({}, prev || {}, { name: (prev && prev.name) || base, base64: res.base64, fileName: res.name }) })
          else if (intoModal === 'import') setNoteModal(function (prev) { return Object.assign({}, prev || {}, { base64: res.base64, fileName: res.name }) })
          else {
            // No dialog open: offer to create a note from the file.
            setNoteModal({ kind: 'create', name: base, base64: res.base64, fileName: res.name })
          }
          notify('已读取 ' + res.name + '（' + Math.round((res.base64.length * 3) / 4 / 1024) + ' KB）')
        }).catch(function (err) { notify('读取文件失败: ' + err.message) })
      }
      const notesRow = h('div', {
        className: 'dn-notes', key: 'notes',
        'data-drag': noteDrag ? 'true' : 'false',
        onDragOver: function (e) { e.preventDefault(); setNoteDrag(true) },
        onDragLeave: function () { setNoteDrag(false) },
        onDrop: function (e) {
          e.preventDefault(); setNoteDrag(false)
          takeDroppedFiles(e.dataTransfer && e.dataTransfer.files, noteModal ? noteModal.kind : null)
        },
      }, [
        h('span', { className: 'dn-notes-label', key: 'l' }, '笔记'),
        notes.length
          ? h('select', {
            className: 'dn-notes-pick', key: 'p', value: noteName,
            onChange: function (e) { switchNote(e.target.value) },
          }, notes.map(function (n) {
            return h('option', { key: n.name, value: n.name }, n.name + '  (' + n.lines + ' 行' + (n.commitHash ? ' · ' + n.commitHash : '') + ')')
          }))
          : h('span', { key: 'p', className: 'dn-notes-none' }, '本会话还没有笔记'),
        h('button', { className: 'dn-mini', key: 'new', type: 'button', title: '在本会话新建一份笔记', onClick: function () { setNoteModal({ kind: 'create', name: '', text: '' }) } }, '新建'),
        notes.length ? h('button', { className: 'dn-mini', key: 'imp', type: 'button', title: '把文件或粘贴的内容导入当前笔记', onClick: function () { setNoteModal({ kind: 'import', text: '', mode: 'append' }) } }, '导入') : null,
        notes.length ? h('button', { className: 'dn-mini', key: 'ren', type: 'button', title: '重命名当前笔记（目录改名，git 随之保留）', onClick: function () { setNoteModal({ kind: 'rename', name: noteName }) } }, '重命名') : null,
        notes.length ? h('button', { className: 'dn-mini', key: 'clr', type: 'button', title: '清空正文（保留 git 历史）', onClick: doClearNote }, '清空正文') : null,
        notes.length ? h('button', { className: 'dn-mini dn-mini-danger', key: 'del', type: 'button', title: '删除整份笔记（含它的 git）', onClick: doDeleteNote }, '删除笔记') : null,
      ])
      const modalEl = noteModal ? h('div', { className: 'dn-modal', key: 'modal' }, [
        h('div', { className: 'dn-modal-box', key: 'box' }, [
          h('div', { className: 'dn-modal-title', key: 't' }, noteModal.kind === 'create' ? '新建笔记' : (noteModal.kind === 'import' ? '导入到《' + noteName + '》' : '重命名《' + noteName + '》')),
          noteModal.kind === 'rename' ? null : h('input', {
            className: 'dn-modal-input', key: 'name', placeholder: '笔记名（会作为目录名）', value: noteModal.name || '',
            onChange: function (e) { const v = e.target.value; setNoteModal(function (p) { return Object.assign({}, p, { name: v }) }) },
          }),
          noteModal.kind === 'rename' ? h('input', {
            className: 'dn-modal-input', key: 'newname', placeholder: '新名字', value: noteModal.name || '',
            onChange: function (e) { const v = e.target.value; setNoteModal(function (p) { return Object.assign({}, p, { name: v }) }) },
          }) : null,
          noteModal.kind === 'rename' ? null : h('textarea', {
            className: 'dn-modal-text', key: 'text', placeholder: '把 Markdown 粘贴到这里（也可以直接把文件拖到卡片上/点下面的选择文件）',
            value: noteModal.text || '',
            onChange: function (e) { const v = e.target.value; setNoteModal(function (p) { return Object.assign({}, p, { text: v }) }) },
          }),
          noteModal.kind === 'import' ? h('label', { className: 'dn-modal-row', key: 'mode' }, [
            h('input', { key: 'c', type: 'checkbox', checked: noteModal.mode === 'replace', onChange: function (e) { const on = e.target.checked; setNoteModal(function (p) { return Object.assign({}, p, { mode: on ? 'replace' : 'append' }) }) } }),
            h('span', { key: 's' }, '覆盖当前正文（默认是追加）'),
          ]) : null,
          noteModal.fileName ? h('div', { className: 'dn-modal-file', key: 'f' }, '已选择文件：' + noteModal.fileName) : null,
          h('div', { className: 'dn-modal-actions', key: 'a' }, [
            h('label', { className: 'dn-mini', key: 'pick' }, [
              '选择文件…',
              h('input', {
                key: 'i', type: 'file', style: { display: 'none' },
                onChange: function (e) { const f = e.target.files && e.target.files[0]; if (f) takeDroppedFiles([f], noteModal.kind) },
              }),
            ]),
            h('span', { key: 'sp', style: { flex: '1 1 auto' } }),
            h('button', { className: 'dn-mini', key: 'cancel', type: 'button', onClick: function () { setNoteModal(null) } }, '取消'),
            h('button', {
              className: 'dn-mini dn-mini-primary', key: 'ok', type: 'button',
              onClick: noteModal.kind === 'create' ? submitCreate : (noteModal.kind === 'import' ? submitImport : submitRename),
            }, noteModal.kind === 'create' ? '创建' : (noteModal.kind === 'import' ? '导入' : '重命名')),
          ]),
        ]),
      ]) : null
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
      // The overlay layers sit next to the body (inside a relative wrapper) and are shifted by
      // the scroll offset, so every overlay keeps using content coordinates.
      const scTop = bodyRef.current ? bodyRef.current.scrollTop : 0
      const scLeft = bodyRef.current ? bodyRef.current.scrollLeft : 0
      const layShift = { transform: 'translate(' + (-scLeft) + 'px,' + (-scTop) + 'px)' }
      return h('div', { className: 'dn-root', ref: rootRef, style: geo.style || undefined, 'data-panel-mode': geo.mode }, [
        head, notesRow, actions,
        h('div', { className: 'dn-wrap', key: 'wrap' }, [
        h('div', {
          className: 'dn-body', key: 'body', ref: bodyRef, onPointerDown: onBodyDown, onDoubleClick: onDoubleClick,
          // Capture phase: the browser fires a click after a long press too, and on a
          // linked image that would navigate away from the card.
          onClickCapture: function (e) { if (navGuardRef.current) { navGuardRef.current = false; e.preventDefault(); e.stopPropagation() } },
          // Paste a file (or text into an open dialog) straight onto the card.
          onPaste: function (e) {
            const items = e.clipboardData && e.clipboardData.files
            if (items && items.length) { takeDroppedFiles(items, noteModal ? noteModal.kind : null); return }
            const txt = e.clipboardData && typeof e.clipboardData.getData === 'function' ? e.clipboardData.getData('text/plain') : ''
            if (txt && noteModal) { setNoteModal(function (p) { return Object.assign({}, p, { text: String((p && p.text) || '') + txt }) }) }
          },
        }, bodyKids),
        h('div', { className: 'dn-lay dn-lay-back', key: 'layback' }, h('div', { className: 'dn-lay-in', key: 'inb', style: layShift }, layBack)),
        h('div', { className: 'dn-lay dn-lay-front', key: 'layfront' }, h('div', { className: 'dn-lay-in', key: 'inf', style: layShift }, layFront)),
        ]),
        panelEl, foot, modalEl,
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
