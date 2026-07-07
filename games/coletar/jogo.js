// Coletar — pegue os itens bons na cesta, evite as bombas.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, cesta, itens, pontos, vidas, rodando, laco = 0, spawn = 0, dificuldade;
const LARG = 84;

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  cesta = L / 2; itens = []; pontos = 0; vidas = 3; rodando = true; spawn = 0; dificuldade = 2.4;
  placarEl.textContent = "0";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2200);
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

function novoItem() {
  const r = Math.random();
  const tipo = r < 0.68 ? "fruta" : r < 0.85 ? "ouro" : "bomba";
  const cor = tipo === "fruta" ? "#6fdf9f" : tipo === "ouro" ? "#ffd54f" : "#ff5f5f";
  return { x: 20 + Math.random() * (L - 40), y: -20, r: tipo === "ouro" ? 11 : 14, vel: dificuldade + Math.random() * 2, tipo, cor };
}

function atualizar() {
  spawn--; dificuldade += 0.0009;
  if (spawn <= 0) { itens.push(novoItem()); spawn = Math.max(24, 60 - dificuldade * 6); }
  itens.forEach((it) => (it.y += it.vel));
  itens = itens.filter((it) => {
    if (it.y > A - 46 && it.y < A - 6 && Math.abs(it.x - cesta) < LARG / 2 + it.r) {
      if (it.tipo === "bomba") { vidas--; Som.erro(); vibrar(90); if (vidas <= 0) { fim(); } }
      else { pontos += it.tipo === "ouro" ? 5 : 1; placarEl.textContent = pontos; Som.acerto(); }
      return false;
    }
    if (it.y > A + 20) { if (it.tipo !== "bomba") { /* deixou cair um bom, tudo bem */ } return false; }
    return true;
  });
}

function fim() {
  rodando = false;
  Pontos.add(pontos);
  const rec = Recordes.salvar("coletar", pontos);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "🧺", titulo: rec ? "Novo recorde!" : "Fim de jogo",
    texto: `${pontos} pontos coletados`, aoJogarDeNovo: novoJogo,
  }), 300);
}

function desenhar() {
  ctx.fillStyle = "#0d1420"; ctx.fillRect(0, 0, L, A);
  itens.forEach((it) => {
    ctx.fillStyle = it.cor; ctx.beginPath(); ctx.arc(it.x, it.y, it.r, 0, 6.283); ctx.fill();
    if (it.tipo === "bomba") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(it.x, it.y - it.r); ctx.lineTo(it.x, it.y - it.r - 6); ctx.stroke(); }
  });
  // cesta
  ctx.fillStyle = "#b06b3a"; ctx.fillRect(cesta - LARG / 2, A - 44, LARG, 24);
  ctx.fillStyle = "#8a4f28"; ctx.fillRect(cesta - LARG / 2, A - 44, LARG, 6);
  ctx.fillStyle = "#ff6f6f"; ctx.font = "16px sans-serif"; ctx.textAlign = "left";
  ctx.fillText("♥".repeat(Math.max(0, vidas)), 12, 28);
}

function toque(e) { e.preventDefault(); const t = e.touches ? e.touches[0] : e; cesta = Math.max(LARG / 2, Math.min(L - LARG / 2, t.clientX)); }
tela.addEventListener("touchstart", toque, { passive: false });
tela.addEventListener("touchmove", toque, { passive: false });
tela.addEventListener("mousemove", (e) => { if (e.buttons) toque(e); });

document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("coletar");
novoJogo();
