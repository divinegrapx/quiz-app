document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE CONFIG ================= */
  const firebaseConfig = {
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app",
    storageBucket: "neon-quiz-app.firebasestorage.app",
    messagingSenderId: "891061147021",
    appId: "1:891061147021:web:7b3d80020f642da7b699c4"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ================= DOM ================= */
  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const startBtn = document.getElementById("startBtn");
  const categorySelect = document.getElementById("categorySelect");
  const questionCount = document.getElementById("questionCount");

  const quizDiv = document.getElementById("quiz");
  const lifelines = document.getElementById("lifelines");
  const fiftyBtn = document.getElementById("fiftyBtn");
  const hintBtn = document.getElementById("hintBtn");

  const timerContainer = document.getElementById("timer-container");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");

  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");

  const moneyList = document.getElementById("money-list");

  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");

  let hintBox = document.getElementById("hint-box");
  if (!hintBox) {
    hintBox = document.createElement("div");
    hintBox.id = "hint-box";
    quizDiv.after(hintBox);
  }

  /* ================= STATE ================= */
  let questions = [];
  let current = 0;
  let score = 0;
  let timer;
  let timeLeft = 20;
  let timerPaused = false;
  let fiftyUsed = false;
  let hintUsed = false;
  let ladderLevel = 0;

  /* ================= FALLBACK QUESTIONS ================= */
  const fallbackQuestions = [
    {
      question: "What color is the sky?",
      correctAnswer: "Blue",
      incorrectAnswers: ["Red", "Green", "Yellow"],
      hint: "Same color as the ocean."
    },
    {
      question: "How many days are in a week?",
      correctAnswer: "7",
      incorrectAnswers: ["5", "6", "8"],
      hint: "Monday to Sunday."
    },
    {
      question: "Which planet is known as the Red Planet?",
      correctAnswer: "Mars",
      incorrectAnswers: ["Venus", "Jupiter", "Saturn"],
      hint: "Roman god of war."
    }
  ];

  /* ================= AUTH ================= */
  googleLoginBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(() => {
      authDiv.style.display = "none";
      categoryDiv.style.display = "block";
      updateLeaderboard();
    });
  };

  /* ================= START QUIZ ================= */
  startBtn.onclick = startQuiz;
  fiftyBtn.onclick = useFifty;
  hintBtn.onclick = useHint;

  async function startQuiz() {
    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";
    timerContainer.style.display = "flex";
    progressContainer.style.display = "block";
    lifelines.style.display = "flex";
    moneyList.style.display = "block";

    current = 0;
    score = 0;
    ladderLevel = 0;
    fiftyUsed = false;
    hintUsed = false;
    fiftyBtn.disabled = false;
    hintBtn.disabled = false;

    buildMoneyLadder();
    quizDiv.innerHTML = "<h2>Loading questions…</h2>";

    try {
      const res = await fetch(
        `https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`
      );
      if (!res.ok) throw "API error";
      const data = await res.json();
      questions = data.map(q => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        incorrectAnswers: q.incorrectAnswers,
        hint: q.hint || "Think carefully."
      }));
    } catch {
      questions = fallbackQuestions;
    }

    showQuestion();
  }

  /* ================= SHOW QUESTION ================= */
  function showQuestion() {
    clearInterval(timer);
    timeLeft = 20;
    timerPaused = false;
    updateTimerUI();
    updateProgress();
    hintBox.style.display = "none";

    quizDiv.innerHTML = "";
    const q = questions[current];

    const questionBlock = document.createElement("div");
    questionBlock.className = "question-block fade-in";
    questionBlock.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;
    quizDiv.appendChild(questionBlock);

    const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

    answers.forEach(a => {
      const btn = document.createElement("button");
      btn.className = "option-btn fade-in";
      btn.textContent = a;
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    timer = setInterval(() => {
      if (timerPaused) return;
      timeLeft--;
      updateTimerUI();
      if (timeLeft <= 0) {
        clearInterval(timer);
        nextQuestion();
      }
    }, 1000);
  }

  /* ================= TIMER ================= */
  function updateTimerUI() {
    timerText.textContent = `${timeLeft}s`;
    timerBar.style.width = `${(timeLeft / 20) * 100}%`;

    if (timeLeft > 12) timerBar.style.background = "lime";
    else if (timeLeft > 6) timerBar.style.background = "orange";
    else timerBar.style.background = "red";
  }

  /* ================= CHECK ANSWER ================= */
  function checkAnswer(answer) {
    clearInterval(timer);
    const correct = questions[current].correctAnswer;
    const feedback = document.getElementById("feedback");
    const buttons = document.querySelectorAll(".option-btn");

    buttons.forEach(btn => {
      btn.disabled = true;

      if (btn.textContent === correct) btn.classList.add("correct");

      if (btn.textContent === answer && answer !== correct) {
        btn.classList.add("wrong");
        btn.classList.add("shake");
        setTimeout(() => btn.classList.remove("shake"), 500);
      }
    });

    if (answer === correct) {
      score++;
      ladderLevel++;
      updateMoneyLadder();
      feedback.innerHTML = "✅ <b>Correct!</b>";
      correctSound.play();
    } else {
      feedback.innerHTML = `❌ <b>Wrong!</b><br>
        <span class="correct-answer">Correct answer: <b>${correct}</b></span>`;
      wrongSound.play();
    }

    setTimeout(nextQuestion, 1800);
  }

  /* ================= NEXT QUESTION ================= */
  function nextQuestion() {
    current++;
    if (current >= questions.length) {
      quizDiv.innerHTML = `
        <h2>Quiz Finished!</h2>
        <p>Score: ${score}/${questions.length}</p>
        <button onclick="location.reload()">Restart</button>
      `;
      lifelines.style.display = "none";
      moneyList.style.display = "none";
      timerContainer.style.display = "none";
      progressContainer.style.display = "none";
      saveScore(auth.currentUser, score);
      return;
    }
    showQuestion();
  }

  /* ================= LIFELINES ================= */
  function useFifty() {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.disabled = true;

    const correct = questions[current].correctAnswer;
    let removed = 0;
    document.querySelectorAll(".option-btn").forEach(btn => {
      if (btn.textContent !== correct && removed < 2) {
        btn.style.display = "none";
        removed++;
      }
    });
  }

  function useHint() {
    if (hintUsed) return;
    hintUsed = true;
    hintBtn.disabled = true;
    timerPaused = true;
    hintBox.textContent = "💡 " + questions[current].hint;
    hintBox.style.display = "block";
  }

  /* ================= PROGRESS ================= */
  function updateProgress() {
    const percent = ((current + 1) / questions.length) * 100;
    progressBar.style.width = percent + "%";
  }

  /* ================= MONEY LADDER ================= */
  function buildMoneyLadder() {
    moneyList.innerHTML = "";
    for (let i = questionCount.value; i > 0; i--) {
      const li = document.createElement("li");
      li.textContent = `$${i * 100}`;
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder() {
    const items = moneyList.querySelectorAll("li");
    items.forEach(i => i.classList.remove("current"));
    const idx = items.length - ladderLevel - 1;
    if (items[idx]) items[idx].classList.add("current");
  }

  /* ================= LEADERBOARD ================= */
  async function saveScore(user, score) {
    if (!user) return;
    await db.collection("leaderboard").doc(user.uid).set({
      uid: user.uid,
      name: user.displayName,
      avatar: user.photoURL,
      score,
      date: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    updateLeaderboard();
  }

  async function updateLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    list.innerHTML = "";
    const snap = await db.collection("leaderboard")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    snap.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      if (d.avatar) {
        const img = document.createElement("img");
        img.src = d.avatar;
        img.width = 30;
        img.style.borderRadius = "50%";
        li.appendChild(img);
      }
      li.append(` ${d.name} — ${d.score} pts`);
      list.appendChild(li);
    });
  }

  updateLeaderboard();

});
