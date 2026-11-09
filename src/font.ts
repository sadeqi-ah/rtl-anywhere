// The selected RTL font. One CSS variable on <html>: custom properties inherit into
// shadow roots, so the rule in styles.ts needs no per-root update.
import { K } from "./constants.ts";
import { getValue, setValue, fetchBytes } from "./gm.ts";
import {
  findFont,
  fontStack,
  localStack,
  parseLocalId,
  remoteFamily,
} from "./fonts.ts";
import type { FontDef } from "./fonts.ts";
import { installedFamily } from "./font-detect.ts";

const VAR = "--tm-rtl-font";

const isKnownId = (id: string): boolean =>
  !!findFont(id) || parseLocalId(id) !== null;

export let fontId: string = getValue(K.font, "");

/** "assumed": a commercial font we could not detect; the user picked it anyway. */
export type FontStatus = "installed" | "downloaded" | "assumed" | "unavailable";

const downloads = new Map<string, Promise<boolean>>();

const hex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Fetches an open-source font once per page, verifies its hash, registers it with the document. */
function download(font: FontDef): Promise<boolean> {
  const remote = font.remote;
  if (!remote) return Promise.resolve(false);
  let job = downloads.get(font.id);
  if (!job) {
    job = (async () => {
      const bytes = await fetchBytes(remote.url);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      if (hex(digest) !== remote.sha256) return false;
      const face = new FontFace(remoteFamily(font), bytes, {
        ...(remote.weight ? { weight: remote.weight } : {}),
        display: "swap",
      });
      document.fonts.add(await face.load());
      return true;
    })().catch(() => false);
    downloads.set(font.id, job);
    // A failure shouldn't be remembered forever: allow a retry on the next attempt.
    void job.then((ok) => ok || downloads.delete(font.id));
  }
  return job;
}

export const isDownloaded = (font: FontDef): boolean =>
  [...document.fonts].some((face) => face.family === remoteFamily(font));

/** Which family to use for the font right now, downloading it if that is the only way. */
export async function resolveFont(
  font: FontDef,
): Promise<{ status: FontStatus; stack: string }> {
  if (installedFamily(font))
    return { status: "installed", stack: fontStack(font) };
  if (await download(font))
    return { status: "downloaded", stack: `'${remoteFamily(font)}'` };
  // Detection can be wrong (some browsers hide system fonts). Trust the user's choice.
  if (font.kind === "commercial")
    return { status: "assumed", stack: `${fontStack(font)}, sans-serif` };
  return { status: "unavailable", stack: "" };
}

/** Applies the stored font. An unavailable font is ignored, so text never falls to the browser default. */
export async function applyFont(): Promise<FontStatus | null> {
  const root = document.documentElement;
  const requested = fontId;
  const family = parseLocalId(requested);
  const font = findFont(requested);
  if (family) {
    root.style.setProperty(VAR, localStack(family));
    return "installed";
  }
  if (!font) {
    root.style.removeProperty(VAR);
    return null;
  }
  const { status, stack } = await resolveFont(font);
  if (requested !== fontId) return null; // the user picked something else meanwhile
  if (status === "unavailable") root.style.removeProperty(VAR);
  else root.style.setProperty(VAR, stack);
  return status;
}

export function setFont(id: string): Promise<FontStatus | null> {
  fontId = isKnownId(id) ? id : "";
  setValue(K.font, fontId);
  return applyFont();
}

/** Another tab changed the font: follow it without writing back. */
export function syncFont(id: unknown): void {
  fontId = typeof id === "string" && isKnownId(id) ? id : "";
  void applyFont();
}
