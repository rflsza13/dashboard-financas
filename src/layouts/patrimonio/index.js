import { useMemo, useState } from "react";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid";
import { v4 as uuidv4 } from "uuid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import YearBar from "layouts/dashboard/components/YearBar";
import { EmpilhadoChart, LinhasChart } from "layouts/dashboard/components/FinanceCharts";
import EditableValor from "components/Finance/EditableValor";
import FormDialog from "components/Finance/FormDialog";
import IconeAcao from "components/Finance/IconeAcao";

import { IoAdd, IoPencil, IoTrash, IoWallet, IoTrendingUp, IoTrendingDown } from "react-icons/io5";

import { useFinance } from "context/finance";
import { MESES, brl, inicioTexto, saldosDoAno, textoVariacao, variacao } from "utils/finance";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = { padding: "8px 4px", fontSize: 12, fontWeight: 500, color: themeConfig.fonts.secondary, borderBottom: BORDA, textAlign: "right", whiteSpace: "nowrap" };
const td = { padding: "2px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right", whiteSpace: "nowrap" };
const TIPOS = ["Conta", "Investimento", "Imóvel", "Outro", "Dívida"];

const campos = [
  { chave: "nome", rotulo: "Nome da conta", tipo: "texto", obrigatorio: true, tamanho: 40 },
  { chave: "tipo", rotulo: "Tipo", tipo: "select", opcoes: TIPOS.map((t) => ({ valor: t, rotulo: t === "Dívida" ? "Dívida (subtrai do patrimônio)" : t })), largura: 6 },
  { chave: "ativa", rotulo: "Situação", tipo: "select", tipoValor: "booleano", opcoes: [{ valor: "1", rotulo: "Ativa" }, { valor: "0", rotulo: "Encerrada" }], largura: 6 },
];

function Patrimonio() {
  const { loading, ano, contas, saldos, salvarLinhas, excluirLinhas } = useFinance();
  const [dlg, setDlg] = useState({ aberto: false, conta: null });

  const linhas = useMemo(() => saldosDoAno(contas, saldos, ano || new Date().getFullYear()), [contas, saldos, ano]);
  const sinal = (conta) => (conta.tipo === "Dívida" ? -1 : 1);
  const totais = useMemo(
    () =>
      MESES.map((_, m) => {
        let ativos = 0;
        let dividas = 0;
        linhas.forEach(({ conta, meses }) => {
          const v = meses[m].valor || 0;
          if (conta.tipo === "Dívida") dividas += v;
          else ativos += v;
        });
        return { ativos, dividas, liquido: ativos - dividas };
      }),
    [linhas]
  );
  let ultimo = -1;
  linhas.forEach(({ meses }) => meses.forEach((x, m) => x.registrado && (ultimo = Math.max(ultimo, m))));
  const atual = ultimo >= 0 ? totais[ultimo] : null;
  const anterior = ultimo > 0 ? totais[ultimo - 1] : null;
  const inicio = ultimo >= 0 ? totais[0] : null;

  const ativosSeries = linhas.filter((l) => l.conta.tipo !== "Dívida" && l.conta.ativa !== false).map((l) => ({ nome: l.conta.nome, dados: l.meses.map((x) => x.valor || 0) }));
  const liquidoSerie = [{ nome: "Patrimônio líquido", dados: totais.map((t, i) => (i <= Math.max(ultimo, 0) ? t.liquido : null)), cor: themeConfig.primary }];

  const inicial = useMemo(() => (dlg.conta ? { ...dlg.conta, ativa: dlg.conta.ativa === false ? "0" : "1" } : { tipo: "Conta", ativa: "1" }), [dlg]);
  const salvar = async (v) => {
    const ok = await salvarLinhas("contas", [{ id: dlg.conta ? dlg.conta.id : uuidv4().slice(0, 10), nome: v.nome, tipo: v.tipo, ativa: v.ativa }]);
    if (ok) setDlg({ aberto: false, conta: null });
    return { ok };
  };
  const excluir = async (conta) => {
    if (!window.confirm(`Excluir a conta “${conta.nome}” e todos os saldos dela?`)) return;
    await excluirLinhas("saldos", saldos.filter((s) => s.id.startsWith(`${conta.id}|`)).map((s) => s.id));
    await excluirLinhas("contas", [conta.id]);
  };
  const salvarSaldo = (conta, m, valor) => salvarLinhas("saldos", [{ id: `${conta.id}|${inicioTexto(ano, m)}`, valor }]);

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo={`Patrimônio ${ano || ""}`}>
          <VuiButton size="small" color="info" variant="contained" disabled={!ano} onClick={() => setDlg({ aberto: true, conta: null })}>
            <IoAdd size="14px" style={{ marginRight: 4 }} />
            Nova conta
          </VuiButton>
        </YearBar>

        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}

        {!loading && ano && (
          <>
            <VuiBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <MiniStatisticsCard
                    title={{ text: ultimo >= 0 ? `patrimônio líquido em ${MESES[ultimo]}` : "patrimônio líquido" }}
                    count={atual ? brl(atual.liquido) : "—"}
                    percentage={{ color: "success", text: atual && anterior && anterior.liquido ? `${textoVariacao(variacao(atual.liquido, anterior.liquido))} vs mês anterior` : "" }}
                    icon={{ color: "info", component: <IoWallet size="22px" color="white" /> }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <MiniStatisticsCard
                    title={{ text: "ativos (contas e investimentos)" }}
                    count={atual ? brl(atual.ativos) : "—"}
                    percentage={{ color: "success", text: atual && inicio && inicio.ativos ? `${textoVariacao(variacao(atual.ativos, inicio.ativos))} desde janeiro` : "" }}
                    icon={{ color: "info", component: <IoTrendingUp size="22px" color="white" /> }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <MiniStatisticsCard
                    title={{ text: "dívidas registradas" }}
                    count={atual ? brl(atual.dividas) : "—"}
                    percentage={{ color: "error", text: "" }}
                    icon={{ color: "info", component: <IoTrendingDown size="22px" color="white" /> }}
                  />
                </Grid>
              </Grid>
            </VuiBox>

            <Card sx={{ mb: 3 }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">Saldos por conta</VuiTypography>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "12px" }}>
                Informe o saldo no fim de cada mês (clique na célula). Meses sem registro repetem o último saldo, em cinza.
              </VuiTypography>
              {contas.length === 0 ? (
                <VuiTypography variant="button" color="text" fontWeight="regular">Nenhuma conta cadastrada. Use “Nova conta” (conta corrente, corretora, imóvel, financiamento...).</VuiTypography>
              ) : (
                <VuiBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left", minWidth: 150 }}>Conta</th>
                        {MESES.map((m) => <th key={m} style={th}>{m}</th>)}
                        <th style={{ ...th, width: 64 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map(({ conta, meses }) => (
                        <tr key={conta.id} style={{ borderBottom: BORDA, opacity: conta.ativa === false ? 0.6 : 1 }}>
                          <td style={{ ...td, textAlign: "left", padding: "6px 4px" }}>
                            {conta.nome}
                            <span style={{ display: "block", fontSize: 11, color: themeConfig.fonts.secondary }}>{conta.tipo}{sinal(conta) < 0 ? " · subtrai" : ""}</span>
                          </td>
                          {meses.map((x, m) => (
                            <td key={MESES[m]} style={td}>
                              <EditableValor largura={74} valor={x.valor || 0} cor={x.registrado ? themeConfig.fonts.primary : "#7d8798"} onSalvar={(v) => salvarSaldo(conta, m, v)} />
                            </td>
                          ))}
                          <td style={{ ...td, textAlign: "center" }}>
                            <IconeAcao titulo="Editar conta" onClick={() => setDlg({ aberto: true, conta })}><IoPencil size="13px" /></IconeAcao>
                            <IconeAcao titulo="Excluir conta" onClick={() => excluir(conta)}><IoTrash size="13px" /></IconeAcao>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ ...td, textAlign: "left", fontWeight: 700, padding: "8px 4px" }}>Patrimônio líquido</td>
                        {totais.map((t, m) => <td key={MESES[m]} style={{ ...td, fontWeight: 700, padding: "8px 6px" }}>{m <= ultimo ? brl(t.liquido) : "—"}</td>)}
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </VuiBox>
              )}
            </Card>

            {ultimo >= 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} xl={7}>
                  <Card>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">Ativos por conta</VuiTypography>
                    <VuiBox sx={{ height: "300px" }}>
                      <EmpilhadoChart rotulos={MESES} series={ativosSeries} />
                    </VuiBox>
                  </Card>
                </Grid>
                <Grid item xs={12} xl={5}>
                  <Card>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">Evolução do patrimônio líquido</VuiTypography>
                    <VuiBox sx={{ height: "300px" }}>
                      <LinhasChart rotulos={MESES} series={liquidoSerie} />
                    </VuiBox>
                  </Card>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </VuiBox>

      <FormDialog aberto={dlg.aberto} titulo={dlg.conta ? "Editar conta" : "Nova conta"} campos={campos} inicial={inicial} onFechar={() => setDlg({ aberto: false, conta: null })} onSalvar={salvar} />
    </DashboardLayout>
  );
}

export default Patrimonio;
