const POOL_EMOJIS = [
  "🍎", "🍌", "🍇", "🍉", "🍒", "🍋", "🍓", "🥝", "🍍", "🥥",
  "🐶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐙", "🦋", "🐢", "🦜",
  "⚽", "🏀", "🎸", "🎈", "🚀", "🎁", "🌵", "🍕", "🎩", "🌈",
];

const NIVEIS = {
  facil: { pares: 6, base: 60 },
  medio: { pares: 8, base: 100 },
  dificil: { pares: 10, base: 140 },
};

function versoDaCarta() {
  return window.Cosmetico ? Cosmetico.dados("carta") : "?";
}

const tabuleiroEl = document.getElementById("tabuleiro");
const jogadasEl = document.getElementById("jogadas");
const paresEl = document.getElementById("pares");
const totalParesEl = document.getElementById("total-pares");
const botaoReiniciar = document.getElementById("reiniciar");
const seletorEl = document.getElementById("seletor-dificuldade");

let nivel = "medio";
let emojisDoNivel = [];
let cartasViradas = [];
let paresEncontrados = 0;
let jogadas = 0;
let travado = false;

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function criarTabuleiro() {
  // sorteia emojis diferentes do pool a cada partida
  emojisDoNivel = embaralhar(POOL_EMOJIS).slice(0, NIVEIS[nivel].pares);
  tabuleiroEl.innerHTML = "";
  cartasViradas = [];
  paresEncontrados = 0;
  jogadas = 0;
  travado = false;
  jogadasEl.textContent = "0";
  paresEl.textContent = "0";
  totalParesEl.textContent = String(emojisDoNivel.length);

  const valores = embaralhar([...emojisDoNivel, ...emojisDoNivel]);

  valores.forEach((emoji) => {
    const carta = document.createElement("div");
    carta.className = "carta";
    carta.dataset.valor = emoji;
    carta.innerHTML = `<span class="verso">${versoDaCarta()}</span>`;
    carta.addEventListener("click", () => virarCarta(carta));
    tabuleiroEl.appendChild(carta);
  });
}

function virarCarta(carta) {
  if (travado) return;
  if (carta.classList.contains("virada") || carta.classList.contains("encontrada")) return;
  if (cartasViradas.length === 2) return;

  Som.clique();
  carta.classList.add("virada");
  carta.textContent = carta.dataset.valor;
  cartasViradas.push(carta);

  if (cartasViradas.length === 2) {
    jogadas++;
    jogadasEl.textContent = String(jogadas);
    verificarPar();
  }
}

function verificarPar() {
  const [a, b] = cartasViradas;
  if (a.dataset.valor === b.dataset.valor) {
    Som.acerto();
    vibrar(25);
    a.classList.add("encontrada");
    b.classList.add("encontrada");
    cartasViradas = [];
    paresEncontrados++;
    paresEl.textContent = String(paresEncontrados);

    if (paresEncontrados === emojisDoNivel.length) {
      const ganhos = Math.max(NIVEIS[nivel].base - (jogadas - emojisDoNivel.length) * 5, 20);
      Pontos.add(ganhos);
      const novoRecorde = Recordes.salvar("memoria", jogadas, true);
      Som.vitoria();
      vibrar([60, 40, 60]);
      setTimeout(() => {
        Modal.mostrar({
          emoji: novoRecorde ? "🏆" : "🎉",
          titulo: novoRecorde ? "Novo recorde!" : "Você venceu!",
          texto: `${jogadas} jogadas • +${ganhos} pontos`,
          aoJogarDeNovo: criarTabuleiro,
        });
      }, 500);
    }
  } else {
    Som.erro();
    travado = true;
    setTimeout(() => {
      a.classList.remove("virada");
      b.classList.remove("virada");
      a.innerHTML = `<span class="verso">${versoDaCarta()}</span>`;
      b.innerHTML = `<span class="verso">${versoDaCarta()}</span>`;
      cartasViradas = [];
      travado = false;
    }, 800);
  }
}

seletorEl.querySelectorAll("button").forEach((botao) => {
  botao.addEventListener("click", () => {
    seletorEl.querySelectorAll("button").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");
    nivel = botao.dataset.nivel;
    Som.clique();
    criarTabuleiro();
  });
});

botaoReiniciar.addEventListener("click", criarTabuleiro);
criarTabuleiro();
