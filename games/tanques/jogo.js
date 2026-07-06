// Tanques — roguelike de arena: sobreviva às ondas, suba de nível e escolha
// melhorias. Tiro automático no inimigo mais próximo. Morreu = fim do run.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const nivelEl = document.getElementById("nivel");
const ondaEl = document.getElementById("onda");
const placarEl = document.getElementById("placar");
const painelUp = document.getElementById("painel-upgrade");

let jogador, inimigos, balas, balasInimigas, particulas, itensXp;
let onda, xpAcumulado, rodando, pausadoUpgrade, laco = 0;
let joystick = null;
let tempoOnda = 0, faltamSpawnar = 0, intervaloSpawn = 0;

const MELHORIAS = [
  { id: "dano", nome: "Dano +30%", desc: "Tiros mais fortes", aplicar: (j) => (j.dano *= 1.3) },
  { id: "cadencia", nome: "Cadência +25%", desc: "Atira mais rápido", aplicar: (j) => (j.cadencia *= 0.8) },
  { id: "vida", nome: "Vida máxima +40", desc: "Aguenta mais", aplicar: (j) => { j.vidaMax += 40; j.vida += 40; } },
  { id: "regen", nome: "Regeneração", desc: "Recupera vida com o tempo", aplicar: (j) => (j.regen += 0.06) },
  { id: "velocidade", nome: "Velocidade +20%", desc: "Anda mais rápido", aplicar: (j) => (j.velocidade *= 1.2) },
  { id: "balavel", nome: "Balas velozes", desc: "Alcance e velocidade da bala", aplicar: (j) => { j.velBala *= 1.25; j.alcance *= 1.15; } },
  { id: "canhao", nome: "+1 Canhão", desc: "Atira em leque", aplicar: (j) => (j.canhoes = Math.min(5, j.canhoes + 1)) },
  { id: "perfura", nome: "Perfuração", desc: "Bala atravessa 1 inimigo", aplicar: (j) => (j.perfura += 1) },
  { id: "cobrar", nome: "Roubo de vida", desc: "Cura ao destruir inimigo", aplicar: (j) => (j.roubo += 3) },
];

function corTanque() {
  return window.Cosmetico && Cosmetico.dados("bolha") ? Cosmetico.dados("bolha") : "#4faf4f";
}

function redimensionar() { tela.width = window.innerWidth; tela.height = window.innerHeight; }
window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  jogador = {
    x: 0, y: 0, raio: 20, ang: 0, cor: corTanque(),
    vida: 100, vidaMax: 100, regen: 0,
    dano: 12, cadencia: 22, recarga: 0, velocidade: 3.4,
    velBala: 8, alcance: 340, canhoes: 1, perfura: 0, roubo: 0,
    nivel: 1, xp: 0, xpProx: 12,
  };
  inimigos = []; balas = []; balasInimigas = []; particulas = []; itensXp = [];
  onda = 1; xpAcumulado = 0; rodando = true; pausadoUpgrade = false;
  joystick = null; faltamSpawnar = 0;
  iniciarOnda();
  atualizarHud();
  painelUp.innerHTML = "";
  painelUp.style.display = "none";
  if (!laco) iniciarLaco();
}

function iniciarOnda() {
  faltamSpawnar = 4 + onda * 2;
  intervaloSpawn = Math.max(30, 90 - onda * 4);
  tempoOnda = 0;
  ondaEl.textContent = onda;
}

function novoInimigo() {
  // nasce fora da tela, ao redor do jogador
  const ang = Math.random() * Math.PI * 2;
  const dist = 380 + Math.random() * 120;
  const tipos = ["quadrado", "quadrado", "triangulo"];
  if (onda >= 3) tipos.push("atirador");
  if (onda >= 5) tipos.push("pesado");
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  const base = {
    x: jogador.x + Math.cos(ang) * dist,
    y: jogador.y + Math.sin(ang) * dist,
    tipo, ang: 0, recarga: 0,
  };
  const escala = 1 + onda * 0.08;
  if (tipo === "quadrado") return { ...base, raio: 16, vida: 18 * escala, vidaMax: 18 * escala, vel: 1.3, dano: 8, xp: 3, cor: "#ff7f6f" };
  if (tipo === "triangulo") return { ...base, raio: 20, vida: 30 * escala, vidaMax: 30 * escala, vel: 1.9, dano: 14, xp: 6, cor: "#ffd54f" };
  if (tipo === "atirador") return { ...base, raio: 18, vida: 24 * escala, vidaMax: 24 * escala, vel: 1.0, dano: 10, xp: 8, cor: "#cf8fff", atira: true };
  return { ...base, raio: 30, vida: 80 * escala, vidaMax: 80 * escala, vel: 0.8, dano: 22, xp: 14, cor: "#ff5f8f" }; // pesado
}

function iniciarLaco() {
  const meu = ++laco;
  let ultimo = performance.now(), acc = 0;
  const quadro = (agora) => {
    if (meu !== laco) return;
    acc += agora - ultimo; ultimo = agora;
    let n = 0;
    while (acc >= 16.7 && n < 4) {
      if (rodando && !pausadoUpgrade && !document.hidden) passo();
      acc -= 16.7; n++;
    }
    if (acc > 120) acc = 0;
    desenhar();
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

function maisProximo() {
  let alvo = null, dist = jogador.alcance;
  inimigos.forEach((e) => {
    const d = Math.hypot(e.x - jogador.x, e.y - jogador.y);
    if (d < dist) { dist = d; alvo = e; }
  });
  return alvo;
}

function atirar(alvo) {
  const baseAng = Math.atan2(alvo.y - jogador.y, alvo.x - jogador.x);
  jogador.ang = baseAng;
  const espalhar = 0.18;
  for (let i = 0; i < jogador.canhoes; i++) {
    const off = (i - (jogador.canhoes - 1) / 2) * espalhar;
    const a = baseAng + off;
    balas.push({
      x: jogador.x + Math.cos(a) * jogador.raio,
      y: jogador.y + Math.sin(a) * jogador.raio,
      vx: Math.cos(a) * jogador.velBala, vy: Math.sin(a) * jogador.velBala,
      vida: jogador.alcance / jogador.velBala, dano: jogador.dano, perfura: jogador.perfura,
    });
  }
  Som.clique();
}

function explodir(x, y, cor, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 3;
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 20, cor });
  }
}

function passo() {
  tempoOnda++;
  // movimento
  if (joystick && (joystick.dx || joystick.dy)) {
    const a = Math.atan2(joystick.dy, joystick.dx);
    jogador.x += Math.cos(a) * jogador.velocidade;
    jogador.y += Math.sin(a) * jogador.velocidade;
  }
  // regen
  if (jogador.regen && jogador.vida < jogador.vidaMax) jogador.vida = Math.min(jogador.vidaMax, jogador.vida + jogador.regen);

  // tiro automático
  jogador.recarga--;
  const alvo = maisProximo();
  if (alvo && jogador.recarga <= 0) { atirar(alvo); jogador.recarga = jogador.cadencia; }
  else if (alvo) jogador.ang = Math.atan2(alvo.y - jogador.y, alvo.x - jogador.x);

  // spawn de inimigos da onda
  if (faltamSpawnar > 0 && tempoOnda % Math.max(1, Math.floor(intervaloSpawn)) === 0) {
    inimigos.push(novoInimigo()); faltamSpawnar--;
  }
  if (faltamSpawnar === 0 && inimigos.length === 0) { onda++; iniciarOnda(); }

  // inimigos perseguem e atacam
  inimigos.forEach((e) => {
    const a = Math.atan2(jogador.y - e.y, jogador.x - e.x);
    e.ang = a;
    e.x += Math.cos(a) * e.vel; e.y += Math.sin(a) * e.vel;
    if (e.atira) {
      e.recarga--;
      const d = Math.hypot(jogador.x - e.x, jogador.y - e.y);
      if (e.recarga <= 0 && d < 400) {
        balasInimigas.push({ x: e.x, y: e.y, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, vida: 90, dano: e.dano });
        e.recarga = 70;
      }
    }
    // encostou no jogador
    const d = Math.hypot(jogador.x - e.x, jogador.y - e.y);
    if (d < jogador.raio + e.raio) { ferir(e.dano * 0.15); }
  });

  // balas do jogador
  balas = balas.filter((b) => {
    b.x += b.vx; b.y += b.vy; b.vida--;
    for (const e of inimigos) {
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.raio) {
        e.vida -= b.dano; explodir(b.x, b.y, e.cor, 3);
        if (e.vida <= 0) matarInimigo(e);
        if (b.perfura > 0) { b.perfura--; } else return false;
      }
    }
    return b.vida > 0;
  });

  // balas inimigas
  balasInimigas = balasInimigas.filter((b) => {
    b.x += b.vx; b.y += b.vy; b.vida--;
    if (Math.hypot(b.x - jogador.x, b.y - jogador.y) < jogador.raio) { ferir(b.dano); return false; }
    return b.vida > 0;
  });

  // coleta de XP
  itensXp = itensXp.filter((it) => {
    const d = Math.hypot(it.x - jogador.x, it.y - jogador.y);
    if (d < 120) { it.x += (jogador.x - it.x) * 0.15; it.y += (jogador.y - it.y) * 0.15; }
    if (d < jogador.raio + 6) { ganharXp(it.xp); return false; }
    return true;
  });

  particulas = particulas.filter((p) => { p.x += p.vx; p.y += p.vy; p.vida--; return p.vida > 0; });
}

function matarInimigo(e) {
  inimigos.splice(inimigos.indexOf(e), 1);
  explodir(e.x, e.y, e.cor, 10);
  itensXp.push({ x: e.x, y: e.y, xp: e.xp });
  if (jogador.roubo) jogador.vida = Math.min(jogador.vidaMax, jogador.vida + jogador.roubo);
  Som.acerto();
}

function ganharXp(q) {
  jogador.xp += q; xpAcumulado += q;
  placarEl.textContent = jogador.nivel;
  while (jogador.xp >= jogador.xpProx) {
    jogador.xp -= jogador.xpProx;
    jogador.nivel++;
    jogador.xpProx = Math.floor(jogador.xpProx * 1.35 + 6);
    subirNivel();
  }
  atualizarHud();
}

function ferir(q) {
  jogador.vida -= q;
  if (jogador.vida <= 0) { jogador.vida = 0; morrer(); }
}

function subirNivel() {
  Som.vitoria(); vibrar(60);
  nivelEl.textContent = jogador.nivel;
  // escolhe 3 melhorias aleatórias
  pausadoUpgrade = true;
  const opcoes = embaralhar([...MELHORIAS]).slice(0, 3);
  painelUp.style.display = "flex";
  painelUp.innerHTML = `<div class="up-caixa"><h2>Nível ${jogador.nivel}! Escolha uma melhoria</h2><div class="up-cartoes"></div></div>`;
  const cont = painelUp.querySelector(".up-cartoes");
  opcoes.forEach((m) => {
    const b = document.createElement("button");
    b.className = "up-cartao";
    b.innerHTML = `<span class="up-nome">${m.nome}</span><span class="up-desc">${m.desc}</span>`;
    b.addEventListener("click", () => {
      m.aplicar(jogador);
      painelUp.style.display = "none";
      painelUp.innerHTML = "";
      pausadoUpgrade = false;
      Som.clique();
    });
    cont.appendChild(b);
  });
}

function atualizarHud() {
  nivelEl.textContent = jogador.nivel;
  placarEl.textContent = jogador.nivel;
}

function morrer() {
  rodando = false;
  const pontos = onda * 10 + jogador.nivel * 5;
  Pontos.add(pontos);
  const rec = Recordes.salvar("tanques", jogador.nivel);
  if (window.Missoes) Missoes.partida();
  if (window.Stats) Stats.partida();
  Som.erro(); vibrar(150);
  telaDeMorte(rec, pontos);
}

let contagemMorte = null;
function telaDeMorte(recorde, pontos) {
  const f = document.createElement("div");
  f.className = "modal-fundo visivel";
  f.id = "tela-morte";
  f.innerHTML = `<div class="modal-caixa">
    <div class="modal-emoji">${recorde ? "🏆" : "💥"}</div>
    <h2>${recorde ? "Novo recorde!" : "Você explodiu!"}</h2>
    <p>Chegou no nível ${jogador.nivel}, onda ${onda} • +${pontos} pontos</p>
    <button class="btn" id="m-jogar">Jogar de novo</button>
    <p style="color:var(--text-dim);font-size:0.85rem;margin:12px 0 0;">voltando em <strong id="m-cont">10</strong>s...</p>
    <button class="btn secundario" id="m-lobby" style="width:100%;margin-top:10px;">Menu</button>
  </div>`;
  document.body.appendChild(f);
  const fechar = () => { clearInterval(contagemMorte); f.remove(); };
  f.querySelector("#m-jogar").addEventListener("click", () => { fechar(); novoJogo(); });
  f.querySelector("#m-lobby").addEventListener("click", () => { fechar(); abrirLobby(); });
  let r = 10;
  contagemMorte = setInterval(() => {
    r--; const el = document.getElementById("m-cont"); if (el) el.textContent = r;
    if (r <= 0) { fechar(); novoJogo(); }
  }, 1000);
}

function desenharForma(e) {
  ctx.save();
  ctx.translate(e.x - jogador.x + tela.width / 2, e.y - jogador.y + tela.height / 2);
  ctx.fillStyle = e.cor;
  if (e.tipo === "triangulo") {
    ctx.rotate(e.ang);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * e.raio, Math.sin(a) * e.raio); }
    ctx.closePath(); ctx.fill();
  } else if (e.tipo === "atirador" || e.tipo === "pesado") {
    ctx.beginPath(); ctx.arc(0, 0, e.raio, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(e.ang); ctx.fillStyle = "#0d1420"; ctx.fillRect(0, -4, e.raio + 8, 8);
  } else {
    ctx.rotate(e.ang); ctx.fillRect(-e.raio, -e.raio, e.raio * 2, e.raio * 2);
  }
  ctx.restore();
  // vida
  if (e.vida < e.vidaMax) {
    const px = e.x - jogador.x + tela.width / 2, py = e.y - jogador.y + tela.height / 2 - e.raio - 8;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(px - e.raio, py, e.raio * 2, 4);
    ctx.fillStyle = "#6fdf6f"; ctx.fillRect(px - e.raio, py, e.raio * 2 * (e.vida / e.vidaMax), 4);
  }
}

function desenhar() {
  if (!jogador) return;
  ctx.fillStyle = "#0d1420"; ctx.fillRect(0, 0, tela.width, tela.height);
  const cx = tela.width / 2, cy = tela.height / 2;
  // grade
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
  const off = 60;
  for (let x = -(jogador.x % off); x < tela.width; x += off) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, tela.height); ctx.stroke(); }
  for (let y = -(jogador.y % off); y < tela.height; y += off) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(tela.width, y); ctx.stroke(); }

  itensXp.forEach((it) => { ctx.fillStyle = "#25c8e8"; ctx.beginPath(); ctx.arc(it.x - jogador.x + cx, it.y - jogador.y + cy, 5, 0, Math.PI * 2); ctx.fill(); });
  inimigos.forEach(desenharForma);

  balas.forEach((b) => { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x - jogador.x + cx, b.y - jogador.y + cy, 4, 0, Math.PI * 2); ctx.fill(); });
  balasInimigas.forEach((b) => { ctx.fillStyle = "#ff9f4f"; ctx.beginPath(); ctx.arc(b.x - jogador.x + cx, b.y - jogador.y + cy, 4, 0, Math.PI * 2); ctx.fill(); });
  particulas.forEach((p) => { ctx.globalAlpha = p.vida / 20; ctx.fillStyle = p.cor; ctx.fillRect(p.x - jogador.x + cx - 2, p.y - jogador.y + cy - 2, 4, 4); ctx.globalAlpha = 1; });

  // jogador
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(jogador.ang);
  ctx.fillStyle = "#0d1420"; ctx.fillRect(0, -6, jogador.raio + 14, 12);
  ctx.rotate(-jogador.ang);
  ctx.fillStyle = jogador.cor; ctx.beginPath(); ctx.arc(0, 0, jogador.raio, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // barra de vida do jogador
  const bw = 200;
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(cx - bw / 2, tela.height - 30, bw, 10);
  ctx.fillStyle = jogador.vida > jogador.vidaMax * 0.3 ? "#6fdf6f" : "#ff6f6f";
  ctx.fillRect(cx - bw / 2, tela.height - 30, bw * (jogador.vida / jogador.vidaMax), 10);
  // barra de XP
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(cx - bw / 2, tela.height - 16, bw, 6);
  ctx.fillStyle = "#25c8e8"; ctx.fillRect(cx - bw / 2, tela.height - 16, bw * (jogador.xp / jogador.xpProx), 6);

  if (joystick) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joystick.bx, joystick.by, 46, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.arc(joystick.kx, joystick.ky, 20, 0, Math.PI * 2); ctx.fill();
  }
}

// joystick
function pos(e) { const r = tela.getBoundingClientRect(); const t = e.touches?.[0] || e.changedTouches?.[0] || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }
function abrir(e) { e.preventDefault(); const p = pos(e); joystick = { bx: p.x, by: p.y, kx: p.x, ky: p.y, dx: 0, dy: 0 }; }
function mover(e) {
  if (!joystick) return; e.preventDefault();
  const p = pos(e); let dx = p.x - joystick.bx, dy = p.y - joystick.by;
  const d = Math.hypot(dx, dy), R = 46;
  if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  joystick.kx = joystick.bx + dx; joystick.ky = joystick.by + dy;
  joystick.dx = d > 8 ? dx : 0; joystick.dy = d > 8 ? dy : 0;
}
function fechar(e) { e.preventDefault(); joystick = null; }
tela.addEventListener("touchstart", abrir, { passive: false });
tela.addEventListener("touchmove", mover, { passive: false });
tela.addEventListener("touchend", fechar, { passive: false });
tela.addEventListener("mousedown", abrir);
tela.addEventListener("mousemove", (e) => { if (e.buttons) mover(e); });
tela.addEventListener("mouseup", fechar);

function abrirLobby() {
  rodando = false;
  Lobby.mostrar({
    titulo: "Tanques",
    skinCat: "bolha",
    temOnline: false,
    previewHTML: () => {
      const c = corTanque();
      return `<svg viewBox="0 0 90 60"><rect x="45" y="26" width="34" height="8" rx="2" fill="#0d1420"/><circle cx="42" cy="30" r="18" fill="${c}"/></svg>`;
    },
    aoJogar: () => novoJogo(),
  });
}

document.getElementById("btn-lobby").addEventListener("click", abrirLobby);
document.getElementById("btn-voltar").addEventListener("click", abrirLobby);
configurarMelhor("tanques");
abrirLobby();
