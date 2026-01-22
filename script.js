document.addEventListener("DOMContentLoaded", () => {

firebase.initializeApp({
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT"
});

const auth = firebase.auth();
const db = firebase.firestore();

/* ELEMENTS */
const quizDiv = document.getElementById("quiz");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");

/* SOUND */
const sounds = {
  thinking: document.getElementById("thinking-sound"),
  correct: document.getElementById("correct-sound"),
  wrong: document.getElementById("wrong-sound"),
  win: document.getElementById("win-sound"),
  tick: document.getElementById("tick-sound"),
  call: document.getElementById("call-sound"),
  audience: document.getElementById("audience-sound")
};

function stopSounds(){
  Object.values(sounds).forEach(s=>{s.pause();s.currentTime=0;});
}

let questions=[],current=0,ladder=0,timer;
const timePerQuestion=30;

/* START */
startBtn.onclick = async () => {
  document.getElementById("categoryDiv").style.display="none";
  document.getElementById("quiz-container").style.display="block";

  const res = await fetch("https://the-trivia-api.com/api/questions?limit=20");
  questions = await res.json();

  buildLadder();
  showQuestion();
};

function buildLadder(){
  moneyList.innerHTML="";
  for(let i=20;i>=1;i--){
    const li=document.createElement("li");
    li.className="ladder-btn";
    li.textContent="$"+i*100;
    moneyList.appendChild(li);
  }
}

function showQuestion(){
  clearInterval(timer);
  const q=questions[current];
  quizDiv.innerHTML=`<h2>Q${current+1}. ${q.question}</h2>`;
  [...q.incorrectAnswers,q.correctAnswer].sort(()=>Math.random()-0.5)
    .forEach(a=>{
      const b=document.createElement("button");
      b.className="option-btn";
      b.textContent=a;
      b.onclick=()=>check(a);
      quizDiv.appendChild(b);
    });

  let t=timePerQuestion;
  timer=setInterval(()=>{
    t--;
    timerText.textContent=t+"s";
    timerBar.style.width=(t/timePerQuestion*100)+"%";
    if(t<=0) next();
  },1000);
}

function check(ans){
  clearInterval(timer);
  stopSounds();
  const correct=questions[current].correctAnswer;
  document.querySelectorAll(".option-btn").forEach(b=>{
    b.disabled=true;
    if(b.textContent===correct)b.classList.add("correct");
    if(b.textContent===ans&&ans!==correct)b.classList.add("wrong");
  });
  if(ans===correct){ladder++;sounds.correct.play();}
  else sounds.wrong.play();
  updateLadder();
  setTimeout(next,1500);
}

function updateLadder(){
  [...moneyList.children].forEach(li=>li.classList.remove("current"));
  moneyList.children[moneyList.children.length-ladder]?.classList.add("current");
}

function next(){
  current++;
  if(current>=questions.length){
    quizDiv.innerHTML=`
      <div class="final-screen">
        <h1>🎉 CONGRATULATIONS</h1>
        <h2>You won $${ladder*100}</h2>
        <button onclick="location.reload()">Restart</button>
        <button onclick="auth.signOut().then(()=>location.reload())">Logout</button>
      </div>`;
    sounds.win.play();
    return;
  }
  showQuestion();
}

});
