document.addEventListener("DOMContentLoaded", () => {

const auth = firebase.auth();

const authSection = document.getElementById("auth-section");
const quizSection = document.getElementById("quiz-section");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const feedback = document.getElementById("feedback");

const soundCorrect = new Audio("sounds/correct.mp3");
const soundWrong = new Audio("sounds/wrong.mp3");
const soundTick = new Audio("sounds/tick.mp3");

let timer;
let timeLeft = 30;
let currentQuestion = 0;

const questions = [
  {
    q:"Which planet is known as the Red Planet?",
    options:["Earth","Mars","Jupiter","Venus"],
    correct:1
  }
];

function getHint(q){
  const ans = q.options[q.correct];
  return `Starts with "${ans[0]}" and has ${ans.length} letters`;
}

function startTimer(){
  timeLeft = 30;
  timerBar.style.width = "100%";
  timerBar.style.background = "#00ffcc";
  timerText.textContent = timeLeft;

  clearInterval(timer);
  timer = setInterval(()=>{
    timeLeft--;
    timerText.textContent = timeLeft;
    timerBar.style.width = (timeLeft/30)*100 + "%";

    if(timeLeft <= 5){
      soundTick.play();
      timerBar.style.background = "#ff4d4d";
    }

    if(timeLeft <= 0){
      clearInterval(timer);
      revealCorrect();
    }
  },1000);
}

function showQuestion(){
  const q = questions[currentQuestion];
  questionEl.textContent = q.q;
  optionsEl.innerHTML = "";
  feedback.textContent = "";

  q.options.forEach((opt,i)=>{
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = ()=>selectAnswer(btn,i);
    optionsEl.appendChild(btn);
  });

  startTimer();
}

function selectAnswer(btn,index){
  clearInterval(timer);
  const q = questions[currentQuestion];
  document.querySelectorAll(".option-btn").forEach(b=>b.disabled=true);

  if(index === q.correct){
    btn.classList.add("correct");
    soundCorrect.play();
  } else {
    btn.classList.add("wrong");
    soundWrong.play();
    revealCorrect();
  }
}

function revealCorrect(){
  const q = questions[currentQuestion];
  document.querySelectorAll(".option-btn")[q.correct].classList.add("correct");
}

document.getElementById("hintBtn").onclick = ()=>{
  feedback.textContent = "💡 " + getHint(questions[currentQuestion]);
  document.getElementById("hintBtn").disabled = true;
};

document.getElementById("fiftyBtn").onclick = ()=>{
  const q = questions[currentQuestion];
  let removed = 0;
  document.querySelectorAll(".option-btn").forEach((b,i)=>{
    if(i !== q.correct && removed < 2){
      b.disabled = true;
      b.style.opacity = "0.3";
      removed++;
    }
  });
  document.getElementById("fiftyBtn").disabled = true;
};

document.getElementById("logoutBtn").onclick = ()=>auth.signOut();

document.getElementById("loginGoogle").onclick = ()=>{
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

document.getElementById("loginEmail").onclick = ()=>{
  const email = prompt("Email:");
  const pass = prompt("Password:");
  auth.signInWithEmailAndPassword(email,pass)
    .catch(()=>auth.createUserWithEmailAndPassword(email,pass));
};

auth.onAuthStateChanged(user=>{
  if(user){
    authSection.style.display="none";
    quizSection.style.display="block";
    showQuestion();
  } else {
    quizSection.style.display="none";
    authSection.style.display="block";
  }
});

});
