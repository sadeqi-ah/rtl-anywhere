// Injected page CSS: the RTL rules themselves.
import { RTL_CLASS, PROTECTED } from "./constants.ts";
import { addStyle } from "./gm.ts";

export function initStyles(): void {
  addStyle(`
    .${RTL_CLASS} { text-align: right !important; unicode-bidi: isolate !important; }
    .tm-rtl-base-ltr { direction: ltr !important; }
    .tm-rtl-base-rtl { direction: rtl !important; }

    /* Native list markers follow the direction property. Draw unordered markers
       independently so every item can keep its own correct bidi base. */
    ul.${RTL_CLASS}, ul:has(> li.${RTL_CLASS}) {
      padding-inline-start: 0 !important;
    }
    ul.${RTL_CLASS} > li, ul > li.${RTL_CLASS} {
      display: block !important;
      list-style: none !important;
      position: relative !important;
      padding-right: 1.25em !important;
      text-align: right !important;
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
