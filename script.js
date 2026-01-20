// ================= FIREBASE =================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ================= DOM =================
const authDiv = document.getElementById("authDiv");
const categoryDiv = document.getElementById("categoryDiv");
const quizContainer = document.getElementById("quiz-container");
const quizDiv = document.getElementById("quiz");
const lifelines = document.getElementById("lifelines");
const moneyList = document.getElementById("money-list");
const timerBar = document.getElementById("timer-bar");
const timerText = document.getElementById("timer-text");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const tickSound = document.getElementById("tick-sound");

const fiftyBtn = document.getElementById("fiftyBtn");
const callBtn = document.getElementById("callBtn");
const audienceBtn = document.getElementById("audienceBtn");

const startBtn = document.getElementById("startBtn");
const questionCount = document.getElementById("questionCount");

// ================= STATE =================
let questions = [];
let current = 0;
let score = 0;
let timer;
let timeLeft = 20;

// ================= START QUIZ =================
startBtn.onclick = async () => {
  quizContainer.style.display = "block";
  quizContainer.style.pointerEvents = "auto";
  authDiv.style.display = "none";
  categoryDiv.style.display = "none";

  current = score = 0;
  buildMoneyLadder();

  const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}`);
  questions = await res.json();
  showQuestion();
};

// ================= SHOW QUESTION =================
function showQuestion() {
  clearInterval(timer);
  timeLeft = 20;
  updateTimer();

  const q = questions[current];
  quizDiv.innerHTML = `<h2>Question ${current+1}/${questions.length}: ${q.question}</h2>`;

  const answers = [...q.incorrectAnswers, q.correctAnswer].sort(()=>Math.random()-0.5);

  answers.forEach(a=>{
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = a;
    btn.onclick = ()=>checkAnswer(btn, a === q.correctAnswer);
    quizDiv.appendChild(btn);
  });

  timer = setInterval(()=>{
    timeLeft--;
    updateTimer();
    if(timeLeft <= 5) tickSound.play();
    if(timeLeft <= 0) nextQuestion();
  },1000);
}

// ================= TIMER =================
function updateTimer(){
  timerText.textContent = timeLeft+"s";
  timerBar.style.width = (timeLeft/20*100)+"%";
  timerBar.style.background = timeLeft>5 ? "#00ff00" : "#ff4d4d";
}

// ================= ANSWER =================
function checkAnswer(btn, correct){
  clearInterval(timer);
  document.querySelectorAll(".option-btn").forEach(b=>{
    b.disabled = true;
    if(b.textContent === questions[current].correctAnswer){
      b.classList.add("correct");
    }
  });

  if(!correct){
    btn.classList.add("wrong");
    wrongSound.play();
  } else {
    score++;
    correctSound.play();
  }

  setTimeout(nextQuestion,1500);
}

// ================= NEXT =================
function nextQuestion(){
  current++;
  if(current >= questions.length){
    quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
    return;
  }
  updateMoneyLadder();
  showQuestion();
}

// ================= MONEY LADDER =================
function buildMoneyLadder(){
  moneyList.innerHTML="";
  const total = parseInt(questionCount.value);
  for(let i=1;i<=total;i++){
    const li=document.createElement("li");
    li.textContent = `$${i*100}`;
    moneyList.appendChild(li);
  }
}

function updateMoneyLadder(){
  [...moneyList.children].forEach(li=>li.classList.remove("current"));
  const idx = current-1;
  if(moneyList.children[idx]) moneyList.children[idx].classList.add("current");
}
