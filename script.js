document.addEventListener("DOMContentLoaded", () => {

  // 🔥 FIREBASE
  firebase.initializeApp({
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app"
  });

  const auth = firebase.auth();
  const db = firebase.firestore();

  // 🧱 DOM ELEMENTS (FIX)
  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const quiz = document.getElementById("quiz");
  const moneyList = document.getElementById("money-list");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const leaderboardList = document.getElementById("leaderboard-list");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const startBtn = document.getElementById("startBtn");
  const modeSelect = document.getElementById("modeSelect");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");
  const secondChanceBtn = document.getElementById("secondChanceBtn");

  // 🔊 SOUNDS (CLICK-SAFE)
  const sounds = {
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    tick: document.getElementById("tick-sound")
  };

  let soundEnabled = false;
  document.body.addEventListener("click", () => soundEnabled = true, { once: true });

  function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play();
  }

  // 👤 LOGIN
  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showSettings();
  };

  guestLoginBtn.onclick = showSettings;

  function showSettings() {
    authDiv.style.display = "none";
    categoryDiv.style.display = "block";
    loadLeaderboard();
  }

  // 🎮 GAME STATE
  let questions = [];
  let current = 0;
  let level = 0;
  let timer;
  let timePerQ = 30;
  let secondChance = true;

  const checkpoints = [5, 10, 15, 20];

  // ▶️ START GAME
  startBtn.onclick = startGame;

  async function startGame() {
    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    timePerQ = modeSelect.value === "hardcore" ? 20 : 30;

    const res = await fetch("https://the-trivia-api.com/api/questions?limit=20");
    questions = await res.json();

    buildLadder();
    showQuestion();
    playSound("thinking");
  }

  function showQuestion() {
    clearInterval(timer);

    const q = questions[current];
    quiz.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5)
      .forEach(a => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = a;
        btn.onclick = () => answer(btn, a);
        quiz.appendChild(btn);
      });

    let t = timePerQ;
    timerText.textContent = t + "s";
    timerBar.style.width = "100%";

    timer = setInterval(() => {
      t--;
      timerText.textContent = t + "s";
      timerBar.style.width = (t / timePerQ * 100) + "%";
      if (t <= 5) playSound("tick");
      if (t <= 0) lose();
    }, 1000);
  }

  function answer(btn, ans) {
    clearInterval(timer);

    const correct = questions[current].correctAnswer;
    document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);

    if (ans === correct) {
      btn.classList.add("correct");
      playSound("correct");
      level++;
      updateLadder();
      setTimeout(next, 1200);
    } else {
      btn.classList.add("wrong");
      playSound("wrong");
      if (secondChance) {
        secondChance = false;
        setTimeout(showQuestion, 800);
      } else {
        lose();
      }
    }
  }

  function next() {
    current++;
    if (current >= 20) win();
    else showQuestion();
  }

  function lose() {
    const safe = checkpoints.filter(c => c <= level).pop() || 0;
    endGame(safe * 100);
  }

  function win() {
    endGame(level * 100);
  }

  function endGame(amount) {
    saveScore(amount);
    quiz.innerHTML = `
      <div class="final-screen">
        <h1>🎉 Congratulations</h1>
        <h2>You keep $${amount}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

  function buildLadder() {
    moneyList.innerHTML = "";
    for (let i = 20; i >= 1; i--) {
      const li = document.createElement("li");
      li.className = "ladder";
      if (checkpoints.includes(i)) li.classList.add("safe");
      li.textContent = "$" + (i * 100);
      moneyList.appendChild(li);
    }
  }

  function updateLadder() {
    [...moneyList.children].forEach(l => l.classList.remove("current"));
    const idx = moneyList.children.length - level;
    moneyList.children[idx]?.classList.add("current");
  }

  function saveScore(score) {
    const u = auth.currentUser;
    if (!u) return;
    const ref = db.collection("leaderboard").doc(u.uid);
    ref.get().then(d => {
      const prev = d.exists ? d.data() : { total: 0, games: 0 };
      ref.set({
        name: u.displayName || "Guest",
        total: prev.total + score,
        games: prev.games + 1
      });
    });
  }

  function loadLeaderboard() {
    db.collection("leaderboard")
      .orderBy("total", "desc")
      .limit(10)
      .onSnapshot(s => {
        leaderboardList.innerHTML = "";
        s.forEach(d => {
          leaderboardList.innerHTML += `<li>${d.data().name} — $${d.data().total}</li>`;
        });
      });
  }

});
