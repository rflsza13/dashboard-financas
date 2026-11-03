import themeConfig from "themeConfig";

export const RECURSOS = [
  { grupo: "Blocos do dashboard", chave: "alertas", rotulo: "Pontos de atenção", ajuda: "Alertas sobre meses no vermelho, metas e categorias que mais cresceram." },
  { grupo: "Blocos do dashboard", chave: "vencimentos", rotulo: "Contas a vencer", ajuda: "Painel com o que vence nos próximos 7 dias e o que está atrasado." },
  { grupo: "Blocos do dashboard", chave: "categorias", rotulo: "Gráfico de categorias", ajuda: "Mostra para onde o dinheiro vai, com as maiores categorias de despesa." },
  { grupo: "Blocos do dashboard", chave: "investimentos", rotulo: "Investimentos por categoria", ajuda: "Mostra quanto foi investido em cada categoria no ano." },
  { grupo: "Blocos do dashboard", chave: "previsto", rotulo: "Realizado × estimado", ajuda: "Mostra o gráfico que compara o realizado com o estimado mês a mês." },
  { grupo: "Páginas", chave: "cartoes", rotulo: "Cartões de crédito", ajuda: "Faturas por cartão, compras parceladas e limite comprometido." },
  { grupo: "Páginas", chave: "orcamento", rotulo: "Orçamento", ajuda: "Metas por categoria e regra 50/30/20." },
  { grupo: "Páginas", chave: "objetivos", rotulo: "Objetivos", ajuda: "Metas de poupança com prazo, aporte e projeção." },
  { grupo: "Páginas", chave: "patrimonio", rotulo: "Patrimônio", ajuda: "Saldo de contas e investimentos e a evolução ao longo do ano." },
  { grupo: "Páginas", chave: "comparativo", rotulo: "Comparativo entre anos", ajuda: "Compara dois anos por mês e por categoria." },
  { grupo: "Páginas", chave: "cenarios", rotulo: "Cenários", ajuda: "Simula mudanças de receita, despesa, aportes e quitação de dívidas." },
  { grupo: "Páginas", chave: "importar", rotulo: "Importar extrato", ajuda: "Importa CSV ou OFX do banco e sugere o item de cada lançamento." },
];

export const DEFAULT_CONFIG = {
  nomeSistema: "Minhas Finanças",
  topCategorias: 8,
  corReceitas: "#01b574",
  corDespesas: "#e31a1a",
  corSaldo: themeConfig.accent,
  alertas: true,
  vencimentos: true,
  categorias: true,
  investimentos: true,
  previsto: true,
  cartoes: true,
  orcamento: true,
  objetivos: true,
  patrimonio: true,
  comparativo: true,
  cenarios: true,
  importar: true,
  estimarMedia: true,
};

const FALSOS = ["false", "não", "nao", "0", "n"];

export function recursoLigado(config, chave) {
  const v = config ? config[chave] : undefined;
  if (v === undefined || v === null || v === "") return true;
  if (v === false) return false;
  return !FALSOS.includes(String(v).trim().toLowerCase());
}

export function mesclarConfig(salva) {
  const base = { ...DEFAULT_CONFIG };
  Object.keys(DEFAULT_CONFIG).forEach((k) => {
    if (salva && salva[k] !== undefined && salva[k] !== null && salva[k] !== "") base[k] = salva[k];
  });
  RECURSOS.forEach(({ chave }) => {
    base[chave] = recursoLigado(salva, chave);
  });
  return base;
}

export function recursosDe(config) {
  return RECURSOS.reduce((acc, { chave }) => ({ ...acc, [chave]: recursoLigado(config, chave) }), {});
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function validarConfig(c) {
  const e = {};
  const nome = String(c.nomeSistema || "").trim();
  if (nome.length < 1 || nome.length > 60) e.nomeSistema = "Informe um nome de 1 a 60 caracteres.";
  const top = Number(c.topCategorias);
  if (!Number.isInteger(top) || top < 1 || top > 20) e.topCategorias = "Informe um número inteiro de 1 a 20.";
  ["corReceitas", "corDespesas", "corSaldo"].forEach((k) => {
    if (!HEX.test(String(c[k] || ""))) e[k] = "Use uma cor no formato #RRGGBB.";
  });
  return e;
}
