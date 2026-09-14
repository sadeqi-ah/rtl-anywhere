// The only module that touches the GM_* API, so everything above it is plain DOM code.
import { K } from "./constants.ts";
import type { Combo, ShortcutId } from "./keys.ts";

/**
 * What each storage key holds. This is the project's one trust boundary: values
 * come off disk, possibly written by an older version of the script, and are then
 * read in four different modules. Keying the accessors to this map is what stops
 * `getValue` from degrading to `any`.
 */
export interface Stored {
  [K.sc]: Partial<Record<ShortcutId, Partial<Combo>>>;
  [K.auto]: boolean;
  [K.autoSites]: string[];
  [K.sites]: Record<string, string[]>;
  [K.onboarded]: boolean;
}

export const getValue = <Key extends keyof Stored>(
  key: Key,
  fallback: Stored[Key],
): Stored[Key] => GM_getValue(key, fallback);

export const setValue = <Key extends keyof Stored>(
  key: Key,
  value: Stored[Key],
): void => GM_setValue(key, value);

export const onMenu = (label: string, fn: () => void): void =>
  GM_registerMenuCommand(label, fn);

export function addStyle(css: string): HTMLStyleElement {
  const el = GM_addStyle(css);
  if (el) return el;
  const s = document.createElement("style"); // some managers return nothing
  s.textContent = css;
  (document.head ?? document.documentElement).appendChild(s);
  return s;
}
