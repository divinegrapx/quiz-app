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
const guestLoginBtn = document.getElementById("guestLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");

const startBtn = document.getElementById("startBtn");
const categoryDiv = document.getElementById("categoryDiv");

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");

const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

// SOUNDS
const introSound = document.getElementById("intro-sound");
const thinkingSound = document.getElementById("thinking-sound");
const callSound = document.getElementById("call-sound");
const audienceSound = document.getElementById("audience-sound");
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// LOGIN
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

function showSettings(){
  document.getElementById("authDiv").style.display = "none";
  categoryDiv.style.display = "block";
  introSound.play();
}

// GAME STATE
let questions = [];
let current = 0;
let ladderLevel = 0;
let timer;
let fiftyUsed = false;
let friendUsed = false;
let audienceUsed = false;

const timePerQuestion = 30;

// HELPERS
function getChecked(name){
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

// START GAME
startBtn.onclick = startQuiz;

async function startQuiz() {
  const cat = getChecked("cat");
  const diff = getChecked("diff");
  const count = getChecked("qcount");

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${count}&categories=${cat}&difficulty=${diff}`);
  questions = await res.json();

  document.getElementById("quiz-container").style.display = "block";

  fiftyUsed = friendUsed = audienceUsed = false;
  current = 0;
  ladderLevel = 0;

  buildMoneyLadder(count);
  thinkingSound.play();

  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  callFriendBox.innerHTML = "";
  audienceVote.innerHTML = "";

  const q = questions[current];
  quizDiv.innerHTML = `
    <h2 class="question-number">Question ${current + 1} of ${questions.length}</h2>
    <h2>${q.question}</h2>
  `;

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
    if (timeLeft <= 5) tickSound.play();
    if (timeLeft <= 0) nextQuestion();
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
  thinkingSound.pause();

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    ladderLevel++;
    correctSound.play();
  } else {
    wrongSound.play();
  }

  updateMoneyLadder();
  setTimeout(nextQuestion, 2000);
}

function nextQuestion() {
  current++;

  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Game Over</h2><p>You won $${ladderLevel * 100}</p>`;
    ladderLevel > 0 ? winSound.play() : loseSound.play();
    return;
  }

  thinkingSound.play();
  showQuestion();
}

// MONEY LADDER
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

// LIFELINES
fiftyBtn.onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;

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

  callSound.play();
  callFriendBox.innerHTML = `📞 Your friend says: <b>${questions[current].correctAnswer}</b>`;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;

  audienceSound.play();
  audienceVote.innerHTML = "";

  document.querySelectorAll(".option-btn").forEach(b => {
    const percent = Math.floor(Math.random() * 80) + 10;
    const div = document.createElement("div");
    div.innerHTML = `${b.textContent}: ${percent}%`;
    audienceVote.appendChild(div);
  });
};

});
