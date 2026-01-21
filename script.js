firebase.initializeApp({
  apiKey: "AIzaSyBS-8TWRkUlpB36YTYpEMiW51WU6AGgtrY",
  authDomain: "neon-quiz-app.firebaseapp.com",
  projectId: "neon-quiz-app"
});

const auth = firebase.auth();

// ELEMENTS
const googleLoginBtn = document.getElementById("googleLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
const emailCancelBtn = document.getElementById("emailCancelBtn");
const guestBtn = document.getElementById("guestBtn");

const authDiv = document.getElementById("authDiv");
const emailDiv = document.getElementById("emailDiv");
const categoryDiv = document.getElementById("categoryDiv");
const profileDiv = document.getElementById("profileDiv");

// AUTH BUTTONS
googleLoginBtn.onclick = async () => {
  await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

emailRegisterBtn.onclick = () => {
  emailDiv.style.display = "block";
};

emailCancelBtn.onclick = () => {
  emailDiv.style.display = "none";
};

emailLoginBtn.onclick = async () => {
  await auth.signInWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  );
};

emailRegisterSubmitBtn.onclick = async () => {
  await auth.createUserWithEmailAndPassword(
    emailInput.value,
    passwordInput.value
  );
};

guestBtn.onclick = () => {
  authDiv.style.display = "none";
  categoryDiv.style.display = "block";
};

// AUTH STATE
auth.onAuthStateChanged(user => {
  if (user) {
    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";

    profileDiv.innerHTML = `
      <img src="${user.photoURL || 'avatar.png'}" width="60">
      <h3>${user.displayName || user.email}</h3>
    `;
  }
});
