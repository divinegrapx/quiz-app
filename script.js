// ---------------- FIREBASE CONFIG ----------------
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

// ---------------- DOM ELEMENTS ----------------
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const difficultySelect = document.getElementById("difficultySelect");
const musicToggle = document.getElementById("musicToggle");

const quizDiv = document.getElementById("quiz");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const leaderboardList = document.getElementById("leaderboard-list");
const quizContainer = document.getElementById("quiz-container");
const categoryDiv = document.getElementById("categoryDiv");
const authDiv = document.getElementById("authDiv");
const settingsDiv = document.getElementById("settingsDiv");
const profileDiv = document.getElementById("profileDiv");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const audienceGraph = document.getElementById("audienceGraph");
const callScreen = document.getElementById("callScreen");
const friendAnswer = document.getElementById("friendAnswer");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");
const bgMusic = document.getElementById("bg-music");

// ---------------- GLOBALS ----------------
let questions = [];
let current = 0;
let score = 0;
let timer;
let timePerQuestion = 30;
let ladderLevel = 0;
let money = 0;

let fiftyUsed = false;
let callUsed = false;
let audienceUsed = false;

// ---------------- LOGIN ----------------
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
  onLoginSuccess();
});

emailRegisterBtn.addEventListener("click", () => {
  emailDiv.style.display = "block";
  authDiv.style.display = "none";
});

emailCancelBtn.addEventListener("click", () => {
  emailDiv.style.display = "none";
  authDiv.style.display = "block";
});

emailLoginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  await auth.signInWithEmailAndPassword(email, password);
  onLoginSuccess();
});

emailRegisterSubmitBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  await auth.createUserWithEmailAndPassword(email, password);
  onLoginSuccess();
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  location.reload();
});

function onLoginSuccess() {
  authDiv.style.display = "none";
  settingsDiv.style.display = "block";
  categoryDiv.style.display = "block";
  profileDiv.style.display = "block";

  const user = auth.currentUser;
  document.getElementById("profilePic").src = user.photoURL || "";
  document.getElementById("profileName").textContent = user.displayName || user.email;

  updateLeaderboard();
}

// ---------------- MUSIC CONTROL ----------------
musicToggle.addEventListener("change", () => {
  if (musicToggle.value === "on") bgMusic.play();
  else bgMusic.pause();
});

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);

async function startQuiz() {
  quizContainer.style.display = "block";
  settingsDiv.style.display = "none";
  categoryDiv.style.display = "none";

  fiftyUsed = callUsed = audienceUsed = false;
  money = 0;
  ladderLevel = 0;

  buildMoneyLadder();

  let difficulty = difficultySelect.value;

  let url = `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficulty}`;

  const res = await fetch(url);
  questions = await res.json();

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(a);
    quizDiv.appendChild(btn);
  });

  timerBar.style.width = "100%";
  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = `${timeLeft}s`;
    timerBar.style.width = (timeLeft / timePerQuestion) * 100 + "%";

    if (timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if (timeLeft <= 0) nextQuestion(false);

  }, 1000);
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer) {
  clearInterval(timer);

  const correct = questions[current].correctAnswer;
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === answer && answer !== correct) btn.classList.add("wrong");
  });

  if (answer === correct) {
    score++;
    ladderLevel++;
    money += 100;
    correctSound.play();
    updateMoneyLadder();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1800);
}

// ---------------- NEXT ----------------
function nextQuestion() {
  current++;

  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Game Over</h2><p>You won $${money}</p>`;
    saveScore(auth.currentUser, money);
    return;
  }

  showQuestion();
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  const total = parseInt(questionCount.value);

  for (let i = total; i >= 0; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i * 100}`;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li => li.classList.remove("current"));

  const idx = moneyList.children.length - ladderLevel - 1;
  if (lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LIFELINES ----------------
fiftyBtn.onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;

  const correct = questions[current].correctAnswer;
  let removed = 0;

  document.querySelectorAll(".option-btn").forEach(btn => {
    if (btn.textContent !== correct && removed < 2) {
      btn.style.opacity = 0.3;
      removed++;
    }
  });
};

callBtn.onclick = () => {
  if (callUsed) return;
  callUsed = true;

  callScreen.style.display = "block";
  friendAnswer.textContent = "Thinking...";

  setTimeout(() => {
    friendAnswer.textContent = `I think the answer is: ${questions[current].correctAnswer}`;
  }, 3000);
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;

  audienceGraph.style.display = "flex";

  ["barA", "barB", "barC", "barD"].forEach(bar => {
    document.getElementById(bar).style.height = Math.random() * 100 + "%";
  });
};

// ---------------- LEADERBOARD ----------------
async function saveScore(user, money) {
  if (!user) return;

  await db.collection("leaderboard").doc(user.uid).set({
    name: user.displayName || user.email,
    avatar: user.photoURL || "",
    score: money,
    date: firebase.firestore.FieldValue.serverTimestamp()
  });

  updateLeaderboard();
}

async function updateLeaderboard() {
  leaderboardList.innerHTML = "";
  const snap = await db.collection("leaderboard").orderBy("score", "desc").limit(10).get();

  snap.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");

    const img = document.createElement("img");
    img.src = d.avatar;

    li.appendChild(img);
    li.appendChild(document.createTextNode(`${d.name} — $${d.score}`));
    leaderboardList.appendChild(li);
  });
}
