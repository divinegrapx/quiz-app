document.addEventListener("DOMContentLoaded", () => {

  // ---------------- FIREBASE CONFIG ----------------
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // ---------------- DOM ELEMENTS ----------------
  const authDiv = document.getElementById("authDiv");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginEmailBtn = document.getElementById("loginEmailBtn");
  const registerBtn = document.getElementById("registerBtn");
  const loginGoogleBtn = document.getElementById("loginGoogleBtn");
  const loginFacebookBtn = document.getElementById("loginFacebookBtn");

  const categoryDiv = document.getElementById("categoryDiv");
  const categorySelect = document.getElementById("categorySelect");
  const questionCount = document.getElementById("questionCount");
  const startBtn = document.getElementById("startBtn");

  const quizDiv = document.getElementById("quiz");
  const lifelines = document.getElementById("lifelines");
  const fiftyBtn = document.getElementById("fiftyBtn");
  const hintBtn = document.getElementById("hintBtn");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const timerContainer = document.getElementById("timer-container");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const moneyList = document.getElementById("money-list");
  const quizTitle = document.getElementById("quiz-title");
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");
  const hintBox = document.getElementById("hint-box");

  // ---------------- GLOBALS ----------------
  let questions = [], current = 0, score = 0, timer, timeLeft = 20;
  let fiftyUsed = false, hintUsed = false, ladderLevel = 0;

  const fallbackQuestions = [
    { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
    { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
    { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
  ];

  const moneyLevelsBase = ["$100","$200","$300","$500","$1,000","$2,000","$4,000","$8,000","$16,000","$32,000"];

  // ---------------- AUTH FUNCTIONS ----------------
  function afterLogin(user){
    authDiv.style.display="none";
    categoryDiv.style.display="block";
    quizTitle.textContent = `🎯 Welcome ${user.displayName || user.email}`;
    updateLeaderboard();
  }

  loginEmailBtn.addEventListener("click", ()=>{
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email,password)
        .then(res => afterLogin(res.user))
        .catch(err => alert("Login failed: "+err.message));
  });

  registerBtn.addEventListener("click", ()=>{
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.createUserWithEmailAndPassword(email,password)
        .then(res => afterLogin(res.user))
        .catch(err => alert("Register failed: "+err.message));
  });

  loginGoogleBtn.addEventListener("click", ()=>{
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(res=>afterLogin(res.user))
    .catch(err=>alert("Google login failed: "+err.message));
  });

  loginFacebookBtn.addEventListener("click", ()=>{
    const provider = new firebase.auth.FacebookAuthProvider();
    auth.signInWithPopup(provider).then(res=>afterLogin(res.user))
    .catch(err=>alert("Facebook login failed: "+err.message));
  });

  // ---------------- START QUIZ ----------------
  startBtn.addEventListener("click", startQuiz);
  fiftyBtn.addEventListener("click", useFifty);
  hintBtn.addEventListener("click", useHint);

  function buildMoneyLadder(){
    moneyList.innerHTML="";
    const numQuestions = parseInt(questionCount.value);
    const factor = Math.ceil(numQuestions / moneyLevelsBase.length);
    let levels=[];
    for(let i=0;i<numQuestions;i++){
      levels.push(moneyLevelsBase[Math.min(i/factor, moneyLevelsBase.length-1) | 0]);
    }
    levels.reverse().forEach(a=>{
      const li=document.createElement("li");
      li.textContent=a;
      moneyList.appendChild(li);
    });
  }

  async function startQuiz(){
    startBtn.disabled=true;
    quizDiv.style.display="flex";
    lifelines.style.display="flex";
    progressContainer.style.display="block";
    timerContainer.style.display="block";
    moneyList.style.display="block";
    hintBox.style.display="none";
    quizDiv.innerHTML="Loading...";

    ladderLevel=0; current=0; score=0; fiftyUsed=false; hintUsed=false;
    fiftyBtn.disabled=false; hintBtn.disabled=false; progressBar.style.width="0%";

    buildMoneyLadder();
    quizTitle.textContent = `🎯 ${categorySelect.value.replace(/_/g," ").toUpperCase()} — ${questionCount.value} Questions`;

    try{
      const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
      if(!res.ok) throw "API error";
      let data = await res.json();
      if(!data.length) throw "Empty API";

      questions = data.map(q=>({
        question: q.question,
        correctAnswer: q.correctAnswer,
        incorrectAnswers: q.incorrectAnswers,
        hint: q.hint || "Think carefully."
      }));
    }catch{
      questions = fallbackQuestions;
    }

    showQuestion();
  }

  function showQuestion(){
    clearInterval(timer);
    timeLeft=20; updateTimer(); hintBox.style.display="none";

    const q = questions[current];
    const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);

    quizDiv.innerHTML=`<h2>${q.question}</h2><div id="feedback"></div>`;
    answers.forEach(a=>{
      const btn=document.createElement("button");
      btn.textContent=a;
      btn.className="option-btn";
      btn.onclick=()=>checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    progressBar.style.width=`${(current/questions.length)*100}%`;
    startTimer();
  }

  function startTimer(){
    timerText.style.display="block";
    timer=setInterval(()=>{
      timeLeft--; updateTimer();
      if(timeLeft<=0){ clearInterval(timer); nextQuestion(); }
    },1000);
  }

  function updateTimer(){
    timerText.textContent=`${timeLeft}s`;
    timerBar.style.width=`${(timeLeft/20)*100}%`;
  }

  function checkAnswer(answer){
    clearInterval(timer);
    const correct = questions[current].correctAnswer;
    const feedbackDiv = document.getElementById("feedback");
    document.querySelectorAll(".option-btn").forEach(b=>{
      b.disabled=true;
      if(b.textContent===correct) b.classList.add("correct");
      if(b.textContent===answer && answer!==correct) b.classList.add("wrong");
    });
    if(answer===correct){
      score++; ladderLevel++; updateMoneyLadder();
      feedbackDiv.textContent="✅ Correct!"; feedbackDiv.style.color="lime"; correctSound.play();
      setTimeout(()=>nextQuestion(),1000);
    }else{
      feedbackDiv.textContent="❌ Wrong!"; feedbackDiv.style.color="red"; wrongSound.play();
      setTimeout(()=>nextQuestion(),1000);
    }
  }

  function nextQuestion(){
    current++;
    if(current>=questions.length){
      quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>
        <button onclick="location.reload()">Restart</button>`;
      startBtn.disabled=false; lifelines.style.display="none"; timerContainer.style.display="none";
      progressContainer.style.display="none"; moneyList.style.display="none"; hintBox.style.display="none";
      const user = auth.currentUser; saveScore(user,score);
      return;
    }
    showQuestion();
  }

  function useFifty(){
    if(fiftyUsed) return; fiftyUsed=true; fiftyBtn.disabled=true;
    const correct = questions[current].correctAnswer;
    let removed=0;
    Array.from(document.querySelectorAll(".option-btn")).forEach(b=>{
      if(b.textContent!==correct && removed<2 && Math.random()>0.3){ b.style.display="none"; removed++; }
    });
  }

  function useHint(){
    if(hintUsed) return; hintUsed=true; hintBtn.disabled=true;
    hintBox.textContent="💡 Hint: "+questions[current].hint;
    hintBox.style.display="block";
  }

  function updateMoneyLadder(){
    const lis=moneyList.querySelectorAll("li");
    lis.forEach(li=>li.classList.remove("current"));
    const idx=moneyList.children.length-ladderLevel-1;
    if(lis[idx]) lis[idx].classList.add("current");
  }

  async function saveScore(user,score){
    if(!user) return;
    const data = { uid:user.uid, name:user.displayName||user.email, avatar:user.photoURL||"", score:score, date:firebase.firestore.FieldValue.serverTimestamp() };
    try{ await db.collection("leaderboard").doc(user.uid).set(data,{merge:true}); updateLeaderboard(); }catch(e){ console.error(e); }
  }

  async function updateLeaderboard(){
    const list = document.getElementById("leaderboard-list");
    list.innerHTML="Loading...";
    try{
      const snapshot = await db.collection("leaderboard").orderBy("score","desc").limit(10).get();
      list.innerHTML="";
      snapshot.forEach(doc=>{
        const d = doc.data();
        const li = document.createElement("li");
        li.style.display="flex"; li.style.alignItems="center"; li.style.gap="8px";
        const img = document.createElement("img"); img.src=d.avatar||""; img.width=30; img.height=30; img.style.borderRadius="50%";
        li.appendChild(img); li.appendChild(document.createTextNode(`${d.name} — ${d.score} pts`));
        list.appendChild(li);
      });
    }catch(e){ console.error(e); list.innerHTML="Failed to load leaderboard"; }
  }

  updateLeaderboard();
});
