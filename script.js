document.addEventListener("DOMContentLoaded", () => {

  /* =================== FIREBASE CONFIG =================== */
  const firebaseConfig = {
    apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
    authDomain: "neon-quiz-app.firebaseapp.com",
    projectId: "neon-quiz-app",
    storageBucket: "neon-quiz-app.appspot.com",
    messagingSenderId: "891061147021",
    appId: "1:891061147021:web:7b3d80020f642da7b699c4"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* =================== ELEMENTS =================== */
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
  const callFriendBtn = document.getElementById("callFriendBtn");
  const audienceBtn = document.getElementById("audienceBtn");
  const safeMoneyBtn = document.getElementById("safeMoneyBtn");
  const callFriendBox = document.getElementById("callFriendBox");
  const audienceVote = document.getElementById("audienceVote");

  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const nightmareCheck = document.getElementById("nightmareModeCheck");
  const soundToggle = document.getElementById("soundToggle");

  const scoreRow = document.getElementById("scoreRow");
  const leaderboardList = document.getElementById("leaderboard-list");

  /* =================== SOUNDS =================== */
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
  let user = null;
  let questions = [];
  let current = 0;
  let timer;
  let ladderLevel = 0;
  let score = 0;
  let lifetime = 0;

  let stats = { categories: {}, difficulty: {} };
  let fiftyUsed = false, friendUsed = false, audienceUsed = false;

  function stopAllSounds() { Object.values(sounds).forEach(s => { s.pause(); s.currentTime = 0; }); }
  function playSound(name) { if (!soundEnabled || !sounds[name]) return; stopAllSounds(); sounds[name].play(); }

  /* =================== AUTH =================== */
  console.log("Initializing login buttons...");

  // Google Login
  googleLoginBtn.addEventListener("click", async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      user = result.user;
      showSettings();
    } catch (err) { alert("Google login failed: " + err.message); console.error(err); }
  });

  // Guest Login
  guestLoginBtn.addEventListener("click", async () => {
    try {
      const result = await auth.signInAnonymously();
      user = result.user;
      showSettings();
    } catch (err) { alert("Guest login failed: " + err.message); console.error(err); }
  });

  // Email Register/Login
  emailRegisterBtn.addEventListener("click", () => emailDiv.style.display = "block");
  emailCancelBtn.addEventListener("click", () => emailDiv.style.display = "none");

  emailLoginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return alert("Enter both email and password.");
    try { const result = await auth.signInWithEmailAndPassword(email, password); user = result.user; showSettings(); } 
    catch (err) { alert("Email login failed: " + err.message); console.error(err); }
  });

  emailRegisterSubmitBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return alert("Enter both email and password.");
    try { const result = await auth.createUserWithEmailAndPassword(email, password); user = result.user; showSettings(); } 
    catch (err) { alert("Email registration failed: " + err.message); console.error(err); }
  });

  auth.onAuthStateChanged(async u => {
    if (u) {
      user = u;
      const docRef = db.collection("users").doc(user.uid);
      const docSnap = await docRef.get();
      if (!docSnap.exists) await docRef.set({ lifetime: 0, name: user.displayName || "Guest", photo: user.photoURL || "" });
      lifetime = docSnap.exists ? docSnap.data().lifetime || 0 : 0;
      document.getElementById("profileDiv").innerHTML = `
        <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
        <h3>${user.displayName || "Guest"}</h3>
      `;
      loadLeaderboard();
    } else { document.getElementById("profileDiv").innerHTML = ""; }
  });

  function showSettings() {
    document.getElementById("authDiv").style.display = "none";
    document.getElementById("emailDiv").style.display = "none";
    document.getElementById("categoryDiv").style.display = "block";
    playSound("intro");
  }

  /* =================== START QUIZ =================== */
  startBtn.addEventListener("click", startQuiz);
  async function startQuiz() {
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;
    soundEnabled = soundToggle.value === "on";
    quizDiv.innerHTML = "<p>Loading questions...</p>";
    try {
      const res = await fetch(`https://the-trivia-api.com/api/questions?limit=20&categories=${category}&difficulty=${difficulty}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      if (!data || data.length === 0) throw new Error("No questions returned");
      questions = data;
    } catch (err) { quizDiv.innerHTML = "<p>Error loading questions.</p>"; console.error(err); return; }
    document.getElementById("categoryDiv").style.display = "none";
    document.getElementById("quiz-container").style.display = "block";
    buildMoneyLadder(20);
    current = ladderLevel = score = 0;
    fiftyUsed = friendUsed = audienceUsed = false;
    playSound("thinking");
    showQuestion();
    updateScoreRow();
    loadLeaderboard();
  }

  /* =================== QUESTIONS =================== */
  function showQuestion() {
    clearInterval(timer);
    callFriendBox.innerHTML = "";
    audienceVote.innerHTML = "";
    const q = questions[current];
    quizDiv.innerHTML = `<h2>Q${current + 1}: ${q.question}</h2>`;
    const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);
    answers.forEach(a => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = a;
      btn.addEventListener("click", () => checkAnswer(a));
      quizDiv.appendChild(btn);
    });
    let timeLeft = 30;
    updateTimer(timeLeft);
    timer = setInterval(() => { timeLeft--; updateTimer(timeLeft); if (timeLeft <= 5) playSound("tick"); if (timeLeft <= 0) nextQuestion(); }, 1000);
  }

  function updateTimer(t) { timerText.textContent = t + "s"; timerBar.style.width = (t / 30 * 100) + "%"; timerBar.style.background = t > 10 ? "#00ff00" : t > 5 ? "#ffcc00" : "#ff4d4d"; }

  function checkAnswer(ans) {
    clearInterval(timer); stopAllSounds();
    const correct = questions[current].correctAnswer;
    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === ans && ans !== correct) b.classList.add("wrong");
    });
    trackStats(ans);
    if (ans === correct) { ladderLevel++; score += 100; playSound("correct"); }
    else { playSound("wrong"); if (nightmareCheck.checked) { setTimeout(showFinalScreen, 1500); return; } }
    updateMoneyLadder();
    updateScoreRow();
    setTimeout(nextQuestion, 2000);
  }

  function nextQuestion() { current++; if (current >= questions.length) { showFinalScreen(); return; } playSound("thinking"); showQuestion(); }

  function trackStats(ans) {
    const q = questions[current];
    const correct = q.correctAnswer;
    if (!stats.categories[q.category]) stats.categories[q.category] = { correct: 0, total: 0 };
    if (!stats.difficulty[q.difficulty]) stats.difficulty[q.difficulty] = { correct: 0, total: 0 };
    stats.categories[q.category].total++; stats.difficulty[q.difficulty].total++;
    if (ans === correct) { stats.categories[q.category].correct++; stats.difficulty[q.difficulty].correct++; }
  }

  /* =================== MONEY LADDER =================== */
  function buildMoneyLadder(count) { moneyList.innerHTML = ""; for (let i = 0; i <= count; i++) { const li = document.createElement("li"); li.className = "ladder-btn"; li.textContent = "$" + (i * 100); moneyList.appendChild(li); } }
  function updateMoneyLadder(correctAnswerGiven = false) {
    [...moneyList.children].forEach(li => li.classList.remove("current", "highlight"));
    const idx = ladderLevel; 
    const currentEl = moneyList.children[idx];
    if (currentEl) { currentEl.classList.add("current"); if (correctAnswerGiven) currentEl.classList.add("highlight"); currentEl.scrollIntoView({behavior:"smooth", block:window.innerWidth<=768?"nearest":"center", inline:window.innerWidth<=768?"center":"nearest"}); }
  }

  /* =================== LIFELINES =================== */
  fiftyBtn.addEventListener("click", () => {
    if (fiftyUsed) return; fiftyUsed = true; fiftyBtn.classList.add("used");
    const correct = questions[current].correctAnswer; let removed=0;
    document.querySelectorAll(".option-btn").forEach(btn => {
      btn.style.transition="opacity 0.5s";
      if(btn.textContent!==correct && removed<2){ btn.style.opacity=0.3; btn.disabled=true; removed++; } 
      else if(btn.textContent===correct) btn.classList.add("highlight");
    });
    playSound("thinking");
  });

  callFriendBtn.addEventListener("click", () => {
    if(friendUsed) return; friendUsed = true; callFriendBtn.classList.add("used");
    const correct = questions[current].correctAnswer;
    const options = [...document.querySelectorAll(".option-btn")].map(b => b.textContent);
    const friendAnswer = Math.random()<0.85? correct : options.filter(o=>o!==correct)[Math.floor(Math.random()*(options.length-1))];
    playSound("call");
    callFriendBox.innerHTML = `📞 Friend says: <b>${friendAnswer}</b>`;
    setTimeout(()=>{callFriendBox.innerHTML=""; stopAllSounds();},5000);
  });

  audienceBtn.addEventListener("click", () => {
    if(audienceUsed) return; audienceUsed = true; audienceBtn.classList.add("used");
    const correct = questions[current].correctAnswer;
    const options = [...document.querySelectorAll(".option-btn")].map(b=>b.textContent);
    const votes={}; options.forEach(opt=>votes[opt]=opt===correct?Math.floor(Math.random()*50+50):Math.floor(Math.random()*50));
    audienceVote.innerHTML="";
    options.forEach(opt=>audienceVote.innerHTML+=`<div class="vote-row"><span>${opt}</span><div class="vote-bar" style="width:0%;"></div><span> ${votes[opt]}%</span></div>`);
    document.querySelectorAll(".vote-bar").forEach((bar,i)=>{bar.style.transition="width 1s"; bar.style.width=votes[options[i]]+"%";});
    playSound("audience");
    setTimeout(()=>{audienceVote.innerHTML=""; stopAllSounds();},5000);
  });

  safeMoneyBtn.addEventListener("click", () => { score = getLastMilestone(); updateScoreRow(); showFinalScreen(); });
  function getLastMilestone() { let amt=0; [...moneyList.children].forEach(li=>{ const val=parseInt(li.textContent.replace("$","")); if(score>=val) amt=val; }); return amt; }

  /* =================== SCORE & LEADERBOARD =================== */
  async function saveScore(currentScore) {
    if(!user) return;
    const userRef = db.collection("users").doc(user.uid);
    await db.runTransaction(async t => {
      const doc = await t.get(userRef);
      if(!doc.exists) t.set(userRef,{ lifetime: currentScore, name: user.displayName||"Guest", photo: user.photoURL||"" });
      else { const newLifetime=(doc.data().lifetime||0)+currentScore; t.update(userRef,{lifetime:newLifetime}); lifetime=newLifetime; }
    });
  }

  async function loadLeaderboard() {
    try {
      const snapshot = await db.collection("users").orderBy("lifetime","desc").limit(10).get();
      leaderboardList.innerHTML="";
      snapshot.forEach(doc => { const u=doc.data(); const li=document.createElement("li"); li.textContent=`${u.name||"Guest"} - $${u.lifetime||0}`; leaderboardList.appendChild(li); });
    } catch(err) { console.error(err); leaderboardList.innerHTML="<li>Unable to load leaderboard</li>"; }
  }

  function updateScoreRow() { scoreRow.textContent = `Score: $${score} | Total: $${lifetime}`; }

  /* =================== FINAL SCREEN & SHARE =================== */
  function showFinalScreen() {
    stopAllSounds(); playSound("win"); updateScoreRow(); saveScore(score);
    quizDiv.innerHTML = `
      <div class="final-screen">
        <h1>🎉 CONGRATULATIONS</h1>
        <h2>You Won $${score}</h2>
        <div id="statsDiv" class="stats-div"></div>
        <div id="shareDiv" class="share-div">
          <h3>Share Your Score!</h3>
          <button class="share-btn" id="shareFacebook"><img src="images/facebook.png" alt="Facebook" width="32"></button>
          <button class="share-btn" id="shareTwitter"><img src="images/X.png" alt="X (Twitter)" width="32"></button>
          <button class="share-btn" id="shareWhatsApp"><img src="images/whatsapp.png" alt="WhatsApp" width="32"></button>
          <button class="share-btn" id="shareCopy"><img src="images/copy.png" alt="Copy Link" width="32"></button>
        </div>
        <button onclick="location.reload()">Restart Quiz</button>
      </div>
    `;
    displayStats();

    const shareUrl = window.location.href;
    const shareText = `I just won $${score} in Neon Quiz! Can you beat me? 🎮💰`;

    document.getElementById("shareFacebook").addEventListener("click", () => {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(fbUrl, "_blank");
    });

    document.getElementById("shareTwitter").addEventListener("click", () => {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(twitterUrl, "_blank");
    });

    document.getElementById("shareWhatsApp").addEventListener("click", () => {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
      window.open(waUrl, "_blank");
    });

    document.getElementById("shareCopy").addEventListener("click", () => {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => alert("Link copied to clipboard!")).catch(err => console.error(err));
    });
  }

  function displayStats() {
    const statsDiv = document.getElementById("statsDiv");
    statsDiv.innerHTML = "<h4>Stats:</h4>";
    for (const cat in stats.categories) statsDiv.innerHTML += `<p>${cat}: ${stats.categories[cat].correct}/${stats.categories[cat].total}</p>`;
    for (const diff in stats.difficulty) statsDiv.innerHTML += `<p>${diff}: ${stats.difficulty[diff].correct}/${stats.difficulty[diff].total}</p>`;
  }

});
