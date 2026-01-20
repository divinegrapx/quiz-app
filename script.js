document.addEventListener("DOMContentLoaded", () => {

  console.log("SCRIPT LOADED");

  const quizDiv = document.getElementById("quiz");
  const startBtn = document.getElementById("startBtn");
  const skipLoginBtn = document.getElementById("skipLoginBtn");

  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");

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
  const friendAnswer = document.getElementById("friendAnswer");

  const audienceScreen = document.getElementById("audienceScreen");
  const audienceBars = document.querySelectorAll(".audience-bar");

  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");
  const tickSound = document.getElementById("tick-sound");
  const callSound = document.getElementById("call-sound");
  const audienceSound = document.getElementById("audience-sound");

  let questions = [];
  let current = 0;
  let score = 0;
  let timer;
  let timeLeft = 30;
  let ladderLevel = 0;

  let fiftyUsed = false;
  let callUsed = false;
  let audienceUsed = false;

  skipLoginBtn.onclick = () => {
    authDiv.style.display = "none";
    categoryDiv.style.display = "block";
  };

  startBtn.onclick = startQuiz;

  async function startQuiz() {
    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    current = 0;
    score = 0;
    ladderLevel = 0;

    fiftyUsed = callUsed = audienceUsed = false;
    fiftyBtn.disabled = callBtn.disabled = audienceBtn.disabled = false;

    buildMoneyLadder();

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
    );

    questions = await res.json();
    showQuestion();
  }

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
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    timer = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 5 && timeLeft > 0) tickSound.play();
      if (timeLeft <= 0) nextQuestion();
    }, 1000);
  }

  function updateTimer() {
    timerText.textContent = `${timeLeft}s`;
    timerBar.style.width = (timeLeft / 30 * 100) + "%";
  }

  function checkAnswer(answer) {
    clearInterval(timer);
    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".answer-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === answer && answer !== correct) b.classList.add("wrong");
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

  function nextQuestion() {
    current++;
    if (current >= questions.length) {
      quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
      return;
    }
    showQuestion();
  }

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

    friendAnswer.textContent = `Your friend thinks the answer is: "${questions[current].correctAnswer}"`;
    callScreen.style.display = "flex";
  };

  audienceBtn.onclick = () => {
    if (audienceUsed) return;
    audienceUsed = true;
    audienceBtn.disabled = true;
    audienceSound.play();

    const correct = questions[current].correctAnswer;
    let correctPercent = Math.floor(Math.random() * 30) + 40;
    let rest = 100 - correctPercent;

    audienceBars.forEach(bar => {
      const option = bar.textContent.trim()[0];
      let percent = option === correct ? correctPercent : Math.floor(rest / 3);
      bar.querySelector("span").textContent = percent + "%";
      bar.style.setProperty("--width", percent + "%");
    });

    audienceScreen.style.display = "flex";

    setTimeout(() => {
      audienceScreen.style.display = "none";
    }, 5000);
  };

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

});
