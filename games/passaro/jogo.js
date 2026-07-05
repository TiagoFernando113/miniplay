// Nosso pássaro voador: toque pra bater as asas, passe entre os canos.
const GRAVIDADE = 0.45;
const IMPULSO = -7.6;
const LARGURA_CANO = 64;

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const botaoReiniciar = document.getElementById("reiniciar");

let passaro, canos, pontosPartida, rodando, comecou, chao;
let rival = null;
let proximoRival = 7;

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
  chao = tela.height - 70;
}

window.addEventListener("resize", () => {
  redimensionar();
  if (passaro) passaro.x = tela.width * 0.28;
  if (!comecou) desenhar();
});

function novoJogo() {
  redimensionar();
  passaro = { x: tela.width * 0.28, y: tela.height * 0.45, vy: 0 };
  canos = [];
  rival = null;
  proximoRival = 7;
  pontosPartida = 0;
  placarEl.textContent = "0";
  rodando = true;
  comecou = false;
  iniciarLaco();
}

function vaoDosCanos() {
  return Math.max(135, 175 - pontosPartida * 1.5);
}

function velocidadeCanos() {
  return Math.min(4.2, 2.6 + pontosPartida * 0.03);
}

function passo() {
  if (!rodando) return;

  if (comecou) {
    passaro.vy += GRAVIDADE;
    passaro.y += passaro.vy;

    // canos avançam e novos surgem
    canos.forEach((c) => (c.x -= velocidadeCanos()));
    const ultimo = canos[canos.length - 1];
    if (!ultimo || ultimo.x < tela.width - 230) {
      const vao = vaoDosCanos();
      const topo = 60 + Math.random() * (chao - vao - 120);
      canos.push({ x: tela.width, topo, base: topo + vao, passou: false });
    }
    canos = canos.filter((c) => c.x > -LARGURA_CANO);

    // pontuação e colisão
    for (const c of canos) {
      if (!c.passou && c.x + LARGURA_CANO < passaro.x) {
        c.passou = true;
        pontosPartida++;
        placarEl.textContent = String(pontosPartida);
        Som.acerto();
        vibrar(15);
      }
      const dentroX = passaro.x + 14 > c.x && passaro.x - 14 < c.x + LARGURA_CANO;
      if (dentroX && (passaro.y - 12 < c.topo || passaro.y + 12 > c.base)) {
        morrer();
        return;
      }
    }

    // pássaro rival: mob que cruza a tela a cada 7 canos
    if (!rival && pontosPartida >= proximoRival) {
      rival = { x: tela.width + 30, y: 80 + Math.random() * (chao - 200) };
      proximoRival += 7;
    }
    if (rival) {
      rival.x -= velocidadeCanos() * 1.7;
      rival.y += Math.sin(Date.now() / 200) * 1.5;
      if (Math.hypot(rival.x - passaro.x, rival.y - passaro.y) < 24) {
        morrer();
        return;
      }
      if (rival.x < -40) rival = null;
    }

    if (passaro.y + 12 > chao || passaro.y < -20) {
      morrer();
      return;
    }
  } else {
    // antes de começar, o pássaro flutua
    passaro.y = tela.height * 0.45 + Math.sin(Date.now() / 300) * 8;
  }

  desenhar();
}

function desenhar() {
  // céu com degradê
  const ceu = ctx.createLinearGradient(0, 0, 0, tela.height);
  ceu.addColorStop(0, "#0d1830");
  ceu.addColorStop(1, "#1a2f50");
  ctx.fillStyle = ceu;
  ctx.fillRect(0, 0, tela.width, tela.height);

  // canos
  ctx.fillStyle = "#3faf5f";
  canos.forEach((c) => {
    ctx.fillRect(c.x, 0, LARGURA_CANO, c.topo);
    ctx.fillRect(c.x, c.base, LARGURA_CANO, chao - c.base);
    ctx.fillStyle = "#2f8f4f";
    ctx.fillRect(c.x - 4, c.topo - 18, LARGURA_CANO + 8, 18);
    ctx.fillRect(c.x - 4, c.base, LARGURA_CANO + 8, 18);
    ctx.fillStyle = "#3faf5f";
  });

  // chão
  ctx.fillStyle = "#4a3a28";
  ctx.fillRect(0, chao, tela.width, tela.height - chao);
  ctx.fillStyle = "#5f4f38";
  const desloc = comecou ? (Date.now() / 4) % 24 : 0;
  for (let x = -desloc; x < tela.width; x += 24) {
    ctx.fillRect(x, chao, 12, 6);
  }

  // pássaro rival (mob vermelho voando ao contrário)
  if (rival) {
    ctx.save();
    ctx.translate(rival.x, rival.y);
    ctx.scale(-1, 1);
    ctx.fillStyle = "#ff5f5f";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(5, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(6, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // pássaro (cor da skin comprada na loja)
  const cor = window.Cosmetico ? Cosmetico.dados("passaro") : "#ffd54f";
  const inclinacao = comecou ? Math.max(-0.5, Math.min(1.1, passaro.vy / 12)) : 0;
  ctx.save();
  ctx.translate(passaro.x, passaro.y);
  ctx.rotate(inclinacao);
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // asa
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(-4, 2, 7, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // olho e bico
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(6, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(7, -4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff9f4f";
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(21, 2);
  ctx.lineTo(13, 5);
  ctx.fill();
  ctx.restore();
}

function voar() {
  if (!rodando) return;
  comecou = true;
  passaro.vy = IMPULSO;
  Som.clique();
}

function morrer() {
  rodando = false;
  const ganhos = Math.max(pontosPartida * 2, 3);
  Pontos.add(ganhos);
  const novoRecorde = pontosPartida > 0 && Recordes.salvar("passaro", pontosPartida);
  Som.erro();
  vibrar(120);
  setTimeout(() => Modal.mostrar({
    emoji: novoRecorde ? "🏆" : "🐤",
    titulo: novoRecorde ? "Novo recorde!" : "Bateu!",
    texto: `${pontosPartida} cano(s) • +${ganhos} pontos`,
    aoJogarDeNovo: novoJogo,
  }), 300);
}

tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  voar();
}, { passive: false });
tela.addEventListener("mousedown", voar);
document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    voar();
  }
});

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
configurarMelhor("passaro");
