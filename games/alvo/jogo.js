const DURACAO = 30;

const gradeEl = document.getElementById("grade");
const acertosEl = document.getElementById("acertos");
const tempoEl = document.getElementById("tempo");
const mensagemEl = document.getElementById("mensagem");
const botaoIniciar = document.getElementById("iniciar");

let buracos = [];
let acertos = 0;
let tempoRestante = DURACAO;
let posicaoToupeira = -1;
let cronometro = null;
let trocaToupeira = null;
let rodando = false;
let pausado = false;

function montarGrade() {
  gradeEl.innerHTML = "";
  buracos = [];
  for (let i = 0; i < 9; i++) {
    const buraco = document.createElement("div");
    buraco.className = "buraco";
    buraco.addEventListener("click", () => bater(i));
    gradeEl.appendChild(buraco);
    buracos.push(buraco);
  }
}

function velocidadeAtual() {
  return Math.max(420, 900 - acertos * 20);
}

function agendarProximaToupeira() {
  clearTimeout(trocaToupeira);
  trocaToupeira = setTimeout(() => {
    if (!rodando || pausado) return;
    moverToupeira();
    agendarProximaToupeira();
  }, velocidadeAtual());
}

function iniciar() {
  pausado = false;
  atualizarBotaoPausa();
  acertos = 0;
  tempoRestante = DURACAO;
  rodando = true;
  acertosEl.textContent = "0";
  tempoEl.textContent = String(DURACAO);
  mensagemEl.textContent = "Vai!";
  botaoIniciar.disabled = true;
  Som.clique();

  moverToupeira();
  agendarProximaToupeira();
  cronometro = setInterval(() => {
    if (pausado) return;
    tempoRestante--;
    tempoEl.textContent = String(tempoRestante);
    if (tempoRestante <= 0) terminar();
  }, 1000);
}

function moverToupeira() {
  if (posicaoToupeira >= 0) buracos[posicaoToupeira].textContent = "";
  posicaoToupeira = Math.floor(Math.random() * 9);
  buracos[posicaoToupeira].textContent = "🐹";
}

function bater(i) {
  if (!rodando || pausado) return;
  if (i === posicaoToupeira) {
    acertos++;
    acertosEl.textContent = String(acertos);
    buracos[i].textContent = "💥";
    posicaoToupeira = -1;
    Som.acerto();
    vibrar(25);
    setTimeout(() => {
      if (rodando) {
        moverToupeira();
        agendarProximaToupeira();
      }
    }, 200);
  }
}

function terminar() {
  rodando = false;
  clearInterval(cronometro);
  clearTimeout(trocaToupeira);
  if (posicaoToupeira >= 0) buracos[posicaoToupeira].textContent = "";
  botaoIniciar.disabled = false;

  const ganhos = acertos * 3;
  if (ganhos > 0) Pontos.add(ganhos);
  const novoRecorde = acertos > 0 && Recordes.salvar("alvo", acertos);
  Som.erro();
  Modal.mostrar({
    emoji: novoRecorde ? "🏆" : "🎯",
    titulo: novoRecorde ? "Novo recorde!" : "Tempo esgotado!",
    texto: `${acertos} acerto(s)${ganhos > 0 ? ` • +${ganhos} pontos` : ""}`,
    aoJogarDeNovo: iniciar,
  });
}

function alternarPausa() {
  if (!rodando) return;
  pausado = !pausado;
  atualizarBotaoPausa();
  mensagemEl.textContent = pausado ? "⏸️ Pausado" : "Vai!";
  if (!pausado) agendarProximaToupeira();
}

function atualizarBotaoPausa() {
  const botao = document.getElementById("pausar");
  if (botao) botao.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && rodando && !pausado) alternarPausa();
});

confirmarSaida(() => rodando);

document.getElementById("pausar").addEventListener("click", alternarPausa);
botaoIniciar.addEventListener("click", iniciar);
montarGrade();

configurarMelhor("alvo");
