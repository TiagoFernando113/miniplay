// formato: [pergunta, resposta certa, erradas...]
const BANCO = [
  ["Qual é o maior planeta do Sistema Solar?", "Júpiter", "Saturno", "Terra", "Marte"],
  ["Quantos lados tem um hexágono?", "6", "5", "7", "8"],
  ["Qual animal é o mais rápido do mundo em terra?", "Guepardo", "Leão", "Cavalo", "Avestruz"],
  ["Qual é a capital do Brasil?", "Brasília", "Rio de Janeiro", "São Paulo", "Salvador"],
  ["Quantos minutos tem uma hora e meia?", "90", "80", "100", "120"],
  ["Qual é o maior oceano do mundo?", "Pacífico", "Atlântico", "Índico", "Ártico"],
  ["Que gás as plantas absorvem do ar?", "Gás carbônico", "Oxigênio", "Hidrogênio", "Nitrogênio"],
  ["Quantas cordas tem um violão comum?", "6", "4", "5", "7"],
  ["Qual é o menor país do mundo?", "Vaticano", "Mônaco", "Malta", "San Marino"],
  ["Quantos jogadores tem um time de futebol em campo?", "11", "10", "12", "9"],
  ["Qual é o rio mais extenso do mundo?", "Amazonas", "Nilo", "Yangtzé", "Mississipi"],
  ["Que planeta é conhecido como Planeta Vermelho?", "Marte", "Vênus", "Mercúrio", "Júpiter"],
  ["Quantos continentes existem?", "6", "5", "7", "4"],
  ["Qual é o metal líquido em temperatura ambiente?", "Mercúrio", "Ferro", "Alumínio", "Chumbo"],
  ["Quem pintou a Mona Lisa?", "Leonardo da Vinci", "Michelangelo", "Van Gogh", "Picasso"],
  ["Qual é a moeda do Japão?", "Iene", "Yuan", "Won", "Dólar"],
  ["Quantas patas tem uma aranha?", "8", "6", "10", "12"],
  ["Qual é o maior mamífero do mundo?", "Baleia-azul", "Elefante", "Girafa", "Orca"],
  ["Em que país fica a Torre Eiffel?", "França", "Itália", "Inglaterra", "Espanha"],
  ["Qual é o resultado de 7 × 8?", "56", "54", "64", "48"],
  ["Que vitamina o sol ajuda o corpo a produzir?", "Vitamina D", "Vitamina C", "Vitamina A", "Vitamina B12"],
  ["Qual é o idioma com mais falantes nativos no mundo?", "Mandarim", "Inglês", "Espanhol", "Hindi"],
  ["Quantos anos tem um século?", "100", "50", "1000", "10"],
  ["Qual é o deserto mais quente do mundo?", "Saara", "Atacama", "Gobi", "Kalahari"],
  ["Que animal é o símbolo da Austrália?", "Canguru", "Coala", "Emu", "Ornitorrinco"],
  ["Qual é a estrela mais próxima da Terra?", "Sol", "Lua", "Sirius", "Alfa Centauri"],
  ["Quantos dentes tem um adulto normalmente?", "32", "28", "30", "36"],
  ["Qual país tem formato de bota?", "Itália", "Portugal", "Chile", "Grécia"],
  ["O que abelhas produzem?", "Mel", "Leite", "Seda", "Cera apenas"],
  ["Qual é o osso mais longo do corpo humano?", "Fêmur", "Tíbia", "Úmero", "Costela"],
  ["Em que continente fica o Egito?", "África", "Ásia", "Europa", "Oceania"],
  ["Quantos lados tem um triângulo?", "3", "4", "2", "5"],
  ["Qual é a montanha mais alta do mundo?", "Everest", "K2", "Aconcágua", "Kilimanjaro"],
  ["Que instrumento tem teclas pretas e brancas?", "Piano", "Violino", "Flauta", "Tambor"],
  ["Qual planeta tem anéis visíveis?", "Saturno", "Marte", "Vênus", "Mercúrio"],
  ["Quantos dias tem um ano bissexto?", "366", "365", "364", "360"],
  ["Qual é o animal terrestre mais alto?", "Girafa", "Elefante", "Camelo", "Urso polar"],
  ["De que cor fica a folha com clorofila?", "Verde", "Amarela", "Vermelha", "Azul"],
  ["Quantos estados tem o Brasil?", "26", "27", "25", "24"],
  ["Qual é o símbolo químico da água?", "H2O", "CO2", "O2", "NaCl"],
  ["Que ave não voa e vive no gelo?", "Pinguim", "Avestruz", "Ema", "Galinha"],
  ["Qual é a fruta símbolo da queda de Newton?", "Maçã", "Pera", "Laranja", "Banana"],
  ["Quantas horas tem um dia?", "24", "12", "48", "36"],
  ["Qual país inventou a pizza?", "Itália", "França", "Grécia", "Estados Unidos"],
  ["O que o coração bombeia?", "Sangue", "Ar", "Água", "Linfa"],
  ["Qual é o maior país do mundo em território?", "Rússia", "China", "Canadá", "Brasil"],
  ["Quantas letras tem o alfabeto português?", "26", "24", "23", "28"],
  ["Que animal muda de cor para se camuflar?", "Camaleão", "Iguana", "Sapo", "Cobra"],
  ["Qual é o esporte de Pelé?", "Futebol", "Vôlei", "Basquete", "Tênis"],
  ["O que derrete e vira água?", "Gelo", "Pedra", "Areia", "Madeira"],
  ["Qual satélite natural orbita a Terra?", "Lua", "Sol", "Marte", "Estrela"],
  ["Quantos meses têm 31 dias?", "7", "6", "5", "8"],
  ["Que órgão usamos para respirar?", "Pulmão", "Fígado", "Rim", "Estômago"],
  ["Qual é a cor da esmeralda?", "Verde", "Azul", "Vermelha", "Roxa"],
  ["Em que estação as folhas caem?", "Outono", "Verão", "Primavera", "Inverno"],
  ["Qual inseto produz seda?", "Bicho-da-seda", "Abelha", "Formiga", "Besouro"],
  ["Quanto é a metade de 100?", "50", "40", "25", "60"],
  ["Qual é o idioma oficial da Argentina?", "Espanhol", "Português", "Inglês", "Italiano"],
  ["Que planeta fica mais perto do Sol?", "Mercúrio", "Vênus", "Terra", "Marte"],
  ["Qual animal dorme de cabeça para baixo?", "Morcego", "Coruja", "Preguiça", "Coala"],
  ["Quantos segundos tem um minuto?", "60", "100", "30", "90"],
  ["Qual é a capital da França?", "Paris", "Londres", "Roma", "Berlim"],
  ["Que animal é conhecido como rei da selva?", "Leão", "Tigre", "Elefante", "Gorila"],
  ["Quantas pernas tem um inseto?", "6", "8", "4", "10"],
  ["Qual planeta é o mais quente do Sistema Solar?", "Vênus", "Mercúrio", "Marte", "Júpiter"],
  ["O que a lagarta vira?", "Borboleta", "Abelha", "Libélula", "Mosca"],
  ["Qual é o oposto de transparente?", "Opaco", "Claro", "Brilhante", "Límpido"],
  ["Quantos zeros tem um milhão?", "6", "5", "7", "9"],
  ["Qual oceano banha o litoral do Brasil?", "Atlântico", "Pacífico", "Índico", "Ártico"],
  ["Que instrumento o baterista toca?", "Bateria", "Baixo", "Teclado", "Trompete"],
  ["Qual é o plural de cidadão?", "Cidadãos", "Cidadães", "Cidadões", "Cidadans"],
  ["Quanto é 12 × 12?", "144", "124", "142", "154"],
  ["Que bebida vem do grão torrado e moído?", "Café", "Chá", "Suco", "Refrigerante"],
  ["Qual é o animal mais lento do mundo?", "Preguiça", "Tartaruga", "Caracol", "Lesma"],
  ["Em que país nasceu o samba?", "Brasil", "Portugal", "Cuba", "Argentina"],
  ["Qual é a capital do Japão?", "Tóquio", "Pequim", "Seul", "Osaka"],
  ["Quantos lados tem um pentágono?", "5", "6", "4", "7"],
  ["Que órgão filtra o sangue no corpo?", "Rim", "Pulmão", "Estômago", "Cérebro"],
  ["Qual é a maior floresta tropical do mundo?", "Amazônia", "Congo", "Bornéu", "Atlântica"],
  ["O sol nasce em qual direção?", "Leste", "Oeste", "Norte", "Sul"],
  ["Qual metal é atraído por ímã?", "Ferro", "Ouro", "Prata", "Alumínio"],
  ["Quantas cores tem o arco-íris?", "7", "6", "5", "8"],
  ["Qual é o time de futebol com mais Copas do Mundo?", "Brasil", "Alemanha", "Itália", "Argentina"],
  ["Que fruta é vermelha por fora, branca por dentro e tem sementinhas?", "Maçã", "Melancia", "Uva", "Cereja"],
  ["Qual é o nome do nosso planeta?", "Terra", "Marte", "Vênus", "Netuno"],
  ["Quantos gramas tem um quilo?", "1000", "100", "500", "10000"],
  ["Que animal produz leite pra fazer queijo?", "Vaca", "Galinha", "Peixe", "Abelha"],
  ["Qual é a língua oficial do Brasil?", "Português", "Espanhol", "Inglês", "Brasileiro"],
  ["O que usamos pra medir temperatura?", "Termômetro", "Barômetro", "Régua", "Balança"],
  ["Qual é o maior animal terrestre?", "Elefante", "Girafa", "Rinoceronte", "Hipopótamo"],
  ["Quantos dias tem o mês de fevereiro normalmente?", "28", "29", "30", "31"],
  ["Que estrela ilumina a Terra durante o dia?", "Sol", "Lua", "Vênus", "Polar"],
  ["Qual é o esporte jogado em quadra com cesta?", "Basquete", "Vôlei", "Futsal", "Handebol"],
  ["De onde vem o mel?", "Abelhas", "Formigas", "Flores direto", "Árvores"],
  ["Qual é a capital da Argentina?", "Buenos Aires", "Córdoba", "Santiago", "Montevidéu"],
  ["Quanto é 100 dividido por 4?", "25", "20", "40", "50"],
  ["Que animal tem tromba?", "Elefante", "Rinoceronte", "Anta", "Tamanduá"],
  ["Qual é o contrário de cheio?", "Vazio", "Meio", "Pouco", "Raso"],
  ["Em que continente fica o Brasil?", "América do Sul", "África", "Europa", "América do Norte"],
  ["O que o pintor usa pra pintar quadros?", "Pincel", "Martelo", "Serrote", "Alicate"],
  ["Qual desses é um réptil?", "Jacaré", "Sapo", "Golfinho", "Pinguim"],
  ["Quantas vogais tem o alfabeto?", "5", "6", "4", "7"],
  ["Qual é o doce feito de leite condensado e chocolate?", "Brigadeiro", "Beijinho", "Quindim", "Cocada"],
  ["Que veículo anda sobre trilhos?", "Trem", "Ônibus", "Caminhão", "Bicicleta"],
  ["Qual é a moeda do Brasil?", "Real", "Peso", "Dólar", "Euro"],
  ["O que as plantas precisam pra fazer fotossíntese?", "Luz do sol", "Escuridão", "Vento", "Frio"],
  ["Qual é o maior planeta rochoso do Sistema Solar?", "Terra", "Marte", "Vênus", "Mercúrio"],
  ["Quantos meses tem um ano?", "12", "10", "11", "13"],
  ["Que animal é o melhor amigo do homem?", "Cachorro", "Gato", "Papagaio", "Cavalo"],
];

const PERGUNTAS_POR_PARTIDA = 10;

const numeroEl = document.getElementById("numero");
const acertosEl = document.getElementById("acertos");
const perguntaEl = document.getElementById("pergunta");
const opcoesEl = document.getElementById("opcoes");

const TEMPO_PERGUNTA = 12000;

let perguntas = [];
let atual = 0;
let acertos = 0;
let respondendo = true;
let acertosRapidos = 0;
let sequenciaAtual = 0;
let melhorSequencia = 0;
let inicioPergunta = 0;
let cronometro = null;

const tempoCheiaEl = document.getElementById("tempo-cheia");
const sequenciaEl = document.getElementById("sequencia");

function iniciarCronometro() {
  clearInterval(cronometro);
  inicioPergunta = Date.now();
  cronometro = setInterval(() => {
    const restante = Math.max(0, TEMPO_PERGUNTA - (Date.now() - inicioPergunta));
    const pct = (restante / TEMPO_PERGUNTA) * 100;
    tempoCheiaEl.style.width = pct + "%";
    tempoCheiaEl.classList.toggle("urgente", pct < 30);
    if (restante <= 0) tempoEsgotado();
  }, 100);
}

let pausadoEm = null;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pausadoEm = Date.now();
    clearInterval(cronometro);
  } else if (pausadoEm && respondendo) {
    inicioPergunta += Date.now() - pausadoEm;
    pausadoEm = null;
    iniciarCronometro();
    inicioPergunta -= 0; // cronômetro retoma do ponto certo
  }
});

function tempoEsgotado() {
  if (!respondendo) return;
  clearInterval(cronometro);
  respondendo = false;
  sequenciaAtual = 0;
  sequenciaEl.textContent = "⏰ Tempo esgotado!";
  Som.erro();
  vibrar(60);
  const certa = perguntas[atual][1];
  [...opcoesEl.children].find((b) => b.textContent === certa).classList.add("certa");
  setTimeout(proxima, 1200);
}

function proxima() {
  atual++;
  if (atual < perguntas.length) mostrarPergunta();
  else terminar();
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// gerador de perguntas de matemática — variação infinita, sem banco
function gerarPerguntaMatematica() {
  const sortear = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const tipo = sortear(0, 3);
  let texto, resposta;

  if (tipo === 0) {
    const a = sortear(12, 89);
    const b = sortear(12, 89);
    texto = `Quanto é ${a} + ${b}?`;
    resposta = a + b;
  } else if (tipo === 1) {
    const a = sortear(40, 99);
    const b = sortear(11, 39);
    texto = `Quanto é ${a} − ${b}?`;
    resposta = a - b;
  } else if (tipo === 2) {
    const a = sortear(3, 12);
    const b = sortear(3, 12);
    texto = `Quanto é ${a} × ${b}?`;
    resposta = a * b;
  } else {
    const inicio = sortear(2, 20);
    const passo = sortear(2, 9);
    texto = `Continue a sequência: ${inicio}, ${inicio + passo}, ${inicio + passo * 2}, ...?`;
    resposta = inicio + passo * 3;
  }

  const erradas = new Set();
  while (erradas.size < 3) {
    const desvio = sortear(1, 10) * (Math.random() < 0.5 ? -1 : 1);
    const errada = resposta + desvio;
    if (errada !== resposta && errada > 0) erradas.add(errada);
  }

  return [texto, String(resposta), ...[...erradas].map(String)];
}

function novoJogo() {
  // 7 do banco + 3 geradas na hora = nunca é a mesma partida
  const geradas = [gerarPerguntaMatematica(), gerarPerguntaMatematica(), gerarPerguntaMatematica()];
  perguntas = embaralhar([...embaralhar(BANCO).slice(0, PERGUNTAS_POR_PARTIDA - 3), ...geradas]);
  atual = 0;
  acertos = 0;
  acertosRapidos = 0;
  sequenciaAtual = 0;
  melhorSequencia = 0;
  acertosEl.textContent = "0";
  sequenciaEl.textContent = "";
  mostrarPergunta();
}

function mostrarPergunta() {
  respondendo = true;
  const [texto, certa, ...erradas] = perguntas[atual];
  numeroEl.textContent = String(atual + 1);
  perguntaEl.textContent = texto;

  const opcoes = embaralhar([certa, ...erradas]);
  opcoesEl.innerHTML = "";
  opcoes.forEach((opcao) => {
    const botao = document.createElement("button");
    botao.textContent = opcao;
    botao.addEventListener("click", () => responder(botao, opcao === certa, certa));
    opcoesEl.appendChild(botao);
  });
  iniciarCronometro();
}

function responder(botao, acertou, certa) {
  if (!respondendo) return;
  respondendo = false;
  clearInterval(cronometro);

  if (acertou) {
    botao.classList.add("certa");
    acertos++;
    acertosEl.textContent = String(acertos);
    sequenciaAtual++;
    melhorSequencia = Math.max(melhorSequencia, sequenciaAtual);

    const rapido = Date.now() - inicioPergunta < 4000;
    if (rapido) acertosRapidos++;

    const partes = [];
    if (rapido) partes.push("⚡ rápido! +3");
    if (sequenciaAtual >= 3) partes.push(`🔥 sequência x${sequenciaAtual}`);
    sequenciaEl.textContent = partes.join("  ");

    Som.acerto();
    vibrar(25);
  } else {
    botao.classList.add("errada");
    sequenciaAtual = 0;
    sequenciaEl.textContent = "";
    Som.erro();
    vibrar(60);
    [...opcoesEl.children].find((b) => b.textContent === certa).classList.add("certa");
  }

  setTimeout(proxima, 1200);
}

function terminar() {
  clearInterval(cronometro);
  const ganhos =
    acertos * 5 +
    acertosRapidos * 3 +
    melhorSequencia * 2 +
    (acertos === PERGUNTAS_POR_PARTIDA ? 25 : 0);
  if (ganhos > 0) Pontos.add(ganhos);
  const novoRecorde = acertos > 0 && Recordes.salvar("quiz", acertos);

  if (acertos >= 7) Som.vitoria();
  else Som.erro();

  const detalhes = [`${acertos} acertos`];
  if (acertosRapidos > 0) detalhes.push(`⚡ ${acertosRapidos} rápidos`);
  if (melhorSequencia >= 3) detalhes.push(`🔥 sequência ${melhorSequencia}`);

  Modal.mostrar({
    emoji: acertos === PERGUNTAS_POR_PARTIDA ? "🏆" : acertos >= 7 ? "🎉" : "📚",
    titulo: novoRecorde ? "Novo recorde!" : `${acertos} de ${PERGUNTAS_POR_PARTIDA}!`,
    texto: `${detalhes.join(" • ")}${ganhos > 0 ? ` • +${ganhos} pontos` : ""}`,
    botao: "Jogar de novo",
    aoJogarDeNovo: novoJogo,
  });
}

novoJogo();

configurarMelhor("quiz");
