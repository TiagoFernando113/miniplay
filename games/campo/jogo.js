const LADO = 8;

let nivel = Recordes.get("campoNivel") || 1;

function totalMinas() {
  return Math.min(8 + nivel * 2, 24);
}

const gradeEl = document.getElementById("grade");
const bandeirasEl = document.getElementById("bandeiras");
const mensagemEl = document.getElementById("mensagem");
const botaoModo = document.getElementById("modo");
const botaoReiniciar = document.getElementById("reiniciar");

let minas = [];
let abertas = [];
let bandeiras = [];
let primeiraJogada = true;
let modoBandeira = false;
let fimDeJogo = false;
let relogio = null;
let segundos = 0;

function iniciarRelogio() {
  clearInterval(relogio);
  segundos = 0;
  document.getElementById("cronometro").textContent = "0";
  relogio = setInterval(() => {
    segundos++;
    document.getElementById("cronometro").textContent = String(segundos);
  }, 1000);
}

function indice(l, c) {
  return l * LADO + c;
}

function vizinhos(i) {
  const l = Math.floor(i / LADO);
  const c = i % LADO;
  const lista = [];
  for (let dl = -1; dl <= 1; dl++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dl && !dc) continue;
      const nl = l + dl;
      const nc = c + dc;
      if (nl >= 0 && nl < LADO && nc >= 0 && nc < LADO) lista.push(indice(nl, nc));
    }
  }
  return lista;
}

function novoJogo() {
  document.getElementById("nivel").textContent = String(nivel);
  document.getElementById("total-minas").textContent = String(totalMinas());
  minas = Array(LADO * LADO).fill(false);
  abertas = Array(LADO * LADO).fill(false);
  bandeiras = Array(LADO * LADO).fill(false);
  primeiraJogada = true;
  fimDeJogo = false;
  clearInterval(relogio);
  document.getElementById("cronometro").textContent = "0";
  bandeirasEl.textContent = "0";
  mensagemEl.textContent = "Toque para abrir — ative 🚩 para marcar minas";

  gradeEl.innerHTML = "";
  for (let i = 0; i < LADO * LADO; i++) {
    const quadrado = document.createElement("div");
    quadrado.className = "quadrado";
    quadrado.addEventListener("click", () => toque(i));
    gradeEl.appendChild(quadrado);
  }
}

function sortearMinas(protegido) {
  const proibidos = new Set([protegido, ...vizinhos(protegido)]);
  let colocadas = 0;
  while (colocadas < totalMinas()) {
    const i = Math.floor(Math.random() * LADO * LADO);
    if (!minas[i] && !proibidos.has(i)) {
      minas[i] = true;
      colocadas++;
    }
  }
}

function minasVizinhas(i) {
  return vizinhos(i).filter((v) => minas[v]).length;
}

function toque(i) {
  if (fimDeJogo) return;

  // acorde: tocar num número aberto com as bandeiras certas abre os vizinhos
  if (abertas[i]) {
    const numero = minasVizinhas(i);
    if (numero === 0) return;
    const vizinhanca = vizinhos(i);
    const marcadas = vizinhanca.filter((v) => bandeiras[v]).length;
    if (marcadas !== numero) return;
    Som.clique();
    for (const v of vizinhanca) {
      if (abertas[v] || bandeiras[v]) continue;
      if (minas[v]) {
        clearInterval(relogio);
        explodir(v);
        return;
      }
      abrir(v);
    }
    verificarVitoria();
    return;
  }

  if (modoBandeira) {
    bandeiras[i] = !bandeiras[i];
    gradeEl.children[i].textContent = bandeiras[i] ? "🚩" : "";
    bandeirasEl.textContent = String(bandeiras.filter(Boolean).length);
    Som.clique();
    vibrar(15);
    return;
  }

  if (bandeiras[i]) return;

  if (primeiraJogada) {
    sortearMinas(i);
    primeiraJogada = false;
    iniciarRelogio();
  }

  if (minas[i]) {
    clearInterval(relogio);
    explodir(i);
    return;
  }

  Som.clique();
  abrir(i);
  verificarVitoria();
}

function abrir(inicio) {
  const fila = [inicio];
  while (fila.length) {
    const i = fila.pop();
    if (abertas[i] || bandeiras[i]) continue;
    abertas[i] = true;

    const quadrado = gradeEl.children[i];
    quadrado.classList.add("aberto");
    const n = minasVizinhas(i);
    if (n > 0) {
      quadrado.textContent = String(n);
      quadrado.classList.add("n" + n);
    } else {
      vizinhos(i).forEach((v) => {
        if (!abertas[v] && !minas[v]) fila.push(v);
      });
    }
  }
}

function explodir(i) {
  fimDeJogo = true;
  Som.erro();
  vibrar(200);
  for (let j = 0; j < LADO * LADO; j++) {
    if (minas[j]) {
      gradeEl.children[j].classList.add("mina");
      gradeEl.children[j].textContent = "💣";
    }
  }
  gradeEl.children[i].textContent = "💥";
  setTimeout(() => Modal.mostrar({
    emoji: "💥",
    titulo: "Pisou na mina!",
    texto: "Tente de novo",
    aoJogarDeNovo: novoJogo,
  }), 600);
}

function verificarVitoria() {
  const fechadas = abertas.filter((a) => !a).length;
  if (fechadas === totalMinas()) {
    fimDeJogo = true;
    clearInterval(relogio);
    const ganhos = 60 + nivel * 20;
    Pontos.add(ganhos);
    Recordes.incrementar("campoVitorias");
    const nivelConcluido = nivel;
    nivel++;
    Recordes.salvar("campoNivel", nivel);
    Som.vitoria();
    vibrar([60, 40, 60]);
    setTimeout(() => Modal.mostrar({
      emoji: "🏆",
      titulo: `Nível ${nivelConcluido} concluído!`,
      texto: `${segundos}s • +${ganhos} pontos`,
      botao: `Ir pro nível ${nivel} →`,
      aoJogarDeNovo: novoJogo,
    }), 400);
  }
}

botaoModo.addEventListener("click", () => {
  modoBandeira = !modoBandeira;
  botaoModo.textContent = modoBandeira ? "🚩 Modo: bandeira" : "⛏️ Modo: cavar";
  botaoModo.classList.toggle("ativo", modoBandeira);
  Som.clique();
});

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
