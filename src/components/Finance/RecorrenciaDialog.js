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
import { BLOCOS, MESES_LONGOS, inicioTexto, parseInicio } from "utils/finance";

const vazio = (ano) => ({
  bloco: "Despesa",
  itemKey: "",
  nome: "",
  valor: "",
  parcelas: "",
  mes: new Date().getMonth(),
  ano: ano || new Date().getFullYear(),
  parcelaInicial: "1",
  dia: "",
  ativa: true,
  obs: "",
});

/** Cria ou edita uma recorrência: parcelamento (4/10) ou conta fixa sem fim. */
function RecorrenciaDialog({ aberto, rec, itens, ano, onFechar, onSalvar }) {
  const [f, setF] = useState(vazio(ano));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    if (rec) {
      const ini = parseInicio(rec.inicio) || { ano, mes: 0 };
      setF({
        bloco: rec.bloco,
        itemKey: `${rec.categoria}|||${rec.item}`,
        nome: rec.nome,
        valor: String(rec.valor).replace(".", ","),
        parcelas: rec.parcelas ? String(rec.parcelas) : "",
        mes: ini.mes,
        ano: ini.ano,
        parcelaInicial: String(rec.parcelaInicial || 1),
        dia: rec.dia ? String(rec.dia) : "",
        ativa: rec.ativa,
        obs: rec.obs || "",
      });
    } else {
      setF(vazio(ano));
    }
    setErro("");
    setSalvando(false);
  }, [aberto, rec, ano]);

  const set = (campo) => (valor) => setF((x) => ({ ...x, [campo]: valor }));
  const opcoes = itens.filter((i) => i.bloco === f.bloco);
  const chaveAtual = opcoes.some((i) => `${i.categoria}|||${i.descricao}` === f.itemKey)
    ? f.itemKey
    : opcoes.length
    ? `${opcoes[0].categoria}|||${opcoes[0].descricao}`
    : "";

  const salvar = async () => {
    const nome = f.nome.trim();
    const valor = parseValor(f.valor);
    const parcelas = f.parcelas.trim() === "" ? null : Number(f.parcelas);
    const parcelaInicial = Number(f.parcelaInicial);
    const anoInicio = Number(f.ano);
    if (!chaveAtual) return setErro("Crie antes um item nesse bloco (página Planilha).");
    if (!nome) return setErro("Informe o nome (ex.: Notebook).");
    if (nome.length > 60) return setErro("O nome deve ter até 60 caracteres.");
    if (!valor) return setErro("Informe o valor da parcela (maior que zero).");
    if (parcelas !== null && (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 600)) {
      return setErro("Total de parcelas: inteiro de 1 a 600, ou vazio para sem fim.");
    }
    if (!Number.isInteger(parcelaInicial) || parcelaInicial < 1 || (parcelas && parcelaInicial > parcelas)) {
      return setErro("Parcela inicial: inteiro de 1 até o total de parcelas.");
    }
    if (!Number.isInteger(anoInicio) || anoInicio < 2000 || anoInicio > 2100) {
      return setErro("Informe um ano de início válido.");
    }
    const dia = f.dia.trim() === "" ? null : Number(f.dia);
    if (dia !== null && (!Number.isInteger(dia) || dia < 1 || dia > 31)) {
      return setErro("Dia do vencimento: de 1 a 31, ou vazio.");
    }
    const [categoria, item] = chaveAtual.split("|||");
    setSalvando(true);
    const res = await onSalvar({
      ...(rec ? { id: rec.id } : {}),
      bloco: f.bloco,
      categoria,
      item,
      nome,
      valor,
      parcelas,
      inicio: inicioTexto(anoInicio, Number(f.mes)),
      parcelaInicial,
      dia,
      ativa: f.ativa,
      obs: f.obs.trim(),
    });
    setSalvando(false);
    if (res && res.ok === false) setErro(res.erro || "Não foi possível salvar.");
    return null;
  };

  return (
    <Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm" PaperProps={dialogPaper}>
      <DialogContent>
        <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">
          {rec ? "Editar recorrência" : "Nova recorrência"}
        </VuiTypography>
        <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "16px" }}>
          Gera uma parcela automática por mês (ex.: 4/10) e soma ao estimado do item escolhido.
        </VuiTypography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FieldLabel>Bloco</FieldLabel>
            <NativeSelect value={f.bloco} onChange={(e) => set("bloco")(e.target.value)}>
              {BLOCOS.map((b) => (
                <option key={b.chave} value={b.chave}>
                  {b.singular.charAt(0).toUpperCase() + b.singular.slice(1)}
                </option>
              ))}
            </NativeSelect>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FieldLabel>Item da planilha</FieldLabel>
            <NativeSelect value={chaveAtual} onChange={(e) => set("itemKey")(e.target.value)}>
              {opcoes.map((i) => (
                <option key={i.id} value={`${i.categoria}|||${i.descricao}`}>
                  {i.categoria} — {i.descricao}
                </option>
              ))}
            </NativeSelect>
          </Grid>
          <Grid item xs={12}>
            <FieldLabel>Nome</FieldLabel>
            <VuiInput
              fullWidth
              value={f.nome}
              onChange={(e) => set("nome")(e.target.value)}
              inputProps={{ maxLength: 60 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FieldLabel>Valor da parcela (R$)</FieldLabel>
            <VuiInput
              fullWidth
              value={f.valor}
              onChange={(e) => set("valor")(e.target.value)}
              inputProps={{ inputMode: "decimal" }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FieldLabel>Total de parcelas</FieldLabel>
            <VuiInput
              fullWidth
              placeholder="vazio = sem fim"
              value={f.parcelas}
              onChange={(e) => set("parcelas")(e.target.value)}
              inputProps={{ inputMode: "numeric" }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FieldLabel>Parcela inicial</FieldLabel>
            <VuiInput
              fullWidth
              value={f.parcelaInicial}
              onChange={(e) => set("parcelaInicial")(e.target.value)}
              inputProps={{ inputMode: "numeric" }}
            />
          </Grid>
          <Grid item xs={7} sm={5}>
            <FieldLabel>Mês da parcela inicial</FieldLabel>
            <NativeSelect value={f.mes} onChange={(e) => set("mes")(Number(e.target.value))}>
              {MESES_LONGOS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </NativeSelect>
          </Grid>
          <Grid item xs={5} sm={3}>
            <FieldLabel>Ano</FieldLabel>
            <VuiInput
              fullWidth
              value={f.ano}
              onChange={(e) => set("ano")(e.target.value)}
              inputProps={{ inputMode: "numeric" }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FieldLabel>Dia do vencimento</FieldLabel>
            <VuiInput
              fullWidth
              placeholder="opcional"
              value={f.dia}
              onChange={(e) => set("dia")(e.target.value)}
              inputProps={{ inputMode: "numeric" }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FieldLabel>Situação</FieldLabel>
            <NativeSelect value={f.ativa ? "1" : "0"} onChange={(e) => set("ativa")(e.target.value === "1")}>
              <option value="1">Ativa</option>
              <option value="0">Pausada</option>
            </NativeSelect>
          </Grid>
          <Grid item xs={12}>
            <FieldLabel>Observações</FieldLabel>
            <VuiInput
              fullWidth
              value={f.obs}
              onChange={(e) => set("obs")(e.target.value)}
              inputProps={{ maxLength: 120 }}
            />
          </Grid>
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

RecorrenciaDialog.propTypes = {
  aberto: PropTypes.bool.isRequired,
  rec: PropTypes.object,
  itens: PropTypes.array.isRequired,
  ano: PropTypes.number,
  onFechar: PropTypes.func.isRequired,
  onSalvar: PropTypes.func.isRequired,
};

RecorrenciaDialog.defaultProps = {
  rec: null,
  ano: null,
};

export default RecorrenciaDialog;
