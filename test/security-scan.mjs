import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url);
const PATTERN =
  /\b(fetch|XMLHttpRequest|GM_xmlhttpRequest|WebSocket|sendBeacon)\b/g;
const ALLOWED_DOCS = new Set(["README.md", "SECURITY.md"]);

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
  if (ALLOWED_DOCS.has(file)) continue;
  const text = readFileSync(new URL(file, ROOT), "utf8");
  for (const match of text.matchAll(PATTERN)) {
    const line = text.slice(0, match.index).split("\n").length;
    findings.push(`${relative(".", file)}:${line}: ${match[0]}`);
  }
}

assert.deepEqual(
  findings,
  [],
  `Unexpected network API references:\n${findings.join("\n")}`,
);
