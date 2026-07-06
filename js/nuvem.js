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

  _limparApelido(a) {
    return String(a || "").replace(/[^\p{L}\p{N} _.-]/gu, "").slice(0, 16).trim();
  },

  apelido() {
    let apelido = this._limparApelido(localStorage.getItem("apelido"));
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
          semana: 210000,
          apelido: this.apelido(),
          pontos,
          streak: this._streakLocal(),
          prestigio: this._temPrestigio(),
          atualizado_em: new Date().toISOString(),
        }),
      });
      return resposta.ok;
    } catch (e) {
      return false; // offline — sem problema, o ranking local assume
    }
  },

  // busca o top 50 da semana
  _streakLocal() {
    try { return JSON.parse(localStorage.getItem("diario") || "{}").streak || 0; } catch (e) { return 0; }
  },
  _temPrestigio() {
    return !!(window.Cosmetico && Cosmetico.possui("trofeu", "trofeu"));
  },

  async buscarRanking() {
    try {
      const resposta = await fetch(
        this.URL + `/rest/v1/ranking_semanal?semana=eq.210000&select=device_id,apelido,pontos,streak,prestigio&order=pontos.desc&limit=50`,
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
    const teto = (window.LIMITES_RANKING && LIMITES_RANKING[jogo]) || 1000000;
    valor = Math.max(0, Math.min(teto, Math.floor(valor) || 0));
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

  // avisa que estou jogando online agora (heartbeat, chamar a cada ~10s)
  async baterPresenca(jogo) {
    try {
      await fetch(this.URL + "/rest/v1/online_agora", {
        method: "POST",
        headers: { ...this._cabecalhos(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ device_id: this.deviceId(), jogo, apelido: this.apelido(), atualizado_em: new Date().toISOString() }),
      });
    } catch (e) {}
  },

  // quem está online agora (últimos 40s), agrupado por jogo
  async contarOnline() {
    try {
      const desde = new Date(Date.now() - 70000).toISOString();
      const r = await fetch(this.URL + `/rest/v1/online_agora?atualizado_em=gt.${desde}&select=jogo`, { headers: this._cabecalhos() });
      if (!r.ok) return {};
      const linhas = await r.json();
      const cont = {};
      linhas.forEach((l) => { cont[l.jogo] = (cont[l.jogo] || 0) + 1; });
      return cont;
    } catch (e) { return {}; }
  },

  async registrarInstalacao() {
    try {
      await fetch(this.URL + "/rest/v1/instalacoes", {
        method: "POST",
        headers: { ...this._cabecalhos(), Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify({ device_id: this.deviceId() }),
      });
    } catch (e) {}
  },

  async contarInstalacoes() {
    try {
      const r = await fetch(this.URL + "/rest/v1/instalacoes?select=device_id", {
        headers: { ...this._cabecalhos(), Prefer: "count=exact", Range: "0-0" },
      });
      const faixa = r.headers.get("content-range"); // ex: 0-0/123
      if (faixa && faixa.includes("/")) return parseInt(faixa.split("/")[1], 10) || 0;
      return 0;
    } catch (e) { return 0; }
  },

  _coletarSave() {
    const dados = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === "cacheRanking") continue; // não precisa subir cache
      dados[k] = localStorage.getItem(k);
    }
    return JSON.stringify(dados);
  },

  async salvarNuvem(codigo) {
    try {
      const r = await fetch(this.URL + "/rest/v1/saves", {
        method: "POST",
        headers: { ...this._cabecalhos(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ codigo, dados: this._coletarSave(), atualizado_em: new Date().toISOString() }),
      });
      return r.ok;
    } catch (e) { return false; }
  },

  async carregarNuvem(codigo) {
    try {
      const r = await fetch(this.URL + `/rest/v1/saves?codigo=eq.${encodeURIComponent(codigo)}&select=dados`, { headers: this._cabecalhos() });
      if (!r.ok) return null;
      const linhas = await r.json();
      if (!linhas.length) return null;
      return JSON.parse(linhas[0].dados);
    } catch (e) { return null; }
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
