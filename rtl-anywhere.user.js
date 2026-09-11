// ==UserScript==
// @name         RTL Anywhere
// @namespace    rtl-anywhere
// @version      1.0.0
// @description  Any text, any site, one shortcut. Alt+R toggles RTL on the selection or hovered element, Alt+Shift+R opens pick mode, Alt+Shift+Z undoes everything. Auto-detect, per-site memory, custom font & shortcuts.
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-idle
// @author       sadeqi-ah
// @license      MIT
// @homepageURL  https://github.com/sadeqi-ah/rtl-anywhere
// @supportURL   https://github.com/sadeqi-ah/rtl-anywhere/issues
// @downloadURL  https://raw.githubusercontent.com/sadeqi-ah/rtl-anywhere/main/rtl-anywhere.user.js
// @updateURL    https://raw.githubusercontent.com/sadeqi-ah/rtl-anywhere/main/rtl-anywhere.user.js
// @icon         https://raw.githubusercontent.com/sadeqi-ah/rtl-anywhere/main/assets/icon.png
// ==/UserScript==
"use strict";
"use strict";
(() => {
  // src/constants.ts
  var RTL_CLASS = "tm-rtl";
  var WRAP_ATTR = "data-tm-rtl-wrap";
  var PREV_DIR = "data-tm-rtl-dir";
  var SRC_ATTR = "data-tm-rtl-src";
  var SKIP_ATTR = "data-tm-rtl-skip";
  var K = {
    font: "rtl-font",
    fonts: "system-fonts",
    sc: "shortcuts",
    auto: "auto-detect",
    autoSites: "auto-detect-sites",
    sites: "site-rules",
    onboarded: "onboarded"
  };
  var Z = 2147483647;
  var UI_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  var MONO = "ui-monospace, Menlo, Consolas, monospace";
  var PROTECTED = [
    "code",
    "pre",
    "kbd",
    "samp",
    "var",
    "tt",
    "math",
    "mjx-container",
    ".MathJax",
    ".MathJax_Display",
    ".katex",
    ".katex-display",
    ".math",
    ".hljs",
    ".highlight",
    ".CodeMirror",
    ".monaco-editor",
    ".ace_editor",
    '[class*="code-block"]',
    '[class*="codeblock"]',
    '[class*="sourceCode"]'
  ].join(",");
  var FONT_SAFE = [
    "svg",
    "i",
    ".fa",
    ".fas",
    ".far",
    ".fab",
    ".fal",
    ".fad",
    '[class^="fa-"]',
    '[class*=" fa-"]',
    ".material-icons",
    ".material-symbols-outlined",
    ".material-symbols-rounded",
    '[class*="icon"]',
    '[class*="Icon"]',
    '[class*="glyph"]',
    '[class*="emoji"]'
  ].join(",");
  var FIELDS = "input, textarea, select, button";
  var EDITABLE = '[contenteditable]:not([contenteditable="false"])';
  var INLINE_TAGS = /* @__PURE__ */ new Set([
    "a",
    "span",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "small",
    "mark",
    "sub",
    "sup",
    "abbr",
    "cite",
    "q",
    "time",
    "label",
    "font",
    "bdi",
    "bdo",
    "del",
    "ins",
    "dfn",
    "data",
    "ruby",
    "rt",
    "br",
    "wbr"
  ]);
  var AUTO_CANDIDATES = "p, li, h1, h2, h3, h4, h5, h6, blockquote, dd, dt, td, th, figcaption, summary, label, div, section, article";
  var RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  var LETTER = /\p{L}/u;
  var AUTO_RATIO = 0.6;
  var BEAM_SECS = 1.96;

  // src/gm.ts
  var getValue = (key, fallback) => GM_getValue(key, fallback);
  var setValue = (key, value) => GM_setValue(key, value);
  var onMenu = (label, fn) => GM_registerMenuCommand(label, fn);
  function addStyle(css) {
    const el = GM_addStyle(css);
    if (el) return el;
    const s = document.createElement("style");
    s.textContent = css;
    (document.head ?? document.documentElement).appendChild(s);
    return s;
  }

  // src/styles.ts
  function initStyles() {
    addStyle(`
    .${RTL_CLASS} { direction: rtl !important; text-align: right !important; unicode-bidi: isolate !important; }
    /* Code and math inside an RTL block always stay LTR */
    .${RTL_CLASS} :is(${PROTECTED}), .${RTL_CLASS} :is(${PROTECTED}) * {
      direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important;
    }
    body.tm-rtl-picking, body.tm-rtl-picking * { cursor: crosshair !important; }

    @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: true; }
  `);
  }
  var typoStyle = null;
  function applyTypography() {
    const font = getValue(K.font, "");
    if (typoStyle) {
      typoStyle.remove();
      typoStyle = null;
    }
    if (!font) return;
    const decl = `font-family: "${font.replace(/"/g, '\\"')}" !important`;
    const skip = `:not(:is(${PROTECTED})):not(:is(${PROTECTED}) *):not(:is(${FONT_SAFE}))`;
    typoStyle = addStyle(
      `.${RTL_CLASS}${skip}, .${RTL_CLASS} *${skip} { ${decl} }`
    );
  }

  // src/env.ts
  var PAGE = typeof unsafeWindow !== "undefined" ? unsafeWindow : globalThis;
  var IS_MAC = /Mac|iPhone|iPad/.test(
    globalThis.navigator?.platform ?? ""
  );
  var HOST = globalThis.location?.hostname ?? "";
  var IS_TOP = (() => {
    try {
      return typeof window !== "undefined" && window.top === window;
    } catch {
      return false;
    }
  })();

  // src/keys.ts
  var SC_IDS = ["toggle", "pick", "undo"];
  var DEFAULT_SC = {
    toggle: { code: "KeyR", alt: true, shift: false, ctrl: false, meta: false },
    pick: { code: "KeyR", alt: true, shift: true, ctrl: false, meta: false },
    undo: { code: "KeyZ", alt: true, shift: true, ctrl: false, meta: false }
  };
  var SC_LABELS = {
    toggle: "Toggle RTL",
    pick: "Pick mode",
    undo: "Undo all"
  };
  var KEY_NAMES = {
    Space: "Space",
    Enter: "↵",
    Backspace: "⌫",
    Tab: "⇥",
    Delete: "⌦",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backquote: "`",
    Home: "Home",
    End: "End",
    PageUp: "PgUp",
    PageDown: "PgDn",
    Insert: "Ins"
  };
  function keyName(code) {
    if (!code) return "";
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit\d$/.test(code)) return code.slice(5);
    return KEY_NAMES[code] ?? code.replace(/^Numpad/, "Num ");
  }
  function formatCombo(s, mac = IS_MAC) {
    const p = [];
    if (mac) {
      if (s.ctrl) p.push("⌃");
      if (s.alt) p.push("⌥");
      if (s.shift) p.push("⇧");
      if (s.meta) p.push("⌘");
      p.push(keyName(s.code));
      return p.join("");
    }
    if (s.ctrl) p.push("Ctrl");
    if (s.alt) p.push("Alt");
    if (s.shift) p.push("Shift");
    if (s.meta) p.push("Win");
    if (s.code) p.push(keyName(s.code));
    return p.join("+");
  }
  var isModifierCode = (c) => /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$/.test(c);
  var matches = (e, s) => e.code === s.code && e.altKey === s.alt && e.ctrlKey === s.ctrl && e.metaKey === s.meta && e.shiftKey === s.shift;
  var sameCombo = (a, b) => a.code === b.code && a.alt === b.alt && a.ctrl === b.ctrl && a.meta === b.meta && a.shift === b.shift;

  // src/shortcuts.ts
  var saved = getValue(K.sc, {});
  var merge = () => Object.fromEntries(
    SC_IDS.map((id) => [id, { ...DEFAULT_SC[id], ...saved[id] }])
  );
  var shortcuts = merge();
  var save = () => setValue(K.sc, shortcuts);
  function resetShortcuts() {
    shortcuts = Object.fromEntries(
      SC_IDS.map((id) => [id, { ...DEFAULT_SC[id] }])
    );
    save();
  }
  var recording = null;
  var isRecording = () => !!recording;
  var recordingBtn = () => recording?.btn ?? null;
  function stopRecord(restore = true) {
    if (!recording) return;
    window.removeEventListener("keydown", onRecordKey, true);
    window.removeEventListener("keyup", onRecordKeyUp, true);
    const { btn, id } = recording;
    btn.classList.remove("rec");
    if (restore) btn.textContent = formatCombo(shortcuts[id]);
    recording = null;
  }
  function startRecord(id, btn, hint, done) {
    stopRecord();
    recording = { id, btn, hint, done };
    btn.classList.add("rec");
    btn.textContent = "Press keys…";
    hint.textContent = "Press the new shortcut. Esc cancels.";
    window.addEventListener("keydown", onRecordKey, true);
    window.addEventListener("keyup", onRecordKeyUp, true);
  }
  function onRecordKey(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!recording) return;
    const { id, btn, hint, done } = recording;
    if (e.code === "Escape") {
      stopRecord();
      hint.textContent = "";
      return;
    }
    const combo = {
      code: e.code,
      alt: e.altKey,
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      meta: e.metaKey
    };
    if (isModifierCode(e.code)) {
      btn.textContent = formatCombo({ ...combo, code: "" }) || "Press keys…";
      return;
    }
    const hasMod = combo.alt || combo.ctrl || combo.meta;
    if (!hasMod && !/^F\d{1,2}$/.test(combo.code)) {
      hint.textContent = IS_MAC ? "Include ⌥, ⌃ or ⌘ (Shift alone isn’t enough)." : "Include Alt, Ctrl or Win (Shift alone isn’t enough).";
      return;
    }
    const clash = SC_IDS.find((o) => o !== id && sameCombo(combo, shortcuts[o]));
    if (clash) {
      hint.textContent = `Already used by “${SC_LABELS[clash]}”.`;
      return;
    }
    shortcuts[id] = combo;
    save();
    stopRecord();
    hint.textContent = "";
    done();
  }
  function onRecordKeyUp(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!recording) return;
    recording.btn.textContent = formatCombo({
      code: "",
      alt: e.altKey,
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      meta: e.metaKey
    }) || "Press keys…";
  }

  // src/dom.ts
  var ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  };
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);
  var isProtected = (el) => !!el && !!el.closest(PROTECTED);
  var deepTarget = (e) => {
    const t = e.composedPath ? e.composedPath()[0] : e.target;
    if (t instanceof Element) return t;
    return e.target instanceof Element ? e.target : null;
  };
  function climbOutOfProtected(el) {
    while (el && el !== document.body) {
      const p = el.closest(PROTECTED);
      if (!p) return el;
      el = p.parentElement;
    }
    return el;
  }
  var isInlineLevel = (el) => {
    const d = getComputedStyle(el).display;
    return d.startsWith("inline") || d === "contents";
  };
  function smartTarget(raw) {
    if (!raw) return null;
    let el = climbOutOfProtected(raw);
    if (!el || el === document.body || el === document.documentElement)
      return null;
    const field = el.closest(FIELDS);
    if (field) return field;
    const editRoot = el.closest(EDITABLE);
    let cur = el;
    while (cur !== editRoot && isInlineLevel(cur)) {
      const p = cur.parentElement;
      if (!p || p === document.body || p === document.documentElement) break;
      cur = p;
    }
    return cur;
  }
  function textNodesInRange(range) {
    const root = range.commonAncestorContainer;
    if (root.nodeType === Node.TEXT_NODE) return [root];
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n2) => range.intersectsNode(n2) && n2.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    let n;
    while (n = walker.nextNode()) nodes.push(n);
    return nodes;
  }

  // src/state.ts
  var touched = /* @__PURE__ */ new Set();
  var flags = {
    /** Set by "Undo all": auto-detect and site rules stop re-applying until reload. */
    paused: false,
    /** Pick mode active. */
    picking: false
  };
  function countRTL() {
    let n = 0;
    for (const e of touched)
      if (e.isConnected && e.classList.contains(RTL_CLASS)) n++;
    return n;
  }

  // src/rules.ts
  var siteRules = getValue(K.sites, {})[HOST] ?? [];
  var allSites = () => getValue(K.sites, {});
  function saveRules(list) {
    siteRules = list;
    const all = getValue(K.sites, {});
    if (list.length) all[HOST] = list;
    else delete all[HOST];
    setValue(K.sites, all);
  }
  function ruleFor(el) {
    for (const sel of siteRules) {
      try {
        if (el.matches(sel)) return sel;
      } catch {
      }
    }
    return null;
  }

  // src/overlay-markup.ts
  function overlayMarkup() {
    return `
      <style>
        :host { all: initial; }
        .box, .ring, .label, .tag, .hud, .aura { position: fixed; pointer-events: none; z-index: ${Z}; box-sizing: border-box; }
        .box { display: none; border: 1.5px solid rgba(37,99,235,.9); background: rgba(37,99,235,.06); border-radius: 3px; }
        .ring { border-radius: 3px; animation: ring .5s ease-out 1 forwards; }
        .ring.ltr { animation-name: ring-gray; }
        @keyframes ring      { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,.45); }  100% { box-shadow: 0 0 0 8px rgba(37,99,235,0); } }
        @keyframes ring-gray { 0% { box-shadow: 0 0 0 0 rgba(107,114,128,.5); } 100% { box-shadow: 0 0 0 8px rgba(107,114,128,0); } }
        .tag { transform: translateX(-100%); background: #2563eb; color: #fff; font: 600 10px/1 ${UI_FONT}; letter-spacing: .05em;
               padding: 3px 6px; border-radius: 4px; animation: tag .9s ease-out 1 forwards; }
        .tag.ltr { background: #6b7280; }
        @keyframes tag { 0% { opacity: 0; margin-top: 4px; } 15% { opacity: 1; margin-top: 0; } 70% { opacity: 1; } 100% { opacity: 0; } }
        .label { display: none; direction: ltr; background: #111827; color: #f9fafb; font: 11px/1 ${UI_FONT}; padding: 5px 8px;
                 border-radius: 4px; white-space: nowrap; max-width: 60vw; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
        .label b { color: #93c5fd; font-weight: 600; }
        .hud { visibility: hidden; opacity: 0; left: 50%; bottom: 18px; transform: translate(-50%, calc(100% + 28px)); direction: ltr; background: #fff; color: #111827;
               font: 12px/1 ${UI_FONT}; padding: 9px 13px; border-radius: 9px; white-space: nowrap; max-width: 94vw; overflow: hidden;
               text-overflow: ellipsis; box-shadow: 0 10px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06);
               transition: transform .38s cubic-bezier(.22,1,.36,1), opacity .2s ease, visibility 0s linear .38s; }
        .hud.on { visibility: visible; opacity: 1; transform: translate(-50%, 0); transition-delay: 0s; }
        .hud b { color: #111827; font-weight: 600; }
        .hud kbd { font: 500 12px ${UI_FONT}; letter-spacing: .04em; background: #f3f4f6; color: #374151; padding: 2px 5px; border-radius: 6px; margin: 0 1px; }
        .hud .sep { color: #d1d5db; margin: 0 8px; }
        @media (prefers-color-scheme: dark) {
          .hud { background: rgba(22, 22, 22, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.1); }
          .hud b { color: #fff; }
          .hud kbd { background: rgba(255,255,255,.06); color: #e5e7eb; }
          .hud .sep { color: rgba(255,255,255,.2); }
        }
        .beam { visibility: hidden; opacity: 0; inset: 0; position: fixed; pointer-events: none; z-index: ${Z}; box-sizing: border-box; isolation: isolate;
                transition: opacity .32s ease, visibility 0s linear .32s; }
        .beam.on { visibility: visible; opacity: 1; transition-delay: 0s; }
        .beam::after {
          content: ""; position: absolute; inset: 0; box-sizing: border-box; padding: 1.5px;
          background: conic-gradient(from var(--beam-angle), transparent 0%, transparent 54%, rgba(255,255,255,.1) 57%, rgba(255,255,255,.3) 60%, rgba(255,255,255,.6) 63%, rgba(255,255,255,.75) 66%, rgba(255,255,255,.6) 69%, rgba(255,255,255,.3) 72%, rgba(255,255,255,.1) 75%, transparent 78%, transparent 100%), radial-gradient(ellipse 20vmax 12vmax at 33% -7%, rgb(255, 50, 100), transparent), radial-gradient(ellipse 18vmax 10vmax at 12% -5%, rgb(40, 140, 255), transparent), radial-gradient(ellipse 12vmax 20vmax at 2% 68%, rgb(50, 200, 80), transparent), radial-gradient(ellipse 6vmax 10vmax at 2% 68%, rgb(30, 185, 170), transparent), radial-gradient(ellipse 50vmax 10vmax at 74% 100%, rgb(100, 70, 255), transparent), radial-gradient(ellipse 25vmax 8vmax at 55% 100%, rgb(40, 140, 255), transparent), radial-gradient(ellipse 22vmax 10vmax at 94% 0%, rgb(255, 120, 40), transparent), radial-gradient(ellipse 8vmax 12vmax at 100% 27%, rgb(240, 50, 180), transparent), radial-gradient(ellipse 15vmax 14vmax at 100% 27%, rgb(180, 40, 240), transparent), radial-gradient(ellipse 18vmax 12vmax at 14% 100%, rgb(255, 200, 50), transparent), radial-gradient(ellipse 15vmax 20vmax at 100% 75%, rgb(30, 200, 150), transparent), radial-gradient(ellipse 12vmax 20vmax at 0% 25%, rgb(250, 80, 50), transparent), radial-gradient(ellipse 25vmax 12vmax at 50% -5%, rgb(180, 40, 240), transparent);
          -webkit-mask: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: source-in, xor;
          mask: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: intersect, exclude; pointer-events: none; z-index: 2; opacity: .8; animation: none;
        }
        .beam.on::after { animation: beam-spin ${BEAM_SECS}s linear infinite, beam-reveal .55s cubic-bezier(.22,1,.36,1) both; }
        .beam::before {
          content: ""; position: absolute; inset: 0; box-sizing: border-box;
          background: radial-gradient(ellipse 18vmax 10vmax at 33% -7%, rgba(255,50,100,.45), transparent), radial-gradient(ellipse 16vmax 9vmax at 12% -5%, rgba(40,140,255,.45), transparent), radial-gradient(ellipse 10vmax 18vmax at 2% 68%, rgba(50,200,80,.45), transparent), radial-gradient(ellipse 5vmax 9vmax at 2% 68%, rgba(30,185,170,.45), transparent), radial-gradient(ellipse 46vmax 8vmax at 74% 100%, rgba(100,70,255,.45), transparent), radial-gradient(ellipse 22vmax 7vmax at 55% 100%, rgba(40,140,255,.45), transparent), radial-gradient(ellipse 19vmax 8vmax at 94% 0%, rgba(255,120,40,.45), transparent), radial-gradient(ellipse 6vmax 11vmax at 100% 27%, rgba(240,50,180,.45), transparent), radial-gradient(ellipse 13vmax 12vmax at 100% 27%, rgba(180,40,240,.45), transparent), radial-gradient(ellipse 16vmax 10vmax at 14% 100%, rgba(255,200,50,.45), transparent), radial-gradient(ellipse 13vmax 18vmax at 100% 75%, rgba(30,200,150,.45), transparent), radial-gradient(ellipse 10vmax 18vmax at 0% 25%, rgba(250,80,50,.45), transparent), radial-gradient(ellipse 22vmax 10vmax at 50% -5%, rgba(180,40,240,.45), transparent);
          box-shadow: inset 0 0 9px 1px rgba(255,255,255,.27);
          -webkit-mask-image: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
          -webkit-mask-composite: source-in, source-over;
          mask-image: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
          mask-composite: intersect, add; pointer-events: none; z-index: 1; opacity: .6; animation: none;
        }
        .beam.on::before { animation: beam-spin ${BEAM_SECS}s linear infinite, glow-reveal .65s ease-out both; }
        @keyframes beam-spin { 100% { --beam-angle: 360deg; } }
        @keyframes beam-reveal { from { opacity: 0; filter: blur(6px) brightness(1.8); } to { opacity: .8; filter: blur(0) brightness(1); } }
        @keyframes glow-reveal { from { opacity: 0; filter: blur(14px); } to { opacity: .6; filter: blur(0); } }
        @media (prefers-reduced-motion: reduce) { .beam::after, .beam::before { animation: none !important; } .beam, .hud { transition: none !important; } }
      </style>
      <div class="box"></div><div class="label"></div><div class="hud"></div>
      <div class="beam"></div>`;
  }

  // src/overlay.ts
  var parts = null;
  function overlay() {
    if (parts) return parts;
    const host2 = document.createElement("div");
    const root = host2.attachShadow({ mode: "open" });
    root.innerHTML = overlayMarkup();
    document.documentElement.appendChild(host2);
    parts = {
      root,
      box: root.querySelector(".box"),
      label: root.querySelector(".label"),
      hud: root.querySelector(".hud"),
      beam: root.querySelector(".beam")
    };
    return parts;
  }
  function place(node, r, pad = 0) {
    node.style.left = r.left - pad + "px";
    node.style.top = r.top - pad + "px";
    node.style.width = r.width + pad * 2 + "px";
    node.style.height = r.height + pad * 2 + "px";
  }
  function describe(el) {
    let s = esc(el.localName);
    if (el.id) s += "#" + esc(el.id);
    const cls = [...el.classList].filter((c) => !c.startsWith("tm-rtl")).slice(0, 2);
    if (cls.length) s += "." + cls.map(esc).join(".");
    const badges = [];
    if (el.classList.contains(RTL_CLASS)) badges.push("RTL");
    if (el.getAttribute(SRC_ATTR) === "auto") badges.push("auto");
    if (ruleFor(el)) badges.push("saved");
    return badges.length ? `${s} &nbsp;<b>${badges.join(" · ")}</b>` : s;
  }
  function drawHover(el) {
    const { box, label } = overlay();
    if (!el) {
      box.style.display = "none";
      label.style.display = "none";
      return;
    }
    const r = el.getBoundingClientRect();
    place(box, r, 2);
    box.style.display = "block";
    label.innerHTML = describe(el);
    label.style.display = "block";
    const top = r.top > 30 ? r.top - 26 : r.bottom + 4;
    label.style.top = Math.min(Math.max(top, 4), innerHeight - 26) + "px";
    label.style.left = Math.max(4, Math.min(r.left, innerWidth - 240)) + "px";
  }
  function flash(el, mode) {
    if (!el) return;
    const { root } = overlay();
    const rects = [...el.getClientRects()].filter((r) => r.width || r.height).slice(0, 24);
    const first = rects[0];
    if (!first) return;
    for (const r of rects) {
      const d = document.createElement("div");
      d.className = "ring " + mode;
      place(d, r);
      root.appendChild(d);
      setTimeout(() => d.remove(), 550);
    }
    const t = document.createElement("div");
    t.className = "tag " + mode;
    t.textContent = mode.toUpperCase();
    t.style.left = Math.max(40, Math.min(first.right, innerWidth - 4)) + "px";
    t.style.top = (first.top > 24 ? first.top - 20 : first.top + 2) + "px";
    root.appendChild(t);
    setTimeout(() => t.remove(), 950);
  }
  var hudTimer = 0;
  function hudSet(html, transient = false) {
    const { hud } = overlay();
    hud.innerHTML = html;
    hud.classList.add("on");
    clearTimeout(hudTimer);
    if (transient)
      hudTimer = window.setTimeout(
        () => flags.picking ? updateHud() : hud.classList.remove("on"),
        1700
      );
  }
  function updateHud() {
    const { hud } = overlay();
    if (!flags.picking) {
      hud.classList.remove("on");
      return;
    }
    const sep = '<span class="sep">|</span>';
    hudSet(
      `Pick mode ${sep} <b>${countRTL()}</b> RTL on this page ${sep} <kbd>↑</kbd><kbd>↓</kbd> or <kbd>⌥</kbd> wheel: parent / child ${sep} <kbd>⇧</kbd> click remembers for this site ${sep} <kbd>Esc</kbd> exit`
    );
  }
  function showBeam(on) {
    overlay().beam.classList.toggle("on", on);
  }

  // src/core.ts
  function applyRTL(el, src = "manual", quiet = false) {
    if (!el.hasAttribute(PREV_DIR))
      el.setAttribute(PREV_DIR, el.getAttribute("dir") ?? "");
    el.setAttribute("dir", "rtl");
    el.classList.add(RTL_CLASS);
    el.setAttribute(SRC_ATTR, src);
    el.removeAttribute(SKIP_ATTR);
    touched.add(el);
    if (!quiet) flash(el, "rtl");
  }
  function unwrap(span) {
    const parent = span.parentNode;
    if (!parent) return null;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
    return parent;
  }
  function revert(el, byUser = false, quiet = false) {
    if (!quiet) flash(el, "ltr");
    touched.delete(el);
    if (el.hasAttribute(WRAP_ATTR)) {
      const parent = unwrap(el);
      if (byUser && parent instanceof Element) parent.setAttribute(SKIP_ATTR, "");
      return;
    }
    el.classList.remove(RTL_CLASS);
    const prev = el.getAttribute(PREV_DIR);
    if (prev) el.setAttribute("dir", prev);
    else el.removeAttribute("dir");
    el.removeAttribute(PREV_DIR);
    el.removeAttribute(SRC_ATTR);
    if (byUser) el.setAttribute(SKIP_ATTR, "");
  }
  function toggleExact(el) {
    if (el.classList.contains(RTL_CLASS)) revert(el, true);
    else applyRTL(el, "manual");
  }
  function toggleElement(raw) {
    if (!raw) return;
    const existing = raw.closest("." + RTL_CLASS);
    if (existing) {
      revert(existing, true);
      return;
    }
    const el = smartTarget(raw);
    if (el) applyRTL(el, "manual");
  }
  function undoAll() {
    flags.paused = true;
    const els = [...touched].filter((e) => e.isConnected);
    els.forEach((el, i) => revert(el, false, i >= 40));
    touched.clear();
    const n = els.length;
    hudSet(
      n ? `Reverted <b>${n}</b> element${n === 1 ? "" : "s"}` : "Nothing to undo on this page",
      true
    );
  }
  function toggleSelection(sel) {
    const range = sel.getRangeAt(0);
    const anc = range.commonAncestorContainer;
    const ancEl = anc instanceof Element ? anc : anc.parentElement;
    if (!ancEl) return;
    const existing = ancEl.closest("." + RTL_CLASS);
    if (existing) {
      revert(existing, true);
      sel.removeAllRanges();
      return;
    }
    if (ancEl.closest(EDITABLE)) {
      sel.removeAllRanges();
      toggleElement(ancEl);
      return;
    }
    const nodes = textNodesInRange(range);
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (!first || !last) return;
    if (last === range.endContainer && range.endOffset < last.length)
      last.splitText(range.endOffset);
    if (first === range.startContainer && range.startOffset > 0) {
      const rest = first.splitText(range.startOffset);
      nodes[0] = rest;
      if (first === last) nodes[nodes.length - 1] = rest;
    }
    let wrapped = 0;
    for (const t of nodes) {
      if (isProtected(t.parentElement)) continue;
      const parent = t.parentNode;
      if (!parent) continue;
      const span = document.createElement("span");
      span.setAttribute(WRAP_ATTR, "");
      parent.insertBefore(span, t);
      span.appendChild(t);
      applyRTL(span, "manual");
      wrapped++;
    }
    sel.removeAllRanges();
    if (!wrapped) toggleElement(ancEl);
  }
  function action(lastMouseTarget2) {
    const a = document.activeElement;
    if ((a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement) && a.selectionStart !== a.selectionEnd) {
      toggleElement(a);
      return;
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed && sel.toString().trim())
      toggleSelection(sel);
    else toggleElement(lastMouseTarget2);
  }

  // src/selector.ts
  var stableClass = (c) => !!c && c.length < 32 && !/\d/.test(c) && !c.startsWith("tm-rtl") && !/^(is|has|js)-|--|active|hover|focus|selected|open/i.test(c);
  var stableId = (id) => !!id && !/\d{3,}/.test(id) && !/^[a-f0-9]{8,}$/i.test(id) && !id.startsWith(":");
  function cssPath(el) {
    const parts2 = [];
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      if (stableId(node.id)) {
        parts2.unshift("#" + CSS.escape(node.id));
        break;
      }
      let seg = node.localName;
      const cls = [...node.classList].filter(stableClass).slice(0, 2);
      if (cls.length) seg += cls.map((c) => "." + CSS.escape(c)).join("");
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter((s) => {
          try {
            return s.matches(seg);
          } catch {
            return false;
          }
        });
        if (same.length > 1) {
          const localName = node.localName;
          const idx = [...parent.children].filter((s) => s.localName === localName).indexOf(node) + 1;
          seg += `:nth-of-type(${idx})`;
        }
      }
      parts2.unshift(seg);
      node = parent;
    }
    const sel = parts2.join(" > ");
    try {
      if (document.querySelectorAll(sel).length === 1) return sel;
    } catch {
    }
    const full = [];
    let n = el;
    while (n && n !== document.body) {
      const p = n.parentElement;
      if (!p) break;
      const localName = n.localName;
      const idx = [...p.children].filter((s) => s.localName === localName).indexOf(n) + 1;
      full.unshift(`${localName}:nth-of-type(${idx})`);
      n = p;
    }
    return "body > " + full.join(" > ");
  }

  // src/sites.ts
  function toggleSiteRule(el) {
    const existing = ruleFor(el);
    if (existing) {
      saveRules(siteRules.filter((r) => r !== existing));
      if (el.classList.contains(RTL_CLASS)) revert(el, true);
      hudSet(`Forgot this element for <b>${esc(HOST)}</b>`, true);
    } else {
      saveRules([...siteRules, cssPath(el)]);
      if (el.classList.contains(RTL_CLASS)) el.setAttribute(SRC_ATTR, "site");
      else applyRTL(el, "site");
      hudSet(`Remembered for <b>${esc(HOST)}</b> — applied on every visit`, true);
    }
  }
  function applySiteRules(root = document) {
    if (flags.paused || !siteRules.length) return;
    for (const sel of siteRules) {
      let list;
      try {
        list = [...root.querySelectorAll(sel)];
        if (root instanceof Element && root.matches(sel)) list.push(root);
      } catch {
        continue;
      }
      for (const el of list) {
        if (el.classList.contains(RTL_CLASS) || el.hasAttribute(SKIP_ATTR) || el.closest("." + RTL_CLASS))
          continue;
        applyRTL(el, "site", true);
      }
    }
  }
  function removeRule(sel) {
    saveRules(siteRules.filter((r) => r !== sel));
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.getAttribute(SRC_ATTR) === "site") revert(el, false, true);
      });
    } catch {
    }
  }

  // src/pick.ts
  var hovered = null;
  var pickRaw = null;
  var depthStack = [];
  var lastMouseTarget = null;
  function trackMouse() {
    document.addEventListener(
      "mousemove",
      (e) => {
        lastMouseTarget = deepTarget(e);
      },
      true
    );
  }
  var pickTargetFor = (raw) => {
    if (!raw) return null;
    return raw.closest("." + RTL_CLASS) ?? smartTarget(raw);
  };
  function setHover(el) {
    hovered = el;
    drawHover(el);
  }
  function depth(dir) {
    if (!hovered) return;
    if (dir < 0) {
      const p = hovered.parentElement;
      if (!p || p === document.body || p === document.documentElement) return;
      depthStack.push(hovered);
      setHover(p);
    } else {
      const c = depthStack.pop();
      if (c && c.isConnected) setHover(c);
    }
  }
  var onPickMove = (e) => {
    pickRaw = deepTarget(e);
    depthStack = [];
    setHover(pickTargetFor(pickRaw));
  };
  var onPickReflow = () => {
    if (hovered && hovered.isConnected) drawHover(hovered);
  };
  var onPickWheel = (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    depth(e.deltaY < 0 ? -1 : 1);
  };
  var onPickClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hovered || !hovered.isConnected) return;
    if (e.shiftKey) toggleSiteRule(hovered);
    else toggleExact(hovered);
    if (!hovered.isConnected)
      hovered = pickRaw && pickRaw.isConnected ? pickTargetFor(pickRaw) : null;
    setHover(hovered);
    updateHud();
  };
  var stopEvt = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  function startPick() {
    if (flags.picking) return;
    flags.picking = true;
    document.body.classList.add("tm-rtl-picking");
    showBeam(true);
    document.addEventListener("mousemove", onPickMove, true);
    document.addEventListener("scroll", onPickReflow, {
      capture: true,
      passive: true
    });
    window.addEventListener("resize", onPickReflow, { passive: true });
    document.addEventListener("wheel", onPickWheel, {
      capture: true,
      passive: false
    });
    document.addEventListener("click", onPickClick, true);
    document.addEventListener("mousedown", stopEvt, true);
    pickRaw = lastMouseTarget;
    depthStack = [];
    setHover(pickTargetFor(pickRaw));
    updateHud();
  }
  function stopPick() {
    if (!flags.picking) return;
    flags.picking = false;
    document.body.classList.remove("tm-rtl-picking");
    showBeam(false);
    document.removeEventListener("mousemove", onPickMove, true);
    document.removeEventListener("scroll", onPickReflow, { capture: true });
    window.removeEventListener("resize", onPickReflow);
    document.removeEventListener("wheel", onPickWheel, { capture: true });
    document.removeEventListener("click", onPickClick, true);
    document.removeEventListener("mousedown", stopEvt, true);
    setHover(null);
    updateHud();
  }
  var togglePick = () => {
    if (flags.picking) stopPick();
    else startPick();
  };
  function clearHover() {
    if (flags.picking) setHover(null);
  }

  // src/text.ts
  function rtlRatio(text) {
    let rtl = 0, total = 0;
    for (const ch of text) {
      if (!LETTER.test(ch)) continue;
      total++;
      if (RTL_CHAR.test(ch)) rtl++;
    }
    return { rtl, total };
  }
  function isMostlyRTL(text) {
    const { rtl, total } = rtlRatio(text);
    return total >= 3 && rtl / total >= AUTO_RATIO;
  }

  // src/observer.ts
  var mo = null;
  var moTimer = 0;
  var onFlush = null;
  var pending = /* @__PURE__ */ new Set();
  var setFlushHandler = (fn) => {
    onFlush = fn;
  };
  function ensureObserver() {
    if (mo || !document.body) return;
    mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "childList")
          m.addedNodes.forEach((n) => {
            if (n instanceof Element) pending.add(n);
            else if (n.parentElement) pending.add(n.parentElement);
          });
        else if (m.target.parentElement) pending.add(m.target.parentElement);
      }
      if (pending.size && !moTimer)
        moTimer = window.setTimeout(flushPending, 250);
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  function flushPending() {
    moTimer = 0;
    const roots = [...pending];
    pending.clear();
    if (flags.paused || !onFlush) return;
    for (const n of roots) {
      if (!n.isConnected) continue;
      const el = n.matches(AUTO_CANDIDATES) ? n : n.closest(AUTO_CANDIDATES) ?? n;
      onFlush(el);
    }
  }

  // src/auto.ts
  var siteEnabled = () => getValue(K.autoSites, []).includes(HOST);
  var auto = {
    global: getValue(K.auto, false),
    site: siteEnabled(),
    on: false,
    count: 0
  };
  auto.on = auto.global || auto.site;
  function ownText(el) {
    let out = "";
    (function walk(n) {
      for (const c of n.childNodes) {
        if (out.length > 2e3) return;
        if (c instanceof Text) out += c.nodeValue ?? "";
        else if (c instanceof Element && INLINE_TAGS.has(c.localName) && !c.classList.contains(RTL_CLASS) && !c.matches(PROTECTED))
          walk(c);
      }
    })(el);
    return out;
  }
  function considerAuto(el) {
    if (!el.isConnected || el.classList.contains(RTL_CLASS) || el.hasAttribute(SKIP_ATTR))
      return;
    const text = ownText(el);
    if (text.length < 3 || !isMostlyRTL(text)) return;
    if (el.closest(
      `.${RTL_CLASS}, ${PROTECTED}, ${EDITABLE}, textarea, input, select, script, style`
    ))
      return;
    if (getComputedStyle(el).direction === "rtl") return;
    applyRTL(el, "auto", true);
    auto.count++;
  }
  var idle = (fn) => {
    if ("requestIdleCallback" in window)
      requestIdleCallback(fn, { timeout: 800 });
    else setTimeout(fn, 16);
  };
  function autoScan(root) {
    if (!auto.on || flags.paused || !root) return;
    const nodes = [...root.querySelectorAll(AUTO_CANDIDATES)];
    if (root instanceof Element && root.matches(AUTO_CANDIDATES))
      nodes.unshift(root);
    let i = 0;
    const step = () => {
      const end = Math.min(i + 150, nodes.length);
      for (; i < end; i++) {
        const el = nodes[i];
        if (el) considerAuto(el);
      }
      if (i < nodes.length) idle(step);
    };
    idle(step);
  }
  function applyAutoState() {
    const wasOn = auto.on;
    auto.on = auto.global || auto.site;
    if (auto.on) {
      flags.paused = false;
      ensureObserver();
      if (!wasOn) autoScan(document.body);
    } else if (wasOn) {
      document.querySelectorAll(`.${RTL_CLASS}[${SRC_ATTR}="auto"]`).forEach((el) => revert(el, false, true));
      auto.count = 0;
    }
  }
  function setAuto(on) {
    auto.global = on;
    setValue(K.auto, on);
    applyAutoState();
  }
  function setSiteAuto(on) {
    auto.site = on;
    const sites = getValue(K.autoSites, []).filter((host2) => host2 !== HOST);
    if (on) sites.push(HOST);
    setValue(K.autoSites, sites);
    applyAutoState();
  }

  // src/ui-css.ts
  var UI_CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .panel { position: fixed; top: 24px; right: 24px; width: 380px; max-height: 76vh; display: flex; flex-direction: column;
             background: #fff; color: #111827; font: 13px/1.45 ${UI_FONT}; direction: ltr; border-radius: 16px; overflow: hidden;
             box-shadow: 0 10px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06); z-index: ${Z}; }
    .hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 14px; }
    .hdr .t { font-weight: 600; }
    .hdr .t small { display: block; font-weight: 400; color: #9ca3af; font-size: 11px; margin-top: 1px; }
    .x { border: 0; background: transparent; color: #9ca3af; font-size: 14px; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
    .x svg { fill: currentColor; }
    .x:hover { background: #f3f4f6; color: #111827; }
    .tabs { display: flex; margin: 0 16px 12px; padding: 3.5px; background: #f3f4f6; border-radius: 9999px; gap: 4px; }
    .tab { flex: 1; border: 0; background: transparent; font: inherit; font-size: 13px; font-weight: 500; color: #6b7280; padding: 6px 2px; border-radius: 9999px; cursor: pointer; transition: color 0.15s; }
    .tab.on { background: #fff; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04); }
    .sec { display: none; flex-direction: column; min-height: 0; }
    .sec.on { display: flex; }
    .q-wrap { position: relative; display: flex; flex-direction: column; margin: 0 16px 12px; }
    .q { position: relative; margin: 0; padding: 10px 16px 10px 38px; border: 1px solid #e5e7eb; border-radius: 9999px; font: inherit; outline: none; background: transparent; color: inherit; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; font-size: 13px; }
    .q-wrap svg { position: absolute; left: 16px; top: 12px; fill: #9ca3af; pointer-events: none; z-index: 1; }
    .q:focus { border-color: #d1d5db; background: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
    .list { overflow-y: auto; padding: 0 4px; flex: 1; min-height: 110px; border-bottom: 1px solid transparent; margin: 0; }
    .item { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 16px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin: 0; }
    .item:hover { background: #f3f4f6; }
    .item.on { background: #f3f4f6; } .item.on .sample { color: #111827; }
    .item.on .name::before { content: ""; position: absolute; left: 14px; top: 12px; width: 4px; height: 9px; border: solid #111827; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
    .name { padding-left: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #111827; }
    .sample { font-size: 14px; color: #9ca3af; white-space: nowrap; direction: rtl; }
    .empty { padding: 32px 16px; text-align: center; color: #9ca3af; font-size: 13px; line-height: 1.5; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; }
    .row + .row, .ftr, .q-wrap + .row { border-top: 1px solid #f3f4f6; }
    .row b { display: block; font-weight: 500; }
    .row small, .muted { color: #9ca3af; font-size: 11px; line-height: 1.4; }
    .ftr { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; font-size: 11px; color: #9ca3af; }
    .msg { flex: 1; line-height: 1.4; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid transparent; background: #f3f4f6; color: #111827; font: inherit; font-size: 13px; font-weight: 500; padding: 7px 12px; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s, color 0.15s; }
    .btn svg { fill: currentColor; opacity: 0.6; }
    .btn:hover { background: #e5e7eb; color: #111827; } .btn:disabled { opacity: .5; cursor: default; }
    .btn.set { background: #fff; border: 1px solid #d1d5db; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-radius: 6px; } .btn.set:hover { background: #f9fafb; border-color: #d1d5db; }
    .btn.pri { background: #111827; border-color: #111827; color: #fff; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,.08); border-radius: 6px; } .btn.pri:hover { background: #374151; border-color: #374151; }
    .kbd { min-width: 64px; text-align: center; border: 1px solid #e5e7eb; background: transparent; color: #111827; font: 500 12px ${UI_FONT}; letter-spacing: .04em;
           padding: 4px 6px; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
    .kbd:hover { border-color: #d1d5db; background: #f9fafb; }
    .kbd.rec { border-color: #111827; background: #111827; color: #fff; box-shadow: none; font-weight: 500; font-size: 11px; padding: 4px 8px; border-radius: 6px; }
    .kbd.fixed { cursor: default; color: #9ca3af; }
    .hint { min-height: 16px; padding: 4px 14px 0; font-size: 11px; color: #111827; }

    .sw { position: relative; width: 34px; height: 20px; flex: none; border-radius: 10px; overflow: hidden; }
    .sw input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
    .sw i { position: absolute; inset: 0; background: rgba(0,0,0,0.04); border: 1px solid rgba(17,24,39,0.15); border-radius: 10px; transition: background .15s, border-color .15s; pointer-events: none; }
    .sw i::after { content: ""; position: absolute; top: 1px; left: 1.5px; width: 15px; height: 15px; background: #fff; border-radius: 50%; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
    .sw input:checked + i { background: #111827; border-color: #111827; } .sw input:checked + i::after { transform: translateX(14px); background: #ffffff; box-shadow: none; }
    .rule { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; margin: 0; }
    .rule:hover { background: #f3f4f6; }
    .rule code { flex: 1; font: 11px ${MONO}; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: ltr; text-align: left; background: transparent; }
    .card { position: fixed; right: 24px; bottom: 24px; width: 360px; background: #fff; color: #111827; font: 13px/1.45 ${UI_FONT}; direction: ltr;
            border-radius: 16px; padding: 20px 20px 18px; box-shadow: 0 10px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06); z-index: ${Z}; }
    .card .t { display: flex; align-items: center; gap: 10px; font-weight: 600; margin-bottom: 12px; font-size: 14px; } .card .t small { display: block; font-weight: 400; color: #9ca3af; font-size: 11px; margin-top: 4px; }
    .card .r { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 13px; }
    .card .r.end { border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 14px; }
    .card .r .kbd { min-width: 58px; padding: 4px 6px; font-size: 11px; cursor: default; }
    .card label { display: flex; align-items: center; gap: 10px; margin: 12px 0 0; padding: 6px 0; font-size: 13px; cursor: pointer; }
    .card .b { display: flex; justify-content: flex-end; gap: 8px; margin: 16px 0 0; }
    .card .b.row { display: flex; align-items: center; justify-content: space-between; }
    .card .row { border-top: 1px solid #f3f4f6; margin: 0 -16px; padding: 12px 16px 0; display: flex; align-items: center; justify-content: space-between; }
    @media (prefers-color-scheme: dark) {
      .panel, .card { background: rgba(22, 22, 22, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,0.1); }
      .sample, .ftr, .x, .row small, .muted, .tab, .hdr .t small, .card .t small { color: #888888; }
      .x { color: #888888; } .x:hover { background: rgba(255,255,255,0.06); color: #ffffff; }
      .tabs { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 3.5px; box-shadow: inset 0 1px 2px rgba(0,0,0,.2); }
      .tab:hover:not(.on) { color: #cccccc; }
      .tab.on { background: rgba(255,255,255,0.08); color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,.2), 0 0 0 1px rgba(255,255,255,0.04); }
      .q { background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); } .q:focus { background: transparent; border-color: rgba(255,255,255,0.3); box-shadow: 0 0 0 3px rgba(255,255,255,0.05); }
      .q-wrap svg { fill: #6b7280; }
      .item:hover, .rule:hover { background: rgba(255,255,255,0.06); } .item.on { background: rgba(255,255,255,0.1); } .item.on .sample { color: #ffffff; }
      .item.on .name::before { border-color: #ffffff; left: 14px; }
      .name { color: #ffffff; }
      .sample { color: #888888; }
      .ftr, .row + .row, .q-wrap + .row { border-top: 1px solid rgba(255,255,255,0.06); }
      .card .row { border-color: rgba(255,255,255,0.06); }
      .card .r.end { border-color: rgba(255,255,255,0.06); }
      .btn { background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #e5e7eb; box-shadow: none; font-weight: 500; border-radius: 6px; } .btn:hover { background: rgba(255,255,255,0.1); border-color: transparent; color: #ffffff; }
      .btn.set { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #fff; box-shadow: none; border-radius: 6px; } .btn.set:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.25); }
      .kbd { background: rgba(255,255,255,0.06); border-color: transparent; color: #a0a0a0; box-shadow: none; border-radius: 6px; } .kbd:hover { background: rgba(255,255,255,0.1); border-color: transparent; color: #ffffff; }
      .btn.pri { background: #ffffff; border-color: #ffffff; color: #111827; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,.15); border-radius: 6px; } .btn.pri:hover { background: #f3f4f6; border-color: #f3f4f6; }
      .btn svg { fill: currentColor; opacity: 1; }
      .kbd.rec { background: #e5e5e5; color: #111; border-color: #e5e5e5; box-shadow: none; font-weight: 500; font-size: 11px; padding: 4px 8px; border-radius: 6px; } .kbd.fixed { color: #888; background: transparent; border-color: #2a2a2a; box-shadow: none; }
      .hint { color: #ffffff; } .sw i { background: rgba(0,0,0,0.2); border: 1px solid #444; } .sw i::after { background: #888888; box-shadow: none; top: 1px; left: 1.5px; width: 15px; height: 15px; } .sw input:checked + i { background: #ededed; border-color: #ededed; } .sw input:checked + i::after { background: #111; transform: translateX(14px); }
      .rule code { color: #888888; background: transparent; }
    }`;

  // src/panel-markup.ts
  function panelMarkup() {
    return `
      <style>${UI_CSS}</style>
      <div class="panel">
        <div class="hdr">
          <div class="t" style="display:flex;align-items:center;gap:10px">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M9 15L15 9M15 9H11M15 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div>RTL Anywhere<small>Configure behavior and appearance</small></div>
          </div>
          <button class="x" title="Close" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 1L1 11M1 1L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="tabs">
          <button class="tab" data-tab="font">Font</button>
          <button class="tab" data-tab="keys">Shortcuts</button>
          <button class="tab" data-tab="auto">Auto</button>
          <button class="tab" data-tab="sites">Sites</button>
        </div>

        <div class="sec" data-sec="font">
          <div class="q-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M10 2a8 8 0 105.29 14.71l5 5 1.42-1.42-5-5A8 8 0 0010 2zm0 14a6 6 0 116-6 6 6 0 01-6 6z"/></svg>
            <input class="q" type="text" placeholder="Search, or type any font name…" spellcheck="false" autocomplete="off">
          </div>
          <div class="list"></div>
          <div class="ftr"><span class="msg"></span><button class="btn load">Load system fonts</button></div>
        </div>

        <div class="sec" data-sec="keys">
          <div class="row"><div><b>Toggle RTL</b><small>Selected text, or the element under the cursor</small></div><button class="kbd" data-sc="toggle"></button></div>
          <div class="row"><div><b>Pick mode</b><small>Hover to preview, click to toggle, ⇧click to remember</small></div><button class="kbd" data-sc="pick"></button></div>
          <div class="row"><div><b>Undo all</b><small>Revert every change on this page</small></div><button class="kbd" data-sc="undo"></button></div>
          <div class="row"><div><b>In pick mode</b><small>↑ / ↓ or ⌥ + wheel: parent / child · Esc: exit</small></div><span class="kbd fixed">↑ ↓ Esc</span></div>
          <div class="hint"></div>
          <div class="ftr"><span class="msg">Click a shortcut to change it. Saved globally.</span><button class="btn reset">Reset</button></div>
        </div>

        <div class="sec" data-sec="auto">
          <div class="row">
            <div><b>All sites</b><small>Auto-detect Persian, Arabic and Hebrew text everywhere.</small></div>
            <label class="sw"><input type="checkbox" class="auto-global"><i></i></label>
          </div>
          <div class="row">
            <div><b>This site</b><small>Auto-detect only on ${esc(HOST)} when the global option is off.</small></div>
            <label class="sw"><input type="checkbox" class="auto-site"><i></i></label>
          </div>
          <div class="ftr"><span class="msg auto-msg"></span></div>
        </div>

        <div class="sec" data-sec="sites">
          <div class="row" style="padding-bottom:6px"><div><b>Remembered on ${esc(HOST)}</b><small>In pick mode, ⇧click an element to save it here. Hover a rule to see it.</small></div></div>
          <div class="list rules"></div>
          <div class="ftr"><span class="msg sites-msg"></span><button class="btn forget">Forget this site</button></div>
        </div>
      </div>`;
  }

  // src/panel.ts
  var panelHost = null;
  var panelOpen = () => panelHost;
  var onOutsideDown = (e) => {
    if (panelHost && !e.composedPath().includes(panelHost)) closePanel();
  };
  function closePanel() {
    if (!panelHost) return;
    stopRecord();
    drawHover(null);
    panelHost.remove();
    panelHost = null;
    document.removeEventListener("mousedown", onOutsideDown, true);
  }
  function openPanel(tab = "font") {
    closePanel();
    const host2 = document.createElement("div");
    panelHost = host2;
    const root = host2.attachShadow({ mode: "open" });
    root.innerHTML = panelMarkup();
    document.documentElement.appendChild(host2);
    document.addEventListener("mousedown", onOutsideDown, true);
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [
      ...root.querySelectorAll(s)
    ];
    $(".x").addEventListener("click", closePanel);
    function showTab(name) {
      stopRecord();
      drawHover(null);
      $$(".tab").forEach((x) => x.classList.toggle("on", x.dataset.tab === name));
      $$(".sec").forEach((s) => s.classList.toggle("on", s.dataset.sec === name));
      if (name === "font") q.focus();
    }
    $$(".tab").forEach(
      (t) => t.addEventListener("click", () => showTab(t.dataset.tab))
    );
    const list = $('[data-sec="font"] .list'), q = $(".q"), msg = $('[data-sec="font"] .msg'), loadBtn = $(".load");
    let fonts = getValue(K.fonts, []);
    let current = getValue(K.font, "");
    const queryLocalFonts = PAGE.queryLocalFonts;
    if (!queryLocalFonts) {
      loadBtn.hidden = true;
      msg.textContent = "This browser can’t list system fonts. Type a font name above.";
    } else {
      msg.textContent = fonts.length ? `${fonts.length} system fonts` : "Load the list once; it’s cached.";
      if (fonts.length) loadBtn.textContent = "Refresh";
    }
    function item(name, label) {
      const el = document.createElement("div");
      el.className = "item" + (name === current ? " on" : "");
      el.dataset.font = name;
      const n = document.createElement("span");
      n.className = "name";
      n.textContent = label || name;
      const s = document.createElement("span");
      s.className = "sample";
      if (name) {
        s.textContent = "نمونهٔ متن ۱۲۳";
        s.style.fontFamily = `"${name}"`;
      }
      el.append(n, s);
      return el;
    }
    function render() {
      const raw = q.value.trim(), term = raw.toLowerCase();
      const frag = document.createDocumentFragment();
      if (!term) frag.appendChild(item("", "Default — leave font untouched"));
      const shown = fonts.filter((f) => f.toLowerCase().includes(term));
      shown.forEach((f) => frag.appendChild(item(f)));
      if (raw && !fonts.some((f) => f.toLowerCase() === term))
        frag.appendChild(item(raw, `Use “${raw}”`));
      if (!shown.length && !raw) {
        const e = document.createElement("div");
        e.className = "empty";
        e.textContent = queryLocalFonts ? "No fonts loaded yet — click “Load system fonts” below, or type a name above." : "Type the exact name of an installed font above.";
        frag.appendChild(e);
      }
      list.replaceChildren(frag);
    }
    list.addEventListener("click", (e) => {
      const el = e.target instanceof Element ? e.target.closest(".item") : null;
      if (!el) return;
      current = el.dataset.font ?? "";
      setValue(K.font, current);
      applyTypography();
      render();
    });
    q.addEventListener("input", render);
    loadBtn.addEventListener("click", async () => {
      if (!queryLocalFonts) return;
      loadBtn.disabled = true;
      msg.textContent = "Loading…";
      try {
        const data = await queryLocalFonts.call(PAGE);
        fonts = [...new Set(Array.from(data, (f) => f.family))].sort(
          (a, b) => a.localeCompare(b)
        );
        setValue(K.fonts, fonts);
        msg.textContent = `${fonts.length} system fonts`;
        loadBtn.textContent = "Refresh";
        render();
      } catch (err) {
        const e = err instanceof Error ? err : null;
        if (!isSecureContext)
          msg.textContent = "Needs an HTTPS page — open the panel on any https:// site.";
        else if (e?.name === "NotAllowedError")
          msg.textContent = "Fonts permission is blocked for this site. Address bar icon → Site settings → Fonts → Allow, then retry.";
        else if (e?.name === "SecurityError")
          msg.textContent = "This page’s Permissions-Policy disables font access. Try another site.";
        else
          msg.textContent = `${e?.name || "Error"}: ${e?.message || "unavailable here"}`;
      } finally {
        loadBtn.disabled = false;
      }
    });
    const hint = $(".hint");
    const kbdBtns = $$(".kbd[data-sc]");
    const scOf = (b) => b.dataset.sc;
    const renderKeys = () => kbdBtns.forEach((b) => {
      b.textContent = formatCombo(shortcuts[scOf(b)]);
    });
    kbdBtns.forEach(
      (b) => b.addEventListener("click", () => {
        if (isRecording() && recordingBtn() === b) {
          stopRecord();
          hint.textContent = "";
          return;
        }
        startRecord(scOf(b), b, hint, renderKeys);
      })
    );
    $(".reset").addEventListener("click", () => {
      stopRecord();
      resetShortcuts();
      hint.textContent = "Restored defaults.";
      renderKeys();
    });
    renderKeys();
    const autoGlobal = $(".auto-global"), autoSite = $(".auto-site"), autoMsg = $(".auto-msg");
    const renderAuto = () => {
      autoGlobal.checked = auto.global;
      autoSite.checked = auto.site;
      autoMsg.textContent = auto.global ? `Enabled globally · ${auto.count} detected here.` : auto.site ? `Enabled for ${HOST} · ${auto.count} detected here.` : "Off for this site.";
    };
    autoGlobal.addEventListener("change", () => {
      setAuto(autoGlobal.checked);
      renderAuto();
      setTimeout(renderAuto, 1200);
    });
    autoSite.addEventListener("change", () => {
      setSiteAuto(autoSite.checked);
      renderAuto();
      setTimeout(renderAuto, 1200);
    });
    renderAuto();
    const rulesBox = $(".rules"), sitesMsg = $(".sites-msg"), forgetBtn = $(".forget");
    function renderSites() {
      const others = Object.keys(allSites()).filter((h) => h !== HOST).length;
      rulesBox.replaceChildren();
      if (!siteRules.length) {
        const e = document.createElement("div");
        e.className = "empty";
        e.textContent = "Nothing saved for this site yet.";
        rulesBox.appendChild(e);
      }
      for (const sel of siteRules) {
        const r = document.createElement("div");
        r.className = "rule";
        const c = document.createElement("code");
        c.textContent = sel;
        c.title = sel;
        const x = document.createElement("button");
        x.className = "x";
        x.textContent = "✕";
        x.title = "Remove";
        x.addEventListener("click", () => {
          removeRule(sel);
          drawHover(null);
          renderSites();
        });
        r.addEventListener("mouseenter", () => {
          try {
            const el = document.querySelector(sel);
            if (el) {
              el.scrollIntoView({ block: "nearest" });
              drawHover(el);
            }
          } catch {
          }
        });
        r.addEventListener("mouseleave", () => drawHover(null));
        r.append(c, x);
        rulesBox.appendChild(r);
      }
      sitesMsg.textContent = `${siteRules.length} rule${siteRules.length === 1 ? "" : "s"} here · ${others} other site${others === 1 ? "" : "s"}`;
      forgetBtn.disabled = !siteRules.length;
    }
    forgetBtn.addEventListener("click", () => {
      [...siteRules].forEach(removeRule);
      renderSites();
    });
    renderSites();
    render();
    showTab(tab);
  }

  // src/onboard.ts
  var host = null;
  function dismissOnboard() {
    if (!host) return false;
    setValue(K.onboarded, true);
    host.remove();
    host = null;
    return true;
  }
  function maybeOnboard() {
    if (!IS_TOP || getValue(K.onboarded, false) || document.visibilityState !== "visible")
      return;
    host = document.createElement("div");
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>${UI_CSS}</style>
      <div class="card">
        <div class="t">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M9 15L15 9M15 9H11M15 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div>RTL Anywhere is ready<small>Any text, any site, one shortcut.</small></div>
        </div>
        <div class="r"><span class="kbd">${esc(formatCombo(shortcuts.toggle))}</span><span>Toggle RTL on the selection or the element under the cursor</span></div>
        <div class="r"><span class="kbd">${esc(formatCombo(shortcuts.pick))}</span><span>Pick mode — click elements; ⇧click remembers them for the site</span></div>
        <div class="r end"><span class="kbd">${esc(formatCombo(shortcuts.undo))}</span><span>Undo everything on the page</span></div>
      <div class="row b">
        <div style="flex: 1;"><b>Settings</b><small style="margin-top:2px;">Configure fonts, shortcuts and auto-detect mode.</small></div>
        <div style="margin-top:0"><button class="btn set"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Settings</button><button class="btn pri ok">Continue</button></div>
      </div>`;
    document.documentElement.appendChild(host);
    root.querySelector(".ok")?.addEventListener("click", () => dismissOnboard());
    root.querySelector(".set")?.addEventListener("click", () => {
      dismissOnboard();
      openPanel();
    });
  }

  // src/main.ts
  initStyles();
  applyTypography();
  trackMouse();
  setFlushHandler((el) => {
    applySiteRules(el);
    autoScan(el);
  });
  var undoAllAndClear = () => {
    undoAll();
    clearHover();
  };
  onMenu("Pick mode", togglePick);
  onMenu("Undo all on this page", undoAllAndClear);
  onMenu("Settings…", () => openPanel());
  document.addEventListener(
    "keydown",
    (e) => {
      if (isRecording()) return;
      const panel = panelOpen();
      if (e.code === "Escape") {
        if (panel) {
          e.preventDefault();
          closePanel();
          return;
        }
        if (dismissOnboard()) {
          e.preventDefault();
          return;
        }
        if (flags.picking) {
          e.preventDefault();
          stopPick();
        }
        return;
      }
      if (panel && e.composedPath().includes(panel)) return;
      if (flags.picking && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.code === "ArrowUp" || e.code === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          depth(e.code === "ArrowUp" ? -1 : 1);
          return;
        }
      }
      if (matches(e, shortcuts.pick)) {
        e.preventDefault();
        e.stopPropagation();
        togglePick();
      } else if (matches(e, shortcuts.toggle)) {
        e.preventDefault();
        e.stopPropagation();
        action(lastMouseTarget);
      } else if (matches(e, shortcuts.undo)) {
        e.preventDefault();
        e.stopPropagation();
        undoAllAndClear();
      }
    },
    true
  );
  if (document.body) {
    applySiteRules(document);
    autoScan(document.body);
    if (auto.on || siteRules.length) ensureObserver();
  }
  setTimeout(maybeOnboard, 1200);
})();
