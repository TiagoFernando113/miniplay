const MAOS = ["✊", "✋", "✌️"];
const META = 3;

const maosEl = document.getElementById("maos");
const mensagemEl = document.getElementById("mensagem");
const placarAEl = document.getElementById("placar-a");
const placarBEl = document.getElementById("placar-b");
const rotuloVsEl = document.getElementById("rotulo-vs");
const escolhasEl = document.getElementById("escolhas");
const seletorModoEl = document.getElementById("seletor-modo");

let modo = "bot";
let placarA = 0;
let placarB = 0;
let jogadaGuardada = null; // no duo, guarda a escolha do jogador 1
let contando = false;

// contagem clássica antes de revelar as mãos
function comContagem(revelar) {
  contando = true;
  const falas = ["Jo...", "Ken...", "Pô!"];
  maosEl.textContent = "🤜 🤛";
  maosEl.classList.add("tremendo");
  falas.forEach((fala, i) => {
    setTimeout(() => {
      mensagemEl.textContent = fala;
      Som.clique();
    }, i * 300);
  });
  setTimeout(() => {
    maosEl.classList.remove("tremendo");
    contando = false;
    revelar();
  }, 980);
}

function reiniciar() {
  placarA = 0;
  placarB = 0;
  jogadaGuardada = null;
  placarAEl.textContent = "0";
  placarBEl.textContent = "0";
  maosEl.textContent = "🤜 🤛";
  mensagemEl.textContent =
    modo === "duo" ? "Jogador 1: escolha escondido!" : "Melhor de 5 — escolha sua jogada!";
}

function vencedorDaRodada(a, b) {
  if (a === b) return 0;
  return (a - b + 3) % 3 === 1 ? 1 : 2;
}

function jogar(jogada) {
  if (contando) return;
  Som.clique();

  if (modo === "duo") {
    if (jogadaGuardada === null) {
      jogadaGuardada = jogada;
      maosEl.textContent = "❓ 🤛";
      mensagemEl.textContent = "Jogador 2: sua vez (sem espiar!)";
      return;
    }
    const j1 = jogadaGuardada;
    jogadaGuardada = null;
    comContagem(() => resolverRodada(j1, jogada, "Jogador 1", "Jogador 2"));
    return;
  }

  const bot = Math.floor(Math.random() * 3);
  comContagem(() => resolverRodada(jogada, bot, "Você", "Bot"));
}

function resolverRodada(a, b, nomeA, nomeB) {
  maosEl.textContent = `${MAOS[a]} ${MAOS[b]}`;
  const resultado = vencedorDaRodada(a, b);

  if (resultado === 0) {
    mensagemEl.textContent = "Empatou a rodada!";
  } else if (resultado === 1) {
    placarA++;
    placarAEl.textContent = String(placarA);
    Som.acerto();
    vibrar(20);
    mensagemEl.textContent = `${nomeA} ganhou a rodada!`;
  } else {
    placarB++;
    placarBEl.textContent = String(placarB);
    Som.erro();
    mensagemEl.textContent = `${nomeB} ganhou a rodada!`;
  }

  if (placarA === META || placarB === META) {
    const venceuA = placarA === META;

    if (modo === "bot" && venceuA) {
      Pontos.add(30);
      Recordes.incrementar("pptVitorias");
      Som.vitoria();
      vibrar([60, 40, 60]);
    } else if (modo === "duo") {
      Pontos.add(15);
      Som.vitoria();
    }

    const titulo = modo === "duo"
      ? `${venceuA ? "Jogador 1" : "Jogador 2"} venceu!`
      : venceuA ? "Você venceu!" : "O bot venceu!";
    const texto = modo === "duo" ? "+15 pontos" : venceuA ? "+30 pontos" : "Tente de novo";

    setTimeout(() => Modal.mostrar({
      emoji: venceuA || modo === "duo" ? "🏆" : "😅",
      titulo,
      texto,
      aoJogarDeNovo: reiniciar,
    }), 700);
  } else if (modo === "duo") {
    setTimeout(() => {
      mensagemEl.textContent = "Jogador 1: escolha escondido!";
      maosEl.textContent = "🤜 🤛";
    }, 1500);
  }
}

escolhasEl.querySelectorAll("button").forEach((botao) => {
  botao.addEventListener("click", () => jogar(Number(botao.dataset.jogada)));
});

seletorModoEl.querySelectorAll("button").forEach((botao) => {
  botao.addEventListener("click", () => {
    seletorModoEl.querySelectorAll("button").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    modo = botao.dataset.modo;
    rotuloVsEl.textContent = modo === "duo" ? "J2" : "Bot";
    Som.clique();
    reiniciar();
  });
});

reiniciar();
