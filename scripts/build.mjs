import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const workerTemplate = await readFile(resolve(root, "worker/index.js"), "utf8");
const [html, css, js] = await Promise.all([
  readFile(resolve(root, "site/index.html"), "utf8"),
  readFile(resolve(root, "site/styles.css"), "utf8"),
  readFile(resolve(root, "site/app.js"), "utf8")
]);

const output = workerTemplate
  .replace("__PAGE_HTML__", JSON.stringify(html))
  .replace("__PAGE_STYLES__", JSON.stringify(css))
  .replace("__CLIENT_SCRIPT__", JSON.stringify(js));

if (/__PAGE_(?:HTML|STYLES)__|__CLIENT_SCRIPT__/.test(output)) throw new Error("Worker asset placeholders were not replaced");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "server"), { recursive: true });
await mkdir(resolve(dist, ".openai"), { recursive: true });
await writeFile(resolve(dist, "server/index.js"), output);
await cp(resolve(root, ".openai/hosting.json"), resolve(dist, ".openai/hosting.json"));
console.log("Built Worker artifact in dist/");
