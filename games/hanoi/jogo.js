// Torre de Hanói — mova a torre toda pra outro pino. Grande nunca sobre pequeno.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

let L, A, pinos, nDiscos, selecionado, movimentos, rodando, laco = 0, anim;
const CORES = ["#ff6f6f", "#ffd54f", "#6fdf9f", "#6fbfff", "#cf8fff", "#ff9f4f", "#ff7fbf"];

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", () => { redimensionar(); });

function novoJogo(discos) {
  redimensionar();
  nDiscos = discos || 3;
  pinos = [[], [], []];
  for (let d = nDiscos; d >= 1; d--) pinos[0].push(d);
  selecionado = null; movimentos = 0; rodando = true;
  placarEl.textContent = nDiscos + " discos";
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2500);
  if (!laco) iniciar();
}

function iniciar() { const meu = ++laco; const passo = () => { if (meu !== laco) return; desenhar(); requestAnimationFrame(passo); }; requestAnimationFrame(passo); }

function tocarPino(p) {
  if (!rodando) return;
  if (selecionado === null) {
    if (pinos[p].length) { selecionado = p; Som.clique(); }
  } else {
    if (p === selecionado) { selecionado = null; return; }
    const disco = pinos[selecionado][pinos[selecionado].length - 1];
    const topoDestino = pinos[p][pinos[p].length - 1];
    if (!topoDestino || disco < topoDestino) {
      pinos[selecionado].pop(); pinos[p].push(disco); movimentos++; selecionado = null; Som.acerto();
      if (pinos[1].length === nDiscos || pinos[2].length === nDiscos) venceu();
    } else { Som.erro(); vibrar(60); selecionado = null; }
  }
}

function venceu() {
  rodando = false;
  const otimo = Math.pow(2, nDiscos) - 1;
  Pontos.add(nDiscos * 5);
  const rec = Recordes.salvar("hanoiNivel", nDiscos);
  setTimeout(() => Modal.mostrar({
    emoji: "🏆", titulo: `Torre de ${nDiscos} discos resolvida!`,
    texto: `${movimentos} movimentos (ótimo: ${otimo}) · +${nDiscos * 5} pontos`,
    botao: `Próximo: ${Math.min(7, nDiscos + 1)} discos`,
    aoJogarDeNovo: () => novoJogo(Math.min(7, nDiscos + 1)),
  }), 300);
}

function desenhar() {
  ctx.fillStyle = "#12202f"; ctx.fillRect(0, 0, L, A);
  const base = A - 60, largPino = L / 3;
  ctx.fillStyle = "#3a4a5a";
  for (let p = 0; p < 3; p++) { const cx = largPino * p + largPino / 2; ctx.fillRect(cx - 4, base - 220, 8, 220); }
  ctx.fillRect(20, base, L - 40, 10);
  for (let p = 0; p < 3; p++) {
    const cx = largPino * p + largPino / 2;
    pinos[p].forEach((d, i) => {
      const w = 26 + d * ((largPino - 40) / (nDiscos + 1));
      const sel = selecionado === p && i === pinos[p].length - 1;
      ctx.fillStyle = CORES[(d - 1) % CORES.length];
      ctx.globalAlpha = sel ? 0.7 : 1;
      const y = base - 22 * (i + 1);
      ctx.fillRect(cx - w / 2, y, w, 18);
      ctx.globalAlpha = 1;
    });
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`Movimentos: ${movimentos}`, L / 2, A - 20);
}

tela.addEventListener("touchstart", (e) => { e.preventDefault(); tocarPino(Math.floor(e.changedTouches[0].clientX / (L / 3))); }, { passive: false });
tela.addEventListener("mousedown", (e) => tocarPino(Math.floor(e.clientX / (L / 3))));
document.getElementById("reiniciar").addEventListener("click", () => novoJogo(nDiscos));
configurarMelhor("hanoiNivel");
novoJogo(3);
