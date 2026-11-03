import { v4 as uuidv4 } from "uuid";
import { mesclarConfig } from "utils/config";
import { chaveItem } from "utils/finance";

/**
 * Cliente da API (Google Apps Script). Sem REACT_APP_SCRIPT_URL o app roda em
 * "modo demonstração": dados fictícios guardados só no navegador (localStorage).
 */
const SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL;
const TOKEN = process.env.REACT_APP_SCRIPT_TOKEN;

export const isDemo = !SCRIPT_URL;

/* ---------------- planilha real (Apps Script) ---------------- */

async function call(payload) {
  // Sem cabeçalhos customizados: evita preflight CORS no Apps Script.
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ ...payload, token: TOKEN }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Erro desconhecido");
  return data;
}

const conferir = (item) => ({
  linha: item.linha,
  bloco: item.bloco,
  categoria: item.categoria,
  descricao: item.descricao,
});

const remote = {
  bootstrap: () => call({ action: "bootstrap" }),
  listarAno: (ano) => call({ action: "listarAno", ano }).then((r) => r.itens),
  setCelula: (ano, item, mes, campo, valor) =>
    call({ action: "setCelula", ano, item: conferir(item), mes, campo, valor }),
  criarItem: (ano, dados) => call({ action: "criarItem", ano, ...dados }).then((r) => r.item),
  editarItem: (ano, item, dados) =>
    call({ action: "editarItem", ano, item: conferir(item), ...dados }),
  excluirItem: (ano, item) => call({ action: "excluirItem", ano, item: conferir(item) }),
  criarAno: (ano) => call({ action: "criarAno", ano }),
  criarRecorrencia: (rec) => call({ action: "criarRecorrencia", rec }).then((r) => r.rec),
  atualizarRecorrencia: (rec) => call({ action: "atualizarRecorrencia", rec }),
  excluirRecorrencia: (id) => call({ action: "excluirRecorrencia", id }),
  salvarConfig: (config) => call({ action: "salvarConfig", config }).then((r) => r.config),
  salvarLinhas: (tabela, linhas) => call({ action: "salvarLinhas", tabela, linhas }),
  excluirLinhas: (tabela, ids) => call({ action: "excluirLinhas", tabela, ids }),
  somarCelulas: (ano, lista) =>
    call({
      action: "somarCelulas",
      ano,
      lista: lista.map((x) => ({ item: conferir(x.item), mes: x.mes, valor: x.valor })),
    }),
};

/* ---------------- modo demonstração (localStorage) ---------------- */

const DEMO_KEY = "financas-demo-v3";

export const TABELAS = [
  "metas",
  "classificacao",
  "cartoes",
  "compras",
  "objetivos",
  "contas",
  "saldos",
  "pagos",
  "regras",
  "importados",
];

const MODELO_ITENS = [
  ["Receita", "Trabalho", ["Salário", "13º salário", "Férias", "Bônus / PLR"]],
  ["Receita", "Renda extra", ["Freelance", "Vendas", "Outras rendas"]],
  ["Receita", "Rendimentos", ["Juros e dividendos", "Aluguéis recebidos"]],
  [
    "Despesa",
    "Moradia",
    ["Aluguel / Financiamento", "Condomínio", "Energia elétrica", "Água", "Internet e telefone", "Gás", "IPTU"],
  ],
  ["Despesa", "Alimentação", ["Supermercado", "Restaurantes e delivery"]],
  ["Despesa", "Transporte", ["Combustível", "Transporte público / Apps", "IPVA e seguro", "Manutenção"]],
  ["Despesa", "Saúde", ["Plano de saúde", "Farmácia", "Consultas e exames"]],
  ["Despesa", "Educação", ["Mensalidade / Cursos", "Livros e materiais"]],
  ["Despesa", "Lazer", ["Viagens", "Assinaturas e streaming", "Passeios"]],
  ["Despesa", "Dívidas", ["Parcelas e empréstimos", "Fatura do cartão"]],
  ["Despesa", "Outros", ["Compras pessoais", "Presentes", "Imprevistos"]],
  ["Investimento", "Renda fixa", ["Tesouro Direto", "CDB / LCI / LCA"]],
  ["Investimento", "Renda variável", ["Ações", "Fundos imobiliários"]],
  ["Investimento", "Reserva", ["Reserva de emergência"]],
  ["Investimento", "Previdência", ["Previdência privada"]],
];

const zeros = () => Array(12).fill(0);

function itensModelo() {
  const itens = [];
  MODELO_ITENS.forEach(([bloco, categoria, descricoes]) =>
    descricoes.forEach((descricao) =>
      itens.push({ id: uuidv4(), bloco, categoria, descricao, real: zeros(), prev: zeros() })
    )
  );
  return itens;
}

function semear() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const itens = itensModelo();
  const set = (descricao, fn) => {
    const item = itens.find((i) => i.descricao === descricao);
    for (let m = 0; m < 12; m += 1) {
      const v = fn(m);
      if (v > 0 && m <= hoje.getMonth()) item.real[m] = v;
    }
  };
  set("Salário", () => 6500);
  set("Freelance", (m) => (m % 3 === 0 ? 900 : 0));
  set("Aluguel / Financiamento", () => 1800);
  set("Energia elétrica", (m) => 170 + (m % 4) * 15);
  set("Internet e telefone", () => 140);
  set("Supermercado", (m) => 780 + (m % 4) * 60);
  set("Restaurantes e delivery", (m) => 260 + (m % 5) * 35);
  set("Combustível", (m) => 320 + (m % 3) * 40);
  set("Assinaturas e streaming", () => 89.9);
  set("Parcelas e empréstimos", () => 350);
  set("Tesouro Direto", () => 600);
  set("Reserva de emergência", () => 400);
  const salario = itens.find((i) => i.descricao === "Salário");
  const aluguel = itens.find((i) => i.descricao === "Aluguel / Financiamento");
  for (let m = 0; m < 12; m += 1) {
    salario.prev[m] = 6500;
    aluguel.prev[m] = 1800;
  }
  const mesInicio = Math.max(hoje.getMonth() - 3, 0);
  const recorrencias = [
    {
      id: uuidv4(),
      bloco: "Despesa",
      categoria: "Dívidas",
      item: "Parcelas e empréstimos",
      nome: "Notebook (demo)",
      valor: 350,
      parcelas: 10,
      inicio: `${ano}-${String(mesInicio + 1).padStart(2, "0")}`,
      parcelaInicial: 1,
      ativa: true,
      obs: "",
    },
  ];
  recorrencias[0].dia = Math.min(hoje.getDate() + 2, 28);
  const venceCartao = Math.min(hoje.getDate() + 4, 28);
  const mesTxt = (deslocamento) => {
    const idx = ano * 12 + hoje.getMonth() + deslocamento;
    return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
  };
  const cartaoId = uuidv4();
  const contaCorrente = uuidv4();
  const contaInvest = uuidv4();
  const dados = {
    metas: [
      { id: "Alimentação", limite: 1000 },
      { id: "Lazer", limite: 400 },
    ],
    classificacao: [],
    cartoes: [
      {
        id: cartaoId,
        nome: "Cartão demo",
        fechamento: Math.max(venceCartao - 7, 1),
        vencimento: venceCartao,
        limite: 5000,
        categoria: "Dívidas",
        item: "Fatura do cartão",
        ativo: true,
      },
    ],
    compras: [
      {
        id: uuidv4(),
        cartaoId,
        data: `${ano}-${String(hoje.getMonth() + 1).padStart(2, "0")}-02`,
        descricao: "Celular (demo)",
        categoria: "Compras",
        total: 1800,
        parcelas: 6,
        fatura: mesTxt(0),
        obs: "",
      },
      {
        id: uuidv4(),
        cartaoId,
        data: `${ano}-${String(hoje.getMonth() + 1).padStart(2, "0")}-08`,
        descricao: "Mercado (demo)",
        categoria: "Alimentação",
        total: 420,
        parcelas: 1,
        fatura: mesTxt(1),
        obs: "",
      },
    ],
    objetivos: [
      {
        id: uuidv4(),
        nome: "Reserva de emergência (demo)",
        alvo: 20000,
        prazo: mesTxt(18),
        atual: 6000,
        aporte: 600,
        obs: "",
      },
    ],
    contas: [
      { id: contaCorrente, nome: "Conta corrente", tipo: "Conta", ativa: true },
      { id: contaInvest, nome: "Tesouro e CDB", tipo: "Investimento", ativa: true },
    ],
    saldos: [],
    pagos: [],
    regras: [],
    importados: [],
  };
  for (let m = 0; m <= hoje.getMonth(); m += 1) {
    const chave = `${ano}-${String(m + 1).padStart(2, "0")}`;
    dados.saldos.push({ id: `${contaCorrente}|${chave}`, valor: 2500 + m * 180 });
    dados.saldos.push({ id: `${contaInvest}|${chave}`, valor: 6000 + m * 900 });
  }
  return { anos: { [ano]: { itens } }, recorrencias, dados, config: mesclarConfig() };
}

function gravarDemo(db) {
  try {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  } catch (e) {
    // sem localStorage: segue só em memória
  }
}

let memoria = null;

function lerDemo() {
  if (memoria) return memoria;
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    if (raw) {
      memoria = JSON.parse(raw);
      TABELAS.forEach((t) => {
        if (!memoria.dados) memoria.dados = {};
        if (!memoria.dados[t]) memoria.dados[t] = [];
      });
      return memoria;
    }
  } catch (e) {
    // ignora: cai no seed
  }
  memoria = semear();
  gravarDemo(memoria);
  return memoria;
}

const copia = (x) => JSON.parse(JSON.stringify(x));

function acharItem(db, ano, id) {
  const itens = (db.anos[ano] || {}).itens || [];
  const item = itens.find((i) => i.id === id);
  if (!item) throw new Error("Item não encontrado. Recarregue o dashboard.");
  return item;
}

const demo = {
  bootstrap: async () => {
    const db = lerDemo();
    return {
      anos: Object.keys(db.anos),
      recorrencias: copia(db.recorrencias),
      dados: copia(db.dados),
      config: mesclarConfig(db.config),
    };
  },
  listarAno: async (ano) => copia(((lerDemo().anos[ano] || {}).itens) || []),
  setCelula: async (ano, item, mes, campo, valor) => {
    const db = lerDemo();
    acharItem(db, ano, item.id)[campo === "prev" ? "prev" : "real"][mes] = Number(valor) || 0;
    gravarDemo(db);
    return { ok: true };
  },
  criarItem: async (ano, { bloco, categoria, descricao }) => {
    const db = lerDemo();
    const itens = db.anos[ano].itens;
    if (itens.some((i) => chaveItem(i.bloco, i.categoria, i.descricao) === chaveItem(bloco, categoria, descricao))) {
      throw new Error("Já existe um item com essa categoria e descrição neste bloco.");
    }
    const item = { id: uuidv4(), bloco, categoria, descricao, real: zeros(), prev: zeros() };
    itens.push(item);
    gravarDemo(db);
    return copia(item);
  },
  editarItem: async (ano, item, { categoria, descricao }) => {
    const db = lerDemo();
    const alvo = acharItem(db, ano, item.id);
    alvo.categoria = categoria;
    alvo.descricao = descricao;
    gravarDemo(db);
    return { ok: true };
  },
  excluirItem: async (ano, item) => {
    const db = lerDemo();
    db.anos[ano].itens = db.anos[ano].itens.filter((i) => i.id !== item.id);
    gravarDemo(db);
    return { ok: true };
  },
  criarAno: async (ano) => {
    const db = lerDemo();
    if (db.anos[ano]) throw new Error(`O ano ${ano} já existe.`);
    const anos = Object.keys(db.anos).sort();
    const base = anos.length ? db.anos[anos[anos.length - 1]].itens : itensModelo();
    db.anos[ano] = {
      itens: base.map((i) => ({ ...copia(i), id: uuidv4(), real: zeros(), prev: zeros() })),
    };
    gravarDemo(db);
    return { ok: true };
  },
  criarRecorrencia: async (rec) => {
    const db = lerDemo();
    const nova = { ...rec, id: uuidv4() };
    db.recorrencias.push(nova);
    gravarDemo(db);
    return copia(nova);
  },
  atualizarRecorrencia: async (rec) => {
    const db = lerDemo();
    db.recorrencias = db.recorrencias.map((r) => (r.id === rec.id ? { ...rec } : r));
    gravarDemo(db);
    return { ok: true };
  },
  excluirRecorrencia: async (id) => {
    const db = lerDemo();
    db.recorrencias = db.recorrencias.filter((r) => r.id !== id);
    gravarDemo(db);
    return { ok: true };
  },
  salvarConfig: async (config) => {
    const db = lerDemo();
    db.config = mesclarConfig(config);
    gravarDemo(db);
    return db.config;
  },
  salvarLinhas: async (tabela, linhas) => {
    const db = lerDemo();
    const lista = db.dados[tabela];
    if (!lista) throw new Error(`Tabela desconhecida: ${tabela}`);
    linhas.forEach((l) => {
      const i = lista.findIndex((x) => x.id === l.id);
      if (i >= 0) lista[i] = { ...l };
      else lista.push({ ...l });
    });
    gravarDemo(db);
    return { ok: true };
  },
  excluirLinhas: async (tabela, ids) => {
    const db = lerDemo();
    if (!db.dados[tabela]) throw new Error(`Tabela desconhecida: ${tabela}`);
    db.dados[tabela] = db.dados[tabela].filter((x) => !ids.includes(x.id));
    gravarDemo(db);
    return { ok: true };
  },
  somarCelulas: async (ano, lista) => {
    const db = lerDemo();
    lista.forEach((x) => {
      const item = acharItem(db, ano, x.item.id);
      item.real[x.mes] = Math.round(((item.real[x.mes] || 0) + x.valor) * 100) / 100;
    });
    gravarDemo(db);
    return { ok: true };
  },
};

export default isDemo ? demo : remote;
