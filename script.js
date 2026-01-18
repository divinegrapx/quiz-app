document.addEventListener("DOMContentLoaded", () => {
  const quizDiv = document.getElementById("quiz");
  const startBtn = document.getElementById("startBtn");
  const lifelines = document.getElementById("lifelines");
  const progressBar = document.getElementById("progress-bar");
  const progressContainer = document.getElementById("progress-container");
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  const timerContainer = document.getElementById("timer-container");
  const categorySelect = document.getElementById("categorySelect");
  const questionCount = document.getElementById("questionCount");
  const fiftyBtn = document.getElementById("fiftyBtn");
  const hintBtn = document.getElementById("hintBtn");
  const hintBox = document.getElementById("hint-box");
  const moneyList = document.getElementById("money-list");
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");

  // HIDE quiz, lifelines, progress, timer, money ladder at start
  quizDiv.style.display = "none";
  lifelines.style.display = "none";
  progressContainer.style.display = "none";
  timerContainer.style.display = "none";
  moneyList.style.display = "none";

  let questions = [], current = 0, score = 0, timer, timeLeft = 20;
  let fiftyUsed = false, hintUsed = false, ladderLevel = 0;

  const fallbackQuestions = [
    { question: "What color is the sky?", correctAnswer: "Blue", incorrectAnswers: ["Red","Green","Yellow"], hint: "It's the same color as the ocean." },
    { question: "How many days are in a week?", correctAnswer: "7", incorrectAnswers: ["5","6","8"], hint: "Think Monday to Sunday." },
    { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", incorrectAnswers: ["Venus","Jupiter","Saturn"], hint: "Named after Roman god of war." }
  ];

  const moneyLevels = ["$100","$200","$300","$500","$1,000","$2,000","$4,000","$8,000","$16,000","$32,000"];

  function buildMoneyLadder() {
    moneyList.innerHTML = "";
    const levelsToUse = moneyLevels.slice(0, questionCount.value);
    levelsToUse.reverse().forEach((amount) => {
      const li = document.createElement("li");
      li.textContent = amount;
      moneyList.appendChild(li);
    });
  }

  startBtn.addEventListener("click", startQuiz);
  fiftyBtn.addEventListener("click", useFifty);
  hintBtn.addEventListener("click", useHint);

  async function startQuiz() {
    // SHOW all necessary elements
    startBtn.disabled = true;
    quizDiv.style.display = "flex";
    lifelines.style.display = "flex";
    progressContainer.style.display = "block";
    timerContainer.style.display = "block";
    moneyList.style.display = "block";
    hintBox.style.display = "none";
    quizDiv.innerHTML = "Loading...";

    current = 0; score = 0; fiftyUsed = false; hintUsed = false; ladderLevel = 0;
    fiftyBtn.disabled = false; hintBtn.disabled = false;
    progressBar.style.width = "0%";

    buildMoneyLadder();

    try {
      const res = await fetch(`https://the-trivia-api.com/api/questions?limit=${questionCount.value}&categories=${categorySelect.value}`);
      if (!res.ok) throw "API error";
      let data = await res.json();
      if (!data.length) throw "Empty API";

      questions = data.map(q => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        incorrectAnswers: q.incorrectAnswers,
        hint: q.hint || "Think carefully."
      }));
    } catch {
      questions = fallbackQuestions;
    }

    showQuestion();
  }

  function showQuestion() {
    clearInterval(timer);
    timeLeft = 20;
    updateTimer();
    hintBox.style.display = "none";

    const q = questions[current];
    const answers = [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5);

    quizDiv.innerHTML = `<h2>${q.question}</h2><div id="feedback"></div>`;

    answers.forEach(a => {
      const btn = document.createElement("button");
      btn.textContent = a;
      btn.className = "option-btn"; // match your CSS
      btn.onclick = () => checkAnswer(a);
      quizDiv.appendChild(btn);
    });

    progressBar.style.width = `${(current / questions.length) * 100}%`;
    startTimer();
  }

  function startTimer() {
    timerText.style.display = "block";
    timer = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft <= 0) {
        clearInterval(timer);
        nextQuestion(false); // timed out
      }
    }, 1000);
  }

  function updateTimer() {
    timerText.textContent = `${timeLeft}s`;
    timerBar.style.width = `${(timeLeft / 20) * 100}%`;
  }

  function checkAnswer(answer) {
    clearInterval(timer);
    const correct = questions[current].correctAnswer;
    const feedbackDiv = document.getElementById("feedback");

    document.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("correct");
      if (b.textContent === answer && answer !== correct) b.classList.add("wrong");
    });

    if (answer === correct) {
      score++;
      ladderLevel++;
      updateMoneyLadder();
      feedbackDiv.textContent = "✅ Correct!";
      feedbackDiv.style.color = "lime";
      correctSound.play();
      setTimeout(() => nextQuestion(true), 1000);
    } else {
      feedbackDiv.textContent = "❌ Wrong!";
      feedbackDiv.style.color = "red";
      wrongSound.play();
      setTimeout(() => nextQuestion(false), 1000);
    }
  }

  function nextQuestion(correct) {
    current++;
    if (current >= questions.length) {
      quizDiv.innerHTML = `<h2>Finished!</h2><p>Score: ${score}/${questions.length}</p>
        <button onclick="location.reload()">Restart</button>`;
      startBtn.disabled = false;
      lifelines.style.display = "none";
      timerContainer.style.display = "none";
      progressContainer.style.display = "none";
      moneyList.style.display = "none";
      progressBar.style.width = "100%";
      hintBox.style.display = "none";
      return;
    }
    showQuestion();
  }

  function useFifty() {
    if (fiftyUsed) return;
    fiftyUsed = true;
    fiftyBtn.disabled = true;

    const correct = questions[current].correctAnswer;
    const btns = Array.from(document.querySelectorAll(".option-btn"));
    let removed = 0;
    btns.forEach(b => {
      if (b.textContent !== correct && removed < 2 && Math.random() > 0.3) {
        b.style.display = "none";
        removed++;
      }
    });
  }

  function useHint() {
    if (hintUsed) return;
    hintUsed = true;
    hintBtn.disabled = true;

    const q = questions[current];
    hintBox.textContent = "💡 Hint: " + q.hint;
    hintBox.style.display = "block";
  }

  function updateMoneyLadder() {
    const lis = moneyList.querySelectorAll("li");
    lis.forEach(li => li.classList.remove("current"));
    const idx = moneyList.children.length - ladderLevel - 1;
    if (lis[idx]) lis[idx].classList.add("current");
  }

  buildMoneyLadder();
});
