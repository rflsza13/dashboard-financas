import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import { FieldLabel, NativeSelect } from "layouts/dashboard/components/fields";
import { dialogPaper, MSG_ERRO } from "components/Finance/dialogStyle";
import { BLOCOS } from "utils/finance";

/** Cria ou renomeia um item (linha) da planilha: bloco + categoria + descrição. */
function ItemDialog({ aberto, item, blocoInicial, itens, onFechar, onSalvar }) {
  const editando = Boolean(item);
  const [bloco, setBloco] = useState("Despesa");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setBloco(item ? item.bloco : blocoInicial || "Despesa");
    setCategoria(item ? item.categoria : "");
    setDescricao(item ? item.descricao : "");
    setErro("");
    setSalvando(false);
  }, [aberto, item, blocoInicial]);

  const categorias = [...new Set(itens.filter((i) => i.bloco === bloco).map((i) => i.categoria))].filter(Boolean);

  const salvar = async () => {
    const cat = categoria.trim();
    const desc = descricao.trim();
    if (!cat || !desc) {
      setErro("Informe a categoria e a descrição.");
      return;
    }
    if (cat.length > 40 || desc.length > 60) {
      setErro("Categoria: até 40 caracteres. Descrição: até 60.");
      return;
    }
    setSalvando(true);
    const res = await onSalvar({ bloco, categoria: cat, descricao: desc });
    setSalvando(false);
    if (res && res.ok === false) setErro(res.erro || "Não foi possível salvar.");
  };

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="xs" PaperProps={dialogPaper}>
      <DialogContent>
        <VuiTypography variant="lg" color="white" fontWeight="bold" mb="16px">
          {editando ? "Editar item" : "Novo item"}
        </VuiTypography>
        <VuiBox mb={2}>
          <FieldLabel>Bloco</FieldLabel>
          <NativeSelect value={bloco} disabled={editando} onChange={(e) => setBloco(e.target.value)}>
            {BLOCOS.map((b) => (
              <option key={b.chave} value={b.chave}>
                {b.titulo}
              </option>
            ))}
          </NativeSelect>
        </VuiBox>
        <VuiBox mb={2}>
          <FieldLabel>Categoria</FieldLabel>
          <VuiInput
            fullWidth
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            inputProps={{ list: "categorias-existentes", maxLength: 40 }}
          />
          <datalist id="categorias-existentes">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </VuiBox>
        <VuiBox mb={2}>
          <FieldLabel>Descrição</FieldLabel>
          <VuiInput
            fullWidth
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            inputProps={{ maxLength: 60 }}
          />
        </VuiBox>
        {erro && (
          <VuiTypography variant="caption" color="error" sx={MSG_ERRO}>
            {erro}
          </VuiTypography>
        )}
        <VuiBox display="flex" justifyContent="flex-end" gap="8px" mt={3}>
          <VuiButton color="info" variant="text" onClick={onFechar}>
            Cancelar
          </VuiButton>
          <VuiButton color="info" variant="contained" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </VuiButton>
        </VuiBox>
      </DialogContent>
    </Dialog>
  );
}

ItemDialog.propTypes = {
  aberto: PropTypes.bool.isRequired,
  item: PropTypes.object,
  blocoInicial: PropTypes.string,
  itens: PropTypes.array.isRequired,
  onFechar: PropTypes.func.isRequired,
  onSalvar: PropTypes.func.isRequired,
};

ItemDialog.defaultProps = {
  item: null,
  blocoInicial: "",
};

export default ItemDialog;
