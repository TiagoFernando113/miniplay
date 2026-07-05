const Recordes = {
  _todos() {
    return JSON.parse(localStorage.getItem("recordes") || "{}");
  },

  get(jogo) {
    return this._todos()[jogo];
  },

  salvar(jogo, valor, menorMelhor = false) {
    const todos = this._todos();
    const atual = todos[jogo];
    const ehNovo = atual === undefined || (menorMelhor ? valor < atual : valor > atual);
    if (ehNovo) {
      todos[jogo] = valor;
      localStorage.setItem("recordes", JSON.stringify(todos));
      if (window.Conquistas) Conquistas.verificar();
    }
    return ehNovo;
  },

  incrementar(jogo) {
    const todos = this._todos();
    todos[jogo] = (todos[jogo] || 0) + 1;
    localStorage.setItem("recordes", JSON.stringify(todos));
    if (window.Conquistas) Conquistas.verificar();
    return todos[jogo];
  },
};

// expõe no window (const não vira propriedade global sozinho)
window.Recordes = Recordes;
