// Host environment facts, read once. Written defensively so the module can also be
// imported by the unit tests, where window/navigator are absent.

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
