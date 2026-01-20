// ==============================
// FIREBASE (MODULAR v10)
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 YOUR REAL FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.firebasestorage.app",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ==============================
// ELEMENTS
// ==============================
const loginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const quizDiv = document.getElementById("quiz-and-ladder");
const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const tickSound = document.getElementById("tickSound");

// ==============================
// AUTH
// ==============================
loginBtn.onclick = async () => {
  await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    quizDiv.style.display = "flex";
    startQuiz();
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    quizDiv.style.display = "none";
  }
});

// ==============================
// QUIZ DATA
// ==============================
const questions = [
  { q: "Capital of France?", a: ["Paris", "Rome", "Berlin", "Madrid"], c: 0 },
  { q: "2 + 2 = ?", a: ["3", "4", "5", "6"], c: 1 }
];

let index = 0;
let timer;

// ==============================
// QUIZ LOGIC
// ==============================
function startQuiz() {
  index = 0;
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timer);
  answersEl.innerHTML = "";

  const q = questions[index];
  questionEl.textContent = q.q;

  q.a.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = text;
    btn.onclick = () => selectAnswer(btn, i);
    answersEl.appendChild(btn);
  });

  startTimer();
}

function selectAnswer(btn, i) {
  clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);

  if (i === questions[index].c) {
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
  }
}

// ==============================
// TIMER
// ==============================
function startTimer() {
  let time = 15;
  timerText.textContent = time;
  timerBar.style.width = "100%";

  timer = setInterval(() => {
    time--;
    timerText.textContent = time;
    timerBar.style.width = (time / 15) * 100 + "%";

    if (time <= 5) tickSound.play();
    if (time <= 0) clearInterval(timer);
  }, 1000);
}
