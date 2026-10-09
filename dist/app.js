const steps = [
  {
    title: "Before calculating, what should you do first?",
    context: "Choose one. You can change your mind.",
    principle: {
      title: "Free-body thinking",
      text: "Identify every force and choose a positive direction before using an equation.",
      phase: 0
    },
    type: "choice",
    options: ["List the horizontal forces", "Divide 20 N by 5 kg", "Guess the acceleration direction"],
    correct: 0,
    feedback: [
      "Exactly. Listing 20 N right and 5 N left makes the opposing directions explicit before any arithmetic.",
      "Dividing 20 N by 5 kg treats the push as the net force. Friction removes 5 N first, so identify and combine the forces before using F = ma.",
      "Predicting the direction is a useful final sense-check, but it does not yet give the force magnitude. First list both horizontal forces so the direction follows from evidence, not a guess."
    ],
    help: {
      words: "Two forces act in opposite directions. Before calculating, name them both.",
      start: "Write: push = 20 N right; friction = 5 N left.",
      lost: "We know the mass and two opposite forces. Your current job is only to identify those forces."
    }
  },
  {
    title: "What is the net horizontal force?",
    context: "Enter a number in newtons. Right is positive.",
    principle: {
      title: "Resultant force",
      text: "Forces are vectors. Set right as positive, then combine forces using their directions—not just their sizes.",
      phase: 1
    },
    type: "input",
    placeholder: "Fnet = … N",
    correct: value => Math.abs(Number(value) - 15) < 0.001,
    success: "Yes — 20 N − 5 N = 15 N to the right.",
    retry: "Check the directions. Friction opposes the push, so subtract rather than add.",
    help: {
      words: "Net force means what remains after opposite forces cancel.",
      start: "Start with Fnet = 20 N − 5 N.",
      lost: "You identified a 20 N force right and a 5 N force left. Combine only those two."
    }
  },
  {
    title: "Which model connects net force and acceleration?",
    context: "Pick the relationship that uses the crate’s mass.",
    principle: {
      title: "Newton’s second law",
      text: "Acceleration depends on the resultant force and the object’s mass. Choose the model that connects all three.",
      phase: 2
    },
    type: "choice",
    options: ["Fnet = ma", "E = mc²", "p = mv"],
    correct: 0,
    feedback: [
      "Right. Newton’s second law directly connects the known net force and mass to the unknown acceleration.",
      "E = mc² connects mass and rest energy. It contains no force or acceleration, so it cannot model this crate’s change in motion.",
      "p = mv defines momentum. Momentum could be useful if time or impulse were given, but here Fnet = ma connects the available quantities directly."
    ],
    help: {
      words: "You need an equation connecting force, mass, and acceleration.",
      start: "Newton’s second law is the useful model here.",
      lost: "You found Fnet = 15 N. Now choose the equation that also contains the known mass, 5 kg."
    }
  },
  {
    title: "Now find the acceleration.",
    context: "Enter a number in m/s². Your setup: 15 N = (5 kg)a.",
    principle: {
      title: "Rearrange before substituting",
      text: "Isolate the unknown symbol first. Only then substitute values, keeping the units attached.",
      phase: 3
    },
    type: "input",
    placeholder: "a = … m/s²",
    correct: value => Math.abs(Number(value) - 3) < 0.001,
    success: "Correct. a = 15 ÷ 5 = 3 m/s² to the right.",
    retry: "You have force and mass. Rearrange F = ma to a = F ÷ m.",
    help: {
      words: "Acceleration equals net force divided by mass.",
      start: "Calculate 15 ÷ 5.",
      lost: "Your verified pieces are Fnet = 15 N and m = 5 kg. Use a = Fnet / m."
    }
  },
  {
    title: "Does 3 m/s² to the right make physical sense?",
    context: "Use the force diagram, not just the arithmetic.",
    principle: {
      title: "Check with physics",
      text: "The acceleration direction must match the resultant force, and the units should reduce to m/s².",
      phase: 4
    },
    type: "choice",
    options: ["Yes — the larger force points right", "No — friction always stops motion", "No — acceleration must equal 20"],
    correct: 0,
    feedback: [
      "Yes. The 20 N push is larger than the 5 N friction, so the 15 N net force—and the acceleration—must point right. Reasoning chain complete.",
      "Friction opposes motion, but it does not automatically stop it. Here friction is only 5 N while the push is 20 N, leaving a net force to the right.",
      "20 is a force measured in newtons, not an acceleration. Dividing the 15 N net force by 5 kg gives 3 m/s², with the units providing a useful error check."
    ],
    help: {
      words: "Ask which direction the larger force points.",
      start: "Compare 20 N right with 5 N left.",
      lost: "Your calculation gave 3 m/s² right. The final check is whether that direction matches the 15 N net force."
    }
  }
];

let currentStep = Number(localStorage.getItem("focusPhysicsStep") || 0);
if (currentStep < 0 || currentStep >= steps.length) currentStep = 0;
let selected = null;
let passed = false;

const title = document.getElementById("missionTitle");
const context = document.getElementById("missionContext");
const area = document.getElementById("answerArea");
const feedback = document.getElementById("feedback");
const check = document.getElementById("checkButton");
const stepEyebrow = document.getElementById("stepEyebrow");
const progressDots = document.getElementById("progressDots");
const principleTitle = document.getElementById("principleTitle");
const principleText = document.getElementById("principleText");
const thinkingPhases = [...document.querySelectorAll("#thinkingSequence span")];
const scratchpad = document.getElementById("scratchpad");
const savedState = document.getElementById("savedState");
const pauseDialog = document.getElementById("pauseDialog");

function renderStep() {
  const step = steps[currentStep];
  selected = null;
  passed = false;
  title.textContent = step.title;
  context.textContent = step.context;
  principleTitle.textContent = step.principle.title;
  principleText.textContent = step.principle.text;
  thinkingPhases.forEach((phase, index) => phase.classList.toggle("active", index === step.principle.phase));
  stepEyebrow.textContent = `STEP ${currentStep + 1} OF ${steps.length}`;
  feedback.hidden = true;
  feedback.className = "feedback";
  check.disabled = true;
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
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "text-answer";
    input.placeholder = step.placeholder;
    input.setAttribute("aria-label", step.placeholder);
    input.addEventListener("input", () => {
      selected = input.value;
      check.disabled = input.value.trim() === "";
      hideFeedback();
    });
    area.appendChild(input);
    setTimeout(() => input.focus(), 0);
  }

  updateProgress();
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

function hideFeedback() {
  feedback.hidden = true;
  feedback.className = "feedback";
  passed = false;
  check.innerHTML = currentStep === steps.length - 1 ? "Check my reasoning <span aria-hidden=\"true\">→</span>" : "Check my thinking <span aria-hidden=\"true\">→</span>";
}

function showFeedback(message, kind) {
  feedback.textContent = message;
  feedback.className = `feedback ${kind}`;
  feedback.hidden = false;
}

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
    const message = step.type === "choice" ? step.feedback[selected] : step.success;
    showFeedback(message, "success");
    check.innerHTML = currentStep === steps.length - 1 ? "Start a fresh run <span aria-hidden=\"true\">↻</span>" : "Next small step <span aria-hidden=\"true\">→</span>";
  } else {
    const message = step.type === "choice" ? step.feedback[selected] : step.retry;
    showFeedback(message, "retry");
  }
});

document.querySelectorAll("[data-help]").forEach(button => {
  button.addEventListener("click", () => {
    const message = steps[currentStep].help[button.dataset.help];
    showFeedback(message, "retry");
    setHelpOpen(false);
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    "Start by naming the two horizontal forces.",
    "You are combining the 20 N push and 5 N friction.",
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
