// Injected page CSS: the RTL rules themselves.
import { RTL_CLASS, PROTECTED } from "./constants.ts";
import { addStyle } from "./gm.ts";

export function initStyles(): void {
  addStyle(`
    /* Let each block derive its bidi base from its first strong character. */
    .${RTL_CLASS} { text-align: right !important; unicode-bidi: plaintext !important; }

    /* Native list markers follow `direction`, so forcing them right would also
       reorder English-first items. Draw the unordered marker independently. */
    ul.${RTL_CLASS}, ul:has(> li.${RTL_CLASS}) {
      padding-inline-start: 0 !important;
    }
    ul.${RTL_CLASS} > li, ul > li.${RTL_CLASS} {
      list-style: none !important;
      position: relative !important;
      padding-right: 1.25em !important;
      text-align: right !important;
      unicode-bidi: plaintext !important;
    }
    ul.${RTL_CLASS} > li::before, ul > li.${RTL_CLASS}::before {
      content: "•";
      position: absolute;
      right: 0;
      top: 0;
      width: 1em;
      text-align: center;
      direction: ltr;
      unicode-bidi: isolate;
    }

    /* Code and math inside a right-aligned block always stay LTR. */
    .${RTL_CLASS} :is(${PROTECTED}), .${RTL_CLASS} :is(${PROTECTED}) * {
      direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important;
    }
    body.tm-rtl-picking, body.tm-rtl-picking * { cursor: crosshair !important; }

    @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: true; }
  `);
}
