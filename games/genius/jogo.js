const botoes = [...document.querySelectorAll(".botao-cor")];
const rodadaEl = document.getElementById("rodada");
const mensagemEl = document.getElementById("mensagem");
const botaoIniciar = document.getElementById("iniciar");

let sequencia = [];
let posicaoJogador = 0;
let aceitandoJogadas = false;

function iniciar() {
  sequencia = [];
  rodadaEl.textContent = "0";
  mensagemEl.textContent = "Observe a sequência...";
  proximaRodada();
}

function proximaRodada() {
  aceitandoJogadas = false;
  posicaoJogador = 0;
  sequencia.push(Math.floor(Math.random() * 4));
  rodadaEl.textContent = String(sequencia.length);
  mostrarSequencia();
}

async function mostrarSequencia() {
  await esperar(600);
  for (const cor of sequencia) {
    await acender(cor);
    await esperar(intervaloAtual());
  }
  aceitandoJogadas = true;
  mensagemEl.textContent = "Sua vez!";
}

const TONS = [392, 330, 262, 494];

// como no brinquedo original: quanto maior a sequência, mais rápido pisca
function duracaoAtual() {
  return Math.max(160, 420 - sequencia.length * 18);
}

function intervaloAtual() {
  return Math.max(70, 200 - sequencia.length * 8);
}

function acender(cor) {
  return new Promise((resolver) => {
    const dur = duracaoAtual();
    Som.nota(TONS[cor], dur / 1000, "sine", 0.1);
    botoes[cor].classList.add("aceso");
    setTimeout(() => {
      botoes[cor].classList.remove("aceso");
      resolver();
    }, dur);
  });
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

botoes.forEach((botao) => {
  botao.addEventListener("click", async () => {
    if (!aceitandoJogadas) return;
    const cor = Number(botao.dataset.cor);
    acender(cor);

    if (cor === sequencia[posicaoJogador]) {
      posicaoJogador++;
      if (posicaoJogador === sequencia.length) {
        aceitandoJogadas = false;
        mensagemEl.textContent = "Acertou! Próxima rodada...";
        setTimeout(proximaRodada, 800);
      }
    } else {
      aceitandoJogadas = false;
      const rodadas = sequencia.length - 1;
      const ganhos = rodadas * 10;
      if (ganhos > 0) Pontos.add(ganhos);
      const novoRecorde = rodadas > 0 && Recordes.salvar("genius", rodadas);
      Som.erro();
      vibrar(80);
      Modal.mostrar({
        emoji: novoRecorde ? "🏆" : "🎨",
        titulo: novoRecorde ? "Novo recorde!" : "Errou!",
        texto: `${rodadas} rodada(s)${ganhos > 0 ? ` • +${ganhos} pontos` : ""}`,
        aoJogarDeNovo: iniciar,
      });
    }
  });
});

botaoIniciar.addEventListener("click", iniciar);

configurarMelhor("genius");
