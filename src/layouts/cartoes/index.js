import { useMemo, useState } from "react";
import { Card } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import VuiProgress from "components/VuiProgress";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import { NativeSelect } from "layouts/dashboard/components/fields";
import { BarrasChart } from "layouts/dashboard/components/FinanceCharts";
import FormDialog from "components/Finance/FormDialog";
import IconeAcao from "components/Finance/IconeAcao";

import { IoAdd, IoPencil, IoTrash, IoCheckmarkCircle, IoEllipseOutline } from "react-icons/io5";

import { useFinance } from "context/finance";
import {
  MESES,
  MESES_LONGOS,
  brl,
  chavePago,
  faturaDoMes,
  limiteComprometido,
  pct,
  primeiraFatura,
  projecaoFaturas,
} from "utils/finance";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = { padding: "8px", fontSize: 12, fontWeight: 500, color: themeConfig.fonts.secondary, borderBottom: BORDA, textAlign: "right", whiteSpace: "nowrap" };
const td = { padding: "6px 8px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right" };

function Cartoes() {
  const { loading, ano, mes, selecionarMes, itensAno, cartoes, compras, pagos, salvarLinhas, excluirLinhas, marcarPago } = useFinance();
  const [dCartao, setDCartao] = useState({ aberto: false, cartao: null });
  const [dCompra, setDCompra] = useState({ aberto: false, compra: null, cartaoId: "" });
  const [todas, setTodas] = useState(false);

  const itensDespesa = useMemo(() => itensAno.filter((i) => i.bloco === "Despesa"), [itensAno]);
  const opcoesItem = itensDespesa.map((i) => ({ valor: `${i.categoria}|||${i.descricao}`, rotulo: `${i.categoria} — ${i.descricao}` }));
  const pagosSet = useMemo(() => new Set(pagos.map((p) => p.id)), [pagos]);

  const camposCartao = [
    { chave: "nome", rotulo: "Nome do cartão", tipo: "texto", obrigatorio: true, tamanho: 40 },
    { chave: "fechamento", rotulo: "Dia do fechamento", tipo: "inteiro", obrigatorio: true, min: 1, max: 31, largura: 6 },
    { chave: "vencimento", rotulo: "Dia do vencimento", tipo: "inteiro", obrigatorio: true, min: 1, max: 31, largura: 6 },
    { chave: "limite", rotulo: "Limite (R$)", tipo: "numero", min: 0, largura: 6 },
    { chave: "ativo", rotulo: "Situação", tipo: "select", tipoValor: "booleano", opcoes: [{ valor: "1", rotulo: "Ativo" }, { valor: "0", rotulo: "Inativo" }], largura: 6 },
    { chave: "alvo", rotulo: "Item da planilha que recebe a fatura (estimado)", tipo: "select", opcoes: opcoesItem },
  ];

  const inicialCartao = useMemo(() => {
    const c = dCartao.cartao;
    const padrao = opcoesItem.find((o) => o.valor.endsWith("Fatura do cartão")) || opcoesItem[0];
    if (!c) return { fechamento: "5", vencimento: "12", ativo: "1", alvo: padrao ? padrao.valor : "" };
    return { ...c, ativo: c.ativo === false ? "0" : "1", alvo: `${c.categoria}|||${c.item}` };
  }, [dCartao, itensAno]);

  const salvarCartao = async (v) => {
    if (!v.alvo) return { ok: false, erro: "Crie antes um item de despesa na página Planilha." };
    const [categoria, item] = v.alvo.split("|||");
    const ok = await salvarLinhas("cartoes", [
      { id: dCartao.cartao ? dCartao.cartao.id : uuidv4().slice(0, 10), nome: v.nome, fechamento: v.fechamento, vencimento: v.vencimento, limite: v.limite || 0, categoria, item, ativo: v.ativo },
    ]);
    if (ok) setDCartao({ aberto: false, cartao: null });
    return { ok };
  };

  const ehFixa = (v) => v.tipo === "fixa";
  const camposCompra = [
    { chave: "cartaoId", rotulo: "Cartão", tipo: "select", opcoes: cartoes.map((c) => ({ valor: c.id, rotulo: c.nome })) },
    {
      chave: "tipo",
      rotulo: "Tipo de lançamento",
      tipo: "select",
      opcoes: [
        { valor: "unica", rotulo: "Compra (à vista ou parcelada)" },
        { valor: "fixa", rotulo: "Mensalidade fixa (assinatura, streaming...)" },
      ],
    },
    { chave: "data", rotulo: (v) => (ehFixa(v) ? "Data da 1ª cobrança" : "Data da compra"), tipo: "data", obrigatorio: true, largura: 6 },
    { chave: "total", rotulo: (v) => (ehFixa(v) ? "Valor mensal (R$)" : "Valor total (R$)"), tipo: "numero", obrigatorio: true, min: 0.01, largura: 6 },
    { chave: "descricao", rotulo: "Descrição", tipo: "texto", obrigatorio: true, tamanho: 60 },
    { chave: "categoria", rotulo: "Categoria do gasto (opcional)", tipo: "texto", tamanho: 40, largura: 6 },
    { chave: "parcelas", rotulo: "Parcelas", tipo: "inteiro", obrigatorio: true, min: 1, max: 60, largura: 6, visivel: (v) => !ehFixa(v) },
    { chave: "fatura", rotulo: (v) => (ehFixa(v) ? "Mês da 1ª fatura com a cobrança" : "Mês da 1ª fatura (vencimento)"), tipo: "mes", obrigatorio: true, largura: 6 },
    { chave: "fim", rotulo: "Última cobrança (opcional, para quando cancelar)", tipo: "mes", largura: 6, visivel: ehFixa },
  ];

  const derivarCompra = (v, mudou) => {
    if (mudou !== "data" && mudou !== "cartaoId") return {};
    const cartao = cartoes.find((c) => c.id === v.cartaoId);
    const f = primeiraFatura(v.data, cartao);
    return f ? { fatura: f } : {};
  };

  const inicialCompra = useMemo(() => {
    const c = dCompra.compra;
    if (c) return { ...c, tipo: c.fixa ? "fixa" : "unica" };
    const hoje = new Date();
    const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const cartaoId = dCompra.cartaoId || (cartoes[0] ? cartoes[0].id : "");
    return { cartaoId, tipo: "unica", data, parcelas: "1", fatura: primeiraFatura(data, cartoes.find((x) => x.id === cartaoId)) };
  }, [dCompra]);

  const salvarCompra = async (v) => {
    const fixa = ehFixa(v);
    if (fixa && v.fim && v.fim < v.fatura) return { ok: false, erro: "A última cobrança não pode ser antes da primeira." };
    const ok = await salvarLinhas("compras", [
      {
        id: dCompra.compra ? dCompra.compra.id : uuidv4().slice(0, 10),
        cartaoId: v.cartaoId,
        data: v.data,
        descricao: v.descricao,
        categoria: v.categoria || "",
        total: v.total,
        parcelas: fixa ? 1 : v.parcelas,
        fatura: v.fatura,
        obs: "",
        fixa,
        fim: fixa ? v.fim || "" : "",
      },
    ]);
    if (ok) setDCompra({ aberto: false, compra: null, cartaoId: "" });
    return { ok };
  };

  const excluirCartao = async (c) => {
    const qtd = compras.filter((x) => x.cartaoId === c.id).length;
    if (!window.confirm(`Excluir o cartão “${c.nome}”${qtd ? ` e as ${qtd} compras dele` : ""}?`)) return;
    if (qtd) await excluirLinhas("compras", compras.filter((x) => x.cartaoId === c.id).map((x) => x.id));
    await excluirLinhas("cartoes", [c.id]);
  };

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Cartões de crédito">
          <VuiBox sx={{ minWidth: 130 }}>
            <NativeSelect value={mes} aria-label="Mês da fatura" onChange={(e) => selecionarMes(Number(e.target.value))}>
              {MESES_LONGOS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </NativeSelect>
          </VuiBox>
          <VuiButton size="small" color="info" variant="outlined" disabled={!ano} onClick={() => setDCartao({ aberto: true, cartao: null })}>
            <IoAdd size="14px" style={{ marginRight: 4 }} />
            Novo cartão
          </VuiButton>
          <VuiButton size="small" color="info" variant="contained" disabled={!cartoes.length} onClick={() => setDCompra({ aberto: true, compra: null, cartaoId: "" })}>
            <IoAdd size="14px" style={{ marginRight: 4 }} />
            Nova compra
          </VuiButton>
        </YearBar>

        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}

        {!loading && ano && cartoes.length === 0 && (
          <Card>
            <VuiTypography variant="button" color="text" fontWeight="regular">
              Nenhum cartão cadastrado. Use “Novo cartão”, depois lance as compras: as parceladas caem automaticamente nas faturas
              seguintes e entram no estimado do item escolhido.
            </VuiTypography>
          </Card>
        )}

        {!loading && ano && cartoes.map((c) => {
          const f = faturaDoMes(c, compras, ano, mes);
          const comprometido = limiteComprometido(c, compras, ano, mes);
          const limite = Number(c.limite) || 0;
          const chave = chavePago("fat", c.id, ano, mes);
          const paga = pagosSet.has(chave);
          const projecao = projecaoFaturas(c, compras, ano, mes, 12);
          const lista = todas
            ? compras.filter((x) => x.cartaoId === c.id).sort((a, b) => (a.data < b.data ? 1 : -1)).map((compra) => ({ compra, parcela: null }))
            : f.itens;
          return (
            <Card key={c.id} sx={{ mb: 3, opacity: c.ativo === false ? 0.6 : 1 }}>
              <VuiBox display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="8px" mb="12px">
                <VuiBox>
                  <VuiTypography variant="lg" color="white" fontWeight="bold">
                    {c.nome}
                    {c.ativo === false ? " (inativo)" : ""}
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text">
                    Fecha dia {c.fechamento} · vence dia {c.vencimento} · fatura entra em {c.categoria} — {c.item}
                  </VuiTypography>
                </VuiBox>
                <VuiBox>
                  <IconeAcao titulo="Editar cartão" onClick={() => setDCartao({ aberto: true, cartao: c })}><IoPencil size="14px" /></IconeAcao>
                  <IconeAcao titulo="Excluir cartão" onClick={() => excluirCartao(c)}><IoTrash size="14px" /></IconeAcao>
                </VuiBox>
              </VuiBox>

              <VuiBox display="flex" flexWrap="wrap" gap="32px" mb="16px">
                <VuiBox>
                  <VuiTypography variant="caption" color="text">Fatura de {MESES_LONGOS[mes]}</VuiTypography>
                  <VuiTypography variant="h4" color="white" fontWeight="bold">{brl(f.total)}</VuiTypography>
                  {f.total > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => marcarPago(chave, !paga)}
                      onKeyDown={(e) => e.key === "Enter" && marcarPago(chave, !paga)}
                      style={{ cursor: "pointer", color: paga ? "#01b574" : themeConfig.fonts.secondary, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      {paga ? <IoCheckmarkCircle size="15px" /> : <IoEllipseOutline size="15px" />}
                      {paga ? "Fatura paga" : "Marcar como paga"}
                    </span>
                  )}
                </VuiBox>
                <VuiBox sx={{ minWidth: 220, flex: 1, maxWidth: 360 }}>
                  <VuiTypography variant="caption" color="text">
                    Limite comprometido: {brl(comprometido)} {limite > 0 ? `de ${brl(limite)} (${pct(comprometido / limite)})` : ""}
                  </VuiTypography>
                  {limite > 0 && (
                    <VuiProgress value={Math.min(100, (comprometido / limite) * 100)} color={comprometido / limite > 0.8 ? "error" : "info"} sx={{ background: "rgba(255, 255, 255, 0.12)", mt: "6px" }} />
                  )}
                  {limite > 0 && (
                    <VuiTypography variant="caption" color="text" sx={{ display: "block", mt: "4px" }}>
                      Disponível: {brl(Math.max(limite - comprometido, 0))}
                    </VuiTypography>
                  )}
                </VuiBox>
              </VuiBox>

              <VuiBox display="flex" justifyContent="space-between" alignItems="center" mb="8px">
                <VuiTypography variant="button" color="white" fontWeight="medium">
                  {todas ? "Todas as compras" : `Compras na fatura de ${MESES[mes]}`}
                </VuiTypography>
                <VuiButton size="small" color="info" variant="text" onClick={() => setTodas((x) => !x)}>
                  {todas ? "Ver só a fatura do mês" : "Ver todas as compras"}
                </VuiButton>
              </VuiBox>
              {lista.length === 0 ? (
                <VuiTypography variant="button" color="text" fontWeight="regular">Nenhuma compra neste mês.</VuiTypography>
              ) : (
                <VuiBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: "left" }}>Compra</th>
                        <th style={{ ...th, textAlign: "left" }}>Data</th>
                        <th style={th}>Parcela</th>
                        <th style={th}>{todas ? "Total / mês" : "Valor"}</th>
                        <th style={{ ...th, width: 64 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map(({ compra, parcela }) => (
                        <tr key={compra.id} style={{ borderBottom: BORDA }}>
                          <td style={{ ...td, textAlign: "left" }}>
                            {compra.descricao}
                            {compra.fixa && <span style={{ color: themeConfig.fonts.secondary, fontSize: 11 }}> · mensalidade fixa{compra.fim ? ` até ${compra.fim.slice(5, 7)}/${compra.fim.slice(0, 4)}` : ""}</span>}
                            {compra.categoria && <span style={{ color: themeConfig.fonts.secondary, fontSize: 11 }}> · {compra.categoria}</span>}
                          </td>
                          <td style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary }}>{compra.data.split("-").reverse().join("/")}</td>
                          <td style={td}>{compra.fixa ? "mensal" : parcela ? `${parcela.numero}/${parcela.total}` : `${compra.parcelas}x`}</td>
                          <td style={td}>{brl(parcela ? parcela.valor : compra.total)}</td>
                          <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
                            <IconeAcao titulo="Editar compra" onClick={() => setDCompra({ aberto: true, compra, cartaoId: c.id })}><IoPencil size="13px" /></IconeAcao>
                            <IconeAcao titulo="Excluir compra" onClick={() => window.confirm(`Excluir “${compra.descricao}”?`) && excluirLinhas("compras", [compra.id])}><IoTrash size="13px" /></IconeAcao>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </VuiBox>
              )}

              <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block", mt: "20px", mb: "8px" }}>
                Próximas faturas
              </VuiTypography>
              <VuiBox sx={{ height: "220px" }}>
                <BarrasChart rotulos={projecao.map((p) => `${MESES[p.mes]}/${String(p.ano).slice(2)}`)} valores={projecao.map((p) => p.total)} nome="Fatura" />
              </VuiBox>
            </Card>
          );
        })}
      </VuiBox>

      <FormDialog
        aberto={dCartao.aberto}
        titulo={dCartao.cartao ? "Editar cartão" : "Novo cartão"}
        campos={camposCartao}
        inicial={inicialCartao}
        onFechar={() => setDCartao({ aberto: false, cartao: null })}
        onSalvar={salvarCartao}
      />
      <FormDialog
        aberto={dCompra.aberto}
        titulo={dCompra.compra ? "Editar compra" : "Nova compra"}
        descricao="Compra parcelada: dividida em parcelas iguais, uma por fatura. Mensalidade fixa: repete todo mês a partir da 1ª fatura, sem fim (ou até a última cobrança informada)."
        campos={camposCompra}
        inicial={inicialCompra}
        derivar={derivarCompra}
        onFechar={() => setDCompra({ aberto: false, compra: null, cartaoId: "" })}
        onSalvar={salvarCompra}
      />
    </DashboardLayout>
  );
}

export default Cartoes;
