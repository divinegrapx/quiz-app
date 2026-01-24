document.addEventListener("DOMContentLoaded", () => {

/* ================= FIREBASE ================= */
firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
});

const auth = firebase.auth();
const db = firebase.firestore();

/* ================= ELEMENTS ================= */
const $ = id => document.getElementById(id);

const googleLoginBtn = $("googleLoginBtn");
const guestLoginBtn = $("guestLoginBtn");
const emailRegisterBtn = $("emailRegisterBtn");
const emailLoginBtn = $("emailLoginBtn");
const emailRegisterSubmitBtn = $("emailRegisterSubmitBtn");
const emailCancelBtn = $("emailCancelBtn");

const emailInput = $("emailInput");
const passwordInput = $("passwordInput");

const startBtn = $("startBtn");
const quizDiv = $("quiz");
const moneyList = $("money-list");

const categorySelect = $("categorySelect");
const difficultySelect = $("difficultySelect");
const soundToggle = $("soundToggle");
const hardcoreToggle = $("hardcoreToggle");

/* ================= GAME STATE ================= */
let questions = [];
let current = 0;
let ladderLevel = 0;
let guaranteedMoney = 0;
let hardcoreMode = false;

const checkpoints = { 5:1000, 10:32000, 15:250000, 20:1000000 };

/* ================= LOGIN ================= */
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};

guestLoginBtn.onclick = showSettings;

emailRegisterBtn.onclick = () => $("emailDiv").style.display = "block";
emailCancelBtn.onclick = () => $("emailDiv").style.display = "none";

emailLoginBtn.onclick = async () => {
  await auth.signInWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  );
  showSettings();
};

emailRegisterSubmitBtn.onclick = async () => {
  await auth.createUserWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  );
  showSettings();
};

/* ================= SETTINGS ================= */
function showSettings() {
  $("authDiv").style.display = "none";
  $("categoryDiv").style.display = "block";
}

/* ================= START QUIZ ================= */
startBtn.onclick = async () => {
  hardcoreMode = hardcoreToggle.checked;

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=20&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );

  questions = await res.json();

  $("categoryDiv").style.display = "none";
  $("quiz-container").style.display = "block";

  buildMoneyLadder();
  current = 0;
  ladderLevel = 0;
  guaranteedMoney = 0;

  showQuestion();
};

/* ================= QUESTIONS ================= */
function showQuestion() {
  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random() - 0.5)
    .forEach(a => {
      const btn = document.createElement("button");
      btn.textContent = a;
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });
}

function checkAnswer(ans) {
  const correct = questions[current].correctAnswer;

  if (ans === correct) {
    ladderLevel++;

    if (!hardcoreMode && checkpoints[ladderLevel]) {
      guaranteedMoney = checkpoints[ladderLevel];
    }

    current++;
    current >= questions.length ? showFinal() : showQuestion();
  } else {
    showFinal();
  }
}

/* ================= MONEY ================= */
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  for (let i = 20; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i * 1000}`;
    moneyList.appendChild(li);
  }
}

/* ================= FINAL ================= */
function showFinal() {
  quizDiv.innerHTML = `
    <h1>💰 You won $${guaranteedMoney.toLocaleString()}</h1>
    <button onclick="location.reload()">Play Again</button>
    <button onclick="logoutUser()">Log Out</button>
  `;

  saveScore(guaranteedMoney);
}

/* ================= SAVE ================= */
function saveScore(score) {
  if (!auth.currentUser) return;

  db.collection("scores").add({
    name: auth.currentUser.displayName || "Guest",
    score,
    time: new Date()
  });
}

window.logoutUser = async () => {
  await auth.signOut();
  location.reload();
};

});
