// Ligue 4 — encaixe 4 em linha antes do bot. Você é vermelho, bot é amarelo.
const COLS = 7, LINS = 6;
const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const statusEl = document.getElementById("status");
const melhorEl = document.getElementById("melhor");

let grade, vez, fim, cel;

function redimensionar() {
  const lado = Math.min(380, window.innerWidth - 24);
  tela.width = lado; tela.height = lado * (LINS / COLS);
  cel = lado / COLS;
  desenhar();
}
window.addEventListener("resize", redimensionar);

function novoJogo() {
  grade = Array.from({ length: LINS }, () => Array(COLS).fill(0));
  vez = 1; fim = false;
  statusEl.textContent = "Sua vez!";
  melhorEl.textContent = Recordes.get("ligue4Vitorias") || 0;
  redimensionar();
}

function colunaLivre(g, c) { for (let r = LINS - 1; r >= 0; r--) if (g[r][c] === 0) return r; return -1; }

function venceu(g, j) {
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
    if (g[r][c] !== j) continue;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let n = 1;
      for (let k = 1; k < 4; k++) { const nr = r + dr * k, nc = c + dc * k; if (grade[nr] && g[nr][nc] === j) n++; else break; }
      if (n >= 4) return true;
    }
  }
  return false;
}

function jogar(c) {
  if (fim || vez !== 1) return;
  const r = colunaLivre(grade, c);
  if (r < 0) return;
  grade[r][c] = 1; Som.clique(); desenhar();
  if (venceu(grade, 1)) return terminar(1);
  if (grade.every((lin) => lin.every((v) => v))) return terminar(0);
  vez = 2; statusEl.textContent = "Bot pensando...";
  setTimeout(jogadaBot, 400);
}

function simula(g, c, j) { const nova = g.map((l) => l.slice()); const r = colunaLivre(nova, c); if (r < 0) return null; nova[r][c] = j; return nova; }

function jogadaBot() {
  if (fim) return;
  const validas = []; for (let c = 0; c < COLS; c++) if (colunaLivre(grade, c) >= 0) validas.push(c);
  let escolha = null;
  // ganha já?
  for (const c of validas) { const g = simula(grade, c, 2); if (g && venceu(g, 2)) { escolha = c; break; } }
  // bloqueia o jogador?
  if (escolha === null) for (const c of validas) { const g = simula(grade, c, 1); if (g && venceu(g, 1)) { escolha = c; break; } }
  // não dá jogada que deixa o jogador ganhar em seguida; prefere centro
  if (escolha === null) {
    const seguras = validas.filter((c) => { const g = simula(grade, c, 2); return !validas.some((c2) => { const g2 = simula(g, c2, 1); return g2 && venceu(g2, 1); }); });
    const pool = seguras.length ? seguras : validas;
    pool.sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));
    escolha = pool[Math.floor(Math.random() * Math.min(2, pool.length))];
  }
  const r = colunaLivre(grade, escolha); grade[r][escolha] = 2; Som.clique(); desenhar();
  if (venceu(grade, 2)) return terminar(2);
  if (grade.every((lin) => lin.every((v) => v))) return terminar(0);
  vez = 1; statusEl.textContent = "Sua vez!";
}

function terminar(quem) {
  fim = true;
  statusEl.textContent = quem === 1 ? "Você venceu!" : quem === 2 ? "Bot venceu!" : "Empate!";
  if (quem === 1) { Pontos.add(15); const v = (Recordes.get("ligue4Vitorias") || 0) + 1; Recordes.salvar("ligue4Vitorias", v); if (window.Nuvem) Nuvem.enviarRecorde("ligue4Vitorias", v); melhorEl.textContent = v; }
  Som[quem === 1 ? "vitoria" : "erro"]();
  setTimeout(() => Modal.mostrar({
    emoji: quem === 1 ? "🏆" : quem === 2 ? "😢" : "🤝",
    titulo: quem === 1 ? "Você ligou 4!" : quem === 2 ? "O bot ligou 4!" : "Empate!",
    texto: quem === 1 ? "+15 pontos" : "", aoJogarDeNovo: novoJogo,
  }), 500);
}

function desenhar() {
  if (!grade) return;
  ctx.fillStyle = "#2f5fd0"; ctx.fillRect(0, 0, tela.width, tela.height);
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
    const x = c * cel + cel / 2, y = r * cel + cel / 2;
    ctx.fillStyle = grade[r][c] === 1 ? "#ff5f5f" : grade[r][c] === 2 ? "#ffd54f" : "#12202f";
    ctx.beginPath(); ctx.arc(x, y, cel * 0.4, 0, 6.283); ctx.fill();
  }
}

tela.addEventListener("click", (e) => { const r = tela.getBoundingClientRect(); jogar(Math.floor(((e.clientX - r.left) / r.width) * COLS)); });
document.getElementById("reiniciar").addEventListener("click", novoJogo);
configurarMelhor("ligue4Vitorias");
novoJogo();
