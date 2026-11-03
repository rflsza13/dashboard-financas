import { useMemo, useState } from "react";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiProgress from "components/VuiProgress";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import { NativeSelect } from "layouts/dashboard/components/fields";
import { ComparativoChart } from "layouts/dashboard/components/FinanceCharts";
import EditableValor from "components/Finance/EditableValor";

import { useFinance } from "context/finance";
import { GRUPOS, MESES, MESES_LONGOS, brl, distribuicao503020, grupoPadrao, norm, pct, progressoMetas } from "utils/finance";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = { padding: "8px", fontSize: 12, fontWeight: 500, color: themeConfig.fonts.secondary, borderBottom: BORDA, textAlign: "right", whiteSpace: "nowrap" };
const td = { padding: "6px 8px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right" };
const COR_ESTADO = { ok: "#01b574", atencao: "#ffb547", estourou: "#fd5c70" };
const ROTULO_ESTADO = { ok: "Dentro da meta", atencao: "Atenção", estourou: "Estourou" };

function Orcamento() {
  const { loading, ano, mes, selecionarMes, calc, metas, classificacao, salvarLinhas, excluirLinhas } = useFinance();
  const [escopo, setEscopo] = useState("mes");

  const progresso = useMemo(() => progressoMetas(calc, metas, mes), [calc, metas, mes]);
  const porNome = useMemo(() => {
    const o = {};
    progresso.forEach((p) => {
      o[norm(p.categoria)] = p;
    });
    return o;
  }, [progresso]);
  const metaDe = (nome) => metas.find((m) => norm(m.id) === norm(nome));
  const categorias = calc.blocos.Despesa.categorias;

  const salvarMeta = (nome, valor) =>
    valor > 0 ? salvarLinhas("metas", [{ id: nome, limite: valor }]) : excluirLinhas("metas", [(metaDe(nome) || { id: nome }).id]);

  const dist = useMemo(() => distribuicao503020(calc, classificacao, escopo === "mes" ? mes : null), [calc, classificacao, escopo, mes]);
  const grupoDe = (nome) => {
    const c = classificacao.find((x) => norm(x.id) === norm(nome));
    return c && GRUPOS.includes(c.grupo) ? { grupo: c.grupo, padrao: false } : { grupo: grupoPadrao(nome), padrao: true };
  };

  const comMeta = progresso;
  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Orçamento">
          <VuiBox sx={{ minWidth: 130 }}>
            <NativeSelect value={mes} aria-label="Mês" onChange={(e) => selecionarMes(Number(e.target.value))}>
              {MESES_LONGOS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </NativeSelect>
          </VuiBox>
        </YearBar>

        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}

        {!loading && ano && (
          <>
            <Card sx={{ mb: 3 }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
                Metas por categoria · {MESES_LONGOS[mes]}
              </VuiTypography>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "12px" }}>
                Clique em “Definir” para fixar um limite mensal. Zero remove a meta. Alerta a partir de 80% do limite.
              </VuiTypography>
              <VuiBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: "left" }}>Categoria</th>
                      <th style={th}>Meta mensal</th>
                      <th style={th}>Gasto no mês</th>
                      <th style={{ ...th, minWidth: 160 }}>Uso da meta</th>
                      <th style={th}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 && (
                      <tr><td colSpan={5} style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>Nenhuma categoria de despesa na planilha.</td></tr>
                    )}
                    {categorias.map((c) => {
                      const meta = metaDe(c.nome);
                      const p = porNome[norm(c.nome)];
                      return (
                        <tr key={c.nome} style={{ borderBottom: BORDA }}>
                          <td style={{ ...td, textAlign: "left" }}>{c.nome}</td>
                          <td style={td}>
                            <EditableValor valor={meta ? Number(meta.limite) : 0} vazio="Definir" onSalvar={(v) => salvarMeta(c.nome, v)} />
                          </td>
                          <td style={td}>{brl(c.real[mes])}</td>
                          <td style={td}>
                            {p ? (
                              <>
                                <VuiTypography variant="caption" color="white" sx={{ display: "block" }}>{pct(p.ratio)}</VuiTypography>
                                <VuiProgress value={Math.min(100, p.ratio * 100)} color={p.estado === "estourou" ? "error" : p.estado === "atencao" ? "warning" : "success"} sx={{ background: "rgba(255, 255, 255, 0.12)" }} />
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{ ...td, color: p ? COR_ESTADO[p.estado] : themeConfig.fonts.secondary }}>{p ? ROTULO_ESTADO[p.estado] : "Sem meta"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </VuiBox>
              {comMeta.length > 0 && (
                <>
                  <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block", mt: "20px", mb: "8px" }}>
                    Meta × gasto
                  </VuiTypography>
                  <VuiBox sx={{ height: `${Math.max(200, comMeta.length * 48)}px` }}>
                    <ComparativoChart horizontal rotulos={comMeta.map((p) => p.categoria)} estimado={comMeta.map((p) => p.limite)} real={comMeta.map((p) => p.real)} legendas={["Meta", "Gasto"]} />
                  </VuiBox>
                </>
              )}
            </Card>

            <Card sx={{ mb: 3 }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="8px" mb="4px">
                <VuiTypography variant="lg" color="white" fontWeight="bold">Regra 50/30/20</VuiTypography>
                <VuiBox display="flex" gap="8px">
                  <VuiButton size="small" color="info" variant={escopo === "mes" ? "contained" : "outlined"} onClick={() => setEscopo("mes")}>{MESES[mes]}</VuiButton>
                  <VuiButton size="small" color="info" variant={escopo === "ano" ? "contained" : "outlined"} onClick={() => setEscopo("ano")}>Ano todo</VuiButton>
                </VuiBox>
              </VuiBox>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "12px" }}>
                Ideal: 50% da receita em necessidades, 30% em desejos e 20% em poupança (investimentos).
              </VuiTypography>
              {dist.receita <= 0 ? (
                <VuiTypography variant="button" color="text" fontWeight="regular">Sem receita realizada no período para calcular.</VuiTypography>
              ) : (
                <Grid container spacing={2}>
                  {GRUPOS.map((g) => {
                    const valor = dist.totais[g];
                    const real = valor / dist.receita;
                    const alvo = dist.metas[g];
                    const bom = g === "Poupança" ? real >= alvo : real <= alvo;
                    return (
                      <Grid item xs={12} md={4} key={g}>
                        <VuiBox sx={{ border: BORDA, borderRadius: "16px", p: 2 }}>
                          <VuiTypography variant="caption" color="text">{g} · ideal {pct(alvo)}</VuiTypography>
                          <VuiTypography variant="h4" color="white" fontWeight="bold">{pct(real)}</VuiTypography>
                          <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "6px" }}>{brl(valor)}</VuiTypography>
                          <VuiProgress value={Math.min(100, real * 100)} color={bom ? "success" : "warning"} sx={{ background: "rgba(255, 255, 255, 0.12)" }} />
                          <VuiTypography variant="caption" sx={{ display: "block", mt: "6px", color: bom ? "#01b574" : "#ffb547" }}>
                            {bom ? "Dentro do ideal" : `${g === "Poupança" ? "Faltam" : "Excede em"} ${brl(Math.abs(valor - alvo * dist.receita))}`}
                          </VuiTypography>
                        </VuiBox>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
              <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block", mt: "20px", mb: "8px" }}>
                Classificação das categorias de despesa
              </VuiTypography>
              <VuiBox display="flex" flexWrap="wrap" gap="12px">
                {categorias.map((c) => {
                  const g = grupoDe(c.nome);
                  return (
                    <VuiBox key={c.nome} sx={{ minWidth: 220 }}>
                      <VuiTypography variant="caption" color="text">
                        {c.nome}
                        {g.padrao ? " (padrão)" : ""}
                      </VuiTypography>
                      <NativeSelect value={g.grupo} aria-label={`Grupo de ${c.nome}`} onChange={(e) => salvarLinhas("classificacao", [{ id: c.nome, grupo: e.target.value }])}>
                        <option value="Necessidades">Necessidades</option>
                        <option value="Desejos">Desejos</option>
                      </NativeSelect>
                    </VuiBox>
                  );
                })}
              </VuiBox>
            </Card>
          </>
        )}
      </VuiBox>
    </DashboardLayout>
  );
}

export default Orcamento;
