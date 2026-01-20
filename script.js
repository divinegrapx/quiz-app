import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.firebasestorage.app",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================= PROVIDERS =================
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ================= DOM =================
const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const logoutDiv = document.getElementById("logoutDiv");
const quizContainer = document.getElementById("quiz-container");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");
const lifelineResult = document.getElementById("lifeline-result");

const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ================= STATE =================
let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 20;

// ================= AUTH LOGIC =================
googleLoginBtn.onclick = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { alert(e.message); } };
facebookLoginBtn.onclick = async () => { try { await signInWithPopup(auth, facebookProvider); } catch (e) { alert("Facebook login failed"); } };
emailRegisterBtn.onclick = () => { authDiv.style.display = "none"; emailDiv.style.display = "block"; };
emailCancelBtn.onclick = () => { emailDiv.style.display = "none"; authDiv.style.display = "block"; };
emailLoginBtn.onclick = async () => { try { await signInWithEmailAndPassword(auth,emailInput.value,passwordInput.value); } catch(e){alert(e.message);} };
emailRegisterSubmitBtn.onclick = async () => { try { await createUserWithEmailAndPassword(auth,emailInput.value,passwordInput.value); } catch(e){alert(e.message);} };
logoutBtn.onclick = async () => { await signOut(auth); };

onAuthStateChanged(auth, user => {
  if(user){
    authDiv.style.display="none";
    emailDiv.style.display="none";
    logoutDiv.style.display="block";
    quizContainer.style.display="block";
    startQuiz();
  }else{
    authDiv.style.display="block";
    emailDiv.style.display="none";
    logoutDiv.style.display="none";
    quizContainer.style.display="none";
  }
});

// ================= QUIZ LOGIC =================
async function startQuiz(){
  current=0; score=0; buildMoneyLadder(10);
  const res = await fetch("https://the-trivia-api.com/api/questions?limit=10");
  questions = await res.json();
  showQuestion();
}

function showQuestion(){
  clearInterval(timer); timeLeft=20; updateTimer();
  lifelineResult.textContent=""; fiftyBtn.disabled=false; callBtn.disabled=false; audienceBtn.disabled=false;

  const q=questions[current];
  quizDiv.innerHTML=`<h2>Question ${current+1}/${questions.length}: ${q.question}</h2>`;

  const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn=document.createElement("button");
    btn.className="option-btn"; btn.textContent=a;
    btn.onclick=()=>checkAnswer(btn,a===q.correctAnswer);
    quizDiv.appendChild(btn);
  });

  timer=setInterval(()=>{
    timeLeft--; updateTimer(); if(timeLeft<=5) tickSound.play(); if(timeLeft<=0) nextQuestion();
  },1000);
}

function updateTimer(){ timerText.textContent=timeLeft+"s"; timerBar.style.width=(timeLeft/20)*100+"%"; timerBar.style.background=timeLeft>5?"#00ff00":"#ff4d4d"; }

function checkAnswer(btn,correct){
  clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b=>{b.disabled=true; if(b.textContent===questions[current].correctAnswer) b.classList.add("correct");});
  if(!correct){btn.classList.add("wrong"); wrongSound.play();}else{score++; correctSound.play();}
  setTimeout(nextQuestion,1500);
}

function nextQuestion(){
  current++;
  if(current>=questions.length){ quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`; return;}
  updateMoneyLadder(); showQuestion();
}

function buildMoneyLadder(total){ moneyList.innerHTML=""; for(let i=1;i<=total;i++){ const li=document.createElement("li"); li.textContent=`$${i*100}`; moneyList.appendChild(li);}}

function updateMoneyLadder(){ [...moneyList.children].forEach(li=>li.classList.remove("current")); if(moneyList.children[current-1]) moneyList.children[current-1].classList.add("current");}

// ================= LIFELINES =================
fiftyBtn.onclick=()=>{ const wrongs=[...document.querySelectorAll(".option-btn")].filter(b=>b.textContent!==questions[current].correctAnswer); wrongs.slice(0,2).forEach(b=>b.disabled=true); fiftyBtn.disabled=true; };
callBtn.onclick=()=>{ const correct=questions[current].correctAnswer; const success=Math.random()<0.8; lifelineResult.textContent=success?`📞 Friend thinks the answer is: "${correct}"`:`📞 Friend is unsure… maybe "${pickWrong()}"`; callBtn.disabled=true; };
audienceBtn.onclick=()=>{ const correct=questions[current].correctAnswer; const options=[...document.querySelectorAll(".option-btn")].map(b=>b.textContent); const votes={}; options.forEach(o=>votes[o]=Math.floor(Math.random()*20)); votes[correct]+=40+Math.floor(Math.random()*20); lifelineResult.innerHTML=Object.entries(votes).map(([k,v])=>`${k}: ${v}%`).join("<br>"); audienceBtn.disabled=true; };
function pickWrong(){ return questions[current].incorrectAnswers[Math.floor(Math.random()*questions[current].incorrectAnswers.length)]; }
