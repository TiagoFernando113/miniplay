// Salas online via Supabase Realtime: dois celulares no mesmo canal.
// Uso: Online.abrir(codigo, aoMensagem, aoPresenca) → Online.enviar({...})
const Online = {
  cliente: null,
  canal: null,

  _init() {
    if (!this.cliente && window.supabase) {
      this.cliente = supabase.createClient(Nuvem.URL, Nuvem.CHAVE);
    }
    return !!this.cliente;
  },

  gerarCodigo() {
    const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I (confundem)
    let codigo = "";
    for (let i = 0; i < 4; i++) codigo += LETRAS[Math.floor(Math.random() * LETRAS.length)];
    return codigo;
  },

  // entra (ou cria) a sala; resolve quando conectado
  abrir(codigo, aoMensagem, aoPresenca) {
    return new Promise((resolver, rejeitar) => {
      if (!this._init()) return rejeitar(new Error("biblioteca indisponível"));
      this.fechar();

      this.canal = this.cliente.channel("sala-" + codigo.toUpperCase(), {
        config: {
          broadcast: { self: false },
          presence: { key: Nuvem.deviceId() },
        },
      });

      this.canal.on("broadcast", { event: "msg" }, (pacote) => aoMensagem(pacote.payload));
      this.canal.on("presence", { event: "sync" }, () => {
        const jogadores = Object.keys(this.canal.presenceState()).length;
        aoPresenca(jogadores);
      });

      const timeout = setTimeout(() => rejeitar(new Error("tempo esgotado")), 10000);
      this.canal.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          await this.canal.track({ desde: Date.now() });
          resolver();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timeout);
          rejeitar(new Error(status));
        }
      });
    });
  },

  enviar(payload) {
    if (this.canal) {
      this.canal.send({ type: "broadcast", event: "msg", payload });
    }
  },

  fechar() {
    if (this.canal && this.cliente) {
      this.cliente.removeChannel(this.canal);
      this.canal = null;
    }
  },
};

window.Online = Online;
