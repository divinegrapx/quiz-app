/* ================= GAME DATA ================= */

const MONEY = [
  0,100,200,300,500,
  1000,2000,4000,8000,16000,
  32000,64000,125000,250000,500000,
  1000000,2000000,4000000,8000000,16000000
];

const CHECKPOINTS = [5, 10, 15, 20];

const QUESTIONS = Array.from({ length: 20 }, (_, i) => ({
  q: `Sample Question ${i + 1}?`,
  answers: [
    "Correct Answer",
    "Wrong Answer",
    "Wrong Answer",
    "Wrong Answer"
  ],
  correct: 0
}));

/* ================= GAME STATE ================= */

let state = {
  index: 0,
  locked: false,
  timer: 30,
  interval: null,
  guaranteed: 0,
  currentMoney: 0
};

/* ================= DOM ================= */

const qText = document.getElementById("question-text");
const buttons = document.querySelectorAll(".option-btn");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const counter = document.getElementById("question-counter");
const ladder = document.getElementById("money-list");
const walkAwayBtn = document.getElementById("walk-away-btn");

/* ================= SOUND SYSTEM ================= */

const sounds = {
  tick: new Audio(""),
  correct: new Audio(""),
  wrong: new Audio("")
};

function stopAllSounds() {
  Object.values(sounds).forEach(s => {
    s.pause();
    s.currentTime = 0;
  });
}

/* ================= INIT ================= */

function initLadder() {
  ladder.innerHTML = "";
  MONEY.forEach((m, i) => {
    const li = document.createElement("li");
    li.textContent = "$" + m.toLocaleString();
    if (CHECKPOINTS.includes(i)) li.classList.add("checkpoint");
    ladder.appendChild(li);
  });
}

function loadQuestion() {
  state.locked = false;
  const q = QUESTIONS[state.index];

  counter.textContent = `Question ${state.index + 1} / 20`;
  qText.textContent = q.q;

  buttons.forEach((btn, i) => {
    btn.textContent = q.answers[i];
    btn.className = "option-btn";
  });

  updateLadder();
  startTimer();
}

/* ================= TIMER ================= */

function startTimer() {
  clearInterval(state.interval);
  state.timer = 30;
  timerBar.style.width = "100%";
  timerBar.style.background = "#00ff00";

  state.interval = setInterval(() => {
    state.timer--;
    timerText.textContent = state.timer;

    const percent = (state.timer / 30) * 100;
    timerBar.style.width = percent + "%";

    if (percent < 30) timerBar.style.background = "orange";
    if (percent < 15) timerBar.style.background = "red";

    if (state.timer <= 0) {
      clearInterval(state.interval);
      handleWrong();
    }
  }, 1000);
}

/* ================= ANSWERS ================= */

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (state.locked) return;
    state.locked = true;

    stopAllSounds();
    clearInterval(state.interval);

    const idx = Number(btn.dataset.index);
    const correct = QUESTIONS[state.index].correct;

    buttons.forEach(b => b.classList.add("locked"));

    if (idx === correct) {
      btn.classList.add("correct");
      handleCorrect();
    } else {
      btn.classList.add("wrong");
      buttons[correct].classList.add("correct");
      handleWrong();
    }
  });
});

/* ================= GAME FLOW ================= */

function handleCorrect() {
  state.currentMoney = MONEY[state.index + 1];

  if (CHECKPOINTS.includes(state.index + 1)) {
    state.guaranteed = state.currentMoney;
  }

  setTimeout(() => {
    state.index++;
    if (state.index === 20) endGame(true);
    else loadQuestion();
  }, 1200);
}

function handleWrong() {
  endGame(false);
}

function walkAway() {
  endGame(true, true);
}

walkAwayBtn.onclick = walkAway;

/* ================= END ================= */

function endGame(won, walked = false) {
  clearInterval(state.interval);

  document.getElementById("quiz-and-ladder").style.display = "none";
  document.getElementById("final-screen").classList.remove("hidden");

  let money = walked ? state.currentMoney : state.guaranteed;

  document.getElementById("final-title").textContent =
    won ? "🎉 Congratulations!" : "❌ Game Over";

  document.getElementById("final-money").textContent =
    "You won $" + money.toLocaleString();
}

/* ================= LADDER ================= */

function updateLadder() {
  [...ladder.children].forEach((li, i) => {
    li.classList.toggle("current", i === state.index);
  });
}

/* ================= START ================= */

initLadder();
loadQuestion();
