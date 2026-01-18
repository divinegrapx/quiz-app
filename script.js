let questions = [];
let currentQuestion = 0;
let score = 0;

function startQuiz() {
  const category = document.getElementById("categorySelect").value;
  const API_URL =
    `https://the-trivia-api.com/api/questions?categories=${category}&limit=10`;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      questions = data.map(q => {
        const options = [...q.incorrectAnswers, q.correctAnswer];
        const correctIndex = options.indexOf(q.correctAnswer);
        return { question: q.question, options: options, answer: correctIndex };
      });
      currentQuestion = 0;
      score = 0;
      showQuestion();
    });
}

function showQuestion() {
  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";

  const q = questions[currentQuestion];

  const questionEl = document.createElement("h2");
  questionEl.textContent = q.question;
  quizDiv.appendChild(questionEl);

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "option-btn";

    // ✅ THIS LINE CALLS checkAnswer
    btn.onclick = () => checkAnswer(index, btn);

    quizDiv.appendChild(btn);
  });

  const result = document.createElement("p");
  result.id = "result";
  quizDiv.appendChild(result);
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML =
      `<h2>🎉 Quiz Finished!</h2><p>Score: ${score}/${questions.length}</p>`;
}
}

// 🔹 STEP 3: ADD checkAnswer() HERE
function checkAnswer(selectedIndex, clickedButton) {
  const correctIndex = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");
  const result = document.getElementById("result");

  buttons.forEach(btn => btn.disabled = true);

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
