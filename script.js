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

const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");
const hardcoreToggle = document.getElementById("hardcoreToggle");

const quizDiv = document.getElementById("quiz");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");

const callBox = document.getElementById("callFriendBox");
const audienceBox = document.getElementById("audienceVote");

/* ================= SOUNDS ================= */
const sounds = {
  thinking: document.getElementById("thinking-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  tick: document.getElementById("tick-sound")
};

let soundEnabled = true;
const play = s => {
  if (!soundEnabled || !sounds[s]) return;
  Object.values(sounds).forEach(x => { x.pause(); x.currentTime = 0; });
  sounds[s].play();
};

/* ================= GAME STATE ================= */
let questions = [];
let index = 0;
let timer;
let timeLeft;
let locked = false;

let hardcore = false;
let secondChance = true;

let earned = 0;
let guaranteed = 0;

const ladder = [
  100,200,300,500,1000,
  2000,4000,8000,16000,32000,
  64000,125000,250000,500000,1000000,
  2000000,4000000,8000000,16000000,32000000
];

const checkpoints = [4,9,14,19];

/* ================= START ================= */
startBtn.onclick = async () => {
  soundEnabled = soundToggle.value === "on";
  hardcore = hardcoreToggle?.checked || false;

  const diff = difficultySelect.value;
  const cat = categorySelect.value;

  const limit = 20;
  const url = `https://the-trivia-api.com/api/questions?limit=${limit}&categories=${cat}&difficulty=${diff}`;

  questions = await fetch(url).then(r => r.json());

  authDiv.style.display = "none";
  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";

  buildLadder();
  nextQuestion();
};

/* ================= QUESTION FLOW ================= */
function nextQuestion() {
  if (index >= questions.length) return winGame();

  locked = false;
  quizDiv.innerHTML = "";
  callBox.innerHTML = "";
  audienceBox.innerHTML = "";

  const q = questions[index];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);
  answers.forEach(a => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = a;
    b.onclick = () => choose(b, a);
    quizDiv.appendChild(b);
  });

  startTimer();
  play("thinking");
}

/* ================= TIMER ================= */
function startTimer() {
  clearInterval(timer);
  timeLeft = hardcore ? 20 : 30;
  updateTimer();

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 5) play("tick");
    if (timeLeft <= 0) fail();
  }, hardcore ? 700 : 1000);
}

function updateTimer() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = `${(timeLeft / (hardcore ? 20 : 30)) * 100}%`;
}

/* ================= ANSWER ================= */
function choose(btn, ans) {
  if (locked) return;
  locked = true;
  clearInterval(timer);

  document.querySelectorAll(".option-btn").forEach(b => b.classList.add("locked"));

  const correct = questions[index].correctAnswer;

  if (ans === correct) {
    btn.classList.add("correct");
    play("correct");
    earned = ladder[index];
    if (checkpoints.includes(index)) guaranteed = earned;
    updateLadder();
    setTimeout(() => { index++; nextQuestion(); }, 1400);
  } else {
    btn.classList.add("wrong");
    play("wrong");

    if (secondChance) {
      secondChance = false;
      setTimeout(() => {
        locked = false;
        document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("locked","wrong"));
        startTimer();
      }, 1400);
    } else {
      setTimeout(endGame, 1600);
    }
  }
}

/* ================= FAIL / END ================= */
function fail() {
  clearInterval(timer);
  secondChance ? (secondChance = false, startTimer()) : endGame();
}

function endGame() {
  saveScore(guaranteed);
  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>GAME OVER</h1>
      <h2>You keep $${guaranteed}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

function winGame() {
  saveScore(earned * (hardcore ? 2 : 1));
  play("win");
  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🎉 CONGRATULATIONS</h1>
      <h2>$${earned}${hardcore ? " (HARDCORE x2)" : ""}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;
}

/* ================= MONEY LADDER ================= */
function buildLadder() {
  moneyList.innerHTML = "";
  ladder.forEach((m,i) => {
    const li = document.createElement("li");
    li.textContent = `$${m}`;
    if (checkpoints.includes(i)) li.classList.add("safe");
    moneyList.prepend(li);
  });
}

function updateLadder() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  const idx = moneyList.children.length - 1 - index;
  moneyList.children[idx]?.classList.add("current");
}

/* ================= LIFELINES ================= */
fiftyBtn.onclick = () => {
  fiftyBtn.disabled = true;
  const correct = questions[index].correctAnswer;
  let removed = 0;
  document.querySelectorAll(".option-btn").forEach(b => {
    if (b.textContent !== correct && removed < 2) {
      b.style.opacity = 0.3;
      removed++;
    }
  });
};

callBtn.onclick = () => {
  callBtn.disabled = true;
  callBox.innerHTML = `📞 Friend thinks: <b>${biasedAnswer()}</b>`;
};

audienceBtn.onclick = () => {
  audienceBtn.disabled = true;
  audienceBox.innerHTML = "";
  document.querySelectorAll(".option-btn").forEach(b => {
    const bias = b.textContent === questions[index].correctAnswer ? 40 + Math.random()*30 : Math.random()*30;
    audienceBox.innerHTML += `<div>${b.textContent}: ${Math.floor(bias)}%</div>`;
  });
};

function biasedAnswer() {
  return Math.random() < 0.7
    ? questions[index].correctAnswer
    : document.querySelector(".option-btn").textContent;
}

/* ================= LEADERBOARD ================= */
async function saveScore(amount) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = db.collection("leaderboard").doc(user.uid);
  const snap = await ref.get();

  if (snap.exists) {
    ref.update({
      total: firebase.firestore.FieldValue.increment(amount),
      games: firebase.firestore.FieldValue.increment(1),
      hardcore: hardcore || snap.data().hardcore
    });
  } else {
    ref.set({
      name: user.displayName || "Guest",
      photo: user.photoURL || "",
      total: amount,
      games: 1,
      hardcore
    });
  }
}

});
