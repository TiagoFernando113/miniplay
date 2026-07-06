// Utilidades compartilhadas por todos os jogos (evita código repetido).

// escapa texto de usuário antes de inserir em HTML (anti-XSS)
function escaparHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Liga o placar "Melhor" da página ao recorde salvo e o mantém atualizado.
function configurarMelhor(chave) {
  const el = document.getElementById("melhor");
  if (!el) return;

  const atualizar = () => {
    const melhor = Recordes.get(chave);
    el.textContent = melhor !== undefined ? melhor : 0;
  };
  atualizar();

  const salvarOriginal = Recordes.salvar.bind(Recordes);
  Recordes.salvar = (jogo, valor, menorMelhor) => {
    const resultado = salvarOriginal(jogo, valor, menorMelhor);
    atualizar();
    return resultado;
  };
}

// Estatísticas pessoais: partidas por dia e por jogo, pontos por dia.
const Stats = {
  dados() {
    return JSON.parse(
      localStorage.getItem("stats") || '{"porDia":{},"porJogo":{},"pontosDia":{}}'
    );
  },

  _salvar(d) {
    localStorage.setItem("stats", JSON.stringify(d));
  },

  _hoje() {
    return new Date().toISOString().slice(0, 10);
  },

  partida() {
    const d = this.dados();
    const hoje = this._hoje();
    const jogo = (location.pathname.match(/games\/([^/]+)/) || [])[1] || "outro";
    d.porDia[hoje] = (d.porDia[hoje] || 0) + 1;
    d.porJogo[jogo] = (d.porJogo[jogo] || 0) + 1;
    this._salvar(d);
  },

  pontos(n) {
    const d = this.dados();
    const hoje = this._hoje();
    d.pontosDia[hoje] = (d.pontosDia[hoje] || 0) + n;
    this._salvar(d);
  },
};

// Salva/retoma partidas em andamento (Blocos, 2048, Doces...)
const Retomar = {
  salvar(jogo, estado) {
    localStorage.setItem("partida-" + jogo, JSON.stringify(estado));
  },
  carregar(jogo) {
    const bruto = localStorage.getItem("partida-" + jogo);
    return bruto ? JSON.parse(bruto) : null;
  },
  limpar(jogo) {
    localStorage.removeItem("partida-" + jogo);
  },
};

// Confirmação ao sair no meio de uma partida ativa
function confirmarSaida(estaAtiva) {
  document.querySelectorAll('a[href$="index.html"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      if (estaAtiva() && !confirm("Sair da partida em andamento?")) {
        e.preventDefault();
      }
    });
  });
}

// Semana do ano (semente pra Jogo da Semana, ranking e destaque da loja)
function semanaDoAno() {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), 0, 1);
  return agora.getFullYear() * 100 + Math.floor((agora - inicio) / 604800000);
}

const NOMES_JOGOS = {
  memoria: "Jogo da Memória", velha: "Jogo da Velha", "2048": "2048", cobrinha: "Cobrinha",
  genius: "Genius", alvo: "Acerte o Alvo", blocos: "Blocos", doces: "Doces",
  conquista: "Conquista", bolhas: "Bolhas", territorio: "Território", naval: "Batalha Naval",
  quiz: "Quiz", ppt: "Pedra-Papel-Tesoura", forca: "Forca", campo: "Campo Minado",
  puzzle15: "Puzzle 15", cacapalavras: "Caça-Palavras", passaro: "Pássaro",
  torre: "Torre", hexagono: "Hexágono",
};

const JOGOS_TODOS = [
  "memoria", "velha", "2048", "cobrinha", "genius", "alvo", "blocos", "doces",
  "conquista", "bolhas", "territorio", "naval", "quiz", "ppt", "forca",
  "campo", "puzzle15", "cacapalavras", "passaro", "torre", "hexagono",
];

// Jogos com ranking online (maior valor = melhor)
const RANKING_JOGOS = {
  passaro: { nome: "Pássaro", rotulo: "canos" },
  torre: { nome: "Torre", rotulo: "andares" },
  cobrabatalha: { nome: "Cobra Batalha", rotulo: "tamanho" },
  cobrinha: { nome: "Cobrinha", rotulo: "comidas" },
  bolhas: { nome: "Bolhas", rotulo: "tamanho" },
  hexagono: { nome: "Hexágono", rotulo: "pontos" },
  blocos: { nome: "Blocos", rotulo: "pontos" },
  p2048: { nome: "2048", rotulo: "pontos" },
  doces: { nome: "Doces", rotulo: "pontos" },
  alvo: { nome: "Acerte o Alvo", rotulo: "acertos" },
  genius: { nome: "Genius", rotulo: "rodada" },
  quiz: { nome: "Quiz", rotulo: "/10 acertos" },
};
const LIMITES_RANKING = {
  passaro: 1000, torre: 500, cobrabatalha: 800, cobrinha: 800, bolhas: 500,
  hexagono: 200000, blocos: 200000, p2048: 300000, doces: 200000,
  alvo: 300, genius: 60, quiz: 10,
};

const JogoDaSemana = {
  atual() {
    return JOGOS_TODOS[semanaDoAno() % JOGOS_TODOS.length];
  },
};

// Nível do jogador: XP = pontos acumulados na vida
const Nivel = {
  limiar(n) {
    return 60 * n * n; // XP pra concluir o nível n
  },
  atual() {
    const xp = Pontos.acumulado();
    let n = 1;
    while (xp >= this.limiar(n)) n++;
    return n;
  },
  progresso() {
    const xp = Pontos.acumulado();
    const n = this.atual();
    const base = n > 1 ? this.limiar(n - 1) : 0;
    return Math.min(1, (xp - base) / (this.limiar(n) - base));
  },
  titulo() {
    const n = this.atual();
    const TITULOS = [[25, "Mítico"], [20, "Lenda"], [16, "Campeão"], [12, "Mestre"], [8, "Veterano"], [5, "Jogador"], [3, "Aprendiz"], [0, "Novato"]];
    for (const [minimo, titulo] of TITULOS) if (n >= minimo) return titulo;
    return "Novato";
  },
};

// Ranking semanal local: você contra bots com nomes e placares da semana
const Ranking = {
  _rng(semente) {
    return () => {
      semente = (semente * 1103515245 + 12345) % 2147483648;
      return semente / 2147483648;
    };
  },
  pontosDaSemana() {
    const d = Stats.dados();
    let soma = 0;
    for (let i = 0; i < 7; i++) {
      const chave = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      soma += d.pontosDia[chave] || 0;
    }
    return soma;
  },
  lista() {
    const rnd = this._rng(semanaDoAno() * 31 + 7);
    const prefixos = ["Pro", "Dark", "Neo", "Mega", "Rei", "Ninja", "Lil", "Dr", "Super", "Alfa", "Gamer", "Mestre"];
    const nomes = ["Lucas", "Bia", "Kaue", "Duda", "Theo", "Alice", "Enzo", "Lara", "Davi", "Mel", "Gabi", "Nico", "Vini", "Rafa", "Isa"];
    const bots = [];
    const usados = new Set();
    while (bots.length < 15) {
      const nome = prefixos[Math.floor(rnd() * prefixos.length)] + nomes[Math.floor(rnd() * nomes.length)] + (rnd() < 0.4 ? String(Math.floor(rnd() * 99)) : "");
      if (usados.has(nome)) continue;
      usados.add(nome);
      bots.push({ nome, pontos: 30 + Math.floor(Math.pow(rnd(), 1.6) * 2800) });
    }
    bots.push({ nome: "Você", pontos: this.pontosDaSemana(), eu: true });
    return bots.sort((a, b) => b.pontos - a.pontos);
  },
};

// expõe no window (const não vira propriedade global sozinho)
window.Stats = Stats;
window.semanaDoAno = semanaDoAno;
window.JOGOS_TODOS = JOGOS_TODOS;
window.NOMES_JOGOS = NOMES_JOGOS;
window.JogoDaSemana = JogoDaSemana;
window.RANKING_JOGOS = RANKING_JOGOS;
window.LIMITES_RANKING = LIMITES_RANKING;
window.escaparHtml = escaparHtml;
window.Nivel = Nivel;
window.Ranking = Ranking;
window.Retomar = Retomar;

// heartbeat de presença: chama enquanto o jogador está numa partida online
let _presencaTimer = null;
function iniciarPresencaOnline(jogo) {
  pararPresencaOnline();
  if (!window.Nuvem) return;
  Nuvem.baterPresenca(jogo);
  _presencaTimer = setInterval(() => { if (!document.hidden) Nuvem.baterPresenca(jogo); }, 9000);
}
function pararPresencaOnline() {
  if (_presencaTimer) { clearInterval(_presencaTimer); _presencaTimer = null; }
}
window.iniciarPresencaOnline = iniciarPresencaOnline;
window.pararPresencaOnline = pararPresencaOnline;
window.confirmarSaida = confirmarSaida;
