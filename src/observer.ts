// Mutation observer for dynamic content, shared by auto-detect and site rules.
// Batched on a 250ms timer so infinite-scroll feeds don't cause a scan per node.
// The scan itself is injected by main.ts (setFlushHandler), which keeps this module
// free of imports from auto.ts / sites.ts — no import cycle.
import { AUTO_CANDIDATES } from "./constants.ts";
import { flags } from "./state.ts";

let mo: MutationObserver | null = null,
  moTimer = 0,
  onFlush: ((el: Element) => void) | null = null;
const pending = new Set<Element>();

export const setFlushHandler = (fn: (el: Element) => void): void => {
  onFlush = fn;
};

export function ensureObserver(): void {
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
    // window.setTimeout, not the bare global: @types/node (pulled in for the test
    // runner) otherwise types the return as NodeJS.Timeout instead of a number.
    if (pending.size && !moTimer)
      moTimer = window.setTimeout(flushPending, 250);
  });
  mo.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
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
    onFlush(el);
  }
}
