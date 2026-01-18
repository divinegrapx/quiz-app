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
    clickedButton.style.background = "linear-gradient(135deg, #00ff6a, #00f2fe)";
    clickedButton.style.color = "#000";
    clickedButton.style.boxShadow = "0 0 10px #00ff6a, 0 0 20px #00f2fe inset";
    result.textContent = "✅ Correct!";
    result.style.color = "#00ff6a";
    result.style.textShadow = "0 0 10px #00ff6a";
    score++;
    correctSound.play();
  } else {
    clickedButton.style.background = "linear-gradient(135deg, #ff416c, #ff4b2b)";
    clickedButton.style.color = "#fff";
    clickedButton.style.boxShadow = "0 0 10px #ff416c, 0 0 20px #ff4b2b inset";
    result.textContent = "❌ Wrong!";
    result.style.color = "#ff416c";
    result.style.textShadow = "0 0 10px #ff416c";

    // Highlight correct answer with green gradient
    buttons[correctIndex].style.background = "linear-gradient(135deg, #00ff6a, #00f2fe)";
    buttons[correctIndex].style.color = "#000";
    buttons[correctIndex].style.boxShadow = "0 0 10px #00ff6a, 0 0 20px #00f2fe inset";

    wrongSound.play();
  }
}
