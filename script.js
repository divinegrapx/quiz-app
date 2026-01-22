document.addEventListener("DOMContentLoaded", () => {

/* ================= FIREBASE ================= */

const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.appspot.com",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleLoginBtn = document.getElementById("googleLoginBtn");
const guestLoginBtn = document.getElementById("guestLoginBtn");

const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

/* ================= ELEMENTS ================= */

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const leaderboardList = document.getElementById("leaderboard-list");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");
const modeSelect = document.getElementById("modeSelect");

/* ================= SOUNDS ================= */

const sounds = {
  thinking: document.getElementById("thinking-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  lose: document.getElementById("lose-sound"),
  tick: document.getElementById("tick-sound")
};

let soundEnabled = true;
let answeringLocked = false;

/* ================= GAME STATE ================= */

const MONEY = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000
];

let questions = [];
let current = 0;
let timer;
let timePerQuestion = 30;
let fiftyUsed = false;
let friendUsed = false;
let audienceUsed = false;

/* ================= START QUIZ ================= */

document.getElementById("startBtn").onclick = startQuiz;

async function startQuiz() {
  soundEnabled = soundToggle.value === "on";
  timePerQuestion = modeSelect.value === "hardcore" ? 20 : 30;

  if (modeSelect.value === "hardcore") {
    fiftyBtn.disabled = callFriendBtn.disabled = audienceBtn.disabled = true;
  }

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );
  questions = await res.json();

  document.getElementById("categoryDiv").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  buildMoneyLadder();
  showQuestion();
}

/* ================= QUESTIONS ================= */

function showQuestion() {
  answeringLocked = false;
  clearInterval(timer);

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = a;
    btn.onclick = () => checkAnswer(a);
    quizDiv.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  let t = timePerQuestion;
  updateTimer(t);

  timer = setInterval(() => {
    t--;
    updateTimer(t);
    if (t <= 5) sounds.tick.play();
    if (t <= 0) gameOver();
  }, 1000);
}

function updateTimer(t) {
  timerText.textContent = `${t}s`;
  timerBar.style.width = `${(t / timePerQuestion) * 100}%`;
}

/* ================= ANSWERS ================= */

function checkAnswer(ans) {
  if (answeringLocked) return;
  answeringLocked = true;
  clearInterval(timer);

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    sounds.correct.play();
    current++;
    updateMoneyLadder();

    if (current === MONEY.length) return winGame();
    setTimeout(showQuestion, 1800);
  } else {
    sounds.wrong.play();
    setTimeout(gameOver, 1800);
  }
}

/* ================= GAME END ================= */

function gameOver() {
  sounds.lose.play();
  const won = current >= 10 ? 32000 : current >= 5 ? 1000 : 0;
  saveScore(won);

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>❌ GAME OVER</h1>
      <h2>You won $${won}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

function winGame() {
  sounds.win.play();
  saveScore(1000000);

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🏆 MILLIONAIRE!</h1>
      <h2>$1,000,000</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

/* ================= MONEY LADDER ================= */

function buildMoneyLadder() {
  moneyList.innerHTML = "";
  MONEY.slice().reverse().forEach(v => {
    const li = document.createElement("li");
    li.className = "ladder-btn";
    li.textContent = `$${v.toLocaleString()}`;
    moneyList.appendChild(li);
  });
  updateMoneyLadder();
}

function updateMoneyLadder() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  const idx = MONEY.length - current - 1;
  if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}

/* ================= LIFELINES ================= */

fiftyBtn.onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.classList.add("used");

  const correct = questions[current].correctAnswer;
  let removed = 0;

  document.querySelectorAll(".option-btn").forEach(b => {
    if (b.textContent !== correct && removed < 2) {
      b.disabled = true;
      b.style.visibility = "hidden";
      removed++;
    }
  });
};

callFriendBtn.onclick = () => {
  if (friendUsed) return;
  friendUsed = true;
  callFriendBtn.classList.add("used");

  const correct = questions[current].correctAnswer;
  const hint = Math.random() < 0.8 ? correct : "I'm not sure…";
  alert("📞 Friend says: " + hint);
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.classList.add("used");

  const correct = questions[current].correctAnswer;
  alert("📊 Audience thinks: " + correct);
};

/* ================= LEADERBOARD ================= */

function saveScore(score) {
  const user = auth.currentUser;

  db.collection("scores").add({
    name: user?.displayName || "Guest",
    score,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });

  loadLeaderboard();
}

function loadLeaderboard() {
  leaderboardList.innerHTML = "<h3>🏆 Top 10</h3>";

  db.collection("scores")
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .then(snap => {
      snap.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${doc.data().name} — $${doc.data().score}`;
        leaderboardList.appendChild(li);
      });
    });
}

loadLeaderboard();

});
