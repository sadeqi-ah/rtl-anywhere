// Auto-detect: paragraphs that are mostly RTL become RTL on their own.
import {
  RTL_CLASS,
  SRC_ATTR,
  SKIP_ATTR,
  PROTECTED,
  EDITABLE,
  INLINE_TAGS,
  AUTO_CANDIDATES,
  K,
} from "./constants.ts";
import { getValue, setValue } from "./gm.ts";
import { HOST } from "./env.ts";
import { applyRTL, revert } from "./core.ts";
import { isMostlyRTL } from "./text.ts";
import { flags } from "./state.ts";
import { ensureObserver } from "./observer.ts";

const siteEnabled = (): boolean => getValue(K.autoSites, []).includes(HOST);
export const auto = {
  global: getValue(K.auto, false),
  site: siteEnabled(),
  on: false,
  count: 0,
};
auto.on = auto.global || auto.site;

/** Text directly owned by an element (its text nodes + inline descendants), ignoring nested blocks. */
export function ownText(el: Element): string {
  let out = "";
  (function walk(n: Node) {
    for (const c of n.childNodes) {
      if (out.length > 2000) return; // long articles: a sample is enough to judge
      if (c instanceof Text) out += c.nodeValue ?? "";
      else if (
        c instanceof Element &&
        INLINE_TAGS.has(c.localName) &&
        !c.classList.contains(RTL_CLASS) &&
        !c.matches(PROTECTED)
      )
        walk(c);
    }
  })(el);
  return out;
}

function considerAuto(el: Element): void {
  if (
    !el.isConnected ||
    el.classList.contains(RTL_CLASS) ||
    el.hasAttribute(SKIP_ATTR)
  )
    return;
  const text = ownText(el);
  if (text.length < 3 || !isMostlyRTL(text)) return;
  if (
    el.closest(
      `.${RTL_CLASS}, ${PROTECTED}, ${EDITABLE}, textarea, input, select, script, style`,
    )
  )
    return;
  if (getComputedStyle(el).direction === "rtl") return; // page already handles it
  applyRTL(el, "auto", true);
  auto.count++;
}

// lib.dom types requestIdleCallback as always present, but Safari only shipped it
// in 16.4 — hence the `in` check rather than a truthiness test on the function.
const idle = (fn: () => void): void => {
  if ("requestIdleCallback" in window)
    requestIdleCallback(fn, { timeout: 800 });
  else setTimeout(fn, 16);
};

/** Scans in idle chunks so a big page never blocks the main thread. */
export function autoScan(root: Document | Element | null): void {
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

function applyAutoState(): void {
  const wasOn = auto.on;
  auto.on = auto.global || auto.site;
  if (auto.on) {
    flags.paused = false;
    ensureObserver();
    if (!wasOn) autoScan(document.body);
  } else if (wasOn) {
    document
      .querySelectorAll(`.${RTL_CLASS}[${SRC_ATTR}="auto"]`)
      .forEach((el) => revert(el, false, true));
    auto.count = 0;
  }
}

export function setAuto(on: boolean): void {
  auto.global = on;
  setValue(K.auto, on);
  applyAutoState();
}

export function setSiteAuto(on: boolean): void {
  auto.site = on;
  const sites = getValue(K.autoSites, []).filter((host) => host !== HOST);
  if (on) sites.push(HOST);
  setValue(K.autoSites, sites);
  applyAutoState();
}
