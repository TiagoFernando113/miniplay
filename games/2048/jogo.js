const TAMANHO = 4;

const gradeEl = document.getElementById("grade");
const pontosPartidaEl = document.getElementById("pontos-partida");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let grade = [];
let pontosPartida = 0;
let fimDeJogo = false;

function novoJogo() {
  grade = Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(0));
  pontosPartida = 0;
  fimDeJogo = false;
  mensagemEl.textContent = "Deslize o dedo para mover as peças";
  adicionarPeca();
  adicionarPeca();
  desenhar();
}

let posicaoNova = null;
let fundidas = [];

function adicionarPeca() {
  const vazias = [];
  for (let l = 0; l < TAMANHO; l++)
    for (let c = 0; c < TAMANHO; c++)
      if (!grade[l][c]) vazias.push([l, c]);
  if (!vazias.length) return;
  const [l, c] = vazias[Math.floor(Math.random() * vazias.length)];
  grade[l][c] = Math.random() < 0.9 ? 2 : 4;
  posicaoNova = l * TAMANHO + c;
}

function desenhar() {
  gradeEl.innerHTML = "";
  pontosPartidaEl.textContent = String(pontosPartida);
  for (let l = 0; l < TAMANHO; l++) {
    for (let c = 0; c < TAMANHO; c++) {
      const peca = document.createElement("div");
      const v = grade[l][c];
      const indice = l * TAMANHO + c;
      peca.className = "peca" + (v ? " v" + v : "");
      if (indice === posicaoNova) peca.classList.add("nova");
      if (fundidas.includes(indice)) peca.classList.add("fundida");
      peca.textContent = v || "";
      gradeEl.appendChild(peca);
    }
  }
}

let houveJuncao = false;

function deslizarLinha(linha) {
  const semZeros = linha.filter((v) => v);
  for (let i = 0; i < semZeros.length - 1; i++) {
    if (semZeros[i] === semZeros[i + 1]) {
      semZeros[i] *= 2;
      pontosPartida += semZeros[i];
      houveJuncao = true;
      if (semZeros[i] === 2048 && !fimDeJogo) {
        Pontos.add(200);
        mensagemEl.textContent = "Chegou no 2048! 🏆 +200 pontos";
      }
      semZeros.splice(i + 1, 1);
    }
  }
  while (semZeros.length < TAMANHO) semZeros.push(0);
  return semZeros;
}

function mover(direcao) {
  if (fimDeJogo) return;
  const antes = JSON.stringify(grade);
  houveJuncao = false;

  if (direcao === "esquerda" || direcao === "direita") {
    for (let l = 0; l < TAMANHO; l++) {
      let linha = [...grade[l]];
      if (direcao === "direita") linha.reverse();
      linha = deslizarLinha(linha);
      if (direcao === "direita") linha.reverse();
      grade[l] = linha;
    }
  } else {
    for (let c = 0; c < TAMANHO; c++) {
      let coluna = grade.map((l) => l[c]);
      if (direcao === "baixo") coluna.reverse();
      coluna = deslizarLinha(coluna);
      if (direcao === "baixo") coluna.reverse();
      coluna.forEach((v, l) => (grade[l][c] = v));
    }
  }

  if (JSON.stringify(grade) !== antes) {
    // células cujo valor cresceu = fusões desta jogada
    const gradeAntes = JSON.parse(antes);
    fundidas = [];
    for (let l = 0; l < TAMANHO; l++)
      for (let c = 0; c < TAMANHO; c++)
        if (grade[l][c] && grade[l][c] > gradeAntes[l][c] && gradeAntes.flat().includes(grade[l][c] / 2))
          fundidas.push(l * TAMANHO + c);
    if (houveJuncao) {
      Som.acerto();
      vibrar(15);
    } else {
      Som.clique();
    }
    adicionarPeca();
    desenhar();
    verificarFim();
    if (!fimDeJogo) Retomar.salvar("2048", { grade, pontos: pontosPartida });
  }
}

function verificarFim() {
  for (let l = 0; l < TAMANHO; l++) {
    for (let c = 0; c < TAMANHO; c++) {
      if (!grade[l][c]) return;
      if (c < TAMANHO - 1 && grade[l][c] === grade[l][c + 1]) return;
      if (l < TAMANHO - 1 && grade[l][c] === grade[l + 1][c]) return;
    }
  }
  fimDeJogo = true;
  Retomar.limpar("2048");
  const ganhos = Math.max(Math.floor(pontosPartida / 20), 5);
  Pontos.add(ganhos);
  const novoRecorde = Recordes.salvar("p2048", pontosPartida);
  Som.erro();
  Modal.mostrar({
    emoji: novoRecorde ? "🏆" : "🔢",
    titulo: novoRecorde ? "Novo recorde!" : "Fim de jogo!",
    texto: `Partida: ${pontosPartida} • +${ganhos} pontos`,
    aoJogarDeNovo: novoJogo,
  });
}

let toqueX = 0;
let toqueY = 0;

// deslize funciona na tela inteira, e a página nunca rola junto
document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

document.addEventListener("touchstart", (e) => {
  toqueX = e.touches[0].clientX;
  toqueY = e.touches[0].clientY;
});

document.addEventListener("touchend", (e) => {
  if (e.target.closest("button, a")) return; // botões continuam normais
  const dx = e.changedTouches[0].clientX - toqueX;
  const dy = e.changedTouches[0].clientY - toqueY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) mover(dx > 0 ? "direita" : "esquerda");
  else mover(dy > 0 ? "baixo" : "cima");
});

document.addEventListener("keydown", (e) => {
  const mapa = {
    ArrowLeft: "esquerda",
    ArrowRight: "direita",
    ArrowUp: "cima",
    ArrowDown: "baixo",
  };
  if (mapa[e.key]) {
    e.preventDefault();
    mover(mapa[e.key]);
  }
});

botaoReiniciar.addEventListener("click", () => {
  Retomar.limpar("2048");
  novoJogo();
});

// retoma a partida salva, se houver
{
  const salva = Retomar.carregar("2048");
  if (salva && confirm("Continuar a partida anterior?")) {
    grade = salva.grade;
    pontosPartida = salva.pontos;
    fimDeJogo = false;
    desenhar();
  } else {
    Retomar.limpar("2048");
    novoJogo();
  }
}

configurarMelhor("p2048");
