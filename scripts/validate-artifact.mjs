import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");
const [source, manifest] = await Promise.all([readFile(workerPath, "utf8"), readFile(manifestPath, "utf8")]);
const parsedManifest = JSON.parse(manifest);
assert.equal("static" in parsedManifest, false, "Worker manifest must not declare static hosting");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(typeof workerModule.default?.fetch, "function", "Worker artifact must export default.fetch");

const pageResponse = await workerModule.default.fetch(new Request("https://example.test/"), {}, {});
assert.equal(pageResponse.status, 200);
assert.match(await pageResponse.text(), /Focus Physics/);
const hintResponse = await workerModule.default.fetch(
  new Request("https://example.test/api/hint", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ step: 1, question: "Which direction?" })
  }),
  {},
  {}
);
assert.equal(hintResponse.status, 503, "Missing secret should fail safely");
console.log("Artifact serves the lesson and fails safely without a local API secret");
