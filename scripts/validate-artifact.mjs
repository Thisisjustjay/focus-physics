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

const appResponse = await workerModule.default.fetch(new Request("https://example.test/app.js"), {}, {});
const appSource = await appResponse.text();
assert.match(appSource, /MISTAKE DETECTIVE/);
assert.match(appSource, /Worked example/);
assert.match(appSource, /resetButton/);

const originalFetch = globalThis.fetch;
let outboundState;
globalThis.fetch = async (_url, options) => {
  const outbound = JSON.parse(options.body);
  outboundState = JSON.parse(outbound.messages[1].content);
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({
      mistakeType: outboundState.task === "detect" ? "direction_sign" : "principle",
      label: outboundState.task === "detect" ? "Direction / sign" : "Worked example",
      hint: "Use the direction of the resultant force.",
      why: "Acceleration follows the resultant force.",
      nextAction: "Compare the two force directions."
    }) } }]
  }), { status: 200, headers: { "content-type": "application/json" } });
};

try {
  const coachResponse = await workerModule.default.fetch(
    new Request("https://example.test/api/hint", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "test-detect" },
      body: JSON.stringify({ task: "detect", step: 1, question: "Which direction?", currentAnswer: "left", attempt: 1 })
    }),
    { GROQ_API_KEY: "test-only" },
    {}
  );
  assert.equal(coachResponse.status, 200);
  const coachJson = await coachResponse.json();
  assert.equal(coachJson.mistakeType, "direction_sign");
  assert.equal(outboundState.task, "detect");

  const ladderResponse = await workerModule.default.fetch(
    new Request("https://example.test/api/hint", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "test-ladder" },
      body: JSON.stringify({ task: "hint", hintLevel: 3, step: 2, question: "Find net force", attempt: 2 })
    }),
    { GROQ_API_KEY: "test-only" },
    {}
  );
  assert.equal(ladderResponse.status, 200);
  assert.equal(outboundState.task, "hint");
  assert.equal(outboundState.hintLevel, 3);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Artifact, AI mistake diagnosis, hint ladder and safe fallback all passed");
