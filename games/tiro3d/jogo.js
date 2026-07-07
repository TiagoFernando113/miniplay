// Tiro 3D — FPS em primeira pessoa (raycasting + inimigos sprite). Sem biblioteca.
// Esquerda: andar. Direita: mirar (arraste). Botão 🔫: atirar.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const ondaEl = document.getElementById("onda");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

const FOV = Math.PI / 3, DIM = 18;
let L, A, mapa, jogador, inimigos, onda, faltam, pontos, rodando, laco = 0, flash = 0;
let joyMove = null, olharX = 0;
const toques = {};
let zbuffer = [];

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", redimensionar);

function gerarArena() {
  const g = Array.from({ length: DIM }, (_, y) => Array.from({ length: DIM }, (_, x) =>
    (x === 0 || y === 0 || x === DIM - 1 || y === DIM - 1) ? 1 : 0));
  // pilares aleatórios
  for (let i = 0; i < 26; i++) {
    const x = 2 + Math.floor(Math.random() * (DIM - 4)), y = 2 + Math.floor(Math.random() * (DIM - 4));
    if (Math.hypot(x - DIM / 2, y - DIM / 2) > 2) g[y][x] = 1;
  }
  g[Math.floor(DIM / 2)][Math.floor(DIM / 2)] = 0;
  return g;
}

function bloqueado(x, y) { const c = mapa[Math.floor(y)] && mapa[Math.floor(y)][Math.floor(x)]; return c === 1; }

function novoInimigo() {
  let x, y, t = 0;
  do { x = 1.5 + Math.random() * (DIM - 3); y = 1.5 + Math.random() * (DIM - 3); t++; }
  while (t < 30 && (bloqueado(x, y) || Math.hypot(x - jogador.x, y - jogador.y) < 5));
  const vida = 2 + Math.floor(onda / 2);
  return { x, y, vida, vidaMax: vida, vel: 0.012 + onda * 0.002, dano: 0.35, recarga: 0 };
}

function iniciarOnda() {
  faltam = 3 + onda * 2;
  inimigos = [];
  for (let i = 0; i < Math.min(6, faltam); i++) { inimigos.push(novoInimigo()); faltam--; }
  ondaEl.textContent = onda;
}

function novoJogo() {
  redimensionar();
  mapa = gerarArena();
  jogador = { x: DIM / 2, y: DIM / 2, ang: 0, vida: 100, vidaMax: 100 };
  onda = 1; pontos = 0; rodando = true; flash = 0;
  iniciarOnda();
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 3500);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  let ultimo = performance.now();
  const passo = (agora) => {
    if (meu !== laco) return;
    const fator = Math.min(3, (agora - ultimo) / 16.67); ultimo = agora;
    if (rodando && !document.hidden) atualizar(fator);
    render();
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function atualizar(fator) {
  if (joyMove && (joyMove.dx || joyMove.dy)) {
    const frente = -joyMove.dy / 46, lado = joyMove.dx / 46;
    const cos = Math.cos(jogador.ang), sin = Math.sin(jogador.ang), vel = 0.045 * fator;
    const nx = jogador.x + (cos * frente - sin * lado) * vel;
    const ny = jogador.y + (sin * frente + cos * lado) * vel;
    if (!bloqueado(nx, jogador.y)) jogador.x = nx;
    if (!bloqueado(jogador.x, ny)) jogador.y = ny;
  }
  // inimigos perseguem
  inimigos.forEach((e) => {
    const a = Math.atan2(jogador.y - e.y, jogador.x - e.x);
    const nx = e.x + Math.cos(a) * e.vel * fator, ny = e.y + Math.sin(a) * e.vel * fator;
    if (!bloqueado(nx, e.y)) e.x = nx;
    if (!bloqueado(e.x, ny)) e.y = ny;
    const d = Math.hypot(jogador.x - e.x, jogador.y - e.y);
    if (d < 0.7) { e.recarga -= fator; if (e.recarga <= 0) { ferir(e.dano * 10); e.recarga = 30; } }
  });
  // repõe inimigos da onda
  if (inimigos.length < 6 && faltam > 0) { inimigos.push(novoInimigo()); faltam--; }
  if (inimigos.length === 0 && faltam === 0) { onda++; Pontos.add(onda); iniciarOnda(); }
  if (flash > 0) flash -= fator;
}

function ferir(q) {
  jogador.vida -= q; vibrar(40);
  if (jogador.vida <= 0) { jogador.vida = 0; morrer(); }
}

function temLinha(e) {
  const passos = Math.ceil(Math.hypot(e.x - jogador.x, e.y - jogador.y) * 4);
  for (let i = 1; i < passos; i++) {
    const t = i / passos;
    if (bloqueado(jogador.x + (e.x - jogador.x) * t, jogador.y + (e.y - jogador.y) * t)) return false;
  }
  return true;
}

function atirar() {
  if (!rodando) return;
  flash = 6; Som.clique();
  let alvo = null, maisPerto = 99;
  inimigos.forEach((e) => {
    const dist = Math.hypot(e.x - jogador.x, e.y - jogador.y);
    if (dist > 15) return;
    let rel = Math.atan2(e.y - jogador.y, e.x - jogador.x) - jogador.ang;
    while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
    const tol = Math.max(0.09, 0.5 / dist); // mais perto = mais fácil acertar
    if (Math.abs(rel) < tol && dist < maisPerto && temLinha(e)) { maisPerto = dist; alvo = e; }
  });
  if (alvo) {
    alvo.vida--; Som.acerto();
    if (alvo.vida <= 0) { inimigos.splice(inimigos.indexOf(alvo), 1); pontos++; placarEl.textContent = pontos; }
  }
}

function morrer() {
  rodando = false; Som.erro(); vibrar(160);
  Pontos.add(pontos * 2 + onda * 3);
  const rec = Recordes.salvar("tiro3d", pontos);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "💀", titulo: rec ? "Novo recorde!" : "Você foi pego!",
    texto: `${pontos} abates · onda ${onda}`, aoJogarDeNovo: novoJogo,
  }), 300);
}

function render() {
  // teto e chão
  ctx.fillStyle = "#2a2018"; ctx.fillRect(0, 0, L, A / 2);
  ctx.fillStyle = "#161310"; ctx.fillRect(0, A / 2, L, A / 2);

  const passos = Math.min(L, 300), larguraCol = L / passos;
  zbuffer = new Array(passos);
  for (let i = 0; i < passos; i++) {
    const rayAng = jogador.ang - FOV / 2 + (i / passos) * FOV;
    const cos = Math.cos(rayAng), sin = Math.sin(rayAng);
    let mapX = Math.floor(jogador.x), mapY = Math.floor(jogador.y);
    const deltaX = Math.abs(1 / cos), deltaY = Math.abs(1 / sin);
    let stepX, stepY, sideX, sideY;
    if (cos < 0) { stepX = -1; sideX = (jogador.x - mapX) * deltaX; } else { stepX = 1; sideX = (mapX + 1 - jogador.x) * deltaX; }
    if (sin < 0) { stepY = -1; sideY = (jogador.y - mapY) * deltaY; } else { stepY = 1; sideY = (mapY + 1 - jogador.y) * deltaY; }
    let lado = 0, seguro = 0;
    while (seguro++ < 40) {
      if (sideX < sideY) { sideX += deltaX; mapX += stepX; lado = 0; } else { sideY += deltaY; mapY += stepY; lado = 1; }
      if (!mapa[mapY] || mapa[mapY][mapX] === undefined || mapa[mapY][mapX] === 1) break;
    }
    let dist = lado === 0 ? sideX - deltaX : sideY - deltaY;
    if (dist < 0.01) dist = 0.01;
    const distCorr = dist * Math.cos(rayAng - jogador.ang);
    zbuffer[i] = distCorr;
    const altura = Math.min(A * 3, A / distCorr), topo = A / 2 - altura / 2;
    const escuro = lado === 1 ? 0.7 : 1, neblina = Math.max(0.2, 1 - distCorr / 14), f = escuro * neblina;
    ctx.fillStyle = `rgb(${120 * f | 0},${100 * f | 0},${85 * f | 0})`;
    ctx.fillRect(i * larguraCol, topo, larguraCol + 1, altura);
  }

  // inimigos (sprites), do mais longe pro mais perto
  const ordenados = inimigos.map((e) => ({ e, d: Math.hypot(e.x - jogador.x, e.y - jogador.y) })).sort((a, b) => b.d - a.d);
  ordenados.forEach(({ e, d }) => {
    let rel = Math.atan2(e.y - jogador.y, e.x - jogador.x) - jogador.ang;
    while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
    if (Math.abs(rel) > FOV / 2 + 0.4) return;
    const distCorr = d * Math.cos(rel);
    if (distCorr < 0.3) return;
    const sx = (0.5 + rel / FOV) * L;
    const tam = Math.min(A * 1.4, (A / distCorr));
    const col = Math.max(0, Math.min(passos - 1, Math.floor((sx / L) * passos)));
    if (zbuffer[col] !== undefined && distCorr > zbuffer[col] + 0.3) return; // atrás da parede
    desenharMonstro(sx, A / 2 + tam * 0.1, tam * 0.55, tam, e);
  });

  // arma + flash
  if (flash > 0) { ctx.fillStyle = `rgba(255,220,120,${flash / 12})`; ctx.fillRect(0, 0, L, A); }
  desenharArma();

  // mira
  ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(L / 2 - 12, A / 2); ctx.lineTo(L / 2 - 4, A / 2);
  ctx.moveTo(L / 2 + 4, A / 2); ctx.lineTo(L / 2 + 12, A / 2);
  ctx.moveTo(L / 2, A / 2 - 12); ctx.lineTo(L / 2, A / 2 - 4);
  ctx.moveTo(L / 2, A / 2 + 4); ctx.lineTo(L / 2, A / 2 + 12); ctx.stroke();

  // barra de vida
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(14, A - 26, 160, 12);
  ctx.fillStyle = jogador.vida > 30 ? "#6fdf6f" : "#ff6f6f"; ctx.fillRect(14, A - 26, 160 * (jogador.vida / jogador.vidaMax), 12);

  if (joyMove) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joyMove.bx, joyMove.by, 46, 0, 6.283); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.arc(joyMove.kx, joyMove.ky, 20, 0, 6.283); ctx.fill();
  }
}

function desenharMonstro(cx, cy, w, h, e) {
  const topo = cy - h / 2;
  ctx.fillStyle = "#7a1f2a"; // corpo
  ctx.beginPath(); ctx.ellipse(cx, topo + h * 0.55, w / 2, h * 0.42, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#a83040"; // cabeça
  ctx.beginPath(); ctx.arc(cx, topo + h * 0.2, w * 0.32, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#ffd54f"; // olhos
  ctx.beginPath(); ctx.arc(cx - w * 0.12, topo + h * 0.18, w * 0.06, 0, 6.283); ctx.arc(cx + w * 0.12, topo + h * 0.18, w * 0.06, 0, 6.283); ctx.fill();
  // barra de vida do inimigo
  if (e.vida < e.vidaMax) {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(cx - w / 2, topo - 8, w, 4);
    ctx.fillStyle = "#6fdf6f"; ctx.fillRect(cx - w / 2, topo - 8, w * (e.vida / e.vidaMax), 4);
  }
}

function desenharArma() {
  const cx = L / 2, base = A;
  ctx.fillStyle = "#3a3a44";
  ctx.fillRect(cx + 30, base - 90 + (flash > 0 ? 8 : 0), 40, 90);
  ctx.fillStyle = "#555562";
  ctx.fillRect(cx + 38, base - 130 + (flash > 0 ? 8 : 0), 16, 50);
}

// ---- controles ----
function fazJoy(x, y) { return { bx: x, by: y, kx: x, ky: y, dx: 0, dy: 0 }; }
function moveJoy(j, x, y) { let dx = x - j.bx, dy = y - j.by; const d = Math.hypot(dx, dy), R = 46; if (d > R) { dx = dx / d * R; dy = dy / d * R; } j.kx = j.bx + dx; j.ky = j.by + dy; j.dx = d > 8 ? dx : 0; j.dy = d > 8 ? dy : 0; }

tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const r = tela.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - r.left;
    if (x < L / 2) { joyMove = fazJoy(x, t.clientY - r.top); toques[t.identifier] = "move"; }
    else { olharX = x; toques[t.identifier] = "olhar"; }
  }
}, { passive: false });
tela.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const r = tela.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - r.left, y = t.clientY - r.top;
    if (toques[t.identifier] === "move" && joyMove) moveJoy(joyMove, x, y);
    else if (toques[t.identifier] === "olhar") { jogador.ang += (x - olharX) * 0.004; olharX = x; }
  }
}, { passive: false });
function soltar(e) {
  e.preventDefault();
  for (const t of e.changedTouches) { if (toques[t.identifier] === "move") joyMove = null; delete toques[t.identifier]; }
}
tela.addEventListener("touchend", soltar, { passive: false });
tela.addEventListener("touchcancel", soltar, { passive: false });

const btnAtirar = document.getElementById("btn-atirar");
btnAtirar.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); btnAtirar.classList.add("ativo"); atirar(); }, { passive: false });
btnAtirar.addEventListener("touchend", (e) => { e.preventDefault(); btnAtirar.classList.remove("ativo"); }, { passive: false });
btnAtirar.addEventListener("mousedown", (e) => { e.stopPropagation(); atirar(); });

window.addEventListener("keydown", (e) => {
  if (!jogador) return;
  const cos = Math.cos(jogador.ang), sin = Math.sin(jogador.ang), v = 0.15;
  if (e.key === "ArrowUp" || e.key === "w") { if (!bloqueado(jogador.x + cos * v, jogador.y)) jogador.x += cos * v; if (!bloqueado(jogador.x, jogador.y + sin * v)) jogador.y += sin * v; }
  if (e.key === "ArrowDown" || e.key === "s") { if (!bloqueado(jogador.x - cos * v, jogador.y)) jogador.x -= cos * v; if (!bloqueado(jogador.x, jogador.y - sin * v)) jogador.y -= sin * v; }
  if (e.key === "ArrowLeft") jogador.ang -= 0.12;
  if (e.key === "ArrowRight") jogador.ang += 0.12;
  if (e.key === " ") atirar();
});

document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("tiro3d");
novoJogo();
