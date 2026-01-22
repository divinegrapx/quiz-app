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

  

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailDiv = document.getElementById("emailDiv");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");
  const startBtn = document.getElementById("startBtn");
  const logoutBtn = document.getElementById("logoutBtn");


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
  lose: document.getElementById("lose-sound"),
  tick: document.getElementById("tick-sound")
};


  let soundEnabled = true;

  function stopAllSounds() {
    Object.values(sounds).forEach(s => {
      s.pause();
      s.currentTime = 0;
    });
  }

  function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;
    stopAllSounds();
    sounds[name].play();
  }

  /* ================= AUTH ================= */

  logoutBtn.style.display = "none";

  logoutBtn.onclick = async () => {
    await auth.signOut();
    location.reload();
  };

  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showSettings();
  };

  guestLoginBtn.onclick = () => showSettings();
  /* LOGOUT */
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await auth.signOut();
    location.reload();
  };
}


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

  let questions = [];
  let current = 0;
  let ladderLevel = 0;
  let timer;
  let fiftyUsed = false;
  let friendUsed = false;
  let audienceUsed = false;
  const TOTAL = 20;
  const timePerQuestion = 30;

  startBtn.onclick = startQuiz;

  async function startQuiz() {
    soundEnabled = soundToggle.value === "on";

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=${TOTAL}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
    );

    questions = await res.json();

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    buildMoneyLadder(TOTAL);
    current = ladderLevel = 0;
    fiftyUsed = friendUsed = audienceUsed = false;

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

    quizDiv.appendChild(document.querySelector(".lifelines-inside"));

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
    stopAllSounds();

    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
    });

    if (ans === correct) {
      ladderLevel++;
      playSound("correct");
    } else {
      playSound("wrong");
    }

    updateMoneyLadder();
    setTimeout(nextQuestion, 1800);
  }

  function nextQuestion() {
    current++;
    if (current >= TOTAL) return endGame();
    playSound("thinking");
    showQuestion();
  }

  function buildMoneyLadder(n) {
    moneyList.innerHTML = "";
    for (let i = n; i >= 1; i--) {
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

  /* ================= END GAME ================= */

  async function endGame() {
    stopAllSounds();
    playSound("win");

    const user = auth.currentUser;
    const winAmount = ladderLevel * 100;

    if (user) {
      const ref = db.collection("users").doc(user.uid);
      await ref.set({
        name: user.displayName,
        photo: user.photoURL,
        totalScore: firebase.firestore.FieldValue.increment(winAmount)
      }, { merge: true });

      logoutBtn.style.display = "block";
    }

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 YOU WON</h1>
        <h2>$${winAmount}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

});
