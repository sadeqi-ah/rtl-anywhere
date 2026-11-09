// Font catalog. Pure data + string helpers (no DOM, no storage) so it is unit-testable.
// Every font is matched by its installed family name; nothing is downloaded, which
// keeps the "no network requests" promise in the README.

export type FontKind = "opensource" | "commercial";

/** A pinned, hash-checked copy the script can download when the font isn't installed. */
export interface RemoteFont {
  url: string;
  /** Hex SHA-256 of the file; a mismatch means the file is not loaded. */
  sha256: string;
  /** Variable-weight range, e.g. "100 900". Omit for static fonts. */
  weight?: string;
}

export interface FontDef {
  id: string;
  /** Display name, Latin script. */
  name: string;
  kind: FontKind;
  /** Installed family names to try, best match first. Latin only. */
  families: string[];
  /** Open-source fonts only: where to download them from when not installed. */
  remote?: RemoteFont;
}

const f = (
  id: string,
  name: string,
  kind: FontKind,
  ...families: string[]
): FontDef => ({
  id,
  name,
  kind,
  families: families.length ? families : [name],
});

const os = (
  id: string,
  name: string,
  remote: RemoteFont,
  ...families: string[]
): FontDef => ({ ...f(id, name, "opensource", ...families), remote });

const CDN = "https://cdn.jsdelivr.net/";
const com = (id: string, name: string, ...families: string[]) =>
  f(id, name, "commercial", ...families);

export const FONTS: readonly FontDef[] = [
  os(
    "vazirmatn",
    "Vazirmatn",
    {
      url:
        CDN + "npm/vazirmatn@33.0.3/fonts/webfonts/Vazirmatn%5Bwght%5D.woff2",
      sha256:
        "4e3fa217d38fdafc1fea4414ceb58ca5e662cf0ab5fa735a8c8c20e8b42cad92",
      weight: "100 900",
    },
    "Vazirmatn",
    "Vazir",
  ),
  os(
    "estedad",
    "Estedad",
    {
      url:
        CDN +
        "npm/@fontsource-variable/estedad@5.3.0/files/estedad-arabic-wght-normal.woff2",
      sha256:
        "e0efecd488020d6c82fe6fe11c9473d0b5c474c1adac739c6b6ff677a2d6cce1",
      weight: "100 900",
    },
    "Estedad",
    "Estedad VF",
  ),
  os(
    "shabnam",
    "Shabnam",
    {
      url: CDN + "gh/rastikerdar/shabnam-font@v5.0.1/dist/Shabnam.woff2",
      sha256:
        "540d3f4e172bd6b5c70dd06bce57e055ce59270e95ea642b414fe0709faaa085",
    },
    "Shabnam",
    "Shabnam FD",
  ),
  os(
    "nahid",
    "Nahid",
    {
      url: CDN + "gh/rastikerdar/nahid-font@v0.3.0/dist/Nahid.woff2",
      sha256:
        "69c92b21aa4f4417253f1f825226952583a179e6e01f3355ad9384b0101640f4",
    },
    "Nahid",
  ),
  os(
    "sahel",
    "Sahel",
    {
      url: CDN + "gh/rastikerdar/sahel-font@v3.4.0/dist/Sahel.woff2",
      sha256:
        "df74c625136d60e981abbd32cc75624007e5b36cc41cc5327dff190d22b21772",
    },
    "Sahel",
    "Sahel VF",
  ),
  os(
    "samim",
    "Samim",
    {
      url: CDN + "gh/rastikerdar/samim-font@v4.0.5/dist/Samim.woff2",
      sha256:
        "b45379592d11b2bb9135eb78cea8b54220d89b26d67fb19bae5d15a540d32556",
    },
    "Samim",
    "Samim FD",
  ),

  com("iranyekanx", "IRANYekanX", "IRANYekanX", "IRANYekanX VF", "IRANYekan"),
  com("iransansx", "IRANSansX", "IRANSansX", "IRANSansX VF", "IRANSans"),
  com(
    "iransansx-d4",
    "IRANSansX D4",
    "IRANSansX-D4",
    "IRANSansX D4",
    "IRANSansX",
  ),
  com("yekanbakh", "Yekan Bakh", "Yekan Bakh", "YekanBakh", "Yekan Bakh FaNum"),
  com("dana", "Dana", "Dana", "Dana VF", "Dana FaNum"),
  com("anjoman", "Anjoman", "Anjoman", "Anjoman VF"),
  com("kalameh", "Kalameh", "Kalameh", "Kalameh VF"),
  com("peyda", "Peyda", "Peyda", "Peyda VF"),
  com("doran", "Doran", "Doran", "Doran VF"),
  com("modam", "Modam", "Modam", "Modam VF"),
  com("ravi", "Ravi", "Ravi", "Ravi VF"),
  com("kahroba", "Kahroba", "Kahroba", "Kahroba VF"),
  com("morabba", "Morabba", "Morabba", "Morabba VF"),
  com("farhang", "Farhang", "Farhang", "Farhang VF"),
  com("farhang-dot1", "Farhang Dot1", "Farhang Dot1", "FarhangDot1", "Farhang"),
  com("borna", "Borna", "Borna", "Borna VF"),
  com("pelak", "Pelak", "Pelak", "Pelak VF"),
  com("sepid", "Sepid", "Sepid", "Sepid VF"),
  com("ahang", "Ahang"),
  com("tahrir", "Tahrir"),
  com("tajrid", "Tajrid"),
  com("vanda", "Vanda"),
  com("rokh", "Rokh"),
  com("paykan", "Paykan"),
  com("dibaj", "Dibaj"),
  com("aria", "Aria"),
  com("noora", "Noora"),
  com("samir", "Samir"),
  com("kook", "Kook"),
  com("ekraan", "Ekraan", "Ekraan", "Ekran"),
  com("veno", "Veno"),
  com("abar", "Abar", "Abar", "Abar VF"),
  com("liana", "Liana"),
  com("shoor", "Shoor"),
  com("gozzar", "Gozzar"),
  com("darvish", "Darvish"),
  com("croissant", "Croissant"),
  com("mahal", "Mahal"),
  com("bavan", "Bavan"),
  com("kamand", "Kamand"),
  com("lahzeh", "Lahzeh"),
  com("damoon", "Damoon"),
  com("pofak", "Pofak"),
  com("bon", "Bon"),
  com("shazde", "Shazde"),
  com("haiku", "Haiku"),
  com("rooyin", "Rooyin"),
  com("gramophone", "Gramophone"),
  com("darbareh", "Darbareh"),
  com("ravagh", "Ravagh"),
  com("samarqand", "Samarqand"),
  com("narengi", "Narengi"),
  com("labkhand", "Labkhand"),
  com("bonyan", "Bonyan"),
  com("bonyadekoodak", "Bonyad Koodak", "Bonyad Koodak", "BonyadeKoodak"),
  com("on", "On"),
  com("quarantine", "Quarantine"),
];

export const findFont = (id: string): FontDef | undefined =>
  FONTS.find((font) => font.id === id);

/** CSS font-family value for a font's names. Names come from this file only, never from storage. */
export const fontStack = (font: FontDef): string =>
  font.families.map((name) => `'${name}'`).join(", ");

/** Family name the downloaded copy is registered under; unique so it can't clash with a page's own @font-face. */
export const remoteFamily = (font: FontDef): string => `tm-rtl-${font.id}`;

/** Ids for fonts the user picked from their own system rather than from the catalog. */
const LOCAL_PREFIX = "local:";

/** Quotes, backslashes, braces and control characters could break out of a CSS string. */
const SAFE_FAMILY = /^[^"'\\;{}<>\u0000-\u001f]{1,100}$/;

export const isSafeFamily = (name: string): boolean => SAFE_FAMILY.test(name);

export const localId = (family: string): string => LOCAL_PREFIX + family;

/** The family inside a local id, or null if the id isn't local or the name is unsafe. */
export function parseLocalId(id: string): string | null {
  if (!id.startsWith(LOCAL_PREFIX)) return null;
  const family = id.slice(LOCAL_PREFIX.length).trim();
  return isSafeFamily(family) ? family : null;
}

/** Stack for a font the user named themselves. sans-serif is the fallback if the name is wrong. */
export const localStack = (family: string): string => `"${family}", sans-serif`;

/** Case/space/punctuation-insensitive form, so "Yekan Bakh" matches "YekanBakh" and "yekan-bakh". */
export const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, "");
