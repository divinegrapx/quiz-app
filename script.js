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
const quizDiv = document.getElementById("quiz");
const startBtn = document.getElementById("startBtn");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const moneyList = document.getElementById("money-list");
const progressBar = document.getElementById("progress-bar");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const hintBox = document.getElementById("hint-box") || (() => {
  const div = document.createElement("div"); div.id="hint-box"; quizDiv.parentNode.insertBefore(div, quizDiv.nextSibling); return div;
})();
const leaderboardList = document.getElementById("leaderboard-list");

// Email login fields
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");

// Logout button
let logoutBtn = document.createElement("button");
logoutBtn.textContent = "Log Out";
logoutBtn.style.margin = "10px";
logoutBtn.style.padding = "10px 20px";
logoutBtn.style.cursor = "pointer";
logoutBtn.style.borderRadius = "10px";
logoutBtn.style.border = "none";
logoutBtn.style.fontWeight = "bold";
logoutBtn.style.background = "linear-gradient(135deg,#ff4b2b,#ff416c)";
logoutBtn.style.color = "#fff";
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => location.reload());
});
authDiv.appendChild(logoutBtn);
logoutBtn.style.display="none";

// Sounds
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = new Audio("https://raw.githubusercontent.com/divinegrapx/quiz-app/main/tick.wav");

// ---------------- GLOBALS ----------------
let questions = [], current = 0, score = 0, timer, fiftyUsed=false, hintUsed=false, ladderLevel=0;
let questionTime = 30; // 30 seconds per question
let rewardStart = 100;

// ---------------- FALLBACK QUESTIONS ----------------
const fallbackQuestions = [
  { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
  { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
  { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
];

// ---------------- AUTH ----------------
emailRegisterSubmitBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password){ alert("Enter email & password"); return;}
  auth.createUserWithEmailAndPassword(email,password)
    .then(user=>{ alert("Registered!"); showCategory(); })
    .catch(err=>alert("Error: "+err.message));
});
emailLoginBtn.addEventListener("click", ()=>{
  const email = emailInput.value;
  const password = passwordInput.value;
  if(!email || !password){ alert("Enter email & password"); return;}
  auth.signInWithEmailAndPassword(email,password)
    .then(user=> showCategory())
    .catch(err=>alert("Login failed: "+err.message));
});
emailCancelBtn.addEventListener("click", ()=>{ emailDiv.style.display="none"; authDiv.style.display="block"; });

function showCategory(){
  authDiv.style.display="none";
  emailDiv.style.display="none";
  categoryDiv.style.display="block";
  logoutBtn.style.display="inline-block";
}

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz(){
  startBtn.disabled=true;
  categoryDiv.style.display="none";
  quizDiv.style.display="flex";
  quizDiv.classList.add("fade-in");
  ladderLevel=0; current=0; score=0; fiftyUsed=false; hintUsed=false;
  fiftyBtn.disabled=false; hintBtn.disabled=false; fiftyBtn.classList.remove("dimmed"); hintBtn.classList.remove("dimmed");
  hintBox.style.display="none";

  // Dynamic rewards based on number of questions
  const numQ = parseInt(questionCount.value);
  rewardStart = 100; // base $100
  buildMoneyLadder(numQ);

  // Fetch questions
  try{
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${numQ}&categories=${categorySelect.value}`);
    if(!res.ok) throw "API Error";
    const data = await res.json();
    questions = data.map(q=>({
      question: q.question,
      correctAnswer: q.correctAnswer,
      incorrectAnswers: q.incorrectAnswers,
      hint: q.hint || "Think carefully."
    }));
  } catch { questions=fallbackQuestions; }

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion(){
  clearInterval(timer);
  let timeLeft = questionTime;
  timerBar.style.width="100%";
  timerBar.style.background="linear-gradient(90deg,#00f2fe,#00c6ff)";
  updateTimer(timeLeft);

  const q = questions[current];
  quizDiv.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;
  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn=document.createElement("button");
    btn.textContent=a;
    btn.className="option-btn";
    btn.addEventListener("click",()=>checkAnswer(a,btn));
    quizDiv.appendChild(btn);
  });

  timer = setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft <=5 && timeLeft>0) tickSound.play();
    if(timeLeft<=0){
      clearInterval(timer);
      showCorrectAnswer();
      setTimeout(nextQuestion,1200);
    }
  },1000);
}

// ---------------- TIMER ----------------
function updateTimer(timeLeft){
  timerText.textContent=`${timeLeft}s`;
  timerBar.style.width=`${(timeLeft/questionTime)*100}%`;
  if(timeLeft<=5) timerBar.style.background="linear-gradient(90deg,#ff4d4d,#ff0000)";
  else if(timeLeft<=10) timerBar.style.background="linear-gradient(90deg,#ffd200,#ff6a00)";
  else timerBar.style.background="linear-gradient(90deg,#00f2fe,#00c6ff)";
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer,btn){
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedbackDiv=document.getElementById("feedback");
  document.querySelectorAll(".option-btn").forEach(b=>b.disabled=true);

  if(answer===correct){
    btn.classList.add("correct");
    score++; ladderLevel++;
    feedbackDiv.textContent="✅ Correct!";
    feedbackDiv.style.color="lime";
    correctSound.play();
  } else {
    btn.classList.add("wrong","shake");
    showCorrectAnswer();
    feedbackDiv.textContent="❌ Wrong!";
    feedbackDiv.style.color="red";
    wrongSound.play();
  }

  updateMoneyLadder();
  setTimeout(nextQuestion,1200);
}

// ---------------- SHOW CORRECT ANSWER ----------------
function showCorrectAnswer(){
  const correct = questions[current].correctAnswer;
  document.querySelectorAll(".option-btn").forEach(b=>{
    if(b.textContent===correct) b.classList.add("correct");
  });
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion(){
  current++;
  if(current>=questions.length){
    quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
    hintBox.style.display="none"; moneyList.style.display="none";
    quizDiv.appendChild(logoutBtn);
    logoutBtn.style.display="inline-block";
    saveScore(auth.currentUser,score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed=true; fiftyBtn.disabled=true; fiftyBtn.classList.add("dimmed");
  const correct = questions[current].correctAnswer;
  const btns = Array.from(document.querySelectorAll(".option-btn"));
  let removed=0;
  btns.forEach(b=>{
    if(b.textContent!==correct && removed<2){ b.style.display="none"; removed++; }
  });
}

function useHint(){
  if(hintUsed) return;
  hintUsed=true; hintBtn.disabled=true; hintBtn.classList.add("dimmed");
  const q = questions[current];
  hintBox.textContent = "💡 Hint: " + q.hint;
  hintBox.style.display="block";
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(numQuestions){
  moneyList.innerHTML="";
  const step = Math.floor((numQuestions*100)/numQuestions); // dynamic step for any numQ
  for(let i=numQuestions;i>0;i--){
    const li=document.createElement("li");
    li.textContent=`$${i*100}`;
    moneyList.appendChild(li);
  }
}
function updateMoneyLadder(){
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li=>li.classList.remove("current"));
  const idx=moneyList.children.length-ladderLevel-1;
  if(lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user,score){
  if(!user) return;
  const userData={uid:user.uid,name:user.email||user.displayName,avatar:user.photoURL||"",score,date: firebase.firestore.FieldValue.serverTimestamp()};
  await db.collection("leaderboard").doc(user.uid).set(userData,{merge:true});
  updateLeaderboard();
}

async function updateLeaderboard(){
  if(!leaderboardList) return;
  leaderboardList.innerHTML="";
  const snapshot = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snapshot.forEach(doc=>{
    const data = doc.data();
    const li = document.createElement("li");
    if(data.avatar){
      const img = document.createElement("img");
      img.src=data.avatar; img.width=30; img.height=30;
      li.appendChild(img);
    }
    li.appendChild(document.createTextNode(`${data.name} — ${data.score} pts`));
    leaderboardList.appendChild(li);
  });
}

updateLeaderboard();
