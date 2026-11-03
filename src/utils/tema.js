const CHAVE = "financas-tema";

export function temaAtual() {
  try {
    return window.localStorage.getItem(CHAVE) === "claro" ? "claro" : "escuro";
  } catch (e) {
    return "escuro";
  }
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle("tema-claro", tema === "claro");
  try {
    window.localStorage.setItem(CHAVE, tema);
  } catch (e) {
    // sem localStorage: vale só até recarregar
  }
}
