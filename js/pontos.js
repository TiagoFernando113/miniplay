const Pontos = {
  get() {
    return parseInt(localStorage.getItem("pontosTotais") || "0", 10);
  },

  acumulado() {
    return parseInt(
      localStorage.getItem("pontosAcumulados") || localStorage.getItem("pontosTotais") || "0",
      10
    );
  },

  add(n) {
    // Jogo da Semana: tudo que você ganha nele vale em DOBRO
    const jogoPagina = (location.pathname.match(/games\/([^/]+)/) || [])[1];
    if (window.JogoDaSemana && jogoPagina === JogoDaSemana.atual()) n *= 2;

    const total = this.get() + n;
    // lê o acumulado ANTES de gravar o total (o fallback usa o total antigo)
    const acumuladoAntes = this.acumulado();
    localStorage.setItem("pontosTotais", String(total));
    localStorage.setItem("pontosAcumulados", String(acumuladoAntes + n));
    this.atualizarTela();
    if (window.Conquistas) Conquistas.verificar();
    if (window.Missoes) Missoes.registrar(n);
    if (window.Stats) Stats.pontos(n);
    return total;
  },

  gastar(n) {
    if (this.get() < n) return false;
    localStorage.setItem("pontosTotais", String(this.get() - n));
    this.atualizarTela();
    return true;
  },

  atualizarTela() {
    const el = document.getElementById("pontos-totais");
    if (el) el.textContent = this.get();
  },
};

document.addEventListener("DOMContentLoaded", () => Pontos.atualizarTela());

// expõe no window (const não vira propriedade global sozinho)
window.Pontos = Pontos;
