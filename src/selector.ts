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
  const root = el.getRootNode();
  if (root instanceof ShadowRoot) {
    const hostPath = cssPath(root.host);
    if (!hostPath) return "";
    return hostPath + " >>> " + pathInRoot(el, root);
  }
  return pathInRoot(el, document);
}

export function queryPath(
  root: Document | Element | ShadowRoot,
  path: string,
): Element[] {
  const [first, ...rest] = path.split(" >>> ");
  if (!first) return [];
  const matches = [...root.querySelectorAll(first)];
  if (root instanceof Element && root.matches(first)) matches.push(root);
  if (!rest.length) return matches;
  return matches.flatMap((el) =>
    el.shadowRoot ? queryPath(el.shadowRoot, rest.join(" >>> ")) : [],
  );
}

export function matchesPath(el: Element, path: string): boolean {
  return path.includes(" >>> ")
    ? queryPath(document, path).includes(el)
    : el.matches(path);
}

function pathInRoot(el: Element, root: Document | ShadowRoot): string {
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
    const parent: Element | ShadowRoot | null =
      node.parentElement ??
      (root instanceof ShadowRoot && node.parentNode === root ? root : null);
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
    node = parent instanceof Element ? parent : null;
  }
  const sel = parts.join(" > ");
  try {
    if (root.querySelectorAll(sel).length === 1) return sel;
  } catch {
    // fall through to the positional path
  }
  // Fallback: full positional path
  const full: string[] = [];
  let n: Element | null = el;
  while (n && n !== document.body) {
    const p: Element | ShadowRoot | null =
      n.parentElement ??
      (root instanceof ShadowRoot && n.parentNode === root ? root : null);
    if (!p) break;
    const localName = n.localName;
    const idx =
      [...p.children].filter((s) => s.localName === localName).indexOf(n) + 1;
    full.unshift(`${localName}:nth-of-type(${idx})`);
    n = p instanceof Element ? p : null;
  }
  return root instanceof ShadowRoot
    ? full.join(" > ")
    : "body > " + full.join(" > ");
}
