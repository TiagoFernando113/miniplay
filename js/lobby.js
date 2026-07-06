// Lobby reaproveitável: tela de preparação antes de cada jogo.
// Escolhe skin, escolhe modo (online/offline) e toca em JOGAR.
// Uso:
//   Lobby.mostrar({
//     titulo: "Cobra Batalha",
//     skinCat: "cobra",              // categoria de cosmético (opcional)
//     temOnline: true,               // mostra escolha online/offline
//     aoJogar: ({ modo }) => {...},  // chamado ao tocar em Jogar
//   });
const Lobby = {
  mostrar(cfg) {
    this.fechar();
    const fundo = document.createElement("div");
    fundo.className = "lobby-fundo";
    fundo.id = "lobby";

    const categoria = cfg.skinCat && window.COSMETICOS ? COSMETICOS[cfg.skinCat] : null;

    fundo.innerHTML = `
      <div class="lobby-caixa">
        <a class="lobby-voltar" href="../../index.html">←</a>
        <h1 class="lobby-titulo">${cfg.titulo}</h1>

        <div class="lobby-preview" id="lobby-preview"></div>

        ${categoria ? `
          <p class="lobby-sub">Escolha sua skin</p>
          <div class="lobby-skins" id="lobby-skins"></div>
        ` : ""}

        ${cfg.temOnline ? `
          <p class="lobby-sub">Modo de jogo</p>
          <div class="lobby-modos">
            <button class="lobby-modo ativo" data-modo="offline">
              <span class="lm-titulo">Treino</span>
              <span class="lm-sub">contra bots</span>
            </button>
            <button class="lobby-modo" data-modo="online">
              <span class="lm-titulo">🌐 Online</span>
              <span class="lm-sub">sala global 24h</span>
            </button>
          </div>
        ` : ""}

        <button class="btn lobby-jogar" id="lobby-jogar">JOGAR</button>
      </div>
    `;
    document.body.appendChild(fundo);

    let modo = "offline";

    // renderiza a prévia da skin equipada
    const preview = fundo.querySelector("#lobby-preview");
    const desenharPreview = () => {
      if (cfg.previewHTML) preview.innerHTML = cfg.previewHTML();
    };

    // grade de skins (equipar na hora; bloqueadas levam à loja)
    if (categoria) {
      const grade = fundo.querySelector("#lobby-skins");
      const comprados = Cosmetico.comprados(cfg.skinCat);
      const atual = Cosmetico.atual(cfg.skinCat);
      Object.entries(categoria.itens).forEach(([id, item]) => {
        const tem = comprados.includes(id);
        const btn = document.createElement("button");
        btn.className = "lobby-skin" + (id === atual ? " ativa" : "") + (tem ? "" : " bloqueada");
        btn.innerHTML = this._amostraSkin(cfg.skinCat, item) +
          `<span class="ls-nome">${tem ? item.nome : "🔒 " + item.preco}</span>`;
        btn.addEventListener("click", () => {
          if (!tem) {
            location.href = "../../loja.html";
            return;
          }
          Cosmetico.usar(cfg.skinCat, id);
          grade.querySelectorAll(".lobby-skin").forEach((b) => b.classList.remove("ativa"));
          btn.classList.add("ativa");
          if (window.Som) Som.clique();
          desenharPreview();
        });
        grade.appendChild(btn);
      });
    }
    desenharPreview();

    // seleção de modo
    if (cfg.temOnline) {
      fundo.querySelectorAll(".lobby-modo").forEach((b) => {
        b.addEventListener("click", () => {
          fundo.querySelectorAll(".lobby-modo").forEach((x) => x.classList.remove("ativo"));
          b.classList.add("ativo");
          modo = b.dataset.modo;
          if (window.Som) Som.clique();
        });
      });
    }

    fundo.querySelector("#lobby-jogar").addEventListener("click", () => {
      if (window.Som) Som.vitoria();
      this.fechar();
      cfg.aoJogar({ modo });
    });
  },

  _amostraSkin(cat, item) {
    const d = item.dados;
    if (cat === "cobra") {
      return `<svg viewBox="0 0 46 24"><rect x="1" y="9" width="8" height="8" rx="2" fill="${d[1]}"/><rect x="10" y="9" width="8" height="8" rx="2" fill="${d[1]}"/><rect x="19" y="9" width="8" height="8" rx="2" fill="${d[1]}"/><rect x="28" y="6" width="13" height="13" rx="4" fill="${d[0]}"/><circle cx="37" cy="10" r="1.6" fill="#12203a"/></svg>`;
    }
    if (cat === "bolha") {
      return `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="${d}" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.45)"/></svg>`;
    }
    return `<span style="font-size:1.6rem;">${item.emoji || "●"}</span>`;
  },

  fechar() {
    const l = document.getElementById("lobby");
    if (l) l.remove();
  },
};

window.Lobby = Lobby;
