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

// ---------------- DOM ELEMENTS ----------------
const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailDiv = document.getElementById("emailDiv");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const authDiv = document.getElementById("authDiv");

const categoryDiv = document.getElementById("categoryDiv");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const startBtn = document.getElementById("startBtn");

const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const lifelines = document.getElementById("lifelines");
const fiftyBtn = document.getElementById("fiftyBtn");
const hintBtn = document.getElementById("hintBtn");
const hintBox = document.getElementById("hint-box");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const progressBar = document.getElementById("progress-bar");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const leaderboardList = document.getElementById("leaderboard-list");

// ---------------- GLOBALS ----------------
let questions = [], current=0, score=0, ladderLevel=0, timer;
let fiftyUsed=false, hintUsed=false;

// ---------------- LOGIN ----------------
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    onLoginSuccess(result.user);
  } catch(e){ alert("Google Login failed!"); console.log(e);}
});

facebookLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.FacebookAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    onLoginSuccess(result.user);
  } catch(e){ alert("Facebook Login failed!"); console.log(e);}
});

emailRegisterBtn.addEventListener("click", () => {
  authDiv.style.display="none";
  emailDiv.style.display="block";
});

emailCancelBtn.addEventListener("click", () => {
  emailDiv.style.display="none";
  authDiv.style.display="block";
});

emailRegisterSubmitBtn.addEventListener("click", async ()=>{
  try {
    const user = await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value);
    onLoginSuccess(user.user);
  } catch(e){ alert("Register failed: "+e.message);}
});

emailLoginBtn.addEventListener("click", async ()=>{
  try {
    const user = await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value);
    onLoginSuccess(user.user);
  } catch(e){ alert("Login failed: "+e.message);}
});

function onLoginSuccess(user){
  authDiv.style.display="none";
  emailDiv.style.display="none";
  categoryDiv.style.display="block";
  updateLeaderboard();
}

// ---------------- START QUIZ ----------------
startBtn.addEventListener("click", startQuiz);
fiftyBtn.addEventListener("click", useFifty);
hintBtn.addEventListener("click", useHint);

async function startQuiz(){
  categoryDiv.style.display="none";
  quizContainer.style.display="block";
  quizDiv.classList.add("fade-in");
  lifelines.style.display="flex";
  document.getElementById("progress-container").style.display="block";
  document.getElementById("timer-container").style.display="block";
  hintBox.style.display="none";

  ladderLevel=current=score=0;
  fiftyUsed=hintUsed=false;
  fiftyBtn.disabled=false; fiftyBtn.style.opacity=1;
  hintBtn.disabled=false; hintBtn.style.opacity=1;

  buildMoneyLadder();

  try {
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
    if(!res.ok) throw "API error";
    const data = await res.json();
    questions = data.map(q => ({
      question: q.question || q.questionText || "Question missing",
      correctAnswer: q.correctAnswer || q.correct_answer,
      incorrectAnswers: q.incorrectAnswers || q.incorrect_answers,
      hint: q.hint || "Think carefully."
    }));
    if(!questions.length) throw "No questions received";
  } catch(e){
    console.log("Fallback used:", e);
    questions = [
      {question:"What color is the sky?", correctAnswer:"Blue", incorrectAnswers:["Red","Green","Yellow"], hint:"Same as ocean"},
      {question:"How many days in a week?", correctAnswer:"7", incorrectAnswers:["5","6","8"], hint:"Monday to Sunday"},
      {question:"Which planet is Red Planet?", correctAnswer:"Mars", incorrectAnswers:["Venus","Jupiter","Saturn"], hint:"Roman god of war"}
    ];
  }

  showQuestion();
}

// ---------------- SHOW QUESTION ----------------
function showQuestion(){
  clearInterval(timer);
  hintBox.style.display="none";
  let timeLeft = 20;
  updateTimer(timeLeft);
  quizDiv.innerHTML=""; // clear old question

  const q = questions[current];
  const questionBlock = document.createElement("div");
  questionBlock.className="fade-in";
  questionBlock.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;
  quizDiv.appendChild(questionBlock);

  const answers = [...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
  answers.forEach(a=>{
    const btn = document.createElement("button");
    btn.textContent=a;
    btn.className="option-btn";
    btn.addEventListener("click",()=>checkAnswer(a));
    quizDiv.appendChild(btn);
  });

  timer = setInterval(()=>{
    timeLeft--;
    updateTimer(timeLeft);
    if(timeLeft<=0){
      clearInterval(timer);
      nextQuestion(false);
    }
  },1000);
}

// ---------------- TIMER ----------------
function updateTimer(timeLeft){
  timerText.textContent = `${timeLeft}s`;
  timerBar.style.width = `${(timeLeft/20)*100}%`;
}

// ---------------- CHECK ANSWER ----------------
function checkAnswer(answer){
  clearInterval(timer);
  const correct = questions[current].correctAnswer;
  const feedback = document.getElementById("feedback");
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach(btn=>{
    btn.disabled=true;
    if(btn.textContent===correct) btn.classList.add("correct");
    if(btn.textContent===answer && answer!==correct){
      btn.classList.add("wrong");
      btn.classList.add("shake");
      setTimeout(()=>btn.classList.remove("shake"),500);
    }
  });

  if(answer===correct){
    score++; ladderLevel++; updateMoneyLadder();
    feedback.innerHTML="✅ <b>Correct!</b>";
    correctSound.play();
  } else {
    feedback.innerHTML=`❌ <b>Wrong!</b><br>
      <span class="correct-answer">Correct answer: <b>${correct}</b></span>`;
    wrongSound.play();
  }

  setTimeout(nextQuestion,1800);
}

// ---------------- NEXT QUESTION ----------------
function nextQuestion(){
  current++;
  if(current>=questions.length){
    quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p><button onclick="location.reload()">Restart</button>`;
    lifelines.style.display="none";
    moneyList.style.display="none";
    hintBox.style.display="none";
    saveScore(auth.currentUser,score);
    return;
  }
  showQuestion();
}

// ---------------- LIFELINES ----------------
function useFifty(){
  if(fiftyUsed) return;
  fiftyUsed=true;
  fiftyBtn.disabled=true;
  fiftyBtn.style.opacity=0.4;
  const correct = questions[current].correctAnswer;
  let removed=0;
  document.querySelectorAll(".option-btn").forEach(btn=>{
    if(btn.textContent!==correct && removed<2){
      btn.style.display="none";
      removed++;
    }
  });
}

function useHint(){
  if(hintUsed) return;
  hintUsed=true;
  hintBtn.disabled=true;
  hintBtn.style.opacity=0.4;
  hintBox.textContent="💡 "+questions[current].hint;
  hintBox.style.display="block";
}

// ---------------- MONEY LADDER ----------------
function buildMoneyLadder(){
  moneyList.innerHTML="";
  const numQuestions = parseInt(questionCount.value);
  for(let i=numQuestions;i>0;i--){
    const li=document.createElement("li");
    li.textContent=`$${i*100}`;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  const lis = moneyList.querySelectorAll("li");
  lis.forEach(li=>li.classList.remove("current"));
  const idx = moneyList.children.length - ladderLevel -1;
  if(lis[idx]) lis[idx].classList.add("current");
}

// ---------------- LEADERBOARD ----------------
async function saveScore(user,score){
  if(!user) return;
  const data = {uid:user.uid, name:user.displayName||user.email, avatar:user.photoURL||"", score, date:firebase.firestore.FieldValue.serverTimestamp()};
  await db.collection("leaderboard").doc(user.uid).set(data,{merge:true});
  updateLeaderboard();
}

async function updateLeaderboard(){
  leaderboardList.innerHTML="";
  const snapshot = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
  snapshot.forEach(doc=>{
    const data = doc.data();
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src=data.avatar || "https://via.placeholder.com/30";
    img.width=30; img.height=30; img.style.borderRadius="50%";
    li.appendChild(img);
    li.appendChild(document.createTextNode(` ${data.name} — ${data.score} pts`));
    leaderboardList.appendChild(li);
  });
}

// ---------------- INIT ----------------
auth.onAuthStateChanged(user=>{
  if(user) onLoginSuccess(user);
});
