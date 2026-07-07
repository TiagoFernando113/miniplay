// Atravessar — Frogger. Toque pra avançar uma faixa; desvie dos carros.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, faixaH, faixas, sapo, travessias, rodando, laco = 0;
const CORES_CARRO = ["#ff6f6f", "#ffd54f", "#6fbfff", "#cf8fff", "#ff9f4f"];

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; faixaH = 56; }
window.addEventListener("resize", () => { redimensionar(); });

function montarFaixas() {
  faixas = [];
  const n = Math.floor((A - faixaH * 2) / faixaH);
  for (let i = 0; i < n; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const vel = (1.4 + Math.random() * 1.6 + travessias * 0.25) * dir;
    const carros = [];
    const qtd = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < qtd; c++) carros.push({ x: Math.random() * L, w: 60 + Math.random() * 30, cor: CORES_CARRO[Math.floor(Math.random() * CORES_CARRO.length)] });
    faixas.push({ y: faixaH + i * faixaH, vel, carros });
  }
}

function novoJogo() {
  redimensionar();
  travessias = 0; rodando = true;
  montarFaixas();
  sapo = { x: L / 2, y: A - faixaH / 2, r: 18 };
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2200);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  const passo = () => { if (meu !== laco) return; if (rodando && !document.hidden) atualizar(); desenhar(); requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

function atualizar() {
  faixas.forEach((f) => {
    f.carros.forEach((c) => {
      c.x += f.vel;
      if (f.vel > 0 && c.x > L + c.w) c.x = -c.w;
      if (f.vel < 0 && c.x < -c.w) c.x = L + c.w;
      // colisão
      const naFaixa = Math.abs(sapo.y - f.y) < faixaH / 2;
      if (naFaixa && sapo.x + sapo.r > c.x && sapo.x - sapo.r < c.x + c.w) { fim(); }
    });
  });
}

function pular(x) {
  if (!rodando) return;
  sapo.x = Math.max(sapo.r, Math.min(L - sapo.r, x));
  sapo.y -= faixaH; Som.clique();
  if (sapo.y < faixaH / 2) {
    travessias++; placarEl.textContent = travessias; Som.vitoria(); Pontos.add(3);
    montarFaixas(); sapo.y = A - faixaH / 2;
  }
}

function fim() {
  rodando = false; Som.erro(); vibrar(120);
  const rec = Recordes.salvar("atravessar", travessias);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "💥", titulo: rec ? "Novo recorde!" : "Foi atropelado!",
    texto: `${travessias} travessias`, aoJogarDeNovo: novoJogo,
  }), 250);
}

function desenhar() {
  ctx.fillStyle = "#0d1826"; ctx.fillRect(0, 0, L, A);
  // faixa segura embaixo e em cima
  ctx.fillStyle = "#1f5f3a"; ctx.fillRect(0, A - faixaH, L, faixaH); ctx.fillRect(0, 0, L, faixaH);
  faixas.forEach((f) => {
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.moveTo(0, f.y); ctx.lineTo(L, f.y); ctx.stroke(); ctx.setLineDash([]);
    f.carros.forEach((c) => { ctx.fillStyle = c.cor; ctx.fillRect(c.x, f.y - 16, c.w, 32); });
  });
  ctx.fillStyle = "#6fdf6f"; ctx.beginPath(); ctx.arc(sapo.x, sapo.y, sapo.r, 0, 6.283); ctx.fill();
  ctx.fillStyle = "#0d1420"; ctx.fillRect(sapo.x - 7, sapo.y - 6, 3, 3); ctx.fillRect(sapo.x + 4, sapo.y - 6, 3, 3);
}

tela.addEventListener("touchstart", (e) => { e.preventDefault(); pular(e.changedTouches[0].clientX); }, { passive: false });
tela.addEventListener("mousedown", (e) => pular(e.clientX));
document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("atravessar");
novoJogo();
