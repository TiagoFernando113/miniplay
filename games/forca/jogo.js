const CATEGORIAS = {
  Fruta: ["ABACAXI", "BANANA", "MORANGO", "MELANCIA", "LARANJA", "UVA", "MANGA", "GOIABA", "CAJU", "KIWI", "PERA", "AMEIXA", "PESSEGO", "JABUTICABA", "MARACUJA", "ACEROLA", "CARAMBOLA", "FIGO", "LIMAO", "TANGERINA"],
  Animal: ["ELEFANTE", "GIRAFA", "TARTARUGA", "PAPAGAIO", "GOLFINHO", "CANGURU", "PINGUIM", "JACARE", "TUBARAO", "BORBOLETA", "FORMIGA", "CAVALO", "MACACO", "PANTERA", "RAPOSA", "CORUJA", "TAMANDUA", "CAPIVARA", "LOBO", "URSO", "ARARA", "TATU", "ONCA", "GAVIAO"],
  Esporte: ["FUTEBOL", "NATACAO", "BASQUETE", "VOLEIBOL", "ATLETISMO", "CICLISMO", "JUDO", "SURFE", "SKATE", "TENIS", "HANDEBOL", "GINASTICA", "BOXE", "CORRIDA", "ESGRIMA", "REMO"],
  Pais: ["BRASIL", "ARGENTINA", "PORTUGAL", "JAPAO", "CANADA", "AUSTRALIA", "ALEMANHA", "ITALIA", "MEXICO", "EGITO", "CHILE", "FRANCA", "ESPANHA", "URUGUAI", "COLOMBIA", "PERU", "CHINA", "INDIA"],
  Lugar: ["ESCOLA", "HOSPITAL", "PRAIA", "FLORESTA", "BIBLIOTECA", "AEROPORTO", "FAZENDA", "MUSEU", "PADARIA", "CINEMA", "ESTADIO", "MONTANHA", "DESERTO", "ILHA", "CACHOEIRA", "SHOPPING"],
  Objeto: ["COMPUTADOR", "TELEFONE", "GELADEIRA", "BICICLETA", "TRAVESSEIRO", "CADERNO", "TESOURA", "LANTERNA", "ESPELHO", "RELOGIO", "MOCHILA", "PANELA", "VASSOURA", "CHUVEIRO", "TECLADO", "CANETA", "GARRAFA", "MARTELO"],
  Comida: ["CHOCOLATE", "LASANHA", "PIPOCA", "CHURRASCO", "BRIGADEIRO", "FEIJOADA", "PAMONHA", "TAPIOCA", "COXINHA", "PASTEL", "SORVETE", "PUDIM", "PANQUECA", "STROGONOFF", "MACARRAO", "SANDUICHE", "BOLO", "QUEIJO"],
  Instrumento: ["GUITARRA", "BATERIA", "VIOLINO", "SAXOFONE", "TECLADO", "PANDEIRO", "FLAUTA", "TROMBONE", "CAVAQUINHO", "ACORDEON", "TRIANGULO", "TAMBOR"],
  Profissao: ["MEDICO", "PROFESSOR", "BOMBEIRO", "DENTISTA", "COZINHEIRO", "MOTORISTA", "JORNALISTA", "ENGENHEIRO", "VETERINARIO", "PINTOR", "ADVOGADO", "PILOTO", "ENFERMEIRO", "CARTEIRO"],
  Natureza: ["ARCOIRIS", "TEMPESTADE", "NEBLINA", "VULCAO", "GEADA", "RELAMPAGO", "AURORA", "FURACAO", "GAROA", "TROVAO"],
};

const PALAVRAS = [];
for (const [d, lista] of Object.entries(CATEGORIAS)) {
  for (const p of lista) PALAVRAS.push({ p, d });
}

let ultimasPalavras = [];

const VIDAS_INICIAIS = 6;
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const dicaEl = document.getElementById("dica");
const nivelEl = document.getElementById("nivel");

let nivel = Recordes.get("forcaNivel") || 1;
const vidasEl = document.getElementById("vidas");
const palavraEl = document.getElementById("palavra");
const tecladoEl = document.getElementById("teclado");
const botaoReiniciar = document.getElementById("reiniciar");

let palavra = "";
let dica = "";
let acertadas = new Set();
let vidas = VIDAS_INICIAIS;
let fimDeJogo = false;

function novoJogo() {
  nivelEl.textContent = String(nivel);

  // níveis altos sorteiam palavras mais longas
  const tamanhoMinimo = Math.min(4 + Math.floor(nivel / 2), 9);

  // metade das vezes usa o dicionário de 8.000 palavras (variação infinita)
  let candidatas;
  if (Math.random() < 0.5 && typeof PALAVRAS_PT !== "undefined") {
    candidatas = PALAVRAS_PT
      .filter((p) => p.length >= tamanhoMinimo)
      .map((p) => ({ p, d: `Começa com "${p[0]}" • ${p.length} letras` }));
  } else {
    candidatas = PALAVRAS.filter((x) => x.p.length >= tamanhoMinimo);
  }
  if (candidatas.length < 10) candidatas = PALAVRAS;

  // evita repetir as últimas 30 palavras sorteadas
  let sorteio;
  do {
    sorteio = candidatas[Math.floor(Math.random() * candidatas.length)];
  } while (ultimasPalavras.includes(sorteio.p));
  ultimasPalavras.push(sorteio.p);
  if (ultimasPalavras.length > 30) ultimasPalavras.shift();

  palavra = sorteio.p;
  dica = sorteio.d;
  acertadas = new Set();
  vidas = VIDAS_INICIAIS;
  fimDeJogo = false;
  dicaEl.textContent = dica;
  montarTeclado();
  desenhar();
}

function montarTeclado() {
  tecladoEl.innerHTML = "";
  for (const letra of LETRAS) {
    const tecla = document.createElement("button");
    tecla.textContent = letra;
    tecla.addEventListener("click", () => tentar(letra, tecla));
    tecladoEl.appendChild(tecla);
  }
}

function desenhar() {
  vidasEl.textContent = "❤️".repeat(vidas) + "🖤".repeat(VIDAS_INICIAIS - vidas);

  // boneco aparece parte por parte a cada erro
  const erros = VIDAS_INICIAIS - vidas;
  for (let p = 1; p <= 6; p++) {
    const parte = document.getElementById("p" + p);
    if (parte) parte.style.display = p <= erros ? "" : "none";
  }
  palavraEl.textContent = [...palavra]
    .map((l) => (acertadas.has(l) ? l : "_"))
    .join("");
}

function tentar(letra, tecla) {
  if (fimDeJogo) return;
  tecla.disabled = true;

  if (palavra.includes(letra)) {
    Som.acerto();
    vibrar(20);
    acertadas.add(letra);
    desenhar();

    if ([...palavra].every((l) => acertadas.has(l))) {
      fimDeJogo = true;
      const ganhos = 30 + nivel * 10;
      Pontos.add(ganhos);
      Recordes.incrementar("forcaVitorias");
      const nivelConcluido = nivel;
      nivel++;
      Recordes.salvar("forcaNivel", nivel);
      Som.vitoria();
      vibrar([60, 40, 60]);
      setTimeout(() => Modal.mostrar({
        emoji: "🎉",
        titulo: `Nível ${nivelConcluido} concluído!`,
        texto: `${palavra} • +${ganhos} pontos`,
        botao: `Ir pro nível ${nivel} →`,
        aoJogarDeNovo: novoJogo,
      }), 500);
    }
  } else {
    Som.erro();
    vibrar(60);
    vidas--;
    desenhar();

    if (vidas <= 0) {
      fimDeJogo = true;
      setTimeout(() => Modal.mostrar({
        emoji: "😵",
        titulo: "Fim de jogo!",
        texto: `A palavra era: ${palavra}`,
        botao: "Nova palavra",
        aoJogarDeNovo: novoJogo,
        linkExtra: {
          texto: `🔍 O que significa "${palavra.toLowerCase()}"?`,
          href: `https://www.google.com/search?q=significado+de+${palavra.toLowerCase()}`,
        },
      }), 500);
    }
  }
}

botaoReiniciar.addEventListener("click", novoJogo);
novoJogo();
