const quizDiv = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");
const lifelines = document.getElementById("lifelines");
const progressBar = document.getElementById("progress-bar");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 25;
let fiftyUsed = false;
let hintUsed = false;

startBtn.onclick = startQuiz;

async function startQuiz() {
  startBtn.disabled = true;
  lifelines.style.display = "flex";

  const category = categorySelect.value;
  const limit = questionCount.value;

  const res = await fetch(`https://the-trivia-api.com/api/questions?categories=${category}&limit=${limit}`);
  questions = await res.json();

  current = score = 0;
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  timeLeft = 25;
  updateTimer();

  const q = questions[current];
  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  quizDiv.innerHTML = `
    <h2>${q.question}</h2>
    ${answers.map(a => `<div class="answer"><button onclick="checkAnswer('${a.replace(/'/g,"\\'")}')">${a}</button></div>`).join("")}
  `;

  progressBar.style.width = `${(current / questions.length) * 100}%`;
  startTimer();
}

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

function checkAnswer(answer) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".answer button").forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === answer && answer !== correct) btn.classList.add("wrong");
  });

  if (answer === correct) {
    score++;
    correctSound.play();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1200);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>🎉 Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
    lifelines.style.display = "none";
    startBtn.disabled = false;
    progressBar.style.width = "100%";
    return;
  }
  showQuestion();
}

function useFifty() {
  if (fiftyUsed) return;
  fiftyUsed = true;

  const wrongs = [...document.querySelectorAll(".answer button")]
    .filter(b => b.textContent !== questions[current].correctAnswer)
    .slice(0, 2);

  wrongs.forEach(b => b.style.visibility = "hidden");
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  alert("💡 Hint: The correct answer stands out the most 😉");
}
