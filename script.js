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

  const fiftyBtn = document.getElementById("fiftyBtn");
  const secondChanceBtn = document.getElementById("secondChanceBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");
  const callFriendBox = document.getElementById("callFriendBox");
  const audienceVote = document.getElementById("audienceVote");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");

  const leaderboardList = document.getElementById("leaderboard-list");

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
    Object.values(sounds).forEach(s => { s.pause(); s.currentTime = 0; });
  }

  function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;
    stopAllSounds();
    sounds[name].play();
  }

  /* ================= LOGIN ================= */
  googleLoginBtn.onclick = async () => {
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      showSettings();
    } catch (err) {
      alert("Google Login failed: " + err.message);
    }
  };

  guestLoginBtn.onclick = () => showSettings();

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    try {
      await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
      showSettings();
    } catch (err) {
      alert("Email login failed: " + err.message);
    }
  };

  emailRegisterSubmitBtn.onclick = async () => {
    try {
      await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
      showSettings();
    } catch (err) {
      alert("Email registration failed: " + err.message);
    }
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById("profileDiv").innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}" width="48" height="48">
        <h3>${user.displayName || "Guest"}</h3>
      `;
      loadLeaderboard();
    }
  });

  function showSettings() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("categoryDiv").style.display = "block";
    playSound("intro");
  }

  /* ================= GAME VARIABLES ================= */
  let questions = [];
  let current = 0;
  let ladderLevel = 0;
  let timer;
  let fiftyUsed = false;
  let secondChanceUsed = false;
  let friendUsed = false;
  let audienceUsed = false;
  let score = 0;
  const timePerQuestionNormal = 30;
  const timePerQuestionHardcore = 20;

  startBtn.onclick = startQuiz;

  async function startQuiz() {
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;
    soundEnabled = soundToggle.value === "on";

    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
    questions = await res.json();

    document.getElementById("categoryDiv").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";

    buildMoneyLadder(20);

    current = 0;
    ladderLevel = 0;
    fiftyUsed = friendUsed = audienceUsed = secondChanceUsed = false;
    score = 0;

    playSound("thinking");
    showQuestion();
  }

  function showQuestion() {
    clearInterval(timer);
    callFriendBox.innerHTML = "";
    audienceVote.innerHTML = "";

    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

    answers.forEach(a => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = a;
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    let timeLeft = (difficultySelect.value === "hardcore") ? timePerQuestionHardcore : timePerQuestionNormal;
    updateTimer(timeLeft);

    timer = setInterval(() => {
      timeLeft--;
      updateTimer(timeLeft);
      if (timeLeft <= 5) playSound("tick");
      if (timeLeft <= 0) nextQuestion(false);
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = t + "s";
    timerBar.style.width = (t / ((difficultySelect.value === "hardcore") ? timePerQuestionHardcore : timePerQuestionNormal) * 100) + "%";
    timerBar.style.background = t > 10 ? "#00ff00" : t > 5 ? "#ffcc00" : "#ff4d4d";
  }

  function checkAnswer(ans) {
    clearInterval(timer);
    stopAllSounds();

    const correct = questions[current].correctAnswer;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("pulse-glow");
      if (b.textContent === ans && ans !== correct) b.classList.add("shake-red");
    });

    if (ans === correct) {
      score += 100;
      ladderLevel++;
      playSound("correct");
      updateMoneyLadder();
      setTimeout(nextQuestion, 1500);
    } else {
      if (!secondChanceUsed) {
        secondChanceUsed = true;
        alert("❤️ Second Chance used! Try again!");
        document.querySelectorAll(".option-btn").forEach(b => b.disabled = false);
        return;
      } else {
        playSound("wrong");
        updateMoneyLadder();
        highlightCorrectAnswer(correct);
        setTimeout(() => nextQuestion(false), 2000);
      }
    }
  }

  function highlightCorrectAnswer(correct) {
    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent === correct) b.classList.add("pulse-glow");
    });
  }

  function nextQuestion(isCorrect=true) {
    current++;

    if (current >= questions.length) {
      showFinalScreen();
      return;
    }

    playSound("thinking");
    showQuestion();
  }

  /* ================= MONEY LADDER ================= */
  function buildMoneyLadder(count) {
    moneyList.innerHTML = "";
    for (let i = count; i >= 1; i--) {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + (i * 100);
      if ([5,10,15,20].includes(i)) li.classList.add("checkpoint");
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

  secondChanceBtn.onclick = () => {
    if (secondChanceUsed) return;
    secondChanceUsed = true;
    secondChanceBtn.classList.add("used");
    alert("❤️ Second Chance activated! You will survive one wrong answer.");
  };

  callFriendBtn.onclick = () => {
    if (friendUsed) return;
    friendUsed = true;
    callFriendBtn.classList.add("used");
    playSound("call");
    const correct = questions[current].correctAnswer;
    callFriendBox.innerHTML = `📞 Friend says: <b>${correct}</b>`;
  };

  audienceBtn.onclick = () => {
    if (audienceUsed) return;
    audienceUsed = true;
    audienceBtn.classList.add("used");
    playSound("audience");

    const correct = questions[current].correctAnswer;
    audienceVote.innerHTML = "";
    document.querySelectorAll(".option-btn").forEach(b => {
      let percent = Math.floor(Math.random() * 50) + 25; // 25-75% correct bias
      if (b.textContent === correct) percent += 15;
      audienceVote.innerHTML += `<div>${b.textContent}: ${percent}%</div>`;
    });
  };

  /* ================= FINAL SCREEN ================= */
  function showFinalScreen() {
    stopAllSounds();
    playSound("win");
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 CONGRATULATIONS</h1>
        <h2>You Won $${score}</h2>
        <button onclick="location.reload()">Restart Quiz</button>
        <button onclick="navigator.share({text:'I won $${score} in NEON MILLIONAIRE!'})">Share Score</button>
      </div>
    `;
    saveScore(score);
  }

  /* ================= LEADERBOARD ================= */
  async function saveScore(score) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.collection("scores").doc(user.uid);
    const doc = await userRef.get();
    let totalScore = score;
    if (doc.exists) totalScore += doc.data().totalScore || 0;

    await userRef.set({
      name: user.displayName || "Guest",
      photo: user.photoURL || "",
      totalScore: totalScore,
      gamesPlayed: (doc.exists ? doc.data().gamesPlayed + 1 : 1),
      lastPlayed: new Date()
    });

    loadLeaderboard();
  }

  async function loadLeaderboard() {
    const snapshot = await db.collection("scores").orderBy("totalScore","desc").limit(10).get();
    leaderboardList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `<span>${data.name}</span> <span>$${data.totalScore}</span>`;
      leaderboardList.appendChild(li);
    });
  }

});
