document.addEventListener("DOMContentLoaded", () => {

  /* =================== FIREBASE CONFIG =================== */
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

  /* =================== ELEMENTS =================== */
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
  const safeMoneyBtn = document.getElementById("safeMoneyBtn");
  const callFriendBox = document.getElementById("callFriendBox");
  const audienceVote = document.getElementById("audienceVote");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const nightmareCheck = document.getElementById("nightmareModeCheck");
  const soundToggle = document.getElementById("soundToggle");

  const scoreRow = document.getElementById("scoreRow");
  const leaderboardList = document.getElementById("leaderboard-list");

  /* =================== SOUNDS =================== */
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
  let user = null;
  let questions = [];
  let current = 0;
  let timer;
  let ladderLevel = 0;
  let score = 0;
  let lifetime = 0;

  let fiftyUsed = false;
  let friendUsed = false;
  let audienceUsed = false;

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

  /* =================== AUTH =================== */
  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showSettings();
  };

  guestLoginBtn.onclick = () => {
    auth.signInAnonymously();
    showSettings();
  };

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

  auth.onAuthStateChanged(async u => {
    if (u) {
      user = u;

      // Load lifetime from Firestore
      const docRef = db.collection("users").doc(user.uid);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        lifetime = docSnap.data().lifetime || 0;
      } else {
        lifetime = 0;
        await docRef.set({ lifetime: 0, name: user.displayName || "Guest", photo: user.photoURL || "" });
      }

      updateScoreRow();

      // Show profile
      document.getElementById("profileDiv").innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || "Guest"}</h3>
      `;
    }
  });

  function showSettings() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("categoryDiv").style.display = "block";
    playSound("intro");
  }

  /* =================== START QUIZ =================== */
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
    score = 0;

    fiftyUsed = friendUsed = audienceUsed = false;

    playSound("thinking");
    showQuestion();
    updateScoreRow();

    loadLeaderboard(); // real-time listener
  }

  /* =================== QUESTION DISPLAY =================== */
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

    let timeLeft = 30;
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
    timerBar.style.width = (t / 30 * 100) + "%";
    timerBar.style.background = t > 10 ? "#00ff00" : t > 5 ? "#ffcc00" : "#ff4d4d";
  }

  /* =================== CHECK ANSWER =================== */
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
      score += 100;
      playSound("correct");
    } else {
      playSound("wrong");
      if (nightmareCheck.checked) {
        setTimeout(() => showFinalScreen(), 1500);
        return;
      }
    }

    updateMoneyLadder();
    updateScoreRow();
    setTimeout(nextQuestion, 2000);
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

  /* =================== MONEY LADDER =================== */
  function buildMoneyLadder(count) {
    moneyList.innerHTML = "";
    for (let i = count; i >= 1; i--) {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + (i * 100);
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const idx = moneyList.children.length - ladderLevel;
    if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
  }

  function updateScoreRow() {
    scoreRow.textContent = `Score: $${score} | Total: $${lifetime}`;
  }

  /* =================== LIFELINES (IMPROVED) =================== */

// 50:50 Lifeline
fiftyBtn.onclick = () => {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.classList.add("used");

  const correct = questions[current].correctAnswer;
  const options = [...document.querySelectorAll(".option-btn")].filter(b => b.textContent !== correct);
  
  // Randomly remove 2 wrong answers
  const toRemove = [];
  while (toRemove.length < 2 && options.length > 0) {
    const index = Math.floor(Math.random() * options.length);
    toRemove.push(options[index]);
    options.splice(index, 1);
  }

  toRemove.forEach(btn => btn.style.opacity = 0.3);

  // Highlight remaining options
  document.querySelectorAll(".option-btn").forEach(btn => {
    if (btn.textContent === correct) btn.classList.add("highlight");
  });

  playSound("thinking");
};

// Call a Friend Lifeline
callFriendBtn.onclick = () => {
  if (friendUsed) return;
  friendUsed = true;
  callFriendBtn.classList.add("used");

  const correct = questions[current].correctAnswer;
  const options = [...document.querySelectorAll(".option-btn")].map(b => b.textContent);

  // 70% chance friend gives correct answer
  let friendAnswer;
  if (Math.random() < 0.7) {
    friendAnswer = correct;
  } else {
    const wrongOptions = options.filter(o => o !== correct);
    friendAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }

  callFriendBox.innerHTML = `📞 Friend says: <b>${friendAnswer}</b> (I think...)`;
  playSound("call");

  setTimeout(() => { callFriendBox.innerHTML = ""; stopAllSounds(); }, 5000);
};

// Audience Vote Lifeline
audienceBtn.onclick = () => {
  if (audienceUsed) return;
  audienceUsed = true;
  audienceBtn.classList.add("used");

  const options = [...document.querySelectorAll(".option-btn")].map(b => b.textContent);
  const correct = questions[current].correctAnswer;

  audienceVote.innerHTML = "";
  playSound("audience");

  options.forEach(opt => {
    let percent;
    if (opt === correct) {
      percent = Math.floor(Math.random() * 40 + 50); // 50% to 90%
    } else {
      percent = Math.floor(Math.random() * 50);       // 0% to 50%
    }

    const bar = document.createElement("div");
    bar.style.width = percent + "%";
    bar.style.background = opt === correct ? "#00ff00" : "#ff4d4d";
    bar.style.margin = "3px 0";
    bar.style.height = "20px";
    bar.style.color = "#000";
    bar.style.fontWeight = "bold";
    bar.style.paddingLeft = "5px";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.textContent = `${opt}: ${percent}%`;

    audienceVote.appendChild(bar);
  });

  setTimeout(() => { audienceVote.innerHTML = ""; stopAllSounds(); }, 5000);
};


  /* =================== SAFE MONEY =================== */
safeMoneyBtn.onclick = () => {
  score = getLastMilestone(); // set score to last safe milestone
  updateScoreRow();
  showFinalScreen();           // show final screen and save score once
};

function getLastMilestone() {
  let amt = 0;
  [...moneyList.children].forEach(li => {
    const val = parseInt(li.textContent.replace("$", ""));
    if (score >= val) amt = val;
  });
  return amt;
}

/* =================== FIREBASE SAVE SCORE =================== */
async function saveScore(currentScore) {
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);

    const userData = {
      name: user.displayName || "Guest",
      photo: user.photoURL || "https://i.imgur.com/6VBx3io.png"
    };

    if (!doc.exists) {
      // New user
      transaction.set(userRef, {
        ...userData,
        lifetime: currentScore
      });
      lifetime = currentScore; // update local lifetime
    } else {
      // Existing user
      const previousLifetime = doc.data().lifetime || 0;
      const newLifetime = previousLifetime + currentScore;
      transaction.update(userRef, {
        lifetime: newLifetime,
        ...userData // ensures name/photo are always current
      });
      lifetime = newLifetime;
    }
  });
}

/* =================== FINAL SCREEN =================== */
function showFinalScreen() {
  stopAllSounds();
  playSound("win");

  // Add current quiz score to lifetime and save
  lifetime += score;
  updateScoreRow();
  saveScore(score); // save only the current quiz points once

  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🎉 CONGRATULATIONS</h1>
      <h2>You Won $${score}</h2>
      <button onclick="location.reload()">Restart Quiz</button>
    </div>
  `;

  loadLeaderboard(); // refresh leaderboard
}

/* =================== FIREBASE LEADERBOARD =================== */
function loadLeaderboard() {
  leaderboardList.innerHTML = "<h3>Top 10 Players</h3>";

  // Real-time listener
  db.collection("users")
    .orderBy("lifetime", "desc")
    .limit(10)
    .onSnapshot(snapshot => {
      leaderboardList.innerHTML = "<h3>Top 10 Players</h3>"; // clear before re-render
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement("li");
        li.innerHTML = `<img src="${data.photo || 'https://i.imgur.com/6VBx3io.png'}" width="30"> ${data.name || 'Guest'}: $${data.lifetime || 0}`;
        leaderboardList.appendChild(li);
      });
    });
}
