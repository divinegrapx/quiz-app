document.addEventListener("DOMContentLoaded", () => {

/* ================= FIREBASE ================= */
firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
});

const auth = firebase.auth();
const db = firebase.firestore();

/* ================= ELEMENTS ================= */
const authDiv = document.getElementById("authDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const guestLoginBtn = document.getElementById("guestLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const startBtn = document.getElementById("startBtn");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");
const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");

/* ================= SOUNDS ================= */
const sounds = {
  intro: document.getElementById("intro-sound"),
  thinking: document.getElementById("thinking-sound"),
  call: document.getElementById("call-sound"),
  audience: document.getElementById("audience-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  tick: document.getElementById("tick-sound"),
};

let soundEnabled = true;
const playSound = n => soundEnabled && sounds[n]?.play();

/* ================= AUTH ================= */
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};

guestLoginBtn.onclick = showSettings;

emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
emailCancelBtn.onclick = () => emailDiv.style.display = "none";

emailLoginBtn.onclick = async () => {
  await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
  showSettings();
};

emailRegisterSubmitBtn.onclick = async () => {
  await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
  showSettings();
};

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("profileDiv").innerHTML =
      `<h3>${user.displayName || "Guest"}</h3>`;
  }
});

/* ================= GAME ================= */
let questions = [];
let current = 0;
let level = 0;
let timer;
const timePerQuestion = 30;

startBtn.onclick = startQuiz;

function showSettings() {
  authDiv.style.display = "none";
  categoryDiv.style.display = "block";
  playSound("intro");
}

async function startQuiz() {
  soundEnabled = soundToggle.value === "on";

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=20&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );
  questions = await res.json();

  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";

  buildMoney();
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  callFriendBox.textContent = "";
  audienceVote.textContent = "";

  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random() - 0.5)
    .forEach(a => {
      const b = document.createElement("button");
      b.className = "option-btn";
      b.textContent = a;
      b.onclick = () => answer(a);
      quizDiv.appendChild(b);
    });

  let t = timePerQuestion;
  timerText.textContent = `${t}s`;
  timerBar.style.width = "100%";

  timer = setInterval(() => {
    t--;
    timerText.textContent = `${t}s`;
    timerBar.style.width = (t / timePerQuestion * 100) + "%";
    if (t <= 5) playSound("tick");
    if (t <= 0) next();
  }, 1000);
}

function answer(ans) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  ans === correct ? (level++, playSound("correct")) : playSound("wrong");
  updateMoney();
  setTimeout(next, 1500);
}

function next() {
  current++;
  current >= questions.length ? finish() : showQuestion();
}

/* ================= MONEY ================= */
function buildMoney() {
  moneyList.innerHTML = "";
  for (let i = 20; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i * 100}`;
    moneyList.appendChild(li);
  }
}

function updateMoney() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  const idx = moneyList.children.length - level;
  moneyList.children[idx]?.classList.add("current");
}

/* ================= LIFELINES ================= */
fiftyBtn.onclick = () => {
  const correct = questions[current].correctAnswer;
  let removed = 0;
  document.querySelectorAll(".option-btn").forEach(b => {
    if (b.textContent !== correct && removed < 2) {
      b.style.opacity = 0.3;
      removed++;
    }
  });
};

callFriendBtn.onclick = () => {
  playSound("call");
  callFriendBox.innerHTML = `📞 Friend: <b>${questions[current].correctAnswer}</b>`;
};

audienceBtn.onclick = () => {
  playSound("audience");
  audienceVote.innerHTML = "";
  document.querySelectorAll(".option-btn").forEach(b => {
    const pct = b.textContent === questions[current].correctAnswer
      ? 60 + Math.random() * 30
      : Math.random() * 30;
    audienceVote.innerHTML += `<div>${b.textContent}: ${Math.floor(pct)}%</div>`;
  });
};

/* ================= FINAL ================= */
function finish() {
  playSound("win");
  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🎉 Congratulations</h1>
      <h2>You won $${level * 100}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

});
