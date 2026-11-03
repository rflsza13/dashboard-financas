import { useMemo, useState } from "react";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiProgress from "components/VuiProgress";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import RecorrenciaDialog from "components/Finance/RecorrenciaDialog";
import { ComparativoChart } from "layouts/dashboard/components/FinanceCharts";

import { IoAdd, IoPencil, IoTrash, IoPause, IoPlay } from "react-icons/io5";

import { useFinance } from "context/finance";
import {
  MESES,
  MESES_LONGOS,
  brl,
  fimRecorrencia,
  mesAtual,
  projecaoRecorrencias,
  statusRecorrencia,
} from "utils/finance";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = {
  padding: "8px",
  fontSize: 12,
  fontWeight: 500,
  color: themeConfig.fonts.secondary,
  borderBottom: BORDA,
  textAlign: "right",
  whiteSpace: "nowrap",
};
const td = { padding: "8px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right" };
const ROTULO_ESTADO = { ativa: "Ativa", futura: "Começa depois", encerrada: "Encerrada", pausada: "Pausada", invalida: "Início inválido" };
const COR_ESTADO = { ativa: "#01b574", futura: "#8f9bff", encerrada: "#a0aec0", pausada: "#ffb547", invalida: "#fd5c70" };

function Recorrencias() {
  const {
    loading,
    ano,
    itensAno,
    recorrencias,
    criarRecorrencia,
    atualizarRecorrencia,
    excluirRecorrencia,
  } = useFinance();
  const [dialog, setDialog] = useState({ aberto: false, rec: null });

  const hoje = new Date();
  const anoRef = ano || hoje.getFullYear();
  const mesRef = ano === hoje.getFullYear() || !ano ? mesAtual() : 0;

  const linhas = useMemo(
    () =>
      recorrencias.map((rec) => ({
        rec,
        status: statusRecorrencia(rec, anoRef, mesRef),
        fim: fimRecorrencia(rec),
      })),
    [recorrencias, anoRef, mesRef]
  );

  const projecao = useMemo(() => projecaoRecorrencias(recorrencias, anoRef, mesRef, 12), [recorrencias, anoRef, mesRef]);
  const totalFuturoDespesa = linhas
    .filter((l) => l.rec.bloco === "Despesa" && l.status.totalRestante)
    .reduce((a, l) => a + l.status.totalRestante, 0);
  const parcelasMes = projecao[0] ? projecao[0].despesa : 0;

  const fechar = () => setDialog((d) => ({ ...d, aberto: false }));
  const salvar = async (dados) => {
    const res = dialog.rec ? { ok: await atualizarRecorrencia(dados) } : await criarRecorrencia(dados);
    if (res.ok) fechar();
    return res;
  };
  const excluir = async (rec) => {
    if (window.confirm(`Excluir a recorrência “${rec.nome}”? Os valores já lançados no realizado não mudam.`)) {
      await excluirRecorrencia(rec.id);
    }
  };
  const alternar = (rec) => atualizarRecorrencia({ ...rec, ativa: !rec.ativa });

  const icone = (titulo, fn, children, extra = {}) => (
    <span
      role="button"
      tabIndex={0}
      title={titulo}
      onClick={fn}
      onKeyDown={(e) => e.key === "Enter" && fn()}
      style={{ cursor: "pointer", color: themeConfig.fonts.secondary, marginLeft: 10, ...extra }}
    >
      {children}
    </span>
  );

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Recorrências e parcelamentos">
          <VuiButton
            size="small"
            color="info"
            variant="contained"
            disabled={!ano}
            onClick={() => setDialog({ aberto: true, rec: null })}
          >
            <IoAdd size="14px" style={{ marginRight: 4 }} />
            Nova recorrência
          </VuiButton>
        </YearBar>

        {loading && (
          <VuiTypography variant="button" color="text">
            Carregando planilha…
          </VuiTypography>
        )}

        {!loading && ano && (
          <>
            <VuiBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="caption" color="text">
                      Parcelas de despesa em {MESES_LONGOS[mesRef]}
                    </VuiTypography>
                    <VuiTypography variant="h4" color="white" fontWeight="bold">
                      {brl(parcelasMes)}
                    </VuiTypography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="caption" color="text">
                      Ainda a pagar em parcelas (despesas com fim definido)
                    </VuiTypography>
                    <VuiTypography variant="h4" color="white" fontWeight="bold">
                      {brl(totalFuturoDespesa)}
                    </VuiTypography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="caption" color="text">
                      Recorrências ativas
                    </VuiTypography>
                    <VuiTypography variant="h4" color="white" fontWeight="bold">
                      {linhas.filter((l) => l.status.estado === "ativa").length}
                    </VuiTypography>
                  </Card>
                </Grid>
              </Grid>
            </VuiBox>

            <Card sx={{ mb: 3 }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                Todas as recorrências
              </VuiTypography>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "12px" }}>
                Situação calculada para {MESES_LONGOS[mesRef]} de {anoRef}. Cada parcela entra no estimado do item
                escolhido.
              </VuiTypography>
              {linhas.length === 0 ? (
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Nenhuma recorrência cadastrada. Use “Nova recorrência” para cadastrar um parcelamento (ex.: 4/10)
                  ou uma conta fixa.
                </VuiTypography>
              ) : (
                <VuiBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left" }}>Nome</th>
                        <th style={{ ...th, textAlign: "left" }}>Item</th>
                        <th style={th}>Valor</th>
                        <th style={{ ...th, minWidth: 150 }}>Progresso</th>
                        <th style={th}>Restante</th>
                        <th style={th}>Termina em</th>
                        <th style={th}>Situação</th>
                        <th style={{ ...th, width: 110 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map(({ rec, status, fim }) => {
                        const total = Number(rec.parcelas) || null;
                        const feitas = status.numero && total ? Math.min(status.numero, total) : 0;
                        return (
                          <tr key={rec.id} style={{ borderBottom: BORDA }}>
                            <td style={{ ...td, textAlign: "left" }}>
                              {rec.nome}
                              {rec.obs && (
                                <span style={{ display: "block", fontSize: 11, color: themeConfig.fonts.secondary }}>
                                  {rec.obs}
                                </span>
                              )}
                            </td>
                            <td style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>
                              {rec.bloco} · {rec.categoria} — {rec.item}
                            </td>
                            <td style={td}>{brl(rec.valor)}</td>
                            <td style={td}>
                              {total ? (
                                <>
                                  <VuiTypography variant="caption" color="white" sx={{ display: "block" }}>
                                    {status.numero ? `${feitas}/${total}` : `0/${total}`}
                                  </VuiTypography>
                                  <VuiProgress
                                    value={Math.min(100, (feitas / total) * 100)}
                                    color="info"
                                    sx={{ background: "rgba(255, 255, 255, 0.12)" }}
                                  />
                                </>
                              ) : (
                                <VuiTypography variant="caption" color="text">
                                  sem fim
                                </VuiTypography>
                              )}
                            </td>
                            <td style={td}>
                              {status.totalRestante !== null && status.totalRestante !== undefined
                                ? `${brl(status.totalRestante)} (${status.restantes}x)`
                                : "—"}
                            </td>
                            <td style={td}>{fim ? `${MESES[fim.mes]}/${fim.ano}` : "—"}</td>
                            <td style={{ ...td, color: COR_ESTADO[status.estado] }}>{ROTULO_ESTADO[status.estado]}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>
                              {icone(
                                rec.ativa ? "Pausar" : "Retomar",
                                () => alternar(rec),
                                rec.ativa ? <IoPause size="14px" /> : <IoPlay size="14px" />
                              )}
                              {icone("Editar", () => setDialog({ aberto: true, rec }), <IoPencil size="14px" />)}
                              {icone("Excluir", () => excluir(rec), <IoTrash size="14px" />)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </VuiBox>
              )}
            </Card>

            <Card sx={{ mb: 3 }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                Compromissos dos próximos 12 meses
              </VuiTypography>
              <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                Soma das parcelas de despesa já cadastradas, mês a mês (receitas recorrentes em comparação)
              </VuiTypography>
              <VuiBox sx={{ height: "300px" }}>
                <ComparativoChart
                  rotulos={projecao.map((p) => `${MESES[p.mes]}/${String(p.ano).slice(2)}`)}
                  estimado={projecao.map((p) => p.receita)}
                  real={projecao.map((p) => p.despesa)}
                  legendas={["Receitas recorrentes", "Parcelas de despesa"]}
                />
              </VuiBox>
            </Card>
          </>
        )}
      </VuiBox>

      <RecorrenciaDialog
        aberto={dialog.aberto}
        rec={dialog.rec}
        itens={itensAno}
        ano={ano}
        onFechar={fechar}
        onSalvar={salvar}
      />
    </DashboardLayout>
  );
}

export default Recorrencias;
