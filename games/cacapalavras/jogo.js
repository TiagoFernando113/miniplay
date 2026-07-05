const LADO = 10;
// dicionário com 8.000 palavras (js/palavras.js) — variação praticamente infinita
const BANCO = PALAVRAS_PT;
const gradeEl = document.getElementById("grade");
const listaEl = document.getElementById("lista-palavras");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");
const nivelEl = document.getElementById("nivel");
const contagemEl = document.getElementById("contagem");
const totalEl = document.getElementById("total");

let nivel = Recordes.get("cacaNivel") || 1;

function quantidadeDoNivel() {
  return Math.min(3 + nivel, 9);
}

let grade = [];
let palavras = [];
let achadas = new Set();
let primeiraCelula = null;

function novoJogo() {
  grade = Array.from({ length: LADO }, () => Array(LADO).fill(""));
  achadas = new Set();
  primeiraCelula = null;
  mensagemEl.textContent = "Toque na 1ª e na última letra da palavra";
  nivelEl.textContent = String(nivel);
  contagemEl.textContent = "0";

  const banco = [...BANCO].sort(() => Math.random() - 0.5);
  palavras = [];
  for (const palavra of banco) {
    if (palavras.length === quantidadeDoNivel()) break;
    if (colocarPalavra(palavra)) palavras.push(palavra);
  }
  totalEl.textContent = String(palavras.length);

  const ALFABETO = "ABCDEFGHIJLMNOPRSTUV";
  for (let l = 0; l < LADO; l++) {
    for (let c = 0; c < LADO; c++) {
      if (!grade[l][c]) grade[l][c] = ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    }
  }

  desenhar();
}

function colocarPalavra(palavra) {
  // direções: horizontal, vertical e as duas diagonais
  const DIRECOES = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let tentativa = 0; tentativa < 150; tentativa++) {
    const [dl, dc] = DIRECOES[Math.floor(Math.random() * DIRECOES.length)];
    const l = Math.floor(Math.random() * LADO);
    const c = Math.floor(Math.random() * LADO);

    const fimL = l + dl * (palavra.length - 1);
    const fimC = c + dc * (palavra.length - 1);
    if (fimL < 0 || fimL >= LADO || fimC < 0 || fimC >= LADO) continue;

    let cabe = true;
    for (let i = 0; i < palavra.length; i++) {
      const atual = grade[l + dl * i][c + dc * i];
      if (atual && atual !== palavra[i]) {
        cabe = false;
        break;
      }
    }
    if (!cabe) continue;

    for (let i = 0; i < palavra.length; i++) {
      grade[l + dl * i][c + dc * i] = palavra[i];
    }
    return true;
  }
  return false;
}

function desenhar() {
  gradeEl.innerHTML = "";
  for (let l = 0; l < LADO; l++) {
    for (let c = 0; c < LADO; c++) {
      const celula = document.createElement("div");
      celula.className = "letra";
      celula.textContent = grade[l][c];
      celula.dataset.l = l;
      celula.dataset.c = c;
      celula.addEventListener("click", () => toque(celula));
      gradeEl.appendChild(celula);
    }
  }

  listaEl.innerHTML = "";
  palavras.forEach((palavra) => {
    const item = document.createElement("span");
    item.textContent = palavra;
    item.dataset.palavra = palavra;
    listaEl.appendChild(item);
  });
}

function celulasEntre(a, b) {
  const la = +a.dataset.l, ca = +a.dataset.c;
  const lb = +b.dataset.l, cb = +b.dataset.c;
  const difL = lb - la;
  const difC = cb - ca;

  // aceita linha, coluna ou diagonal perfeita
  const ehLinha = difL === 0;
  const ehColuna = difC === 0;
  const ehDiagonal = Math.abs(difL) === Math.abs(difC) && difL !== 0;
  if (!ehLinha && !ehColuna && !ehDiagonal) return null;

  const passos = Math.max(Math.abs(difL), Math.abs(difC));
  const dl = Math.sign(difL);
  const dc = Math.sign(difC);

  const celulas = [];
  for (let i = 0; i <= passos; i++) {
    celulas.push(gradeEl.children[(la + dl * i) * LADO + (ca + dc * i)]);
  }
  return celulas;
}

function toque(celula) {
  if (!primeiraCelula) {
    primeiraCelula = celula;
    celula.classList.add("selecionada");
    Som.clique();
    return;
  }

  const caminho = celulasEntre(primeiraCelula, celula);
  primeiraCelula.classList.remove("selecionada");
  primeiraCelula = null;

  if (!caminho) {
    Som.erro();
    return;
  }

  const texto = caminho.map((c) => c.textContent).join("");
  const reverso = [...texto].reverse().join("");
  const encontrada = palavras.find(
    (p) => !achadas.has(p) && (p === texto || p === reverso)
  );

  if (encontrada) {
    achadas.add(encontrada);
    contagemEl.textContent = String(achadas.size);
    caminho.forEach((c) => c.classList.add("achada"));
    listaEl.querySelector(`[data-palavra="${encontrada}"]`).classList.add("achada");
    Som.acerto();
    vibrar(30);
    Pontos.add(10);

    if (achadas.size === palavras.length) {
      const bonus = 20 + nivel * 10;
      Pontos.add(bonus);
      Recordes.incrementar("cacaVitorias");
      const nivelConcluido = nivel;
      nivel++;
      Recordes.salvar("cacaNivel", nivel);
      Som.vitoria();
      vibrar([60, 40, 60]);
      setTimeout(() => Modal.mostrar({
        emoji: "🔍",
        titulo: `Nível ${nivelConcluido} concluído!`,
        texto: `+${palavras.length * 10 + bonus} pontos no total`,
        botao: `Ir pro nível ${nivel} →`,
        aoJogarDeNovo: novoJogo,
      }), 400);
    }
  } else {
    Som.erro();
  }
}

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
