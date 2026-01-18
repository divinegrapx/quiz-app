/* ===============================
   DOM ELEMENTS (ALL DEFINED)
================================ */

const quizDiv = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");
const lifelines = document.getElementById("lifelines");
const progressBar = document.getElementById("progress-bar");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");

const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

/* ===============================
   STATE
================================ */

let questions = [];
let current = 0;
let score = 0;
let timer = null;
let timeLeft = 25;
let fiftyUsed = false;
let hintUsed = false;

/* ===============================
   EVENT LISTENERS
================================ */

startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

/* ===============================
   START QUIZ
================================ */

async function startQuiz() {
  startBtn.disabled = true;
  lifelines.style.display = "flex";
  quizDiv.innerHTML = "<p>Loading questions…</p>";

  fiftyUsed = false;
  hintUsed = false;
  fiftyBtn.disabled = false;
  hintBtn.disabled = false;

  current = 0;
  score = 0;
  progressBar.style.width = "0%";

  const category = categorySelect.value;
  const limit = questionCount.value;

  try {
    const response = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${category}&limit=${limit}`
    );

    if (!response.ok) throw new Error("API error");

    questions = await response.json();

    if (!questions.length) throw new Error("No questions");

    showQuestion();
  } catch (err) {
    quizDiv.innerHTML =
      "<p>⚠️ Failed to load questions. Check your internet connection.</p>";
    startBtn.disabled = false;
  }
}

/* ===============================
   SHOW QUESTION
================================ */

function showQuestion() {
  clearInterval(timer);
  timeLeft = 25;
  updateTimer();

  const q = questions[current];

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(
    () => Math.random() - 0.5
  );

  quizDiv.innerHTML = `
    <h2>${q.question}</h2>
    ${answers
      .map(
        (a) => `
      <div class="answer">
        <button data-answer="${a}">${a}</button>
      </div>
    `
      )
      .join("")}
  `;

  document.querySelectorAll(".answer button").forEach((btn) => {
    btn.addEventListener("click", () => checkAnswer(btn.dataset.answer));
  });

  progressBar.style.width = `${(current / questions.length) * 100}%`;

  startTimer();
}

/* ===============================
   TIMER
================================ */

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

function updateTimer() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = `${(timeLeft / 25) * 100}%`;
}

/* ===============================
   ANSWER CHECK
================================ */

function checkAnswer(answer) {
  clearInterval(timer);

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".answer button").forEach((btn) => {
    btn.disabled = true;

    if (btn.dataset.answer === correct) {
      btn.classList.add("correct");
    } else if (btn.dataset.answer === answer) {
      btn.classList.add("wrong");
    }
  });

  if (answer === correct) {
    score++;
    correctSound.play();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1200);
}

/* ===============================
   NEXT QUESTION / END
================================ */

function nextQuestion() {
  current++;

  if (current >= questions.length) {
    clearInterval(timer);
    quizDiv.innerHTML = `
      <h2>🎉 Quiz Finished!</h2>
      <p>Your Score: <strong>${score}/${questions.length}</strong></p>
      <button onclick="location.reload()">Restart Quiz</button>
    `;
    lifelines.style.display = "none";
    progressBar.style.width = "100%";
    startBtn.disabled = false;
    return;
  }

  showQuestion();
}

/* ===============================
   LIFELINES
================================ */

function useFifty() {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  const wrongButtons = Array.from(
    document.querySelectorAll(".answer button")
  ).filter((btn) => btn.dataset.answer !== questions[current].correctAnswer);

  wrongButtons.slice(0, 2).forEach((btn) => {
    btn.style.visibility = "hidden";
  });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;

  alert("💡 Hint: Trust your first instinct!");
}
