const COLUNAS = 10;
const LINHAS_GRADE = 16;
const CELULA = 25;

// as 7 peças clássicas de encaixe
const PECAS = [
  { forma: [[1, 1, 1, 1]], cor: "#25c8e8" },
  { forma: [[1, 1], [1, 1]], cor: "#ffd54f" },
  { forma: [[0, 1, 0], [1, 1, 1]], cor: "#cf8fff" },
  { forma: [[1, 0, 0], [1, 1, 1]], cor: "#4f8cff" },
  { forma: [[0, 0, 1], [1, 1, 1]], cor: "#ff9f4f" },
  { forma: [[0, 1, 1], [1, 1, 0]], cor: "#6fdf6f" },
  { forma: [[1, 1, 0], [0, 1, 1]], cor: "#ff6f6f" },
];

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const linhasEl = document.getElementById("linhas");
const pontosPartidaEl = document.getElementById("pontos-partida");
const botaoReiniciar = document.getElementById("reiniciar");

let grade, peca, pecaL, pecaC, corPeca;
let proxima = null;
let guardada = null;
let jaTrocou = false;
let linhasFlash = [];
let linhasFeitas, pontosPartida;
let intervalo = null;
let rodando = false;
let pausado = false;

function novoJogo() {
  grade = Array.from({ length: LINHAS_GRADE }, () => Array(COLUNAS).fill(""));
  linhasFeitas = 0;
  pontosPartida = 0;
  linhasEl.textContent = "0";
  pontosPartidaEl.textContent = "0";
  rodando = true;
  pausado = false;
  guardada = null;
  jaTrocou = false;
  linhasFlash = [];
  proxima = PECAS[Math.floor(Math.random() * PECAS.length)];
  atualizarBotaoPausa();
  novaPeca();
  reagendar();
  desenhar();
}

function velocidade() {
  return Math.max(200, 650 - linhasFeitas * 25);
}

function reagendar() {
  clearInterval(intervalo);
  intervalo = setInterval(descer, velocidade());
}

function novaPeca() {
  const sorteada = proxima;
  proxima = PECAS[Math.floor(Math.random() * PECAS.length)];
  peca = sorteada.forma.map((linha) => [...linha]);
  corPeca = sorteada.cor;
  pecaL = 0;
  pecaC = Math.floor((COLUNAS - peca[0].length) / 2);

  if (colide(pecaL, pecaC, peca)) {
    fimDeJogo();
  }
}

function colide(l, c, forma) {
  for (let fl = 0; fl < forma.length; fl++) {
    for (let fc = 0; fc < forma[fl].length; fc++) {
      if (!forma[fl][fc]) continue;
      const nl = l + fl;
      const nc = c + fc;
      if (nc < 0 || nc >= COLUNAS || nl >= LINHAS_GRADE) return true;
      if (nl >= 0 && grade[nl][nc]) return true;
    }
  }
  return false;
}

function fixar() {
  peca.forEach((linha, fl) => {
    linha.forEach((v, fc) => {
      if (v && pecaL + fl >= 0) grade[pecaL + fl][pecaC + fc] = corPeca;
    });
  });
  jaTrocou = false;

  const cheias = [];
  for (let l = 0; l < LINHAS_GRADE; l++) {
    if (grade[l].every((v) => v)) cheias.push(l);
  }

  if (cheias.length > 0) {
    // flash branco nas linhas antes de sumirem, como no original
    // (entradas travadas enquanto linhasFlash não esvazia)
    linhasFlash = cheias;
    clearInterval(intervalo);
    Som.acerto();
    vibrar(cheias.length * 30);
    desenhar();

    setTimeout(() => {
      linhasFlash = [];
      cheias.sort((a, b) => b - a).forEach((l) => {
        grade.splice(l, 1);
        grade.unshift(Array(COLUNAS).fill(""));
      });
      linhasFeitas += cheias.length;
      pontosPartida += [0, 100, 300, 500, 800][cheias.length];
      linhasEl.textContent = String(linhasFeitas);
      pontosPartidaEl.textContent = String(pontosPartida);
      reagendar();
      novaPeca();
      desenhar();
      Retomar.salvar("blocos", { grade, pontos: pontosPartida, linhas: linhasFeitas });
    }, 150);
  } else {
    Som.clique();
    novaPeca();
    Retomar.salvar("blocos", { grade, pontos: pontosPartida, linhas: linhasFeitas });
  }
}

function guardar() {
  if (!rodando || pausado || jaTrocou || linhasFlash.length) return;
  Som.clique();
  const atual = { forma: peca, cor: corPeca };
  if (guardada) {
    peca = guardada.forma;
    corPeca = guardada.cor;
  } else {
    peca = proxima.forma.map((linha) => [...linha]);
    corPeca = proxima.cor;
    proxima = PECAS[Math.floor(Math.random() * PECAS.length)];
  }
  guardada = atual;
  pecaL = 0;
  pecaC = Math.floor((COLUNAS - peca[0].length) / 2);
  jaTrocou = true;
  desenhar();
}

function descer() {
  if (!rodando || pausado || linhasFlash.length) return;
  if (!colide(pecaL + 1, pecaC, peca)) {
    pecaL++;
  } else {
    fixar();
  }
  desenhar();
}

function mover(dc) {
  if (!rodando || pausado || linhasFlash.length) return;
  if (!colide(pecaL, pecaC + dc, peca)) {
    pecaC += dc;
    desenhar();
  }
}

function girar() {
  if (!rodando || pausado || linhasFlash.length) return;
  const girada = peca[0].map((_, i) => peca.map((linha) => linha[i]).reverse());
  // wall kick: encostado na parede, empurra pro lado pra permitir o giro
  for (const desvio of [0, -1, 1, -2, 2]) {
    if (!colide(pecaL, pecaC + desvio, girada)) {
      peca = girada;
      pecaC += desvio;
      Som.clique();
      desenhar();
      return;
    }
  }
}

function quedaRapida() {
  if (!rodando || pausado || linhasFlash.length) return;
  while (!colide(pecaL + 1, pecaC, peca)) pecaL++;
  fixar();
  desenhar();
}

function desenhar() {
  ctx.fillStyle = "#0d0d18";
  ctx.fillRect(0, 0, tela.width, tela.height);

  const desenharBloco = (l, c, cor) => {
    ctx.fillStyle = cor;
    ctx.fillRect(c * CELULA + 1, l * CELULA + 1, CELULA - 2, CELULA - 2);
  };

  grade.forEach((linha, l) => linha.forEach((cor, c) => cor && desenharBloco(l, c, cor)));

  // fantasma: mostra onde a peça vai cair
  let fantasmaL = pecaL;
  while (!colide(fantasmaL + 1, pecaC, peca)) fantasmaL++;
  ctx.globalAlpha = 0.22;
  peca.forEach((linha, fl) =>
    linha.forEach((v, fc) => {
      if (v && fantasmaL + fl >= 0) desenharBloco(fantasmaL + fl, pecaC + fc, corPeca);
    })
  );
  ctx.globalAlpha = 1;

  peca.forEach((linha, fl) =>
    linha.forEach((v, fc) => {
      if (v && pecaL + fl >= 0) desenharBloco(pecaL + fl, pecaC + fc, corPeca);
    })
  );

  // flash branco nas linhas completas
  linhasFlash.forEach((l) => {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(0, l * CELULA, COLUNAS * CELULA, CELULA);
  });

  // peça guardada no canto superior esquerdo
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(6, 6, 56, 40);
  if (guardada) {
    const miniG = 10;
    const larguraG = guardada.forma[0].length * miniG;
    const gx = 6 + (56 - larguraG) / 2;
    const gy = 6 + (40 - guardada.forma.length * miniG) / 2;
    ctx.fillStyle = guardada.cor;
    guardada.forma.forEach((linha, l) =>
      linha.forEach((v, c) => {
        if (v) ctx.fillRect(gx + c * miniG, gy + l * miniG, miniG - 1, miniG - 1);
      })
    );
  }

  // próxima peça no canto superior direito
  if (proxima) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(tela.width - 62, 6, 56, 40);
    const mini = 10;
    const largura = proxima.forma[0].length * mini;
    const dx = tela.width - 62 + (56 - largura) / 2;
    const dy = 6 + (40 - proxima.forma.length * mini) / 2;
    ctx.fillStyle = proxima.cor;
    proxima.forma.forEach((linha, l) =>
      linha.forEach((v, c) => {
        if (v) ctx.fillRect(dx + c * mini, dy + l * mini, mini - 1, mini - 1);
      })
    );
  }

  if (pausado) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⏸️ Pausado", tela.width / 2, tela.height / 2);
  }
}

function alternarPausa() {
  if (!rodando) return;
  pausado = !pausado;
  atualizarBotaoPausa();
  desenhar();
}

function atualizarBotaoPausa() {
  const botao = document.getElementById("pausar");
  if (botao) botao.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && rodando && !pausado) alternarPausa();
});

function fimDeJogo() {
  rodando = false;
  Retomar.limpar("blocos");
  clearInterval(intervalo);
  const ganhos = Math.max(Math.floor(pontosPartida / 25), 5);
  Pontos.add(ganhos);
  const novoRecorde = pontosPartida > 0 && Recordes.salvar("blocos", pontosPartida);
  Som.erro();
  vibrar(120);
  setTimeout(() => Modal.mostrar({
    emoji: novoRecorde ? "🏆" : "🟦",
    titulo: novoRecorde ? "Novo recorde!" : "Fim de jogo!",
    texto: `${linhasFeitas} linha(s) • +${ganhos} pontos`,
    aoJogarDeNovo: novoJogo,
  }), 400);
}

document.getElementById("btn-esquerda").addEventListener("click", () => mover(-1));
document.getElementById("btn-direita").addEventListener("click", () => mover(1));
document.getElementById("btn-girar").addEventListener("click", girar);
document.getElementById("btn-descer").addEventListener("click", quedaRapida);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") mover(-1);
  else if (e.key === "ArrowRight") mover(1);
  else if (e.key === "ArrowUp") girar();
  else if (e.key === "ArrowDown") descer();
  else if (e.key === " ") { e.preventDefault(); quedaRapida(); }
});

document.getElementById("btn-guardar").addEventListener("click", guardar);
document.getElementById("pausar").addEventListener("click", alternarPausa);
botaoReiniciar.addEventListener("click", () => {
  Retomar.limpar("blocos");
  novoJogo();
});

confirmarSaida(() => rodando && pontosPartida > 0);

{
  const salva = Retomar.carregar("blocos");
  if (salva && confirm("Continuar a partida anterior?")) {
    novoJogo();
    grade = salva.grade;
    pontosPartida = salva.pontos;
    linhasFeitas = salva.linhas;
    pontosPartidaEl.textContent = String(pontosPartida);
    linhasEl.textContent = String(linhasFeitas);
    novaPeca(); // recria a peça já em cima da grade restaurada
    reagendar();
    desenhar();
  } else {
    Retomar.limpar("blocos");
    novoJogo();
  }
}

configurarMelhor("blocos");
