// Nossa torre: o bloco balança no guindaste; toque pra soltar.
// O que passar da beirada é cortado — encaixe perfeito dá bônus!
const ALTURA_BLOCO = 36;
const CORES_BLOCOS = ["#4f8cff", "#6fdf6f", "#ffd54f", "#ff9f4f", "#cf8fff", "#ff6f6f", "#25c8e8"];

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let torre, atual, caindo, cortado, andares, rodando, tempoBalanco;

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
}

window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  const larguraBase = Math.min(tela.width * 0.55, 240);
  torre = [{ x: (tela.width - larguraBase) / 2, w: larguraBase }];
  andares = 0;
  caindo = null;
  cortado = null;
  tempoBalanco = 0;
  rodando = true;
  placarEl.textContent = "0";
  prepararBloco();
  iniciarLaco();
}

function prepararBloco() {
  const topo = torre[torre.length - 1];
  atual = { w: topo.w, y: alturaDoTopo() - ALTURA_BLOCO * 3.2 };
}

function alturaDoTopo() {
  return tela.height - 90 - torre.length * ALTURA_BLOCO + deslocamentoCamera();
}

function deslocamentoCamera() {
  return Math.max(0, torre.length * ALTURA_BLOCO - tela.height * 0.45);
}

function velocidadeBalanco() {
  return 0.028 + andares * 0.0012;
}

function passo() {
  if (!rodando) return;
  tempoBalanco += 1;

  if (caindo) {
    caindo.y += 11;
    const alvoY = tela.height - 90 - (torre.length) * ALTURA_BLOCO + deslocamentoCamera();
    if (caindo.y >= alvoY) {
      assentar(alvoY);
    }
  }

  if (cortado) {
    cortado.y += cortado.vy;
    cortado.vy += 0.5;
    cortado.rot += cortado.vrot;
    if (cortado.y > tela.height + 60) cortado = null;
  }

  desenhar();
}

function posicaoBalanco() {
  const amplitude = (tela.width - atual.w) / 2 - 8;
  return (tela.width - atual.w) / 2 + Math.sin(tempoBalanco * velocidadeBalanco()) * amplitude;
}

function soltar() {
  if (!rodando || caindo) return;
  caindo = { x: posicaoBalanco(), w: atual.w, y: atual.y };
  Som.clique();
}

function assentar(y) {
  const topo = torre[torre.length - 1];
  const esquerda = Math.max(caindo.x, topo.x);
  const direita = Math.min(caindo.x + caindo.w, topo.x + topo.w);
  const sobra = direita - esquerda;

  if (sobra <= 10) {
    // errou feio: o bloco despenca e acabou
    cortado = { x: caindo.x, w: caindo.w, y, vy: 2, rot: 0, vrot: 0.06 };
    caindo = null;
    terminar();
    return;
  }

  const desvio = Math.abs(caindo.x - topo.x);
  if (desvio < 7) {
    // encaixe perfeito: mantém a largura e brilha
    torre.push({ x: topo.x, w: topo.w, perfeito: true });
    Som.vitoria();
    vibrar([30, 20, 30]);
    mensagemEl.textContent = "PERFEITO! ✨";
    mensagemEl.classList.remove("escondida");
    setTimeout(() => mensagemEl.classList.add("escondida"), 900);
  } else {
    // corta o que passou da beirada
    const ladoCortadoX = caindo.x < topo.x ? caindo.x : esquerda + sobra;
    cortado = {
      x: ladoCortadoX,
      w: caindo.w - sobra,
      y,
      vy: 1,
      rot: 0,
      vrot: caindo.x < topo.x ? -0.08 : 0.08,
    };
    torre.push({ x: esquerda, w: sobra });
    Som.acerto();
    vibrar(20);
  }

  andares++;
  placarEl.textContent = String(andares);
  caindo = null;
  prepararBloco();
}

const FASES_CEU = [
  ["#101426", "#1c2340"], // noite
  ["#1a1430", "#3a2448"], // madrugada
  ["#25203f", "#5f3a50"], // amanhecer
  ["#1f2a4f", "#3f5a80"], // dia (alto céu)
];

function desenhar() {
  const fase = FASES_CEU[Math.floor(andares / 10) % FASES_CEU.length];
  const fundo = ctx.createLinearGradient(0, 0, 0, tela.height);
  fundo.addColorStop(0, fase[0]);
  fundo.addColorStop(1, fase[1]);
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, tela.width, tela.height);

  // torre
  torre.forEach((bloco, i) => {
    const y = tela.height - 90 - (i + 1) * ALTURA_BLOCO + deslocamentoCamera();
    if (y > tela.height || y < -ALTURA_BLOCO) return;
    ctx.fillStyle = CORES_BLOCOS[i % CORES_BLOCOS.length];
    ctx.fillRect(bloco.x, y, bloco.w, ALTURA_BLOCO - 3);
    if (bloco.perfeito) {
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.strokeRect(bloco.x + 1, y + 1, bloco.w - 2, ALTURA_BLOCO - 5);
    }
  });

  // chão
  ctx.fillStyle = "#3a3020";
  ctx.fillRect(0, tela.height - 90 + deslocamentoCamera(), tela.width, 90);

  // pedaço cortado despencando
  if (cortado) {
    ctx.save();
    ctx.translate(cortado.x + cortado.w / 2, cortado.y + ALTURA_BLOCO / 2);
    ctx.rotate(cortado.rot);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(-cortado.w / 2, -ALTURA_BLOCO / 2, cortado.w, ALTURA_BLOCO - 3);
    ctx.restore();
  }

  // bloco no guindaste (ou caindo)
  if (rodando) {
    const cor = CORES_BLOCOS[torre.length % CORES_BLOCOS.length];
    if (caindo) {
      ctx.fillStyle = cor;
      ctx.fillRect(caindo.x, caindo.y, caindo.w, ALTURA_BLOCO - 3);
    } else {
      const x = posicaoBalanco();
      // cabo do guindaste
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + atual.w / 2, 0);
      ctx.lineTo(x + atual.w / 2, atual.y);
      ctx.stroke();
      ctx.fillStyle = cor;
      ctx.fillRect(x, atual.y, atual.w, ALTURA_BLOCO - 3);
    }
  }
}

function terminar() {
  rodando = false;
  const ganhos = Math.max(andares * 3, 3);
  Pontos.add(ganhos);
  const novoRecorde = andares > 0 && Recordes.salvar("torre", andares);
  Som.erro();
  vibrar(120);
  setTimeout(() => {
    Modal.mostrar({
      emoji: novoRecorde ? "🏆" : "🏗️",
      titulo: novoRecorde ? "Novo recorde!" : "A torre caiu!",
      texto: `${andares} andar(es) • +${ganhos} pontos`,
      aoJogarDeNovo: novoJogo,
    });
  }, 600);
}

tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  soltar();
}, { passive: false });
tela.addEventListener("mousedown", soltar);
document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    soltar();
  }
});

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
configurarMelhor("torre");
