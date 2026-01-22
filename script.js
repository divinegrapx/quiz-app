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

  const quizDiv = document.getElementById("quiz");
  const moneyList = document.getElementById("money-list");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const leaderboardList = document.getElementById("leaderboard-list");

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

  /* ================= LOGIN ================= */
  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showSettings();
  };

  guestLoginBtn.onclick = () => showSettings();

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
      document.getElementById("profileDiv").innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || "Player"}</h3>
      `;
      loadLeaderboard();
    }
  });

  function showSettings() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("categoryDiv").style.display = "block";
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
  const timePerQuestion = 30;

  startBtn.onclick = startQuiz;

  async function startQuiz() {
    soundEnabled = soundToggle.value === "on";

    const QUESTION_COUNT = 20;

const res = await fetch(
  `https://the-trivia-api.com/api/questions?limit=${QUESTION_COUNT}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
);

    questions = await res.json();

    document.getElementById("categoryDiv").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";

    buildMoneyLadder(10);

    current = 0;
    ladderLevel = 0;
    fiftyUsed = friendUsed = audienceUsed = false;

    [fiftyBtn, callFriendBtn, audienceBtn].forEach(b => b.classList.remove("used"));

    playSound("thinking");
    showQuestion();
  }

  function showQuestion() {
    clearInterval(timer);
    callFriendBox.innerHTML = "";
    audienceVote.innerHTML = "";

    const q = questions[current];
    quizDiv.innerHTML = `
  <h2 style="font-size:18px; opacity:0.8;">
    Question ${current + 1} / ${questions.length}
  </h2>
  <h2 style="font-size:22px; margin-top:6px;">
    ${q.question}
  </h2>
`;
    
    const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

    answers.forEach(a => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.style.fontSize = "16px";
      btn.textContent = a;
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    let timeLeft = timePerQuestion;
    updateTimer(timeLeft);

    timer = setInterval(() => {
      timeLeft--;
      updateTimer(timeLeft);
      if (timeLeft <= 5) playSound("tick");
      if (timeLeft <= 0) nextQuestion();
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
    setTimeout(nextQuestion, 1500);
  }

  function nextQuestion() {
    current++;
    if (current >= questions.length) {
      showFinalScreen();
      return;
    }
    playSound("thinking");
    showQuestion();
  }

  /* ================= MONEY ================= */
  function buildMoneyLadder(count) {
    moneyList.innerHTML = "";
    for (let i = count; i >= 1; i--) {
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

  /* ================= LIFELINES ================= */
  fiftyBtn.onclick = () => {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    let removed = 0;

    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed < 2) {
        b.style.opacity = 0.3;
        removed++;
      }
    });
  };

  callFriendBtn.onclick = () => {
    if (friendUsed) return;
    friendUsed = true;
    callFriendBtn.classList.add("used");
    playSound("call");
    callFriendBox.innerHTML = `📞 Friend thinks the answer is <b>${questions[current].correctAnswer}</b>`;
  };

  audienceBtn.onclick = () => {
    if (audienceUsed) return;
    audienceUsed = true;
    audienceBtn.classList.add("used");
    playSound("audience");

    audienceVote.innerHTML = "";
    document.querySelectorAll(".option-btn").forEach(b => {
      const percent = Math.floor(Math.random() * 60) + 20;
      audienceVote.innerHTML += `<div>${b.textContent}: ${percent}%</div>`;
    });
  };

  /* ================= FINAL ================= */
  function showFinalScreen() {
    stopAllSounds();
    playSound("win");

    saveScore(ladderLevel * 100);

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>You Won $${ladderLevel * 100}</h1>
        <button onclick="location.reload()">Restart</button>
        <button onclick="auth.signOut().then(()=>location.reload())">Log Out</button>
      </div>
    `;
  }

  /* ================= LEADERBOARD ================= */
  async function saveScore(score) {
    const user = auth.currentUser;
    if (!user) return;

    const ref = db.collection("leaderboard").doc(user.uid);
    const doc = await ref.get();

    if (doc.exists) {
      ref.update({
        totalScore: firebase.firestore.FieldValue.increment(score),
        games: firebase.firestore.FieldValue.increment(1)
      });
    } else {
      ref.set({
        name: user.displayName || "Guest",
        photo: user.photoURL || "",
        totalScore: score,
        games: 1
      });
    }
  }

  async function loadLeaderboard() {
    leaderboardList.innerHTML = "";
    const snap = await db.collection("leaderboard")
      .orderBy("totalScore", "desc")
      .limit(10)
      .get();

    snap.forEach(doc => {
      const d = doc.data();
      leaderboardList.innerHTML += `
        <li>
          <img src="${d.photo || 'https://i.imgur.com/6VBx3io.png'}">
          <strong>${d.name}</strong> — $${d.totalScore}
        </li>
      `;
    });
  }

});
