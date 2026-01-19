// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.appspot.com",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4",
  measurementId: "G-7LKHH1EHQW"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------------- DOM ELEMENTS ----------------
const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const categoryDiv = document.getElementById("categoryDiv");
const googleBtn = document.getElementById("googleLoginBtn");
const facebookBtn = document.getElementById("facebookLoginBtn");
const emailBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const hintBox = document.getElementById("hint-box") || (() => {
    const hb = document.createElement("div");
    hb.id="hint-box";
    quizDiv.parentNode.insertBefore(hb, quizDiv.nextSibling);
    return hb;
})();
const leaderboardList = document.getElementById("leaderboard-list");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

let questions = [], current=0, score=0, timer, fiftyUsed=false, hintUsed=false, ladderLevel=0;

// ---------------- LOGIN ----------------
function showCategory(){ authDiv.style.display="none"; emailDiv.style.display="none"; categoryDiv.style.display="block"; }

googleBtn.addEventListener("click", ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
      .then(res=>showCategory())
      .catch(err=>alert("Google login failed: "+err.message));
});

facebookBtn.addEventListener("click", ()=>{
  const provider = new firebase.auth.FacebookAuthProvider();
  auth.signInWithPopup(provider)
      .then(res=>showCategory())
      .catch(err=>alert("Facebook login failed: "+err.message));
});

emailBtn.addEventListener("click", ()=>{ authDiv.style.display="none"; emailDiv.style.display="block"; });
emailCancelBtn.addEventListener("click", ()=>{ emailDiv.style.display="none"; authDiv.style.display="block"; });

emailLoginBtn.addEventListener("click", ()=>{
  const email=emailInput.value, pw=passwordInput.value;
  if(!email||!pw){alert("Enter email & password");return;}
  auth.signInWithEmailAndPassword(email,pw)
      .then(u=>showCategory())
      .catch(err=>alert("Email login failed: "+err.message));
});

emailRegisterSubmitBtn.addEventListener("click", ()=>{
  const email=emailInput.value, pw=passwordInput.value;
  if(!email||!pw){alert("Enter email & password");return;}
  auth.createUserWithEmailAndPassword(email,pw)
      .then(u=>showCategory())
      .catch(err=>alert("Registration failed: "+err.message));
});

auth.onAuthStateChanged(user=>{ if(user) showCategory(); });

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

// ---------------- DYNAMIC HINT FUNCTION ----------------
function getHint(q){
  if(q.hint) return q.hint; // use API hint if exists
  const answer = q.correctAnswer;
  if(answer.length<=2) return "It's very short!";
  const first = answer[0], last = answer[answer.length-1];
  let masked = first + "_".repeat(answer.length-2) + last;
  return `Hint: the answer looks like "${masked}"`;
}

// ---------------- START QUIZ ----------------
async function startQuiz(){
  startBtn.disabled=true;
  quizDiv.style.display="flex";
  quizDiv.classList.add("fade-in");
  lifelines.style.display="flex";
  hintBox.style.display="none";
  quizDiv.innerHTML="Loading...";

  current=0; score=0; ladderLevel=0; fiftyUsed=false; hintUsed=false;
  fiftyBtn.disabled=false; hintBtn.disabled=false;

  buildMoneyLadder();

  try{
    const res=await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if(!res.ok) throw "API error";
    const data=await res.json();
    questions=data.map(q=>({ question:q.question, correctAnswer:q.correctAnswer, incorrectAnswers:q.incorrectAnswers, hint:q.hint }));
  }catch{
    questions=[
      { question:"What color is the sky?", correctAnswer:"Blue", incorrectAnswers:["Red","Green","Yellow"], hint:"It's the same color as the ocean." },
      { question:"How many days in a week?", correctAnswer:"7", incorrectAnswers:["5","6","8"], hint:"Think Monday to Sunday." },
      { question:"Which planet is known as the Red Planet?", correctAnswer:"Mars", incorrectAnswers:["Venus","Jupiter","Saturn"], hint:"Named after Roman god of war." }
    ];
  }

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion(){
  clearInterval(timer);
  let timeLeft=30;
  updateTimer(timeLeft);
  hintBox.style.display="none";
  quizDiv.innerHTML=`<h2>${questions[current].question}</h2><div id="feedback"></div>`;

  const answers=[...questions[current].incorrectAnswers,questions[current].correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn=document.createElement("button");
    btn.textContent=a;
    btn.className="option-btn";
    btn.addEventListener("click",()=>checkAnswer(a,btn));
    quizDiv.appendChild(btn);
  });

  timer=setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft<=5 && timeLeft>0) playTick();
    if(timeLeft<=0){ clearInterval(timer); nextQuestion(false); }
  },1000);
}

// ---------------- TIMER ----------------
function updateTimer(time){
  timerText.textContent=`${time}s`;
  timerBar.style.width=`${(time/30)*100}%`;
  timerBar.style.background = time<=5?"linear-gradient(90deg,#ff0000,#ff6666)":"linear-gradient(90deg,#00f2fe,#00c6ff)";
}

function playTick(){
  const audio=new Audio("https://raw.githubusercontent.com/divinegrapx/quiz-app/main/tick.wav");
  audio.play();
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer, btn){
  clearInterval(timer);
  const correct=questions[current].correctAnswer;
  const feedbackDiv=document.getElementById("feedback");

  document.querySelectorAll(".option-btn").forEach(b=>{
    b.disabled=true;
    if(b.textContent===correct) b.classList.add("correct");
    if(b===btn && answer!==correct) b.classList.add("wrong","shake");
  });

  feedbackDiv.innerHTML=answer===correct?"✅ Correct!":`❌ Wrong! Correct: ${correct}`;
  if(answer===correct){ score++; ladderLevel++; correctSound.play(); }
  else wrongSound.play();

  setTimeout(nextQuestion,1000);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion(){
  current++;
  if(current>=questions.length){
    quizDiv.innerHTML=`<h2>Quiz Finished!</h2><p>Score: ${score}/${questions.length}</p><button id="logoutBtn">Log Out</button>`;
    lifelines.style.display="none"; moneyList.style.display="none"; hintBox.style.display="none";
    const user=auth.currentUser; saveScore(user,score);
    document.getElementById("logoutBtn").addEventListener("click", ()=>{ auth.signOut().then(()=>location.reload()); });
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed=true; fiftyBtn.disabled=true;
  const correct=questions[current].correctAnswer;
  const btns=Array.from(document.querySelectorAll(".option-btn"));
  let removed=0;
  btns.forEach(b=>{ if(b.textContent!==correct && removed<2){ b.style.display="none"; removed++; } });
}

function useHint(){
  if(hintUsed) return;
  hintUsed=true; hintBtn.disabled=true;
  hintBox.textContent="💡 "+getHint(questions[current]);
  hintBox.style.display="block";
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(){
  moneyList.innerHTML="";
  const numQ=parseInt(questionCount.value);
  const step=Math.floor(1000/numQ);
  for(let i=numQ;i>0;i--){
    const li=document.createElement("li");
    li.textContent=`$${i*step}`;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  const lis=moneyList.querySelectorAll("li");
  lis.forEach(li=>li.classList.remove("current"));
  const idx=moneyList.children.length-ladderLevel-1;
  if(lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user,score){
  if(!user) return;
  const userData={uid:user.uid,name:user.displayName||user.email,avatar:user.photoURL,score,date:firebase.firestore.FieldValue.serverTimestamp()};
  await db.collection("leaderboard").doc(user.uid).set(userData,{merge:true});
  updateLeaderboard();
}

async function updateLeaderboard(){
  if(!leaderboardList) return;
  leaderboardList.innerHTML="";
  const snapshot=await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snapshot.forEach(doc=>{
    const d=doc.data();
    const li=document.createElement("li");
    if(d.avatar){
      const img=document.createElement("img");
      img.src=d.avatar; img.width=30; img.height=30;
      li.appendChild(img);
    }
    li.appendChild(document.createTextNode(`${d.name} — ${d.score} pts`));
    leaderboardList.appendChild(li);
  });
}

updateLeaderboard();
