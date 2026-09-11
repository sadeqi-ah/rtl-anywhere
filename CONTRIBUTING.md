# Contributing

RTL Anywhere is maintained with small, reviewable changes and a strict local check gate.

## Local setup

```bash
pnpm install
pnpm run check
```

`pnpm run check` is the source of truth. It runs formatting, TypeScript, Node tests, the security scan, bundle freshness validation, and browser smoke tests.

## Development workflow

1. Create a focused branch.
2. Make the smallest useful change.
3. Run:

```bash
pnpm run check
```

4. If `rtl-anywhere.user.js` changes after the build step, review and commit it with the related source change.
5. Open a PR using the template.

## Commit style

Use Conventional Commits:

```text
feat(scope): add behavior
fix(scope): correct behavior
test(scope): cover behavior
refactor(scope): reorganize without behavior changes
docs: update documentation
ci: update automation
build: update build output
```

Examples:

```text
test(pick): cover remembered selector shortcut
fix(test): wait for smoke results
refactor(ui): isolate overlay markup
```

## Tests

### Full gate

```bash
pnpm run check
```

### Pure logic and security tests

```bash
pnpm test
pnpm run test:security
```

### Browser smoke test

```bash
pnpm run test:smoke
```

The smoke test should cover user-visible behavior, not implementation details.

### Manual UI harness

```bash
pnpm run dev:harness
```

Then open `test/harness.html` in a browser. Use the harness for UI states that are hard to inspect through automated smoke tests.

## Security and privacy

Before changing userscript grants, storage, network behavior, or page integration behavior, read `SECURITY.md`.

Hard rules:

- No analytics or telemetry.
- No network APIs unless explicitly reviewed.
- Do not store page text, selected text, page URLs, or browsing history.
- Keep storage limited to user preferences and remembered selectors.

## Bundle policy

The distributable userscript is committed as `rtl-anywhere.user.js` because the raw GitHub install URL serves that file directly.

Any source change that affects the bundle must include the regenerated bundle in the same PR.

Useful command:

```bash
pnpm run check:bundle
```
