document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */

  firebase.initializeApp({
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app",
    storageBucket: "neon-quiz-app.appspot.com",
    messagingSenderId: "891061147021",
    appId: "1:891061147021:web:7b3d80020f642da7b699c4"
  });

  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ================= ELEMENTS ================= */

  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const profileDiv = document.getElementById("profileDiv");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");

  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  const startBtn = document.getElementById("startBtn");
  const quizDiv = document.getElementById("quiz");
  const moneyList = document.getElementById("money-list");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const leaderboardList = document.getElementById("leaderboard-list");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");

  /* ================= UI ================= */

  function showSettings() {
    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
  }

  /* ================= AUTH ================= */

  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  };

  guestLoginBtn.onclick = () => {
    profileDiv.innerHTML = `
      <img src="https://i.imgur.com/6VBx3io.png">
      <h3>Guest</h3>
    `;
    showSettings();
  };

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
  };

  emailRegisterSubmitBtn.onclick = async () => {
    await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      profileDiv.innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || user.email}</h3>
      `;
      showSettings();
    }
  });

  /* ================= SOUNDS ================= */

  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    win: document.getElementById("win-sound"),
    lose: document.getElementById("lose-sound"),
    tick: document.getElementById("tick-sound"),
    call: document.getElementById("call-sound"),
    audience: document.getElementById("audience-sound")
  };

  let soundEnabled = true;
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    Object.values(sounds).forEach(a => a.load());
    audioUnlocked = true;
  }

  document.body.addEventListener("click", unlockAudio, { once: true });

  function play(name, loop = false) {
    if (!soundEnabled || !audioUnlocked || !sounds[name]) return;
    sounds[name].pause();
    sounds[name].currentTime = 0;
    sounds[name].loop = loop;
    sounds[name].play().catch(() => {});
  }

  function stop(name) {
    if (!sounds[name]) return;
    sounds[name].pause();
    sounds[name].currentTime = 0;
  }

  /* ================= GAME ================= */

  const MONEY = [
    100, 200, 300, 500, 1000,
    2000, 4000, 8000, 16000, 32000,
    64000, 125000, 250000, 500000, 1000000
  ];

  let questions = [];
  let current = 0;
  let timer;
  let locked = false;
  let timePerQuestion = 30;

  /* ================= START ================= */

  startBtn.onclick = async () => {
    unlockAudio();

    soundEnabled = soundToggle.value === "on";
    const hardcore = difficultySelect.value === "hardcore";
    timePerQuestion = hardcore ? 20 : 30;

    play("intro");

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${hardcore ? "hard" : difficultySelect.value}`
    );

    questions = await res.json();

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    buildMoney();
    showQuestion();
  };

  /* ================= QUESTIONS ================= */

  function showQuestion() {
    locked = false;
    clearInterval(timer);
    play("thinking", true);

    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5)
      .forEach(a => {
        const b = document.createElement("button");
        b.className = "option-btn";
        b.textContent = a;
        b.onclick = () => answer(a);
        quizDiv.appendChild(b);
      });

    startTimer();
  }

  function startTimer() {
    let t = timePerQuestion;
    timerText.textContent = t + "s";
    timerBar.style.width = "100%";

    timer = setInterval(() => {
      t--;
      timerText.textContent = t + "s";
      timerBar.style.width = `${(t / timePerQuestion) * 100}%`;
      if (t <= 5) play("tick");
      if (t <= 0) nextQuestion();
    }, 1000);
  }

  /* ================= ANSWERS ================= */

  function answer(a) {
    if (locked) return;
    locked = true;
    clearInterval(timer);
    stop("thinking");

    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === a && a !== correct) b.classList.add("wrong");
    });

    play(a === correct ? "correct" : "wrong");

    setTimeout(nextQuestion, 1600);
  }

  function nextQuestion() {
    current++;
    updateMoney();

    if (current === MONEY.length) return win();
    showQuestion();
  }

  /* ================= END ================= */

  function win() {
    play("win");
    saveScore(1000000);
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🏆 MILLIONAIRE</h1>
        <h2>$1,000,000</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

  /* ================= MONEY ================= */

  function buildMoney() {
    moneyList.innerHTML = "";
    MONEY.slice().reverse().forEach(v => {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + v.toLocaleString();
      moneyList.appendChild(li);
    });
    updateMoney();
  }

  function updateMoney() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const idx = MONEY.length - current - 1;
    if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
  }

  /* ================= LEADERBOARD ================= */

  function saveScore(score) {
    db.collection("scores").add({
      name: auth.currentUser?.displayName || "Guest",
      score,
      time: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

});
