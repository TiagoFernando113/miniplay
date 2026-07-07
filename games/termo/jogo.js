// Termo — adivinhe a palavra de 5 letras em 6 tentativas (estilo Wordle).
// Cada palavra tem um TEMA (dica) mostrado no topo.
const TEMAS_PALAVRAS = {
  "Animal": ["zebra", "tigre", "cobra", "pomba", "gato", "raposa", "burro", "porco", "sapos", "onças", "mosca", "vespa", "gansa", "focas", "corvo", "peixe"].filter((p) => /^[a-z]{5}$/.test(p)),
  "Natureza": ["praia", "terra", "campo", "rocha", "matas", "rios", "nuvem", "chuva", "vento", "folha", "pedra", "mares", "areia", "raios"].filter((p) => /^[a-z]{5}$/.test(p)),
  "Objeto": ["livro", "carro", "navio", "banco", "caixa", "porta", "pente", "mesas", "vidro", "faca", "chave", "lampa", "sacos", "copos", "garfo"].filter((p) => /^[a-z]{5}$/.test(p)),
  "Comida": ["arroz", "feijao", "pizza", "bolos", "carne", "leite", "queijo", "mango", "uvas", "melao", "sopas", "molho", "acuca"].filter((p) => /^[a-z]{5}$/.test(p)),
  "Corpo": ["braco", "perna", "dente", "unhas", "barba", "testa", "peito", "costa", "ombro", "pulso", "labio"].filter((p) => /^[a-z]{5}$/.test(p)),
  "Sentimento": ["amigo", "sorte", "medos", "raiva", "calma", "força", "sonho", "feliz", "amor", "ódios"].filter((p) => /^[a-z]{5}$/.test(p)),
  "Ação": ["girar", "morar", "cavar", "levar", "nadar", "pular", "voar", "correr", "comer", "beber", "dança", "canto"].filter((p) => /^[a-z]{5}$/.test(p)),
};
const LISTA_TEMAS = Object.keys(TEMAS_PALAVRAS);

const gradeEl = document.getElementById("grade");
const tecladoEl = document.getElementById("teclado");
const melhorEl = document.getElementById("melhor");
const nivelEl = document.getElementById("nivel");
const temaEl = document.getElementById("tema");

let alvo, linha, coluna, tentativa, terminado, nivel;
const LINHAS = 6;
const estadoTecla = {};

function novoJogo() {
  nivel = 1;
  iniciarNivel();
}

function iniciarNivel() {
  const tema = LISTA_TEMAS[Math.floor(Math.random() * LISTA_TEMAS.length)];
  const palavras = TEMAS_PALAVRAS[tema];
  alvo = palavras[Math.floor(Math.random() * palavras.length)].toUpperCase();
  linha = 0; coluna = 0; tentativa = ""; terminado = false;
  Object.keys(estadoTecla).forEach((k) => delete estadoTecla[k]);
  desenharGrade();
  desenharTeclado();
  nivelEl.textContent = nivel;
  temaEl.textContent = "Tema: " + tema;
  melhorEl.textContent = Recordes.get("termo") || 0;
}

function desenharGrade() {
  gradeEl.innerHTML = "";
  for (let r = 0; r < LINHAS; r++) {
    const l = document.createElement("div"); l.className = "termo-linha"; l.id = "linha" + r;
    for (let c = 0; c < 5; c++) { const cel = document.createElement("div"); cel.className = "termo-cel"; l.appendChild(cel); }
    gradeEl.appendChild(l);
  }
}

const TECLAS = [["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["ENT", "Z", "X", "C", "V", "B", "N", "M", "APG"]];
function desenharTeclado() {
  tecladoEl.innerHTML = "";
  TECLAS.forEach((fileira) => {
    const f = document.createElement("div"); f.className = "termo-fileira";
    fileira.forEach((k) => {
      const b = document.createElement("button");
      b.className = "tecla" + (k.length > 1 ? " larga" : "") + (estadoTecla[k] ? " " + estadoTecla[k] : "");
      b.textContent = k === "APG" ? "⌫" : k === "ENT" ? "✔" : k;
      b.addEventListener("click", () => teclar(k));
      f.appendChild(b);
    });
    tecladoEl.appendChild(f);
  });
}

function teclar(k) {
  if (terminado) return;
  if (k === "APG") { if (coluna > 0) { coluna--; tentativa = tentativa.slice(0, -1); atualizarLinha(); } return; }
  if (k === "ENT") { conferir(); return; }
  if (coluna < 5) { tentativa += k; coluna++; atualizarLinha(); }
}

function atualizarLinha() {
  const cels = document.getElementById("linha" + linha).children;
  for (let c = 0; c < 5; c++) cels[c].textContent = tentativa[c] || "";
}

function conferir() {
  if (tentativa.length < 5) { Som.erro(); return; }
  const cels = document.getElementById("linha" + linha).children;
  const restante = alvo.split("");
  const resultado = Array(5).fill("fora");
  // verdes
  for (let c = 0; c < 5; c++) if (tentativa[c] === alvo[c]) { resultado[c] = "certo"; restante[c] = null; }
  // amarelos
  for (let c = 0; c < 5; c++) if (resultado[c] !== "certo") { const i = restante.indexOf(tentativa[c]); if (i >= 0) { resultado[c] = "perto"; restante[i] = null; } }
  for (let c = 0; c < 5; c++) {
    cels[c].classList.add(resultado[c]);
    const atual = estadoTecla[tentativa[c]];
    if (resultado[c] === "certo" || (resultado[c] === "perto" && atual !== "certo") || (!atual)) estadoTecla[tentativa[c]] = resultado[c];
  }
  desenharTeclado();
  Som.clique();

  if (tentativa === alvo) { ganhar(); return; }
  linha++; coluna = 0; tentativa = "";
  if (linha >= LINHAS) perder();
}

function ganhar() {
  terminado = true; Som.vitoria();
  Pontos.add(20 - linha * 2);
  if (nivel > (Recordes.get("termo") || 0)) { Recordes.salvar("termo", nivel); if (window.Nuvem) Nuvem.enviarRecorde("termo", nivel); }
  melhorEl.textContent = Recordes.get("termo") || 0;
  setTimeout(() => Modal.mostrar({
    emoji: "🏆", titulo: `Nível ${nivel} concluído!`,
    texto: `${alvo} em ${linha + 1} tentativas`, botao: `Nível ${nivel + 1} →`,
    aoJogarDeNovo: () => { nivel++; iniciarNivel(); },
  }), 400);
}

function perder() {
  terminado = true; Som.erro();
  setTimeout(() => Modal.mostrar({
    emoji: "🧩", titulo: `Fim! Você chegou ao nível ${nivel}`,
    texto: `A palavra era ${alvo}`, aoJogarDeNovo: novoJogo,
  }), 400);
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toUpperCase();
  if (k === "BACKSPACE") teclar("APG");
  else if (k === "ENTER") teclar("ENT");
  else if (/^[A-Z]$/.test(k)) teclar(k);
});

configurarMelhor("termo");
novoJogo();
