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
  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const nightmareCheck = document.getElementById("nightmareModeCheck");
  const soundToggle = document.getElementById("soundToggle");

  const quizDiv = document.getElementById("quiz");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const moneyList = document.getElementById("money-list");
  const scoreRow = document.createElement("div");
  quizContainer.prepend(scoreRow);

  const fiftyBtn = document.getElementById("fiftyBtn");
  const secondChanceBtn = document.getElementById("secondChanceBtn");
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");
  const callFriendBox = document.getElementById("callFriendBox");
  const audienceVote = document.getElementById("audienceVote");
  const safeMoneyBtn = document.createElement("button");
  safeMoneyBtn.textContent = "💰 Safe Money";
  safeMoneyBtn.style.marginTop = "10px";
  quizContainer.appendChild(safeMoneyBtn);

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
  function playSound(name) {
    if (!soundEnabled || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play();
  }

  /* ================= AUTH ================= */
  let user = null;

  googleLoginBtn.onclick = async () => await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  guestLoginBtn.onclick = () => auth.signInAnonymously();
  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";
  emailLoginBtn.onclick = async () => await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value);
  emailRegisterSubmitBtn.onclick = async () => await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value);

  auth.onAuthStateChanged(u => {
    if(!u) return;
    user = u;
    loginDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
    playSound("intro");
    loadUserScore();
    updateLeaderboard();
  });

  /* ================= GAME STATE ================= */
  let questions = [];
  let current = 0;
  let score = 0;
  let lifetime = 0;
  let timer;
  let timePerQ = 30;
  let secondChanceActive = false;
  let secondChanceUsed = false;
  const prizes = [100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];

  /* ================= BUILD LADDER ================= */
  function buildLadder() {
    moneyList.innerHTML = "";
    prizes.forEach(p => {
      const li = document.createElement("li");
      li.className = "ladder-btn";
      li.textContent = "$" + p;
      moneyList.appendChild(li);
    });
  }

  function highlightLadder() {
    const buttons = document.querySelectorAll(".ladder-btn");
    buttons.forEach((b,i) => {
      b.classList.remove("current","checkpoint");
      if(i===current+1) b.classList.add("current");
      if(i<=current) b.classList.add("checkpoint");
    });
  }

  function updateScoreRow() {
    scoreRow.textContent = `Score: $${score} | Total: $${lifetime}`;
  }

  function loadUserScore() {
    // Fetch accumulated score from Firestore
    if(!user) return;
    db.collection("users").doc(user.uid).get().then(doc=>{
      lifetime = doc.exists ? doc.data().totalScore || 0 : 0;
      updateScoreRow();
    });
  }

  function updateLeaderboard() {
    db.collection("users").orderBy("totalScore","desc").limit(10).get().then(snapshot=>{
      const leaderboard = document.getElementById("leaderboard-list");
      leaderboard.innerHTML = "";
      snapshot.forEach(doc=>{
        const li = document.createElement("li");
        li.textContent = `${doc.data().name || "Player"} - $${doc.data().totalScore||0}`;
        leaderboard.appendChild(li);
      });
    });
  }

  /* ================= START QUIZ ================= */
  startBtn.onclick = async () => {
    soundEnabled = soundToggle.value==="on";
    timePerQ = nightmareCheck.checked ? 20 : 30;
    resetLifelines();
    score = 0; current=0; secondChanceActive=false; secondChanceUsed=false;

    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=15&categories=${categorySelect.value}&difficulty=${difficultySelect.value}`);
    questions = await res.json();

    categoryDiv.style.display = "none";
    quizContainer.style.display = "block";
    buildLadder();
    highlightLadder();
    playSound("thinking");
    showQuestion();
  };

  /* ================= TIMER ================= */
  function startTimer() {
    let t = timePerQ;
    updateTimer(t);
    timer = setInterval(()=>{
      t--;
      updateTimer(t);
      if(t<=5) playSound("tick");
      if(t<=0) loseQuestion();
    },1000);
  }

  function updateTimer(t){
    timerText.textContent = t+"s";
    timerBar.style.width = (t/timePerQ*100)+"%";
  }

  /* ================= QUESTIONS ================= */
  function showQuestion() {
    clearInterval(timer);
    quizDiv.innerHTML = "";
    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current+1}: ${q.question}</h2>`;
    const answers = [...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
    answers.forEach(ans=>{
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = ans;
      btn.onclick = ()=>handleAnswer(btn,ans);
      quizDiv.appendChild(btn);
    });
    startTimer();
  }

  function handleAnswer(btn,answer){
    clearInterval(timer);
    const correct = questions[current].correctAnswer;
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(b=>{
      b.disabled = true;
      if(b.textContent===correct) b.classList.add("correct");
    });
    if(answer===correct){
      btn.classList.add("correct");
      score += prizes[current];
      playSound("correct");
      nextQuestion();
    } else {
      btn.classList.add("wrong");
      playSound("wrong");
      if(secondChanceActive){ secondChanceActive=false; secondChanceUsed=true; return; }
      score = Math.max(0,score-prizes[current]);
      setTimeout(showFinal,1500);
    }
    updateScoreRow();
    highlightLadder();
  }

  function nextQuestion(){
    setTimeout(()=>{
      current++;
      if(current>=questions.length) showFinal();
      else showQuestion();
    },1200);
  }

  function loseQuestion(){score=Math.max(0,score-prizes[current]); showFinal();}

  /* ================= LIFELINES ================= */
  fiftyBtn.onclick = ()=>{
    if(score<100 || fiftyBtn.classList.contains("used")) return;
    score -= 100; fiftyBtn.classList.add("used");
    const correct = questions[current].correctAnswer;
    let removed = 0;
    document.querySelectorAll(".option-btn").forEach(b=>{
      if(b.textContent!==correct && removed<2){ b.style.opacity=0.2; removed++; }
    });
  };

  secondChanceBtn.onclick = ()=>{
    if(score<200 || secondChanceUsed) return;
    score -=200;
    secondChanceActive=true;
    secondChanceBtn.classList.add("used");
  };

  /* ================= SAFE MONEY ================= */
  safeMoneyBtn.onclick = ()=>{
    score = getLastCheckpoint();
    showFinal();
  };

  function getLastCheckpoint(){
    let amt=0;
    for(let i=0;i<prizes.length;i++){
      if(i<=current) amt=prizes[i]; else break;
    }
    return amt;
  }

  /* ================= FINAL ================= */
  function showFinal(){
    playSound("win");
    if(user) db.collection("users").doc(user.uid).set({totalScore: (lifetime+score)}, {merge:true});
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 Game Over</h1>
        <h2>You earned $${score}</h2>
        <button onclick="location.reload()">Play Again</button>
      </div>
    `;
    lifetime += score;
    updateScoreRow();
  }

  /* ================= UTIL ================= */
  function resetLifelines(){
    [fiftyBtn,secondChanceBtn].forEach(b=>b.classList.remove("used"));
    secondChanceActive=false; secondChanceUsed=false;
  }

  function show(el){el.style.display="block";}
  function hide(el){el.style.display="none";}

});
