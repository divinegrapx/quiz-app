document.addEventListener("DOMContentLoaded",()=>{

/* ================= FIREBASE ================= */
const firebaseConfig={
  apiKey:"AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain:"neon-quiz-app.firebaseapp.com",
  projectId:"neon-quiz-app",
  storageBucket:"neon-quiz-app.appspot.com",
  messagingSenderId:"891061147021",
  appId:"1:891061147021:web:7b3d80020f642da7b699c4"
};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();

/* ================= ELEMENTS ================= */
const loginDiv=document.getElementById("loginDiv");
const emailDiv=document.getElementById("emailDiv");
const categoryDiv=document.getElementById("categoryDiv");
const quizContainer=document.getElementById("quiz-container");
const scoreRow=document.getElementById("scoreRow");

const googleLoginBtn=document.getElementById("googleLoginBtn");
const guestLoginBtn=document.getElementById("guestLoginBtn");
const emailRegisterBtn=document.getElementById("emailRegisterBtn");
const emailLoginBtn=document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn=document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn=document.getElementById("emailCancelBtn");

const emailInput=document.getElementById("emailInput");
const passwordInput=document.getElementById("passwordInput");

const startBtn=document.getElementById("startBtn");
const quizDiv=document.getElementById("quiz");
const moneyList=document.getElementById("money-list");

const timerBar=document.getElementById("timer-bar");
const timerText=document.getElementById("timer-text");

const fiftyBtn=document.getElementById("fiftyBtn");
const secondChanceBtn=document.getElementById("secondChanceBtn");
const callFriendBtn=document.getElementById("callFriendBtn");
const audienceBtn=document.getElementById("audienceBtn");
const safeMoneyBtn=document.getElementById("safeMoneyBtn");

const callFriendBox=document.getElementById("callFriendBox");
const audienceVote=document.getElementById("audienceVote");

const categorySelect=document.getElementById("categorySelect");
const difficultySelect=document.getElementById("difficultySelect");
const nightmareCheck=document.getElementById("nightmareModeCheck");
const soundToggle=document.getElementById("soundToggle");

/* ================= SOUNDS ================= */
const sounds={
  intro:document.getElementById("intro-sound"),
  thinking:document.getElementById("thinking-sound"),
  call:document.getElementById("call-sound"),
  audience:document.getElementById("audience-sound"),
  correct:document.getElementById("correct-sound"),
  wrong:document.getElementById("wrong-sound"),
  win:document.getElementById("win-sound"),
  lose:document.getElementById("lose-sound"),
  tick:document.getElementById("tick-sound")
};
let soundEnabled=true;
function playSound(name){if(!soundEnabled||!sounds[name])return;sounds[name].currentTime=0;sounds[name].play().catch(()=>{});}

/* ================= AUTH ================= */
let user=null;
googleLoginBtn.onclick=async()=>{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());};
guestLoginBtn.onclick=()=>auth.signInAnonymously();
emailRegisterBtn.onclick=()=>show(emailDiv);
emailCancelBtn.onclick=()=>hide(emailDiv);
emailLoginBtn.onclick=async()=>{await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value);};
emailRegisterSubmitBtn.onclick=async()=>{await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value);};
auth.onAuthStateChanged(u=>{
  if(!u)return;
  user=u;
  hide(loginDiv);
  hide(emailDiv);
  show(categoryDiv);
  playSound("intro");
  loadUserScore();
});

/* ================= GAME STATE ================= */
let questions=[],current=0,score=0,lifetime=0,timer,timePerQ=30;
let secondChanceUsed=false,used50=false,usedCall=false,usedAudience=false;
const prizes=[0,100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];

/* ================= START QUIZ ================= */
startBtn.onclick=async()=>{
  soundEnabled=soundToggle.value==="on";
  timePerQ=nightmareCheck.checked?20:30;
  resetLifelines();
  score=0;current=0;
  const res=await fetch(`https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
  questions=await res.json();
  hide(categoryDiv);
  show(quizContainer);
  buildLadder();
  playSound("thinking");
  showQuestion();
};

/* ================= QUESTION ================= */
function showQuestion(){
  clearInterval(timer);
  quizDiv.innerHTML="";
  callFriendBox.innerHTML="";
  audienceVote.innerHTML="";
  const q=questions[current];
  quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2>`;
  let answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const b=document.createElement("button");
    b.className="option-btn";b.textContent=a;
    b.onclick=()=>handleAnswer(b,a);
    quizDiv.appendChild(b);
  });
  highlightLadder();
  startTimer();
}

/* ================= TIMER ================= */
function startTimer(){
  let t=timePerQ;updateTimer(t);
  timer=setInterval(()=>{
    t--;updateTimer(t);
    if(t<=5)playSound("tick");
    if(t<=0){clearInterval(timer);endQuiz();}
  },1000);
}
function updateTimer(t){timerText.textContent=t+"s";timerBar.style.width=(t/timePerQ*100)+"%";timerBar.style.background=t<6?"red":"#00ff00";}

/* ================= ANSWER HANDLING ================= */
function handleAnswer(btn,ans){
  clearInterval(timer);
  const correct=questions[current].correctAnswer;
  document.querySelectorAll(".option-btn").forEach(b=>b.disabled=true);
  if(ans===correct){
    btn.classList.add("correct");
    score+=100;playSound("correct");
    setTimeout(()=>{current++;current>=questions.length?endQuiz():showQuestion();},1000);
  } else {
    btn.classList.add("wrong");playSound("wrong");
    if(!secondChanceUsed){
      secondChanceUsed=true;secondChanceBtn.classList.add("used");
      setTimeout(()=>{
        enableButtons();
        startTimer();
        btn.classList.remove("wrong");
      },800);
      return;
    }
    endQuiz();
  }
}

function enableButtons(){document.querySelectorAll(".option-btn").forEach(b=>b.disabled=false);}

/* ================= LIFELINES ================= */
fiftyBtn.onclick=()=>{
  if(used50||score<100)return;used50=true;fiftyBtn.classList.add("used");
  const correct=questions[current].correctAnswer;
  let removed=0;document.querySelectorAll(".option-btn").forEach(b=>{
    if(b.textContent!==correct&&removed<2){b.style.visibility="hidden";removed++;}
  });
};

secondChanceBtn.onclick=()=>{if(secondChanceUsed)return;secondChanceUsed=true;secondChanceBtn.classList.add("used");};

callFriendBtn.onclick=()=>{
  if(usedCall)return;usedCall=true;callFriendBtn.classList.add("used");
  const correct=questions[current].correctAnswer;
  const chance=Math.random()<0.7?correct:questions[current].incorrectAnswers[Math.floor(Math.random()*3)];
  callFriendBox.innerHTML=`📞 Friend: <b>${chance}</b>`;
};

audienceBtn.onclick=()=>{
  if(usedAudience)return;usedAudience=true;audienceBtn.classList.add("used");
  const correct=questions[current].correctAnswer;
  let votes=[];
  document.querySelectorAll(".option-btn").forEach(b=>{
    let p=b.textContent===correct?50+Math.random()*25:Math.random()*25;
    votes.push({a:b.textContent,p});
  });
  const sum=votes.reduce((s,v)=>s+v.p,0);voteBox.innerHTML="";
  votes.forEach(v=>{
    const per=Math.floor(v.p/sum*100);
    const div=document.createElement("div");
    div.innerHTML=`${v.a}: ${per}%`;voteBox.appendChild(div);
  });
};

/* ================= SAFE MONEY ================= */
safeMoneyBtn.onclick=()=>{score=getLastMilestone();endQuiz();};
function getLastMilestone(){let amt=0;for(let i=0;i<prizes.length;i++){if(score>=prizes[i])amt=prizes[i];else break;}return amt;}

/* ================= SCORE & LADDER ================= */
function buildLadder(){moneyList.innerHTML="";prizes.forEach(p=>{const li=document.createElement("li");li.className="ladder-btn";li.textContent="$"+p;moneyList.appendChild(li);});}
function highlightLadder(){document.querySelectorAll(".ladder-btn").forEach((b,i)=>b.classList.toggle("current",i===current+1));}
function updateScoreRow(){scoreRow.textContent=`Score: $${score} | Total: $${lifetime}`;}

/* ================= END QUIZ ================= */
async function endQuiz(){
  clearInterval(timer);
  playSound(score>=prizes[prizes.length-1]?"win":"lose");
  await saveScore();
  quizDiv.innerHTML=`<div class="final-screen"><h1>Game Over</h1><h2>You Won $${score}</h2><button onclick="location.reload()">Play Again</button></div>`;
  updateScoreRow();
}

/* ================= FIRESTORE ================= */
async function saveScore(){
  if(!user)return;
  const ref=db.collection("users").doc(user.uid);
  const snap=await ref.get();
  let best=0,total=0,games=0;
  if(snap.exists){best=snap.data().best||0;total=snap.data().total||0;games=snap.data().games||0;}
  lifetime=total+score;
  await ref.set({best:Math.max(best,score),total:total+score,games:games+1,updated:firebase.firestore.FieldValue.serverTimestamp()});
}

async function loadUserScore(){
  if(!user)return;
  const ref=db.collection("users").doc(user.uid);
  const snap=await ref.get();
  lifetime=snap.exists?snap.data().total||0:0;
  updateScoreRow();
}

/* ================= UI ================= */
function show(el){el.classList.remove("hidden");}
function hide(el){el.classList.add("hidden");}

});
