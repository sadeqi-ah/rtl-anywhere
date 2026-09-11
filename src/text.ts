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

/** Needs a few letters before it will judge, so "OK" or a lone emoji never flips a block. */
export function isMostlyRTL(text: string): boolean {
  const { rtl, total } = rtlRatio(text);
  return total >= 3 && rtl / total >= AUTO_RATIO;
}
