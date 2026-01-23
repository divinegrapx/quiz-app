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

/* ================= SOUNDS (FIXED) ================= */

const sounds = {
  intro: document.getElementById("intro-sound"),
  thinking: document.getElementById("thinking-sound"),
  call: document.getElementById("call-sound"),
  audience: document.getElementById("audience-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  tick: document.getElementById("tick-sound")
};

let soundEnabled = true;
let audioUnlocked = false;
let loopSound = null;

function unlockAudio() {
  if (audioUnlocked) return;
  Object.values(sounds).forEach(s => {
    if (!s) return;
    s.volume = 0.8;
    s.play().then(() => {
      s.pause();
      s.currentTime = 0;
    }).catch(() => {});
  });
  audioUnlocked = true;
}

document.body.addEventListener("click", unlockAudio, { once: true });

function stopSounds() {
  Object.values(sounds).forEach(s => {
    if (!s) return;
    s.pause();
    s.currentTime = 0;
    s.loop = false;
  });
  loopSound = null;
}

function playSound(name, loop = false) {
  if (!soundEnabled || !audioUnlocked) return;
  const s = sounds[name];
  if (!s) return;

  if (loopSound && loopSound !== s) {
    loopSound.pause();
    loopSound.currentTime = 0;
  }

  s.pause();
  s.currentTime = 0;
  s.loop = loop;
  s.play().catch(() => {});
  if (loop) loopSound = s;
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
let earnedIndex = -1;
let timer;
let timePerQuestion = 30;

let fiftyUsed = false;
let friendUsed = false;
let audienceUsed = false;

/* ================= START QUIZ (INTRO FIXED) ================= */

startBtn.onclick = async () => {
  unlockAudio();
  soundEnabled = soundToggle.value === "on";

  stopSounds();

  // ✅ INTRO PLAYS HERE – guaranteed
  if (soundEnabled) {
    sounds.intro.currentTime = 0;
    sounds.intro.loop = false;
    sounds.intro.play().catch(() => {});
  }

  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";

  current = 0;
  earnedIndex = -1;
  fiftyUsed = friendUsed = audienceUsed = false;

  buildMoney();

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );
  questions = await res.json();

  setTimeout(showQuestion, 1200);
};

/* ================= QUESTIONS ================= */

function showQuestion() {
  stopSounds();
  playSound("thinking", true);

  clearInterval(timer);
  callFriendBox.innerHTML = "";
  audienceVote.innerHTML = "";

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

  [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random() - 0.5)
    .forEach(a => {
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
    if (t === 5) playSound("tick", true);
    if (t <= 0) {
      clearInterval(timer);
      stopSounds();
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
  stopSounds();

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    earnedIndex++;
    playSound("correct");
    updateMoney();
  } else {
    playSound("wrong");
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
}

function updateMoney() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  if (earnedIndex >= 0) {
    const idx = MONEY.length - earnedIndex - 1;
    if (moneyList.children[idx]) {
      moneyList.children[idx].classList.add("current");
    }
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
  playSound("call");
  callFriendBox.innerHTML = `📞 Friend thinks: <b>${questions[current].correctAnswer}</b>`;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.classList.add("used");
  playSound("audience");

  audienceVote.innerHTML = "";
  document.querySelectorAll(".option-btn").forEach(b => {
    const p = Math.floor(Math.random() * 70) + 10;
    audienceVote.innerHTML += `<div>${b.textContent}: ${p}%</div>`;
  });
};

/* ================= END ================= */

function winGame() {
  stopSounds();
  playSound("win");

  const prize = earnedIndex >= 0 ? MONEY[earnedIndex] : 0;

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🏆 FINISHED</h1>
      <h2>You won $${prize.toLocaleString()}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

});
