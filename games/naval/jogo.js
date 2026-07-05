const LADO = 8;
const NAVIOS = [4, 3, 3, 2];

const gradeInimigaEl = document.getElementById("grade-inimiga");
const gradeMinhaEl = document.getElementById("grade-minha");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let frotaBot, frotaMinha; // matrizes com id do navio ou 0
let tirosMeus, tirosBot; // matrizes booleanas
let minhaVez = true;
let fimDeJogo = false;
let alvosBot = []; // fila de caça do bot após acertar
let afundadosBot = new Set();
let afundadosMeus = new Set();

function matriz(valor) {
  return Array.from({ length: LADO }, () => Array(LADO).fill(valor));
}

function posicionarFrota() {
  const frota = matriz(0);
  let id = 1;
  for (const tamanho of NAVIOS) {
    for (let tentativa = 0; tentativa < 500; tentativa++) {
      const horizontal = Math.random() < 0.5;
      const l = Math.floor(Math.random() * (horizontal ? LADO : LADO - tamanho + 1));
      const c = Math.floor(Math.random() * (horizontal ? LADO - tamanho + 1 : LADO));

      let livre = true;
      for (let i = 0; i < tamanho; i++) {
        if (frota[horizontal ? l : l + i][horizontal ? c + i : c]) {
          livre = false;
          break;
        }
      }
      if (!livre) continue;

      for (let i = 0; i < tamanho; i++) {
        frota[horizontal ? l : l + i][horizontal ? c + i : c] = id;
      }
      break;
    }
    id++;
  }
  return frota;
}

function novoJogo() {
  frotaBot = posicionarFrota();
  frotaMinha = posicionarFrota();
  tirosMeus = matriz(false);
  tirosBot = matriz(false);
  minhaVez = true;
  fimDeJogo = false;
  alvosBot = [];
  afundadosBot = new Set();
  afundadosMeus = new Set();
  mensagemEl.textContent = "Afunde os 4 navios do bot!";
  desenhar();
}

function desenhar() {
  gradeInimigaEl.innerHTML = "";
  gradeMinhaEl.innerHTML = "";

  for (let l = 0; l < LADO; l++) {
    for (let c = 0; c < LADO; c++) {
      const celulaInimiga = document.createElement("div");
      celulaInimiga.className = "agua";
      if (tirosMeus[l][c]) {
        if (frotaBot[l][c]) {
          celulaInimiga.classList.add("tiro-acerto");
          celulaInimiga.textContent = afundadosBot.has(frotaBot[l][c]) ? "☠️" : "💥";
        } else {
          celulaInimiga.classList.add("tiro-agua");
          celulaInimiga.textContent = "•";
        }
      }
      celulaInimiga.addEventListener("click", () => atirar(l, c));
      gradeInimigaEl.appendChild(celulaInimiga);

      const celulaMinha = document.createElement("div");
      celulaMinha.className = "agua";
      if (frotaMinha[l][c]) celulaMinha.classList.add("navio");
      if (tirosBot[l][c]) {
        if (frotaMinha[l][c]) {
          celulaMinha.classList.add("tiro-acerto");
          celulaMinha.textContent = afundadosMeus.has(frotaMinha[l][c]) ? "☠️" : "💥";
        } else {
          celulaMinha.classList.add("tiro-agua");
          celulaMinha.textContent = "•";
        }
      }
      gradeMinhaEl.appendChild(celulaMinha);
    }
  }
}

function navioAfundado(frota, tiros, id) {
  for (let l = 0; l < LADO; l++)
    for (let c = 0; c < LADO; c++)
      if (frota[l][c] === id && !tiros[l][c]) return false;
  return true;
}

function tamanhoDoNavio(frota, id) {
  let n = 0;
  for (let l = 0; l < LADO; l++)
    for (let c = 0; c < LADO; c++) if (frota[l][c] === id) n++;
  return n;
}

function marcarAfundado(frota, tiros, gradeEl2, id) {
  for (let l = 0; l < LADO; l++)
    for (let c = 0; c < LADO; c++)
      if (frota[l][c] === id) {
        const celula = gradeEl2.children[l * LADO + c];
        celula.textContent = "☠️";
      }
}

function contarVivos(frota, tiros) {
  let vivos = 0;
  for (let l = 0; l < LADO; l++)
    for (let c = 0; c < LADO; c++)
      if (frota[l][c] && !tiros[l][c]) vivos++;
  return vivos;
}

function atirar(l, c) {
  if (fimDeJogo || !minhaVez || tirosMeus[l][c]) return;

  tirosMeus[l][c] = true;
  if (frotaBot[l][c]) {
    Som.acerto();
    vibrar(30);
    const id = frotaBot[l][c];
    if (navioAfundado(frotaBot, tirosMeus, id)) {
      afundadosBot.add(id);
      Som.vitoria();
      vibrar([40, 30, 40]);
      mensagemEl.textContent = `☠️ AFUNDOU um navio de ${tamanhoDoNavio(frotaBot, id)}! Atire de novo`;
      desenhar();
      marcarAfundado(frotaBot, tirosMeus, gradeInimigaEl, id);
      if (contarVivos(frotaBot, tirosMeus) === 0) vencer();
      return;
    }
    mensagemEl.textContent = "Acertou! 💥 Atire de novo";
  } else {
    Som.clique();
    mensagemEl.textContent = "Água... vez do bot";
    minhaVez = false;
    setTimeout(vezDoBot, 900);
  }
  desenhar();

  if (contarVivos(frotaBot, tirosMeus) === 0) {
    vencer();
  }
}

function vezDoBot() {
  if (fimDeJogo) return;

  let l, c;
  // modo caça: persegue vizinhos do último acerto
  while (alvosBot.length) {
    const [al, ac] = alvosBot.pop();
    if (!tirosBot[al][ac]) {
      l = al;
      c = ac;
      break;
    }
  }
  if (l === undefined) {
    do {
      l = Math.floor(Math.random() * LADO);
      c = Math.floor(Math.random() * LADO);
    } while (tirosBot[l][c]);
  }

  tirosBot[l][c] = true;

  if (frotaMinha[l][c]) {
    Som.erro();
    vibrar(60);
    const idMeu = frotaMinha[l][c];
    const afundou = navioAfundado(frotaMinha, tirosBot, idMeu);
    if (afundou) afundadosMeus.add(idMeu);
    // adiciona vizinhos à fila de caça
    [[l - 1, c], [l + 1, c], [l, c - 1], [l, c + 1]].forEach(([nl, nc]) => {
      if (nl >= 0 && nl < LADO && nc >= 0 && nc < LADO && !tirosBot[nl][nc]) {
        alvosBot.push([nl, nc]);
      }
    });
    desenhar();

    if (contarVivos(frotaMinha, tirosBot) === 0) {
      perder();
      return;
    }
    mensagemEl.textContent = afundou
      ? `☠️ O bot AFUNDOU seu navio de ${tamanhoDoNavio(frotaMinha, idMeu)}!`
      : "O bot acertou sua frota! Ele atira de novo...";
    if (afundou) marcarAfundado(frotaMinha, tirosBot, gradeMinhaEl, idMeu);
    setTimeout(vezDoBot, 900);
  } else {
    desenhar();
    minhaVez = true;
    mensagemEl.textContent = "O bot errou — sua vez!";
  }
}

function vencer() {
  fimDeJogo = true;
  Pontos.add(100);
  Recordes.incrementar("navalVitorias");
  Som.vitoria();
  vibrar([80, 40, 80]);
  setTimeout(() => Modal.mostrar({
    emoji: "🏆",
    titulo: "Frota inimiga afundada!",
    texto: "+100 pontos",
    botao: "Nova batalha",
    aoJogarDeNovo: novoJogo,
  }), 500);
}

function perder() {
  fimDeJogo = true;
  Som.erro();
  setTimeout(() => Modal.mostrar({
    emoji: "🌊",
    titulo: "Sua frota afundou!",
    texto: "Tente de novo",
    botao: "Nova batalha",
    aoJogarDeNovo: novoJogo,
  }), 500);
}

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
