// Applying per-site rules (⇧click in pick mode). The rules themselves live in rules.ts.
import { RTL_CLASS, SRC_ATTR, SKIP_ATTR } from "./constants.ts";
import { HOST } from "./env.ts";
import { esc } from "./dom.ts";
import { applyRTL, revert } from "./core.ts";
import { hudSet } from "./overlay.ts";
import { flags } from "./state.ts";
import { siteRules, saveRules, ruleFor } from "./rules.ts";
import { cssPath } from "./selector.ts";

export function toggleSiteRule(el: Element): void {
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

export function applySiteRules(root: Document | Element = document): void {
  if (flags.paused || !siteRules.length) return;
  for (const sel of siteRules) {
    let list: Element[];
    try {
      list = [...root.querySelectorAll(sel)];
      if (root instanceof Element && root.matches(sel)) list.push(root);
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
  saveRules(siteRules.filter((r) => r !== sel));
  try {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.getAttribute(SRC_ATTR) === "site") revert(el, false, true);
    });
  } catch {
    // selector no longer parses; the rule is gone either way
  }
}
