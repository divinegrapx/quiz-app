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

// ---------------- DOM ELEMENTS ----------------
const authDiv = document.getElementById("authDiv");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginEmailBtn = document.getElementById("loginEmailBtn");
const registerBtn = document.getElementById("registerBtn");
const loginGoogleBtn = document.getElementById("loginGoogleBtn");
const loginFacebookBtn = document.getElementById("loginFacebookBtn");

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
const hintBox = document.getElementById("hint-box");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, timer, timeLeft = 20;
let fiftyUsed = false, hintUsed = false, ladderLevel = 0;

// ---------------- FALLBACK QUESTIONS ----------------
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
  { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
  { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
];

// ---------------- AUTH ----------------
loginEmailBtn.addEventListener("click", () => {
  auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
    .then(user => afterLogin(user.user))
    .catch(err => alert("Login failed: " + err.message));
});

registerBtn.addEventListener("click", () => {
  auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
    .then(user => afterLogin(user.user))
    .catch(err => alert("Register failed: " + err.message));
});

loginGoogleBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(res => afterLogin(res.user)).catch(err => alert(err.message));
});

loginFacebookBtn.addEventListener("click", () => {
  const provider = new firebase.auth.FacebookAuthProvider();
  auth.signInWithPopup(provider).then(res => afterLogin(res.user)).catch(err => alert(err.message));
});

function afterLogin(user) {
  authDiv.style.display = "none";
  categoryDiv.style.display = "block";
  quizTitle.textContent = `🎯 Welcome ${user.displayName || user.email}`;
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
  moneyList.style.display = "block";
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
    const data = await res.json();
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
  const total = parseInt(questionCount.value) || 10;
  for (let i = total; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i * 100}`;
    moneyList.appendChild(li);
  }
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  updateTimer();
  hintBox.style.display = "none";

  const q = questions[current];
  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  quizDiv.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;
  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(a);
    quizDiv.appendChild(btn);
  });

  progressBar.style.width = `${(current / questions.length) * 100}%`;
  startTimer();
}

// ---------------- REST OF QUIZ FUNCTIONS ----------------
// checkAnswer(), nextQuestion(), startTimer(), updateTimer(), useFifty(), useHint(),
// updateMoneyLadder(), saveScore(), updateLeaderboard() remain same as previous working version.
