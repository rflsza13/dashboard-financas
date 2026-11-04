import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";

import {
  IoWallet,
  IoTrendingUp,
  IoTrendingDown,
  IoStatsChart,
  IoWarning,
  IoInformationCircle,
  IoAlertCircle,
  IoCheckmarkCircle,
  IoEllipseOutline,
} from "react-icons/io5";

import { useFinance } from "context/finance";
import { MESES_LONGOS, brl, pct, gerarAlertas, listarVencimentos, textoVariacao, variacao } from "utils/finance";
import themeConfig from "themeConfig";
import { corSaldoEfetiva } from "utils/config";

import YearBar from "layouts/dashboard/components/YearBar";
import {
  FluxoMensalChart,
  CategoriasChart,
  RoscaChart,
  RealEstimadoChart,
} from "layouts/dashboard/components/FinanceCharts";

const ICONE_ALERTA = {
  error: <IoAlertCircle size="18px" color="#E31A1A" />,
  warning: <IoWarning size="18px" color="#F6AD55" />,
  info: <IoInformationCircle size="18px" color={themeConfig.accent} />,
};

const cel = { py: "8px", px: "8px", textAlign: "right", fontSize: "13px" };

function Dashboard() {
  const { loading, ano, calc, config, recursos, selecionarMes, metas, recorrencias, cartoes, compras, pagos, marcarPago } = useFinance();
  const history = useHistory();

  const cores = useMemo(
    () => ({ receitas: config.corReceitas, despesas: config.corDespesas, saldo: corSaldoEfetiva(config) }),
    [config.corReceitas, config.corDespesas, config.corSaldo]
  );
  const alertas = useMemo(() => gerarAlertas(calc, ano, metas), [calc, ano, metas]);
  const vencimentos = useMemo(
    () => listarVencimentos({ recorrencias, cartoes, compras, pagos }),
    [recorrencias, cartoes, compras, pagos]
  );

  const ult = calc.ultimoMes;
  const ant = ult - 1;
  const varDe = (bloco) =>
    ult >= 1 ? textoVariacao(variacao(calc.blocos[bloco].real[ult], calc.blocos[bloco].real[ant])) : "";
  const mesRef = ult >= 0 ? MESES_LONGOS[ult].slice(0, 3).toLowerCase() : "";

  const categoriasDespesa = useMemo(
    () => calc.blocos.Despesa.categorias.filter((c) => c.realTotal > 0).map((c) => ({ nome: c.nome, total: c.realTotal })),
    [calc]
  );
  const investimentos = useMemo(
    () =>
      calc.blocos.Investimento.categorias
        .filter((c) => c.realTotal > 0)
        .map((c) => ({ nome: c.nome, valor: c.realTotal })),
    [calc]
  );

  const abrirMes = (m) => {
    selecionarMes(m);
    history.push("/mes");
  };

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar />

        {loading && (
          <VuiTypography variant="button" color="text">
            Carregando planilha…
          </VuiTypography>
        )}

        {!loading && !ano && (
          <VuiTypography variant="button" color="text">
            Nenhuma aba de ano encontrada na planilha. Use “Novo ano” para criar a primeira.
          </VuiTypography>
        )}

        {!loading && ano && (
          <>
            <VuiBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    title={{ text: "receitas do ano" }}
                    count={brl(calc.receita)}
                    percentage={{
                      color: "success",
                      text: varDe("Receita") ? `${varDe("Receita")} em ${mesRef}` : "",
                    }}
                    icon={{ color: "info", component: <IoTrendingUp size="22px" color="white" /> }}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    title={{ text: "despesas do ano" }}
                    count={brl(calc.despesa)}
                    percentage={{
                      color: variacao(calc.blocos.Despesa.real[ult] || 0, calc.blocos.Despesa.real[ant] || 0) > 0 ? "error" : "success",
                      text: varDe("Despesa") ? `${varDe("Despesa")} em ${mesRef}` : "",
                    }}
                    icon={{ color: "info", component: <IoTrendingDown size="22px" color="white" /> }}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    title={{ text: "investimentos do ano" }}
                    count={brl(calc.investimento)}
                    percentage={{
                      color: "success",
                      text: calc.taxaInvestimento !== null ? `${pct(calc.taxaInvestimento)} da receita` : "",
                    }}
                    icon={{ color: "info", component: <IoStatsChart size="22px" color="white" /> }}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    title={{ text: "saldo do ano" }}
                    count={brl(calc.saldo)}
                    percentage={{
                      color: calc.saldo >= 0 ? "success" : "error",
                      text: calc.taxaPoupanca !== null ? `poupança ${pct(calc.taxaPoupanca)}` : "",
                    }}
                    icon={{ color: "info", component: <IoWallet size="22px" color="white" /> }}
                  />
                </Grid>
              </Grid>
            </VuiBox>

            {recursos.vencimentos && (
              <VuiBox mb={3}>
                <Card>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                    Contas a vencer
                  </VuiTypography>
                  <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px">
                    Hoje, próximos 7 dias e o que ficou atrasado neste mês. Para aparecer aqui, informe o dia do vencimento
                    na recorrência ou no cartão.
                  </VuiTypography>
                  {vencimentos.length === 0 ? (
                    <VuiTypography variant="button" color="text" fontWeight="regular">
                      Nada vencendo nos próximos dias.
                    </VuiTypography>
                  ) : (
                    vencimentos.map((v) => (
                      <VuiBox
                        key={v.chave}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap="12px"
                        py="8px"
                        sx={{ borderBottom: `1px solid ${themeConfig.cards.borderColor}`, opacity: v.pago ? 0.55 : 1 }}
                      >
                        <VuiBox display="flex" alignItems="center" gap="10px">
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={v.pago ? "Desmarcar como pago" : "Marcar como pago"}
                            onClick={() => marcarPago(v.chave, !v.pago)}
                            onKeyDown={(e) => e.key === "Enter" && marcarPago(v.chave, !v.pago)}
                            style={{ cursor: "pointer", display: "inline-flex", color: v.pago ? "#01b574" : themeConfig.fonts.secondary }}
                          >
                            {v.pago ? <IoCheckmarkCircle size="20px" /> : <IoEllipseOutline size="20px" />}
                          </span>
                          <VuiBox>
                            <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                              {v.nome}
                              {v.total ? ` · ${v.numero}/${v.total}` : ""}
                            </VuiTypography>
                            <VuiTypography variant="caption" sx={{ color: v.atrasada ? "#fd5c70" : themeConfig.fonts.secondary }}>
                              {v.atrasada ? "Atrasada · " : ""}
                              {v.bloco === "Receita" ? "a receber" : "vence"} dia {String(v.data.getDate()).padStart(2, "0")}/
                              {String(v.data.getMonth() + 1).padStart(2, "0")}
                            </VuiTypography>
                          </VuiBox>
                        </VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="bold">
                          {brl(v.valor)}
                        </VuiTypography>
                      </VuiBox>
                    ))
                  )}
                </Card>
              </VuiBox>
            )}

            {!calc.temDados && (
              <VuiBox mb={3}>
                <Card>
                  <VuiTypography variant="button" color="text" fontWeight="regular">
                    Ainda não há valores realizados em {ano}. Lance os valores na página Planilha ou na
                    página de cada mês; os gráficos aparecem assim que houver dados.
                  </VuiTypography>
                </Card>
              </VuiBox>
            )}

            {calc.temDados && (
              <>
                <VuiBox mb={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} xl={recursos.alertas ? 8 : 12}>
                      <Card>
                        <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                          Fluxo mensal
                        </VuiTypography>
                        <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                          Receitas, despesas e investimentos por mês, com o saldo acumulado
                        </VuiTypography>
                        <VuiBox sx={{ height: "320px" }}>
                          <FluxoMensalChart calc={calc} cores={cores} />
                        </VuiBox>
                      </Card>
                    </Grid>
                    {recursos.alertas && (
                      <Grid item xs={12} xl={4}>
                        <Card sx={{ height: "100%" }}>
                          <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">
                            Pontos de atenção
                          </VuiTypography>
                          {alertas.length === 0 && (
                            <VuiTypography variant="button" color="text" fontWeight="regular">
                              Sem alertas por enquanto.
                            </VuiTypography>
                          )}
                          {alertas.map((a) => (
                            <VuiBox key={a.texto} display="flex" gap="10px" alignItems="flex-start" mb={2}>
                              <VuiBox sx={{ mt: "2px", flexShrink: 0 }}>{ICONE_ALERTA[a.nivel]}</VuiBox>
                              <VuiTypography variant="button" color="text" fontWeight="regular">
                                {a.texto}
                              </VuiTypography>
                            </VuiBox>
                          ))}
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </VuiBox>

                {(recursos.categorias || recursos.investimentos) && (
                  <VuiBox mb={3}>
                    <Grid container spacing={3}>
                      {recursos.categorias && (
                        <Grid item xs={12} xl={recursos.investimentos ? 7 : 12}>
                          <Card>
                            <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                              Para onde o dinheiro vai
                            </VuiTypography>
                            <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                              Maiores categorias de despesa · média de {brl(calc.mediaDespesa)} por mês
                            </VuiTypography>
                            <VuiBox sx={{ height: "320px" }}>
                              <CategoriasChart
                                categorias={categoriasDespesa}
                                limite={Number(config.topCategorias)}
                              />
                            </VuiBox>
                          </Card>
                        </Grid>
                      )}
                      {recursos.investimentos && (
                        <Grid item xs={12} xl={recursos.categorias ? 5 : 12}>
                          <Card sx={{ height: "100%" }}>
                            <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                              Investimentos por categoria
                            </VuiTypography>
                            <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                              Total investido em {ano}
                            </VuiTypography>
                            {investimentos.length === 0 ? (
                              <VuiTypography variant="button" color="text" fontWeight="regular">
                                Nenhum investimento lançado ainda.
                              </VuiTypography>
                            ) : (
                              <VuiBox sx={{ height: "320px" }}>
                                <RoscaChart dados={investimentos} />
                              </VuiBox>
                            )}
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  </VuiBox>
                )}

                {recursos.previsto && (
                  <VuiBox mb={3}>
                    <Card>
                      <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                        Realizado × estimado
                      </VuiTypography>
                      <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                        Linha cheia é o realizado; tracejada é o estimado (previsão + parcelas
                        recorrentes)
                      </VuiTypography>
                      <VuiBox sx={{ height: "320px" }}>
                        <RealEstimadoChart calc={calc} cores={cores} />
                      </VuiBox>
                    </Card>
                  </VuiBox>
                )}

                <VuiBox mb={3}>
                  <Card>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                      Resumo por mês
                    </VuiTypography>
                    <VuiTypography variant="button" color="text" fontWeight="regular" mb="16px">
                      Clique em um mês para abrir o resumo detalhado
                    </VuiTypography>
                    <VuiBox sx={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                        <thead>
                          <tr>
                            {["Mês", "Receitas", "Despesas", "Investimentos", "Saldo", "Poupança"].map((h, i) => (
                              <th
                                key={h}
                                style={{
                                  ...cel,
                                  textAlign: i === 0 ? "left" : "right",
                                  color: themeConfig.fonts.secondary,
                                  fontWeight: 500,
                                  fontSize: 12,
                                  borderBottom: `1px solid ${themeConfig.cards.borderColor}`,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MESES_LONGOS.map((nome, m) => {
                            const r = calc.blocos.Receita.real[m];
                            const d = calc.blocos.Despesa.real[m];
                            const i = calc.blocos.Investimento.real[m];
                            return (
                              <tr
                                key={nome}
                                onClick={() => abrirMes(m)}
                                style={{ cursor: "pointer", color: themeConfig.fonts.primary }}
                              >
                                <td style={{ ...cel, textAlign: "left" }}>{nome}</td>
                                <td style={cel}>{r ? brl(r) : "—"}</td>
                                <td style={cel}>{d ? brl(d) : "—"}</td>
                                <td style={cel}>{i ? brl(i) : "—"}</td>
                                <td style={{ ...cel, color: calc.saldoReal[m] < 0 ? "#fd5c70" : undefined }}>
                                  {r || d || i ? brl(calc.saldoReal[m]) : "—"}
                                </td>
                                <td style={cel}>{r ? pct((r - d) / r) : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </VuiBox>
                  </Card>
                </VuiBox>
              </>
            )}
          </>
        )}
      </VuiBox>
    </DashboardLayout>
  );
}

export default Dashboard;
