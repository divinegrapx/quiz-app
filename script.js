document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */
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

  /* ================= ELEMENTS ================= */
  const loginDiv = document.getElementById("loginDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");

  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  const startBtn = document.getElementById("startBtn");
  const quizDiv = document.getElementById("quiz");

  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");

  const fiftyBtn = document.getElementById("fiftyBtn");
  const secondChanceBtn = document.getElementById("secondChanceBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");

  const callFriendBox = document.getElementById("callFriendBox");
  const audienceVote = document.getElementById("audienceVote");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const nightmareCheck = document.getElementById("nightmareModeCheck");
  const soundToggle = document.getElementById("soundToggle");

  const moneyList = document.getElementById("money-list");
  const scoreRow = document.createElement("div");
  scoreRow.id = "scoreRow";
  quizContainer.prepend(scoreRow);

  /* ================= SOUNDS ================= */
  const sounds = {
    intro: document.getElementById("intro-sound"),
    thinking: document.getElementById("thinking-sound"),
    correct: document.getElementById("correct-sound"),
    wrong: document.getElementById("wrong-sound"),
    tick: document.getElementById("tick-sound"),
    win: document.getElementById("win-sound"),
    lose: document.getElementById("lose-sound"),
    call: document.getElementById("call-sound"),
    audience: document.getElementById("audience-sound")
  };
  let soundEnabled = true;
  function playSound(name){
    if(!soundEnabled||!sounds[name]) return;
    sounds[name].currentTime=0;
    sounds[name].play();
  }
  function stopSound(name){
    if(sounds[name]){
      sounds[name].pause();
      sounds[name].currentTime=0;
    }
  }

  /* ================= USER / AUTH ================= */
  let user = null;
  let lifetime = 0;

  googleLoginBtn.onclick = async () => await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  guestLoginBtn.onclick = () => auth.signInAnonymously();
  emailRegisterBtn.onclick = () => show(emailDiv);
  emailCancelBtn.onclick = () => hide(emailDiv);
  emailLoginBtn.onclick = async () => await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value);
  emailRegisterSubmitBtn.onclick = async () => await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value);

  auth.onAuthStateChanged(u => {
    if(!u) return;
    user = u;
    hide(loginDiv);
    hide(emailDiv);
    show(categoryDiv);
    playSound("intro");
    loadUserScore();
  });

  function show(el){el.style.display="block";}
  function hide(el){el.style.display="none";}

  function loadUserScore(){
    if(!user) return;
    db.collection("users").doc(user.uid).get().then(doc=>{
      if(doc.exists) lifetime = doc.data().lifetime || 0;
      updateScoreRow();
    });
  }

  function saveUserScore(){
    if(!user) return;
    db.collection("users").doc(user.uid).set({lifetime},{merge:true});
  }

  /* ================= GAME STATE ================= */
  let questions = [];
  let current = 0;
  let score = 0;
  let timer;
  let timePerQuestion = 30;
  let secondChanceActive = false;
  let secondChanceUsed = false;

  const prizes=[100,200,300,500,1000,2000,5000,10000,20000,50000,100000,200000,500000,1000000];

  /* ================= START QUIZ ================= */
  startBtn.onclick = async () => {
    soundEnabled = soundToggle.value === "on";
    timePerQuestion = nightmareCheck.checked ? 20 : 30;
    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
    questions = await res.json();

    categoryDiv.style.display="none";
    quizContainer.style.display="block";

    score = 0;
    current = 0;
    secondChanceActive=false;
    secondChanceUsed=false;

    playSound("thinking");
    buildLadder();
    highlightLadder();
    updateScoreRow();
    showQuestion();
  };

  /* ================= QUESTION ================= */
  function showQuestion(){
    clearInterval(timer);
    quizDiv.innerHTML="";
    const q = questions[current];
    quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2>`;
    const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
    answers.forEach(ans=>{
      const btn = document.createElement("button");
      btn.className="option-btn";
      btn.textContent=ans;
      btn.onclick=()=>handleAnswer(btn,ans);
      quizDiv.appendChild(btn);
    });
    startTimer();
  }

  /* ================= TIMER ================= */
  function startTimer(){
    let t = timePerQuestion;
    updateTimer(t);
    timer = setInterval(()=>{
      t--;
      updateTimer(t);
      if(t<=5) playSound("tick");
      if(t<=0) loseQuestion();
    },1000);
  }

  function updateTimer(t){
    timerText.textContent=t+"s";
    timerBar.style.width=(t/timePerQuestion*100)+"%";
  }

  /* ================= ANSWER HANDLING ================= */
  function handleAnswer(btn, answer){
    clearInterval(timer);
    const correct = questions[current].correctAnswer;
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(b=>{
      b.disabled=true;
      if(b.textContent===correct) b.classList.add("correct");
    });

    if(answer===correct){
      btn.classList.add("correct");
      score += 100;
      playSound("correct");
      nextQuestion();
    } else {
      btn.classList.add("wrong");
      playSound("wrong");
      if(secondChanceActive){
        secondChanceActive=false;
        secondChanceUsed=true;
        return;
      }
      if(nightmareCheck.checked){
        // Nightmare mode ends quiz immediately
        score = Math.max(0,score-100);
        showFinal();
        return;
      }
      score = Math.max(0,score-100);
      nextQuestion();
    }
    updateScoreRow();
    highlightLadder();
  }

  function loseQuestion(){
    score = Math.max(0,score-100);
    nextQuestion();
  }

  function nextQuestion(){
    setTimeout(()=>{
      current++;
      if(current>=questions.length){
        showFinal();
      } else {
        showQuestion();
      }
    },1200);
  }

 /* ================= LADDER / SCORE ================= */
function buildLadder() {
  moneyList.innerHTML = "";
  prizes.forEach(p => {
    const li = document.createElement("li");
    li.className = "ladder-btn";
    li.textContent = "$" + p;
    if (p % 5000 === 0) li.classList.add("checkpoint"); // checkpoint milestones
    moneyList.appendChild(li);
  });
}

// Highlight only the last correct milestone
function highlightLadder() {
  const buttons = document.querySelectorAll(".ladder-btn");
  buttons.forEach(b => b.classList.remove("current"));
  if (current > 0 && current <= prizes.length) {
    buttons[current - 1].classList.add("current");
  }
}

function updateScoreRow() {
  scoreRow.textContent = `Score: $${score} | Total: $${lifetime}`;
}

/* ================= SAFE MONEY ================= */
const safeMoneyBtn = document.createElement("button");
safeMoneyBtn.id = "safeMoneyBtn";
safeMoneyBtn.textContent = "💰 Safe Money";
quizContainer.prepend(safeMoneyBtn);

safeMoneyBtn.onclick = () => {
  score = getLastMilestone();
  lifetime += score;
  updateScoreRow();
  showFinal();
};

function getLastMilestone() {
  let amt = 0;
  for (let i = 0; i < prizes.length; i++) {
    if (score >= prizes[i]) amt = prizes[i];
    else break;
  }
  return amt;
}

/* ================= LIFELINES ================= */
fiftyBtn.onclick = () => {
  if (fiftyBtn.classList.contains("used")) return;
  playSound("thinking");
  const correct = questions[current].correctAnswer;
  let removed = 0;
  document.querySelectorAll(".option-btn").forEach(b => {
    if (b.textContent !== correct && removed < 2) {
      b.style.opacity = 0.2;
      removed++;
    }
  });
  fiftyBtn.classList.add("used");
  fiftyBtn.disabled = true;
};

secondChanceBtn.onclick = () => {
  if (secondChanceUsed || secondChanceBtn.classList.contains("used")) return;
  secondChanceActive = true;
  secondChanceBtn.classList.add("used");
  secondChanceBtn.disabled = true;
  playSound("thinking");
};

callFriendBtn.onclick = () => {
  if (callFriendBtn.classList.contains("used")) return;
  playSound("call");
  callFriendBtn.classList.add("used");
  callFriendBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  callFriendBox.innerHTML = `<p>Friend thinks the answer is: <strong>${correct}</strong></p>`;
  setTimeout(() => { callFriendBox.innerHTML = ""; }, 5000);
};

audienceBtn.onclick = () => {
  if (audienceBtn.classList.contains("used")) return;
  playSound("audience");
  audienceBtn.classList.add("used");
  audienceBtn.disabled = true;

  const correct = questions[current].correctAnswer;
  const options = [...document.querySelectorAll(".option-btn")].map(b => b.textContent);
  const votes = options.map(opt => opt === correct ? 60 : Math.floor(Math.random() * 40));
  let html = "<p>Audience votes:</p>";
  options.forEach((opt, i) => {
    html += `<div>${opt}: ${votes[i]}%</div>`;
  });
  audienceVote.innerHTML = html;
  setTimeout(() => { audienceVote.innerHTML = ""; }, 5000);
};

/* ================= INIT LADDER & SCORE ================= */
buildLadder();
updateScoreRow();
highlightLadder();
