import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import { FieldLabel, NativeSelect } from "layouts/dashboard/components/fields";
import { dialogPaper, MSG_ERRO } from "components/Finance/dialogStyle";
import { parseValor } from "components/Finance/EditableValor";

/**
 * Formulário genérico em diálogo.
 * campos: [{ chave, rotulo (texto ou função dos valores), tipo: texto|numero|inteiro|select|mes|data, opcoes,
 * obrigatorio, min, max, tamanho, largura, visivel (função dos valores; campo oculto não é validado nem enviado) }]
 * `derivar(valores, campoMudado)` pode devolver um objeto com campos a preencher automaticamente.
 */
function FormDialog({ aberto, titulo, descricao, campos, inicial, derivar, onFechar, onSalvar }) {
  const [v, setV] = useState({});
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const base = {};
    campos.forEach((c) => {
      const x = inicial && inicial[c.chave] !== undefined && inicial[c.chave] !== null ? inicial[c.chave] : "";
      base[c.chave] = typeof x === "number" ? String(x).replace(".", ",") : x;
    });
    setV(base);
    setErro("");
    setSalvando(false);
  }, [aberto, inicial]);

  const mudar = (chave, valor) =>
    setV((atual) => {
      const novo = { ...atual, [chave]: valor };
      return derivar ? { ...novo, ...derivar(novo, chave) } : novo;
    });

  const salvar = async () => {
    const saida = {};
    for (let i = 0; i < campos.length; i += 1) {
      const c = campos[i];
      if (c.visivel && !c.visivel(v)) continue;
      const rotulo = typeof c.rotulo === "function" ? c.rotulo(v) : c.rotulo;
      const bruto = v[c.chave];
      const texto = typeof bruto === "string" ? bruto.trim() : bruto;
      if (c.obrigatorio && (texto === "" || texto === undefined)) {
        setErro(`Preencha: ${rotulo}.`);
        return;
      }
      if (c.tipo === "numero" || c.tipo === "inteiro") {
        if (texto === "") {
          saida[c.chave] = null;
        } else {
          const n = parseValor(texto);
          if (n === null || (c.tipo === "inteiro" && !Number.isInteger(n))) {
            setErro(`Valor inválido em: ${rotulo}.`);
            return;
          }
          if ((c.min !== undefined && n < c.min) || (c.max !== undefined && n > c.max)) {
            setErro(`${rotulo}: use um valor entre ${c.min !== undefined ? c.min : "0"} e ${c.max !== undefined ? c.max : "∞"}.`);
            return;
          }
          saida[c.chave] = n;
        }
      } else if (c.tipo === "select") {
        saida[c.chave] = c.tipoValor === "booleano" ? texto === "1" : texto;
      } else {
        if (c.tamanho && String(texto).length > c.tamanho) {
          setErro(`${rotulo}: até ${c.tamanho} caracteres.`);
          return;
        }
        saida[c.chave] = texto;
      }
    }
    setSalvando(true);
    const res = await onSalvar(saida);
    setSalvando(false);
    if (res && res.ok === false) setErro(res.erro || "Não foi possível salvar.");
  };

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogContent>
        <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
          {titulo}
        </VuiTypography>
        {descricao && (
          <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "16px" }}>
            {descricao}
          </VuiTypography>
        )}
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {campos.filter((c) => !c.visivel || c.visivel(v)).map((c) => (
            <Grid item xs={12} sm={c.largura || 12} key={c.chave}>
              <FieldLabel>{typeof c.rotulo === "function" ? c.rotulo(v) : c.rotulo}</FieldLabel>
              {c.tipo === "select" ? (
                <NativeSelect value={v[c.chave] === undefined ? "" : v[c.chave]} onChange={(e) => mudar(c.chave, e.target.value)}>
                  {(c.opcoes || []).map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.rotulo}
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <VuiInput
                  fullWidth
                  type={c.tipo === "mes" ? "month" : c.tipo === "data" ? "date" : "text"}
                  value={v[c.chave] === undefined ? "" : v[c.chave]}
                  onChange={(e) => mudar(c.chave, e.target.value)}
                  inputProps={{
                    maxLength: c.tamanho,
                    inputMode: c.tipo === "numero" || c.tipo === "inteiro" ? "decimal" : undefined,
                  }}
                />
              )}
            </Grid>
          ))}
        </Grid>
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

FormDialog.propTypes = {
  aberto: PropTypes.bool.isRequired,
  titulo: PropTypes.string.isRequired,
  descricao: PropTypes.string,
  campos: PropTypes.array.isRequired,
  inicial: PropTypes.object,
  derivar: PropTypes.func,
  onFechar: PropTypes.func.isRequired,
  onSalvar: PropTypes.func.isRequired,
};

FormDialog.defaultProps = {
  descricao: "",
  inicial: null,
  derivar: null,
};

export default FormDialog;
