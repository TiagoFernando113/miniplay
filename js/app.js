const APP_VERSAO = "v87";

// mata o menu de toque longo (copiar link...) — MENOS em campos de texto,
// senão o jogador não consegue copiar/colar o código de backup!
window.addEventListener("contextmenu", (e) => {
  const alvo = e.target;
  if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA")) return;
  e.preventDefault();
});
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("versao-app");
  if (el) el.textContent = APP_VERSAO;
});

// auto-save na nuvem: se o jogador ativou um código, salva sozinho
function autoSalvarNuvem() {
  const cod = localStorage.getItem("codigoNuvem");
  if (cod && window.Nuvem) Nuvem.salvarNuvem(cod);
}
document.addEventListener("visibilitychange", () => { if (document.hidden) autoSalvarNuvem(); });
setInterval(autoSalvarNuvem, 180000);

if ("serviceWorker" in navigator) {
  const base = location.pathname.includes("/games/") ? "../../" : "./";
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recarregando) return;
    recarregando = true;
    location.reload(); // versão nova assumiu -> recarrega com os arquivos novos
  });
  navigator.serviceWorker.register(base + "sw.js", { scope: base }).then((registro) => {
    registro.update();
    // checa atualização de tempos em tempos e ao voltar pro app
    setInterval(() => registro.update(), 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) registro.update(); });
    registro.addEventListener("updatefound", () => {
      const novo = registro.installing;
      if (!novo) return;
      novo.addEventListener("statechange", () => {
        if (novo.state === "installed" && navigator.serviceWorker.controller) {
          novo.postMessage({ tipo: "ATUALIZAR" }); // ativa a versão nova
        }
      });
    });
  }).catch(() => {});
}

// menu, loja e conquistas: sai da tela cheia do jogo e destrava a rotação
if (!location.pathname.includes("/games/")) {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  if (screen.orientation) {
    const instalado = matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
    if (instalado && screen.orientation.lock) {
      // menu sempre em pé no app instalado
      screen.orientation.lock("portrait").catch(() => {});
    } else if (screen.orientation.unlock) {
      try {
        screen.orientation.unlock();
      } catch (e) {
        /* sem suporte — ignora */
      }
    }
  }
}

// Jogos: sempre em tela cheia. Se sair (voltar do Android, girar etc.),
// o próximo toque recoloca. Jogos de ação entram deitados, a menos que a
// chave "girar" esteja desligada nos Ajustes (pra jogar deitado na cama).
{
  const ehJogo = location.pathname.includes("/games/");
  const instalado = matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches;
  const querPaisagem =
    document.body.hasAttribute("data-paisagem") &&
    (typeof Config === "undefined" || Config.get().girar !== false);

  if (ehJogo && instalado && querPaisagem && screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }

  if (ehJogo && !instalado) {
    document.addEventListener("touchend", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          if (querPaisagem && screen.orientation && screen.orientation.lock) {
            screen.orientation.lock("landscape").catch(() => {});
          }
        }
      } catch (e) {
        /* navegador não deixou — segue normal */
      }
    });
  }
}

// tutorial de primeira vez: uma frase antes da primeira partida de cada jogo
const TUTORIAIS = {
  doces: "Troque doces vizinhos pra combinar 3+. Junte 4 = doce LISTRADO (limpa linha e coluna). Junte 5 = BOMBA 🌈 (troque com qualquer doce pra limpar a cor toda)!",
  hexagono: "Blocos caem de 6 direções! Toque na METADE ESQUERDA ou DIREITA da tela pra girar o hexágono e juntar 3+ da mesma cor.",
  conquista: "Arraste o dedo da SUA base (azul) até outra base pra enviar metade das tropas. Domine o mapa inteiro!",
  territorio: "Saia da sua área deixando um rastro e volte pra ela pra CAPTURAR o miolo. Se alguém cruzar seu rastro, você morre — corte o rastro dos bots pra matá-los!",
  bolhas: "Arraste o dedo = joystick. Coma quem é menor, fuja de quem é maior. ➗ divide pra dar o bote, 💨 ejeta massa pra correr!",
  campo: "Toque pra cavar. Ative 🚩 pra marcar minas. Dica pro: toque num número já aberto com as bandeiras certas pra abrir os vizinhos de uma vez!",
  naval: "Toque no mar inimigo pra atirar. Acertou? Atira de novo! Afunde os 4 navios antes do bot.",
  blocos: "⬅️➡️ move, 🔄 gira, ⏬ derruba, 📥 guarda a peça pra depois. Complete linhas pra pontuar!",
  torre: "O bloco balança no guindaste — toque pra soltar EM CIMA do anterior. O que passar da beirada é cortado!",
  passaro: "Toque pra bater as asas e passe entre os canos. Cuidado: fica mais rápido!",
};

{
  const jogoAtual = (location.pathname.match(/games\/([^/]+)/) || [])[1];
  const textoTutorial = jogoAtual && TUTORIAIS[jogoAtual];
  if (textoTutorial && !localStorage.getItem("tut-" + jogoAtual)) {
    document.addEventListener("DOMContentLoaded", () => {
      const fundo = document.createElement("div");
      fundo.className = "modal-fundo visivel";
      fundo.style.zIndex = "300";
      fundo.innerHTML = `
        <div class="modal-caixa">
          <div class="modal-emoji">💡</div>
          <h2>Como jogar</h2>
          <p style="color:var(--text);font-weight:400;">${textoTutorial}</p>
          <button class="btn" id="fechar-tutorial">Entendi, bora!</button>
        </div>`;
      document.body.appendChild(fundo);
      document.getElementById("fechar-tutorial").addEventListener("click", () => {
        localStorage.setItem("tut-" + jogoAtual, "1");
        fundo.remove();
      });
    });
  }
}

// a dica flutuante some no primeiro toque (ou sozinha depois de 5s)
document.addEventListener("DOMContentLoaded", () => {
  const dica = document.querySelector(".hud-msg");
  const superficie = document.querySelector(".pagina-cheia canvas");
  if (dica && superficie) {
    const esconder = () => dica.classList.add("escondida");
    superficie.addEventListener("touchstart", esconder, { once: true });
    superficie.addEventListener("mousedown", esconder, { once: true });
    setTimeout(esconder, 5000);
  }
});

// nas páginas de jogo, se o conteúdo cabe na tela, trava a rolagem
// (mata o sobe-e-desce ao deslizar o dedo durante a partida)
if (location.pathname.includes("/games/")) {
  document.addEventListener(
    "touchmove",
    (e) => {
      // deixa rolar dentro de telas sobrepostas (lobby, modal)
      if (e.target.closest && e.target.closest(".lobby-fundo, .modal-fundo, textarea")) return;
      if (document.documentElement.scrollHeight <= window.innerHeight + 2) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

// botão de tela cheia nas páginas de jogo
if (location.pathname.includes("/games/") && document.documentElement.requestFullscreen) {
  const botaoTelaCheia = document.createElement("button");
  botaoTelaCheia.textContent = "⛶";
  botaoTelaCheia.className = "btn-tela-cheia";
  botaoTelaCheia.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      /* navegador não deixou — segue normal */
    }
  });
  document.body.appendChild(botaoTelaCheia);
}
