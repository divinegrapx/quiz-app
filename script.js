document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */
  firebase.initializeApp({
    apiKey: "YOUR_KEY",
    authDomain: "YOUR_DOMAIN",
    projectId: "YOUR_PROJECT"
  });

  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ================= ELEMENTS ================= */
  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
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

  /* ================= SOUNDS ================= */
  const sounds = {
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    win: document.getElementById("win-sound"),
    tick: document.getElementById("tick-sound"),
    call: document.getElementById("call-sound"),
    audience: document.getElementById("audience-sound")
  };

  function stopAllSounds() {
    Object.values(sounds).forEach(s => {
      s.pause();
      s.currentTime = 0;
    });
  }

  function playSound(name) {
    stopAllSounds();
    if (sounds[name]) sounds[name].play();
  }

  /* ================= AUTH ================= */
  googleLoginBtn.onclick = async () => {
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      showSettings();
    } catch {
      alert("Google login failed");
    }
  };

  guestLoginBtn.onclick = () => showSettings();

  function showSettings() {
    authDiv.style.display = "none";
    categoryDiv.style.display = "block";
  }

  /* ================= GAME STATE ================= */
  let questions = [];
  let current = 0;
  let ladder = 0;
  let timer = null;

  let fiftyUsed = false;
  let friendUsed = false;
  let audienceUsed = false;

  const TOTAL_QUESTIONS = 20;
  const TIME_PER_QUESTION = 30;

  /* ================= START QUIZ ================= */
  startBtn.onclick = startQuiz;

  async function startQuiz() {
    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    const category =
      document.querySelector('input[name="category"]:checked')?.value ||
      "general_knowledge";

    const difficulty =
      document.querySelector('input[name="difficulty"]:checked')?.value ||
      "medium";

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=${TOTAL_QUESTIONS}&categories=${category}&difficulty=${difficulty}`
    );

    questions = await res.json();

    current = 0;
    ladder = 0;
    fiftyUsed = friendUsed = audienceUsed = false;

    resetLifelines();
    buildMoneyLadder();
    playSound("thinking");
    showQuestion();
  }

  /* ================= QUESTION ================= */
  function showQuestion() {
    clearInterval(timer);
    callFriendBox.innerHTML = "";
    audienceVote.innerHTML = "";

    const q = questions[current];

    quizDiv.innerHTML = `
      <h2 class="question-title">QUESTION ${current + 1} / ${TOTAL_QUESTIONS}</h2>
      <p class="question-text">${q.question}</p>
    `;

    const answers = [...q.incorrectAnswers, q.correctAnswer].sort(
      () => Math.random() - 0.5
    );

    answers.forEach(a => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = a;
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    startTimer();
  }

  /* ================= TIMER ================= */
  function startTimer() {
    let timeLeft = TIME_PER_QUESTION;
    updateTimer(timeLeft);

    timer = setInterval(() => {
      timeLeft--;
      updateTimer(timeLeft);

      if (timeLeft <= 5) playSound("tick");
      if (timeLeft <= 0) {
        clearInterval(timer);
        nextQuestion();
      }
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = `${t}s`;
    timerBar.style.width = `${(t / TIME_PER_QUESTION) * 100}%`;

    if (t > 10) timerBar.style.background = "#00ff00";
    else if (t > 5) timerBar.style.background = "#ffcc00";
    else timerBar.style.background = "#ff4d4d";
  }

  /* ================= ANSWER ================= */
  function checkAnswer(answer) {
    clearInterval(timer);
    stopAllSounds();

    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".option-btn").forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correct) btn.classList.add("correct");
      if (btn.textContent === answer && answer !== correct)
        btn.classList.add("wrong");
    });

    if (answer === correct) {
      ladder++;
      playSound("correct");
    } else {
      playSound("wrong");
    }

    updateMoneyLadder();
    setTimeout(nextQuestion, 1800);
  }

  /* ================= NEXT ================= */
  function nextQuestion() {
    current++;

    if (current >= TOTAL_QUESTIONS) {
      endGame();
      return;
    }

    playSound("thinking");
    showQuestion();
  }

  /* ================= END ================= */
  function endGame() {
    stopAllSounds();
    playSound("win");

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 CONGRATULATIONS</h1>
        <h2>You won $${ladder * 100}</h2>

        <button onclick="location.reload()">RESTART</button>
        <button onclick="firebase.auth().signOut().then(()=>location.reload())">
          LOG OUT
        </button>
      </div>
    `;
  }

  /* ================= MONEY LADDER ================= */
  function buildMoneyLadder() {
    moneyList.innerHTML = "";
    for (let i = TOTAL_QUESTIONS; i >= 1; i--) {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = `$${i * 100}`;
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    moneyList.children[moneyList.children.length - ladder]
      ?.classList.add("current");
  }

  /* ================= LIFELINES ================= */
  function resetLifelines() {
    fiftyBtn.disabled = callFriendBtn.disabled = audienceBtn.disabled = false;
    fiftyBtn.classList.remove("used");
    callFriendBtn.classList.remove("used");
    audienceBtn.classList.remove("used");
  }

  fiftyBtn.onclick = () => {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    let removed = 0;

    document.querySelectorAll(".option-btn").forEach(btn => {
      if (btn.textContent !== correct && removed < 2) {
        btn.style.opacity = "0.3";
        removed++;
      }
    });
  };

  callFriendBtn.onclick = () => {
    if (friendUsed) return;
    friendUsed = true;
    callFriendBtn.classList.add("used");

    playSound("call");
    callFriendBox.innerHTML =
      `📞 Friend suggests: <b>${questions[current].correctAnswer}</b>`;
  };

  audienceBtn.onclick = () => {
    if (audienceUsed) return;
    audienceUsed = true;
    audienceBtn.classList.add("used");

    playSound("audience");
    audienceVote.innerHTML = "";

    document.querySelectorAll(".option-btn").forEach(btn => {
      const percent = Math.floor(Math.random() * 70) + 10;
      audienceVote.innerHTML += `<div>${btn.textContent}: ${percent}%</div>`;
    });
  };

});
