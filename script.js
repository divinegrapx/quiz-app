// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const profileDiv = document.getElementById("profileDiv");
const profilePic = document.getElementById("profilePic");
const profileName = document.getElementById("profileName");
const profileStats = document.getElementById("profileStats");

const settingsDiv = document.getElementById("settingsDiv");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");

const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const leaderboardList = document.getElementById("leaderboard-list");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// GLOBALS
let questions = [], current = 0, score = 0, timer;
let ladderLevel = 0;
let timePerQuestion = 30;
let soundEnabled = true;

// SAFE MILESTONES
const safeMilestones = [5, 10, 20];

// LOGIN
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
  onLoginSuccess();
});

emailRegisterBtn.addEventListener("click", () => {
  emailDiv.style.display = "block";
});

emailCancelBtn.addEventListener("click", () => {
  emailDiv.style.display = "none";
});

emailLoginBtn.addEventListener("click", async () => {
  await auth.signInWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  );
  onLoginSuccess();
});

emailRegisterSubmitBtn.addEventListener("click", async () => {
  await auth.createUserWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  );
  onLoginSuccess();
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  location.reload();
});

// PROFILE
function onLoginSuccess() {
  const user = auth.currentUser;
  profileDiv.style.display = "block";
  settingsDiv.style.display = "block";

  profilePic.src = user.photoURL || "";
  profileName.textContent = user.displayName || user.email;

  updateProfileStats();
  updateLeaderboard();
}

// PROFILE STATS
async function updateProfileStats() {
  const user = auth.currentUser;
  const doc = await db.collection("leaderboard").doc(user.uid).get();
  if (doc.exists) {
    profileStats.textContent = `Best Score: ${doc.data().score}`;
  }
}

// DIFFICULTY
difficultySelect.addEventListener("change", () => {
  if (difficultySelect.value === "easy") timePerQuestion = 40;
  if (difficultySelect.value === "medium") timePerQuestion = 30;
  if (difficultySelect.value === "hard") timePerQuestion = 20;
});

// SOUND
soundToggle.addEventListener("change", () => {
  soundEnabled = soundToggle.checked;
});

// START QUIZ
startBtn.addEventListener("click", startQuiz);

async function startQuiz() {
  score = 0;
  current = 0;
  ladderLevel = 0;

  buildMoneyLadder();

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`
  );
  questions = await res.json();

  showQuestion();
}

// SHOW QUESTION
function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(a);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    updateTimer(timeLeft);

    if (timeLeft <= 5 && soundEnabled) tickSound.play();

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion(false);
    }
  }, 1000);
}

// TIMER
function updateTimer(t) {
  timerText.textContent = `${t}s`;
  timerBar.style.width = (t / timePerQuestion) * 100 + "%";
}

// ANSWER
function checkAnswer(answer) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  if (answer === correct) {
    score++;
    ladderLevel++;
    if (soundEnabled) correctSound.play();
  } else {
    if (soundEnabled) wrongSound.play();
  }

  updateMoneyLadder();
  setTimeout(nextQuestion, 1500);
}

// NEXT
function nextQuestion() {
  current++;

  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished!</h2>
    <p>Score: ${score}</p>
    <p>Money: $${score * 100}</p>`;
    saveScore();
    return;
  }

  showQuestion();
}

// MONEY LADDER
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  const total = parseInt(questionCount.value);

  for (let i = 0; i <= total; i++) {
    const li = document.createElement("li");
    li.textContent = "$" + i * 100;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li => li.classList.remove("current"));

  if (lis[ladderLevel]) lis[ladderLevel].classList.add("current");
}

// SAFE MILESTONE LOGIC
function getGuaranteedMoney() {
  let guaranteed = 0;
  safeMilestones.forEach(m => {
    if (score >= m) guaranteed = m * 100;
  });
  return guaranteed;
}

// SAVE SCORE
async function saveScore() {
  const user = auth.currentUser;
  const ref = db.collection("leaderboard").doc(user.uid);
  const snap = await ref.get();

  if (!snap.exists || score > snap.data().score) {
    await ref.set({
      name: user.displayName || user.email,
      score
    });
  }

  updateLeaderboard();
  updateProfileStats();
}

// LEADERBOARD
async function updateLeaderboard() {
  leaderboardList.innerHTML = "";
  const snap = await db.collection("leaderboard")
    .orderBy("score", "desc")
    .limit(10)
    .get();

  snap.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = `${doc.data().name} - ${doc.data().score}`;
    leaderboardList.appendChild(li);
  });
}
