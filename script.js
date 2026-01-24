document.addEventListener("DOMContentLoaded", () => {

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

  /* ================= ELEMENTS ================= */
  const quizDiv = document.getElementById("quiz");
  const moneyList = document.getElementById("money-list");
  const leaderboardList = document.getElementById("leaderboard-list");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const secondChanceBtn = document.getElementById("secondChanceBtn");

  /* ================= STATE ================= */
  let questions = [];
  let current = 0;
  let score = 0;
  let ladderLevel = 0;

  let secondChanceActive = false;
  let secondChanceUsed = false;
  let fiftyUsed = false;

  /* ================= MONEY LADDER ================= */
  function buildMoneyLadder() {
    moneyList.innerHTML = "";
    for (let i = 20; i >= 1; i--) {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + (i * 100);
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const index = moneyList.children.length - ladderLevel;
    if (moneyList.children[index]) {
      moneyList.children[index].classList.add("current");
    }
  }

  /* ================= START QUIZ ================= */
  async function startQuiz() {
    const res = await fetch("https://the-trivia-api.com/api/questions?limit=20");
    questions = await res.json();

    current = 0;
    score = 0;
    ladderLevel = 0;
    secondChanceActive = false;
    secondChanceUsed = false;
    fiftyUsed = false;

    buildMoneyLadder();
    showQuestion();
  }

  /* ================= QUESTION ================= */
  function showQuestion() {
    quizDiv.innerHTML = "";

    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    const answers = [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5);

    answers.forEach(ans => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = ans;
      btn.onclick = () => handleAnswer(btn, ans);
      quizDiv.appendChild(btn);
    });
  }

  /* ================= ANSWERS ================= */
  function handleAnswer(btn, answer) {
    const correct = questions[current].correctAnswer;
    const buttons = document.querySelectorAll(".option-btn");

    buttons.forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
    });

    if (answer === correct) {
      btn.classList.add("correct");
      score += 100;
      ladderLevel++;
      updateMoneyLadder();
      nextQuestion();
    } else {
      btn.classList.add("wrong");

      if (secondChanceActive) {
        secondChanceActive = false;
        return; // forgiven, NO game over
      }

      score = Math.max(0, score - 100);
      nextQuestion(); // continue game
    }
  }

  function nextQuestion() {
    setTimeout(() => {
      current++;
      if (current >= questions.length) endGame();
      else showQuestion();
    }, 1200);
  }

  /* ================= LIFELINES ================= */
  fiftyBtn.onclick = () => {
    if (fiftyUsed || score < 100) return;
    score -= 100;
    fiftyUsed = true;
    fiftyBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    let removed = 0;
    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed < 2) {
        b.style.opacity = 0.25;
        removed++;
      }
    });
  };

  secondChanceBtn.onclick = () => {
    if (secondChanceUsed || score < 200) return;
    score -= 200;
    secondChanceActive = true;
    secondChanceUsed = true;
    secondChanceBtn.classList.add("used");
  };

  /* ================= LEADERBOARD ================= */
  async function saveScore() {
    const user = auth.currentUser;
    if (!user) return;

    const ref = db.collection("leaderboard").doc(user.uid);
    const doc = await ref.get();

    const total = doc.exists ? doc.data().total + score : score;
    const games = doc.exists ? doc.data().games + 1 : 1;

    await ref.set({
      name: user.displayName || "Guest",
      total,
      games
    });
  }

  async function loadLeaderboard() {
    leaderboardList.innerHTML = "";
    const snap = await db.collection("leaderboard")
      .orderBy("total", "desc")
      .limit(10)
      .get();

    snap.forEach(doc => {
      const li = document.createElement("li");
      li.textContent = `${doc.data().name} — $${doc.data().total}`;
      leaderboardList.appendChild(li);
    });
  }

  /* ================= END ================= */
  async function endGame() {
    await saveScore();
    await loadLeaderboard();

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 Finished</h1>
        <h2>Total: $${score}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

  /* AUTO START FOR TESTING */
  startQuiz();
});
