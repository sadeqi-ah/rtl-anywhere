// First-run card: shown once, top frame only.
import { K } from "./constants.ts";
import { IS_TOP } from "./env.ts";
import { getValue, setValue } from "./gm.ts";
import { setAuto } from "./auto.ts";
import { openPanel } from "./panel.ts";
import { onboardMarkup } from "./onboard-markup.ts";

let host: HTMLElement | null = null;

/** Closes the card if it's up. Returns whether there was one — Esc uses that to stop. */
export function dismissOnboard(): boolean {
  if (!host) return false;
  setValue(K.onboarded, true);
  host.remove();
  host = null;
  return true;
}

export function maybeOnboard(): void {
  if (
    !IS_TOP ||
    getValue(K.onboarded, false) ||
    document.visibilityState !== "visible"
  )
    return;
  host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = onboardMarkup();
  document.documentElement.appendChild(host);

  root.querySelector(".ok")?.addEventListener("click", () => dismissOnboard());
  root.querySelector(".set")?.addEventListener("click", () => {
    dismissOnboard();
    openPanel();
  });
  root
    .querySelector<HTMLInputElement>(".auto")
    ?.addEventListener("change", (e) => {
      if (e.currentTarget instanceof HTMLInputElement)
        setAuto(e.currentTarget.checked);
    });
}
