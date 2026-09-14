// Persisted shortcut bindings + the "press the new shortcut" recorder used by the panel.
import { K } from "./constants.ts";
import { IS_MAC } from "./env.ts";
import { getValue, setValue } from "./gm.ts";
import {
  DEFAULT_SC,
  SC_IDS,
  SC_LABELS,
  formatCombo,
  isModifierCode,
  sameCombo,
} from "./keys.ts";
import type { Combo, ShortcutId } from "./keys.ts";

const saved = getValue(K.sc, {});

/** Stored combos are merged over the defaults, so a partial save can't leave holes. */
const merge = (): Record<ShortcutId, Combo> =>
  Object.fromEntries(
    SC_IDS.map((id) => [id, { ...DEFAULT_SC[id], ...saved[id] }]),
  ) as Record<ShortcutId, Combo>;

export let shortcuts: Record<ShortcutId, Combo> = merge();

const save = () => setValue(K.sc, shortcuts);

export function resetShortcuts(): void {
  shortcuts = Object.fromEntries(
    SC_IDS.map((id) => [id, { ...DEFAULT_SC[id] }]),
  ) as Record<ShortcutId, Combo>;
  save();
}

interface Recording {
  id: ShortcutId;
  btn: HTMLElement;
  hint: HTMLElement;
  done: () => void;
}

let recording: Recording | null = null;

export const isRecording = (): boolean => !!recording;
export const recordingBtn = (): HTMLElement | null => recording?.btn ?? null;

export function stopRecord(restore = true): void {
  if (!recording) return;
  window.removeEventListener("keydown", onRecordKey, true);
  window.removeEventListener("keyup", onRecordKeyUp, true);
  const { btn, id } = recording;
  btn.classList.remove("rec");
  if (restore) btn.textContent = formatCombo(shortcuts[id]);
  recording = null;
}

export function startRecord(
  id: ShortcutId,
  btn: HTMLElement,
  hint: HTMLElement,
  done: () => void,
): void {
  stopRecord();
  recording = { id, btn, hint, done };
  btn.classList.add("rec");
  btn.textContent = "Press keys…";
  hint.textContent = "";
  window.addEventListener("keydown", onRecordKey, true);
  window.addEventListener("keyup", onRecordKeyUp, true);
}

function onRecordKey(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopPropagation();
  if (!recording) return;
  const { id, btn, hint, done } = recording;
  if (e.code === "Escape") {
    stopRecord();
    hint.textContent = "";
    return;
  }
  const combo: Combo = {
    code: e.code,
    alt: e.altKey,
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    meta: e.metaKey,
  };
  if (isModifierCode(e.code)) {
    btn.textContent = formatCombo({ ...combo, code: "" }) || "Press keys…";
    return;
  }
  // Shift alone would collide with normal typing on every page.
  const hasMod = combo.alt || combo.ctrl || combo.meta;
  if (!hasMod && !/^F\d{1,2}$/.test(combo.code)) {
    hint.textContent = IS_MAC
      ? "Include ⌥, ⌃ or ⌘ (Shift alone isn’t enough)."
      : "Include Alt, Ctrl or Win (Shift alone isn’t enough).";
    return;
  }
  const clash = SC_IDS.find((o) => o !== id && sameCombo(combo, shortcuts[o]));
  if (clash) {
    hint.textContent = `Already used by “${SC_LABELS[clash]}”.`;
    return;
  }
  shortcuts[id] = combo;
  save();
  stopRecord();
  hint.textContent = "";
  done();
}

function onRecordKeyUp(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopPropagation();
  if (!recording) return;
  recording.btn.textContent =
    formatCombo({
      code: "",
      alt: e.altKey,
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      meta: e.metaKey,
    }) || "Press keys…";
}
