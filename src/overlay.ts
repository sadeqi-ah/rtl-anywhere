// Overlay layer (highlights, feedback tags, HUD).
// Drawn in a separate fixed layer like DevTools, so overflow:hidden can never clip it.
import { RTL_CLASS, SRC_ATTR } from "./constants.ts";
import type { FlashMode } from "./constants.ts";
import { esc } from "./dom.ts";
import { flags, countRTL } from "./state.ts";
import { ruleFor } from "./rules.ts";
import { overlayMarkup } from "./overlay-markup.ts";

export interface Parts {
  root: ShadowRoot;
  box: HTMLElement;
  label: HTMLElement;
  hud: HTMLElement;
  beam: HTMLElement;
}

let parts: Parts | null = null;

function overlay(): Parts {
  if (parts) return parts;
  const host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = overlayMarkup();
  document.documentElement.appendChild(host);
  // Non-null: the divs are in the markup helper.
  parts = {
    root,
    box: root.querySelector<HTMLElement>(".box")!,
    label: root.querySelector<HTMLElement>(".label")!,
    hud: root.querySelector<HTMLElement>(".hud")!,
    beam: root.querySelector<HTMLElement>(".beam")!,
  };
  return parts;
}

function place(node: HTMLElement, r: DOMRect, pad = 0): void {
  node.style.left = r.left - pad + "px";
  node.style.top = r.top - pad + "px";
  node.style.width = r.width + pad * 2 + "px";
  node.style.height = r.height + pad * 2 + "px";
}

function describe(el: Element): string {
  let s = esc(el.localName);
  if (el.id) s += "#" + esc(el.id);
  const cls = [...el.classList]
    .filter((c) => !c.startsWith("tm-rtl"))
    .slice(0, 2);
  if (cls.length) s += "." + cls.map(esc).join(".");
  const badges: string[] = [];
  if (el.classList.contains(RTL_CLASS)) badges.push("RTL");
  if (el.getAttribute(SRC_ATTR) === "auto") badges.push("auto");
  if (ruleFor(el)) badges.push("saved");
  return badges.length ? `${s} &nbsp;<b>${badges.join(" · ")}</b>` : s;
}

export function drawHover(el: Element | null): void {
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

// Feedback: blue ring + "RTL" tag when applied, gray ring + "LTR" tag when reverted.
// One ring per line box, so inline selections spanning lines look right.
export function flash(el: Element | null, mode: FlashMode): void {
  if (!el) return;
  const { root } = overlay();
  const rects = [...el.getClientRects()]
    .filter((r) => r.width || r.height)
    .slice(0, 24);
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

let hudTimer = 0;

export function hudSet(html: string, transient = false): void {
  const { hud } = overlay();
  hud.innerHTML = html;
  hud.classList.add("on");
  clearTimeout(hudTimer);
  if (transient)
    // window.setTimeout: see observer.ts — @types/node would type this as Timeout.
    hudTimer = window.setTimeout(
      () => (flags.picking ? updateHud() : hud.classList.remove("on")),
      1700,
    );
}

export function updateHud(): void {
  const { hud } = overlay();
  if (!flags.picking) {
    hud.classList.remove("on");
    return;
  }
  const sep = '<span class="sep">|</span>';
  hudSet(
    `Pick mode ${sep} <b>${countRTL()}</b> RTL on this page ${sep} <kbd>↑</kbd><kbd>↓</kbd> or <kbd>⌥</kbd> wheel: parent / child ${sep} <kbd>⇧</kbd> click remembers for this site ${sep} <kbd>Esc</kbd> exit`,
  );
}

/**
 * The pick-mode frame. Pure CSS once shown (conic-gradient spin + double mask),
 * so an idle beam costs nothing on the main thread.
 */
export function showBeam(on: boolean): void {
  overlay().beam.classList.toggle("on", on);
}
