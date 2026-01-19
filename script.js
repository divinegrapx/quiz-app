// FIREBASE
const auth = firebase.auth();

// UI
const authDiv = document.getElementById("authDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizDiv = document.getElementById("quiz");
const ladderDiv = document.getElementById("ladder");
const lifelines = document.getElementById("lifelines");
const timerContainer = document.getElementById("timer-container");
const timeBar = document.getElementById("time-bar");
const hintBox = document.getElementById("hint-box");

const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");

// STATE
let questions = [];
let current = 0;
let timer;
let timeLeft = 30;
let fiftyUsed = false;
let hintUsed = false;

// LOGIN
document.getElementById("loginBtn").onclick = () => {
  const email = emailInput.value;
  const pass = passwordInput.value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      authDiv.style.display = "none";
      categoryDiv.style.display = "block";
    })
    .catch(err => alert(err.message));
};

// START QUIZ
function startQuiz() {
  categoryDiv.style.display = "none";
  document.getElementById("quiz-and-ladder").style.display = "flex";
  lifelines.style.display = "flex";
  timerContainer.style.display = "block";

  current = 0;
  fiftyUsed = false;
  hintUsed = false;

  fiftyBtn.disabled = false;
  hintBtn.disabled = false;

  buildMoneyLadder();
  loadQuestions();
}

// QUESTIONS
function loadQuestions() {
  questions = [
    {
      q: "What is the capital of France?",
      a: ["Paris", "Rome", "Berlin", "Madrid"],
      c: 0,
      hint: "City of love 🗼"
    },
    {
      q: "2 + 2 = ?",
      a: ["3", "4", "5", "6"],
      c: 1,
      hint: "Basic math"
    }
  ];

  showQuestion();
}

function showQuestion() {
  resetTimer();
  const q = questions[current];

  quizDiv.innerHTML = `
    <h2>${q.q}</h2>
    ${q.a.map((x, i) =>
      `<button onclick="answer(${i})">${x}</button><br>`
    ).join("")}
  `;

  hintBox.style.display = "none";
}

// ANSWER
function answer(i) {
  clearInterval(timer);
  if (i === questions[current].c) {
    current++;
    if (current >= questions.length) finishQuiz();
    else showQuestion();
  } else {
    finishQuiz();
  }
}

// TIMER
function resetTimer() {
  clearInterval(timer);
  timeLeft = 30;
  timeBar.style.width = "100%";

  timer = setInterval(() => {
    timeLeft--;
    timeBar.style.width = (timeLeft / 30) * 100 + "%";

    if (timeLeft <= 5) playTick();

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishQuiz();
    }
  }, 1000);
}

function playTick() {
  new Audio("tick.mp3").play();
}

// LIFELINES
function useFifty() {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  const q = questions[current];
  let removed = 0;

  document.querySelectorAll("#quiz button").forEach((b, i) => {
    if (i !== q.c && removed < 2) {
      b.style.display = "none";
      removed++;
    }
  });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;

  hintBox.textContent = "💡 " + questions[current].hint;
  hintBox.style.display = "block";
}

// MONEY LADDER
function buildMoneyLadder() {
  ladderDiv.innerHTML = "";
  for (let i = 1; i <= questions.length; i++) {
    ladderDiv.innerHTML += `<div>$${i * 100}</div>`;
  }
}

// FINISH + LOGOUT
function finishQuiz() {
  clearInterval(timer);
  quizDiv.innerHTML = `
    <h2>Quiz Finished</h2>
    <button onclick="logout()">Logout</button>
  `;
}

function logout() {
  auth.signOut().then(() => {
    authDiv.style.display = "block";
    categoryDiv.style.display = "none";
    document.getElementById("quiz-and-ladder").style.display = "none";
    lifelines.style.display = "none";
    timerContainer.style.display = "none";
    hintBox.style.display = "none";
  });
}
