// -------------------- Firebase Initialization --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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

// -------------------- Quiz Functions --------------------
startQuizBtn?.addEventListener("click", () => {
  score = 0; questionIndex = 0; usedHints = 0; usedFifty = false;
  const selectedCount = parseInt(questionCountSelect.value) || 20;
  questions = shuffleArray([...allQuestions]).slice(0, selectedCount);
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

function shuffleArray(arr){ return arr.sort(()=>Math.random()-0.5); }

// -------------------- Trivia Questions --------------------
const allQuestions=[
  {question:"What is the capital of France?", choices:["Paris","Berlin","Rome","Madrid"], answer:0, hint:"It's known as the city of lights."},
  {question:"Which planet is known as the Red Planet?", choices:["Earth","Mars","Jupiter","Venus"], answer:1, hint:"It's the 4th planet from the Sun."},
  {question:"What is 5 + 7?", choices:["10","12","11","13"], answer:1, hint:"Think basic arithmetic."},
  {question:"Who wrote 'Romeo and Juliet'?", choices:["Shakespeare","Hemingway","Tolkien","Dickens"], answer:0, hint:"Famous English playwright."},
  {question:"Which element has the chemical symbol 'O'?", choices:["Gold","Oxygen","Iron","Silver"], answer:1, hint:"Essential for breathing."},
  {question:"How many continents are there on Earth?", choices:["5","6","7","8"], answer:2, hint:"Think about Asia, Africa, Europe…"},
  {question:"Which ocean is the largest?", choices:["Atlantic","Indian","Pacific","Arctic"], answer:2, hint:"It covers more than 30% of Earth's surface."},
  {question:"Who painted the Mona Lisa?", choices:["Van Gogh","Leonardo da Vinci","Picasso","Michelangelo"], answer:1, hint:"Renaissance artist."},
  {question:"What gas do plants absorb from the atmosphere?", choices:["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"], answer:2, hint:"Used in photosynthesis."},
  {question:"Which country hosted the 2016 Summer Olympics?", choices:["China","Brazil","UK","Russia"], answer:1, hint:"Think Rio de Janeiro."}
  // Add remaining questions up to 20–30 here
];
