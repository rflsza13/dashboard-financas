import { useMemo, useState } from "react";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import { FieldLabel, NativeSelect } from "layouts/dashboard/components/fields";
import { LinhasChart } from "layouts/dashboard/components/FinanceCharts";
import { parseValor } from "components/Finance/EditableValor";
import VuiInput from "components/VuiInput";

import { useFinance } from "context/finance";
import { brl, statusRecorrencia } from "utils/finance";
import { projetarCenario } from "utils/cenarios";
import { misturar } from "utils/tema";
import themeConfig from "themeConfig";
import { corSaldoEfetiva } from "utils/config";

function Slider({ rotulo, valor, onChange, min, max, passo, sufixo }) {
  return (
    <VuiBox mb={2}>
      <VuiBox display="flex" justifyContent="space-between">
        <FieldLabel>{rotulo}</FieldLabel>
        <VuiTypography variant="button" color="white" fontWeight="medium">{valor > 0 && sufixo === "%" ? "+" : ""}{valor}{sufixo}</VuiTypography>
      </VuiBox>
      <input type="range" min={min} max={max} step={passo} value={valor} aria-label={rotulo} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: themeConfig.primary }} />
    </VuiBox>
  );
}

function Cenarios() {
  const { loading, ano, calc, recorrencias, cartoes, compras, config } = useFinance();
  const [receitaPct, setReceitaPct] = useState(0);
  const [despesaPct, setDespesaPct] = useState(0);
  const [aporteTxt, setAporteTxt] = useState("0");
  const [quitarId, setQuitarId] = useState("");
  const [quitarMes, setQuitarMes] = useState(1);

  const aporteExtra = parseValor(aporteTxt) || 0;
  const hoje = new Date();
  const candidatas = useMemo(
    () => recorrencias.filter((r) => r.bloco === "Despesa" && Number(r.parcelas) > 0 && statusRecorrencia(r, ano || hoje.getFullYear(), hoje.getMonth()).estado === "ativa"),
    [recorrencias, ano]
  );

  const r = useMemo(
    () => projetarCenario({ calc, ano, recorrencias, cartoes, compras, receitaPct, despesaPct, aporteExtra, quitar: quitarId ? { id: quitarId, mes: quitarMes } : null }),
    [calc, ano, recorrencias, cartoes, compras, receitaPct, despesaPct, aporteExtra, quitarId, quitarMes]
  );

  const series = useMemo(
    () => [
      { nome: "Saldo acumulado — hoje", dados: r.meses.map((m) => Math.round(m.acumBase)), cor: misturar(themeConfig.primary, "#ffffff", 0.6), tracejada: true },
      { nome: "Saldo acumulado — cenário", dados: r.meses.map((m) => Math.round(m.acumCen)), cor: corSaldoEfetiva(config) },
    ],
    [r, config]
  );
  const rotulos = r.meses.map((m) => m.rotulo);

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Cenários" />
        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}
        {!loading && ano && (
          <Grid container spacing={3}>
            <Grid item xs={12} xl={4}>
              <Card>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">Simulador</VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "16px" }}>
                  Projeta os próximos 12 meses. Base: média dos últimos 3 meses realizados, mais as parcelas e faturas já cadastradas.
                </VuiTypography>
                <Slider rotulo="Variação das receitas" valor={receitaPct} onChange={setReceitaPct} min={-50} max={50} passo={1} sufixo="%" />
                <Slider rotulo="Variação das despesas (sem parcelas)" valor={despesaPct} onChange={setDespesaPct} min={-50} max={50} passo={1} sufixo="%" />
                <VuiBox mb={2}>
                  <FieldLabel>Aporte extra por mês (R$)</FieldLabel>
                  <VuiInput fullWidth value={aporteTxt} onChange={(e) => setAporteTxt(e.target.value)} inputProps={{ inputMode: "decimal" }} />
                </VuiBox>
                <VuiBox mb={2}>
                  <FieldLabel>Quitar uma dívida parcelada antes</FieldLabel>
                  <NativeSelect value={quitarId} onChange={(e) => setQuitarId(e.target.value)}>
                    <option value="">Nenhuma</option>
                    {candidatas.map((c) => <option key={c.id} value={c.id}>{c.nome} ({brl(c.valor)}/mês)</option>)}
                  </NativeSelect>
                </VuiBox>
                {quitarId && <Slider rotulo="Quitar daqui a (meses)" valor={quitarMes} onChange={setQuitarMes} min={1} max={12} passo={1} sufixo="" />}
              </Card>
            </Grid>
            <Grid item xs={12} xl={8}>
              {!r.temBase ? (
                <Card>
                  <VuiTypography variant="button" color="text" fontWeight="regular">
                    Ainda não há valores realizados suficientes para projetar. Lance alguns meses na página Planilha ou no Resumo mensal.
                  </VuiTypography>
                </Card>
              ) : (
                <>
                  <VuiBox mb={3}>
                    <Grid container spacing={3}>
                      {[
                        ["Em 12 meses, hoje", brl(r.meses[11].acumBase)],
                        ["Em 12 meses, cenário", brl(r.meses[11].acumCen)],
                        ["Diferença", `${r.diferencaFinal >= 0 ? "+" : ""}${brl(r.diferencaFinal)}`],
                      ].map(([t, v]) => (
                        <Grid item xs={12} md={4} key={t}>
                          <Card sx={{ height: "100%" }}>
                            <VuiTypography variant="caption" color="text">{t}</VuiTypography>
                            <VuiTypography variant="h4" fontWeight="bold" sx={{ color: t === "Diferença" ? (r.diferencaFinal >= 0 ? "#01b574" : "#fd5c70") : "#fff" }}>{v}</VuiTypography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </VuiBox>
                  <Card>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">Saldo acumulado projetado</VuiTypography>
                    <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                      Receita base {brl(r.receitaBase)} · despesa variável {brl(Math.max(r.despesaVarBase, 0))} · investimento {brl(r.investBase)} por mês
                      {r.investExtraTotal > 0 ? ` · aportes extras somam ${brl(r.investExtraTotal)} em 12 meses` : ""}
                    </VuiTypography>
                    <VuiBox sx={{ height: "340px" }}>
                      <LinhasChart rotulos={rotulos} series={series} />
                    </VuiBox>
                  </Card>
                </>
              )}
            </Grid>
          </Grid>
        )}
      </VuiBox>
    </DashboardLayout>
  );
}

export default Cenarios;
