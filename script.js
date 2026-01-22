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

/* ================= ELEMENTS ================= */

const authDiv = document.getElementById("authDiv");
const profileDiv = document.getElementById("profileDiv");
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

const leaderboardList = document.getElementById("leaderboard-list");

/* ================= SOUNDS ================= */

const sounds = {
  intro: document.getElementById("intro-sound"),
  thinking: document.getElementById("thinking-sound"),
  call: document.getElementById("call-sound"),
  audience: document.getElementById("audience-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  lose: document.getElementById("lose-sound"),
  tick: document.getElementById("tick-sound")
};

let soundEnabled = true;
let audioReady = false;
let currentLoop = null;

/* ================= SOUND ENGINE ================= */

function unlockAudio() {
  if (audioReady) return;
  Object.values(sounds).forEach(s => {
    s.volume = 0.8;
    s.play().then(() => {
      s.pause();
      s.currentTime = 0;
    }).catch(() => {});
  });
  audioReady = true;
}

document.body.addEventListener("click", unlockAudio, { once: true });

function stopAllSounds() {
  Object.values(sounds).forEach(s => {
    s.pause();
    s.currentTime = 0;
    s.loop = false;
  });
  currentLoop = null;
}

function play(name, loop = false) {
  if (!soundEnabled || !audioReady) return;
  const s = sounds[name];
  if (!s) return;

  if (currentLoop && currentLoop !== s) {
    currentLoop.pause();
    currentLoop.currentTime = 0;
  }

  if (!loop) {
    s.pause();
    s.currentTime = 0;
  }

  s.loop = loop;
  s.play().catch(() => {});
  if (loop) currentLoop = s;
}

/* ================= AUTH ================= */

function showSettings() {
  authDiv.style.display = "none";
  emailDiv.style.display = "none";
  categoryDiv.style.display = "block";
}

googleLoginBtn.onclick = async () => {
  try {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  } catch (e) {
    alert(e.message);
  }
};

guestLoginBtn.onclick = () => {
  profileDiv.innerHTML = `<h3>👤 Guest</h3>`;
  showSettings();
};

emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
emailCancelBtn.onclick = () => emailDiv.style.display = "none";

emailLoginBtn.onclick = async () => {
  try {
    await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
  } catch (e) {
    alert(e.message);
  }
};

emailRegisterSubmitBtn.onclick = async () => {
  try {
    await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
  } catch (e) {
    alert(e.message);
  }
};

auth.onAuthStateChanged(user => {
  if (user) {
    profileDiv.innerHTML = `
      <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
      <h3>${user.displayName || "User"}</h3>
    `;
    showSettings();
  }
});

/* ================= GAME DATA ================= */

const MONEY = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000
];

let questions = [];
let current = 0;
let earned = -1;
let timer;
let timePerQuestion = 30;

let fiftyUsed = false;
let friendUsed = false;
let audienceUsed = false;
let tickStarted = false;

/* ================= START QUIZ ================= */

startBtn.onclick = async () => {
  unlockAudio();
  stopAllSounds();

  soundEnabled = soundToggle.value === "on";

  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";

  buildMoney();
  play("intro");

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );
  questions = await res.json();

  current = 0;
  earned = -1;
  fiftyUsed = friendUsed = audienceUsed = false;

  setTimeout(showQuestion, 1200);
};

/* ================= QUESTIONS ================= */

function showQuestion() {
  stopAllSounds();
  play("thinking", true);
  tickStarted = false;

  clearInterval(timer);
  callFriendBox.innerHTML = "";
  audienceVote.innerHTML = "";

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

    if (t === 5 && !tickStarted) {
      play("tick", true);
      tickStarted = true;
    }

    if (t <= 0) {
      clearInterval(timer);
      stopAllSounds();
      nextQuestion();
    }
  }, 1000);
}

function updateTimer(t) {
  timerText.textContent = `${t}s`;
  timerBar.style.width = `${(t / timePerQuestion) * 100}%`;
}

/* ================= ANSWERS ================= */

function checkAnswer(ans) {
  clearInterval(timer);
  stopAllSounds();

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    earned++;
    play("correct");
    updateMoney();
  } else {
    play("wrong");
  }

  setTimeout(nextQuestion, 1800);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) return winGame();
  showQuestion();
}

/* ================= MONEY ================= */

function buildMoney() {
  moneyList.innerHTML = "";
  MONEY.slice().reverse().forEach(v => {
    const li = document.createElement("li");
    li.className = "ladder-btn";
    li.textContent = `$${v.toLocaleString()}`;
    moneyList.appendChild(li);
  });
  updateMoney();
}

function updateMoney() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  if (earned >= 0) {
    const idx = MONEY.length - earned - 1;
    if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
  }
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
  play("call");

  callFriendBox.innerHTML = `📞 Friend thinks: <b>${questions[current].correctAnswer}</b>`;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.classList.add("used");
  play("audience");

  audienceVote.innerHTML = "";
  document.querySelectorAll(".option-btn").forEach(b => {
    const p = Math.floor(Math.random() * 70) + 10;
    audienceVote.innerHTML += `<div>${b.textContent}: ${p}%</div>`;
  });
};

/* ================= END ================= */

function winGame() {
  stopAllSounds();
  play("win");
  saveScore(earned >= 0 ? MONEY[earned] : 0);

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🏆 FINISHED</h1>
      <h2>You won $${earned >= 0 ? MONEY[earned] : 0}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

/* ================= LEADERBOARD ================= */

function saveScore(score) {
  const user = auth.currentUser;
  db.collection("scores").add({
    name: user?.displayName || "Guest",
    score,
    time: firebase.firestore.FieldValue.serverTimestamp()
  }).then(loadLeaderboard);
}

function loadLeaderboard() {
  leaderboardList.innerHTML = "<h3>🏆 Top 10</h3>";
  db.collection("scores").orderBy("score", "desc").limit(10).get().then(snap => {
    snap.forEach(doc => {
      const li = document.createElement("li");
      li.textContent = `${doc.data().name} — $${doc.data().score}`;
      leaderboardList.appendChild(li);
    });
  });
}

loadLeaderboard();

});
