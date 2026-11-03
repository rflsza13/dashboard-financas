import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import Grid from "@mui/material/Grid";
import { Card } from "@mui/material";
import PropTypes from "prop-types";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import { NativeSelect } from "layouts/dashboard/components/fields";
import YearBar from "layouts/dashboard/components/YearBar";
import {
  ComparativoChart,
  RoscaChart,
} from "layouts/dashboard/components/FinanceCharts";
import EditableValor from "components/Finance/EditableValor";

import { IoWallet, IoTrendingUp, IoTrendingDown, IoStatsChart, IoCheckmarkDone, IoPrint } from "react-icons/io5";

import { useFinance } from "context/finance";
import { BLOCOS, MESES, MESES_LONGOS, brl, pct, resumoDoMes, textoVariacao } from "utils/finance";
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
const td = { padding: "6px 8px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right" };

const corDif = (bloco, dif) => {
  if (Math.abs(dif) < 0.005) return themeConfig.fonts.secondary;
  const bom = bloco === "Despesa" ? dif < 0 : dif > 0;
  return bom ? "#01b574" : "#fd5c70";
};

function TabelaBloco({ bloco, titulo, linhas, extras, itensLivres, mes, onAdicionarExtra, setCelula }) {
  const todas = [...linhas, ...extras];
  const totReal = todas.reduce((a, l) => a + l.real, 0);
  const totEst = todas.reduce((a, l) => a + l.estimado, 0);

  return (
    <Card sx={{ mb: 3 }}>
      <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
        {titulo}
      </VuiTypography>
      <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "12px" }}>
        Clique em um valor realizado para editar. O ícone ao lado copia o estimado para o realizado.
      </VuiTypography>
      <VuiBox sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>Categoria</th>
              <th style={{ ...th, textAlign: "left" }}>Item</th>
              <th style={th}>Estimado</th>
              <th style={th}>Realizado</th>
              <th style={th}>Diferença</th>
              <th style={th}>%</th>
              <th style={{ ...th, width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {todas.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>
                  Nada lançado nem estimado neste mês.
                </td>
              </tr>
            )}
            {todas.map((l) => (
              <tr key={l.id} style={{ borderBottom: BORDA }}>
                <td style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>{l.categoria}</td>
                <td style={{ ...td, textAlign: "left" }}>
                  {l.descricao}
                  {l.parcelas > 0 && (
                    <span style={{ color: themeConfig.fonts.secondary, fontSize: 11 }}>
                      {" "}
                      · inclui parcelas ({brl(l.parcelas)})
                    </span>
                  )}
                </td>
                <td style={td}>{l.estimado ? brl(l.estimado) : "—"}</td>
                <td style={td}>
                  {l.item.orfa ? (
                    brl(l.real)
                  ) : (
                    <EditableValor valor={l.real} onSalvar={(v) => setCelula(l.item, mes, "real", v)} />
                  )}
                </td>
                <td style={{ ...td, color: corDif(bloco, l.dif) }}>{l.estimado || l.real ? brl(l.dif) : "—"}</td>
                <td style={{ ...td, color: corDif(bloco, l.dif) }}>
                  {l.estimado ? textoVariacao(l.dif / l.estimado) : "—"}
                </td>
                <td style={{ ...td, padding: "6px 0" }}>
                  {!l.item.orfa && l.estimado > 0 && Math.abs(l.real - l.estimado) > 0.005 && (
                    <span
                      role="button"
                      tabIndex={0}
                      title="Usar o estimado como realizado"
                      onClick={() => setCelula(l.item, mes, "real", Math.round(l.estimado * 100) / 100)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setCelula(l.item, mes, "real", Math.round(l.estimado * 100) / 100)
                      }
                      style={{ cursor: "pointer", color: themeConfig.fonts.secondary, display: "inline-flex" }}
                    >
                      <IoCheckmarkDone size="16px" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, textAlign: "left", fontWeight: 700 }} colSpan={2}>
                Total
              </td>
              <td style={{ ...td, fontWeight: 700 }}>{brl(totEst)}</td>
              <td style={{ ...td, fontWeight: 700 }}>{brl(totReal)}</td>
              <td style={{ ...td, fontWeight: 700, color: corDif(bloco, totReal - totEst) }}>
                {brl(totReal - totEst)}
              </td>
              <td style={{ ...td, fontWeight: 700, color: corDif(bloco, totReal - totEst) }}>
                {totEst ? textoVariacao((totReal - totEst) / totEst) : "—"}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </VuiBox>
      {itensLivres.length > 0 && (
        <VuiBox mt={2} sx={{ maxWidth: 360 }}>
          <NativeSelect
            value=""
            aria-label="Lançar em outro item"
            onChange={(e) => e.target.value && onAdicionarExtra(e.target.value)}
          >
            <option value="">＋ Lançar em outro item…</option>
            {itensLivres.map((i) => (
              <option key={i.id} value={i.id}>
                {i.categoria} — {i.descricao}
              </option>
            ))}
          </NativeSelect>
        </VuiBox>
      )}
    </Card>
  );
}

TabelaBloco.propTypes = {
  bloco: PropTypes.string.isRequired,
  titulo: PropTypes.string.isRequired,
  linhas: PropTypes.array.isRequired,
  extras: PropTypes.array.isRequired,
  itensLivres: PropTypes.array.isRequired,
  mes: PropTypes.number.isRequired,
  onAdicionarExtra: PropTypes.func.isRequired,
  setCelula: PropTypes.func.isRequired,
};

function Mes() {
  const { loading, ano, mes, calc, recorrencias, cartoes, compras, selecionarMes, setCelula } = useFinance();
  const history = useHistory();
  const [extras, setExtras] = useState([]);

  useEffect(() => {
    setExtras([]);
  }, [mes, ano]);

  const r = useMemo(
    () => resumoDoMes(calc, recorrencias, ano, mes, { cartoes, compras }),
    [calc, recorrencias, ano, mes, cartoes, compras]
  );

  const linhasDo = (bloco) => {
    const base = r.tabelas[bloco];
    const ids = new Set(base.map((l) => l.id));
    const extrasBloco = extras
      .filter((id) => !ids.has(id))
      .map((id) => calc.linhas.find((l) => l.id === id))
      .filter((l) => l && l.bloco === bloco)
      .map((l) => ({
        id: l.id,
        item: l,
        categoria: l.categoria,
        descricao: l.descricao,
        real: l.real[mes],
        estimado: l.estimado[mes],
        parcelas: l.parcelas[mes],
        dif: l.real[mes] - l.estimado[mes],
      }));
    const mostrados = new Set([...ids, ...extrasBloco.map((l) => l.id)]);
    const livres = calc.blocos[bloco].linhas.filter((l) => !l.orfa && !mostrados.has(l.id));
    return { base, extrasBloco, livres };
  };

  const comparativoBlocos = useMemo(
    () => ({
      rotulos: BLOCOS.map((b) => b.titulo),
      estimado: BLOCOS.map((b) => r.totais[b.chave].est),
      real: BLOCOS.map((b) => r.totais[b.chave].real),
    }),
    [r]
  );
  const topCategorias = r.categoriasDespesa.slice(0, 8);
  const rosca = r.categoriasDespesa.filter((c) => c.real > 0).map((c) => ({ nome: c.nome, valor: c.real }));

  const maior = r.tabelas.Despesa[0];
  const dif = (b) => r.totais[b].dif;
  const kpi = (bloco, titulo, icone, corTexto) => ({
    title: { text: titulo },
    count: brl(r.totais[bloco].real),
    percentage: {
      color: corTexto,
      text: r.totais[bloco].est ? `estimado ${brl(r.totais[bloco].est)}` : "sem estimativa",
    },
    icon: { color: "info", component: icone },
  });

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo={`Resumo de ${MESES_LONGOS[mes]} de ${ano || ""}`}>
          <VuiButton size="small" color="info" variant="outlined" onClick={() => window.print()}>
            <IoPrint size="14px" style={{ marginRight: 4 }} />
            Exportar PDF
          </VuiButton>
        </YearBar>

        {loading && (
          <VuiTypography variant="button" color="text">
            Carregando planilha…
          </VuiTypography>
        )}

        {!loading && ano && (
          <>
            <VuiBox mb={3} display="flex" flexWrap="wrap" gap="8px" className="no-print">
              {MESES.map((nome, m) => (
                <VuiButton
                  key={nome}
                  size="small"
                  color="info"
                  variant={m === mes ? "contained" : "outlined"}
                  onClick={() => selecionarMes(m)}
                >
                  {nome}
                </VuiButton>
              ))}
            </VuiBox>

            <VuiBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    {...kpi("Receita", "receitas do mês", <IoTrendingUp size="22px" color="white" />, dif("Receita") >= 0 ? "success" : "error")}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    {...kpi("Despesa", "despesas do mês", <IoTrendingDown size="22px" color="white" />, dif("Despesa") <= 0 ? "success" : "error")}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    {...kpi("Investimento", "investimentos do mês", <IoStatsChart size="22px" color="white" />, "success")}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <MiniStatisticsCard
                    title={{ text: "saldo do mês" }}
                    count={brl(r.saldoReal)}
                    percentage={{
                      color: r.saldoReal >= 0 ? "success" : "error",
                      text: `estimado ${brl(r.saldoEst)}`,
                    }}
                    icon={{ color: "info", component: <IoWallet size="22px" color="white" /> }}
                  />
                </Grid>
              </Grid>
            </VuiBox>

            {!r.temDados && (
              <VuiBox mb={3}>
                <Card>
                  <VuiTypography variant="button" color="text" fontWeight="regular">
                    Nada realizado nem estimado para {MESES_LONGOS[mes]}. Use “Lançar em outro item” nas
                    tabelas abaixo, a página Planilha ou cadastre recorrências para gerar estimativas.
                  </VuiTypography>
                </Card>
              </VuiBox>
            )}

            <VuiBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} xl={6}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                      Estimado × realizado
                    </VuiTypography>
                    <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                      Totais do mês por bloco
                    </VuiTypography>
                    <VuiBox sx={{ height: "300px" }}>
                      <ComparativoChart {...comparativoBlocos} />
                    </VuiBox>
                  </Card>
                </Grid>
                <Grid item xs={12} xl={6}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                      Despesas por categoria
                    </VuiTypography>
                    <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                      Participação no total realizado do mês
                    </VuiTypography>
                    {rosca.length === 0 ? (
                      <VuiTypography variant="button" color="text" fontWeight="regular">
                        Nenhuma despesa realizada neste mês.
                      </VuiTypography>
                    ) : (
                      <VuiBox sx={{ height: "300px" }}>
                        <RoscaChart dados={rosca} />
                      </VuiBox>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </VuiBox>

            <VuiBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} xl={7}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                      Categorias de despesa: estimado × realizado
                    </VuiTypography>
                    <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
                      As 8 maiores do mês
                    </VuiTypography>
                    {topCategorias.length === 0 ? (
                      <VuiTypography variant="button" color="text" fontWeight="regular">
                        Sem despesas para comparar.
                      </VuiTypography>
                    ) : (
                      <VuiBox sx={{ height: `${Math.max(220, topCategorias.length * 48)}px` }}>
                        <ComparativoChart
                          horizontal
                          rotulos={topCategorias.map((c) => c.nome)}
                          estimado={topCategorias.map((c) => c.est)}
                          real={topCategorias.map((c) => c.real)}
                        />
                      </VuiBox>
                    )}
                  </Card>
                </Grid>
                <Grid item xs={12} xl={5}>
                  <Card sx={{ height: "100%" }}>
                    <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">
                      Indicadores do mês
                    </VuiTypography>
                    {[
                      ["Taxa de poupança", pct(r.taxaPoupanca), `estimada ${pct(r.taxaPoupancaEst)}`],
                      ["Taxa de investimento", pct(r.taxaInvestimento), ""],
                      [
                        "Receitas vs mês anterior",
                        r.comparacao.Receita === null ? "—" : textoVariacao(r.comparacao.Receita),
                        "",
                      ],
                      [
                        "Despesas vs mês anterior",
                        r.comparacao.Despesa === null ? "—" : textoVariacao(r.comparacao.Despesa),
                        "",
                      ],
                      [
                        "Maior despesa do mês",
                        maior && maior.real > 0 ? brl(maior.real) : "—",
                        maior && maior.real > 0 ? maior.descricao : "",
                      ],
                      [
                        "Parcelas e recorrências",
                        brl(r.totalParcelasDespesa),
                        `${r.parcelas.length} ativa(s) no mês`,
                      ],
                    ].map(([rotulo, valor, nota]) => (
                      <VuiBox
                        key={rotulo}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="baseline"
                        gap="12px"
                        py="8px"
                        sx={{ borderBottom: BORDA }}
                      >
                        <VuiTypography variant="button" color="text" fontWeight="regular">
                          {rotulo}
                        </VuiTypography>
                        <VuiBox textAlign="right">
                          <VuiTypography variant="button" color="white" fontWeight="bold">
                            {valor}
                          </VuiTypography>
                          {nota && (
                            <VuiTypography variant="caption" color="text" sx={{ display: "block" }}>
                              {nota}
                            </VuiTypography>
                          )}
                        </VuiBox>
                      </VuiBox>
                    ))}
                  </Card>
                </Grid>
              </Grid>
            </VuiBox>

            {BLOCOS.map((b) => {
              const { base, extrasBloco, livres } = linhasDo(b.chave);
              return (
                <TabelaBloco
                  key={b.chave}
                  bloco={b.chave}
                  titulo={b.titulo}
                  linhas={base}
                  extras={extrasBloco}
                  itensLivres={livres}
                  mes={mes}
                  setCelula={setCelula}
                  onAdicionarExtra={(id) => setExtras((x) => [...x, id])}
                />
              );
            })}

            {r.faturas.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="8px" mb="12px">
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    Faturas de cartão do mês
                  </VuiTypography>
                  <VuiButton size="small" color="info" variant="outlined" className="no-print" onClick={() => history.push("/cartoes")}>
                    Abrir cartões
                  </VuiButton>
                </VuiBox>
                <VuiBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left" }}>Cartão</th>
                        <th style={{ ...th, textAlign: "left" }}>Compras na fatura</th>
                        <th style={th}>Vencimento</th>
                        <th style={th}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.faturas.map((f) => (
                        <tr key={f.cartao.id} style={{ borderBottom: BORDA }}>
                          <td style={{ ...td, textAlign: "left" }}>{f.cartao.nome}</td>
                          <td style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>{f.itens.length} compra(s)</td>
                          <td style={td}>dia {f.cartao.vencimento}</td>
                          <td style={td}>{brl(f.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </VuiBox>
              </Card>
            )}

            <Card sx={{ mb: 3 }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="8px" mb="12px">
                <VuiTypography variant="lg" color="white" fontWeight="bold">
                  Parcelas e recorrências do mês
                </VuiTypography>
                <VuiButton size="small" color="info" variant="outlined" onClick={() => history.push("/recorrencias")}>
                  Gerenciar recorrências
                </VuiButton>
              </VuiBox>
              {r.parcelas.length === 0 ? (
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Nenhuma parcela ou recorrência neste mês.
                </VuiTypography>
              ) : (
                <VuiBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left" }}>Nome</th>
                        <th style={{ ...th, textAlign: "left" }}>Item</th>
                        <th style={th}>Parcela</th>
                        <th style={th}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.parcelas.map((p) => (
                        <tr key={p.rec.id} style={{ borderBottom: BORDA }}>
                          <td style={{ ...td, textAlign: "left" }}>{p.rec.nome}</td>
                          <td style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>
                            {p.rec.bloco} · {p.rec.item}
                          </td>
                          <td style={td}>{p.total ? `${p.numero}/${p.total}` : `#${p.numero}`}</td>
                          <td style={td}>{brl(p.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </VuiBox>
              )}
            </Card>
          </>
        )}
      </VuiBox>
    </DashboardLayout>
  );
}

export default Mes;
