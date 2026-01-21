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

// ---------------- DOM ----------------
const googleLoginBtn = document.getElementById("googleLoginBtn");
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
const soundToggle = document.getElementById("soundToggle");

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");

const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, ladderLevel = 0, timer;
let fiftyUsed = false, friendUsed = false, audienceUsed = false;
const timePerQuestion = 30;

// ---------------- LOGIN ----------------
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  document.getElementById("authDiv").style.display = "none";
  document.getElementById("categoryDiv").style.display = "block";
  showProfile(auth.currentUser);
};

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

logoutBtn.onclick = async () => {
  await auth.signOut();
  location.reload();
};

// ---------------- START QUIZ ----------------
startBtn.onclick = startQuiz;

async function startQuiz() {
  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );

  questions = await res.json();

  current = 0;
  score = 0;
  ladderLevel = 0;
  fiftyUsed = friendUsed = audienceUsed = false;

  fiftyBtn.classList.remove("used");
  callFriendBtn.classList.remove("used");
  audienceBtn.classList.remove("used");

  buildMoneyLadder(questionCount.value);
  document.getElementById("quiz-container").style.display = "block";
  showQuestion();
}

// ---------------- QUESTIONS ----------------
function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;
  updateTimer(timeLeft);

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

  timer = setInterval(() => {
    timeLeft--;
    updateTimer(timeLeft);
    if (timeLeft <= 5 && soundToggle.value === "on") tickSound.play();
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

function updateTimer(t) {
  timerText.textContent = t + "s";
  timerBar.style.width = (t / timePerQuestion * 100) + "%";
}

function checkAnswer(ans) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    score++;
    ladderLevel++;
    updateMoneyLadder();
    if (soundToggle.value === "on") correctSound.play();
  } else {
    if (soundToggle.value === "on") wrongSound.play();
  }

  setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2 class="result-win">You Finished!</h2><p>Score: ${score}</p>`;
    return;
  }
  showQuestion();
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(count) {
  moneyList.innerHTML = "";
  for (let i = count; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = "$" + (i * 100);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  const idx = moneyList.children.length - ladderLevel;
  if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}

// ---------------- LIFELINES ----------------
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

  callFriendBox.innerHTML = `
    <div class="phone-anim">📞</div>
    <p>Your friend thinks the answer is:</p>
    <b>${questions[current].correctAnswer}</b>
  `;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.classList.add("used");

  const correct = questions[current].correctAnswer;
  audienceVote.innerHTML = "";

  document.querySelectorAll(".option-btn").forEach(b => {
    const percent = b.textContent === correct ? 60 + Math.random() * 20 : Math.random() * 30;

    const div = document.createElement("div");
    div.className = "vote-bar";
    div.innerHTML = `
      <span>${b.textContent}</span>
      <div class="bar" style="width:${percent}%"></div>
    `;
    audienceVote.appendChild(div);
  });
};

// ---------------- PROFILE ----------------
function showProfile(user) {
  document.getElementById("profileDiv").innerHTML =
    `<img src="${user.photoURL}"><h3>${user.displayName}</h3>`;
}
