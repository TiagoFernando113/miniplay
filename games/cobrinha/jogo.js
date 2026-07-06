const CELULA = 20;

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const comidasEl = document.getElementById("comidas");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let COLUNAS, LINHAS, margemX, margemY;
let cobra, direcao, proximaDirecao, comida, comidas, intervalo, rodando;

function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
  COLUNAS = Math.floor(tela.width / CELULA);
  LINHAS = Math.floor(tela.height / CELULA);
  margemX = Math.floor((tela.width - COLUNAS * CELULA) / 2);
  margemY = Math.floor((tela.height - LINHAS * CELULA) / 2);
}

function velocidadeAtual() {
  return Math.max(80, 170 - comidas * 5);
}

function novoJogo() {
  redimensionar();
  cobra = [{ x: Math.floor(COLUNAS / 2), y: Math.floor(LINHAS / 2) }];
  direcao = { x: 1, y: 0 };
  proximaDirecao = direcao;
  comidas = 0;
  comidasEl.textContent = "0";
  gerarComida();
  rodando = true;
  clearInterval(intervalo);
  intervalo = setInterval(passo, velocidadeAtual());
  desenhar();
}

function gerarComida() {
  do {
    comida = {
      x: Math.floor(Math.random() * COLUNAS),
      y: Math.floor(Math.random() * LINHAS),
    };
  } while (cobra.some((p) => p.x === comida.x && p.y === comida.y));
}

function passo() {
  if (document.hidden) return;
  direcao = proximaDirecao;
  const cabeca = {
    x: cobra[0].x + direcao.x,
    y: cobra[0].y + direcao.y,
  };

  const bateuParede =
    cabeca.x < 0 || cabeca.y < 0 || cabeca.x >= COLUNAS || cabeca.y >= LINHAS;
  const bateuCorpo = cobra.some((p) => p.x === cabeca.x && p.y === cabeca.y);

  if (bateuParede || bateuCorpo) {
    rodando = false;
    clearInterval(intervalo);
    const ganhos = comidas * 5;
    if (ganhos > 0) Pontos.add(ganhos);
    const novoRecorde = comidas > 0 && Recordes.salvar("cobrinha", comidas);
    Som.erro();
    vibrar(80);
    Modal.mostrar({
      emoji: novoRecorde ? "🏆" : "🐍",
      titulo: novoRecorde ? "Novo recorde!" : "Fim de jogo!",
      texto: `${comidas} comida(s)${ganhos > 0 ? ` • +${ganhos} pontos` : ""}`,
      aoJogarDeNovo: novoJogo, aoMenu: abrirLobby,
    });
    return;
  }

  cobra.unshift(cabeca);

  if (cabeca.x === comida.x && cabeca.y === comida.y) {
    comidas++;
    comidasEl.textContent = String(comidas);
    Som.acerto();
    vibrar(20);
    gerarComida();
    clearInterval(intervalo);
    intervalo = setInterval(passo, velocidadeAtual());
  } else {
    cobra.pop();
  }

  desenhar();
}

function desenhar() {
  ctx.fillStyle = "#101018";
  ctx.fillRect(0, 0, tela.width, tela.height);

  // paredes = bordas da tela
  ctx.strokeStyle = "#3a3a4a";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, tela.width - 4, tela.height - 4);

  ctx.fillStyle = "#e05d5d";
  ctx.fillRect(margemX + comida.x * CELULA, margemY + comida.y * CELULA, CELULA - 1, CELULA - 1);

  const pele = window.Cosmetico ? Cosmetico.dados("cobra") : ["#7ddf7d", "#4faf4f"];
  cobra.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? pele[0] : pele[1];
    ctx.fillRect(margemX + p.x * CELULA, margemY + p.y * CELULA, CELULA - 1, CELULA - 1);
  });
}

function mudarDirecao(dx, dy) {
  if (!rodando) return;
  if (dx === -direcao.x && dy === -direcao.y) return;
  proximaDirecao = { x: dx, y: dy };
}

document.addEventListener("keydown", (e) => {
  const mapa = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  if (mapa[e.key]) {
    e.preventDefault();
    mudarDirecao(...mapa[e.key]);
  }
});

// controle 100% por deslize do dedo
let toqueX = 0;
let toqueY = 0;

tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  toqueX = e.touches[0].clientX;
  toqueY = e.touches[0].clientY;
});

tela.addEventListener("touchend", (e) => {
  e.preventDefault();
  const dx = e.changedTouches[0].clientX - toqueX;
  const dy = e.changedTouches[0].clientY - toqueY;
  if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
  if (Math.abs(dx) > Math.abs(dy)) mudarDirecao(dx > 0 ? 1 : -1, 0);
  else mudarDirecao(0, dy > 0 ? 1 : -1);
});

let _ultimaL = window.innerWidth;
let _ultimaA = window.innerHeight;
window.addEventListener("resize", () => {
  const virou = (window.innerWidth > window.innerHeight) !== (_ultimaL > _ultimaA);
  const mudou = Math.abs(window.innerWidth - _ultimaL) > 140 || Math.abs(window.innerHeight - _ultimaA) > 140;
  _ultimaL = window.innerWidth;
  _ultimaA = window.innerHeight;
  // só reinicia se girou a tela ou mudou muito — barra do navegador não conta
  if (virou || mudou) novoJogo();
});

function abrirLobby() {
  rodando = false;
  clearInterval(intervalo);
  Lobby.mostrar({
    titulo: "Cobrinha",
    skinCat: "cobra",
    temOnline: true,
    previewHTML: () => {
      const d = window.Cosmetico ? Cosmetico.dados("cobra") : ["#7ddf7d", "#4faf4f"];
      return `<svg viewBox="0 0 120 40"><rect x="4" y="16" width="12" height="12" rx="3" fill="${d[1]}"/><rect x="18" y="16" width="12" height="12" rx="3" fill="${d[1]}"/><rect x="32" y="16" width="12" height="12" rx="3" fill="${d[1]}"/><rect x="46" y="16" width="12" height="12" rx="3" fill="${d[1]}"/><rect x="60" y="14" width="16" height="16" rx="4" fill="${d[0]}"/><rect x="70" y="19" width="3" height="3" fill="#12203a"/></svg>`;
    },
    aoJogar: ({ modo }) => {
      if (modo === "online") {
        // o online da cobrinha é o Cobra Batalha (arena .io)
        location.href = "../cobrabatalha/index.html";
      } else {
        novoJogo();
      }
    },
  });
}

const botaoLobby = document.getElementById("btn-lobby");
if (botaoLobby) botaoLobby.addEventListener("click", abrirLobby);
const botaoVoltar = document.getElementById("btn-voltar");
if (botaoVoltar) botaoVoltar.addEventListener("click", abrirLobby);

configurarMelhor("cobrinha");
abrirLobby();
