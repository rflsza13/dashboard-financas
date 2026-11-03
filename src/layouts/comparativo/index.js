import { useEffect, useMemo, useState } from "react";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import { FieldLabel, NativeSelect } from "layouts/dashboard/components/fields";
import { ComparativoChart } from "layouts/dashboard/components/FinanceCharts";

import { useFinance } from "context/finance";
import { MESES, brl, textoVariacao, variacao } from "utils/finance";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = { padding: "8px", fontSize: 12, fontWeight: 500, color: themeConfig.fonts.secondary, borderBottom: BORDA, textAlign: "right", whiteSpace: "nowrap" };
const td = { padding: "6px 8px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right" };
const METRICAS = [
  { chave: "Receita", rotulo: "Receitas" },
  { chave: "Despesa", rotulo: "Despesas" },
  { chave: "Investimento", rotulo: "Investimentos" },
  { chave: "Saldo", rotulo: "Saldo" },
];

function Comparativo() {
  const { loading, ano, anos, garantirAno, calcularOutroAno, itens } = useFinance();
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [metrica, setMetrica] = useState("Despesa");

  useEffect(() => {
    if (!ano || a) return;
    const outro = [...anos].reverse().find((x) => x !== ano);
    setA(outro || ano);
    setB(ano);
  }, [ano, anos, a]);

  useEffect(() => {
    if (a) garantirAno(a);
    if (b) garantirAno(b);
  }, [a, b, garantirAno]);

  // `itens` entra na dependência para recalcular quando um ano termina de carregar
  const calcA = useMemo(() => (a ? calcularOutroAno(a) : null), [a, calcularOutroAno, itens]);
  const calcB = useMemo(() => (b ? calcularOutroAno(b) : null), [b, calcularOutroAno, itens]);

  const serie = (calc) => (metrica === "Saldo" ? calc.saldoReal : calc.blocos[metrica].real);
  const total = (arr) => arr.reduce((x, y) => x + y, 0);

  const linhas = useMemo(() => {
    if (!calcA || !calcB) return [];
    if (metrica === "Saldo") {
      const r = [
        ["Receitas", calcA.receita, calcB.receita],
        ["Despesas", calcA.despesa, calcB.despesa],
        ["Investimentos", calcA.investimento, calcB.investimento],
        ["Saldo", calcA.saldo, calcB.saldo],
      ];
      return r.map(([nome, x, y]) => ({ nome, x, y }));
    }
    const mapa = {};
    calcA.blocos[metrica].categorias.forEach((c) => {
      mapa[c.nome] = { nome: c.nome, x: c.realTotal, y: 0 };
    });
    calcB.blocos[metrica].categorias.forEach((c) => {
      mapa[c.nome] = { ...(mapa[c.nome] || { nome: c.nome, x: 0 }), y: c.realTotal };
    });
    return Object.values(mapa).filter((l) => l.x > 0 || l.y > 0).sort((p, q) => q.x + q.y - (p.x + p.y));
  }, [calcA, calcB, metrica]);

  const totalA = calcA ? total(serie(calcA)) : 0;
  const totalB = calcB ? total(serie(calcB)) : 0;
  const cor = (nome, dif) => {
    if (!dif) return themeConfig.fonts.secondary;
    const bomSobe = metrica === "Receita" || metrica === "Investimento" || metrica === "Saldo" || nome === "Receitas" || nome === "Investimentos" || nome === "Saldo";
    return (dif > 0) === bomSobe ? "#01b574" : "#fd5c70";
  };

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Comparativo entre anos" />
        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}
        {!loading && ano && a && b && (
          <>
            <VuiBox mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <FieldLabel>Ano A</FieldLabel>
                  <NativeSelect value={a} onChange={(e) => setA(Number(e.target.value))}>
                    {anos.map((x) => <option key={x} value={x}>{x}</option>)}
                  </NativeSelect>
                </Grid>
                <Grid item xs={6} md={3}>
                  <FieldLabel>Ano B</FieldLabel>
                  <NativeSelect value={b} onChange={(e) => setB(Number(e.target.value))}>
                    {anos.map((x) => <option key={x} value={x}>{x}</option>)}
                  </NativeSelect>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FieldLabel>Comparar</FieldLabel>
                  <NativeSelect value={metrica} onChange={(e) => setMetrica(e.target.value)}>
                    {METRICAS.map((m) => <option key={m.chave} value={m.chave}>{m.rotulo}</option>)}
                  </NativeSelect>
                </Grid>
              </Grid>
            </VuiBox>

            {anos.length < 2 && (
              <VuiBox mb={3}>
                <Card>
                  <VuiTypography variant="button" color="text" fontWeight="regular">
                    Só existe um ano na planilha. Use “Novo ano” para criar o próximo e comparar.
                  </VuiTypography>
                </Card>
              </VuiBox>
            )}

            {calcA && calcB ? (
              <>
                <VuiBox mb={3}>
                  <Grid container spacing={3}>
                    {[[a, totalA], [b, totalB]].map(([y, t], idx) => (
                      <Grid item xs={12} md={4} key={`${y}-${idx}`}>
                        <Card sx={{ height: "100%" }}>
                          <VuiTypography variant="caption" color="text">{METRICAS.find((m) => m.chave === metrica).rotulo} em {y}</VuiTypography>
                          <VuiTypography variant="h4" color="white" fontWeight="bold">{brl(t)}</VuiTypography>
                        </Card>
                      </Grid>
                    ))}
                    <Grid item xs={12} md={4}>
                      <Card sx={{ height: "100%" }}>
                        <VuiTypography variant="caption" color="text">Variação de {a} para {b}</VuiTypography>
                        <VuiTypography variant="h4" fontWeight="bold" sx={{ color: cor("", totalB - totalA) }}>
                          {brl(totalB - totalA)} {totalA ? `(${textoVariacao(variacao(totalB, totalA))})` : ""}
                        </VuiTypography>
                      </Card>
                    </Grid>
                  </Grid>
                </VuiBox>

                <VuiBox mb={3}>
                  <Card>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">Mês a mês</VuiTypography>
                    <VuiBox sx={{ height: "320px" }}>
                      <ComparativoChart rotulos={MESES} estimado={serie(calcA)} real={serie(calcB)} legendas={[String(a), String(b)]} />
                    </VuiBox>
                  </Card>
                </VuiBox>

                <Card sx={{ mb: 3 }}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="12px">{metrica === "Saldo" ? "Resumo" : "Por categoria"}</VuiTypography>
                  <VuiBox sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                      <thead>
                        <tr>
                          <th style={{ ...th, textAlign: "left" }}>{metrica === "Saldo" ? "Item" : "Categoria"}</th>
                          <th style={th}>{a}</th>
                          <th style={th}>{b}</th>
                          <th style={th}>Diferença</th>
                          <th style={th}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>Sem dados nos dois anos.</td></tr>}
                        {linhas.map((l) => (
                          <tr key={l.nome} style={{ borderBottom: BORDA }}>
                            <td style={{ ...td, textAlign: "left" }}>{l.nome}</td>
                            <td style={td}>{brl(l.x)}</td>
                            <td style={td}>{brl(l.y)}</td>
                            <td style={{ ...td, color: cor(l.nome, l.y - l.x) }}>{brl(l.y - l.x)}</td>
                            <td style={{ ...td, color: cor(l.nome, l.y - l.x) }}>{l.x ? textoVariacao(variacao(l.y, l.x)) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </VuiBox>
                </Card>
              </>
            ) : (
              <VuiTypography variant="button" color="text">Carregando os anos escolhidos…</VuiTypography>
            )}
          </>
        )}
      </VuiBox>
    </DashboardLayout>
  );
}

export default Comparativo;
