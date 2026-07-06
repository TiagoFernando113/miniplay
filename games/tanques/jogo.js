// Tanques — arena estilo diep.io: farme as formas pra subir de nível, evolua
// de classe (gêmeo, sniper, metralhadora...), e mate os outros tanques (bots).
// Ranking do mais forte na tela. Morreu = fim do run.
const MUNDO = 2000;
const NUM_BOTS = 9;

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const nivelEl = document.getElementById("nivel");
const ondaEl = document.getElementById("onda");
const placarEl = document.getElementById("placar");
const painelUp = document.getElementById("painel-upgrade");

// ---- classes (evoluções) ----
const CLASSES = {
  basico:       { nome: "Básico",         canos: [{ a: 0 }],                                              dano: 1,    cad: 1,    alc: 1,   velB: 1 },
  gemeo:        { nome: "Gêmeo",          canos: [{ off: -9 }, { off: 9 }],                               dano: 0.85, cad: 0.72, alc: 1,   velB: 1 },
  metralhadora: { nome: "Metralhadora",   canos: [{ a: 0, largura: 12 }],                                 dano: 0.6,  cad: 0.42, alc: 0.9, velB: 1, espalha: 0.26 },
  sniper:       { nome: "Franco-atirador",canos: [{ a: 0, largura: 7 }],                                  dano: 2.1,  cad: 1.8,  alc: 1.9, velB: 1.5 },
  triplo:       { nome: "Triplo",         canos: [{ a: -0.28 }, { a: 0 }, { a: 0.28 }],                   dano: 0.8,  cad: 0.9,  alc: 1,   velB: 1 },
  destruidor:   { nome: "Destruidor",     canos: [{ a: 0, largura: 20 }],                                 dano: 3.4,  cad: 2.4,  alc: 1.1, velB: 0.85 },
  penta:        { nome: "Penta",          canos: [{ a: -0.5 }, { a: -0.25 }, { a: 0 }, { a: 0.25 }, { a: 0.5 }], dano: 0.7, cad: 1, alc: 1, velB: 1 },
};
const EVOLUCOES = { 5: ["gemeo", "metralhadora", "sniper"], 12: ["triplo", "destruidor", "penta"] };

const MELHORIAS = [
  { nome: "Dano +25%", desc: "Tiros mais fortes", aplicar: (t) => (t.dano *= 1.25) },
  { nome: "Cadência +20%", desc: "Atira mais rápido", aplicar: (t) => (t.cadencia *= 0.83) },
  { nome: "Vida +50", desc: "Aguenta mais", aplicar: (t) => { t.vidaMax += 50; t.vida += 50; } },
  { nome: "Velocidade +18%", desc: "Anda mais rápido", aplicar: (t) => (t.velocidade *= 1.18) },
  { nome: "Regeneração", desc: "Recupera vida", aplicar: (t) => (t.regen += 0.07) },
  { nome: "Bala veloz", desc: "+velocidade/alcance", aplicar: (t) => { t.velBala *= 1.2; t.alcance *= 1.12; } },
  { nome: "Roubo de vida", desc: "Cura ao matar", aplicar: (t) => (t.roubo += 4) },
];

const NOMES_BOT = ["Rex", "Nova", "Zé", "Kira", "Bolt", "Duda", "Max", "Yuki", "Tato", "Lia", "Vov", "Pip"];
const CORES = ["#ff6f6f", "#6fbfff", "#ffd54f", "#cf8fff", "#6fdf9f", "#ff9f4f", "#25c8e8", "#ff7fbf"];

let jogador, tanques, formas, balas, particulas, rodando, pausadoUpgrade, laco = 0;
let joystick = null;

function corTanque() { return window.Cosmetico && Cosmetico.dados("bolha") ? Cosmetico.dados("bolha") : "#4faf4f"; }
function redimensionar() { tela.width = window.innerWidth; tela.height = window.innerHeight; }
window.addEventListener("resize", redimensionar);

function novoTanque(x, y, cor, nome, sou) {
  return {
    x, y, ang: 0, raio: 22, cor, nome, sou,
    vida: 100, vidaMax: 100, regen: 0,
    dano: 11, cadencia: 24, recarga: 0, velocidade: sou ? 3.3 : 2.7,
    velBala: 7.5, alcance: 330, roubo: 0,
    classe: CLASSES.basico, classeId: "basico",
    nivel: 1, xp: 0, xpProx: 10, score: 0, vivo: true, prot: 90,
    rumo: Math.random() * Math.PI * 2,
  };
}

function novaForma() {
  const r = Math.random();
  const tipo = r < 0.55 ? "quadrado" : r < 0.85 ? "triangulo" : "penta";
  const dados = {
    quadrado: { lados: 4, raio: 15, vida: 18, xp: 3, cor: "#ffd54f", vel: 0.9, dano: 0.10 },
    triangulo: { lados: 3, raio: 18, vida: 30, xp: 7, cor: "#ff6f6f", vel: 1.3, dano: 0.16 },
    penta: { lados: 5, raio: 25, vida: 80, xp: 18, cor: "#6f8fff", vel: 0.7, dano: 0.24 },
  }[tipo];
  // espalhada aleatoriamente pelo mapa (feito bolinha de XP), longe do jogador
  let x, y, tent = 0;
  do { x = Math.random() * MUNDO; y = Math.random() * MUNDO; tent++; }
  while (tent < 12 && jogador && Math.hypot(jogador.x - x, jogador.y - y) < 340);
  return {
    x, y, lados: dados.lados, raio: dados.raio, vida: dados.vida, vidaMax: dados.vida,
    xp: dados.xp, cor: dados.cor, vel: dados.vel, dano: dados.dano, aggro: 210,
    rumo: Math.random() * Math.PI * 2,
    ang: Math.random() * Math.PI * 2, giro: (Math.random() - 0.5) * 0.04,
  };
}

function botLonge() {
  let x, y, t = 0;
  do { x = Math.random() * MUNDO; y = Math.random() * MUNDO; t++; }
  while (t < 20 && jogador && Math.hypot(jogador.x - x, jogador.y - y) < 400);
  const i = tanques ? tanques.length : 0;
  return novoTanque(x, y, CORES[i % CORES.length], NOMES_BOT[i % NOMES_BOT.length], false);
}

function novoJogo() {
  redimensionar();
  jogador = novoTanque(MUNDO / 2, MUNDO / 2, corTanque(), Nuvem ? Nuvem.apelido() : "Você", true);
  tanques = [jogador];
  for (let i = 0; i < NUM_BOTS; i++) tanques.push(botLonge());
  formas = Array.from({ length: 70 }, novaForma);
  balas = []; particulas = [];
  rodando = true; pausadoUpgrade = false; joystick = null;
  painelUp.style.display = "none"; painelUp.innerHTML = "";
  atualizarHud();
  if (!laco) iniciarLaco();
}

function iniciarLaco() {
  const meu = ++laco;
  let ultimo = performance.now(), acc = 0;
  const quadro = (agora) => {
    if (meu !== laco) return;
    acc += agora - ultimo; ultimo = agora;
    let n = 0;
    while (acc >= 16.7 && n < 4) { if (rodando && !pausadoUpgrade && !document.hidden) passo(); acc -= 16.7; n++; }
    if (acc > 120) acc = 0;
    desenhar();
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

function alvoDe(t) {
  // tanque: mira em inimigo perto (mais fraco preferido) ou forma mais próxima
  let melhorTanque = null, dt = 460;
  tanques.forEach((o) => {
    if (o === t || !o.vivo) return;
    const d = Math.hypot(o.x - t.x, o.y - t.y);
    if (d < dt) { dt = d; melhorTanque = o; }
  });
  let melhorForma = null, df = t.alcance;
  formas.forEach((f) => {
    const d = Math.hypot(f.x - t.x, f.y - t.y);
    if (d < df) { df = d; melhorForma = f; }
  });
  return { tanque: melhorTanque, forma: melhorForma };
}

function atirar(t, ang) {
  const cl = t.classe;
  const perp = ang + Math.PI / 2;
  cl.canos.forEach((c) => {
    const espalha = cl.espalha ? (Math.random() - 0.5) * cl.espalha : 0;
    const a = ang + (c.a || 0) + espalha;
    const ox = Math.cos(perp) * (c.off || 0), oy = Math.sin(perp) * (c.off || 0);
    balas.push({
      x: t.x + Math.cos(ang) * (t.raio + 4) + ox,
      y: t.y + Math.sin(ang) * (t.raio + 4) + oy,
      vx: Math.cos(a) * t.velBala * cl.velB, vy: Math.sin(a) * t.velBala * cl.velB,
      vida: (t.alcance * cl.alc) / (t.velBala * cl.velB), dano: t.dano * cl.dano, dono: t,
    });
  });
  if (t.sou) Som.clique();
}

function explodir(x, y, cor, n) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 1 + Math.random() * 3; particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 18, cor }); }
}

function passo() {
  // ---- jogador: move no joystick ----
  if (joystick && (joystick.dx || joystick.dy)) {
    const a = Math.atan2(joystick.dy, joystick.dx);
    jogador.x += Math.cos(a) * jogador.velocidade; jogador.y += Math.sin(a) * jogador.velocidade;
  }
  jogador.x = Math.max(0, Math.min(MUNDO, jogador.x));
  jogador.y = Math.max(0, Math.min(MUNDO, jogador.y));

  // ---- cada tanque age (mira, atira, bots andam) ----
  tanques.forEach((t) => {
    if (!t.vivo) return;
    if (t.prot > 0) t.prot--;
    if (t.regen && t.vida < t.vidaMax) t.vida = Math.min(t.vidaMax, t.vida + t.regen);
    const alvo = alvoDe(t);
    let alvoMira = null;
    if (alvo.tanque) alvoMira = alvo.tanque; else if (alvo.forma) alvoMira = alvo.forma;

    if (!t.sou) {
      // bot: decide andar
      let destino = alvo.forma;
      if (alvo.tanque) {
        const maisFraco = alvo.tanque.score <= t.score;
        destino = maisFraco ? alvo.tanque : null; // foge do mais forte
        if (!maisFraco) { // afasta
          const a = Math.atan2(t.y - alvo.tanque.y, t.x - alvo.tanque.x);
          t.x += Math.cos(a) * t.velocidade; t.y += Math.sin(a) * t.velocidade;
        }
      }
      if (destino) {
        const a = Math.atan2(destino.y - t.y, destino.x - t.x);
        const d = Math.hypot(destino.x - t.x, destino.y - t.y);
        if (d > t.raio + 30) { t.x += Math.cos(a) * t.velocidade; t.y += Math.sin(a) * t.velocidade; }
      } else if (!alvo.tanque) {
        t.x += Math.cos(t.rumo) * t.velocidade * 0.5; t.y += Math.sin(t.rumo) * t.velocidade * 0.5;
        if (Math.random() < 0.01) t.rumo = Math.random() * 6.28;
      }
      t.x = Math.max(0, Math.min(MUNDO, t.x)); t.y = Math.max(0, Math.min(MUNDO, t.y));
    }

    // mira: jogador com joystick direito mira à mão e atira sempre; bots e auto usam alvo
    if (t.sou && mira && (mira.dx || mira.dy)) {
      t.ang = Math.atan2(mira.dy, mira.dx);
      t.recarga--;
      if (t.recarga <= 0 && t.prot <= 0) { atirar(t, t.ang); t.recarga = t.cadencia * t.classe.cad; }
    } else if (alvoMira) {
      t.ang = Math.atan2(alvoMira.y - t.y, alvoMira.x - t.x);
      t.recarga--;
      if (t.recarga <= 0 && t.prot <= 0) { atirar(t, t.ang); t.recarga = t.cadencia * t.classe.cad; }
    } else if (t.recarga > 0) t.recarga--;
  });

  // ---- formas: paradas/vagando; atacam o tanque mais próximo só se ele chega perto ----
  formas.forEach((f) => {
    f.ang += f.giro;
    // acha o tanque mais próximo
    let perto = null, dp = 1e9;
    for (const t of tanques) { if (!t.vivo) continue; const d = Math.hypot(t.x - f.x, t.y - f.y); if (d < dp) { dp = d; perto = t; } }
    if (perto && dp < f.aggro) {
      // acordou: persegue e morde
      const a = Math.atan2(perto.y - f.y, perto.x - f.x);
      f.x += Math.cos(a) * f.vel; f.y += Math.sin(a) * f.vel;
      if (dp < f.raio + perto.raio && perto.prot <= 0) {
        perto.vida -= f.dano;
        if (perto.vida <= 0) matarTanque(perto, null);
      }
    } else {
      // dormindo: vaga bem devagar
      f.x += Math.cos(f.rumo) * 0.2; f.y += Math.sin(f.rumo) * 0.2;
      if (Math.random() < 0.005) f.rumo = Math.random() * 6.283;
      f.x = Math.max(0, Math.min(MUNDO, f.x)); f.y = Math.max(0, Math.min(MUNDO, f.y));
    }
  });

  // ---- balas ----
  balas = balas.filter((b) => {
    b.x += b.vx; b.y += b.vy; b.vida--;
    // formas
    for (const f of formas) {
      if (Math.hypot(b.x - f.x, b.y - f.y) < f.raio) {
        f.vida -= b.dano; explodir(b.x, b.y, f.cor, 2);
        if (f.vida <= 0) { darXp(b.dono, f.xp); formas[formas.indexOf(f)] = novaForma(); }
        return false;
      }
    }
    // tanques (menos o dono)
    for (const t of tanques) {
      if (t === b.dono || !t.vivo || t.prot > 0) continue;
      if (Math.hypot(b.x - t.x, b.y - t.y) < t.raio) {
        t.vida -= b.dano; explodir(b.x, b.y, t.cor, 3);
        if (t.vida <= 0) matarTanque(t, b.dono);
        return false;
      }
    }
    return b.vida > 0;
  });

  particulas = particulas.filter((p) => { p.x += p.vx; p.y += p.vy; p.vida--; return p.vida > 0; });
}

function darXp(t, q) {
  if (!t || !t.vivo) return;
  t.score += q; t.xp += q;
  while (t.xp >= t.xpProx) {
    t.xp -= t.xpProx; t.nivel++;
    t.xpProx = Math.floor(t.xpProx * 1.3 + 6);
    t.vidaMax += 8; t.vida += 8; t.dano *= 1.03;
    t.raio = Math.min(40, 22 + t.nivel * 0.5);
    subirNivel(t);
  }
  if (t.sou) atualizarHud();
}

function matarTanque(t, autor) {
  t.vivo = false;
  explodir(t.x, t.y, t.cor, 18);
  if (autor && autor.vivo) {
    autor.score += 20 + Math.floor(t.score * 0.3);
    if (autor.roubo) autor.vida = Math.min(autor.vidaMax, autor.vida + autor.roubo * 4);
    darXp(autor, 40 + Math.floor(t.nivel * 8)); // matar tank = muito XP
  }
  if (t.sou) { Som.erro(); vibrar(150); morrer(); return; }
  Som.acerto();
  // bot renasce fraco depois de um tempo (mantém a arena cheia)
  setTimeout(() => {
    if (!rodando) return;
    const novo = botLonge();
    const idx = tanques.indexOf(t);
    if (idx >= 0) tanques[idx] = novo; else tanques.push(novo);
  }, 2500);
}

function subirNivel(t) {
  if (!t.sou) return;
  Som.vitoria(); vibrar(50);
  atualizarHud();
  // evolução de classe nos níveis-chave (se ainda não pegou)
  let opcoes;
  const evo = EVOLUCOES[t.nivel];
  if (evo && t.classeId === "basico" || (evo && t.nivel === 12 && ["gemeo", "metralhadora", "sniper"].includes(t.classeId))) {
    opcoes = evo.map((cid) => ({
      nome: CLASSES[cid].nome, desc: "Nova classe!", classe: cid,
      aplicar: (tt) => { tt.classe = CLASSES[cid]; tt.classeId = cid; },
    }));
  } else {
    opcoes = embaralhar([...MELHORIAS]).slice(0, 3);
  }
  pausadoUpgrade = true;
  painelUp.style.display = "flex";
  painelUp.innerHTML = `<div class="up-caixa"><h2>Nível ${t.nivel}! Escolha</h2><div class="up-cartoes"></div></div>`;
  const cont = painelUp.querySelector(".up-cartoes");
  opcoes.forEach((m) => {
    const b = document.createElement("button");
    b.className = "up-cartao" + (m.classe ? " classe" : "");
    b.innerHTML = `<span class="up-nome">${m.nome}</span><span class="up-desc">${m.desc}</span>`;
    b.addEventListener("click", () => { m.aplicar(t); painelUp.style.display = "none"; painelUp.innerHTML = ""; pausadoUpgrade = false; Som.clique(); });
    cont.appendChild(b);
  });
}

function atualizarHud() { nivelEl.textContent = jogador.nivel; ondaEl.textContent = jogador.classe.nome; placarEl.textContent = jogador.score; }

function morrer() {
  rodando = false;
  const pontos = jogador.nivel * 6 + Math.floor(jogador.score * 0.1);
  Pontos.add(pontos);
  const rec = Recordes.salvar("tanques", jogador.nivel);
  if (window.Missoes) Missoes.partida();
  if (window.Stats) Stats.partida();
  telaDeMorte(rec, pontos);
}

let contagemMorte = null;
function telaDeMorte(recorde, pontos) {
  const f = document.createElement("div");
  f.className = "modal-fundo visivel"; f.id = "tela-morte";
  f.innerHTML = `<div class="modal-caixa">
    <div class="modal-emoji">${recorde ? "🏆" : "💥"}</div>
    <h2>${recorde ? "Novo recorde!" : "Seu tanque explodiu!"}</h2>
    <p>Nível ${jogador.nivel} (${jogador.classe.nome}) • score ${jogador.score} • +${pontos} pontos</p>
    <button class="btn" id="m-jogar">Jogar de novo</button>
    <p style="color:var(--text-dim);font-size:0.85rem;margin:12px 0 0;">voltando em <strong id="m-cont">10</strong>s...</p>
    <button class="btn secundario" id="m-lobby" style="width:100%;margin-top:10px;">Menu</button>
  </div>`;
  document.body.appendChild(f);
  const fechar = () => { clearInterval(contagemMorte); f.remove(); };
  f.querySelector("#m-jogar").addEventListener("click", () => { fechar(); novoJogo(); });
  f.querySelector("#m-lobby").addEventListener("click", () => { fechar(); abrirLobby(); });
  let r = 10;
  contagemMorte = setInterval(() => { r--; const el = document.getElementById("m-cont"); if (el) el.textContent = r; if (r <= 0) { fechar(); novoJogo(); } }, 1000);
}

function desenharForma(f, cx, cy) {
  const sx = f.x - jogador.x + cx, sy = f.y - jogador.y + cy;
  if (sx < -40 || sx > tela.width + 40 || sy < -40 || sy > tela.height + 40) return;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(f.ang);
  ctx.fillStyle = f.cor; ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < f.lados; i++) { const a = (i / f.lados) * 6.283; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * f.raio, Math.sin(a) * f.raio); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (f.vida < f.vidaMax) { ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(sx - f.raio, sy - f.raio - 7, f.raio * 2, 3); ctx.fillStyle = "#6fdf6f"; ctx.fillRect(sx - f.raio, sy - f.raio - 7, f.raio * 2 * (f.vida / f.vidaMax), 3); }
}

function desenharTanque(t, cx, cy) {
  if (!t.vivo) return;
  const sx = t.x - jogador.x + cx, sy = t.y - jogador.y + cy;
  if (sx < -60 || sx > tela.width + 60 || sy < -60 || sy > tela.height + 60) return;
  ctx.save(); ctx.translate(sx, sy);
  ctx.globalAlpha = t.prot > 0 ? 0.55 : 1;
  // canos (cinza), girados pela mira
  ctx.rotate(t.ang);
  t.classe.canos.forEach((c) => {
    ctx.save(); ctx.rotate(c.a || 0);
    ctx.fillStyle = "#8a97a8"; ctx.strokeStyle = "#5a6675"; ctx.lineWidth = 2;
    const larg = c.largura || 10;
    ctx.fillRect(0, (c.off || 0) - larg / 2, t.raio + 18, larg);
    ctx.strokeRect(0, (c.off || 0) - larg / 2, t.raio + 18, larg);
    ctx.restore();
  });
  ctx.rotate(-t.ang);
  // corpo (círculo com contorno grosso = cara de tanque)
  ctx.fillStyle = t.cor; ctx.strokeStyle = t.sou ? "#ffffff" : "#0d1420"; ctx.lineWidth = t.sou ? 4 : 3;
  ctx.beginPath(); ctx.arc(0, 0, t.raio, 0, 6.283); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
  // nome + vida
  ctx.textAlign = "center";
  ctx.fillStyle = t.sou ? "#ffd54f" : "rgba(255,255,255,0.7)";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(`${t.nome} (${t.nivel})`, sx, sy - t.raio - 12);
  if (t.vida < t.vidaMax) { ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(sx - t.raio, sy - t.raio - 6, t.raio * 2, 4); ctx.fillStyle = "#6fdf6f"; ctx.fillRect(sx - t.raio, sy - t.raio - 6, t.raio * 2 * (t.vida / t.vidaMax), 4); }
}

function desenhar() {
  if (!jogador) return;
  ctx.fillStyle = "#12202f"; ctx.fillRect(0, 0, tela.width, tela.height);
  const cx = tela.width / 2, cy = tela.height / 2;
  // fundo fora do mundo mais escuro
  ctx.fillStyle = "#0d1826";
  const bx = -jogador.x + cx, by = -jogador.y + cy;
  ctx.fillRect(bx, by, MUNDO, MUNDO);
  // grade
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
  for (let x = 0; x <= MUNDO; x += 64) { const px = x + bx; if (px >= 0 && px <= tela.width) { ctx.beginPath(); ctx.moveTo(px, Math.max(0, by)); ctx.lineTo(px, Math.min(tela.height, by + MUNDO)); ctx.stroke(); } }
  for (let y = 0; y <= MUNDO; y += 64) { const py = y + by; if (py >= 0 && py <= tela.height) { ctx.beginPath(); ctx.moveTo(Math.max(0, bx), py); ctx.lineTo(Math.min(tela.width, bx + MUNDO), py); ctx.stroke(); } }

  formas.forEach((f) => desenharForma(f, cx, cy));
  balas.forEach((b) => { const px = b.x - jogador.x + cx, py = b.y - jogador.y + cy; ctx.fillStyle = b.dono === jogador ? "#fff" : "#ff9f6f"; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.283); ctx.fill(); });
  tanques.forEach((t) => { if (t !== jogador) desenharTanque(t, cx, cy); });
  desenharTanque(jogador, cx, cy);
  particulas.forEach((p) => { ctx.globalAlpha = p.vida / 18; ctx.fillStyle = p.cor; ctx.fillRect(p.x - jogador.x + cx - 2, p.y - jogador.y + cy - 2, 4, 4); ctx.globalAlpha = 1; });

  // barras do jogador
  const bw = 200;
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(cx - bw / 2, tela.height - 28, bw, 10);
  ctx.fillStyle = jogador.vida > jogador.vidaMax * 0.3 ? "#6fdf6f" : "#ff6f6f"; ctx.fillRect(cx - bw / 2, tela.height - 28, bw * (jogador.vida / jogador.vidaMax), 10);
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(cx - bw / 2, tela.height - 15, bw, 6);
  ctx.fillStyle = "#25c8e8"; ctx.fillRect(cx - bw / 2, tela.height - 15, bw * (jogador.xp / jogador.xpProx), 6);

  // ranking dos mais fortes (top 6)
  const rank = [...tanques].filter((t) => t.vivo).sort((a, b) => b.score - a.score).slice(0, 6);
  ctx.textAlign = "right"; ctx.font = "bold 12px sans-serif";
  rank.forEach((t, i) => { ctx.fillStyle = t.sou ? "#ffd54f" : "rgba(255,255,255,0.65)"; ctx.fillText(`${i + 1}º ${t.nome} — ${t.score}`, tela.width - 10, 74 + i * 17); });

  [joystick, mira].forEach((joy, i) => {
    if (!joy) return;
    ctx.strokeStyle = i ? "rgba(255,150,80,0.5)" : "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joy.bx, joy.by, 46, 0, 6.283); ctx.stroke();
    ctx.fillStyle = i ? "rgba(255,150,80,0.55)" : "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.arc(joy.kx, joy.ky, 20, 0, 6.283); ctx.fill();
  });
}

// controle twin-stick: metade esquerda anda, metade direita mira e atira
let mira = null; // {bx,by,kx,ky,dx,dy}
function fazerJoy(bx, by) { return { bx, by, kx: bx, ky: by, dx: 0, dy: 0 }; }
function moverJoy(joy, x, y) {
  let dx = x - joy.bx, dy = y - joy.by; const d = Math.hypot(dx, dy), R = 46;
  if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  joy.kx = joy.bx + dx; joy.ky = joy.by + dy;
  joy.dx = d > 8 ? dx : 0; joy.dy = d > 8 ? dy : 0;
}
const toques = {}; // id -> "mov" | "mira"
tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const r = tela.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - r.left, y = t.clientY - r.top;
    if (x < tela.width / 2) { joystick = fazerJoy(x, y); toques[t.identifier] = "mov"; }
    else { mira = fazerJoy(x, y); toques[t.identifier] = "mira"; }
  }
}, { passive: false });
tela.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const r = tela.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - r.left, y = t.clientY - r.top;
    if (toques[t.identifier] === "mov" && joystick) moverJoy(joystick, x, y);
    else if (toques[t.identifier] === "mira" && mira) moverJoy(mira, x, y);
  }
}, { passive: false });
function soltar(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (toques[t.identifier] === "mov") joystick = null;
    else if (toques[t.identifier] === "mira") mira = null;
    delete toques[t.identifier];
  }
}
tela.addEventListener("touchend", soltar, { passive: false });
tela.addEventListener("touchcancel", soltar, { passive: false });
// mouse (PC): esquerdo anda até o clique, aponta e atira pro cursor
tela.addEventListener("mousedown", (e) => { const r = tela.getBoundingClientRect(); mira = fazerJoy(tela.width / 2, tela.height / 2); moverJoy(mira, e.clientX - r.left, e.clientY - r.top); });
tela.addEventListener("mousemove", (e) => { if (mira) { const r = tela.getBoundingClientRect(); moverJoy(mira, e.clientX - r.left, e.clientY - r.top); } });
tela.addEventListener("mouseup", () => { mira = null; });

function abrirLobby() {
  rodando = false;
  Lobby.mostrar({
    titulo: "Tanques",
    skinCat: "bolha",
    temOnline: false,
    previewHTML: () => { const c = corTanque(); return `<svg viewBox="0 0 100 60"><rect x="48" y="26" width="40" height="9" rx="2" fill="#8a97a8" stroke="#5a6675"/><circle cx="46" cy="30" r="20" fill="${c}" stroke="#0d1420" stroke-width="3"/></svg>`; },
    aoJogar: () => novoJogo(),
  });
}

document.getElementById("btn-lobby").addEventListener("click", abrirLobby);
document.getElementById("btn-voltar").addEventListener("click", abrirLobby);
configurarMelhor("tanques");
abrirLobby();
