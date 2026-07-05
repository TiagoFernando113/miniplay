// Estilo paper.io em tela cheia: a grade preenche o celular inteiro.
// Jogador = 1 (azul). Bots = 2 e 3.

const CELULA = 16;
const DURACAO = 60;
const CORES = {
  1: { area: "#2a4a8f", rastro: "#4f8cff", cabeca: "#9fc4ff" },
  2: { area: "#8f2a2a", rastro: "#ff6f6f", cabeca: "#ffb0b0" },
  3: { area: "#2a7a3a", rastro: "#6fdf6f", cabeca: "#b0ffb8" },
};

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const pct1El = document.getElementById("pct1");
const pct2El = document.getElementById("pct2");
const pct3El = document.getElementById("pct3");
const tempoEl = document.getElementById("tempo");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let COLS, ROWS, margemX, margemY;
let dono, rastro;
let cobras;
let tempoRestante, relogio, cronometro, fimDeJogo;
let pausado = false;
let abates = 0;

function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
  COLS = Math.floor(tela.width / CELULA);
  ROWS = Math.floor(tela.height / CELULA);
  margemX = Math.floor((tela.width - COLS * CELULA) / 2);
  margemY = Math.floor((tela.height - ROWS * CELULA) / 2);
}

function matriz(v) {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(v));
}

function espalharBase(id, l, c) {
  for (let dl = -1; dl <= 1; dl++)
    for (let dc = -1; dc <= 1; dc++) {
      const nl = l + dl;
      const nc = c + dc;
      if (nl >= 0 && nl < ROWS && nc >= 0 && nc < COLS) dono[nl][nc] = id;
    }
}

function novoJogo() {
  pausado = false;
  abates = 0;
  document.getElementById("abates").textContent = "0";
  redimensionar();
  dono = matriz(0);
  rastro = matriz(0);
  fimDeJogo = false;
  tempoRestante = DURACAO;
  tempoEl.textContent = String(DURACAO);
  mensagemEl.textContent = "Deslize pra virar — feche a volta pra capturar!";

  cobras = [
    { id: 1, l: ROWS - 4, c: Math.floor(COLS / 2), dl: -1, dc: 0, vivo: true },
    { id: 2, l: 3, c: 4, dl: 1, dc: 0, vivo: true },
    { id: 3, l: 3, c: COLS - 5, dl: 1, dc: 0, vivo: true },
  ];
  cobras.forEach((s) => espalharBase(s.id, s.l, s.c));

  clearInterval(relogio);
  clearInterval(cronometro);
  relogio = setInterval(passo, 150);
  cronometro = setInterval(() => {
    if (pausado) return;
    tempoRestante--;
    tempoEl.textContent = String(tempoRestante);
    if (tempoRestante <= 0) terminarPorTempo();
  }, 1000);

  desenhar();
}

function limparRastro(id) {
  for (let l = 0; l < ROWS; l++)
    for (let c = 0; c < COLS; c++)
      if (rastro[l][c] === id) rastro[l][c] = 0;
}

function morrer(cobra) {
  limparRastro(cobra.id);
  if (cobra.id === 1) {
    fimDeJogo = true;
    clearInterval(relogio);
    clearInterval(cronometro);
    const pct = porcentagem(1);
    const ganhos = Math.max(Math.floor(pct), 3);
    Pontos.add(ganhos);
    Som.erro();
    vibrar(150);
    setTimeout(() => Modal.mostrar({
      emoji: "💀",
      titulo: "Seu rastro foi cortado!",
      texto: `Dominou ${pct}% • +${ganhos} pontos`,
      aoJogarDeNovo: novoJogo,
    }), 300);
  } else {
    for (let l = 0; l < ROWS; l++)
      for (let c = 0; c < COLS; c++)
        if (dono[l][c] === cobra.id) dono[l][c] = 0;
    cobra.l = 2 + Math.floor(Math.random() * (ROWS - 4));
    cobra.c = 2 + Math.floor(Math.random() * (COLS - 4));
    espalharBase(cobra.id, cobra.l, cobra.c);
  }
}

function capturar(id) {
  for (let l = 0; l < ROWS; l++)
    for (let c = 0; c < COLS; c++)
      if (rastro[l][c] === id) {
        rastro[l][c] = 0;
        dono[l][c] = id;
      }

  const fora = matriz(false);
  const fila = [];
  for (let c = 0; c < COLS; c++) {
    [[0, c], [ROWS - 1, c]].forEach(([l, cc]) => {
      if (dono[l][cc] !== id && !fora[l][cc]) {
        fora[l][cc] = true;
        fila.push([l, cc]);
      }
    });
  }
  for (let l = 0; l < ROWS; l++) {
    [[l, 0], [l, COLS - 1]].forEach(([ll, c]) => {
      if (dono[ll][c] !== id && !fora[ll][c]) {
        fora[ll][c] = true;
        fila.push([ll, c]);
      }
    });
  }
  while (fila.length) {
    const [l, c] = fila.pop();
    [[l - 1, c], [l + 1, c], [l, c - 1], [l, c + 1]].forEach(([nl, nc]) => {
      if (nl >= 0 && nl < ROWS && nc >= 0 && nc < COLS && !fora[nl][nc] && dono[nl][nc] !== id) {
        fora[nl][nc] = true;
        fila.push([nl, nc]);
      }
    });
  }
  for (let l = 0; l < ROWS; l++)
    for (let c = 0; c < COLS; c++)
      if (!fora[l][c]) dono[l][c] = id;
}

function moverCobra(cobra) {
  if (!cobra.vivo) return;

  const nl = cobra.l + cobra.dl;
  const nc = cobra.c + cobra.dc;

  if (nl < 0 || nl >= ROWS || nc < 0 || nc >= COLS) {
    morrer(cobra);
    return;
  }

  if (rastro[nl][nc]) {
    const vitima = cobras.find((s) => s.id === rastro[nl][nc]);
    if (vitima === cobra) {
      morrer(cobra);
      return;
    }
    if (cobra.id === 1) {
      abates++;
      document.getElementById("abates").textContent = String(abates);
      Pontos.add(15);
      Som.acerto();
      vibrar(40);
    }
    morrer(vitima);
    if (fimDeJogo) return;
  }

  cobra.l = nl;
  cobra.c = nc;

  if (dono[nl][nc] === cobra.id) {
    let tinha = false;
    for (let l = 0; l < ROWS && !tinha; l++)
      for (let c = 0; c < COLS && !tinha; c++)
        if (rastro[l][c] === cobra.id) tinha = true;
    if (tinha) {
      capturar(cobra.id);
      if (cobra.id === 1) {
        Som.acerto();
        vibrar(35);
      }
    }
  } else {
    rastro[nl][nc] = cobra.id;
  }
}

function botDecide(cobra) {
  const opcoes = [
    [cobra.dl, cobra.dc],
    [cobra.dc, cobra.dl],
    [-cobra.dc, -cobra.dl],
  ];
  const seguras = opcoes.filter(([dl, dc]) => {
    const nl = cobra.l + dl;
    const nc = cobra.c + dc;
    if (nl < 0 || nl >= ROWS || nc < 0 || nc >= COLS) return false;
    if (rastro[nl][nc] === cobra.id) return false;
    return true;
  });
  if (!seguras.length) return;

  // rastro comprido? hora de voltar pra casa e capturar a área
  let tamanhoRastro = 0;
  for (let l = 0; l < ROWS; l++)
    for (let c = 0; c < COLS; c++)
      if (rastro[l][c] === cobra.id) tamanhoRastro++;

  if (tamanhoRastro > 8) {
    let melhor = null;
    let melhorDist = Infinity;
    for (const [dl, dc] of seguras) {
      const nl = cobra.l + dl;
      const nc = cobra.c + dc;
      for (let l = 0; l < ROWS; l++) {
        for (let c = 0; c < COLS; c++) {
          if (dono[l][c] === cobra.id) {
            const dist = Math.abs(l - nl) + Math.abs(c - nc);
            if (dist < melhorDist) {
              melhorDist = dist;
              melhor = [dl, dc];
            }
          }
        }
      }
    }
    if (melhor) {
      [cobra.dl, cobra.dc] = melhor;
      return;
    }
  }

  let escolha;
  if (Math.random() < 0.25) {
    escolha = seguras[Math.floor(Math.random() * seguras.length)];
  } else {
    escolha = seguras[0];
  }
  [cobra.dl, cobra.dc] = escolha;
}

function porcentagem(id) {
  let minhas = 0;
  for (let l = 0; l < ROWS; l++)
    for (let c = 0; c < COLS; c++) if (dono[l][c] === id) minhas++;
  return Math.round((minhas / (ROWS * COLS)) * 100);
}

function passo() {
  if (fimDeJogo || pausado) return;

  cobras.forEach((s) => {
    if (s.id !== 1) botDecide(s);
  });
  for (const s of cobras) {
    moverCobra(s);
    if (fimDeJogo) return;
  }

  const pct = porcentagem(1);
  pct1El.textContent = pct + "%";
  pct2El.textContent = porcentagem(2) + "%";
  pct3El.textContent = porcentagem(3) + "%";
  if (pct >= 60) {
    vencer(pct, "Dominou 60% do mapa!");
    return;
  }

  desenhar();
}

function terminarPorTempo() {
  const minha = porcentagem(1);
  const melhorBot = Math.max(porcentagem(2), porcentagem(3));
  if (minha > melhorBot) {
    vencer(minha, "Tempo esgotado — você dominou mais!");
  } else {
    fimDeJogo = true;
    clearInterval(relogio);
    clearInterval(cronometro);
    const ganhos = Math.max(Math.floor(minha), 3);
    Pontos.add(ganhos);
    Som.erro();
    setTimeout(() => Modal.mostrar({
      emoji: "⏱️",
      titulo: "Os bots dominaram mais!",
      texto: `Você: ${minha}% • +${ganhos} pontos`,
      aoJogarDeNovo: novoJogo,
    }), 300);
  }
}

function vencer(pct, titulo) {
  fimDeJogo = true;
  clearInterval(relogio);
  clearInterval(cronometro);
  Pontos.add(100);
  Recordes.incrementar("territorioVitorias");
  Som.vitoria();
  vibrar([80, 40, 80]);
  setTimeout(() => Modal.mostrar({
    emoji: "🟪",
    titulo,
    texto: `${pct}% do mapa • +100 pontos`,
    aoJogarDeNovo: novoJogo,
  }), 300);
}

function desenhar() {
  ctx.fillStyle = "#10141c";
  ctx.fillRect(0, 0, tela.width, tela.height);

  for (let l = 0; l < ROWS; l++) {
    for (let c = 0; c < COLS; c++) {
      if (dono[l][c]) {
        ctx.fillStyle = CORES[dono[l][c]].area;
        ctx.fillRect(margemX + c * CELULA, margemY + l * CELULA, CELULA - 1, CELULA - 1);
      }
      if (rastro[l][c]) {
        ctx.fillStyle = CORES[rastro[l][c]].rastro;
        ctx.fillRect(margemX + c * CELULA, margemY + l * CELULA, CELULA - 1, CELULA - 1);
      }
    }
  }

  cobras.forEach((s) => {
    ctx.fillStyle = CORES[s.id].cabeca;
    ctx.fillRect(margemX + s.c * CELULA, margemY + s.l * CELULA, CELULA - 1, CELULA - 1);
  });
}

function virar(dl, dc) {
  const eu = cobras[0];
  if (dl === -eu.dl && dc === -eu.dc) return;
  eu.dl = dl;
  eu.dc = dc;
}

document.addEventListener("keydown", (e) => {
  const mapa = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (mapa[e.key]) {
    e.preventDefault();
    virar(...mapa[e.key]);
  }
});

let toqueX = 0, toqueY = 0;
tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  toqueX = e.touches[0].clientX;
  toqueY = e.touches[0].clientY;
});
tela.addEventListener("touchend", (e) => {
  e.preventDefault();
  const dx = e.changedTouches[0].clientX - toqueX;
  const dy = e.changedTouches[0].clientY - toqueY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) virar(0, dx > 0 ? 1 : -1);
  else virar(dy > 0 ? 1 : -1, 0);
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

document.getElementById("pausar").addEventListener("click", () => {
  if (fimDeJogo) return;
  pausado = !pausado;
  document.getElementById("pausar").textContent = pausado ? "▶️" : "⏸️";
  mensagemEl.textContent = pausado ? "⏸️ Pausado" : "";
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !fimDeJogo && !pausado) {
    pausado = true;
    document.getElementById("pausar").textContent = "▶️";
  }
});

confirmarSaida(() => !fimDeJogo && tempoRestante < DURACAO);

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
