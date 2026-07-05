// Nosso Hexágono: blocos caem de 6 direções rumo ao centro.
// Gire o hexágono pra juntar 3+ da mesma cor (na pilha ou em volta do anel).
const CORES_HEX = ["#ff6f6f", "#6fdf6f", "#4f8cff", "#ffd54f"];
const ALTURA_CELULA = 22;
const MAX_PILHA = 8;

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const botaoReiniciar = document.getElementById("reiniciar");

let cx, cy, raioHex;
let pilhas; // 6 pilhas de cores, presas ao hexágono (giram junto)
let blocos; // blocos caindo em faixas fixas do mundo
let rotacao; // posição da rotação (0..5)
let anguloVisual; // ângulo animado
let pontosPartida, rodando, cronometroSpawn;

let lacoAtivo = 0;
function iniciarLaco() {
  const meu = ++lacoAtivo;
  const quadro = () => {
    if (meu !== lacoAtivo || !rodando) return;
    passo();
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}


function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
  cx = tela.width / 2;
  cy = tela.height / 2;
  raioHex = Math.min(tela.width, tela.height) * 0.09 + 18;
}

window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  pilhas = Array.from({ length: 6 }, () => []);
  blocos = [];
  rotacao = 0;
  anguloVisual = 0;
  pontosPartida = 0;
  cronometroSpawn = 0;
  rodando = true;
  placarEl.textContent = "0";
  iniciarLaco();
}

function velocidadeQueda() {
  return 1.6 + pontosPartida / 400;
}

function intervaloSpawn() {
  return Math.max(45, 95 - Math.floor(pontosPartida / 60));
}

function passo() {
  if (!rodando) return;

  // anima a rotação suavemente até o ângulo alvo
  const alvo = rotacao * 60;
  let diff = ((alvo - anguloVisual + 540) % 360) - 180;
  anguloVisual = Math.abs(diff) < 3 ? alvo % 360 : (anguloVisual + diff * 0.25 + 360) % 360;

  // novos blocos
  cronometroSpawn++;
  if (cronometroSpawn >= intervaloSpawn()) {
    cronometroSpawn = 0;
    blocos.push({
      faixa: Math.floor(Math.random() * 6),
      dist: Math.max(tela.width, tela.height) * 0.62,
      cor: CORES_HEX[Math.floor(Math.random() * CORES_HEX.length)],
      bomba: Math.random() < 0.04, // raro: limpa a face inteira ao pousar
    });
  }

  // blocos caem rumo ao centro
  for (const b of [...blocos]) {
    b.dist -= velocidadeQueda();
    const face = (b.faixa - rotacao + 600) % 6; // em qual face do hexágono vai pousar
    const alturaPouso = raioHex + pilhas[face].length * ALTURA_CELULA;
    if (b.dist <= alturaPouso) {
      blocos.splice(blocos.indexOf(b), 1);
      if (b.bomba) {
        // bomba: explode a pilha inteira dessa face
        pontosPartida += pilhas[face].length * 15;
        placarEl.textContent = String(pontosPartida);
        pilhas[face] = [];
        Som.vitoria();
        vibrar([40, 30, 40]);
        continue;
      }
      pilhas[face].push(b.cor);
      Som.clique();
      resolverCombinacoes();
      if (pilhas[face].length > MAX_PILHA) {
        terminar();
        return;
      }
    }
  }

  desenhar();
}

function resolverCombinacoes() {
  let combo = 0;
  let removeu = true;

  while (removeu) {
    removeu = false;
    const marcadas = new Set(); // "face:altura"

    // 3+ seguidos da mesma cor na MESMA pilha
    for (let f = 0; f < 6; f++) {
      let inicio = 0;
      while (inicio < pilhas[f].length) {
        let fim = inicio;
        while (fim < pilhas[f].length && pilhas[f][fim] === pilhas[f][inicio]) fim++;
        if (fim - inicio >= 3) {
          for (let a = inicio; a < fim; a++) marcadas.add(f + ":" + a);
        }
        inicio = fim;
      }
    }

    // 3+ faces vizinhas com a mesma cor na MESMA altura (anel)
    for (let altura = 0; altura < MAX_PILHA; altura++) {
      for (let f = 0; f < 6; f++) {
        const cor = pilhas[f][altura];
        if (!cor) continue;
        let seq = 1;
        while (seq < 6 && pilhas[(f + seq) % 6][altura] === cor) seq++;
        if (seq >= 3) {
          for (let k = 0; k < seq; k++) marcadas.add(((f + k) % 6) + ":" + altura);
        }
      }
    }

    if (marcadas.size > 0) {
      removeu = true;
      combo++;
      pontosPartida += marcadas.size * 10 * combo;
      placarEl.textContent = String(pontosPartida);
      Som.acerto();
      vibrar(20 * Math.min(combo, 3));

      // remove de cima pra baixo pra não bagunçar os índices
      const porFace = Array.from({ length: 6 }, () => []);
      marcadas.forEach((chave) => {
        const [f, a] = chave.split(":").map(Number);
        porFace[f].push(a);
      });
      porFace.forEach((alturas, f) => {
        alturas.sort((x, y) => y - x).forEach((a) => pilhas[f].splice(a, 1));
      });
    }
  }
}

function trapezio(anguloCentro, r1, r2, cor, contorno) {
  const a1 = ((anguloCentro - 29) * Math.PI) / 180;
  const a2 = ((anguloCentro + 29) * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1);
  ctx.lineTo(cx + Math.cos(a2) * r1, cy + Math.sin(a2) * r1);
  ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
  ctx.lineTo(cx + Math.cos(a1) * r2, cy + Math.sin(a1) * r2);
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
  if (contorno) {
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function desenhar() {
  ctx.fillStyle = "#10141f";
  ctx.fillRect(0, 0, tela.width, tela.height);

  // linha de perigo
  ctx.strokeStyle = "rgba(255,100,100,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, raioHex + MAX_PILHA * ALTURA_CELULA, 0, Math.PI * 2);
  ctx.stroke();

  // pilhas presas ao hexágono (giram com ele)
  for (let f = 0; f < 6; f++) {
    const angulo = f * 60 + anguloVisual - 90;
    pilhas[f].forEach((cor, altura) => {
      trapezio(
        angulo,
        raioHex + altura * ALTURA_CELULA,
        raioHex + (altura + 1) * ALTURA_CELULA - 2,
        cor,
        true
      );
    });
  }

  // blocos caindo (faixas fixas do mundo)
  blocos.forEach((b) => {
    trapezio(b.faixa * 60 - 90, b.dist, b.dist + ALTURA_CELULA - 2, b.bomba ? "#ffffff" : b.cor, true);
    if (b.bomba) {
      const a = ((b.faixa * 60 - 90) * Math.PI) / 180;
      const r = b.dist + ALTURA_CELULA / 2;
      ctx.fillStyle = "#222";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★", cx + Math.cos(a) * r, cy + Math.sin(a) * r + 4);
    }
  });

  // hexágono central
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + anguloVisual - 60) * Math.PI) / 180;
    const px = cx + Math.cos(a) * raioHex;
    const py = cy + Math.sin(a) * raioHex;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  const corAcento = getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#4f8cff";
  ctx.fillStyle = corAcento;
  ctx.fill();
}

function girar(direcao) {
  if (!rodando) return;
  rotacao = (rotacao + direcao + 6) % 6;
  Som.clique();
}

function terminar() {
  rodando = false;
  const ganhos = Math.max(Math.floor(pontosPartida / 25), 3);
  Pontos.add(ganhos);
  const novoRecorde = pontosPartida > 0 && Recordes.salvar("hexagono", pontosPartida);
  Som.erro();
  vibrar(120);
  setTimeout(() => Modal.mostrar({
    emoji: novoRecorde ? "🏆" : "⬡",
    titulo: novoRecorde ? "Novo recorde!" : "Transbordou!",
    texto: `${pontosPartida} pontos na partida • +${ganhos} pontos`,
    aoJogarDeNovo: novoJogo,
  }), 300);
}

tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  girar(e.touches[0].clientX < tela.width / 2 ? -1 : 1);
}, { passive: false });
tela.addEventListener("mousedown", (e) => girar(e.clientX < tela.width / 2 ? -1 : 1));
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") girar(-1);
  else if (e.key === "ArrowRight") girar(1);
});

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
configurarMelhor("hexagono");
