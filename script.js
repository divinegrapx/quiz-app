// ================= FIREBASE (MODULAR v10) =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app",
  storageBucket: "neon-quiz-app.firebasestorage.app",
  messagingSenderId: "891061147021",
  appId: "1:891061147021:web:7b3d80020f642da7b699c4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ================= PROVIDERS =================
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ================= DOM =================
const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const logoutDiv = document.getElementById("logoutDiv");
const quizContainer = document.getElementById("quiz-container");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const facebookLoginBtn = document.getElementById("facebookLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const logoutBtn = document.getElementById("logoutBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

// ================= GOOGLE LOGIN =================
googleLoginBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    alert(e.message);
  }
};

// ================= FACEBOOK LOGIN =================
facebookLoginBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, facebookProvider);
  } catch (e) {
    alert("Facebook login failed");
    console.error(e);
  }
};

// ================= EMAIL =================
emailRegisterBtn.onclick = () => {
  authDiv.style.display = "none";
  emailDiv.style.display = "block";
};

emailCancelBtn.onclick = () => {
  emailDiv.style.display = "none";
  authDiv.style.display = "block";
};

emailLoginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    alert(e.message);
  }
};

emailRegisterSubmitBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    alert(e.message);
  }
};

// ================= LOGOUT =================
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// ================= AUTH STATE =================
onAuthStateChanged(auth, user => {
  if (user) {
    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    logoutDiv.style.display = "block";
    quizContainer.style.display = "block";
  } else {
    authDiv.style.display = "block";
    emailDiv.style.display = "none";
    logoutDiv.style.display = "none";
    quizContainer.style.display = "none";
  }
});
