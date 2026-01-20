/***********************
  GLOBAL STATE
************************/
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;

let fiftyUsed = false;
let callFriendUsed = false;
let askAudienceUsed = false;

const tickSound = document.getElementById("tick-sound");

const questions = [
  {
    question: "What is the capital of France?",
    answers: ["Paris", "Berlin", "Rome", "Madrid"],
    correct: "Paris"
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: ["Earth", "Mars", "Jupiter", "Venus"],
    correct: "Mars"
  },
  {
    question: "Who painted the Mona Lisa?",
    answers: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
    correct: "Da Vinci"
  }
];

/***********************
  INIT
************************/
startGame();

function startGame() {
  currentQuestionIndex = 0;
  score = 0;
  fiftyUsed = false;
  callFriendUsed = false;
  askAudienceUsed = false;

  document.getElementById("fiftyBtn").disabled = false;
  document.getElementById("callFriendBtn").disabled = false;
  document.getElementById("askAudienceBtn").disabled = false;

  renderQuestion();
}

/***********************
  QUESTION RENDER
************************/
function renderQuestion() {
  resetTimer();

  const q = questions[currentQuestionIndex];
  document.getElementById("question").innerText =
    `Question ${currentQuestionIndex + 1} / ${questions.length}\n${q.question}`;

  const answersEl = document.getElementById("answers");
  answersEl.innerHTML = "";

  q.answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.innerText = answer;
    btn.onclick = () => selectAnswer(btn, answer);
    answersEl.appendChild(btn);
  });

  startTimer();
}

/***********************
  ANSWER SELECTION
************************/
function selectAnswer(button, selected) {
  stopTimer();

  const correct = questions[currentQuestionIndex].correct;
  const buttons = document.querySelectorAll(".answer-btn");

  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.innerText === correct) {
      btn.classList.add("correct");
    }
    if (btn.innerText === selected && selected !== correct) {
      btn.classList.add("wrong");
    }
  });

  if (selected === correct) {
    score += 100;
  }

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      alert("Game finished! Score: $" + score);
    }
  }, 1500);
}

/***********************
  TIMER
************************/
function startTimer() {
  timeLeft = 30;
  updateTimerUI();

  timer = setInterval(() => {
    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 5) {
      tickSound.currentTime = 0;
      tickSound.play();
    }

    if (timeLeft <= 0) {
      stopTimer();
      autoFail();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function resetTimer() {
  stopTimer();
}

function updateTimerUI() {
  document.getElementById("time").innerText = timeLeft;
  document.getElementById("time-bar").style.width = `${(timeLeft / 30) * 100}%`;
}

function autoFail() {
  const buttons = document.querySelectorAll(".answer-btn");
  const correct = questions[currentQuestionIndex].correct;

  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.innerText === correct) {
      btn.classList.add("correct");
    }
  });

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    }
  }, 1500);
}

/***********************
  50:50
************************/
document.getElementById("fiftyBtn").onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;
  document.getElementById("fiftyBtn").disabled = true;

  const q = questions[currentQuestionIndex];
  const wrong = q.answers.filter(a => a !== q.correct);
  const remove = wrong.sort(() => 0.5 - Math.random()).slice(0, 2);

  document.querySelectorAll(".answer-btn").forEach(btn => {
    if (remove.includes(btn.innerText)) {
      btn.style.visibility = "hidden";
    }
  });
};

/***********************
  CALL A FRIEND
************************/
document.getElementById("callFriendBtn").onclick = () => {
  if (callFriendUsed) return;
  callFriendUsed = true;
  document.getElementById("callFriendBtn").disabled = true;

  const q = questions[currentQuestionIndex];
  const chance = Math.random() < 0.7 ? q.correct :
    q.answers.filter(a => a !== q.correct)[0];

  openModal("📞 Call a Friend",
    `"I’m not 100% sure, but I believe the answer is <b>${chance}</b>."`);
};

/***********************
  ASK AUDIENCE
************************/
document.getElementById("askAudienceBtn").onclick = () => {
  if (askAudienceUsed) return;
  askAudienceUsed = true;
  document.getElementById("askAudienceBtn").disabled = true;

  const q = questions[currentQuestionIndex];
  let remaining = 100;
  let results = {};

  q.answers.forEach(a => {
    if (a === q.correct) {
      results[a] = Math.floor(50 + Math.random() * 25);
      remaining -= results[a];
    }
  });

  q.answers.filter(a => a !== q.correct).forEach((a, i, arr) => {
    results[a] = i === arr.length - 1 ? remaining : Math.floor(Math.random() * remaining);
    remaining -= results[a];
  });

  let html = "";
  q.answers.forEach(a => {
    html += `
      <div>${a}</div>
      <div class="audience-bar">
        <div class="audience-fill" style="width:${results[a]}%">
          ${results[a]}%
        </div>
      </div>`;
  });

  openModal("👥 Ask the Audience", html);
};

/***********************
  MODAL
************************/
function openModal(title, body) {
  document.getElementById("modalTitle").innerHTML = title;
  document.getElementById("modalBody").innerHTML = body;
  document.getElementById("lifelineModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("lifelineModal").classList.add("hidden");
}
