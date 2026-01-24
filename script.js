// 🔥 FIREBASE CONFIG (PUT YOUR REAL KEYS)
firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
});

const auth = firebase.auth();
const db = firebase.firestore();

let user = null;
let score = 0;
let questionIndex = 0;
let secondChanceUsed = false;

const questions = [
  {
    q: "Capital of France?",
    answers: ["Paris", "London", "Berlin", "Rome"],
    correct: 0
  },
  {
    q: "5 + 5?",
    answers: ["5", "10", "15", "20"],
    correct: 1
  }
];

const checkpoints = [5, 10, 15, 20];

const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const scoreBox = document.getElementById("scoreBox");
const moneyList = document.getElementById("money-list");

document.getElementById("guestLoginBtn").onclick = () => {
  user = { uid: "guest_" + Date.now(), displayName: "Guest" };
  showCategory();
};

document.getElementById("googleLoginBtn").onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(res => {
    user = res.user;
    showCategory();
  });
};

document.getElementById("emailRegisterBtn").onclick = () => {
  authDiv.classList.add("hidden");
  emailDiv.classList.remove("hidden");
};

document.getElementById("emailLoginBtn").onclick = () => {
  auth.signInWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  ).then(res => {
    user = res.user;
    emailDiv.classList.add("hidden");
    showCategory();
  });
};

document.getElementById("emailRegisterSubmitBtn").onclick = () => {
  auth.createUserWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  ).then(res => {
    user = res.user;
    emailDiv.classList.add("hidden");
    showCategory();
  });
};

document.getElementById("emailCancelBtn").onclick = () => {
  emailDiv.classList.add("hidden");
  authDiv.classList.remove("hidden");
};

function showCategory() {
  authDiv.classList.add("hidden");
  categoryDiv.classList.remove("hidden");
}

document.getElementById("startBtn").onclick = () => {
  categoryDiv.classList.add("hidden");
  quizContainer.classList.remove("hidden");
  renderLadder();
  showQuestion();
};

function renderLadder() {
  moneyList.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const li = document.createElement("li");
    li.textContent = `Q${i} - $${i * 100}`;
    if (i === questionIndex + 1) li.classList.add("active");
    moneyList.appendChild(li);
  }
}

function showQuestion() {
  quizDiv.innerHTML = "";
  const q = questions[questionIndex];
  const h2 = document.createElement("h2");
  h2.textContent = q.q;
  quizDiv.appendChild(h2);

  q.answers.forEach((a, i) => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.onclick = () => handleAnswer(btn, i);
    quizDiv.appendChild(btn);
  });
}

function handleAnswer(btn, index) {
  const q = questions[questionIndex];
  const buttons = quizDiv.querySelectorAll("button");

  buttons.forEach(b => b.disabled = true);

  if (index === q.correct) {
    btn.classList.add("correct");
    document.getElementById("correct-sound").play();
    score += 100;
    scoreBox.textContent = `$${score}`;
    questionIndex++;
    setTimeout(() => {
      renderLadder();
      showQuestion();
    }, 1000);
  } else {
    btn.classList.add("wrong");
    buttons[q.correct].classList.add("correct");
    document.getElementById("wrong-sound").play();

    if (!secondChanceUsed) {
      secondChanceUsed = true;
      score = Math.max(0, score - 100);
      scoreBox.textContent = `$${score}`;
    } else {
      endGame();
    }
  }
}

function endGame() {
  quizDiv.innerHTML = `<h2>Game Over</h2><p>You won $${score}</p>`;
  saveScore();
}

function saveScore() {
  if (!user) return;
  db.collection("leaderboard").doc(user.uid).set({
    name: user.displayName || "Guest",
    score: firebase.firestore.FieldValue.increment(score)
  }, { merge: true });
}
