document.addEventListener("DOMContentLoaded", () => {

  /* ============ FIREBASE ============ */
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

  /* ============ ELEMENTS ============ */
  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const quizDiv = document.getElementById("quiz");
  const profileDiv = document.getElementById("profileDiv");

  const startBtn = document.getElementById("startBtn");
  const moneyList = document.getElementById("money-list");
  const timerText = document.getElementById("timer-text");
  const timerBar = document.getElementById("timer-bar");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");

  /* ============ UI ============ */
  function showSettings() {
    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
  }

  auth.onAuthStateChanged(user => {
    if (user) {
      profileDiv.innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || user.email}</h3>
      `;
      showSettings();
    }
  });

  /* ============ SOUNDS ============ */
  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    tick: document.getElementById("tick-sound"),
    call: document.getElementById("call-sound"),
    audience: document.getElementById("audience-sound"),
    fifty: document.getElementById("fifty-sound")
  };

  let soundEnabled = true;
  let audioUnlocked = false;

  document.body.addEventListener("click", () => {
    if (audioUnlocked) return;
    Object.values(sounds).forEach(s => s?.load());
    audioUnlocked = true;
  }, { once: true });

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

  /* ============ GAME DATA ============ */
  const MONEY = [
    100, 200, 300, 500, 1000,
    2000, 4000, 8000, 16000, 32000,
    64000, 125000, 250000, 500000, 1000000
  ];

  let questions = [];
  let current = 0;
  let earned = 0;
  let timer;
  let locked = false;
  let timePerQuestion = 30;

  /* ============ START ============ */
  startBtn.onclick = async () => {
    soundEnabled = soundToggle.value === "on";
    timePerQuestion = difficultySelect.value === "hardcore" ? 20 : 30;

    play("intro");

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}`
    );
    questions = await res.json();

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    buildMoney();
    showQuestion();
  };

  /* ============ QUESTIONS ============ */
  function showQuestion() {
    locked = false;
    stop("thinking");
    play("thinking", true);

    clearInterval(timer);
    const q = questions[current];

    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5)
      .forEach(a => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = a;
        btn.onclick = () => answer(a);
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

  /* ============ ANSWERS ============ */
  function answer(a) {
    if (locked) return;
    locked = true;
    clearInterval(timer);
    stop("thinking");

    const correct = questions[current].correctAnswer;
    const isCorrect = a === correct;

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === a && !isCorrect) b.classList.add("wrong");
    });

    play(isCorrect ? "correct" : "wrong");

    setTimeout(() => nextQuestion(isCorrect), 1500);
  }

  function nextQuestion(correct) {
    if (correct) {
      earned = MONEY[current];
      updateMoney();
    }

    current++;
    if (current >= MONEY.length) return win();
    showQuestion();
  }

  /* ============ LIFELINES ============ */
  fiftyBtn.onclick = () => {
    play("fifty");
    const correct = questions[current].correctAnswer;
    let removed = 0;
    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed < 2) {
        b.disabled = true;
        b.style.visibility = "hidden";
        removed++;
      }
    });
    fiftyBtn.disabled = true;
  };

  callFriendBtn.onclick = () => {
    play("call");
    alert(`📞 Friend thinks the answer is:\n"${questions[current].correctAnswer}"`);
    callFriendBtn.disabled = true;
  };

  audienceBtn.onclick = () => {
    play("audience");
    alert(`👥 Audience votes strongly for:\n"${questions[current].correctAnswer}"`);
    audienceBtn.disabled = true;
  };

  /* ============ MONEY ============ */
  function buildMoney() {
    moneyList.innerHTML = "";
    MONEY.slice().reverse().forEach(v => {
      const li = document.createElement("li");
      li.textContent = "$" + v.toLocaleString();
      moneyList.appendChild(li);
    });
    updateMoney();
  }

  function updateMoney() {
    [...moneyList.children].forEach(li => li.classList.remove("current"));
    const idx = MONEY.length - (current + 1);
    if (moneyList.children[idx]) {
      moneyList.children[idx].classList.add("current");
    }
  }

  /* ============ END ============ */
  function win() {
    stop("thinking");
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🏆 MILLIONAIRE</h1>
        <h2>$${earned.toLocaleString()}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

});
