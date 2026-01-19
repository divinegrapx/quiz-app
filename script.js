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
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutDiv = document.getElementById("logoutDiv");
const logoutBtn = document.getElementById("logoutBtn");

const startBtn = document.getElementById("startBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const progressBar = document.getElementById("progress-bar");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const moneyList = document.getElementById("money-list");
const hintBox = document.getElementById("hint-box");
const leaderboardList = document.getElementById("leaderboard-list");
const quizContainer = document.getElementById("quiz-container");
const categoryDiv = document.getElementById("categoryDiv");
const authDiv = document.getElementById("authDiv");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, ladderLevel = 0, timer;
let fiftyUsed = false, hintUsed = false;

// ---------------- FALLBACK QUESTIONS ----------------
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
  { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
  { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
];

// ---------------- LOGIN ----------------
googleLoginBtn.addEventListener("click", async ()=>{
  try{
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    onLoginSuccess(result.user);
  }catch(e){ alert("Login failed!"); console.error(e);}
});

facebookLoginBtn.addEventListener("click", async ()=>{
  try{
    const provider = new firebase.auth.FacebookAuthProvider();
    const result = await auth.signInWithPopup(provider);
    onLoginSuccess(result.user);
  }catch(e){ alert("Login failed!"); console.error(e);}
});

function onLoginSuccess(user){
  authDiv.style.display="none";
  categoryDiv.style.display="block";
  logoutDiv.style.display="block";
  updateLeaderboard();
}

logoutBtn.addEventListener("click", async ()=>{
  await auth.signOut();
  authDiv.style.display="block";
  categoryDiv.style.display="none";
  quizContainer.style.display="none";
  logoutDiv.style.display="none";
});

// ---------------- EMAIL LOGIN ----------------
emailRegisterBtn.addEventListener("click", ()=>{ emailDiv.style.display="block"; authDiv.style.display="none"; });
emailCancelBtn.addEventListener("click", ()=>{ emailDiv.style.display="none"; authDiv.style.display="block"; });

emailLoginBtn.addEventListener("click", async ()=>{
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  try{ 
    const res = await auth.signInWithEmailAndPassword(email,password);
    onLoginSuccess(res.user);
    emailDiv.style.display="none";
  }catch(e){ alert("Login failed: "+e.message);}
});

emailRegisterSubmitBtn.addEventListener("click", async ()=>{
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;
  try{
    const res = await auth.createUserWithEmailAndPassword(email,password);
    onLoginSuccess(res.user);
    emailDiv.style.display="none";
  }catch(e){ alert("Register failed: "+e.message);}
});

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz(){
  startBtn.disabled = true;
  quizDiv.innerHTML = "Loading...";
  quizDiv.classList.add("fade-in");
  quizContainer.style.display = "block";
  lifelines.style.display = "flex";
  moneyList.style.display = "block";
  hintBox.style.display = "none";

  ladderLevel=current=score=0;
  fiftyUsed=hintUsed=false;
  fiftyBtn.disabled=false; hintBtn.disabled=false;

  buildMoneyLadder();

  try{
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if(!res.ok) throw "API error";
    const data = await res.json();
    questions = data.map(q=>({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers,
      hint: q.hint || "Think carefully."
    }));
  }catch{ questions = fallbackQuestions; }

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion(){
  clearInterval(timer);
  let timeLeft = 30;
  updateTimer(timeLeft);
  hintBox.style.display="none";

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2><div id="feedback"></div>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.className="option-btn";
    btn.style.background = "#00c6ff";  // blue base
    btn.style.color = "#000";          // black font
    btn.addEventListener("click", ()=>checkAnswer(a));
    quizDiv.appendChild(btn);
  });

  // TIMER BAR
  timerBar.style.width="100%";
  timer = setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft<=5 && timeLeft>0 && tickSound){ tickSound.play(); }
    if(timeLeft<=0){ clearInterval(timer); nextQuestion(false);}
  },1000);
}

// ---------------- TIMER ----------------
function updateTimer(timeLeft){
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = (timeLeft/30*100) + "%";
  if(timeLeft>20){ timerBar.style.background="#00ff00"; timerText.style.color="#00ff00"; }
  else if(timeLeft>5){ timerBar.style.background="#ffcc00"; timerText.style.color="#ffcc00"; }
  else{ timerBar.style.background="#ff4d4d"; timerText.style.color="#ff4d4d"; }
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer){
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedback = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn=>{
    btn.disabled = true;
    if(btn.textContent === correct){
      btn.classList.add("correct");
    }
    if(btn.textContent === answer && answer!==correct){
      btn.classList.add("wrong","shake");
      setTimeout(()=>btn.classList.remove("shake"),500);
    }
  });

  if(answer === correct){
    score++;
    ladderLevel++;
    updateMoneyLadder();
    feedback.innerHTML = "✅ <b>Correct!</b>";
    correctSound.play();
  } else {
    feedback.innerHTML = `❌ <b>Wrong!</b><br><span class="correct-answer">Correct: <b>${correct}</b></span>`;
    wrongSound.play();
  }

  setTimeout(nextQuestion,1800);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion(){
  current++;
  if(current >= questions.length){
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
    lifelines.style.display="none";
    moneyList.style.display="none";
    hintBox.style.display="none";
    quizDiv.innerHTML += `<button id="restartBtn">Restart Quiz</button>`;
    const restartBtn = document.getElementById("restartBtn");
    restartBtn.style.background = "linear-gradient(135deg,#00f2fe,#00c6ff)";
    restartBtn.style.color = "#000";
    restartBtn.addEventListener("click", ()=>location.reload());

    const user = auth.currentUser;
    if(user) saveScore(user,score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed=true; fiftyBtn.disabled=true;
  const correct = questions[current].correctAnswer;
  let removed=0;
  const btns=Array.from(document.querySelectorAll(".option-btn"));
  btns.forEach(b=>{
    if(b.textContent!==correct && removed<2){
      b.style.opacity=0.3; removed++;
    }
  });
}

function useHint(){
  if(hintUsed) return;
  hintUsed=true; hintBtn.disabled=true;
  const q = questions[current];
  if(q && q.hint){
    hintBox.textContent = "💡 Hint: " + q.hint;
  } else { hintBox.textContent = "💡 Hint: Think carefully!";}
  hintBox.style.display="block";
  hintBtn.style.opacity = 0.3;
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(){
  moneyList.innerHTML="";
  const numQuestions = parseInt(questionCount.value);
  const step = 100;
  for(let i=numQuestions;i>0;i--){
    const li=document.createElement("li");
    li.textContent="$"+(i*step);
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
  const userData={uid:user.uid, name:user.displayName||user.email, avatar:user.photoURL||"", score, date: firebase.firestore.FieldValue.serverTimestamp()};
  await db.collection("leaderboard").doc(user.uid).set(userData,{merge:true});
  updateLeaderboard();
}

async function updateLeaderboard(){
  if(!leaderboardList) return;
  leaderboardList.innerHTML="";
  const snapshot=await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snapshot.forEach(doc=>{
    const data=doc.data();
    const li=document.createElement("li");
    const img=document.createElement("img");
    img.src=data.avatar||"";
    img.width=30; img.height=30;
    li.appendChild(img);
    li.appendChild(document.createTextNode(`${data.name} — ${data.score} pts`));
    leaderboardList.appendChild(li);
  });
}
updateLeaderboard();
