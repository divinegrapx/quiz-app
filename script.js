let questions = [];
let currentQuestion = 0;
let score = 0;

// Start quiz when user selects category and clicks Start
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
      showQuestion();
    })
    .catch(err => {
      document.getElementById("quiz").innerHTML = "<p>Error loading quiz.</p>";
      console.error(err);
    });
}

// Display the current question and options
function showQuestion() {
  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";

  const q = questions[currentQuestion];

  // Question text
  const questionEl = document.createElement("h2");
  questionEl.innerHTML = q.question;
  quizDiv.appendChild(questionEl);

  // Options as buttons
  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "option-btn";

    // Call checkAnswer when clicked
    btn.onclick = () => checkAnswer(index, btn);

    quizDiv.appendChild(btn);
  });

  // Result text
  const result = document.createElement("p");
  result.id = "result";
  quizDiv.appendChild(result);

  // Show Next button (disabled initially)
  const nextBtn = document.createElement("button");
  nextBtn.id = "nextBtn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = true;
  nextBtn.onclick = nextQuestion;
  quizDiv.appendChild(nextBtn);
}

// Check if selected answer is correct
function checkAnswer(selectedIndex, clickedButton) {
  const correctIndex = questions[currentQuestion].answer;
  const buttons = document.querySelectorAll(".option-btn");
  const result = document.getElementById("result");

  // Disable all option buttons
  buttons.forEach(btn => btn.disabled = true);

  // Enable Next button
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

    // Highlight the correct answer
    buttons[correctIndex].style.backgroundColor = "green";
  }
}

// Go to next question
function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML =
      `<h2>🎉 Quiz Finished!</h2>
       <p>Score: ${score}/${questions.length}</p>
       <button onclick="startQuiz()">Restart Quiz</button>`;
  }
}
