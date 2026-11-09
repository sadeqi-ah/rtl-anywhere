// Is a font installed? document.fonts.check() says "true" for unknown system fonts, so
// compare rendered widths against generic families instead: an installed font that has
// Persian glyphs changes the width of at least one of them.
import type { FontDef } from "./fonts.ts";
import { normalizeName } from "./fonts.ts";

const BASES = ["monospace", "serif", "sans-serif"];
// Persian letters only: an unrelated Latin font with the same name has no such glyphs,
// so it renders like the fallback and is rejected.
const PROBE = "سلام دنیا گچپژ کیهان";
const cache = new Map<string, boolean>();
let ctx: CanvasRenderingContext2D | null | undefined;

function width(font: string): number {
  if (ctx === undefined)
    ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 0;
  ctx.font = `72px ${font}`;
  return ctx.measureText(PROBE).width;
}

/**
 * The user's own font list, once they allowed it. Exact, unlike the canvas probe, which
 * some browsers deliberately distort to stop font fingerprinting.
 */
let local: { families: string[]; names: Set<string> } | null = null;

export const hasLocalFonts = (): boolean => local !== null;
export const canQueryLocalFonts = (): boolean =>
  typeof window.queryLocalFonts === "function";
export const localFamilies = (): readonly string[] => local?.families ?? [];

/** Must run from a click: the browser asks for permission and rejects otherwise. */
export async function loadLocalFonts(): Promise<boolean> {
  if (!window.queryLocalFonts) return false;
  try {
    const fonts = await window.queryLocalFonts();
    const names = new Set<string>();
    const families = new Map<string, string>();
    for (const font of fonts) {
      names.add(normalizeName(font.family));
      names.add(normalizeName(font.fullName));
      const key = normalizeName(font.family);
      if (!families.has(key)) families.set(key, font.family);
    }
    local = {
      names,
      families: [...families.values()].sort((a, b) => a.localeCompare(b)),
    };
    return true;
  } catch {
    return false; // permission denied, or blocked by a permissions policy
  }
}

export function familyInstalled(name: string): boolean {
  if (local) return local.names.has(normalizeName(name));
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  const found = BASES.some(
    (base) => width(`'${name}', ${base}`) !== width(base),
  );
  cache.set(name, found);
  return found;
}

/** First installed family of the font, or null. */
export const installedFamily = (font: FontDef): string | null =>
  font.families.find(familyInstalled) ?? null;
