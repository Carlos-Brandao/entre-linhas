const transformations = {
  reflectDiagonal: { matrix: [[0, 1], [1, 0]], description: "Reflexão na reta y = x." },
  rotate90: { matrix: [[0, -1], [1, 0]], rotation: Math.PI / 2, description: "Rotação de 90° anti-horária." },
  rotate180: { matrix: [[-1, 0], [0, -1]], rotation: Math.PI, description: "Rotação de 180°." },
  reflectX: { matrix: [[1, 0], [0, -1]], description: "Reflexão no eixo x." },
};

const questions = [
  {
    id: "interview-application", type: "self-report",
    prompt: "Em uma entrevista de emprego na área de Computação, como você explicaria uma aplicação da Álgebra Linear?",
    options: [
      "Ainda não saberia apresentar um exemplo.",
      "Citaria uma área, como inteligência artificial ou jogos, mas teria dificuldade para explicar o uso.",
      "Apresentaria uma aplicação e sua finalidade, mas teria dificuldade para relacioná-la aos cálculos.",
      "Explicaria a aplicação e como os conceitos matemáticos são utilizados nela.",
    ],
  },
  {
    id: "rotation-90", type: "motion", correctIndex: 1,
    prompt: "Em um jogo 2D, como girar um objeto 90° no sentido anti-horário em torno da origem, mantendo seu tamanho e sua forma?",
    hint: "Considere x para a direita e y para cima. Escolha a transformação de cada ponto.",
    options: ["(x, y) → (y, x)", "(x, y) → (−y, x)", "(x, y) → (−x, −y)", "(x, y) → (x, −y)", "Não sei dizer."],
    visuals: [transformations.reflectDiagonal, transformations.rotate90, transformations.rotate180, transformations.reflectX],
    extent: 4,
    explanation: "A transformação (−y, x) gira cada ponto 90° no sentido anti-horário, sem mudar o tamanho nem a forma.",
  },
  {
    id: "use-recency", type: "self-report",
    prompt: "Quando foi a última vez que você utilizou Álgebra Linear fora das atividades da faculdade?",
    hint: "Por exemplo, em um projeto pessoal, estágio ou trabalho.",
    options: ["Nos últimos 30 dias.", "Há mais de um mês e até seis meses.", "Há mais de seis meses.", "Nunca utilizei fora das atividades da faculdade.", "Não sei identificar se já utilizei."],
  },
  {
    id: "application-autonomy", type: "self-report",
    prompt: "Qual frase descreve melhor sua experiência com Álgebra Linear fora dos exercícios da disciplina?",
    options: ["Ainda não tive oportunidade de utilizar.", "Já tive oportunidade, mas não soube como aplicar.", "Já apliquei seguindo um exemplo ou tutorial.", "Já adaptei um exemplo para resolver outro problema.", "Já desenvolvi uma aplicação com autonomia."],
  },
  {
    id: "practical-topics", type: "self-report",
    prompt: "Dos tópicos de Álgebra Linear que você já estudou, para quantos consegue identificar uma aplicação concreta em projetos de Computação ou situações profissionais?",
    options: ["Nenhum tópico.", "De 1 a 2 tópicos.", "De 3 a 4 tópicos.", "Mais de 4 tópicos."],
  },
  {
    id: "delivery-regression", type: "motion", correctIndex: 2,
    topic: "Regressão linear simples",
    prompt: "Um app de entregas quer estimar o tempo de viagem pela distância. Qual reta acompanha melhor os dados do gráfico?",
    hint: "Cada ponto representa uma viagem. Use x para a distância em km e T para o tempo em minutos.",
    options: ["T = x + 1", "T = −2x + 13", "T = 2x + 1", "T = 7", "Não sei dizer."],
    visuals: [
      { kind: "regression", slope: 1, intercept: 1, description: "Esta reta cresce pouco e fica abaixo dos dados." },
      { kind: "regression", slope: -2, intercept: 13, description: "Esta reta prevê menos tempo para distâncias maiores, contrariando os dados." },
      { kind: "regression", slope: 2, intercept: 1, description: "Esta reta acompanha de perto o aumento do tempo com a distância." },
      { kind: "regression", slope: 0, intercept: 7, description: "Esta reta prevê o mesmo tempo para qualquer distância." },
    ],
    preview: true,
    explanation: "Entre as opções, T = 2x + 1 passa mais perto dos pontos. A regressão linear usa os dados para estimar uma relação e fazer previsões.",
  },
  {
    id: "training-gradient", type: "motion", correctIndex: 2,
    topic: "Gradiente descendente",
    prompt: "Ao treinar um modelo, o parâmetro começa em w = 0. Qual ajuste dá um primeiro passo que reduz o erro mostrado na curva?",
    hint: "Observe o ponto inicial. O objetivo do gradiente descendente é atualizar o parâmetro para diminuir o erro.",
    options: ["Mudar para w = −1", "Manter w = 0", "Mudar para w = 1", "Mudar para w = 6", "Não sei dizer."],
    visuals: [
      { kind: "gradient", target: -1, description: "O erro sobe de 9 para 16: o passo segue a direção errada." },
      { kind: "gradient", target: 0, description: "O parâmetro não muda e o erro continua em 9." },
      { kind: "gradient", target: 1, description: "O erro cai de 9 para 4: o primeiro passo aproxima o modelo do mínimo." },
      { kind: "gradient", target: 6, description: "O passo ultrapassa o mínimo e termina com o mesmo erro inicial: 9." },
    ],
    preview: true,
    explanation: "Mudar de w = 0 para w = 1 reduz o erro de 9 para 4. O gradiente indica uma direção de atualização; o tamanho do passo também importa.",
  },
  {
    id: "network-adjacency", type: "motion", correctIndex: 3,
    topic: "Grafos e matrizes",
    prompt: "Um sistema representa esta rede por uma matriz de adjacência. Qual linha descreve as ligações diretas do nó A?",
    hint: "Leia as posições na ordem A, B, C, D. Use 1 quando há uma ligação direta e 0 quando não há.",
    options: ["[0, 1, 1, 0]", "[0, 0, 1, 1]", "[0, 1, 1, 1]", "[0, 1, 0, 1]", "Não sei dizer."],
    visuals: [
      { kind: "graph", row: [0, 1, 1, 0], description: "Inclui uma ligação A–C que não existe e deixa de fora A–D." },
      { kind: "graph", row: [0, 0, 1, 1], description: "Inclui uma ligação A–C que não existe e deixa de fora A–B." },
      { kind: "graph", row: [0, 1, 1, 1], description: "Inclui C, embora chegar a ele exija passar por outro nó." },
      { kind: "graph", row: [0, 1, 0, 1], description: "A se liga diretamente a B e D. Não há ligação A–A nem A–C." },
    ],
    preview: true,
    explanation: "A possui ligações diretas com B e D. Por isso, sua linha é [0, 1, 0, 1]. A matriz transforma as conexões do grafo em dados que um programa pode processar.",
  },
];

// Preserve previous instruments separately when the question content changes.
const STORAGE_KEY = "entreLinhasDiagnosticResponsesV4";
const $ = (selector) => document.querySelector(selector);
const screens = [$("#start-screen"), $("#quiz-screen"), $("#complete-screen")];
const quizForm = $("#quiz-form");
const fieldset = $("#question-fieldset");
const title = $("#question-title");
const optionsContainer = $("#options");
const hint = $("#question-hint");
const questionVisual = $("#question-visual");
const questionTopic = $("#question-topic");
const nextButton = $("#next-button");
const previousButton = $("#previous-button");
const validation = $("#validation-message");
const followup = $("#topics-followup");
const topicsDetail = $("#topics-detail");
const feedback = $("#answer-feedback");
const comparison = $("#feedback-comparison");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let current = 0;
let answers = questions.map(() => null);
let startedAt;
let confirmedMotions = {};
let showingFeedback = false;
let finished = false;
let players = [];
let animationLoopTimer = null;
let animationGeneration = 0;

function stopAnimationLoop() {
  if (animationLoopTimer !== null) window.clearTimeout(animationLoopTimer);
  animationLoopTimer = null;
}
function scheduleAnimationLoop() {
  if (!showingFeedback || finished || document.hidden || motionPreference.matches
    || animationLoopTimer !== null || !players.length || players.some((player) => player.progress < 1)) return;
  const activePlayers = players;
  const generation = animationGeneration;
  animationLoopTimer = window.setTimeout(() => {
    animationLoopTimer = null;
    if (generation !== animationGeneration || activePlayers !== players || !showingFeedback
      || finished || document.hidden || motionPreference.matches) return;
    activePlayers.forEach((player) => player.restart());
  }, 900);
}

function showScreen(screen) {
  screens.forEach((item) => { item.hidden = item !== screen; });
}
function disposePlayers() {
  stopAnimationLoop();
  animationGeneration += 1;
  players.forEach((player) => player.destroy());
  players = [];
  comparison.replaceChildren();
  questionVisual.replaceChildren();
  questionVisual.hidden = true;
}
function focusQuestion(element) {
  element.focus({ preventScroll: true });
  $("#quiz-screen").scrollIntoView({ block: "start", behavior: "instant" });
}
function updateFollowup() {
  followup.hidden = questions[current].id !== "practical-topics" || answers[current] === null || answers[current] === 0;
}
function renderQuestion() {
  disposePlayers();
  showingFeedback = false;
  feedback.hidden = true;
  fieldset.hidden = false;
  const question = questions[current];
  title.textContent = question.prompt;
  hint.textContent = question.hint || "Escolha a alternativa que mais se aproxima da sua experiência.";
  questionTopic.textContent = question.topic || "";
  questionTopic.hidden = !question.topic;
  $("#question-number").textContent = `Questão ${current + 1} de ${questions.length}`;
  const percent = Math.round((current / questions.length) * 100);
  $("#progress-value").textContent = `${current} de ${questions.length} etapas`;
  $("#progress-bar").style.width = `${percent}%`;
  $(".progress-track").setAttribute("aria-valuenow", percent);
  optionsContainer.replaceChildren();
  question.options.forEach((text, index) => {
    const label = document.createElement("label");
    label.className = "option";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `question-${current}`;
    radio.value = index;
    radio.checked = answers[current] === index;
    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = String.fromCharCode(65 + index);
    const wording = document.createElement("span");
    wording.className = `option-text${question.type === "motion" && index < 4 ? " formula" : ""}`;
    wording.textContent = text;
    label.append(radio, letter, wording);
    optionsContainer.append(label);
  });
  validation.textContent = "";
  previousButton.disabled = current === 0;
  nextButton.textContent = question.type === "motion" ? "Confirmar resposta" : current === questions.length - 1 ? "Finalizar diagnóstico" : "Continuar";
  updateFollowup();
  if (question.type === "motion" && confirmedMotions[question.id] !== undefined) renderFeedback();
  else {
    if (question.preview) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("motion-plot", "applied-plot");
      questionVisual.append(svg);
      questionVisual.hidden = false;
      players.push(window.EntreLinhasApplied.create(svg, question.visuals[0], { preview: true }));
    }
    focusQuestion(title);
  }
}
function createMotionCard(index, caption, isCorrect) {
  const question = questions[current];
  const card = document.createElement("article");
  card.className = `motion-card ${isCorrect ? "motion-card--correct" : "motion-card--chosen"}`;
  const heading = document.createElement("h3");
  heading.textContent = caption;
  const formula = document.createElement("p");
  formula.className = "motion-formula";
  formula.textContent = `${String.fromCharCode(65 + index)} · ${question.options[index]}`;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("motion-plot");
  const description = document.createElement("p");
  description.className = "motion-caption";
  const visual = question.visuals[index];
  description.textContent = visual.description;
  if (visual.kind) svg.classList.add("applied-plot");
  card.append(heading, formula, svg, description);
  comparison.append(card);
  return visual.kind
    ? window.EntreLinhasApplied.create(svg, visual, { onComplete: scheduleAnimationLoop })
    : window.EntreLinhasMotion.create(svg, visual, { extent: question.extent, onComplete: scheduleAnimationLoop });
}
function renderFeedback() {
  showingFeedback = true;
  fieldset.hidden = true;
  followup.hidden = true;
  feedback.hidden = false;
  disposePlayers();
  const question = questions[current];
  const selected = confirmedMotions[question.id];
  const correct = selected === question.correctIndex;
  const unknown = selected === question.visuals.length;
  const correctLetter = String.fromCharCode(65 + question.correctIndex);
  feedback.dataset.outcome = correct ? "correct" : unknown ? "unknown" : "incorrect";
  $("#feedback-kicker").textContent = correct ? "✓ Resposta correta" : unknown ? "Vamos descobrir" : "Compare os resultados";
  $("#feedback-title").textContent = correct ? "Acertou! Veja na prática." : unknown ? "Vamos ver na prática?" : "Sua escolha e a resposta correta.";
  $("#feedback-description").textContent = correct
    ? question.explanation
    : unknown
      ? `Você marcou “Não sei dizer”. Veja a alternativa ${correctLetter}: ${question.explanation}`
      : `Compare sua escolha com a alternativa ${correctLetter}. ${question.explanation}`;
  comparison.classList.toggle("feedback-comparison--single", correct || unknown);
  if (!correct && !unknown) players.push(createMotionCard(selected, "Sua resposta", false));
  players.push(createMotionCard(question.correctIndex, correct ? "Sua resposta · correta" : "Resposta correta", true));
  nextButton.textContent = current === questions.length - 1 ? "Finalizar diagnóstico" : "Continuar";
  validation.textContent = "";
  focusQuestion($("#feedback-title"));
  // Keep comparison cards synchronized and ignore frames from a previous question.
  const activePlayers = players;
  const generation = animationGeneration;
  requestAnimationFrame(() => {
    if (showingFeedback && generation === animationGeneration && activePlayers === players) {
      activePlayers.forEach((player) => player.restart());
    }
  });
}
function persistResponse() {
  const identifier = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);
  const code = `EL-${identifier.toUpperCase()}`;
  const response = {
    version: 4, code, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(),
    answers: questions.map((question, index) => ({
      questionId: question.id,
      type: question.type,
      selectedIndex: question.type === "motion" ? confirmedMotions[question.id] : answers[index],
      selectedOption: question.options[question.type === "motion" ? confirmedMotions[question.id] : answers[index]],
      ...(question.type === "motion" ? { correct: confirmedMotions[question.id] === question.correctIndex, feedbackShown: confirmedMotions[question.id] !== undefined } : {}),
      ...(question.id === "practical-topics" ? { detail: answers[index] > 0 ? topicsDetail.value.trim() : "" } : {}),
    })),
    score: questions.filter((question) => question.type === "motion" && confirmedMotions[question.id] === question.correctIndex).length,
    scoredQuestions: questions.filter((question) => question.type === "motion").length,
    totalQuestions: questions.length,
  };
  try {
    const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(previous)) throw new Error("Formato do armazenamento inválido.");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...previous, response]));
    $("#save-status").textContent = "Nesta versão de teste, as respostas ficam salvas somente neste navegador.";
    $("#completion-description").textContent = "Respostas registradas. Agora, acompanhe a apresentação do projeto Entre Linhas.";
    $("#response-code").textContent = code;
    $(".response-code").hidden = false;
  } catch {
    $("#completion-description").textContent = "Você concluiu o questionário.";
    $("#save-status").textContent = "Não foi possível salvar as respostas neste navegador. Avise a equipe para registrar sua participação.";
    $(".response-code").hidden = true;
  }
}
$("#start-button").addEventListener("click", () => {
  startedAt = new Date();
  current = 0;
  answers = questions.map(() => null);
  confirmedMotions = {};
  finished = false;
  topicsDetail.value = "";
  showScreen($("#quiz-screen"));
  renderQuestion();
});
optionsContainer.addEventListener("change", (event) => {
  if (!event.target.matches("input[type=radio]") || showingFeedback) return;
  answers[current] = Number(event.target.value);
  if (questions[current].id === "practical-topics" && answers[current] === 0) topicsDetail.value = "";
  validation.textContent = "";
  updateFollowup();
});
previousButton.addEventListener("click", () => {
  if (current > 0) { current -= 1; renderQuestion(); }
});
document.addEventListener("visibilitychange", () => {
  stopAnimationLoop();
  if (!document.hidden) scheduleAnimationLoop();
});
motionPreference.addEventListener("change", () => {
  stopAnimationLoop();
  if (!motionPreference.matches) scheduleAnimationLoop();
});
quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (finished) return;
  if (answers[current] === null) {
    validation.textContent = "Selecione uma alternativa para continuar.";
    optionsContainer.querySelector("input")?.focus();
    return;
  }
  if (questions[current].type === "motion" && !showingFeedback) {
    confirmedMotions[questions[current].id] = answers[current];
    renderFeedback();
    return;
  }
  if (current < questions.length - 1) {
    current += 1;
    renderQuestion();
    return;
  }
  finished = true;
  disposePlayers();
  persistResponse();
  showScreen($("#complete-screen"));
  $("#complete-title").setAttribute("tabindex", "-1");
  $("#complete-title").focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
