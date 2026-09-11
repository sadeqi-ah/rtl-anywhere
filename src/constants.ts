// Class, attributes, selector lists and regexes shared across modules.
// All values here are constants — no DOM access, no storage reads.

export const RTL_CLASS = "tm-rtl";
export const WRAP_ATTR = "data-tm-rtl-wrap"; // spans we created around selected text
export const PREV_DIR = "data-tm-rtl-dir"; // original dir attribute, restored on revert
export const SRC_ATTR = "data-tm-rtl-src";
export const SKIP_ATTR = "data-tm-rtl-skip"; // user reverted this; auto-detect / site rules must leave it alone

/**
 * Why an element is RTL, stored in SRC_ATTR. Turning auto-detect off queries
 * `[data-tm-rtl-src="auto"]`, so a typo in one of these would silently strand
 * elements that can never be reverted — that is why it is a union, not a string.
 */
export type RtlSource = "manual" | "auto" | "site";

/** Feedback flash: doubles as an overlay CSS class and, upper-cased, as its label. */
export type FlashMode = "rtl" | "ltr";

/** Storage keys. */
export const K = {
  font: "rtl-font",
  fonts: "system-fonts",
  sc: "shortcuts",
  auto: "auto-detect",
  autoSites: "auto-detect-sites",
  sites: "site-rules",
  onboarded: "onboarded",
} as const;

export const Z = 2147483647;
export const UI_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const MONO = "ui-monospace, Menlo, Consolas, monospace";

// Elements that must never become RTL (code, math, editors)
export const PROTECTED = [
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
  '[class*="sourceCode"]',
].join(",");

// Elements whose font must never be replaced (icon fonts, emoji, svg)
export const FONT_SAFE = [
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
  '[class*="emoji"]',
].join(",");

export const FIELDS = "input, textarea, select, button";
export const EDITABLE = '[contenteditable]:not([contenteditable="false"])';

// Cheap inline heuristic used by auto-detect (no getComputedStyle)
export const INLINE_TAGS = new Set([
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
  "wbr",
]);

export const AUTO_CANDIDATES =
  "p, li, h1, h2, h3, h4, h5, h6, blockquote, dd, dt, td, th, figcaption, summary, label, div, section, article";

// Hebrew, Arabic, Syriac, Thaana + presentation forms
export const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
export const LETTER = /\p{L}/u;

/** An element auto-detects as RTL when at least this share of its letters are RTL. */
export const AUTO_RATIO = 0.6;

// ---------- Pick-mode border beam ----------
export const BEAM_W = 1.5;
export const BEAM_BLUR = 12;
export const BEAM_SECS = 1.96;
