const steps = [
  {
    command: "PREDICT",
    title: "Before calculating, which way should the crate accelerate?",
    context: "Predict the direction first. No arithmetic yet.",
    type: "choice",
    options: ["To the right", "To the left", "It will not accelerate"],
    correct: 0,
    feedback: [
      "Big W. The 20 N push clears the 5 N friction, so the resultant force—and the acceleration—go right. Direction check passed.",
      "Low-key not the move. Friction only has 5 N while the push has 20 N, so the bigger force makes the resultant point right.",
      "Balanced forces? Not in this timeline. 20 N right and 5 N left leave 15 N to the right, so the crate accelerates."
    ],
    help: {
      words: "Compare the two opposite forces. Which one is larger?",
      start: "Point toward the larger force: 20 N right versus 5 N left.",
      lost: "You are only predicting direction for now. The larger horizontal force points right."
    },
    ladder: [
      "Principle: acceleration follows the resultant force, so compare the opposing forces before doing arithmetic.",
      "Scaffold: subtract the smaller opposing force from the larger one, then keep the larger force’s direction.",
      "Parallel example: 12 N right against 4 N left leaves 8 N right. Apply that same comparison to 20 N and 5 N."
    ]
  },
  {
    command: "CALCULATE",
    title: "What is the net horizontal force?",
    context: "Enter a number in newtons. Right is positive.",
    type: "input",
    placeholder: "Fnet = …",
    unit: "N",
    correct: value => Math.abs(Number(value) - 15) < 0.001,
    success: "W calculation: 20 − 5 = 15 N right. Friction tried it, but the push still has 15 N left in the tank.",
    retry: "The sign got caught in 4K. Friction points left, so it subtracts: 20 − 5 = 15 N right.",
    help: {
      words: "Net force means what remains after opposite forces cancel.",
      start: "Start with Fnet = 20 N − 5 N.",
      lost: "You identified a 20 N force right and a 5 N force left. Combine only those two."
    },
    ladder: [
      "Principle: resultant force is the vector sum. Forces in opposite directions subtract.",
      "Scaffold: with right positive, write the force sum as +20 N + (−5 N). Do not calculate it yet.",
      "Parallel example: 14 N right and 6 N left gives 14 − 6 = 8 N right. Now mirror that structure with 20 and 5."
    ]
  },
  {
    command: "CHOOSE",
    title: "Which model connects net force and acceleration?",
    context: "Pick the relationship that uses the crate’s mass.",
    type: "choice",
    options: ["Fnet = ma", "E = mc²", "p = mv"],
    correct: 0,
    feedback: [
      "W pick. Fnet = ma is literally the link between our net force, mass and acceleration. Newton would approve.",
      "Iconic equation, wrong cinematic universe. E = mc² links mass and rest energy; it has no force or acceleration in it.",
      "p = mv pulled up to the wrong function. It defines momentum; Fnet = ma is the equation that connects the quantities we have."
    ],
    help: {
      words: "You need an equation connecting force, mass, and acceleration.",
      start: "Newton’s second law is the useful model here.",
      lost: "You found Fnet = 15 N. Now choose the equation that also contains the known mass, 5 kg."
    },
    ladder: [
      "Principle: Newton’s second law connects resultant force, mass and acceleration.",
      "Scaffold: choose the equation containing all three symbols: Fnet, m and a.",
      "Worked connection: when force and mass are known, Fnet = ma can be rearranged to find acceleration. Match that to the choices."
    ]
  },
  {
    command: "CALCULATE",
    title: "Now find the acceleration.",
    context: "Enter a number in m/s². Your setup: 15 N = (5 kg)a.",
    type: "input",
    placeholder: "a = …",
    unit: "m/s²",
    correct: value => Math.abs(Number(value) - 3) < 0.001,
    success: "You ate that calculation: a = 15 ÷ 5 = 3 m/s² to the right. Units, value and direction all understood the assignment.",
    retry: "Small algebra plot twist. Get a by itself first: a = F ÷ m. Then 15 ÷ 5 gives 3 m/s².",
    help: {
      words: "Acceleration equals net force divided by mass.",
      start: "Calculate 15 ÷ 5.",
      lost: "Your verified pieces are Fnet = 15 N and m = 5 kg. Use a = Fnet / m."
    },
    ladder: [
      "Principle: rearrange Fnet = ma so acceleration is on its own: a = Fnet ÷ m.",
      "Scaffold: substitute the verified values but pause before solving: a = 15 N ÷ 5 kg.",
      "Parallel example: 12 N ÷ 3 kg = 4 m/s². Use the same division pattern with your 15 N and 5 kg."
    ]
  },
  {
    command: "CHECK",
    title: "Final check: which statement passes all three tests?",
    context: "Check the units, sign and magnitude—not just the number.",
    type: "choice",
    options: [
      "3 m/s²; positive/right; reasonable after 15 N ÷ 5 kg",
      "3 N; negative/left; reasonable because friction acts left",
      "15 m/s²; positive/right; reasonable because the net force is 15 N"
    ],
    correct: 0,
    feedback: [
      "Full combo unlocked: m/s² is the right unit, positive means right, and 15 ÷ 5 gives a sensible magnitude of 3. Massive W.",
      "Caught in 4K by the units: N measures force, not acceleration. The negative sign is also sus because the resultant force points right.",
      "Units and direction passed the vibe check, but the magnitude did not. Acceleration is 15 ÷ 5 = 3 m/s²—not 15 m/s²."
    ],
    help: {
      words: "Look for one option with acceleration units, a rightward sign, and the value 3.",
      start: "Check in this order: m/s², positive/right, then 15 ÷ 5 = 3.",
      lost: "Your result was 3 m/s² to the right. Match its unit, direction and size."
    },
    ladder: [
      "Principle: a physics answer needs the right unit, direction/sign and sensible magnitude.",
      "Scaffold: scan each option three times—first for m/s², then right/positive, then the value from 15 ÷ 5.",
      "Parallel check: 8 N ÷ 4 kg gives 2 m/s² in the net-force direction. Use the same unit–sign–magnitude check here."
    ]
  }
];

let currentStep = Number(localStorage.getItem("focusPhysicsStep") || 0);
if (currentStep < 0 || currentStep >= steps.length) currentStep = 0;
let selected = null;
let passed = false;
let attemptCount = 0;
let hintLevel = 0;
let coachRequestId = 0;

const title = document.getElementById("missionTitle");
const context = document.getElementById("missionContext");
const area = document.getElementById("answerArea");
const feedback = document.getElementById("feedback");
const check = document.getElementById("checkButton");
const missionCommand = document.getElementById("missionCommand");
const stepEyebrow = document.getElementById("stepEyebrow");
const progressDots = document.getElementById("progressDots");
const reasoningTrail = document.getElementById("reasoningTrail");
const scratchpad = document.getElementById("scratchpad");
const savedState = document.getElementById("savedState");
const pauseDialog = document.getElementById("pauseDialog");
const topicGate = document.getElementById("topicGate");
const topicStatus = document.getElementById("topicStatus");
const lessonSurfaces = [
  document.querySelector(".site-header"),
  document.querySelector(".app-shell"),
  document.querySelector(".help-dock")
];

const trailItems = [
  { label: "Prediction", value: "acceleration → right" },
  { label: "Net force", value: "20 N − 5 N = 15 N right" },
  { label: "Principle", value: "Fnet = ma" },
  { label: "Acceleration", value: "15 N ÷ 5 kg = 3 m/s² right" },
  { label: "Check", value: "units ✓  sign ✓  magnitude ✓" }
];

function renderStep() {
  const step = steps[currentStep];
  selected = null;
  passed = false;
  attemptCount = 0;
  hintLevel = 0;
  coachRequestId += 1;
  title.textContent = step.title;
  context.textContent = step.context;
  missionCommand.textContent = `${step.command} · YOUR ONE MOVE`;
  stepEyebrow.textContent = `STEP ${currentStep + 1} OF ${steps.length}`;
  feedback.hidden = true;
  feedback.className = "feedback";
  check.disabled = true;
  document.querySelector(".help-launcher-copy small").textContent = "Tap for a hint";
  check.innerHTML = currentStep === steps.length - 1 ? "Check my reasoning <span aria-hidden=\"true\">→</span>" : "Check my thinking <span aria-hidden=\"true\">→</span>";
  area.innerHTML = "";

  if (step.type === "choice") {
    step.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.innerHTML = `<span class="option-key">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
      button.addEventListener("click", () => {
        selected = index;
        area.querySelectorAll(".option").forEach((item, i) => item.classList.toggle("selected", i === index));
        check.disabled = false;
        hideFeedback();
      });
      area.appendChild(button);
    });
  } else {
    const wrapper = document.createElement("div");
    wrapper.className = "number-input-wrap";

    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "text-answer";
    input.placeholder = step.placeholder;
    input.setAttribute("aria-label", `${step.placeholder} ${step.unit}`);
    input.addEventListener("input", () => {
      selected = input.value;
      check.disabled = input.value.trim() === "";
      hideFeedback();
    });
    const unit = document.createElement("span");
    unit.className = "unit-suffix";
    unit.textContent = step.unit;
    unit.setAttribute("aria-hidden", "true");

    wrapper.append(input, unit);
    area.appendChild(wrapper);
    setTimeout(() => input.focus(), 0);
  }

  updateProgress();
  updateReasoningTrail();
  localStorage.setItem("focusPhysicsStep", currentStep);
}

function updateProgress() {
  document.querySelectorAll(".step-row").forEach((row, index) => {
    row.classList.toggle("active", index === currentStep);
    row.classList.toggle("done", index < currentStep);
    const bubble = row.querySelector("span");
    bubble.textContent = index < currentStep ? "✓" : index + 1;
  });
  progressDots.innerHTML = "";
  progressDots.setAttribute("aria-label", `Step ${currentStep + 1} of ${steps.length}`);
  steps.forEach((_, index) => {
    const dot = document.createElement("span");
    if (index === currentStep) dot.classList.add("filled");
    progressDots.appendChild(dot);
  });
}

function updateReasoningTrail() {
  const completedCount = currentStep + (passed ? 1 : 0);
  reasoningTrail.innerHTML = "";

  if (completedCount === 0) {
    const empty = document.createElement("p");
    empty.className = "trail-empty";
    empty.textContent = "Your verified steps will stay here.";
    reasoningTrail.appendChild(empty);
    return;
  }

  trailItems.slice(0, completedCount).forEach(item => {
    const row = document.createElement("div");
    row.className = "trail-item";
    row.innerHTML = `<span aria-hidden="true">✓</span><div><strong>${item.label}</strong><small>${item.value}</small></div>`;
    reasoningTrail.appendChild(row);
  });
}

function hideFeedback() {
  coachRequestId += 1;
  feedback.hidden = true;
  feedback.className = "feedback";
  feedback.removeAttribute("aria-busy");
  passed = false;
  updateReasoningTrail();
  check.innerHTML = currentStep === steps.length - 1 ? "Check my reasoning <span aria-hidden=\"true\">→</span>" : "Check my thinking <span aria-hidden=\"true\">→</span>";
}

function showFeedback(message, kind) {
  feedback.textContent = message;
  feedback.className = `feedback ${kind}`;
  feedback.hidden = false;
}

function showCoachFeedback({ tag, title: coachTitle, body, nextAction, source }, kind) {
  const tagLine = document.createElement("span");
  tagLine.className = "coach-tag";
  tagLine.textContent = tag;

  const heading = document.createElement("strong");
  heading.className = "coach-title";
  heading.textContent = coachTitle;

  const explanation = document.createElement("span");
  explanation.className = "coach-body";
  explanation.textContent = body;

  const next = document.createElement("span");
  next.className = "coach-next";
  next.textContent = `Try now: ${nextAction}`;

  feedback.replaceChildren(tagLine, heading, explanation, next);
  if (source) {
    const sourceLabel = document.createElement("small");
    sourceLabel.className = "coach-source";
    sourceLabel.textContent = source;
    feedback.appendChild(sourceLabel);
  }
  feedback.className = `feedback ${kind} coach-feedback`;
  feedback.hidden = false;
}

function getCurrentAnswer(step) {
  if (step.type === "choice" && Number.isInteger(selected)) return step.options[selected];
  if (step.type === "input" && String(selected || "").trim()) return `${selected} ${step.unit}`;
  return "No answer selected yet";
}

function fallbackMistakeLabel(step) {
  if (currentStep === 0) return selected === 1 ? "Direction / sign" : "Resultant force";
  if (currentStep === 1) {
    const value = Number(selected);
    if (Math.abs(value + 15) < 0.001) return "Direction / sign";
    if (Math.abs(value - 25) < 0.001) return "Opposing forces";
    return "Calculation";
  }
  if (currentStep === 2) return "Equation choice";
  if (currentStep === 3) return Math.abs(Number(selected) - 75) < 0.001 ? "Rearranging" : "Calculation";
  if (currentStep === 4) return selected === 1 ? "Units / sign" : "Magnitude";
  return step.command.toLowerCase();
}

function coachPayload(step, task, extra = {}) {
  return {
    task,
    topic: "Forces in one dimension",
    problem: "A 5 kg crate has a 20 N force right and 5 N friction left. Find its acceleration. Right is positive.",
    step: currentStep + 1,
    command: step.command,
    question: step.title,
    currentAnswer: getCurrentAnswer(step),
    attempt: attemptCount,
    hintLevel,
    reasoningSoFar: trailItems.slice(0, currentStep).map(item => `${item.label}: ${item.value}`),
    ...extra
  };
}

async function diagnoseMistake(step, fallbackMessage) {
  const requestId = ++coachRequestId;
  const stepAtRequest = currentStep;
  feedback.classList.add("diagnosing");
  feedback.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/api/hint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(coachPayload(step, "detect"))
    });
    if (!response.ok) throw new Error("AI diagnosis unavailable");
    const data = await response.json();
    if (requestId !== coachRequestId || stepAtRequest !== currentStep) return;
    const body = [data.hint, data.why].filter(Boolean).join(" ");
    showCoachFeedback({
      tag: "MISTAKE DETECTIVE",
      title: `Likely snag: ${data.label || fallbackMistakeLabel(step)}`,
      body: body || fallbackMessage,
      nextAction: data.nextAction || step.help.start,
      source: "AI spotted the pattern in this attempt"
    }, "detective");
  } catch {
    if (requestId === coachRequestId && stepAtRequest === currentStep) {
      showCoachFeedback({
        tag: "MISTAKE DETECTIVE",
        title: `Likely snag: ${fallbackMistakeLabel(step)}`,
        body: fallbackMessage,
        nextAction: step.help.start,
        source: "Built-in backup diagnosis"
      }, "detective");
    }
  } finally {
    if (requestId === coachRequestId) feedback.removeAttribute("aria-busy");
  }
}

function setTopicGate(open) {
  document.body.classList.toggle("topic-gate-open", open);
  topicGate.setAttribute("aria-hidden", String(!open));
  lessonSurfaces.forEach(surface => {
    if (!surface) return;
    if (open) surface.setAttribute("inert", "");
    else surface.removeAttribute("inert");
  });

  if (open) topicGate.querySelector(".topic-ready").focus({ preventScroll: true });
}

function enterForcesLesson() {
  if (location.hash !== "#lesson") history.pushState({ view: "lesson" }, "", "#lesson");
  setTopicGate(false);
  document.querySelector(".workspace").scrollIntoView({ block: "start" });
}

document.querySelectorAll("[data-topic]").forEach(button => {
  button.addEventListener("click", () => {
    const topic = button.dataset.topic;
    if (topic === "forces") {
      enterForcesLesson();
      return;
    }

    const label = button.querySelector("strong").textContent;
    topicStatus.classList.remove("topic-status-bump");
    void topicStatus.offsetWidth;
    topicStatus.classList.add("topic-status-bump");
    topicStatus.innerHTML = `<span aria-hidden="true">○</span><p><strong>${label} is the next world.</strong> Today’s working demo is Forces; AI-generated topic paths are the next build.</p>`;
  });
});

document.getElementById("topicButton").addEventListener("click", () => {
  history.pushState({ view: "topics" }, "", location.pathname);
  setTopicGate(true);
});

document.querySelector(".site-header .brand").addEventListener("click", event => {
  event.preventDefault();
  history.pushState({ view: "topics" }, "", location.pathname);
  setTopicGate(true);
});

document.getElementById("resetButton").addEventListener("click", () => {
  currentStep = 0;
  localStorage.setItem("focusPhysicsStep", "0");
  setHelpOpen(false);
  renderStep();
  showFeedback("Fresh start: back to Step 1. Your scratchpad is still here.", "ai");
  document.getElementById("missionCard").scrollIntoView({ behavior: "smooth", block: "center" });
});

window.addEventListener("popstate", () => setTopicGate(location.hash !== "#lesson"));

check.addEventListener("click", () => {
  if (passed) {
    if (currentStep === steps.length - 1) {
      currentStep = 0;
      scratchpad.value = "";
      localStorage.removeItem("focusPhysicsNotes");
    } else {
      currentStep += 1;
    }
    renderStep();
    document.getElementById("missionCard").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const step = steps[currentStep];
  const isCorrect = step.type === "choice" ? selected === step.correct : step.correct(selected);
  if (isCorrect) {
    passed = true;
    updateReasoningTrail();
    const message = step.type === "choice" ? step.feedback[selected] : step.success;
    showFeedback(message, "success");
    check.innerHTML = currentStep === steps.length - 1 ? "Start a fresh run <span aria-hidden=\"true\">↻</span>" : "Next small step <span aria-hidden=\"true\">→</span>";
  } else {
    attemptCount += 1;
    const message = step.type === "choice" ? step.feedback[selected] : step.retry;
    showFeedback(message, "retry");
    void diagnoseMistake(step, message);
  }
});

document.querySelectorAll("[data-help]").forEach(button => {
  button.addEventListener("click", async () => {
    const step = steps[currentStep];
    hintLevel = Math.min(3, Math.max(hintLevel + 1, Math.min(3, attemptCount + 1)));
    const fallback = hintLevel === 1 ? step.help[button.dataset.help] : step.ladder[hintLevel - 1];
    const levelNames = ["Nudge", "Scaffold", "Worked example"];
    const levelName = levelNames[hintLevel - 1];
    const requestId = ++coachRequestId;
    const stepAtRequest = currentStep;
    setHelpOpen(false);
    showFeedback(`Building hint ${hintLevel} of 3: ${levelName}…`, "thinking");
    feedback.setAttribute("aria-busy", "true");
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
    document.querySelector(".help-launcher-copy small").textContent = hintLevel < 3 ? `Hint ${hintLevel} of 3 used` : "Full scaffold ready";

    try {
      const response = await fetch("/api/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(coachPayload(step, "hint", { helpType: button.dataset.help }))
      });
      if (!response.ok) throw new Error("AI hint unavailable");
      const data = await response.json();
      if (requestId !== coachRequestId || stepAtRequest !== currentStep) return;
      showCoachFeedback({
        tag: `HINT ${hintLevel} OF 3`,
        title: levelName,
        body: [data.hint, data.why].filter(Boolean).join(" "),
        nextAction: data.nextAction,
        source: "AI adapted this hint to your current attempt"
      }, "ai");
    } catch {
      if (requestId === coachRequestId && stepAtRequest === currentStep) {
        showCoachFeedback({
          tag: `HINT ${hintLevel} OF 3`,
          title: levelName,
          body: fallback,
          nextAction: hintLevel < 3 ? "Try this step, or ask again for more support." : "Copy the pattern using this problem’s values.",
          source: "Built-in backup hint"
        }, "ai");
      }
    } finally {
      if (requestId === coachRequestId) feedback.removeAttribute("aria-busy");
    }
  });
});

const helpDock = document.getElementById("helpDock");
const helpLauncher = document.getElementById("helpLauncher");
const helpPopover = document.getElementById("helpPopover");
const helpClose = document.getElementById("helpClose");

function setHelpOpen(open) {
  helpPopover.hidden = !open;
  helpLauncher.setAttribute("aria-expanded", String(open));
  if (open) helpPopover.querySelector("[data-help]").focus();
}

helpLauncher.addEventListener("click", () => {
  setHelpOpen(helpPopover.hidden);
});

helpClose.addEventListener("click", () => {
  setHelpOpen(false);
  helpLauncher.focus();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !helpPopover.hidden) {
    setHelpOpen(false);
    helpLauncher.focus();
  }
});

document.addEventListener("click", event => {
  if (!helpPopover.hidden && !helpDock.contains(event.target)) setHelpOpen(false);
});

scratchpad.value = localStorage.getItem("focusPhysicsNotes") || "";
let saveTimer;
scratchpad.addEventListener("input", () => {
  savedState.textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem("focusPhysicsNotes", scratchpad.value);
    savedState.textContent = "Saved locally";
  }, 350);
});

document.querySelectorAll("[data-formula]").forEach(button => {
  button.addEventListener("click", () => {
    const insert = button.dataset.formula;
    const start = scratchpad.selectionStart;
    scratchpad.value = scratchpad.value.slice(0, start) + insert + scratchpad.value.slice(scratchpad.selectionEnd);
    scratchpad.selectionStart = scratchpad.selectionEnd = start + insert.length;
    scratchpad.focus();
    scratchpad.dispatchEvent(new Event("input"));
  });
});

document.getElementById("pauseButton").addEventListener("click", () => {
  const summary = [
    "First predict the acceleration direction from the larger force.",
    "Your prediction was right. Now combine 20 N right and 5 N left.",
    "You found the net force. Next, connect it to acceleration.",
    "You have Fnet = 15 N and m = 5 kg. Solve for a.",
    "Your calculation is complete. Check its direction against the diagram."
  ];
  document.getElementById("resumeSummary").textContent = summary[currentStep];
  localStorage.setItem("focusPhysicsStep", currentStep);
  localStorage.setItem("focusPhysicsNotes", scratchpad.value);
  pauseDialog.showModal();
});

document.getElementById("closeDialog").addEventListener("click", () => pauseDialog.close());
document.getElementById("resumeButton").addEventListener("click", () => pauseDialog.close());

renderStep();
setTopicGate(location.hash !== "#lesson");
