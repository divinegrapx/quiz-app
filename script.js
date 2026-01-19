document.addEventListener("DOMContentLoaded", () => {

  // 🔥 FIREBASE
  const auth = firebase.auth();

  // 🔥 ELEMENTS
  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizWrap = document.getElementById("quiz-and-ladder");
  const quizDiv = document.getElementById("quiz");
  const ladderDiv = document.getElementById("ladder");

  const lifelines = document.getElementById("lifelines");
  const timerContainer = document.getElementById("timer-container");
  const timeBar = document.getElementById("time-bar");
  const hintBox = document.getElementById("hint-box");

  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const hintBtn = document.getElementById("hintBtn");

  // 🧠 STATE
  let questions = [];
  let current = 0;
  let timer;
  let timeLeft = 30;
  let fiftyUsed = false;
  let hintUsed = false;

  // 🛑 FORCE HIDE QUIZ UI AT START
  quizWrap.style.display = "none";
  lifelines.style.display = "none";
  timerContainer.style.display = "none";
  hintBox.style.display = "none";
  categoryDiv.style.display = "none";

  // 🔐 LOGIN BUTTON
  loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!email || !pass) {
      alert("Enter email and password");
      return;
    }

    auth.signInWithEmailAndPassword(email, pass)
      .then(() => {
        authDiv.style.display = "none";
        categoryDiv.style.display = "block";
      })
      .catch(err => alert(err.message));
  });

  // ▶ START QUIZ (call from category button)
  window.startQuiz = function () {
    categoryDiv.style.display = "none";
    quizWrap.style.display = "flex";
    lifelines.style.display = "flex";
    timerContainer.style.display = "block";

    current = 0;
    fiftyUsed = false;
    hintUsed = false;

    fiftyBtn.disabled = false;
    hintBtn.disabled = false;

    loadQuestions();
    buildMoneyLadder();
    showQuestion();
  };

  // ❓ QUESTIONS
  function loadQuestions() {
    questions = [
      {
        q: "What is the capital of France?",
        a: ["Paris", "Rome", "Berlin", "Madrid"],
        c: 0,
        hint: "City of love 🗼"
      },
      {
        q: "2 + 2 = ?",
        a: ["3", "4", "5", "6"],
        c: 1,
        hint: "Basic math"
      }
    ];
  }

  function showQuestion() {
    resetTimer();
    hintBox.style.display = "none";

    const q = questions[current];
    quizDiv.innerHTML = `
      <h2>${q.q}</h2>
      ${q.a.map((ans, i) =>
        `<button onclick="answer(${i})">${ans}</button>`
      ).join("<br>")}
    `;
  }

  // ✅ ANSWER
  window.answer = function (i) {
    clearInterval(timer);
    if (i === questions[current].c) {
      current++;
      if (current >= questions.length) finishQuiz();
      else showQuestion();
    } else {
      finishQuiz();
    }
  };

  // ⏱ TIMER
  function resetTimer() {
    clearInterval(timer);
    timeLeft = 30;
    timeBar.style.width = "100%";

    timer = setInterval(() => {
      timeLeft--;
      timeBar.style.width = (timeLeft / 30) * 100 + "%";

      if (timeLeft <= 5) new Audio("tick.mp3").play();

      if (timeLeft <= 0) {
        clearInterval(timer);
        finishQuiz();
      }
    }, 1000);
  }

  // 🆘 LIFELINES
  fiftyBtn.addEventListener("click", () => {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.disabled = true;

    const q = questions[current];
    let removed = 0;

    document.querySelectorAll("#quiz button").forEach((btn, i) => {
      if (i !== q.c && removed < 2) {
        btn.style.display = "none";
        removed++;
      }
    });
  });

  hintBtn.addEventListener("click", () => {
    if (hintUsed) return;
    hintUsed = true;
    hintBtn.disabled = true;

    hintBox.textContent = "💡 " + questions[current].hint;
    hintBox.style.display = "block";
  });

  // 💰 MONEY LADDER
  function buildMoneyLadder() {
    ladderDiv.innerHTML = "";
    questions.forEach((_, i) => {
      ladderDiv.innerHTML += `<div>$${(i + 1) * 100}</div>`;
    });
  }

  // 🏁 FINISH + LOGOUT
  function finishQuiz() {
    clearInterval(timer);
    quizDiv.innerHTML = `
      <h2>Quiz Finished</h2>
      <button onclick="logout()">Logout</button>
    `;
  }

  window.logout = function () {
    auth.signOut().then(() => {
      authDiv.style.display = "block";
      quizWrap.style.display = "none";
      lifelines.style.display = "none";
      timerContainer.style.display = "none";
      hintBox.style.display = "none";
    });
  };

});
