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
const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");
const leaderboardList = document.getElementById("leaderboard-list");

/* SOUNDS */
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

let soundEnabled = true;
let questions = [];
let current = 0;
let ladderLevel = 0;
let timer;
let fiftyUsed = false;
let friendUsed = false;
let audienceUsed = false;
let secondChanceUsed = false;
const timePerQuestion = 30;

/* SOUND FUNCTIONS */
function stopAllSounds() { Object.values(sounds).forEach(s => { s.pause(); s.currentTime = 0; }); }
function playSound(name) { if (!soundEnabled || !sounds[name]) return; stopAllSounds(); sounds[name].play(); }

/* LOGIN */
googleLoginBtn.onclick = async () => { try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); showSettings(); } catch(e){ alert(e.message); } };
guestLoginBtn.onclick = () => showSettings();
emailRegisterBtn.onclick = () => emailDiv.style.display="block";
emailCancelBtn.onclick = () => emailDiv.style.display="none";
emailLoginBtn.onclick = async () => { try { await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value); location.reload(); } catch(e){ alert(e.message); } };
emailRegisterSubmitBtn.onclick = async () => { try { await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value); location.reload(); } catch(e){ alert(e.message); } };

auth.onAuthStateChanged(user => {
  if(user){ document.getElementById("profileDiv").innerHTML=`<img src="${user.photoURL||'https://i.imgur.com/6VBx3io.png'}"><h3>${user.displayName||'Guest'}</h3>`; }
});

/* SETTINGS */
function showSettings(){ document.getElementById("authDiv").style.display="none"; document.getElementById("categoryDiv").style.display="block"; playSound("intro"); }

/* START QUIZ */
startBtn.onclick = startQuiz;

async function startQuiz(){
  const category = categorySelect.value;
  const difficulty = difficultySelect.value;
  soundEnabled = soundToggle.value==="on";
  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
  questions = await res.json();
  document.getElementById("categoryDiv").style.display="none";
  document.getElementById("quiz-container").style.display="block";
  buildMoneyLadder(20);
  current=0; ladderLevel=0; fiftyUsed=friendUsed=audienceUsed=secondChanceUsed=false;
  playSound("thinking"); showQuestion();
}

/* SHOW QUESTION */
function showQuestion(){
  clearInterval(timer); callFriendBox.innerHTML=""; audienceVote.innerHTML="";
  const q=questions[current];
  quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2>`;
  const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{ const btn=document.createElement("button"); btn.className="option-btn"; btn.textContent=a; btn.onclick=()=>checkAnswer(a); quizDiv.appendChild(btn); });
  if(!document.getElementById("secondChanceBtn")){
    const secondBtn=document.createElement("button"); secondBtn.id="secondChanceBtn"; secondBtn.textContent="❤️ Second Chance"; secondBtn.onclick=useSecondChance; document.getElementById("lifelines").appendChild(secondBtn);
  }
  let timeLeft=timePerQuestion;
  updateTimer(timeLeft);
  timer=setInterval(()=>{ timeLeft--; updateTimer(timeLeft); if(timeLeft<=5) playSound("tick"); if(timeLeft<=0) nextQuestion(); },1000);
}

function useSecondChance(){ if(secondChanceUsed) return; secondChanceUsed=true; document.getElementById("secondChanceBtn").classList.add("used"); alert("Second Chance activated!"); }

function updateTimer(t){ timerText.textContent=t+"s"; timerBar.style.width=(t/timePerQuestion*100)+"%"; timerBar.style.background=t>10?"#00ff00":t>5?"#ffcc00":"#ff4d4d"; }

/* CHECK ANSWER */
function checkAnswer(ans){
  clearInterval(timer); stopAllSounds();
  const correct=questions[current].correctAnswer;
  const buttons=document.querySelectorAll(".option-btn");
  buttons.forEach(b=>{ b.disabled=true; if(b.textContent===correct) b.classList.add("correct","glow"); if(b.textContent===ans && ans!==correct) b.classList.add("wrong","shake"); });
  if(ans===correct){ ladderLevel++; playSound("correct"); }
  else if(!secondChanceUsed){ ladderLevel++; secondChanceUsed=true; document.getElementById("secondChanceBtn").classList.add("used"); playSound("correct"); alert("Second Chance used!"); }
  else playSound("wrong");
  updateMoneyLadder(); setTimeout(nextQuestion,2000);
}

/* NEXT QUESTION */
function nextQuestion(){ current++; if(current>=questions.length){ showFinalScreen(); return; } playSound("thinking"); showQuestion(); }

/* MONEY LADDER */
function buildMoneyLadder(count){ moneyList.innerHTML=""; for(let i=count;i>=1;i--){ const li=document.createElement("li"); li.className="ladder-btn"; li.textContent="$"+(i*100); moneyList.appendChild(li); } }
function updateMoneyLadder(){ [...moneyList.children].forEach(li=>li.classList.remove("current")); const idx=moneyList.children.length-ladderLevel; if(moneyList.children[idx]) moneyList.children[idx].classList.add("current"); }

/* LIFELINES */
fiftyBtn.onclick=()=>{ if(fiftyUsed) return; fiftyUsed=true; fiftyBtn.classList.add("used"); const correct=questions[current].correctAnswer; let removed=0; document.querySelectorAll(".option-btn").forEach(b=>{ if(b.textContent!==correct && removed<2){ b.style.opacity=0.3; removed++; } }); };
callFriendBtn.onclick=()=>{ if(friendUsed) return; friendUsed=true; callFriendBtn.classList.add("used"); playSound("call"); callFriendBox.innerHTML=`📞 Friend says: <b>${questions[current].correctAnswer}</b>`; };
audienceBtn.onclick=()=>{ if(audienceUsed) return; audienceUsed=true; audienceBtn.classList.add("used"); playSound("audience"); audienceVote.innerHTML=""; document.querySelectorAll(".option-btn").forEach(b=>{ const percent=Math.floor(Math.random()*80)+10; audienceVote.innerHTML+=`<div>${b.textContent}: ${percent}%</div>`; }); };

/* FINAL SCREEN */
function showFinalScreen(){
  stopAllSounds(); playSound("win");
  const finalPrize=ladderLevel*100;
  quizDiv.innerHTML=`
    <div class="final-screen">
      <h1>🎉 CONGRATULATIONS</h1>
      <h2>You Won $${finalPrize}</h2>
      <button onclick="location.reload()">Restart Quiz</button>
      <button onclick="navigator.share({text:'I won $${finalPrize} in NEON MILLIONAIRE!'})">Share Score</button>
    </div>`;
  saveScore(finalPrize); loadLeaderboard();
}

/* LEADERBOARD (CUMULATIVE) */
async function saveScore(score){
  const user=auth.currentUser;
  if(!user) return;
  const userRef=db.collection("scores").doc(user.uid);
  const doc=await userRef.get();
  if(doc.exists){
    await userRef.update({score: firebase.firestore.FieldValue.increment(score)});
  } else { await userRef.set({name:user.displayName||"Guest", photo:user.photoURL||"", score}); }
}

async function loadLeaderboard(){
  try{
    const snapshot=await db.collection("scores").orderBy("score","desc").limit(10).get();
    leaderboardList.innerHTML="";
    snapshot.forEach(doc=>{
      const data=doc.data();
      const li=document.createElement("li");
      li.innerHTML=`<img src="${data.photo||'https://i.imgur.com/6VBx3io.png'}"><b>${data.name}</b> - $${data.score}`;
      leaderboardList.appendChild(li);
    });
  } catch(e){ console.error("Error loading leaderboard:", e); }
}

// Load leaderboard on page load
loadLeaderboard();

});
