document.addEventListener("DOMContentLoaded", () => {

  /* ================= UI NAV ================= */

  function showSettings() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("emailDiv").style.display = "none";
    document.getElementById("categoryDiv").style.display = "block";
  }

  function showQuiz() {
    document.getElementById("categoryDiv").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
  }

  /* ================= FIREBASE ================= */

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
  const db = firebase.firestore();

  /* ================= AUTH ================= */

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");

  const emailDiv = document.getElementById("emailDiv");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");

  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  googleLoginBtn.onclick = async () => {
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      showSettings();
    } catch (e) {
      alert(e.message);
    }
  };

  guestLoginBtn.onclick = () => showSettings();

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    try {
      await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
      showSettings();
    } catch (e) {
      alert(e.message);
    }
  };

  emailRegisterSubmitBtn.onclick = async () => {
    try {
      await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
      showSettings();
    } catch (e) {
      alert(e.message);
    }
  };

  /* ================= ELEMENTS ================= */

  const quizDiv = document.getElementById("quiz");
  const moneyList = document.getElementById("money-list");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const leaderboardList = document.getElementById("leaderboard-list");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");
  const modeSelect = document.getElementById("modeSelect");

  /* ================= SOUNDS ================= */

  const sounds = {
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    win: document.getElementById("win-sound"),
    lose: document.getElementById("lose-sound"),
    tick: document.getElementById("tick-sound")
  };

  let soundEnabled = true;

  /* ================= GAME STATE ================= */

  const MONEY = [
    100, 200, 300, 500, 1000,
    2000, 4000, 8000, 16000, 32000,
    64000, 125000, 250000, 500000, 1000000
  ];

  const SAFE_LEVELS = { 4: 1000, 9: 32000 };

  let questions = [];
  let current = 0;
  let timer;
  let timePerQuestion = 30;
  let answeringLocked = false;

  let fiftyUsed = false;
  let friendUsed = false;
  let audienceUsed = false;

  /* ================= START ================= */

  document.getElementById("startBtn").onclick = startQuiz;

  async function startQuiz() {
    soundEnabled = soundToggle.value === "on";
    timePerQuestion = modeSelect.value === "hardcore" ? 20 : 30;

    if (modeSelect.value === "hardcore") {
      fiftyBtn.disabled = callFriendBtn.disabled = audienceBtn.disabled = true;
    }

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
    );

    questions = await res.json();
    showQuiz();
    buildMoneyLadder();
    showQuestion();
  }

  /* ================= QUESTIONS ================= */

  function showQuestion() {
    answeringLocked = false;
    clearInterval(timer);

    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    const answers = [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5);

    answers.forEach(ans => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = ans;
      btn.onclick = () => checkAnswer(ans);
      quizDiv.appendChild(btn);
    });

    startTimer();
  }

  function startTimer() {
    let t = timePerQuestion;
    updateTimer(t);

    timer = setInterval(() => {
      t--;
      updateTimer(t);

      if (t <= 5 && soundEnabled) sounds.tick.play();
      if (t <= 0) gameOver();
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = `${t}s`;
    timerBar.style.width = `${(t / timePerQuestion) * 100}%`;
  }

  /* ================= ANSWERS ================= */

  function checkAnswer(ans) {
    if (answeringLocked) return;
    answeringLocked = true;
    clearInterval(timer);

    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
    });

    if (ans === correct) {
      if (soundEnabled) sounds.correct.play();
      current++;
      updateMoneyLadder();

      if (current === MONEY.length) return winGame();
      setTimeout(showQuestion, 1800);
    } else {
      if (soundEnabled) sounds.wrong.play();
      setTimeout(gameOver, 1800);
    }
  }

  /* ================= END ================= */

  function gameOver() {
    clearInterval(timer);

    let won = 0;
    if (SAFE_LEVELS[current - 1]) won = SAFE_LEVELS[current - 1];

    saveScore(won);

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>❌ GAME OVER</h1>
        <h2>You won $${won.toLocaleString()}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>`;
  }

  function winGame() {
    saveScore(1000000);

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🏆 MILLIONAIRE!</h1>
        <h2>$1,000,000</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>`;
  }

  /* ================= MONEY ================= */

  function buildMoneyLadder() {
    moneyList.innerHTML = "";
    MONEY.slice().reverse().forEach(v => {
      const li = document.createElement("li");
      li.textContent = `$${v.toLocaleString()}`;
      moneyList.appendChild(li);
    });
    updateMoneyLadder();
  }

  function updateMoneyLadder() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const idx = MONEY.length - current - 1;
    if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
  }

  /* ================= LIFELINES ================= */

  fiftyBtn.onclick = () => {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    let removed = 0;

    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed < 2) {
        b.disabled = true;
        b.style.visibility = "hidden";
        removed++;
      }
    });
  };

  callFriendBtn.onclick = () => {
    if (friendUsed) return;
    friendUsed = true;
    callFriendBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    alert("📞 Friend thinks the answer is: " + correct);
  };

  audienceBtn.onclick = () => {
    if (audienceUsed) return;
    audienceUsed = true;
    audienceBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    alert("📊 Audience strongly favors: " + correct);
  };

  /* ================= LEADERBOARD ================= */

  function saveScore(score) {
    const user = auth.currentUser;

    db.collection("scores").add({
      name: user?.displayName || "Guest",
      score,
      created: firebase.firestore.FieldValue.serverTimestamp()
    }).then(loadLeaderboard);
  }

  function loadLeaderboard() {
    leaderboardList.innerHTML = "<h3>🏆 Top 10</h3>";

    db.collection("scores")
      .orderBy("score", "desc")
      .limit(10)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          const li = document.createElement("li");
          li.textContent = `${doc.data().name} — $${doc.data().score.toLocaleString()}`;
          leaderboardList.appendChild(li);
        });
      });
  }

  loadLeaderboard();

});
