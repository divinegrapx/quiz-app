let questions = [];
let currentQuestion = 0;
let score = 0;
let fiftyUsed = false;
let hintUsed = false;
let timer;
let timeLeft = 25;

function startQuiz() {
  const category = document.getElementById("categorySelect").value;
  const API_URL = `https://the-trivia-api.com/api/questions?categories=${category}&limit=10`;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      questions = data.map(q=>{
        const options = [...q.incorrectAnswers, q.correctAnswer];
        const correctIndex = options.indexOf(q.correctAnswer);
        return {question:q.question, options, answer: correctIndex};
      });
      initializeQuiz();
    })
    .catch(err => {
      console.error("API failed, using fallback questions:", err);
      questions = [
        { question: "What is 2+2?", options: ["3","4","5","6"], answer: 1 },
        { question: "Capital of France?", options: ["Berlin","London","Paris","Rome"], answer: 2 },
        { question: "Which animal barks?", options: ["Cat","Dog","Cow","Horse"], answer: 1 }
      ];
      initializeQuiz();
    });
}

function initializeQuiz() {
  currentQuestion = 0;
  score = 0;
  fiftyUsed = false;
  hintUsed = false;

  document.getElementById("categoryDiv").style.display = "none";
  document.getElementById("fiftyBtn").disabled = false;
  document.getElementById("hintBtn").disabled = false;

  showQuestion();
  updateProgress();
}

function showQuestion() {
  clearInterval(timer);
  timeLeft = 25;

  // Disable lifelines if already used
  document.getElementById("fiftyBtn").disabled = fiftyUsed;
  document.getElementById("hintBtn").disabled = hintUsed;

  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";

  const q = questions[currentQuestion];

  const questionEl = document.createElement("h2");
  questionEl.innerHTML = q.question;
  quizDiv.appendChild(questionEl);

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(index, btn);
    quizDiv.appendChild(btn);
  });

  const result = document.createElement("p");
  result.id = "result";
  quizDiv.appendChild(result);

  const nextBtn = document.createElement("button");
  nextBtn.id = "nextBtn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = true;
  nextBtn.onclick = nextQuestion;
  quizDiv.appendChild(nextBtn);

  updateProgress();
  startTimer();
}

function checkAnswer(selectedIndex, clickedButton) {
  const correctIndex = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");
  const result = document.getElementById("result");
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");

  // Disable all answer buttons immediately
  buttons.forEach(btn => btn.disabled = true);

  // Disable lifelines after answering
  document.getElementById("fiftyBtn").disabled = true;
  document.getElementById("hintBtn").disabled = true;

  document.getElementById("nextBtn").disabled = false;
  clearInterval(timer);

  if (selectedIndex === correctIndex) {
    clickedButton.style.backgroundColor = "green";
    result.textContent = "✅ Correct!";
    result.style.color = "green";
    score++;
    correctSound.play();
  } else {
    clickedButton.style.backgroundColor = "red";
    result.textContent = "❌ Wrong!";
    result.style.color = "red";
    buttons[correctIndex].style.backgroundColor = "green";
    wrongSound.play();
  }
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML = `
      <h2>🎉 Quiz Finished!</h2>
      <p>Score: ${score}/${questions.length}</p>
      <button onclick="restartQuiz()">Restart Quiz</button>
    `;
    updateProgress(true);
  }
}

function restartQuiz() {
  document.getElementById("categoryDiv").style.display = "block";
  document.getElementById("quiz").innerHTML = "";
  currentQuestion = 0;
  score = 0;
  fiftyUsed = false;
  hintUsed = false;
  document.getElementById("fiftyBtn").disabled = false;
  document.getElementById("hintBtn").disabled = false;
  updateProgress(true);
}

function updateProgress(finish = false) {
  const progress = document.getElementById("progress-bar");
  if (!progress) return;
  let percent = finish ? 100 : (currentQuestion / questions.length) * 100;
  progress.style.width = percent + "%";

  let color = "#00c6ff";
  if (percent >= 75) color = "#ffd700";
  else if (percent >= 50) color = "#00ff00";
  else if (percent >= 25) color = "#ff8c00";

  progress.style.background = `linear-gradient(90deg,${color},#ffffff,${color})`;
}

function startTimer() {
  const timerBar = document.getElementById("timer-bar");
  const timerText = document.getElementById("timer-text");
  timerBar.style.width = "100%";
  timerText.textContent = timeLeft + "s";

  timer = setInterval(() => {
    timeLeft--;
    timerBar.style.width = (timeLeft / 25 * 100) + "%";
    timerText.textContent = timeLeft + "s";
    if (timeLeft <= 5) {
      timerBar.style.boxShadow = `0 0 20px #ff0${timeLeft},0 0 40px #ff0${timeLeft} inset`;
    }
    if (timeLeft <= 0) {
      clearInterval(timer);
      timerText.textContent = "0s";
      const buttons = document.querySelectorAll(".option-btn");
      const correctIndex = questions[currentQuestion].answer;
      buttons.forEach(btn => btn.disabled = true);
      buttons[correctIndex].style.backgroundColor = "green";
      document.getElementById("result").textContent = "⏰ Time's up!";
      document.getElementById("result").style.color = "#ff0";
      document.getElementById("nextBtn").disabled = false;
      document.getElementById("wrong-sound").play();
      // Disable lifelines after timeout
      document.getElementById("fiftyBtn").disabled = true;
      document.getElementById("hintBtn").disabled = true;
    }
  }, 1000);
}

function useFifty() {
  if (fiftyUsed) return;
  const correctIndex = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");
  let removed = 0;
  for (let i = 0; i < buttons.length; i++) {
    if (i !== correctIndex && removed < 2) {
      buttons[i].style.display = "none";
      removed++;
    }
  }
  fiftyUsed = true;
  document.getElementById("fiftyBtn").disabled = true;
}

function useHint() {
  if (hintUsed) return;
  const correctIndex = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");
  const hintText = "Hint: starts with '" + buttons[correctIndex].textContent[0] + "'";
  const result = document.getElementById("result");
  result.textContent = hintText;
  result.style.color = "#ffcc00";
  hintUsed = true;
  document.getElementById("hintBtn").disabled = true;
}
