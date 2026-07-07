// Evolução — tycoon idle. Toque pra gerar DNA, compre organismos que produzem
// sozinhos, evolua de era pra ganhar multiplicador. Rende offline.
const GERADORES = [
  { id: "celula", nome: "Célula", base: 15, prod: 0.2 },
  { id: "bacteria", nome: "Bactéria", base: 120, prod: 1.2 },
  { id: "alga", nome: "Alga", base: 900, prod: 8 },
  { id: "verme", nome: "Verme", base: 6500, prod: 45 },
  { id: "peixe", nome: "Peixe", base: 42000, prod: 240 },
  { id: "anfibio", nome: "Anfíbio", base: 260000, prod: 1300 },
  { id: "reptil", nome: "Réptil", base: 1.6e6, prod: 7000 },
  { id: "dino", nome: "Dinossauro", base: 1.1e7, prod: 38000 },
  { id: "mamifero", nome: "Mamífero", base: 7.5e7, prod: 210000 },
  { id: "primata", nome: "Primata", base: 5e8, prod: 1.1e6 },
  { id: "humano", nome: "Humano", base: 4e9, prod: 6.5e6 },
  { id: "ciborgue", nome: "Ciborgue", base: 3.5e10, prod: 4e7 },
];
const ERAS = ["Célula", "Peixe", "Réptil", "Dinossauro", "Mamífero", "Humano", "Ciborgue", "Cósmico"];
const MULT_CUSTO = 1.15;

const CRIATURAS = {
  0: '<circle cx="50" cy="50" r="34" fill="#6fdf9f" stroke="#3aa856" stroke-width="3"/><circle cx="50" cy="50" r="12" fill="#2a7a4a"/><circle cx="38" cy="40" r="4" fill="rgba(255,255,255,0.5)"/>',
  1: '<ellipse cx="46" cy="52" rx="30" ry="18" fill="#4f9fd8"/><path d="M74 52l16-10v20z" fill="#4f9fd8"/><circle cx="34" cy="48" r="4" fill="#fff"/><circle cx="34" cy="48" r="2" fill="#12203a"/>',
  2: '<ellipse cx="50" cy="56" rx="32" ry="20" fill="#7fae4f"/><ellipse cx="50" cy="42" rx="20" ry="14" fill="#8fc45f"/><circle cx="42" cy="42" r="3" fill="#12203a"/><circle cx="58" cy="42" r="3" fill="#12203a"/><path d="M20 62l-8 4M80 62l8 4" stroke="#7fae4f" stroke-width="4"/>',
  3: '<path d="M20 60c0-18 14-30 30-30s30 12 30 30l-8-4-6 8-6-6-6 8-6-6-6 8-6-6-6 6z" fill="#5fa85f"/><circle cx="66" cy="46" r="4" fill="#12203a"/><path d="M30 24l4 8M40 20l3 9" stroke="#5fa85f" stroke-width="4" stroke-linecap="round"/>',
  4: '<ellipse cx="50" cy="58" rx="30" ry="22" fill="#c08f5f"/><circle cx="50" cy="38" r="18" fill="#d0a06f"/><path d="M34 26l-4-8M66 26l4-8" stroke="#d0a06f" stroke-width="5" stroke-linecap="round"/><circle cx="43" cy="38" r="3" fill="#3a2a10"/><circle cx="57" cy="38" r="3" fill="#3a2a10"/>',
  5: '<circle cx="50" cy="34" r="16" fill="#f0c8a0"/><path d="M34 56c0-9 7-14 16-14s16 5 16 14v20H34z" fill="#4f8cff"/><circle cx="44" cy="34" r="2.5" fill="#3a2a10"/><circle cx="56" cy="34" r="2.5" fill="#3a2a10"/><path d="M44 40c2 2 8 2 10 0" stroke="#3a2a10" stroke-width="1.5" fill="none"/>',
  6: '<circle cx="50" cy="34" r="16" fill="#9fb8d8"/><rect x="40" y="30" width="20" height="8" rx="2" fill="#12203a"/><circle cx="46" cy="34" r="2" fill="#25c8e8"/><circle cx="56" cy="34" r="2" fill="#ff6f6f"/><path d="M34 56c0-9 7-14 16-14s16 5 16 14v20H34z" fill="#5a6675"/><path d="M50 18v-6" stroke="#9fb8d8" stroke-width="3"/><circle cx="50" cy="10" r="3" fill="#25c8e8"/>',
  7: '<circle cx="50" cy="50" r="30" fill="#b56fff" opacity="0.85"/><circle cx="50" cy="50" r="18" fill="#e0b0ff"/><circle cx="50" cy="50" r="7" fill="#fff"/><path d="M50 8v10M50 82v10M8 50h10M82 50h10" stroke="#b56fff" stroke-width="3" stroke-linecap="round"/>',
};

let estado, modo = 1, laco = 0;

const dnaEl = document.getElementById("dna");
const psEl = document.getElementById("ps");
const eraEl = document.getElementById("era");
const eraNomeEl = document.getElementById("era-nome");
const criaturaEl = document.getElementById("criatura");
const listaEl = document.getElementById("lista");
const painelEvo = document.getElementById("painel-evoluir");

function formatar(n) {
  if (n < 1000) return Math.floor(n).toString();
  const suf = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qd", "Qq"];
  const i = Math.floor(Math.log10(n) / 3);
  if (i >= suf.length) return n.toExponential(2).replace("e+", "e"); // gigante = científico
  return (n / Math.pow(1000, i)).toFixed(2) + suf[i];
}

function nomeEra(i) { return ERAS[i] || "Era " + (i + 1); }
function marco(qtd) { return Math.pow(2, Math.floor(qtd / 25)); } // x2 a cada 25 organismos

function carregar() {
  try { estado = JSON.parse(localStorage.getItem("evolucaoSave")); } catch (e) {}
  if (!estado) estado = { dna: 0, qtds: {}, era: 0, mult: 1, ultimo: Date.now() };
  GERADORES.forEach((g) => { if (estado.qtds[g.id] === undefined) estado.qtds[g.id] = 0; });
  // rendimento offline (até 8h)
  const passou = Math.min(8 * 3600, (Date.now() - (estado.ultimo || Date.now())) / 1000);
  const ganho = producaoPorSeg() * passou;
  if (ganho > 1) { estado.dna += ganho; setTimeout(() => avisar(`Enquanto esteve fora: +${formatar(ganho)} DNA`), 800); }
}

function salvar() { estado.ultimo = Date.now(); localStorage.setItem("evolucaoSave", JSON.stringify(estado)); }

function producaoPorSeg() {
  let p = 0;
  GERADORES.forEach((g) => (p += g.prod * estado.qtds[g.id] * marco(estado.qtds[g.id])));
  return p * estado.mult;
}

function custo(g, n) {
  // soma de progressão geométrica pra n unidades a partir da qtd atual
  const q = estado.qtds[g.id];
  return g.base * Math.pow(MULT_CUSTO, q) * (Math.pow(MULT_CUSTO, n) - 1) / (MULT_CUSTO - 1);
}

function quantosCabe(g) {
  const q = estado.qtds[g.id];
  const base = g.base * Math.pow(MULT_CUSTO, q);
  const n = Math.floor(Math.log((estado.dna * (MULT_CUSTO - 1)) / base + 1) / Math.log(MULT_CUSTO));
  return Math.max(0, n);
}

function nDoModo(g) { return modo === "max" ? Math.max(1, quantosCabe(g)) : modo; }

function comprar(g) {
  const n = nDoModo(g);
  const c = custo(g, n);
  if (estado.dna < c || n < 1) { Som.erro(); return; }
  estado.dna -= c; estado.qtds[g.id] += n; Som.clique();
  render();
}

function custoEvolucao() { return 1e6 * Math.pow(15, estado.era); }
function podeEvoluir() { return estado.dna >= custoEvolucao(); }

function evoluir() {
  if (!podeEvoluir()) return;
  estado.era++;
  estado.mult *= 3; // multiplicador permanente
  estado.dna = 0;
  GERADORES.forEach((g) => (estado.qtds[g.id] = 0));
  Som.vitoria(); vibrar([60, 40, 60]);
  Pontos.add(Math.min(500, estado.era * 20));
  Recordes.salvar("evolucao", estado.era + 1);
  if (window.Nuvem) Nuvem.enviarRecorde("evolucao", estado.era + 1);
  salvar(); render();
  Modal.mostrar({ emoji: "🧬", titulo: `Era ${estado.era + 1}: ${nomeEra(estado.era)}!`, texto: `Produção ×3 permanente! Multiplicador atual: ×${formatar(estado.mult)}`, botao: "Continuar", aoJogarDeNovo: () => {} });
}

function avisar(txt) {
  const a = document.createElement("div"); a.className = "toast-conquista"; a.textContent = txt;
  document.body.appendChild(a); requestAnimationFrame(() => a.classList.add("visivel"));
  setTimeout(() => { a.classList.remove("visivel"); setTimeout(() => a.remove(), 400); }, 3000);
}

function svgDe(i) { return `<svg viewBox="0 0 100 100">${CRIATURAS[Math.min(i, 7)]}</svg>`; }

function render() {
  dnaEl.textContent = formatar(estado.dna);
  psEl.textContent = formatar(producaoPorSeg());
  eraEl.textContent = estado.era + 1;
  eraNomeEl.textContent = nomeEra(estado.era);
  criaturaEl.innerHTML = svgDe(estado.era % 8);

  painelEvo.innerHTML = podeEvoluir()
    ? `<button class="btn" id="btn-evoluir">Evoluir para ${nomeEra(estado.era + 1)} (×3 pra sempre)</button>`
    : `<div style="text-align:center;color:var(--text-dim);font-size:0.8rem;">Evoluir em ${formatar(custoEvolucao())} DNA · mult atual ×${formatar(estado.mult)}</div>`;
  const be = document.getElementById("btn-evoluir");
  if (be) be.addEventListener("click", evoluir);

  listaEl.innerHTML = "";
  GERADORES.forEach((g, idx) => {
    const desbloq = idx === 0 || estado.qtds[GERADORES[idx - 1].id] > 0;
    if (!desbloq && estado.qtds[g.id] === 0) return; // esconde os muito à frente
    const n = nDoModo(g), c = custo(g, n);
    const item = document.createElement("div");
    item.className = "evo-item" + (estado.dna < c ? " bloq" : "");
    item.innerHTML = `
      <div class="ic">${svgDe(Math.min(idx, 7))}</div>
      <div class="meio">
        <div class="nome">${g.nome} <span class="evo-qtd">${estado.qtds[g.id]}</span></div>
        <div class="sub">${formatar(g.prod * estado.mult * marco(estado.qtds[g.id]))}/s cada · bônus ×${marco(estado.qtds[g.id])} (próximo aos ${(Math.floor(estado.qtds[g.id] / 25) + 1) * 25})</div>
      </div>
      <button class="comprar" ${estado.dna < c ? "disabled" : ""}>+${n === "max" ? "" : n}<br>${formatar(c)}</button>`;
    item.querySelector(".comprar").addEventListener("click", () => comprar(g));
    listaEl.appendChild(item);
  });
}

criaturaEl.addEventListener("click", () => {
  estado.dna += Math.max(1, producaoPorSeg() * 0.5 + estado.mult);
  Som.clique(); dnaEl.textContent = formatar(estado.dna);
});

document.querySelectorAll(".evo-modo button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".evo-modo button").forEach((x) => x.classList.remove("ativo"));
    b.classList.add("ativo"); modo = b.dataset.modo === "max" ? "max" : parseInt(b.dataset.modo, 10); render();
  });
});

function iniciar() {
  const meu = ++laco; let ultimo = performance.now();
  const passo = (agora) => {
    if (meu !== laco) return;
    const dt = Math.min(0.5, (agora - ultimo) / 1000); ultimo = agora;
    estado.dna += producaoPorSeg() * dt;
    dnaEl.textContent = formatar(estado.dna);
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

let tRender = 0;
setInterval(() => render(), 500);
setInterval(salvar, 5000);
document.addEventListener("visibilitychange", () => { if (document.hidden) salvar(); });
window.addEventListener("pagehide", salvar);

carregar();
render();
iniciar();
