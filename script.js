document.addEventListener("DOMContentLoaded", () => {

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

/* ELEMENTS */
const googleLoginBtn = document.getElementById("googleLoginBtn");
const guestLoginBtn = document.getElementById("guestLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const startBtn = document.getElementById("startBtn");

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");
const walkAwayBtn = document.getElementById("walkAwayBtn");
const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");
const hardcoreToggle = document.getElementById("hardcoreToggle");

/* SOUNDS */
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

function stopAllSounds() {
  Object.values(sounds).forEach(s => {
    s.pause();
    s.currentTime = 0;
  });
}

function playSound(name) {
  if (!soundEnabled || !sounds[name]) return;
  stopAllSounds();
  sounds[name].play();
}

/* LOGIN */
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};

guestLoginBtn.onclick = () => showSettings();

emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
emailCancelBtn.onclick = () => emailDiv.style.display = "none";

emailLoginBtn.onclick = async () => {
  await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
  location.reload();
};

emailRegisterSubmitBtn.onclick = async () => {
  await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
  location.reload();
};

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("profileDiv").innerHTML = `
      <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
      <h3>${user.displayName || "Guest"}</h3>
    `;
  }
});

/* SETTINGS */
function showSettings() {
  document.getElementById("authDiv").style.display = "none";
  document.getElementById("categoryDiv").style.display = "block";
  playSound("intro");
}

/* GAME */
let questions = [];
let current = 0;
let ladderLevel = 0;
let timer;
let fiftyUsed = false;
let friendUsed = false;
let audienceUsed = false;
const timePerQuestion = 30;
/* CHECKPOINTS (20 QUESTIONS) */
const checkpoints = {
  5: 1000,
  10: 32000,
  15: 250000,
  20: 1000000
};

let guaranteedMoney = 0;

startBtn.onclick = startQuiz;

async function startQuiz() {
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  soundEnabled = soundToggle.value === "on";

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
  questions = await res.json();

  document.getElementById("categoryDiv").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  buildMoneyLadder(20);

  current = 0;
  ladderLevel = 0;
  fiftyUsed = friendUsed = audienceUsed = false;

  playSound("thinking");
  showQuestion();
}

function showQuestion() {
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

  let timeLeft = timePerQuestion;
  updateTimer(timeLeft);

  timer = setInterval(() => {
    timeLeft--;
    updateTimer(timeLeft);
    if (timeLeft <= 5) playSound("tick");
    if (timeLeft <= 0) nextQuestion();
  }, 1000);
}

function updateTimer(t) {
  timerText.textContent = t + "s";
  timerBar.style.width = (t / timePerQuestion * 100) + "%";
  timerBar.style.background = t > 10 ? "#00ff00" : t > 5 ? "#ffcc00" : "#ff4d4d";
}

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
  ladderLevel++;

  // 💀 Hardcore Mode disables checkpoints
  if (!hardcoreMode && checkpoints[ladderLevel]) {
    guaranteedMoney = checkpoints[ladderLevel];
  }

  playSound("correct");
} else {
  playSound("wrong");
}



  updateMoneyLadder();
  setTimeout(nextQuestion, 2000);
}

function nextQuestion() {
  current++;

  if (current >= questions.length) {
    showFinalScreen();
    return;
  }

  playSound("thinking");
  showQuestion();
}

/* MONEY LADDER */
function buildMoneyLadder(count) {
  moneyList.innerHTML = "";
  for (let i = count; i >= 1; i--) {
    const li = document.createElement("li");
    li.className = "ladder-btn";
    li.textContent = "$" + (i * 100);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  const idx = moneyList.children.length - ladderLevel;
  if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}

/* LIFELINES */
fiftyBtn.onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.classList.add("used");

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
  if (friendUsed) return;
  friendUsed = true;
  callFriendBtn.classList.add("used");
  playSound("call");
  callFriendBox.innerHTML = `📞 Friend says: <b>${questions[current].correctAnswer}</b>`;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.classList.add("used");
  playSound("audience");
 
  walkAwayBtn.onclick = () => {
  clearInterval(timer);
  stopAllSounds();
  playSound("win");

  showFinalScreen();
};


  audienceVote.innerHTML = "";
  document.querySelectorAll(".option-btn").forEach(b => {
    const percent = Math.floor(Math.random() * 80) + 10;
    audienceVote.innerHTML += `<div>${b.textContent}: ${percent}%</div>`;
  });
};
/* WALK AWAY */
walkAwayBtn.onclick = () => {
  clearInterval(timer);
  stopAllSounds();

  playSound("win");

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>💰 YOU WALKED AWAY</h1>

      <div class="money-win">
        $${guaranteedMoney.toLocaleString()}
      </div>

      <p>You secured your guaranteed prize!</p>

      <div class="final-buttons">
        <button onclick="location.reload()">🔁 Play Again</button>

        <button onclick="navigator.share({
          title: 'NEON MILLIONAIRE',
          text: 'I walked away with $${guaranteedMoney.toLocaleString()} in NEON MILLIONAIRE!'
        })">📤 Share</button>

        <button onclick="logoutUser()">🚪 Log Out</button>
      </div>
    </div>
  `;

  saveScore(guaranteedMoney);
};

/* FINAL SCREEN */
function showFinalScreen() {
  stopAllSounds();
  playSound("win");

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🎉 CONGRATULATIONS</h1>

      <div class="money-win">
        $${guaranteedMoney.toLocaleString()}
      </div>

      <p>Guaranteed Prize</p>

      <div class="final-buttons">
        <button onclick="location.reload()">🔁 Play Again</button>

        <button onclick="navigator.share({
          title: 'NEON MILLIONAIRE',
          text: 'I won $${guaranteedMoney.toLocaleString()} in NEON MILLIONAIRE!'
        })">📤 Share</button>

        <button onclick="logoutUser()">🚪 Log Out</button>
      </div>
    </div>
  `;

  saveScore(guaranteedMoney);
}


  // SAVE GUARANTEED MONEY
  saveScore(guaranteedMoney);

  quizDiv.innerHTML = `
    <div class="final-screen neon-glow">
      <h1>🎉 CONGRATULATIONS 🎉</h1>
      <h2>You secured</h2>
      <h1 class="money-win">$${guaranteedMoney.toLocaleString()}</h1>

      <div class="final-buttons">
        <button id="playAgainBtn">🔁 Play Again</button>
        <button id="shareBtn">📤 Share Score</button>
        <button id="logoutBtn">🚪 Log Out</button>
      </div>
    </div>
  `;

  document.getElementById("playAgainBtn").onclick = () => {
    location.reload();
  };

  document.getElementById("logoutBtn").onclick = async () => {
    await auth.signOut();
    location.reload();
  };

  document.getElementById("shareBtn").onclick = () => {
    if (navigator.share) {
      navigator.share({
        title: "NEON MILLIONAIRE",
        text: `I just won $${guaranteedMoney.toLocaleString()} in NEON MILLIONAIRE! 💰🔥`,
        url: location.href
      });
    } else {
      alert("Sharing not supported on this device");
    }
  };
}


/* LEADERBOARD */
function saveScore(score) {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("scores").add({
    name: user.displayName || "Guest",
    photo: user.photoURL || "",
    score,
    time: new Date()
  });
}

/* LOG OUT */
function logoutUser() {
  firebase.auth().signOut().then(() => {
    location.reload();
  });
}

/* DO NOT REMOVE */
});
