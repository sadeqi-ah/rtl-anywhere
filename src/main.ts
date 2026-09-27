// Entry point: wires the modules together — menu commands, the global key handler,
// and the initial scan. Everything else is a module under src/.
import { onMenu } from "./gm.ts";
import { initStyles } from "./styles.ts";
import { matches } from "./keys.ts";
import { shortcuts, isRecording } from "./shortcuts.ts";
import { action, undoAll, refreshDirection } from "./core.ts";
import {
  stopPick,
  togglePick,
  depth,
  trackMouse,
  clearHover,
  lastMouseTarget,
} from "./pick.ts";
import { applySiteRules } from "./sites.ts";
import { siteRules } from "./rules.ts";
import { auto, autoScan } from "./auto.ts";
import { ensureObserver, setFlushHandler } from "./observer.ts";
import { openPanel, closePanel, panelOpen } from "./panel.ts";
import { maybeOnboard, dismissOnboard } from "./onboard.ts";
import { flags } from "./state.ts";

initStyles();
trackMouse();

// New/changed content: re-apply site rules, then auto-detect.
setFlushHandler((el) => {
  applySiteRules(el);
  autoScan(el);
}, refreshDirection);

// Undoing can remove the element pick mode is highlighting.
const undoAllAndClear = () => {
  undoAll();
  clearHover();
};

onMenu("Pick mode", togglePick);
onMenu("Undo all on this page", undoAllAndClear);
onMenu("Settings…", () => openPanel());

document.addEventListener(
  "keydown",
  (e) => {
    if (isRecording()) return; // the recorder owns the keyboard
    const panel = panelOpen();
    if (e.code === "Escape") {
      if (panel) {
        e.preventDefault();
        closePanel();
        return;
      }
      if (dismissOnboard()) {
        e.preventDefault();
        return;
      }
      if (flags.picking) {
        e.preventDefault();
        stopPick();
      }
      return;
    }
    if (panel && e.composedPath().includes(panel)) return; // typing inside the panel
    if (flags.picking && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        depth(e.code === "ArrowUp" ? -1 : 1);
        return;
      }
    }
    if (matches(e, shortcuts.pick)) {
      e.preventDefault();
      e.stopPropagation();
      togglePick();
    } else if (matches(e, shortcuts.toggle)) {
      e.preventDefault();
      e.stopPropagation();
      action(lastMouseTarget);
    } else if (matches(e, shortcuts.undo)) {
      e.preventDefault();
      e.stopPropagation();
      undoAllAndClear();
    }
  },
  true,
);

if (document.body) {
  applySiteRules(document);
  autoScan(document.body);
  if (auto.on || siteRules.length) ensureObserver();
}
setTimeout(maybeOnboard, 1200);
