// Basquete — deslize pra arremessar na cesta. 60 segundos, quantas você faz?
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, bola, cesta, pontos, tempo, rodando, laco = 0;
let arrastando = null; // {x0,y0,x1,y1}

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; if (cesta) cesta.y = 130; }
window.addEventListener("resize", redimensionar);

function resetBola() { bola = { x: L / 2, y: A - 80, r: 22, vx: 0, vy: 0, voando: false, py: A - 80, pontuou: false }; }

function novoJogo() {
  redimensionar();
  pontos = 0; tempo = 60; rodando = true;
  cesta = { x: L / 2, y: 130, w: 84, dir: 1, vel: 0 };
  resetBola();
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2500);
  clearInterval(novoJogo._t);
  novoJogo._t = setInterval(() => { if (rodando && !document.hidden) { tempo--; if (tempo <= 0) fim(); } }, 1000);
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
  // cesta anda quando o placar sobe
  if (pontos >= 3) { cesta.x += (0.8 + pontos * 0.1) * cesta.dir; if (cesta.x < cesta.w / 2 + 10 || cesta.x > L - cesta.w / 2 - 10) cesta.dir *= -1; }
  if (bola.voando) {
    bola.py = bola.y;
    bola.x += bola.vx; bola.y += bola.vy; bola.vy += 0.4;
    // passou pelo aro descendo?
    if (!bola.pontuou && bola.vy > 0 && bola.py < cesta.y && bola.y >= cesta.y && Math.abs(bola.x - cesta.x) < cesta.w / 2 - 6) {
      pontos++; bola.pontuou = true; placarEl.textContent = pontos; Som.vitoria(); Pontos.add(2);
    }
    if (bola.y > A + 60 || bola.x < -60 || bola.x > L + 60) resetBola();
  }
}

function fim() {
  rodando = false; clearInterval(novoJogo._t); Som.erro();
  const rec = Recordes.salvar("basquete", pontos);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "🏀", titulo: rec ? "Novo recorde!" : "Tempo esgotado!",
    texto: `${pontos} cestas`, aoJogarDeNovo: novoJogo,
  }), 250);
}

function desenhar() {
  ctx.fillStyle = "#1a2740"; ctx.fillRect(0, 0, L, A);
  // tabela + aro
  ctx.fillStyle = "#e8e8e8"; ctx.fillRect(cesta.x - 40, cesta.y - 60, 80, 44);
  ctx.strokeStyle = "#ff6f3a"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cesta.x - cesta.w / 2, cesta.y); ctx.lineTo(cesta.x + cesta.w / 2, cesta.y); ctx.stroke();
  // rede
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i++) { const x = cesta.x - cesta.w / 2 + (cesta.w / 6) * i; ctx.beginPath(); ctx.moveTo(x, cesta.y); ctx.lineTo(cesta.x - cesta.w / 4 + (cesta.w / 12) * i, cesta.y + 26); ctx.stroke(); }
  // linha de mira
  if (arrastando) {
    ctx.strokeStyle = "rgba(255,213,79,0.8)"; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(bola.x, bola.y); ctx.lineTo(bola.x + (arrastando.x0 - arrastando.x1) * 2, bola.y + (arrastando.y0 - arrastando.y1) * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  // bola
  ctx.fillStyle = "#ff8f3a"; ctx.beginPath(); ctx.arc(bola.x, bola.y, bola.r, 0, 6.283); ctx.fill();
  ctx.strokeStyle = "#7a3a10"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bola.x, bola.y, bola.r, 0, 6.283); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bola.x - bola.r, bola.y); ctx.lineTo(bola.x + bola.r, bola.y); ctx.moveTo(bola.x, bola.y - bola.r); ctx.lineTo(bola.x, bola.y + bola.r); ctx.stroke();
  // tempo
  ctx.fillStyle = tempo <= 10 ? "#ff6f6f" : "#fff"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(tempo + "s", L / 2, A - 16);
}

function pos(e) { const t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e); return { x: t.clientX, y: t.clientY }; }
tela.addEventListener("touchstart", (e) => { e.preventDefault(); if (bola.voando) return; const p = pos(e); arrastando = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; }, { passive: false });
tela.addEventListener("touchmove", (e) => { if (!arrastando) return; e.preventDefault(); const p = pos(e); arrastando.x1 = p.x; arrastando.y1 = p.y; }, { passive: false });
tela.addEventListener("touchend", (e) => {
  if (!arrastando) return; e.preventDefault();
  const dx = arrastando.x0 - arrastando.x1, dy = arrastando.y0 - arrastando.y1;
  if (Math.hypot(dx, dy) > 20) { bola.vx = dx * 0.16; bola.vy = dy * 0.16; bola.voando = true; Som.clique(); }
  arrastando = null;
}, { passive: false });

document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("basquete");
novoJogo();
