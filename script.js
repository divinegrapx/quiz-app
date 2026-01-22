document.addEventListener("DOMContentLoaded", () => {

/* ================= UI ================= */

function showSettings() {
  authDiv.style.display = "none";
  emailDiv.style.display = "none";
  categoryDiv.style.display = "block";
}

function showQuiz() {
  categoryDiv.style.display = "none";
  quizContainer.style.display = "block";
}

/* ================= FIREBASE ================= */

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

/* ================= ELEMENTS ================= */

const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const leaderboardList = document.getElementById("leaderboard-list");

/* ================= AUTH ================= */

googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};

guestLoginBtn.onclick = showSettings;

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

/* ================= SOUNDS ================= */

const S = {
  intro: document.getElementById("intro-sound"),
  thinking: document.getElementById("thinking-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  lose: document.getElementById("lose-sound"),
  tick: document.getElementById("tick-sound"),
  call: document.getElementById("call-sound"),
  audience: document.getElementById("audience-sound")
};

let soundEnabled = true;

/* ================= GAME ================= */

const MONEY = [
  100,200,300,500,1000,
  2000,4000,8000,16000,32000,
  64000,125000,250000,500000,1000000
];

let questions = [];
let current = 0;
let timer;
let timePerQuestion = 30;
let locked = false;

/* ================= START ================= */

startBtn.onclick = async () => {
  soundEnabled = soundToggle.value === "on";
  timePerQuestion = modeSelect.value === "hardcore" ? 20 : 30;

  if (soundEnabled) {
    S.intro.currentTime = 0;
    S.intro.play();
  }

  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`
  );

  questions = await res.json();
  showQuiz();
  buildMoney();
  showQuestion();
};

/* ================= QUESTIONS ================= */

function showQuestion() {
  locked = false;
  clearInterval(timer);

  if (soundEnabled) {
    S.thinking.loop = true;
    S.thinking.play();
  }

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2>`;

  [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random()-0.5)
    .forEach(a => {
      const b = document.createElement("button");
      b.className = "option-btn";
      b.textContent = a;
      b.onclick = () => answer(a);
      quizDiv.appendChild(b);
    });

  startTimer();
}

function startTimer() {
  let t = timePerQuestion;
  timerText.textContent = t + "s";
  timerBar.style.width = "100%";

  timer = setInterval(() => {
    t--;
    timerText.textContent = t + "s";
    timerBar.style.width = `${(t/timePerQuestion)*100}%`;

    if (t <= 5 && soundEnabled) S.tick.play();
    if (t <= 0) timeOut();
  }, 1000);
}

/* ================= ANSWER LOGIC ================= */

function answer(a) {
  if (locked) return;
  locked = true;
  clearInterval(timer);
  S.thinking.pause();

  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === a && a !== correct) b.classList.add("wrong");
  });

  if (a === correct) {
    if (soundEnabled) S.correct.play();
    current++;
    updateMoney();
  } else {
    if (soundEnabled) S.wrong.play();
    current++; // 🔥 continue game, no money gained
  }

  setTimeout(() => {
    if (current === MONEY.length) win();
    else showQuestion();
  }, 1800);
}

/* ================= END CONDITIONS ================= */

function timeOut() {
  if (soundEnabled) S.lose.play();
  endGame(getCurrentWinnings());
}

function win() {
  if (soundEnabled) S.win.play();
  endGame(1000000);
}

function endGame(score) {
  saveScore(score);
  quizDiv.innerHTML = `
    <div class="final-screen">
      <h1>🏁 GAME FINISHED</h1>
      <h2>$${score.toLocaleString()}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>`;
}

/* ================= MONEY ================= */

function buildMoney() {
  moneyList.innerHTML = "";
  MONEY.slice().reverse().forEach(v=>{
    const li=document.createElement("li");
    li.textContent="$"+v.toLocaleString();
    moneyList.appendChild(li);
  });
  updateMoney();
}

function updateMoney() {
  [...moneyList.children].forEach(li=>li.classList.remove("current"));
  const i = MONEY.length-current-1;
  if (moneyList.children[i]) moneyList.children[i].classList.add("current");
}

function getCurrentWinnings() {
  return current > 0 ? MONEY[current-1] : 0;
}

/* ================= LIFELINES ================= */

fiftyBtn.onclick = () => {
  const correct = questions[current].correctAnswer;
  let removed = 0;
  document.querySelectorAll(".option-btn").forEach(b=>{
    if(b.textContent!==correct && removed<2){
      b.disabled=true;
      b.style.visibility="hidden";
      removed++;
    }
  });
};

callFriendBtn.onclick = () => {
  if (soundEnabled) S.call.play();
  alert("📞 Friend thinks: " + questions[current].correctAnswer);
};

audienceBtn.onclick = () => {
  if (soundEnabled) S.audience.play();
  alert("📊 Audience votes strongly for: " + questions[current].correctAnswer);
};

/* ================= LEADERBOARD ================= */

function saveScore(score) {
  db.collection("scores").add({
    name: auth.currentUser?.displayName || "Guest",
    score,
    time: firebase.firestore.FieldValue.serverTimestamp()
  }).then(loadLeaderboard);
}

function loadLeaderboard() {
  leaderboardList.innerHTML="<h3>🏆 Top 10</h3>";
  db.collection("scores").orderBy("score","desc").limit(10).get()
    .then(snap=>{
      snap.forEach(d=>{
        const li=document.createElement("li");
        li.textContent=`${d.data().name} — $${d.data().score.toLocaleString()}`;
        leaderboardList.appendChild(li);
      });
    });
}

loadLeaderboard();

});
