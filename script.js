document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */
  firebase.initializeApp({
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app"
  });

  const auth = firebase.auth();

  /* ================= ELEMENTS ================= */
  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const quizDiv = document.getElementById("quiz");
  const profileDiv = document.getElementById("profileDiv");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");

  const startBtn = document.getElementById("startBtn");
  const moneyList = document.getElementById("money-list");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const callBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");

  const timerText = document.getElementById("timer-text");
  const timerBar = document.getElementById("timer-bar");

  /* ================= AUTH ================= */
  auth.onAuthStateChanged(user => {
    if (user) {
      authDiv.style.display = "none";
      categoryDiv.style.display = "block";

      profileDiv.innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || "Guest"}</h3>
      `;
    } else {
      authDiv.style.display = "block";
      categoryDiv.style.display = "none";
      quizContainer.style.display = "none";
      profileDiv.innerHTML = "";
    }
  });

  googleLoginBtn.onclick = () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  };

  guestLoginBtn.onclick = () => {
    auth.signInAnonymously();
  };

  /* ================= SOUNDS ================= */
  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    tick: document.getElementById("tick-sound"),
    call: document.getElementById("call-sound"),
    audience: document.getElementById("audience-sound")
  };

  let soundEnabled = true;
  let audioReady = false;

  document.body.addEventListener("click", () => {
    if (audioReady) return;
    Object.values(sounds).forEach(s => s?.load());
    audioReady = true;
  }, { once: true });

  function play(name, loop = false) {
    if (!soundEnabled || !audioReady) return;
    const s = sounds[name];
    if (!s) return;
    s.pause();
    s.currentTime = 0;
    s.loop = loop;
    s.play().catch(() => {});
  }

  function stop(name) {
    if (!sounds[name]) return;
    sounds[name].pause();
    sounds[name].currentTime = 0;
  }

  /* ================= GAME DATA ================= */
  const MONEY = [
    100, 200, 300, 500, 1000,
    2000, 4000, 8000, 16000, 32000,
    64000, 125000, 250000, 500000, 1000000
  ];

  let questions = [];
  let questionIndex = 0;
  let earnedIndex = -1;
  let timer;
  let locked = false;
  let timePerQuestion = 30;

  /* ================= START ================= */
  startBtn.onclick = async () => {
    soundEnabled = soundToggle.value === "on";
    play("intro");

    questionIndex = 0;
    earnedIndex = -1;

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    buildMoney();

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}`
    );
    questions = await res.json();

    showQuestion();
  };

  /* ================= QUESTIONS ================= */
  function showQuestion() {
    locked = false;
    stop("thinking");
    play("thinking", true);

    clearInterval(timer);
    const q = questions[questionIndex];

    quizDiv.innerHTML = `<h2>Q${questionIndex + 1}: ${q.question}</h2>`;

    [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5)
      .forEach(ans => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = ans;
        btn.onclick = () => answer(ans);
        quizDiv.appendChild(btn);
      });

    startTimer();
  }

  function startTimer() {
    let t = timePerQuestion;
    timerText.textContent = `${t}s`;
    timerBar.style.width = "100%";

    timer = setInterval(() => {
      t--;
      timerText.textContent = `${t}s`;
      timerBar.style.width = `${(t / timePerQuestion) * 100}%`;
      if (t <= 5) play("tick");
      if (t <= 0) nextQuestion(false);
    }, 1000);
  }

  /* ================= ANSWERS ================= */
  function answer(ans) {
    if (locked) return;
    locked = true;
    clearInterval(timer);
    stop("thinking");

    const correct = questions[questionIndex].correctAnswer;
    const isCorrect = ans === correct;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === ans && !isCorrect) b.classList.add("wrong");
    });

    play(isCorrect ? "correct" : "wrong");

    setTimeout(() => nextQuestion(isCorrect), 1500);
  }

  function nextQuestion(correct) {
    if (correct) {
      earnedIndex++;
      updateMoney();
    }

    questionIndex++;
    if (questionIndex >= MONEY.length) return win();
    showQuestion();
  }

  /* ================= LIFELINES ================= */
  fiftyBtn.onclick = () => {
    const correct = questions[questionIndex].correctAnswer;
    let removed = 0;
    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed < 2) {
        b.style.visibility = "hidden";
        b.disabled = true;
        removed++;
      }
    });
    fiftyBtn.disabled = true;
  };

  callBtn.onclick = () => {
    play("call");
    alert(`📞 Friend thinks:\n"${questions[questionIndex].correctAnswer}"`);
    callBtn.disabled = true;
  };

  audienceBtn.onclick = () => {
    play("audience");
    alert(`📊 Audience votes:\n"${questions[questionIndex].correctAnswer}"`);
    audienceBtn.disabled = true;
  };

  /* ================= MONEY ================= */
  function buildMoney() {
    moneyList.innerHTML = "";
    MONEY.slice().reverse().forEach(v => {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + v.toLocaleString();
      moneyList.appendChild(li);
    });
  }

  function updateMoney() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const idx = MONEY.length - 1 - earnedIndex;
    if (moneyList.children[idx]) {
      moneyList.children[idx].classList.add("current");
    }
  }

  /* ================= END ================= */
  function win() {
    stop("thinking");
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🏆 MILLIONAIRE</h1>
        <h2>$${MONEY[earnedIndex].toLocaleString()}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

});
