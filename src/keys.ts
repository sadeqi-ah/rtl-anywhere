// Keyboard combos: naming, formatting and comparison. Pure — no DOM, no storage.
import { IS_MAC } from "./env.ts";

/** A key plus the exact modifier state required. Modifiers are never optional. */
export interface Combo {
  code: string;
  alt: boolean;
  shift: boolean;
  ctrl: boolean;
  meta: boolean;
}

/** Combo being recorded: the key isn't known until the user presses one. */
export type PartialCombo = Omit<Combo, "code"> & { code: string };

export const SC_IDS = ["toggle", "pick", "undo"] as const;
export type ShortcutId = (typeof SC_IDS)[number];

export const DEFAULT_SC: Record<ShortcutId, Combo> = {
  toggle: { code: "KeyR", alt: true, shift: false, ctrl: false, meta: false },
  pick: { code: "KeyR", alt: true, shift: true, ctrl: false, meta: false },
  undo: { code: "KeyZ", alt: true, shift: true, ctrl: false, meta: false },
};

export const SC_LABELS: Record<ShortcutId, string> = {
  toggle: "Toggle RTL",
  pick: "Pick mode",
  undo: "Undo all",
};

const KEY_NAMES: Record<string, string> = {
  Space: "Space",
  Enter: "↵",
  Backspace: "⌫",
  Tab: "⇥",
  Delete: "⌦",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn",
  Insert: "Ins",
};

export function keyName(code: string): string {
  if (!code) return "";
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  return KEY_NAMES[code] ?? code.replace(/^Numpad/, "Num ");
}

/** `mac` is a parameter so the tests can check both renderings. */
export function formatCombo(s: PartialCombo, mac = IS_MAC): string {
  const p: string[] = [];
  if (mac) {
    if (s.ctrl) p.push("⌃");
    if (s.alt) p.push("⌥");
    if (s.shift) p.push("⇧");
    if (s.meta) p.push("⌘");
    p.push(keyName(s.code));
    return p.join("");
  }
  if (s.ctrl) p.push("Ctrl");
  if (s.alt) p.push("Alt");
  if (s.shift) p.push("Shift");
  if (s.meta) p.push("Win");
  if (s.code) p.push(keyName(s.code));
  return p.join("+");
}

export const isModifierCode = (c: string): boolean =>
  /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$/.test(c);

/** The modifier flags a KeyboardEvent carries. Kept structural so tests can fake it. */
export interface KeyEventLike {
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

// Matching is done on e.code, because on macOS Option+key produces special
// characters and e.key is unreliable.
export const matches = (e: KeyEventLike, s: Combo): boolean =>
  e.code === s.code &&
  e.altKey === s.alt &&
  e.ctrlKey === s.ctrl &&
  e.metaKey === s.meta &&
  e.shiftKey === s.shift;

export const sameCombo = (a: Combo, b: Combo): boolean =>
  a.code === b.code &&
  a.alt === b.alt &&
  a.ctrl === b.ctrl &&
  a.meta === b.meta &&
  a.shift === b.shift;
