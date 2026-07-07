// Ninja Frutas — deslize pra cortar as frutas que voam. Não corte as bombas!
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, objetos, particulas, pontos, vidas, rodando, laco = 0, spawn = 0, rajada = 0;
let trilha = [];
const FRUTAS = ["#ff5f5f", "#ffd54f", "#6fdf6f", "#ff9f4f", "#cf8fff", "#ff7fbf"];

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  objetos = []; particulas = []; pontos = 0; vidas = 3; rodando = true; spawn = 0; trilha = [];
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2500);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  let ultimo = performance.now(), acc = 0;
  const passo = (agora) => {
    if (meu !== laco) return;
    acc += agora - ultimo; ultimo = agora; if (acc > 100) acc = 100;
    while (acc >= 16.7) { if (rodando && !document.hidden) atualizar(); acc -= 16.7; }
    desenhar(); requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function lancar() {
  const bomba = Math.random() < 0.16;
  objetos.push({
    x: 40 + Math.random() * (L - 80), y: A + 30,
    vx: (Math.random() - 0.5) * 3.4, vy: -(11 + Math.random() * 2.5),
    r: 30, tipo: bomba ? "bomba" : "fruta", cor: bomba ? "#333" : FRUTAS[Math.floor(Math.random() * FRUTAS.length)],
    rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, cortado: false,
  });
}

function atualizar() {
  spawn--;
  if (spawn <= 0) { const n = 1 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) lancar(); spawn = 50 + Math.random() * 30; }
  objetos.forEach((o) => { o.x += o.vx; o.y += o.vy; o.vy += 0.28; o.rot += o.vr; });
  // saiu por baixo
  objetos = objetos.filter((o) => {
    if (o.y > A + 60 && o.vy > 0) { if (o.tipo === "fruta" && !o.cortado) { vidas--; Som.erro(); vibrar(60); if (vidas <= 0) fim(); } return false; }
    return true;
  });
  particulas.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.vida--; });
  particulas = particulas.filter((p) => p.vida > 0);
  if (trilha.length) trilha.forEach((t) => t.vida--), trilha = trilha.filter((t) => t.vida > 0);
}

function distSeg(ax, ay, bx, by, px, py) {
  const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function cortarEm(ax, ay, bx, by) {
  if (!rodando) return;
  objetos.forEach((o) => {
    if (o.cortado) return;
    if (distSeg(ax, ay, bx, by, o.x, o.y) < o.r) {
      if (o.tipo === "bomba") { Som.erro(); vibrar(150); fim(); return; }
      o.cortado = true; pontos++; placarEl.textContent = pontos; Som.acerto();
      for (let i = 0; i < 8; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * 4; particulas.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 22, cor: o.cor }); }
    }
  });
  objetos = objetos.filter((o) => !o.cortado);
}

function fim() {
  rodando = false;
  Pontos.add(pontos);
  const rec = Recordes.salvar("ninjafrutas", pontos);
  setTimeout(() => Modal.mostrar({ emoji: rec ? "🏆" : "🍉", titulo: rec ? "Novo recorde!" : "Fim!", texto: `${pontos} frutas cortadas`, aoJogarDeNovo: novoJogo }), 300);
}

function desenhar() {
  ctx.fillStyle = "#101820"; ctx.fillRect(0, 0, L, A);
  objetos.forEach((o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    if (o.tipo === "bomba") {
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "#ff6f6f"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -o.r); ctx.lineTo(4, -o.r - 8); ctx.stroke();
      ctx.fillStyle = "#ff6f6f"; ctx.beginPath(); ctx.arc(5, -o.r - 9, 3, 0, 6.283); ctx.fill();
    } else {
      ctx.fillStyle = o.cor; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 6.283); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(-o.r * 0.3, -o.r * 0.3, o.r * 0.3, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  });
  particulas.forEach((p) => { ctx.globalAlpha = p.vida / 22; ctx.fillStyle = p.cor; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; });
  // trilha da lâmina
  if (trilha.length > 1) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(trilha[0].x, trilha[0].y); for (let i = 1; i < trilha.length; i++) ctx.lineTo(trilha[i].x, trilha[i].y); ctx.stroke();
  }
  ctx.fillStyle = "#ff6f6f"; ctx.font = "18px sans-serif"; ctx.textAlign = "left"; ctx.fillText("♥".repeat(Math.max(0, vidas)), 12, A - 14);
}

let ultimo = null;
function mover(e) {
  e.preventDefault();
  const t = e.touches ? e.touches[0] : e;
  const p = { x: t.clientX, y: t.clientY, vida: 8 };
  trilha.push(p); if (trilha.length > 12) trilha.shift();
  if (ultimo) cortarEm(ultimo.x, ultimo.y, p.x, p.y);
  ultimo = p;
}
tela.addEventListener("touchstart", (e) => { ultimo = null; mover(e); }, { passive: false });
tela.addEventListener("touchmove", mover, { passive: false });
tela.addEventListener("touchend", () => (ultimo = null), { passive: false });
tela.addEventListener("mousedown", (e) => { ultimo = null; mover(e); });
tela.addEventListener("mousemove", (e) => { if (e.buttons) mover(e); });
tela.addEventListener("mouseup", () => (ultimo = null));

document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("ninjafrutas");
novoJogo();
