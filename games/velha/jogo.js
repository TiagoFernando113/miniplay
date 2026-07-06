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

// modo online
let meuSimbolo = "❌";
let salaConectada = false;
let botAssumiu = false;
let esperaBot = null;
const painelOnlineEl = document.getElementById("painel-online");
const statusOnlineEl = document.getElementById("status-online");

function statusOnline(texto) {
  statusOnlineEl.textContent = texto;
}

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
  if (modo === "online") {
    if (!salaConectada && !botAssumiu) return; // ainda sem adversário
    if (vez !== meuSimbolo) return;
  }

  Som.clique();
  marcar(i, vez);

  if (modo === "online") {
    Online.enviar({ t: "j", i });
  }

  if (verificarFim(vez)) return;

  vez = vez === "❌" ? "⭕" : "❌";

  if (modo === "bot") {
    setTimeout(jogadaBot, 400);
  } else if (modo === "online" && botAssumiu) {
    setTimeout(() => jogadaBotComo(meuSimbolo === "❌" ? "⭕" : "❌"), 400);
  } else if (modo === "duo") {
    mensagemEl.textContent = `Vez do ${vez}`;
  } else if (modo === "online") {
    mensagemEl.textContent = "Vez do adversário...";
  }
}

// jogada remota chegando do outro celular
function jogadaRemota(i) {
  if (fimDeJogo || casas[i]) return;
  const dele = meuSimbolo === "❌" ? "⭕" : "❌";
  marcar(i, dele);
  Som.clique();
  if (verificarFim(dele)) return;
  vez = meuSimbolo;
  mensagemEl.textContent = "Sua vez!";
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

function minimax(tabuleiro, simboloTurno, profundidade, simboloMax) {
  const resultado = vencedorDe(tabuleiro);
  if (resultado === simboloMax) return 10 - profundidade;
  if (resultado === "empate") return 0;
  if (resultado) return profundidade - 10;

  const valores = [];
  for (let i = 0; i < 9; i++) {
    if (tabuleiro[i]) continue;
    tabuleiro[i] = simboloTurno;
    valores.push(minimax(tabuleiro, simboloTurno === "⭕" ? "❌" : "⭕", profundidade + 1, simboloMax));
    tabuleiro[i] = "";
  }
  return simboloTurno === simboloMax ? Math.max(...valores) : Math.min(...valores);
}

function melhorJogadaPara(simbolo) {
  let melhor = -Infinity;
  let escolha = null;
  for (let i = 0; i < 9; i++) {
    if (casas[i]) continue;
    casas[i] = simbolo;
    const valor = minimax(casas, simbolo === "⭕" ? "❌" : "⭕", 0, simbolo);
    casas[i] = "";
    if (valor > melhor) {
      melhor = valor;
      escolha = i;
    }
  }
  return escolha;
}

function melhorJogada() {
  return melhorJogadaPara("⭕");
}

// bot substituto no online: joga o símbolo do adversário que caiu
function jogadaBotComo(simbolo) {
  if (fimDeJogo) return;
  const escolha = melhorJogadaPara(simbolo);
  if (escolha === null) return;
  marcar(escolha, simbolo);
  if (!verificarFim(simbolo)) {
    vez = meuSimbolo;
    mensagemEl.textContent = "Sua vez!";
  }
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

      const rotuloBotao = modo === "online" ? "Revanche ⚔" : "Jogar de novo";
      const reiniciarPartida = () => {
        if (modo === "online") Online.enviar({ t: "r" });
        criarTabuleiro();
      };
      if (modo === "duo") {
        Som.vitoria();
        vibrar([60, 40, 60]);
        Pontos.add(20);
        setTimeout(() => Modal.mostrar({
          emoji: "🏆",
          titulo: `${simbolo} venceu!`,
          texto: "+20 pontos",
          botao: rotuloBotao,
          aoJogarDeNovo: reiniciarPartida,
        }), 600);
      } else if ((modo === "online" && simbolo === meuSimbolo) || (modo !== "online" && simbolo === "❌")) {
        Som.vitoria();
        vibrar([60, 40, 60]);
        Pontos.add(50);
        Recordes.incrementar("velhaVitorias");
        localStorage.setItem("velhaSequencia", String(parseInt(localStorage.getItem("velhaSequencia") || "0", 10) + 1));
        setTimeout(() => Modal.mostrar({
          emoji: "🏆",
          titulo: "Você venceu!",
          texto: "+50 pontos",
          botao: rotuloBotao,
          aoJogarDeNovo: reiniciarPartida,
        }), 600);
      } else {
        Som.erro();
        localStorage.setItem("velhaSequencia", "0");
        setTimeout(() => Modal.mostrar({
          emoji: "😅",
          titulo: modo === "online" ? "Você perdeu!" : "O bot venceu!",
          texto: "Tente de novo",
          botao: rotuloBotao,
          aoJogarDeNovo: reiniciarPartida,
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
      botao: modo === "online" ? "Revanche ⚔" : "Jogar de novo",
      aoJogarDeNovo: () => {
        if (modo === "online") Online.enviar({ t: "r" });
        criarTabuleiro();
      },
    }), 600);
    return true;
  }
  return false;
}

function aoMensagemOnline(p) {
  if (p.t === "j") jogadaRemota(p.i);
  else if (p.t === "r") {
    criarTabuleiro();
    mensagemEl.textContent = meuSimbolo === "❌" ? "Revanche! Você começa" : "Revanche! Adversário começa";
  }
}

function aoPresencaOnline(jogadores) {
  if (jogadores >= 2 && !salaConectada) {
    const botEstavaJogando = botAssumiu;
    salaConectada = true;
    botAssumiu = false;
    clearInterval(contagemBot);
    if (botEstavaJogando) criarTabuleiro(); // partida limpa pro humano
    statusOnline(`Amigo conectado! Você é o ${meuSimbolo}`);
    Som.vitoria();
    vibrar([40, 30, 40]);
    mensagemEl.textContent = meuSimbolo === "❌" ? "Você começa!" : "Adversário começa...";
  } else if (jogadores < 2 && salaConectada) {
    salaConectada = false;
    botAssumiu = true;
    statusOnline("Adversário caiu — o bot assumiu o lugar dele!");
    if (vez !== meuSimbolo && !fimDeJogo) {
      setTimeout(() => jogadaBotComo(meuSimbolo === "❌" ? "⭕" : "❌"), 500);
    }
  }
}

let salaAtual = null;
let contagemBot = null;

function mostrarEspera(mostrar) {
  document.getElementById("online-acoes").style.display = mostrar ? "none" : "block";
  document.getElementById("online-espera").style.display = mostrar ? "block" : "none";
}

function linkDaSala(codigo) {
  return location.origin + location.pathname + "?sala=" + codigo;
}

async function criarSala() {
  const codigo = Online.gerarCodigo();
  meuSimbolo = "❌";
  statusOnline("Criando sala...");
  try {
    await Online.abrir(codigo, aoMensagemOnline, aoPresencaOnline);
    salaAtual = codigo;
    criarTabuleiro();
    mostrarEspera(true);
    document.getElementById("codigo-grande").textContent = codigo;

    // contagem regressiva até o bot entrar
    let restantes = 30;
    statusOnline(`Esperando seu amigo... (bot entra em ${restantes}s)`);
    clearInterval(contagemBot);
    contagemBot = setInterval(() => {
      restantes--;
      if (salaConectada) {
        clearInterval(contagemBot);
        return;
      }
      if (restantes <= 0) {
        clearInterval(contagemBot);
        botAssumiu = true;
        statusOnline("Ninguém entrou — o bot joga no lugar. Chegando alguém, ele sai!");
        mensagemEl.textContent = "Você começa!";
      } else {
        statusOnline(`Esperando seu amigo... (bot entra em ${restantes}s)`);
      }
    }, 1000);
  } catch (e) {
    statusOnline("Sem conexão com a sala — verifica a internet e tenta de novo");
  }
}

async function entrarSala(codigoDireto) {
  const codigo = (codigoDireto || document.getElementById("campo-sala").value).trim().toUpperCase();
  if (codigo.length !== 4) {
    statusOnline("O código tem 4 letras/números");
    return;
  }
  meuSimbolo = "⭕";
  statusOnline("Entrando na sala " + codigo + "...");
  try {
    await Online.abrir(codigo, aoMensagemOnline, aoPresencaOnline);
    salaAtual = codigo;
    criarTabuleiro();
    // se em 5s só tem você na sala, o código deve estar errado
    setTimeout(() => {
      if (!salaConectada) {
        statusOnline("Ninguém nessa sala 🤔 — confere o código ou cria uma nova");
      }
    }, 5000);
  } catch (e) {
    statusOnline("Sem conexão com a sala — verifica a internet e tenta de novo");
  }
}

async function convidarAmigo() {
  const texto = `Bora jogar Velha comigo no MiniPlay! Entra na minha sala: ${linkDaSala(salaAtual)}`;
  if (navigator.share) {
    try {
      await navigator.share({ text: texto });
    } catch (e) { /* cancelou */ }
  } else {
    await navigator.clipboard.writeText(texto).catch(() => {});
    statusOnline("Convite copiado — cola no WhatsApp!");
  }
}

document.getElementById("btn-criar-sala").addEventListener("click", criarSala);
document.getElementById("btn-entrar-sala").addEventListener("click", () => entrarSala());
document.getElementById("btn-convidar").addEventListener("click", convidarAmigo);
document.getElementById("btn-copiar-codigo").addEventListener("click", async () => {
  await navigator.clipboard.writeText(salaAtual || "").catch(() => {});
  statusOnline("Código copiado!");
});

seletorModoEl.querySelectorAll("button").forEach((botao) => {
  botao.addEventListener("click", () => {
    seletorModoEl.querySelectorAll("button").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    modo = botao.dataset.modo;

    // limpa estado online ao trocar de modo
    salaConectada = false;
    botAssumiu = false;
    clearTimeout(esperaBot);
    if (window.Online) Online.fechar();
    painelOnlineEl.style.display = modo === "online" ? "block" : "none";
    mostrarEspera(false);
    clearInterval(contagemBot);
    statusOnline(modo === "online" ? "Crie uma sala ou entre com o código do amigo" : "");

    legendaEl.textContent = modo === "duo"
      ? "Duo: ❌ e ⭕ se revezam no mesmo celular"
      : modo === "online"
      ? "Online: cada um no seu celular (bot cobre ausências)"
      : "Você é ❌ — o bot é ⭕";
    Som.clique();
    criarTabuleiro();
  });
});

botaoReiniciar.addEventListener("click", () => {
  if (modo === "online") Online.enviar({ t: "r" });
  criarTabuleiro();
});
criarTabuleiro();

// veio por link de convite? entra direto na sala do amigo
{
  const codigoConvite = new URLSearchParams(location.search).get("sala");
  if (codigoConvite) {
    const botaoOnline = seletorModoEl.querySelector('[data-modo="online"]');
    if (botaoOnline) botaoOnline.click();
    document.getElementById("campo-sala").value = codigoConvite.toUpperCase();
    setTimeout(() => entrarSala(codigoConvite), 400);
  }
}
