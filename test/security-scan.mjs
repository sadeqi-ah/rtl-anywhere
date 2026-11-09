import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url);
const PATTERN =
  /\b(fetch|XMLHttpRequest|GM_xmlhttpRequest|WebSocket|sendBeacon)\b/g;
// The one reviewed network path: the optional open-source font download (src/fonts.ts
// lists the pinned URLs and hashes). GM_xmlhttpRequest is allowed in these files only;
// every other network API stays banned everywhere.
const GM_XHR_FILES = new Set([
  "src/gm.ts",
  "src/types/globals.d.ts",
  "meta/header.txt",
]);
const ALLOWED_FILES = new Set([
  "README.md",
  "SECURITY.md",
  "test/security-scan.mjs",
]);

const files = execFileSync(
  "git",
  ["ls-files", "src", "test", "meta", "README.md", "SECURITY.md"],
  { cwd: ROOT, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const findings = [];
for (const file of files) {
  if (ALLOWED_FILES.has(file)) continue;
  const text = readFileSync(new URL(file, ROOT), "utf8");
  for (const match of text.matchAll(PATTERN)) {
    if (match[0] === "GM_xmlhttpRequest" && GM_XHR_FILES.has(file)) continue;
    const line = text.slice(0, match.index).split("\n").length;
    findings.push(`${relative(".", file)}:${line}: ${match[0]}`);
  }
}

assert.deepEqual(
  findings,
  [],
  `Unexpected network API references:\n${findings.join("\n")}`,
);

// The manager may only be allowed to reach the font CDN.
const header = readFileSync(new URL("meta/header.txt", ROOT), "utf8");
const connects = [...header.matchAll(/@connect\s+(\S+)/g)].map((m) => m[1]);
assert.deepEqual(connects, ["cdn.jsdelivr.net"], "unexpected @connect hosts");
