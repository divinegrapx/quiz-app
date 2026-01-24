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
  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");

  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  const startBtn = document.getElementById("startBtn");
  const quizDiv = document.getElementById("quiz");

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
  const nightmareCheck = document.getElementById("nightmareModeCheck");
  const soundToggle = document.getElementById("soundToggle");

  /* ================= SOUNDS ================= */
  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    tick: document.getElementById("tick-sound"),
    win: document.getElementById("win-sound")
  };

  let soundEnabled = true;
  function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play();
  }

  /* ================= AUTH ================= */
  googleLoginBtn.onclick = async () => {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    showSettings();
  };

  guestLoginBtn.onclick = () => showSettings();

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
    showSettings();
  };

  emailRegisterSubmitBtn.onclick = async () => {
    await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
    showSettings();
  };

  function showSettings() {
    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
    playSound("intro");
  }

  /* ================= GAME STATE ================= */
  let questions = [];
  let current = 0;
  let score = 0;
  let timer;
  let timePerQuestion = 30;

  let secondChanceActive = false;
  let secondChanceUsed = false;

  /* ================= START QUIZ ================= */
  startBtn.onclick = async () => {
    soundEnabled = soundToggle.value === "on";
    timePerQuestion = nightmareCheck.checked ? 20 : 30;

    const res = await fetch(
      `https://the-trivia-api.com/api/questions?limit=20&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
    );
    questions = await res.json();

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";

    score = 0;
    current = 0;
    secondChanceActive = false;
    secondChanceUsed = false;

    playSound("thinking");
    showQuestion();
  };

  /* ================= QUESTION ================= */
  function showQuestion() {
    clearInterval(timer);
    quizDiv.innerHTML = "";

    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;

    const answers = [...q.incorrectAnswers, q.correctAnswer]
      .sort(() => Math.random() - 0.5);

    answers.forEach(ans => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = ans;
      btn.onclick = () => handleAnswer(btn, ans);
      quizDiv.appendChild(btn);
    });

    startTimer();
  }

  /* ================= TIMER ================= */
  function startTimer() {
    let t = timePerQuestion;
    updateTimer(t);

    timer = setInterval(() => {
      t--;
      updateTimer(t);
      if (t <= 5) playSound("tick");
      if (t <= 0) loseQuestion();
    }, 1000);
  }

  function updateTimer(t) {
    timerText.textContent = t + "s";
    timerBar.style.width = (t / timePerQuestion * 100) + "%";
  }

  /* ================= ANSWER HANDLING ================= */
  function handleAnswer(btn, answer) {
    clearInterval(timer);

    const correct = questions[current].correctAnswer;
    const buttons = document.querySelectorAll(".option-btn");

    buttons.forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
    });

    if (answer === correct) {
      btn.classList.add("correct");
      score += 100;
      playSound("correct");
      nextQuestion();
    } else {
      btn.classList.add("wrong");
      playSound("wrong");

      if (secondChanceActive) {
        secondChanceActive = false;
        secondChanceUsed = true;
        return; // forgive once
      }

      score = Math.max(0, score - 100);
      setTimeout(showFinal, 1500);
    }
  }

  function loseQuestion() {
    score = Math.max(0, score - 100);
    showFinal();
  }

  function nextQuestion() {
    setTimeout(() => {
      current++;
      if (current >= questions.length) showFinal();
      else showQuestion();
    }, 1200);
  }

  /* ================= LIFELINES ================= */
  fiftyBtn.onclick = () => {
    if (score < 100) return;
    score -= 100;
    fiftyBtn.classList.add("used");

    const correct = questions[current].correctAnswer;
    let removed = 0;
    document.querySelectorAll(".option-btn").forEach(b => {
      if (b.textContent !== correct && removed < 2) {
        b.style.opacity = 0.2;
        removed++;
      }
    });
  };

  secondChanceBtn.onclick = () => {
    if (score < 200 || secondChanceUsed) return;
    score -= 200;
    secondChanceActive = true;
    secondChanceBtn.classList.add("used");
  };

  /* ================= FINAL ================= */
  function showFinal() {
    playSound("win");
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 Game Over</h1>
        <h2>You earned $${score}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
  }

});
