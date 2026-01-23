document.addEventListener("DOMContentLoaded", () => {

  /* ================= FIREBASE ================= */
  if (!window.firebaseConfig) {
    console.error("Firebase config missing");
    return;
  }

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

  /* ================= SOUNDS ================= */
  const introSound = document.getElementById("intro-sound");

  let audioUnlocked = false;

  function unlockAudioOnce() {
    if (audioUnlocked) return;
    introSound.volume = 0.8;
    introSound.play().then(() => {
      audioUnlocked = true;
    }).catch(() => {});
  }

  document.body.addEventListener("click", unlockAudioOnce, { once: true });

  function playIntro() {
    if (!audioUnlocked) return;
    introSound.currentTime = 0;
    introSound.play().catch(() => {});
  }

  /* ================= AUTH BUTTONS ================= */
  document.getElementById("googleLoginBtn").addEventListener("click", () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(err => alert(err.message));
  });

  document.getElementById("guestLoginBtn").addEventListener("click", () => {
    auth.signInAnonymously()
      .catch(err => alert(err.message));
  });

  document.getElementById("emailRegisterBtn").addEventListener("click", () => {
    authDiv.style.display = "none";
    emailDiv.style.display = "block";
  });

  document.getElementById("emailCancelBtn").addEventListener("click", () => {
    emailDiv.style.display = "none";
    authDiv.style.display = "block";
  });

  document.getElementById("emailLoginBtn").addEventListener("click", () => {
    auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    ).catch(err => alert(err.message));
  });

  document.getElementById("emailRegisterSubmitBtn").addEventListener("click", () => {
    auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    ).catch(err => alert(err.message));
  });

  /* ================= AUTH STATE ================= */
  auth.onAuthStateChanged(user => {

    if (!user) {
      authDiv.style.display = "block";
      emailDiv.style.display = "none";
      categoryDiv.style.display = "none";
      quizContainer.style.display = "none";
      profileDiv.innerHTML = "";
      playIntro();
      loadLeaderboard();
      return;
    }

    introSound.pause();
    introSound.currentTime = 0;

    profileDiv.innerHTML = `
      <img src="${user.photoURL || 'https://i.imgur.com/6VBx3io.png'}">
      <span>${user.displayName || "Guest"}</span>
    `;

    authDiv.style.display = "none";
    emailDiv.style.display = "none";
    categoryDiv.style.display = "block";
    loadLeaderboard();
  });

  /* ================= LEADERBOARD ================= */
  function saveScore(score) {
    const user = auth.currentUser;
    const uid = user.uid;

    const ref = db.collection("leaderboard").doc(uid);

    ref.get().then(doc => {
      if (!doc.exists) {
        ref.set({
          name: user.displayName || "Guest",
          photo: user.photoURL || "",
          totalScore: score,
          gamesPlayed: 1,
          updated: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        ref.update({
          totalScore: firebase.firestore.FieldValue.increment(score),
          gamesPlayed: firebase.firestore.FieldValue.increment(1),
          updated: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }).then(loadLeaderboard);
  }

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
            <b>$${d.totalScore.toLocaleString()}</b>
          `;
          leaderboardList.appendChild(li);
        });
      });
  }

});
