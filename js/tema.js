const TEMAS = {
  escuro: {
    nome: "Escuro",
    emoji: "🌙",
    preco: 0,
    cores: { bg: "#121212", card: "#1e1e1e", accent: "#4f8cff", text: "#f0f0f0", dim: "#a0a0a0" },
  },
  claro: {
    nome: "Claro",
    emoji: "☀️",
    preco: 300,
    cores: { bg: "#f0f0f5", card: "#ffffff", accent: "#4f6cff", text: "#222222", dim: "#666666" },
  },
  oceano: {
    nome: "Oceano",
    emoji: "🌊",
    preco: 400,
    cores: { bg: "#04141f", card: "#0a2a3f", accent: "#25c8e8", text: "#e6f7ff", dim: "#8fb8c8" },
  },
  floresta: {
    nome: "Floresta",
    emoji: "🌲",
    preco: 400,
    cores: { bg: "#0a1f0a", card: "#143a14", accent: "#6fdf6f", text: "#e6ffe6", dim: "#8fc88f" },
  },
  rosa: {
    nome: "Rosa",
    emoji: "🌸",
    preco: 500,
    cores: { bg: "#1f0a14", card: "#3a1428", accent: "#ff6fa5", text: "#ffe6f0", dim: "#c88fa8" },
  },
  neon: {
    nome: "Neon",
    emoji: "💚",
    preco: 600,
    cores: { bg: "#0a0a14", card: "#141428", accent: "#00ff9f", text: "#e8ffe8", dim: "#7fbf9f" },
  },
  roxo: {
    nome: "Roxo Real",
    emoji: "🔮",
    preco: 500,
    cores: { bg: "#14081f", card: "#28143a", accent: "#b56fff", text: "#f3e6ff", dim: "#a88fc8" },
  },
  fogo: {
    nome: "Fogo",
    emoji: "🔥",
    preco: 600,
    cores: { bg: "#1f0d08", card: "#3a1c14", accent: "#ff7f3f", text: "#fff0e6", dim: "#c8a08f" },
  },
  gelo: {
    nome: "Gelo",
    emoji: "🧊",
    preco: 600,
    cores: { bg: "#0a1418", card: "#14282e", accent: "#7fdfff", text: "#eafcff", dim: "#8fb8c0" },
  },
  dourado: {
    nome: "Dourado",
    emoji: "🏆",
    preco: 1000,
    cores: { bg: "#171204", card: "#2e2408", accent: "#ffd54f", text: "#fff8e6", dim: "#c0b08f" },
  },
};

const _av = (conteudo) => `<svg viewBox="0 0 24 24" class="avatar-svg">${conteudo}</svg>`;

const AVATARES = {
  carinha: { nome: "Carinha", preco: 0, emoji: _av('<circle cx="12" cy="12" r="10" fill="#ffd54f"/><circle cx="8.5" cy="10" r="1.6" fill="#3a2a10"/><circle cx="15.5" cy="10" r="1.6" fill="#3a2a10"/><path d="M7.5 14.5c1.2 2 3 3 4.5 3s3.3-1 4.5-3" stroke="#3a2a10" stroke-width="1.6" fill="none" stroke-linecap="round"/>') },
  gamer: { nome: "Gamer", preco: 200, emoji: _av('<rect x="2" y="7" width="20" height="11" rx="5" fill="#4f8cff"/><path d="M7 10.5v4M5 12.5h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.3" fill="#ffd54f"/><circle cx="18.5" cy="13.5" r="1.3" fill="#ff6f6f"/>') },
  gato: { nome: "Gato", preco: 300, emoji: _av('<path d="M4 9 3 3l5 3M20 9l1-6-5 3" fill="#ff9f4f"/><circle cx="12" cy="13" r="9" fill="#ff9f4f"/><circle cx="8.5" cy="11.5" r="1.5" fill="#3a2210"/><circle cx="15.5" cy="11.5" r="1.5" fill="#3a2210"/><path d="M12 14.5l-1 1.4h2l-1-1.4z" fill="#3a2210"/><path d="M2 13h4M2 16l4-.8M22 13h-4M22 16l-4-.8" stroke="#3a2210" stroke-width="1" stroke-linecap="round"/>') },
  robo: { nome: "Robô", preco: 400, emoji: _av('<rect x="4" y="7" width="16" height="13" rx="3" fill="#8fa8c8"/><path d="M12 7V3" stroke="#8fa8c8" stroke-width="2"/><circle cx="12" cy="2.5" r="1.5" fill="#ff6f6f"/><rect x="7" y="10" width="4" height="3.4" rx="1" fill="#12203a"/><rect x="13" y="10" width="4" height="3.4" rx="1" fill="#12203a"/><rect x="8" y="15.5" width="8" height="1.8" rx="0.9" fill="#12203a"/>') },
  alien: { nome: "Alien", preco: 500, emoji: _av('<ellipse cx="12" cy="11.5" rx="8.5" ry="10" fill="#6fdf6f"/><ellipse cx="8.6" cy="11" rx="2.6" ry="3.6" fill="#0d200d" transform="rotate(-15 8.6 11)"/><ellipse cx="15.4" cy="11" rx="2.6" ry="3.6" fill="#0d200d" transform="rotate(15 15.4 11)"/><path d="M10.5 17.5h3" stroke="#0d200d" stroke-width="1.4" stroke-linecap="round"/>') },
  ninja: { nome: "Ninja", preco: 600, emoji: _av('<circle cx="12" cy="12" r="10" fill="#2a2a3a"/><rect x="3.5" y="8.5" width="17" height="6" rx="3" fill="#4a4a62"/><circle cx="8.5" cy="11.5" r="1.6" fill="#fff"/><circle cx="15.5" cy="11.5" r="1.6" fill="#fff"/><path d="M20 7l3-3" stroke="#ff6f6f" stroke-width="1.8" stroke-linecap="round"/>') },
  mago: { nome: "Mago", preco: 700, emoji: _av('<circle cx="12" cy="15" r="7.5" fill="#f0c8a0"/><path d="M4 11h16L13.5 1.5 11 6 9.5 3.5 4 11z" fill="#b56fff"/><path d="M15.8 4.5l.7 1.5 1.6.3-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.3.7-1.5z" fill="#ffd54f"/><circle cx="9.5" cy="14.5" r="1.3" fill="#3a2a10"/><circle cx="14.5" cy="14.5" r="1.3" fill="#3a2a10"/><path d="M8 19c1.5 2 6.5 2 8 0l-1 3.5H9L8 19z" fill="#e8e8e8"/>') },
  dragao: { nome: "Dragão", preco: 900, emoji: _av('<path d="M3 14c0-6 4-10 9-10s9 4 9 10l-3-1.5.5 3.5-3-1-.5 3H9l-.5-3-3 1 .5-3.5L3 14z" fill="#2f9f5f"/><path d="M7 4 5 1M17 4l2-3" stroke="#2f9f5f" stroke-width="2" stroke-linecap="round"/><circle cx="8.8" cy="10.5" r="1.6" fill="#ffd54f"/><circle cx="15.2" cy="10.5" r="1.6" fill="#ffd54f"/><circle cx="8.8" cy="10.5" r="0.7" fill="#0d200d"/><circle cx="15.2" cy="10.5" r="0.7" fill="#0d200d"/>') },
  coroa: { nome: "Realeza", preco: 1200, emoji: _av('<circle cx="12" cy="14.5" r="7.5" fill="#f0c8a0"/><path d="M4.5 9.5 5.5 3l4 3L12 2l2.5 4 4-3 1 6.5h-15z" fill="#ffd54f"/><circle cx="7" cy="6" r="0.9" fill="#ff6f6f"/><circle cx="12" cy="4.5" r="0.9" fill="#4f8cff"/><circle cx="17" cy="6" r="0.9" fill="#6fdf6f"/><circle cx="9.5" cy="14" r="1.2" fill="#3a2a10"/><circle cx="14.5" cy="14" r="1.2" fill="#3a2a10"/><path d="M9.5 17.5c.8 1 4.2 1 5 0" stroke="#3a2a10" stroke-width="1.4" fill="none" stroke-linecap="round"/>') },
};

// Cosméticos: skins de jogo, molduras e itens de prestígio compráveis
const COSMETICOS = {
  cobra: {
    titulo: "🐍 Pele da Cobrinha",
    itens: {
      verde: { nome: "Verde", emoji: "🟢", preco: 0, dados: ["#7ddf7d", "#4faf4f"] },
      azul: { nome: "Azul", emoji: "🔵", preco: 400, dados: ["#9fc4ff", "#4f8cff"] },
      rosa: { nome: "Rosa", emoji: "🌸", preco: 500, dados: ["#ffb0d0", "#ff6fa5"] },
      dourada: { nome: "Dourada", emoji: "🏆", preco: 800, dados: ["#ffe27f", "#dfa93f"] },
    },
  },
  bolha: {
    titulo: "🫧 Cor da Bolha",
    itens: {
      azul: { nome: "Azul", emoji: "🔵", preco: 0, dados: "#4f8cff" },
      verde: { nome: "Verde", emoji: "🟢", preco: 400, dados: "#6fdf6f" },
      laranja: { nome: "Laranja", emoji: "🟠", preco: 500, dados: "#ff9f4f" },
      dourada: { nome: "Dourada", emoji: "🟡", preco: 800, dados: "#ffd54f" },
    },
  },
  passaro: {
    titulo: "🐤 Cor do Pássaro",
    itens: {
      amarelo: { nome: "Canário", emoji: "🟡", preco: 0, dados: "#ffd54f" },
      vermelho: { nome: "Cardeal", emoji: "🔴", preco: 400, dados: "#ff6f6f" },
      azul: { nome: "Azulão", emoji: "🔵", preco: 500, dados: "#4f8cff" },
      roxo: { nome: "Místico", emoji: "🟣", preco: 800, dados: "#b56fff" },
    },
  },
  carta: {
    titulo: "🃏 Verso das Cartas (Memória)",
    itens: {
      padrao: { nome: "Clássico", emoji: "?", preco: 0, dados: "?" },
      estrela: { nome: "Estrela", emoji: "★", preco: 300, dados: "★" },
      presente: { nome: "Espadas", emoji: "♠", preco: 400, dados: "♠" },
      diamante: { nome: "Ouros", emoji: "♦", preco: 600, dados: "♦" },
    },
  },
  moldura: {
    titulo: "🖼️ Moldura do Avatar",
    itens: {
      nenhuma: { nome: "Sem moldura", emoji: "⬜", preco: 0, dados: "" },
      ouro: { nome: "Ouro", emoji: "🥇", preco: 600, dados: "moldura-ouro" },
      neon: { nome: "Neon", emoji: "💚", preco: 900, dados: "moldura-neon" },
    },
  },
  trofeu: {
    titulo: "💠 Prestígio",
    itens: {
      trofeu: { nome: "Troféu MiniPlay", emoji: "💠", preco: 10000, dados: "💠" },
    },
  },
};

const Cosmetico = {
  _gratis(cat) {
    return Object.keys(COSMETICOS[cat].itens).filter(
      (id) => COSMETICOS[cat].itens[id].preco === 0
    );
  },

  comprados(cat) {
    const todos = JSON.parse(localStorage.getItem("cosmeticos") || "{}");
    return todos[cat] || this._gratis(cat);
  },

  possui(cat, id) {
    return this.comprados(cat).includes(id);
  },

  comprar(cat, id) {
    const todos = JSON.parse(localStorage.getItem("cosmeticos") || "{}");
    const lista = todos[cat] || this._gratis(cat);
    if (!lista.includes(id)) lista.push(id);
    todos[cat] = lista;
    localStorage.setItem("cosmeticos", JSON.stringify(todos));
  },

  atual(cat) {
    const atuais = JSON.parse(localStorage.getItem("cosmeticoAtual") || "{}");
    return atuais[cat] || this._gratis(cat)[0] || null;
  },

  usar(cat, id) {
    const atuais = JSON.parse(localStorage.getItem("cosmeticoAtual") || "{}");
    atuais[cat] = id;
    localStorage.setItem("cosmeticoAtual", JSON.stringify(atuais));
  },

  dados(cat) {
    const id = this.atual(cat);
    return id ? COSMETICOS[cat].itens[id].dados : null;
  },
};

const Avatar = {
  atual() {
    return localStorage.getItem("avatarAtual") || "carinha";
  },
  emoji() {
    return (AVATARES[this.atual()] || AVATARES.carinha).emoji;
  },
  comprados() {
    return JSON.parse(localStorage.getItem("avataresComprados") || '["carinha"]');
  },
  comprar(id) {
    const lista = this.comprados();
    if (!lista.includes(id)) {
      lista.push(id);
      localStorage.setItem("avataresComprados", JSON.stringify(lista));
      if (window.Conquistas) Conquistas.verificar();
    }
  },
  usar(id) {
    localStorage.setItem("avatarAtual", id);
  },
};

const Tema = {
  atual() {
    return localStorage.getItem("temaAtual") || "escuro";
  },

  comprados() {
    return JSON.parse(localStorage.getItem("temasComprados") || '["escuro"]');
  },

  comprar(id) {
    const lista = this.comprados();
    if (!lista.includes(id)) {
      lista.push(id);
      localStorage.setItem("temasComprados", JSON.stringify(lista));
      if (window.Conquistas) Conquistas.verificar();
    }
  },

  usar(id) {
    localStorage.setItem("temaAtual", id);
    this.aplicar();
  },

  aplicar() {
    const tema = TEMAS[this.atual()] || TEMAS.escuro;
    const raiz = document.documentElement.style;
    raiz.setProperty("--bg", tema.cores.bg);
    raiz.setProperty("--card-bg", tema.cores.card);
    raiz.setProperty("--accent", tema.cores.accent);
    raiz.setProperty("--text", tema.cores.text);
    raiz.setProperty("--text-dim", tema.cores.dim);
  },
};

Tema.aplicar();

// expõe no window (const não vira propriedade global sozinho)
window.Tema = Tema;
window.Avatar = Avatar;
window.Cosmetico = Cosmetico;
window.TEMAS = TEMAS;
window.AVATARES = AVATARES;
window.COSMETICOS = COSMETICOS;
