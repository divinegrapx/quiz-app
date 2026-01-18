let questions = [];
let currentQuestion = 0;
let score = 0;

// Start quiz
function startQuiz() {
  const category = document.getElementById("categorySelect").value;
  const API_URL = `https://the-trivia-api.com/api/questions?categories=${category}&limit=10`;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      questions = data.map(q => {
        const options = [...q.incorrectAnswers, q.correctAnswer];
        const correctIndex = options.indexOf(q.correctAnswer);
        return {
          question: q.question,
          options: options,
          answer: correctIndex
        };
      });
      currentQuestion = 0;
      score = 0;
      document.getElementById("categoryDiv").style.display = "none";
      showQuestion();
      updateProgress();
    })
    .catch(err => {
      document.getElementById("quiz").innerHTML = "<p>Error loading quiz.</p>";
      console.error(err);
    });
}

// Show question
function showQuestion() {
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
}

// Check answer
function checkAnswer(selectedIndex, clickedButton) {
  const correctIndex = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");
  const result = document.getElementById("result");

  buttons.forEach(btn => btn.disabled = true);
  document.getElementById("nextBtn").disabled = false;

  if (selectedIndex === correctIndex) {
    clickedButton.style.backgroundColor = "green";
    result.textContent = "✅ Correct!";
    result.style.color = "green";
    score++;
  } else {
    clickedButton.style.backgroundColor = "red";
    result.textContent = "❌ Wrong!";
    result.style.color = "red";
    buttons[correctIndex].style.backgroundColor = "green";
  }
}

// Next question
function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML =
      `<h2>🎉 Quiz Finished!</h2>
       <p>Score: ${score}/${questions.length}</p>
       <button onclick="restartQuiz()">Restart Quiz</button>`;
    updateProgress(true);
  }
}

// Restart quiz
function restartQuiz() {
  document.getElementById("categoryDiv").style.display = "block";
  document.getElementById("quiz").innerHTML = "";
  currentQuestion = 0;
  score = 0;
  updateProgress(true);
}

// Update progress bar
function updateProgress(finish = false) {
  const progress = document.getElementById("progress-bar");
  if (finish) {
    progress.style.width = "100%";
  } else {
    const percent = ((currentQuestion) / questions.length) * 100;
    progress.style.width = percent + "%";
  }
}
