const LADO = 4;

const gradeEl = document.getElementById("grade");
const movimentosEl = document.getElementById("movimentos");
const botaoReiniciar = document.getElementById("reiniciar");

let blocos = []; // 0 representa o espaço vazio
let movimentos = 0;
let jogando = false;

function posicaoVazia() {
  return blocos.indexOf(0);
}

function podeMover(i) {
  const vazio = posicaoVazia();
  const li = Math.floor(i / LADO), ci = i % LADO;
  const lv = Math.floor(vazio / LADO), cv = vazio % LADO;
  return Math.abs(li - lv) + Math.abs(ci - cv) === 1;
}

function embaralhar() {
  blocos = [...Array(15).keys()].map((n) => n + 1).concat(0);
  // embaralha com movimentos válidos a partir do resolvido — sempre tem solução
  let anterior = -1;
  for (let n = 0; n < 300; n++) {
    const vazio = posicaoVazia();
    const opcoes = [];
    for (let i = 0; i < 16; i++) {
      if (podeMover(i) && i !== anterior) opcoes.push(i);
    }
    const escolhido = opcoes[Math.floor(Math.random() * opcoes.length)];
    anterior = vazio;
    [blocos[vazio], blocos[escolhido]] = [blocos[escolhido], blocos[vazio]];
  }
  movimentos = 0;
  movimentosEl.textContent = "0";
  jogando = true;
  desenhar();
}

function desenhar() {
  gradeEl.innerHTML = "";
  blocos.forEach((valor, i) => {
    const bloco = document.createElement("div");
    bloco.className = "bloco" + (valor === 0 ? " vazio" : "");
    bloco.textContent = valor || "";
    if (valor !== 0) bloco.addEventListener("click", () => mover(i));
    gradeEl.appendChild(bloco);
  });
}

function mover(i) {
  if (!jogando || !podeMover(i)) return;
  const vazio = posicaoVazia();
  [blocos[vazio], blocos[i]] = [blocos[i], blocos[vazio]];
  movimentos++;
  movimentosEl.textContent = String(movimentos);
  Som.clique();
  desenhar();
  verificarVitoria();
}

function verificarVitoria() {
  const resolvido = blocos.slice(0, 15).every((v, i) => v === i + 1);
  if (!resolvido) return;

  jogando = false;
  const ganhos = Math.max(120 - Math.floor(movimentos / 4), 30);
  Pontos.add(ganhos);
  const novoRecorde = Recordes.salvar("puzzle15", movimentos, true);
  Som.vitoria();
  vibrar([60, 40, 60]);
  setTimeout(() => Modal.mostrar({
    emoji: novoRecorde ? "🏆" : "🧩",
    titulo: novoRecorde ? "Novo recorde!" : "Resolvido!",
    texto: `${movimentos} movimentos • +${ganhos} pontos`,
    botao: "Embaralhar",
    aoJogarDeNovo: embaralhar,
  }), 400);
}

botaoReiniciar.addEventListener("click", embaralhar);
embaralhar();
