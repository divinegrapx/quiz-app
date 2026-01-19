document.addEventListener("DOMContentLoaded", () => {

  // ---------------- FIREBASE CONFIG ----------------
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

  // ---------------- DOM ELEMENTS ----------------
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const facebookLoginBtn = document.getElementById("facebookLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");

  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");

  const startBtn = document.getElementById("startBtn");
  const categorySelect = document.getElementById("categorySelect");
  const questionCount = document.getElementById("questionCount");

  const quizDiv = document.getElementById("quiz");
  const lifelines = document.getElementById("lifelines");
  const fiftyBtn = document.getElementById("fiftyBtn");
  const hintBtn = document.getElementById("hintBtn");

  const progressBar = document.getElementById("progress-bar");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const moneyList = document.getElementById("money-list");

  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");

  // ---------------- HINT BOX ----------------
  let hintBox = document.getElementById("hint-box");
  if (!hintBox) {
    hintBox = document.createElement("div");
    hintBox.id = "hint-box";
    quizDiv.parentNode.insertBefore(hintBox, quizDiv.nextSibling);
  }

  // ---------------- GLOBALS ----------------
  let questions = [], current = 0, score = 0, timer;
  let fiftyUsed = false, hintUsed = false, ladderLevel = 0;

  // ---------------- FALLBACK QUESTIONS ----------------
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

  // ---------------- AUTH ----------------
  googleLoginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(() => {
        authDiv.style.display = "none";
        categoryDiv.style.display = "block";
        updateLeaderboard();
      })
      .catch(err => {
        console.error(err);
        alert("Google login failed");
      });
  });

  emailRegisterBtn.addEventListener("click", () => {
    authDiv.style.display = "none";
    emailDiv.style.display = "block";
  });

  // ---------------- START QUIZ ----------------
  startBtn.addEventListener("click", startQuiz);
  fiftyBtn.addEventListener("click", useFifty);
  hintBtn.addEventListener("click", useHint);

  async function startQuiz() {
    quizDiv.style.display = "flex";
    lifelines.style.display = "flex";
    moneyList.style.display = "block";
    hintBox.style.display = "none";

    current = 0;
    score = 0;
    ladderLevel = 0;
    fiftyUsed = false;
    hintUsed = false;
    fiftyBtn.disabled = false;
    hintBtn.disabled = false;

    buildMoneyLadder();
    quizDiv.innerHTML = "Loading...";

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

  // ---------------- SHOW QUESTION ----------------
  function showQuestion() {
    clearInterval(timer);
    let timeLeft = 20;
    updateTimer(timeLeft);
    hintBox.style.display = "none";

    const q = questions[current];
    quizDiv.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;

    const answers = [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5);

    answers.forEach(ans => {
      const btn = document.createElement("button");
      btn.textContent = ans;
      btn.className = "option-btn";
      btn.onclick = () => checkAnswer(ans);
      quizDiv.appendChild(btn);
    });

    timer = setInterval(() => {
      timeLeft--;
      updateTimer(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timer);
        nextQuestion();
      }
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = `${t}s`;
    timerBar.style.width = `${(t / 20) * 100}%`;
  }

  // ---------------- ANSWERS ----------------
  function checkAnswer(answer) {
    clearInterval(timer);
    const correct = questions[current].correctAnswer;
    const feedback = document.getElementById("feedback");

    document.querySelectorAll(".option-btn").forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correct) btn.classList.add("correct");
      if (btn.textContent === answer && answer !== correct)
        btn.classList.add("wrong");
    });

    if (answer === correct) {
      score++;
      ladderLevel++;
      updateMoneyLadder();
      feedback.textContent = "✅ Correct!";
      correctSound.play();
    } else {
      feedback.textContent = "❌ Wrong!";
      wrongSound.play();
    }

    setTimeout(nextQuestion, 1000);
  }

  function nextQuestion() {
    current++;
    if (current >= questions.length) {
      quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
      lifelines.style.display = "none";
      moneyList.style.display = "none";
      saveScore(auth.currentUser, score);
      return;
    }
    showQuestion();
  }

  // ---------------- LIFELINES ----------------
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
    hintBox.textContent = "💡 " + questions[current].hint;
    hintBox.style.display = "block";
  }

  // ---------------- MONEY LADDER ----------------
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

  // ---------------- LEADERBOARD ----------------
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
