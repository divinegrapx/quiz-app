document.addEventListener("DOMContentLoaded", () => {

const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ELEMENTS
const googleLoginBtn = document.getElementById("googleLoginBtn");
const guestLoginBtn = document.getElementById("guestLoginBtn");
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
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");

// LOGIN
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};

guestLoginBtn.onclick = showSettings;

function showSettings(){
  document.getElementById("authDiv").style.display = "none";
  categoryDiv.style.display = "block";
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

// START GAME
startBtn.onclick = startQuiz;

async function startQuiz() {
  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
  questions = await res.json();

  document.getElementById("categoryDiv").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  fiftyUsed = friendUsed = audienceUsed = false;
  current = 0;
  ladderLevel = 0;

  buildMoneyLadder();
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  updateTimer(timeLeft);

  callFriendBox.innerHTML = "";
  audienceVote.innerHTML = "";

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Question ${current + 1}/${questions.length}</h2><p>${q.question}</p>`;

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

  if (ans === correct) {
    ladderLevel++;
    if(soundToggle.value === "on") correctSound.play();
  } else {
    if(soundToggle.value === "on") wrongSound.play();
  }

  updateMoneyLadder();
  setTimeout(nextQuestion, 2000);
}

function nextQuestion() {
  current++;

  if (current >= questions.length) {
    endGame();
    return;
  }

  showQuestion();
}

// MONEY LADDER BUTTONS
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  for (let i = questionCount.value; i >= 1; i--) {
    const btn = document.createElement("button");
    btn.className = "ladder-btn";
    btn.textContent = "$" + (i * 100);
    moneyList.appendChild(btn);
  }
}

function updateMoneyLadder() {
  document.querySelectorAll(".ladder-btn").forEach(b => b.classList.remove("current"));
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

  callFriendBox.innerHTML = `
    <div class="phone-ui">
      📞 Friend says:<br><b>${questions[current].correctAnswer}</b>
    </div>`;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;

  audienceVote.innerHTML = "";

  document.querySelectorAll(".option-btn").forEach(b => {
    const percent = Math.floor(Math.random() * 80) + 10;
    const bar = document.createElement("div");
    bar.className = "vote-bar";
    bar.style.width = percent + "%";
    bar.textContent = b.textContent + " " + percent + "%";
    audienceVote.appendChild(bar);
  });
};

// END GAME
function endGame() {
  document.getElementById("quiz-container").style.display = "none";

  const container = document.querySelector(".container");

  container.innerHTML = `
    <div class="final-screen">
      <h1>CONGRATULATIONS 🎉</h1>
      <h2>You won $${ladderLevel * 100}</h2>
      <button onclick="location.reload()">Play Again</button>
      <button onclick="shareScore()">Share Score</button>
    </div>
  `;

  if(soundToggle.value === "on"){
    ladderLevel > 0 ? winSound.play() : loseSound.play();
  }

  confetti();
}

// SHARE
window.shareScore = function(){
  const text = `I won $${ladderLevel * 100} on NEON MILLIONAIRE 💰🔥`;
  navigator.share ? navigator.share({ text }) : alert(text);
};

// CONFETTI
function confetti(){
  for(let i=0;i<100;i++){
    const c=document.createElement("div");
    c.style.position="fixed";
    c.style.width="6px";
    c.style.height="6px";
    c.style.background="gold";
    c.style.left=Math.random()*100+"vw";
    c.style.top="-10px";
    c.style.animation="fall 2s linear";
    document.body.appendChild(c);
    setTimeout(()=>c.remove(),2000);
  }
}

});
