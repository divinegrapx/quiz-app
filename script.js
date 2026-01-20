// ===== CONFIG =====
const TIME_PER_QUESTION = 20;
const TICK_SOUND = document.getElementById("tick-sound");

// ===== STATE =====
let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft;
let maxQuestions = 10;
let ladderMax = 1000;

// ===== SAMPLE QUESTIONS =====
const questions = [
  {
    q: "What is the capital of France?",
    answers: ["Berlin", "Madrid", "Paris", "Rome"],
    correct: 2,
    audience: [10, 10, 70, 10],
    friend: "I'm pretty sure it's Paris."
  },
  {
    q: "2 + 2 = ?",
    answers: ["3", "4", "5", "6"],
    correct: 1,
    audience: [5, 80, 10, 5],
    friend: "Come on, that's 4 😄"
  }
];

// ===== LOGIN =====
function login() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("game").style.display = "block";
  startGame();
}

function logout() {
  location.reload();
}

// ===== GAME SETUP =====
function startGame() {
  maxQuestions = Number(document.getElementById("questionCount").value);
  ladderMax = maxQuestions * 100;
  currentQuestion = 0;
  score = 0;
  renderLadder();
  loadQuestion();
}

// ===== LADDER =====
function renderLadder() {
  document.getElementById("ladder").innerText =
    `Prize: $${(currentQuestion) * 100} / $${ladderMax}`;
}

// ===== QUESTION =====
function loadQuestion() {
  clearInterval(timer);
  timeLeft = TIME_PER_QUESTION;
  updateTimer();

  const q = questions[currentQuestion % questions.length];
  document.getElementById("question").innerText =
    `${currentQuestion + 1}/${maxQuestions}. ${q.q}`;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  q.answers.forEach((text, index) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.innerText = text;
    btn.onclick = () => selectAnswer(btn, index, q.correct);
    answersDiv.appendChild(btn);
  });

  startTimer();
}

// ===== TIMER =====
function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 5) {
      TICK_SOUND.currentTime = 0;
      TICK_SOUND.play();
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

function updateTimer() {
  document.getElementById("time-bar").style.width =
    (timeLeft / TIME_PER_QUESTION) * 100 + "%";
}

// ===== ANSWER =====
function selectAnswer(button, index, correct) {
  clearInterval(timer);
  const buttons = document.querySelectorAll(".answer-btn");

  buttons.forEach(b => b.disabled = true);

  if (index === correct) {
    button.classList.add("correct");
    score++;
  } else {
    button.classList.add("wrong");
    buttons[correct].classList.add("correct");
  }

  setTimeout(nextQuestion, 1200);
}

// ===== NEXT =====
function nextQuestion() {
  currentQuestion++;
  renderLadder();

  if (currentQuestion >= maxQuestions) {
    alert(`Game Over! You won $${score * 100}`);
    logout();
  } else {
    loadQuestion();
  }
}

// ===== LIFELINES =====
function fiftyFifty(btn) {
  btn.disabled = true;
  const q = questions[currentQuestion % questions.length];
  const buttons = [...document.querySelectorAll(".answer-btn")];
  let removed = 0;

  buttons.forEach((b, i) => {
    if (i !== q.correct && removed < 2) {
      b.style.visibility = "hidden";
      removed++;
    }
  });
}

function callFriend(btn) {
  btn.disabled = true;
  alert(questions[currentQuestion % questions.length].friend);
}

function audienceVote(btn) {
  btn.disabled = true;
  const votes = questions[currentQuestion % questions.length].audience;
  alert(
    `Audience votes:\nA: ${votes[0]}%\nB: ${votes[1]}%\nC: ${votes[2]}%\nD: ${votes[3]}%`
  );
}
