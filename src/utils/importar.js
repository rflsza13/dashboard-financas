import { norm } from "utils/finance";

function hash(texto) {
  let h = 5381;
  for (let i = 0; i < texto.length; i += 1) h = (h * 33) ^ texto.charCodeAt(i);
  return `h${(h >>> 0).toString(36)}`;
}

function parseData(s) {
  const t = String(s || "").trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(t);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = /^(\d{4})(\d{2})(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return "";
}

export function parseValorBR(s) {
  let t = String(s === undefined || s === null ? "" : s)
    .replace(/R\$/gi, "")
    .replace(/\s/g, "");
  if (!t) return null;
  let neg = false;
  if (/^\(.*\)$/.test(t)) {
    neg = true;
    t = t.slice(1, -1);
  }
  if (t.endsWith("-")) {
    neg = true;
    t = t.slice(0, -1);
  }
  if (t.startsWith("-")) {
    neg = true;
    t = t.slice(1);
  } else if (t.startsWith("+")) t = t.slice(1);
  if (t.includes(",") && t.includes(".")) {
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (t.includes(",")) t = t.replace(",", ".");
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

function dividirCSV(linha, sep) {
  const out = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i += 1) {
    const ch = linha[i];
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else aspas = !aspas;
    } else if (ch === sep && !aspas) {
      out.push(atual);
      atual = "";
    } else atual += ch;
  }
  out.push(atual);
  return out.map((x) => x.trim());
}

/** Lê um CSV de extrato (data, descrição, valor ou débito/crédito). Retorna { lancamentos, erro }. */
export function parseCSV(texto) {
  const linhas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (linhas.length < 2) return { lancamentos: [], erro: "O arquivo não tem linhas suficientes." };
  const sep = [";", "\t", ","].sort((a, b) => linhas[0].split(b).length - linhas[0].split(a).length)[0];
  const cab = dividirCSV(linhas[0], sep).map(norm);
  const acha = (...nomes) => cab.findIndex((c) => nomes.some((n) => c.includes(n)));
  const iData = acha("data", "date");
  const iDesc = acha("descri", "histórico", "historico", "memo", "estabelecimento", "lançamento", "lancamento", "title");
  const iValor = acha("valor", "amount", "quantia");
  const iDeb = acha("débito", "debito");
  const iCred = acha("crédito", "credito");
  if (iData < 0 || iDesc < 0 || (iValor < 0 && iDeb < 0 && iCred < 0)) {
    return {
      lancamentos: [],
      erro: "Não encontrei as colunas Data, Descrição e Valor (ou Débito/Crédito) na primeira linha.",
    };
  }
  const lancamentos = [];
  linhas.slice(1).forEach((linha) => {
    const c = dividirCSV(linha, sep);
    const data = parseData(c[iData]);
    let valor = null;
    if (iValor >= 0) valor = parseValorBR(c[iValor]);
    else {
      const d = parseValorBR(c[iDeb]);
      const cr = parseValorBR(c[iCred]);
      valor = (cr || 0) - Math.abs(d || 0);
      if (d === null && cr === null) valor = null;
    }
    if (!data || valor === null || valor === 0) return;
    const descricao = String(c[iDesc] || "").trim();
    lancamentos.push({ hash: hash(`${data}|${norm(descricao)}|${valor}`), data, descricao, valor });
  });
  return { lancamentos, erro: lancamentos.length ? "" : "Nenhum lançamento válido encontrado." };
}

/** Lê um OFX (extrato bancário). */
export function parseOFX(texto) {
  const lancamentos = [];
  const blocos = texto.split(/<STMTTRN>/i).slice(1);
  blocos.forEach((b) => {
    const pega = (tag) => {
      const m = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(b);
      return m ? m[1].trim() : "";
    };
    const data = parseData(pega("DTPOSTED"));
    const valor = parseValorBR(pega("TRNAMT"));
    const descricao = pega("MEMO") || pega("NAME");
    const fitid = pega("FITID");
    if (!data || valor === null || valor === 0) return;
    lancamentos.push({ hash: fitid ? `o${hash(fitid)}` : hash(`${data}|${norm(descricao)}|${valor}`), data, descricao, valor });
  });
  return { lancamentos, erro: lancamentos.length ? "" : "Nenhum lançamento encontrado no OFX." };
}

export function lerExtrato(nome, texto) {
  return /\.ofx$/i.test(nome) || /<OFX>/i.test(texto) ? parseOFX(texto) : parseCSV(texto);
}

const PALAVRAS = [
  [["mercado", "supermerc", "carrefour", "assai", "atacad", "extra "], "Supermercado"],
  [["ifood", "restaurante", "lanchon", "pizza", "padaria", "burger"], "Restaurantes e delivery"],
  [["posto ", "shell", "ipiranga", "combust"], "Combustível"],
  [["uber", "99 ", "99app", "cabify", "metro", "onibus", "ônibus"], "Transporte público / Apps"],
  [["netflix", "spotify", "disney", "prime video", "hbo", "youtube", "deezer"], "Assinaturas e streaming"],
  [["farmac", "drogaria", "drogasil", "pacheco"], "Farmácia"],
  [["energia", "enel", "cpfl", "cemig", "light "], "Energia elétrica"],
  [["sabesp", "saneamento", "agua ", "água "], "Água"],
  [["vivo", "claro", "tim ", "oi ", "internet"], "Internet e telefone"],
  [["salario", "salário", "folha pag"], "Salário"],
];

/** Sugere o item da planilha: primeiro as regras aprendidas, depois palavras-chave comuns. */
export function sugerirItem(lancamento, itens, regras) {
  const desc = norm(lancamento.descricao);
  const regra = regras.find((r) => desc.includes(norm(r.id)));
  if (regra) {
    const it = itens.find((i) => i.bloco === regra.bloco && norm(i.categoria) === norm(regra.categoria) && norm(i.descricao) === norm(regra.item));
    if (it) return it.id;
  }
  const par = PALAVRAS.find(([chaves]) => chaves.some((c) => desc.includes(c)));
  if (par) {
    const it = itens.find((i) => norm(i.descricao) === norm(par[1]));
    if (it && (lancamento.valor > 0) === (it.bloco === "Receita")) return it.id;
  }
  return "";
}
