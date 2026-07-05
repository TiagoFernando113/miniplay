// Estilo agar.io completo: joystick, SPLIT (➗), ejetar massa (💨) e vírus.
const MUNDO = 1200;
const CORES_BOTS = ["#ff6f6f", "#6fdf6f", "#ffd54f", "#cf8fff", "#ff9f4f", "#25c8e8"];

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const tamanhoEl = document.getElementById("tamanho");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let celulas = []; // suas bolhas (pode dividir em até 4)
let bots, comidas, virus;
let joystick = null;
let maiorDaPartida = 0;
let proximaFusao = 0;
let relogio = null;
let fimDeJogo = false;

function aleatorio(max) {
  return Math.random() * max;
}

function novaComida(x, y, raio = 3) {
  return { x: x ?? aleatorio(MUNDO), y: y ?? aleatorio(MUNDO), raio };
}

function raioTotal() {
  return Math.sqrt(celulas.reduce((soma, c) => soma + c.raio * c.raio, 0));
}

function centro() {
  const x = celulas.reduce((s, c) => s + c.x, 0) / celulas.length;
  const y = celulas.reduce((s, c) => s + c.y, 0) / celulas.length;
  return { x, y };
}

function novoBot(i) {
  // bots nascem proporcionais a você: sempre tem presa e sempre tem ameaça
  const referencia = celulas.length ? raioTotal() : 14;
  return {
    x: aleatorio(MUNDO),
    y: aleatorio(MUNDO),
    raio: Math.max(6, referencia * (0.5 + aleatorio(0.9))),
    cor: CORES_BOTS[i % CORES_BOTS.length],
    nome: "Bot " + (i + 1),
  };
}

function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
}

window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  celulas = [{ x: MUNDO / 2, y: MUNDO / 2, raio: 12, ix: 0, iy: 0, it: 0 }];
  bots = Array.from({ length: 6 }, (_, i) => novoBot(i));
  comidas = Array.from({ length: 90 }, () => novaComida());
  virus = Array.from({ length: 5 }, () => ({
    x: 120 + aleatorio(MUNDO - 240),
    y: 120 + aleatorio(MUNDO - 240),
    raio: 20,
  }));
  joystick = null;
  maiorDaPartida = 12;
  proximaFusao = 0;
  fimDeJogo = false;
  clearInterval(relogio);
  relogio = setInterval(passo, 33);
}

let avisoTemporizador = null;
function avisar(texto) {
  mensagemEl.textContent = texto;
  mensagemEl.classList.remove("escondida");
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => mensagemEl.classList.add("escondida"), 1800);
}

function velocidade(bolha) {
  return Math.max(1.2, 4.5 - bolha.raio / 22);
}

function moverPara(bolha, x, y) {
  const dx = x - bolha.x;
  const dy = y - bolha.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const v = velocidade(bolha);
  bolha.x = Math.max(0, Math.min(MUNDO, bolha.x + (dx / dist) * v));
  bolha.y = Math.max(0, Math.min(MUNDO, bolha.y + (dy / dist) * v));
}

function come(a, b) {
  return a.raio > b.raio * 1.15 && Math.hypot(a.x - b.x, a.y - b.y) < a.raio;
}

function crescer(bolha, presa) {
  bolha.raio = Math.sqrt(bolha.raio * bolha.raio + presa.raio * presa.raio * 0.8);
}

let ultimaDirecao = { x: 1, y: 0 };

// ➗ dividir: cada bolha grande vira duas, com impulso pra frente
function dividir() {
  if (fimDeJogo) return;
  if (celulas.length >= 4) {
    avisar("Máximo de 4 pedaços!");
    return;
  }
  if (!celulas.some((c) => c.raio >= 24)) {
    avisar("➗ Cresça até 24 pra poder dividir");
    return;
  }
  const dir = ultimaDirecao;

  const novas = [];
  for (const celula of celulas) {
    if (celula.raio < 24 || celulas.length + novas.length >= 4) continue;
    const metade = celula.raio / Math.SQRT2;
    celula.raio = metade;
    novas.push({
      x: celula.x,
      y: celula.y,
      raio: metade,
      ix: dir.x * 10,
      iy: dir.y * 10,
      it: 14,
    });
  }
  if (novas.length) {
    celulas.push(...novas);
    proximaFusao = Date.now() + 9000;
    Som.acerto();
    vibrar(30);
  }
}

// 💨 ejetar massa: perde um pouco de tamanho, cospe comida (e fica mais rápido)
function ejetar() {
  if (fimDeJogo) return;
  const dir = ultimaDirecao;

  let cuspiu = false;
  for (const celula of celulas) {
    if (celula.raio < 10) continue;
    celula.raio = Math.sqrt(celula.raio * celula.raio - 20);
    comidas.push(novaComida(
      celula.x + dir.x * (celula.raio + 14),
      celula.y + dir.y * (celula.raio + 14),
      5
    ));
    cuspiu = true;
  }
  if (cuspiu) Som.clique();
  else avisar("💨 Muito pequeno pra ejetar");
}

function passo() {
  if (fimDeJogo || document.hidden) return;

  // movimento das suas bolhas (joystick + impulso do split)
  for (const celula of celulas) {
    if (celula.it > 0) {
      celula.it--;
      celula.x = Math.max(0, Math.min(MUNDO, celula.x + celula.ix));
      celula.y = Math.max(0, Math.min(MUNDO, celula.y + celula.iy));
    }
    if (joystick && (joystick.dx || joystick.dy)) {
      moverPara(celula, celula.x + joystick.dx * 200, celula.y + joystick.dy * 200);
    }
  }

  // fusão: depois do tempo, as bolhas se juntam de novo
  if (celulas.length > 1 && Date.now() > proximaFusao && proximaFusao > 0) {
    const c = centro();
    celulas = [{ x: c.x, y: c.y, raio: raioTotal(), ix: 0, iy: 0, it: 0 }];
    Som.clique();
  }

  // bots: perseguem presa menor mais próxima, fogem do maior próximo
  bots.forEach((bot) => {
    let perto = null;
    let distPerto = Infinity;
    let ameaca = null;
    // se você tá apanhando (3 mortes cedo seguidas), os bots caçam menos
    const alivio = parseInt(localStorage.getItem("bolhasDerrotas") || "0", 10) >= 3;
    let distAmeaca = 180;
    const alcanceCaca = alivio ? 190 : 250;

    const todos = [...celulas, ...bots.filter((b) => b !== bot)];
    todos.forEach((outro) => {
      const d = Math.hypot(outro.x - bot.x, outro.y - bot.y);
      if (outro.raio * 1.15 < bot.raio && d < distPerto) {
        perto = outro;
        distPerto = d;
      }
      if (outro.raio > bot.raio * 1.15 && d < distAmeaca) {
        ameaca = outro;
        distAmeaca = d;
      }
    });

    if (ameaca) {
      moverPara(bot, bot.x * 2 - ameaca.x, bot.y * 2 - ameaca.y);
    } else if (perto && distPerto < alcanceCaca) {
      moverPara(bot, perto.x, perto.y);
    } else {
      let comidaPerto = null;
      let d = Infinity;
      comidas.forEach((c) => {
        const dc = Math.hypot(c.x - bot.x, c.y - bot.y);
        if (dc < d) {
          d = dc;
          comidaPerto = c;
        }
      });
      if (comidaPerto) moverPara(bot, comidaPerto.x, comidaPerto.y);
    }
  });

  // comer comidas
  const comedores = [...celulas, ...bots];
  comidas = comidas.filter((c) => {
    for (const b of comedores) {
      if (Math.hypot(b.x - c.x, b.y - c.y) < b.raio) {
        crescer(b, c);
        if (celulas.includes(b)) Som.clique();
        return false;
      }
    }
    return true;
  });
  while (comidas.length < 90) comidas.push(novaComida());

  // vírus: bolha grande que encosta estoura e espalha comida
  for (const v of virus) {
    for (const celula of [...celulas, ...bots]) {
      if (celula.raio > 26 && Math.hypot(celula.x - v.x, celula.y - v.y) < celula.raio) {
        const perdido = celula.raio * 0.35;
        celula.raio *= 0.65;
        for (let n = 0; n < 8; n++) {
          const angulo = (n / 8) * Math.PI * 2;
          comidas.push(novaComida(
            v.x + Math.cos(angulo) * (perdido + 20),
            v.y + Math.sin(angulo) * (perdido + 20),
            5
          ));
        }
        v.x = 120 + aleatorio(MUNDO - 240);
        v.y = 120 + aleatorio(MUNDO - 240);
        if (celulas.includes(celula)) {
          Som.erro();
          vibrar(60);
          mensagemEl.textContent = "💥 Vírus! Você estourou e perdeu massa";
          mensagemEl.classList.remove("escondida");
          setTimeout(() => mensagemEl.classList.add("escondida"), 2000);
        }
      }
    }
  }

  // você come bots / bots comem você
  for (const bot of [...bots]) {
    let botComido = false;
    for (const celula of celulas) {
      if (come(celula, bot)) {
        crescer(celula, bot);
        Som.acerto();
        vibrar(30);
        bots[bots.indexOf(bot)] = novoBot(bots.indexOf(bot));
        botComido = true;
        break;
      }
    }
    if (botComido) continue;

    for (const celula of [...celulas]) {
      if (come(bot, celula)) {
        crescer(bot, celula);
        celulas.splice(celulas.indexOf(celula), 1);
        Som.erro();
        vibrar(80);
        if (celulas.length === 0) {
          perder();
          return;
        }
      }
    }
  }

  // bots se comem entre si
  for (const a of bots) {
    for (const b of bots) {
      if (a !== b && come(a, b)) {
        crescer(a, b);
        bots[bots.indexOf(b)] = novoBot(bots.indexOf(b));
      }
    }
  }

  const total = Math.floor(raioTotal());
  maiorDaPartida = Math.max(maiorDaPartida, total);
  tamanhoEl.textContent = String(total);
  if (total > (Recordes.get("bolhas") || 0)) {
    Recordes.salvar("bolhas", total);
  }

  desenhar();
}

function desenhar() {
  ctx.fillStyle = "#0d1420";
  ctx.fillRect(0, 0, tela.width, tela.height);

  const c = centro();
  const cx = tela.width / 2 - c.x;
  const cy = tela.height / 2 - c.y;

  ctx.strokeStyle = "#2a3a4a";
  ctx.lineWidth = 4;
  ctx.strokeRect(cx, cy, MUNDO, MUNDO);

  comidas.forEach((comida) => {
    ctx.fillStyle = "#8fb8c8";
    ctx.beginPath();
    ctx.arc(comida.x + cx, comida.y + cy, comida.raio, 0, Math.PI * 2);
    ctx.fill();
  });

  // vírus espinhosos
  virus.forEach((v) => {
    ctx.strokeStyle = "#4faf4f";
    ctx.fillStyle = "#1f4f1f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x + cx, v.y + cy, v.raio, 0, Math.PI * 2);
    ctx.fill();
    for (let n = 0; n < 12; n++) {
      const angulo = (n / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(v.x + cx + Math.cos(angulo) * v.raio, v.y + cy + Math.sin(angulo) * v.raio);
      ctx.lineTo(v.x + cx + Math.cos(angulo) * (v.raio + 6), v.y + cy + Math.sin(angulo) * (v.raio + 6));
      ctx.stroke();
    }
  });

  bots.forEach((b) => {
    ctx.fillStyle = b.cor;
    ctx.beginPath();
    ctx.arc(b.x + cx, b.y + cy, b.raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(10, Math.floor(b.raio * 0.6))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(Math.floor(b.raio)), b.x + cx, b.y + cy + 4);
  });

  const corBolha = window.Cosmetico ? Cosmetico.dados("bolha") : "#4f8cff";
  celulas.forEach((celula) => {
    ctx.fillStyle = corBolha;
    ctx.beginPath();
    ctx.arc(celula.x + cx, celula.y + cy, celula.raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(11, Math.floor(celula.raio * 0.6))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(Math.floor(celula.raio)), celula.x + cx, celula.y + cy + 4);
  });

  // placar ao vivo: quem é o maior do aquário
  const ranking = [
    { nome: "Você", raio: raioTotal(), sou: true },
    ...bots.map((b) => ({ nome: b.nome, raio: b.raio })),
  ].sort((a, b) => b.raio - a.raio);

  ctx.textAlign = "right";
  ctx.font = "bold 13px sans-serif";
  ranking.forEach((r, i) => {
    ctx.fillStyle = r.sou ? "#ffd54f" : "rgba(255,255,255,0.75)";
    ctx.fillText(`${i + 1}º ${r.nome} — ${Math.floor(r.raio)}`, tela.width - 10, 64 + i * 18);
  });

  // minimapa: visão geral do aquário
  {
    const M = 74;
    const mx = 10;
    const my = tela.height - M - 10;
    const esc = M / MUNDO;
    ctx.fillStyle = "rgba(10, 16, 26, 0.7)";
    ctx.fillRect(mx, my, M, M);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, M, M);
    virus.forEach((v) => {
      ctx.fillStyle = "#4faf4f";
      ctx.fillRect(mx + v.x * esc - 1.5, my + v.y * esc - 1.5, 3, 3);
    });
    bots.forEach((b) => {
      ctx.fillStyle = b.cor;
      ctx.fillRect(mx + b.x * esc - 2, my + b.y * esc - 2, 4, 4);
    });
    celulas.forEach((celula) => {
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(mx + celula.x * esc - 2.5, my + celula.y * esc - 2.5, 5, 5);
    });
  }

  if (joystick) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(joystick.bx, joystick.by, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(joystick.kx, joystick.ky, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function perder(bot) {
  fimDeJogo = true;
  clearInterval(relogio);
  const derrotas = parseInt(localStorage.getItem("bolhasDerrotas") || "0", 10);
  localStorage.setItem("bolhasDerrotas", String(maiorDaPartida < 25 ? derrotas + 1 : 0));
  const ganhos = Math.max(Math.floor(maiorDaPartida / 2), 3);
  Pontos.add(ganhos);
  Som.erro();
  vibrar(120);
  setTimeout(() => Modal.mostrar({
    emoji: "😋",
    titulo: "Você foi engolido!",
    texto: `Maior tamanho desta partida: ${maiorDaPartida} • +${ganhos} pontos`,
    aoJogarDeNovo: novoJogo,
  }), 300);
}

// joystick virtual: encosta o dedo em qualquer lugar e arrasta pra direção
function posicaoNaTela(evento) {
  const retangulo = tela.getBoundingClientRect();
  const escala = tela.width / retangulo.width;
  const toque = evento.touches?.[0] || evento.changedTouches?.[0] || evento;
  return {
    x: (toque.clientX - retangulo.left) * escala,
    y: (toque.clientY - retangulo.top) * escala,
  };
}

function abrirJoystick(evento) {
  evento.preventDefault();
  const p = posicaoNaTela(evento);
  joystick = { bx: p.x, by: p.y, kx: p.x, ky: p.y, dx: 0, dy: 0 };
}

function moverJoystick(evento) {
  if (!joystick) return;
  evento.preventDefault();
  const p = posicaoNaTela(evento);
  let dx = p.x - joystick.bx;
  let dy = p.y - joystick.by;
  const dist = Math.hypot(dx, dy);
  const RAIO_JOY = 46;
  if (dist > RAIO_JOY) {
    dx = (dx / dist) * RAIO_JOY;
    dy = (dy / dist) * RAIO_JOY;
  }
  joystick.kx = joystick.bx + dx;
  joystick.ky = joystick.by + dy;
  joystick.dx = dist > 8 ? dx / RAIO_JOY : 0;
  joystick.dy = dist > 8 ? dy / RAIO_JOY : 0;
  if (joystick.dx || joystick.dy) {
    ultimaDirecao = { x: joystick.dx, y: joystick.dy };
  }
}

function fecharJoystick(evento) {
  evento.preventDefault();
  joystick = null;
}

tela.addEventListener("touchstart", abrirJoystick, { passive: false });
tela.addEventListener("touchmove", moverJoystick, { passive: false });
tela.addEventListener("touchend", fecharJoystick, { passive: false });
tela.addEventListener("mousedown", abrirJoystick);
tela.addEventListener("mousemove", (e) => { if (e.buttons) moverJoystick(e); });
tela.addEventListener("mouseup", fecharJoystick);

function ligarBotao(id, acao) {
  const botao = document.getElementById(id);
  botao.addEventListener("click", acao);
  botao.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    acao();
  }, { passive: false });
}
ligarBotao("btn-dividir", dividir);
ligarBotao("btn-ejetar", ejetar);

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();

configurarMelhor("bolhas");
