document.addEventListener("DOMContentLoaded", () => {

  /***** FIREBASE SETUP *****/
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

  /***** ELEMENTS *****/
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const guestLoginBtn = document.getElementById("guestLoginBtn");
  const emailRegisterBtn = document.getElementById("emailRegisterBtn");
  const emailDiv = document.getElementById("emailDiv");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");
  const helpBtn = document.getElementById("helpBtn");
  const startBtn = document.getElementById("startBtn");
  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const soundToggle = document.getElementById("soundToggle");
  const hardcoreToggle = document.getElementById("hardcoreToggle");

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
  const walkAwayBtn = document.getElementById("walkAwayBtn");

  const shopDiv = document.getElementById("shopDiv");
  const closeShopBtn = document.getElementById("closeShopBtn");
  const buyBtns = document.querySelectorAll(".buy-btn");

  const leaderboardList = document.getElementById("leaderboard-list");
  const profileDiv = document.getElementById("profileDiv");

  /***** SOUNDS *****/
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
  function stopAllSounds() { Object.values(sounds).forEach(s => { s.pause(); s.currentTime = 0; }); }
  function playSound(name) { if(!soundEnabled || !sounds[name]) return; stopAllSounds(); sounds[name].play(); }

  /***** USER LOGIN *****/
  googleLoginBtn.onclick = async () => {
    try {
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      showSettings();
    } catch(e){ alert("Google login failed"); }
  };

  guestLoginBtn.onclick = () => showSettings();

  emailRegisterBtn.onclick = () => emailDiv.style.display = "block";
  emailCancelBtn.onclick = () => emailDiv.style.display = "none";

  emailLoginBtn.onclick = async () => {
    try { await auth.signInWithEmailAndPassword(emailInput.value,passwordInput.value); location.reload(); }
    catch(e){ alert("Login failed"); }
  };

  emailRegisterSubmitBtn.onclick = async () => {
    try { await auth.createUserWithEmailAndPassword(emailInput.value,passwordInput.value); location.reload(); }
    catch(e){ alert("Registration failed"); }
  };

  helpBtn.onclick = () => alert("Neon Millionaire Instructions:\n\nAnswer questions correctly to earn money.\nUse lifelines wisely.\nReach checkpoints to secure guaranteed money.\nWalk away anytime to keep earned money.\nCheck shop to buy power-ups.\nHardcore Mode = 20s timer, no lifelines!");

  auth.onAuthStateChanged(user=>{
    if(user){
      profileDiv.innerHTML=`<img src="${user.photoURL||'https://i.imgur.com/6VBx3io.png'}">
      <h3>${user.displayName||"Guest"}</h3>`;
      loadLeaderboard();
    }
  });

  /***** SETTINGS SCREEN *****/
  function showSettings(){
    document.getElementById("authDiv").style.display="none";
    document.getElementById("categoryDiv").style.display="block";
    playSound("intro");
  }

  /***** GAME STATE *****/
  let questions=[],current=0,ladderLevel=0,timer,fiftyUsed=false,secondChanceUsed=false,friendUsed=false,audienceUsed=false;
  let timePerQuestion=30,hardcoreMode=false,streak=0,guaranteedMoney=0;
  const checkpointLevels=[5,10,15,20];

  startBtn.onclick = startQuiz;
  walkAwayBtn.onclick = walkAway;

  async function startQuiz(){
    hardcoreMode=hardcoreToggle.checked;
    timePerQuestion=hardcoreMode?20:30;
    soundEnabled=soundToggle.value==="on";

    const category=categorySelect.value;
    const difficulty=difficultySelect.value;
    const res=await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
    questions=await res.json();

    document.getElementById("categoryDiv").style.display="none";
    document.getElementById("quiz-container").style.display="block";
    buildMoneyLadder(questions.length);

    current=0; ladderLevel=0; fiftyUsed=secondChanceUsed=friendUsed=audienceUsed=false;
    playSound("thinking");
    showQuestion();
  }

  function buildMoneyLadder(count){
    moneyList.innerHTML="";
    for(let i=count;i>=1;i--){
      const li=document.createElement("li");
      li.className="ladder-btn";
      li.textContent="$"+(i*100);
      moneyList.appendChild(li);
    }
  }

  function updateMoneyLadder(){
    [...moneyList.children].forEach(li=>li.classList.remove("current"));
    const idx=moneyList.children.length-ladderLevel;
    if(moneyList.children[idx]) moneyList.children[idx].classList.add("current");
  }

  function showQuestion(){
    clearInterval(timer);
    callFriendBox.innerHTML=""; audienceVote.innerHTML="";

    const q=questions[current];
    quizDiv.innerHTML=`<h2>Q${current+1}: ${q.question}</h2>`;
    const answers=[...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5);

    answers.forEach(a=>{
      const btn=document.createElement("button");
      btn.className="option-btn"; btn.textContent=a;
      btn.onclick=()=>checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    let timeLeft=timePerQuestion;
    updateTimer(timeLeft);

    timer=setInterval(()=>{
      timeLeft--;
      updateTimer(timeLeft);
      if(timeLeft<=5) playSound("tick");
      if(timeLeft<=0) checkAnswer(null);
    },1000);
  }

  function updateTimer(t){
    timerText.textContent=t+"s";
    timerBar.style.width=(t/timePerQuestion*100)+"%";
    timerBar.style.background=t>10?"#00ff00":t>5?"#ffcc00":"#ff4d4d";
  }

  function checkAnswer(ans){
    clearInterval(timer); stopAllSounds();
    const correct=questions[current].correctAnswer;

    const btns=document.querySelectorAll(".option-btn");
    btns.forEach(b=>{
      b.disabled=true;
      if(b.textContent===correct) b.classList.add("correct");
      if(b.textContent===ans && ans!==correct) b.classList.add("wrong");
    });

    if(ans===correct){
      ladderLevel++; streak++; playSound("correct");
      if(checkpointLevels.includes(ladderLevel)) guaranteedMoney=ladderLevel*100;
    } else {
      if(secondChanceUsed===false){
        secondChanceUsed=true; alert("Second Chance activated! Retry question"); btns.forEach(b=>b.disabled=false); return;
      }
      playSound("wrong"); streak=0; ladderLevel=Math.max(...checkpointLevels.filter(l=>l<=ladderLevel));
    }

    updateMoneyLadder();
    current++;
    setTimeout(()=>{
      if(current>=questions.length) showFinalScreen();
      else{ playSound("thinking"); showQuestion(); }
    },2000);
  }

  function walkAway(){ stopAllSounds(); showFinalScreen(true); }

  function showFinalScreen(walkAway=false){
    stopAllSounds(); playSound(walkAway?"win":"win");

    const finalMoney=walkAway?ladderLevel*100:guaranteedMoney;
    saveScore(finalMoney);

    quizDiv.innerHTML=`
      <div class="final-screen">
        <h1>🎉 CONGRATULATIONS</h1>
        <h2>You Won $${finalMoney}</h2>
        <button onclick="location.reload()">Restart Quiz</button>
        <button onclick="navigator.share({text:'I won $${finalMoney} in NEON MILLIONAIRE!'})">Share Score</button>
      </div>
    `;
  }

  /***** LIFELINES *****/
  fiftyBtn.onclick=()=>{
    if(fiftyUsed||hardcoreMode) return; fiftyUsed=true; fiftyBtn.classList.add("used");
    const correct=questions[current].correctAnswer; let removed=0;
    document.querySelectorAll(".option-btn").forEach(b=>{
      if(b.textContent!==correct && removed<2){ b.style.opacity=0.3; removed++; }
    });
  };

  secondChanceBtn.onclick=()=>{
    if(secondChanceUsed||hardcoreMode) return; secondChanceUsed=true; secondChanceBtn.classList.add("used");
    alert("Second Chance purchased! One wrong answer will be forgiven this game.");
  };

  callFriendBtn.onclick=()=>{
    if(friendUsed||hardcoreMode) return; friendUsed=true; callFriendBtn.classList.add("used");
    playSound("call"); callFriendBox.innerHTML=`📞 Friend says: <b>${questions[current].correctAnswer}</b>`;
  };

  audienceBtn.onclick=()=>{
    if(audienceUsed||hardcoreMode) return; audienceUsed=true; audienceBtn.classList.add("used");
    playSound("audience"); audienceVote.innerHTML="";
    document.querySelectorAll(".option-btn").forEach(b=>{
      const percent=Math.floor(Math.random()*50)+25; audienceVote.innerHTML+=`<div>${b.textContent}: ${percent}%</div>`;
    });
  };

  /***** SHOP *****/
  buyBtns.forEach(btn=>{
    btn.onclick=()=>{
      const item=btn.dataset.item;
      alert(`Bought ${item} (shop logic placeholder)`); btn.classList.add("used");
    };
  });
  closeShopBtn.onclick=()=>shopDiv.style.display="none";

  /***** LEADERBOARD *****/
  async function saveScore(score){
    const user=auth.currentUser; if(!user) return;
    const uid=user.uid;

    const doc=await db.collection("players").doc(uid).get();
    let totalScore=score;
    let gamesPlayed=1;
    if(doc.exists){ const data=doc.data(); totalScore+=data.totalScore; gamesPlayed+=data.gamesPlayed; }
    await db.collection("players").doc(uid).set({name:user.displayName||"Guest", photo:user.photoURL||"", totalScore, gamesPlayed});
    loadLeaderboard();
  }

  async function loadLeaderboard(){
    const snapshot=await db.collection("players").orderBy("totalScore","desc").limit(10).get();
    leaderboardList.innerHTML="";
    snapshot.forEach(doc=>{
      const data=doc.data();
      const li=document.createElement("li");
      li.innerHTML=`<img src="${data.photo||'https://i.imgur.com/6VBx3io.png'}"> ${data.name} - $${data.totalScore} (${data.gamesPlayed} games)`;
      leaderboardList.appendChild(li);
    });
  }

});
