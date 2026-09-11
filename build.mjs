// Bundles src/ into the distributable rtl-anywhere.user.js at the repo root.
// The file is committed so the @downloadURL / raw GitHub install link keeps working.
import { build } from "esbuild";
import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const header = (await readFile("meta/header.txt", "utf8")).replace(
  "{{version}}",
  pkg.version,
);

const outfile = "rtl-anywhere.user.js";

await build({
  entryPoints: ["src/main.ts"],
  outfile,
  bundle: true,
  format: "iife",
  target: "es2022",
  charset: "utf8",
  // Userscripts are distributed as source: reviewers and script hosts read this file.
  minify: false,
  // esbuild emits no directive of its own, and a userscript manager may run the
  // bundle in sloppy mode — so state it explicitly inside the IIFE.
  banner: { js: `${header.trimEnd()}\n"use strict";` },
});

console.log(`built ${outfile} from src/ (v${pkg.version})`);
