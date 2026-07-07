// Ícones desenhados (SVG) no lugar dos emojis — visual próprio do MiniPlay.
// Todos em traço, herdam a cor do tema via currentColor.
const _svg = (conteudo) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${conteudo}</svg>`;

const ICONES = {
  loja: _svg('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  conquistas: _svg('<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7 21l5-2.5L17 21l-2-7.5"/>'),
  perfil: _svg('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  ajustes: _svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2"/>'),
  memoria: _svg('<rect x="3" y="5" width="9" height="13" rx="2"/><rect x="12" y="7" width="9" height="13" rx="2" fill="var(--card-bg)"/><path d="M15.5 12.5h3M17 11v3"/>'),
  velha: _svg('<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><path d="M4.5 4.5l3 3M7.5 4.5l-3 3"/><circle cx="18" cy="18" r="1.8"/>'),
  "2048": _svg('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" fill-opacity="0.25"/>'),
  cobrinha: _svg('<path d="M4 18h8a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h9"/><circle cx="19.5" cy="6" r="1.4" fill="currentColor"/>'),
  genius: _svg('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>'),
  alvo: _svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/>'),
  blocos: _svg('<rect x="9" y="4" width="6" height="6"/><rect x="3" y="10" width="6" height="6"/><rect x="9" y="10" width="6" height="6"/><rect x="15" y="10" width="6" height="6"/>'),
  doces: _svg('<circle cx="12" cy="12" r="5"/><path d="M7.5 9 3 6l1.5 6L3 18l4.5-3M16.5 9 21 6l-1.5 6L21 18l-4.5-3"/>'),
  conquista: _svg('<path d="M5 21V4"/><path d="M5 4h12l-3 3.5L17 11H5"/><path d="M3 21h6"/>'),
  bolhas: _svg('<circle cx="9" cy="13" r="6"/><circle cx="18" cy="7" r="3.4"/><circle cx="18.5" cy="16.5" r="2"/>'),
  territorio: _svg('<path d="M3 3h11v7h7v11H10v-7H3V3z"/><path d="M10 10h4v4h-4z" fill="currentColor" fill-opacity="0.3"/>'),
  naval: _svg('<path d="M3 15h18l-2.5 5h-13L3 15z"/><path d="M7 15V9h10v6M12 9V4M12 4h4l-1.5 2L16 8h-4"/>'),
  quiz: _svg('<path d="M8.5 9a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3"/><circle cx="12" cy="18.2" r="1.3" fill="currentColor"/>'),
  ppt: _svg('<circle cx="7" cy="6.5" r="2.8"/><circle cx="7" cy="17.5" r="2.8"/><path d="M9.3 7.8 20 15M9.3 16.2 20 9"/>'),
  forca: _svg('<path d="M4 21V3h11v4"/><path d="M2 21h8"/><circle cx="15" cy="10" r="2.6"/><path d="M15 12.6V17M15 14l-2.5 2.5M15 14l2.5 2.5"/>'),
  campo: _svg('<circle cx="12" cy="13" r="6"/><path d="M12 4v3M12 19v3M3 13h3M18 13h3M6 7l2 2M18 7l-2 2M6 19l2-2M18 19l-2-2"/><circle cx="10" cy="11" r="1" fill="currentColor"/>'),
  puzzle15: _svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/><path d="M6.5 8.5h2M15 7v3" /><path d="M7 16.5h2.5M15.5 16.5H18"/>'),
  cacapalavras: _svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path d="M8 10.5h5M10.5 8v5"/>'),
  estrela: _svg('<path d="m12 3 2.7 5.6 6.3.9-4.5 4.3 1 6.2-5.5-3-5.5 3 1-6.2L3 9.5l6.3-.9L12 3z"/>'),
  fogo: _svg('<path d="M12 21c-3.9 0-6.5-2.5-6.5-6 0-2.6 1.7-4.4 3-6 .4 1.2 1 2 2 2.5C10.3 8.6 11 5.5 14 3c-.3 2.4.6 3.8 2 5.5 1.3 1.6 2.5 3.2 2.5 6.5 0 3.5-2.6 6-6.5 6z"/>'),
  som: _svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  vibrar: _svg('<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 9v6M2 10.5v3M20 9v6M22 10.5v3"/>'),
  musica: _svg('<circle cx="7" cy="17" r="2.6"/><circle cx="17" cy="15" r="2.6"/><path d="M9.6 17V6.5L19.6 4v10.5"/>'),
  girar: _svg('<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M18 2v5h-5"/>'),
  salvar: _svg('<path d="M12 3v11M8 10l4 4 4-4"/><path d="M4 17v3h16v-3"/>'),
  lixeira: _svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>'),
  hexagono: _svg('<path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5z"/><path d="M12 8.5 16 11v5l-4 2.5L8 16v-5l4-2.5z"/>'),
  passaro: _svg('<path d="M4 13c0-4 3-7 7-7 3.5 0 6 2.2 6 5l4 1.5-4 1.5c-.5 3.5-3 5.5-6.5 5.5C6.5 19.5 4 16.5 4 13z"/><circle cx="13.5" cy="10" r="1" fill="currentColor"/><path d="M8 13h4"/>'),
  torre: _svg('<rect x="8" y="15" width="8" height="6"/><rect x="9" y="9" width="6" height="6"/><rect x="10" y="3" width="4" height="6"/><path d="M12 3V1"/>'),
  ranking: _svg('<rect x="3" y="10" width="5.5" height="11"/><rect x="9.25" y="5" width="5.5" height="16"/><rect x="15.5" y="13" width="5.5" height="8"/><path d="M12 2v1.5"/>'),
  raio: _svg('<path d="M13 2 5 13h5l-1 9 8-11h-5l1-9z"/>'),
  baixar: _svg('<path d="M12 3v11M8 10l4 4 4-4"/><path d="M5 20h14"/>'),
  jogar: _svg('<circle cx="12" cy="12" r="10"/><path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor"/>'),
  cadeado: _svg('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/>'),
  broto: _svg('<path d="M12 21v-8"/><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 10c0-3.5 2.5-5.5 6.5-5.5 0 4-2.5 5.5-6.5 5.5z"/>'),
  moeda: _svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9c-.8-1-5.5-1.6-5.5 1 0 2.8 6.6 1.6 6.6 4.4 0 2.6-5.3 2.2-6.6.8"/>'),
  coroa: _svg('<path d="M4 18 3 7l5 4 4-7 4 7 5-4-1 11H4z"/><path d="M4 21h16"/>'),
  bussola: _svg('<circle cx="12" cy="12" r="9.5"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z" fill="currentColor"/>'),
  formatura: _svg('<path d="M2 9.5 12 5l10 4.5L12 14 2 9.5z"/><path d="M6.5 12v5c3 2.5 8 2.5 11 0v-5"/><path d="M21 10v5"/>'),
  presente: _svg('<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M4 10h16M12 10v10M12 10s-4.5.5-5.5-2c-.8-2 2-3.5 3.5-2 1.3 1.3 2 4 2 4zM12 10s4.5.5 5.5-2c.8-2-2-3.5-3.5-2-1.3 1.3-2 4-2 4z"/>'),
  gema: _svg('<path d="M7 3h10l4 6-9 12L3 9l4-6z"/><path d="M3 9h18M7 3l5 6 5-6M12 9v12" stroke-width="1.2"/>'),
  tanques: _svg('<rect x="3" y="11" width="12" height="8" rx="2"/><path d="M13 15h8M6 19v2M12 19v2"/><circle cx="9" cy="9" r="2"/>'),
  pingue: _svg("<circle cx=\"6\" cy=\"6\" r=\"3\"/><circle cx=\"18\" cy=\"18\" r=\"3\"/><rect x=\"10\" y=\"3\" width=\"4\" height=\"8\" rx=\"1\"/><rect x=\"10\" y=\"13\" width=\"4\" height=\"8\" rx=\"1\"/>"),
  quebrablocos: _svg("<rect x=\"3\" y=\"4\" width=\"6\" height=\"4\" rx=\"1\"/><rect x=\"11\" y=\"4\" width=\"6\" height=\"4\" rx=\"1\"/><rect x=\"9\" y=\"17\" width=\"8\" height=\"3\" rx=\"1\"/><circle cx=\"13\" cy=\"12\" r=\"2\"/>"),
  corredor: _svg("<circle cx=\"13\" cy=\"5\" r=\"2.2\"/><path d=\"M13 8l-3 5 3 2 3-3M10 13l-4 6M13 15l2 5\"/>"),
  coletar: _svg("<path d=\"M5 10h14l-2 9H7z\"/><path d=\"M8 10l2-5M16 10l-2-5\" stroke-width=\"1.4\"/>"),
  reacao: _svg("<path d=\"M13 2L4 14h7l-1 8 9-12h-7z\"/>"),
  piano: _svg("<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><rect x=\"7\" y=\"3\" width=\"2\" height=\"9\" fill=\"currentColor\"/><rect x=\"12\" y=\"3\" width=\"2\" height=\"9\" fill=\"currentColor\"/><rect x=\"16\" y=\"3\" width=\"2\" height=\"9\" fill=\"currentColor\"/>"),
  atravessar: _svg("<circle cx=\"12\" cy=\"6\" r=\"2.5\"/><path d=\"M12 9v6M9 20h6\"/><path d=\"M3 12h4M17 12h4\" stroke-width=\"1.4\"/>"),
  hanoi: _svg("<path d=\"M3 20h18\"/><path d=\"M12 4v14\"/><rect x=\"8\" y=\"15\" width=\"8\" height=\"3\" rx=\"1\"/><rect x=\"9\" y=\"11\" width=\"6\" height=\"3\" rx=\"1\"/><rect x=\"10\" y=\"7\" width=\"4\" height=\"3\" rx=\"1\"/>"),
  basquete: _svg("<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3v18M5 5c4 3 4 11 0 14M19 5c-4 3-4 11 0 14\" stroke-width=\"1.2\"/>"),
  conta: _svg("<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><path d=\"M8 8h8M8 12h3M13 12h3M8 16h3M13 16h3\"/>"),
  tiro3d: _svg("<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 2v4M12 18v4M2 12h4M18 12h4\"/><circle cx=\"12\" cy=\"12\" r=\"2\" fill=\"currentColor\"/>"),
  labirinto: _svg("<path d=\"M3 3h18v18H3z\"/><path d=\"M3 8h10M8 8v8M13 3v10M13 13h5M18 13v8M8 16h5\" stroke-width=\"1.6\"/>"),
  cobrabatalha: _svg('<path d="M4 6h6a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8" /><circle cx="18" cy="18" r="2" fill="currentColor"/><path d="M20 5l2-2M22 7l1.5-.5" stroke-width="1.3"/>'),
};

// preenche qualquer elemento com data-icone="nome"
function aplicarIcones() {
  document.querySelectorAll("[data-icone]").forEach((el) => {
    const svg = ICONES[el.dataset.icone];
    if (svg) el.innerHTML = svg;
  });
}
document.addEventListener("DOMContentLoaded", aplicarIcones);

// expõe no window (const não vira propriedade global sozinho)
window.ICONES = ICONES;
