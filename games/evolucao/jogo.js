// Evolução — tycoon idle com profundidade: organismos, melhorias, Genes de
// prestígio (multiplicador permanente), bônus dourado e poder de clique.
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

// melhorias compráveis (uma vez cada). tipo: clique | gerador | global
const MELHORIAS = [
  { id: "cl1", nome: "Dedos ágeis", desc: "Clique ×3", custo: 400, tipo: "clique", val: 3, req: () => true },
  { id: "ce1", nome: "Mitose", desc: "Célula ×2", custo: 2000, tipo: "gerador", alvo: "celula", val: 2, req: () => q("celula") >= 15 },
  { id: "ba1", nome: "Colônia", desc: "Bactéria ×2", custo: 15000, tipo: "gerador", alvo: "bacteria", val: 2, req: () => q("bacteria") >= 15 },
  { id: "g1", nome: "Sopa primordial", desc: "TUDO ×2", custo: 120000, tipo: "global", val: 2, req: () => estado.era >= 0 && estado.dna > 60000 },
  { id: "cl2", nome: "Força bruta", desc: "Clique ×5", custo: 400000, tipo: "clique", val: 5, req: () => estado.era >= 1 },
  { id: "pe1", nome: "Cardume", desc: "Peixe ×3", custo: 900000, tipo: "gerador", alvo: "peixe", val: 3, req: () => q("peixe") >= 15 },
  { id: "g2", nome: "Seleção natural", desc: "TUDO ×2", custo: 6e6, tipo: "global", val: 2, req: () => estado.era >= 1 },
  { id: "re1", nome: "Ninhada", desc: "Réptil ×3", custo: 3e7, tipo: "gerador", alvo: "reptil", val: 3, req: () => q("reptil") >= 20 },
  { id: "g3", nome: "Adaptação", desc: "TUDO ×3", custo: 4e8, tipo: "global", val: 3, req: () => estado.era >= 2 },
  { id: "ma1", nome: "Manada", desc: "Mamífero ×3", custo: 2e9, tipo: "gerador", alvo: "mamifero", val: 3, req: () => q("mamifero") >= 20 },
  { id: "cl3", nome: "Clique cósmico", desc: "Clique ×10", custo: 1e10, tipo: "clique", val: 10, req: () => estado.era >= 3 },
  { id: "g4", nome: "Convergência", desc: "TUDO ×3", custo: 8e10, tipo: "global", val: 3, req: () => estado.era >= 3 },
  { id: "g5", nome: "Singularidade", desc: "TUDO ×5", custo: 5e12, tipo: "global", val: 5, req: () => estado.era >= 4 },
];

const PLANETA = [
  { id: "cardume", nome: "Cardume de Peixes", desc: "Pescadores → +comida", base: 8e4, tipo: "comida", val: 2 },
  { id: "planta", nome: "Plantação", desc: "Colheita → +comida", base: 4e5, tipo: "comida", val: 5 },
  { id: "aldeia", nome: "Aldeia", desc: "Humanos → +teto de população", base: 1.5e6, tipo: "popteto", val: 15 },
  { id: "gado", nome: "Fazenda de Gado", desc: "Bois → muito +comida", base: 6e6, tipo: "comida", val: 16 },
  { id: "lab", nome: "Laboratório", desc: "População → +ciência", base: 4e7, tipo: "ciencia", val: 0.05 },
  { id: "reator", nome: "Reator", desc: "Multiplica todo o planeta", base: 1e9, tipo: "energia", val: 0.4 },
];

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

let estado, modo = 1, aba = "org", laco = 0, tempoBonus = 0;

const $ = (id) => document.getElementById(id);
const dnaEl = $("dna"), psEl = $("ps"), eraEl = $("era"), eraNomeEl = $("era-nome");
const genesEl = $("genes"), genesBonusEl = $("genes-bonus");
const criaturaEl = $("criatura"), listaEl = $("lista"), listaMelEl = $("lista-melhorias"), listaPlaEl = $("lista-planeta"), painelEvo = $("painel-evoluir");

function formatar(n) {
  if (n < 1000) return Math.floor(n).toString();
  const suf = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qd", "Qq"];
  const i = Math.floor(Math.log10(n) / 3);
  if (i >= suf.length) return n.toExponential(2).replace("e+", "e");
  return (n / Math.pow(1000, i)).toFixed(2) + suf[i];
}
function nomeEra(i) { return ERAS[i] || "Era " + (i + 1); }
function marco(qtd) { return Math.pow(2, Math.floor(qtd / 25)); }
function q(id) { return estado.qtds[id] || 0; }
function comprou(id) { return !!estado.melhorias[id]; }

function multGerador(id) { let m = 1; MELHORIAS.forEach((u) => { if (u.tipo === "gerador" && u.alvo === id && comprou(u.id)) m *= u.val; }); return m; }
function multGlobal() { let m = 1; MELHORIAS.forEach((u) => { if (u.tipo === "global" && comprou(u.id)) m *= u.val; }); return m; }
function multClique() { let m = 1; MELHORIAS.forEach((u) => { if (u.tipo === "clique" && comprou(u.id)) m *= u.val; }); return m; }
function bonusGenes() { return 1 + estado.genes * 0.03; }
function nivelPla(id) { return estado.planeta[id] || 0; }
function somaPla(tipo) { let s = 0; PLANETA.forEach((b) => { if (b.tipo === tipo) s += b.val * nivelPla(b.id); }); return s; }
function energiaPla() { return 1 + somaPla("energia"); }
function comidaPorSeg() { return somaPla("comida") * energiaPla(); }
function tetoPop() { return somaPla("popteto"); }
function multPlaneta() { return 1 + Math.log10(1 + estado.ciencia) * 0.4 + estado.pop * 0.004; }

function producaoPorSeg() {
  let p = 0;
  GERADORES.forEach((g) => (p += g.prod * q(g.id) * marco(q(g.id)) * multGerador(g.id)));
  return p * estado.mult * bonusGenes() * multGlobal() * multPlaneta();
}
function valorClique() { return Math.max(estado.mult, producaoPorSeg() * 0.1) * multClique(); }

function carregar() {
  try { estado = JSON.parse(localStorage.getItem("evolucaoSave")); } catch (e) {}
  if (!estado) estado = {};
  estado.dna = estado.dna || 0;
  estado.qtds = estado.qtds || {};
  estado.melhorias = estado.melhorias || {};
  estado.era = estado.era || 0;
  estado.mult = estado.mult || 1;
  estado.genes = estado.genes || 0;
  estado.totalEra = estado.totalEra || 0;
  estado.planeta = estado.planeta || {};
  estado.pop = estado.pop || 0;
  estado.ciencia = estado.ciencia || 0;
  GERADORES.forEach((g) => { if (estado.qtds[g.id] === undefined) estado.qtds[g.id] = 0; });
  const passou = Math.min(8 * 3600, (Date.now() - (estado.ultimo || Date.now())) / 1000);
  const ganho = producaoPorSeg() * passou;
  if (ganho > 1) { ganhar(ganho); setTimeout(() => avisar(`Enquanto esteve fora: +${formatar(ganho)} DNA`), 800); }
}
function salvar() { estado.ultimo = Date.now(); localStorage.setItem("evolucaoSave", JSON.stringify(estado)); }
function ganhar(n) { estado.dna += n; estado.totalEra += n; }

function custo(g, n) { const qq = q(g.id); return g.base * Math.pow(MULT_CUSTO, qq) * (Math.pow(MULT_CUSTO, n) - 1) / (MULT_CUSTO - 1); }
function quantosCabe(g) { const base = g.base * Math.pow(MULT_CUSTO, q(g.id)); return Math.max(0, Math.floor(Math.log((estado.dna * (MULT_CUSTO - 1)) / base + 1) / Math.log(MULT_CUSTO))); }
function nDoModo(g) { return modo === "max" ? Math.max(1, quantosCabe(g)) : modo; }
function comprar(g) { const n = nDoModo(g), c = custo(g, n); if (estado.dna < c || n < 1) { Som.erro(); return; } estado.dna -= c; estado.qtds[g.id] += n; Som.clique(); render(); }

function custoPla(b) { return b.base * Math.pow(1.18, nivelPla(b.id)); }
function comprarPla(b) { const c = custoPla(b); if (estado.dna < c) { Som.erro(); return; } estado.dna -= c; estado.planeta[b.id] = nivelPla(b.id) + 1; Som.clique(); render(); }

function comprarMelhoria(u) { if (comprou(u.id) || estado.dna < u.custo) { Som.erro(); return; } estado.dna -= u.custo; estado.melhorias[u.id] = 1; Som.vitoria(); render(); }

function custoEvolucao() { return 1e6 * Math.pow(15, estado.era); }
function podeEvoluir() { return estado.dna >= custoEvolucao(); }
function genesGanhos() { return Math.floor(Math.sqrt(estado.totalEra / 2e6)); }

function evoluir() {
  if (!podeEvoluir()) return;
  const gg = genesGanhos();
  estado.era++; estado.mult *= 3; estado.genes += gg; estado.dna = 0; estado.totalEra = 0;
  GERADORES.forEach((g) => (estado.qtds[g.id] = 0));
  // melhorias de gerador/global permanecem? No: mantemos globais e clique, reset geradores é o suficiente.
  Som.vitoria(); vibrar([60, 40, 60]);
  Pontos.add(Math.min(500, estado.era * 20));
  Recordes.salvar("evolucao", estado.era + 1);
  if (window.Nuvem) Nuvem.enviarRecorde("evolucao", estado.era + 1);
  salvar(); render();
  Modal.mostrar({ emoji: "🧬", titulo: `Era ${estado.era + 1}: ${nomeEra(estado.era)}!`, texto: `Produção ×3 permanente${gg > 0 ? ` · +${gg} Genes (cada gene = +3% pra sempre)` : ""}`, botao: "Continuar", aoJogarDeNovo: () => {} });
}

function avisar(txt) {
  const a = document.createElement("div"); a.className = "toast-conquista"; a.textContent = txt;
  document.body.appendChild(a); requestAnimationFrame(() => a.classList.add("visivel"));
  setTimeout(() => { a.classList.remove("visivel"); setTimeout(() => a.remove(), 400); }, 3000);
}
function svgDe(i) { return `<svg viewBox="0 0 100 100">${CRIATURAS[Math.min(i, 7)]}</svg>`; }
// ícone próprio de cada organismo (bate com o nome na lista)
const GER_ICON = [
  CRIATURAS[0], // Célula
  '<rect x="28" y="42" width="40" height="18" rx="9" fill="#8fd0a0"/><path d="M68 51c8-1 8-8 15-6M68 51c8 4 6 11 13 13" stroke="#8fd0a0" stroke-width="3" fill="none"/><circle cx="44" cy="51" r="4" fill="#2a7a4a"/>', // Bactéria
  '<path d="M40 88c-4-22 4-32 0-52M50 88c0-26 6-32 4-58M60 88c-4-22 2-36 0-48" stroke="#3fae5f" stroke-width="6" fill="none" stroke-linecap="round"/>', // Alga
  '<path d="M18 62c10-22 20 0 30-16s25 0 32-10" stroke="#e0906f" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="78" cy="38" r="2" fill="#111"/>', // Verme
  '<ellipse cx="45" cy="52" rx="28" ry="16" fill="#4f9fd8"/><path d="M73 52l16-10v20z" fill="#4f9fd8"/><circle cx="34" cy="48" r="4" fill="#fff"/><circle cx="34" cy="48" r="2" fill="#12203a"/>', // Peixe
  '<ellipse cx="50" cy="60" rx="26" ry="19" fill="#5fae4f"/><circle cx="38" cy="42" r="9" fill="#6fbf5f"/><circle cx="62" cy="42" r="9" fill="#6fbf5f"/><circle cx="38" cy="42" r="4" fill="#111"/><circle cx="62" cy="42" r="4" fill="#111"/><path d="M40 66c6 4 14 4 20 0" stroke="#2a5a20" stroke-width="3" fill="none"/>', // Anfíbio
  '<ellipse cx="50" cy="55" rx="30" ry="11" fill="#6fae4f"/><path d="M80 55c8-2 12-8 10-15" stroke="#6fae4f" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="74" cy="50" r="3.5" fill="#111"/><path d="M30 65l-6 9M46 65l-4 10M60 63l5 10" stroke="#6fae4f" stroke-width="4" stroke-linecap="round"/>', // Réptil
  CRIATURAS[3], // Dinossauro
  CRIATURAS[4], // Mamífero
  '<circle cx="50" cy="52" r="21" fill="#8a5a3a"/><circle cx="30" cy="46" r="9" fill="#8a5a3a"/><circle cx="70" cy="46" r="9" fill="#8a5a3a"/><ellipse cx="50" cy="58" rx="13" ry="11" fill="#d8b088"/><circle cx="43" cy="50" r="3" fill="#111"/><circle cx="57" cy="50" r="3" fill="#111"/>', // Primata
  CRIATURAS[5], // Humano
  CRIATURAS[6], // Ciborgue
];
function svgGer(idx) { return `<svg viewBox="0 0 100 100">${GER_ICON[Math.min(idx, GER_ICON.length - 1)]}</svg>`; }


function render() {
  dnaEl.textContent = formatar(estado.dna);
  psEl.textContent = formatar(producaoPorSeg());
  eraEl.textContent = estado.era + 1;
  eraNomeEl.textContent = nomeEra(estado.era);
  genesEl.textContent = estado.genes;
  genesBonusEl.textContent = estado.genes > 0 ? `(+${(estado.genes * 3)}% produção)` : "";
  criaturaEl.innerHTML = svgDe(estado.era % 8);

  const gg = genesGanhos();
  painelEvo.innerHTML = podeEvoluir()
    ? `<button class="btn" id="btn-evoluir">Evoluir para ${nomeEra(estado.era + 1)} — ×3${gg > 0 ? ` +${gg} Genes` : ""}</button>`
    : `<div style="text-align:center;color:var(--text-dim);font-size:0.8rem;">Evoluir em ${formatar(custoEvolucao())} DNA${gg > 0 ? ` · renderia +${gg} Genes` : ""}</div>`;
  const be = $("btn-evoluir"); if (be) be.addEventListener("click", evoluir);

  // organismos
  listaEl.innerHTML = "";
  GERADORES.forEach((g, idx) => {
    const desbloq = idx === 0 || q(GERADORES[idx - 1].id) > 0;
    if (!desbloq && q(g.id) === 0) return;
    const n = nDoModo(g), c = custo(g, n);
    const item = document.createElement("div");
    item.className = "evo-item" + (estado.dna < c ? " bloq" : "");
    item.innerHTML = `<div class="ic">${svgGer(idx)}</div>
      <div class="meio"><div class="nome">${g.nome} <span class="evo-qtd">${q(g.id)}</span></div>
      <div class="sub">${formatar(g.prod * estado.mult * bonusGenes() * multGlobal() * multGerador(g.id) * marco(q(g.id)))}/s cada · ×${marco(q(g.id))} bônus</div></div>
      <button class="comprar" ${estado.dna < c ? "disabled" : ""}>+${n}<br>${formatar(c)}</button>`;
    item.querySelector(".comprar").addEventListener("click", () => comprar(g));
    listaEl.appendChild(item);
  });

  // planeta
  const resumo = `<div style="background:linear-gradient(135deg,#0a2a3f,#1a0a2e);border-radius:14px;padding:12px;margin-bottom:6px;text-align:center;">
    <div style="font-size:0.8rem;color:var(--text-dim);">PLANETA VIVO</div>
    <div style="display:flex;justify-content:space-around;margin-top:6px;font-weight:800;">
      <div><div style="color:#6fdf6f;">${formatar(comidaPorSeg())}/s</div><div style="font-size:0.65rem;color:var(--text-dim);">Comida</div></div>
      <div><div style="color:#ffd54f;">${formatar(estado.pop)}/${formatar(tetoPop())}</div><div style="font-size:0.65rem;color:var(--text-dim);">População</div></div>
      <div><div style="color:#25c8e8;">${formatar(estado.ciencia)}</div><div style="font-size:0.65rem;color:var(--text-dim);">Ciência</div></div>
    </div>
    <div style="margin-top:6px;color:#b56fff;font-weight:800;font-size:0.85rem;">Planeta dá ×${multPlaneta().toFixed(2)} ao seu DNA</div>
  </div>`;
  listaPlaEl.innerHTML = resumo;
  PLANETA.forEach((b) => {
    const c = custoPla(b);
    const item = document.createElement("div");
    item.className = "evo-item" + (estado.dna < c ? " bloq" : "");
    item.innerHTML = `<div class="ic" style="color:#3fd06f;font-weight:900;">◈</div>
      <div class="meio"><div class="nome">${b.nome} <span class="evo-qtd">${nivelPla(b.id)}</span></div><div class="sub">${b.desc}</div></div>
      <button class="comprar" ${estado.dna < c ? "disabled" : ""}>${formatar(c)}</button>`;
    item.querySelector(".comprar").addEventListener("click", () => comprarPla(b));
    listaPlaEl.appendChild(item);
  });

  // melhorias
  listaMelEl.innerHTML = "";
  const disp = MELHORIAS.filter((u) => !comprou(u.id) && u.req());
  if (!disp.length) listaMelEl.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:20px;">Nenhuma melhoria disponível agora — evolua e cresça pra desbloquear mais!</div>';
  disp.forEach((u) => {
    const item = document.createElement("div");
    item.className = "evo-item" + (estado.dna < u.custo ? " bloq" : "");
    item.innerHTML = `<div class="ic" style="color:#ffd54f;font-weight:900;font-size:1.4rem;">↑</div>
      <div class="meio"><div class="nome">${u.nome}</div><div class="sub">${u.desc}</div></div>
      <button class="comprar" ${estado.dna < u.custo ? "disabled" : ""}>${formatar(u.custo)}</button>`;
    item.querySelector(".comprar").addEventListener("click", () => comprarMelhoria(u));
    listaMelEl.appendChild(item);
  });
}

// bônus dourado: aparece de tempos em tempos pra clicar
function talvezBonus() {
  tempoBonus--;
  if (tempoBonus > 0 || $("bonus-dourado")) return;
  tempoBonus = 700 + Math.random() * 700; // ~ a cada 1-2 min (em ticks de 100ms)
  const b = document.createElement("button");
  b.id = "bonus-dourado";
  b.style.cssText = `position:fixed;left:${10 + Math.random() * 70}%;top:${30 + Math.random() * 50}%;z-index:200;width:64px;height:64px;border-radius:50%;border:3px solid #fff;background:radial-gradient(circle at 35% 35%,#ffe680,#d9a520);box-shadow:0 0 24px rgba(255,213,79,0.8);animation:pulsa 0.8s infinite alternate;`;
  b.innerHTML = '<svg viewBox="0 0 24 24" style="width:34px;height:34px;"><path d="M12 2l2.5 7H22l-6 4.5L18.5 22 12 17l-6.5 5L8 13.5 2 9h7.5z" fill="#7a5a10"/></svg>';
  b.addEventListener("click", () => {
    const ganhoB = Math.max(valorClique() * 30, producaoPorSeg() * 90);
    ganhar(ganhoB); Som.vitoria(); vibrar([40, 30, 40]);
    avisar(`Bônus dourado! +${formatar(ganhoB)} DNA`);
    b.remove(); render();
  });
  document.body.appendChild(b);
  setTimeout(() => { if ($("bonus-dourado")) $("bonus-dourado").remove(); }, 11000);
}

criaturaEl.addEventListener("click", () => { ganhar(valorClique()); Som.clique(); dnaEl.textContent = formatar(estado.dna); });

document.querySelectorAll(".evo-modo button[data-modo]").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".evo-modo button[data-modo]").forEach((x) => x.classList.remove("ativo"));
    b.classList.add("ativo"); modo = b.dataset.modo === "max" ? "max" : parseInt(b.dataset.modo, 10); render();
  });
});
$("aba-org").addEventListener("click", () => trocarAba("org"));
function trocarAba(qual) {
  aba = qual;
  ["org", "mel", "pla"].forEach((a) => $("aba-" + a).classList.toggle("ativo", a === qual));
  listaEl.style.display = qual === "org" ? "flex" : "none";
  listaMelEl.style.display = qual === "mel" ? "flex" : "none";
  listaPlaEl.style.display = qual === "pla" ? "flex" : "none";
  render();
}
$("aba-mel").addEventListener("click", () => trocarAba("mel"));
$("aba-pla").addEventListener("click", () => trocarAba("pla"));


// ===== Planeta vivo (canvas): biomas, dia/noite, seres que evoluem =====
let mundoCanvas, mundoCtx, bioma, tile, mCols, mLins, offCanvas, offCtx, entidades = [], nuvens = [], estrelas = [];
let semente = Math.random() * 100, tempoDia = 0.3, ultimaEra = -1, ondas = [];

function ruido(x, y, s) { return 0.5 + 0.5 * (Math.sin(x * 0.6 + s) * 0.5 + Math.cos(y * 0.7 + s * 1.3) * 0.3 + Math.sin((x + y) * 0.45 + s * 2.1) * 0.2); }

function gerarBiomas() {
  bioma = [];
  // nº de terras cresce com a era e com o prestígio (genes) — o mundo se expande
  const nIlhas = Math.min(6, 1 + Math.floor((estado.era || 0) / 2) + Math.floor((estado.genes || 0) / 25));
  const ilhas = [{ cx: 0.5, cy: 0.5, r: 0.26 }];
  for (let i = 1; i < nIlhas; i++) {
    const ang = i * 2.399 + semente;
    const dist = 0.30 + 0.12 * (((i * 37 + semente * 90) % 100) / 100);
    ilhas.push({ cx: 0.5 + Math.cos(ang) * dist, cy: 0.5 + Math.sin(ang) * dist, r: 0.13 + 0.06 * (((i * 53) % 100) / 100) });
  }
  const mask = (c, r) => {
    const nx = c / mCols, ny = r / mLins;
    const n = 0.14 * Math.sin(c * 0.55 + semente) + 0.14 * Math.cos(r * 0.8 + semente * 1.7);
    for (const il of ilhas) { const dx = (nx - il.cx) / il.r, dy = (ny - il.cy) / (il.r * 1.05); if (Math.sqrt(dx * dx + dy * dy) + n < 1) return true; }
    return false;
  };
  for (let r = 0; r < mLins; r++) {
    bioma[r] = [];
    for (let c = 0; c < mCols; c++) {
      if (!mask(c, r)) {
        const raso = mask(c + 1, r) || mask(c - 1, r) || mask(c, r + 1) || mask(c, r - 1);
        bioma[r][c] = raso ? 1 : 0; // 0 fundo, 1 raso
      } else {
        const praia = !mask(c + 1, r) || !mask(c - 1, r) || !mask(c, r + 1) || !mask(c, r - 1);
        const elev = ruido(c, r, semente + 5);
        const flor = ruido(c * 1.3, r * 1.3, semente + 20);
        if (praia) bioma[r][c] = 2;              // areia
        else if (elev > 0.78) bioma[r][c] = elev > 0.9 && estado.era >= 4 ? 6 : 5; // montanha/neve
        else if (flor > 0.62) bioma[r][c] = 4;   // floresta
        else bioma[r][c] = 3;                    // grama
      }
    }
  }
}
const CORES_BIOMA = { 0: "#0e2c48", 1: "#1a5578", 2: "#cdb27a", 3: "#43a24f", 4: "#266b34", 5: "#6a6f78", 6: "#e0e8f0" };
function ehAgua(c, r) { return bioma[r] && bioma[r][c] <= 1; }
function tierCidade() { return (estado.pop || 0) > 500 ? 3 : (estado.pop || 0) > 100 ? 2 : 1; }
function ehAndavel(c, r) { const b = bioma[r] && bioma[r][c]; return b === 2 || b === 3 || b === 4; }
function biomaPix(x, y, fn) { return fn(Math.floor(x / tile), Math.floor(y / tile)); }

function criarVida(x, y) {
  if (!mundoCanvas) return;
  const agua = biomaPix(x, y, ehAgua);
  const tipo = agua ? (Math.random() < 0.5 ? "peixe" : "celula") : (Math.random() < 0.5 ? "planta" : "bicho");
  const e = { tipo, x, y, ang: Math.random() * 6.28, vel: 0.2 + Math.random() * 0.4, agua, estatico: tipo === "planta", f: 0, nasc: 0, temp: true, vida: 300 };
  entidades.push(e);
  ondas.push({ x, y, r: 3, vida: 20 });
  ganhar(valorClique() * 4); Som.clique();
  dnaEl.textContent = formatar(estado.dna);
}

function setupMundo() {
  try {
    mundoCanvas = document.getElementById("mundo");
    if (!mundoCanvas || !mundoCanvas.getContext) return;
    mundoCtx = mundoCanvas.getContext("2d");
    const L = mundoCanvas.clientWidth || 340, A = 230;
    mundoCanvas.width = L; mundoCanvas.height = A;
    tile = 10; mCols = Math.ceil(L / tile); mLins = Math.ceil(A / tile);
    gerarBiomas();
    offCanvas = document.createElement("canvas"); offCanvas.width = L; offCanvas.height = A;
    offCtx = offCanvas.getContext("2d");
    for (let r = 0; r < mLins; r++) for (let c = 0; c < mCols; c++) {
      let cor = CORES_BIOMA[bioma[r][c]];
      if (bioma[r][c] === 3 && (c + r) % 3 === 0) cor = "#3a8f45";
      if (bioma[r][c] === 4 && (c + r) % 2 === 0) cor = "#1f5a2b";
      offCtx.fillStyle = cor; offCtx.fillRect(c * tile, r * tile, tile + 1, tile + 1);
    }
    nuvens = []; for (let i = 0; i < 4; i++) nuvens.push({ x: Math.random() * L, y: 12 + Math.random() * 40, w: 26 + Math.random() * 30, spd: 0.1 + Math.random() * 0.15 });
    estrelas = []; for (let i = 0; i < 40; i++) estrelas.push({ x: Math.random() * L, y: Math.random() * (A * 0.5), b: Math.random() });
    entidades = [];
  } catch (e) {}
}

function novaEnt(tipo, agua, estatico) {
  let x, y, t = 0, ok = false;
  do { x = Math.random() * (mundoCanvas.width - 8) + 4; y = Math.random() * (mundoCanvas.height - 8) + 4; ok = biomaPix(x, y, agua ? ehAgua : ehAndavel); t++; } while (t < 50 && !ok);
  return { tipo, x, y, ang: Math.random() * 6.28, vel: 0.15 + Math.random() * 0.4, agua, estatico, f: Math.random() * 6, nasc: 0 };
}

function alvos() {
  const era = estado.era;
  return {
    // desbloqueou o organismo -> ele aparece no mapa (mais unidades = mais bichos)
    celula: Math.min(16, q("celula") > 0 ? 3 + Math.floor(q("celula") / 4) : Math.min(4, Math.floor(Math.log10(1 + estado.dna)))),
    peixe: Math.min(24, q("peixe") > 0 ? 2 + Math.floor(q("peixe") / 3) : 0),
    bicho: Math.min(16, Math.floor((q("reptil") + q("dino") + q("mamifero")) / 3)),
    humano: Math.min(28, (q("humano") > 0 ? 2 + Math.floor(q("humano") / 3) : 0) + Math.floor(Math.sqrt(estado.pop || 0) / 2)),
    // na aba Planeta: Plantação -> árvores; Aldeia -> casas
    planta: Math.min(30, nivelPla("planta") * 3 + nivelPla("gado")),
    aldeia: Math.min(12, nivelPla("aldeia")),
    passaro: Math.min(10, (era >= 3 ? 1 : 0) + Math.floor(q("dino") / 30) + nivelPla("planta")),
  };
}

function sincronizarMundo() {
  if (!mundoCanvas) return;
  const alvo = alvos();
  for (const tipo in alvo) {
    const atual = entidades.filter((e) => e.tipo === tipo && !e.temp).length;
    const agua = tipo === "celula" || tipo === "peixe";
    const estatico = tipo === "planta" || tipo === "aldeia";
    if (atual < alvo[tipo]) for (let i = 0; i < alvo[tipo] - atual; i++) {
      if (tipo === "passaro") { entidades.push({ tipo, x: Math.random() * mundoCanvas.width, y: 20 + Math.random() * 60, ang: 0, vel: 0.6 + Math.random() * 0.4, voa: true, f: Math.random() * 6, nasc: 0 }); continue; }
      const ent = novaEnt(tipo, agua, estatico);
      if (tipo === "planta") { const hs = entidades.filter((x) => x.tipo === "humano"); if (hs.length) { const h = hs[Math.floor(Math.random() * hs.length)]; for (let a = 0; a < 14; a++) { const px = h.x + (Math.random() - 0.5) * 44, py = h.y + (Math.random() - 0.5) * 44; if (px > 3 && py > 3 && px < mundoCanvas.width - 3 && py < mundoCanvas.height - 3 && biomaPix(px, py, ehAndavel)) { ent.x = px; ent.y = py; break; } } } }
      entidades.push(ent);
    }
    else if (atual > alvo[tipo]) { let rem = atual - alvo[tipo]; entidades = entidades.filter((e) => { if (e.tipo === tipo && !e.temp && rem > 0) { rem--; return false; } return true; }); }
  }
  // dá "casa" aos humanos (aldeia mais próxima)
  const aldeias = entidades.filter((e) => e.tipo === "aldeia");
  entidades.filter((e) => e.tipo === "humano" && !e.casa).forEach((h) => { if (aldeias.length) { let m = aldeias[0], md = 1e9; aldeias.forEach((a) => { const dd = Math.hypot(a.x - h.x, a.y - h.y); if (dd < md) { md = dd; m = a; } }); h.casa = m; } });
}

function animarMundo(dt) {
  if (!mundoCanvas) return;
  const p = Math.min(3, dt * 60), Lc = mundoCanvas.width;
  tempoDia = (tempoDia + dt / 100) % 1; // dia completo ~100s
  nuvens.forEach((n) => { n.x += n.spd * p; if (n.x - n.w > Lc) n.x = -n.w; });
  ondas.forEach((o) => { o.r += 1.5 * p; o.vida -= p; });
  ondas = ondas.filter((o) => o.vida > 0);
  entidades = entidades.filter((e) => { if (e.temp) { e.vida -= p; return e.vida > 0; } return true; });
  entidades.forEach((e) => {
    e.f += 0.12 * p; if (e.nasc < 1) e.nasc = Math.min(1, e.nasc + 0.04 * p);
    if (e.estatico) return;
    if (e.voa) { e.x += e.vel * p; if (e.x > Lc + 10) e.x = -10; e.y += Math.sin(e.f) * 0.3; return; }
    // humano tende a voltar pra casa
    if (e.casa && Math.hypot(e.x - e.casa.x, e.y - e.casa.y) > 34 && Math.random() < 0.1) e.ang = Math.atan2(e.casa.y - e.y, e.casa.x - e.x);
    const nx = e.x + Math.cos(e.ang) * e.vel * p, ny = e.y + Math.sin(e.ang) * e.vel * p;
    const ok = nx > 3 && ny > 3 && nx < Lc - 3 && ny < mundoCanvas.height - 3 && biomaPix(nx, ny, e.agua ? ehAgua : ehAndavel);
    if (ok) { e.x = nx; e.y = ny; } else e.ang += 2 + Math.random();
    if (Math.random() < 0.02) e.ang += (Math.random() - 0.5);
  });
}

function desenharMundo() {
  if (!mundoCtx) return;
  const A = mundoCanvas.height, Lc = mundoCanvas.width;
  mundoCtx.drawImage(offCanvas, 0, 0);
  // estradas ligando as aldeias
  const alds = entidades.filter((e) => e.tipo === "aldeia");
  if (alds.length > 1) { mundoCtx.strokeStyle = "rgba(200,170,120,0.35)"; mundoCtx.lineWidth = 2; for (let i = 0; i < alds.length - 1; i++) { const a = alds[i], b = alds[i + 1]; if (Math.hypot(a.x - b.x, a.y - b.y) < 140) { mundoCtx.beginPath(); mundoCtx.moveTo(a.x, a.y); mundoCtx.lineTo(b.x, b.y); mundoCtx.stroke(); } } }
  const luz = Math.max(0, Math.min(1, (Math.sin(tempoDia * 6.283) + 0.35) / 1.35));
  // estrelas de noite
  if (luz < 0.4) { const a = (0.4 - luz) / 0.4; estrelas.forEach((s) => { mundoCtx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(tempoDia * 10 + s.b * 6))); mundoCtx.fillStyle = "#fff"; mundoCtx.fillRect(s.x, s.y, 1.4, 1.4); }); mundoCtx.globalAlpha = 1; }
  // sol / lua
  const sx = tempoDia * Lc, sh = Math.sin(tempoDia * 6.283), sy = 40 - sh * 30;
  if (sh > -0.1) { mundoCtx.fillStyle = "#ffe680"; mundoCtx.shadowColor = "#ffd54f"; mundoCtx.shadowBlur = 16; mundoCtx.beginPath(); mundoCtx.arc(sx, sy, 10, 0, 6.28); mundoCtx.fill(); mundoCtx.shadowBlur = 0; }
  else { const mx = ((tempoDia + 0.5) % 1) * Lc; mundoCtx.fillStyle = "#e8eef8"; mundoCtx.beginPath(); mundoCtx.arc(mx, 40 + sh * 30, 8, 0, 6.28); mundoCtx.fill(); }
  // nuvens
  nuvens.forEach((n) => { mundoCtx.fillStyle = "rgba(255,255,255,0.22)"; mundoCtx.beginPath(); mundoCtx.ellipse(n.x, n.y, n.w, n.w * 0.4, 0, 0, 6.28); mundoCtx.fill(); });
  // seres
  entidades.forEach((e) => {
    const s = e.temp ? Math.min(e.nasc, e.vida / 50) : e.nasc, x = e.x, y = e.y;
    mundoCtx.save(); mundoCtx.globalAlpha = s;
    if (e.tipo === "celula") { mundoCtx.fillStyle = "#7fffd0"; mundoCtx.beginPath(); mundoCtx.arc(x, y, 1.6 * s, 0, 6.28); mundoCtx.fill(); }
    else if (e.tipo === "peixe") { mundoCtx.translate(x, y); mundoCtx.rotate(e.ang); mundoCtx.scale(s, s); mundoCtx.fillStyle = "#e8a040"; mundoCtx.beginPath(); mundoCtx.ellipse(0, 0, 4, 2, 0, 0, 6.28); mundoCtx.fill(); mundoCtx.beginPath(); mundoCtx.moveTo(-4, 0); mundoCtx.lineTo(-7, -2); mundoCtx.lineTo(-7, 2); mundoCtx.fill(); }
    else if (e.tipo === "planta") { mundoCtx.fillStyle = "#6a4a2a"; mundoCtx.fillRect(x - 1, y, 2, 4 * s); mundoCtx.fillStyle = "#2f8f3f"; mundoCtx.beginPath(); mundoCtx.moveTo(x, y - 7 * s); mundoCtx.lineTo(x - 5 * s, y + 1); mundoCtx.lineTo(x + 5 * s, y + 1); mundoCtx.fill(); }
    else if (e.tipo === "bicho") { mundoCtx.fillStyle = "#b06a3a"; mundoCtx.beginPath(); mundoCtx.arc(x, y, 2.4 * s, 0, 6.28); mundoCtx.fill(); }
    else if (e.tipo === "humano") { mundoCtx.fillStyle = "#ffd0a0"; mundoCtx.beginPath(); mundoCtx.arc(x, y - 2, 1.4, 0, 6.28); mundoCtx.fill(); mundoCtx.strokeStyle = "#4f8cff"; mundoCtx.lineWidth = 1.6; mundoCtx.beginPath(); mundoCtx.moveTo(x, y - 1); mundoCtx.lineTo(x, y + 2); mundoCtx.stroke(); }
    else if (e.tipo === "aldeia") {
      const tier = tierCidade(), casas = tier === 3 ? 4 : tier === 2 ? 2 : 1;
      for (let k = 0; k < casas; k++) {
        const hx = x + (k % 2) * 9 - (casas > 1 ? 4 : 0), hy = y - Math.floor(k / 2) * 7;
        mundoCtx.fillStyle = "#8a5a30"; mundoCtx.fillRect(hx - 4, hy - 2, 8, 6);
        mundoCtx.fillStyle = "#5a3818"; mundoCtx.beginPath(); mundoCtx.moveTo(hx - 5, hy - 2); mundoCtx.lineTo(hx, hy - 8); mundoCtx.lineTo(hx + 5, hy - 2); mundoCtx.fill();
        if (luz < 0.4) { mundoCtx.fillStyle = "#ffd54f"; mundoCtx.fillRect(hx - 1.5, hy, 3, 3); }
      }
      if (tier === 3) { mundoCtx.fillStyle = "#8a8a98"; mundoCtx.fillRect(x + 6, y - 16, 6, 18); mundoCtx.fillStyle = luz < 0.4 ? "#7fdfff" : "#4a4a58"; mundoCtx.fillRect(x + 7.5, y - 13, 3, 3); }
    }
    else if (e.tipo === "passaro") { mundoCtx.strokeStyle = "#222"; mundoCtx.lineWidth = 1.4; const w = Math.sin(e.f) * 3; mundoCtx.beginPath(); mundoCtx.moveTo(x - 4, y + w); mundoCtx.lineTo(x, y); mundoCtx.lineTo(x + 4, y + w); mundoCtx.stroke(); }
    mundoCtx.restore();
  });
  ondas.forEach((o) => { mundoCtx.strokeStyle = `rgba(255,255,255,${o.vida / 20})`; mundoCtx.lineWidth = 2; mundoCtx.beginPath(); mundoCtx.arc(o.x, o.y, o.r, 0, 6.28); mundoCtx.stroke(); });
  // véu de noite por cima de tudo
  if (luz < 1) { mundoCtx.fillStyle = `rgba(10,18,45,${(1 - luz) * 0.5})`; mundoCtx.fillRect(0, 0, Lc, A); }
}

function simularPlaneta(dt) {
  const teto = tetoPop();
  const alvo = Math.min(teto, comidaPorSeg() / 0.5); // cada comida/s sustenta 2 pessoas
  estado.pop += (alvo - estado.pop) * Math.min(1, dt * 0.4);
  if (estado.pop < 0) estado.pop = 0;
  estado.ciencia += estado.pop * somaPla("ciencia") * energiaPla() * dt;
}

function iniciar() {
  const meu = ++laco; let ultimo = performance.now();
  const passo = (agora) => {
    if (meu !== laco) return;
    const dt = Math.min(0.5, (agora - ultimo) / 1000); ultimo = agora;
    simularPlaneta(dt);
    if (estado.era !== ultimaEra) { ultimaEra = estado.era; setupMundo(); sincronizarMundo(); }
    animarMundo(dt);
    desenharMundo();
    ganhar(producaoPorSeg() * dt);
    dnaEl.textContent = formatar(estado.dna);
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

setInterval(render, 500);
setInterval(talvezBonus, 100);
setInterval(salvar, 5000);
document.addEventListener("visibilitychange", () => { if (document.hidden) salvar(); });
window.addEventListener("pagehide", salvar);

// animação do bônus
const estilo = document.createElement("style");
estilo.textContent = "@keyframes pulsa{from{transform:scale(1)}to{transform:scale(1.15)}}";
if (document.head) document.head.appendChild(estilo);

setupMundo();
window.addEventListener("resize", () => { setupMundo(); sincronizarMundo(); });
{
  const cv = document.getElementById("mundo");
  const toque = (ev) => { ev.preventDefault(); const r = cv.getBoundingClientRect(); const t = ev.touches ? ev.touches[0] : ev; criarVida(t.clientX - r.left, t.clientY - r.top); };
  cv.addEventListener("touchstart", toque, { passive: false });
  cv.addEventListener("mousedown", toque);
}
carregar();
render();
sincronizarMundo();
setInterval(sincronizarMundo, 1500);
iniciar();
