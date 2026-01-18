document.addEventListener("DOMContentLoaded", () => {

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

let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 20;
let fiftyUsed = false;
let hintUsed = false;

// Fallback questions
const fallbackQuestions = [
  {
    question: "What color is the sky?",
    correctAnswer: "Blue",
    incorrectAnswers: ["Red","Green","Yellow"],
    hint: "It's the same color as the ocean on a clear day."
  },
  {
    question: "How many days are in a week?",
    correctAnswer: "7",
    incorrectAnswers: ["5","6","8"],
    hint: "Think about Monday to Sunday."
  }
];

// Event listeners
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

// Start quiz
async function startQuiz() {
  startBtn.disabled = true;
  lifelines.style.display = "flex";
  quizDiv.innerHTML = "Loading...";

  current = 0;
  score = 0;
  fiftyUsed = false;
  hintUsed = false;
  fiftyBtn.disabled = false;
  hintBtn.disabled = false;

  try {
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}`);
    if (!res.ok) throw "API error";
    questions = await res.json();
    if (!questions.length) throw "Empty";

    questions = questions.map(q => ({
      ...q,
      hint: "Think carefully about the answer."
    }));
  } catch {
    questions = fallbackQuestions;
  }

  showQuestion();
}

// Show question
function showQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  updateTimer();

  const q = questions[current];
  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  quizDiv.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;

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

// Timer
function startTimer() {
  timerText.st
