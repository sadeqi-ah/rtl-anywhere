import { BRAND_ICON } from "./brand.ts";
import { esc } from "./dom.ts";
import { formatCombo } from "./keys.ts";
import { shortcuts } from "./shortcuts.ts";
import { UI_CSS } from "./ui-css.ts";

const SETTINGS_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"></path><path d="M20.7906 9.15201C21.5969 10.5418 22 11.2366 22 12C22 12.7634 21.5969 13.4582 20.7906 14.848L18.8669 18.1638C18.0638 19.548 17.6623 20.2402 17.0019 20.6201C16.3416 21 15.5402 21 13.9373 21L10.0627 21C8.45982 21 7.6584 21 6.99807 20.6201C6.33774 20.2402 5.93619 19.548 5.13311 18.1638L3.20942 14.848C2.40314 13.4582 2 12.7634 2 12C2 11.2366 2.40314 10.5418 3.20942 9.152L5.13311 5.83621C5.93619 4.45196 6.33774 3.75984 6.99807 3.37992C7.6584 3 8.45982 3 10.0627 3L13.9373 3C15.5402 3 16.3416 3 17.0019 3.37992C17.6623 3.75984 18.0638 4.45197 18.8669 5.83622L20.7906 9.15201Z"></path></svg>`;

export function onboardMarkup(): string {
  return `
      <style>${UI_CSS}</style>
      <div class="card">
        <div class="t">
          ${BRAND_ICON}
          <div>RTL Anywhere is ready<small>Any text, any site, one shortcut.</small></div>
        </div>
        <div class="card-list">
          <div class="card-row"><div><b>Toggle RTL</b><small>Selection or element under the cursor</small></div><span class="kbd">${esc(formatCombo(shortcuts.toggle))}</span></div>
          <div class="card-row"><div><b>Pick mode</b><small>Click elements; ⇧click remembers them for the site</small></div><span class="kbd">${esc(formatCombo(shortcuts.pick))}</span></div>
          <div class="card-row"><div><b>Undo all</b><small>Revert every change on the page</small></div><span class="kbd">${esc(formatCombo(shortcuts.undo))}</span></div>
        </div>
        <label class="auto-row">
          <span class="sw"><input class="auto" type="checkbox"><i></i></span>
          <span>Enable conservative RTL auto-detect</span>
        </label>
        <div class="card-actions">
          <button class="btn set">${SETTINGS_ICON}Settings</button>
          <button class="btn ok">Continue</button>
        </div>
      </div>`;
}
