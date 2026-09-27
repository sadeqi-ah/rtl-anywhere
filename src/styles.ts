// Injected page CSS: the RTL rules themselves.
import { RTL_CLASS, PROTECTED } from "./constants.ts";
import { addStyle } from "./gm.ts";

const styled = new WeakSet<Document | ShadowRoot>();

export function initStyles(root: Document | ShadowRoot = document): void {
  if (styled.has(root)) return;
  styled.add(root);
  const css = `
    .${RTL_CLASS} { text-align: right !important; unicode-bidi: isolate !important; }
    /* Unordered markers stay on the right without forcing LTR-led text to RTL. */
    ul.${RTL_CLASS}, ul:has(> li.${RTL_CLASS}) { padding-inline-start: 0 !important; }
    ul.${RTL_CLASS} > li, ul > li.${RTL_CLASS} {
      display: block !important; list-style: none !important; position: relative !important;
      padding-right: 1.25em !important; text-align: right !important;
    }
    ul.${RTL_CLASS} > li::before, ul > li.${RTL_CLASS}::before {
      content: "•"; position: absolute; right: 0; top: 0; width: 1em;
      text-align: center; direction: ltr; unicode-bidi: isolate;
    }
    /* Code and math inside an RTL block always stay LTR. */
    .${RTL_CLASS} :is(${PROTECTED}), .${RTL_CLASS} :is(${PROTECTED}) * {
      direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important;
    }
    body.tm-rtl-picking, body.tm-rtl-picking * { cursor: crosshair !important; }

    @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: true; }
  `;
  if (root instanceof Document) addStyle(css);
  else {
    const style = document.createElement("style");
    style.textContent = css;
    root.append(style);
  }
}
