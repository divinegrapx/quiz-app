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
  const q = questions[current];
  let html = `<h3>${q.question}</h3>`;

  q.options.forEach((opt, i) => {
    html += `
      <label>
        <input type="radio" name="option" value="${i}">
        ${opt}
      </label><br>
    `;
  });

  html += `<br><button onclick="nextQuestion()">Next</button>`;
  document.getElementById("quiz").innerHTML = html;
}

function nextQuestion() {
  const selected = document.querySelector('input[name="option"]:checked');
  if (!selected) return;

  if (parseInt(selected.value) === questions[current].answer) {
    score++;
  }

  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML =
      `<h2>Quiz Finished!</h2>
       <p>Score: ${score}/${questions.length}</p>`;
  }
}
