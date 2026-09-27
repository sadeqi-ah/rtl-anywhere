// Mutation observer for dynamic content, shared by auto-detect and site rules.
// Batched on a 250ms timer so infinite-scroll feeds don't cause a scan per node.
// The scan itself is injected by main.ts (setFlushHandler), which keeps this module
// free of imports from auto.ts / sites.ts — no import cycle.
import { AUTO_CANDIDATES } from "./constants.ts";
import { initStyles } from "./styles.ts";
import { flags } from "./state.ts";

let moTimer = 0,
  onFlush: ((el: Element) => void) | null = null,
  onRefresh: ((el: Element) => void) | null = null;
const observers = new WeakMap<
  Document | ShadowRoot | Element,
  MutationObserver
>();
const pending = new Set<Element>();

export const setFlushHandler = (
  fn: (el: Element) => void,
  refresh?: (el: Element) => void,
): void => {
  onFlush = fn;
  onRefresh = refresh ?? null;
};

export function ensureObserver(
  root: Document | ShadowRoot | Element | null = document.body,
): void {
  if (!root || observers.has(root)) return;
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "childList")
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            pending.add(n);
            observeShadows(n);
          } else if (n.parentElement) pending.add(n.parentElement);
        });
      else if (m.target instanceof Element) pending.add(m.target);
      else if (m.target.parentElement) pending.add(m.target.parentElement);
    }
    if (pending.size && !moTimer)
      moTimer = window.setTimeout(flushPending, 250);
  });
  mo.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "id", "dir"],
  });
  observers.set(root, mo);
  observeShadows(root);
}

function observeShadows(root: Document | ShadowRoot | Element): void {
  const elements =
    root instanceof Element
      ? [root, ...root.querySelectorAll("*")]
      : root.querySelectorAll("*");
  for (const el of elements) {
    if (!el.shadowRoot) continue;
    initStyles(el.shadowRoot);
    ensureObserver(el.shadowRoot);
    for (const child of el.shadowRoot.children) pending.add(child);
  }
  if (pending.size && !moTimer) moTimer = window.setTimeout(flushPending, 250);
}

function flushPending(): void {
  moTimer = 0;
  const roots = [...pending];
  pending.clear();
  if (flags.paused || !onFlush) return;
  for (const n of roots) {
    if (!n.isConnected) continue;
    const el = n.matches(AUTO_CANDIDATES)
      ? n
      : (n.closest(AUTO_CANDIDATES) ?? n);
    onRefresh?.(el);
    onFlush(el);
  }
}
