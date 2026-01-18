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

startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

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
    
    // Add generic hint if missing
    questions = questions.map(q => ({
      ...q,
      hint: "Think carefully about the answer."
    }));
    
  } catch {
    questions = fallbackQuestions;
  }

  showQuestion();
}

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

function startTimer() {
  timerText.style.display = "block";
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
  timerBar.style.width = `${(timeLeft / 20) * 100}%`;
}

function checkAnswer(answer) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  const feedbackDiv = document.getElementById("feedback");

  document.querySelectorAll(".answer-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === answer && answer !== correct) b.classList.add("wrong");
  });

  if (answer === correct) {
    score++;
    feedbackDiv.textContent = "✅ Correct!";
    feedbackDiv.style.color = "lime";
  } else {
    feedbackDiv.textContent = "❌ Wrong!";
    feedbackDiv.style.color = "red";
  }

  // Show the feedback for 1 second before moving to next question
  setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished</h2><p>Score: ${score}/${questions.length}</p>
      <button onclick="location.reload()">Restart</button>`;
    startBtn.disabled = false;
    lifelines.style.display = "none";
    progressBar.style.width = "100%";
    return;
  }
  showQuestion();
}

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

  const q = questions[current];
  alert("💡 Hint: " + (q.hint || "Think carefully about the answer."));
}

});
