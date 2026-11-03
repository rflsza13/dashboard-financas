import { useMemo, useState } from "react";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid";
import { v4 as uuidv4 } from "uuid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiProgress from "components/VuiProgress";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import FormDialog from "components/Finance/FormDialog";
import IconeAcao from "components/Finance/IconeAcao";

import { IoAdd, IoPencil, IoTrash } from "react-icons/io5";

import { useFinance } from "context/finance";
import { MESES, brl, pct, statusObjetivo } from "utils/finance";
import themeConfig from "themeConfig";

const ROTULO = { concluido: "Concluído", vencido: "Prazo vencido", "no-ritmo": "No ritmo", atrasado: "Abaixo do necessário", "sem-aporte": "Sem aporte definido" };
const COR = { concluido: "#01b574", vencido: "#fd5c70", "no-ritmo": "#01b574", atrasado: "#ffb547", "sem-aporte": "#a0aec0" };

const campos = [
  { chave: "nome", rotulo: "Nome do objetivo", tipo: "texto", obrigatorio: true, tamanho: 60 },
  { chave: "alvo", rotulo: "Valor alvo (R$)", tipo: "numero", obrigatorio: true, min: 0.01, largura: 6 },
  { chave: "atual", rotulo: "Já guardado (R$)", tipo: "numero", min: 0, largura: 6 },
  { chave: "prazo", rotulo: "Prazo (mês)", tipo: "mes", largura: 6 },
  { chave: "aporte", rotulo: "Aporte mensal planejado (R$)", tipo: "numero", min: 0, largura: 6 },
  { chave: "obs", rotulo: "Observações", tipo: "texto", tamanho: 120 },
];

function Objetivos() {
  const { loading, ano, objetivos, salvarLinhas, excluirLinhas } = useFinance();
  const [dlg, setDlg] = useState({ aberto: false, obj: null });
  const [dAporte, setDAporte] = useState({ aberto: false, obj: null });

  const hoje = new Date();
  const lista = useMemo(
    () => objetivos.map((obj) => ({ obj, st: statusObjetivo(obj, hoje.getFullYear(), hoje.getMonth()) })),
    [objetivos]
  );
  const totalAlvo = lista.reduce((a, l) => a + l.st.alvo, 0);
  const totalAtual = lista.reduce((a, l) => a + Math.min(l.st.atual, l.st.alvo), 0);

  const inicial = useMemo(() => (dlg.obj ? dlg.obj : { atual: "0", aporte: "0" }), [dlg]);

  const salvar = async (v) => {
    const ok = await salvarLinhas("objetivos", [
      { id: dlg.obj ? dlg.obj.id : uuidv4().slice(0, 10), nome: v.nome, alvo: v.alvo, prazo: v.prazo || "", atual: v.atual || 0, aporte: v.aporte || 0, obs: v.obs || "" },
    ]);
    if (ok) setDlg({ aberto: false, obj: null });
    return { ok };
  };

  const registrarAporte = async (v) => {
    const o = dAporte.obj;
    const ok = await salvarLinhas("objetivos", [{ ...o, atual: Math.round((Number(o.atual || 0) + v.valor) * 100) / 100 }]);
    if (ok) setDAporte({ aberto: false, obj: null });
    return { ok };
  };

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Objetivos">
          <VuiButton size="small" color="info" variant="contained" disabled={!ano} onClick={() => setDlg({ aberto: true, obj: null })}>
            <IoAdd size="14px" style={{ marginRight: 4 }} />
            Novo objetivo
          </VuiButton>
        </YearBar>

        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}

        {!loading && ano && (
          <>
            {lista.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <VuiTypography variant="caption" color="text">Total guardado em todos os objetivos</VuiTypography>
                <VuiTypography variant="h4" color="white" fontWeight="bold">
                  {brl(totalAtual)} <span style={{ fontSize: 14, color: themeConfig.fonts.secondary }}>de {brl(totalAlvo)}</span>
                </VuiTypography>
                <VuiProgress value={totalAlvo > 0 ? Math.min(100, (totalAtual / totalAlvo) * 100) : 0} color="info" sx={{ background: "rgba(255, 255, 255, 0.12)", mt: "8px" }} />
              </Card>
            )}
            {lista.length === 0 && (
              <Card>
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Nenhum objetivo ainda. Crie um (ex.: reserva de emergência, viagem, entrada do apartamento) com valor alvo, prazo e
                  aporte mensal para ver a projeção.
                </VuiTypography>
              </Card>
            )}
            <Grid container spacing={3}>
              {lista.map(({ obj, st }) => (
                <Grid item xs={12} xl={6} key={obj.id}>
                  <Card sx={{ height: "100%" }}>
                    <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" gap="8px">
                      <VuiBox>
                        <VuiTypography variant="lg" color="white" fontWeight="bold">{obj.nome}</VuiTypography>
                        <VuiTypography variant="caption" sx={{ color: COR[st.estado] }}>{ROTULO[st.estado]}</VuiTypography>
                      </VuiBox>
                      <VuiBox>
                        <IconeAcao titulo="Editar" onClick={() => setDlg({ aberto: true, obj })}><IoPencil size="14px" /></IconeAcao>
                        <IconeAcao titulo="Excluir" onClick={() => window.confirm(`Excluir “${obj.nome}”?`) && excluirLinhas("objetivos", [obj.id])}><IoTrash size="14px" /></IconeAcao>
                      </VuiBox>
                    </VuiBox>
                    <VuiTypography variant="h4" color="white" fontWeight="bold" sx={{ mt: "12px" }}>
                      {brl(st.atual)} <span style={{ fontSize: 13, color: themeConfig.fonts.secondary }}>de {brl(st.alvo)} · {pct(st.progresso)}</span>
                    </VuiTypography>
                    <VuiProgress value={st.progresso * 100} color={st.estado === "concluido" ? "success" : "info"} sx={{ background: "rgba(255, 255, 255, 0.12)", my: "8px" }} />
                    {[
                      ["Falta guardar", brl(st.restante)],
                      ["Prazo", obj.prazo ? `${MESES[Number(obj.prazo.slice(5, 7)) - 1]}/${obj.prazo.slice(0, 4)}${st.mesesAtePrazo !== null && st.mesesAtePrazo > 0 ? ` (${st.mesesAtePrazo} meses)` : ""}` : "—"],
                      ["Necessário por mês", st.necessarioMensal !== null ? brl(st.necessarioMensal) : "—"],
                      ["Aporte planejado", Number(obj.aporte) ? brl(Number(obj.aporte)) : "—"],
                      ["Previsão de conclusão", st.estado === "concluido" ? "Concluído" : st.previsao ? `${MESES[st.previsao.mes]}/${st.previsao.ano} (${st.previsao.meses} meses)` : "—"],
                    ].map(([r, v]) => (
                      <VuiBox key={r} display="flex" justifyContent="space-between" py="6px" sx={{ borderBottom: `1px solid ${themeConfig.cards.borderColor}` }}>
                        <VuiTypography variant="button" color="text" fontWeight="regular">{r}</VuiTypography>
                        <VuiTypography variant="button" color="white" fontWeight="medium">{v}</VuiTypography>
                      </VuiBox>
                    ))}
                    {obj.obs && <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "8px" }}>{obj.obs}</VuiTypography>}
                    <VuiBox mt={2}>
                      <VuiButton size="small" color="info" variant="outlined" onClick={() => setDAporte({ aberto: true, obj })}>Registrar aporte</VuiButton>
                    </VuiBox>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </VuiBox>

      <FormDialog aberto={dlg.aberto} titulo={dlg.obj ? "Editar objetivo" : "Novo objetivo"} campos={campos} inicial={inicial} onFechar={() => setDlg({ aberto: false, obj: null })} onSalvar={salvar} />
      <FormDialog
        aberto={dAporte.aberto}
        titulo="Registrar aporte"
        descricao={dAporte.obj ? `Soma ao que já foi guardado em “${dAporte.obj.nome}”.` : ""}
        campos={[{ chave: "valor", rotulo: "Valor do aporte (R$)", tipo: "numero", obrigatorio: true, min: 0.01 }]}
        inicial={null}
        onFechar={() => setDAporte({ aberto: false, obj: null })}
        onSalvar={registrarAporte}
      />
    </DashboardLayout>
  );
}

export default Objetivos;
