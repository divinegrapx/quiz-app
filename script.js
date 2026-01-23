document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ================= ELEMENTS ================= */

  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const profileDiv = document.getElementById("profileDiv");
  const leaderboardList = document.getElementById("leaderboard-list");

  const startBtn = document.getElementById("startBtn");

  /* ================= SOUNDS ================= */

  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    win: document.getElementById("win-sound")
  };

  let soundEnabled = true;
  let audioUnlocked = false;
  let loopSound = null;

  function unlockAudio() {
    if (audioUnlocked) return;
    Object.values(sounds).forEach(s => {
      if (!s) return;
      s.volume = 0.8;
      s.play().then(() => {
        s.pause();
        s.currentTime = 0;
      }).catch(() => {});
    });
    audioUnlocked = true;
    playSound("intro");
  }

  document.body.addEventListener("click", unlockAudio, { once: true });

  function stopSounds() {
    Object.values(sounds).forEach(s => {
      if (!s) return;
      s.pause();
      s.currentTime = 0;
      s.loop = false;
    });
    loopSound = null;
  }

  function playSound(name, loop = false) {
    if (!soundEnabled || !audioUnlocked) return;
    const s = sounds[name];
    if (!s) return;

    if (loopSound && loopSound !== s) {
      loopSound.pause();
      loopSound.currentTime = 0;
    }

    s.pause();
    s.currentTime = 0;
    s.loop = loop;
    s.play().catch(() => {});
    if (loop) loopSound = s;
  }

  /* ================= AUTH ================= */

  document.getElementById("googleLoginBtn").onclick = () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  };

  document.getElementById("guestLoginBtn").onclick = () => {
    auth.signInAnonymously();
  };

  document.getElementById("emailRegisterBtn").onclick = () => {
    authDiv.style.display = "none";
    emailDiv.style.display = "block";
  };

  document.getElementById("emailCancelBtn").onclick = () => {
    emailDiv.style.display = "none";
    authDiv.style.display = "block";
  };

  document.getElementById("emailLoginBtn").onclick = () => {
    auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
  };

  document.getElementById("emailRegisterSubmitBtn").onclick = () => {
    auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
  };

  auth.onAuthStateChanged(user => {
    if (!user) {
      authDiv.style.display = "block";
      categoryDiv.style.display = "none";
      quizContainer.style.display = "none";
      profileDiv.innerHTML = "";
      playSound("intro");
      loadLeaderboard();
      return;
    }

    stopSounds();

    profileDiv.innerHTML = `
      <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
      <span>${user.displayName || "Guest"}</span>
    `;

    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
    loadLeaderboard();
  });

  /* ================= QUIZ DATA ================= */

  const prizes = [
    100, 200, 300, 500, 1000,
    2000, 4000, 8000, 16000, 32000,
    64000, 125000, 250000, 500000, 1000000
  ];

  let currentQuestion = 0;
  let earned = 0;

  /* ================= START QUIZ ================= */

  startBtn.onclick = () => {
    stopSounds();
    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";
    currentQuestion = 0;
    earned = 0;
    buildMoneyLadder();
    loadQuestion();
  };

  function buildMoneyLadder() {
    const ul = document.getElementById("money-list");
    ul.innerHTML = "";
    prizes.slice().reverse().forEach((p, i) => {
      const li = document.createElement("li");
      li.textContent = `$${p.toLocaleString()}`;
      li.dataset.index = prizes.length - 1 - i;
      ul.appendChild(li);
    });
  }

  function highlightMoney() {
    document.querySelectorAll("#money-list li").forEach(li => {
      li.classList.toggle(
        "active",
        parseInt(li.dataset.index) === currentQuestion - 1
      );
    });
  }

  /* ================= QUESTIONS ================= */

  function loadQuestion() {
    playSound("thinking", true);

    const quiz = document.getElementById("quiz");
    quiz.innerHTML = `
      <h2>Question ${currentQuestion + 1}</h2>
      <button class="answer">Correct</button>
      <button class="answer">Wrong</button>
    `;

    quiz.querySelectorAll(".answer").forEach(btn => {
      btn.onclick = () => {
        stopSounds();
        if (btn.textContent === "Correct") {
          earned = prizes[currentQuestion];
          playSound("correct");
          currentQuestion++;
          highlightMoney();
          if (currentQuestion === prizes.length) {
            endGame(true);
          } else {
            setTimeout(loadQuestion, 1200);
          }
        } else {
          playSound("wrong");
          earned = checkpointFallback();
          setTimeout(() => endGame(false), 1200);
        }
      };
    });
  }

  function checkpointFallback() {
    if (currentQuestion >= 10) return prizes[9];
    if (currentQuestion >= 5) return prizes[4];
    return 0;
  }

  /* ================= END GAME ================= */

  function endGame(win) {
    stopSounds();
    saveScore(earned);
    quizContainer.innerHTML = `
      <h2>${win ? "🎉 YOU WIN!" : "❌ WRONG ANSWER"}</h2>
      <h3>You earned $${earned.toLocaleString()}</h3>
      <button id="playAgainBtn">Play Again</button>
      <button id="logoutBtn">Logout</button>
    `;

    document.getElementById("playAgainBtn").onclick = () => {
      quizContainer.style.display = "none";
      categoryDiv.style.display = "block";
    };

    document.getElementById("logoutBtn").onclick = () => {
      auth.signOut();
    };
  }

  /* ================= LEADERBOARD ================= */

  function saveScore(score) {
    const user = auth.currentUser;
    const uid = user ? user.uid : "guest";

    const ref = db.collection("leaderboard").doc(uid);

    ref.get().then(doc => {
      if (!doc.exists) {
        ref.set({
          name: user?.displayName || "Guest",
          photo: user?.photoURL || "",
          totalScore: score,
          gamesPlayed: 1,
          updated: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        ref.update({
          totalScore: firebase.firestore.FieldValue.increment(score),
          gamesPlayed: firebase.firestore.FieldValue.increment(1),
          updated: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }).then(loadLeaderboard);
  }

  function loadLeaderboard() {
    leaderboardList.innerHTML = "<h3>🏆 Top Players</h3>";

    db.collection("leaderboard")
      .orderBy("totalScore", "desc")
      .limit(10)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          const d = doc.data();
          const li = document.createElement("li");
          li.innerHTML = `
            <img src="${d.photo || 'https://i.imgur.com/6VBx3io.png'}">
            <span>${d.name}</span>
            <b>$${d.totalScore.toLocaleString()}</b>
          `;
          leaderboardList.appendChild(li);
        });
      });
  }

});
