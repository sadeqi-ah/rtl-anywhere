// Settings panel: Shortcuts / Auto / Sites, rendered inside a shadow root.
import { HOST } from "./env.ts";
import { drawHover } from "./overlay.ts";
import { stopPick } from "./pick.ts";
import { queryPath } from "./selector.ts";
import { formatCombo } from "./keys.ts";
import type { ShortcutId } from "./keys.ts";
import {
  shortcuts,
  resetShortcuts,
  startRecord,
  stopRecord,
  isRecording,
  recordingBtn,
} from "./shortcuts.ts";
import { auto, setAuto, setSiteAuto } from "./auto.ts";
import { siteRules, allSites } from "./rules.ts";
import { removeRule } from "./sites.ts";
import {
  FONTS,
  isSafeFamily,
  localId,
  normalizeName,
  remoteFamily,
} from "./fonts.ts";
import type { FontDef } from "./fonts.ts";
import {
  canQueryLocalFonts,
  installedFamily,
  loadLocalFonts,
  localFamilies,
} from "./font-detect.ts";
import { fontId, setFont, isDownloaded } from "./font.ts";
import { panelMarkup } from "./panel-markup.ts";
import type { PanelTab } from "./panel-markup.ts";

let panelHost: HTMLElement | null = null;

/** The panel's host element, or null. main.ts uses it to detect typing inside the panel. */
export const panelOpen = (): HTMLElement | null => panelHost;

const onOutsideDown = (e: MouseEvent) => {
  if (panelHost && !e.composedPath().includes(panelHost)) closePanel();
};

export function closePanel(): void {
  if (!panelHost) return;
  stopRecord();
  drawHover(null);
  panelHost.remove();
  panelHost = null;
  document.removeEventListener("mousedown", onOutsideDown, true);
}

export function openPanel(tab: PanelTab = "keys"): void {
  stopPick();
  closePanel();
  const host = document.createElement("div");
  panelHost = host;
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = panelMarkup();
  document.documentElement.appendChild(host);
  document.addEventListener("mousedown", onOutsideDown, true);

  const $ = <T extends HTMLElement>(s: string): T =>
    root.querySelector<T>(s) as T;
  const $$ = <T extends HTMLElement>(s: string): T[] => [
    ...root.querySelectorAll<T>(s),
  ];
  $(".x").addEventListener("click", closePanel);

  function showTab(name: PanelTab) {
    stopRecord();
    drawHover(null);
    $$(".tab").forEach((x) => {
      x.classList.toggle("on", x.dataset.tab === name);
      x.setAttribute("aria-selected", String(x.dataset.tab === name));
    });
    $$(".sec").forEach((s) => s.classList.toggle("on", s.dataset.sec === name));
  }
  $$(".tab").forEach((t) =>
    t.addEventListener("click", () => showTab(t.dataset.tab as PanelTab)),
  );

  const hint = $(".hint");
  const kbdBtns = $$(".kbd[data-sc]");
  const scOf = (b: HTMLElement) => b.dataset.sc as ShortcutId;
  const renderKeys = () =>
    kbdBtns.forEach((b) => {
      b.textContent = formatCombo(shortcuts[scOf(b)]);
    });
  kbdBtns.forEach((b) =>
    b.addEventListener("click", () => {
      if (isRecording() && recordingBtn() === b) {
        stopRecord();
        hint.textContent = "";
        return;
      }
      startRecord(scOf(b), b, hint, renderKeys);
    }),
  );
  $(".reset").addEventListener("click", () => {
    stopRecord();
    resetShortcuts();
    hint.textContent = "Restored defaults.";
    renderKeys();
  });
  renderKeys();

  const fontList = $(".fonts"),
    fontMsg = $(".font-msg"),
    fontSearch = $<HTMLInputElement>(".q"),
    fontReset = $<HTMLButtonElement>(".font-reset"),
    browseBtn = $<HTMLButtonElement>(".font-browse");
  /** Rows of "my fonts" drawn at once. The browser only loads glyphs for rendered rows. */
  const MY_FONTS_CAP = 50;
  const catalogNames = new Set(
    FONTS.flatMap((def) => def.families.map(normalizeName)),
  );
  let fonts: { def: FontDef; family: string | null }[] = [];
  // Detection is a handful of measurements; redo it only when the font list changes.
  const detect = () => {
    fonts = FONTS.map((def) => ({ def, family: installedFamily(def) })).sort(
      (a, b) => Number(!!b.family) - Number(!!a.family),
    );
  };
  detect();

  function addRow(
    label: string,
    sampleFamily: string | null,
    placeholder: string,
    selected: boolean,
    dim: boolean,
    onClick: () => void,
    badge?: string,
  ) {
    const item = document.createElement("div");
    item.className = "item" + (selected ? " on" : "");
    item.style.opacity = dim ? "0.55" : "";
    item.tabIndex = 0;
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(selected));
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = label;
    if (badge) {
      const tag = document.createElement("span");
      tag.className = "badge";
      tag.textContent = badge;
      name.append(tag);
    }
    const sample = document.createElement("span");
    sample.className = "sample";
    if (sampleFamily) {
      sample.textContent = "سلام دنیا";
      sample.style.fontFamily = `"${sampleFamily}"`;
    } else sample.textContent = placeholder;
    item.append(name, sample);
    item.addEventListener("click", onClick);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });
    fontList.appendChild(item);
  }

  async function choose(id: string, label: string, pending: string) {
    fontMsg.textContent = pending;
    const status = await setFont(id);
    fontMsg.textContent =
      status === "unavailable"
        ? `Couldn't load ${label}. Check your connection.`
        : status === "assumed"
          ? `Using ${label}. If the text looks unchanged, it isn't installed; try "Browse my fonts".`
          : `Using ${label} for RTL text.`;
    renderFonts();
  }

  function renderFonts() {
    const q = fontSearch.value.trim().toLowerCase();
    fontList.replaceChildren();
    for (const { def, family } of fonts) {
      if (q && !def.name.toLowerCase().includes(q)) continue;
      const downloaded = isDownloaded(def);
      const ready = !!family || downloaded;
      addRow(
        def.name,
        family ?? (downloaded ? remoteFamily(def) : null),
        def.remote ? "downloads on use" : "not detected",
        def.id === fontId,
        !family && !def.remote,
        () =>
          void choose(
            def.id,
            def.name,
            ready || !def.remote ? "" : `Downloading ${def.name}…`,
          ),
        def.kind === "commercial" ? "Commercial" : undefined,
      );
    }
    // The user's own fonts, once they allowed access. Search covers all of them; only a
    // capped number of rows is drawn.
    const mine = localFamilies().filter(
      (name) =>
        !catalogNames.has(normalizeName(name)) &&
        isSafeFamily(name) &&
        (!q || name.toLowerCase().includes(q)),
    );
    for (const name of mine.slice(0, MY_FONTS_CAP))
      addRow(
        name,
        name,
        "",
        localId(name) === fontId,
        false,
        () => void choose(localId(name), name, ""),
      );
    if (mine.length > MY_FONTS_CAP) {
      const more = document.createElement("div");
      more.className = "empty";
      more.textContent = `Showing ${MY_FONTS_CAP} of ${mine.length} of your fonts. Type to narrow down.`;
      fontList.appendChild(more);
    }
    // Anything typed can be used as a font name, for fonts the lists don't know about.
    const typed = fontSearch.value.trim();
    if (typed && isSafeFamily(typed))
      addRow(
        `Use "${typed}"`,
        typed,
        "",
        localId(typed) === fontId,
        false,
        () => void choose(localId(typed), typed, ""),
      );
    if (!fontList.children.length) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "No matching fonts.";
      fontList.appendChild(e);
    }
    fontReset.disabled = !fontId;
  }
  fontSearch.addEventListener("input", renderFonts);
  fontReset.addEventListener("click", () => {
    void setFont("");
    fontMsg.textContent = "Using the page's own font.";
    renderFonts();
  });

  if (canQueryLocalFonts()) {
    browseBtn.addEventListener("click", async () => {
      browseBtn.disabled = true;
      fontMsg.textContent = "Waiting for permission…";
      const ok = await loadLocalFonts();
      browseBtn.disabled = false;
      if (!ok) {
        fontMsg.textContent =
          "Couldn't read your fonts. Allow access, or type a font name above.";
        return;
      }
      detect();
      fontMsg.textContent = `${localFamilies().length} fonts found on this device.`;
      browseBtn.textContent = "Refresh";
      renderFonts();
    });
  } else browseBtn.hidden = true; // Firefox and Safari don't offer the API

  fontMsg.textContent =
    "Open-source fonts download on first use. Commercial fonts must be installed. Type any font name to use it.";
  renderFonts();

  const autoGlobal = $<HTMLInputElement>(".auto-global"),
    autoSite = $<HTMLInputElement>(".auto-site"),
    autoMsg = $(".auto-msg");
  const renderAuto = () => {
    autoGlobal.checked = auto.global;
    autoSite.checked = auto.site;
    autoMsg.textContent = auto.global
      ? `Enabled globally · ${auto.count} detected here.`
      : auto.site
        ? `Enabled for ${HOST} · ${auto.count} detected here.`
        : "Off for this site.";
  };
  autoGlobal.addEventListener("change", () => {
    setAuto(autoGlobal.checked);
    renderAuto();
    setTimeout(renderAuto, 1200);
  });
  autoSite.addEventListener("change", () => {
    setSiteAuto(autoSite.checked);
    renderAuto();
    setTimeout(renderAuto, 1200);
  });
  renderAuto();

  const rulesBox = $(".rules"),
    sitesMsg = $(".sites-msg"),
    forgetBtn = $<HTMLButtonElement>(".forget");
  function renderSites() {
    const others = Object.keys(allSites()).filter((h) => h !== HOST).length;
    rulesBox.replaceChildren();
    if (!siteRules.length) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "Nothing saved for this site yet.";
      rulesBox.appendChild(e);
    }
    for (const sel of siteRules) {
      const r = document.createElement("div");
      r.className = "rule";
      const c = document.createElement("code");
      c.textContent = sel;
      c.title = sel;
      const x = document.createElement("button");
      x.className = "x";
      x.textContent = "✕";
      x.title = "Remove";
      x.addEventListener("click", () => {
        removeRule(sel);
        drawHover(null);
        renderSites();
      });
      r.addEventListener("mouseenter", () => {
        try {
          const el = queryPath(document, sel)[0];
          if (el) {
            el.scrollIntoView({ block: "nearest" });
            drawHover(el);
          }
        } catch {
          // stale selector after a site redesign; nothing to highlight
        }
      });
      r.addEventListener("mouseleave", () => drawHover(null));
      r.append(c, x);
      rulesBox.appendChild(r);
    }
    sitesMsg.textContent = `${siteRules.length} rule${siteRules.length === 1 ? "" : "s"} here · ${others} other site${others === 1 ? "" : "s"}`;
    forgetBtn.disabled = !siteRules.length;
  }
  forgetBtn.addEventListener("click", () => {
    [...siteRules].forEach(removeRule);
    renderSites();
  });
  renderSites();

  showTab(tab);
}
