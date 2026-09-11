// First-run card: shown once, top frame only.
import { K } from "./constants.ts";
import { IS_TOP } from "./env.ts";
import { getValue, setValue } from "./gm.ts";
import { esc } from "./dom.ts";
import { formatCombo } from "./keys.ts";
import { shortcuts } from "./shortcuts.ts";
import { openPanel } from "./panel.ts";
import { UI_CSS } from "./ui-css.ts";

let host: HTMLElement | null = null;

/** Closes the card if it's up. Returns whether there was one — Esc uses that to stop. */
export function dismissOnboard(): boolean {
  if (!host) return false;
  setValue(K.onboarded, true);
  host.remove();
  host = null;
  return true;
}

export function maybeOnboard(): void {
  if (
    !IS_TOP ||
    getValue(K.onboarded, false) ||
    document.visibilityState !== "visible"
  )
    return;
  host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
      <style>${UI_CSS}</style>
      <div class="card">
        <div class="t">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M9 15L15 9M15 9H11M15 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div>RTL Anywhere is ready<small>Any text, any site, one shortcut.</small></div>
        </div>
        <div class="r"><span class="kbd">${esc(formatCombo(shortcuts.toggle))}</span><span>Toggle RTL on the selection or the element under the cursor</span></div>
        <div class="r"><span class="kbd">${esc(formatCombo(shortcuts.pick))}</span><span>Pick mode — click elements; ⇧click remembers them for the site</span></div>
        <div class="r end"><span class="kbd">${esc(formatCombo(shortcuts.undo))}</span><span>Undo everything on the page</span></div>
      <div class="row b">
        <div style="flex: 1;"><b>Settings</b><small style="margin-top:2px;">Configure fonts, shortcuts and auto-detect mode.</small></div>
        <div style="margin-top:0"><button class="btn set"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Settings</button><button class="btn pri ok">Continue</button></div>
      </div>`;
  document.documentElement.appendChild(host);

  root.querySelector(".ok")?.addEventListener("click", () => dismissOnboard());
  root.querySelector(".set")?.addEventListener("click", () => {
    dismissOnboard();
    openPanel();
  });
}
