// Conexão com a nuvem (Supabase) — ranking online de jogadores reais.
// A chave "publishable" é pública por design; a proteção vem das regras (RLS).
const Nuvem = {
  URL: "https://mslzcjqkfeivuavfxwli.supabase.co",
  CHAVE: "sb_publishable_Ptiyy42lUMiqprcNee8mLw_WqVAvsGT",

  _cabecalhos() {
    return {
      apikey: this.CHAVE,
      Authorization: "Bearer " + this.CHAVE,
      "Content-Type": "application/json",
    };
  },

  // identidade anônima do aparelho (sem cadastro)
  deviceId() {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
      localStorage.setItem("deviceId", id);
    }
    return id;
  },

  apelido() {
    let apelido = localStorage.getItem("apelido");
    if (!apelido) {
      apelido = "Jogador" + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem("apelido", apelido);
    }
    return apelido;
  },

  // envia/atualiza sua pontuação da semana
  async enviarPontuacao(pontos) {
    try {
      const resposta = await fetch(this.URL + "/rest/v1/ranking_semanal", {
        method: "POST",
        headers: { ...this._cabecalhos(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          device_id: this.deviceId(),
          semana: semanaDoAno(),
          apelido: this.apelido(),
          pontos,
          atualizado_em: new Date().toISOString(),
        }),
      });
      return resposta.ok;
    } catch (e) {
      return false; // offline — sem problema, o ranking local assume
    }
  },

  // busca o top 50 da semana
  async buscarRanking() {
    try {
      const resposta = await fetch(
        this.URL + `/rest/v1/ranking_semanal?semana=eq.${semanaDoAno()}&order=pontos.desc&limit=50`,
        { headers: this._cabecalhos() }
      );
      if (!resposta.ok) return null;
      return await resposta.json();
    } catch (e) {
      return null;
    }
  },

  // envia seu recorde de um jogo (só sobe se melhorou)
  async enviarRecorde(jogo, valor) {
    try {
      await fetch(this.URL + "/rest/v1/recordes_jogos", {
        method: "POST",
        headers: { ...this._cabecalhos(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          device_id: this.deviceId(),
          jogo,
          apelido: this.apelido(),
          valor,
          atualizado_em: new Date().toISOString(),
        }),
      });
    } catch (e) { /* offline: fica só o recorde local */ }
  },

  // top N de um jogo
  async buscarTopJogo(jogo, limite = 10) {
    try {
      const r = await fetch(
        this.URL + `/rest/v1/recordes_jogos?jogo=eq.${jogo}&order=valor.desc&limit=${limite}`,
        { headers: this._cabecalhos() }
      );
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  },
};

window.Nuvem = Nuvem;
