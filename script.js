// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.firebasestorage.app",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4",
  measurementId: "G-7LKHH1EHQW"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ----------------
const loginBtn = document.getElementById("loginBtn");
const loginDiv = document.getElementById("loginDiv");
const categoryDiv = document.getElementById("categoryDiv");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const timerContainer = document.getElementById("timer-container");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const quizTitle = document.getElementById("quiz-title");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const hintBox = document.getElementById("hint-box");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, timer, timeLeft = 20;
let fiftyUsed = false, hintUsed = false, ladderLevel = 0;

// ---------------- LOGIN ----------------
loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      loginDiv.style.display = "none";
      categoryDiv.style.display = "block";
      quizTitle.textContent = `🎯 Welcome ${result.user.displayName}`;
      updateLeaderboard();
    })
    .catch(error => {
      console.error("Login error:", error);
      alert("Login failed! Check console.");
    });
});

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz() {
  startBtn.disabled = true;
  quizDiv.style.display = "flex";
  lifelines.style.display = "flex";
  progressContainer.style.display = "block";
  timerContainer.style.display = "block";
  moneyList.style.display = "block";
  hintBox.style.display = "none";
  quizDiv.innerHTML = "Loading...";

  ladderLevel = 0;
  current = 0;
  score = 0;
  fiftyUsed = false;
  hintUsed = false;
  fiftyBtn.disabled = false;
  hintBtn.disabled = false;
  progressBar.style.width = "0%";

  buildMoneyLadder();

  quizTitle.textContent = `🎯 ${categorySelect.value.replace(/_/g," ").toUpperCase()} — ${questionCount.value} Questions`;

  try {
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if (!res.ok) throw "API error";
    let data = await res.json();
    if (!data.length) throw "Empty API";

    questions = data.map(q => ({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers,
      hint: q.hint || "Think carefully."
    }));
  } catch {
    questions = fallbackQuestions;
  }

  showQuestion();
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  const total = parseInt(questionCount.value);
  for (let i = total; i >= 1; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i*100}`;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li => li.classList.remove("current"));
  const idx = moneyList.children.length - ladderLevel;
  if (lis[idx]) lis[idx].classList.add("current");
}

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  if (current >= questions.length) return endQuiz();
  clearInterval(timer);
  timeLeft = 20;
  updateTimer();
  hintBox.style.display = "none";

  const q = questions[current];
  quizDiv.innerHTML = "";
  const questionEl = document.createElement("h2");
  questionEl.textContent = q.question;
  quizDiv.appendChild(questionEl);

  const feedbackDiv = document.createElement("div");
  feedbackDiv.id = "feedback";
  quizDiv.appendChild(feedbackDiv);

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);
  answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = ans;
    btn.addEventListener("click", () => checkAnswer(ans));
    quizDiv.appendChild(btn);
  });

  progressBar.style.width = `${(current / questions.length) * 100}%`;
  startTimer();
}

// ---------------- TIMER ----------------
function startTimer() {
  timerText.style.display = "block";
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion(false);
    }
  }, 1000);
}

function updateTimer() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = `${(timeLeft/20)*100}%`;
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedbackDiv = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === answer && answer !== correct) btn.classList.add("wrong");
  });

  if (answer === correct) {
    score++;
    ladderLevel++;
    updateMoneyLadder();
    feedbackDiv.textContent = "✅ Correct!";
    feedbackDiv.style.color = "lime";
    correctSound.play();
  } else {
    feedbackDiv.textContent = "❌ Wrong!";
    feedbackDiv.style.color = "red";
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1000);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion() {
  current++;
  if (current >= questions.length) return endQuiz();
  showQuestion();
}

function endQuiz() {
  quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p><button onclick="location.reload()">Restart</button>`;
  startBtn.disabled = false;
  lifelines.style.display = "none";
  timerContainer.style.display = "none";
  progressContainer.style.display = "none";
  moneyList.style.display = "block";
  hintBox.style.display = "none";

  if (auth.currentUser) saveScore(auth.currentUser, score);
}

// ---------------- LIFELINES ----------------
function useFifty() {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  let removed = 0;
  document.querySelectorAll(".option-btn").forEach(btn => {
    if (btn.textContent !== correct && removed < 2) {
      btn.style.display = "none";
      removed++;
    }
  });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;

  hintBox.textContent = "💡 Hint: " + questions[current].hint;
  hintBox.style.display = "block";
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user, score) {
  if (!user) return;
  const data = {
    uid: user.uid,
    name: user.displayName,
    avatar: user.photoURL,
    score,
    date: firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection("leaderboard").doc(user.uid).set(data, {merge:true});
  updateLeaderboard();
}

async function updateLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "Loading...";
  try {
    const snapshot = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
    list.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const li = document.createElement("li");
      li.style.display = "flex"; li.style.alignItems = "center"; li.style.gap = "8px";

      const img = document.createElement("img");
      img.src = d.avatar; img.width = 30; img.height = 30; img.style.borderRadius="50%";

      li.appendChild(img);
      li.appendChild(document.createTextNode(`${d.name} — ${d.score} pts`));
      list.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = "Failed to load leaderboard.";
  }
}

updateLeaderboard();
