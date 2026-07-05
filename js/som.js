const Config = {
  get() {
    return JSON.parse(localStorage.getItem("config") || '{"som":true,"vibrar":true,"musica":true}');
  },
  set(chave, valor) {
    const c = this.get();
    c[chave] = valor;
    localStorage.setItem("config", JSON.stringify(c));
  },
};

const Som = {
  contexto: null,

  _ctx() {
    if (!this.contexto) {
      this.contexto = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.contexto.state === "suspended") this.contexto.resume();
    return this.contexto;
  },

  nota(freq, duracao = 0.12, tipo = "square", volume = 0.07, atraso = 0) {
    if (!Config.get().som) return;
    volume *= Config.get().volume ?? 1;
    if (volume <= 0.001) return;
    try {
      const ctx = this._ctx();
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      const inicio = ctx.currentTime + atraso;
      ganho.gain.setValueAtTime(volume, inicio);
      ganho.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + duracao);
    } catch (e) {
      /* áudio indisponível — segue sem som */
    }
  },

  clique() {
    this.nota(600, 0.06, "square", 0.05);
  },

  acerto() {
    this.nota(660, 0.08);
    this.nota(880, 0.1, "square", 0.07, 0.08);
  },

  erro() {
    this.nota(220, 0.18, "sawtooth", 0.07);
    this.nota(170, 0.24, "sawtooth", 0.05, 0.1);
  },

  vitoria() {
    [523, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.16, "square", 0.07, i * 0.12));
  },
};

function vibrar(ms = 30) {
  if (!Config.get().vibrar) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch (e) {
      /* sem vibração */
    }
  }
}

// expõe no window (const não vira propriedade global sozinho)
window.Som = Som;
window.Config = Config;
