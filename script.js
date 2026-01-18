// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.firebasestorage.app",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4",
  measurementId: "G-7LKHH1EHQW"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ----------------
const googleBtn = document.getElementById("googleBtn");
const facebookBtn = document.getElementById("facebookBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailInput = document.getElementById("emailInput");
const passInput = document.getElementById("passInput");
const loginDiv = document.getElementById("loginDiv");
const categoryDiv = document.getElementById("categoryDiv");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const timerContainer = document.getElementById("timer-container");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const quizTitle = document.getElementById("quiz-title");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

// Hint box
const hintBox = document.createElement("div");
hintBox.id = "hint-box";
quizDiv.parentNode.insertBefore(hintBox, quizDiv.nextSibling);

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, timer, timeLeft = 20;
let fiftyUsed = false, hintUsed = false, ladderLevel = 0;

// ---------------- FALLBACK QUESTIONS ----------------
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
  { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
  { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
];

// ---------------- LOGIN ----------------
googleBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(userLoggedIn)
    .catch(err => alert(err.message));
});

facebookBtn.addEventListener("click", () => {
  const provider = new firebase.auth.FacebookAuthProvider();
  auth.signInWithPopup(provider)
    .then(userLoggedIn)
    .catch(err => alert(err.message));
});

emailRegisterBtn.addEventListener("click", () => {
  auth.createUserWithEmailAndPassword(emailInput.value, passInput.value)
    .then(userLoggedIn)
    .catch(err => alert(err.message));
});

emailLoginBtn.addEventListener("click", () => {
  auth.signInWithEmailAndPassword(emailInput.value, passInput.value)
    .then(userLoggedIn)
    .catch(err => alert(err.message));
});

function userLoggedIn(result) {
  loginDiv.style.display = "none";
  categoryDiv.style.display = "block";
  quizTitle.textContent = `🎯 Welcome ${result.user.displayName || result.user.email}`;
  updateLeaderboard();
}

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz() {
  startBtn.disabled = true;
  quizDiv.style.display = "flex";
  lifelines.style.display = "flex";
  progressContainer.style.display = "block";
  timerContainer.style.display = "block";
  moneyList.style.display = "flex";
  hintBox.style.display = "none";
  quizDiv.innerHTML = "Loading...";

  ladderLevel = 0;
  current = 0;
  score = 0;
  fiftyUsed = false;
  hintUsed = false;
  fiftyBtn.disabled = false;
  hintBtn.disabled = false;
  progressBar.style.width = "0%";

  buildMoneyLadder();

  quizTitle.textContent = `🎯 ${categorySelect.value.replace(/_/g," ").toUpperCase()} — ${questionCount.value} Questions`;

  try {
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if (!res.ok) throw "API error";
    let data = await res.json();
    if (!data.length) throw "Empty API";

    questions = data.map(q => ({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers,
      hint: q.hint || "Think carefully."
    }));
  } catch {
    questions = fallbackQuestions;
  }

  showQuestion();
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  const levelsToUse = Array.from({length: parseInt(questionCount.value)}, (_, i) => `$${(i+1)*100}`);
  levelsToUse.reverse().forEach(amount => {
    const li = document.createElement("li");
    li.textContent = amount;
    moneyList.appendChild(li);
  });
}

// ---------------- rest of quiz functions (showQuestion, checkAnswer, nextQuestion, lifelines, leaderboard etc.) ----------------
// Copy the previous showQuestion, checkAnswer, nextQuestion, useFifty, useHint, updateMoneyLadder, saveScore, updateLeaderboard from the last working script

