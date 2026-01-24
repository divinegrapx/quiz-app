document.addEventListener("DOMContentLoaded", () => {

  // ================= FIREBASE =================
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

  // ================= ELEMENTS =================
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailDiv = document.getElementById("emailDiv");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");
  const startBtn = document.getElementById("startBtn");

  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

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

  // ================= SOUNDS =================
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
  let timer;

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

  // ================= LOGIN =================

  googleLoginBtn.onclick = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      showSettings();
    } catch (err) { alert("Google login failed: " + err.message); }
  };

  guestLoginBtn.onclick = () => showSettings();

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) { alert("Enter email and password"); return; }
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showSettings();
    } catch (err) { alert("Email login failed: " + err.message); }
  };

  emailRegisterSubmitBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) { alert("Enter email and password"); return; }
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      showSettings();
    } catch (err) { alert("Email registration failed: " + err.message); }
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById("profileDiv").innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}" width="48" height="48">
        <h3>${user.displayName || "Guest"}</h3>
      `;
      loadLeaderboard();
    } else {
      document.getElementById("profileDiv").innerHTML = "";
    }
  });

  // ================= SETTINGS =================
  function showSettings() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("categoryDiv").style.display = "block";
    playSound("intro");
  }

  // ================= GAME =================
  let questions = [];
  let current = 0;
  let ladderLevel = 0;
  let fiftyUsed = false;
  let friendUsed = false;
  let audienceUsed = false;
  let secondChanceUsed = false;
  let guaranteedMoney = 0;
  const timePerQuestion = 30;

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
    guaranteedMoney = 0;

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

    let timeLeft = timePerQuestion;
    updateTimer(timeLeft);

    timer = setInterval(() => {
      timeLeft--;
      updateTimer(timeLeft);
      if (timeLeft <= 5) playSound("tick");
      if (timeLeft <= 0) nextQuestion(false); // false = missed
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = t + "s";
    timerBar.style.width = (t / timePerQuestion * 100) + "%";
    timerBar.style.background = t > 10 ? "#00ff00" : t > 5 ? "#ffcc00" : "#ff4d4d";
  }

  function checkAnswer(ans) {
    clearInterval(timer);
    stopAllSounds();

    const correct = questions[current].correctAnswer;
    let correctAnswerBtn;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) {
        b.classList.add("correct");
        correctAnswerBtn = b;
      }
      if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
    });

    // Animate answer
    if (ans === correct) {
      correctAnswerBtn.classList.add("pulse-glow");
      ladderLevel++;
      if ([4,9,14,19].includes(current)) guaranteedMoney = ladderLevel*100;
      playSound("correct");
    } else {
      if (!secondChanceUsed) {
        secondChanceUsed = true;
        alert("Second Chance Activated! Try again.");
        document.querySelectorAll(".option-btn").forEach(b=>b.disabled=false);
        return;
      }
      document.querySelectorAll(".option-btn").forEach(b => b.classList.add("shake-red"));
      playSound("wrong");
    }

    updateMoneyLadder();
    setTimeout(() => nextQuestion(ans === correct), 2000);
  }

  function nextQuestion(correct = true) {
    if (current >= questions.length - 1) {
      showFinalScreen();
      return;
    }
    current++;
    playSound("thinking");
    showQuestion();
  }

  // ================= MONEY LADDER =================
  function buildMoneyLadder(count) {
    moneyList.innerHTML = "";
    for (let i=count; i>=1; i--) {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + (i*100);
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder() {
    [...moneyList.children].forEach(li=>li.classList.remove("current","checkpoint"));
    const idx = moneyList.children.length - ladderLevel;
    if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
    // Checkpoints
    [4,9,14,19].forEach(cp => {
      const li = moneyList.children[moneyList.children.length-cp-1];
      if(li) li.classList.add("checkpoint");
    });
  }

  // ================= LIFELINES =================
  fiftyBtn.onclick = () => {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    let removed = 0;

    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed<2) { b.style.opacity=0.3; removed++; }
    });
  };

  callFriendBtn.onclick = () => {
    if (friendUsed) return;
    friendUsed = true;
    callFriendBtn.classList.add("used");
    playSound("call");
    callFriendBox.innerHTML = `📞 Friend says: <b>${questions[current].correctAnswer}</b>`;
  };

  audienceBtn.onclick = () => {
    if (audienceUsed) return;
    audienceUsed = true;
    audienceBtn.classList.add("used");
    playSound("audience");

    audienceVote.innerHTML = "";
    document.querySelectorAll(".option-btn").forEach(b=>{
      let percent = Math.floor(Math.random()*50)+25; // bias correct answer
      if(b.textContent !== questions[current].correctAnswer) percent = Math.floor(Math.random()*50);
      audienceVote.innerHTML += `<div>${b.textContent}: ${percent}%</div>`;
    });
  };

  // ================= FINAL SCREEN =================
  function showFinalScreen() {
    stopAllSounds();
    playSound("win");
    saveScore(ladderLevel*100);

    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 CONGRATULATIONS</h1>
        <h2>You Won $${ladderLevel*100}</h2>
        <h3>Guaranteed Money: $${guaranteedMoney}</h3>
        <button onclick="location.reload()">Restart Quiz</button>
        <button onclick="navigator.share({text:'I won $${ladderLevel*100} in NEON MILLIONAIRE!'})">Share Score</button>
      </div>
    `;
  }

  // ================= LEADERBOARD =================
  async function loadLeaderboard() {
    const snapshot = await db.collection("scores").get();
    const scores = {};
    snapshot.forEach(doc=>{
      const data = doc.data();
      if(!scores[data.name]) scores[data.name]=0;
      scores[data.name]+=data.score;
    });

    const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,10);

    const leaderboard = document.getElementById("leaderboard-list");
    leaderboard.innerHTML = "";
    sorted.forEach(([name,score])=>{
      const li = document.createElement("li");
      li.innerHTML = `<span>${name}</span> <span>$${score}</span>`;
      leaderboard.appendChild(li);
    });
  }

  function saveScore(score) {
    const user = auth.currentUser;
    if(!user) return;
    db.collection("scores").add({
      name: user.displayName||"Guest",
      photo: user.photoURL||"",
      score,
      time: new Date()
    });
  }

});
