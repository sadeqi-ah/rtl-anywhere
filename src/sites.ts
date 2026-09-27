// Applying per-site rules (⇧click in pick mode). The rules themselves live in rules.ts.
import { RTL_CLASS, SRC_ATTR, SKIP_ATTR } from "./constants.ts";
import { HOST } from "./env.ts";
import { esc } from "./dom.ts";
import { applyRTL, revert } from "./core.ts";
import { hudSet } from "./overlay.ts";
import { flags } from "./state.ts";
import { siteRules, saveRules, ruleFor } from "./rules.ts";
import { cssPath, queryPath } from "./selector.ts";
import { ensureObserver } from "./observer.ts";

export function toggleSiteRule(el: Element): void {
  const existing = ruleFor(el);
  if (existing) {
    removeRule(existing);
    hudSet(`Forgot this element for <b>${esc(HOST)}</b>`, true);
  } else {
    const path = cssPath(el);
    if (!path) {
      hudSet("Cannot remember this element", true);
      return;
    }
    saveRules([...siteRules, path]);
    ensureObserver();
    if (el.classList.contains(RTL_CLASS)) el.setAttribute(SRC_ATTR, "site");
    else applyRTL(el, "site");
    hudSet(`Remembered for <b>${esc(HOST)}</b> — applied on every visit`, true);
  }
}

export function applySiteRules(root: Document | Element = document): void {
  if (flags.paused || !siteRules.length) return;
  for (const sel of siteRules) {
    let list: Element[];
    try {
      list = sel.includes(" >>> ")
        ? queryPath(document, sel).filter(
            (el) =>
              root === document ||
              el === root ||
              (root instanceof Element && root.shadowRoot?.contains(el)) ||
              root.contains(el),
          )
        : queryPath(root, sel);
    } catch {
      continue; // invalid or unsupported selector: skip, don't kill the loop
    }
    for (const el of list) {
      if (
        el.classList.contains(RTL_CLASS) ||
        el.hasAttribute(SKIP_ATTR) ||
        el.closest("." + RTL_CLASS)
      )
        continue;
      applyRTL(el, "site", true);
    }
  }
}

export function removeRule(sel: string): void {
  let matches: Element[] = [];
  try {
    matches = queryPath(document, sel);
  } catch {
    // selector no longer parses; the rule is gone either way
  }
  saveRules(siteRules.filter((r) => r !== sel));
  matches.forEach((el) => {
    if (el.getAttribute(SRC_ATTR) === "site") revert(el, false, true);
  });
}
