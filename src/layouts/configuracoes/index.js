import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import VuiSwitch from "components/VuiSwitch";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { FieldLabel } from "layouts/dashboard/components/fields";
import { useFinance } from "context/finance";
import { RECURSOS, validarConfig } from "utils/config";
import themeConfig from "themeConfig";
import { aplicarTema, temaAtual } from "utils/tema";

const CORES = [
  { chave: "corReceitas", rotulo: "Receitas" },
  { chave: "corDespesas", rotulo: "Despesas" },
  { chave: "corSaldo", rotulo: "Saldo acumulado" },
];

function Configuracoes() {
  const { config, salvarConfig } = useFinance();
  const [form, setForm] = useState(config);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [retorno, setRetorno] = useState(null);
  const [claro, setClaro] = useState(temaAtual() === "claro");

  const alternarTema = (ligado) => {
    setClaro(ligado);
    aplicarTema(ligado ? "claro" : "escuro");
  };

  useEffect(() => {
    setForm(config);
  }, [config]);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const erro = (campo) =>
    erros[campo] ? (
      <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: "4px" }}>
        {erros[campo]}
      </VuiTypography>
    ) : null;

  const salvar = async () => {
    const e = validarConfig(form);
    setErros(e);
    setRetorno(null);
    if (Object.keys(e).length) return;
    setSalvando(true);
    const res = await salvarConfig({
      ...form,
      nomeSistema: String(form.nomeSistema).trim(),
      topCategorias: Number(form.topCategorias),
    });
    setSalvando(false);
    setRetorno(
      res.ok
        ? { cor: "success", texto: "Configurações salvas" }
        : { cor: "error", texto: `Não foi possível salvar: ${res.erro}` }
    );
  };

  const titulo = (texto, descricao) => (
    <>
      <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
        {texto}
      </VuiTypography>
      <VuiTypography variant="button" color="text" fontWeight="regular" mb="20px">
        {descricao}
      </VuiTypography>
    </>
  );

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <VuiBox
          mb={3}
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          gap="16px"
        >
          <VuiBox>
            <VuiTypography variant="h4" color="white" fontWeight="bold">
              Configurações
            </VuiTypography>
            {retorno && (
              <VuiTypography variant="caption" color={retorno.cor} sx={{ display: "block", mt: "4px" }}>
                {retorno.texto}
              </VuiTypography>
            )}
          </VuiBox>
          <VuiButton color="info" variant="contained" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar alterações"}
          </VuiButton>
        </VuiBox>

        <Grid container spacing={3}>
          <Grid item xs={12} xl={6}>
            <Card sx={{ height: "100%" }}>
              {titulo("Geral", "Nome do sistema e limites de exibição")}
              <VuiBox mb={2}>
                <FieldLabel>Nome do sistema</FieldLabel>
                <VuiInput
                  fullWidth
                  value={form.nomeSistema}
                  onChange={(ev) => set("nomeSistema")(ev.target.value)}
                  error={Boolean(erros.nomeSistema)}
                />
                {erro("nomeSistema")}
              </VuiBox>
              <VuiBox>
                <FieldLabel>Categorias exibidas no gráfico</FieldLabel>
                <VuiInput
                  fullWidth
                  value={form.topCategorias}
                  onChange={(ev) => set("topCategorias")(ev.target.value)}
                  error={Boolean(erros.topCategorias)}
                  inputProps={{ inputMode: "numeric" }}
                />
                {erro("topCategorias")}
              </VuiBox>
            </Card>
          </Grid>

          <Grid item xs={12} xl={6}>
            <Card sx={{ height: "100%" }}>
              {titulo("Cores do gráfico", "Cores usadas no fluxo mensal")}
              {CORES.map(({ chave, rotulo }) => (
                <VuiBox key={chave} mb={2}>
                  <FieldLabel>{rotulo}</FieldLabel>
                  <VuiBox display="flex" alignItems="center" gap="12px">
                    <input
                      type="color"
                      aria-label={`Cor de ${rotulo}`}
                      value={/^#[0-9a-fA-F]{6}$/.test(form[chave]) ? form[chave] : "#000000"}
                      onChange={(ev) => set(chave)(ev.target.value)}
                      style={{
                        width: 44,
                        height: 32,
                        padding: 0,
                        border: `1px solid ${themeConfig.cards.borderColor}`,
                        borderRadius: 8,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    />
                    <VuiTypography variant="button" color="text" fontWeight="regular">
                      {String(form[chave]).toLowerCase()}
                    </VuiTypography>
                  </VuiBox>
                  {erro(chave)}
                </VuiBox>
              ))}
            </Card>
          </Grid>

          <Grid item xs={12} xl={6}>
            <Card sx={{ height: "100%" }}>
              {titulo("Aparência", "Vale só neste navegador e é aplicada na hora")}
              <VuiBox display="flex" alignItems="center" gap="16px">
                <VuiSwitch
                  color="info"
                  checked={claro}
                  onChange={(ev) => alternarTema(ev.target.checked)}
                  inputProps={{ "aria-label": "Tema claro" }}
                />
                <VuiBox>
                  <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                    Tema claro
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" fontWeight="regular">
                    Inverte as cores do painel para um visual claro (aproximado). Para PDF, use “Exportar PDF” no resumo mensal.
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>

          <Grid item xs={12} xl={6}>
            <Card>
              {titulo(
                "Funcionalidades",
                "Desligar esconde o bloco no dashboard; os dados continuam salvos."
              )}
              <VuiBox display="flex" alignItems="center" gap="16px" mb={2}>
                <VuiSwitch
                  color="info"
                  checked={Boolean(form.estimarMedia)}
                  onChange={(ev) => set("estimarMedia")(ev.target.checked)}
                  inputProps={{ "aria-label": "Estimar pela média" }}
                />
                <VuiBox>
                  <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                    Estimar pela média
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" fontWeight="regular">
                    Itens sem previsão nem parcela são estimados pela média dos meses anteriores.
                  </VuiTypography>
                </VuiBox>
              </VuiBox>
              {["Blocos do dashboard", "Páginas"].map((grupo) => (
                <VuiBox key={grupo}>
                  <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mt: 1, mb: 2 }}>
                    {grupo}
                  </VuiTypography>
                  {RECURSOS.filter((r) => r.grupo === grupo).map(({ chave, rotulo, ajuda }) => (
                    <VuiBox key={chave} display="flex" alignItems="center" gap="16px" mb={2}>
                      <VuiSwitch
                        color="info"
                        checked={Boolean(form[chave])}
                        onChange={(ev) => set(chave)(ev.target.checked)}
                        inputProps={{ "aria-label": rotulo }}
                      />
                      <VuiBox>
                        <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                          {rotulo}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text" fontWeight="regular">
                          {ajuda}
                        </VuiTypography>
                      </VuiBox>
                    </VuiBox>
                  ))}
                </VuiBox>
              ))}
            </Card>
          </Grid>
        </Grid>
      </VuiBox>
    </DashboardLayout>
  );
}

export default Configuracoes;
