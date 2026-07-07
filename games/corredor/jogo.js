// Corredor — runner infinito. Toque pra pular os obstáculos.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, chao, heroi, obstaculos, moedas, dist, vel, rodando, laco = 0, spawn = 0;

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; chao = A - 60; if (heroi) heroi.y = Math.min(heroi.y, chao - heroi.h); }
window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  heroi = { x: 70, y: chao - 40, w: 34, h: 40, vy: 0, noChao: true };
  obstaculos = []; moedas = []; dist = 0; vel = 6; rodando = true; spawn = 0;
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2000);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  const passo = () => { if (meu !== laco) return; if (rodando && !document.hidden) atualizar(); desenhar(); requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

function pular() {
  if (heroi.noChao) { heroi.vy = -14; heroi.noChao = false; Som.clique(); }
}

function atualizar() {
  dist += vel / 30; vel += 0.0015;
  placarEl.textContent = Math.floor(dist);
  // física do herói
  heroi.vy += 0.7; heroi.y += heroi.vy;
  if (heroi.y >= chao - heroi.h) { heroi.y = chao - heroi.h; heroi.vy = 0; heroi.noChao = true; }
  // spawn
  spawn--;
  if (spawn <= 0) {
    const alto = Math.random() < 0.3;
    obstaculos.push({ x: L + 20, w: 22 + Math.random() * 16, h: alto ? 52 : 32 });
    if (Math.random() < 0.5) moedas.push({ x: L + 20 + Math.random() * 200, y: chao - 90 - Math.random() * 60, r: 9, viva: true });
    spawn = Math.max(40, 90 - vel * 3);
  }
  obstaculos.forEach((o) => (o.x -= vel));
  moedas.forEach((m) => (m.x -= vel));
  obstaculos = obstaculos.filter((o) => o.x + o.w > -10);
  moedas = moedas.filter((m) => m.x > -20);
  // colisões
  for (const o of obstaculos) {
    if (heroi.x < o.x + o.w && heroi.x + heroi.w > o.x && heroi.y + heroi.h > chao - o.h) { fim(); return; }
  }
  moedas.forEach((m) => {
    if (m.viva && Math.hypot((heroi.x + heroi.w / 2) - m.x, (heroi.y + heroi.h / 2) - m.y) < m.r + 20) { m.viva = false; dist += 5; Som.acerto(); }
  });
  moedas = moedas.filter((m) => m.viva);
}

function fim() {
  rodando = false; Som.erro(); vibrar(120);
  const d = Math.floor(dist);
  Pontos.add(Math.floor(d / 5));
  const rec = Recordes.salvar("corredor", d);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "🏃", titulo: rec ? "Novo recorde!" : "Você caiu!",
    texto: `${d} metros · +${Math.floor(d / 5)} moedas`, aoJogarDeNovo: novoJogo,
  }), 300);
}

function desenhar() {
  ctx.fillStyle = "#1a2740"; ctx.fillRect(0, 0, L, A);
  ctx.fillStyle = "#0d1826"; ctx.fillRect(0, chao, L, A - chao);
  ctx.strokeStyle = "#3a4a6a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, chao); ctx.lineTo(L, chao); ctx.stroke();
  ctx.fillStyle = "#ffd54f"; moedas.forEach((m) => { ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill(); });
  ctx.fillStyle = "#ff6f6f"; obstaculos.forEach((o) => ctx.fillRect(o.x, chao - o.h, o.w, o.h));
  ctx.fillStyle = "#4f8cff"; ctx.fillRect(heroi.x, heroi.y, heroi.w, heroi.h);
  ctx.fillStyle = "#fff"; ctx.fillRect(heroi.x + heroi.w - 12, heroi.y + 8, 5, 5);
}

tela.addEventListener("touchstart", (e) => { e.preventDefault(); pular(); }, { passive: false });
tela.addEventListener("mousedown", pular);
document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("corredor");
novoJogo();
