console.log("script.js loaded ✅");

/* ===============================
   DOM ELEMENTS
================================ */

const quizDiv = document.getElementById("quiz");
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
   FALLBACK QUESTIONS
================================ */

const fallbackQuestions = [
  {
    question: "What color is the sky?",
    correctAnswer: "Blue",
    incorrectAnswers: ["Red", "Green", "Yellow"]
  },
  {
    question: "How many days are in a week?",
    correctAnswer: "7",
    incorrectAnswers: ["5", "6", "8"]
  }
];

/* ===============================
   REQUIRED GLOBAL FUNCTIONS
   (because HTML uses onclick)
================================ */

function startQuiz() {
  console.log("Start Quiz clicked ✅");

  document.getElementById("categoryDiv").style.display = "none";
  lifelines.style.display = "flex";

  fiftyUsed = false;
  hintUsed = false;
  fiftyBtn.disabled = false;
  hintBtn.disabled = false;

  current = 0;
  score = 0;
  progressBar.style.width = "0%";

  loadQuestions();
}

async function loadQuestions() {
  quizDiv.innerHTML = "<p>Loading questions…</p>";

  try {
    const res = await fetch(
      `https://the-trivia-api.com/api/questions?categories=${categorySelect.value}&limit=${questionCount.value}`
    );

    if (!res.ok) throw new Error("API error");

    questions = await res.json();
    if (!questions.length) throw new Error("Empty");

  } catch (e) {
    console.warn("Using fallback questions");
    questions = fallbackQuestions;
  }

  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  timeLeft = 25;
  updateTimer();

  const q = questions[current];
  const answers = [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random() - 0.5);

  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.className = "answer-btn";
    btn.onclick = () => checkAnswer(answer);
    quizDiv.appendChild(btn);
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
   ANSWERS
================================ */

function checkAnswer(answer) {
  clearInterval(timer);

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === answer && answer !== correct) btn.classList.add("wrong");
  });

  answer === correct ? correctSound.play() : wrongSound.play();
  if (answer === correct) score++;

  setTimeout(nextQuestion, 1200);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `
      <h2>🎉 Finished!</h2>
      <p>Score: ${score}/${questions.length}</p>
      <button onclick="location.reload()">Restart</button>
    `;
    lifelines.style.display = "none";
    progressBar.style.width = "100%";
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

  const correct = questions[current].correctAnswer;
  const wrongs = [...document.querySelectorAll(".answer-btn")]
    .filter(b => b.textContent !== correct)
    .slice(0, 2);

  wrongs.forEach(b => b.style.visibility = "hidden");
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;
  alert("💡 Think carefully — the answer is simpler than it looks.");
}

/* ===============================
   EXPOSE TO GLOBAL (CRITICAL)
================================ */

window.startQuiz = startQuiz;
window.useFifty = useFifty;
window.useHint = useHint;
