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

// ELEMENTS
const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");

const startBtn = document.getElementById("startBtn");
const categoryDiv = document.getElementById("categoryDiv");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const questionCount = document.getElementById("questionCount");
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

// LOGIN
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  document.getElementById("authDiv").style.display = "none";
  categoryDiv.style.display = "block";
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

// GAME STATE
let questions = [];
let current = 0;
let score = 0;
let ladderLevel = 0;
let timer;
const timePerQuestion = 30;

startBtn.onclick = startQuiz;

async function startQuiz() {
  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
  questions = await res.json();

  document.getElementById("quiz-container").style.display = "block";
  buildMoneyLadder();
  current = 0;
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  updateTimer(timeLeft);

  callFriendBox.innerHTML = "";
  audienceVote.innerHTML = "";

  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

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

  if (t > 10) timerBar.style.background = "#00ff00";
  else if (t > 5) timerBar.style.background = "#ffcc00";
  else timerBar.style.background = "#ff4d4d";
}

function checkAnswer(ans) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct && soundToggle.value === "on") correctSound.play();
  if (ans !== correct && soundToggle.value === "on") wrongSound.play();

  ladderLevel++;
  updateMoneyLadder();

  setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${ladderLevel}</p>`;
    return;
  }
  showQuestion();
}

function buildMoneyLadder() {
  moneyList.innerHTML = "";
  for (let i = questionCount.value; i >= 1; i--) {
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

// LIFELINES
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
  callFriendBox.innerHTML = `📞 Your friend suggests: <b>${questions[current].correctAnswer}</b>`;
};

audienceBtn.onclick = () => {
  audienceVote.innerHTML = "";
  document.querySelectorAll(".option-btn").forEach(b => {
    const percent = Math.floor(Math.random() * 80) + 10;
    const div = document.createElement("div");
    div.innerHTML = `${b.textContent}: ${percent}%`;
    audienceVote.appendChild(div);
  });
};

});
