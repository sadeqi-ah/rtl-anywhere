// Pick mode: hover to preview, click to toggle, ⇧click to remember for the site.
import { RTL_CLASS } from "./constants.ts";
import { smartTarget, deepTarget } from "./dom.ts";
import { drawHover, updateHud, showBeam } from "./overlay.ts";
import { toggleExact } from "./core.ts";
import { toggleSiteRule } from "./sites.ts";
import { flags } from "./state.ts";

let hovered: Element | null = null,
  pickRaw: Element | null = null,
  depthStack: Element[] = [];

/**
 * The element the cursor last moved over, tracked globally so the toggle shortcut
 * knows what to act on without a click.
 */
export let lastMouseTarget: Element | null = null;

export function trackMouse(): void {
  document.addEventListener(
    "mousemove",
    (e) => {
      lastMouseTarget = deepTarget(e);
    },
    true,
  );
}

const pickTargetFor = (raw: Element | null): Element | null => {
  if (!raw) return null;
  return raw.closest("." + RTL_CLASS) ?? smartTarget(raw);
};

function setHover(el: Element | null): void {
  hovered = el;
  drawHover(el);
}

/** ↑ / ⌥wheel-up walks to the parent, ↓ / ⌥wheel-down back toward the element under the cursor. */
export function depth(dir: number): void {
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

const onPickMove = (e: MouseEvent) => {
  pickRaw = deepTarget(e);
  depthStack = [];
  setHover(pickTargetFor(pickRaw));
};
const onPickReflow = () => {
  if (hovered && hovered.isConnected) drawHover(hovered);
};
const onPickWheel = (e: WheelEvent) => {
  if (!e.altKey) return;
  e.preventDefault();
  depth(e.deltaY < 0 ? -1 : 1);
};
const onPickClick = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (!hovered || !hovered.isConnected) return;
  if (e.shiftKey) toggleSiteRule(hovered);
  else toggleExact(hovered);
  if (!hovered.isConnected)
    hovered = pickRaw && pickRaw.isConnected ? pickTargetFor(pickRaw) : null;
  setHover(hovered);
  updateHud();
  // Pick mode stays active after a click; press Esc to exit
};
const stopEvt = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
};

export function startPick(): void {
  if (flags.picking) return;
  flags.picking = true;
  document.body.classList.add("tm-rtl-picking");
  showBeam(true);
  document.addEventListener("mousemove", onPickMove, true);
  document.addEventListener("scroll", onPickReflow, {
    capture: true,
    passive: true,
  });
  window.addEventListener("resize", onPickReflow, { passive: true });
  document.addEventListener("wheel", onPickWheel, {
    capture: true,
    passive: false,
  });
  document.addEventListener("click", onPickClick, true);
  document.addEventListener("mousedown", stopEvt, true);
  pickRaw = lastMouseTarget;
  depthStack = [];
  setHover(pickTargetFor(pickRaw));
  updateHud();
}

export function stopPick(): void {
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

export const togglePick = (): void => {
  if (flags.picking) stopPick();
  else startPick();
};

/** After "Undo all" the highlighted element may be gone; drop the highlight. */
export function clearHover(): void {
  if (flags.picking) setHover(null);
}
