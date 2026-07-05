// Estilo .io de conquista: bases geram tropas, envie metade para atacar.
// Donos: 0 = neutro, 1 = jogador (azul), 2 e 3 = bots.

const CORES = { 0: "#5a6a7a", 1: "#4f8cff", 2: "#ff6f6f", 3: "#6fdf6f" };
const MAX_TROPAS = 60;

let RAIO = 26;

function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
  RAIO = Math.max(20, Math.min(34, Math.floor(Math.min(tela.width, tela.height) * 0.055)));
}

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let bases = [];
let exercitos = []; // tropas em trânsito
let selecionada = null;
let fimDeJogo = false;
let relogio = null;
let cronometroBots = 0;
let nivel = Recordes.get("conquistaNivel") || 1;

// bots pensam mais rápido a cada nível
function intervaloBots() {
  return Math.max(900, 2100 - nivel * 120);
}

function novoJogo() {
  redimensionar();
  fimDeJogo = false;
  selecionada = null;
  exercitos = [];
  cronometroBots = 0;
  mensagemEl.textContent = "Toque na sua base e depois no alvo para enviar tropas";

  // mapa gerado pelo nível: mais bases neutras e bots mais fortes
  const W = tela.width;
  const H = tela.height;
  document.getElementById("nivel-hud").textContent = String(nivel);

  const tropasBot = 18 + nivel * 3;
  bases = [
    { x: W * 0.5, y: H * 0.86, dono: 1, tropas: 20 },
    { x: W * 0.16, y: H * 0.14, dono: 2, tropas: tropasBot },
    { x: W * 0.84, y: H * 0.14, dono: 3, tropas: tropasBot },
  ];

  const quantidadeNeutras = Math.min(4 + nivel, 11);
  for (let n = 0; n < quantidadeNeutras; n++) {
    for (let tentativa = 0; tentativa < 80; tentativa++) {
      const x = W * (0.12 + Math.random() * 0.76);
      const y = H * (0.24 + Math.random() * 0.52);
      const livre = bases.every((b) => Math.hypot(b.x - x, b.y - y) > RAIO * 2.6);
      if (livre) {
        bases.push({ x, y, dono: 0, tropas: 5 + Math.floor(Math.random() * (8 + nivel)) });
        break;
      }
    }
  }

  clearInterval(relogio);
  relogio = setInterval(passo, 100);
}

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

function passo() {
  if (fimDeJogo || document.hidden) return;

  // bases com dono geram tropas
  cronometroBots += 100;
  if (cronometroBots % 1000 < 100) {
    bases.forEach((b) => {
      if (b.dono !== 0 && b.tropas < MAX_TROPAS) b.tropas++;
    });
  }

  // bots decidem mais rápido conforme o nível
  if (cronometroBots % intervaloBots() < 100) {
    jogadaBot(2);
    jogadaBot(3);
  }

  // move exércitos
  exercitos.forEach((e) => {
    const dx = e.destino.x - e.x;
    const dy = e.destino.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 5) {
      chegar(e);
      e.chegou = true;
    } else {
      e.x += (dx / dist) * 3;
      e.y += (dy / dist) * 3;
    }
  });
  exercitos = exercitos.filter((e) => !e.chegou);

  verificarFim();
  desenhar();
}

function chegar(exercito) {
  const alvo = exercito.destino;
  if (alvo.dono === exercito.dono) {
    alvo.tropas = Math.min(alvo.tropas + exercito.tropas, MAX_TROPAS);
  } else {
    alvo.tropas -= exercito.tropas;
    if (alvo.tropas < 0) {
      alvo.dono = exercito.dono;
      alvo.tropas = -alvo.tropas;
      if (exercito.dono === 1) {
        Som.acerto();
        vibrar(30);
      }
    }
  }
}

function enviar(origem, destino) {
  if (origem.tropas < 2) return;
  const enviadas = Math.floor(origem.tropas / 2);
  origem.tropas -= enviadas;
  exercitos.push({
    x: origem.x,
    y: origem.y,
    destino,
    dono: origem.dono,
    tropas: enviadas,
  });
}

function jogadaBot(dono) {
  const minhas = bases.filter((b) => b.dono === dono);
  if (!minhas.length) return;

  const origem = minhas.reduce((a, b) => (a.tropas > b.tropas ? a : b));
  if (origem.tropas < 10) return;

  // ataca a base mais fraca que não é dele (prefere neutras e perto)
  const alvos = bases.filter((b) => b.dono !== dono);
  if (!alvos.length) return;
  const alvo = alvos.reduce((a, b) => {
    const custoA = a.tropas + Math.hypot(a.x - origem.x, a.y - origem.y) / 30;
    const custoB = b.tropas + Math.hypot(b.x - origem.x, b.y - origem.y) / 30;
    return custoA < custoB ? a : b;
  });

  enviar(origem, alvo);
}

function verificarFim() {
  const minhasBases = bases.filter((b) => b.dono === 1).length;
  const inimigas = bases.filter((b) => b.dono === 2 || b.dono === 3).length;
  const meusExercitos = exercitos.some((e) => e.dono === 1);

  if (minhasBases === 0 && !meusExercitos) {
    fimDeJogo = true;
    clearInterval(relogio);
    Som.erro();
    setTimeout(() => Modal.mostrar({
      emoji: "🏳️",
      titulo: "Você foi conquistado!",
      texto: "Tente de novo",
      botao: "Nova partida",
      aoJogarDeNovo: novoJogo,
    }), 400);
  } else if (inimigas === 0 && !exercitos.some((e) => e.dono > 1)) {
    fimDeJogo = true;
    clearInterval(relogio);
    const ganhos = 80 + nivel * 20;
    Pontos.add(ganhos);
    Recordes.incrementar("conquistaVitorias");
    const nivelConcluido = nivel;
    nivel++;
    Recordes.salvar("conquistaNivel", nivel);
    Som.vitoria();
    vibrar([80, 40, 80]);
    setTimeout(() => Modal.mostrar({
      emoji: "🏰",
      titulo: `Nível ${nivelConcluido} dominado!`,
      texto: `+${ganhos} pontos`,
      botao: `Ir pro nível ${nivel} →`,
      aoJogarDeNovo: novoJogo,
    }), 400);
  }
}

function desenhar() {
  ctx.fillStyle = "#0d1420";
  ctx.fillRect(0, 0, tela.width, tela.height);

  // linha de mira durante o arrasto
  if (arrasto) {
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(arrasto.origem.x, arrasto.origem.y);
    ctx.lineTo(arrasto.x, arrasto.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(arrasto.x, arrasto.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // exércitos em trânsito
  exercitos.forEach((e) => {
    ctx.fillStyle = CORES[e.dono];
    ctx.beginPath();
    ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(e.tropas), e.x, e.y + 3);
  });

  // bases
  bases.forEach((b) => {
    ctx.fillStyle = CORES[b.dono];
    ctx.beginPath();
    ctx.arc(b.x, b.y, RAIO, 0, Math.PI * 2);
    ctx.fill();

    if (b === selecionada) {
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(Math.floor(b.tropas)), b.x, b.y + 5);
  });
}

// controle por arrasto: dedo na sua base → arrasta → solta no alvo
let arrasto = null; // { origem, x, y }

function posicaoDoEvento(evento) {
  const retangulo = tela.getBoundingClientRect();
  const escala = tela.width / retangulo.width;
  const toque = evento.touches?.[0] || evento.changedTouches?.[0] || evento;
  return {
    x: (toque.clientX - retangulo.left) * escala,
    y: (toque.clientY - retangulo.top) * escala,
  };
}

function baseEm(p) {
  return bases.find((b) => Math.hypot(b.x - p.x, b.y - p.y) <= RAIO + 10);
}

function iniciarArrasto(evento) {
  if (fimDeJogo) return;
  evento.preventDefault();
  const p = posicaoDoEvento(evento);
  const base = baseEm(p);
  if (base && base.dono === 1) {
    arrasto = { origem: base, x: p.x, y: p.y };
    selecionada = base;
    Som.clique();
  }
}

function moverArrasto(evento) {
  if (!arrasto) return;
  evento.preventDefault();
  const p = posicaoDoEvento(evento);
  arrasto.x = p.x;
  arrasto.y = p.y;
}

function soltarArrasto(evento) {
  if (!arrasto) return;
  evento.preventDefault();
  const alvo = baseEm(posicaoDoEvento(evento));
  if (alvo && alvo !== arrasto.origem) {
    enviar(arrasto.origem, alvo);
    Som.clique();
    vibrar(15);
  }
  arrasto = null;
  selecionada = null;
}

tela.addEventListener("touchstart", iniciarArrasto, { passive: false });
tela.addEventListener("touchmove", moverArrasto, { passive: false });
tela.addEventListener("touchend", soltarArrasto, { passive: false });
tela.addEventListener("mousedown", iniciarArrasto);
tela.addEventListener("mousemove", moverArrasto);
tela.addEventListener("mouseup", soltarArrasto);

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
