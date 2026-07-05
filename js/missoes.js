// Missões diárias geradas por código: a data é a semente, então cada dia
// nasce um trio diferente de missões — infinitas, sem banco fixo.
const Missoes = {
  _premiando: false,

  _hoje() {
    return new Date().toISOString().slice(0, 10);
  },

  _rng(semente) {
    return () => {
      semente = (semente * 1103515245 + 12345) % 2147483648;
      return semente / 2147483648;
    };
  },

  _gerarDoDia(dataStr) {
    let s = 0;
    for (const ch of dataStr) s = (s * 31 + ch.charCodeAt(0)) % 100000;
    const rnd = this._rng(s + 7);
    const missoes = [];

    const metaPartidas = 2 + Math.floor(rnd() * 6); // 2 a 7
    missoes.push({
      tipo: "partidas",
      meta: metaPartidas,
      desc: `Jogue ${metaPartidas} partidas até o fim (qualquer jogo)`,
      premio: metaPartidas * 12,
    });

    const metaPontos = (4 + Math.floor(rnd() * 18)) * 10; // 40 a 210
    missoes.push({
      tipo: "pontos",
      meta: metaPontos,
      desc: `Ganhe ${metaPontos} pontos hoje`,
      premio: Math.round(metaPontos * 0.5),
    });

    // terceira missão: desafio mais pesado, tipo sorteado
    if (rnd() < 0.5) {
      const m = 8 + Math.floor(rnd() * 8); // 8 a 15
      missoes.push({
        tipo: "partidas",
        meta: m,
        desc: `Maratona: ${m} partidas até o fim hoje`,
        premio: m * 15,
      });
    } else {
      const m = (25 + Math.floor(rnd() * 30)) * 10; // 250 a 540
      missoes.push({
        tipo: "pontos",
        meta: m,
        desc: `Desafio: ${m} pontos hoje`,
        premio: Math.round(m * 0.6),
      });
    }

    return missoes.map((x) => ({ ...x, prog: 0, feita: false }));
  },

  VERSAO: 2,

  dados() {
    const hoje = this._hoje();
    let d = JSON.parse(localStorage.getItem("diario") || "null");
    // regenera se mudou o dia OU se as missões salvas são de versão antiga
    if (!d || d.data !== hoje || d.versao !== this.VERSAO) {
      const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      let streak = 1;
      let bonusDado = false;
      if (d && d.data === hoje) {
        streak = d.streak || 1;
        bonusDado = !!d.bonusDado;
      } else if (d && d.data === ontem) {
        streak = (d.streak || 0) + 1;
      }
      d = { versao: this.VERSAO, data: hoje, streak, bonusDado, missoes: this._gerarDoDia(hoje) };
      localStorage.setItem("diario", JSON.stringify(d));
    }
    return d;
  },

  _salvar(d) {
    localStorage.setItem("diario", JSON.stringify(d));
  },

  bonusDiario() {
    const d = this.dados();
    if (d.bonusDado) return null;
    d.bonusDado = true;
    this._salvar(d);
    const valor = 20 + Math.min(d.streak, 10) * 5;
    this._premiando = true;
    Pontos.add(valor);
    this._premiando = false;
    return { valor, streak: d.streak };
  },

  _avancar(tipo, quanto) {
    if (this._premiando) return;
    const d = this.dados();
    const completadas = [];

    d.missoes.forEach((m) => {
      if (m.feita || m.tipo !== tipo) return;
      m.prog += quanto;
      if (m.prog >= m.meta) {
        m.prog = m.meta;
        m.feita = true;
        completadas.push(m);
      }
    });

    this._salvar(d);

    completadas.forEach((m) => {
      this._premiando = true;
      Pontos.add(m.premio);
      this._premiando = false;
      this.toast(`${window.ICONES ? ICONES.alvo : ""} Missão cumprida: +${m.premio} pontos!`);
      if (window.Som) Som.vitoria();
    });
  },

  // chamado pelo Pontos.add: soma na missão de pontos
  registrar(pontosGanhos) {
    this._avancar("pontos", pontosGanhos);
  },

  // chamado pelo Modal de fim de jogo: conta exatamente 1 partida
  partida() {
    this._avancar("partidas", 1);
    // feedback visível: mostra o progresso na hora
    const m = this.dados().missoes.find((x) => x.tipo === "partidas" && !x.feita);
    if (m) this.toast(`${window.ICONES ? ICONES.alvo : ""} Missão: ${m.prog}/${m.meta} partidas`);
  },

  toast(texto) {
    const aviso = document.createElement("div");
    aviso.className = "toast-conquista";
    aviso.innerHTML = texto;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => aviso.classList.add("visivel"));
    setTimeout(() => {
      aviso.classList.remove("visivel");
      setTimeout(() => aviso.remove(), 400);
    }, 2800);
  },
};

// expõe no window (const não vira propriedade global sozinho)
window.Missoes = Missoes;
