// Shared mutable state, kept in one place so core/pick/auto/sites can read each
// other's flags without importing each other (the module graph stays a DAG).
import { RTL_CLASS } from "./constants.ts";

/** Every element we've changed on this page. */
export const touched = new Set<Element>();

export const flags = {
  /** Set by "Undo all": auto-detect and site rules stop re-applying until reload. */
  paused: false,
  /** Pick mode active. */
  picking: false,
};

export function countRTL(): number {
  let n = 0;
  for (const e of touched)
    if (e.isConnected && e.classList.contains(RTL_CLASS)) n++;
  return n;
}
