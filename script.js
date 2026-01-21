const startBtn = document.getElementById("startBtn");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");

const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const introSound = document.getElementById("intro-sound");
const thinkingSound = document.getElementById("thinking-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const callSound = document.getElementById("call-sound");
const audienceSound = document.getElementById("audience-sound");
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");

let questions = [], current = 0, timer;
let fiftyUsed = false, friendUsed = false, audienceUsed = false;
const timePerQuestion = 30;

startBtn.onclick = startQuiz;

async function startQuiz() {
  const difficulty = document.querySelector("input[name='difficulty']:checked").value;
  const count = document.querySelector("input[name='count']:checked").value;

  introSound.play();

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${count}&difficulty=${difficulty}`);
  questions = await res.json();

  current = 0;
  fiftyUsed = friendUsed = audienceUsed = false;

  document.getElementById("settingsDiv").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  buildMoneyLadder(count);
  showQuestion();
}

function showQuestion() {
  clearInterval(timer);
  callFriendBox.innerHTML = "";
  audienceVote.innerHTML = "";

  let timeLeft = timePerQuestion;
  updateTimer(timeLeft);
  thinkingSound.currentTime = 0;
  thinkingSound.play();

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
    if (timeLeft <= 0) {
      clearInterval(timer);
      loseGame();
    }
  }, 1000);
}

function updateTimer(t) {
  timerText.textContent = t + "s";
  timerBar.style.width = (t / timePerQuestion * 100) + "%";

  if (t > 10) timerBar.style.background = "#00ff00";
  else if (t > 5) timerBar.style.background = "#ffcc00";
  else timerBar.style.background = "#ff0000";
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
    correctSound.play();
    current++;
    updateMoneyLadder();
    setTimeout(nextQuestion, 1500);
  } else {
    wrongSound.play();
    loseGame();
  }
}

function nextQuestion() {
  if (current >= questions.length) {
    winGame();
  } else {
    showQuestion();
  }
}

function loseGame() {
  loseSound.play();
  quizDiv.innerHTML = "<h2>You Lost!</h2>";
}

function winGame() {
  winSound.play();
  quizDiv.innerHTML = "<h2>YOU ARE A MILLIONAIRE!</h2>";
  launchConfetti();
}

function buildMoneyLadder(count) {
  moneyList.innerHTML = "";
  for (let i = count; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = "$" + (i * 100);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const items = moneyList.children;
  for (let li of items) li.classList.remove("current");
  const idx = items.length - current;
  if (items[idx]) items[idx].classList.add("current");
}

/* LIFELINES */
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
  callFriendBox.innerHTML = `
    <div class="phone-ui">
      <p>📞 Calling...</p>
      <h3>Friend says:</h3>
      <b>${questions[current].correctAnswer}</b>
    </div>
  `;
};

audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceSound.play();
  audienceVote.innerHTML = "";

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    const percent = b.textContent === correct ? 60 + Math.random() * 20 : Math.random() * 30;
    const div = document.createElement("div");
    div.className = "vote-bar";
    div.innerHTML = `<span>${b.textContent}</span><div class="bar" style="width:${percent}%"></div>`;
    audienceVote.appendChild(div);
  });
};

/* CONFETTI */
function launchConfetti() {
  for (let i = 0; i < 100; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDuration = 2 + Math.random() * 2 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}
