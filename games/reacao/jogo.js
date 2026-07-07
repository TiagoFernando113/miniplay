// Reação — teste de reflexo. Toque assim que ficar VERDE. Menor tempo = melhor.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const melhorEl = document.getElementById("melhor");
const mensagemEl = document.getElementById("mensagem");

let L, A, estado, inicio, timer, ultimo = "";
// estados: "espera" (toque pra começar), "aguardando" (vermelho), "vai" (verde), "resultado"

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; desenhar(); }
window.addEventListener("resize", redimensionar);

function texto() {
  if (estado === "espera") return ["Toque pra começar", ultimo];
  if (estado === "aguardando") return ["Espere o VERDE...", ""];
  if (estado === "vai") return ["TOQUE!", ""];
  if (estado === "cedo") return ["Cedo demais!", "Toque pra tentar de novo"];
  return ["", ""];
}

function corFundo() {
  if (estado === "aguardando") return "#b83a3a";
  if (estado === "vai") return "#2fb85f";
  if (estado === "cedo") return "#7a5a20";
  return "#1a2740";
}

function desenhar() {
  ctx.fillStyle = corFundo(); ctx.fillRect(0, 0, L, A);
  const [t1, t2] = texto();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = "bold 34px sans-serif"; ctx.fillText(t1, L / 2, A / 2 - 10);
  ctx.font = "18px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillText(t2, L / 2, A / 2 + 30);
}

function comecar() {
  estado = "aguardando"; desenhar();
  timer = setTimeout(() => { estado = "vai"; inicio = performance.now(); desenhar(); }, 1200 + Math.random() * 2800);
}

function tocar() {
  if (estado === "espera" || estado === "cedo") { comecar(); return; }
  if (estado === "aguardando") { clearTimeout(timer); estado = "cedo"; Som.erro(); vibrar(80); desenhar(); return; }
  if (estado === "vai") {
    const ms = Math.round(performance.now() - inicio);
    Som.acerto();
    const melhorAtual = Recordes.get("reacao");
    const rec = Recordes.salvar("reacao", ms, true); // menor é melhor
    if (melhorEl) melhorEl.textContent = Recordes.get("reacao");
    ultimo = `${ms} ms` + (rec ? " — novo recorde!" : "") + " · toque pra repetir";
    Pontos.add(Math.max(1, Math.round((500 - Math.min(500, ms)) / 20)));
    estado = "espera"; desenhar();
  }
}

tela.addEventListener("touchstart", (e) => { e.preventDefault(); tocar(); }, { passive: false });
tela.addEventListener("mousedown", tocar);
document.getElementById("reiniciar").addEventListener("click", () => { clearTimeout(timer); estado = "espera"; ultimo = ""; desenhar(); });

if (melhorEl) melhorEl.textContent = Recordes.get("reacao") || 0;
estado = "espera";
redimensionar();
if (mensagemEl) mensagemEl.style.opacity = "0";
