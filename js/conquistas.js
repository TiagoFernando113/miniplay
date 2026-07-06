const LISTA_CONQUISTAS = [
  { id: "primeiros", icone: "broto", nome: "Primeiros pontos", desc: "Ganhe seus primeiros pontos", cond: (e) => e.acumulado >= 1 },
  { id: "centenario", icone: "estrela", nome: "Centenário", desc: "Acumule 100 pontos", cond: (e) => e.acumulado >= 100 },
  { id: "rico", icone: "moeda", nome: "Poupador", desc: "Acumule 500 pontos", cond: (e) => e.acumulado >= 500 },
  { id: "milionario", icone: "coroa", nome: "Rei dos pontos", desc: "Acumule 1000 pontos", cond: (e) => e.acumulado >= 1000 },
  { id: "lenda", icone: "conquistas", nome: "Lenda", desc: "Acumule 2000 pontos", cond: (e) => e.acumulado >= 2000 },
  { id: "explorador", icone: "bussola", nome: "Explorador", desc: "Jogue 5 jogos diferentes", cond: (e) => Object.keys(e.recordes).length >= 5 },
  { id: "colecionador", icone: "jogar", nome: "Colecionador", desc: "Jogue todos os 21 jogos", cond: (e) => Object.keys(e.recordes).length >= 21 },
  { id: "cobrona", icone: "cobrinha", nome: "Cobrona", desc: "Coma 10 na Cobrinha", cond: (e) => (e.recordes.cobrinha || 0) >= 10 },
  { id: "elefante", icone: "genius", nome: "Memória de elefante", desc: "Chegue à rodada 8 no Genius", cond: (e) => (e.recordes.genius || 0) >= 8 },
  { id: "pistoleiro", icone: "alvo", nome: "Mira certeira", desc: "20 acertos no Acerte o Alvo", cond: (e) => (e.recordes.alvo || 0) >= 20 },
  { id: "estrategista", icone: "velha", nome: "Estrategista", desc: "Vença 5 vezes no Jogo da Velha", cond: (e) => (e.recordes.velhaVitorias || 0) >= 5 },
  { id: "numerologo", icone: "2048", nome: "Numerólogo", desc: "Faça 1000 numa partida de 2048", cond: (e) => (e.recordes.p2048 || 0) >= 1000 },
  { id: "fashionista", icone: "loja", nome: "Fashionista", desc: "Compre um tema na loja", cond: (e) => e.temas.length >= 2 },
  { id: "almirante", icone: "naval", nome: "Almirante", desc: "Vença 3 batalhas navais", cond: (e) => (e.recordes.navalVitorias || 0) >= 3 },
  { id: "sabido", icone: "formatura", nome: "Sabido", desc: "Acerte 10 de 10 no Quiz", cond: (e) => (e.recordes.quiz || 0) >= 10 },
  { id: "imperador", icone: "conquista", nome: "Imperador", desc: "Vença 3 vezes no Conquista", cond: (e) => (e.recordes.conquistaVitorias || 0) >= 3 },
  { id: "empilhador", icone: "blocos", nome: "Empilhador", desc: "Faça 1000 numa partida de Blocos", cond: (e) => (e.recordes.blocos || 0) >= 1000 },
  { id: "guloso", icone: "doces", nome: "Guloso", desc: "Faça 2000 numa partida de Doces", cond: (e) => (e.recordes.doces || 0) >= 2000 },
  { id: "estiloso", icone: "perfil", nome: "Estiloso", desc: "Compre um avatar na loja", cond: (e) => e.avatares.length >= 2 },
  { id: "peixao", icone: "bolhas", nome: "Peixão", desc: "Chegue ao tamanho 70 nas Bolhas", cond: (e) => (e.recordes.bolhas || 0) >= 70 },
  { id: "latifundiario", icone: "territorio", nome: "Dono do pedaço", desc: "Vença 3 vezes no Território", cond: (e) => (e.recordes.territorioVitorias || 0) >= 3 },
  { id: "voador", icone: "passaro", nome: "Ás do céu", desc: "Passe 20 canos no Pássaro", cond: (e) => (e.recordes.passaro || 0) >= 20 },
  { id: "arquiteto", icone: "torre", nome: "Arquiteto", desc: "Empilhe 25 andares na Torre", cond: (e) => (e.recordes.torre || 0) >= 25 },
  { id: "hexamestre", icone: "hexagono", nome: "Hexamestre", desc: "Faça 1000 no Hexágono", cond: (e) => (e.recordes.hexagono || 0) >= 1000 },
  { id: "serpentao", icone: "cobrabatalha", nome: "Serpentão", desc: "Chegue a tamanho 50 na Cobra Batalha", cond: (e) => (e.recordes.cobrabatalha || 0) >= 50 },
];

const Conquistas = {
  desbloqueadas() {
    return JSON.parse(localStorage.getItem("conquistas") || "[]");
  },

  verificar() {
    const estado = {
      acumulado: window.Pontos ? Pontos.acumulado() : 0,
      recordes: JSON.parse(localStorage.getItem("recordes") || "{}"),
      temas: window.Tema ? Tema.comprados() : ["escuro"],
      avatares: window.Avatar ? Avatar.comprados() : ["carinha"],
    };
    const feitas = this.desbloqueadas();
    let houveNova = false;

    for (const c of LISTA_CONQUISTAS) {
      if (!feitas.includes(c.id) && c.cond(estado)) {
        feitas.push(c.id);
        houveNova = true;
        this.toast(c);
      }
    }

    if (houveNova) localStorage.setItem("conquistas", JSON.stringify(feitas));
  },

  toast(conquista) {
    const aviso = document.createElement("div");
    aviso.className = "toast-conquista";
    const medalha = window.ICONES ? ICONES.conquistas : "";
    aviso.innerHTML = `${medalha} Conquista: ${conquista.nome}`;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => aviso.classList.add("visivel"));
    setTimeout(() => {
      aviso.classList.remove("visivel");
      setTimeout(() => aviso.remove(), 400);
    }, 2800);
    if (window.Som) Som.vitoria();
  },
};

// expõe no window (const não vira propriedade global sozinho)
window.Conquistas = Conquistas;
window.LISTA_CONQUISTAS = LISTA_CONQUISTAS;
