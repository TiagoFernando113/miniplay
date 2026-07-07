// Labirinto 3D — primeira pessoa via raycasting (canvas puro, sem biblioteca).
// Esquerda: joystick pra andar. Direita: arraste pra girar. Ache a saída verde.
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");
const mensagemEl = document.getElementById("mensagem");

const FOV = Math.PI / 3;
let L, A, mapa, cols, linhas, jogador, saida, nivel, rodando, laco = 0;
let joyMove = null, olharId = null, olharX = 0;
const toques = {};

function redimensionar() { tela.width = L = window.innerWidth; tela.height = A = window.innerHeight; }
window.addEventListener("resize", redimensionar);

// gera labirinto por DFS (backtracker). Retorna grade com 1=parede, 0=livre.
function gerarMapa(c, l) {
  const g = Array.from({ length: l }, () => Array(c).fill(1));
  const pilha = [[1, 1]]; g[1][1] = 0;
  const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
  while (pilha.length) {
    const [x, y] = pilha[pilha.length - 1];
    const opc = [];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < c - 1 && ny > 0 && ny < l - 1 && g[ny][nx] === 1) opc.push([nx, ny, dx, dy]);
    }
    if (opc.length) {
      const [nx, ny, dx, dy] = opc[Math.floor(Math.random() * opc.length)];
      g[y + dy / 2][x + dx / 2] = 0; g[ny][nx] = 0; pilha.push([nx, ny]);
    } else pilha.pop();
  }
  return g;
}

function novoJogo(nv) {
  redimensionar();
  nivel = nv || 1;
  cols = 9 + Math.min(12, nivel * 2) | 1; if (cols % 2 === 0) cols++;
  linhas = cols;
  mapa = gerarMapa(cols, linhas);
  // saída: célula livre mais longe do início (canto oposto)
  saida = { x: cols - 2, y: linhas - 2 };
  if (mapa[saida.y][saida.x] === 1) { saida.x = cols - 3; saida.y = linhas - 2; }
  mapa[saida.y][saida.x] = 2; // marca verde
  jogador = { x: 1.5, y: 1.5, ang: 0 };
  rodando = true;
  placarEl.textContent = nivel;
  mensagemEl.style.opacity = "1"; setTimeout(() => (mensagemEl.style.opacity = "0"), 3500);
  if (!laco) iniciar();
}

function iniciar() {
  const meu = ++laco;
  const passo = () => { if (meu !== laco) return; if (rodando && !document.hidden) atualizar(); render(); requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

function bloqueado(x, y) { const c = mapa[Math.floor(y)] && mapa[Math.floor(y)][Math.floor(x)]; return c === 1; }

function atualizar() {
  if (joyMove && (joyMove.dx || joyMove.dy)) {
    const frente = -joyMove.dy / 46, lado = joyMove.dx / 46;
    const cos = Math.cos(jogador.ang), sin = Math.sin(jogador.ang);
    const vel = 0.06;
    const nx = jogador.x + (cos * frente - sin * lado) * vel;
    const ny = jogador.y + (sin * frente + cos * lado) * vel;
    if (!bloqueado(nx, jogador.y)) jogador.x = nx;
    if (!bloqueado(jogador.x, ny)) jogador.y = ny;
  }
  // chegou na saída?
  if (Math.hypot(jogador.x - (saida.x + 0.5), jogador.y - (saida.y + 0.5)) < 0.7) venceu();
}

function venceu() {
  rodando = false; Som.vitoria(); vibrar([60, 40, 60]);
  Pontos.add(nivel * 4);
  const rec = Recordes.salvar("labirinto", nivel);
  setTimeout(() => Modal.mostrar({
    emoji: "🏆", titulo: `Saída encontrada! Nível ${nivel}`,
    texto: `+${nivel * 4} pontos`, botao: `Próximo nível`,
    aoJogarDeNovo: () => novoJogo(nivel + 1),
  }), 300);
}

function render() {
  // teto e chão
  ctx.fillStyle = "#22303f"; ctx.fillRect(0, 0, L, A / 2);
  ctx.fillStyle = "#161d26"; ctx.fillRect(0, A / 2, L, A / 2);

  const passos = Math.min(L, 320); // colunas de raycast
  const larguraCol = L / passos;
  for (let i = 0; i < passos; i++) {
    const rayAng = jogador.ang - FOV / 2 + (i / passos) * FOV;
    const cos = Math.cos(rayAng), sin = Math.sin(rayAng);
    // DDA
    let mapX = Math.floor(jogador.x), mapY = Math.floor(jogador.y);
    const deltaX = Math.abs(1 / cos), deltaY = Math.abs(1 / sin);
    let stepX, stepY, sideX, sideY;
    if (cos < 0) { stepX = -1; sideX = (jogador.x - mapX) * deltaX; } else { stepX = 1; sideX = (mapX + 1 - jogador.x) * deltaX; }
    if (sin < 0) { stepY = -1; sideY = (jogador.y - mapY) * deltaY; } else { stepY = 1; sideY = (mapY + 1 - jogador.y) * deltaY; }
    let lado = 0, tile = 0, seguro = 0;
    while (seguro++ < 64) {
      if (sideX < sideY) { sideX += deltaX; mapX += stepX; lado = 0; } else { sideY += deltaY; mapY += stepY; lado = 1; }
      if (!mapa[mapY] || mapa[mapY][mapX] === undefined) { tile = 1; break; }
      if (mapa[mapY][mapX] > 0) { tile = mapa[mapY][mapX]; break; }
    }
    let dist = lado === 0 ? sideX - deltaX : sideY - deltaY;
    if (dist < 0.01) dist = 0.01;
    const distCorr = dist * Math.cos(rayAng - jogador.ang);
    const altura = Math.min(A * 3, A / distCorr);
    const topo = A / 2 - altura / 2;
    // cor: verde na saída, cinza nas paredes; sombra por distância e lado
    let base = tile === 2 ? [80, 220, 110] : [150, 160, 175];
    const escuro = lado === 1 ? 0.72 : 1;
    const neblina = Math.max(0.25, 1 - distCorr / 12);
    const f = escuro * neblina;
    ctx.fillStyle = `rgb(${base[0] * f | 0},${base[1] * f | 0},${base[2] * f | 0})`;
    ctx.fillRect(i * larguraCol, topo, larguraCol + 1, altura);
  }

  desenharMinimapa();

  // joystick de andar
  if (joyMove) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joyMove.bx, joyMove.by, 46, 0, 6.283); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.arc(joyMove.kx, joyMove.ky, 20, 0, 6.283); ctx.fill();
  }
}

function desenharMinimapa() {
  const M = 90, esc = M / cols, mx = L - M - 12, my = 60;
  ctx.fillStyle = "rgba(8,12,20,0.7)"; ctx.fillRect(mx, my, M, M);
  for (let y = 0; y < linhas; y++) for (let x = 0; x < cols; x++) {
    if (mapa[y][x] === 1) ctx.fillStyle = "rgba(255,255,255,0.18)";
    else if (mapa[y][x] === 2) ctx.fillStyle = "#3fdf6f";
    else continue;
    ctx.fillRect(mx + x * esc, my + y * esc, esc + 0.5, esc + 0.5);
  }
  ctx.fillStyle = "#ffd54f"; ctx.beginPath(); ctx.arc(mx + jogador.x * esc, my + jogador.y * esc, 2.5, 0, 6.283); ctx.fill();
  // direção
  ctx.strokeStyle = "#ffd54f"; ctx.beginPath(); ctx.moveTo(mx + jogador.x * esc, my + jogador.y * esc);
  ctx.lineTo(mx + (jogador.x + Math.cos(jogador.ang) * 1.2) * esc, my + (jogador.y + Math.sin(jogador.ang) * 1.2) * esc); ctx.stroke();
}

// ---- controles: esquerda anda, direita gira ----
function fazJoy(x, y) { return { bx: x, by: y, kx: x, ky: y, dx: 0, dy: 0 }; }
function moveJoy(j, x, y) { let dx = x - j.bx, dy = y - j.by; const d = Math.hypot(dx, dy), R = 46; if (d > R) { dx = dx / d * R; dy = dy / d * R; } j.kx = j.bx + dx; j.ky = j.by + dy; j.dx = d > 8 ? dx : 0; j.dy = d > 8 ? dy : 0; }

tela.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const r = tela.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - r.left, y = t.clientY - r.top;
    if (x < L / 2) { joyMove = fazJoy(x, y); toques[t.identifier] = "move"; }
    else { olharId = t.identifier; olharX = x; toques[t.identifier] = "olhar"; }
  }
}, { passive: false });
tela.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const r = tela.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - r.left, y = t.clientY - r.top;
    if (toques[t.identifier] === "move" && joyMove) moveJoy(joyMove, x, y);
    else if (toques[t.identifier] === "olhar") { jogador.ang += (x - olharX) * 0.006; olharX = x; }
  }
}, { passive: false });
function soltar(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (toques[t.identifier] === "move") joyMove = null;
    else if (toques[t.identifier] === "olhar") olharId = null;
    delete toques[t.identifier];
  }
}
tela.addEventListener("touchend", soltar, { passive: false });
tela.addEventListener("touchcancel", soltar, { passive: false });
// PC: setas
window.addEventListener("keydown", (e) => {
  if (!jogador) return;
  const cos = Math.cos(jogador.ang), sin = Math.sin(jogador.ang), v = 0.15;
  if (e.key === "ArrowUp") { if (!bloqueado(jogador.x + cos * v, jogador.y)) jogador.x += cos * v; if (!bloqueado(jogador.x, jogador.y + sin * v)) jogador.y += sin * v; }
  if (e.key === "ArrowDown") { if (!bloqueado(jogador.x - cos * v, jogador.y)) jogador.x -= cos * v; if (!bloqueado(jogador.x, jogador.y - sin * v)) jogador.y -= sin * v; }
  if (e.key === "ArrowLeft") jogador.ang -= 0.12;
  if (e.key === "ArrowRight") jogador.ang += 0.12;
});

document.getElementById("reiniciar").addEventListener("click", () => novoJogo(nivel));
configurarMelhor("labirinto");
novoJogo(1);
