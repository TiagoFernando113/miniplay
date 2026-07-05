const Modal = {
  mostrar({ emoji = "🎉", titulo, texto, botao = "Jogar de novo", aoJogarDeNovo, linkExtra }) {
    this.fechar();

    // toda tela de fim de jogo conta exatamente 1 partida nas missões e estatísticas
    if (window.Missoes) Missoes.partida();
    if (window.Stats) Stats.partida();

    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";
    fundo.id = "modal-jogo";

    fundo.innerHTML = `
      <div class="modal-caixa">
        <div class="modal-emoji">${emoji}</div>
        <h2>${titulo}</h2>
        <p>${texto}</p>
        <button class="btn" id="modal-btn-denovo">${botao}</button>
        ${linkExtra ? `<a class="modal-menu" style="color:var(--accent);" target="_blank" href="${linkExtra.href}">${linkExtra.texto}</a>` : ""}
        <a class="modal-menu" href="../../index.html">Voltar ao menu</a>
      </div>
    `;

    document.body.appendChild(fundo);
    requestAnimationFrame(() => fundo.classList.add("visivel"));

    document.getElementById("modal-btn-denovo").addEventListener("click", () => {
      this.fechar();
      if (aoJogarDeNovo) aoJogarDeNovo();
    });
  },

  fechar() {
    const existente = document.getElementById("modal-jogo");
    if (existente) existente.remove();
  },
};

// expõe no window (const não vira propriedade global sozinho)
window.Modal = Modal;
