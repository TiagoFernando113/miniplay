// Fluxo (Flow Free) — ligue os pares de cores preenchendo TODO o tabuleiro.
// Níveis infinitos: um caminho hamiltoniano aleatório é cortado em segmentos,
// garantindo que sempre existe solução e que ela preenche a grade toda.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

const CORES = ["#ff5555", "#4f8cff", "#3fd06f", "#ffd54f", "#ff8f3f", "#cf7fff", "#25c8e8", "#ff6fa5", "#a0d040", "#e08040"];

let N, cel, ox, oy, dots, dono, caminhos, corAtiva, alvo, ultimo, desenhando, nivel, laco = 0;

function embaralha(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// caminho que visita TODAS as células (hamiltoniano) por backtracking aleatório
function hamiltoniano(n) {
  const vis = Array.from({ length: n }, () => Array(n).fill(false));
  const cam = []; let passos = 0;
  const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const grau = (r, c) => { let g = 0; for (const [dr, dc] of DIRS) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n && !vis[nr][nc]) g++; } return g; };
  function dfs(r, c) {
    if (passos++ > 400000) return false;
    vis[r][c] = true; cam.push([r, c]);
    if (cam.length === n * n) return true;
    // vizinhos livres, ordenados pelo MENOR grau livre (Warnsdorff), empate aleatório
    const nbs = [];
    for (const [dr, dc] of DIRS) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n && !vis[nr][nc]) nbs.push([nr, nc, grau(nr, nc) + Math.random()]); }
    nbs.sort((a, b) => a[2] - b[2]);
    for (const [nr, nc] of nbs) if (dfs(nr, nc)) return true;
    vis[r][c] = false; cam.pop(); return false;
  }
  return dfs(Math.floor(Math.random() * n), Math.floor(Math.random() * n)) ? cam : null;
}
function serpentina(n) { const p = []; for (let r = 0; r < n; r++) { if (r % 2 === 0) for (let c = 0; c < n; c++) p.push([r, c]); else for (let c = n - 1; c >= 0; c--) p.push([r, c]); } return p; }

function gerarNivel(n, k) {
  const cam = hamiltoniano(n) || serpentina(n);
  const total = n * n;
  k = Math.min(k, Math.floor(total / 2), CORES.length);
  // composição aleatória em k partes, cada >= 2
  const partes = Array(k).fill(2); let resto = total - 2 * k;
  while (resto > 0) { partes[Math.floor(Math.random() * k)]++; resto--; }
  const ds = []; let i = 0;
  for (let p = 0; p < k; p++) { const a = cam[i], b = cam[i + partes[p] - 1]; ds.push([a, b]); i += partes[p]; }
  return ds;
}

function redimensionar() {
  const lado = Math.min(window.innerWidth, window.innerHeight - 90);
  tela.width = window.innerWidth; tela.height = window.innerHeight;
  cel = Math.floor((lado - 20) / N);
  ox = Math.floor((window.innerWidth - cel * N) / 2);
  oy = Math.floor((window.innerHeight - cel * N) / 2) + 10;
}
window.addEventListener("resize", () => { redimensionar(); desenhar(); });

function novoNivel() {
  N = 5 + Math.floor((nivel - 1) / 3);        // cresce a cada 3 níveis
  N = Math.min(N, 9);
  const k = Math.min(3 + Math.floor(nivel / 2), N + 1);
  const pares = gerarNivel(N, k);
  dots = [];
  dono = Array.from({ length: N }, () => Array(N).fill(-1));
  caminhos = [];
  pares.forEach(([a, b], cor) => {
    dots.push({ a, b, cor });
    dono[a[0]][a[1]] = cor; dono[b[0]][b[1]] = cor;
    caminhos[cor] = null;
  });
  corAtiva = -1; desenhando = false;
  placarEl.textContent = nivel;
  redimensionar(); desenhar();
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 2500);
}

function novoJogo() { nivel = 1; novoNivel(); }

function ehDot(r, c) { return dots.find((d) => (d.a[0] === r && d.a[1] === c) || (d.b[0] === r && d.b[1] === c)); }
function outroDot(cor, r, c) { const d = dots[cor]; if (d.a[0] === r && d.a[1] === c) return d.b; return d.a; }

function limparCaminho(cor) {
  if (!caminhos[cor]) return;
  caminhos[cor].forEach(([r, c], i) => { if (i > 0 && i < caminhos[cor].length && !(ehDot(r, c) && ehDot(r, c).cor === cor)) { if (dono[r][c] === cor) dono[r][c] = -1; } });
  // restaura os dots
  const d = dots[cor]; dono[d.a[0]][d.a[1]] = cor; dono[d.b[0]][d.b[1]] = cor;
  caminhos[cor] = null;
}

function celDe(x, y) { const c = Math.floor((x - ox) / cel), r = Math.floor((y - oy) / cel); if (r < 0 || c < 0 || r >= N || c >= N) return null; return [r, c]; }

function iniciar(x, y) {
  const p = celDe(x, y); if (!p) return;
  const [r, c] = p;
  const d = ehDot(r, c);
  if (d) { corAtiva = d.cor; limparCaminho(corAtiva); caminhos[corAtiva] = [[r, c]]; dono[r][c] = corAtiva; alvo = outroDot(corAtiva, r, c); desenhando = true; ultimo = [r, c]; Som.clique(); desenhar(); return; }
  // continuar de um caminho existente pela ponta
  if (dono[r][c] >= 0) { const cor = dono[r][c]; const cam = caminhos[cor]; if (cam && cam.length) { const idx = cam.findIndex((q) => q[0] === r && q[1] === c); if (idx >= 0) { // corta até aqui e continua
    for (let i = idx + 1; i < cam.length; i++) { const [rr, cc] = cam[i]; if (!(ehDot(rr, cc) && ehDot(rr, cc).cor === cor)) dono[rr][cc] = -1; }
    cam.length = idx + 1; corAtiva = cor; alvo = outroDot(cor, cam[0][0], cam[0][1]); desenhando = true; ultimo = [r, c]; desenhar(); return; } } }
}

function mover(x, y) {
  if (!desenhando) return;
  const p = celDe(x, y); if (!p) return;
  const [r, c] = p, [lr, lc] = ultimo;
  if (r === lr && c === lc) return;
  if (Math.abs(r - lr) + Math.abs(c - lc) !== 1) return; // só ortogonal e adjacente
  const cam = caminhos[corAtiva];
  // voltar sobre o próprio caminho = desfaz
  const idxProprio = cam.findIndex((q) => q[0] === r && q[1] === c);
  if (idxProprio >= 0) { for (let i = idxProprio + 1; i < cam.length; i++) { const [rr, cc] = cam[i]; if (!(ehDot(rr, cc) && ehDot(rr, cc).cor === corAtiva)) dono[rr][cc] = -1; } cam.length = idxProprio + 1; ultimo = [r, c]; desenhar(); return; }
  const d = ehDot(r, c);
  if (d && d.cor !== corAtiva) return; // não atravessa dot de outra cor
  const chegou = alvo[0] === r && alvo[1] === c;
  // célula de outra cor: corta o caminho dela
  if (dono[r][c] >= 0 && dono[r][c] !== corAtiva) {
    const outra = dono[r][c]; const co = caminhos[outra];
    if (co) { const k = co.findIndex((q) => q[0] === r && q[1] === c); if (k >= 0) { for (let i = k; i < co.length; i++) { const [rr, cc] = co[i]; if (!(ehDot(rr, cc) && ehDot(rr, cc).cor === outra)) dono[rr][cc] = -1; } co.length = k; } }
  }
  cam.push([r, c]); dono[r][c] = corAtiva; ultimo = [r, c];
  if (chegou) { desenhando = false; Som.acerto(); verificarVitoria(); }
  desenhar();
}

function conectada(cor) { const cam = caminhos[cor]; if (!cam || cam.length < 2) return false; const f = cam[cam.length - 1]; const d = dots[cor]; return (f[0] === d.a[0] && f[1] === d.a[1]) || (f[0] === d.b[0] && f[1] === d.b[1]); }

function verificarVitoria() {
  const todasConect = dots.every((_, cor) => conectada(cor));
  let cheio = true;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (dono[r][c] < 0) cheio = false;
  if (todasConect && cheio) {
    Som.vitoria(); vibrar([50, 30, 50]);
    Pontos.add(nivel + 2);
    const rec = Recordes.salvar("fluxo", nivel);
    if (window.Nuvem) Nuvem.enviarRecorde("fluxo", nivel);
    setTimeout(() => Modal.mostrar({
      emoji: "🏆", titulo: `Nível ${nivel} completo!`, texto: rec ? "Novo recorde!" : `+${nivel + 2} pontos`,
      botao: `Nível ${nivel + 1} →`, aoJogarDeNovo: () => { nivel++; novoNivel(); },
    }), 350);
  }
}

function desenhar() {
  ctx.fillStyle = "#0d1420"; ctx.fillRect(0, 0, tela.width, tela.height);
  // grade
  ctx.fillStyle = "#161f2e";
  ctx.fillRect(ox - 4, oy - 4, cel * N + 8, cel * N + 8);
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
  for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(ox + i * cel, oy); ctx.lineTo(ox + i * cel, oy + N * cel); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox, oy + i * cel); ctx.lineTo(ox + N * cel, oy + i * cel); ctx.stroke(); }
  // caminhos (linhas grossas arredondadas)
  caminhos.forEach((cam, cor) => {
    if (!cam || cam.length < 2) return;
    ctx.strokeStyle = CORES[cor]; ctx.lineWidth = cel * 0.42; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    cam.forEach(([r, c], i) => { const x = ox + c * cel + cel / 2, y = oy + r * cel + cel / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
  });
  // dots
  dots.forEach((d) => {
    [d.a, d.b].forEach(([r, c]) => {
      ctx.fillStyle = CORES[d.cor];
      ctx.beginPath(); ctx.arc(ox + c * cel + cel / 2, oy + r * cel + cel / 2, cel * 0.32, 0, 6.283); ctx.fill();
    });
  });
  // contador de conectadas
  const feitas = dots.filter((_, cor) => conectada(cor)).length;
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(`${feitas}/${dots.length} conectados`, tela.width / 2, oy + N * cel + 28);
}

function pos(e) { const t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e); const r = tela.getBoundingClientRect(); return [t.clientX - r.left, t.clientY - r.top]; }
tela.addEventListener("touchstart", (e) => { e.preventDefault(); iniciar(...pos(e)); }, { passive: false });
tela.addEventListener("touchmove", (e) => { e.preventDefault(); mover(...pos(e)); }, { passive: false });
tela.addEventListener("touchend", (e) => { e.preventDefault(); desenhando = false; }, { passive: false });
tela.addEventListener("mousedown", (e) => iniciar(...pos(e)));
tela.addEventListener("mousemove", (e) => { if (e.buttons) mover(...pos(e)); });
tela.addEventListener("mouseup", () => (desenhando = false));

document.getElementById("reiniciar").addEventListener("click", novoNivel);
configurarMelhor("fluxo");
novoJogo();
