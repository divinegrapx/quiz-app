// ---------------- FIREBASE CONFIG ----------------
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

// ---------------- DOM ----------------
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const audienceBox = document.getElementById("audience-box");

const leaderboardList = document.getElementById("leaderboard-list");
const quizContainer = document.getElementById("quiz-container");
const categoryDiv = document.getElementById("categoryDiv");
const authDiv = document.getElementById("authDiv");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, timer;
let fiftyUsed = false, callUsed = false, audienceUsed = false;
let ladderLevel = 0;
const timePerQuestion = 30;
const rewardPerQuestion = 100;

// ---------------- LOGIN ----------------
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
  onLoginSuccess();
});

emailRegisterBtn.onclick = () => { emailDiv.style.display="block"; authDiv.style.display="none"; };
emailCancelBtn.onclick = () => { emailDiv.style.display="none"; authDiv.style.display="block"; };

emailLoginBtn.onclick = async () => {
  await auth.signInWithEmailAndPassword(
    emailInput.value, passwordInput.value
  );
  onLoginSuccess();
};

emailRegisterSubmitBtn.onclick = async () => {
  await auth.createUserWithEmailAndPassword(
    emailInput.value, passwordInput.value
  );
  onLoginSuccess();
};

logoutBtn.onclick = async () => {
  await auth.signOut();
  location.reload();
};

function onLoginSuccess(){
  authDiv.style.display="none";
  emailDiv.style.display="none";
  categoryDiv.style.display="block";
  updateLeaderboard();
}

// ---------------- START QUIZ ----------------
startBtn.onclick = startQuiz;
fiftyBtn.onclick = useFifty;
callBtn.onclick = callFriend;
audienceBtn.onclick = audienceVote;

async function startQuiz(){
  quizContainer.style.display="block";
  lifelines.style.display="flex";
  current = score = ladderLevel = 0;
  fiftyUsed = callUsed = audienceUsed = false;

  fiftyBtn.disabled = callBtn.disabled = audienceBtn.disabled = false;
  buildMoneyLadder();

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
  questions = await res.json();

  showQuestion();
}

// ---------------- QUESTION ----------------
function showQuestion(){
  clearInterval(timer);
  let timeLeft = timePerQuestion;
  updateTimer(timeLeft);

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = a;
    btn.onclick = ()=>checkAnswer(a, btn);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if(timeLeft <= 0){ clearInterval(timer); nextQuestion(false); }
  },1000);
}

function updateTimer(t){
  timerText.textContent = `${t}s`;
  timerBar.style.width = (t/timePerQuestion*100)+"%";
}

// ---------------- ANSWER ----------------
function checkAnswer(answer, btn){
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(b=>{
    b.disabled = true;
    if(b.textContent === correct) b.classList.add("correct");
    if(b.textContent === answer && answer !== correct) b.classList.add("wrong");
  });

  if(answer === correct){
    score++;
    ladderLevel++;
    correctSound.play();
    updateMoneyLadder();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1500);
}

// ---------------- NEXT ----------------
function nextQuestion(){
  current++;
  if(current >= questions.length){
    quizDiv.innerHTML = `<h2>Finished!</h2>
    <p>You won $${score * rewardPerQuestion}</p>
    <button onclick="location.reload()">Restart</button>`;
    saveScore(auth.currentUser, score * rewardPerQuestion);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed = true;
  fiftyBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  let removed = 0;

  document.querySelectorAll(".option-btn").forEach(b=>{
    if(b.textContent !== correct && removed < 2){
      b.style.opacity = 0.3;
      removed++;
    }
  });
}

function callFriend(){
  if(callUsed) return;
  callUsed = true;
  callBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  alert(`📞 Friend says: "I'm pretty sure the answer is ${correct}!"`);
}

function audienceVote(){
  if(audienceUsed) return;
  audienceUsed = true;
  audienceBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  const options = [...document.querySelectorAll(".option-btn")];

  let html = "<b>Audience Votes:</b><br>";
  options.forEach(o=>{
    const percent = o.textContent === correct ? 60 : Math.floor(Math.random()*20);
    html += `${o.textContent}: ${percent}%<br>`;
  });

  audienceBox.innerHTML = html;
}

// ---------------- MONEY ----------------
function buildMoneyLadder(){
  moneyList.innerHTML = "";
  const num = parseInt(questionCount.value);

  for(let i=num;i>0;i--){
    const li = document.createElement("li");
    li.textContent = "$" + (i * rewardPerQuestion);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(l=>l.classList.remove("current"));
  const idx = moneyList.children.length - ladderLevel;
  if(lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user, score){
  if(!user) return;
  await db.collection("leaderboard").doc(user.uid).set({
    name: user.displayName || user.email,
    avatar: user.photoURL || "",
    score
  });
  updateLeaderboard();
}

async function updateLeaderboard(){
  leaderboardList.innerHTML = "";
  const snap = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snap.forEach(doc=>{
    const d = doc.data();
    const li = document.createElement("li");
    li.textContent = `${d.name} — $${d.score}`;
    leaderboardList.appendChild(li);
  });
}
