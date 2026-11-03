import { MESES, parcelasDoMes, faturaDoMes } from "utils/finance";

const soma = (arr) => arr.reduce((a, b) => a + b, 0);
const media = (arr) => (arr.length ? soma(arr) / arr.length : 0);

/**
 * Projeta 12 meses a partir do mês seguinte ao último com dados (ou do mês atual).
 * Receita e investimento = média dos últimos 3 meses realizados; despesa = média sem parcelas + parcelas
 * futuras (recorrências e faturas). O cenário aplica variações, aporte extra e quitação antecipada.
 */
export function projetarCenario({ calc, ano, recorrencias, cartoes, compras, receitaPct, despesaPct, aporteExtra, quitar }) {
  const ref = calc.ultimoMes >= 0 ? calc.ultimoMes : new Date().getMonth() - 1;
  const base = [];
  for (let m = Math.max(ref - 2, 0); m <= ref; m += 1) base.push(m);

  const parcelasDespesa = (a, m, recs) =>
    soma(parcelasDoMes(recs, a, m).filter((p) => p.rec.bloco === "Despesa").map((p) => p.valor)) +
    soma(cartoes.filter((c) => c.ativo !== false).map((c) => faturaDoMes(c, compras, a, m).total));

  const receitaBase = media(base.map((m) => calc.blocos.Receita.real[m]));
  const investBase = media(base.map((m) => calc.blocos.Investimento.real[m]));
  const despesaVarBase = media(base.map((m) => calc.blocos.Despesa.real[m] - parcelasDespesa(ano, m, recorrencias)));

  const alvoQuitar = quitar ? recorrencias.find((r) => r.id === quitar.id) : null;
  const recsCenario = alvoQuitar
    ? recorrencias.map((r) => (r.id === alvoQuitar.id ? { ...r, ativa: false } : r))
    : recorrencias;

  const meses = [];
  let acumBase = 0;
  let acumCen = 0;
  let investExtraTotal = 0;
  for (let i = 1; i <= 12; i += 1) {
    const idx = ano * 12 + ref + i;
    const a = Math.floor(idx / 12);
    const m = idx % 12;
    const parcelasBase = parcelasDespesa(a, m, recorrencias);
    const parcelasCen = parcelasDespesa(a, m, recsCenario);
    let quitacao = 0;
    if (alvoQuitar && quitar.mes === i) {
      // paga hoje o que ainda faltava da recorrência (parcelas deste mês em diante)
      for (let k = i; k <= 36; k += 1) {
        const j = ano * 12 + ref + k;
        const p = parcelasDoMes([alvoQuitar], Math.floor(j / 12), j % 12);
        if (p.length) quitacao += p[0].valor;
      }
    }
    const saldoBase = receitaBase - (Math.max(despesaVarBase, 0) + parcelasBase) - investBase;
    const saldoCen =
      receitaBase * (1 + receitaPct / 100) -
      (Math.max(despesaVarBase, 0) * (1 + despesaPct / 100) + parcelasCen + quitacao) -
      investBase -
      aporteExtra;
    acumBase += saldoBase;
    acumCen += saldoCen;
    investExtraTotal += aporteExtra;
    meses.push({ rotulo: `${MESES[m]}/${String(a).slice(2)}`, saldoBase, saldoCen, acumBase, acumCen });
  }
  return {
    meses,
    receitaBase,
    investBase,
    despesaVarBase,
    investExtraTotal,
    diferencaFinal: acumCen - acumBase,
    temBase: base.length > 0 && (receitaBase > 0 || despesaVarBase > 0),
  };
}
