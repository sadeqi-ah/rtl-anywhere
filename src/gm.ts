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
  [K.font]: string;
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Runtime shape check per key: storage may be corrupt or written by an older version. */
const valid: { [Key in keyof Stored]: (v: unknown) => boolean } = {
  [K.sc]: isPlainObject,
  [K.auto]: (v) => typeof v === "boolean",
  [K.autoSites]: isStringArray,
  [K.sites]: (v) => isPlainObject(v) && Object.values(v).every(isStringArray),
  [K.onboarded]: (v) => typeof v === "boolean",
  [K.font]: (v) => typeof v === "string",
};

export const getValue = <Key extends keyof Stored>(
  key: Key,
  fallback: Stored[Key],
): Stored[Key] => {
  const v = GM_getValue<unknown>(key, fallback);
  return valid[key](v) ? (v as Stored[Key]) : fallback;
};

export const setValue = <Key extends keyof Stored>(
  key: Key,
  value: Stored[Key],
): void => GM_setValue(key, value);

/** Fires when another tab changes a stored value. No-op where the manager lacks the API. */
export const onValueChange = (
  key: keyof Stored,
  fn: (value: unknown) => void,
): void => {
  if (typeof GM_addValueChangeListener !== "function") return;
  GM_addValueChangeListener(key, (_k, _old, value, remote) => {
    if (remote) fn(value);
  });
};

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

/** Fetches a file as bytes through the manager, so the page's CSP and CORS don't apply. */
export const fetchBytes = (url: string): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    if (typeof GM_xmlhttpRequest !== "function")
      return reject(new Error("GM_xmlhttpRequest unavailable"));
    GM_xmlhttpRequest({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 15000,
      onload: (r) =>
        r.status === 200
          ? resolve(r.response)
          : reject(new Error(`HTTP ${r.status}`)),
      onerror: () => reject(new Error("network error")),
      ontimeout: () => reject(new Error("timeout")),
    });
  });
