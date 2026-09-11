// Injected page CSS: the RTL rules themselves, plus the optional user font.
import { RTL_CLASS, PROTECTED, FONT_SAFE, K } from "./constants.ts";
import { addStyle, getValue } from "./gm.ts";

export function initStyles(): void {
  addStyle(`
    .${RTL_CLASS} { direction: rtl !important; text-align: right !important; unicode-bidi: isolate !important; }
    /* Code and math inside an RTL block always stay LTR */
    .${RTL_CLASS} :is(${PROTECTED}), .${RTL_CLASS} :is(${PROTECTED}) * {
      direction: ltr !important; text-align: left !important; unicode-bidi: isolate !important;
    }
    body.tm-rtl-picking, body.tm-rtl-picking * { cursor: crosshair !important; }

    @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: true; }
  `);
}

// ---------- Font: persisted, global ----------
// Applied to the RTL element AND its descendants, because sites often set
// font-family directly on children which would otherwise win over inheritance.
let typoStyle: HTMLStyleElement | null = null;

export function applyTypography(): void {
  const font = getValue(K.font, "");
  if (typoStyle) {
    typoStyle.remove();
    typoStyle = null;
  }
  if (!font) return;
  const decl = `font-family: "${font.replace(/"/g, '\\"')}" !important`;
  const skip = `:not(:is(${PROTECTED})):not(:is(${PROTECTED}) *):not(:is(${FONT_SAFE}))`;
  typoStyle = addStyle(
    `.${RTL_CLASS}${skip}, .${RTL_CLASS} *${skip} { ${decl} }`,
  );
}
