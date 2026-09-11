// Settings panel: Font / Shortcuts / Auto / Sites, rendered inside a shadow root.
import { K } from "./constants.ts";
import { PAGE, HOST } from "./env.ts";
import { getValue, setValue } from "./gm.ts";
import { applyTypography } from "./styles.ts";
import { drawHover } from "./overlay.ts";
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

export function openPanel(tab: PanelTab = "font"): void {
  closePanel();
  const host = document.createElement("div");
  panelHost = host;
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = panelMarkup();
  document.documentElement.appendChild(host);
  document.addEventListener("mousedown", onOutsideDown, true);

  // Non-null assertions here are safe: every selector below targets markup from
  // the template literal above, which cannot be absent.
  const $ = <T extends HTMLElement>(s: string): T =>
    root.querySelector<T>(s) as T;
  const $$ = <T extends HTMLElement>(s: string): T[] => [
    ...root.querySelectorAll<T>(s),
  ];
  $(".x").addEventListener("click", closePanel);

  // --- tabs ---
  function showTab(name: PanelTab) {
    stopRecord();
    drawHover(null);
    $$(".tab").forEach((x) => x.classList.toggle("on", x.dataset.tab === name));
    $$(".sec").forEach((s) => s.classList.toggle("on", s.dataset.sec === name));
    if (name === "font") q.focus();
  }
  $$(".tab").forEach((t) =>
    t.addEventListener("click", () => showTab(t.dataset.tab as PanelTab)),
  );

  // --- font tab ---
  const list = $('[data-sec="font"] .list'),
    q = $<HTMLInputElement>(".q"),
    msg = $('[data-sec="font"] .msg'),
    loadBtn = $<HTMLButtonElement>(".load");
  let fonts = getValue(K.fonts, []);
  let current = getValue(K.font, "");
  const queryLocalFonts = PAGE.queryLocalFonts;
  if (!queryLocalFonts) {
    loadBtn.hidden = true;
    msg.textContent =
      "This browser can’t list system fonts. Type a font name above.";
  } else {
    msg.textContent = fonts.length
      ? `${fonts.length} system fonts`
      : "Load the list once; it’s cached.";
    if (fonts.length) loadBtn.textContent = "Refresh";
  }

  function item(name: string, label?: string) {
    const el = document.createElement("div");
    el.className = "item" + (name === current ? " on" : "");
    el.dataset.font = name;
    const n = document.createElement("span");
    n.className = "name";
    n.textContent = label || name;
    const s = document.createElement("span");
    s.className = "sample";
    if (name) {
      s.textContent = "نمونهٔ متن ۱۲۳";
      s.style.fontFamily = `"${name}"`;
    }
    el.append(n, s);
    return el;
  }
  function render() {
    const raw = q.value.trim(),
      term = raw.toLowerCase();
    const frag = document.createDocumentFragment();
    if (!term) frag.appendChild(item("", "Default — leave font untouched"));
    const shown = fonts.filter((f) => f.toLowerCase().includes(term));
    shown.forEach((f) => frag.appendChild(item(f)));
    if (raw && !fonts.some((f) => f.toLowerCase() === term))
      frag.appendChild(item(raw, `Use “${raw}”`));
    if (!shown.length && !raw) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = queryLocalFonts
        ? "No fonts loaded yet — click “Load system fonts” below, or type a name above."
        : "Type the exact name of an installed font above.";
      frag.appendChild(e);
    }
    list.replaceChildren(frag);
  }
  list.addEventListener("click", (e) => {
    const el =
      e.target instanceof Element
        ? e.target.closest<HTMLElement>(".item")
        : null;
    if (!el) return;
    current = el.dataset.font ?? "";
    setValue(K.font, current);
    applyTypography();
    render();
  });
  q.addEventListener("input", render);
  loadBtn.addEventListener("click", async () => {
    if (!queryLocalFonts) return;
    loadBtn.disabled = true;
    msg.textContent = "Loading…";
    try {
      // Called on the real window, inside the click (needs user activation).
      const data = await queryLocalFonts.call(PAGE);
      fonts = [...new Set(Array.from(data, (f) => f.family))].sort((a, b) =>
        a.localeCompare(b),
      );
      setValue(K.fonts, fonts);
      msg.textContent = `${fonts.length} system fonts`;
      loadBtn.textContent = "Refresh";
      render();
    } catch (err) {
      // Each failure mode has its own fix, so name it instead of showing "failed".
      const e = err instanceof Error ? err : null;
      if (!isSecureContext)
        msg.textContent =
          "Needs an HTTPS page — open the panel on any https:// site.";
      else if (e?.name === "NotAllowedError")
        msg.textContent =
          "Fonts permission is blocked for this site. Address bar icon → Site settings → Fonts → Allow, then retry.";
      else if (e?.name === "SecurityError")
        msg.textContent =
          "This page’s Permissions-Policy disables font access. Try another site.";
      else
        msg.textContent = `${e?.name || "Error"}: ${e?.message || "unavailable here"}`;
    } finally {
      loadBtn.disabled = false;
    }
  });

  // --- shortcuts tab ---
  const hint = $(".hint");
  const kbdBtns = $$(".kbd[data-sc]");
  // data-sc is written in the template above, so the cast can't be wrong here.
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

  // --- auto tab ---
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

  // --- sites tab ---
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
          const el = document.querySelector(sel);
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

  render();
  showTab(tab);
}
