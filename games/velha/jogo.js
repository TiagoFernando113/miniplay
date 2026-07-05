const LINHAS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const tabuleiroEl = document.getElementById("tabuleiro");
const mensagemEl = document.getElementById("mensagem");
const legendaEl = document.getElementById("legenda");
const botaoReiniciar = document.getElementById("reiniciar");
const seletorModoEl = document.getElementById("seletor-modo");

let modo = "bot";
let casas = [];
let vez = "❌";
let fimDeJogo = false;

function criarTabuleiro() {
  tabuleiroEl.innerHTML = "";
  casas = Array(9).fill("");
  vez = "❌";
  fimDeJogo = false;
  mensagemEl.textContent = modo === "duo" ? "Vez do ❌" : "";

  for (let i = 0; i < 9; i++) {
    const celula = document.createElement("div");
    celula.className = "celula";
    celula.addEventListener("click", () => toque(i));
    tabuleiroEl.appendChild(celula);
  }
}

function toque(i) {
  if (fimDeJogo || casas[i]) return;
  if (modo === "bot" && vez !== "❌") return;

  Som.clique();
  marcar(i, vez);
  if (verificarFim(vez)) return;

  vez = vez === "❌" ? "⭕" : "❌";

  if (modo === "bot") {
    setTimeout(jogadaBot, 400);
  } else {
    mensagemEl.textContent = `Vez do ${vez}`;
  }
}

function jogadaBot() {
  if (fimDeJogo) return;
  const vazias = casas.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (!vazias.length) return;

  // bot adaptativo: quanto mais você vence, menos ele vacila
  const sequencia = parseInt(localStorage.getItem("velhaSequencia") || "0", 10);
  const chanceVacilo = sequencia >= 5 ? 0 : sequencia >= 3 ? 0.04 : 0.12;
  let escolha;
  if (Math.random() < chanceVacilo) {
    escolha = vazias[Math.floor(Math.random() * vazias.length)];
  } else {
    escolha = melhorJogada();
  }

  marcar(escolha, "⭕");
  if (!verificarFim("⭕")) vez = "❌";
}

function vencedorDe(tabuleiro) {
  for (const linha of LINHAS) {
    const [a, b, c] = linha.map((i) => tabuleiro[i]);
    if (a && a === b && b === c) return a;
  }
  return tabuleiro.every((v) => v) ? "empate" : null;
}

function minimax(tabuleiro, simbolo, profundidade) {
  const resultado = vencedorDe(tabuleiro);
  if (resultado === "⭕") return 10 - profundidade;
  if (resultado === "❌") return profundidade - 10;
  if (resultado === "empate") return 0;

  const valores = [];
  for (let i = 0; i < 9; i++) {
    if (tabuleiro[i]) continue;
    tabuleiro[i] = simbolo;
    valores.push(minimax(tabuleiro, simbolo === "⭕" ? "❌" : "⭕", profundidade + 1));
    tabuleiro[i] = "";
  }
  return simbolo === "⭕" ? Math.max(...valores) : Math.min(...valores);
}

function melhorJogada() {
  let melhor = -Infinity;
  let escolha = null;
  for (let i = 0; i < 9; i++) {
    if (casas[i]) continue;
    casas[i] = "⭕";
    const valor = minimax(casas, "❌", 0);
    casas[i] = "";
    if (valor > melhor) {
      melhor = valor;
      escolha = i;
    }
  }
  return escolha;
}

function marcar(i, simbolo) {
  casas[i] = simbolo;
  tabuleiroEl.children[i].textContent = simbolo;
}

function verificarFim(simbolo) {
  for (const linha of LINHAS) {
    if (linha.every((i) => casas[i] === simbolo)) {
      fimDeJogo = true;
      linha.forEach((i) => tabuleiroEl.children[i].classList.add("vencedora"));

      if (modo === "duo") {
        Som.vitoria();
        vibrar([60, 40, 60]);
        Pontos.add(20);
        setTimeout(() => Modal.mostrar({
          emoji: "🏆",
          titulo: `${simbolo} venceu!`,
          texto: "+20 pontos",
          aoJogarDeNovo: criarTabuleiro,
        }), 600);
      } else if (simbolo === "❌") {
        Som.vitoria();
        vibrar([60, 40, 60]);
        Pontos.add(50);
        Recordes.incrementar("velhaVitorias");
        localStorage.setItem("velhaSequencia", String(parseInt(localStorage.getItem("velhaSequencia") || "0", 10) + 1));
        setTimeout(() => Modal.mostrar({
          emoji: "🏆",
          titulo: "Você venceu!",
          texto: "+50 pontos",
          aoJogarDeNovo: criarTabuleiro,
        }), 600);
      } else {
        Som.erro();
        localStorage.setItem("velhaSequencia", "0");
        setTimeout(() => Modal.mostrar({
          emoji: "😅",
          titulo: "O bot venceu!",
          texto: "Tente de novo",
          aoJogarDeNovo: criarTabuleiro,
        }), 600);
      }
      return true;
    }
  }

  if (casas.every((v) => v)) {
    fimDeJogo = true;
    Pontos.add(10);
    setTimeout(() => Modal.mostrar({
      emoji: "🤝",
      titulo: "Empate!",
      texto: "+10 pontos",
      aoJogarDeNovo: criarTabuleiro,
    }), 600);
    return true;
  }
  return false;
}

seletorModoEl.querySelectorAll("button").forEach((botao) => {
  botao.addEventListener("click", () => {
    seletorModoEl.querySelectorAll("button").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    modo = botao.dataset.modo;
    legendaEl.textContent = modo === "duo"
      ? "Duo: ❌ e ⭕ se revezam no mesmo celular"
      : "Você é ❌ — o bot é ⭕";
    Som.clique();
    criarTabuleiro();
  });
});

botaoReiniciar.addEventListener("click", criarTabuleiro);
criarTabuleiro();
