// Cobra Batalha — snake .io: cresça comendo, bata sua cabeça no corpo dos
// outros pra matá-los. Arena compartilhada com bots e jogadores reais.
const MUNDO = 1600;
const CORES_BOTS = ["#ff6f6f", "#6fdf6f", "#ffd54f", "#cf8fff", "#ff9f4f", "#25c8e8"];
const VAGAS_SALA = 8;

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const placarEl = document.getElementById("placar");

let eu, bots, comidas;
let joystick = null;
let rodando = false;
let onlineAtivo = false;
let souHost = false;
let meuId = null;
let outros = new Map();
let botsRemotos = [];
let tempoEnvio = 0;
let tempoEnvioBots = 0;
let laco = 0;
let turbo = false;
let gastoTurbo = 0;

function aleatorio(max) { return Math.random() * max; }

function novaComida() {
  return { x: aleatorio(MUNDO), y: aleatorio(MUNDO), cor: CORES_BOTS[Math.floor(Math.random() * CORES_BOTS.length)] };
}

function novaCobra(x, y, cor, nome) {
  const ang = aleatorio(Math.PI * 2);
  const corpo = [];
  for (let i = 0; i < 8; i++) corpo.push({ x: x - Math.cos(ang) * i * 8, y: y - Math.sin(ang) * i * 8 });
  return { x, y, ang, corpo, tamanho: 8, cor, nome, vivo: true, prot: 60, id: "c" + Math.floor(aleatorio(1e6)) };
}

function novoBot(i) {
  let x, y, t = 0;
  do { x = aleatorio(MUNDO); y = aleatorio(MUNDO); t++; }
  while (t < 20 && eu && Math.hypot(eu.x - x, eu.y - y) < 300);
  const b = novaCobra(x, y, CORES_BOTS[i % CORES_BOTS.length], "Bot " + (i + 1));
  b.rumo = aleatorio(Math.PI * 2);
  return b;
}

function corDaSkin() {
  return window.Cosmetico ? Cosmetico.dados("cobra") : ["#7ddf7d", "#4faf4f"];
}

function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
}
window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  eu = novaCobra(MUNDO / 2, MUNDO / 2, corDaSkin()[0], onlineAtivo ? Nuvem.apelido() : "Você");
  eu.sou = true;
  bots = onlineAtivo ? [] : Array.from({ length: 5 }, (_, i) => novoBot(i));
  comidas = Array.from({ length: 120 }, novaComida);
  joystick = null;
  rodando = true;
  placarEl.textContent = "0";
  if (!laco) iniciarLaco();
}

let acumulado = 0;
let ultimoT = 0;
function iniciarLaco() {
  const meuLaco = ++laco;
  ultimoT = performance.now();
  const quadro = (agora) => {
    if (meuLaco !== laco) return;
    acumulado += agora - ultimoT;
    ultimoT = agora;
    // roda a lógica a 60 passos/s fixos, não importa o refresh da tela
    let passos = 0;
    while (acumulado >= 16.7 && passos < 4) {
      if (rodando && !document.hidden) passo();
      acumulado -= 16.7;
      passos++;
    }
    if (acumulado > 100) acumulado = 0;
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

const VEL = 1.35; // base tranquila; turbo acelera

function moverCobra(c, alvoAng) {
  // vira suavemente em direção ao alvo
  let dif = ((alvoAng - c.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  c.ang += Math.max(-0.09, Math.min(0.09, dif));
  const vel = (c.sou && turbo && c.tamanho > 10) ? VEL * 2.1 : VEL;
  c.x += Math.cos(c.ang) * vel;
  c.y += Math.sin(c.ang) * vel;
  // parede sólida: marca quem encostou (não atravessa mais)
  c.bateuParede = c.x < 6 || c.y < 6 || c.x > MUNDO - 6 || c.y > MUNDO - 6;
  c.x = Math.max(6, Math.min(MUNDO - 6, c.x));
  c.y = Math.max(6, Math.min(MUNDO - 6, c.y));
  c.corpo.unshift({ x: c.x, y: c.y });
  while (c.corpo.length > c.tamanho) c.corpo.pop();
  if (c.prot > 0) c.prot--;
}

function comeu(cabecaX, cabecaY, comida) {
  return Math.hypot(cabecaX - comida.x, cabecaY - comida.y) < 12;
}

// cabeça de A bate no corpo de B?
function bateu(a, b) {
  if (a.prot > 0 || b.prot > 0) return false;
  for (let i = 3; i < b.corpo.length; i++) {
    if (Math.hypot(a.x - b.corpo[i].x, a.y - b.corpo[i].y) < 8) return true;
  }
  return false;
}

function morrer(c) {
  // vira comida no lugar do corpo
  c.corpo.forEach((s, i) => {
    if (i % 2 === 0) comidas.push({ x: s.x, y: s.y, cor: c.cor });
  });
}

function passo() {
  // ---- turbo: gasta tamanho aos poucos e cospe comida atrás ----
  if (turbo && eu.tamanho > 10) {
    gastoTurbo += 1;
    if (gastoTurbo >= 8) {
      gastoTurbo = 0;
      eu.tamanho -= 1;
      placarEl.textContent = String(Math.max(0, eu.tamanho - 8));
      const cauda = eu.corpo[eu.corpo.length - 1];
      if (cauda) comidas.push({ x: cauda.x, y: cauda.y, cor: corDaSkin()[0] });
    }
  }

  // ---- controle da minha cobra ----
  if (joystick && (joystick.dx || joystick.dy)) {
    moverCobra(eu, Math.atan2(joystick.dy, joystick.dx));
  } else {
    moverCobra(eu, eu.ang);
  }
  // bater na parede (fora da proteção) mata
  if (eu.bateuParede && eu.prot <= 0) {
    if (onlineAtivo) { fuiMorto("na parede"); return; }
    perder();
    return;
  }

  // ---- bots (só offline ou host) ----
  if (!onlineAtivo || souHost) {
    bots.forEach((b) => {
      // caça a comida mais próxima; foge se algo grande estiver perto
      let alvo = null, dist = 1e9;
      comidas.forEach((f) => {
        const dd = Math.hypot(f.x - b.x, f.y - b.y);
        if (dd < dist) { dist = dd; alvo = f; }
      });
      let ang = alvo ? Math.atan2(alvo.y - b.y, alvo.x - b.x) : b.rumo;
      // longe das bordas? mira o centro pra não bater
      const margem = 140;
      if (b.x < margem || b.x > MUNDO - margem || b.y < margem || b.y > MUNDO - margem) {
        ang = Math.atan2(MUNDO / 2 - b.y, MUNDO / 2 - b.x);
      }
      moverCobra(b, ang);
      if (b.bateuParede) { morrer(b); bots[bots.indexOf(b)] = novoBot(bots.indexOf(b)); }
    });
  } else {
    bots = botsRemotos.map((b) => ({ ...b }));
  }

  // ---- comer comida ----
  const cobras = [eu, ...bots];
  comidas = comidas.filter((f) => {
    for (const c of cobras) {
      if (comeu(c.x, c.y, f)) {
        c.tamanho += 2;
        if (c === eu) { placarEl.textContent = String(eu.tamanho - 8); Som.clique(); }
        return false;
      }
    }
    return true;
  });
  while (comidas.length < 120) comidas.push(novaComida());

  // ---- colisões cabeça↔corpo ----
  const reais = onlineAtivo ? [...outros.values()] : [];
  const todas = [eu, ...bots, ...reais];
  // eu bato em alguém?
  for (const outro of [...bots, ...reais]) {
    if (outro !== eu && bateu(eu, outro)) {
      if (onlineAtivo) { fuiMorto(outro.nome); return; }
      perder();
      return;
    }
  }
  // bots batem em mim/outros (offline ou host)
  if (!onlineAtivo || souHost) {
    for (const b of [...bots]) {
      for (const outro of todas) {
        if (outro !== b && bateu(b, outro)) {
          morrer(b);
          if (onlineAtivo) bots[bots.indexOf(b)] = novoBot(bots.indexOf(b));
          else bots[bots.indexOf(b)] = novoBot(bots.indexOf(b));
          Som.acerto();
          break;
        }
      }
    }
  }

  if (eu.tamanho - 8 > (Recordes.get("cobrabatalha") || 0)) {
    Recordes.salvar("cobrabatalha", eu.tamanho - 8);
  }

  // ---- rede ----
  if (onlineAtivo) redeOnline();

  desenhar();
}

function redeOnline() {
  tempoEnvio += 16;
  if (tempoEnvio >= 110) {
    tempoEnvio = 0;
    // envia cabeça + corpo decimado (1 a cada 3 pontos)
    const corpoLeve = eu.corpo.filter((_, i) => i % 3 === 0).map((s) => ({ x: Math.round(s.x), y: Math.round(s.y) }));
    Online.enviar({ t: "c", id: meuId, x: Math.round(eu.x), y: Math.round(eu.y), corpo: corpoLeve, tamanho: eu.tamanho, cor: eu.cor, nome: eu.nome, prot: eu.prot });
  }
  const agora = Date.now();
  outros.forEach((v, k) => { if (agora - v.ts > 3500) outros.delete(k); });
  if (souHost) {
    tempoEnvioBots += 16;
    if (tempoEnvioBots >= 150) {
      tempoEnvioBots = 0;
      Online.enviar({ t: "bots", lista: bots.map((b) => ({
        id: b.id, x: Math.round(b.x), y: Math.round(b.y),
        corpo: b.corpo.filter((_, i) => i % 3 === 0).map((s) => ({ x: Math.round(s.x), y: Math.round(s.y) })),
        cor: b.cor, nome: b.nome, prot: b.prot,
      })) });
    }
  }
}

function aoMensagem(p) {
  if (p.t === "c" && p.id !== meuId) {
    outros.set(p.id, { ...p, ts: Date.now() });
  } else if (p.t === "bots" && !souHost) {
    botsRemotos = p.lista.map((b) => ({ ...b, tamanho: b.corpo.length * 3 }));
  } else if (p.t === "matou" && p.alvo === meuId) {
    fuiMorto(p.por);
  }
}

function aoPresenca(qtd) {
  const chaves = Object.keys(Online.canal ? Online.canal.presenceState() : {}).sort();
  souHost = chaves.length > 0 && chaves[0] === meuId;
  const chip = document.getElementById("btn-lobby");
  if (onlineAtivo) chip.textContent = `🌐 ${qtd}`;
  if (souHost) {
    const alvo = Math.max(0, VAGAS_SALA - qtd);
    while (bots.length > alvo) {
      let fraco = 0;
      for (let i = 1; i < bots.length; i++) if (bots[i].tamanho < bots[fraco].tamanho) fraco = i;
      bots.splice(fraco, 1);
    }
    while (bots.length < alvo) bots.push(novoBot(bots.length));
  }
}

function fuiMorto(por) {
  const ganhos = Math.max((eu.tamanho - 8) * 2, 3);
  Pontos.add(ganhos);
  Recordes.salvar("cobrabatalha", eu.tamanho - 8);
  if (window.Missoes) Missoes.partida();
  if (window.Stats) Stats.partida();
  morrer(eu);
  Som.erro();
  vibrar(120);
  // renasce na hora
  eu = novaCobra(aleatorio(MUNDO), aleatorio(MUNDO), corDaSkin()[0], Nuvem.apelido());
  eu.sou = true;
  eu.prot = 120;
  placarEl.textContent = "0";
  Modal.mostrar({
    emoji: "🐍", titulo: `Você foi pego por ${por}!`,
    texto: `Tamanho ${eu.tamanho} • +${ganhos} pontos — renasceu!`,
    botao: "Continuar", aoJogarDeNovo: () => {}, aoMenu: abrirLobby,
  });
}

function perder() {
  rodando = false;
  const ganhos = Math.max((eu.tamanho - 8) * 2, 3);
  Pontos.add(ganhos);
  const rec = Recordes.salvar("cobrabatalha", eu.tamanho - 8);
  Som.erro();
  vibrar(120);
  setTimeout(() => Modal.mostrar({
    emoji: rec ? "🏆" : "🐍",
    titulo: rec ? "Novo recorde!" : "Você bateu!",
    texto: `Tamanho ${eu.tamanho} • +${ganhos} pontos`,
    aoJogarDeNovo: () => { novoJogo(); }, aoMenu: abrirLobby,
  }), 300);
}

function desenharCobra(c, cx, cy, souEu) {
  const corBase = souEu ? corDaSkin() : [c.cor, c.cor];
  ctx.globalAlpha = c.prot > 0 ? 0.5 : 1;
  for (let i = c.corpo.length - 1; i >= 0; i--) {
    const s = c.corpo[i];
    ctx.fillStyle = i === 0 ? corBase[0] : corBase[souEu ? 1 : 0];
    ctx.beginPath();
    ctx.arc(s.x + cx, s.y + cy, i === 0 ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // olho
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(c.x + cx + Math.cos(c.ang) * 3, c.y + cy + Math.sin(c.ang) * 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // nome
  if (!souEu && c.nome) {
    ctx.fillStyle = onlineAtivo && [...outros.values()].includes(c) ? "#ffd54f" : "rgba(255,255,255,0.6)";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(c.nome, c.x + cx, c.y + cy - 14);
  }
}

function desenhar() {
  ctx.fillStyle = "#0d1420";
  ctx.fillRect(0, 0, tela.width, tela.height);
  const cx = tela.width / 2 - eu.x;
  const cy = tela.height / 2 - eu.y;

  // grade
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= MUNDO; x += 100) { ctx.beginPath(); ctx.moveTo(x + cx, cy); ctx.lineTo(x + cx, MUNDO + cy); ctx.stroke(); }
  for (let y = 0; y <= MUNDO; y += 100) { ctx.beginPath(); ctx.moveTo(cx, y + cy); ctx.lineTo(MUNDO + cx, y + cy); ctx.stroke(); }
  ctx.strokeStyle = "#2a3a4a"; ctx.lineWidth = 4; ctx.strokeRect(cx, cy, MUNDO, MUNDO);

  comidas.forEach((f) => {
    ctx.fillStyle = f.cor;
    ctx.beginPath();
    ctx.arc(f.x + cx, f.y + cy, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  bots.forEach((b) => desenharCobra(b, cx, cy, false));
  if (onlineAtivo) outros.forEach((o) => { if (o.corpo) { o.ang = 0; desenharCobra(o, cx, cy, false); } });
  desenharCobra(eu, cx, cy, true);

  // faixa online
  if (onlineAtivo) {
    ctx.strokeStyle = "#3fdf6f"; ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, tela.width - 4, tela.height - 4);
    ctx.fillStyle = "#3fdf6f"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("● ARENA ONLINE", tela.width / 2, 22);
  }

  // ranking
  const rank = [
    { nome: onlineAtivo ? Nuvem.apelido() : "Você", t: eu.tamanho, sou: true, real: true },
    ...(onlineAtivo ? [...outros.values()].map((o) => ({ nome: o.nome, t: o.tamanho || (o.corpo ? o.corpo.length * 3 : 0), real: true })) : []),
    ...bots.map((b) => ({ nome: b.nome, t: b.tamanho, real: false })),
  ].sort((a, b) => b.t - a.t).slice(0, 6);
  ctx.textAlign = "right"; ctx.font = "bold 12px sans-serif";
  rank.forEach((r, i) => {
    ctx.fillStyle = r.sou ? "#ffd54f" : r.real ? "#ff9f4f" : "rgba(255,255,255,0.4)";
    ctx.fillText(`${i === 0 ? "♛" : i + 1 + "º"} ${r.nome} — ${r.t}`, tela.width - 10, (onlineAtivo ? 40 : 62) + i * 17);
  });

  // joystick
  if (joystick) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(joystick.bx, joystick.by, 46, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath(); ctx.arc(joystick.kx, joystick.ky, 20, 0, Math.PI * 2); ctx.fill();
  }
}

// ---- joystick ----
function pos(e) {
  const r = tela.getBoundingClientRect();
  const t = e.touches?.[0] || e.changedTouches?.[0] || e;
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}
function abrir(e) { e.preventDefault(); const p = pos(e); joystick = { bx: p.x, by: p.y, kx: p.x, ky: p.y, dx: 0, dy: 0 }; }
function mover(e) {
  if (!joystick) return; e.preventDefault();
  const p = pos(e); let dx = p.x - joystick.bx, dy = p.y - joystick.by;
  const d = Math.hypot(dx, dy), R = 46;
  if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  joystick.kx = joystick.bx + dx; joystick.ky = joystick.by + dy;
  joystick.dx = d > 8 ? dx : 0; joystick.dy = d > 8 ? dy : 0;
}
function fechar(e) { e.preventDefault(); joystick = null; }
tela.addEventListener("touchstart", abrir, { passive: false });
tela.addEventListener("touchmove", mover, { passive: false });
tela.addEventListener("touchend", fechar, { passive: false });
tela.addEventListener("mousedown", abrir);
tela.addEventListener("mousemove", (e) => { if (e.buttons) mover(e); });
tela.addEventListener("mouseup", fechar);

async function entrarOnline() {
  meuId = Nuvem.deviceId();
  try {
    await Online.abrir("COBRAS", aoMensagem, aoPresenca);
    onlineAtivo = true;
    novoJogo();
  } catch (e) {
    onlineAtivo = false;
    novoJogo();
  }
}

function abrirLobby() {
  rodando = false;
  onlineAtivo = false;
  if (window.Online) Online.fechar();
  Lobby.mostrar({
    titulo: "Cobra Batalha",
    skinCat: "cobra",
    temOnline: true,
    previewHTML: () => {
      const d = corDaSkin();
      return `<svg viewBox="0 0 120 40"><rect x="4" y="16" width="12" height="12" rx="4" fill="${d[1]}"/><rect x="18" y="16" width="12" height="12" rx="4" fill="${d[1]}"/><rect x="32" y="16" width="12" height="12" rx="4" fill="${d[1]}"/><rect x="46" y="16" width="12" height="12" rx="4" fill="${d[1]}"/><rect x="60" y="12" width="20" height="20" rx="7" fill="${d[0]}"/><circle cx="74" cy="19" r="2.5" fill="#12203a"/></svg>`;
    },
    aoJogar: ({ modo }) => {
      if (modo === "online") entrarOnline();
      else { onlineAtivo = false; novoJogo(); }
    },
  });
}

const botaoTurbo = document.getElementById("btn-turbo");
function ligaTurbo(e) { e.preventDefault(); turbo = true; botaoTurbo.classList.add("ativo"); }
function desligaTurbo(e) { if (e) e.preventDefault(); turbo = false; botaoTurbo.classList.remove("ativo"); }
botaoTurbo.addEventListener("touchstart", ligaTurbo, { passive: false });
botaoTurbo.addEventListener("touchend", desligaTurbo, { passive: false });
botaoTurbo.addEventListener("mousedown", ligaTurbo);
botaoTurbo.addEventListener("mouseup", desligaTurbo);
botaoTurbo.addEventListener("mouseleave", desligaTurbo);

document.getElementById("btn-lobby").addEventListener("click", abrirLobby);
configurarMelhor("cobrabatalha");
abrirLobby();
