document.addEventListener("DOMContentLoaded", () => {

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

/* ELEMENTS */
const googleLoginBtn = document.getElementById("googleLoginBtn");
const guestLoginBtn = document.getElementById("guestLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const startBtn = document.getElementById("startBtn");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

const fiftyBtn = document.getElementById("fiftyBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");
const secondChanceBtn = document.getElementById("secondChanceBtn");
const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");

/* TOP BAR + HELP */
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelpBtn = document.getElementById("closeHelpBtn");
const soundBtn = document.getElementById("soundBtn");

helpBtn.onclick = () => helpModal.classList.remove("hidden");
closeHelpBtn.onclick = () => helpModal.classList.add("hidden");
let soundEnabled = true;
soundBtn.onclick = () => { soundEnabled = !soundEnabled; soundBtn.textContent = soundEnabled?"🔊 Sound ON":"🔇 Sound OFF"; };

const sounds = {
  intro: document.getElementById("intro-sound"),
  thinking: document.getElementById("thinking-sound"),
  call: document.getElementById("call-sound"),
  audience: document.getElementById("audience-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  lose: document.getElementById("lose-sound"),
  tick: document.getElementById("tick-sound")
};

function stopAllSounds() { Object.values(sounds).forEach(s=>{s.pause(); s.currentTime=0;}); }
function playSound(name){ if(!soundEnabled || !sounds[name]) return; stopAllSounds(); sounds[name].play(); }

/* LOGIN */
googleLoginBtn.onclick=async()=>{ await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); showSettings(); };
guestLoginBtn.onclick=()=>showSettings();
emailRegisterBtn.onclick=()=>emailDiv.style.display="block";
emailCancelBtn.onclick=()=>emailDiv.style.display="none";
emailLoginBtn.onclick=async()=>{ await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value); location.reload(); };
emailRegisterSubmitBtn.onclick=async()=>{ await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value); location.reload(); };

auth.onAuthStateChanged(user=>{ if(user){ document.getElementById("profileDiv").innerHTML=`<img src="${user.photoURL||'https://i.imgur.com/6VBx3io.png'}"><h3>${user.displayName||'Guest'}</h3>`; } });

/* SETTINGS */
function showSettings(){ document.getElementById("authDiv").style.display="none"; document.getElementById("categoryDiv").style.display="block"; playSound("intro"); }

/* GAME LOGIC */
let questions=[],current=0,ladderLevel=0,timer;
let fiftyUsed=false,friendUsed=false,audienceUsed=false,secondChanceUsed=false,secondChance=false;
const timePerQuestion = 30;

startBtn.onclick=startQuiz;

async function startQuiz(){
  const category=categorySelect.value,difficulty=difficultySelect.value;
  soundEnabled = soundToggle.value==="on";
  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
  questions = await res.json();
  document.getElementById("categoryDiv").style.display="none";
  document.getElementById("quiz-container").style.display="block";
  buildMoneyLadder(20);
  current=0; ladderLevel=0;
  fiftyUsed=friendUsed=audienceUsed=secondChanceUsed=false;
  playSound("thinking");
  showQuestion();
}

function showQuestion(){
  clearInterval(timer);
  callFriendBox.innerHTML="";
  audienceVote.innerHTML="";
  answering=false;

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2>`;
  const answers = [...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);

  answers.forEach(a=>{
    const btn=document.createElement("button");
    btn.className="option-btn";
    btn.textContent=a;
    btn.onclick=()=>answer(btn,a);
    quizDiv.appendChild(btn);
  });

  let timeLeft = timePerQuestion;
  updateTimer(timeLeft);
  timer=setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft<=5) playSound("tick");
    if(timeLeft<=0) nextQuestion();
  },1000);
}

function updateTimer(t){ timerText.textContent=t+"s"; timerBar.style.width=(t/timePerQuestion*100)+"%"; timerBar.style.background=t>10?"#00ff00":t>5?"#ffcc00":"#ff4d4d"; }

let answering=false;
function answer(btn, ans){
  if(answering) return;
  answering=true;
  clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b=>{ b.classList.add("locked"); b.disabled=true; });
  btn.classList.add("pending");
  const correct = questions[current].correctAnswer;
  setTimeout(()=>{
    btn.classList.remove("
