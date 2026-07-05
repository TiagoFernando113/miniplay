// Teste de fumaça: carrega os módulos como o navegador faria e confere que
// os ganchos entre eles funcionam (missões, estatísticas, pontos, conquistas).
// Foi uma quebra desse tipo (window.X inexistente) que passou despercebida —
// este teste garante que não volta. Rodar com:  node testes/smoke.js
const fs = require("fs");
const path = require("path");

// ---- stubs mínimos do navegador ----
const armazenamento = {};
global.localStorage = {
  getItem: (k) => (k in armazenamento ? armazenamento[k] : null),
  setItem: (k, v) => { armazenamento[k] = String(v); },
  removeItem: (k) => { delete armazenamento[k]; },
  clear: () => { for (const k in armazenamento) delete armazenamento[k]; },
  key: (i) => Object.keys(armazenamento)[i],
  get length() { return Object.keys(armazenamento).length; },
};

const elementoFalso = () => ({
  classList: { add() {}, remove() {}, toggle() {} },
  style: { setProperty() {} },
  addEventListener() {},
  appendChild() {},
  insertAdjacentText() {},
  insertAdjacentHTML() {},
  remove() {},
  querySelector: () => elementoFalso(),
  querySelectorAll: () => [],
  set innerHTML(_) {},
  get innerHTML() { return ""; },
  set textContent(_) {},
  get textContent() { return ""; },
  dataset: {},
});

global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.document = {
  createElement: elementoFalso,
  getElementById: () => elementoFalso(),
  querySelector: () => elementoFalso(),
  querySelectorAll: () => [],
  addEventListener() {},
  body: elementoFalso(),
  documentElement: elementoFalso(),
  hidden: false,
};
global.location = { pathname: "/games/cobrinha/index.html" };
global.navigator = {};
global.matchMedia = () => ({ matches: false });
global.screen = {};
global.requestAnimationFrame = (f) => f();
const _setTimeout = global.setTimeout;
global.setTimeout = (f) => 0; // toasts etc. não precisam rodar
global.setInterval = () => 0;
global.clearInterval = () => {};
global.confirm = () => false;

// ---- carrega os módulos NA MESMA ORDEM das páginas ----
const base = path.join(__dirname, "..", "js");
for (const arquivo of ["util.js", "pontos.js", "som.js", "musica.js", "recordes.js", "conquistas.js", "missoes.js", "tema.js", "modal.js"]) {
  (0, eval)(fs.readFileSync(path.join(base, arquivo), "utf8"));
}

// ---- os testes ----
let falhas = 0;
function verifica(nome, condicao) {
  console.log((condicao ? "  ✅" : "  ❌ FALHOU:") + " " + nome);
  if (!condicao) falhas++;
}

console.log("1. módulos expostos no window (a regressão clássica):");
for (const nome of ["Pontos", "Som", "Config", "Recordes", "Conquistas", "Missoes", "Stats", "Modal", "Tema", "Cosmetico", "Retomar"]) {
  verifica(`window.${nome} existe`, typeof window[nome] !== "undefined");
}

console.log("2. fim de partida (Modal.mostrar) conta missão e estatística:");
window.Modal.mostrar({ titulo: "t", texto: "x" });
const diario = JSON.parse(localStorage.getItem("diario"));
const missaoPartidas = diario.missoes.find((m) => m.tipo === "partidas");
verifica("missão de partidas avançou pra 1", missaoPartidas && missaoPartidas.prog === 1);
const stats = JSON.parse(localStorage.getItem("stats"));
verifica("estatística registrou 1 partida do jogo certo", stats && stats.porJogo.cobrinha === 1);

console.log("3. ganhar pontos alimenta missão de pontos e acumulado:");
window.Pontos.add(50);
const diario2 = JSON.parse(localStorage.getItem("diario"));
const missaoPontos = diario2.missoes.find((m) => m.tipo === "pontos");
verifica("missão de pontos avançou 50", missaoPontos && missaoPontos.prog === 50);
verifica("acumulado = 50", window.Pontos.acumulado() === 50);
const stats2 = JSON.parse(localStorage.getItem("stats"));
verifica("pontos do dia registrados", Object.values(stats2.pontosDia)[0] === 50);

console.log("4. loja/skins:");
verifica("skin padrão da cobra disponível", Array.isArray(window.Cosmetico.dados("cobra")));
verifica("comprar e usar skin funciona", (() => {
  window.Cosmetico.comprar("cobra", "dourada");
  window.Cosmetico.usar("cobra", "dourada");
  return window.Cosmetico.dados("cobra")[1] === "#dfa93f";
})());

console.log("5. retomar partida:");
window.Retomar.salvar("teste", { a: 1 });
verifica("salva e carrega", window.Retomar.carregar("teste").a === 1);
window.Retomar.limpar("teste");
verifica("limpa", window.Retomar.carregar("teste") === null);

console.log("6. cada jogo carrega sem erro (DOM simulado):");
// contexto de canvas falso: qualquer método/propriedade funciona
const ctxFalso = new Proxy(function () {}, {
  get: (alvo, prop) => (prop === Symbol.toPrimitive ? () => 0 : ctxFalso),
  set: () => true,
  apply: () => ctxFalso,
});

function elementoJogo() {
  const el = {
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    style: { setProperty() {} },
    dataset: {},
    addEventListener() {},
    appendChild(filho) { el.children.push(filho); },
    insertAdjacentText() {},
    insertAdjacentHTML() {},
    remove() {},
    querySelector: () => elementoJogo(),
    querySelectorAll: () => [],
    getContext: () => ctxFalso,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 640 }),
    width: 360,
    height: 640,
    disabled: false,
    textContent: "",
    _html: "",
  };
  Object.defineProperty(el, "innerHTML", {
    get: () => el._html,
    set: (v) => { el._html = v; el.children = []; },
  });
  return el;
}

global.window.innerWidth = 360;
global.window.innerHeight = 640;
global.innerWidth = 360;
global.innerHeight = 640;
global.getComputedStyle = () => ({ getPropertyValue: () => "#4f8cff" });
global.requestAnimationFrame = () => 0; // não roda o laço nos testes
global.alert = () => {};
document.createElement = elementoJogo;
document.getElementById = () => elementoJogo();
document.querySelector = () => elementoJogo();
document.documentElement = elementoJogo();
document.body = elementoJogo();

// dicionário usado por forca e caça-palavras
(0, eval)(fs.readFileSync(path.join(base, "palavras.js"), "utf8"));

const pastaJogos = path.join(__dirname, "..", "games");
for (const jogo of fs.readdirSync(pastaJogos).sort()) {
  const arquivo = path.join(pastaJogos, jogo, "jogo.js");
  if (!fs.existsSync(arquivo)) continue;
  global.location = { pathname: `/games/${jogo}/index.html` };
  try {
    new Function(fs.readFileSync(arquivo, "utf8"))();
    verifica(`${jogo} carrega`, true);
  } catch (erro) {
    verifica(`${jogo} carrega — ${erro.message}`, false);
  }
}

console.log(falhas === 0 ? "\nTUDO PASSOU ✅" : `\n${falhas} TESTE(S) FALHARAM ❌`);
process.exit(falhas === 0 ? 0 : 1);
