// Combine 3+. Como no original: 4 em linha cria doce LISTRADO (limpa linha e
// coluna ao ser combinado); 5 em linha cria a BOMBA 🌈 (troque com qualquer
// doce pra limpar todos daquela cor).
const LADO = 8;
const DOCES = ["🍬", "🍭", "🍩", "🍫", "🧁"];
const JOGADAS_INICIAIS = 20;

const gradeEl = document.getElementById("grade");
const jogadasEl = document.getElementById("jogadas");
const pontosPartidaEl = document.getElementById("pontos-partida");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let grade = []; // células {cor, tipo} — tipo: "n" | "listrado" | "bomba"
let jogadas = JOGADAS_INICIAIS;
let pontosPartida = 0;
let selecionado = null;
let animando = false;
let nivel = Recordes.get("docesNivel") || 1;

function metaDoNivel() {
  return 400 + nivel * 200;
}

function doceAleatorio() {
  return { cor: DOCES[Math.floor(Math.random() * DOCES.length)], tipo: "n" };
}

function indice(l, c) {
  return l * LADO + c;
}

function novoJogo() {
  jogadas = JOGADAS_INICIAIS;
  pontosPartida = 0;
  selecionado = null;
  animando = false;
  jogadasEl.textContent = String(jogadas);
  pontosPartidaEl.textContent = "0";
  document.getElementById("nivel").textContent = String(nivel);
  document.getElementById("meta").textContent = String(metaDoNivel());
  mensagemEl.textContent = `Faça ${metaDoNivel()} pontos em ${JOGADAS_INICIAIS} jogadas!`;

  grade = Array.from({ length: LADO }, () => Array(LADO).fill(null));
  do {
    for (let l = 0; l < LADO; l++)
      for (let c = 0; c < LADO; c++) grade[l][c] = doceAleatorio();
  } while (encontrarRuns().length > 0);

  desenhar();
}

function desenhar() {
  gradeEl.innerHTML = "";
  for (let l = 0; l < LADO; l++) {
    for (let c = 0; c < LADO; c++) {
      const celula = grade[l][c];
      const doce = document.createElement("div");
      doce.className = "doce";
      if (celula) {
        doce.textContent = celula.tipo === "bomba" ? "🌈" : celula.cor;
        if (celula.tipo === "listrado") doce.classList.add("listrado");
        if (celula.tipo === "bomba") doce.classList.add("bomba");
      }
      doce.addEventListener("click", () => toque(l, c));
      gradeEl.appendChild(doce);
    }
  }
}

function celulaEl(l, c) {
  return gradeEl.children[indice(l, c)];
}

function toque(l, c) {
  if (animando || jogadas <= 0) return;

  if (!selecionado) {
    selecionado = [l, c];
    celulaEl(l, c).classList.add("selecionado");
    Som.clique();
    return;
  }

  const [sl, sc] = selecionado;
  celulaEl(sl, sc).classList.remove("selecionado");

  if (sl === l && sc === c) {
    selecionado = null;
    return;
  }

  const vizinho = Math.abs(sl - l) + Math.abs(sc - c) === 1;
  if (!vizinho) {
    selecionado = [l, c];
    celulaEl(l, c).classList.add("selecionado");
    Som.clique();
    return;
  }

  selecionado = null;
  trocar(sl, sc, l, c);
}

function trocar(l1, c1, l2, c2) {
  const a = grade[l1][c1];
  const b = grade[l2][c2];

  // bomba: troca com qualquer doce e limpa a cor inteira
  if (a.tipo === "bomba" || b.tipo === "bomba") {
    jogadas--;
    jogadasEl.textContent = String(jogadas);
    mensagemEl.textContent = "";

    const limpar = new Set();
    if (a.tipo === "bomba" && b.tipo === "bomba") {
      // bomba + bomba = tabuleiro inteiro!
      for (let l = 0; l < LADO; l++)
        for (let c = 0; c < LADO; c++) limpar.add(indice(l, c));
    } else {
      const corAlvo = a.tipo === "bomba" ? b.cor : a.cor;
      for (let l = 0; l < LADO; l++)
        for (let c = 0; c < LADO; c++)
          if (grade[l][c] && grade[l][c].cor === corAlvo) limpar.add(indice(l, c));
      limpar.add(indice(l1, c1));
      limpar.add(indice(l2, c2));
    }
    Som.vitoria();
    vibrar([40, 30, 40]);
    processarLimpeza(limpar, 2, []);
    return;
  }

  [grade[l1][c1], grade[l2][c2]] = [b, a];

  const runs = encontrarRuns();
  if (runs.length === 0) {
    [grade[l1][c1], grade[l2][c2]] = [a, b]; // desfaz
    Som.erro();
    mensagemEl.textContent = "Essa troca não combina nada!";
    return;
  }

  jogadas--;
  jogadasEl.textContent = String(jogadas);
  mensagemEl.textContent = "";
  desenhar();
  processarRuns(runs, 1, [indice(l1, c1), indice(l2, c2)]);
}

function encontrarRuns() {
  const runs = [];

  for (let l = 0; l < LADO; l++) {
    let c = 0;
    while (c < LADO) {
      const celula = grade[l][c];
      if (!celula || !celula.cor) { c++; continue; }
      let fim = c;
      while (fim < LADO && grade[l][fim] && grade[l][fim].cor === celula.cor) fim++;
      if (fim - c >= 3) {
        runs.push({ cor: celula.cor, cels: Array.from({ length: fim - c }, (_, i) => indice(l, c + i)) });
      }
      c = fim;
    }
  }

  for (let c = 0; c < LADO; c++) {
    let l = 0;
    while (l < LADO) {
      const celula = grade[l][c];
      if (!celula || !celula.cor) { l++; continue; }
      let fim = l;
      while (fim < LADO && grade[fim][c] && grade[fim][c].cor === celula.cor) fim++;
      if (fim - l >= 3) {
        runs.push({ cor: celula.cor, cels: Array.from({ length: fim - l }, (_, i) => indice(l + i, c)) });
      }
      l = fim;
    }
  }

  return runs;
}

function processarRuns(runs, cascata, origens) {
  const limpar = new Set();
  const especiais = []; // { idx, tipo, cor } a criar no lugar

  for (const run of runs) {
    run.cels.forEach((i) => limpar.add(i));

    if (run.cels.length >= 5) {
      const idx = run.cels.find((i) => origens.includes(i)) ?? run.cels[Math.floor(run.cels.length / 2)];
      especiais.push({ idx, tipo: "bomba", cor: null });
    } else if (run.cels.length === 4) {
      const idx = run.cels.find((i) => origens.includes(i)) ?? run.cels[1];
      especiais.push({ idx, tipo: "listrado", cor: run.cor });
    }
  }

  especiais.forEach((e) => limpar.delete(e.idx));
  processarLimpeza(limpar, cascata, especiais);
}

function processarLimpeza(limpar, cascata, especiais) {
  animando = true;

  // listrados limpos detonam a linha e a coluna inteiras (em cadeia)
  const fila = [...limpar];
  while (fila.length) {
    const i = fila.pop();
    const l = Math.floor(i / LADO);
    const c = i % LADO;
    const celula = grade[l][c];
    if (celula && celula.tipo === "listrado") {
      for (let k = 0; k < LADO; k++) {
        for (const j of [indice(l, k), indice(k, c)]) {
          if (!limpar.has(j) && !especiais.some((e) => e.idx === j)) {
            limpar.add(j);
            fila.push(j);
          }
        }
      }
      grade[l][c] = { cor: celula.cor, tipo: "n" }; // já detonou
    }
  }

  pontosPartida += limpar.size * 10 * cascata;
  pontosPartidaEl.textContent = String(pontosPartida);
  Som.acerto();
  vibrar(20 * Math.min(cascata, 3));
  if (cascata > 1) mensagemEl.textContent = `Cascata x${cascata}! 🔥`;

  limpar.forEach((i) => gradeEl.children[i].classList.add("sumindo"));

  setTimeout(() => {
    limpar.forEach((i) => {
      grade[Math.floor(i / LADO)][i % LADO] = null;
    });
    especiais.forEach((e) => {
      grade[Math.floor(e.idx / LADO)][e.idx % LADO] = { cor: e.cor, tipo: e.tipo };
    });

    // gravidade: doces caem e novos surgem por cima
    for (let c = 0; c < LADO; c++) {
      const coluna = [];
      for (let l = LADO - 1; l >= 0; l--) {
        if (grade[l][c]) coluna.push(grade[l][c]);
      }
      for (let l = LADO - 1; l >= 0; l--) {
        grade[l][c] = coluna[LADO - 1 - l] || doceAleatorio();
      }
    }

    desenhar();
    // animação de queda em todo o tabuleiro
    [...gradeEl.children].forEach((d) => d.classList.add("caindo"));

    const novas = encontrarRuns();
    if (novas.length > 0) {
      processarRuns(novas, cascata + 1, []);
    } else {
      animando = false;
      if (pontosPartida >= metaDoNivel()) terminar(true);
      else if (jogadas <= 0) terminar(false);
      else Retomar.salvar("doces", { grade, jogadas, pontos: pontosPartida });
    }
  }, 300);
}

function terminar(venceu) {
  Retomar.limpar("doces");
  Recordes.salvar("doces", pontosPartida);

  if (venceu) {
    const ganhos = 20 + nivel * 10;
    Pontos.add(ganhos);
    const nivelConcluido = nivel;
    nivel++;
    Recordes.salvar("docesNivel", nivel);
    Som.vitoria();
    vibrar([60, 40, 60]);
    setTimeout(() => Modal.mostrar({
      emoji: "🍬",
      titulo: `Nível ${nivelConcluido} concluído!`,
      texto: `${pontosPartida} pontos • +${ganhos} pontos`,
      botao: `Ir pro nível ${nivel} →`,
      aoJogarDeNovo: novoJogo,
    }), 400);
  } else {
    const ganhos = Math.max(Math.floor(pontosPartida / 50), 3);
    Pontos.add(ganhos);
    Som.erro();
    setTimeout(() => Modal.mostrar({
      emoji: "😅",
      titulo: "Não bateu a meta!",
      texto: `${pontosPartida} / ${metaDoNivel()} • +${ganhos} pontos`,
      botao: "Tentar de novo",
      aoJogarDeNovo: novoJogo,
    }), 400);
  }
}

botaoReiniciar.addEventListener("click", () => {
  Retomar.limpar("doces");
  novoJogo();
});

{
  const salva = Retomar.carregar("doces");
  if (salva && confirm("Continuar a partida anterior?")) {
    novoJogo(); // monta placar/nível
    grade = salva.grade;
    jogadas = salva.jogadas;
    pontosPartida = salva.pontos;
    jogadasEl.textContent = String(jogadas);
    pontosPartidaEl.textContent = String(pontosPartida);
    desenhar();
  } else {
    Retomar.limpar("doces");
    novoJogo();
  }
}
