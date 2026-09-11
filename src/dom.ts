// DOM helpers: escaping, protected-region checks, and picking the element the user meant.
import { PROTECTED, FIELDS, EDITABLE } from "./constants.ts";

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);

export const isProtected = (el: Element | null): boolean =>
  !!el && !!el.closest(PROTECTED);

/** Pierces shadow roots, so pick mode works on sites built from web components. */
export const deepTarget = (e: Event): Element | null => {
  const t = e.composedPath ? e.composedPath()[0] : e.target;
  if (t instanceof Element) return t;
  return e.target instanceof Element ? e.target : null;
};

/** If the element is inside code/math, walk up until we're outside of it. */
export function climbOutOfProtected(el: Element | null): Element | null {
  while (el && el !== document.body) {
    const p = el.closest(PROTECTED);
    if (!p) return el;
    el = p.parentElement;
  }
  return el;
}

const isInlineLevel = (el: Element): boolean => {
  const d = getComputedStyle(el).display;
  return d.startsWith("inline") || d === "contents";
};

// Smart target: inline elements (span, a, b…) climb to the nearest block, which is what
// users almost always mean. Form fields are their own target; never climbs out of an editor.
export function smartTarget(raw: Element | null): Element | null {
  if (!raw) return null;
  let el = climbOutOfProtected(raw);
  if (!el || el === document.body || el === document.documentElement)
    return null;
  const field = el.closest(FIELDS);
  if (field) return field;
  const editRoot = el.closest(EDITABLE);
  let cur: Element = el;
  while (cur !== editRoot && isInlineLevel(cur)) {
    const p = cur.parentElement;
    if (!p || p === document.body || p === document.documentElement) break;
    cur = p;
  }
  return cur;
}

export function textNodesInRange(range: Range): Text[] {
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) return [root as Text];
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      range.intersectsNode(n) && n.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  return nodes;
}
