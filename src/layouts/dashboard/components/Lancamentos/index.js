import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

import { IoPencil, IoTrash } from "react-icons/io5";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useFinance } from "context/finance";
import { MESES, brl, formatDate, monthOf } from "utils/finance";
import { NativeSelect } from "layouts/dashboard/components/fields";

const COLUNAS = [
  { nome: "Data", align: "left" },
  { nome: "Descrição", align: "left" },
  { nome: "Categoria", align: "left" },
  { nome: "Tipo", align: "left" },
  { nome: "Natureza", align: "left" },
  { nome: "Valor", align: "right" },
  { nome: "", align: "right" },
];

const PASSO = 20;

function Lancamentos({ onNovo, onEditar }) {
  const { entradasAno, excluir, ano } = useFinance();
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("");
  const [limite, setLimite] = useState(PASSO);
  const [apagar, setApagar] = useState(null);

  useEffect(() => {
    setLimite(PASSO);
  }, [busca, mes, categoria, tipo, ano]);

  const categoriasUsadas = useMemo(
    () =>
      Array.from(new Set(entradasAno.map((e) => e.categoria)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [entradasAno]
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return entradasAno
      .filter(
        (e) =>
          (!tipo || e.tipo === tipo) &&
          (!categoria || e.categoria === categoria) &&
          (mes === "" || monthOf(e.data) === Number(mes)) &&
          (!q || `${e.descricao} ${e.categoria} ${e.obs}`.toLowerCase().includes(q))
      )
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  }, [entradasAno, busca, mes, categoria, tipo]);

  const totais = useMemo(() => {
    let receita = 0;
    let despesa = 0;
    filtradas.forEach((e) => {
      if (e.tipo === "Receita") receita += Number(e.valor) || 0;
      else despesa += Number(e.valor) || 0;
    });
    return { receita, despesa };
  }, [filtradas]);

  const visiveis = filtradas.slice(0, limite);

  const th = (c, i) => (
    <VuiBox
      key={`${c.nome}-${i}`}
      component="th"
      textAlign={c.align}
      sx={{
        p: "10px 12px",
        fontSize: "11px",
        fontWeight: 700,
        color: "#a0aec0",
        textTransform: "uppercase",
        borderBottom: "1px solid #56577A",
        whiteSpace: "nowrap",
      }}
    >
      {c.nome}
    </VuiBox>
  );

  const td = (children, align = "left", extra = {}) => (
    <VuiBox
      component="td"
      textAlign={align}
      sx={{ p: "10px 12px", borderBottom: "1px solid rgba(86,87,122,0.4)", whiteSpace: "nowrap", ...extra }}
    >
      {children}
    </VuiBox>
  );

  const texto = (t, cor = "text") => (
    <VuiTypography variant="button" color={cor} fontWeight="regular">
      {t}
    </VuiTypography>
  );

  return (
    <Card>
      <VuiBox>
        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="12px" mb={2}>
          <VuiTypography variant="lg" color="white" fontWeight="bold">
            Lançamentos de {ano}
          </VuiTypography>
          <VuiButton size="small" color="info" variant="contained" onClick={onNovo}>
            Novo lançamento
          </VuiButton>
        </VuiBox>

        <VuiBox
          mb={2}
          sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}
        >
          <VuiInput
            placeholder="Buscar descrição…"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
            fullWidth
          />
          <NativeSelect value={mes} onChange={(ev) => setMes(ev.target.value)}>
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect value={categoria} onChange={(ev) => setCategoria(ev.target.value)}>
            <option value="">Todas as categorias</option>
            {categoriasUsadas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect value={tipo} onChange={(ev) => setTipo(ev.target.value)}>
            <option value="">Receitas e despesas</option>
            <option value="Receita">Só receitas</option>
            <option value="Despesa">Só despesas</option>
          </NativeSelect>
        </VuiBox>

        <TableContainer>
          <MuiTable>
            <VuiBox component="thead">
              <TableRow>{COLUNAS.map(th)}</TableRow>
            </VuiBox>
            <TableBody>
              {visiveis.map((e) => (
                <TableRow key={e.id}>
                  {td(texto(formatDate(e.data) || "—"))}
                  {td(texto(e.descricao || "—", "white"), "left", { maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" })}
                  {td(texto(e.categoria || "—"))}
                  {td(texto(e.tipo, e.tipo === "Receita" ? "success" : "error"))}
                  {td(texto(e.natureza || "—"))}
                  {td(
                    texto(`${e.tipo === "Receita" ? "+" : "−"} ${brl(Number(e.valor))}`, e.tipo === "Receita" ? "success" : "white"),
                    "right"
                  )}
                  {td(
                    <>
                      <IconButton size="small" aria-label="Editar" onClick={() => onEditar(e)} sx={{ color: "#a0aec0" }}>
                        <IoPencil size="14px" />
                      </IconButton>
                      <IconButton size="small" aria-label="Excluir" onClick={() => setApagar(e)} sx={{ color: "#a0aec0" }}>
                        <IoTrash size="14px" />
                      </IconButton>
                    </>,
                    "right"
                  )}
                </TableRow>
              ))}
              {!visiveis.length && (
                <TableRow>
                  <VuiBox component="td" colSpan={COLUNAS.length} sx={{ p: "24px", textAlign: "center" }}>
                    {texto("Nenhum lançamento encontrado.")}
                  </VuiBox>
                </TableRow>
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>

        <VuiBox display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" gap="12px" mt={2}>
          <VuiTypography variant="caption" color="text">
            {filtradas.length} lançamento(s) · Receitas {brl(totais.receita)} · Despesas {brl(totais.despesa)}
          </VuiTypography>
          {filtradas.length > limite && (
            <VuiButton size="small" color="info" variant="outlined" onClick={() => setLimite((l) => l + PASSO)}>
              Mostrar mais
            </VuiButton>
          )}
        </VuiBox>
      </VuiBox>

      <Dialog
        open={Boolean(apagar)}
        onClose={() => setApagar(null)}
        PaperProps={{
          sx: { background: "#0f1535", backgroundImage: "none", border: "1px solid #56577A", borderRadius: "20px" },
        }}
      >
        <DialogContent>
          <VuiTypography variant="button" color="white" fontWeight="regular">
            Excluir {apagar ? `"${apagar.descricao || apagar.categoria}" (${brl(Number(apagar.valor))})` : ""}? A linha também
            será removida da planilha.
          </VuiTypography>
        </DialogContent>
        <DialogActions sx={{ p: "8px 24px 16px", gap: "8px" }}>
          <VuiButton color="text" variant="text" onClick={() => setApagar(null)}>
            Cancelar
          </VuiButton>
          <VuiButton
            color="error"
            variant="contained"
            onClick={() => {
              excluir(apagar.id);
              setApagar(null);
            }}
          >
            Excluir
          </VuiButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

Lancamentos.propTypes = {
  onNovo: PropTypes.func.isRequired,
  onEditar: PropTypes.func.isRequired,
};

export default Lancamentos;
