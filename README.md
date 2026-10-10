# Focus Physics

Focus Physics is a calm, AI-assisted GCSE Physics learning experience for students whose attention fluctuates. Instead of presenting a full problem, timer, and dense explanation at once, it turns one forces question into a sequence of small, verifiable decisions and gives targeted help at the moment a learner gets stuck.

**Live demo:** [focus-physics-gcse.pluckydell16.chatgpt.site](https://focus-physics-gcse.pluckydell16.chatgpt.site/)

## The problem and real-world impact

Many learning tools treat an incorrect answer as a knowledge gap and respond with another long explanation. For a learner already managing limited attention or working-memory overload, that can make the original problem harder to re-enter.

Focus Physics reduces that friction by:

- showing one cognitive action at a time;
- preserving verified reasoning between steps;
- separating quantities, units, signs, and command words;
- providing help without timers, streak pressure, or penalties;
- saving lesson progress and scratchpad notes locally; and
- turning three correct steps into an interactive Force Lab, so success immediately leads to exploration.

The current demo covers one-dimensional forces at GCSE level. The interaction model can be reused for other physics topics and other subjects that require multi-step reasoning.

## Thoughtful AI implementation

AI is integrated into the learning loop rather than added as a generic chat window.

### Mistake Detective

After an incorrect answer, the server receives only the current question, submitted answer, attempt count, and already verified reasoning. The model classifies the observable snag—such as direction/sign, units, calculation, or equation choice—and returns a short structured repair action without revealing the target answer.

### Adaptive Hint Ladder

The same context-aware endpoint produces three deliberately different levels of support:

1. **Nudge** — recalls the relevant principle or direction.
2. **Scaffold** — supplies the equation or setup without completing the calculation.
3. **Worked example** — solves a parallel problem with different numbers so the learner must transfer the method.

### Free-form concept check

Learners can explain anything they understand, half-understand, or feel unsure about. A separate endpoint returns two constrained fields: what the learner has understood and one precise clarification.

The browser never receives the model API key. AI calls run server-side in a Cloudflare Worker, use strict JSON outputs, field and length validation, a seven-second timeout, and lightweight rate limiting. Every AI interaction has a deterministic local fallback, so the lesson remains usable and scientifically correct if the model or network is unavailable.

Privacy boundaries are explicit: the AI receives no name, diagnosis, or scratchpad content. The free-form checker sends only text the learner intentionally submits.

## Innovation

Focus Physics combines adaptive AI with an attention-aware interaction model:

- **one move, not one worksheet:** each screen asks for a single decision;
- **diagnosis before explanation:** AI identifies the likely reasoning snag before choosing support;
- **progressive disclosure of help:** assistance escalates without immediately giving away the answer;
- **reasoning continuity:** verified steps remain visible after errors, pauses, and returns;
- **earned experimentation:** three different correct steps permanently unlock Force Lab, where push, friction, and mass update resultant force and acceleration in real time;
- **failure-safe AI:** validated local physics fallbacks are part of the product design, not an afterthought.

## Architecture

```text
Browser (HTML/CSS/JavaScript)
  ├─ deterministic five-step lesson and Force Lab
  ├─ local progress, unlock state, and scratchpad
  └─ limited learning context
          │
          ▼
Cloudflare Worker
  ├─ /api/hint
  ├─ /api/understanding
  ├─ input validation, timeout, and rate limiting
  └─ server-side model request with structured JSON
```

- `site/` contains the accessible browser experience.
- `worker/index.js` contains the server routes and guarded AI integration.
- `scripts/build.mjs` embeds the site assets into the deployable Worker.
- `scripts/validate-artifact.mjs` exercises routing, safe failure, structured AI responses, and critical feature presence.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm run build
npm run check
npm run preview
```

Then open `http://127.0.0.1:4173/`.

To exercise the live AI paths, copy `.env.example` to `.env` and add a server-side `GROQ_API_KEY`. Without a key, the endpoints fail safely and the browser uses its built-in learning fallbacks. Never commit `.env` or API keys.

## Accessibility and safety

- Keyboard-operable controls and visible focus states
- Screen-reader status announcements for feedback
- Responsive layouts for desktop and narrow screens
- Reduced-motion support
- No diagnosis, identity inference, or shaming language
- No automatic loud audio, countdowns, or attention-grabbing reward loops

## Current scope

Forces is the complete demonstration world. Energy, Waves, Electricity, Particles, and Magnetism are shown as honest future directions rather than presented as finished content.
