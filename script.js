const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzG5usO5zvLsQ6njTvz-Zo4uJ4k7yNXlCJN-dClmkF8EiEC9EMpBtDUHT9QVDQ-XDzRuQ/exec";

let questions = [];
let current = 0;
let score = 0;

fetch(SHEET_API_URL)
  .then(res => res.json())
  .then(data => {
    questions = data;
    showQuestion();
  });

function showQuestion() {
  const q = questions[current];
  let html = `<h3>${q.question}</h3>`;
  q.options.forEach((opt, i) => {
    html += `<label><input type="radio" name="opt" value="${i}"> ${opt}</label><br>`;
  });
  document.getElementById("quiz").innerHTML = html;
}

function nextQuestion() {
  const selected = document.querySelector('input[name="opt"]:checked');
  if (!selected) return;

  if (parseInt(selected.value) === questions[current].answer) {
    score++;
  }
  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    document.getElementById("quiz").innerHTML = "<h2>Finished!</h2>";
    document.getElementById("score").innerText = "Score: " + score;
  }
}
