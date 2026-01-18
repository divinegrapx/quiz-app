document.addEventListener("DOMContentLoaded", () => {

  // ---------------- FIREBASE CONFIG ----------------
  const firebaseConfig = {
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app",
    storageBucket: "neon-quiz-app.firebasestorage.app",
    messagingSenderId: "891061147021",
    appId: "1:891061147021:web:7b3d80020f642da7b699c4",
    measurementId: "G-7LKHH1EHQW"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // ---------------- DOM ELEMENTS ----------------
  const googleBtn = document.getElementById("googleLoginBtn");
  const facebookBtn = document.getElementById("facebookLoginBtn");
  const emailBtn = document.getElementById("emailRegisterBtn");
  const emailDiv = document.getElementById("emailDiv");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");

  const authDiv = document.getElementById("authDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const startBtn = document.getElementById("startBtn");
  const categorySelect = document.getElementById("categorySelect");
  const questionCount = document.getElementById("questionCount");
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
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");

  const hintBox = document.createElement("div");
  hintBox.id = "hint-box";
  quizDiv.parentNode.insertBefore(hintBox, quizDiv.nextSibling);

  // ---------------- GLOBALS ----------------
  let questions = [], current=0, score=0, timer, timeLeft=20;
  let fiftyUsed=false, hintUsed=false, ladderLevel=0;

  const fallbackQuestions = [
    { question:"What color is the sky?", correctAnswer:"Blue", incorrectAnswers:["Red","Green","Yellow"], hint:"It's the same color as the ocean." },
    { question:"How many days are in a week?", correctAnswer:"7", incorrectAnswers:["5","6","8"], hint:"Think Monday to Sunday." },
    { question:"Which planet is known as the Red Planet?", correctAnswer:"Mars", incorrectAnswers:["Venus","Jupiter","Saturn"], hint:"Named after Roman god of war." }
  ];

  const moneyLevels = ["$100","$200","$300","$500","$1,000","$2,000","$4,000","$8,000","$16,000","$32,000"];

  // ---------------- LOGIN ----------------
  googleBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => showCategorySelection())
        .catch(err => alert("Google login failed: " + err.message));
  });

  facebookBtn.addEventListener("click", () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => showCategorySelection())
        .catch(err => alert("Facebook login failed: " + err.message));
  });

  emailBtn.addEventListener("click", () => {
    authDiv.style.display="none";
    emailDiv.style.display="block";
  });

  emailCancelBtn.addEventListener("click", () => {
    emailDiv.style.display="none";
    authDiv.style.display="block";
  });

  emailLoginBtn.addEventListener("click", async () => {
    try {
      await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
      showCategorySelection();
    } catch(e){ alert("Email login failed: "+e.message); }
  });

  emailRegisterBtn.addEventListener("click", async () => {
    try {
      await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
      showCategorySelection();
    } catch(e){ alert("Email registration failed: "+e.message); }
  });

  function showCategorySelection(){
    authDiv.style.display="none";
    emailDiv.style.display="none";
    categoryDiv.style.display="block";
  }

  // ---------------- QUIZ ----------------
  startBtn.addEventListener("click", startQuiz);
  fiftyBtn.addEventListener("click", useFifty);
  hintBtn.addEventListener("click", useHint);

  async function startQuiz(){
    startBtn.disabled=true;
    quizDiv.style.display="flex";
    lifelines.style.display="flex";
    progressContainer.style.display="block";
    timerContainer.style.display="block";
    moneyList.style.display="block";
    hintBox.style.display="none";

    ladderLevel=current=score=0;
    fiftyUsed=hintUsed=false;
    fiftyBtn.disabled=hintBtn.disabled=false;
    progressBar.style.width="0%";

    buildMoneyLadder();

    try{
      const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
      if(!res.ok) throw "API error";
      let data = await res.json();
      if(!data.length) throw "Empty API";
      questions = data.map(q=>({ question:q.question, correctAnswer:q.correctAnswer, incorrectAnswers:q.incorrectAnswers, hint:q.hint||"Think carefully." }));
    } catch {
      questions=fallbackQuestions;
    }

    showQuestion();
  }

  function buildMoneyLadder(){
    moneyList.innerHTML="";
    const totalQ=parseInt(questionCount.value);
    for(let i=0;i<totalQ;i++){
      const li=document.createElement("li");
      li.textContent=moneyLevels[i%moneyLevels.length];
      li.id="money-"+i;
      moneyList.appendChild(li);
    }
  }

  function showQuestion(){
    clearInterval(timer);
    timeLeft=20;
    updateTimer();
    hintBox.style.display="none";

    const q=questions[current];
    const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);

    quizDiv.innerHTML=`<h2>${q.question}</h2><div id="feedback"></div>`;
    answers.forEach(a=>{
      const btn=document.createElement("button");
      btn.textContent=a;
      btn.className="option-btn";
      btn.disabled=false;
      btn.onclick=()=>checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    updateMoneyLadder();
    startTimer();
  }

  function startTimer(){
    timerText.style.display="block";
    timer=setInterval(()=>{
      timeLeft--;
      updateTimer();
      if(timeLeft<=0){ clearInterval(timer); nextQuestion(false); }
    },1000);
  }

  function updateTimer(){
    timerText.textContent=`${timeLeft}s`;
    timerBar.style.width=`${(timeLeft/20)*100}%`;
  }

  function checkAnswer(answer){
    clearInterval(timer);
    const correct=questions[current].correctAnswer;
    const fb=document.getElementById("feedback");

    document.querySelectorAll(".option-btn").forEach(b=>{
      b.disabled=true;
      if(b.textContent===correct)b.classList.add("correct");
      if(b.textContent===answer && answer!==correct)b.classList.add("wrong");
    });

    if(answer===correct){
      score++;
      ladderLevel++;
      fb.textContent="✅ Correct!";
      fb.style.color="lime";
      correctSound.play();
      updateMoneyLadder();
      setTimeout(()=>nextQuestion(true),1000);
    } else {
      fb.textContent="❌ Wrong!";
      fb.style.color="red";
      wrongSound.play();
      setTimeout(()=>nextQuestion(false),1000);
    }
  }

  function nextQuestion(correct){
    current++;
    if(current>=questions.length){
      quizDiv.innerHTML=`<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p><button onclick="location.reload()">Restart</button>`;
      lifelines.style.display=timerContainer.style.display=progressContainer.style.display=moneyList.style.display="none";
      hintBox.style.display="none";
      return;
    }
    showQuestion();
  }

  function useFifty(){
    if(fiftyUsed)return; fiftyUsed=true; fiftyBtn.disabled=true;
    const correct=questions[current].correctAnswer;
    let removed=0;
    document.querySelectorAll(".option-btn").forEach(b=>{
      if(b.textContent!==correct && removed<2){ b.style.display="none"; removed++; }
    });
  }

  function useHint(){
    if(hintUsed)return; hintUsed=true; hintBtn.disabled=true;
    hintBox.textContent="💡 Hint: "+questions[current].hint;
    hintBox.style.display="block";
  }

  function updateMoneyLadder(){
    const lis=moneyList.querySelectorAll("li");
    lis.forEach(li=>li.classList.remove("current"));
    const idx=current-1;
    if(idx>=0 && lis[idx]) lis[idx].classList.add("current");
  }

});
