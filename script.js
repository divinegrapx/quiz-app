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

// Initialize Firebase (compat)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ELEMENTS ----------------
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
let questionAnswered = false; // prevent double clicks

// ---------------- FALLBACK QUESTIONS ----------------
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
  { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
  { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
];

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
      console.error("Google login failed:", error);
      alert("Login failed! Make sure your domain is authorized in Firebase.");
    });
});

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder() {
  moneyList.innerHTML = "";
  const numQuestions = parseInt(questionCount.value);
  for (let i = numQuestions; i > 0; i--) {
    const li = document.createElement("li");
    li.textContent = `$${i * 100}`;
    li.style.listStyle = "none";
    li.style.padding = "8px 12px";
    li.style.borderRadius = "8px";
    li.style.background = "#111";
    li.style.color = "#fff";
    li.style.margin = "4px 0";
    moneyList.appendChild(li);
  }
}

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
  questionAnswered = false;
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

// ---------------- SHOW QUESTION ----------------
function showQuestion() {
  clearInterval(timer);
  questionAnswered = false;
  timeLeft = 20;
  updateTimer();
  hintBox.style.display = "none";

  const q = questions[current];
  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

  quizDiv.innerHTML = `<h2 style="font-size:1.2rem;">${q.question}</h2><div id="feedback"></div>`;
  answers.forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(a);
    quizDiv.appendChild(btn);
  });

  updateMoneyLadderHighlight();
  startTimer();
}

// ---------------- TIMER ----------------
function startTimer() {
  timerText.style.display = "block";
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      checkAnswer(null); // treat as wrong if time runs out
    }
  }, 1000);
}

function updateTimer() {
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = `${(timeLeft / 20) * 100}%`;
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer) {
  if (questionAnswered) return; // prevent multiple clicks
  questionAnswered = true;
  clearInterval(timer);

  const q = questions[current];
  const correct = q.correctAnswer;
  const feedbackDiv = document.getElementById("feedback");

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === answer && answer !== correct) b.classList.add("wrong");
  });

  if (answer === correct) {
    score++;
    ladderLevel++;
    updateMoneyLadderHighlight();
    feedbackDiv.textContent = "✅ Correct!";
    feedbackDiv.style.color = "lime";
    correctSound.play();
  } else {
    feedbackDiv.textContent = answer === null ? "⏰ Time's up!" : "❌ Wrong!";
    feedbackDiv.style.color = "red";
    wrongSound.play();
  }

  setTimeout(() => nextQuestion(), 1000);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion() {
  current++;
  if (current >= questions.length) {
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>
      <button onclick="location.reload()">Restart</button>`;
    startBtn.disabled = false;
    lifelines.style.display = "none";
    timerContainer.style.display = "none";
    progressContainer.style.display = "none";
    moneyList.style.display = "none";
    hintBox.style.display = "none";

    const user = auth.currentUser;
    saveScore(user, score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty() {
  if (fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  const btns = Array.from(document.querySelectorAll(".option-btn"));
  let removed = 0;
  btns.forEach(b => {
    if (b.textContent !== correct && removed < 2) {
      b.style.display = "none";
      removed++;
    }
  });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  hintBtn.disabled = true;

  const q = questions[current];
  hintBox.textContent = "💡 Hint: " + q.hint;
  hintBox.style.display = "block";
}

// ---------------- MONEY LADDER HIGHLIGHT ----------------
function updateMoneyLadderHighlight() {
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li => li.style.background = "#111");
  const idx = moneyList.children.length - ladderLevel - 1;
  if (lis[idx]) lis[idx].style.background = "#00f2fe";
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user, score) {
  if (!user) return;
  const userData = {
    uid: user.uid,
    name: user.displayName,
    avatar: user.photoURL,
    score: score,
    date: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection("leaderboard").doc(user.uid).set(userData, { merge: true });
    updateLeaderboard();
  } catch (err) {
    console.error("Error saving score:", err);
  }
}

async function updateLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "Loading...";
  try {
    const snapshot = await db.collection("leaderboard")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    list.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "8px";

      const img = document.createElement("img");
      img.src = data.avatar;
      img.width = 30;
      img.height = 30;
      img.style.borderRadius = "50%";

      li.appendChild(img);
      li.appendChild(document.createTextNode(`${data.name} — ${data.score} pts`));
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    list.innerHTML = "Failed to load leaderboard.";
  }
}

// Initialize leaderboard
updateLeaderboard();
