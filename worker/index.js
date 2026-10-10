const page = __PAGE_HTML__;
const styles = __PAGE_STYLES__;
const clientScript = __CLIENT_SCRIPT__;

const requestBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

function text(value, contentType, cache = "public, max-age=300") {
  return new Response(value, {
    headers: {
      "content-type": contentType,
      "cache-control": cache,
      "x-content-type-options": "nosniff"
    }
  });
}

function clip(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function allowRequest(request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
  const key = forwarded.split(",")[0].trim();
  const now = Date.now();
  const recent = (requestBuckets.get(key) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  requestBuckets.set(key, recent);
  if (requestBuckets.size > 500) {
    for (const [bucketKey, timestamps] of requestBuckets) {
      if (!timestamps.some(timestamp => now - timestamp < RATE_WINDOW_MS)) requestBuckets.delete(bucketKey);
    }
  }
  return true;
}

function parseModelJson(content) {
  if (typeof content !== "string") throw new Error("missing model content");
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("model response was not JSON");
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  const mistakeType = clip(parsed.mistakeType || parsed.mistake_type, 60);
  const label = clip(parsed.label, 80);
  const hint = clip(parsed.hint, 280);
  const why = clip(parsed.why, 180);
  const nextAction = clip(parsed.nextAction || parsed.next_action, 180);
  if (!hint || !nextAction) throw new Error("model response missed required fields");
  return { mistakeType, label, hint, why, nextAction };
}

async function handleHint(request, env) {
  if (!allowRequest(request)) return json({ error: "Please wait a moment before requesting another hint." }, 429);
  if (!env.GROQ_API_KEY) return json({ error: "AI hints are temporarily unavailable." }, 503);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) return json({ error: "Request is too large." }, 413);

  let incoming;
  try {
    incoming = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const state = {
    task: incoming.task === "detect" ? "detect" : "hint",
    topic: clip(incoming.topic, 80),
    problem: clip(incoming.problem, 800),
    step: Number.isInteger(incoming.step) ? incoming.step : 0,
    command: clip(incoming.command, 40),
    question: clip(incoming.question, 400),
    currentAnswer: clip(incoming.currentAnswer, 160),
    attempt: Math.max(0, Math.min(Number(incoming.attempt) || 0, 9)),
    hintLevel: Math.max(1, Math.min(Number(incoming.hintLevel) || 1, 3)),
    helpType: ["words", "start", "lost"].includes(incoming.helpType) ? incoming.helpType : "start",
    reasoningSoFar: Array.isArray(incoming.reasoningSoFar)
      ? incoming.reasoningSoFar.slice(0, 5).map(item => clip(item, 160)).filter(Boolean)
      : []
  };

  if (!state.question || state.step < 1 || state.step > 5) return json({ error: "Missing lesson context." }, 400);

  const systemPrompt = `You are Focus Physics, a calm GCSE Physics learning coach for pupils with attention variability. Be accurate, encouraging, concise and age-appropriate. Never mention ADHD, diagnose the pupil, shame an answer, or infer a stable trait from one response. Preserve the stated sign convention and units. You may use at most one light, natural Gen Alpha phrase; clarity matters more than slang.

The task is either "detect" or "hint".
- For "detect": infer the single most likely observable error in the current answer. Choose mistakeType from reading, principle, direction_sign, units, calculation, equation_choice, or other. Give a friendly 2–4 word label, explain the specific mismatch without revealing the target final answer, and provide one repair action.
- For "hint": obey hintLevel exactly. Level 1 (Nudge) reminds the relevant principle or direction only. Level 2 (Scaffold) provides the equation/setup and may substitute known values but does not calculate the target answer. Level 3 (Worked example) solves a short parallel example with different numbers, then asks the pupil to transfer the pattern; do not state the target problem's final answer.

Return only valid JSON with exactly these string keys: mistakeType, label, hint, why, nextAction. Keep hint under 45 words, why under 30 words, label under 4 words, and nextAction under 20 words.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const baseUrl = String(env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: env.AI_MODEL || "qwen/qwen3.8-27b",
        temperature: 0.25,
        max_completion_tokens: 280,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(state) }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.warn("Groq hint request failed", response.status);
      return json({ error: "AI hint could not be generated." }, 502);
    }

    const data = await response.json();
    const result = parseModelJson(data?.choices?.[0]?.message?.content);
    return json({ ...result, source: "ai" });
  } catch (error) {
    console.warn("AI hint error", error instanceof Error ? error.name : "unknown");
    return json({ error: "AI hint timed out." }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request, env, ctx) {
    void ctx;
    const url = new URL(request.url);

    if (url.pathname === "/api/hint") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
      return handleHint(request, env);
    }

    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    if (url.pathname === "/" || url.pathname === "/index.html") return text(page, "text/html; charset=utf-8", "no-cache");
    if (url.pathname === "/styles.css") return text(styles, "text/css; charset=utf-8");
    if (url.pathname === "/app.js") return text(clientScript, "text/javascript; charset=utf-8");
    return new Response("Not found", { status: 404 });
  }
};
