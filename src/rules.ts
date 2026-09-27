// Storage for per-site rules. Separate from sites.ts (which applies them) so that
// overlay.ts can ask "is this element remembered?" without an import cycle.
import { K } from "./constants.ts";
import { HOST } from "./env.ts";
import { getValue, setValue } from "./gm.ts";
import { matchesPath } from "./selector.ts";

export let siteRules: string[] = getValue(K.sites, {})[HOST] ?? [];

export const allSites = (): Record<string, string[]> => getValue(K.sites, {});

export function saveRules(list: string[]): void {
  siteRules = list;
  const all = getValue(K.sites, {});
  if (list.length) all[HOST] = list;
  else delete all[HOST];
  setValue(K.sites, all);
}

export function ruleFor(el: Element): string | null {
  for (const sel of siteRules) {
    try {
      if (matchesPath(el, sel)) return sel;
    } catch {
      // a stored selector can become invalid after a site redesign
    }
  }
  return null;
}
