import { useEffect, useState } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";

import { useFinance } from "context/finance";
import { todayIso } from "utils/finance";
import { NativeSelect, FieldLabel } from "layouts/dashboard/components/fields";
import themeConfig from "themeConfig";

const formVazio = (ano) => {
  const hoje = todayIso();
  return {
    data: hoje.startsWith(String(ano)) ? hoje : `${ano}-01-01`,
    tipo: "Despesa",
    descricao: "",
    categoria: "",
    natureza: "Variável",
    valor: "",
    obs: "",
  };
};

// Aceita "1.250,50" e "1250.50"
function parseValor(v) {
  const s = String(v).trim().replace(/[R$\s]/g, "");
  if (!s) return NaN;
  const normal = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return Number(normal);
}

/** Formata um número como moeda brasileira enquanto o usuário digita.
 *  Ex.: "1250" → "1.250" → "1.250,50"                                */
function mascaraBRL(raw) {
  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Trata os dois últimos algarismos como centavos
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function EntryDialog({ open, entrada, onClose }) {
  const { ano, categorias, adicionar, atualizar } = useFinance();
  const [form, setForm] = useState(formVazio(ano));
  const [erros, setErros] = useState({});
  const editando = Boolean(entrada);

  useEffect(() => {
    if (!open) return;
    setErros({});
    if (entrada) {
      // Ao editar, mostra o valor já formatado como BRL
      const valorFormatado = mascaraBRL(String(Math.round(entrada.valor * 100)));
      setForm({ ...entrada, valor: valorFormatado });
    } else {
      setForm(formVazio(ano));
    }
  }, [open, entrada, ano]);

  const set = (campo) => (ev) => setForm((f) => ({ ...f, [campo]: ev.target.value }));

  // Handler especial para o campo valor: aplica máscara BRL em tempo real
  const setValor = (ev) => {
    const mascarado = mascaraBRL(ev.target.value);
    setForm((f) => ({ ...f, valor: mascarado }));
  };

  const validar = () => {
    const e = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.data)) e.data = "Informe a data.";
    else if (!form.data.startsWith(String(ano))) e.data = `A data deve estar em ${ano}.`;
    if (!form.descricao.trim()) e.descricao = "Informe a descrição.";
    if (!form.categoria.trim()) e.categoria = "Informe a categoria.";
    const valor = parseValor(form.valor);
    if (!Number.isFinite(valor) || valor <= 0) e.valor = "Informe um valor maior que zero.";
    setErros(e);
    return Object.keys(e).length === 0 ? valor : null;
  };

  const salvar = (continuar) => {
    const valor = validar();
    if (valor === null) return;
    const dados = {
      data: form.data,
      descricao: form.descricao.trim(),
      categoria: form.categoria.trim(),
      tipo: form.tipo,
      natureza: form.natureza,
      valor: Math.round(valor * 100) / 100,
      obs: (form.obs || "").trim(),
    };
    if (editando) atualizar({ ...dados, id: entrada.id });
    else adicionar(dados);
    if (continuar) setForm((f) => ({ ...f, descricao: "", valor: "", obs: "" }));
    else onClose();
  };

  const sugestoes = categorias.filter((c) => !c.tipo || c.tipo === form.tipo);

  const erro = (campo) =>
    erros[campo] ? (
      <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: "4px" }}>
        {erros[campo]}
      </VuiTypography>
    ) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          background: themeConfig.cards.dialogBackground || "rgba(15, 21, 53, 0.95)",
          backdropFilter: "blur(40px)",
          backgroundImage: "none",
          border: `1px solid ${themeConfig.cards.borderColor || "#56577A"}`,
          borderRadius: "20px",
          color: themeConfig.fonts.primary || "#fff",
        },
      }}
    >
      <DialogTitle>
        <VuiTypography variant="lg" color="white" fontWeight="bold">
          {editando ? "Editar lançamento" : "Novo lançamento"}
        </VuiTypography>
      </DialogTitle>
      <DialogContent>
        <VuiBox display="flex" gap="8px" mb={2} mt={1}>
          {["Despesa", "Receita"].map((t) => (
            <VuiButton
              key={t}
              size="small"
              color={t === "Receita" ? "success" : "error"}
              variant={form.tipo === t ? "contained" : "outlined"}
              onClick={() => setForm((f) => ({ ...f, tipo: t }))}
            >
              {t}
            </VuiButton>
          ))}
        </VuiBox>

        <VuiBox
          sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}
        >
          <VuiBox>
            <FieldLabel>Data</FieldLabel>
            <VuiInput
              fullWidth
              type="date"
              value={form.data}
              onChange={set("data")}
              error={Boolean(erros.data)}
              inputProps={{ min: `${ano}-01-01`, max: `${ano}-12-31`, style: { colorScheme: "dark" } }}
            />
            {erro("data")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Valor (R$)</FieldLabel>
            <VuiInput
              fullWidth
              placeholder="0,00"
              value={form.valor}
              onChange={setValor}
              error={Boolean(erros.valor)}
              inputProps={{ inputMode: "numeric" }}
            />
            {erro("valor")}
          </VuiBox>
          <VuiBox sx={{ gridColumn: "1 / -1" }}>
            <FieldLabel>Descrição</FieldLabel>
            <VuiInput
              fullWidth
              placeholder="Ex.: Supermercado"
              value={form.descricao}
              onChange={set("descricao")}
              error={Boolean(erros.descricao)}
            />
            {erro("descricao")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Categoria</FieldLabel>
            <VuiInput
              fullWidth
              placeholder="Escolha ou digite uma nova"
              value={form.categoria}
              onChange={set("categoria")}
              error={Boolean(erros.categoria)}
              inputProps={{ list: "lista-categorias" }}
            />
            <datalist id="lista-categorias">
              {sugestoes.map((c) => (
                <option key={c.nome} value={c.nome} />
              ))}
            </datalist>
            {erro("categoria")}
          </VuiBox>
          <VuiBox>
            <FieldLabel>Natureza</FieldLabel>
            <NativeSelect value={form.natureza} onChange={set("natureza")}>
              <option value="Variável">Variável</option>
              <option value="Fixa">Fixa</option>
              <option value="">Não informar</option>
            </NativeSelect>
          </VuiBox>
          <VuiBox sx={{ gridColumn: "1 / -1" }}>
            <FieldLabel>Observações</FieldLabel>
            <VuiInput fullWidth value={form.obs} onChange={set("obs")} />
          </VuiBox>
        </VuiBox>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px", gap: "8px" }}>
        <VuiButton color="text" variant="text" onClick={onClose}>
          Cancelar
        </VuiButton>
        {!editando && (
          <VuiButton color="info" variant="outlined" onClick={() => salvar(true)}>
            Salvar e novo
          </VuiButton>
        )}
        <VuiButton color="info" variant="contained" onClick={() => salvar(false)}>
          Salvar
        </VuiButton>
      </DialogActions>
    </Dialog>
  );
}

EntryDialog.defaultProps = {
  entrada: null,
};

EntryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  entrada: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default EntryDialog;
