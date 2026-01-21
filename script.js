// FIREBASE
firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
});

const auth = firebase.auth();

// ELEMENTS
const startBtn = document.getElementById("startBtn");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const correctSound = document.getElementById("correctSound");
const wrongSound = document.getElementById("wrongSound");
const introSound = document.getElementById("introSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");
const tickSound = document.getElementById("tickSound");
const callSound = document.getElementById("callSound");
const audienceSound = document.getElementById("audienceSound");

// GAME STATE
let questions = [];
let current = 0;
let ladder = 0;
let timer;
let timeLeft = 30;

// START
startBtn.onclick = async () => {
  introSound.play();

  const diff = document.querySelector('input[name="difficulty"]:checked').value;
  const count = document.querySelector('input[name="count"]:checked').value;

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${count}&difficulty=${diff}`);
  questions = await res.json();

  document.getElementById("quiz-container").style.display = "block";
  buildLadder(count);
  showQuestion();
};

// QUESTION
function showQuestion() {
  clearInterval(timer);
  timeLeft = 30;
  updateTimer();

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
    updateTimer();
    if (timeLeft <= 5) tickSound.play();
    if (timeLeft <= 0) nextQuestion(false);
  }, 1000);
}

// TIMER
function updateTimer() {
  timerText.textContent = timeLeft + "s";
  timerBar.style.width = (timeLeft / 30 * 100) + "%";

  if (timeLeft > 10) timerBar.style.background = "#00ff00";
  else if (timeLeft > 5) timerBar.style.background = "#ffcc00";
  else timerBar.style.background = "#ff4d4d";
}

// CHECK
function checkAnswer(ans) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    correctSound.play();
    ladder++;
    updateLadder();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 2000);
}

// NEXT
function nextQuestion() {
  current++;

  document.getElementById("callFriendBox").innerHTML = "";
  document.getElementById("audienceVote").innerHTML = "";

  if (current >= questions.length) {
    winSound.play();
    quizDiv.innerHTML = `<h1>🎉 YOU WIN! 🎉</h1>`;
    confetti();
    return;
  }

  showQuestion();
}

// LADDER
function buildLadder(count) {
  moneyList.innerHTML = "";
  for (let i = count; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = "$" + (i * 100);
    moneyList.appendChild(li);
  }
}

function updateLadder() {
  const items = moneyList.children;
  [...items].forEach(i => i.classList.remove("current"));
  const idx = items.length - ladder;
  if (items[idx]) items[idx].classList.add("current");
}

// CONFETTI
function confetti() {
  for (let i = 0; i < 100; i++) {
    const c = document.createElement("div");
    c.style.position = "fixed";
    c.style.left = Math.random() * 100 + "vw";
    c.style.top = "-10px";
    c.style.width = "8px";
    c.style.height = "8px";
    c.style.background = "gold";
    c.style.animation = "fall 3s linear";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}
