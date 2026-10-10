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
const pageSource = await pageResponse.text();
assert.match(pageSource, /Focus Physics/);
assert.match(pageSource, /id="startTestButton"/);
assert.match(pageSource, /id="understandingInput"/);
assert.match(pageSource, /id="experimentReward"/);
assert.match(pageSource, /id="experimentDialog"/);
assert.match(pageSource, /id="pushForceInput"/);
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
const understandingFallbackResponse = await workerModule.default.fetch(
  new Request("https://example.test/api/understanding", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "test-no-secret-understanding" },
    body: JSON.stringify({ topic: "Forces", thought: "Force changes motion." })
  }),
  {},
  {}
);
assert.equal(understandingFallbackResponse.status, 503, "Understanding endpoint should fail safely without its secret");

const appResponse = await workerModule.default.fetch(new Request("https://example.test/app.js"), {}, {});
const appSource = await appResponse.text();
assert.match(appSource, /MISTAKE DETECTIVE/);
assert.match(appSource, /Worked example/);
assert.match(appSource, /resetButton/);
assert.match(appSource, /\/api\/understanding/);
assert.match(appSource, /focusPhysicsCorrectSteps/);
assert.match(appSource, /recordCorrectStep/);
assert.match(appSource, /updateExperiment/);

const originalFetch = globalThis.fetch;
let outboundState;
globalThis.fetch = async (url, options) => {
  const outbound = JSON.parse(options.body);
  outboundState = JSON.parse(outbound.messages[1].content);
  const content = String(url).includes("/chat/completions") && "thought" in outboundState
    ? {
        understood: "You connected force with a change in motion.",
        clarify: "Use resultant force, including direction, before applying Fnet = ma."
      }
    : {
        mistakeType: outboundState.task === "detect" ? "direction_sign" : "principle",
        label: outboundState.task === "detect" ? "Direction / sign" : "Worked example",
        hint: "Use the direction of the resultant force.",
        why: "Acceleration follows the resultant force.",
        nextAction: "Compare the two force directions."
      };
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(content) } }]
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

  const understandingResponse = await workerModule.default.fetch(
    new Request("https://example.test/api/understanding", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "test-understanding" },
      body: JSON.stringify({ topic: "Forces in one dimension", thought: "I think a larger force means faster acceleration." })
    }),
    { GROQ_API_KEY: "test-only" },
    {}
  );
  assert.equal(understandingResponse.status, 200);
  const understandingJson = await understandingResponse.json();
  assert.equal(understandingJson.clarify, "Use resultant force, including direction, before applying Fnet = ma.");
  assert.equal("nextQuestion" in understandingJson, false);
  assert.match(outboundState.thought, /larger force/);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Artifact, mode chooser, AI concept check, mistake diagnosis, hint ladder, Force Lab reward and safe fallbacks all passed");
