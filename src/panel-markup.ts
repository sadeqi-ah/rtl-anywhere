import { HOST } from "./env.ts";
import { esc } from "./dom.ts";
import { BRAND_ICON } from "./brand.ts";
import { UI_CSS } from "./ui-css.ts";

export type PanelTab = "keys" | "auto" | "sites";

export function panelMarkup(): string {
  return `
      <style>${UI_CSS}</style>
      <div class="panel">
        <div class="hdr">
          <div class="t" style="display:flex;align-items:center;gap:10px">
            ${BRAND_ICON}
            <div>RTL Anywhere<small>Configure behavior and shortcuts</small></div>
          </div>
          <button class="x" title="Close" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 1L1 11M1 1L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="tabs">
          <button class="tab" data-tab="keys">Shortcuts</button>
          <button class="tab" data-tab="auto">Auto</button>
          <button class="tab" data-tab="sites">Sites</button>
        </div>

        <div class="sec" data-sec="keys">
          <div class="row"><div><b>Toggle RTL</b><small>Selected text, or the element under the cursor</small></div><button class="kbd" data-sc="toggle"></button></div>
          <div class="row"><div><b>Pick mode</b><small>Hover to preview, click to toggle, ⇧click to remember</small></div><button class="kbd" data-sc="pick"></button></div>
          <div class="row"><div><b>Undo all</b><small>Revert every change on this page</small></div><button class="kbd" data-sc="undo"></button></div>
          <div class="row"><div><b>In pick mode</b><small>↑ / ↓ or ⌥ + wheel: parent / child · Esc: exit</small></div><span class="kbd fixed">↑ ↓ Esc</span></div>
          <div class="hint"></div>
          <div class="ftr"><span class="msg">Click a shortcut to change it. Saved globally.</span><button class="btn reset">Reset</button></div>
        </div>

        <div class="sec" data-sec="auto">
          <div class="row">
            <div><b>All sites</b><small>Auto-detect Persian, Arabic and Hebrew text everywhere.</small></div>
            <label class="sw"><input type="checkbox" class="auto-global"><i></i></label>
          </div>
          <div class="row">
            <div><b>This site</b><small>Auto-detect only on ${esc(HOST)} when the global option is off.</small></div>
            <label class="sw"><input type="checkbox" class="auto-site"><i></i></label>
          </div>
          <div class="ftr"><span class="msg auto-msg"></span></div>
        </div>

        <div class="sec" data-sec="sites">
          <div class="row" style="padding-bottom:6px"><div><b>Remembered on ${esc(HOST)}</b><small>In pick mode, ⇧click an element to save it here. Hover a rule to see it.</small></div></div>
          <div class="list rules"></div>
          <div class="ftr"><span class="msg sites-msg"></span><button class="btn forget">Forget this site</button></div>
        </div>
      </div>`;
}
