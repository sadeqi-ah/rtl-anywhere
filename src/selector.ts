// Builds a reasonably stable CSS selector for an element, so a ⇧click can be
// replayed on the next visit. The guard predicates are covered by test/logic.test.ts.

/** Skip hashed / stateful class names: they change between builds and interactions. */
export const stableClass = (c: string): boolean =>
  !!c &&
  c.length < 32 &&
  !/\d/.test(c) &&
  !c.startsWith("tm-rtl") &&
  !/^(is|has|js)-|--|active|hover|focus|selected|open/i.test(c);

export const stableId = (id: string): boolean =>
  !!id &&
  !/\d{3,}/.test(id) &&
  !/^[a-f0-9]{8,}$/i.test(id) &&
  !id.startsWith(":");

/** Real ids win; then non-hashed classes; nth-of-type only when the segment is ambiguous. */
export function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    if (stableId(node.id)) {
      parts.unshift("#" + CSS.escape(node.id));
      break;
    }
    let seg = node.localName;
    const cls = [...node.classList].filter(stableClass).slice(0, 2);
    if (cls.length) seg += cls.map((c) => "." + CSS.escape(c)).join("");
    const parent: Element | null = node.parentElement;
    if (parent) {
      const same = [...parent.children].filter((s) => {
        try {
          return s.matches(seg);
        } catch {
          return false;
        }
      });
      if (same.length > 1) {
        const localName = node.localName;
        const idx =
          [...parent.children]
            .filter((s) => s.localName === localName)
            .indexOf(node) + 1;
        seg += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(seg);
    node = parent;
  }
  const sel = parts.join(" > ");
  try {
    if (document.querySelectorAll(sel).length === 1) return sel;
  } catch {
    // fall through to the positional path
  }
  // Fallback: full positional path
  const full: string[] = [];
  let n: Element | null = el;
  while (n && n !== document.body) {
    const p: Element | null = n.parentElement;
    if (!p) break;
    const localName = n.localName;
    const idx =
      [...p.children].filter((s) => s.localName === localName).indexOf(n) + 1;
    full.unshift(`${localName}:nth-of-type(${idx})`);
    n = p;
  }
  return "body > " + full.join(" > ");
}
