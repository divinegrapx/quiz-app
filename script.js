document.addEventListener("DOMContentLoaded", () => {

/* ===============================
   DOM
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

/* ===============================
   STATE
================================ */
let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 20;
let fiftyUsed = false;
let hintUsed = false;

/* ===============================
   FALLBACK (ALWAYS WORKS)
================================ */
const fallbackQuestions = [
  {
    question: "What color is the sky?",
    correctAnswer: "Blue",
    incorrectAnswers: ["Red","Green","Yellow"]
  },
  {
    question: "How many days are in a week?",
    correctAnswer: "7",
    incorrectAnswers: ["5","6","8"]
  }
];

/* ===============================
   EVENTS
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
  quizDiv.textContent = "Loading...";

  current = 0;
  score = 0;
  fiftyUsed = false;
  hintUsed = false;
  fiftyBtn.disabled = false;
  hintBtn.disabled = false;

  try {
    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=${questionCount.value}`
    );
    if (!res.ok) throw "API error";
    questions = await res.json();
    if (!questions.length) throw "Empty";
  } catch {
    questions = fallbackQuestions;
  }

  showQuestion();
}

/* ===============================
   SHOW QUESTION
================================ */
function showQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  updateTimer(); // ✅ ensure numbers show immediately

  const q = questions[current];
  const answers = [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random() - 0.5);

  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "answer-btn";
    btn.onclick = () => checkAnswer(a);
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
  // ✅ Update the visible countdown number
  timerText.textContent = `${timeLeft}s`;

  // Update the progress bar
  timerBar.style.width = `${(timeLeft / 20) * 100}%`;
}

/* ===============================
   ANSWER
================================ */
function checkAnswer(answer) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".answer-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === answer && answer !== correct) b.classList.add("wrong");
  });

  if (answer === correct) score++;
  setTimeout(nextQuestion, 1200);
}

/* ===============================
   NEXT
================================ */
function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished</h2><p>${score}/${questions.length}</p>`;
    startBtn.disabled = false;
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
  document.querySelectorAll(".answer-btn")
    .forEach(b => {
      if (b.textContent !== correct && Math.random() > 0.5) {
        b.style.display = "none";
      }
    });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;
  alert("Think simple 🙂");
}

});
