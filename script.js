document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */

  firebase.initializeApp({
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app"
  });

  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ================= ELEMENTS ================= */

  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const profileDiv = document.getElementById("profileDiv");
  const logoutBtn = document.getElementById("logoutBtn");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailDiv = document.getElementById("emailDiv");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");
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

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");

  /* ================= SOUNDS ================= */

  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    call: document.getElementById("call-sound"),
    audience: document.getElementById("audience-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    win: document.getElementById("win-sound"),
    tick: document.getElementById("tick-sound")
  };

  let soundEnabled = true;

  const playSound = name => {
    if (!soundEnabled || !sounds[name]) return;
    Object.values(sounds).forEach(s => { s.pause(); s.currentTime = 0; });
    sounds[name].play();
  };

  /* ================= AUTH ================= */

  logoutBtn.onclick = async () => {
    await auth.signOut();
    location.reload();
  };

  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showSettings();
  };

  guestLoginBtn.onclick = showSettings;

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
    location.reload();
  };

  emailRegisterSubmitBtn.onclick = async () => {
    await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
    location.reload();
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      profileDiv.innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || "Guest"}</h3>
      `;
    }
  });

  function showSettings() {
    authDiv.style.display = "none";
    categoryDiv.style.display = "block";
    playSound("intro");
  }

  /* ================= GAME ================= */

  const TOTAL = 20;
  const timePerQuestion = 30;
  let questions = [];
  let current = 0;
  let ladderLevel = 0;
  let timer;

  startBtn.onclick = startQuiz;

  async function startQuiz() {
    soundEnabled = soundToggle.value === "on";

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=${TOTAL}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
    );

    questions = await res.json();
    if (!questions.length) return alert("No questions loaded.");

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    buildMoneyLadder();
    current = ladderLevel = 0;

    playSound("thinking");
    showQuestion();
  }

  function showQuestion() {
    clearInterval(timer);
    callFriendBox.innerHTML = "";
    audienceVote.innerHTML = "";

    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1} / ${TOTAL}: ${q.question}</h2>`;

    [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5)
      .forEach(a => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = a;
        btn.onclick = () => checkAnswer(a);
        quizDiv.appendChild(btn);
      });

    let t = timePerQuestion;
    updateTimer(t);

    timer = setInterval(() => {
      t--;
      updateTimer(t);
      if (t <= 5) playSound("tick");
      if (t <= 0) nextQuestion();
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = t + "s";
    timerBar.style.width = (t / timePerQuestion * 100) + "%";
  }

  function checkAnswer(ans) {
    clearInterval(timer);

    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
    });

    ans === correct ? (ladderLevel++, playSound("correct")) : playSound("wrong");
    updateMoneyLadder();
    setTimeout(nextQuestion, 1500);
  }

  function nextQuestion() {
    current++;
    current >= TOTAL ? endGame() : showQuestion();
  }

  function buildMoneyLadder() {
    moneyList.innerHTML = "";
    for (let i = TOTAL; i >= 1; i--) {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + i * 100;
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const idx = moneyList.children.length - ladderLevel;
    if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
  }

  function endGame() {
    playSound("win");
    logoutBtn.style.display = "block";

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 YOU WON</h1>
        <h2>$${ladderLevel * 100}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

});
