// Pingue-Pongue — Pong contra o bot. Deslize pra mover a raquete.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, bola, raqJog, raqBot, ptsJog, ptsBot, rodando, laco = 0;
const LARG_RAQ = 90, ALT_RAQ = 14;

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", () => { redimensionar(); novoJogo(); });

function novaBola(dir) { return { x: L / 2, y: A / 2, vx: (Math.random() < 0.5 ? -1 : 1) * 3, vy: dir * 4, r: 9 }; }

function novoJogo() {
  redimensionar();
  ptsJog = 0; ptsBot = 0; rodando = true;
  raqJog = L / 2; raqBot = L / 2;
  bola = novaBola(1);
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1";
  setTimeout(() => (mensagemEl.style.opacity = "0"), 2500);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  const passo = () => {
    if (meu !== laco) return;
    if (rodando && !document.hidden) atualizar();
    desenhar();
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

function atualizar() {
  bola.x += bola.vx; bola.y += bola.vy;
  if (bola.x < bola.r || bola.x > L - bola.r) bola.vx *= -1;

  // bot segue a bola
  const alvo = bola.y < A / 2 ? bola.x : L / 2;
  raqBot += Math.max(-4.2, Math.min(4.2, alvo - raqBot));

  // colisão raquete do jogador (embaixo)
  if (bola.vy > 0 && bola.y > A - 40 - bola.r && bola.y < A - 40 && Math.abs(bola.x - raqJog) < LARG_RAQ / 2) {
    bola.vy = -Math.abs(bola.vy) * 1.03; bola.vx += (bola.x - raqJog) * 0.05; Som.clique();
  }
  // colisão raquete do bot (em cima)
  if (bola.vy < 0 && bola.y < 40 + bola.r && bola.y > 40 && Math.abs(bola.x - raqBot) < LARG_RAQ / 2) {
    bola.vy = Math.abs(bola.vy) * 1.03; bola.vx += (bola.x - raqBot) * 0.05; Som.clique();
  }
  // ponto
  if (bola.y > A) { ptsJog++; ponto(1); }
  else if (bola.y < 0) { ptsBot++; ponto(-1); }
}

function ponto(dir) {
  placarEl.textContent = ptsJog + " x " + ptsBot;
  Som.acerto();
  if (ptsJog >= 7 || ptsBot >= 7) { fim(ptsJog > ptsBot); return; }
  bola = novaBola(dir);
}

function fim(venceu) {
  rodando = false;
  if (venceu) { Pontos.add(15); Recordes.salvar("pingueVitorias", (Recordes.get("pingueVitorias") || 0) + 1); }
  Som[venceu ? "vitoria" : "erro"]();
  setTimeout(() => Modal.mostrar({
    emoji: venceu ? "🏆" : "😢", titulo: venceu ? "Você venceu!" : "O bot venceu!",
    texto: `${ptsJog} x ${ptsBot}` + (venceu ? " · +15 pontos" : ""),
    aoJogarDeNovo: novoJogo,
  }), 300);
}

function desenhar() {
  ctx.fillStyle = "#0d1420"; ctx.fillRect(0, 0, L, A);
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.setLineDash([8, 10]);
  ctx.beginPath(); ctx.moveTo(0, A / 2); ctx.lineTo(L, A / 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#4f8cff"; ctx.fillRect(raqJog - LARG_RAQ / 2, A - 40, LARG_RAQ, ALT_RAQ);
  ctx.fillStyle = "#ff6f6f"; ctx.fillRect(raqBot - LARG_RAQ / 2, 40 - ALT_RAQ, LARG_RAQ, ALT_RAQ);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bola.x, bola.y, bola.r, 0, 6.283); ctx.fill();
}

function toque(e) {
  e.preventDefault();
  const t = e.touches ? e.touches[0] : e;
  raqJog = Math.max(LARG_RAQ / 2, Math.min(L - LARG_RAQ / 2, t.clientX));
}
tela.addEventListener("touchstart", toque, { passive: false });
tela.addEventListener("touchmove", toque, { passive: false });
tela.addEventListener("mousemove", (e) => { if (e.buttons) toque(e); });

document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("pingueVitorias");
novoJogo();
