# Security and privacy checklist

RTL Anywhere is intentionally local-only. Use this checklist when changing permissions, storage, page integration, or build output.

## Hard rules

- Do not add analytics, telemetry, remote config, or tracking.
- Do not add `fetch`, `XMLHttpRequest`, `GM_xmlhttpRequest`, WebSocket, or beacon calls.
- Do not store page text, selected text, page URLs, or browsing history.
- Keep userscript storage limited to settings: shortcuts, auto-detect flags, onboarding state, and remembered selectors.
- Keep broad `@match *://*/*` justified by the product behavior: user-triggered RTL controls on any page.

## Review checklist

Before merging a change, check:

- [ ] `pnpm run check` passes.
- [ ] `pnpm run check:bundle` passes.
- [ ] The committed `rtl-anywhere.user.js` matches `src/`.
- [ ] `pnpm run test:security` passes.
- [ ] No new network API usage was added.
- [ ] No new userscript grants were added without updating README and this checklist.
- [ ] Storage schema changes are typed in `src/gm.ts`.
- [ ] New protected-site behavior is covered by logic tests, smoke tests, or the harness.
- [ ] UI changes can be inspected in `test/harness.html`.

## Automated safety scan

The local and CI check runs a network API safety scan:

```bash
pnpm run test:security
```

It fails if executable files under `src`, `test`, or `meta` include these network API names:

```text
fetch
XMLHttpRequest
GM_xmlhttpRequest
WebSocket
sendBeacon
```

Documentation references in `README.md` and `SECURITY.md` are allowed.

## Suggested local scans

GitHub code search should return only documentation references for these terms:

```text
fetch
XMLHttpRequest
GM_xmlhttpRequest
WebSocket
sendBeacon
```

For a manual local check, run:

```bash
rg "fetch|XMLHttpRequest|GM_xmlhttpRequest|WebSocket|sendBeacon" src test meta README.md SECURITY.md
```

Expected result: no executable network usage in `src/`.
