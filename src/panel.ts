// Settings panel: Shortcuts / Auto / Sites, rendered inside a shadow root.
import { HOST } from "./env.ts";
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

export function openPanel(tab: PanelTab = "keys"): void {
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
    $$(".tab").forEach((x) => x.classList.toggle("on", x.dataset.tab === name));
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

  showTab(tab);
}
