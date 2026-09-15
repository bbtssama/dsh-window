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
'.dn-wrap{position:relative;display:flex;flex:1 1 auto;min-height:72px;min-width:0;}',
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
// The two marks that live in the text instead of behind it. Italic keeps the same size so a
// marked paragraph never reflows the page around it; the underline uses a text-decoration so it
// wraps correctly across line breaks (a border-bottom would underline the whole box instead).
'.dn-mki{font-style:italic;}',
'.dn-mku{text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:2px;}',
'.dn-mki.dn-mku{font-style:italic;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:2px;}',
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
// Every swatch is one fixed box that centres its glyph. The I and the U were drawn as bare text
// next to a 20px colour square, so their baselines drifted apart (italic Georgia sits high, an
// underlined U sits low) and the row looked crooked.
'.dn-pen-sw{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:7px;border:1px solid rgba(0,0,0,.22);cursor:pointer;padding:0;margin:0 1px;flex:0 0 auto;font-size:12px;line-height:1;font-family:inherit;}',
'.dn-pen-sw[data-c=yellow]{background:rgba(255,214,0,.95);}',
'.dn-pen-sw[data-c=pink]{background:rgba(255,138,190,.95);}',
'.dn-pen-sw[data-c=green]{background:rgba(112,214,140,.95);}',
'.dn-pen-sw[data-c=black]{background:rgba(22,24,28,.95);}',
'.dn-pen-sw[data-c=none]{background:repeating-linear-gradient(45deg,rgba(0,0,0,.08) 0 4px,transparent 4px 8px);}',
'.dn-pen-sw[data-c=italic]{background:transparent;font-style:italic;font-family:Georgia,serif;font-size:14px;line-height:1;color:inherit;}',
'.dn-pen-sw[data-c=underline]{background:transparent;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:2px;font-size:13px;line-height:1;color:inherit;}',
'.dn-pen-sw[data-on=true]{outline:2px solid rgba(79,124,255,.7);outline-offset:1px;}',
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
'.dn-th{font-weight:650;white-space:nowrap;}',
'.dn-td{white-space:normal;word-break:break-word;max-width:340px;}',
'.dn-editor{width:100%;height:100%;min-height:320px;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:10px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.6;resize:none;background:transparent;color:inherit;outline:none;}',
'.dn-foot{flex:0 0 auto;padding:5px 12px;border-top:1px solid rgba(0,0,0,.1);font-size:11px;color:var(--dsw-alias-label-tertiary,#8a8f98);display:flex;gap:8px;align-items:center;overflow:hidden;white-space:nowrap;}',
'.dn-handle{position:absolute;width:16px;height:16px;margin-left:-8px;margin-top:-8px;border-radius:50%;background:#3b6fe0;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);pointer-events:auto;cursor:grab;z-index:5;touch-action:none;}',
'.dn-handle:after{content:"";position:absolute;left:-11px;top:-11px;right:-11px;bottom:-11px;}',
// The bar matches every other popover in the card (light surface, hairline border, one accent
// for the primary action). It used to be a dark slab, which read as a different application
// sitting on top of the note — and it is the SAME kind of control as the mark function card.
//
// `width:max-content` + `white-space:nowrap` are load-bearing: the bar is absolutely positioned
// inside the overlay's zero-width inner box, so an auto width resolved to zero and every CJK
// label wrapped character by character (复/制, 标/记, 取/消 in the reported screenshot).
'.dn-bar{position:absolute;display:inline-flex;align-items:center;gap:4px;width:max-content;white-space:nowrap;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid rgba(0,0,0,.14);border-radius:11px;padding:4px 6px;box-shadow:0 10px 26px rgba(0,0,0,.22);pointer-events:auto;z-index:6;touch-action:none;overscroll-behavior:contain;}',
'.dn-bar-group{display:inline-flex;align-items:center;gap:2px;}',
'.dn-bar-sep{width:1px;height:16px;background:rgba(0,0,0,.12);margin:0 2px;flex:0 0 auto;}',
'.dn-bar button{border:0;background:0 0;color:inherit;font-size:12.5px;font-weight:500;line-height:1.2;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:inherit;white-space:nowrap;word-break:keep-all;touch-action:none;-webkit-tap-highlight-color:transparent;}',
'.dn-bar button:hover{background:rgba(79,124,255,.12);}',
'.dn-bar button[data-act=pick]{background:#4f7cff;color:#fff;font-weight:600;}',
'.dn-bar button[data-act=pick]:hover{background:#3f6bea;}',
'.dn-bar button[data-act=cancel]{color:#6b7280;font-weight:500;}',
// ── the mark list (标记列表) ─────────────────────────────────────────────────────
// Two views: this note, and every note of the session. Rows show the passage rendered as
// block Markdown, and clicking one jumps the reader there (switching notes when needed).
'.dn-marks{display:flex;flex-direction:column;min-height:0;flex:0 0 auto;border-top:1px solid rgba(0,0,0,.1);}',
// The mark list as a WINDOW of its own. Long-pressing its header (or the 拖出 button) lifts it
// out of the note card, so a long list stops eating the note's height. It keeps the same body,
// rows and scroll position — only the frame changes.
'.dn-marks-win{position:fixed;z-index:70;display:flex;flex-direction:column;min-height:0;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1b1b1b);border:1px solid var(--dsw-alias-line-normal,var(--dsw-alias-border-l1,rgba(0,0,0,.12)));border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.24);overflow:hidden;}',
'.dn-marks-win .dn-marks-head{cursor:grab;touch-action:none;}',
'.dn-marks-grip{position:absolute;right:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;touch-action:none;opacity:.5;}',
'.dn-marks-grip:before{content:"";position:absolute;right:3px;bottom:3px;width:9px;height:9px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;border-radius:0 0 3px 0;}',
'.dn-marks-head{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid rgba(0,0,0,.06);flex:0 0 auto;flex-wrap:wrap;}',
'.dn-marks-title{font-size:12.5px;font-weight:600;}',
'.dn-tabs{display:flex;gap:4px;margin-left:auto;}',
'.dn-tab{border:1px solid rgba(0,0,0,.14);background:transparent;color:inherit;font-size:11.5px;padding:4px 9px;border-radius:999px;cursor:pointer;white-space:nowrap;word-break:keep-all;flex:0 0 auto;}',
'.dn-tab-on{background:rgba(79,124,255,.12);border-color:rgba(79,124,255,.5);color:#2f5fd0;font-weight:600;}',
'.dn-marks-refresh{border:0;background:transparent;color:#6b7280;font-size:11.5px;cursor:pointer;padding:4px 6px;}',
'.dn-marks-body{overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:8px 10px;min-height:0;flex:1 1 auto;}',
'.dn-mark{border:1px solid rgba(0,0,0,.1);border-left-width:3px;border-radius:8px;padding:6px 8px;margin-bottom:7px;background:rgba(0,0,0,.015);}',
'.dn-mark[data-color=yellow]{border-left-color:rgba(255,214,0,.95);}',
'.dn-mark[data-color=pink]{border-left-color:rgba(255,138,190,.95);}',
'.dn-mark[data-color=green]{border-left-color:rgba(112,214,140,.95);}',
// A mark that lives in the text gets a rail of its own shape, so the two kinds are told apart
// before reading the badge.
'.dn-mark[data-italic="1"] .dn-mark-rail-i, .dn-mark[data-underline="1"] .dn-mark-rail-u{opacity:1;}',
// The left rail carries EVERY dimension of the mark: its colour as the bar, plus an I / U chip
// for each text style it has, so one glance down the list reads colour + italic + underline.
'.dn-mark{position:relative;padding-left:24px;}',
'.dn-mark-rail{position:absolute;left:2px;top:5px;bottom:5px;width:16px;display:flex;flex-direction:column;align-items:center;gap:2px;}',
'.dn-mark-rail-bar{width:4px;flex:1 1 auto;min-height:12px;border-radius:2px;background:rgba(255,214,0,.95);}',
'.dn-mark[data-color=pink] .dn-mark-rail-bar{background:rgba(255,138,190,.95);}',
'.dn-mark[data-color=green] .dn-mark-rail-bar{background:rgba(112,214,140,.95);}',
'.dn-mark[data-color=black] .dn-mark-rail-bar{background:#20242c;}',
'.dn-mark[data-color=none] .dn-mark-rail-bar{background:repeating-linear-gradient(45deg,rgba(0,0,0,.12) 0 3px,transparent 3px 6px);}',
'.dn-mark-rail-i,.dn-mark-rail-u{font-size:9px;line-height:10px;height:10px;opacity:.18;color:#4b5563;}',
'.dn-mark-rail-i{font-style:italic;font-family:Georgia,serif;font-weight:700;}',
'.dn-mark-rail-u{text-decoration:underline;text-decoration-thickness:1.2px;font-weight:700;}',
'.dn-mark-flash{animation:dn-flash 1.1s ease-out 1;}',
'@keyframes dn-flash{0%{background:rgba(79,124,255,.28);}100%{background:rgba(0,0,0,.015);}}',
'.dn-mark-top{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#8a8f98;flex-wrap:wrap;}',
'.dn-mark-where{color:#6b7280;white-space:nowrap;}',
'.dn-mark-badge{border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:0 6px;white-space:nowrap;}',
'.dn-badge-btn{cursor:pointer;font:inherit;background:transparent;}',
'.dn-badge-btn:hover{background:rgba(216,128,0,.14);}',
'.dn-badge-warn{border-color:rgba(216,128,0,.5);color:#d80;}',
// The actions are buttons with Chinese labels: they must never be squeezed into one character
// per line (that is what a narrow card did to 展开 / 样式 / 添加到 / 备注 / 删除). They keep their
// own width and the row wraps as a whole instead.
'.dn-mark-acts{margin-left:auto;display:flex;gap:2px;flex-wrap:wrap;justify-content:flex-end;}',
'.dn-mact{border:0;background:transparent;color:#4f7cff;font-size:11px;padding:3px 5px;cursor:pointer;border-radius:5px;white-space:nowrap;word-break:keep-all;flex:0 0 auto;}',
'.dn-mact:hover{background:rgba(79,124,255,.1);}',
'.dn-mact-del{color:#d33;}',
// The folder-import dialog: the path row and the checklist of .md files found in it.
'.dn-dirline{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
'.dn-dirline input{flex:1 1 140px;min-width:120px;}',
'.dn-filelist{max-height:190px;overflow-y:auto;border:1px solid rgba(0,0,0,.1);border-radius:8px;padding:4px 6px;margin:2px 0;}',
'.dn-filerow{display:flex;align-items:center;gap:7px;padding:3px 2px;font-size:12px;cursor:pointer;}',
'.dn-filerow input{flex:0 0 auto;margin:0;}',
'.dn-filerow span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
// The import report: a verbatim block, so a failure says why instead of "nothing was created".
'.dn-modal-report{margin:6px 0 0;padding:7px 9px;max-height:150px;overflow:auto;background:rgba(0,0,0,.035);border:1px solid rgba(0,0,0,.08);border-radius:8px;font-size:11.5px;line-height:1.6;white-space:pre-wrap;word-break:break-word;font-family:inherit;}',
// The list's own close button (the window form keeps 收回, but a list you dismissed by hand
// should not need the toolbar button to close it).
'.dn-marks-close{border:0;background:transparent;color:#8a8f98;font-size:13px;line-height:1;padding:4px 6px;border-radius:6px;cursor:pointer;}',
'.dn-marks-close:hover{background:rgba(0,0,0,.06);color:#333;}',
'.dn-mark-body{margin-top:5px;font-size:12.5px;line-height:1.65;max-height:68px;overflow:hidden;cursor:pointer;border-radius:6px;}',
'.dn-mark-open .dn-mark-body{max-height:none;}',
'.dn-mark-body:hover{background:rgba(79,124,255,.06);}',
'.dn-mark-body .dn-p,.dn-mark-body .dn-li,.dn-mark-body .dn-h,.dn-mark-body .dn-quote{margin:2px 0;}',
'.dn-mark-remark{margin-top:5px;padding:3px 7px;border-left:3px solid #4f7cff;background:rgba(79,124,255,.08);border-radius:0 6px 6px 0;font-size:12px;}',
'.dn-marks-empty{color:#8a8f98;font-size:12px;padding:6px 2px;}',
// The function card a single click raises on a mark. Positioned INSIDE the card (absolute, not
// fixed): a viewport-anchored popover near the bottom of the screen covered the footer's git
// line, which is exactly what it looked like — and clamping it to the card's own box, above the
// footer, is the only way that cannot happen again.
'.dn-mcard{position:absolute;z-index:90;display:flex;flex-direction:column;gap:6px;padding:7px 8px;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1b1b1b);border:1px solid rgba(0,0,0,.14);border-radius:10px;box-shadow:0 10px 26px rgba(0,0,0,.22);font-size:12px;}',
'.dn-mcard-sw{width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:7px;border:1px solid rgba(0,0,0,.18);cursor:pointer;padding:0;flex:0 0 auto;font-size:12px;line-height:1;background:transparent;color:inherit;}',
'.dn-mcard-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}',
'.dn-mcard-sw[data-on="1"]{outline:2px solid rgba(79,124,255,.65);outline-offset:1px;}',
'.dn-mcard-sw[data-c=yellow]{background:rgba(255,214,0,.55);}',
'.dn-mcard-sw[data-c=pink]{background:rgba(255,138,190,.55);}',
'.dn-mcard-sw[data-c=green]{background:rgba(112,214,140,.55);}',
'.dn-mcard-sw[data-c=black]{background:#20242c;color:#fff;}',
'.dn-mcard-sw[data-c=none]{background:repeating-linear-gradient(45deg,rgba(0,0,0,.06) 0 4px,transparent 4px 8px);}',
'.dn-mcard-btn{border:1px solid rgba(0,0,0,.12);background:transparent;color:inherit;font-size:11.5px;padding:3px 8px;border-radius:7px;cursor:pointer;white-space:nowrap;word-break:keep-all;flex:0 0 auto;}',
'.dn-mcard-btn:hover{background:rgba(79,124,255,.1);}',
'.dn-mcard-btn[data-primary="1"]{border-color:rgba(79,124,255,.5);color:#2f5fd0;font-weight:600;}',
'.dn-mcard-sep{width:1px;height:16px;background:rgba(0,0,0,.12);margin:0 2px;}',
'.dn-addlist{width:250px;max-width:100%;max-height:320px;overflow-y:auto;}',
'.dn-addlist .dn-mcard-row{flex-wrap:wrap;}',
// One menu for the card's own chrome (the note picker, the mark view, the overflow actions) and
// for 添加到. Also absolute inside the card, so a long menu can never hang off the card edge.
'.dn-menu{position:absolute;z-index:92;display:flex;flex-direction:column;gap:2px;padding:6px;min-width:150px;max-width:280px;max-height:320px;overflow-y:auto;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#1b1b1b);border:1px solid rgba(0,0,0,.14);border-radius:10px;box-shadow:0 10px 26px rgba(0,0,0,.22);}',
// A flex column SHRINKS its children before it scrolls, and these rows carry overflow:hidden, so
// a session with enough notes squashed every row to ~10px and clipped its label — "笔记过多时
// 菜单文字挤成一团" (measured: 30 rows → row height 10px, label clipped; with this rule 25.5px and
// the menu scrolls, 836px of content in a 332px box). Nothing here wants to shrink.
'.dn-menu>*{flex:0 0 auto;}',
'.dn-menu-item{display:flex;align-items:center;gap:6px;border:0;background:transparent;color:inherit;text-align:left;font-size:12px;padding:5px 8px;border-radius:7px;cursor:pointer;white-space:nowrap;overflow:hidden;}',
'.dn-menu-item-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;}',
// The note menu's folder tree: entries never overflow the menu (they truncate), and a directory
// heading is a label rather than a button, so it cannot be mistaken for something to open.
'.dn-tree-dir{padding:3px 8px 1px;color:#6f7680;}',
'.dn-tree-dir-row{color:#4c5560;}',
'.dn-tree-folder{font-weight:600;}',
'.dn-menu-item.dn-tree-note{padding-right:6px;}',
// The note rows' status light. pending breathes (CSS only — no timer, no JS, nothing on the main
// thread); ok/error are steady. It reports BACKGROUND git work, which is the only git left.
'.dn-git-dot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:rgba(0,0,0,.16);}',
'.dn-git-pending{background:#e0a92b;animation:dn-breathe 1.3s ease-in-out infinite;}',
// Steady amber = there ARE uncommitted changes; breathing amber = git is working right now.
'.dn-git-dirty{background:#e0a92b;}',
'.dn-git-ok{background:#3aa860;}',
'.dn-git-error{background:#d9534f;}',
'@keyframes dn-breathe{0%,100%{opacity:.3;}50%{opacity:1;}}',
'@media (prefers-reduced-motion: reduce){.dn-git-pending{animation:none;opacity:.85;}}',
'.dn-menu-item:hover{background:rgba(79,124,255,.1);}',
'.dn-menu-item[data-on="1"]{background:rgba(79,124,255,.14);font-weight:600;color:#2f5fd0;}',
'.dn-menu-sep{height:1px;background:rgba(0,0,0,.1);margin:3px 4px;}',
'.dn-menu-label{font-size:10.5px;color:#8a8f98;padding:3px 8px 1px;}',
'.dn-addlist-input{flex:1 1 auto;min-width:80px;border:1px solid rgba(0,0,0,.16);border-radius:7px;padding:3px 6px;font-size:11.5px;background:transparent;color:inherit;outline:none;}',
'.dn-tab-add{padding:4px 8px;font-weight:600;}',
'.dn-marks-spacer{flex:1 1 auto;}',
'.dn-marks-view{display:inline-flex;align-items:center;gap:4px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'.dn-caret{font-size:10px;opacity:.7;}',
// The note row is one button now: the select plus five buttons used to wrap at 430px.
'.dn-notes-pick{display:inline-flex;align-items:center;gap:6px;max-width:100%;border:1px solid rgba(0,0,0,.14);background:transparent;color:inherit;font-size:12px;padding:4px 9px;border-radius:999px;cursor:pointer;}',
'.dn-notes-pick:hover{background:rgba(79,124,255,.08);}',
'.dn-notes-name{font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'.dn-notes-count{color:#8a8f98;font-size:10.5px;}',
'.dn-notes-hash{color:#8a8f98;font-size:10.5px;}',
'.dn-notes-dirty{color:#b7791f;background:rgba(224,169,43,.16);border-radius:999px;padding:1px 7px;font-size:10.5px;}',
'.dn-btn-icon{padding:4px 9px;font-weight:700;letter-spacing:1px;}',
'.dn-menu-item-sub{color:#d33;font-size:11px;}',
'.dn-mark-missing{opacity:.75;}',
'.dn-sel-item{border:1px solid rgba(0,0,0,.1);border-radius:7px;padding:5px 7px;margin-bottom:6px;background:rgba(255,214,0,.1);}',
'.dn-sel-meta{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#8a8f98);display:flex;gap:6px;align-items:center;}',
'.dn-sel-text{white-space:pre-wrap;word-break:break-word;max-height:52px;overflow:hidden;}',
// The remark input. 16px keeps iOS from zooming the page when it takes focus, which on a
// phone otherwise leaves the card scaled and the caret off-screen.
'.dn-remark{position:absolute;left:8px;right:8px;bottom:8px;z-index:9;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid rgba(0,0,0,.18);border-radius:10px;padding:9px;box-shadow:0 8px 24px rgba(0,0,0,.22);}',
'.dn-remark-title{font-size:12px;color:var(--dsw-alias-label-secondary,#6b7280);margin-bottom:6px;}',
'.dn-remark textarea{width:100%;box-sizing:border-box;min-height:62px;max-height:180px;font-family:inherit;font-size:16px;line-height:1.5;border:1px solid rgba(0,0,0,.16);border-radius:8px;padding:7px 9px;resize:vertical;background:transparent;color:inherit;outline:none;}',
'.dn-remark textarea:focus{border-color:var(--dsw-alias-label-primary,#1b1b1b);}',
'.dn-remark-row{display:flex;gap:6px;justify-content:flex-end;align-items:center;margin-top:7px;}',
'.dn-remark-row button{border:1px solid rgba(0,0,0,.16);background:transparent;color:inherit;font-size:12.5px;padding:5px 12px;border-radius:7px;cursor:pointer;}',
'.dn-remark-row button[data-act=save]{background:#4f7cff;border-color:#4f7cff;color:#fff;font-weight:600;}',
'.dn-remark-hint{margin-right:auto;font-size:11px;color:var(--dsw-alias-label-tertiary,#8a8f98);}',
'.dn-sel-remark{white-space:pre-wrap;word-break:break-word;margin-top:4px;padding:3px 6px;border-left:3px solid #4f7cff;background:rgba(79,124,255,.08);border-radius:0 5px 5px 0;}',
'.dn-x{margin-left:auto;border:0;background:transparent;color:#d33;cursor:pointer;font-size:12px;padding:4px 6px;}',
'.dn-pill{position:fixed;right:16px;bottom:20px;pointer-events:auto;z-index:60;height:34px;border:1px solid rgba(0,0,0,.16);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#fff) 92%,transparent);backdrop-filter:blur(16px);box-shadow:0 8px 28px rgba(0,0,0,.16);color:var(--dsw-alias-label-secondary,#555);font:inherit;font-size:12px;font-weight:600;line-height:20px;cursor:pointer;border-radius:999px;display:inline-flex;align-items:center;gap:7px;padding:0 12px;touch-action:none;}',
'.dn-pill:hover{transform:translateY(-1px);}',
// A dragged pill: no transition while the finger is on it, and a grab cursor for the mouse.
'.dn-pill[data-drag="1"]{cursor:grabbing;}',
'.dn-pill[data-dragged="1"]{transition:none;}',
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
'.dn-btn{font-size:12px;padding:10px 10px;}',
'.dn-mini{font-size:12px;padding:9px 9px;}',
'.dn-body{padding:10px 12px 48px;line-height:1.75;}',
'.dn-h1{font-size:18px;}',
'.dn-h2{font-size:16px;}',
'.dn-handle{width:22px;height:22px;margin-left:-11px;margin-top:-11px;}',
'.dn-bar button{font-size:14px;padding:10px 16px;}',
'.dn-foot{font-size:10.5px;gap:6px;padding:4px 10px;}',
// Touch targets on a phone: 44px is Apple's minimum for a comfortable target, and the pill
// (34px), the bar buttons (~32px), the remark dialog's buttons (~28px) and the panel's little
// buttons (~20px) were all under it. Measured in a 390x844 emulated viewport, before and after.
'.dn-pill{right:12px;bottom:14px;height:44px;padding:0 14px;}',
'.dn-remark{left:6px;right:6px;bottom:6px;}',
'.dn-remark textarea{min-height:84px;}',
'.dn-remark-row button{padding:12px 16px;font-size:14px;}',
// The phone layout has no definite card height for a percentage to resolve against, so the
// mark list's cap uses vh here — otherwise it grew past the card and its body never became
// scrollable ("这个列表不能往下滑").
'.dn-marks{max-height:48vh;}',
'.dn-wrap{min-height:56px;}',
'.dn-sel-item .dn-x{padding:9px 10px;font-size:13px;}}',
].join("\n")
const LAYOUT_KEY = 'dsh-note-card:layout:v1'
// Last used highlight colour, remembered locally. Defaults to yellow.
const PEN_KEY = 'dsh-window:pen'
const PEN_COLORS = ['yellow', 'pink', 'green', 'black', 'none']
function readPenColor() { try { const v = window.localStorage.getItem(PEN_KEY); return PEN_COLORS.indexOf(v) >= 0 ? v : 'yellow' } catch (err) { return 'yellow' } }
function writePenColor(c) { try { window.localStorage.setItem(PEN_KEY, c) } catch (err) { } }
const COMPACT_W = 640, DOCK_TOP = 34, DOCK_RIGHT = 18, DOCK_BOTTOM = 18
// Mark-list preferences, PLUGIN-wide (not per note, not per session): whether a single click on
// a marked passage may summon the list, whether the list is lifted out into its own window and
// where that window sits, and where the reader had scrolled to. Losing these across a reload is
// exactly what made the list feel like it "started over every time".
const MARKS_PREF_KEY = 'dsh-window:marks:v1'
const MARKS_WIN_MIN_W = 220, MARKS_WIN_MIN_H = 140
// Where the reader parked the collapsed 笔记 pill on a phone. Desktop keeps the pill at its
// designed corner (the position is only applied in the compact layout), but the drag itself is
// available to both — a mouse is a perfectly good way to move it while testing on a desktop.
const PILL_KEY = 'dsh-window:pill:v1'
function readPillPos() {
  try {
    const raw = window.localStorage.getItem(PILL_KEY)
    const o = raw ? JSON.parse(raw) : null
    if (o && typeof o.x === 'number' && typeof o.y === 'number' && isFinite(o.x) && isFinite(o.y)) return { x: o.x, y: o.y }
    return null
  } catch (err) { return null }
}
function writePillPos(pos) {
  try {
    if (pos === null) window.localStorage.removeItem(PILL_KEY)
    else window.localStorage.setItem(PILL_KEY, JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) }))
    return true
  } catch (err) { return false }
}
function readMarksPref() {
  try {
    const raw = window.localStorage.getItem(MARKS_PREF_KEY)
    const o = raw ? JSON.parse(raw) : null
    return o && typeof o === 'object' ? o : {}
  } catch (err) { return {} }
}
/** Merge one patch into the stored preferences and return the merged object. */
function writeMarksPref(patch) {
  try {
    const next = Object.assign({}, readMarksPref(), patch)
    window.localStorage.setItem(MARKS_PREF_KEY, JSON.stringify(next))
    return next
  } catch (err) { return null }
}
/** Scroll positions of the mark list, one per note/tab/kind of view. */
function marksScrollKey(sid, note, tab) { return String(sid || '') + '|' + String(note || '') + '|' + String(tab || 'note') }
function readMarksScroll(key) {
  const all = readMarksPref().scroll
  const v = all && typeof all === 'object' ? all[key] : 0
  return typeof v === 'number' && isFinite(v) && v > 0 ? v : 0
}
function writeMarksScroll(key, value) {
  try {
    const all = readMarksPref().scroll
    const next = all && typeof all === 'object' ? Object.assign({}, all) : {}
    next[key] = Math.max(0, Math.round(value))
    // A single stale key must not grow without bound: keep the most recent 40 views.
    const keys = Object.keys(next)
    if (keys.length > 40) { for (let i = 0; i < keys.length - 40; i++) delete next[keys[i]] }
    writeMarksPref({ scroll: next })
  } catch (err) { }
}
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
    // Characters that start no token — spaces, brackets, commas, operators — must still be RENDERED.
    // `i++` alone threw them away, so the highlighted spans ran together: `public class` came out
    // `publicclass` and `purchase(String userId, Long productId, Integer count)` lost its brackets
    // and commas (reported with a Java block). Consume the whole gap as one plain run.
    let j = i + 1
    while (j < n && !/[A-Za-z0-9_$@#\-."'`]/.test(line[j]) && !(cm.line.length && line.startsWith(cm.line[0], j))) j++
    // A class with NO rule attached: a token without one falls back to the inline-code style
    // (.dn-code, a grey background), which turned every space in a block into a dark lozenge.
    push('tk-x', i, j)
    i = j
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
/** How a mark draws itself: the classic translucent wash, or the text itself. */
/**
 * How a mark draws itself. The colour is the wash behind the text (`none` = no wash) and the two
 * text styles change the glyphs. They are INDEPENDENT flags, so one passage can be, say, pink AND
 * italic AND underlined; the old single `style` field is still read for a mark written by an
 * older build, and the two flags win whenever they are present.
 */
function markLook(m) {
  const legacy = m && typeof m.style === 'string' ? m.style : ''
  const both = legacy === 'both' || legacy === 'italic+underline'
  return {
    italic: !!(m && m.italic === true) || legacy === 'italic' || both,
    underline: !!(m && m.underline === true) || legacy === 'underline' || both,
  }
}
/** True when the mark has no wash of its own (colour `none`). */
function markColor(m) { return m && typeof m.color === 'string' && m.color !== '' ? m.color : 'yellow' }
/**
 * The marks that draw themselves IN the text (italic / underline), expanded to column ranges
 * per line. Columns are the source-line columns, which is exactly what every `data-soff`
 * attribute carries, so the same run table works for a heading, a quote, a list item, a
 * table cell and a code line without any per-renderer special case.
 */
function textStyleRuns(sels) {
  const byLine = {}
  const key = []
  for (let i = 0; i < sels.length; i++) {
    const s = sels[i]
    const look = markLook(s)
    // A mark contributes one run per flag it carries, so italic and underline on the same words
    // are two runs that the splitter stacks (see textStyleSegments) instead of one winning.
    const styles = []
    if (look.italic) styles.push('italic')
    if (look.underline) styles.push('underline')
    if (!styles.length) continue
    key.push(s.id + ':' + styles.join('+') + ':' + s.startLine + ',' + s.startCol + '-' + s.endLine + ',' + s.endCol)
    for (let ln = s.startLine; ln <= s.endLine; ln++) {
      const from = ln === s.startLine ? s.startCol : 0
      // A line fully inside the mark has no end column of its own: use a bound far past any
      // line, and the splitter clamps it to the span it is segmenting.
      const to = ln === s.endLine ? s.endCol : 1073741824
      if (!byLine[ln]) byLine[ln] = []
      for (let k = 0; k < styles.length; k++) byLine[ln].push({ from: from, to: to, style: styles[k], id: s.id })
    }
  }
  return { key: key.join('|'), byLine: byLine }
}
/**
 * Split one rendered text span [from, from+len) at every run boundary, so a span carries
 * exactly the styles that cover it. Overlapping marks of different styles therefore stack on
 * the same characters instead of one of them winning, and each segment remembers the mark ids
 * under it (that is what the single-click function card looks up).
 */
function textStyleSegments(runs, from, len) {
  if (!runs || !runs.length || len <= 0) return null
  const to = from + len
  const cuts = [from]
  let hit = false
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i]
    if (r.to <= from || r.from >= to) continue
    hit = true
    if (r.from > from && r.from < to) cuts.push(r.from)
    const end = Math.min(r.to, to)
    if (end > from && end < to) cuts.push(end)
  }
  if (!hit) return null
  cuts.push(to)
  cuts.sort(function (a, b) { return a - b })
  const out = []
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i]
    const b = cuts[i + 1]
    if (b <= a) continue
    const styles = []
    const ids = []
    for (let k = 0; k < runs.length; k++) {
      const r = runs[k]
      if (r.from <= a && r.to >= b) { if (styles.indexOf(r.style) < 0) styles.push(r.style); if (ids.indexOf(r.id) < 0) ids.push(r.id) }
    }
    out.push({ off: a - from, len: b - a, styles: styles, ids: ids })
  }
  return out.length > 1 || (out.length === 1 && out[0].styles.length > 0) ? out : null
}
/** Absolute offset of a 1-based line / 0-based column inside a text block. */
function offsetOfPos(text, line, col) {
  const ls = String(text).split('\n')
  let n = 0
  for (let i = 0; i < Math.min(line - 1, ls.length); i++) n += ls[i].length + 1
  return n + Math.max(0, col)
}
const WORD = /[A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff\uff10-\uff5a]/
// How many characters a long press may take as its unit: a phrase window for CJK (no spaces at
// all) and a token-sized window for everything else (a URL or an identifier can be long too).
const CJK_UNIT_MAX = 12
const LATIN_UNIT_MAX = 32
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
      if (close > -1 && raw[close + 1] === '(') {
        const pe = raw.indexOf(')', close + 2)
        if (pe > -1) {
          const label = raw.slice(i + 1, close)
          // Parse the label as inline Markdown as well, with offsets shifted to this line:
          // `[**缺页中断**](url)` is bold inside the anchor, not literal asterisks.
          const kids = inlineTokens(label)
          for (let k = 0; k < kids.length; k++) kids[k].off += i + 1
          out.push({ k: 'link', t: label, href: hrefOnly(raw.slice(close + 2, pe)), off: i + 1, kids: kids })
          i = pe + 1; continue
        }
      }
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
let styleTag = null
function ensureStyle() {
  if (typeof document === 'undefined' || !document.head) return null
  if (styleTag === null || !styleTag.isConnected) {
    styleTag = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]')
  }
  if (styleTag === null) {
    styleTag = document.createElement('style')
    styleTag.setAttribute('data-plugin-css', STYLE_ID)
    styleTag.textContent = String(CSS)
    document.head.appendChild(styleTag)
  }
  return styleTag
}
// REUSE an existing tag instead of skipping when one is present: skipping while a
// previous fiber still owned a disposer for it meant apply #2 found the tag, did
// nothing, and then apply #1 dispose removed it. The card then rendered with no CSS
// at all (no flex, no overflow) — the note body measured 38000px and the mark list
// showed a header with nothing under it.
const ownStyle = ensureStyle()
ctx.effect(function () { return function () { try { if (ownStyle) ownStyle.remove() } catch (err) { } } })
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
      // What the next mark will be: a colour (or no wash at all) plus the two text styles, each
      // an independent toggle — a mark can be pink AND italic AND underlined at once.
      const [penItalic, setPenItalic] = React.useState(false)
      const [penUnderline, setPenUnderline] = React.useState(false)
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
      // Which imported folders are expanded in the note menu: PER SESSION, keyed by asset root.
      // The same root can appear in two sessions, and an expansion made in one has no business
      // deciding what the other one shows. The state is the whole map (session -> open keys), so
      // nothing has to be parked or swapped when the session changes.
      const [openGroups, setOpenGroups] = React.useState({})
      // Back / forward over the notes this card has visited (capped at 50). `navGuardRef` holds the
      // note a back/forward jump is heading to, so that jump is not recorded as a NEW visit.
      const navRef = React.useRef({ list: [], at: -1 })
      const navTargetRef = React.useRef(null)
      /* NAV-PURE-START */
      /**
       * The visit history: a list of `{ name, line }` entries plus a cursor.
       *
       * `line` is the spot the reader was on when they LEFT that entry. It is written only when a
       * jump happens and read only by 后退/前进, so an ordinary open still resumes from the live
       * reading position. Pure — a new object every time, the input is never mutated — so the
       * whole history can be tested without a browser (see verify-notes).
       */
      function navPushVisit(nav, name, line) {
        const cur = nav.list[nav.at]
        if (cur && cur.name === name) return nav
        const list = nav.list.slice(0, nav.at + 1)
        list.push({ name: name, line: Math.round(Number(line)) || 0 })
        if (list.length > 50) list.shift()
        return { list: list, at: list.length - 1 }
      }
      /**
       * A jump the host reported — a link into another note, or an anchor inside this one.
       *
       * The entry being left keeps the line the reader was actually on: that is what 后退 comes
       * back to. A jump INSIDE the same note changes no note name, so this is also the only place
       * that can record it at all — without an entry of its own 后退 would leave for the previous
       * note instead of returning to the paragraph just left ("跳转是成功的，只是栈里没有"). The
       * destination is stored with the line the jump is heading to, so 前进 can return to it too.
       */
      function navRecordJump(nav, incoming, destLine, leftLine) {
        if (nav.at < 0 || !nav.list[nav.at]) return nav
        const list = nav.list.slice(0, nav.at + 1)
        list[nav.at] = { name: nav.list[nav.at].name, line: Math.round(Number(leftLine)) || 0 }
        if (list[nav.at].name !== incoming) return { list: list, at: list.length - 1 }
        list.push({ name: incoming, line: Math.round(Number(destLine)) || 0 })
        if (list.length > 50) list.shift()
        return { list: list, at: list.length - 1 }
      }
      /**
       * The history is PER SESSION. `store` holds one list per session id, `current` is the list of
       * `fromSid`. Switching to `toSid` parks what we have and hands back that session's own list —
       * empty the first time that session is visited. An entry of another session names a note
       * which this session's store does not contain, so it could only ever fail to open: that is
       * exactly the reported "切到新会话，后退栈里还有上个会话的笔记，点了也切不过去".
       */
      function navSwapSession(store, fromSid, toSid, current, now, ttl) {
        const from = String(fromSid || '')
        const to = String(toSid || '')
        if (from === to) return { store: store, nav: current, expired: false }
        const next = Object.assign({}, store)
        if (from !== '') next[from] = { list: current.list, at: current.at, ts: now }
        const got = navFromStore(next, to, now, ttl)
        return { store: next, nav: got.nav, expired: got.expired }
      }
      /**
       * How long a PERSISTED stack stays usable. A stack nobody has touched for a day is exactly the
       * one most likely to name notes that were renamed or deleted while that session was away — the
       * "切换会话后打开时其中的笔记已经点击不跳转" case — so an expired record is CLEARED on the way
       * in instead of being loaded: an empty 后退 beats a list of dead links.
       */
      const NAV_TTL_MS = 24 * 3600 * 1000
      /** What localStorage held, validated field by field: junk must never break the card. */
      function navReadStore(rawStore) {
        let parsed = null
        try { parsed = JSON.parse(String(rawStore === undefined || rawStore === null ? '' : rawStore)) } catch (err) { return {} }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        const out = {}
        const ids = Object.keys(parsed)
        for (let i = 0; i < ids.length; i++) {
          const rec = parsed[ids[i]]
          if (!rec || typeof rec !== 'object' || !Array.isArray(rec.list)) continue
          const list = []
          for (let k = 0; k < rec.list.length; k++) {
            const e = rec.list[k]
            if (!e || typeof e !== 'object' || typeof e.name !== 'string' || e.name === '') continue
            list.push({ name: e.name, line: Math.round(Number(e.line)) || 0 })
          }
          if (list.length === 0) continue
          out[ids[i]] = { list: list, at: Math.min(Math.max(0, Math.round(Number(rec.at)) || 0), list.length - 1), ts: Math.round(Number(rec.ts)) || 0 }
        }
        return out
      }
      /** One session's stack, plus whether a record was there but is too old to use. */
      function navFromStore(store, sid, now, ttl) {
        const id = String(sid || '')
        const rec = id === '' ? null : (store || {})[id]
        if (!rec || !Array.isArray(rec.list) || rec.list.length === 0) return { nav: { list: [], at: -1 }, expired: false }
        const ts = Math.round(Number(rec.ts)) || 0
        if (Number(now) - ts > ttl) return { nav: { list: [], at: -1 }, expired: true }
        const at = Math.min(Math.max(0, Math.round(Number(rec.at)) || 0), rec.list.length - 1)
        return { nav: { list: rec.list.slice(), at: at }, expired: false }
      }
      /** What is written back: only the records still inside the ttl, each with its own stamp. */
      function navPackStore(store, now, ttl) {
        const out = {}
        const ids = Object.keys(store || {})
        for (let i = 0; i < ids.length; i++) {
          const rec = store[ids[i]]
          if (!rec || !Array.isArray(rec.list) || rec.list.length === 0) continue
          const ts = Math.round(Number(rec.ts)) || 0
          if (Number(now) - ts > ttl) continue
          out[ids[i]] = { list: rec.list, at: rec.at, ts: ts }
        }
        return out
      }
      /** An entry naming a note that no longer exists cannot be opened at all, so it is dropped. */
      function navPrune(nav, names) {
        const keep = {}
        const all = names || []
        for (let i = 0; i < all.length; i++) keep[String(all[i])] = true
        const list = []
        for (let i = 0; i < nav.list.length; i++) if (keep[nav.list[i].name] === true) list.push(nav.list[i])
        if (list.length === nav.list.length) return nav
        const cur = nav.at >= 0 ? nav.list[nav.at] : null
        const at = cur ? list.indexOf(cur) : -1
        return { list: list, at: at < 0 ? list.length - 1 : at }
      }
      /* NAV-PURE-END */
      /* MENU-STATE-PURE-START */
      /** The folders THIS session has expanded in the note menu. */
      function openGroupsOf(all, sid) {
        return (all && all[String(sid || '')]) || {}
      }
      /** Toggle one row for one session, never touching another session's slice. */
      function openGroupToggle(all, sid, key) {
        const id = String(sid || '')
        const cur = (all && all[id]) || {}
        const nx = Object.assign({}, cur)
        nx[key] = nx[key] !== true
        const out = Object.assign({}, all)
        out[id] = nx
        return out
      }
      /* MENU-STATE-PURE-END */
      // The note a recorded back/forward line was taken for. It makes that line outrank the
      // host view and the browser mirror for exactly one entry, and is cleared as it is used.
      const navPendRef = React.useRef(null)
      // History, per session: only the list of the session on screen is ever reachable, so a 后退
      // can never point at a note that belongs to another session's store.
      const navBySidRef = React.useRef({})
      const navSidRef = React.useRef('')
      React.useEffect(function () {
        const name = String(noteName || '')
        if (name === '') return
        if (navTargetRef.current === name) { navTargetRef.current = null; return }
        // The rule is the one it always had: entering the note the cursor already points at adds
        // nothing (that is the navTargetRef case — a back/forward already moved the cursor).
        navRef.current = navPushVisit(navRef.current, name, 0)
        saveNavNow()
      }, [noteName])
      const [noteDrag, setNoteDrag] = React.useState(false)
      const [bounds, setBounds] = React.useState(function () { try { return { w: window.innerWidth, h: window.innerHeight } } catch (err) { return { w: 1280, h: 800 } } })
      const [dragging, setDragging] = React.useState(false)
      const useSessionsHook = (props && typeof props.useSessions === 'function') ? props.useSessions : function () { return undefined }
      const shownSessionId = useSessionsHook(function (s) { return s ? s.current : undefined })
      // The session every per-session piece of UI state below is keyed by (no session id at all
      // is a bucket of its own, so a host without the sessions hook behaves exactly as before).
      const openGroupsSid = String(shownSessionId || '')
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
      // The persisted visit stacks (one record per session, each with its own timestamp) live in
      // localStorage next to the reading positions: same browser, same rules, no host round trip.
      const NAV_KEY = 'dsh-note-card:nav:v1'
      /** The stored map as this browser last left it; unreadable storage reads as "nothing yet". */
      function readNavStore() {
        try { return navReadStore(window.localStorage.getItem(NAV_KEY)) } catch (err) { return {} }
      }
      /** Write it back, dropping whatever the ttl has retired (which also keeps the map bounded). */
      function writeNavStore(map) {
        try { window.localStorage.setItem(NAV_KEY, JSON.stringify(navPackStore(map, Date.now(), NAV_TTL_MS))) } catch (err) { }
      }
      /**
       * Persist the stacks. Called from every place that changes one — the session switch, a jump the
       * host reported, a 后退/前进, and a note change — and nowhere else: this is a storage write, and
       * the card re-renders every 700ms.
       */
      function saveNavNow() {
        const live = String(navSidRef.current || '')
        const store = Object.assign({}, navBySidRef.current)
        if (live !== '') store[live] = { list: navRef.current.list, at: navRef.current.at, ts: Date.now() }
        navBySidRef.current = store
        writeNavStore(store)
      }
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
      // The remark input: { id } when editing an existing selection's remark, { live: true }
      // when it belongs to the selection being made (the long press on [选中]).
      const [remarkFor, setRemarkFor] = React.useState(null)
      // Which mark rows are expanded in the panel (keyed by note/id).
      const [selOpen, setSelOpen] = React.useState({})
      // The mark list has two views: this note (default) and every note of this session.
      const [markTab, setMarkTab] = React.useState('note')
      const [marksData, setMarksData] = React.useState([])
      // ── the mark list as a window of its own, and the single-click function card ──
      // Plugin-wide preferences (localStorage): the click-to-summon switch, the lifted-out
      // window's position/size, and the list's scroll position per view.
      const marksPrefRef = React.useRef(null)
      if (marksPrefRef.current === null) marksPrefRef.current = readMarksPref()
      const [summonOnMark, setSummonOnMark] = React.useState(marksPrefRef.current.summon === true)
      const [marksWin, setMarksWin] = React.useState(marksPrefRef.current.float && typeof marksPrefRef.current.float === 'object' ? marksPrefRef.current.float : null)
      const [mcard, setMcard] = React.useState(null)
      const marksBodyRef = React.useRef(null)
      const markRowEls = React.useRef({})
      const mcardRef = React.useRef(null)
      const mcardTimerRef = React.useRef(null)
      const tapRef = React.useRef(null)
      const markFocusRef = React.useRef('')
      const marksScrollKeyRef = React.useRef('')
      const marksScrollTimerRef = React.useRef(null)
      const marksWinDragRef = React.useRef(null)
      const marksWinRef = React.useRef(null)
      const marksLiftRef = React.useRef(null)
      // Custom mark lists (host state, mirrored here so a click shows up instantly) and the
      // little "添加到" popover that puts one mark into one of them.
      const [listData, setListData] = React.useState([])
      const [addFor, setAddFor] = React.useState(null)
      const [newListName, setNewListName] = React.useState('')
      const [addBox, setAddBox] = React.useState(null)
      const addBoxRef = React.useRef(null)
      // Which chrome menu is open (note picker / mark view / overflow actions / add-to-list), the
      // button it is anchored to, and the measured size of the mark card so it can be clamped.
      const [menuOpen, setMenuOpen] = React.useState(null)
      const menuRef = React.useRef(null)
      const [mcardSize, setMcardSize] = React.useState(null)
      const footRef = React.useRef(null)
      // The action bar's own width is only known after it renders, so it is clamped by
      // measurement: the bar is absolutely positioned inside a clipped, zero-width overlay box,
      // and without this its left edge was cut off by the card's border (the colour swatch was
      // sliced in half, since the bar's left was only bounded below).
      const barRef = React.useRef(null)
      const [barShift, setBarShift] = React.useState(0)
      // The collapsed pill's parked position (phones only — see readPillPos) and the live drag.
      const [pillPos, setPillPos] = React.useState(readPillPos)
      const pillDragRef = React.useRef(null)
      const pillMovedRef = React.useRef(false)
      // The 添加到 popover measures itself too: it is clamped with its real size, otherwise a
      // 250px panel anchored near the right edge was cut off by the card's border.
      const [addSize, setAddSize] = React.useState(null)
      const uiAckRef = React.useRef(0)
      // The last fine-grained event this card has processed (see applyEvents).
      const eventIdRef = React.useRef(0)
      // The italic/underline run table (see styleRunsFor): declared here because the component
      // bails out early for the collapsed pill, and no hook may run past that point.
      const styleRunsRef = React.useRef({ key: '', byLine: {} })
      /**
       * What the rendered text depends on: which marks carry which text styles. Without this in
       * the block cache key a style change (text untouched) reused the old elements and NOTHING
       * changed on screen until the note was edited — reported as "斜体和下划线不能即时生效".
       */
      function styleKeyOf(state) {
        const sels = state && state.selections ? state.selections : []
        let out = ''
        for (let i = 0; i < sels.length; i++) {
          const look = markLook(sels[i])
          out += sels[i].id + (look.italic ? 'i' : '') + (look.underline ? 'u' : '') + ','
        }
        return out
      }
      // Set when the host answers 404 for allMarks (a build predating it).
      const allMarksMissingRef = React.useRef(false)
      const [remarkDraft, setRemarkDraft] = React.useState('')
      const remarkTimerRef = React.useRef(null)
      const remarkInputRef = React.useRef(null)
      // How long [选中] must be held before the remark input opens instead of committing.
      const REMARK_HOLD_MS = 450
      const noteNameRef = React.useRef('')
      // The body element the scroll/resize listeners are currently attached to, its teardown,
      // the two overlay layers whose transform keeps them glued to the text, and a counter that
      // increments on every body scroll (gestures use it to notice that the CONTENT moved).
      const scrollHostRef = React.useRef(null)
      const detachHostRef = React.useRef(null)
      const layInBackRef = React.useRef(null)
      const layInFrontRef = React.useRef(null)
      const scrollStampRef = React.useRef(0)
      // Non-content state revision from the host. The note revision alone does not change for
      // `/window-note start|stop`, so without sending this the poll kept answering "unchanged"
      // and the card only appeared after a full page reload.
      const uiRevRef = React.useRef(0)
      // While a jump is being applied, the scroll-driven save must NOT write the position it is
      // scrolling AWAY from — that race is "jumped, then went back to where I was reading".
      const jumpWindowUntilRef = React.useRef(0)
      // What the card last saw of the notes' background git status (the rows' status light). ECHOED
      // to the host, exactly like uiRevision, so a background completion reaches the card without a
      // full state answer on every poll.
      const gitRevRef = React.useRef(-1)
      // Whether the host reports a uiRevision at all (see the poll below), plus live mirrors of
      // the two state values the poll needs (its effect has no deps, so it cannot read them).
      const hostUiRevRef = React.useRef(false)
      const notesRef = React.useRef([])
      const stRef = React.useRef(null)
      // The note whose text this card is currently holding. Sent with every poll so the host
      // can tell "same revision, but a different note" from "nothing changed" — a revision is
      // only a per-note in-memory counter and two notes can share the same value.
      const shownNoteRef = React.useRef('')
      // The last view-jump nonce seen from the host (an agent running note_goto).
      const seenJumpRef = React.useRef(0)
      // Pending "the session id was not ready yet" retry of the state poll.
      const retryRef = React.useRef(0)
      const lastSidRef = React.useRef('')
      // Unsaved edits that were typed in a session the card has just left: handed back to that
      // session by the effect below, never written into the one on screen now.
      const rescueRef = React.useRef(null)
      // Guards the 'host says no note is open but notes exist' self-heal against loops.
      const selfHealRef = React.useRef(false)
      // Shift both overlay layers to the current scroll offset, without waiting for a render.
      // The layers sit next to the (scrolling) body, so this transform is the only thing that
      // makes an overlay follow the text; every overlay inside keeps using content coordinates.
      function applyLayerShift() {
        const host = bodyRef.current
        scrollStampRef.current += 1
        if (!host) return
        const t = 'translate(' + (-host.scrollLeft) + 'px,' + (-host.scrollTop) + 'px)'
        try { if (layInBackRef.current) layInBackRef.current.style.transform = t } catch (err) { }
        try { if (layInFrontRef.current) layInFrontRef.current.style.transform = t } catch (err) { }
      }
      sidRef.current = shownSessionId || ''
      // Switching chat sessions: the revision and the note name belong to the OLD session's
      // store, and the new one can easily carry the same numbers — the poll would then be told
      // "unchanged" and the card would keep showing the previous session's note. Forget them.
      if (sidRef.current !== lastSidRef.current) {
        const leavingSid = lastSidRef.current
        // Unsaved edits were typed into the session being LEFT and must not follow us here: the
        // card would show the other session's text (applyState leaves the draft alone while it is
        // dirty) and the pending auto-save would write it into THIS session's note, because
        // `saveText` is routed by the session id it carries. Capture them, kill that timer, drop
        // the flag, and let the effect right below write the text back where it came from.
        if (dirtyRef.current && leavingSid !== '' && draftRef.current) {
          rescueRef.current = { sid: leavingSid, rev: revRef.current, text: draftRef.current, note: noteNameRef.current }
        } else rescueRef.current = null
        if (saveTimer.current) { try { window.clearTimeout(saveTimer.current) } catch (err) { } saveTimer.current = 0 }
        dirtyRef.current = false
        lastSidRef.current = sidRef.current
        revRef.current = -1
        uiRevRef.current = 0
        gitRevRef.current = -1
        shownNoteRef.current = ''
        // Every piece of "where the reader was" belongs to the store being LEFT. `restoredFor`
        // and the pending restore would otherwise suppress this session's own restore — two
        // sessions can hold a note with the same name, and then no name change is ever seen —
        // and a saved line that survived would make the first save look like a duplicate.
        restoredForRef.current = ''
        pendingViewRef.current = null
        viewSavedRef.current = { line: 0, note: '' }
        // Leaving the session is also leaving the entry you are on: stamp the line you are reading
        // RIGHT NOW onto it, measured live (a plain scroll never touches the stack). Without this a
        // session parked after reading — no jump, just reading — came back with an entry whose line
        // was 0, and 前进/后退 would only open the note.
        const leaveLine = topVisibleLine()
        if (leaveLine >= 1 && navRef.current.at >= 0 && navRef.current.list[navRef.current.at]) {
          const stamped = navRef.current.list.slice()
          stamped[navRef.current.at] = { name: stamped[navRef.current.at].name, line: leaveLine }
          navRef.current = { list: stamped, at: navRef.current.at }
        }
        // The visit history belongs to the session being left, not to this one: park it and pick up
        // this session's own. The stacks are PERSISTED, so closing the page (or reloading it) does
        // not lose them; a record nobody has touched for a day is CLEARED rather than loaded (see
        // NAV_TTL_MS). Everything that pointed into the other session goes with it: a target note, a
        // pending recorded line, the jump nonce that came from that store.
        const navStore = Object.assign({}, readNavStore(), navBySidRef.current)
        const swapped = navSwapSession(navStore, navSidRef.current, sidRef.current, navRef.current, Date.now(), NAV_TTL_MS)
        navBySidRef.current = swapped.store
        navRef.current = swapped.nav
        navSidRef.current = sidRef.current
        // Expired: do not keep a record we just refused to load, or the next write would store it
        // again and it would expire again, forever.
        if (swapped.expired) delete navBySidRef.current[sidRef.current]
        navTargetRef.current = null
        navPendRef.current = null
        seenJumpRef.current = 0
      }
      // Everything a session switch has to clean up on the browser side, once per switch:
      //  - the edits typed in the session just left go back to THAT session (`saveText` is routed by
      //    the session id it carries), and this session's dirty flag is cleared with them;
      //  - the editor, the block editor, the action bar and the live selection all belong to the note
      //    of the session just left. An uncontrolled textarea would keep SHOWING its text under the
      //    new session, and a live selection carries line/column positions that would mark the wrong
      //    characters of this session's note, so they go — exactly as they do on a note switch.
      // Runs once on mount and on every session change; a no-op unless something really changed.
      React.useEffect(function () {
        const r = rescueRef.current
        rescueRef.current = null
        setLive(null); setMagnify(null); setEditBlock(null); editBlockRef.current = null; hideBar()
        if (mode === 'edit') setMode('read')
        setDirty(false)
        // The stacks — the session being left included — go to disk here: this is the one place
        // that knows a switch happened, and a switch is not a hot path.
        saveNavNow()
        if (!r) return
        host.call('saveText', { text: r.text, baseRevision: r.rev, sessionId: r.sid }).then(function (res) {
          if (res && res.conflict) notify('《' + r.note + '》的未保存改动没有写入：那份笔记已被外部改动')
          else if (!(res && res.ok)) notify('《' + r.note + '》的未保存改动写入失败')
        }).catch(function () { notify('《' + r.note + '》的未保存改动写入失败') })
      }, [shownSessionId])
      // A dead entry is what "点了不跳转" means, so a stack is pruned against the note list of the
      // session it belongs to as soon as that list is known. A NON-EMPTY list is required: an empty
      // one means "no answer yet", and pruning then would wipe a stack that is still perfectly good.
      const navNamesKey = notes.map(function (n) { return n && n.name ? String(n.name) : '' }).filter(function (x) { return x !== '' }).join('\u0000')
      React.useEffect(function () {
        if (navNamesKey === '') return
        const pruned = navPrune(navRef.current, navNamesKey.split('\u0000'))
        if (pruned === navRef.current) return
        navRef.current = pruned
        saveNavNow()
        bump()
      }, [navNamesKey])
      noteNameRef.current = noteName || ''
      notesRef.current = notes
      stRef.current = st
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
      // Focus the remark input as soon as it opens (on a phone that is what raises the
      // keyboard, so the reader can type immediately after the long press).
      React.useEffect(function () {
        if (!remarkFor) return undefined
        const el = remarkInputRef.current
        if (!el) return undefined
        const grab = function () { try { el.focus() } catch (err) { } }
        grab()
        const ids = [60, 260].map(function (ms) { return window.setTimeout(grab, ms) })
        return function () { for (let i = 0; i < ids.length; i++) { try { window.clearTimeout(ids[i]) } catch (err) { } } }
      }, [remarkFor])
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
      // ── the listeners that must follow the BODY ELEMENT, not the note text ──────────
      // `hidden` (collapse) makes the component return the pill instead of the card, so the
      // whole card subtree — including `.dn-body` — is unmounted, and expanding mounts a NEW
      // body element. An effect keyed on `st.text` therefore left the scroll listener on a
      // detached node: no scroll tick, no layer shift, and a live (blue) selection stayed
      // pinned to the viewport while the text scrolled under it. That is the intermittent
      // "蓝色选中不随滚轮移动". Re-attaching whenever the element identity changes fixes the
      // whole class, not just that one path.
      React.useEffect(function () {
        const host = bodyRef.current
        if (host === scrollHostRef.current) return undefined
        if (detachHostRef.current) { try { detachHostRef.current() } catch (err) { } detachHostRef.current = null }
        scrollHostRef.current = host
        if (!host) return undefined
        const nodes = host.querySelectorAll('[data-dn-table], .dn-pre, .dn-mmd')
        const onScroll = function () { bump() }
        for (let i = 0; i < nodes.length; i++) { try { nodes[i].addEventListener('scroll', onScroll, { passive: true }) } catch (err) { } }
        // A body scroll changes no measurement — bands and cells are content coordinates — so
        // it needs a re-render (which lines are worth painting) and, immediately, a shift of
        // the overlay layers. The shift is applied here, imperatively, so the highlights are
        // glued to the text even if a render is still pending; the render reads the same
        // scrollTop and writes the same transform, so the two can never disagree.
        const onBodyScroll = function () {
          applyLayerShift()
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
        detachHostRef.current = function () {
          for (let i = 0; i < nodes.length; i++) { try { nodes[i].removeEventListener('scroll', onScroll) } catch (err) { } }
          try { host.removeEventListener('scroll', onBodyScroll) } catch (err) { }
          try { if (ro) ro.disconnect() } catch (err) { }
        }
        return undefined
      })
      // Unmount only: the listeners above are torn down when the body element changes, and
      // this makes sure the last set does not outlive the card.
      React.useEffect(function () {
        return function () { if (detachHostRef.current) { try { detachHostRef.current() } catch (err) { } detachHostRef.current = null } }
      }, [])
      React.useEffect(function () {
        if (firstLayoutRef.current) { firstLayoutRef.current = false; return }
        writeLayout(layout)
      }, [layout])
      // st.revision is in the deps so the first content render re-measures: refs
      // attach after that render, so without this the saved highlights of a
      // freshly loaded note stayed invisible until some later geometry change.
      React.useEffect(function () { bump() }, [geo.width, geo.mode, panel, hidden, mode, bounds.w, bounds.h, st ? st.revision : -1])
      /**
       * The fine-grained change events the host appends for every mutating tool/RPC.
       *
       * They are what tells the card WHICH part of the view went stale, right after the tool
       * call rather than up to a poll later:
       *   text   the note body (and, if `active` is given, that we are looking at another note)
       *   marks  the marks of the active note (tints, list rows)
       *   notes  the note picker
       *   lists  the custom mark lists (and the view tabs that show them)
       *   view   a requested reading position (note_goto) — the card must actually move
       *   git    the commit hash in the footer
       *   ui     a queued view command (note_ui / note_panel) — already handled by its own effect
       * Anything not listed here simply means "the full state answer already covers it".
       */
      function applyEvents(list) {
        let last = eventIdRef.current
        for (let i = 0; i < list.length; i++) {
          const e = list[i]
          if (!e || typeof e.id !== 'number') continue
          if (e.id <= last) continue
          last = e.id
          const data = e.data && typeof e.data === 'object' ? e.data : {}
          if (e.topic === 'view') {
            // The same channel the reader's own jumps use, so the restore path is the one that
            // already knows how to re-anchor a line whose text moved.
            const line = typeof data.line === 'number' ? data.line : 0
            if (line > 0) { pendingViewRef.current = { line: line, anchor: typeof data.anchor === 'string' ? data.anchor : '', tries: 0 }; bump() }
          } else if (e.topic === 'lists') {
            // The payload carries the new list set; the answer's `lists` does too, but taking it
            // here means a list change shows up without waiting for the next full answer.
            if (Array.isArray(data.lists)) setListData(data.lists)
          } else if (e.topic === 'marks') {
            bump()
          }
        }
        eventIdRef.current = last
      }
      function applyState(r) {
        if (!r || r.unchanged) {
          // Even an "unchanged" answer can carry events (they are what makes the answer not
          // unchanged), so they are processed before anything else.
          if (r && Array.isArray(r.events)) applyEvents(r.events)
          return
        }
        if (Array.isArray(r.events)) applyEvents(r.events)
        // Custom mark lists ride every state poll, so the tabs and their counts stay in step
        // with whatever the agent (note_lists) or another window did to them.
        if (Array.isArray(r.lists)) setListData(r.lists)
        if (typeof r.uiRevision === 'number') { uiRevRef.current = r.uiRevision; hostUiRevRef.current = true }
        if (typeof r.gitRevision === 'number') gitRevRef.current = r.gitRevision
        // `inactive` means this store does not belong to this session (the note now
        // requires an explicit action before it participates). Clearing the state is
        // what removes the card; without it the last known note kept being rendered.
        if (r.inactive) { revRef.current = r.revision; textRef.current = ''; setSt(null); return }
        revRef.current = r.revision
        textRef.current = r.text
        shownNoteRef.current = String(r.active || '')
        // Self-heal: the host reports "no note is open" while this session's note space HAS
        // notes. That happens when the store loaded before its workspace was resolvable
        // (startup), and it used to leave the card on a blank note until the user switched
        // notes by hand — which is exactly what this does for them.
        if (!r.active && Array.isArray(r.notes) && r.notes.length && !selfHealRef.current) {
          const firstNote = r.notes[0] && r.notes[0].name
          if (firstNote) {
            selfHealRef.current = true
            host.call('selectNote', { sessionId: sidRef.current, name: firstNote }).then(function (rr) {
              selfHealRef.current = false
              if (rr && rr.ok) applyState(rr)
            }).catch(function () { selfHealRef.current = false })
          }
        }
        // A DIFFERENT note (or the first one after a page load) resumes where it was left.
        // Same note + a plain refresh must not touch the scroll position: that is the
        // background poll and the external-edit refresh.
        const incoming = String(r.active || '')
        // A session that has just come on screen starts with an EMPTY history (the previous session's
        // is parked, see the session-change block). The [noteName] effect is what seeds it, and that
        // only fires on a name CHANGE — but two sessions can hold a note with the same name (《笔记》),
        // and then nothing would fire: a note on screen with an empty 后退. Fill it here as well.
        // `at < 0` means nothing is recorded yet, so this can never disturb a real trail.
        if (incoming !== '' && navRef.current.at < 0) navRef.current = navPushVisit(navRef.current, incoming, 0)
        if (Object.prototype.hasOwnProperty.call(r, 'view')) hostViewRef.current = true
        // An agent asked the card to go somewhere (note_goto) — the note text and the revision
        // are unchanged, so only the nonce tells this apart from a routine state refresh.
        const jump = r.view && typeof r.view.jump === 'number' ? r.view.jump : 0
        if (jump && jump !== seenJumpRef.current) {
          seenJumpRef.current = jump
          // This branch runs for EVERY jump the host reports — a link into another note and an
          // anchor inside this one — and it is the only place that touches the history entry.
          // The entry being left keeps the line the reader is actually on, and it is MEASURED
          // live: the view save is debounced by 700ms, so viewSavedRef can be a scroll behind,
          // and this number is what 后退 returns to. A host jump is a new intent, so any
          // recorded back/forward line waiting to be used is dropped here.
          navPendRef.current = null
          navRef.current = navRecordJump(navRef.current, incoming, r.view.line,
            topVisibleLine() || (viewSavedRef.current && viewSavedRef.current.line) || 0)
          saveNavNow()
          jumpWindowUntilRef.current = Date.now() + 2500
          restoredForRef.current = incoming
          pendingViewRef.current = { line: Math.round(Number(r.view.line) || 1), anchor: String(r.view.anchor || ''), tries: 0 }
          viewSavedRef.current = { line: 0, note: incoming }
          setSt(r)
          applyNotes(r)
          bump()
          if (!dirtyRef.current) { draftRef.current = r.text; setDraft(r.text) }
          return
        }
        if (incoming !== restoredForRef.current) {
          restoredForRef.current = incoming
          // A back/forward jump handed over the line to restore. It WINS: the host view and the
          // browser mirror both describe where that note was last CLOSED, which is not where the
          // reader was standing when they jumped away from it.
          const recorded = navPendRef.current === incoming && pendingViewRef.current !== null
          navPendRef.current = null
          if (!recorded) {
            const fromHost = r.view && Number(r.view.line) >= 1 ? r.view : null
            const v = fromHost || readLocalView(sidRef.current, incoming)
            pendingViewRef.current = v ? { line: Math.round(Number(v.line)), anchor: String(v.anchor || ''), tries: 0, from: fromHost ? 'note' : 'browser' } : null
          }
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
        let tickCount = 0
        let timer = 0
        // How soon the poll comes back. The card learns about the agent's edits from the events
        // that ride this poll, so the interval decides how "instant" a tool call feels: 700ms
        // while the card is visible and the tab has focus, 2.6s when it is not (a hidden tab
        // gains nothing from being current, and a phone should not pay for it).
        const pollDelay = function () {
          try {
            if (document.visibilityState !== 'visible') return 2600
            if (typeof document.hasFocus === 'function' && !document.hasFocus()) return 1400
          } catch (err) { }
          return 700
        }
        const tick = function () {
          tickCount += 1
          // Two revisions matter: the note text, and the host's non-content state (the summon
          // flag). A host that predates `uiRevision` only knows the first — and the older the
          // host, the more a full answer is the only way to notice /window-note start|stop.
          // So while the card is HIDDEN (which is exactly the "no note yet, wait for a summon"
          // case, and carries no text so it is cheap) every poll asks for a full answer, and a
          // visible card asks for one every 8th poll. With a host that reports uiRevision both
          // relaxations disappear.
          const hiddenNow = !(notesRef.current.length > 0) && !(stRef.current && stRef.current.summoned === true)
          const force = hiddenNow || (!hostUiRevRef.current && tickCount % 8 === 0)
          host.call('state', {
            revision: force ? -1 : revRef.current,
            uiRevision: uiRevRef.current,
            gitRevision: gitRevRef.current,
            note: shownNoteRef.current,
            since: eventIdRef.current,
            sessionId: sidRef.current,
          }).then(function (r) {
            if (!alive) return
            setOffline(false)
            if (r && r.inactive) {
              // The shell had not published its session id yet when this tick fired (the very
              // first call of a page load). Retry soon instead of waiting a whole interval: with
              // a 2s interval the card looked like it "took ages to appear" on a fresh load.
              const again = window.setTimeout(function () { if (alive) tick() }, 400)
              retryRef.current = again
              return
            }
            applyState(r)
          }).catch(function () { if (alive) setOffline(true) })
        }
        // A self-scheduling chain instead of ctx.interval: the delay depends on whether the card
        // is actually being looked at (see pollDelay).
        const loop = function () {
          if (!alive) return
          tick()
          timer = ctx.timeout(loop, pollDelay())
        }
        loop()
        return function () {
          alive = false
          if (timer) { try { timer() } catch (err) { } timer = 0 }
          if (retryRef.current) { try { window.clearTimeout(retryRef.current) } catch (err) { } retryRef.current = 0 }
        }
      }, [])
      React.useEffect(function () {
        if (!toast) return undefined
        return ctx.timeout(function () { setToast('') }, 3200)
      }, [toast])
      // Re-assert the plugin stylesheet once the card is really on screen. The bundle
      // build injects it at apply time, but a later re-apply can leave that tag removed
      // by a stale disposer (that is exactly how the card once came up completely
      // unstyled: 38000px body, mark list with no scroll). `ensureStyle` only exists in
      // the permanent bundle; the dynamic form uses the `styles` service instead.
      React.useEffect(function () {
        try { if (typeof ensureStyle === 'function') ensureStyle() } catch (err) { }
        return undefined
      }, [])
      // An italic / underlined mark changes the width of the glyphs it covers, so every cached
      // character box on those lines is stale the moment the mark set (or the text) changes.
      // One geometry bump per change re-measures exactly once, through the same counter the
      // char-box and band caches are keyed on.
      const lookKey = (st ? st.revision : -1) + '|' + (st ? String(st.text || '').length : 0) + '|' + selCount()
      React.useEffect(function () { bump() }, [lookKey])
      // Closing the card and opening it again has to come back to the same line. Switching notes
      // always did — the switch hands a pending view to the restore path — but collapsing simply
      // unmounted the body, which re-mounted at the top ("关闭后重新打开不再是关闭时的定位").
      // Remember where the reader was as the card goes away, and hand that to the same path.
      const awayViewRef = React.useRef(null)
      React.useEffect(function () {
        if (hidden) return undefined
        const held = awayViewRef.current
        awayViewRef.current = null
        const saved = held || (viewSavedRef.current && viewSavedRef.current.line && viewSavedRef.current.note === noteNameRef.current
          ? { line: viewSavedRef.current.line, anchor: '' }
          : null)
        if (!saved || !saved.line) return undefined
        pendingViewRef.current = { line: saved.line, anchor: saved.anchor || '', tries: 0 }
        bump()
        return undefined
      }, [hidden])
      /** Fold the card away, remembering the line it was showing. */
      function collapseCard() {
        const line = topVisibleLine()
        awayViewRef.current = { line: line, anchor: anchorOfLine(line) }
        saveViewNow()
        setHidden(true)
      }
      // The mark list keeps its scroll position: put it back when the list is reopened, when the
      // note or the view changes, and after a reload. A pending "focus this mark" wins over the
      // stored position, because that is an explicit request from a click.
      React.useEffect(function () {
        marksScrollKeyRef.current = marksScrollKey(sidRef.current, noteName, markTab)
        if (!panel) return undefined
        const want = readMarksScroll(marksScrollKeyRef.current)
        const focus = markFocusRef.current
        const id = window.setTimeout(function () {
          const box = marksBodyRef.current
          if (!box) return
          if (focus) { markFocusRef.current = ''; focusMarkRow(focus, 0); return }
          if (want > 0 && Math.abs(box.scrollTop - want) > 2) box.scrollTop = want
        }, 60)
        return function () { try { window.clearTimeout(id) } catch (err) { } }
      }, [panel, markTab, noteName, marksWin ? 'win' : 'dock', shownSessionId, hidden])
      // The agent drives the card's own view state through this queue: the host appends a
      // command (note_ui / note_panel), the card performs it here and acknowledges it by id so
      // the same command can never run twice. The list is already in every state poll, so no
      // new request is involved.
      const uiKey = st && Array.isArray(st.ui) ? st.ui.map(function (e) { return e && e.id }).join(',') : ''
      React.useEffect(function () {
        const q = st && Array.isArray(st.ui) ? st.ui : []
        if (!q.length) return undefined
        let max = uiAckRef.current
        for (let i = 0; i < q.length; i++) {
          const e = q[i]
          const id = e && typeof e.id === 'number' ? e.id : 0
          if (id <= max) continue
          try { runUiCommand(e.cmd || {}) } catch (err) { }
          max = id
        }
        if (max > uiAckRef.current) {
          uiAckRef.current = max
          try { host.call('uiAck', { sessionId: sidRef.current, id: max }).catch(function () { }) } catch (err) { }
        }
        return undefined
      }, [uiKey])
      // Clicking anywhere outside the function card closes it (the card itself stops the event).
      React.useEffect(function () {
        if (!mcard) return undefined
        const onDown = function (ev) {
          const el = mcardRef.current
          if (el && ev.target && el.contains(ev.target)) return
          // The row's 样式 button opened this card and toggles it on click (see markRow).
          const opener = ev.target && ev.target.closest ? ev.target.closest('[data-menu-opener]') : null
          if (opener !== null) return
          setMcard(null)
        }
        try { document.addEventListener('pointerdown', onDown, true) } catch (err) { }
        return function () { try { document.removeEventListener('pointerdown', onDown, true) } catch (err) { } }
      }, [mcard, addFor, addBox])
      React.useEffect(function () {
        if (!addFor && !addBox) return undefined
        const onDown = function (ev) {
          const el = addBoxRef.current
          if (el && ev.target && el.contains(ev.target)) return
          // Same rule as the chrome menus: the button that opened this popover toggles it on the
          // click that follows, so a pointerdown on such a button must not close it here.
          const opener = ev.target && ev.target.closest ? ev.target.closest('[data-menu-opener]') : null
          if (opener !== null) return
          setAddFor(null); setAddBox(null)
        }
        try { document.addEventListener('pointerdown', onDown, true) } catch (err) { }
        return function () { try { document.removeEventListener('pointerdown', onDown, true) } catch (err) { } }
      }, [addFor, addBox, menuOpen])
      React.useEffect(function () {
        if (!addFor && !addBox) return undefined
        const el = addBoxRef.current
        if (!el) return undefined
        const r = el.getBoundingClientRect()
        const w = Math.round(r.width)
        const h = Math.round(r.height)
        setAddSize(function (prev) { return prev && prev.w === w && prev.h === h ? prev : { w: w, h: h } })
        return undefined
      }, [addFor && addFor.markId, addBox && addBox.x, addSize === null])
      React.useEffect(function () {
        if (!menuOpen) return undefined
        const onDown = function (ev) {
          const el = menuRef.current
          if (el && ev.target && el.contains(ev.target)) return
          // A pointerdown on the button that opened the menu must NOT close it here: the click
          // that follows belongs to that button and toggles the menu in one place.
          const opener = ev.target && ev.target.closest ? ev.target.closest('[data-menu-opener]') : null
          if (opener !== null) return
          setMenuOpen(null)
        }
        try { document.addEventListener('pointerdown', onDown, true) } catch (err) { }
        return function () { try { document.removeEventListener('pointerdown', onDown, true) } catch (err) { } }
      }, [menuOpen])
      // Measure the action bar once it is on screen and keep it inside the body's box: the
      // overlay clips, and a bar anchored to a caret near the right edge lost its buttons.
      React.useEffect(function () {
        const el = barRef.current
        const host = bodyRef.current
        if (!el || !host) return undefined
        const r = el.getBoundingClientRect()
        const hr = host.getBoundingClientRect()
        const over = r.right - (hr.right - 6)
        const under = (hr.left + 6) - r.left
        const want = over > 0 ? Math.round(over) : (under > 0 ? -Math.round(under) : 0)
        setBarShift(function (prev) { return prev === want ? prev : want })
        return undefined
      }, [live, barReady, penOpen, barShift])
      // Measure the mark card once it is on screen so the clamp above uses its real size (a
      // first paint with an estimate would otherwise still kiss the footer on a tall card).
      React.useEffect(function () {
        if (!mcard) return undefined
        const el = mcardRef.current
        if (!el) return undefined
        const r = el.getBoundingClientRect()
        const w = Math.round(r.width)
        const h = Math.round(r.height)
        setMcardSize(function (prev) { return prev && prev.w === w && prev.h === h ? prev : { w: w, h: h } })
        return undefined
      }, [mcard && mcard.id, mcard && mcard.x, mcard && mcard.y, mcardSize === null])
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
        let pick = null
        // Ask the DOM FIRST: the element actually under the cursor carries data-line, so the answer
        // cannot be poisoned by a stale band cache. The cache is keyed by the card's geometry only,
        // so content that grows AFTER it was measured (an image finishing, a table expanding) moved
        // every line below it while the bands stayed behind — a click on 六、可视化 landed on 四、
        // and a double-click there entered the editor at the wrong place.
        const hitEl = (typeof document !== 'undefined' && document.elementFromPoint) ? document.elementFromPoint(clientX, clientY) : null
        if (hitEl && body.contains(hitEl)) {
          let el = hitEl
          while (el && el !== body && !(el.getAttribute && el.getAttribute('data-line') !== null)) el = el.parentElement
          if (el && el !== body) {
            const ln = Number(el.getAttribute('data-line'))
            if (Number.isFinite(ln) && ln >= 1) pick = ln
          }
        }
        if (pick === null) {
          // Dead space (gaps between blocks, the body's bottom padding): fall back to the band
          // lookup, whose dead-space rule keeps a long press in a gap from snapping onto a far line.
          let pickScore = 1e12
          const bands = lineBands().bands
          for (let i = 0; i < bands.length; i++) {
            const b = bands[i]
            const score = (y >= b.top && y <= b.bottom) ? (-1 - 1 / (1 + (b.bottom - b.top))) : (y < b.top ? (b.top - y) : (y - b.bottom))
            if (score < pickScore) { pickScore = score; pick = b.line }
          }
          if (pick === null) return null
          if (pickScore > 120) return null
        }
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
        // Bounded in EVERY script, because "a long press picked up a lot of text" must not
        // depend on which script the press landed in: measured over this note's 1533 lines, a
        // Latin run can still be 24-38 characters (a URL, an identifier, a code token). CJK has
        // no spaces at all, so it gets the tighter phrase-sized window.
        const run = rawLine.slice(a, b)
        const limit = /[\u3040-\u30ff\u4e00-\u9fff]/.test(run) ? CJK_UNIT_MAX : LATIN_UNIT_MAX
        if (b - a > limit) {
          const centre = Math.min(Math.max(pt.col, a), b)
          const from = Math.max(a, Math.min(centre - Math.floor(limit / 2), b - limit))
          return { from: from, to: from + limit }
        }
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
      function commitLive(remark) {
        if (!live) return
        const first = cmpPos(live.a, live.f) <= 0 ? live.a : live.f
        const last = cmpPos(live.a, live.f) <= 0 ? live.f : live.a
        // A block selection stores both endpoints as {line, col: 0} on purpose (columns
        // are meaningless for a diagram/image), so this guard must not fire for it —
        // doing so was what produced "没有选中文字" on a long-pressed Mermaid block.
        if (!live.block && first.line === last.line && first.col === last.col) { notify('这段没有文字可选：可拖动圆点确定范围'); return }
        // A block selection carries no meaningful a/f columns (both sit on the fence
        // line), so committing it through line/column produced an empty slice and the
        // host answered "empty" ("没有选中文字"). Submit the block's whole source range
        // instead — fences included, so the diagram's source is what gets stored.
        const blkRange = live && live.block ? blockRangeAt(live.a.line) : null
        const blkLines = blkRange ? String(textRef.current).split(String.fromCharCode(10)) : null
        const rangeArgs = blkRange
          ? { startLine: blkRange.from, startCol: 0, endLine: blkRange.to, endCol: (blkLines[blkRange.to - 1] || '').length }
          : { startLine: first.line, startCol: first.col, endLine: last.line, endCol: last.col }
        host.call('addSelection', Object.assign({ color: penColor, italic: penItalic, underline: penUnderline, sessionId: sidRef.current, remark: typeof remark === 'string' ? remark : '' }, rangeArgs)).then(function (r) {
          if (r && r.ok) {
            revRef.current = r.revision
            setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev })
            setLive(null)
            const lines = '已标记 第' + (blkRange ? blkRange.from : first.line) + '~' + (blkRange ? blkRange.to : last.line) + ' 行'
            const how = (penItalic ? '（斜体' : '') + (penUnderline ? (penItalic ? '+下划线）' : '（下划线）') : (penItalic ? '）' : ''))
            notify(lines + how + (typeof remark === 'string' && remark.trim() !== '' ? '（含备注）' : ''))
          } else notify(r && r.reason === 'empty' ? '选中的是空白内容' : '选中失败')
        }).catch(function (err) { notify('选中失败: ' + err.message) })
      }
      // ── selection remark ────────────────────────────────────────────────────────────
      // A remark is the reader's own note about one selected passage: typed by long-pressing
      // [选中] (which opens the input instead of committing immediately), and delivered to the
      // agent together with the selection text.
      function saveRemark(id, remark) {
        host.call('setRemark', { sessionId: sidRef.current, id: id, remark: remark }).then(function (r) {
          if (r && r.ok) {
            revRef.current = r.revision
            setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev })
            notify(r.remark === '' ? '已清除备注' : '已写入备注')
          } else notify('备注写入失败: ' + ((r && r.error) || '未知原因'))
        }).catch(function (err) { notify('备注写入失败: ' + ((err && err.message) || String(err))) })
      }
      /** Commit the live selection together with a remark, in ONE call. */
      function commitLiveWithRemark(remark) { commitLive(typeof remark === 'string' ? remark : '') }
      function closeRemark() {
        if (remarkTimerRef.current !== null) { try { window.clearTimeout(remarkTimerRef.current) } catch (err) { } remarkTimerRef.current = null }
        setRemarkFor(null)
        setRemarkDraft('')
      }
      /** Save what the input holds: commit the live selection with it, or update an existing one. */
      function applyRemark() {
        const draft = remarkDraft
        const target = remarkFor
        closeRemark()
        if (!target) return
        if (target.live) { hideBar(); commitLiveWithRemark(draft); return }
        saveRemark(target.id, draft)
      }
      function flush(silent) {
        // `saveTimer` holds a `window.setTimeout` id (see onDraft), not the disposer `ctx.timeout`
        // used to return: CALLING it threw a TypeError, so 保存 or a note switch within 900ms of a
        // keystroke did nothing at all — no save and, for the switch, no switch either.
        if (saveTimer.current) { try { window.clearTimeout(saveTimer.current) } catch (err) { } saveTimer.current = 0 }
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
      /**
       * Block-level Markdown for a mark's text: the same look as the note body (headings,
       * lists, quotes, code, tables) without the editing/selection machinery — no data-line,
       * no refs, no geometry. The list used to render the raw source, so a marked passage that
       * contained `###` or `- ` showed those characters verbatim.
       */
      function markBlocks(text) {
        const blocks = parseBlocks(String(text == null ? '' : text))
        const out = []
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i]
          const key = 'mk' + i
          if (b.k === 'blank') continue
          if (b.k === 'hr') { out.push(h('div', { className: 'dn-hr', key: key })); continue }
          if (b.k === 'h') { out.push(h('div', { className: 'dn-h dn-h' + b.level, key: key }, lineSpans(b.raw, b.base, false))); continue }
          if (b.k === 'quote') { out.push(h('div', { className: 'dn-quote', key: key }, lineSpans(b.raw, b.base, false))); continue }
          if (b.k === 'li') {
            const marker = b.task
              ? h('span', { className: 'dn-bullet', key: 'm' }, b.checked ? '\u2611' : '\u2610')
              : h('span', { className: 'dn-bullet', key: 'm' }, b.ordered ? b.marker : '\u2022')
            out.push(h('div', { className: 'dn-li', key: key }, [marker, h('div', { className: 'dn-li-body', key: 'b' }, lineSpans(b.raw, b.base, false))]))
            continue
          }
          if (b.k === 'code') {
            const lang = (b.lang || '').toLowerCase()
            const body = b.body || []
            const rows = []
            for (let k = 0; k < body.length; k++) {
              const toks = lang === 'mermaid' ? [{ k: 'code', t: body[k], off: 0 }] : hlTokens(body[k], lang)
              rows.push(h('div', { className: 'dn-code-line', key: 'c' + k }, renderTokens(withBase(toks, 0), 'mc' + i + '_' + k + '_')))
            }
            out.push(h('pre', { className: 'dn-pre', key: key }, rows.length ? rows : [h('div', { className: 'dn-code-line', key: 'e' }, ' ')]))
            continue
          }
          if (b.k === 'table') {
            const rows = []
            for (let ri = 0; ri < (b.rows || []).length; ri++) {
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
                  className: row.head ? 'dn-th' : 'dn-td', key: 'd' + ci,
                  style: { textAlign: b.align && b.align[ci] ? b.align[ci] : 'left' },
                }, lineSpans(txt, base, false)))
              }
              rows.push(h('tr', { className: 'dn-tr', key: 'r' + ri }, kids))
            }
            out.push(h('div', { className: 'dn-twrap', key: key, title: '可左右滑动查看完整表格' }, [h('table', { className: 'dn-table', key: 't' }, [h('tbody', { key: 'b' }, rows)])]))
            continue
          }
          out.push(h('div', { className: 'dn-p', key: key }, lineSpans(b.raw, b.base, false)))
        }
        return out.length ? out : [h('div', { className: 'dn-p', key: 'none', style: { color: '#8a8f98' } }, '（空）')]
      }
      /** Marks of every note in this session, for the 本会话 view. */
      function loadAllMarks() {
        if (allMarksMissingRef.current) { setMarksData([]); return Promise.resolve() }
        return host.call('allMarks', { sessionId: sidRef.current }).then(function (r) {
          setMarksData(r && Array.isArray(r.notes) ? r.notes : [])
        }).catch(function () {
          // A host that predates this RPC answers 404. Remember it so the session view does not
          // keep asking (and does not spam the console), and say so in the empty state.
          allMarksMissingRef.current = true
          setMarksData([])
        })
      }
      /**
       * Jump to a mark, switching notes when it lives in another one. `pendingViewRef` is the
       * same channel the reading position restore and the agent's note_goto use.
       */
      function jumpToMark(note, line) {
        const target = Math.max(1, Math.round(Number(line) || 1))
        const go = function () {
          const anchor = String((String(textRef.current || '').split(String.fromCharCode(10))[target - 1] || '')).trim().slice(0, 40)
          pendingViewRef.current = { line: target, anchor: anchor, tries: 0 }
          bump()
        }
        if (note && note !== noteName) {
          host.call('selectNote', { sessionId: sidRef.current, name: note }).then(function (r) {
            if (r && r.ok) { applyState(r); go() }
          }).catch(function () { })
          return
        }
        go()
      }
      function jumpToSelection(s) { jumpToMark('', s && s.startLine) }
      // ── mark list: window form, focus, scroll memory, and the single-click card ──────
      /** A mark's size in characters — the narrowest mark under a click wins. */
      function markSpan(m) {
        const a = offsetOfPos(textRef.current || '', m.startLine, m.startCol)
        const b = offsetOfPos(textRef.current || '', m.endLine, m.endCol)
        return Math.max(1, b - a)
      }
      /** The mark under a click: style marks carry their ids on the span, washes are hit-tested. */
      function markAtEvent(e) {
        const tgt = e.target
        const host = tgt && tgt.closest ? tgt.closest('[data-mkid]') : null
        const ids = host ? String(host.getAttribute('data-mkid') || '').split(' ').filter(Boolean) : []
        if (ids.length) {
          const hits = []
          for (let i = 0; i < selList.length; i++) if (ids.indexOf(selList[i].id) >= 0) hits.push(selList[i])
          if (hits.length) return hits.length === 1 ? hits[0] : hits.sort(function (a, b) { return markSpan(a) - markSpan(b) })[0]
        }
        const pt = pointToPos(e.clientX, e.clientY)
        if (!pt) return null
        const hits = []
        for (let i = 0; i < selList.length; i++) {
          const m = selList[i]
          if (pt.line < m.startLine || pt.line > m.endLine) continue
          if (pt.line === m.startLine && pt.col < m.startCol) continue
          if (pt.line === m.endLine && pt.col > m.endCol) continue
          hits.push(m)
        }
        if (!hits.length) return null
        hits.sort(function (a, b) { return markSpan(a) - markSpan(b) })
        return hits[0]
      }
      /** Every mark id whose range covers a position — the function card offers all of them. */
      function marksAtMark(m) {
        const out = []
        for (let i = 0; i < selList.length; i++) {
          const x = selList[i]
          if (x.startLine === m.startLine && x.startCol === m.startCol && x.endLine === m.endLine && x.endCol === m.endCol) out.push(x)
        }
        return out.length ? out : [m]
      }
      /** Scroll the list to one row and flash it, so the eye lands where the click was. */
      function focusMarkRow(id, tries) {
        const box = marksBodyRef.current
        const el = markRowEls.current[id]
        if (!box || !el || !el.isConnected) {
          // The list may still be mounting (just summoned, or a tab switch): retry a few frames.
          if ((tries || 0) < 8) {
            window.setTimeout(function () { focusMarkRow(id, (tries || 0) + 1) }, 60)
          }
          return false
        }
        const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8
        box.scrollTop = Math.max(0, top)
        const cur = markRowEls.current[id]
        if (cur && cur.classList) {
          cur.classList.remove('dn-mark-flash')
          // Force a reflow so the animation restarts even when the same row is clicked twice.
          void cur.offsetWidth
          cur.classList.add('dn-mark-flash')
        }
        return true
      }
      /**
       * A single click landed on a mark. The list is brought to that mark whenever it is already
       * open (the reader asked for exactly that), and is summoned only when the switch says so.
       */
      function revealMarkInList(m) {
        if (!m) return
        const open = summonOnMark || panel
        if (!open) return
        if (!panel) {
          setPanel(true)
          if (!geo.compact) liftMarksOut(null)
        }
        markFocusRef.current = m.id
        focusMarkRow(m.id, 0)
      }
      /** Lift the list out of the card (or put it back) and remember the choice. */
      function liftMarksOut(at) {
        const vw = bounds.w || 1200
        const vh = bounds.h || 800
        const w = 340
        const h = Math.min(520, Math.max(240, Math.round(vh * 0.6)))
        const x = at && isFinite(at.x) ? clamp(at.x, MARKS_WIN_MIN_W - 60, Math.max(0, vw - 60)) : clamp(vw - w - 24 - (geo.mode === 'docked' ? 0 : 0), 12, Math.max(12, vw - w - 12))
        const y = at && isFinite(at.y) ? clamp(at.y, 8, Math.max(8, vh - 40)) : 64
        const next = { x: Math.round(x), y: Math.round(y), w: w, h: h }
        setMarksWin(next)
        writeMarksPref({ float: next })
        return next
      }
      function dockMarksBack() {
        setMarksWin(null)
        writeMarksPref({ float: null })
      }
      function setSummon(v) {
        setSummonOnMark(v === true)
        writeMarksPref({ summon: v === true })
      }
      /**
       * The list's header drags the way the note card's own handle does: ONE gesture. Pressing
       * and moving both lifts the list out of the card and keeps moving the new window under the
       * pointer, and the transfer happens on the first few pixels — waiting for a threshold (or
       * for a long press) meant the first drag only "unlocked" dragging and you had to drag a
       * second time ("要拖两次").
       */
      function startMarksLift(e) {
        if (e.button !== undefined && e.button !== 0) return
        const tgt = e.target
        if (tgt && tgt.closest && tgt.closest('button')) return
        e.preventDefault()
        marksLiftRef.current = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId, moved: false }
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { }
      }
      /** Take the list out at the pointer and go straight on dragging it, in the same gesture. */
      function liftAndKeepDragging(e, d) {
        const next = liftMarksOut({ x: e.clientX - 40, y: Math.max(8, e.clientY - 14) })
        marksLiftRef.current = null
        if (next) marksWinDragRef.current = { kind: 'move', x0: e.clientX, y0: e.clientY, base: next, id: d ? d.id : e.pointerId }
        return next
      }
      function moveMarksLift(e) {
        const d = marksLiftRef.current
        if (!d) return
        d.x = e.clientX
        d.y = e.clientY
        const far = Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) > 5
        if (far) d.moved = true
        // A long press with no movement also means "take it out" (the phone gesture), and it
        // keeps dragging from there too — so a press-and-hold followed by a move is one gesture.
        if (d.moved || Date.now() - d.t > 300) liftAndKeepDragging(e, d)
      }
      function endMarksLift(e) {
        const d = marksLiftRef.current
        marksLiftRef.current = null
        if (!d) return
        // A long press that never moved still means "take it out" — that is the phone gesture.
        if (Date.now() - d.t > 300 || d.moved) {
          const x = e && isFinite(e.clientX) ? e.clientX - 40 : d.x - 40
          const y = e && isFinite(e.clientY) ? e.clientY - 14 : d.y - 14
          liftMarksOut({ x: x, y: y })
        }
      }
      /** Drag the lifted-out window by its header, and resize it from its grip. */
      function startMarksWinDrag(e, kind) {
        if (e.button !== undefined && e.button !== 0) return
        const tgt = e.target
        if (tgt && tgt.closest && tgt.closest('button')) return
        e.preventDefault()
        e.stopPropagation()
        const base = marksWin || { x: 60, y: 60, w: 340, h: 400 }
        marksWinDragRef.current = { kind: kind, x0: e.clientX, y0: e.clientY, base: base, id: e.pointerId }
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { }
      }
      function moveMarksWinDrag(e) {
        const d = marksWinDragRef.current
        if (!d || (d.id !== undefined && e.pointerId !== undefined && d.id !== e.pointerId)) return
        const dx = e.clientX - d.x0
        const dy = e.clientY - d.y0
        const vw = bounds.w || 1200
        const vh = bounds.h || 800
        if (d.kind === 'resize') {
          setMarksWin(Object.assign({}, d.base, {
            w: Math.round(clamp(d.base.w + dx, MARKS_WIN_MIN_W, Math.max(MARKS_WIN_MIN_W, vw - d.base.x - 8))),
            h: Math.round(clamp(d.base.h + dy, MARKS_WIN_MIN_H, Math.max(MARKS_WIN_MIN_H, vh - d.base.y - 8))),
          }))
        } else {
          setMarksWin(Object.assign({}, d.base, {
            x: Math.round(clamp(d.base.x + dx, 4 - d.base.w + 60, vw - 60)),
            y: Math.round(clamp(d.base.y + dy, 4, vh - 32)),
          }))
        }
      }
      function endMarksWinDrag() {
        const d = marksWinDragRef.current
        marksWinDragRef.current = null
        if (!d) return
        // Persist what is on screen now (the state may not have flushed yet, so read the rect).
        const el = marksWinRef.current
        if (el && el.getBoundingClientRect) {
          const r = el.getBoundingClientRect()
          const keep = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
          writeMarksPref({ float: keep })
        }
      }
      // ── custom mark lists: the card's side of the same store the agent writes ────────
      function listCall(method, args, ok) {
        host.call(method, Object.assign({ sessionId: sidRef.current }, args || {})).then(function (r) {
          if (!r || !r.ok) { notify((r && r.error) ? String(r.error) : '操作失败'); return }
          if (Array.isArray(r.lists)) setListData(r.lists)
          if (typeof ok === 'function') ok(r)
        }).catch(function (err) { notify('操作失败: ' + ((err && err.message) || String(err))) })
      }
      function listCreateRemote(name, then) {
        const clean = String(name || '').trim()
        if (clean === '') { notify('列表名不能为空'); return }
        listCall('listCreate', { name: clean }, function () { notify('已新建列表《' + clean + '》'); if (typeof then === 'function') then(clean) })
      }
      /** Create the list and put the mark in it in one go (the 新建并添加 button). */
      function listAddMarkFromNew(name, note, markId) {
        listCall('listCreate', { name: name }, function (r) {
          if (!r.ok) return
          listCall('listAdd', { name: name, note: note || '', markId: markId }, function (r2) {
            notify('已新建《' + name + '》并添加' + (r2.count ? '（' + r2.count + ' 条）' : ''))
          })
        })
      }
      function listAddMark(listName, note, markId) {
        listCall('listAdd', { name: listName, note: note || '', markId: markId }, function (r) {
          if (r.duplicate) notify('这条已经在《' + listName + '》里了')
          else notify('已添加到《' + listName + '》' + (r.count ? '（' + r.count + ' 条）' : ''))
        })
      }
      function listRemoveMark(listName, note, markId) {
        listCall('listRemove', { name: listName, note: note || '', markId: markId }, function () { notify('已从《' + listName + '》移出') })
      }
      function listDeleteRemote(name) {
        listCall('listDelete', { name: name }, function () {
          notify('已删除列表《' + name + '》')
          if (markTab === 'list:' + name) setMarkTab('note')
        })
      }
      /** Perform one view command the agent queued (see note_ui / note_panel). */
      function runUiCommand(cmd) {
        const kind = String((cmd && cmd.kind) || '')
        if (kind === 'open') { setPanel(true); loadAllMarks(); return }
        if (kind === 'close') { setPanel(false); setMcard(null); return }
        if (kind === 'float') { setPanel(true); liftMarksOut(null); loadAllMarks(); return }
        if (kind === 'dock') { dockMarksBack(); return }
        if (kind === 'refresh') { if (cmd && cmd.tab) setMarkTab(String(cmd.tab)); loadAllMarks(); return }
        if (kind === 'tab') { setPanel(true); setMarkTab(String((cmd && cmd.tab) || 'note')); loadAllMarks(); return }
        if (kind === 'summon') {
          const on = cmd && cmd.on
          setSummon(on === null || on === undefined ? !summonOnMark : on === true)
          return
        }
        if (kind === 'focus') {
          const markId = String((cmd && cmd.markId) || '')
          if (markId === '') return
          setPanel(true)
          if (cmd.note && cmd.note !== noteName) { setMarkTab('session'); loadAllMarks() }
          markFocusRef.current = markId
          loadAllMarks()
          focusMarkRow(markId, 0)
          return
        }
        if (kind === 'card') {
          // Raise the function card on that mark, at its own line — the same card a click makes.
          const markId = String((cmd && cmd.markId) || '')
          if (markId === '') return
          const note = String((cmd && cmd.note) || '')
          if (note && note !== noteName) { jumpToMark(note, 1); return }
          const hit = findMarkInSession(note || noteName, markId)
          if (hit === null) return
          const el = lineEls.current[hit.mark.startLine]
          const box = el && el.isConnected ? el.getBoundingClientRect() : null
          const at = box ? cardPoint(box.left + 24, box.bottom + 4) : { x: 40, y: 60 }
          setMcard({ id: markId, x: at.x, y: at.y, from: 'agent' })
          return
        }
        if (kind === 'collapse') { collapseCard(); return }
        if (kind === 'expand') { setHidden(false); return }
        if (kind === 'width') { cycleSize(cmd && typeof cmd.size === 'string' && cmd.size ? cmd.size : undefined); return }
      }
      /** A viewport point, expressed relative to the card (popovers live inside it). */
      function cardPoint(clientX, clientY) {
        const root = rootRef.current
        if (!root) return { x: 8, y: 8 }
        const r = root.getBoundingClientRect()
        return { x: Math.round(clientX - r.left), y: Math.round(clientY - r.top) }
      }
      /** Keep a popover inside the card and clear of the footer's git line. */
      function clampInCard(pos, size) {
        const root = rootRef.current
        if (!root) return pos
        const r = root.getBoundingClientRect()
        const foot = footRef.current
        const limitY = foot ? (foot.getBoundingClientRect().top - r.top) - 6 : r.height - 6
        const w = (size && size.w) || 230
        const h = (size && size.h) || 92
        return {
          x: Math.max(6, Math.min(Math.round(pos.x), Math.max(6, Math.round(r.width - w - 6)))),
          y: Math.max(6, Math.min(Math.round(pos.y), Math.max(6, Math.round(limitY - h)))),
        }
      }
      /**
       * Open one of the chrome menus under the button that was clicked (click again = close).
       *
       * The buttons carry `data-menu-opener`, and the outside-click listener ignores anything
       * inside one. Without that, a mouse click ran TWO logics: the pointerdown closed the menu
       * and the click that followed re-opened it, so clicking the button could never close it
       * (reported as "一次点击做不到关闭菜单").
       */
      function openMenu(kind, e) {
        if (menuOpen && menuOpen.kind === kind) { setMenuOpen(null); return }
        const r = e && e.currentTarget ? e.currentTarget.getBoundingClientRect() : null
        const at = r ? cardPoint(r.left, r.bottom + 4) : { x: 10, y: 40 }
        setMenuOpen({ kind: kind, x: at.x, y: at.y })
        setMcard(null); setAddFor(null); setAddBox(null)
      }
      /** Find a mark of any note of this session (the session view's data, plus the live note). */
      function findMarkInSession(note, markId) {
        if (note === noteName) {
          for (let i = 0; i < selList.length; i++) if (selList[i].id === markId) return { note: note, mark: selList[i] }
        }
        for (let i = 0; i < (marksData || []).length; i++) {
          const g = marksData[i]
          if (g.note !== note) continue
          for (let k = 0; k < (g.marks || []).length; k++) if (g.marks[k].id === markId) return { note: note, mark: g.marks[k] }
        }
        return null
      }
      /** Change a mark's colour and/or its text styles from the card. */
      function applyLook(m, patch) {
        if (!m) return
        const args = Object.assign({ sessionId: sidRef.current, id: m.id }, patch || {})
        host.call('setMarkLook', args).then(function (r) {
          if (!r || !r.ok) { notify(r && r.error ? String(r.error) : '改不了这条标记'); return }
          revRef.current = r.revision
          setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections || prev.selections }) : prev })
          bump()
        }).catch(function (err) { notify('改不了这条标记: ' + ((err && err.message) || String(err))) })
      }
      /** Copy a mark's text to the clipboard, with a fallback for a non-secure context. */
      /* STALE-PURE-START */
      /**
       * The text 【恢复原文】 writes: the text this mark remembered, spliced in at the range the mark
       * has RIGHT NOW — which is exactly where its orange band is drawn, so this is WYSIWYG. Returns
       * null when the range already holds that text, so the caller can say so instead of writing the
       * file again. Pure (no refs, no state), and the suite drives it directly.
       */
      function staleRestoreText(text, m) {
        const src = String(text === undefined || text === null ? '' : text)
        const saved = String((m && m.text) || '')
        if (saved === '') return null
        const lines = src.split(String.fromCharCode(10))
        const offsets = [0]
        for (let i = 0; i < lines.length; i++) offsets.push(offsets[i] + lines[i].length + 1)
        const clampLine = function (ln) { return Math.min(Math.max(1, Math.round(Number(ln)) || 1), lines.length) }
        const at = function (ln, col) {
          const L = clampLine(ln)
          const c = Math.min(Math.max(0, Math.round(Number(col)) || 0), lines[L - 1].length)
          return offsets[L - 1] + c
        }
        const a = at(m && m.startLine, m && m.startCol)
        const b = at(m && m.endLine, m && m.endCol)
        const lo = Math.min(a, b), hi = Math.max(a, b)
        if (src.slice(lo, hi) === saved) return null
        return src.slice(0, lo) + saved + src.slice(hi)
      }
      /* STALE-PURE-END */
      /**
       * 【恢复原文】: write the text this mark remembered back where the mark now is. The host
       * re-anchors on every save, so bringing the text back is what clears `stale` — and it IS an
       * edit of the note, which is the point of the button (git keeps the previous state).
       */
      function restoreStaleText(m) {
        if (!m || !m.id) return
        const next = staleRestoreText(String(textRef.current || ''), m)
        setMcard(null)
        if (next === null) { notify('这段原文已经在原位了，没有要改的'); return }
        setBusy('恢复原文')
        host.call('saveText', { text: next, baseRevision: revRef.current, sessionId: sidRef.current }).then(function (r) {
          setBusy('')
          if (r && r.conflict) { notify('笔记已被外部改动，本次未写入；请先[重载]再试'); return }
          if (r && r.ok) {
            revRef.current = r.revision
            textRef.current = next
            setSt(function (prev) { return prev ? Object.assign({}, prev, { text: next, revision: r.revision, lineCount: r.lineCount, selections: r.selections, savedAt: r.savedAt }) : prev })
            if (!dirtyRef.current) { draftRef.current = next; setDraft(next) }
            bump()
            notify('已把这段原文写回去，标记回到原位')
            return
          }
          notify('恢复原文失败: ' + ((r && r.error) || '未知错误'))
        }).catch(function (err) { setBusy(''); notify('恢复原文失败: ' + ((err && err.message) || String(err))) })
      }
      /**
       * 【确认变动】: accept the note as it stands. The mark keeps its range, adopts the text under
       * it and stops being `stale`. The note itself is NOT touched.
       */
      function confirmStaleMark(m) {
        if (!m || !m.id) return
        setMcard(null)
        setBusy('确认中')
        host.call('confirmSelection', { sessionId: sidRef.current, id: m.id }).then(function (r) {
          setBusy('')
          if (r && r.ok) {
            revRef.current = r.revision
            setSt(function (prev) { return prev ? Object.assign({}, prev, { revision: r.revision, selections: r.selections }) : prev })
            bump()
            notify('已确认：这条标记就盖住现在这段文字')
            return
          }
          notify('确认失败: ' + ((r && r.error) || '未知原因'))
        }).catch(function (err) { setBusy(''); notify('确认失败: ' + ((err && err.message) || String(err))) })
      }
      function copyMarkText(m) {
        const text = String((m && m.text) || '')
        if (text === '') { notify('这条标记没有文字'); return }
        const done = function () { notify('已复制这条标记的文字') }
        const fail = function () {
          try {
            const ta = document.createElement('textarea')
            ta.value = text
            ta.style.position = 'fixed'
            ta.style.left = '-9999px'
            document.body.appendChild(ta)
            ta.select()
            const ok = document.execCommand && document.execCommand('copy')
            ta.remove()
            if (ok) { done(); return }
          } catch (err) { }
          notify('复制失败，请手动选择')
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done).catch(fail); return }
        } catch (err) { }
        fail()
      }
      /** Open the remark editor for a mark from the function card. */
      function remarkFromCard(m) {
        if (!m || !m.id) return
        setRemarkDraft(m.remark || '')
        setRemarkFor({ id: m.id })
        setMcard(null)
      }
      /** Inline Markdown for a mark row's remark (bold/code/links), one line at a time. */
      function mdInline(text) {
        const lines = String(text == null ? '' : text).split(String.fromCharCode(10))
        const out = []
        for (let i = 0; i < lines.length; i++) {
          if (i) out.push(h('br', { key: 'br' + i }))
          const kids = renderTokens(withBase(inlineTokens(lines[i]), 0), 'sel' + i + '_')
          for (let k = 0; k < kids.length; k++) out.push(kids[k])
        }
        return out
      }
      /**
       * Re-read the note from disk (after the agent, or an editor, changed it).
       *
       * The reader must stay where they were reading: the line AND the text of that line are
       * captured before the reload and handed to the same restore path a note switch uses, so a
       * small drift (the agent inserted a paragraph above) is re-anchored by text instead of
       * dropping the reader at the top.
       */
      function doReload() {
        const fromLine = topVisibleLine()
        const keepLine = Math.max(1, fromLine || 1)
        const keepAnchor = fromLine ? anchorOfLine(fromLine) : ''
        const keepTop = bodyRef.current ? bodyRef.current.scrollTop : 0
        host.call('reload', {}).then(function (r) {
          if (r && r.ok) {
            revRef.current = r.revision; textRef.current = r.text
            setSt(r); draftRef.current = r.text; setDraft(r.text)
            setDirty(false); dirtyRef.current = false
            // The text is new but the position is the old one: queue it as a pending view and let
            // the measuring pass place it (it clamps, and re-anchors by the line's text).
            pendingViewRef.current = { line: keepLine, anchor: keepAnchor, tries: 0, top: keepTop }
            bump()
            notify('已重载磁盘内容（保持在第 ' + keepLine + ' 行附近）')
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
        const edge = host.scrollTop + 4
        const pick = function (bands) {
          let best = 0, bestTop = Infinity
          for (let i = 0; i < bands.length; i++) {
            const b = bands[i]
            if (!b || b.bottom < edge) continue
            if (b.top < bestTop) { bestTop = b.top; best = b.line }
          }
          return best
        }
        const cached = pick(lineBands().bands)
        if (cached) return cached
        // The band cache is keyed by the geometry version, so a click landing between a scroll
        // and the render that follows it can read a set that no longer covers the viewport —
        // that miss made the caret land on line 1 instead of the paragraph being read
        // ("编辑功能定位仍有问题"). Re-measure the mounted lines directly; one pass, only on the
        // rare miss, and the answer is exact instead of empty.
        const keys = Object.keys(lineEls.current)
        const o = bodyOrigin()
        const fresh = []
        for (let i = 0; i < keys.length; i++) {
          const el = lineEls.current[keys[i]]
          if (!el || !el.isConnected) continue
          const r = el.getBoundingClientRect()
          if (r.height <= 0) continue
          fresh.push({ line: Number(keys[i]), top: r.top - o.top, bottom: r.bottom - o.top })
        }
        return pick(fresh)
      }
      function saveViewNow() {
        if (Date.now() < jumpWindowUntilRef.current) return
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
        // Measure the target LIVE from the DOM, never from the cached bands. That cache is keyed by
        // the card geometry, so it goes stale the moment content above grows (an image finishing, a
        // table changing height, a block leaving edit mode) and the computed offset then points tens
        // of lines too far: the toast says 已跳到第 211 行 and the card shows 7.1. The hit test was
        // fixed this way (9377797); this path still trusted the cache.
        let top = null
        const hostRect = host.getBoundingClientRect()
        for (let probe = line; probe <= Math.min(lines.length, line + 30) && top === null; probe++) {
          const el = lineEls.current[probe]
          if (!el || !el.isConnected) continue
          const r = el.getBoundingClientRect()
          if (r.height > 0) top = host.scrollTop + (r.top - hostRect.top)
        }
        if (top === null) {
          // Not measured yet (the blocks render before the bands exist). Give the geometry
          // a few more chances as it bumps, then give up rather than fight the reader — but a
          // reload knows the pixel offset it was at, so that is used as the last resort instead
          // of leaving the reader at the top.
          p.tries = (p.tries || 0) + 1
          if (p.tries > 12) {
            pendingViewRef.current = null
            if (typeof p.top === 'number' && isFinite(p.top)) {
              host.scrollTop = Math.max(0, p.top)
              viewSavedRef.current = { line: line, note: String(noteNameRef.current || '') }
            }
          }
          return
        }
        pendingViewRef.current = null
        host.scrollTop = Math.max(0, top - 16)
        viewSavedRef.current = { line: line, note: String(noteNameRef.current || '') }
      }
      function clearMarks() {
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
          notify('已清空全部标记')
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
        // The [编辑] button carries no position, so it opens at the line the reader is
        // looking at — entering the editor used to jump to the top of the note.
        caretRef.current = pt || { line: Math.max(1, topVisibleLine() || 1), col: 0 }
        dirtyRef.current = false; setDirty(false); setMode('edit')
      }
      /** Line height of the plain editor, measured (the estimate used to be a flat 20px). */
      function editLineHeight(ta) {
        try { const lh = parseFloat(window.getComputedStyle(ta).lineHeight); if (lh > 4) return lh } catch (err) { }
        return 20
      }
      /**
       * A hidden div that wraps exactly like the textarea. Line numbers are LOGICAL lines while
       * the editor soft-wraps, so `(line - 1) * lineHeight` lands nowhere near a paragraph that
       * contains wrapped rows — reported as "编辑功能不能定位到当前阅读的段落". Measuring the
       * text of the lines above the target is the only honest way to know where it starts.
       */
      function editorMirror(ta) {
        const cs = window.getComputedStyle(ta)
        const d = document.createElement('div')
        d.setAttribute('data-dn-mirror', '')
        d.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:' + (cs.whiteSpace || 'pre-wrap') + ';'
          + 'overflow-wrap:' + (cs.overflowWrap || 'break-word') + ';word-break:' + (cs.wordBreak || 'break-word') + ';'
          + 'box-sizing:' + cs.boxSizing + ';width:' + ta.clientWidth + 'px;'
          + 'padding:' + cs.padding + ';border:' + cs.borderWidth + ' solid transparent;'
          + 'font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight + ';'
          + 'font-style:' + cs.fontStyle + ';letter-spacing:' + cs.letterSpacing + ';line-height:' + cs.lineHeight + ';'
        document.body.appendChild(d)
        return d
      }
      /** Pixel offset of the START of `line` inside the editor's scroll space. */
      function editorOffsetOfLine(mirror, text, line) {
        const lines = String(text == null ? '' : text).split(String.fromCharCode(10))
        const before = lines.slice(0, Math.max(0, line - 1)).join(String.fromCharCode(10))
        mirror.textContent = before === '' ? '' : before + String.fromCharCode(10)
        let padTop = 0
        try { padTop = parseFloat(window.getComputedStyle(mirror).paddingTop) || 0 } catch (err) { }
        return Math.max(0, mirror.offsetHeight - padTop)
      }
      /** The logical line whose text sits at `px` inside the editor's scroll space. */
      function editorLineAtOffset(mirror, text, px) {
        const total = String(text == null ? '' : text).split(String.fromCharCode(10)).length
        let lo = 1, hi = total, best = 1
        while (lo <= hi) {
          const mid = (lo + hi) >> 1
          if (editorOffsetOfLine(mirror, text, mid) <= px + 2) { best = mid; lo = mid + 1 } else hi = mid - 1
        }
        return best
      }
      /** Leave the editor and put the reader back where the editor was scrolled to. */
      function finishEdit() {
        const ta = editorRef.current
        if (ta) {
          // Binary search over the mirror instead of dividing by the line height: the editor
          // soft-wraps, so the pixel offset of a line is not a multiple of one row.
          let line = 1
          try {
            const mirror = editorMirror(ta)
            line = editorLineAtOffset(mirror, draftRef.current, ta.scrollTop + 24)
            mirror.remove()
          } catch (err) { line = Math.max(1, Math.round(ta.scrollTop / editLineHeight(ta)) + 1) }
          // Reuses the reading-position restore path: it already waits for the line to be
          // measured after the mode switch and then scrolls the body.
          pendingViewRef.current = { line: line, anchor: '', tries: 0 }
        }
        return flush(true).then(function () { setMode('read') })
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
            // Where the line really starts, measured through a mirror div: the editor wraps, so
            // (line - 1) * lineHeight would land hundreds of lines away from a wrapped
            // paragraph — "编辑功能不能定位到当前阅读的段落".
            let top = null
            try {
              const mirror = editorMirror(ta)
              top = editorOffsetOfLine(mirror, draftRef.current, pt.line)
              mirror.remove()
            } catch (err) { top = null }
            if (top === null) top = (pt.line - 1) * editLineHeight(ta)
            ta.scrollTop = Math.max(0, top - 24)
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
        // window.setTimeout, not ctx.timeout: the project has already been bitten by a cordis
        // timer that never fired from a React callback. This one is the silent auto-save, so a
        // timer that quietly does nothing would look like "my edits were lost".
        if (saveTimer.current) { try { window.clearTimeout(saveTimer.current) } catch (err) { } saveTimer.current = 0 }
        saveTimer.current = window.setTimeout(function () { saveTimer.current = 0; flush(true) }, 900)
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
        // A press that has NOT MOVED is not a drag. Touch has its own slop rules below, but a mouse
        // or trackpad press with a pixel of tremor used to fall straight through to scheduleLive() —
        // re-seeding the selection from wherever that pixel landed. If it landed on a blank line or
        // inside a table, the seed took the WHOLE BLOCK (see the block flag in the press timer),
        // which is exactly the reported "长按不拖动，松手却自动选中一大片，且不可预测". Six pixels
        // separates tremor from intent; real drags extend as before.
        if (!isTouch && Math.abs(p0.x - d.x) + Math.abs(p0.y - d.y) < 6) return
        if (d.unit && d.unit !== 'block' && isTouch) {
          const dx = Math.abs(p0.x - d.x)
          const dy = Math.abs(p0.y - d.y)
          if (dy > UNIT_SLOP_Y || dx <= UNIT_SLOP_X) return
        }
        // The content scrolled since this gesture's unit was created, so the line under the
        // pointer is no longer the line the user pointed at. A one-pixel nudge must not be
        // read as "drag across the document" — that is the other half of "长按不拖动，却自动
        // 框选了一大片，且相当不可控". A deliberate move (>24px) re-arms the extension.
        if (!isTouch && d.stamp !== scrollStampRef.current) {
          if (Math.abs(p0.x - d.x) + Math.abs(p0.y - d.y) < 24) return
          d.stamp = scrollStampRef.current
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
        drag.current = { mode: 'press', x: e.clientX, y: e.clientY, pt: pt, stamp: scrollStampRef.current }
        setPressing(true)
        if (lpTimer.current) { lpTimer.current(); lpTimer.current = null }
        lpTimer.current = ctx.timeout(function () {
          lpTimer.current = null
          const d = drag.current
          if (!d || !d.pt || d.mode !== 'press') return
          // The CONTENT moved under the cursor while the press was pending (a wheel, a
          // momentum scroll, an image that finished loading and pushed the text down). The
          // stored line/column then describes a position that is no longer under the pointer,
          // so continuing would select a passage the user never pointed at — that is one half
          // of "长按不拖动却框选了一大片". Drop the gesture instead of guessing.
          if (d.stamp !== scrollStampRef.current) { drag.current = null; setPressing(false); return }
          d.mode = 'drag'
          navGuardRef.current = true
          // Marks this gesture as "one unit, not a free range" — see onDragMove.
          d.unit = 'block'
          // A line with no character boxes cannot be word-selected, and line/column maths
          // cannot express "this whole block" (only the first line owns a rendered element).
          // Two very different cases used to share one answer, and that is what made a long
          // press select "a lot of text, uncontrollably":
          //   * a blank line or an --- rule INSIDE a code block or a table: blockRangeAt()
          //     answers with the ENTIRE block, so pressing a blank line selected the whole
          //     listing. The line itself has neighbours that ARE selectable — use the nearest
          //     one and word-select there, which is small and predictable.
          //   * a diagram or image: nothing in the whole block is selectable, so the block
          //     really is the unit and the flag is the only way to express it.
          let boxed = d.pt.line
          const cells0 = cellsOf(boxed).cells
          if (!cells0.length) {
            const blk = blockRangeAt(d.pt.line)
            const from = blk ? blk.from : d.pt.line
            const to = blk ? blk.to : d.pt.line
            let found = 0
            for (let probe = d.pt.line; probe <= to && !found; probe++) if (cellsOf(probe).cells.length) found = probe
            for (let probe = d.pt.line - 1; probe >= from && !found; probe--) if (cellsOf(probe).cells.length) found = probe
            if (!found) {
              setLive({ a: { line: from, col: 0 }, f: { line: from, col: 0 }, block: true })
              return
            }
            boxed = found
            d.pt = { line: found, col: 0 }
          }
          const w = wordRange(d.pt)
          const a = Math.min(w.from, w.to), f = Math.max(w.from, w.to)
          // An image's own source range is a unit too (`snapCol` would otherwise collapse
          // it to a zero-width range as the finger drifts), a word is as well.
          d.unit = cellsOf(boxed).cells.length === 1 && cellsOf(boxed).cells[0].img ? 'image' : 'word'
          setLive({ a: { line: boxed, col: snapCol(boxed, a) }, f: { line: boxed, col: snapCol(boxed, f) } })
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
      /**
       * A single click on a marked passage: raise the function card, and bring the mark list to
       * that mark whenever the list is on screen (or when the switch says it may be summoned).
       *
       * Everything that is not a plain tap is left alone: a long press already turned into a live
       * selection (and its click is swallowed by the capture handler above), a drag is a scroll,
       * a second click is the start of a double click (which edits the block), and buttons,
       * links and inputs keep their own behaviour.
       */
      function onBodyClick(e) {
        if (mode !== 'read') return
        if (e.button !== undefined && e.button !== 0) return
        if (live) return
        const tap = tapRef.current
        tapRef.current = null
        if (!tap) return
        if (Math.abs(e.clientX - tap.x) + Math.abs(e.clientY - tap.y) > 12) return
        const tgt = e.target
        if (tgt && tgt.closest && tgt.closest('button,a,input,textarea,select,.dn-bar,.dn-handle')) return
        if (mcardTimerRef.current !== null) {
          // The second click of a double click: cancel the card and let the editor open.
          try { window.clearTimeout(mcardTimerRef.current) } catch (err) { }
          mcardTimerRef.current = null
          setMcard(null)
          return
        }
        const m = markAtEvent(e)
        if (!m) { setMcard(null); return }
        // Tapping the same mark again closes its card (one click does one thing).
        if (mcard && mcard.id === m.id) { setMcard(null); return }
        const x = e.clientX
        const y = e.clientY
        mcardTimerRef.current = window.setTimeout(function () {
          mcardTimerRef.current = null
          const at = cardPoint(x, y)
          setMcard({ id: m.id, x: at.x, y: at.y })
          revealMarkInList(m)
        }, 210)
      }
      /**
       * A click on a link inside the note.
       *
       * An online link keeps its normal behaviour. A LOCAL reference is followed into the mirror:
       * a relative `.md` becomes (or reopens) a note that shares the same asset root, so a
       * mirrored folder reads as a whole — `[详解](知识库/Spring-IoC与Bean详解.md)` opens that
       * document instead of navigating the browser to a path that does not exist. Anything else
       * local (an image, a pdf) says what it is rather than 404-ing the page.
       */
      function onBodyLinkClick(e) {
        if (e.defaultPrevented) return
        const a = e.target && e.target.closest ? e.target.closest('a') : null
        if (!a) return
        const href = String(a.getAttribute('href') || '')
        // A pure fragment (`#第三章`, `#1-spring-ai-与-langchain4j…`) is a link inside THIS
        // document: the host resolves it against the note's own headings and HTML anchors and asks
        // the card to move there. It used to fall through to the browser, which has no such id in
        // the page and therefore did nothing at all — "不会跳转".
        const fragmentOnly = href.charAt(0) === '#'
        if (href === '' || (!fragmentOnly && !isLocalRef(href))) return
        e.preventDefault()
        e.stopPropagation()
        host.call('openMirrorDoc', { sessionId: sidRef.current, href: href, hint: String((a && a.textContent) || '').trim().slice(0, 80) }).then(function (r) {
          if (r && r.ok) {
            // An anchor link (Typora's table of contents) opens the note AND lands on the heading:
            // the host has already set the view jump, so the card moves on the next poll.
            const jump = r.line > 0 ? ('，已跳到第 ' + r.line + ' 行') : ''
            const head = r.existed ? ('已切到《' + r.note + '》') : ('已跟随链接打开《' + r.note + '》（已连带注册笔记）')
            if (r.error) notify(head + jump + ' —— ' + r.error)
            else notify(head + jump)
            refreshNotes()
          } else notify('跟不了这个链接：' + ((r && r.error) || '未知原因'))
        }).catch(function (err) { notify('跟不了这个链接: ' + ((err && err.message) || String(err))) })
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
      function cycleSize(want) {
        setLayout(function (prev) {
          const ids = SIZES.map(function (s) { return s.id })
          if (typeof want === 'string' && ids.indexOf(want) >= 0) {
            const picked = SIZES[ids.indexOf(want)]
            return Object.assign({}, prev, { size: picked.id, w: picked.w })
          }
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
        // The pill can be dragged out of the way (a phone's bottom corner is exactly where the
        // browser chrome and the thumb live). A tap still expands the card: the drag only takes
        // over after a few pixels of movement. The parked position applies to the COMPACT layout;
        // on desktop the pill keeps its designed corner.
        const parked = geo.compact && pillPos ? pillPos : null
        const pillBox = geo.compact ? 44 : 34
        const pillShift = function (e, dx, dy) {
          const vw = bounds.w || 400
          const vh = bounds.h || 800
          const w = e && e.currentTarget ? e.currentTarget.offsetWidth : 96
          const hh = e && e.currentTarget ? e.currentTarget.offsetHeight : pillBox
          return {
            x: clamp(dx, 6, Math.max(6, vw - w - 6)),
            y: clamp(dy, 6, Math.max(6, vh - hh - 6)),
          }
        }
        return h('button', {
          className: 'dn-pill', title: '展开笔记卡片（可拖动）', 'data-note-pill': '',
          'data-dragged': pillPos ? '1' : '0',
          style: parked ? { left: parked.x + 'px', top: parked.y + 'px', right: 'auto', bottom: 'auto' } : undefined,
          onPointerDown: function (e) {
            const el = e.currentTarget
            const r = el.getBoundingClientRect()
            pillMovedRef.current = false
            pillDragRef.current = { x0: e.clientX, y0: e.clientY, w: r.width, h: r.height, x: r.left, y: r.top, moved: false, id: e.pointerId }
            el.setAttribute('data-drag', '1')
            try { el.setPointerCapture(e.pointerId) } catch (err) { }
          },
          onPointerMove: function (e) {
            const d = pillDragRef.current
            if (!d) return
            const dx = e.clientX - d.x0
            const dy = e.clientY - d.y0
            if (!d.moved && Math.abs(dx) + Math.abs(dy) < 6) return
            d.moved = true
            pillMovedRef.current = true
            const at = pillShift(e, d.x + dx, d.y + dy)
            setPillPos(at)
          },
          onPointerUp: function (e) {
            const d = pillDragRef.current
            pillDragRef.current = null
            const el = e && e.currentTarget
            if (el && el.removeAttribute) el.removeAttribute('data-drag')
            if (!d || !d.moved) return            // a tap: the click handler expands the card
            const dx = e.clientX - d.x0
            const dy = e.clientY - d.y0
            const at = pillShift(e, d.x + dx, d.y + dy)
            setPillPos(at)
            writePillPos(at)
          },
          onPointerCancel: function (e) {
            pillDragRef.current = null
            if (e && e.currentTarget && e.currentTarget.removeAttribute) e.currentTarget.removeAttribute('data-drag')
          },
          // A drag must not also expand the card: the browser still fires a click after it.
          onClick: function () { if (pillMovedRef.current) { pillMovedRef.current = false; return } setHidden(false) },
          onDoubleClick: function (e) { e.stopPropagation() },
        }, [
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
      // The italic/underline marks expanded to source columns, per line. Cached against the
      // selection revision: renderTokens() asks one line at a time, and rebuilding the whole
      // table per span would make every render of a long note quadratic.
      // (The ref itself is created with the other refs at the top: hooks may not run after the
      // early return below, so nothing here may open a new hook.)
      function styleRunsFor(line) {
        const cur = stRef.current
        const sels = cur && cur.selections ? cur.selections : []
        const text = String(textRef.current || '')
        const key = styleKeyOf(cur) + '|' + text.length
        const cache = styleRunsRef.current
        if (cache.key !== key) {
          cache.key = key
          cache.byLine = textStyleRuns(sels).byLine
        }
        return cache.byLine[line] || null
      }
      function renderTokens(toks, keyPrefix, line) {
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
            const inner = renderTokens(inlineTokens(tk.t).map(function (x) { x.base = tk.base + tk.inner; return x }), keyPrefix + 'h' + i + '_', line)
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
          // A link's LABEL is inline Markdown too: `[**缺页中断**](url)` has to render bold
          // inside the anchor. It used to be emitted as one literal text token, so the
          // asterisks showed up verbatim in the card.
          if (tk.k === 'link') {
            props.href = tk.href || '#'
            props.target = '_blank'
            props.rel = 'noreferrer'
            const kids = tk.kids && tk.kids.length ? renderTokens(withBase(tk.kids, tk.base || 0), keyPrefix + 'lk' + i + '_', line) : tk.t
            out.push(h('a', props, kids))
            continue
          }
          // Marks that draw themselves in the text. A text span covered by an italic or
          // underlined mark is split at the run boundaries, so every character carries exactly
          // the styles over it (two overlapping marks stack instead of one winning) and the
          // segment knows which mark it belongs to — that is what a single click looks up.
          const text = tk.t === undefined || tk.t === null ? '' : String(tk.t)
          const segs = line === undefined ? null : textStyleSegments(styleRunsFor(line), (tk.base || 0) + tk.off, text.length)
          if (segs === null) { out.push(h('span', props, tk.t)); continue }
          for (let k = 0; k < segs.length; k++) {
            const sg = segs[k]
            const sp = { className: cls.join(' ') + (sg.styles.indexOf('italic') >= 0 ? ' dn-mki' : '') + (sg.styles.indexOf('underline') >= 0 ? ' dn-mku' : ''), 'data-soff': (tk.base || 0) + tk.off + sg.off, key: props.key + '_' + k }
            if (sg.ids.length) sp['data-mkid'] = sg.ids.join(' ')
            out.push(h('span', sp, text.substr(sg.off, sg.len)))
          }
        }
        return out
      }
      function withBase(toks, base) {
        for (let i = 0; i < toks.length; i++) {
          toks[i].base = base
          // Nested tokens (a link label) carry their own offsets relative to the same line,
          // so they need the same base to keep data-soff — and therefore every geometry
          // lookup — correct inside tables and table cells.
          if (toks[i].kids && toks[i].kids.length) withBase(toks[i].kids, base)
        }
        return toks
      }
      function lineSpans(raw, base, plain, line) { return renderTokens(withBase(plain ? [{ k: 'code', t: raw, off: 0 }] : inlineTokens(raw), base), 'l' + base + '_', line) }
      function renderBlocks() {
        const sels = st.selections
        const blocks = parseBlocks(st.text)
        const out = []
        for (let bi = 0; bi < blocks.length; bi++) {
          const b = blocks[bi]
          const key = 'b' + bi
          if (editBlock && b.line === editBlock.from) {
            out.push(h('textarea', {
              // UNCONTROLLED on purpose: the card re-renders on every poll (~0.7s), and a controlled
              // value taken from a render-time snapshot reset the textarea to that snapshot on each of
              // them — you could type and delete, but what you typed was wiped before you could see it
              // ("能正常输入和删除但是显示有问题"). The buffer lives in editBlockRef, which the commit
              // reads, so nothing here needs to be controlled.
              className: 'dn-blk-editor', key: key, ref: blockEditorRef, defaultValue: editBlock.value,
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
          if (b.k === 'h') { out.push(h('div', { className: 'dn-h dn-h' + b.level, 'data-line': b.line, key: key, ref: lineElsFor(b.line) }, lineSpans(b.raw, b.base, false, b.line))); continue }
          if (b.k === 'quote') { out.push(h('div', { className: 'dn-quote', 'data-line': b.line, key: key, ref: lineElsFor(b.line) }, lineSpans(b.raw, b.base, false, b.line))); continue }
          if (b.k === 'li') {
            const marker = b.task
              ? h('span', { className: 'dn-bullet', key: 'm' }, b.checked ? '\u2611' : '\u2610')
              : h('span', { className: 'dn-bullet', key: 'm' }, b.ordered ? b.marker : '\u2022')
            out.push(h('div', { className: 'dn-li', 'data-line': b.line, key: key, ref: lineElsFor(b.line) },
              [marker, h('div', { className: 'dn-li-body', key: 'b' }, lineSpans(b.raw, b.base, false, b.line))]))
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
              rows.push(h('div', { className: 'dn-code-line', 'data-line': ln, key: 'c' + i, ref: lineElsFor(ln) }, renderTokens(withBase(hlTokens(b.body[i], lang), 0), 'c' + ln + '_', ln)))
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
                }, lineSpans(txt, base, false, row.line)))
              }
              rows.push(h('tr', { className: 'dn-tr', 'data-line': row.line, key: 'r' + ri, ref: lineElsFor(row.line) }, kids))
            }
            out.push(h('div', { className: 'dn-twrap', key: key, 'data-dn-table': '', title: '可左右滑动查看完整表格' }, [h('table', { className: 'dn-table', key: 't' }, [h('tbody', { key: 'b' }, rows)])]))
            continue
          }
          out.push(h('div', { className: 'dn-p', 'data-line': b.line, key: key, ref: lineElsFor(b.line) }, lineSpans(b.raw, b.base, false, b.line)))
        }
        return out
      }
      // Hand-rolled cache instead of useMemo: renderBlocks() has to run here and
      // not earlier, because it closes over consts initialised above but used far
      // below, and a hook added at this point would change the hook order between
      // renders (which unmounts the whole card). Reusing the element objects makes
      // React bail out of those subtrees, so a pointermove-driven live selection
      // re-renders only the overlay/handle layer — the mobile-jank fix.
      const blocksKey = (st ? st.text : '') + '|' + mode + '|' + (editBlock ? editBlock.from + ':' + editBlock.to : '') + '|' + styleKeyOf(st)
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
          // An italic / underlined mark draws itself in the glyphs (see renderTokens), so it
          // gets no wash behind it — but a mark with a colour AND a style gets both: the wash
          // stays unless the colour is `none`.
          if (markColor(s) === 'none') continue
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
          layFront.push(h('div', { className: 'dn-bar', key: 'bar', ref: barRef, style: { left: Math.max(6, anchor.x - 10 - barShift) + 'px', top: barTop + 'px', pointerEvents: ovPe } }, [
            // Left group = HOW this mark looks (colour + the two text styles, all combinable),
            // right group = what to DO with the selection. Two groups, one divider: the bar used
            // to be one long row with the style buttons stranded at the far right, past 取消.
            h('span', { className: 'dn-bar-group', key: 'look' }, [
              h('span', { className: 'dn-pen', key: 'pen' }, [
                h('button', { className: 'dn-pen-sw', key: 'cur', 'data-c': penColor, 'data-on': 'true', title: '本次底色（默认黄；none = 不铺底）', onPointerDown: press(function () { setPenOpen(!penOpen) }), onClick: tap(function () { setPenOpen(!penOpen) }) }),
                penOpen ? h('span', { className: 'dn-pen-pop', key: 'pop' }, PEN_COLORS.map(function (c) {
                  return h('button', { className: 'dn-pen-sw', key: c, 'data-c': c, title: c === 'none' ? '无色（不铺底）' : c, 'data-on': c === penColor ? 'true' : 'false', onPointerDown: press(function () { setPenColor(c); writePenColor(c); setPenOpen(false) }), onClick: tap(function () { setPenColor(c); writePenColor(c); setPenOpen(false) }) })
                })) : null,
              ]),
              // The two text styles, as independent toggles: they combine with each other and with
              // any colour, and they are chosen HERE (before the mark exists) rather than only
              // being fixable afterwards.
              h('button', {
                className: 'dn-pen-sw', key: 'it', 'data-c': 'italic', 'data-on': penItalic ? 'true' : 'false',
                title: '本次标记用斜体（可与颜色、下划线叠加）',
                onPointerDown: press(function () { setPenItalic(!penItalic) }),
                onClick: tap(function () { setPenItalic(!penItalic) }),
              }, 'I'),
              h('button', {
                className: 'dn-pen-sw', key: 'ul', 'data-c': 'underline', 'data-on': penUnderline ? 'true' : 'false',
                title: '本次标记用下划线（可与颜色、斜体叠加）',
                onPointerDown: press(function () { setPenUnderline(!penUnderline) }),
                onClick: tap(function () { setPenUnderline(!penUnderline) }),
              }, 'U'),
            ]),
            h('span', { className: 'dn-bar-sep', key: 'sep' }),
            h('button', { key: 'copy', 'data-act': 'copy', onPointerDown: press(function () { copyText(liveText()).then(function (ok) { notify(ok ? '已复制' : '复制失败') }) }), onClick: tap(function () { copyText(liveText()).then(function (ok) { notify(ok ? '已复制' : '复制失败') }) }) }, '复制'),
            // [选中]: a short press commits the selection exactly as before, a LONG press opens
            // the remark input instead (write a note about the passage, then commit both).
            // Acting on pointerup rather than on pointerdown is what makes both paths work:
            // `press()` marks the press as handled, which would swallow the click that follows
            // a short tap, so a short tap would commit nothing at all.
            h('button', {
              key: 'pick', 'data-act': 'pick', 'data-long': '备注',
              title: '标记（长按可加备注）',
              onPointerDown: function (e) {
                if (e) { if (e.stopPropagation) e.stopPropagation(); if (e.preventDefault) e.preventDefault() }
                if (remarkTimerRef.current !== null) { try { window.clearTimeout(remarkTimerRef.current) } catch (err) { } remarkTimerRef.current = null }
                remarkTimerRef.current = window.setTimeout(function () {
                  remarkTimerRef.current = null
                  actedRef.current = Date.now()   // the click that follows must not also commit
                  setRemarkDraft('')
                  setRemarkFor({ live: true })
                }, REMARK_HOLD_MS)
              },
              onPointerUp: function () {
                const pending = remarkTimerRef.current !== null
                if (pending) { try { window.clearTimeout(remarkTimerRef.current) } catch (err) { } remarkTimerRef.current = null }
                if (pending) { actedRef.current = Date.now(); hideBar(); commitLive('') }
              },
              onPointerLeave: function () { if (remarkTimerRef.current !== null) { try { window.clearTimeout(remarkTimerRef.current) } catch (err) { } remarkTimerRef.current = null } },
              onPointerCancel: function () { if (remarkTimerRef.current !== null) { try { window.clearTimeout(remarkTimerRef.current) } catch (err) { } remarkTimerRef.current = null } },
              onClick: tap(function () { hideBar(); commitLive('') }),
            }, '标记'),
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
      /** Walk the visit history: -1 back, +1 forward. */
      function navGo(delta) {
        const nav = navRef.current
        const at = nav.at + delta
        if (at < 0 || at >= nav.list.length) { notify(delta < 0 ? '没有更早的笔记了' : '没有更晚的笔记了'); return }
        nav.at = at
        const entry = nav.list[at]
        // The recorded line is read ONLY here, and it outranks the host view and the browser
        // mirror for the note being entered (applyState checks navPendRef). Ordinary opening
        // still uses the live reading position, exactly as before.
        navPendRef.current = entry.line >= 1 ? entry.name : null
        if (entry.line >= 1) {
          pendingViewRef.current = { line: entry.line, anchor: '', tries: 0 }
          jumpWindowUntilRef.current = Date.now() + 2500
        }
        if (String(entry.name) === String(noteName || '')) {
          // That note is already open (an in-note jump recorded an entry of its own): there is no
          // note change to carry the restore, so the geometry counter is bumped by hand —
          // applyPendingView runs on it. navTargetRef must not stay set for a note we never left.
          navTargetRef.current = null
          saveNavNow()
          if (entry.line >= 1) bump()
          return
        }
        navTargetRef.current = entry.name
        switchNote(entry.name)
        saveNavNow()
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
            // The switch failed, so no name change will come to consume this: leaving it set would
            // silently swallow the history entry of the next real visit to that note.
            navTargetRef.current = null
            notify((r && r.error) || '切换失败')
          }).catch(function (err) { navTargetRef.current = null; setBusy(''); notify('切换失败: ' + err.message) })
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
      /** Import a folder: mirror it on the host, then create one note per checked .md. */
      function submitFolderImport() {
        if (noteModal && noteModal.busy) return
        const dir = String((noteModal && noteModal.dir) || '').trim()
        const picked = ((noteModal && noteModal.files) || []).filter(function (f) { return f.on === true }).map(function (f) { return f.rel || f.name })
        if (dir === '') { notify('先填一个文件夹路径'); return }
        if (!picked.length) { notify('至少勾选一个 .md'); return }
        // A big folder takes a while to mirror (26MB / 1300 files took about half a minute), so
        // the DIALOG owns the state: the button stays disabled while it runs, and the full
        // per-file report lands inside the dialog — a toast can hold one line, and it hid the
        // reason for a failure ("没有任何笔记被创建" with no explanation).
        setNoteModal(function (p) { return Object.assign({}, p, { busy: true, report: '正在镜像…（大目录可能要几十秒）' }) })
        host.call('importFolder', { sessionId: sidRef.current, dir: dir, files: picked }).then(function (r) {
          const ok = r && r.ok === true
          const head = ok
            ? ('已导入 ' + picked.length + ' 个；镜像 ' + r.files + ' 个文件 / ' + Math.round((r.bytes || 0) / 1024) + ' KB' + (r.reused ? '（复用已有素材根）' : ''))
            : ('导入失败：' + ((r && r.error) || '未知原因'))
          setNoteModal(function (p) { return Object.assign({}, p, { busy: false, report: head + '\n' + String((r && r.created) || '') }) })
          if (ok) refreshNotes()
          else notify(head)
        }).catch(function (err) {
          const msg = '导入失败: ' + ((err && err.message) || String(err))
          setNoteModal(function (p) { return Object.assign({}, p, { busy: false, report: msg }) })
          notify(msg)
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
        // One button instead of a select plus five buttons: the row used to wrap onto two lines
        // at the standard width, and every one of those actions is occasional.
        h('button', {
          className: 'dn-notes-pick', key: 'pick', type: 'button', 'data-menu-opener': 'notes',
          title: '切换笔记 / 新建 / 导入 / 重命名 / 清空 / 删除',
          onClick: function (e) { e.stopPropagation(); openMenu('notes', e) },
        }, [
          h('span', { className: 'dn-notes-name', key: 'n' }, notes.length ? noteName : '本会话还没有笔记'),
          h('span', { className: 'dn-notes-count', key: 'c' }, notes.length ? (notes.length + ' 份 · ' + st.lineCount + ' 行') : ''),
          h('span', { className: 'dn-caret', key: 'v' }, '▾'),
        ]),
        st.commitHash ? h('span', { className: 'dn-notes-hash', key: 'h', title: '当前笔记的 git 提交' }, st.commitHash) : null,
        (function () {
          const mine = (notes || []).filter(function (x) { return x.name === noteName })[0]
          return mine && mine.dirty === true ? h('span', { className: 'dn-notes-dirty', key: 'dirty', title: '这份笔记有改动还没提交（菜单里可以提交）' }, '未提交') : null
        })(),
      ])
      // The remark input: opened by a long press on [选中] (the selection is still live, so
      // saving commits it WITH the remark in one call), or from a panel row to edit what is
      // already there.
      const remarkEditing = remarkFor && !remarkFor.live
      const remarkEl = remarkFor ? h('div', { className: 'dn-remark', key: 'remark' }, [
        h('div', { className: 'dn-remark-title', key: 't' }, remarkEditing
          ? '这条标记的备注（清空即删除备注）'
          : '给这段标记写个备注（可留空，直接点[标记并保存]）'),
        h('textarea', {
          className: 'dn-remark-input', key: 'i', ref: remarkInputRef, value: remarkDraft,
          placeholder: '例如：这里我总记混，面试被问到要提一下…',
          onPointerDown: function (e) { e.stopPropagation() },
          onChange: function (e) { setRemarkDraft(e.target.value) },
          onKeyDown: function (e) {
            if (e.key === 'Escape') { e.preventDefault(); closeRemark() }
            else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); applyRemark() }
          },
        }),
        h('div', { className: 'dn-remark-row', key: 'r' }, [
          h('span', { className: 'dn-remark-hint', key: 'h' }, 'Ctrl/⌘+Enter 保存 · Esc 取消'),
          h('button', { key: 'c', 'data-act': 'cancel', type: 'button', onClick: function () { closeRemark() } }, '取消'),
          h('button', { key: 's', 'data-act': 'save', type: 'button', onClick: function () { applyRemark() } }, remarkEditing ? '保存备注' : '标记并保存'),
        ]),
      ]) : null
      const folderModal = noteModal && noteModal.kind === 'folder'
      const modalEl = noteModal ? h('div', { className: 'dn-modal', key: 'modal' }, [
        h('div', { className: 'dn-modal-box', key: 'box' }, [
          h('div', { className: 'dn-modal-title', key: 't' }, folderModal ? '从文件夹导入（整目录镜像）'
            : (noteModal.kind === 'create' ? '新建笔记' : (noteModal.kind === 'import' ? '导入到《' + noteName + '》' : '重命名《' + noteName + '》'))),
          folderModal ? h('div', { className: 'dn-dirline', key: 'dir' }, [
            h('input', {
              className: 'dn-modal-input', key: 'd', placeholder: '文件夹绝对路径，例如 D:/notes/linux',
              value: noteModal.dir || '',
              onChange: function (e) { const v = e.target.value; setNoteModal(function (p) { return Object.assign({}, p, { dir: v, files: [] }) }) },
            }),
            h('button', {
              className: 'dn-mini', key: 'pick', type: 'button', title: '让 host 弹出系统目录选择框',
              onClick: function () {
                notify('正在打开目录选择框…')
                host.call('pickFolder', {}).then(function (r) {
                  if (r && r.ok && r.dir) setNoteModal(function (p) { return Object.assign({}, p, { dir: r.dir, files: [] }) })
                  else notify((r && r.error) || '没有选择目录')
                }).catch(function (err) { notify('目录选择失败: ' + ((err && err.message) || String(err))) })
              },
            }, '选择文件夹…'),
            h('button', {
              className: 'dn-mini', key: 'scan', type: 'button', title: '列出这个目录里的 .md',
              onClick: function () {
                const dir = String(noteModal.dir || '').trim()
                if (dir === '') { notify('先填一个文件夹路径'); return }
                host.call('scanFolder', { sessionId: sidRef.current, dir: dir }).then(function (r) {
                  if (!r || !r.ok) {
                    // 不存在时把"你是不是想要…"带出来：一个字符之差的目录名，肉眼对不出来。
                    const sug = r && r.suggestions && r.suggestions.dirs
                    if (sug && sug.length) {
                      setNoteModal(function (p) { return Object.assign({}, p, { suggestions: sug, suggestBase: (r.suggestions && r.suggestions.ancestor) || '', files: [] }) })
                      notify('这个路径不存在。你是不是想要：' + sug.slice(0, 3).join(' / ') + '？')
                    } else notify((r && r.error) || '扫描失败')
                    return
                  }
                  setNoteModal(function (p) {
                    return Object.assign({}, p, { files: (r.files || []).map(function (f) { return { rel: f.rel, name: f.name, size: f.size, depth: f.depth || 0, on: true } }), rootId: r.rootId, suggestions: null })
                  })
                  if (!(r.files || []).length) notify('这个目录里没有 .md 文件')
                  else {
                    const nested = (r.files || []).filter(function (f) { return (f.depth || 0) > 0 }).length
                    notify('扫到 ' + (r.files || []).length + ' 个 .md' + (nested ? '（其中 ' + nested + ' 个在子目录里）' : '') + '，默认全选')
                  }
                }).catch(function (err) { notify('扫描失败: ' + ((err && err.message) || String(err))) })
              },
            }, '扫描 .md'),
          ]) : null,
          folderModal && noteModal.suggestions && noteModal.suggestions.length ? h('div', { className: 'dn-filelist', key: 'sug' }, [
            h('div', { className: 'dn-menu-label', key: 'lbl' }, '你是不是想要这些目录（点一个直接扫描）？'),
            ...noteModal.suggestions.map(function (n) {
              return h('button', {
                className: 'dn-mcard-btn', key: n, style: { textAlign: 'left', display: 'block', width: '100%' },
                onClick: function () {
                  const full = ((noteModal.suggestBase || '').replace(/\/+$/, '') + '/' + n)
                  setNoteModal(function (p) { return Object.assign({}, p, { dir: full, suggestions: null, files: [] }) })
                  notify('已填入 ' + full + '，再点一次「扫描 .md」')
                },
              }, n)
            }),
          ]) : null,
          folderModal && noteModal.files && noteModal.files.length ? h('div', { className: 'dn-filelist', key: 'list' }, [
            h('div', { key: 'all', style: { display: 'flex', gap: '6px', alignItems: 'center', padding: '0 0 4px 0' } }, [
              h('span', { key: 'n', style: { fontSize: '11px', color: '#8a8f98' } }, '递归扫到 ' + noteModal.files.length + ' 个 .md，勾选要注册成笔记的：'),
              h('button', { key: 'y', className: 'dn-mini', type: 'button', onClick: function () { setNoteModal(function (p) { return Object.assign({}, p, { files: (p.files || []).map(function (x) { return Object.assign({}, x, { on: true }) }) }) }) } }, '全选'),
              h('button', { key: 'n2', className: 'dn-mini', type: 'button', onClick: function () { setNoteModal(function (p) { return Object.assign({}, p, { files: (p.files || []).map(function (x) { return Object.assign({}, x, { on: false }) }) }) }) } }, '全不选'),
            ]),
            ...noteModal.files.map(function (f, i) {
              const rel = String(f.rel || f.name || '')
              return h('label', { className: 'dn-filerow', key: rel + i, title: rel }, [
                h('input', {
                  key: 'c', type: 'checkbox', checked: f.on === true,
                  onChange: function () {
                    setNoteModal(function (p) {
                      const next = (p.files || []).map(function (x, k) { return k === i ? Object.assign({}, x, { on: !x.on }) : x })
                      return Object.assign({}, p, { files: next })
                    })
                  },
                }),
                h('span', { key: 'n', style: { paddingLeft: Math.min(3, f.depth || 0) * 14 + 'px' } }, rel),
                h('span', { key: 's', style: { color: '#8a8f98', marginLeft: 'auto', flex: '0 0 auto', fontSize: '11px' } }, Math.max(1, Math.round((f.size || 0) / 1024)) + 'KB'),
              ])
            }),
          ]) : null,
          folderModal ? h('div', { key: 'hint', style: { fontSize: '11px', color: '#8a8f98', lineHeight: '1.6' } },
            '整个目录会被镜像到 note/_assets/（排除 .git / node_modules / dsh-window/note 等），勾选的每个 .md 各建一份笔记并共享这一份镜像；图片按相对路径直接可用。子目录里的 .md 也会被扫出来；同名不同目录的文件会自动带上父目录名，不会互相顶掉。') : null,
          folderModal && noteModal.report ? h('pre', {
            className: 'dn-modal-report', key: 'report',
          }, noteModal.report) : null,
          folderModal ? null : (noteModal.kind === 'rename' ? null : h('input', {
            className: 'dn-modal-input', key: 'name', placeholder: '笔记名（会作为目录名）', value: noteModal.name || '',
            onChange: function (e) { const v = e.target.value; setNoteModal(function (p) { return Object.assign({}, p, { name: v }) }) },
          })),
          folderModal ? null : (noteModal.kind === 'rename' ? h('input', {
            className: 'dn-modal-input', key: 'newname', placeholder: '新名字', value: noteModal.name || '',
            onChange: function (e) { const v = e.target.value; setNoteModal(function (p) { return Object.assign({}, p, { name: v }) }) },
          }) : null),
          folderModal || noteModal.kind === 'rename' ? null : h('textarea', {
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
            folderModal ? null : h('label', { className: 'dn-mini', key: 'pick' }, [
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
              disabled: folderModal && noteModal.busy === true,
              onClick: folderModal ? submitFolderImport : (noteModal.kind === 'create' ? submitCreate : (noteModal.kind === 'import' ? submitImport : submitRename)),
            }, folderModal
              ? (noteModal.busy ? '正在镜像…' : ('镜像并导入 ' + ((noteModal.files || []).filter(function (f) { return f.on }).length) + ' 个'))
              : (noteModal.kind === 'create' ? '创建' : (noteModal.kind === 'import' ? '导入' : '重命名'))),
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
          h('button', { className: 'dn-iconbtn', key: 'collapse', type: 'button', 'data-control': 'collapse', title: '折叠为右下角小图标（再次展开会回到这一行）', 'aria-label': '折叠', onClick: function (e) { e.stopPropagation(); collapseCard() } }, [h(IconChevronDown, { key: 'i' })]),
        ]),
      ])
      const actions = h('div', { className: 'dn-actions', key: 'actions' }, [
        mode === 'read' ? btn('编辑', function () { enterEdit() }, { title: '进入编辑，从你正在看的那一行开始(也可双击正文)' }) : btn('完成', function () { finishEdit() }, { active: true, title: '回到阅读（改动已经静默落盘）' }),
        btn('提交', function () { doCommit() }, { title: '把磁盘上的笔记提交到 git（改动本身是静默落盘的，不需要手动保存）' }),
        btn('标记' + (selList.length ? ' ' + selList.length : ''), function () { const willOpen = !panel; setPanel(willOpen); if (willOpen) loadAllMarks() }, { active: panel, title: '查看/管理标记（本笔记 / 本会话 / 自定义列表）' }),
        // 清空 and 重载 are rare and destructive-ish, so they fold away and stop crowding the
        // row: at the standard 430px width this line used to wrap.
        h('button', {
          className: 'dn-btn dn-btn-icon', key: 'more', type: 'button', 'data-menu-opener': 'more',
          title: '更多：清空全部标记 / 从磁盘重载 / 提交',
          onClick: function (e) { e.stopPropagation(); openMenu('more', e) },
        }, '⋯'),
      ])
      const foot = h('div', { className: 'dn-foot', key: 'foot', ref: footRef }, [
        h('span', { key: 'a' }, st.gitReady ? ('git ' + (st.commitHash || '未提交')) : (st.error ? 'git 异常' : 'git 未就绪')),
        h('span', { key: 'b' }, st.lineCount + ' 行'),
        h('span', { key: 'c' }, '标记 ' + selList.length),
        h('span', { key: 'd' }, offline ? '连接中断' : (busy ? busy : (dirty ? '未落盘' : '已落盘'))),
        h('span', { key: 'e' }, (geo.compact ? '窄屏' : (geo.mode === 'docked' ? ('停靠 ' + Math.round(geo.width) + 'px') : '浮层')) + ' · ' + sizeLabel),
        h('span', { key: 'f', style: { overflow: 'hidden', textOverflow: 'ellipsis', color: '#d33' } }, st.error || ''),
      ])
      // ── 标记列表（两个视图：本笔记 / 本会话）──────────────────────────────────────
      const sessionMarks = (marksData || []).reduce(function (n, x) { return n + (x.marks ? x.marks.length : 0) }, 0)
      function markRow(m, noteName, cross, listName) {
        const key = (cross ? noteName + '/' : '') + m.id + (listName ? '@' + listName : '')
        const open = selOpen[key] === true
        const look = markLook(m)
        const color = markColor(m)
        const where = cross ? (noteName + ' · 第' + m.startLine + ' 行') : ('第' + m.startLine + ':' + m.startCol + ' → ' + m.endLine + ':' + m.endCol)
        return h('div', {
          className: 'dn-mark' + (open ? ' dn-mark-open' : ''),
          key: key, 'data-color': color, 'data-italic': look.italic ? '1' : '0', 'data-underline': look.underline ? '1' : '0',
          ref: function (el) { if (el) markRowEls.current[m.id] = el; else delete markRowEls.current[m.id] },
        }, [
          // The left rail shows everything about how this mark is drawn: the colour bar, plus an
          // I and a U that light up when they apply. "看不出来都标了什么" was the complaint.
          h('span', { className: 'dn-mark-rail', key: 'rail', 'aria-hidden': 'true' }, [
            h('span', { className: 'dn-mark-rail-bar', key: 'b' }),
            h('span', { className: 'dn-mark-rail-i', key: 'i' }, 'I'),
            h('span', { className: 'dn-mark-rail-u', key: 'u' }, 'U'),
          ]),
          h('div', { className: 'dn-mark-top', key: 't' }, [
            h('span', { className: 'dn-mark-where', key: 'w' }, where),
            color === 'none' ? h('span', { className: 'dn-mark-badge', key: 'nc' }, '无色') : null,
            look.italic ? h('span', { className: 'dn-mark-badge', key: 'si' }, '斜体') : null,
            look.underline ? h('span', { className: 'dn-mark-badge', key: 'su' }, '下划线') : null,
            // The badge is the way IN to the two repair actions. It is a plain badge for a mark of
            // another note (the session view): those actions write to the note on screen, and this
            // row cannot reach that one.
            m.stale ? (cross || listName
              ? h('span', { className: 'dn-mark-badge dn-badge-warn', key: 'st', title: '原文已变动：这段文字被改过，卡片无法确定它现在盖住哪些字' }, '原文已变动')
              : h('button', {
                className: 'dn-mark-badge dn-badge-warn dn-badge-btn', key: 'st', type: 'button', 'data-menu-opener': 'stale',
                title: '原文已变动：点这里可以【恢复原文】或【确认变动】',
                onClick: function (e) {
                  e.stopPropagation()
                  if (mcard && mcard.id === m.id) { setMcard(null); return }
                  const r = e.currentTarget.getBoundingClientRect()
                  const at = cardPoint(r.left, r.bottom + 6)
                  setMcard({ id: m.id, x: at.x, y: at.y, from: 'list' })
                },
              }, '原文已变动')) : null,
            h('span', { className: 'dn-mark-badge', key: 'f' }, m.fetched ? '已取用' : '新'),
            h('span', { className: 'dn-mark-acts', key: 'a' }, [
              h('button', {
                className: 'dn-mact', key: 'exp', title: open ? '收起' : '展开全文',
                onClick: function (e) {
                  e.stopPropagation()
                  setSelOpen(function (prev) { const n = Object.assign({}, prev); if (n[key]) delete n[key]; else n[key] = true; return n })
                },
              }, open ? '收起' : '展开'),
              cross || listName ? null : h('button', {
                className: 'dn-mact', key: 'look', 'data-menu-opener': 'look',
                title: '改颜色 / 改斜体下划线 / 复制 / 备注',
                onClick: function (e) {
                  e.stopPropagation()
                  // Same button twice = close, exactly like the chrome menus.
                  if (mcard && mcard.id === m.id) { setMcard(null); return }
                  const r = e.currentTarget.getBoundingClientRect()
                  const at = cardPoint(r.left, r.bottom + 6)
                  setMcard({ id: m.id, x: at.x, y: at.y, from: 'list' })
                },
              }, '样式'),
              // 添加到 a custom list (or 移出 when the row is already displayed from one). This
              // replaces the old 跳到 button: clicking the row itself already jumps.
              h('button', {
                className: 'dn-mact', key: 'add', 'data-menu-opener': 'add',
                title: listName ? '从这个列表移出' : '添加到自定义列表',
                onClick: function (e) {
                  e.stopPropagation()
                  if (listName) { listRemoveMark(listName, cross ? noteName : '', m.id); return }
                  if (addFor && addFor.markId === m.id) { setAddFor(null); return }
                  const r = e.currentTarget.getBoundingClientRect()
                  const at = cardPoint(r.left, r.bottom + 6)
                  setAddFor({ markId: m.id, note: cross ? noteName : '', x: at.x, y: at.y })
                },
              }, listName ? '移出' : '添加到'),
              cross || listName ? null : h('button', {
                className: 'dn-mact', key: 'rm', title: m.remark ? '改这条备注' : '给这条标记写备注',
                onClick: function (e) { e.stopPropagation(); setRemarkDraft(m.remark || ''); setRemarkFor({ id: m.id }) },
              }, m.remark ? '改备注' : '备注'),
              cross || listName ? null : h('button', { className: 'dn-mact dn-mact-del', key: 'x', title: '删除这条标记', onClick: function (e) { e.stopPropagation(); removeSelection(m.id) } }, '删除'),
            ]),
          ]),
          h('div', {
            className: 'dn-mark-body', key: 'b', title: '点这里跳到正文这一行',
            onClick: function (e) { e.preventDefault(); e.stopPropagation(); jumpToMark(cross ? noteName : '', m.startLine) },
          }, h('span', { className: (look.italic ? 'dn-mki' : '') + (look.underline ? ' dn-mku' : '') }, markBlocks(m.text))),
          m.remark ? h('div', { className: 'dn-mark-remark', key: 'r' }, ['备注：', mdInline(m.remark)]) : null,
        ])
      }
      // Three kinds of view: this note, every note of this session, and any number of custom
      // lists the reader builds by hand (添加到 on a row). All three read the same marks.
      const activeListName = markTab.indexOf('list:') === 0 ? markTab.slice(5) : ''
      let activeList = null
      for (let i = 0; i < (listData || []).length; i++) if (listData[i].name === activeListName) activeList = listData[i]
      const markRows = activeList !== null && activeList !== undefined
        ? (activeList.items || []).map(function (it) {
          const hit = findMarkInSession(it.note, it.markId)
          if (hit === null) {
            // The mark was deleted (or the note was) after being collected: say so instead of
            // silently dropping it, and offer the one action that makes sense.
            return h('div', { className: 'dn-mark dn-mark-open', key: 'miss/' + it.note + '/' + it.markId, 'data-color': 'yellow' }, [
              h('div', { className: 'dn-mark-top', key: 't' }, [
                h('span', { className: 'dn-mark-where', key: 'w' }, it.note + ' · ' + it.markId),
                h('span', { className: 'dn-mark-badge dn-badge-warn', key: 'm' }, '标记已不存在'),
                h('span', { className: 'dn-mark-acts', key: 'a' }, [
                  h('button', { className: 'dn-mact dn-mact-del', key: 'x', title: '从列表移出', onClick: function (e) { e.stopPropagation(); listRemoveMark(activeList.name, it.note, it.markId) } }, '移出'),
                ]),
              ]),
            ])
          }
          return markRow(hit.mark, hit.note, hit.note !== noteName, activeList.name)
        })
        : (markTab === 'session'
          ? (marksData || []).reduce(function (acc, group) {
            for (let i = 0; i < (group.marks || []).length; i++) acc.push(markRow(group.marks[i], group.note, group.note !== noteName))
            return acc
          }, [])
          : selList.map(function (m) { return markRow(m, noteName, false) }))
      // A definite pixel height, not a percentage: on the phone layout the card's height is not
      // always a definite value for % to resolve against, and flex-shrink happily squeezed this
      // panel to zero (reported: the list showed nothing but its header row). Measured from the
      // card itself, so every layout gets a value that is actually true.
      const cardPx = rootRef.current ? rootRef.current.clientHeight : (bounds.h || 800)
      const panelPx = Math.max(140, Math.min(460, Math.round(cardPx * 0.5)))
      const marksBodyEl = h('div', {
        className: 'dn-marks-body', key: 'b', ref: marksBodyRef,
        onScroll: function (e) {
          const box = e.currentTarget
          const key = marksScrollKeyRef.current
          if (!key || !box) return
          if (marksScrollTimerRef.current !== null) { try { window.clearTimeout(marksScrollTimerRef.current) } catch (err) { } }
          marksScrollTimerRef.current = window.setTimeout(function () {
            marksScrollTimerRef.current = null
            writeMarksScroll(key, box.scrollTop)
          }, 350)
        },
      }, markRows.length
        ? markRows
        : [h('div', { className: 'dn-marks-empty', key: 'e' }, markTab === 'session'
          ? (allMarksMissingRef.current ? '会话视图需要重启一次 dsh 才生效（当前 host 还是旧构建）。' : '本会话还没有任何标记。')
          : '这份笔记还没有标记。长按正文约 0.4 秒出现选择器，拖两个圆点定范围，再点[标记]。')])
      const viewLabel = activeList !== null && activeList !== undefined
        ? (activeList.name + ' ' + activeList.count)
        : (markTab === 'session' ? ('本会话 ' + sessionMarks) : ('本笔记 ' + selList.length))
      const marksHeadEl = h('div', {
        className: 'dn-marks-head', key: 'h',
        // Press and drag: one gesture lifts the list out of the card and keeps moving it (see
        // startMarksLift). Once it is a window, the same handler drags the window.
        onPointerDown: function (e) {
          if (marksWin) startMarksWinDrag(e, 'move')
          else startMarksLift(e)
        },
        onPointerMove: function (e) {
          if (marksWinDragRef.current) { moveMarksWinDrag(e); return }
          if (!marksWin) moveMarksLift(e)
        },
        onPointerUp: function (e) {
          if (marksWinDragRef.current) { marksLiftRef.current = null; endMarksWinDrag(); return }
          if (!marksWin) endMarksLift(e)
        },
        onPointerCancel: function () {
          marksLiftRef.current = null
          if (marksWinDragRef.current) endMarksWinDrag()
        },
      }, [
        // ONE button for the whole view: the three pills (本笔记 / 本会话 / ＋) plus 刷新 used to
        // fill the header and wrap on a narrow card. It now names the current view and opens a
        // menu with every view, the custom lists, and the way to make a new one.
        h('button', {
          className: 'dn-tab dn-tab-on dn-marks-view', key: 'view', type: 'button', 'data-menu-opener': 'view',
          title: '切换标记列表的视图：本笔记 / 本会话 / 自定义列表',
          onClick: function (e) { e.stopPropagation(); openMenu('view', e) },
        }, [h('span', { key: 'l' }, viewLabel), h('span', { className: 'dn-caret', key: 'v' }, '▾')]),
        h('span', { className: 'dn-marks-spacer', key: 'sp' }),
        h('button', {
          className: 'dn-tab' + (summonOnMark ? ' dn-tab-on' : ''), key: 'sum',
          title: summonOnMark
            ? '已开启：单击标记文字会自动呼出悬浮标记列表并定位到它（关闭后，列表只要是打开的，单击标记文字仍会定位）'
            : '默认关闭：单击标记文字只弹出功能卡。打开后，单击标记文字会自动呼出悬浮标记列表',
          onClick: function () { setSummon(!summonOnMark) },
        }, summonOnMark ? '点标记→列表 开' : '点标记→列表 关'),
        h('button', {
          className: 'dn-tab', key: 'lift',
          title: marksWin ? '收回卡片内' : '拖出为独立小窗（拖动标题栏也能拖出）',
          onClick: function () { if (marksWin) dockMarksBack(); else liftMarksOut(null) },
        }, marksWin ? '收回' : '拖出'),
        // The list's own close button: a list you dismissed by hand should not require reaching
        // for the toolbar's 标记 button (nor the window's 收回).
        h('button', {
          className: 'dn-marks-close', key: 'close', type: 'button', title: '关闭标记列表',
          'aria-label': '关闭标记列表',
          onClick: function (e) { e.stopPropagation(); setPanel(false); setMcard(null); setAddFor(null); setAddBox(null); setMenuOpen(null) },
        }, '✕'),
      ])
      const panelInner = [marksHeadEl, marksBodyEl]
      const panelEl = !panel ? null : (marksWin
        ? h('div', {
          className: 'dn-marks-win', key: 'sel', ref: marksWinRef,
          style: { left: marksWin.x + 'px', top: marksWin.y + 'px', width: marksWin.w + 'px', height: marksWin.h + 'px' },
        }, panelInner.concat([
          h('div', {
            className: 'dn-marks-grip', key: 'grip', title: '拖动改变大小',
            onPointerDown: function (e) { startMarksWinDrag(e, 'resize') },
            onPointerMove: function (e) { moveMarksWinDrag(e) },
            onPointerUp: function () { endMarksWinDrag() },
          }),
        ]))
        : h('div', { className: 'dn-marks', key: 'sel', style: { height: panelPx + 'px' } }, panelInner))
      // ── the single-click function card ────────────────────────────────────────────
      const cardMark = mcard ? (function () {
        const flat = []
        for (let i = 0; i < selList.length; i++) if (selList[i].id === mcard.id) flat.push(selList[i])
        for (let i = 0; i < (marksData || []).length; i++) {
          const g = marksData[i]
          for (let k = 0; k < (g.marks || []).length; k++) if (g.marks[k].id === mcard.id) flat.push(g.marks[k])
        }
        return flat.length ? flat[0] : null
      })() : null
      // The two stale actions write to the note ON SCREEN, so they are offered only for a mark that
      // belongs to it: `selList` is this note's marks, while `cardMark` can also come from the
      // session-wide list (or the agent's card command) and then points at another note entirely.
      const cardMarkHere = !!(cardMark && selList.filter(function (x) { return x.id === cardMark.id }).length > 0)
      // ── the 添加到 popover, and the ＋ popover that creates a list ────────────────────
      // One small panel for both: pick an existing list (one click adds the mark), or type a
      // name and get a new list with the mark already inside it.
      const addPanel = (addFor || addBox) ? h('div', {
        className: 'dn-mcard dn-addlist', key: 'addlist', ref: addBoxRef,
        style: (function () {
          const at = clampInCard({ x: (addFor || addBox).x, y: (addFor || addBox).y }, addSize || { w: 250, h: 130 })
          return { left: at.x + 'px', top: at.y + 'px' }
        })(),
        onPointerDown: function (e) { e.stopPropagation() },
      }, [
        h('div', { className: 'dn-mcard-row', key: 'h' }, [
          h('span', { key: 'l', style: { color: '#8a8f98', fontSize: '11px' } }, addFor ? '添加到列表' : '新建列表'),
        ]),
        ...(listData || []).map(function (l) {
          return h('button', {
            className: 'dn-mcard-btn', key: l.id, style: { textAlign: 'left' },
            onClick: function () {
              if (addFor) listAddMark(l.name, addFor.note, addFor.markId)
              else setMarkTab('list:' + l.name)
              setAddFor(null); setAddBox(null)
            },
          }, l.name + '（' + l.count + '）')
        }),
        h('div', { className: 'dn-mcard-row', key: 'new' }, [
          h('input', {
            className: 'dn-addlist-input', key: 'i', value: newListName, placeholder: '新列表名',
            onPointerDown: function (e) { e.stopPropagation() },
            onChange: function (e) { setNewListName(e.target.value) },
            onKeyDown: function (e) {
              if (e.key !== 'Enter') return
              e.preventDefault()
              const name = newListName.trim()
              if (name === '') return
              if (addFor) listAddMarkFromNew(name, addFor.note, addFor.markId)
              else listCreateRemote(name, function (n) { setMarkTab('list:' + n) })
              setNewListName(''); setAddFor(null); setAddBox(null)
            },
          }),
          h('button', {
            className: 'dn-mcard-btn', key: 'b', 'data-primary': '1',
            onClick: function () {
              const name = newListName.trim()
              if (name === '') { notify('先写个列表名'); return }
              if (addFor) listAddMarkFromNew(name, addFor.note, addFor.markId)
              else listCreateRemote(name, function (n) { setMarkTab('list:' + n) })
              setNewListName(''); setAddFor(null); setAddBox(null)
            },
          }, addFor ? '新建并添加' : '新建'),
        ]),
        h('div', { className: 'dn-mcard-row', key: 'x' }, [
          h('button', { className: 'dn-mcard-btn', key: 'c', onClick: function () { setAddFor(null); setAddBox(null) } }, '取消'),
          addFor ? null : h('span', { key: 'tip', style: { color: '#8a8f98', fontSize: '10.5px' } }, '长按列表名可删除'),
        ]),
      ]) : null
      // ── the chrome menus: note picker, mark view, overflow actions ───────────────────
      // `light` is the note row's git status dot: idle (nothing to do) / pending (git working in the
      // background) / ok / error. It is data the poll already carries, so it costs no extra call.
      /* TREE-PURE-START */
      /**
       * The rows a note menu should contain. PURE: no React, no DOM, no I/O, no state — which is
       * the whole point. The version of this logic that lived inside the render loop drew the
       * folder row once per note (157 copies) and no test could see it; a pure function can be
       * called by the suite and asserted on.
       *
       * @param notes     the note rows the host sent (name, group, relPath, lines, commitHash…)
       * @param openKeys  map of expanded keys: "g|<group>" for a folder, "g|<group>|<dir>" for a dir
       * @returns rows, in order: { kind:"folder", key, label, count, open, depth }
       *                          { kind:"dir",    key, label, open, depth }
       *                          { kind:"note",   key, note, depth }
       */
      function buildNoteMenuRows(notes, openKeys) {
        const open = openKeys || {}
        const rows = []
        const groups = {}
        const loose = []
        ;(notes || []).forEach(function (n) {
          const g = String((n && n.group) || '')
          if (g === '' || !n.relPath) loose.push(n)
          else { if (!groups[g]) groups[g] = []; groups[g].push(n) }
        })
        // The tree grows out of the notes' own paths: a directory exists only when a note lives
        // under it, and its nesting is the real nesting. One level is revealed at a time.
        const buildTree = function (list) {
          const root = { dirs: {}, notes: [] }
          list.forEach(function (n) {
            const segs = String(n.relPath).split('/')
            let node = root
            for (let i = 0; i < segs.length - 1; i++) {
              if (!node.dirs[segs[i]]) node.dirs[segs[i]] = { dirs: {}, notes: [] }
              node = node.dirs[segs[i]]
            }
            node.notes.push(n)
          })
          return root
        }
        const walk = function (node, g, path, depth) {
          Object.keys(node.dirs).sort(function (a, b) { return a.localeCompare(b) }).forEach(function (name) {
            const key = g + '|' + (path === '' ? name : path + '/' + name)
            const isOpen = open[key] === true
            rows.push({ kind: 'dir', key: key, label: name, open: isOpen, depth: depth })
            if (isOpen) walk(node.dirs[name], g, path === '' ? name : path + '/' + name, depth + 1)
          })
          node.notes.slice().sort(function (a, b) { return String(a.relPath).localeCompare(String(b.relPath)) }).forEach(function (n) {
            rows.push({ kind: 'note', key: 'n' + g + n.name, note: n, depth: depth })
          })
        }
        Object.keys(groups).sort(function (a, b) { return a.localeCompare(b) }).forEach(function (g) {
          const key = 'g|' + g
          const isOpen = open[key] === true
          rows.push({ kind: 'folder', key: key, label: g.replace(/^.*?_assets\//, '').replace(/-[0-9a-f]{8}$/, ''), count: groups[g].length, open: isOpen, depth: 0 })
          if (isOpen) walk(buildTree(groups[g]), g, '', 1)
        })
        loose.forEach(function (n) { rows.push({ kind: 'note', key: 'n' + n.name, note: n, depth: 0 }) })
        return rows
      }
      /* TREE-PURE-END */
      const mi = function (key, label, on, fn, cls, light, indent, keep) {
        const dot = light ? h('span', { key: 'd', className: 'dn-git-dot dn-git-' + (light === true ? 'ok' : light), title: ({ idle: '无需 git 操作', pending: 'git 正在后台处理…', ok: '已提交到它自己的仓库', error: 'git 操作失败' })[light === true ? 'ok' : light] || '' }) : null
        return h('button', {
          className: 'dn-menu-item' + (cls ? ' ' + cls : ''), key: key, type: 'button', 'data-on': on ? '1' : '0',
          // `indent` is a DEPTH, not a pixel count: 1px per level was invisible. 12px per level,
          // capped so a deep path cannot squeeze the label away (the label ellipsises anyway).
          style: indent ? { paddingLeft: (8 + Math.min(indent, 6) * 12) + 'px' } : undefined,
          onClick: function (e) { e.stopPropagation(); if (keep !== true) setMenuOpen(null); fn() },
        }, dot === null ? label : [h('span', { key: 'l', className: 'dn-menu-item-label' }, label), dot])
      }
      let menuEl = null
      if (menuOpen) {
        const items = []
        if (menuOpen.kind === 'notes') {
          items.push(h('div', { className: 'dn-menu-label', key: 'lb' }, '切换笔记'))
          if (!notes.length) items.push(h('div', { className: 'dn-menu-label', key: 'none' }, '本会话还没有笔记'))
          for (let i = 0; i < notes.length; i++) {
            const n = notes[i]
            // Folder-imported notes collapse into ONE row per imported folder: a hundred and fifty flat
            // entries are unnavigable. Expanding shows the real structure — only directories that
            // actually hold notes and only .md entries, because nothing else in that folder is a note.
            // ONCE per menu render. This block used to sit inside the per-note loop (that is where
            // the old flat row was pushed), so a 157-note session drew the folder row — and every
            // loose note — 157 times. The flag lives on the fresh per-render array, so it resets
            // with every render and needs no assumption about the surrounding loop.
            // ONCE per menu render: the note menu's tree.
            // ONCE per menu render: ask the pure function which rows the menu has, then map them to
            // buttons. All the grouping/nesting lives in buildNoteMenuRows, where the suite can see it.
            if (!items.__treeBuilt) {
              items.__treeBuilt = true
              buildNoteMenuRows(notes, openGroupsOf(openGroups, openGroupsSid)).forEach(function (r) {
                if (r.kind === 'note') {
                  const n = r.note
                  const light = (n.gitState === 'idle' || !n.gitState) && n.dirty === true ? 'dirty' : n.gitState
                  items.push(mi('n' + n.name, String(n.name) + '  (' + n.lines + ' 行' + (n.commitHash ? ' · ' + n.commitHash : '') + ')', n.name === noteName, function () { switchNote(n.name) }, 'dn-tree-note', light, 1 + r.depth, true))
                  return
                }
                items.push(mi(r.key, (r.open ? '▾ ' : '▸ ') + r.label + (r.kind === 'folder' ? '  (' + r.count + ' 份)' : ''), false, function () {
                  setOpenGroups(function (prev) { return openGroupToggle(prev, openGroupsSid, r.key) })
                }, r.kind === 'folder' ? 'dn-tree-folder' : 'dn-tree-dir-row', undefined, 1 + r.depth, true))
              })
            }
          }
          items.push(h('div', { className: 'dn-menu-sep', key: 's1' }))
          const nav = navRef.current
          const canBack = nav.at > 0
          const canFwd = nav.at >= 0 && nav.at < nav.list.length - 1
          // A jump inside the note is an entry of its own, so the note name alone would look like
          // a no-op ("后退 → the note I am reading"): the recorded line is shown for those.
          const navLabel = function (e) {
            if (!e) return ''
            return e.name + (e.name === noteName && e.line >= 1 ? '（第 ' + e.line + ' 行）' : '')
          }
          items.push(mi('back', '← 后退' + (canBack ? '  →  ' + navLabel(nav.list[nav.at - 1]) : ''), false, function () { navGo(-1) }, canBack ? '' : 'dn-menu-item-sub', undefined, 0, true))
          items.push(mi('fwd', '→ 前进' + (canFwd ? '  →  ' + navLabel(nav.list[nav.at + 1]) : ''), false, function () { navGo(1) }, canFwd ? '' : 'dn-menu-item-sub', undefined, 0, true))
          items.push(mi('new', '新建笔记…', false, function () { setNoteModal({ kind: 'create', name: '', text: '' }) }))
          items.push(mi('imp', '导入到当前笔记…', false, function () { setNoteModal({ kind: 'import', text: '', mode: 'append' }) }))
          items.push(mi('fold', '从文件夹导入（整目录镜像）…', false, function () { setNoteModal({ kind: 'folder', dir: '', files: [] }) }))
          items.push(mi('sync', '与来源文件夹重新同步', false, function () {
            notify('正在与来源文件夹同步（只复制有变化的文件）…')
            host.call('syncNote', { sessionId: sidRef.current }).then(function (r) {
              if (!r || !r.ok) { notify('同步失败：' + ((r && r.error) || '未知原因')); return }
              const head = (r.changed ? '正文已更新' : '正文无变化') + '；镜像 ' + r.files + ' 文件 / ' + Math.round((r.bytes || 0) / 1024) + ' KB'
              notify(head + (r.warn ? '\n' + r.warn : '') + (r.refs ? '\n' + r.refs : ''))
            }).catch(function (err) { notify('同步失败: ' + ((err && err.message) || String(err))) })
          }))
          items.push(mi('asset', '当前笔记的素材信息', false, function () {
            host.call('assets', { sessionId: sidRef.current }).then(function (r) {
              if (!r || !r.ok) { notify((r && r.error) || '读不到素材信息'); return }
              if (!r.assetRoot) { notify('这份笔记没有素材根（从文件夹导入的笔记才有）'); return }
              notify('素材根 ' + r.assetRoot + '\n来源 ' + (r.origin || '—') + '\n镜像 ' + r.files + ' 文件 / ' + Math.round((r.bytes || 0) / 1024) + ' KB')
            }).catch(function (err) { notify('读不到素材信息: ' + ((err && err.message) || String(err))) })
          }))
          items.push(mi('ren', '重命名当前笔记…', false, function () { setNoteModal({ kind: 'rename', name: noteName }) }))
          items.push(h('div', { className: 'dn-menu-sep', key: 's2' }))
          items.push(mi('clr', '清空正文（保留 git 历史）', false, doClearNote))
          items.push(mi('del', '删除整份笔记（含它的 git）', false, doDeleteNote))
        } else if (menuOpen.kind === 'more') {
          items.push(mi('clr', '清空全部标记', false, clearMarks))
          items.push(mi('rl', '从磁盘重载（AI 改过之后）', false, doReload))
          items.push(mi('cb', '提交到 git', false, doCommit))
        } else if (menuOpen.kind === 'view') {
          items.push(mi('note', '本笔记 ' + selList.length, markTab === 'note', function () { setMarkTab('note') }))
          items.push(mi('sess', '本会话 ' + sessionMarks, markTab === 'session', function () { setMarkTab('session'); loadAllMarks() }))
          if ((listData || []).length) items.push(h('div', { className: 'dn-menu-sep', key: 's1' }))
          for (let i = 0; i < (listData || []).length; i++) {
            const l = listData[i]
            items.push(mi('l' + l.id, l.name + '  ' + l.count + ' 条', markTab === 'list:' + l.name, function () { setMarkTab('list:' + l.name); loadAllMarks() }))
            items.push(mi('x' + l.id, '　删除列表《' + l.name + '》', false, function () { listDeleteRemote(l.name) }, 'dn-menu-item-sub'))
          }
          items.push(h('div', { className: 'dn-menu-sep', key: 's2' }))
          items.push(mi('mk', '新建自定义列表…', false, function () { setAddBox(clampInCard(cardPoint((rootRef.current ? rootRef.current.getBoundingClientRect().left : 0) + menuOpen.x, (rootRef.current ? rootRef.current.getBoundingClientRect().top : 0) + menuOpen.y + 24), null)); setNewListName('') }))
          items.push(mi('rf', '刷新列表', false, function () { loadAllMarks() }))
        }
        const at = clampInCard({ x: menuOpen.x, y: menuOpen.y }, null)
        menuEl = h('div', {
          className: 'dn-menu', key: 'menu', ref: menuRef,
          style: { left: at.x + 'px', top: at.y + 'px' },
          onPointerDown: function (e) { e.stopPropagation() },
        }, items)
      }
      const mcardEl = mcard ? (function () {
        const at = clampInCard({ x: mcard.x, y: mcard.y }, mcardSize)
        return h('div', {
          className: 'dn-mcard', key: 'mcard', ref: mcardRef,
          style: { left: at.x + 'px', top: at.y + 'px' },
          onPointerDown: function (e) { e.stopPropagation() },
        }, [
          h('div', { className: 'dn-mcard-row', key: 'sw' }, [
            h('span', { key: 'lbl', style: { color: '#8a8f98', fontSize: '11px', marginRight: '2px' } }, '样式'),
            ...PEN_COLORS.map(function (c) {
              // The colour is single-select; the two styles below are independent toggles, so a
              // mark can be, say, green AND italic AND underlined.
              const on = cardMark && markColor(cardMark) === c
              return h('button', {
                className: 'dn-mcard-sw', key: c, 'data-c': c, 'data-on': on ? '1' : '0',
                title: c === 'none' ? '无色（完全不铺底，只保留样式）' : ('底色：' + c),
                onClick: function () { applyLook(cardMark, { color: c }) },
              })
            }),
            h('span', { className: 'dn-mcard-sep', key: 'sep' }),
            h('button', {
              className: 'dn-mcard-sw', key: 'it', title: cardMark && markLook(cardMark).italic ? '取消斜体' : '加斜体（可与颜色、下划线叠加）',
              'data-on': cardMark && markLook(cardMark).italic ? '1' : '0',
              style: { fontStyle: 'italic', fontFamily: 'Georgia,serif' },
              onClick: function () { applyLook(cardMark, { italic: !(cardMark && markLook(cardMark).italic) }) },
            }, 'I'),
            h('button', {
              className: 'dn-mcard-sw', key: 'ul', title: cardMark && markLook(cardMark).underline ? '取消下划线' : '加下划线（可与颜色、斜体叠加）',
              'data-on': cardMark && markLook(cardMark).underline ? '1' : '0',
              style: { textDecoration: 'underline', textDecorationThickness: '1.5px' },
              onClick: function () { applyLook(cardMark, { underline: !(cardMark && markLook(cardMark).underline) }) },
            }, 'U'),
          ]),
          // No 跳到 here: the card only opens on a passage the reader just clicked, so they are
          // already looking at that line. The list dropped it for the same reason (its rows jump
          // when clicked).
          // The two repair actions for a mark whose text moved under it. Primary, because when the
          // reader opens the card from the warning badge these are what they came for.
          cardMark && cardMark.stale && cardMarkHere ? h('div', { className: 'dn-mcard-row', key: 'stale' }, [
            h('span', { key: 'l', style: { color: '#b45309', fontSize: '11px' } }, '原文已变动'),
            h('button', { className: 'dn-mcard-btn', key: 'rs', 'data-primary': '1', title: '把这条标记当时记下的原文写回笔记（会改动笔记内容，git 里可恢复）', onClick: function () { restoreStaleText(cardMark) } }, '恢复原文'),
            h('button', { className: 'dn-mcard-btn', key: 'cf', title: '不改笔记：标记就留在现在这个位置，把当前文字记成它的原文' , onClick: function () { confirmStaleMark(cardMark) } }, '确认变动'),
          ]) : null,
          h('div', { className: 'dn-mcard-row', key: 'acts' }, [
            h('button', { className: 'dn-mcard-btn', key: 'copy', title: '复制这条标记的文字', onClick: function () { copyMarkText(cardMark) } }, '复制'),
            h('button', { className: 'dn-mcard-btn', key: 'rm', title: cardMark && cardMark.remark ? '查看/修改备注' : '给这条标记写备注', onClick: function () { remarkFromCard(cardMark) } }, cardMark && cardMark.remark ? '改备注' : '备注'),
            h('button', { className: 'dn-mcard-btn', key: 'add', title: '添加到自定义列表', onClick: function (e) { const p = cardPoint(e.clientX, e.clientY); setAddFor({ markId: cardMark ? cardMark.id : '', note: '', x: p.x, y: p.y }); setMcard(null) } }, '添加到'),
            h('button', { className: 'dn-mcard-btn', key: 'x', title: '删除这条标记', onClick: function () { if (cardMark) removeSelection(cardMark.id); setMcard(null) } }, '删除'),
            h('button', { className: 'dn-mcard-btn', key: 'cancel', 'data-primary': '1', onClick: function () { setMcard(null) } }, '取消'),
          ]),
          cardMark && cardMark.remark ? h('div', { className: 'dn-mcard-row', key: 'rmk', style: { color: '#6b7280', fontSize: '11px', maxWidth: '260px' } }, mdInline(cardMark.remark)) : null,
        ])
      })() : null
      // The overlay layers sit next to the body (inside a relative wrapper) and are shifted by
      // the scroll offset, so every overlay keeps using content coordinates.
      const scTop = bodyRef.current ? bodyRef.current.scrollTop : 0
      const scLeft = bodyRef.current ? bodyRef.current.scrollLeft : 0
      const layShift = { transform: 'translate(' + (-scLeft) + 'px,' + (-scTop) + 'px)' }
      return h('div', { className: 'dn-root', ref: rootRef, style: geo.style || undefined, 'data-panel-mode': geo.mode }, [
        head, notesRow, actions,
        h('div', { className: 'dn-wrap', key: 'wrap' }, [
        h('div', {
          className: 'dn-body', key: 'body', ref: bodyRef,
          onPointerDown: function (e) {
            // Remember where the tap started: a single click on a mark is only a single click if
            // the pointer stayed put, and the long-press path must not also raise the card.
            // The mark card is NOT closed here: onBodyClick() decides, so tapping the same mark
            // twice closes it instead of closing-then-reopening it.
            tapRef.current = { x: e.clientX, y: e.clientY, t: Date.now() }
            onBodyDown(e)
          },
          onClick: onBodyClick,
          // Capture phase, for two reasons: the browser fires a click after a long press too (on a
          // linked image that would navigate away), and a LOCAL link must be followed into the
          // mirror instead of navigating the page to a path that only exists inside it.
          onClickCapture: function (e) { onBodyLinkClick(e); if (navGuardRef.current) { navGuardRef.current = false; e.preventDefault(); e.stopPropagation() } },
          onDoubleClick: onDoubleClick,
          // Paste a file (or text into an open dialog) straight onto the card.
          onPaste: function (e) {
            const items = e.clipboardData && e.clipboardData.files
            if (items && items.length) { takeDroppedFiles(items, noteModal ? noteModal.kind : null); return }
            const txt = e.clipboardData && typeof e.clipboardData.getData === 'function' ? e.clipboardData.getData('text/plain') : ''
            if (txt && noteModal) { setNoteModal(function (p) { return Object.assign({}, p, { text: String((p && p.text) || '') + txt }) }) }
          },
        }, bodyKids),
        h('div', { className: 'dn-lay dn-lay-back', key: 'layback' }, h('div', { className: 'dn-lay-in', key: 'inb', ref: layInBackRef, style: layShift }, layBack)),
        h('div', { className: 'dn-lay dn-lay-front', key: 'layfront' }, h('div', { className: 'dn-lay-in', key: 'inf', ref: layInFrontRef, style: layShift }, layFront)),
        ]),
        panelEl, foot, modalEl, remarkEl, mcardEl, addPanel, menuEl,
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
