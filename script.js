// -------------------- Firebase Initialization --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

// -------------------- Your Firebase Config --------------------
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.appspot.com",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4",
  measurementId: "G-7LKHH1EHQW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// -------------------- DOM Elements --------------------
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutBtn = document.getElementById("logoutBtn");
const avatarInput = document.getElementById("avatarInput");
const leaderboardDiv = document.getElementById("leaderboard");
const quizContainer = document.getElementById("quizContainer");
const startQuizBtn = document.getElementById("startQuiz");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const hintBtn = document.getElementById("hintBtn");
const fiftyBtn = document.getElementById("fiftyBtn");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const questionCountSelect = document.getElementById("questionCount");
const avatarContainer = document.getElementById("avatarContainer");

// -------------------- Sounds --------------------
const correctSound = new Audio("correct.wav");
const wrongSound = new Audio("wrong.wav");

// -------------------- User State --------------------
let currentUser = null;
let userAvatarUrl = "";
let score = 0;
let questionIndex = 0;
let timer;
let timeLeft = 20;
let questions = [];
let usedHints = 0;
let usedFifty = false;

// -------------------- Authentication --------------------
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (err) { alert("Login Error: " + err.message); }
});

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = registerForm.email.value;
  const password = registerForm.password.value;
  const username = registerForm.username.value;
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCred.user.uid), { username, score: 0, avatar: "", history: [] });
    registerForm.reset();
  } catch (err) { alert("Register Error: " + err.message); }
});

logoutBtn?.addEventListener("click", async () => { await signOut(auth); });

// -------------------- Avatar Upload --------------------
avatarInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;
  const storageRef = ref(storage, `avatars/${currentUser.uid}_${file.name}`);
  await uploadBytes(storageRef, file);
  userAvatarUrl = await getDownloadURL(storageRef);
  await updateDoc(doc(db, "users", currentUser.uid), { avatar: userAvatarUrl });
  alert("Avatar uploaded!");
});

// -------------------- Auth State --------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    logoutBtn.style.display = "inline-block";
    avatarContainer.style.display = "block";
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) userAvatarUrl = docSnap.data().avatar || "";
    showLeaderboard();
  } else {
    currentUser = null;
    logoutBtn.style.display = "none";
    avatarContainer.style.display = "none";
    loginForm.style.display = "block";
    registerForm.style.display = "block";
    leaderboardDiv.innerHTML = "";
  }
});

// -------------------- Leaderboard --------------------
async function showLeaderboard() {
  const q = query(collection(db, "users"), orderBy("score", "desc"), limit(10));
  const querySnapshot = await getDocs(q);
  leaderboardDiv.innerHTML = "<h3>Leaderboard</h3>";
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    leaderboardDiv.innerHTML += `
      <div class="leaderboard-user">
        <img src="${data.avatar || 'default-avatar.png'}" class="avatar">
        <span>${data.username}</span> - <span>${data.score}</span>
      </div>
    `;
  });
}

// -------------------- Fetch Trivia Questions from Open Trivia DB --------------------
async function loadQuestions(amount = 20) {
  const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple`);
  const data = await response.json();
  return data.results.map(q => {
    const choices = shuffleArray([...q.incorrect_answers.map(decodeHTML), decodeHTML(q.correct_answer)]);
    return {
      question: decodeHTML(q.question),
      choices: choices,
      answer: choices.indexOf(decodeHTML(q.correct_answer)),
      hint: "Think carefully!"
    };
  });
}

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// -------------------- Quiz Functions --------------------
startQuizBtn?.addEventListener("click", async () => {
  score = 0;
  questionIndex = 0;
  usedHints = 0;
  usedFifty = false;
  const selectedCount = parseInt(questionCountSelect.value) || 20;
  questions = await loadQuestions(selectedCount);
  quizContainer.style.display = "block";
  showQuestion();
});

function showQuestion() {
  if (questionIndex >= questions.length) return endQuiz();
  const q = questions[questionIndex];
  questionEl.textContent = q.question;
  choicesEl.innerHTML = "";
  q.choices.forEach((choice,i)=> {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.className = "neon-btn";
    btn.addEventListener("click", ()=>checkAnswer(i));
    choicesEl.appendChild(btn);
  });
  timeLeft=20; timerEl.textContent=timeLeft;
  clearInterval(timer);
  timer=setInterval(()=>{
    timeLeft--; timerEl.textContent=timeLeft;
    if(timeLeft<=0){ clearInterval(timer); wrongSound.play(); questionIndex++; showQuestion();}
  },1000);
}

function checkAnswer(selected){
  const correctIndex=questions[questionIndex].answer;
  if(selected===correctIndex){ score++; correctSound.play(); } else { wrongSound.play(); }
  questionIndex++; showQuestion();
}

hintBtn?.addEventListener("click", ()=>{
  if(usedHints>=1) return alert("Hint already used!");
  alert("Hint: "+questions[questionIndex].hint);
  usedHints++;
});

fiftyBtn?.addEventListener("click", ()=>{
  if(usedFifty) return alert("50:50 already used!");
  const q=questions[questionIndex];
  let removed=0;
  choicesEl.querySelectorAll("button").forEach((btn,idx)=>{
    if(idx!==q.answer && removed<2){ btn.style.display="none"; removed++; }
  });
  usedFifty=true;
});

async function endQuiz(){
  clearInterval(timer);
  scoreEl.textContent=score;
  quizContainer.style.display="none";
  if(!currentUser) return;
  const userRef=doc(db,"users",currentUser.uid);
  const docSnap=await getDoc(userRef);
  const prevHistory=docSnap.data().history||[];
  prevHistory.push({date:new Date().toISOString(), score});
  const newScore=Math.max(docSnap.data().score||0,score);
  await updateDoc(userRef,{score:newScore, history:prevHistory});
  showLeaderboard();
}

// -------------------- Utility --------------------
function shuffleArray(arr){ return arr.sort(()=>Math.random()-0.5); }
