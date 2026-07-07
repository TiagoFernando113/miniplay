// Piano — toque só nas teclas pretas, de baixo pra cima, sem deixar passar.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");
const COLS = 4;

let L, A, tileH, tiles, pontos, vel, rodando, laco = 0;

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; tileH = A / 4; }
window.addEventListener("resize", () => { redimensionar(); });

function novoJogo() {
  redimensionar();
  tiles = []; pontos = 0; vel = 3.2; rodando = true;
  placarEl.textContent = "0";
  // preenche a tela com tiles iniciais
  for (let i = 0; i < 4; i++) tiles.push({ col: Math.floor(Math.random() * COLS), y: -tileH * i, tocada: false });
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2500);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  const passo = () => { if (meu !== laco) return; if (rodando && !document.hidden) atualizar(); desenhar(); requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

function atualizar() {
  tiles.forEach((t) => (t.y += vel));
  // novo tile no topo quando o mais alto desce o bastante
  const maisAlto = Math.min(...tiles.map((t) => t.y));
  if (maisAlto >= 0) tiles.unshift({ col: Math.floor(Math.random() * COLS), y: maisAlto - tileH, tocada: false });
  // remove tiles bem fora
  tiles = tiles.filter((t) => t.y < A + tileH);
  // a mais baixa não tocada passou da tela? perdeu
  const ativa = menorAtiva();
  if (ativa && ativa.y > A) { fim(); }
}

function menorAtiva() {
  let m = null;
  tiles.forEach((t) => { if (!t.tocada && (!m || t.y > m.y)) m = t; });
  return m;
}

function tocar(x) {
  if (!rodando) return;
  const col = Math.floor(x / (L / COLS));
  const ativa = menorAtiva();
  if (ativa && ativa.col === col) {
    ativa.tocada = true; pontos++; placarEl.textContent = pontos;
    vel = Math.min(11, 3.2 + pontos * 0.06); Som.clique();
  } else { Som.erro(); vibrar(80); fim(); }
}

function fim() {
  rodando = false; Som.erro();
  Pontos.add(Math.floor(pontos / 3));
  const rec = Recordes.salvar("piano", pontos);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "🎹", titulo: rec ? "Novo recorde!" : "Errou a tecla!",
    texto: `${pontos} teclas`, aoJogarDeNovo: novoJogo,
  }), 250);
}

function desenhar() {
  ctx.fillStyle = "#f4f4f4"; ctx.fillRect(0, 0, L, A);
  const cw = L / COLS;
  ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, A); ctx.stroke(); }
  const ativa = menorAtiva();
  tiles.forEach((t) => {
    if (t.tocada) return;
    ctx.fillStyle = t === ativa ? "#222" : "#333";
    ctx.fillRect(t.col * cw + 2, t.y + 2, cw - 4, tileH - 4);
  });
}

tela.addEventListener("touchstart", (e) => { e.preventDefault(); for (const t of e.changedTouches) tocar(t.clientX); }, { passive: false });
tela.addEventListener("mousedown", (e) => tocar(e.clientX));
document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("piano");
novoJogo();
