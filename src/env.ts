// Host environment facts, read once. Written defensively so the module can also be
// imported by the unit tests, where window/navigator are absent.

/**
 * Real page window — queryLocalFonts() fails when called through the sandbox proxy.
 * The cast covers the test environment, where neither unsafeWindow nor a DOM exists;
 * in a browser this is always a real Window.
 */
export const PAGE = (
  typeof unsafeWindow !== "undefined" ? unsafeWindow : globalThis
) as Window & typeof globalThis;

export const IS_MAC = /Mac|iPhone|iPad/.test(
  globalThis.navigator?.platform ?? "",
);

export const HOST = globalThis.location?.hostname ?? "";

export const IS_TOP = (() => {
  try {
    return typeof window !== "undefined" && window.top === window;
  } catch {
    return false; // cross-origin frame
  }
})();
