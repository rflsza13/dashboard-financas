import { useState } from "react";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import EditableValor from "components/Finance/EditableValor";
import ItemDialog from "components/Finance/ItemDialog";

import { IoAdd, IoPencil, IoTrash } from "react-icons/io5";

import { useFinance } from "context/finance";
import { BLOCOS, MESES, brl } from "utils/finance";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = {
  padding: "8px 4px",
  fontSize: 12,
  fontWeight: 500,
  color: themeConfig.fonts.secondary,
  borderBottom: BORDA,
  textAlign: "right",
  whiteSpace: "nowrap",
};
const td = { padding: "2px 2px", fontSize: 13, color: themeConfig.fonts.primary, textAlign: "right", whiteSpace: "nowrap" };

const soma = (arr) => arr.reduce((a, b) => a + b, 0);

function Planilha() {
  const { loading, ano, itensAno, setCelula, criarItem, editarItem, excluirItem } = useFinance();
  const [campo, setCampo] = useState("real");
  const [dialog, setDialog] = useState({ aberto: false, item: null, bloco: "" });

  const fechar = () => setDialog((d) => ({ ...d, aberto: false }));

  const salvarItem = async (dados) => {
    const res = dialog.item ? await editarItem(dialog.item, dados) : await criarItem(dados);
    if (res.ok) fechar();
    return res;
  };

  const excluir = async (item) => {
    const ok = window.confirm(
      `Excluir “${item.descricao}”? Os valores realizados e previstos desse item serão apagados da planilha.`
    );
    if (!ok) return;
    const res = await excluirItem(item);
    if (!res.ok) window.alert(`Não foi possível excluir: ${res.erro}`);
  };

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo={`Planilha ${ano || ""}`}>
          <VuiButton
            size="small"
            color="info"
            variant={campo === "real" ? "contained" : "outlined"}
            onClick={() => setCampo("real")}
          >
            Realizado
          </VuiButton>
          <VuiButton
            size="small"
            color="info"
            variant={campo === "prev" ? "contained" : "outlined"}
            onClick={() => setCampo("prev")}
          >
            Previsto
          </VuiButton>
        </YearBar>

        {loading && (
          <VuiTypography variant="button" color="text">
            Carregando planilha…
          </VuiTypography>
        )}

        {!loading && ano && (
          <>
            <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block", mb: 3 }}>
              {campo === "real"
                ? "Valores realizados: o que de fato aconteceu em cada mês. Clique em uma célula para editar."
                : "Valores previstos: sua estimativa manual. As parcelas recorrentes são somadas automaticamente ao estimado, então não as repita aqui."}
            </VuiTypography>

            {BLOCOS.map((b) => {
              const itens = itensAno.filter((i) => i.bloco === b.chave);
              const totais = MESES.map((_, m) => soma(itens.map((i) => i[campo][m])));
              return (
                <Card key={b.chave} sx={{ mb: 3 }}>
                  <VuiBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="8px" mb="12px">
                    <VuiTypography variant="lg" color="white" fontWeight="bold">
                      {b.titulo}
                    </VuiTypography>
                    <VuiButton
                      size="small"
                      color="info"
                      variant="outlined"
                      onClick={() => setDialog({ aberto: true, item: null, bloco: b.chave })}
                    >
                      <IoAdd size="14px" style={{ marginRight: 4 }} />
                      Novo item
                    </VuiButton>
                  </VuiBox>
                  <VuiBox sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1280 }}>
                      <thead>
                        <tr>
                          <th style={{ ...th, textAlign: "left", minWidth: 110 }}>Categoria</th>
                          <th style={{ ...th, textAlign: "left", minWidth: 170 }}>Item</th>
                          {MESES.map((m) => (
                            <th key={m} style={th}>
                              {m}
                            </th>
                          ))}
                          <th style={{ ...th, paddingRight: 8 }}>Total</th>
                          <th style={{ ...th, width: 64 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {itens.length === 0 && (
                          <tr>
                            <td colSpan={16} style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary, padding: 8 }}>
                              Nenhum item neste bloco. Use “Novo item”.
                            </td>
                          </tr>
                        )}
                        {itens.map((item) => (
                          <tr key={item.id} style={{ borderBottom: BORDA }}>
                            <td style={{ ...td, textAlign: "left", color: themeConfig.fonts.secondary, padding: "6px 4px" }}>
                              {item.categoria}
                            </td>
                            <td style={{ ...td, textAlign: "left", padding: "6px 4px" }}>{item.descricao}</td>
                            {MESES.map((m, i) => (
                              <td key={m} style={td}>
                                <EditableValor
                                  largura={72}
                                  valor={item[campo][i]}
                                  onSalvar={(v) => setCelula(item, i, campo, v)}
                                />
                              </td>
                            ))}
                            <td style={{ ...td, fontWeight: 700, paddingRight: 8 }}>{brl(soma(item[campo]))}</td>
                            <td style={{ ...td, textAlign: "center" }}>
                              <span
                                role="button"
                                tabIndex={0}
                                title="Editar item"
                                onClick={() => setDialog({ aberto: true, item, bloco: item.bloco })}
                                onKeyDown={(e) => e.key === "Enter" && setDialog({ aberto: true, item, bloco: item.bloco })}
                                style={{ cursor: "pointer", color: themeConfig.fonts.secondary, marginRight: 8 }}
                              >
                                <IoPencil size="14px" />
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                title="Excluir item"
                                onClick={() => excluir(item)}
                                onKeyDown={(e) => e.key === "Enter" && excluir(item)}
                                style={{ cursor: "pointer", color: themeConfig.fonts.secondary }}
                              >
                                <IoTrash size="14px" />
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td style={{ ...td, textAlign: "left", fontWeight: 700, padding: "8px 4px" }} colSpan={2}>
                            Total {b.titulo.toLowerCase()}
                          </td>
                          {totais.map((t, i) => (
                            <td key={MESES[i]} style={{ ...td, fontWeight: 700, padding: "8px 6px" }}>
                              {t ? brl(t) : "—"}
                            </td>
                          ))}
                          <td style={{ ...td, fontWeight: 700, paddingRight: 8 }}>{brl(soma(totais))}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </VuiBox>
                </Card>
              );
            })}
          </>
        )}
      </VuiBox>

      <ItemDialog
        aberto={dialog.aberto}
        item={dialog.item}
        blocoInicial={dialog.bloco}
        itens={itensAno}
        onFechar={fechar}
        onSalvar={salvarItem}
      />
    </DashboardLayout>
  );
}

export default Planilha;
