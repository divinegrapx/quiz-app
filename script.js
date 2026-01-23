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
  const authDiv = document.getElementById("authDiv");
  const emailDiv = document.getElementById("emailDiv");
  const categoryDiv = document.getElementById("categoryDiv");
  const quizContainer = document.getElementById("quiz-container");
  const profileDiv = document.getElementById("profileDiv");
  const leaderboardList = document.getElementById("leaderboard-list");

  const googleBtn = document.getElementById("googleLoginBtn");
  const guestBtn = document.getElementById("guestLoginBtn");
  const emailBtn = document.getElementById("emailRegisterBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const emailRegisterSubmitBtn = document.getElementById("emailRegisterSubmitBtn");
  const emailCancelBtn = document.getElementById("emailCancelBtn");

  /* ================= SOUND ================= */
  const intro = document.getElementById("intro-sound");
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    intro.volume = 0.8;
    intro.play().then(() => {
      intro.pause();
      intro.currentTime = 0;
      audioUnlocked = true;
      playIntro();
    }).catch(() => {});
  }

  function playIntro() {
    if (!audioUnlocked) return;
    intro.currentTime = 0;
    intro.loop = true;
    intro.play().catch(() => {});
  }

  document.body.addEventListener("click", unlockAudio, { once: true });

  /* ================= BUTTONS ================= */
  googleBtn.onclick = () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(e => alert(e.message));
  };

  guestBtn.onclick = () => {
    auth.signInAnonymously()
      .catch(e => alert(e.message));
  };

  emailBtn.onclick = () => {
    authDiv.style.display = "none";
    emailDiv.style.display = "block";
  };

  emailCancelBtn.onclick = () => {
    emailDiv.style.display = "none";
    authDiv.style.display = "block";
  };

  emailLoginBtn.onclick = () => {
    auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    ).catch(e => alert(e.message));
  };

  emailRegisterSubmitBtn.onclick = () => {
    auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    ).catch(e => alert(e.message));
  };

  /* ================= AUTH STATE ================= */
  auth.onAuthStateChanged(user => {

    if (!user) {
      profileDiv.innerHTML = "";
      authDiv.style.display = "block";
      emailDiv.style.display = "none";
      categoryDiv.style.display = "none";
      quizContainer.style.display = "none";
      loadLeaderboard();
      playIntro();
      return;
    }

    intro.pause();
    intro.currentTime = 0;

    profileDiv.innerHTML = `
      <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
      <b>${user.displayName || "Guest"}</b>
    `;

    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
    loadLeaderboard();
  });

  /* ================= LEADERBOARD ================= */
  function loadLeaderboard() {
    leaderboardList.innerHTML = "<h3>🏆 Top Players</h3>";

    db.collection("leaderboard")
      .orderBy("totalScore", "desc")
      .limit(10)
      .get()
      .then(snap => {
        snap.forEach(doc => {
          const d = doc.data();
          const li = document.createElement("li");
          li.innerHTML = `
            <img src="${d.photo || 'https://i.imgur.com/6VBx3io.png'}">
            <span>${d.name}</span>
            <b>$${(d.totalScore || 0).toLocaleString()}</b>
          `;
          leaderboardList.appendChild(li);
        });
      });
  };

});
