// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ===== DOM =====
const $ = id => document.getElementById(id);

const authDiv = $("authDiv");
const emailDiv = $("emailDiv");
const logoutDiv = $("logoutDiv");
const categoryDiv = $("categoryDiv");
const quizContainer = $("quiz-container");
const quizDiv = $("quiz");
const moneyList = $("money-list");
const lifelineResult = $("lifeline-result");

const emailInput = $("emailInput");
const passwordInput = $("passwordInput");

const googleLoginBtn = $("googleLoginBtn");
const facebookLoginBtn = $("facebookLoginBtn");
const emailRegisterBtn = $("emailRegisterBtn");
const emailLoginBtn = $("emailLoginBtn");
const emailRegisterSubmitBtn = $("emailRegisterSubmitBtn");
const emailCancelBtn = $("emailCancelBtn");
const logoutBtn = $("logoutBtn");

const startBtn = $("startBtn");
const questionCount = $("questionCount");
const categorySelect = $("categorySelect");

const fiftyBtn = $("fiftyBtn");
const callBtn = $("callBtn");
const audienceBtn = $("audienceBtn");

const timerBar = $("timer-bar");
const timerText = $("timer-text");

const correctSound = $("correct-sound");
const wrongSound = $("wrong-sound");
const tickSound = $("tick-sound");

// ===== STATE =====
let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 20;

// ===== AUTH =====
googleLoginBtn.onclick = () =>
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());

facebookLoginBtn.onclick = () =>
  auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());

emailRegisterBtn.onclick = () => {
  authDiv.style.display = "none";
  emailDiv.style.display = "block";
};

emailCancelBtn.onclick = () => {
  emailDiv.style.display = "none";
  authDiv.style.display = "block";
};

emailLoginBtn.onclick = () =>
  auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);

emailRegisterSubmitBtn.onclick = () =>
  auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);

logoutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  authDiv.style.display = user ? "none" : "block";
  categoryDiv.style.display = user ? "block" : "none";
  logoutDiv.style.display = user ? "block" : "none";
  quizContainer.style.display = "none";
});

// ===== QUIZ =====
startBtn.onclick = async () => {
  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";
  current = score = 0;

  buildMoney();

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`
  );
  questions = await res.json();
  showQuestion();
};

function showQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  lifelineResult.textContent = "";
  [fiftyBtn, callBtn, audienceBtn].forEach(b => b.disabled = false);

  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  shuffle([...q.incorrectAnswers, q.correctAnswer]).forEach(a => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = a;
    btn.onclick = () => checkAnswer(btn, a === q.correctAnswer);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 5) tickSound.play();
    if (timeLeft === 0) next();
  }, 1000);
}

function updateTimer() {
  timerText.textContent = timeLeft + "s";
  timerBar.style.width = (timeLeft / 20 * 100) + "%";
  timerBar.style.background = timeLeft > 5 ? "#00ff00" : "#ff4d4d";
}

function checkAnswer(btn, correct) {
  clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);

  if (correct) {
    score++;
    btn.classList.add("correct");
    correctSound.play();
  } else {
    btn.classList.add("wrong");
    wrongSound.play();
  }

  setTimeout(next, 1500);
}

function next() {
  current++;
  updateMoney();
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}</p>`;
    return;
  }
  showQuestion();
}

// ===== LIFELINES =====
fiftyBtn.onclick = () => {
  document.querySelectorAll(".option-btn")
    .forEach(b => b.textContent !== questions[current].correctAnswer && (b.disabled = Math.random() < 0.5));
  fiftyBtn.disabled = true;
};

callBtn.onclick = () => {
  lifelineResult.textContent =
    Math.random() < 0.8
      ? `Friend thinks: ${questions[current].correctAnswer}`
      : `Friend unsure… maybe ${questions[current].incorrectAnswers[0]}`;
  callBtn.disabled = true;
};

audienceBtn.onclick = () => {
  lifelineResult.innerHTML = questions[current].incorrectAnswers
    .concat(questions[current].correctAnswer)
    .map(a => `${a}: ${Math.floor(Math.random()*30 + (a === questions[current].correctAnswer ? 40 : 5))}%`)
    .join("<br>");
  audienceBtn.disabled = true;
};

// ===== MONEY =====
function buildMoney() {
  moneyList.innerHTML = "";
  for (let i = 1; i <= questionCount.value; i++) {
    const li = document.createElement("li");
    li.textContent = `$${i * 100}`;
    moneyList.appendChild(li);
  }
}

function updateMoney() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  moneyList.children[current - 1]?.classList.add("current");
}

// ===== UTIL =====
const shuffle = arr => arr.sort(() => Math.random() - 0.5);
