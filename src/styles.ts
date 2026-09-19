// Injected page CSS: the RTL rules themselves.
import { RTL_CLASS, PROTECTED } from "./constants.ts";
import { addStyle } from "./gm.ts";

export function initStyles(): void {
  addStyle(`
    .${RTL_CLASS} { text-align: right !important; }
    /* Code and math inside a right-aligned block always stay LTR */
    .${RTL_CLASS} :is(${PROTECTED}), .${RTL_CLASS} :is(${PROTECTED}) * {
      direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important;
    }
    body.tm-rtl-picking, body.tm-rtl-picking * { cursor: crosshair !important; }

    @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: true; }
  `);
}
