const VALID_SAMPLE = `let total = 0;
for (let i = 1; i <= 5; i++) {
  total = total + i * 2;
}
print(total);`;

const ERROR_SAMPLE = `let total = 0;
for (let i = 1; i <= 5; i++ {
  total = total + i * 2;
}
print(total);`;

const PIPELINES = {
  compiler: [
    "1. Lexical Analysis (Tokens)",
    "2. Syntax & Semantic Analysis (AST + Type Check)",
    "3. IR Optimization (Loop Unrolling / Constant Folding)",
    "4. Native Machine Code Generation & Linking",
    "5. Execute Standalone Binary"
  ],
  interpreter: [
    "1. Read Source Line-by-Line",
    "2. Tokenize & Parse Current Statement",
    "3. Evaluate Immediately in Runtime Environment",
    "4. Advance to Next Statement / Loop Iteration"
  ],
  jit: [
    "1. Lex & Parse Source into AST",
    "2. Emit Portable Bytecode",
    "3. Execute Bytecode & Collect Hot-Path Profiles",
    "4. JIT Compile Hot Loop to Native Code & Run"
  ]
};

const modeSelect = document.getElementById("mode-select");
const codeInput = document.getElementById("code-input");
const stageList = document.getElementById("stage-list");
const simOutput = document.getElementById("sim-output");

let currentStep = -1;

function hasSyntaxError(src) {
  const openParens = (src.match(/\(/g) || []).length;
  const closeParens = (src.match(/\)/g) || []).length;
  const openBraces = (src.match(/\{/g) || []).length;
  const closeBraces = (src.match(/\}/g) || []).length;
  return openParens !== closeParens || openBraces !== closeBraces || src.includes(";;");
}

function evaluateSample(src) {
  // Computes 2*(1+2+3+4+5) = 30 for the default loop pattern
  const match = src.match(/i\s*<=\s*(\d+)/);
  const n = match ? parseInt(match[1], 10) : 5;
  const sum = (n * (n + 1)) / 2;
  return sum * 2;
}

function renderStages(errorAtStep = -1) {
  const stages = PIPELINES[modeSelect.value];
  stageList.innerHTML = stages
    .map((label, idx) => {
      let cls = "stage-item";
      if (errorAtStep === idx) cls += " error";
      else if (idx < currentStep) cls += " done";
      else if (idx === currentStep) cls += " active";
      return `<li class="${cls}">${label}</li>`;
    })
    .join("");
}

function updateOutputForStep() {
  const mode = modeSelect.value;
  const stages = PIPELINES[mode];
  const src = codeInput.value;
  const broken = hasSyntaxError(src);

  if (currentStep < 0) {
    renderStages(-1);
    simOutput.textContent = 'Click "Run Pipeline" or "Step Forward" to inspect execution.';
    return;
  }

  if (broken && currentStep >= 1) {
    const errIdx = Math.min(currentStep, 1);
    renderStages(errIdx);
    simOutput.textContent =
      mode === "compiler"
        ? "Compile Error: Unbalanced parentheses/braces detected before binary generation. No executable produced."
        : "Runtime/Parse Error: Encountered unbalanced syntax while processing statement.";
    return;
  }

  renderStages(-1);
  const result = evaluateSample(src);

  if (currentStep < stages.length - 1) {
    simOutput.textContent = `[${mode.toUpperCase()}] Stage ${currentStep + 1}/${stages.length}: ${stages[currentStep]}...`;
  } else {
    simOutput.textContent = `[${mode.toUpperCase()}] Execution finished successfully.\nProgram stdout: ${result}`;
  }
}

function resetSim() {
  currentStep = -1;
  updateOutputForStep();
}

document.getElementById("step-btn").addEventListener("click", () => {
  const maxIdx = PIPELINES[modeSelect.value].length - 1;
  if (currentStep < maxIdx) currentStep++;
  updateOutputForStep();
});

document.getElementById("run-sim-btn").addEventListener("click", () => {
  currentStep = PIPELINES[modeSelect.value].length - 1;
  updateOutputForStep();
});

document.getElementById("reset-sim-btn").addEventListener("click", resetSim);
modeSelect.addEventListener("change", resetSim);

document.getElementById("preset-valid").addEventListener("click", () => {
  codeInput.value = VALID_SAMPLE;
  resetSim();
});

document.getElementById("preset-error").addEventListener("click", () => {
  codeInput.value = ERROR_SAMPLE;
  resetSim();
});

// Quiz
const QUIZ = [
  {
    q: "Which approach translates the entire source program into native machine code before running it?",
    options: ["Ahead-of-Time (AOT) Compiler", "Line-by-Line Interpreter", "HTML Parser"],
    answer: 0,
    why: "An AOT compiler analyzes and translates the full program into machine code ahead of execution."
  },
  {
    q: "Why do JIT runtimes (like V8 or JVM) profile code while it runs?",
    options: [
      "To delete unused source files from disk",
      "To identify frequently executed ('hot') paths and compile them into optimized native code",
      "To convert code into plain English comments"
    ],
    answer: 1,
    why: "JIT compilers spend optimization effort on hot functions and loops where runtime speedups matter most."
  },
  {
    q: "What is a common trade-off of strict Ahead-of-Time compilation?",
    options: [
      "No syntax checking before running",
      "Binaries are typically built per target OS and CPU architecture",
      "Cannot optimize loops or memory layout"
    ],
    answer: 1,
    why: "Native machine code depends on instruction set architecture (e.g., x86_64 vs. ARM64) and OS ABI."
  },
  {
    q: "If a syntax error sits on line 50 of a script, what happens in a pure line-by-line interpreter?",
    options: [
      "Lines 1–49 can execute before execution halts at line 50",
      "The CPU repairs line 50 automatically",
      "It refuses to open the file"
    ],
    answer: 0,
    why: "Pure interpreters process and execute statements sequentially as they are reached."
  }
];

let qIdx = 0;
let score = 0;
let answered = false;

const qCounter = document.getElementById("q-counter");
const qScore = document.getElementById("q-score");
const qText = document.getElementById("q-text");
const qOptions = document.getElementById("q-options");
const qFeedback = document.getElementById("q-feedback");
const qNext = document.getElementById("q-next");

function renderQuestion() {
  answered = false;
  const item = QUIZ[qIdx];
  qCounter.textContent = `Question ${qIdx + 1} of ${QUIZ.length}`;
  qScore.textContent = `Score: ${score}`;
  qText.textContent = item.q;
  qFeedback.classList.add("hidden");
  qNext.classList.add("hidden");

  qOptions.innerHTML = "";
  item.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "q-opt";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(btn, idx));
    qOptions.appendChild(btn);
  });
}

function handleAnswer(btn, idx) {
  if (answered) return;
  answered = true;
  const item = QUIZ[qIdx];
  const allBtns = qOptions.querySelectorAll(".q-opt");
  allBtns.forEach((b, i) => {
    b.disabled = true;
    if (i === item.answer) b.classList.add("correct");
  });

  if (idx === item.answer) {
    score++;
    qScore.textContent = `Score: ${score}`;
    qFeedback.innerHTML = `<strong>Correct:</strong> ${item.why}`;
  } else {
    btn.classList.add("wrong");
    qFeedback.innerHTML = `<strong>Not quite:</strong> ${item.why}`;
  }

  qFeedback.classList.remove("hidden");
  qNext.textContent = qIdx < QUIZ.length - 1 ? "Next Question" : "Restart Quiz";
  qNext.classList.remove("hidden");
}

qNext.addEventListener("click", () => {
  if (qIdx < QUIZ.length - 1) {
    qIdx++;
  } else {
    qIdx = 0;
    score = 0;
  }
  renderQuestion();
});

renderStages(-1);
renderQuestion();