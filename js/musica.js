// Música de fundo chiptune gerada por código — cada jogo tem seu estilo:
// escala, ritmo e timbre próprios. Liga/desliga nos Ajustes.

// escalas (frequências em Hz)
const ESCALAS = {
  pentAlegre: [262, 294, 330, 392, 440, 523, 587, 659],
  maiorFeliz: [262, 294, 330, 349, 392, 440, 494, 523],
  menorSeria: [220, 247, 262, 294, 330, 349, 392, 440],
  pentGrave: [165, 196, 220, 262, 294, 330, 392],
  misteriosa: [262, 294, 311, 349, 392, 415, 466, 523],
  tensa: [262, 277, 311, 349, 392, 415, 466, 523],
  aquatica: [196, 220, 262, 294, 330, 392, 440],
  marcial: [196, 247, 294, 330, 392, 494, 587],
};

// estilo por jogo: [escala, ritmo(ms), onda melodia, onda baixo, notas do baixo]
const ESTILOS_MUSICA = {
  padrao: { escala: ESCALAS.pentAlegre, tempo: 220, ondaM: "square", ondaB: "triangle", baixo: [131, 131, 98, 110] },
  cobrinha: { escala: ESCALAS.menorSeria, tempo: 175, ondaM: "square", ondaB: "square", baixo: [110, 110, 82, 98] },
  blocos: { escala: ESCALAS.menorSeria, tempo: 195, ondaM: "square", ondaB: "triangle", baixo: [110, 98, 87, 98] },
  doces: { escala: ESCALAS.maiorFeliz, tempo: 250, ondaM: "sine", ondaB: "triangle", baixo: [131, 165, 131, 98] },
  bolhas: { escala: ESCALAS.aquatica, tempo: 310, ondaM: "sine", ondaB: "sine", baixo: [98, 87, 98, 73] },
  territorio: { escala: ESCALAS.tensa, tempo: 170, ondaM: "square", ondaB: "sawtooth", baixo: [98, 98, 104, 98] },
  conquista: { escala: ESCALAS.marcial, tempo: 210, ondaM: "triangle", ondaB: "square", baixo: [98, 98, 123, 98] },
  naval: { escala: ESCALAS.pentGrave, tempo: 330, ondaM: "triangle", ondaB: "sine", baixo: [82, 73, 82, 65] },
  quiz: { escala: ESCALAS.maiorFeliz, tempo: 260, ondaM: "triangle", ondaB: "triangle", baixo: [131, 110, 131, 98] },
  campo: { escala: ESCALAS.misteriosa, tempo: 300, ondaM: "sine", ondaB: "triangle", baixo: [87, 87, 73, 87] },
  forca: { escala: ESCALAS.misteriosa, tempo: 280, ondaM: "triangle", ondaB: "sine", baixo: [98, 87, 98, 82] },
  memoria: { escala: ESCALAS.pentAlegre, tempo: 280, ondaM: "sine", ondaB: "sine", baixo: [131, 110, 131, 98] },
  velha: { escala: ESCALAS.maiorFeliz, tempo: 240, ondaM: "square", ondaB: "triangle", baixo: [131, 131, 110, 131] },
  ppt: { escala: ESCALAS.marcial, tempo: 200, ondaM: "square", ondaB: "square", baixo: [110, 110, 131, 110] },
  puzzle15: { escala: ESCALAS.pentAlegre, tempo: 235, ondaM: "triangle", ondaB: "triangle", baixo: [110, 131, 110, 98] },
  cacapalavras: { escala: ESCALAS.aquatica, tempo: 290, ondaM: "sine", ondaB: "triangle", baixo: [110, 98, 110, 87] },
  alvo: { escala: ESCALAS.pentAlegre, tempo: 160, ondaM: "square", ondaB: "square", baixo: [131, 131, 165, 131] },
  "2048": { escala: ESCALAS.maiorFeliz, tempo: 245, ondaM: "sine", ondaB: "triangle", baixo: [131, 110, 98, 110] },
  passaro: { escala: ESCALAS.maiorFeliz, tempo: 200, ondaM: "square", ondaB: "triangle", baixo: [131, 165, 131, 110] },
  torre: { escala: ESCALAS.pentAlegre, tempo: 260, ondaM: "triangle", ondaB: "triangle", baixo: [110, 131, 110, 165] },
  hexagono: { escala: ESCALAS.tensa, tempo: 185, ondaM: "square", ondaB: "square", baixo: [110, 104, 110, 98] },
  genius: null, // silêncio: o Genius é um jogo de OUVIR os tons
};

const Musica = {
  tocando: false,
  temporizador: null,
  passo: 0,
  posicaoMelodia: 4,

  _estilo() {
    const jogo = (location.pathname.match(/games\/([^/]+)/) || [])[1] || "padrao";
    return jogo in ESTILOS_MUSICA ? ESTILOS_MUSICA[jogo] : ESTILOS_MUSICA.padrao;
  },

  iniciar() {
    if (this.tocando || Config.get().musica === false) return;
    const estilo = this._estilo();
    if (!estilo) return; // jogo sem música (Genius)

    this.tocando = true;
    this.passo = 0;
    this.posicaoMelodia = Math.floor(estilo.escala.length / 2);

    this.temporizador = setInterval(() => {
      if (Config.get().musica === false) {
        this.parar();
        return;
      }
      const t = this.passo;

      if (t % 4 === 0) {
        this._nota(estilo.baixo[(t / 4) % estilo.baixo.length], 0.42, estilo.ondaB, 0.05);
      }

      // melodia: caminhada aleatória suave pela escala do jogo
      this.posicaoMelodia = Math.max(
        0,
        Math.min(estilo.escala.length - 1, this.posicaoMelodia + (Math.floor(Math.random() * 3) - 1))
      );
      if (t % 2 === 0) {
        this._nota(estilo.escala[this.posicaoMelodia], 0.18, estilo.ondaM, 0.022);
      }

      this.passo++;
    }, estilo.tempo);
  },

  _nota(freq, duracao, tipo, volume) {
    volume *= Config.get().volume ?? 1;
    if (volume <= 0.001) return;
    try {
      const ctx = Som._ctx();
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = tipo;
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(volume, ctx.currentTime);
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);
      osc.connect(ganho);
      ganho.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duracao);
    } catch (e) {
      /* áudio indisponível */
    }
  },

  parar() {
    clearInterval(this.temporizador);
    this.tocando = false;
  },
};

// navegador só libera áudio depois de um toque
document.addEventListener("touchend", () => Musica.iniciar(), { once: true });
document.addEventListener("mousedown", () => Musica.iniciar(), { once: true });

// pausa quando o app vai pra segundo plano
document.addEventListener("visibilitychange", () => {
  if (document.hidden) Musica.parar();
  else Musica.iniciar();
});

// expõe no window (const não vira propriedade global sozinho)
window.Musica = Musica;
