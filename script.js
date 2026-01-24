document.addEventListener("DOMContentLoaded", () => {

  // FIREBASE
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

  // ELEMENTS
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailDiv = document.getElementById("emailDiv");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");
  const startBtn = document.getElementById("startBtn");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const quizDiv = document.getElementById("quiz");
  const moneyList = document.getElementById("money-list");
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
  const soundToggle = document.getElementById("soundToggle");

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
  let questions=[],current=0,ladderLevel=0,timer;
  let fiftyUsed=false,secondUsed=false,friendUsed=false,audienceUsed=false;
  let timePerQuestion = 30;

  function stopAllSounds(){Object.values(sounds).forEach(s=>{s.pause();s.currentTime=0;});}
  function playSound(name){if(!soundEnabled || !sounds[name]) return; stopAllSounds(); sounds[name].play();}

  // LOGIN
  googleLoginBtn.addEventListener("click",async()=>{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); showSettings();});
  guestLoginBtn.addEventListener("click",()=>showSettings());
  emailRegisterBtn.addEventListener("click",()=>emailDiv.style.display="block");
  emailCancelBtn.addEventListener("click",()=>emailDiv.style.display="none");
  emailLoginBtn.addEventListener("click",async()=>{try{await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value); showSettings();}catch(e){alert(e.message);}});
  emailRegisterSubmitBtn.addEventListener("click",async()=>{try{await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value); showSettings();}catch(e){alert(e.message);}});

  auth.onAuthStateChanged(user=>{
    if(user){document.getElementById("profileDiv").innerHTML=`<img src="${user.photoURL||'https://i.imgur.com/6VBx3io.png'}"><h3>${user.displayName||"Guest"}</h3>`;}
  });

  function showSettings(){document.getElementById("authDiv").style.display="none"; document.getElementById("categoryDiv").style.display="block"; playSound("intro");}

  // START QUIZ
  startBtn.addEventListener("click", startQuiz);

  async function startQuiz(){
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;
    soundEnabled = soundToggle.value==="on";
    timePerQuestion = difficulty==="hard"?20:30;

    const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
    questions = await res.json();
    document.getElementById("categoryDiv").style.display="none";
    document.getElementById("quiz-container").style.display="block";

    buildMoneyLadder(20);
    current=0; ladderLevel=0; fiftyUsed=secondUsed=friendUsed=audienceUsed=false;

    playSound("thinking");
    showQuestion();
  }

  function showQuestion(){
    clearInterval(timer);
    callFriendBox.innerHTML=""; audienceVote.innerHTML="";
    const q=questions[current];
    quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2>`;

    const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);
    answers.forEach(a=>{
      const btn=document.createElement("button");
      btn.className="option-btn";
      btn.textContent=a;
      btn.addEventListener("click",()=>checkAnswer(a,btn));
      quizDiv.appendChild(btn);
    });

    let timeLeft=timePerQuestion; updateTimer(timeLeft);
    timer=setInterval(()=>{timeLeft--; updateTimer(timeLeft); if(timeLeft<=5) playSound("tick"); if(timeLeft<=0) nextQuestion();},1000);
  }

  function updateTimer(t){timerText.textContent=t+"s"; timerBar.style.width=(t/timePerQuestion*100)+"%"; timerBar.style.background=t>10?"#00ff00":t>5?"#ffcc00":"#ff4d4d";}

  function checkAnswer(ans,btn){
    clearInterval(timer); stopAllSounds();
    const correct=questions[current].correctAnswer;
    document.querySelectorAll(".option-btn").forEach(b=>{b.disabled=true; if(b.textContent===correct) b.classList.add("correct"); if(b.textContent===ans && ans!==correct) b.classList.add("wrong");});
    if(ans===correct){ladderLevel++; playSound("correct");} 
    else {if(secondUsed){ladderLevel++; playSound("correct"); secondUsed=false;} else {playSound("wrong");}}
    updateMoneyLadder(); setTimeout(nextQuestion,2000);
  }

  function nextQuestion(){
    current++;
    if(current>=questions.length){showFinalScreen(); return;}
    playSound("thinking"); showQuestion();
  }

  function buildMoneyLadder(count){moneyList.innerHTML=""; for(let i=count;i>=1;i--){const li=document.createElement("li");li.className="ladder-btn"; li.textContent="$"+(i*100); moneyList.appendChild(li);}}
  function updateMoneyLadder(){[...moneyList.children].forEach(li=>li.classList.remove("current")); const idx=moneyList.children.length-ladderLevel; if(moneyList.children[idx]) moneyList.children[idx].classList.add("current");}

  // LIFELINES
  fiftyBtn.addEventListener("click",()=>{
    if(fiftyUsed) return; fiftyUsed=true; fiftyBtn.classList.add("used");
    const correct=questions[current].correctAnswer; let removed=0;
    document.querySelectorAll(".option-btn").forEach(b=>{if(b.textContent!==correct && removed<2){b.style.opacity=0.3; removed++;}});
  });

  secondChanceBtn.addEventListener("click",()=>{if(secondUsed) return; secondUsed=true; secondChanceBtn.classList.add("used"); alert("Second Chance ready! One wrong answer forgiven.");});

  callFriendBtn.addEventListener("click",()=>{if(friendUsed) return; friendUsed=true; callFriendBtn.classList.add("used"); playSound("call"); callFriendBox.innerHTML=`📞 Friend says: <b>${questions[current].correctAnswer}</b>`;});

  audienceBtn.addEventListener("click",()=>{if(audienceUsed) return; audienceUsed=true; audienceBtn.classList.add("used"); playSound("audience"); audienceVote.innerHTML=""; document.querySelectorAll(".option-btn").forEach(b=>{const percent=Math.floor(Math.random()*80)+10; audienceVote.innerHTML+=`<div>${b.textContent}: ${percent}%</div>`;});});

  function showFinalScreen(){
    stopAllSounds(); playSound("win");
    quizDiv.innerHTML=`<div class="final-screen">
      <h1>🎉 CONGRATULATIONS</h1>
      <h2>You Won $${ladderLevel*100}</h2>
      <button onclick="location.reload()">Restart Quiz</button>
      <button onclick="navigator.share({text:'I won $${ladderLevel*100} in NEON MILLIONAIRE!'})">Share Score</button>
    </div>`;
  }

});
