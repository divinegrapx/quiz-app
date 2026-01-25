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

const authBox = document.getElementById("auth");
const emailBox = document.getElementById("emailBox");
const settings = document.getElementById("settings");
const game = document.getElementById("game");
const profile = document.getElementById("profile");
const board = document.getElementById("board");

const googleBtn = document.getElementById("googleBtn");
const guestBtn = document.getElementById("guestBtn");
const emailBtn = document.getElementById("emailBtn");

const loginEmail = document.getElementById("loginEmail");
const regEmail = document.getElementById("regEmail");
const cancelEmail = document.getElementById("cancelEmail");

const email = document.getElementById("email");
const pass = document.getElementById("pass");

const start = document.getElementById("start");

const quiz = document.getElementById("quiz");
const ladder = document.getElementById("ladder");

const bar = document.getElementById("bar");
const timeTxt = document.getElementById("time");

const fifty = document.getElementById("fifty");
const second = document.getElementById("second");
const call = document.getElementById("call");
const audience = document.getElementById("audience");

const callBox = document.getElementById("callBox");
const voteBox = document.getElementById("voteBox");

const category = document.getElementById("category");
const difficulty = document.getElementById("difficulty");
const nightmare = document.getElementById("nightmare");
const sound = document.getElementById("sound");


/* ================= STATE ================= */

let user = null;

let questions = [];
let current = 0;
let score = 0;

let timer = null;
let timeLimit = 30;

let used50 = false;
let usedSecond = false;
let usedCall = false;
let usedAudience = false;


/* ================= AUTH ================= */

googleBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

guestBtn.onclick = async () => {
  await auth.signInAnonymously();
};

emailBtn.onclick = () => show(emailBox);

cancelEmail.onclick = () => hide(emailBox);

loginEmail.onclick = async () => {
  await auth.signInWithEmailAndPassword(email.value, pass.value);
};

regEmail.onclick = async () => {
  await auth.createUserWithEmailAndPassword(email.value, pass.value);
};

auth.onAuthStateChanged(u => {
  if (!u) return;

  user = u;

  showProfile();
  hide(authBox);
  hide(emailBox);
  show(settings);

  loadBoard();
});


/* ================= PROFILE ================= */

async function showProfile(){

  let name = "Guest";

  if(user.displayName) name = user.displayName;
  else if(user.email) name = user.email.split("@")[0];
  else name = "Guest" + user.uid.slice(0,4);

  const snap = await db.collection("users").doc(user.uid).get();

  let best = 0;
  let games = 0;

  if(snap.exists){
    best = snap.data().best || 0;
    games = snap.data().games || 0;
  }

  profile.innerHTML = `
    👤 <b>${name}</b><br>
    🏆 Best: $${best}<br>
    🎮 Games: ${games}
  `;
}


/* ================= START ================= */

start.onclick = async () => {

  timeLimit = nightmare.checked ? 20 : 30;

  resetLifelines();

  score = 0;
  current = 0;

  const url = `https://the-trivia-api.com/api/questions?limit=15&categories=${category.value}&difficulty=${difficulty.value}`;

  const res = await fetch(url);
  questions = await res.json();

  hide(settings);
  show(game);

  buildLadder();

  showQuestion();
};


/* ================= QUESTIONS ================= */

function showQuestion(){

  clearInterval(timer);

  quiz.innerHTML = "";
  callBox.innerHTML = "";
  voteBox.innerHTML = "";

  const q = questions[current];

  quiz.innerHTML = `<h2>Q${current+1}: ${q.question}</h2>`;

  let answers = [...q.incorrectAnswers, q.correctAnswer];
  answers.sort(()=>Math.random()-0.5);

  answers.forEach(a=>{

    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = a;

    b.onclick = ()=>checkAnswer(b,a);

    quiz.appendChild(b);

  });

  highlightLadder();

  startTimer();
}


/* ================= TIMER ================= */

function startTimer(){

  let t = timeLimit;

  updateTimer(t);

  timer = setInterval(()=>{

    t--;

    updateTimer(t);

    if(t<=0){
      clearInterval(timer);
      endGame();
    }

  },1000);
}

function updateTimer(t){

  timeTxt.textContent = t+"s";
  bar.style.width = (t/timeLimit*100)+"%";

  if(t<6) bar.style.background="red";
  else bar.style.background="#00ff00";
}


/* ================= ANSWER ================= */

function checkAnswer(btn,ans){

  clearInterval(timer);

  const correct = questions[current].correctAnswer;

  const all = document.querySelectorAll(".option-btn");

  all.forEach(b=>{
    b.disabled = true;
    if(b.textContent===correct) b.classList.add("correct");
  });

  if(ans===correct){

    btn.classList.add("correct");
    score += 100;

    setTimeout(next,1000);

  }else{

    btn.classList.add("wrong");

    if(!usedSecond){
      usedSecond = true;
      return;
    }

    endGame();
  }
}

function next(){

  current++;

  if(current>=questions.length){
    endGame();
  }else{
    showQuestion();
  }
}


/* ================= LIFELINES ================= */

fifty.onclick = ()=>{

  if(used50) return;

  used50 = true;
  fifty.classList.add("used");

  const correct = questions[current].correctAnswer;

  let removed = 0;

  document.querySelectorAll(".option-btn").forEach(b=>{

    if(b.textContent!==correct && removed<2){
      b.style.visibility="hidden";
      removed++;
    }

  });
};


second.onclick = ()=>{

  if(usedSecond) return;

  usedSecond = true;
  second.classList.add("used");

};


call.onclick = ()=>{

  if(usedCall) return;

  usedCall = true;
  call.classList.add("used");

  const correct = questions[current].correctAnswer;

  const chance = Math.random()<0.7 ? correct :
    questions[current].incorrectAnswers[Math.floor(Math.random()*3)];

  callBox.innerHTML = `📞 Friend says: <b>${chance}</b>`;
};


audience.onclick = ()=>{

  if(usedAudience) return;

  usedAudience = true;
  audience.classList.add("used");

  const correct = questions[current].correctAnswer;

  let votes = [];

  document.querySelectorAll(".option-btn").forEach(b=>{

    let p = b.textContent===correct ? 40+Math.random()*30 : Math.random()*30;

    votes.push({a:b.textContent,p:Math.floor(p)});

  });

  const sum = votes.reduce((s,v)=>s+v.p,0);

  voteBox.innerHTML = "";

  votes.forEach(v=>{

    const per = Math.floor(v.p/sum*100);

    const div = document.createElement("div");

    div.innerHTML = `${v.a} : ${per}%`;

    voteBox.appendChild(div);

  });
};


function resetLifelines(){

  used50 = usedSecond = usedCall = usedAudience = false;

  [fifty,second,call,audience].forEach(b=>{
    b.classList.remove("used");
  });
}


/* ================= LADDER ================= */

const prizes = [
  0,100,200,300,500,1000,2000,4000,
  8000,16000,32000,64000,125000,
  250000,500000,1000000
];

function buildLadder(){

  ladder.innerHTML="";

  prizes.forEach((p,i)=>{

    const li = document.createElement("li");

    li.className="ladder-btn";
    li.textContent="$"+p;

    ladder.appendChild(li);

  });
}

function highlightLadder(){

  document.querySelectorAll(".ladder-btn").forEach((b,i)=>{

    b.classList.toggle("current",i===current+1);

  });
}


/* ================= END ================= */

async function endGame(){

  clearInterval(timer);

  await saveScore();

  quiz.innerHTML = `
    <div class="final-screen">
      <h1>Game Over</h1>
      <h2>You Won $${score}</h2>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;

  show(board);

  loadBoard();
}


/* ================= FIRESTORE ================= */

async function saveScore(){

  if(!user) return;

  const ref = db.collection("users").doc(user.uid);

  const snap = await ref.get();

  let best = 0;
  let games = 0;

  if(snap.exists){
    best = snap.data().best || 0;
    games = snap.data().games || 0;
  }

  await ref.set({
    name: user.displayName || user.email || "Guest",
    best: Math.max(best,score),
    games: games+1,
    updated: firebase.firestore.FieldValue.serverTimestamp()
  });

  await db.collection("scores").add({
    uid: user.uid,
    name: user.displayName || user.email || "Guest",
    score: score,
    date: firebase.firestore.FieldValue.serverTimestamp()
  });
}


async function loadBoard(){

  const snap = await db.collection("scores")
    .orderBy("score","desc")
    .limit(10)
    .get();

  let html = "<h3>🏆 Top Players</h3><ol>";

  snap.forEach(d=>{
    html += `<li>${d.data().name} — $${d.data().score}</li>`;
  });

  html += "</ol>";

  board.innerHTML = html;
}


/* ================= UI ================= */

function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }

});
