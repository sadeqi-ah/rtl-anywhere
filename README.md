# RTL Anywhere

Make any piece of text on any website right-to-left — with one shortcut.

![demo](assets/demo.gif)

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey).
2. Click **[Install RTL Anywhere](https://raw.githubusercontent.com/sadeqi-ah/rtl-anywhere/main/rtl-anywhere.user.js)**.

## Usage

| Shortcut (default)    | Action                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| `Alt+R` / `⌥R`        | Toggle RTL on the selected text, or the element under the cursor       |
| `Alt+Shift+R` / `⌥⇧R` | Pick mode: hover to preview, click to toggle. Stays active until `Esc` |
| `Alt+Shift+Z` / `⌥⇧Z` | Undo everything on the current page                                    |
| `Esc`                 | Exit pick mode / close settings                                        |

Pressing the toggle shortcut again on an RTL element reverts it.

### In pick mode

| Key                     | Action                                           |
| ----------------------- | ------------------------------------------------ |
| click                   | Toggle RTL on the highlighted element            |
| `⇧`+click               | Toggle **and remember** it for this site         |
| `↑` / `↓`, or `⌥`+wheel | Move the selection to the parent / child element |
| `Esc`                   | Exit                                             |

All three shortcuts are also in the Tampermonkey menu, next to **Settings…**.

## Features

- Works on text selections (only the selected part becomes RTL) or whole elements
- Code, `pre`, math (MathJax/KaTeX), and editors are detected and always stay LTR
- Icon fonts, emoji and SVG keep their own font when a custom RTL font is set
- **Auto-detect** — paragraphs that are mostly Persian, Arabic or Hebrew (≥60% of their
  letters) become RTL on their own. Pages that already render RTL are left alone. Off by default
- **Per-site memory** — `⇧`+click in pick mode saves a selector for that hostname and
  re-applies it on every visit, including content loaded later
- Optional font for RTL text — pick from your system fonts, saved globally
- Customizable shortcuts
- DevTools-style highlight that is never clipped by `overflow: hidden`
- No tracking, no network requests

## Settings

Tampermonkey menu → **Settings…**

![settings](assets/settings.png)

| Tab           | What's in it                                                            |
| ------------- | ----------------------------------------------------------------------- |
| **Font**      | Font search / free-text entry and "Load system fonts"                   |
| **Shortcuts** | Rebind any of the three shortcuts, or reset to defaults                 |
| **Auto**      | Auto-detect globally or only on the current site                        |
| **Sites**     | Selectors remembered for the current hostname, and **Forget this site** |

> **Font list:** "Load system fonts" uses the Local Font Access API (Chrome/Edge/Brave,
> HTTPS only). On Firefox/Safari you can type the font name manually.

## What is saved

Everything is stored locally through Tampermonkey's own storage (`GM_setValue`), never sent
anywhere: your font, your shortcuts, global/per-site auto-detect settings, and per-site
selectors from `⇧`+click.

One-off toggles are **not** saved. Reloading a page restores the site's original layout —
unless auto-detect is on, or the element matches a selector you remembered for that site.

## Permissions

The script asks for broad access because of what it does, and nothing more:

| Grant                                   | Why                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `@match *://*/*`                        | "Anywhere" is the feature — it has to be able to run on any page you press the shortcut on              |
| `unsafeWindow`                          | Only to call `queryLocalFonts()` on the real page window; it fails through the userscript sandbox proxy |
| `GM_getValue` / `GM_setValue`           | The settings above                                                                                      |
| `GM_addStyle`, `GM_registerMenuCommand` | Injected CSS and the Tampermonkey menu entries                                                          |

There is no `GM_xmlhttpRequest`, no `fetch`, no analytics: the script makes no network
requests at all.

## Notes

- Add a selector to `PROTECTED` in the script if a site's code blocks aren't detected.
- Inside cross-origin iframes the first-run card is suppressed, but shortcuts still work.

## License

MIT
