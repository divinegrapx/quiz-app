document.addEventListener("DOMContentLoaded", () => {

firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
});

const auth = firebase.auth();
const db = firebase.firestore();

const quiz = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

let questions = [];
let current = 0;
let level = 0;
let timer;
let timePerQ = 30;
let secondChance = true;
let used = {fifty:false, call:false, audience:false};

const checkpoints = [5,10,15,20];

document.getElementById("googleLoginBtn").onclick = () =>
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(showSettings);

document.getElementById("guestLoginBtn").onclick = showSettings;

function showSettings() {
  auth.onAuthStateChanged(user=>{
    document.getElementById("profileDiv").innerHTML =
      `<h3>${user?.displayName || "Guest"}</h3>`;
  });
  authDiv.style.display="none";
  categoryDiv.style.display="block";
  loadLeaderboard();
}

startBtn.onclick = startGame;

async function startGame(){
  quizContainer.style.display="block";
  categoryDiv.style.display="none";
  timePerQ = modeSelect.value==="hardcore"?20:30;

  const res = await fetch("https://the-trivia-api.com/api/questions?limit=20");
  questions = await res.json();

  buildLadder();
  showQuestion();
}

function showQuestion(){
  clearInterval(timer);
  const q = questions[current];
  quiz.innerHTML = `<h2>Q${current+1}: ${q.question}</h2>`;

  [...q.incorrectAnswers, q.correctAnswer]
    .sort(()=>Math.random()-0.5)
    .forEach(a=>{
      const b=document.createElement("button");
      b.className="option-btn";
      b.textContent=a;
      b.onclick=()=>answer(b,a);
      quiz.appendChild(b);
    });

  let t=timePerQ;
  timerBar.style.width="100%";
  timer=setInterval(()=>{
    t--;
    timerBar.style.width=(t/timePerQ*100)+"%";
    timerText.textContent=t+"s";
    if(t<=0) lose();
  },1000);
}

function answer(btn,ans){
  clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b=>b.classList.add("locked"));
  const correct=questions[current].correctAnswer;

  if(ans===correct){
    btn.classList.add("correct");
    level++;
    updateLadder();
    setTimeout(next,1200);
  } else {
    if(secondChance){
      secondChance=false;
      btn.classList.add("wrong");
      setTimeout(showQuestion,800);
    } else {
      btn.classList.add("wrong");
      lose();
    }
  }
}

function next(){
  current++;
  if(current>=20) win();
  else showQuestion();
}

function lose(){
  const safe = checkpoints.filter(c=>c<=level).pop()||0;
  endGame(safe*100);
}

function win(){
  endGame(level*100);
}

function endGame(amount){
  saveScore(amount);
  quiz.innerHTML=`
    <h1>🎉 GAME OVER</h1>
    <h2>You keep $${amount}</h2>
    <button onclick="location.reload()">Play Again</button>
  `;
}

function buildLadder(){
  moneyList.innerHTML="";
  for(let i=20;i>=1;i--){
    const li=document.createElement("li");
    li.className="ladder";
    if(checkpoints.includes(i)) li.classList.add("safe");
    li.textContent="$"+(i*100);
    moneyList.appendChild(li);
  }
}

function updateLadder(){
  [...moneyList.children].forEach(l=>l.classList.remove("current"));
  const idx=moneyList.children.length-level;
  moneyList.children[idx]?.classList.add("current");
}

function saveScore(score){
  const u=auth.currentUser;
  if(!u) return;
  const ref=db.collection("leaderboard").doc(u.uid);
  ref.get().then(d=>{
    const prev=d.exists?d.data():{total:0,games:0};
    ref.set({
      name:u.displayName||"Guest",
      total:prev.total+score,
      games:prev.games+1
    });
  });
}

function loadLeaderboard(){
  db.collection("leaderboard").orderBy("total","desc").limit(10)
    .onSnapshot(s=>{
      leaderboardList.innerHTML="";
      s.forEach(d=>{
        leaderboardList.innerHTML+=
          `<li>${d.data().name} — $${d.data().total}</li>`;
      });
    });
}

});
