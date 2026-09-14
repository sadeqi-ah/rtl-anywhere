// Apply / revert RTL on an element or a text selection, and the top-level toggle action.
import {
  RTL_CLASS,
  WRAP_ATTR,
  PREV_DIR,
  SRC_ATTR,
  SKIP_ATTR,
  EDITABLE,
} from "./constants.ts";
import type { RtlSource } from "./constants.ts";
import { isProtected, smartTarget, textNodesInRange } from "./dom.ts";
import { flash, hudSet } from "./overlay.ts";
import { touched, flags } from "./state.ts";

export function applyRTL(
  el: Element,
  src: RtlSource = "manual",
  quiet = false,
): void {
  if (!el.hasAttribute(PREV_DIR))
    el.setAttribute(PREV_DIR, el.getAttribute("dir") ?? "");
  // Do not force dir="rtl"/"auto" here. Mixed paragraphs that start with a
  // Latin product name (for example "auto-detect ... فارسی") keep the right
  // visual order only when the original bidi base direction is left alone.
  el.removeAttribute("dir");
  el.classList.add(RTL_CLASS);
  el.setAttribute(SRC_ATTR, src);
  el.removeAttribute(SKIP_ATTR);
  touched.add(el);
  if (!quiet) flash(el, "rtl");
}

/** Removes a wrapper span we added, returning the parent it lived in. */
function unwrap(span: Element): Node | null {
  const parent = span.parentNode;
  if (!parent) return null;
  while (span.firstChild) parent.insertBefore(span.firstChild, span);
  parent.removeChild(span);
  parent.normalize();
  return parent;
}

// byUser: mark it so auto-detect / site rules won't re-apply. quiet: no visual feedback.
export function revert(el: Element, byUser = false, quiet = false): void {
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

/** Toggle exactly this element (used by pick mode, where the user chose the depth). */
export function toggleExact(el: Element): void {
  if (el.classList.contains(RTL_CLASS)) revert(el, true);
  else applyRTL(el, "manual");
}

/** Toggle from a raw event target (hover / keyboard). */
export function toggleElement(raw: Element | null): void {
  if (!raw) return;
  const existing = raw.closest("." + RTL_CLASS);
  if (existing) {
    revert(existing, true);
    return;
  }
  const el = smartTarget(raw);
  if (el) applyRTL(el, "manual");
}

export function undoAll(): void {
  flags.paused = true;
  const els = [...touched].filter((e) => e.isConnected);
  els.forEach((el, i) => revert(el, false, i >= 40)); // only animate the first 40
  touched.clear();
  const n = els.length;
  hudSet(
    n
      ? `Reverted <b>${n}</b> element${n === 1 ? "" : "s"}`
      : "Nothing to undo on this page",
    true,
  );
}

function toggleSelection(sel: Selection): void {
  const range = sel.getRangeAt(0);
  const anc = range.commonAncestorContainer;
  const ancEl = anc instanceof Element ? anc : anc.parentElement;
  if (!ancEl) return;

  // Entirely inside an RTL block → revert it
  const existing = ancEl.closest("." + RTL_CLASS);
  if (existing) {
    revert(existing, true);
    sel.removeAllRanges();
    return;
  }

  // Inside a rich-text editor: don't inject spans (it would fight the editor) — toggle the block instead
  if (ancEl.closest(EDITABLE)) {
    sel.removeAllRanges();
    toggleElement(ancEl);
    return;
  }

  // Split the boundary text nodes and wrap each selected text node in a span
  const nodes = textNodesInRange(range);
  const first = nodes[0],
    last = nodes[nodes.length - 1];
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
    if (isProtected(t.parentElement)) continue; // skip code/math
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
  if (!wrapped) toggleElement(ancEl); // everything was code? try the element itself
}

/** What the toggle shortcut does: selection if there is one, else the hovered element. */
export function action(lastMouseTarget: Element | null): void {
  // Text selected inside an input/textarea → toggle the field itself
  const a = document.activeElement;
  if (
    (a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement) &&
    a.selectionStart !== a.selectionEnd
  ) {
    toggleElement(a);
    return;
  }
  const sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed && sel.toString().trim())
    toggleSelection(sel);
  else toggleElement(lastMouseTarget);
}
