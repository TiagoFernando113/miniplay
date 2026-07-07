// Conta Rápida — resolva a conta antes do tempo acabar. Erra ou zera = fim.
const perguntaEl = document.getElementById("pergunta");
const opsEl = document.getElementById("ops");
const placarEl = document.getElementById("placar");
const barraEl = document.getElementById("tempo-barra");

let acertos, respostaCerta, tempoMax, tempoAtual, timer, rodando;

function gerar() {
  const nivel = 1 + Math.floor(acertos / 4);
  const ops = nivel >= 3 ? ["+", "-", "×"] : nivel >= 2 ? ["+", "-"] : ["+"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 1 + Math.floor(Math.random() * (5 + nivel * 3));
  let b = 1 + Math.floor(Math.random() * (5 + nivel * 3));
  let r;
  if (op === "+") r = a + b;
  else if (op === "-") { if (b > a) [a, b] = [b, a]; r = a - b; }
  else { a = 1 + Math.floor(Math.random() * 9); b = 1 + Math.floor(Math.random() * 9); r = a * b; }
  respostaCerta = r;
  perguntaEl.textContent = `${a} ${op} ${b}`;

  // opções: certa + 3 próximas
  const set = new Set([r]);
  while (set.size < 4) { const d = r + (Math.floor(Math.random() * 9) - 4); if (d >= 0) set.add(d); }
  const opcoes = embaralhar([...set]);
  opsEl.innerHTML = "";
  opcoes.forEach((v) => {
    const b = document.createElement("button");
    b.className = "conta-op"; b.textContent = v;
    b.addEventListener("click", () => responder(v, b));
    opsEl.appendChild(b);
  });

  tempoMax = Math.max(1500, 4000 - acertos * 90);
  tempoAtual = tempoMax;
}

function tick() {
  tempoAtual -= 100;
  barraEl.style.width = Math.max(0, (tempoAtual / tempoMax) * 100) + "%";
  if (tempoAtual <= 0) fim();
}

function responder(v, botao) {
  if (!rodando) return;
  if (v === respostaCerta) {
    botao.classList.add("certo"); acertos++; placarEl.textContent = acertos; Som.acerto();
    setTimeout(gerar, 120);
  } else { botao.classList.add("errado"); Som.erro(); vibrar(90); fim(); }
}

function fim() {
  rodando = false; clearInterval(timer);
  Pontos.add(acertos);
  const rec = Recordes.salvar("conta", acertos);
  Modal.mostrar({
    emoji: rec ? "🏆" : "🧮", titulo: rec ? "Novo recorde!" : "Fim!",
    texto: `${acertos} contas certas`, aoJogarDeNovo: novoJogo,
  });
}

function novoJogo() {
  acertos = 0; rodando = true; placarEl.textContent = "0";
  clearInterval(timer); timer = setInterval(() => { if (rodando && !document.hidden) tick(); }, 100);
  gerar();
}

configurarMelhor("conta");
novoJogo();
