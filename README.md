# RTL Anywhere

Right-align text on a website without flipping the entire page. RTL Anywhere is a userscript for reading Persian, Arabic, Hebrew, and mixed-direction text. Toggle a paragraph or selection, remember an element on a site, or enable conservative auto-detection.

![RTL Anywhere demo](assets/demo.gif)

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. **[Install RTL Anywhere](https://raw.githubusercontent.com/sadeqi-ah/rtl-anywhere/main/rtl-anywhere.user.js)** and confirm the manager's prompt.
3. Hover a paragraph and press `Alt+R` (`⌥R` on macOS). Press it again to revert.

Updates are available through your userscript manager after a new version is published.

## Usage

| Shortcut (default)    | Action                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| `Alt+R` / `⌥R`        | Toggle RTL on the selected text, or the element under the cursor       |
| `Alt+Shift+R` / `⌥⇧R` | Pick mode: hover to preview, click to toggle. Stays active until `Esc` |
| `Alt+Shift+Z` / `⌥⇧Z` | Undo everything on the current page                                    |
| `Esc`                 | Exit pick mode / close settings / dismiss onboarding                   |

### Pick mode

| Key                     | Action                                           |
| ----------------------- | ------------------------------------------------ |
| click                   | Toggle RTL on the highlighted element            |
| `⇧`+click               | Toggle **and remember** it for this site         |
| `↑` / `↓`, or `⌥`+wheel | Move the selection to the parent / child element |
| `Esc`                   | Exit                                             |

All three main actions are also available from the Tampermonkey menu, next to **Settings…**.

## Features

- Toggle a full element or only the currently selected text
- Precise pick mode with parent/child depth control
- Per-site remembered selectors with `⇧`+click
- Optional auto-detect for Persian, Arabic, and Hebrew text
- Customizable shortcuts
- DevTools-style overlay that is not clipped by `overflow: hidden`
- Code, `pre`, math, editors, icon fonts, emoji, and SVG are protected from accidental styling
- Local-only settings through userscript storage
- No tracking, analytics, `fetch`, or `GM_xmlhttpRequest`

## Auto-detect

Auto-detect applies RTL when at least 60% of an element's letters are RTL **or** its first letter is RTL. Short Persian replies are included. A mixed sentence beginning with `GitHub:` still uses an RTL base when it contains Persian text.

Auto-detect is off by default. Enable it globally or for the current site under **Settings → Auto**. It leaves already-RTL content alone, skips editors and protected code/math, and processes content added later.

## Settings

Open **Settings…** from the userscript manager's menu.

| Tab           | What's in it                                                            |
| ------------- | ----------------------------------------------------------------------- |
| **Shortcuts** | Rebind any of the three shortcuts, or reset to defaults                 |
| **Auto**      | Auto-detect globally or only on the current site                        |
| **Sites**     | Selectors remembered for the current hostname, and **Forget this site** |

## What is saved

Settings are stored locally through the userscript manager (`GM_setValue`): shortcut bindings, the global auto-detect flag, hostnames with site auto-detect enabled, remembered selectors grouped by hostname, and whether onboarding has been dismissed. Page text, selected text, URLs, and browsing history are not saved.

One-off toggles are **not** saved. Reloading a page restores its original layout unless auto-detect is on or an element matches a remembered selector for that site.

## Development

Requirements:

- Node.js `>=22.18`
- pnpm `10.27.0`

Install dependencies:

```bash
pnpm install
```

Build the userscript:

```bash
pnpm run build
```

Run all checks:

```bash
pnpm run check
```

`check` runs formatting, TypeScript, Node logic tests, the privacy/security scan, a build, verifies that the committed userscript bundle is not stale, and runs the automated browser smoke test. GitHub Actions runs the same command, so CI and local checks should stay aligned.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, commit, testing, and bundle workflow.

Verify only the committed bundle:

```bash
pnpm run check:bundle
```

Run only the network API safety scan:

```bash
pnpm run test:security
```

### Local UI harness

Use the harness when developing UI states without reinstalling the userscript:

```bash
pnpm run dev:harness
```

Then open:

```text
test/harness.html
```

The harness shims the Tampermonkey APIs and includes local scenarios for:

- auto-detect content
- protected code/pre content
- pick-mode targets
- remembered selectors
- overflow clipping checks
- contenteditable fallback behavior
- settings panel states
- onboarding replay
- light/dark theme checks

### Tests

Pure logic and security tests:

```bash
pnpm test
```

Browser smoke test:

```bash
pnpm run test:smoke
```

The smoke test serves `test/smoke.html`, opens it in Playwright/Chromium, waits for PASS/FAIL output, and exits non-zero on failures or page errors. It covers auto-detect, remembered site rules, selection handling, editable handling, onboarding, settings toggles, shortcut recording, menu commands, and overlay/HUD behavior.

### Security and privacy review

Before changing permissions, storage, or page integration behavior, review [SECURITY.md](SECURITY.md).

## Project structure

| Path                     | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `src/main.ts`            | Entry point: menu commands, keyboard handling, observer wiring  |
| `src/core.ts`            | Apply/revert/toggle logic for elements and text selections      |
| `src/auto.ts`            | Auto-detect scanning and per-site/global auto state             |
| `src/pick.ts`            | Pick mode, hover tracking, depth navigation                     |
| `src/overlay.ts`         | Overlay behavior: hover boxes, feedback tags, HUD, beam toggle  |
| `src/overlay-markup.ts`  | Shadow-root markup and CSS for the overlay/HUD/beam             |
| `src/panel.ts`           | Settings panel behavior and event wiring                        |
| `src/panel-markup.ts`    | Settings panel markup                                           |
| `src/ui-css.ts`          | Shared UI CSS for onboarding/settings surfaces                  |
| `src/onboard.ts`         | First-run onboarding behavior                                   |
| `src/onboard-markup.ts`  | First-run onboarding markup                                     |
| `src/sites.ts`           | Remembered selector application                                 |
| `src/selector.ts`        | Stable selector generation guards                               |
| `src/keys.ts`            | Shortcut parsing, formatting, matching                          |
| `src/shortcuts.ts`       | Shortcut persistence and recorder behavior                      |
| `src/styles.ts`          | Injected RTL typography/style rules                             |
| `.github/workflows/`     | CI workflow running the unified local check command             |
| `test/logic.test.ts`     | Node tests for pure logic                                       |
| `test/security-scan.mjs` | Network API safety scan                                         |
| `test/smoke.html`        | Browser smoke page                                              |
| `test/smoke-runner.mjs`  | Automated Playwright smoke runner                               |
| `test/harness.html`      | Manual local development harness                                |
| `build.mjs`              | Bundles `src/main.ts` into `rtl-anywhere.user.js` with metadata |

## Permissions

The userscript asks for broad access because the feature is broad: it needs to be ready on whatever page you decide to toggle.

| Grant                         | Why                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `@match *://*/*`              | "Anywhere" is the feature — the script must be available on any page where you press the shortcut |
| `GM_getValue` / `GM_setValue` | Store settings locally in the userscript manager                                                  |
| `GM_addStyle`                 | Inject the RTL typography and UI styles                                                           |
| `GM_registerMenuCommand`      | Add Pick mode, Undo, and Settings actions to the userscript menu                                  |

There is no `GM_xmlhttpRequest`, no `fetch`, no remote config, and no analytics.

## Troubleshooting

### A code block became RTL

Add a more specific selector to `PROTECTED` in `src/constants.ts`, then add a smoke/harness case for that site pattern.

### The wrong element toggles

Use pick mode and adjust depth with `↑` / `↓` or `⌥`+wheel before clicking. If the choice should persist, use `⇧`+click to remember the selector for the site.

### The onboarding card does not appear

It is shown once and only in the top frame. In the local harness, use **Show onboarding** to replay it.

### `pnpm run check` changed `rtl-anywhere.user.js`

The distributable userscript is committed so the raw GitHub install link can serve it. Run `pnpm run build`, review the generated diff, and commit the updated `rtl-anywhere.user.js` with the related source change.

### The install link uses `rtl-anywhere`

That is intentional. The distributed userscript metadata and install links target the public `rtl-anywhere` repository.

## License

MIT
