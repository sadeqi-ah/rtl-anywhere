import { once } from "node:events";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(new URL("..", import.meta.url).pathname);
const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".png", "image/png"],
  [".gif", "image/gif"],
]);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204).end();
      return;
    }
    const path = url.pathname === "/" ? "/test/smoke.html" : url.pathname;
    const file = resolve(join(root, path));

    if (!file.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": mime.get(extname(file)) ?? "application/octet-stream",
    });
    res.end(body);
  } catch (error) {
    res
      .writeHead(404)
      .end(error instanceof Error ? error.message : "Not found");
  }
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("No server port");

const browser = await chromium.launch({ headless: true }).catch((error) => {
  if (!error.message.includes("Executable doesn't exist")) throw error;
  return chromium.launch({ channel: "chrome", headless: true });
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("requestfailed", (request) => {
  errors.push(
    `request failed: ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
  );
});

async function readOutput() {
  return (
    (await page
      .locator("#out")
      .textContent()
      .catch(() => null)) ?? ""
  );
}

try {
  for (const fixture of [
    "smoke",
    "regression",
    "disabled-regression",
    "idle-regression",
  ]) {
    await page.goto(`http://127.0.0.1:${address.port}/test/${fixture}.html`);

    try {
      await page.waitForFunction(
        () =>
          /\d+\/\d+ passed/.test(
            document.getElementById("out")?.textContent ?? "",
          ),
        undefined,
        { timeout: 10_000 },
      );
    } catch (error) {
      const output = await readOutput();
      throw new Error(
        [
          "Smoke test did not finish before the timeout.",
          output
            ? `Current output:\n${output}`
            : "No #out output was available.",
          ...errors.map((message) => `console/page error: ${message}`),
        ].join("\n"),
        { cause: error },
      );
    }

    const output = await readOutput();
    if (!output || output.trim() === "running…") {
      throw new Error("Smoke test did not finish before the timeout");
    }

    console.log(output);

    const failLines = output
      .split("\n")
      .filter((line) => line.startsWith("FAIL"));
    if (failLines.length || errors.length) {
      throw new Error(
        [
          ...failLines,
          ...errors.map((error) => `console/page error: ${error}`),
        ].join("\n"),
      );
    }
  }
  await page.goto(`http://127.0.0.1:${address.port}/test/harness.html`);
  await page.waitForTimeout(1100);
  const harnessColon = await page.evaluate(() => {
    const el = document.getElementById("latin-first-harness");
    if (!el) return false;
    const node = el.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    const x = (character) => {
      const i = node.textContent.indexOf(character);
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      return range.getBoundingClientRect().x;
    };
    return (
      getComputedStyle(el).direction === "rtl" &&
      x("G") > x(":") &&
      x(":") > x("ا")
    );
  });
  if (!harnessColon || errors.length)
    throw new Error("Harness: GitHub colon must appear left of GitHub");
  console.log("PASS harness: GitHub colon appears left of GitHub");
} finally {
  await page.close();
  await browser.close();
  server.close();
}
