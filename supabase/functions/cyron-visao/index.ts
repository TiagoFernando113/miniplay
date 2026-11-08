/* Visão da CYRON — backend.
 *
 * Um painel pessoal do dono para ver os servidores do bot, ler e escrever
 * como ele. O bot é usado aqui só como teste; este projeto é separado do bot
 * e do site da CYRON.
 *
 * A regra de ouro: o TOKEN do bot nunca vai para o navegador. Ele fica aqui,
 * nos segredos desta função. A página entra com o LOGIN do dono no Discord
 * (OAuth, escopo `identify` — só "quem é você"), esta função confere que a
 * conta é dona do aplicativo e devolve um "crachá" curto e assinado. A página
 * guarda o crachá (não o token) e manda ele a cada pedido; quem fala com o
 * Discord usando o token é sempre esta função, nunca o aparelho.
 *
 * Segredos (painel do Supabase → Edge Functions → Secrets):
 *   DISCORD_BOT_TOKEN    (novo) o token do bot. É o que não pode vazar.
 *   DISCORD_CLIENT_SECRET      o segredo do OAuth (já existe no projeto).
 *   VISAO_ASSINATURA     (novo) chave aleatória para assinar o crachá.
 *   VISAO_DONOS   (opcional) ids extras de dono, separados por vírgula.
 */

const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") ?? "";
const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")
  || Deno.env.get("DISCORD_APP_ID") || "1498142929041096856";
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET") ?? "";
const ASSINATURA = Deno.env.get("VISAO_ASSINATURA") ?? "";
const DONOS_EXTRA = (Deno.env.get("VISAO_DONOS") ?? "").split(/[,\s]+/).filter((x) => /^\d{5,}$/.test(x));

const API = "https://discord.com/api/v10";
const CRACHA_VALE = 2 * 60 * 60 * 1000; // o crachá dura 2 horas
const MAX_TEXTO = 2000;

/* Só o miniplay pode chamar. O crachá é a tranca de verdade; isto é a
   segunda. Inclui o endereço do GitHub Pages do miniplay e o local, para
   testar. */
const ORIGENS = new Set([
  "https://tiagofernando113.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function cabecalhos(origem: string | null) {
  const liberada = origem && ORIGENS.has(origem) ? origem : "";
  return {
    "Access-Control-Allow-Origin": liberada,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
}

/* ---------------- o crachá (assinado, sem o token) ---------------- */

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function chaveHMAC() {
  return await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(ASSINATURA),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function criarCracha(uid: string): Promise<string> {
  const corpo = b64url(new TextEncoder().encode(JSON.stringify({ uid, exp: Date.now() + CRACHA_VALE })));
  const assina = await crypto.subtle.sign("HMAC", await chaveHMAC(), new TextEncoder().encode(corpo));
  return `${corpo}.${b64url(new Uint8Array(assina))}`;
}

async function donoDoCracha(cracha: string): Promise<string | null> {
  const [corpo, assina] = String(cracha || "").split(".");
  if (!corpo || !assina) return null;
  let ok = false;
  try { ok = await crypto.subtle.verify("HMAC", await chaveHMAC(), deB64url(assina), new TextEncoder().encode(corpo)); }
  catch { return null; }
  if (!ok) return null;
  try {
    const { uid, exp } = JSON.parse(new TextDecoder().decode(deB64url(corpo)));
    return uid && exp > Date.now() ? String(uid) : null;
  } catch { return null; }
}

/* ---------------- quem é dono do aplicativo ---------------- */

let cacheDonos: { ids: Set<string>; t: number } | null = null;

async function idsDeDono(): Promise<Set<string>> {
  if (cacheDonos && Date.now() - cacheDonos.t < 10 * 60 * 1000) return cacheDonos.ids;
  const ids = new Set<string>(DONOS_EXTRA);
  try {
    const r = await fetch(`${API}/applications/@me`, { headers: { Authorization: `Bot ${BOT_TOKEN}` } });
    if (r.ok) {
      const app = await r.json();
      if (app?.owner?.id) ids.add(String(app.owner.id));
      for (const m of app?.team?.members || []) if (m?.user?.id) ids.add(String(m.user.id));
    }
  } catch { /* fica com os extras, se houver */ }
  if (ids.size) cacheDonos = { ids, t: Date.now() };
  return ids;
}

/* ---------------- falar com o Discord COMO O BOT ---------------- */

async function comoBot(caminho: string, opc: RequestInit = {}) {
  return await fetch(`${API}${caminho}`, {
    ...opc,
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json", ...(opc.headers || {}) },
  });
}

const ehId = (s: unknown) => /^\d{15,25}$/.test(String(s || ""));
const TIPOS_DE_TEXTO: Record<number, string> = { 0: "texto", 5: "avisos" };

function mensagemParaVisao(m: any) {
  return {
    id: m.id,
    quando: Date.parse(m.timestamp || "") || 0,
    editada: m.edited_timestamp ? Date.parse(m.edited_timestamp) : null,
    autor: {
      id: m.author?.id || "",
      nome: m.webhook_id ? (m.author?.username || "?") : (m.member?.nick || m.author?.global_name || m.author?.username || "?"),
      avatar: m.author?.avatar
        ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${(Number(m.author?.discriminator) || 0) % 5}.png`,
      bot: !!m.author?.bot,
      webhook: !!m.webhook_id,
    },
    texto: m.content || "",
    responde: m.referenced_message?.id || m.message_reference?.message_id || null,
    anexos: (m.attachments || []).map((a: any) => ({
      url: a.url, nome: a.filename || "arquivo", tipo: a.content_type || "",
      largura: a.width || null, altura: a.height || null,
    })),
    figurinhas: (m.sticker_items || []).map((s: any) => ({
      nome: s.name || "", url: `https://media.discordapp.net/stickers/${s.id}.png`,
    })),
    cartoes: (m.embeds || []).map((e: any) => ({
      cor: Number.isInteger(e.color) ? `#${e.color.toString(16).padStart(6, "0")}` : null,
      autor: e.author?.name || "", titulo: e.title || "", url: e.url || "",
      texto: e.description || "",
      campos: (e.fields || []).map((f: any) => ({ nome: f.name || "", valor: f.value || "" })),
      imagem: e.image?.url || "", miniatura: e.thumbnail?.url || "", rodape: e.footer?.text || "",
    })),
    nomes: {
      u: Object.fromEntries((m.mentions || []).map((u: any) => [u.id, u.global_name || u.username || "usuário"])),
      c: {}, r: {},
    },
  };
}

function canaisParaVisao(canais: any[]) {
  const categorias = new Map(canais.filter((c) => c.type === 4).map((c) => [c.id, c]));
  return canais
    .filter((c) => TIPOS_DE_TEXTO[c.type] !== undefined)
    .map((c) => {
      const cat = c.parent_id ? categorias.get(c.parent_id) : null;
      return {
        id: c.id, nome: c.name || "", tipo: TIPOS_DE_TEXTO[c.type], topico: c.topic || "",
        categoria: cat ? cat.name : "",
        posCategoria: cat ? (cat.position ?? 0) : -1, pos: c.position ?? 0,
      };
    })
    .sort((a, b) => a.posCategoria - b.posCategoria || a.pos - b.pos || a.nome.localeCompare(b.nome));
}

/* ---------------- o atendimento ---------------- */

const resp = (corpo: unknown, status: number, cab: Record<string, string>) =>
  /* 204 não pode ter corpo (nem "") no Deno, ou estoura. null vira corpo vazio. */
  new Response(corpo === null ? null : JSON.stringify(corpo), { status, headers: cab });

Deno.serve(async (req) => {
  const cab = cabecalhos(req.headers.get("origin"));
  if (req.method === "OPTIONS") return resp(null, 204, cab);
  if (req.method !== "POST") return resp({ erro: "só POST" }, 405, cab);
  if (!cab["Access-Control-Allow-Origin"]) return resp({ erro: "origem não liberada" }, 403, cab);
  if (!BOT_TOKEN || !ASSINATURA) {
    console.error("visao: falta DISCORD_BOT_TOKEN ou VISAO_ASSINATURA nos segredos");
    return resp({ erro: "a Visão ainda não está configurada" }, 500, cab);
  }

  let corpo: any = {};
  try { corpo = await req.json(); } catch { /* cai na validação */ }
  const acao = String(corpo?.acao || "");

  /* entrar: troca o code do OAuth pelo crachá. O token do Discord da pessoa é
     usado aqui por um instante, só para saber quem ela é, e devolvido. */
  if (acao === "entrar") {
    if (!CLIENT_SECRET) return resp({ erro: "login não configurado" }, 500, cab);
    const code = String(corpo?.code || ""), redirect_uri = String(corpo?.redirect_uri || "");
    let destino = "";
    try { destino = new URL(redirect_uri).origin; } catch { /* vazio */ }
    if (!code || !ORIGENS.has(destino)) return resp({ erro: "login inválido" }, 400, cab);

    let token = "";
    try {
      const r = await fetch(`${API}/oauth2/token`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "authorization_code", code, redirect_uri }),
      });
      if (!r.ok) return resp({ erro: "login expirou, tente de novo" }, 401, cab);
      token = (await r.json())?.access_token ?? "";
    } catch { return resp({ erro: "o Discord não respondeu" }, 502, cab); }
    if (!token) return resp({ erro: "login expirou, tente de novo" }, 401, cab);

    try {
      const r = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${token}` } });
      const user = r.ok ? await r.json() : null;
      const dono = user?.id && (await idsDeDono()).has(String(user.id));
      if (!dono) return resp({ erro: "esta conta não é dona do bot" }, 403, cab);
      return resp({
        cracha: await criarCracha(String(user.id)),
        usuario: { nome: user.global_name || user.username || "", id: user.id },
      }, 200, cab);
    } catch {
      return resp({ erro: "não consegui confirmar seu login" }, 500, cab);
    } finally {
      /* devolve o token da pessoa; ele não era nosso e não precisamos mais dele */
      fetch(`${API}/oauth2/token/revoke`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, token, token_type_hint: "access_token" }),
      }).catch(() => {});
    }
  }

  /* Daqui para baixo, tudo exige o crachá. */
  const dono = await donoDoCracha(corpo?.cracha);
  if (!dono) return resp({ erro: "entre com o Discord" }, 401, cab);

  if (acao === "eu") {
    const r = await comoBot("/users/@me");
    const bot = r.ok ? await r.json() : {};
    return resp({ voce: dono, bot: {
      id: bot.id || "", nome: bot.username ? `${bot.username}` : "CYRON",
      avatar: bot.avatar ? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=128` : "",
    } }, 200, cab);
  }

  if (acao === "servidores") {
    const r = await comoBot("/users/@me/guilds");
    if (!r.ok) return resp({ erro: "não consegui listar os servidores" }, 502, cab);
    const guilds: any[] = await r.json();
    const servidores = guilds.map((g) => ({
      id: g.id, nome: g.name || "",
      icone: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64` : "",
      membros: g.approximate_member_count || 0,
    })).sort((a, b) => a.nome.localeCompare(b.nome));
    return resp({ servidores }, 200, cab);
  }

  if (acao === "canais") {
    if (!ehId(corpo?.g)) return resp({ erro: "servidor inválido" }, 400, cab);
    const [rg, rc] = await Promise.all([comoBot(`/guilds/${corpo.g}`), comoBot(`/guilds/${corpo.g}/channels`)]);
    if (!rc.ok) return resp({ erro: "a CYRON não está nesse servidor" }, 404, cab);
    const guild = rg.ok ? await rg.json() : {};
    return resp({
      servidor: { id: corpo.g, nome: guild.name || "", icone: guild.icon ? `https://cdn.discordapp.com/icons/${corpo.g}/${guild.icon}.png?size=64` : "" },
      canais: canaisParaVisao(await rc.json()),
    }, 200, cab);
  }

  if (acao === "mensagens") {
    if (!ehId(corpo?.c)) return resp({ erro: "canal inválido" }, 400, cab);
    const q = new URLSearchParams({ limit: "50" });
    if (ehId(corpo?.antes)) q.set("before", String(corpo.antes));
    else if (ehId(corpo?.depois)) q.set("after", String(corpo.depois));
    const r = await comoBot(`/channels/${corpo.c}/messages?${q}`);
    if (!r.ok) return resp({ erro: "a CYRON não consegue ler esse canal" }, 403, cab);
    const lidas: any[] = await r.json();
    const mensagens = lidas.map(mensagemParaVisao).sort((a, b) => a.quando - b.quando);
    return resp({ mensagens }, 200, cab);
  }

  if (acao === "enviar") {
    if (!ehId(corpo?.c)) return resp({ erro: "canal inválido" }, 400, cab);
    const texto = String(corpo?.texto ?? "").trim();
    if (!texto) return resp({ erro: "mensagem vazia" }, 400, cab);
    if (texto.length > MAX_TEXTO) return resp({ erro: `mensagem passa de ${MAX_TEXTO} caracteres` }, 400, cab);
    /* menção a pessoa toca sino; @everyone e cargo não (um toque errado no
       celular não pode chamar um servidor inteiro). */
    const r = await comoBot(`/channels/${corpo.c}/messages`, {
      method: "POST", body: JSON.stringify({ content: texto, allowed_mentions: { parse: ["users"] } }),
    });
    if (!r.ok) return resp({ erro: "não consegui falar nesse canal (permissão?)" }, 403, cab);
    console.log(`visao: o dono ${dono} falou como a CYRON no canal ${corpo.c}`);
    return resp({ mensagem: mensagemParaVisao(await r.json()) }, 200, cab);
  }

  return resp({ erro: "ação desconhecida" }, 400, cab);
});
