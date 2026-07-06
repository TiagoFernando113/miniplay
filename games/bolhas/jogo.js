// Estilo agar.io completo: joystick, SPLIT (➗), ejetar massa (💨) e vírus.
const MUNDO = 1200;
const CORES_BOTS = ["#ff6f6f", "#6fdf6f", "#ffd54f", "#cf8fff", "#ff9f4f", "#25c8e8"];

const tela = document.getElementById("tela");
const ctx = tela.getContext("2d");
const tamanhoEl = document.getElementById("tamanho");
const mensagemEl = document.getElementById("mensagem");
const botaoReiniciar = document.getElementById("reiniciar");

let celulas = []; // suas bolhas (pode dividir em até 4)
let bots, comidas, virus;
let joystick = null;
let maiorDaPartida = 0;

// ---- aquário online (sala global BOLHAS) ----
const VAGAS_SALA = 8;
let onlineAtivo = false;
let souHost = false;
let meuId = null;
let outros = new Map(); // jogadores reais: id -> {x,y,raio,cor,nome,ts}
let botsRemotos = [];
let tempoEnvio = 0;
let tempoEnvioBots = 0;

function avisoOnline(texto) {
  mensagemEl.textContent = texto;
  mensagemEl.classList.remove("escondida");
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => mensagemEl.classList.add("escondida"), 2500);
}

function aoMensagemAquario(p) {
  if (p.t === "p" && p.id !== meuId) {
    const antigo = outros.get(p.id);
    outros.set(p.id, {
      ...p,
      dx: antigo ? antigo.dx : p.x, // posição exibida (interpola até x,y)
      dy: antigo ? antigo.dy : p.y,
      ts: Date.now(),
    });
  } else if (p.t === "bots" && !souHost) {
    botsRemotos = p.lista;
  } else if (p.t === "comi" && p.alvo === meuId) {
    fuiComido(p.por || "alguém");
  } else if (p.t === "comiBot" && souHost) {
    const indice = bots.findIndex((b) => b.id === p.id);
    if (indice >= 0) bots[indice] = novoBot(indice);
  }
}

function aoPresencaAquario(qtd) {
  const chaves = Object.keys(Online.canal ? Online.canal.presenceState() : {}).sort();
  souHost = chaves.length > 0 && chaves[0] === meuId;
  document.getElementById("btn-lobby").textContent = onlineAtivo ? `🌐 ${qtd}` : "☰";

  if (souHost) {
    // bots preenchem as vagas; gente real entra, o bot MAIS FRACO sai
    const alvo = Math.max(0, VAGAS_SALA - qtd);
    while (bots.length > alvo) {
      let fraco = 0;
      for (let i = 1; i < bots.length; i++) if (bots[i].raio < bots[fraco].raio) fraco = i;
      bots.splice(fraco, 1);
    }
    while (bots.length < alvo) bots.push(novoBot(bots.length));
  }
}

function fuiComido(porQuem) {
  const ganhos = Math.max(Math.floor(maiorDaPartida / 2), 3);
  Pontos.add(ganhos);
  Recordes.salvar("bolhas", maiorDaPartida);
  if (window.Missoes) Missoes.partida();
  if (window.Stats) Stats.partida();
  Som.erro();
  vibrar(120);
  avisoOnline(`Você foi comido por ${porQuem}! +${ganhos} pontos — renascendo...`);
  // renasce pequeno, longe e protegido — a sala continua
  celulas = [{
    x: aleatorio(MUNDO),
    y: aleatorio(MUNDO),
    raio: 12,
    ix: 0,
    iy: 0,
    it: 0,
    prot: 90,
  }];
  maiorDaPartida = 12;
}

async function entrarAquario() {
  meuId = Nuvem.deviceId();
  avisoOnline("Conectando ao aquário global...");
  try {
    await Online.abrir("BOLHAS", aoMensagemAquario, aoPresencaAquario);
    onlineAtivo = true;
    novoJogo(); // todo mundo começa pequeno: justo
    onlineAtivo = true; // (novoJogo não desliga o online)
    avisoOnline("Você entrou no aquário! Jogadores reais têm nome em cima 🌐");
  } catch (e) {
    avisoOnline("Sem conexão — tenta de novo");
  }
}

function sairAquario() {
  onlineAtivo = false;
  souHost = false;
  outros.clear();
  botsRemotos = [];
  if (window.Online) Online.fechar();
  document.getElementById("btn-lobby").textContent = "☰";
  novoJogo();
}
let proximaFusao = 0;
let relogio = null;
let fimDeJogo = false;

function aleatorio(max) {
  return Math.random() * max;
}

function novaComida(x, y, raio = 3) {
  return { x: x ?? aleatorio(MUNDO), y: y ?? aleatorio(MUNDO), raio };
}

function raioTotal() {
  return Math.sqrt(celulas.reduce((soma, c) => soma + c.raio * c.raio, 0));
}

function centro() {
  const x = celulas.reduce((s, c) => s + c.x, 0) / celulas.length;
  const y = celulas.reduce((s, c) => s + c.y, 0) / celulas.length;
  return { x, y };
}

function novoBot(i) {
  // JUSTO: bot novo nunca nasce maior que você (0.4x a 0.9x), nasce longe
  // e com 3s de proteção (não come nem é comido) — chega de morte do nada!
  const referencia = celulas.length ? raioTotal() : 14;
  let x, y;
  let tentativas = 0;
  do {
    x = aleatorio(MUNDO);
    y = aleatorio(MUNDO);
    tentativas++;
  } while (
    tentativas < 30 &&
    celulas.some((c) => Math.hypot(c.x - x, c.y - y) < 320)
  );
  return {
    id: "bot-" + i + "-" + Math.floor(Math.random() * 1e6),
    x,
    y,
    raio: Math.max(8, referencia * (0.4 + aleatorio(0.5))),
    cor: CORES_BOTS[i % CORES_BOTS.length],
    nome: "Bot " + (i + 1),
    prot: 90, // ~3s de proteção
  };
}

function redimensionar() {
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
}

window.addEventListener("resize", redimensionar);

function novoJogo() {
  redimensionar();
  celulas = [{ x: MUNDO / 2, y: MUNDO / 2, raio: 12, ix: 0, iy: 0, it: 0, prot: 60 }];
  bots = Array.from({ length: 6 }, (_, i) => novoBot(i));
  comidas = Array.from({ length: 90 }, () => novaComida());
  virus = Array.from({ length: 5 }, () => ({
    x: 120 + aleatorio(MUNDO - 240),
    y: 120 + aleatorio(MUNDO - 240),
    raio: 20,
  }));
  joystick = null;
  maiorDaPartida = 12;
  proximaFusao = 0;
  fimDeJogo = false;
  clearInterval(relogio);
  relogio = setInterval(passo, 33);
}

let avisoTemporizador = null;
function avisar(texto) {
  mensagemEl.textContent = texto;
  mensagemEl.classList.remove("escondida");
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => mensagemEl.classList.add("escondida"), 1800);
}

function velocidade(bolha) {
  return Math.max(1.2, 4.5 - bolha.raio / 22);
}

function moverPara(bolha, x, y) {
  const dx = x - bolha.x;
  const dy = y - bolha.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const v = velocidade(bolha);
  bolha.x = Math.max(0, Math.min(MUNDO, bolha.x + (dx / dist) * v));
  bolha.y = Math.max(0, Math.min(MUNDO, bolha.y + (dy / dist) * v));
}

function come(a, b) {
  if ((a.prot && a.prot > 0) || (b.prot && b.prot > 0)) return false;
  return a.raio > b.raio * 1.15 && Math.hypot(a.x - b.x, a.y - b.y) < a.raio;
}

function crescer(bolha, presa) {
  bolha.raio = Math.sqrt(bolha.raio * bolha.raio + presa.raio * presa.raio * 0.8);
}

let ultimaDirecao = { x: 1, y: 0 };

// ➗ dividir: cada bolha grande vira duas, com impulso pra frente
function dividir() {
  if (fimDeJogo) return;
  if (celulas.length >= 4) {
    avisar("Máximo de 4 pedaços!");
    return;
  }
  if (!celulas.some((c) => c.raio >= 24)) {
    avisar("➗ Cresça até 24 pra poder dividir");
    return;
  }
  const dir = ultimaDirecao;

  const novas = [];
  for (const celula of celulas) {
    if (celula.raio < 24 || celulas.length + novas.length >= 4) continue;
    const metade = celula.raio / Math.SQRT2;
    celula.raio = metade;
    novas.push({
      x: celula.x,
      y: celula.y,
      raio: metade,
      ix: dir.x * 10,
      iy: dir.y * 10,
      it: 14,
    });
  }
  if (novas.length) {
    celulas.push(...novas);
    proximaFusao = Date.now() + 9000;
    Som.acerto();
    vibrar(30);
  }
}

// 💨 ejetar massa: perde um pouco de tamanho, cospe comida (e fica mais rápido)
function ejetar() {
  if (fimDeJogo) return;
  const dir = ultimaDirecao;

  let cuspiu = false;
  for (const celula of celulas) {
    if (celula.raio < 10) continue;
    celula.raio = Math.sqrt(celula.raio * celula.raio - 20);
    comidas.push(novaComida(
      celula.x + dir.x * (celula.raio + 14),
      celula.y + dir.y * (celula.raio + 14),
      5
    ));
    cuspiu = true;
  }
  if (cuspiu) Som.clique();
  else avisar("💨 Muito pequeno pra ejetar");
}

function passo() {
  if (fimDeJogo || document.hidden) return;

  // proteção pós-nascimento vai acabando
  for (const entidade of [...celulas, ...bots]) {
    if (entidade.prot > 0) entidade.prot--;
  }

  // ---- rede: envia minha posição, expira quem sumiu, host transmite bots ----
  if (onlineAtivo) {
    tempoEnvio += 33;
    if (tempoEnvio >= 120) {
      tempoEnvio = 0;
      const c = centro();
      Online.enviar({
        t: "p",
        id: meuId,
        x: Math.round(c.x),
        y: Math.round(c.y),
        raio: Math.round(raioTotal()),
        cor: window.Cosmetico ? Cosmetico.dados("bolha") : "#4f8cff",
        nome: Nuvem.apelido(),
      });
    }
    const agora = Date.now();
    outros.forEach((v, k) => {
      if (agora - v.ts > 4000) outros.delete(k);
    });
    if (!souHost) bots = botsRemotos.map((b) => ({ ...b }));
    if (souHost) {
      tempoEnvioBots += 33;
      if (tempoEnvioBots >= 200) {
        tempoEnvioBots = 0;
        Online.enviar({
          t: "bots",
          lista: bots.map((b) => ({
            id: b.id, x: Math.round(b.x), y: Math.round(b.y),
            raio: Math.round(b.raio), cor: b.cor, nome: b.nome, prot: b.prot || 0,
          })),
        });
      }
    }
  }

  // movimento das suas bolhas (joystick + impulso do split)
  for (const celula of celulas) {
    if (celula.it > 0) {
      celula.it--;
      celula.x = Math.max(0, Math.min(MUNDO, celula.x + celula.ix));
      celula.y = Math.max(0, Math.min(MUNDO, celula.y + celula.iy));
    }
    if (joystick && (joystick.dx || joystick.dy)) {
      moverPara(celula, celula.x + joystick.dx * 200, celula.y + joystick.dy * 200);
    }
  }

  // fusão: depois do tempo, as bolhas se juntam de novo
  if (celulas.length > 1 && Date.now() > proximaFusao && proximaFusao > 0) {
    const c = centro();
    celulas = [{ x: c.x, y: c.y, raio: raioTotal(), ix: 0, iy: 0, it: 0 }];
    Som.clique();
  }

  // bots: perseguem presa menor mais próxima, fogem do maior próximo
  // (no online, só o host pensa pelos bots)
  if (!onlineAtivo || souHost)
  bots.forEach((bot) => {
    let perto = null;
    let distPerto = Infinity;
    let ameaca = null;
    // se você tá apanhando (3 mortes cedo seguidas), os bots caçam menos
    const alivio = parseInt(localStorage.getItem("bolhasDerrotas") || "0", 10) >= 3;
    let distAmeaca = 180;
    const alcanceCaca = alivio ? 190 : 250;

    const jogadoresReais = onlineAtivo ? [...outros.values()] : [];
    const todos = [...celulas, ...jogadoresReais, ...bots.filter((b) => b !== bot)];
    todos.forEach((outro) => {
      const d = Math.hypot(outro.x - bot.x, outro.y - bot.y);
      if (outro.raio * 1.15 < bot.raio && d < distPerto) {
        perto = outro;
        distPerto = d;
      }
      if (outro.raio > bot.raio * 1.15 && d < distAmeaca) {
        ameaca = outro;
        distAmeaca = d;
      }
    });

    if (ameaca) {
      moverPara(bot, bot.x * 2 - ameaca.x, bot.y * 2 - ameaca.y);
    } else if (perto && distPerto < alcanceCaca) {
      moverPara(bot, perto.x, perto.y);
    } else {
      let comidaPerto = null;
      let d = Infinity;
      comidas.forEach((c) => {
        const dc = Math.hypot(c.x - bot.x, c.y - bot.y);
        if (dc < d) {
          d = dc;
          comidaPerto = c;
        }
      });
      if (comidaPerto) moverPara(bot, comidaPerto.x, comidaPerto.y);
    }
  });

  // comer comidas
  const comedores = [...celulas, ...bots];
  comidas = comidas.filter((c) => {
    for (const b of comedores) {
      if (Math.hypot(b.x - c.x, b.y - c.y) < b.raio) {
        crescer(b, c);
        if (celulas.includes(b)) Som.clique();
        return false;
      }
    }
    return true;
  });
  while (comidas.length < 90) comidas.push(novaComida());

  // vírus: bolha grande que encosta estoura e espalha comida
  for (const v of virus) {
    for (const celula of [...celulas, ...bots]) {
      if (celula.raio > 26 && Math.hypot(celula.x - v.x, celula.y - v.y) < celula.raio) {
        const perdido = celula.raio * 0.35;
        celula.raio *= 0.65;
        for (let n = 0; n < 8; n++) {
          const angulo = (n / 8) * Math.PI * 2;
          comidas.push(novaComida(
            v.x + Math.cos(angulo) * (perdido + 20),
            v.y + Math.sin(angulo) * (perdido + 20),
            5
          ));
        }
        v.x = 120 + aleatorio(MUNDO - 240);
        v.y = 120 + aleatorio(MUNDO - 240);
        if (celulas.includes(celula)) {
          Som.erro();
          vibrar(60);
          mensagemEl.textContent = "💥 Vírus! Você estourou e perdeu massa";
          mensagemEl.classList.remove("escondida");
          setTimeout(() => mensagemEl.classList.add("escondida"), 2000);
        }
      }
    }
  }

  // você come bots / bots comem você
  for (const bot of [...bots]) {
    let botComido = false;
    for (const celula of celulas) {
      if (come(celula, bot)) {
        crescer(celula, bot);
        Som.acerto();
        vibrar(30);
        if (onlineAtivo && !souHost) {
          Online.enviar({ t: "comiBot", id: bot.id });
          bots.splice(bots.indexOf(bot), 1);
        } else {
          bots[bots.indexOf(bot)] = novoBot(bots.indexOf(bot));
        }
        botComido = true;
        break;
      }
    }
    if (botComido) continue;

    for (const celula of [...celulas]) {
      if (come(bot, celula)) {
        crescer(bot, celula);
        celulas.splice(celulas.indexOf(celula), 1);
        Som.erro();
        vibrar(80);
        if (celulas.length === 0) {
          if (onlineAtivo) {
            fuiComido(bot.nome);
            return;
          }
          perder();
          return;
        }
      }
    }
  }

  // jogador real vs jogador real: quem é maior come
  if (onlineAtivo) {
    for (const [idOutro, outro] of [...outros]) {
      for (const celula of celulas) {
        if (come(celula, outro)) {
          crescer(celula, outro);
          Som.acerto();
          vibrar(40);
          avisoOnline(`Você comeu ${outro.nome}! 😋`);
          Online.enviar({ t: "comi", alvo: idOutro, por: Nuvem.apelido() });
          outros.delete(idOutro);
          break;
        }
      }
    }
  }

  // bots se comem entre si
  for (const a of bots) {
    for (const b of bots) {
      if (a !== b && come(a, b)) {
        crescer(a, b);
        bots[bots.indexOf(b)] = novoBot(bots.indexOf(b));
      }
    }
  }

  const total = Math.floor(raioTotal());
  maiorDaPartida = Math.max(maiorDaPartida, total);
  tamanhoEl.textContent = String(total);
  if (total > (Recordes.get("bolhas") || 0)) {
    Recordes.salvar("bolhas", total);
  }

  desenhar();
}

function desenhar() {
  ctx.fillStyle = "#0d1420";
  ctx.fillRect(0, 0, tela.width, tela.height);

  const c = centro();
  const cx = tela.width / 2 - c.x;
  const cy = tela.height / 2 - c.y;

  ctx.strokeStyle = "#2a3a4a";
  ctx.lineWidth = 4;
  ctx.strokeRect(cx, cy, MUNDO, MUNDO);

  comidas.forEach((comida) => {
    ctx.fillStyle = "#8fb8c8";
    ctx.beginPath();
    ctx.arc(comida.x + cx, comida.y + cy, comida.raio, 0, Math.PI * 2);
    ctx.fill();
  });

  // vírus espinhosos
  virus.forEach((v) => {
    ctx.strokeStyle = "#4faf4f";
    ctx.fillStyle = "#1f4f1f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x + cx, v.y + cy, v.raio, 0, Math.PI * 2);
    ctx.fill();
    for (let n = 0; n < 12; n++) {
      const angulo = (n / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(v.x + cx + Math.cos(angulo) * v.raio, v.y + cy + Math.sin(angulo) * v.raio);
      ctx.lineTo(v.x + cx + Math.cos(angulo) * (v.raio + 6), v.y + cy + Math.sin(angulo) * (v.raio + 6));
      ctx.stroke();
    }
  });

  bots.forEach((b) => {
    ctx.globalAlpha = b.prot > 0 ? 0.45 : 1;
    ctx.fillStyle = b.cor;
    ctx.beginPath();
    ctx.arc(b.x + cx, b.y + cy, b.raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(10, Math.floor(b.raio * 0.6))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(Math.floor(b.raio)), b.x + cx, b.y + cy + 4);
  });

  // jogadores reais do aquário (nome em cima)
  if (onlineAtivo) {
    outros.forEach((j) => {
      const jx = j.dx !== undefined ? j.dx : j.x;
      const jy = j.dy !== undefined ? j.dy : j.y;
      ctx.fillStyle = j.cor || "#ff9f4f";
      ctx.beginPath();
      ctx.arc(jx + cx, jy + cy, j.raio, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffd54f";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(j.nome || "?", jx + cx, jy + cy - j.raio - 6);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, Math.floor(j.raio * 0.6))}px sans-serif`;
      ctx.fillText(String(Math.floor(j.raio)), jx + cx, jy + cy + 4);
    });
  }

  const corBolha = window.Cosmetico ? Cosmetico.dados("bolha") : "#4f8cff";
  celulas.forEach((celula) => {
    ctx.fillStyle = corBolha;
    ctx.beginPath();
    ctx.arc(celula.x + cx, celula.y + cy, celula.raio, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(11, Math.floor(celula.raio * 0.6))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(Math.floor(celula.raio)), celula.x + cx, celula.y + cy + 4);
  });

  // faixa indicando modo online (fica bem claro que você está conectado)
  if (onlineAtivo) {
    ctx.strokeStyle = "#3fdf6f";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, tela.width - 4, tela.height - 4);
    ctx.fillStyle = "#3fdf6f";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("● AQUÁRIO ONLINE", tela.width / 2, 22);
  }

  // placar ao vivo: jogadores reais em destaque, bots apagados
  const ranking = [
    { nome: Nuvem && onlineAtivo ? Nuvem.apelido() : "Você", raio: raioTotal(), sou: true, real: true },
    ...(onlineAtivo ? [...outros.values()].map((j) => ({ nome: j.nome, raio: j.raio, real: true })) : []),
    ...bots.map((b) => ({ nome: b.nome, raio: b.raio, real: false })),
  ].sort((a, b) => b.raio - a.raio).slice(0, 8);

  ctx.textAlign = "right";
  ctx.font = "bold 13px sans-serif";
  const topoRank = onlineAtivo ? 40 : 64;
  ranking.forEach((r, i) => {
    if (r.sou) ctx.fillStyle = "#ffd54f";
    else if (r.real) ctx.fillStyle = "#ff9f4f"; // jogador real: laranja
    else ctx.fillStyle = "rgba(255,255,255,0.4)"; // bot: apagado
    const coroa = i === 0 ? "♛ " : `${i + 1}º `;
    ctx.fillText(`${coroa}${r.nome} — ${Math.floor(r.raio)}`, tela.width - 10, topoRank + i * 18);
  });

  // minimapa: canto superior esquerdo, abaixo do HUD (longe do joystick)
  {
    const M = 70;
    const mx = 10;
    const my = 52;
    const esc = M / MUNDO;
    ctx.fillStyle = "rgba(10, 16, 26, 0.7)";
    ctx.fillRect(mx, my, M, M);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, M, M);
    virus.forEach((v) => {
      ctx.fillStyle = "#4faf4f";
      ctx.fillRect(mx + v.x * esc - 1.5, my + v.y * esc - 1.5, 3, 3);
    });
    bots.forEach((b) => {
      ctx.fillStyle = b.cor;
      ctx.fillRect(mx + b.x * esc - 2, my + b.y * esc - 2, 4, 4);
    });
    if (onlineAtivo) {
      outros.forEach((j) => {
        ctx.fillStyle = "#ff9f4f";
        ctx.fillRect(mx + j.x * esc - 2, my + j.y * esc - 2, 4, 4);
      });
    }
    celulas.forEach((celula) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mx + celula.x * esc - 2.5, my + celula.y * esc - 2.5, 5, 5);
    });
  }

  if (joystick) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(joystick.bx, joystick.by, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(joystick.kx, joystick.ky, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function perder(bot) {
  fimDeJogo = true;
  clearInterval(relogio);
  const derrotas = parseInt(localStorage.getItem("bolhasDerrotas") || "0", 10);
  localStorage.setItem("bolhasDerrotas", String(maiorDaPartida < 25 ? derrotas + 1 : 0));
  const ganhos = Math.max(Math.floor(maiorDaPartida / 2), 3);
  Pontos.add(ganhos);
  Som.erro();
  vibrar(120);
  setTimeout(() => Modal.mostrar({
    emoji: "😋",
    titulo: "Você foi engolido!",
    texto: `Maior tamanho desta partida: ${maiorDaPartida} • +${ganhos} pontos`,
    aoJogarDeNovo: novoJogo, aoMenu: abrirLobby,
  }), 300);
}

// joystick virtual: encosta o dedo em qualquer lugar e arrasta pra direção
function posicaoNaTela(evento) {
  const retangulo = tela.getBoundingClientRect();
  const escala = tela.width / retangulo.width;
  const toque = evento.touches?.[0] || evento.changedTouches?.[0] || evento;
  return {
    x: (toque.clientX - retangulo.left) * escala,
    y: (toque.clientY - retangulo.top) * escala,
  };
}

function abrirJoystick(evento) {
  evento.preventDefault();
  const p = posicaoNaTela(evento);
  joystick = { bx: p.x, by: p.y, kx: p.x, ky: p.y, dx: 0, dy: 0 };
}

function moverJoystick(evento) {
  if (!joystick) return;
  evento.preventDefault();
  const p = posicaoNaTela(evento);
  let dx = p.x - joystick.bx;
  let dy = p.y - joystick.by;
  const dist = Math.hypot(dx, dy);
  const RAIO_JOY = 46;
  if (dist > RAIO_JOY) {
    dx = (dx / dist) * RAIO_JOY;
    dy = (dy / dist) * RAIO_JOY;
  }
  joystick.kx = joystick.bx + dx;
  joystick.ky = joystick.by + dy;
  joystick.dx = dist > 8 ? dx / RAIO_JOY : 0;
  joystick.dy = dist > 8 ? dy / RAIO_JOY : 0;
  if (joystick.dx || joystick.dy) {
    ultimaDirecao = { x: joystick.dx, y: joystick.dy };
  }
}

function fecharJoystick(evento) {
  evento.preventDefault();
  joystick = null;
}

tela.addEventListener("touchstart", abrirJoystick, { passive: false });
tela.addEventListener("touchmove", moverJoystick, { passive: false });
tela.addEventListener("touchend", fecharJoystick, { passive: false });
tela.addEventListener("mousedown", abrirJoystick);
tela.addEventListener("mousemove", (e) => { if (e.buttons) moverJoystick(e); });
tela.addEventListener("mouseup", fecharJoystick);

function ligarBotao(id, acao) {
  const botao = document.getElementById(id);
  botao.addEventListener("click", acao);
  botao.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    acao();
  }, { passive: false });
}
ligarBotao("btn-dividir", dividir);
ligarBotao("btn-ejetar", ejetar);

function abrirLobby() {
  rodando = false;
  onlineAtivo = false;
  souHost = false;
  outros.clear();
  botsRemotos = [];
  if (window.Online) Online.fechar();
  Lobby.mostrar({
    titulo: "Bolhas",
    skinCat: "bolha",
    temOnline: true,
    previewHTML: () => {
      const d = window.Cosmetico ? Cosmetico.dados("bolha") : "#4f8cff";
      return `<svg viewBox="0 0 90 70"><circle cx="45" cy="35" r="28" fill="${d}" stroke="#fff" stroke-width="3"/><circle cx="34" cy="24" r="8" fill="rgba(255,255,255,0.45)"/></svg>`;
    },
    aoJogar: ({ modo }) => {
      if (modo === "online") entrarAquario();
      else { onlineAtivo = false; novoJogo(); }
    },
  });
}

document.getElementById("btn-lobby").addEventListener("click", abrirLobby);

botaoReiniciar.addEventListener("click", () => {
  if (onlineAtivo) {
    avisoOnline("No aquário online não tem reiniciar — sobreviva! 🌊");
    return;
  }
  novoJogo();
});
novoJogo();

configurarMelhor("bolhas");
