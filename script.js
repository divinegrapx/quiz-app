document.addEventListener("DOMContentLoaded", () => {

// ================= FIREBASE =================
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

// ================= ELEMENTS =================
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
const secondChanceBtn = document.getElementById("secondChanceBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const audienceBtn = document.getElementById("audienceBtn");
const walkAwayBtn = document.getElementById("walkAwayBtn");
const callFriendBox = document.getElementById("callFriendBox");
const audienceVote = document.getElementById("audienceVote");

const shopDiv = document.getElementById("shopDiv");
const buyBtns = document.querySelectorAll(".buy-btn");
const closeShopBtn = document.getElementById("closeShopBtn");

const categorySelect = document.getElementById("categorySelect");
const difficultySelect = document.getElementById("difficultySelect");
const soundToggle = document.getElementById("soundToggle");
const hardcoreToggle = document.getElementById("hardcoreToggle");

const helpBtn = document.getElementById("helpBtn");

const leaderboardList = document.getElementById("leaderboard-list");

// ================= SOUNDS =================
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

function stopAllSounds(){Object.values(sounds).forEach(s=>{s.pause();s.currentTime=0;});}
function playSound(name){if(!soundEnabled||!sounds[name])return;stopAllSounds();sounds[name].play();}

// ================= AUTH =================
googleLoginBtn.onclick = async()=>{
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  showSettings();
};
guestLoginBtn.onclick = ()=>showSettings();

emailRegisterBtn.onclick = ()=>emailDiv.style.display="block";
emailCancelBtn.onclick = ()=>emailDiv.style.display="none";

emailLoginBtn.onclick = async()=>{
  await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value);
  location.reload();
};
emailRegisterSubmitBtn.onclick = async()=>{
  await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value);
  location.reload();
};

auth.onAuthStateChanged(user=>{
  if(user){
    document.getElementById("profileDiv").innerHTML=`
      <img src="${user.photoURL||'https://i.imgur.com/6VBx3io.png'}">
      <h3>${user.displayName||"Guest"}</h3>
    `;
    loadLeaderboard();
  }
});

// ================= SETTINGS =================
function showSettings(){
  document.getElementById("authDiv").style.display="none";
  document.getElementById("categoryDiv").style.display="block";
  playSound("intro");
}

// ================= GAME =================
let questions=[],current=0,ladderLevel=0,timer,fiftyUsed=false,secondChanceUsed=false,friendUsed=false,audienceUsed=false;
let guaranteedMoney=0;
const checkpointLevels=[5,10,15,20];

startBtn.onclick=startQuiz;
walkAwayBtn.onclick=walkAway;

async function startQuiz(){
  const category=categorySelect.value;
  const difficulty=difficultySelect.value;
  soundEnabled=soundToggle.value==="on";
  const hardcoreMode=hardcoreToggle.checked;
  const questionTime=hardcoreMode?20:30;

  const res=await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
  questions=await res.json();

  document.getElementById("categoryDiv").style.display="none";
  document.getElementById("quiz-container").style.display="block";

  buildMoneyLadder(20);
  current=0;ladderLevel=0;guaranteedMoney=0;
  fiftyUsed=secondChanceUsed=friendUsed=audienceUsed=false;

  playSound("thinking");
  showQuestion(questionTime);
}

function showQuestion(timePerQuestion){
  clearInterval(timer);
  callFriendBox.innerHTML="";
  audienceVote.innerHTML="";

  const q=questions[current];
  quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2>`;
  const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn=document.createElement("button");
    btn.className="option-btn";
    btn.textContent=a;
    btn.onclick=()=>checkAnswer(a,timePerQuestion);
    quizDiv.appendChild(btn);
  });

  let timeLeft=timePerQuestion;
  updateTimer(timeLeft);
  timer=setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft<=5) playSound("tick");
    if(timeLeft<=0) checkAnswer(null,timePerQuestion); // treat as wrong
  },1000);
}

function updateTimer(t){
  timerText.textContent=t+"s";
  timerBar.style.width=(t/parseInt(timerText.textContent)*100)+"%";
  timerBar.style.background=t>10?"#00ff00":t>5?"#ffcc00":"#ff4d4d";
}

// ================= CHECK ANSWER =================
function checkAnswer(ans,timePerQuestion){
  clearInterval(timer);
  stopAllSounds();
  const correct=questions[current].correctAnswer;

  document.querySelectorAll(".option-btn").forEach(b=>{
    b.disabled=true;
    if(b.textContent===correct) b.classList.add("correct");
    if(ans && b.textContent===ans && ans!==correct) b.classList.add("wrong");
  });

  if(ans===correct){ladderLevel++;playSound("correct");}
  else{
    if(secondChanceUsed===false){secondChanceUsed=true;alert("Second Chance used! Continue.");return;}
    playSound("wrong");
  }

  if(checkpointLevels.includes(ladderLevel)) guaranteedMoney=ladderLevel*100;
  updateMoneyLadder();

  setTimeout(()=>{
    current++;
    if(current>=questions.length) showFinalScreen();
    else showQuestion(timePerQuestion);
  },1500);
}

// ================= MONEY LADDER =================
function buildMoneyLadder(count){
  moneyList.innerHTML="";
  for(let i=count;i>=1;i--){
    const li=document.createElement("li");
    li.className="ladder-btn";
    li.textContent="$"+(i*100);
    if(checkpointLevels.includes(i)) li.classList.add("checkpoint");
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  [...moneyList.children].forEach(li=>li.classList.remove("current"));
  const idx=moneyList.children.length-ladderLevel;
  if(moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}

// ================= LIFELINES =================
fiftyBtn.onclick=()=>{
  if(fiftyUsed) return; fiftyUsed=true; fiftyBtn.classList.add("used");
  const correct=questions[current].correctAnswer; let removed=0;
  document.querySelectorAll(".option-btn").forEach(b=>{
    if(b.textContent!==correct && removed<2){b.style.opacity=0.3;removed++;}
  });
};
secondChanceBtn.onclick=()=>{alert("Second Chance active!");};
callFriendBtn.onclick=()=>{
  if(friendUsed) return; friendUsed=true; callFriendBtn.classList.add("used");
  playSound("call");
  callFriendBox.innerHTML=`📞 Friend says: <b>${questions[current].correctAnswer}</b>`;
};
audienceBtn.onclick=()=>{
  if(audienceUsed) return; audienceUsed=true; audienceBtn.classList.add("used");
  playSound("audience"); audienceVote.innerHTML="";
  const correct=questions[current].correctAnswer;
  document.querySelectorAll(".option-btn").forEach(b=>{
    let percent=b.textContent===correct?Math.floor(Math.random()*50)+25:Math.floor(Math.random()*40);
    audienceVote.innerHTML+=`<div>${b.textContent}: ${percent}%</div>`;
  });
};

// ================= WALK AWAY =================
function walkAway(){alert(`You walked away with $${guaranteedMoney}`); showFinalScreen(true);}

// ================= FINAL SCREEN =================
function showFinalScreen(walkAway=false){
  stopAllSounds();
  playSound("win");
  quizDiv.innerHTML=`
  <div class="final-screen">
    <h1>🎉 ${walkAway?"You Walked Away":"CONGRATULATIONS"}</h1>
    <h2>You Won $${guaranteedMoney}</h2>
    <button onclick="location.reload()">Restart Quiz</button>
    <button onclick="navigator.share({text:'I won $${guaranteedMoney} in NEON MILLIONAIRE!'})">Share Score</button>
  </div>
  `;
  saveScore(guaranteedMoney);
  loadLeaderboard();
}

// ================= LEADERBOARD =================
function saveScore(score){
  const user=auth.currentUser; if(!user) return;
  db.collection("scores").doc(user.uid).get().then(doc=>{
    if(doc.exists) db.collection("scores").doc(user.uid).update({score:firebase.firestore.FieldValue.increment(score)});
    else db.collection("scores").doc(user.uid).set({name:user.displayName||"Guest",photo:user.photoURL||"",score});
  });
}

function loadLeaderboard(){
  leaderboardList.innerHTML="";
  db.collection("scores").orderBy("score","desc").limit(10).get().then(snapshot=>{
    snapshot.forEach(doc=>{
      const data=doc.data();
      const li=document.createElement("li");
      li.innerHTML=`<img src="${data.photo||'https://i.imgur.com/6VBx3io.png'}"><b>${data.name}</b> - $${data.score}`;
      leaderboardList.appendChild(li);
    });
  });
}

// ================= SHOP =================
buyBtns.forEach(btn=>{
  btn.onclick=()=>{
    alert(`Bought ${btn.dataset.item} (Demo logic, implement currency deduction)`);
  };
});
closeShopBtn.onclick=()=>shopDiv.style.display="none";
