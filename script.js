document.addEventListener("DOMContentLoaded", () => {

firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
});

const auth = firebase.auth();
const db = firebase.firestore();

const quizDiv = document.getElementById("question-area");
const moneyList = document.getElementById("money-list");

let questions = [];
let current = 0;
let ladder = 0;

document.getElementById("googleLoginBtn").onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};

document.getElementById("guestLoginBtn").onclick = showSettings;

function showSettings() {
  authDiv.style.display = "none";
  categoryDiv.style.display = "block";
}

document.getElementById("startBtn").onclick = startQuiz;

async function startQuiz() {
  const res = await fetch(
    `https://the-trivia-api.com/api/questions?limit=20`
  );
  questions = await res.json();

  categoryDiv.style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  buildLadder(20);
  current = 0;
  ladder = 0;
  showQuestion();
}

function showQuestion() {
  const q = questions[current];
  quizDiv.innerHTML = `<h2>Question ${current + 1} / 20<br>${q.question}</h2>`;

  [...q.incorrectAnswers, q.correctAnswer]
    .sort(() => Math.random() - 0.5)
    .forEach(a => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = a;
      btn.onclick = () => answer(a);
      quizDiv.appendChild(btn);
    });
}

function answer(a) {
  const correct = questions[current].correctAnswer;
  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === a && a !== correct) b.classList.add("wrong");
  });

  if (a === correct) ladder++;

  updateLadder();
  setTimeout(next, 1500);
}

function next() {
  current++;
  if (current >= questions.length) {
    finish();
  } else showQuestion();
}

function buildLadder(n) {
  moneyList.innerHTML = "";
  for (let i = n; i >= 1; i--) {
    const li = document.createElement("li");
    li.className = "ladder-btn";
    li.textContent = "$" + i * 100;
    moneyList.appendChild(li);
  }
}

function updateLadder() {
  [...moneyList.children].forEach(li => li.classList.remove("current"));
  const idx = moneyList.children.length - ladder;
  if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}

async function finish() {
  quizDiv.innerHTML = `<h1>You won $${ladder * 100}</h1>`;
  saveScore(ladder * 100);
}

async function saveScore(score) {
  const u = auth.currentUser;
  if (!u) return;

  const ref = db.collection("leaderboard").doc(u.uid);
  const doc = await ref.get();

  if (doc.exists) {
    const d = doc.data();
    ref.update({
      totalScore: d.totalScore + score,
      games: d.games + 1
    });
  } else {
    ref.set({
      name: u.displayName || "Guest",
      photo: u.photoURL || "",
      totalScore: score,
      games: 1
    });
  }

  loadLeaderboard();
}

async function loadLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  const snap = await db.collection("leaderboard")
    .orderBy("totalScore", "desc")
    .limit(10)
    .get();

  snap.forEach(d => {
    const x = d.data();
    list.innerHTML += `
      <li>
        <img src="${x.photo || 'https://i.imgur.com/6VBx3io.png'}">
        <div><b>${x.name}</b><br>💰 ${x.totalScore}</div>
      </li>`;
  });
}

loadLeaderboard();
});
