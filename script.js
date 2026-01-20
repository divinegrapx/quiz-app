// ================= FIREBASE CONFIG =================
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

// ================= DOM ELEMENTS =================
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
const difficultySelect = document.getElementById("difficultySelect");

const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const moneyList = document.getElementById("money-list");
const leaderboardList = document.getElementById("leaderboard-list");

const quizContainer = document.getElementById("quiz-container");
const categoryDiv = document.getElementById("categoryDiv");
const authDiv = document.getElementById("authDiv");

// Call + Audience UI
const callScreen = document.getElementById("callScreen");
const friendAnswer = document.getElementById("friendAnswer");

const audienceScreen = document.getElementById("audienceScreen");
const bars = document.querySelectorAll(".audience-bar span");

// Sounds
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");
const callSound = document.getElementById("call-sound");
const bgMusic = document.getElementById("bg-music");

// ================= GLOBALS =================
let questions = [];
let current = 0;
let score = 0;
let timer;

let fiftyUsed = false;
let callUsed = false;
let audienceUsed = false;

let ladderLevel = 0;
let timePerQuestion = 30;
let reward = 0;

// ================= FALLBACK QUESTIONS =================
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"] },
  { question: "How many days in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"] },
  { question: "Which planet is the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"] }
];

// ================= LOGIN =================
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
  onLoginSuccess();
});

emailRegisterBtn.addEventListener("click", () => {
  emailDiv.style.display = "block";
  authDiv.style.display = "none";
});

emailCancelBtn.addEventListener("click", () => {
  emailDiv.style.display = "none";
  authDiv.style.display = "block";
});

emailLoginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  await auth.signInWithEmailAndPassword(email, password);
  onLoginSuccess();
});

emailRegisterSubmitBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  await auth.createUserWithEmailAndPassword(email, password);
  onLoginSuccess();
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  location.reload();
});

function onLoginSuccess(){
  authDiv.style.display="none";
  categoryDiv.style.display="block";
  bgMusic.play();
  updateLeaderboard();
}

// ================= START QUIZ =================
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
callBtn.addEventListener("click", callFriend);
audienceBtn.addEventListener("click", audienceVote);

async function startQuiz(){
  startBtn.disabled = true;
  quizContainer.style.display = "block";
  lifelines.style.display = "flex";

  current = 0;
  score = 0;
  ladderLevel = 0;
  reward = 0;

  fiftyUsed = callUsed = audienceUsed = false;

  buildMoneyLadder();

  try{
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
    const data = await res.json();

    questions = data.map(q => ({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers
    }));

  }catch{
    questions = fallbackQuestions;
  }

  showQuestion();
}

// ================= SHOW QUESTION =================
function showQuestion(){
  clearInterval(timer);
  let timeLeft = timePerQuestion;

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(()=>Math.random()-0.5);

  answers.forEach(a=>{
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(a, btn);
    quizDiv.appendChild(btn);
  });

  updateTimer(timeLeft);

  timer = setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);

    if(timeLeft <= 5 && timeLeft > 0) tickSound.play();
    if(timeLeft <= 0){
      clearInterval(timer);
      nextQuestion(false);
    }
  },1000);
}

// ================= TIMER =================
function updateTimer(t){
  timerText.textContent = `${t}s`;
  timerBar.style.width = (t/timePerQuestion*100)+"%";

  if(t > 10) timerBar.style.background = "#00ff00";
  else if(t > 5) timerBar.style.background = "#ffcc00";
  else timerBar.style.background = "#ff4d4d";
}

// ================= CHECK ANSWER =================
function checkAnswer(answer, btn){
  clearInterval(timer);

  const correct = questions[current].correctAnswer;
  const feedback = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(b=>{
    b.disabled = true;
    if(b.textContent === correct) b.classList.add("correct");
    if(b.textContent === answer && answer !== correct) b.classList.add("wrong");
  });

  if(answer === correct){
    score++;
    ladderLevel++;
    reward += 100;
    correctSound.play();
    feedback.innerHTML = "✅ Correct!";
    updateMoneyLadder();
  }else{
    wrongSound.play();
    feedback.innerHTML = `❌ Wrong!<br>Correct: <b>${correct}</b>`;
  }

  setTimeout(nextQuestion,1800);
}

// ================= NEXT =================
function nextQuestion(){
  callScreen.style.display = "none";
  audienceScreen.style.display = "none";

  current++;
  if(current >= questions.length){
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Reward: $${reward}</p><button onclick="location.reload()">Restart</button>`;
    saveScore(auth.currentUser, reward);
    return;
  }
  showQuestion();
}

// ================= LIFELINES =================
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed = true;

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

  callScreen.style.display = "flex";
  callSound.play();

  const correct = questions[current].correctAnswer;
  setTimeout(()=>{
    friendAnswer.innerHTML = `🤔 I think the answer is:<br><b>${correct}</b>`;
  },3000);
}

function audienceVote(){
  if(audienceUsed) return;
  audienceUsed = true;

  audienceScreen.style.display = "flex";

  const correct = questions[current].correctAnswer;
  const options = [...document.querySelectorAll(".option-btn")];

  let votes = options.map(o => o.textContent === correct ? 60 : Math.floor(Math.random()*20));
  const total = votes.reduce((a,b)=>a+b,0);
  votes = votes.map(v => Math.round(v/total*100));

  bars.forEach((bar,i)=>{
    bar.style.width = votes[i]+"%";
    bar.textContent = votes[i]+"%";
  });
}

// ================= MONEY LADDER =================
function buildMoneyLadder(){
  moneyList.innerHTML = "";
  const n = parseInt(questionCount.value);

  for(let i = 0; i <= n; i++){
    const li = document.createElement("li");
    li.textContent = "$" + (i*100);
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li=>li.classList.remove("current"));

  if(lis[ladderLevel]) lis[ladderLevel].classList.add("current");
}

// ================= LEADERBOARD =================
async function saveScore(user, reward){
  if(!user) return;

  await db.collection("leaderboard").doc(user.uid).set({
    name: user.displayName || user.email,
    score: reward,
    avatar: user.photoURL || ""
  });

  updateLeaderboard();
}

async function updateLeaderboard(){
  leaderboardList.innerHTML = "";
  const snap = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();

  snap.forEach(doc=>{
    const d = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `<img src="${d.avatar}"> ${d.name} — $${d.score}`;
    leaderboardList.appendChild(li);
  });
}
