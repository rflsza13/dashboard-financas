export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const MESES_LONGOS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const BLOCOS = [
  { chave: "Receita", titulo: "Receitas", singular: "receita" },
  { chave: "Despesa", titulo: "Despesas", singular: "despesa" },
  { chave: "Investimento", titulo: "Investimentos", singular: "investimento" },
];

const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtCompact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const brl = (v) => fmtBRL.format(Number.isFinite(v) ? v : 0);
export const brlCompact = (v) => fmtCompact.format(Number.isFinite(v) ? v : 0);

export function pct(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(1).replace(".", ",")}%`;
}

export function variacao(atual, anterior) {
  if (!anterior) return null;
  return (atual - anterior) / anterior;
}

export function textoVariacao(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "";
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(0)}%`;
}

export const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

export const chaveItem = (bloco, categoria, descricao) =>
  `${bloco}|${norm(categoria)}|${norm(descricao)}`;

export const mesAtual = () => new Date().getMonth();

const soma = (arr) => arr.reduce((a, b) => a + b, 0);
const zeros = () => Array(12).fill(0);

/* ---------------- recorrências / parcelamentos ---------------- */

export function parseInicio(s) {
  const m = /^(\d{4})-(\d{2})/.exec(s || "");
  return m ? { ano: Number(m[1]), mes: Number(m[2]) - 1 } : null;
}

export function inicioTexto(ano, mes) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

/** Parcela devida de uma recorrência em um mês: { numero, total, valor } ou null. */
export function parcelaNoMes(rec, ano, mes) {
  const ini = parseInicio(rec.inicio);
  if (!ini || !rec.ativa) return null;
  const deslocamento = ano * 12 + mes - (ini.ano * 12 + ini.mes);
  if (deslocamento < 0) return null;
  const numero = (Number(rec.parcelaInicial) || 1) + deslocamento;
  const total = Number(rec.parcelas) > 0 ? Number(rec.parcelas) : null;
  if (total && numero > total) return null;
  return { numero, total, valor: Number(rec.valor) || 0 };
}

/** Último mês em que a recorrência gera parcela ({ano, mes}) ou null se não tem fim. */
export function fimRecorrencia(rec) {
  const ini = parseInicio(rec.inicio);
  const total = Number(rec.parcelas) > 0 ? Number(rec.parcelas) : null;
  if (!ini || !total) return null;
  const restantes = total - (Number(rec.parcelaInicial) || 1);
  const idx = ini.ano * 12 + ini.mes + Math.max(restantes, 0);
  return { ano: Math.floor(idx / 12), mes: idx % 12 };
}

/** Situação de uma recorrência em relação a um mês de referência. */
export function statusRecorrencia(rec, ano, mes) {
  const ini = parseInicio(rec.inicio);
  const total = Number(rec.parcelas) > 0 ? Number(rec.parcelas) : null;
  const valor = Number(rec.valor) || 0;
  const parcelaInicial = Number(rec.parcelaInicial) || 1;
  if (!ini) return { estado: "invalida", numero: null, restantes: null, totalRestante: null };
  if (!rec.ativa) return { estado: "pausada", numero: null, restantes: null, totalRestante: null };
  const deslocamento = ano * 12 + mes - (ini.ano * 12 + ini.mes);
  if (deslocamento < 0) {
    const restantes = total ? total - parcelaInicial + 1 : null;
    return { estado: "futura", numero: null, restantes, totalRestante: total ? restantes * valor : null };
  }
  const numero = parcelaInicial + deslocamento;
  if (total && numero > total) return { estado: "encerrada", numero: total, restantes: 0, totalRestante: 0 };
  const restantes = total ? total - numero + 1 : null;
  return { estado: "ativa", numero, restantes, totalRestante: total ? restantes * valor : null };
}

/** Parcelas devidas em um mês, com os dados da recorrência. */
export function parcelasDoMes(recorrencias, ano, mes) {
  return recorrencias
    .map((rec) => ({ rec, parcela: parcelaNoMes(rec, ano, mes) }))
    .filter((x) => x.parcela)
    .map((x) => ({ ...x.parcela, rec: x.rec }));
}

/** Compromissos (parcelas) dos próximos meses a partir de um mês de referência. */
export function projecaoRecorrencias(recorrencias, ano, mes, quantidade = 12) {
  const saida = [];
  for (let i = 0; i < quantidade; i += 1) {
    const idx = ano * 12 + mes + i;
    const a = Math.floor(idx / 12);
    const m = idx % 12;
    const parcelas = parcelasDoMes(recorrencias, a, m);
    saida.push({
      ano: a,
      mes: m,
      receita: soma(parcelas.filter((p) => p.rec.bloco === "Receita").map((p) => p.valor)),
      despesa: soma(parcelas.filter((p) => p.rec.bloco === "Despesa").map((p) => p.valor)),
      investimento: soma(parcelas.filter((p) => p.rec.bloco === "Investimento").map((p) => p.valor)),
    });
  }
  return saida;
}

/* ---------------- agregação anual ---------------- */

/**
 * Junta os valores realizados, a previsão manual e as recorrências de um ano.
 * Estimado do item no mês = previsto manual + parcelas ligadas ao item; sem nenhum dos dois,
 * usa a média dos meses anteriores com valor (se `estimarMedia` estiver ligado).
 */
export function calcularAno(itens, recorrencias, ano, { estimarMedia = true, cartoes = [], compras = [] } = {}) {
  const porChave = {};
  const linhas = itens.map((item) => {
    const linha = {
      ...item,
      chave: chaveItem(item.bloco, item.categoria, item.descricao),
      estimado: zeros(),
      parcelas: zeros(),
    };
    porChave[linha.chave] = linha;
    return linha;
  });

  const orfas = {};
  const somarParcela = (bloco, categoria, item, m, valor) => {
    let alvo = porChave[chaveItem(bloco, categoria, item)];
    if (!alvo) {
      if (!orfas[bloco]) {
        orfas[bloco] = {
          id: `orfa-${bloco}`,
          orfa: true,
          bloco,
          categoria: "Recorrências",
          descricao: "Sem item na planilha",
          real: zeros(),
          prev: zeros(),
          estimado: zeros(),
          parcelas: zeros(),
        };
        linhas.push(orfas[bloco]);
      }
      alvo = orfas[bloco];
    }
    alvo.parcelas[m] += valor;
  };
  recorrencias.forEach((rec) => {
    for (let m = 0; m < 12; m += 1) {
      const p = parcelaNoMes(rec, ano, m);
      if (p) somarParcela(rec.bloco, rec.categoria, rec.item, m, p.valor);
    }
  });
  cartoes
    .filter((c) => c.ativo !== false)
    .forEach((c) => {
      for (let m = 0; m < 12; m += 1) {
        const total = faturaDoMes(c, compras, ano, m).total;
        if (total > 0) somarParcela("Despesa", c.categoria, c.item, m, total);
      }
    });

  linhas.forEach((l) => {
    for (let m = 0; m < 12; m += 1) {
      const manual = Number(l.prev[m]) || 0;
      const base = manual + l.parcelas[m];
      if (base > 0) {
        l.estimado[m] = base;
      } else if (estimarMedia && !l.orfa) {
        const anteriores = l.real.slice(0, m).filter((v) => v > 0);
        l.estimado[m] = anteriores.length ? soma(anteriores) / anteriores.length : 0;
      }
    }
    l.realTotal = soma(l.real);
    l.estTotal = soma(l.estimado);
  });

  const blocos = {};
  BLOCOS.forEach(({ chave }) => {
    const ls = linhas.filter((l) => l.bloco === chave);
    const real = zeros();
    const est = zeros();
    ls.forEach((l) => {
      for (let m = 0; m < 12; m += 1) {
        real[m] += l.real[m];
        est[m] += l.estimado[m];
      }
    });
    const cats = {};
    ls.forEach((l) => {
      const nome = l.categoria || "Sem categoria";
      if (!cats[nome]) cats[nome] = { nome, real: zeros(), est: zeros() };
      for (let m = 0; m < 12; m += 1) {
        cats[nome].real[m] += l.real[m];
        cats[nome].est[m] += l.estimado[m];
      }
    });
    const categorias = Object.values(cats)
      .map((c) => ({ ...c, realTotal: soma(c.real), estTotal: soma(c.est) }))
      .sort((a, b) => b.realTotal - a.realTotal || b.estTotal - a.estTotal);
    blocos[chave] = { linhas: ls, real, est, realTotal: soma(real), estTotal: soma(est), categorias };
  });

  const rec = blocos.Receita;
  const des = blocos.Despesa;
  const inv = blocos.Investimento;
  const saldoReal = rec.real.map((r, i) => r - des.real[i] - inv.real[i]);
  const saldoEst = rec.est.map((r, i) => r - des.est[i] - inv.est[i]);

  let ultimoMes = -1;
  for (let m = 0; m < 12; m += 1) {
    if (rec.real[m] > 0 || des.real[m] > 0 || inv.real[m] > 0) ultimoMes = m;
  }

  let a = 0;
  const acumReal = saldoReal.map((v, i) => {
    a += v;
    return i <= ultimoMes ? Math.round(a * 100) / 100 : null;
  });
  let b = 0;
  const acumEst = saldoEst.map((v) => {
    b += v;
    return Math.round(b * 100) / 100;
  });

  return {
    linhas,
    blocos,
    saldoReal,
    saldoEst,
    acumReal,
    acumEst,
    ultimoMes,
    temDados: ultimoMes >= 0,
    receita: rec.realTotal,
    despesa: des.realTotal,
    investimento: inv.realTotal,
    saldo: soma(saldoReal),
    taxaPoupanca: rec.realTotal > 0 ? (rec.realTotal - des.realTotal) / rec.realTotal : null,
    taxaInvestimento: rec.realTotal > 0 ? inv.realTotal / rec.realTotal : null,
    mediaDespesa: (() => {
      const meses = des.real.filter((v) => v > 0);
      return meses.length ? soma(meses) / meses.length : 0;
    })(),
  };
}

/** Recorte de um mês: totais, tabelas por bloco, parcelas devidas e comparação com o mês anterior. */
export function resumoDoMes(calc, recorrencias, ano, mes, { cartoes = [], compras = [] } = {}) {
  const total = (bloco, campo) => calc.blocos[bloco][campo][mes];
  const totais = {};
  BLOCOS.forEach(({ chave }) => {
    const real = total(chave, "real");
    const est = total(chave, "est");
    totais[chave] = { real, est, dif: real - est, difPct: variacao(real, est) };
  });
  const saldoReal = calc.saldoReal[mes];
  const saldoEst = calc.saldoEst[mes];
  const anterior = mes > 0 ? mes - 1 : null;
  const comparar = (bloco) =>
    anterior === null ? null : variacao(calc.blocos[bloco].real[mes], calc.blocos[bloco].real[anterior]);
  const tabelas = {};
  BLOCOS.forEach(({ chave }) => {
    tabelas[chave] = calc.blocos[chave].linhas
      .map((l) => ({
        id: l.id,
        item: l,
        categoria: l.categoria,
        descricao: l.descricao,
        real: l.real[mes],
        estimado: l.estimado[mes],
        parcelas: l.parcelas[mes],
        dif: l.real[mes] - l.estimado[mes],
      }))
      .filter((l) => l.real > 0 || l.estimado > 0)
      .sort((a, b) => b.real - a.real || b.estimado - a.estimado);
  });
  const parcelas = parcelasDoMes(recorrencias, ano, mes);
  const receitaReal = totais.Receita.real;
  const categoriasDespesa = calc.blocos.Despesa.categorias
    .map((c) => ({ nome: c.nome, real: c.real[mes], est: c.est[mes] }))
    .filter((c) => c.real > 0 || c.est > 0)
    .sort((a, b) => b.real - a.real || b.est - a.est);
  const categoriasInvest = calc.blocos.Investimento.categorias
    .map((c) => ({ nome: c.nome, real: c.real[mes], est: c.est[mes] }))
    .filter((c) => c.real > 0 || c.est > 0);
  return {
    totais,
    saldoReal,
    saldoEst,
    saldoDif: saldoReal - saldoEst,
    taxaPoupanca: receitaReal > 0 ? (receitaReal - totais.Despesa.real) / receitaReal : null,
    taxaPoupancaEst:
      totais.Receita.est > 0 ? (totais.Receita.est - totais.Despesa.est) / totais.Receita.est : null,
    taxaInvestimento: receitaReal > 0 ? totais.Investimento.real / receitaReal : null,
    comparacao: {
      Receita: comparar("Receita"),
      Despesa: comparar("Despesa"),
      Investimento: comparar("Investimento"),
    },
    tabelas,
    parcelas,
    faturas: cartoes
      .filter((c) => c.ativo !== false)
      .map((c) => ({ cartao: c, ...faturaDoMes(c, compras, ano, mes) }))
      .filter((f) => f.total > 0),
    totalParcelasDespesa: soma(parcelas.filter((p) => p.rec.bloco === "Despesa").map((p) => p.valor)),
    categoriasDespesa,
    categoriasInvest,
    temDados:
      totais.Receita.real > 0 ||
      totais.Despesa.real > 0 ||
      totais.Investimento.real > 0 ||
      totais.Receita.est > 0 ||
      totais.Despesa.est > 0,
  };
}

/** Pontos de atenção do ano (meses no vermelho, categoria que mais cresceu, estouros do estimado...). */
export function gerarAlertas(calc, ano, metas = []) {
  const alertas = [];
  const { blocos, ultimoMes } = calc;
  const des = blocos.Despesa;
  const rec = blocos.Receita;
  const negativos = [];
  for (let i = 0; i <= ultimoMes; i += 1) {
    if (des.real[i] > rec.real[i] && (des.real[i] > 0 || rec.real[i] > 0)) negativos.push(MESES[i]);
  }
  if (negativos.length) {
    alertas.push({ nivel: "error", texto: `Despesas maiores que receitas em: ${negativos.join(", ")}.` });
  }
  if (ultimoMes >= 1) {
    const m = ultimoMes;
    const p = m - 1;
    let melhor = null;
    des.categorias.forEach((c) => {
      const d = c.real[m] - c.real[p];
      if (d > 0 && (!melhor || d > melhor.d)) melhor = { nome: c.nome, d, atual: c.real[m], ant: c.real[p] };
    });
    if (melhor) {
      alertas.push({
        nivel: "warning",
        texto: `${melhor.nome} foi a categoria que mais cresceu em ${MESES[m]}: ${brl(melhor.atual)} contra ${brl(melhor.ant)} em ${MESES[p]}.`,
      });
    }
  }
  if (ultimoMes >= 0) {
    const m = ultimoMes;
    if (des.est[m] > 0 && des.real[m] > des.est[m] * 1.1) {
      alertas.push({
        nivel: "warning",
        texto: `Em ${MESES[m]} as despesas (${brl(des.real[m])}) ficaram ${textoVariacao(
          des.real[m] / des.est[m] - 1
        )} acima do estimado (${brl(des.est[m])}).`,
      });
    }
  }
  if (ultimoMes >= 0) {
    progressoMetas(calc, metas, ultimoMes)
      .filter((p) => p.estado !== "ok")
      .forEach((p) => {
        alertas.push({
          nivel: p.estado === "estourou" ? "error" : "warning",
          texto:
            p.estado === "estourou"
              ? `${p.categoria} estourou a meta de ${MESES[ultimoMes]}: ${brl(p.real)} de ${brl(p.limite)}.`
              : `${p.categoria} já usou ${pct(p.ratio)} da meta de ${MESES[ultimoMes]} (${brl(p.real)} de ${brl(p.limite)}).`,
        });
      });
  }
  let maior = null;
  des.linhas.forEach((l) => {
    l.real.forEach((v, i) => {
      if (v > 0 && (!maior || v > maior.valor)) maior = { valor: v, descricao: l.descricao, mes: i };
    });
  });
  if (maior) {
    alertas.push({
      nivel: "info",
      texto: `Maior despesa do ano: ${maior.descricao || "sem descrição"} (${brl(maior.valor)} em ${MESES[maior.mes]}/${ano}).`,
    });
  }
  return alertas;
}

/* ---------------- cartões de crédito ---------------- */

const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate();

/** Mês (AAAA-MM) em que vence a primeira fatura de uma compra feita em `dataIso`. */
export function primeiraFatura(dataIso, cartao) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataIso || "");
  if (!m || !cartao) return "";
  const ano = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const dia = Number(m[3]);
  const fecha = Number(cartao.fechamento) || 1;
  const vence = Number(cartao.vencimento) || 1;
  let idx = ano * 12 + mes + (dia > fecha ? 1 : 0); // mês em que a fatura fecha
  if (vence <= fecha) idx += 1; // vence no mês seguinte ao fechamento
  return inicioTexto(Math.floor(idx / 12), idx % 12);
}

/** Parcela de uma compra na fatura de um mês: { numero, total, valor } ou null. */
export function parcelaCompra(compra, ano, mes) {
  const ini = parseInicio(compra.fatura);
  const total = Math.max(1, Number(compra.parcelas) || 1);
  if (!ini) return null;
  const deslocamento = ano * 12 + mes - (ini.ano * 12 + ini.mes);
  if (deslocamento < 0 || deslocamento >= total) return null;
  const valorTotal = Number(compra.total) || 0;
  const base = Math.round((valorTotal / total) * 100) / 100;
  const valor = deslocamento === total - 1 ? Math.round((valorTotal - base * (total - 1)) * 100) / 100 : base;
  return { numero: deslocamento + 1, total, valor };
}

/** Fatura de um cartão em um mês: itens (compras) e total. */
export function faturaDoMes(cartao, compras, ano, mes) {
  const itens = compras
    .filter((c) => c.cartaoId === cartao.id)
    .map((compra) => ({ compra, parcela: parcelaCompra(compra, ano, mes) }))
    .filter((x) => x.parcela);
  return { itens, total: soma(itens.map((x) => x.parcela.valor)) };
}

/** Quanto do limite está comprometido (parcelas ainda por vir, a partir do mês de referência). */
export function limiteComprometido(cartao, compras, ano, mes) {
  let total = 0;
  compras
    .filter((c) => c.cartaoId === cartao.id)
    .forEach((c) => {
      const n = Math.max(1, Number(c.parcelas) || 1);
      const ini = parseInicio(c.fatura);
      if (!ini) return;
      for (let k = 0; k < n; k += 1) {
        const idx = ini.ano * 12 + ini.mes + k;
        if (idx >= ano * 12 + mes) {
          const p = parcelaCompra(c, Math.floor(idx / 12), idx % 12);
          if (p) total += p.valor;
        }
      }
    });
  return Math.round(total * 100) / 100;
}

/** Faturas dos próximos meses de um cartão. */
export function projecaoFaturas(cartao, compras, ano, mes, quantidade = 12) {
  const saida = [];
  for (let i = 0; i < quantidade; i += 1) {
    const idx = ano * 12 + mes + i;
    saida.push({ ano: Math.floor(idx / 12), mes: idx % 12, total: faturaDoMes(cartao, compras, Math.floor(idx / 12), idx % 12).total });
  }
  return saida;
}

/* ---------------- contas a vencer ---------------- */

export const chavePago = (tipo, id, ano, mes) => `${tipo}:${id}:${inicioTexto(ano, mes)}`;

/** Contas que vencem hoje, nos próximos `dias` dias ou que já passaram do vencimento no mês sem estar pagas. */
export function listarVencimentos({ recorrencias, cartoes, compras, pagos, hoje = new Date(), dias = 7 }) {
  const pagosSet = new Set(pagos.map((p) => p.id));
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const limite = new Date(inicioHoje.getTime() + dias * 86400000);
  const itens = [];
  for (let d = 0; d < 2; d += 1) {
    const idx = inicioHoje.getFullYear() * 12 + inicioHoje.getMonth() + d;
    const ano = Math.floor(idx / 12);
    const mes = idx % 12;
    const dataDe = (dia) => new Date(ano, mes, Math.min(Number(dia), diasNoMes(ano, mes)));
    recorrencias.forEach((rec) => {
      const p = parcelaNoMes(rec, ano, mes);
      if (!p || !Number(rec.dia)) return;
      const chave = chavePago("rec", rec.id, ano, mes);
      itens.push({
        chave,
        tipo: "rec",
        bloco: rec.bloco,
        nome: rec.nome,
        valor: p.valor,
        data: dataDe(rec.dia),
        numero: p.numero,
        total: p.total,
        pago: pagosSet.has(chave),
      });
    });
    cartoes
      .filter((c) => c.ativo !== false && Number(c.vencimento))
      .forEach((c) => {
        const f = faturaDoMes(c, compras, ano, mes);
        if (f.total <= 0) return;
        const chave = chavePago("fat", c.id, ano, mes);
        itens.push({
          chave,
          tipo: "fatura",
          bloco: "Despesa",
          nome: `Fatura ${c.nome}`,
          valor: f.total,
          data: dataDe(c.vencimento),
          pago: pagosSet.has(chave),
        });
      });
  }
  return itens
    .filter((i) => i.data <= limite && (i.data >= inicioHoje || (!i.pago && i.data.getMonth() === inicioHoje.getMonth())))
    .map((i) => ({ ...i, atrasada: !i.pago && i.data < inicioHoje }))
    .sort((a, b) => a.data - b.data);
}

/* ---------------- metas por categoria e regra 50/30/20 ---------------- */

export function progressoMetas(calc, metas, mes) {
  const limites = {};
  metas.forEach((m) => {
    limites[norm(m.id)] = m;
  });
  return calc.blocos.Despesa.categorias
    .filter((c) => limites[norm(c.nome)] && Number(limites[norm(c.nome)].limite) > 0)
    .map((c) => {
      const limite = Number(limites[norm(c.nome)].limite);
      const real = c.real[mes];
      const ratio = real / limite;
      return {
        categoria: c.nome,
        limite,
        real,
        ratio,
        estado: ratio > 1 ? "estourou" : ratio >= 0.8 ? "atencao" : "ok",
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export const GRUPOS = ["Necessidades", "Desejos", "Poupança"];

const NECESSIDADES = ["moradia", "alimentação", "alimentacao", "saúde", "saude", "transporte", "educação", "educacao", "dívidas", "dividas"];

export function grupoPadrao(categoria) {
  return NECESSIDADES.includes(norm(categoria)) ? "Necessidades" : "Desejos";
}

/** Distribuição da receita entre necessidades, desejos e poupança (mes = null para o ano todo). */
export function distribuicao503020(calc, classificacao, mes = null) {
  const mapa = {};
  classificacao.forEach((c) => {
    mapa[norm(c.id)] = c.grupo;
  });
  const valor = (arr) => (mes === null ? soma(arr) : arr[mes]);
  const totais = { Necessidades: 0, Desejos: 0, Poupança: valor(calc.blocos.Investimento.real) };
  calc.blocos.Despesa.categorias.forEach((c) => {
    const grupo = GRUPOS.includes(mapa[norm(c.nome)]) ? mapa[norm(c.nome)] : grupoPadrao(c.nome);
    totais[grupo] += valor(c.real);
  });
  const receita = valor(calc.blocos.Receita.real);
  return { receita, totais, metas: { Necessidades: 0.5, Desejos: 0.3, Poupança: 0.2 } };
}

/* ---------------- objetivos ---------------- */

export function statusObjetivo(obj, ano, mes) {
  const alvo = Number(obj.alvo) || 0;
  const atual = Number(obj.atual) || 0;
  const aporte = Number(obj.aporte) || 0;
  const restante = Math.max(alvo - atual, 0);
  const prazo = parseInicio(obj.prazo);
  const mesesAtePrazo = prazo ? prazo.ano * 12 + prazo.mes - (ano * 12 + mes) : null;
  const necessarioMensal = mesesAtePrazo !== null && mesesAtePrazo > 0 ? restante / mesesAtePrazo : null;
  let previsao = null;
  if (restante > 0 && aporte > 0) {
    const meses = Math.ceil(restante / aporte);
    const idx = ano * 12 + mes + meses;
    previsao = { ano: Math.floor(idx / 12), mes: idx % 12, meses };
  }
  let estado = "sem-aporte";
  if (alvo > 0 && atual >= alvo) estado = "concluido";
  else if (mesesAtePrazo !== null && mesesAtePrazo <= 0) estado = "vencido";
  else if (necessarioMensal !== null && aporte >= necessarioMensal) estado = "no-ritmo";
  else if (necessarioMensal !== null) estado = "atrasado";
  else if (aporte > 0) estado = "no-ritmo";
  return {
    alvo,
    atual,
    restante,
    progresso: alvo > 0 ? Math.min(atual / alvo, 1) : 0,
    mesesAtePrazo,
    necessarioMensal,
    previsao,
    estado,
  };
}

/* ---------------- patrimônio ---------------- */

/** Saldo de cada conta em cada mês de um ano (repete o último saldo conhecido nos meses sem registro). */
export function saldosDoAno(contas, saldos, ano) {
  const porId = {};
  saldos.forEach((s) => {
    porId[s.id] = Number(s.valor) || 0;
  });
  return contas.map((conta) => {
    const meses = [];
    let ultimo = null;
    // último saldo conhecido antes do ano
    const antes = saldos
      .filter((s) => s.id.startsWith(`${conta.id}|`) && s.id.split("|")[1] < inicioTexto(ano, 0))
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    if (antes.length) ultimo = Number(antes[antes.length - 1].valor) || 0;
    for (let m = 0; m < 12; m += 1) {
      const chave = `${conta.id}|${inicioTexto(ano, m)}`;
      if (chave in porId) {
        ultimo = porId[chave];
        meses.push({ valor: ultimo, registrado: true });
      } else {
        meses.push({ valor: ultimo, registrado: false });
      }
    }
    return { conta, meses };
  });
}
