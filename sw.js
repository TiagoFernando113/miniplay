const CACHE = "minigames-v92";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./loja.html",
  "./conquistas.html",
  "./ajustes.html",
  "./perfil.html",
  "./ranking.html",
  "./jogos.html",
  "./manifest.json",
  "./css/estilo.css",
  "./js/pontos.js",
  "./js/modal.js",
  "./js/app.js",
  "./js/som.js",
  "./js/recordes.js",
  "./js/tema.js",
  "./js/conquistas.js",
  "./js/missoes.js",
  "./js/palavras.js",
  "./js/nuvem.js",
  "./js/online.js",
  "./js/lobby.js",
  "./vendor/supabase.js",
  "./js/util.js",
  "./js/icones.js",
  "./js/musica.js",
  "./icons/icone-192.png",
  "./icons/icone-512.png",
  "./games/memoria/index.html",
  "./games/memoria/estilo.css",
  "./games/memoria/jogo.js",
  "./games/velha/index.html",
  "./games/velha/jogo.js",
  "./games/2048/index.html",
  "./games/2048/jogo.js",
  "./games/cobrinha/index.html",
  "./games/cobrinha/jogo.js",
  "./games/genius/index.html",
  "./games/genius/jogo.js",
  "./games/alvo/index.html",
  "./games/alvo/jogo.js",
  "./games/ppt/index.html",
  "./games/ppt/jogo.js",
  "./games/forca/index.html",
  "./games/forca/jogo.js",
  "./games/campo/index.html",
  "./games/campo/jogo.js",
  "./games/puzzle15/index.html",
  "./games/puzzle15/jogo.js",
  "./games/cacapalavras/index.html",
  "./games/cacapalavras/jogo.js",
  "./games/naval/index.html",
  "./games/naval/jogo.js",
  "./games/quiz/index.html",
  "./games/quiz/jogo.js",
  "./games/blocos/index.html",
  "./games/blocos/jogo.js",
  "./games/doces/index.html",
  "./games/doces/jogo.js",
  "./games/conquista/index.html",
  "./games/conquista/jogo.js",
  "./games/bolhas/index.html",
  "./games/bolhas/jogo.js",
  "./games/territorio/index.html",
  "./games/territorio/jogo.js",
  "./games/passaro/index.html",
  "./games/passaro/jogo.js",
  "./games/torre/index.html",
  "./games/torre/jogo.js",
  "./games/hexagono/index.html",
  "./games/hexagono/jogo.js",
  "./games/cobrabatalha/index.html",
  "./games/tanques/index.html",
  "./games/tanques/jogo.js",
  "./games/reacao/index.html",
  "./games/reacao/jogo.js",
  "./games/coletar/index.html",
  "./games/coletar/jogo.js",
  "./games/corredor/index.html",
  "./games/corredor/jogo.js",
  "./games/quebrablocos/index.html",
  "./games/quebrablocos/jogo.js",
  "./games/pingue/index.html",
  "./games/pingue/jogo.js",
  "./games/cobrabatalha/jogo.js",
];

self.addEventListener("push", (evento) => {
  let d = {};
  try { d = evento.data.json(); } catch (e) {}
  evento.waitUntil(self.registration.showNotification(d.title || "MiniPlay", {
    body: d.body || "",
    icon: "./icons/icone-192.png",
    badge: "./icons/icone-192.png",
    data: { url: d.url || "./" },
  }));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = (evento.notification.data && evento.notification.data.url) || "./";
  evento.waitUntil(clients.openWindow(url));
});

self.addEventListener("message", (evento) => {
  if (evento.data && evento.data.tipo === "ATUALIZAR") self.skipWaiting();
});

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

// rede primeiro (atualizações valem na hora); cache só quando estiver offline
self.addEventListener("fetch", (evento) => {
  // só arquivos do próprio app: chamadas à nuvem (Supabase) passam direto
  if (evento.request.method !== "GET") return;
  if (!evento.request.url.startsWith(self.location.origin)) return;
  evento.respondWith(
    fetch(evento.request, { cache: "no-cache" })
      .then((respostaRede) => {
        const copia = respostaRede.clone();
        caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
        return respostaRede;
      })
      .catch(() => caches.match(evento.request))
  );
});
