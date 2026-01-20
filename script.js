// FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ELEMENTS
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const startBtn = document.getElementById("startBtn");
const categoryDiv = document.getElementById("categoryDiv");
const authDiv = document.getElementById("authDiv");
const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const audienceBox = document.getElementById("audience-box");

const bgMusic = document.getElementById("bgMusic");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");
const callSound = document.getElementById("callSound");
const audienceSound = document.getElementById("audienceSound");

let questions = [];
let current = 0;
let score = 0;
let timer;
let timePerQuestion = 30;

// LOGIN
googleLoginBtn.onclick = async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
  onLoginSuccess();
};

function onLoginSuccess() {
  authDiv.style.display = "none";
  categoryDiv.style.display = "block";
  document.getElementById("profileDiv").style.display = "block";

  const user = auth.currentUser;
  document.getElementById("profilePic").src = user.photoURL;
  document.getElementById("playerName").textContent = user.displayName;
}

// START QUIZ
startBtn.onclick = async () => {
  quizContainer.style.display = "block";
  bgMusic.src = "sounds/thinking.mp3";
  bgMusic.play();

  const count = document.getElementById("questionCount").value;
  const cat = document.getElementById("categorySelect").value;

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${count}&categories=${cat}`);
  questions = await res.json();

  buildMoneyLadder(count);
  showQuestion();
};

// QUESTION
function showQuestion() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);
  answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = ans;
    btn.onclick = () => checkAnswer(ans);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft + "s";
    timerBar.style.width = (timeLeft / timePerQuestion * 100) + "%";

    if (timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if (timeLeft <= 0) nextQuestion(false);
  }, 1000);
}

// CHECK ANSWER
function checkAnswer(ans) {
  clearInterval(timer);
  const correct = questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
    if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
  });

  if (ans === correct) {
    score++;
    correctSound.play();
    updateMoneyLadder();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 2000);
}

// NEXT
function nextQuestion() {
  current++;
  if (current >= questions.length) {
    bgMusic.src = "sounds/win.mp3";
    bgMusic.play();
    quizDiv.innerHTML = `<h2>🎉 You won $${score * 100}</h2>`;
    return;
  }
  showQuestion();
}

// MONEY LADDER
function buildMoneyLadder(q) {
  moneyList.innerHTML = "";
  for (let i = q; i > 0; i--) {
    const li = document.createElement("li");
    li.textContent = "$" + (i * 100);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder() {
  const idx = moneyList.children.length - score;
  moneyList.querySelectorAll("li").forEach(li => li.classList.remove("current"));
  if (moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}

// CALL A FRIEND
callFriendBtn.onclick = () => {
  callSound.play();
  alert("📞 Your friend thinks the answer is: " + questions[current].correctAnswer);
};

// AUDIENCE
audienceBtn.onclick = () => {
  audienceSound.play();
  audienceBox.innerHTML = "";
  ["A","B","C","D"].forEach(() => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = Math.random()*100 + "%";
    audienceBox.appendChild(bar);
  });
};
