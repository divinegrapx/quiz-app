// ---------------- FIREBASE ----------------
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

// ---------------- SOUNDS ----------------
const correctSound = new Audio("correct.wav");
const wrongSound = new Audio("wrong.wav");
const tickSound = new Audio("tick.mp3");
const callSound = new Audio("call.mp3");
const audienceSound = new Audio("audience.mp3");

// ---------------- ELEMENTS ----------------
const quizDiv = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const difficultySelect = document.getElementById("difficultySelect");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const moneyList = document.getElementById("money-list");

const callScreen = document.getElementById("callScreen");
const callText = document.getElementById("callText");

const audienceScreen = document.getElementById("audienceScreen");
const audienceBars = document.querySelectorAll(".audience-bar");

const profileName = document.getElementById("profileName");
const profileImg = document.getElementById("profileImg");

// ---------------- GAME STATE ----------------
let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 30;
let ladderLevel = 0;

let fiftyUsed = false;
let callUsed = false;
let audienceUsed = false;

// ---------------- LOGIN ----------------
auth.onAuthStateChanged(user => {
  if (user) {
    profileName.textContent = user.displayName || user.email;
    profileImg.src = user.photoURL || "avatar.png";
  }
});

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);

async function startQuiz() {
  current = 0;
  score = 0;
  ladderLevel = 0;
  fiftyUsed = callUsed = audienceUsed = false;

  fiftyBtn.disabled = false;
  callBtn.disabled = false;
  audienceBtn.disabled = false;

  buildMoneyLadder();

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
  questions = await res.json();

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  clearInterval(timer);
  timeLeft = 30;
  updateTimer();

  callScreen.style.display = "none";
  audienceScreen.style.display = "none";

  const q = questions[current];
  quizDiv.innerHTML = `<div class="question">${q.question}</div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "answer-btn";
    btn.onclick = () => checkAnswer(a, btn);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion(false);
    }
  }, 1000);
}

// ---------------- TIMER ----------------
function updateTimer() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = (timeLeft / 30 * 100) + "%";
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer, btn) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const buttons = document.querySelectorAll(".answer-btn");

  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.style.background = "#00ff00";
    if (b.textContent === answer && answer !== correct) b.style.background = "#ff4d4d";
  });

  if (answer === correct) {
    score++;
    ladderLevel++;
    correctSound.play();
    updateMoneyLadder();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1500);
}

// ---------------- NEXT ----------------
function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
    saveScore();
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
fiftyBtn.onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  let removed = 0;

  document.querySelectorAll(".answer-btn").forEach(btn => {
    if (btn.textContent !== correct && removed < 2) {
      btn.style.opacity = 0.3;
      removed++;
    }
  });
};

callBtn.onclick = () => {
  if (callUsed) return;
  callUsed = true;
  callBtn.disabled = true;
  callSound.play();

  const q = questions[current];
  callText.textContent = `🤙 Your friend thinks the answer is: "${q.correctAnswer}"`;
  callScreen.style.display = "flex";
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.disabled = true;
  audienceSound.play();

  const correct = questions[current].correctAnswer;
  let total = 100;
  let correctPercent = Math.floor(Math.random() * 30) + 40;
  let rest = total - correctPercent;

  audienceBars.forEach(bar => {
    const letter = bar.dataset.option;
    let percent;

    if (letter === correct) {
      percent = correctPercent;
    } else {
      percent = Math.floor(rest / 3);
    }

    bar.querySelector("span").textContent = percent + "%";
    bar.style.setProperty("--width", percent + "%");
    bar.classList.add("show");
  });

  audienceScreen.style.display = "block";

  setTimeout(() => {
    audienceScreen.style.display = "none";
  }, 5000);
};

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  const total = parseInt(questionCount.value);

  for (let i = total; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i * 100}`;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li => li.classList.remove("active"));

  const index = lis.length - ladderLevel;
  if (lis[index]) lis[index].classList.add("active");
}

// ---------------- SAVE SCORE ----------------
async function saveScore() {
  const user = auth.currentUser;
  if (!user) return;

  await db.collection("leaderboard").doc(user.uid).set({
    name: user.displayName || user.email,
    score,
    date: firebase.firestore.FieldValue.serverTimestamp()
  });
}
