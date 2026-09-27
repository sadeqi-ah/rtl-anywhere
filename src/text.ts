// RTL-ness of a string. Pure: no DOM, no storage — covered by test/logic.test.ts.
import { RTL_CHAR, LETTER, AUTO_RATIO } from "./constants.ts";

export function rtlRatio(text: string): { rtl: number; total: number } {
  let rtl = 0,
    total = 0;
  for (const ch of text) {
    if (!LETTER.test(ch)) continue;
    total++;
    if (RTL_CHAR.test(ch)) rtl++;
  }
  return { rtl, total };
}

/** Align RTL-led replies even when English terminology outnumbers Persian letters. */
export function isMostlyRTL(text: string): boolean {
  const { rtl, total } = rtlRatio(text);
  if (!rtl) return false;
  return (
    rtl / total >= AUTO_RATIO ||
    [...text].find((ch) => LETTER.test(ch))?.match(RTL_CHAR) != null
  );
}
