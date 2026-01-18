let questions = [];
let current = 0;
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

        return {
          question: q.question,
          options: options,
          answer: correctIndex
        };
      });
      current = 0;
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

    btn.onclick = () => checkAnswer(index, btn);

    quizDiv.appendChild(btn);
  });

  const result = document.createElement("p");
  result.id = "result";
  quizDiv.appendChild(result);
}
