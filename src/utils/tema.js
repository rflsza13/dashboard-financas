const CHAVE = "financas-tema";
const CHAVE_CORES = "financas-tema-cores";

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

/* ---------------- cores personalizadas (cards, fontes, destaque) ---------------- */

export const PADRAO_CORES = {
  destaque: "#e3242b",
  fundo: "#070707",
  card: "#280606",
  opacidade: 0.74,
  texto: "#ffffff",
  textoSec: "#a0aec0",
};

export const PRESETS = [
  { nome: "Vermelho (padrão)", ...PADRAO_CORES },
  { nome: "Azul", ...PADRAO_CORES, destaque: "#2f6bff", fundo: "#05080f", card: "#061226" },
  { nome: "Verde", ...PADRAO_CORES, destaque: "#12b76a", fundo: "#050a07", card: "#04180f" },
  { nome: "Roxo", ...PADRAO_CORES, destaque: "#8b5cf6", fundo: "#08050f", card: "#140a26" },
  { nome: "Âmbar", ...PADRAO_CORES, destaque: "#f59e0b", fundo: "#0a0703", card: "#1f1405" },
  { nome: "Teal", ...PADRAO_CORES, destaque: "#14b8a6", fundo: "#041110", card: "#062321" },
  { nome: "Aqua", ...PADRAO_CORES, destaque: "#22d3ee", fundo: "#04101a", card: "#06202e" },
];

const HEX = /^#[0-9a-f]{6}$/i;
const CAMPOS_COR = ["destaque", "fundo", "card", "texto", "textoSec"];

export function validarCores(p) {
  if (!p || typeof p !== "object") return "Cores inválidas.";
  for (let i = 0; i < CAMPOS_COR.length; i += 1) {
    if (!HEX.test(String(p[CAMPOS_COR[i]] || ""))) return "Use cores no formato #RRGGBB.";
  }
  const o = Number(p.opacidade);
  if (!Number.isFinite(o) || o < 0.3 || o > 1) return "A transparência dos cards deve ficar entre 30% e 100%.";
  return "";
}

export function lerCores() {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CORES);
    if (!bruto) return null;
    const p = JSON.parse(bruto);
    return validarCores(p) ? null : { ...p, opacidade: Number(p.opacidade) };
  } catch (e) {
    return null;
  }
}

export function salvarCores(p) {
  const erro = validarCores(p);
  if (erro) return erro;
  try {
    window.localStorage.setItem(CHAVE_CORES, JSON.stringify({ ...p, opacidade: Number(p.opacidade) }));
    return "";
  } catch (e) {
    return "Não foi possível guardar o tema neste navegador.";
  }
}

export function limparCores() {
  try {
    window.localStorage.removeItem(CHAVE_CORES);
  } catch (e) {
    // nada a limpar
  }
}

// O tema é lido na carga do app; aplicar = salvar e recarregar a página.
export const recarregar = { executar: () => window.location.reload() };

export const hexParaRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export const rgbParaHex = (rgb) =>
  `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;

export const rgba = (hex, a) => `rgba(${hexParaRgb(hex).join(", ")}, ${a})`;

export function misturar(hexA, hexB, t) {
  const a = hexParaRgb(hexA);
  const b = hexParaRgb(hexB);
  return rgbParaHex(a.map((v, i) => v + (b[i] - v) * t));
}

const luminancia = (hex) => {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contraste(hexA, hexB) {
  const [claro, escuro] = [luminancia(hexA), luminancia(hexB)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/** Valores derivados das cores escolhidas (mesma estrutura do themeConfig). */
export function derivar(p) {
  const fundoCard = misturar(p.fundo, p.card, p.opacidade);
  const accent = misturar(p.destaque, "#ffffff", 0.28);
  const [fr, fg, fb] = hexParaRgb(misturar(p.fundo, p.card, 0.4));
  return {
    login: {
      imageOverlay: `linear-gradient(135deg, ${rgba(p.destaque, 0.55)}, rgba(0, 0, 0, 0.45))`,
      fallbackBackground: `radial-gradient(700px 500px at 20% 20%, ${rgba(p.destaque, 0.55)}, transparent 65%), radial-gradient(600px 500px at 80% 90%, ${rgba(accent, 0.25)}, transparent 60%), ${p.fundo}`,
    },
    sidenav: {
      button: misturar(p.card, p.destaque, 0.15),
      main: `rgba(${fr}, ${fg}, ${fb}, 0.94) 19.41%`,
      state: `rgba(${hexParaRgb(p.fundo).join(", ")}, 0.49) 76.65%`,
    },
    neutros: {
      escuro: misturar(p.card, "#000000", 0.3),
      medio: misturar(p.card, p.destaque, 0.15),
      claro: misturar(p.card, "#ffffff", 0.25),
    },
    primary: p.destaque,
    accent,
    gradient: `radial-gradient(900px 500px at 88% -8%, ${rgba(p.destaque, 0.2)}, transparent 60%), radial-gradient(700px 400px at -5% 105%, ${rgba(p.destaque, 0.08)}, transparent 60%), ${p.fundo}`,
    cardBackground: rgba(p.card, p.opacidade),
    cardBorder: rgba(p.texto, 0.125),
    fonts: { primary: p.texto, secondary: p.textoSec },
    inputs: {
      backgroundColor: rgba(misturar(p.card, "#ffffff", 0.06), 0.6),
      color: p.texto,
      placeholderColor: p.textoSec,
      borderColor: rgba(p.texto, 0.3),
      focusBorderColor: p.destaque,
      focusBoxShadow: rgba(p.destaque, 0.35),
    },
    checkboxBorder: rgba(p.texto, 0.65),
    tonsInfo: [
      misturar(p.destaque, "#ffffff", 0.2),
      misturar(p.destaque, "#000000", 0.15),
      misturar(p.destaque, "#000000", 0.15),
      misturar(p.destaque, "#000000", 0.4),
      misturar(p.destaque, "#000000", 0.6),
      misturar(p.destaque, "#000000", 0.8),
    ],
    contraste: contraste(p.texto, fundoCard),
  };
}

export function aplicarCores(config, p) {
  const d = derivar(p);
  config.primary = d.primary;
  config.accent = d.accent;
  config.background.gradient = d.gradient;
  config.cards.background = d.cardBackground;
  config.cards.borderColor = d.cardBorder;
  config.fonts = d.fonts;
  config.inputs = { ...config.inputs, ...d.inputs };
  config.checkbox.borderColor = d.checkboxBorder;
  config.tonsInfo = d.tonsInfo;
  config.login = { ...config.login, ...d.login };
  config.sidenav = d.sidenav;
  config.neutros = d.neutros;
  config.personalizado = true;
}
