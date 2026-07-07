// Quebra-Blocos — Breakout. Deslize a raquete, quebre os blocos, não deixe cair.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, raq, bola, blocos, pontos, vidas, nivel, rodando, laco = 0;
const LARG_RAQ = 100, ALT_RAQ = 14;
const CORES = ["#ff6f6f", "#ffd54f", "#6fdf9f", "#6fbfff", "#cf8fff"];

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", () => { redimensionar(); montarBlocos(); });

function montarBlocos() {
  blocos = [];
  const cols = Math.min(8, Math.floor(L / 46));
  const larg = (L - 20) / cols, alt = 22;
  const linhas = 4 + Math.min(4, nivel);
  for (let r = 0; r < linhas; r++)
    for (let c = 0; c < cols; c++)
      blocos.push({ x: 10 + c * larg, y: 70 + r * (alt + 6), w: larg - 4, h: alt, cor: CORES[r % CORES.length], vivo: true });
}

function novaBola() { return { x: L / 2, y: A - 70, vx: 3 * (Math.random() < 0.5 ? -1 : 1), vy: -4.5, r: 8 }; }

function novoJogo() {
  redimensionar();
  pontos = 0; vidas = 3; nivel = 1; rodando = true;
  raq = L / 2; bola = novaBola();
  montarBlocos();
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

function atualizar() {
  bola.x += bola.vx; bola.y += bola.vy;
  if (bola.x < bola.r || bola.x > L - bola.r) bola.vx *= -1;
  if (bola.y < bola.r) bola.vy *= -1;
  // raquete
  if (bola.vy > 0 && bola.y > A - 40 - bola.r && bola.y < A - 20 && Math.abs(bola.x - raq) < LARG_RAQ / 2) {
    bola.vy = -Math.abs(bola.vy); bola.vx += (bola.x - raq) * 0.06; Som.clique();
  }
  // caiu
  if (bola.y > A) {
    vidas--; Som.erro(); vibrar(80);
    if (vidas <= 0) { fim(); return; }
    bola = novaBola();
  }
  // blocos
  for (const b of blocos) {
    if (!b.vivo) continue;
    if (bola.x > b.x && bola.x < b.x + b.w && bola.y > b.y && bola.y < b.y + b.h) {
      b.vivo = false; bola.vy *= -1; pontos += 10; placarEl.textContent = pontos; Som.acerto();
      break;
    }
  }
  if (blocos.every((b) => !b.vivo)) { nivel++; bola = novaBola(); bola.vy *= 1.08; montarBlocos(); }
}

function fim() {
  rodando = false;
  Pontos.add(Math.floor(pontos / 10));
  const rec = Recordes.salvar("quebrablocos", pontos);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "🧱", titulo: rec ? "Novo recorde!" : "Fim de jogo",
    texto: `${pontos} pontos` + " · +" + Math.floor(pontos / 10) + " moedas",
    aoJogarDeNovo: novoJogo,
  }), 300);
}

function desenhar() {
  ctx.fillStyle = "#0d1420"; ctx.fillRect(0, 0, L, A);
  blocos.forEach((b) => { if (b.vivo) { ctx.fillStyle = b.cor; ctx.fillRect(b.x, b.y, b.w, b.h); } });
  ctx.fillStyle = "#4f8cff"; ctx.fillRect(raq - LARG_RAQ / 2, A - 40, LARG_RAQ, ALT_RAQ);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bola.x, bola.y, bola.r, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#ff6f6f"; ctx.font = "16px sans-serif"; ctx.textAlign = "left";
  ctx.fillText("♥".repeat(Math.max(0, vidas)), 12, A - 14);
}

function toque(e) { e.preventDefault(); const t = e.touches ? e.touches[0] : e; raq = Math.max(LARG_RAQ / 2, Math.min(L - LARG_RAQ / 2, t.clientX)); }
tela.addEventListener("touchstart", toque, { passive: false });
tela.addEventListener("touchmove", toque, { passive: false });
tela.addEventListener("mousemove", (e) => { if (e.buttons) toque(e); });

document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("quebrablocos");
novoJogo();
