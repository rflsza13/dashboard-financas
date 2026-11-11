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
import { useAuth } from "context/auth";
import {
  PADRAO_CORES,
  PRESETS,
  aplicarTema,
  derivar,
  limparCores,
  lerCores,
  recarregar,
  salvarCores,
  temaAtual,
} from "utils/tema";

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
  const { exigeLogin, usuario, sair } = useAuth();
  const [claro, setClaro] = useState(temaAtual() === "claro");
  const [cores, setCores] = useState(() => lerCores() || PADRAO_CORES);
  const [erroCores, setErroCores] = useState("");
  const previa = derivar(cores);
  const setCor = (campo) => (valor) => setCores((c) => ({ ...c, [campo]: valor }));

  const aplicarCoresTema = () => {
    const msg = salvarCores(cores);
    setErroCores(msg);
    if (!msg) recarregar.executar();
  };

  const restaurarCores = () => {
    limparCores();
    recarregar.executar();
  };

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
    const camposBooleanos = ["mediaAutomatica", ...RECURSOS.map((r) => r.chave)];
    const booleanos = camposBooleanos.reduce((acc, k) => {
      acc[k] = Boolean(form[k]);
      return acc;
    }, {});
    const res = await salvarConfig({
      ...form,
      ...booleanos,
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
                      disabled={form[chave] === "auto"}
                      value={/^#[0-9a-fA-F]{6}$/.test(form[chave]) ? form[chave] : themeConfig.accent}
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
                      {form[chave] === "auto" ? "segue o tema" : String(form[chave]).toLowerCase()}
                    </VuiTypography>
                    {chave === "corSaldo" && (
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: themeConfig.fonts.secondary, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          aria-label="Saldo segue o tema"
                          checked={form[chave] === "auto"}
                          onChange={(ev) => set(chave)(ev.target.checked ? "auto" : themeConfig.accent)}
                        />
                        seguir o tema
                      </label>
                    )}
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

              <VuiTypography variant="button" color="white" fontWeight="bold" sx={{ display: "block", mt: 3, mb: 1 }}>
                Cores do tema
              </VuiTypography>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
                Altera cards, fontes, fundo e cor de destaque. Escolha um tema pronto ou ajuste cada cor e clique em
                “Aplicar tema” (a página recarrega).
              </VuiTypography>
              <VuiBox display="flex" flexWrap="wrap" gap="8px" mb={2}>
                {PRESETS.map((p) => {
                  const { nome, ...valores } = p;
                  return (
                    <VuiButton key={nome} size="small" color="info" variant="outlined" onClick={() => setCores(valores)}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.destaque, marginRight: 6, display: "inline-block" }} />
                      {nome}
                    </VuiButton>
                  );
                })}
              </VuiBox>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                {[
                  ["destaque", "Cor de destaque"],
                  ["fundo", "Fundo da página"],
                  ["card", "Cor dos cards"],
                  ["texto", "Texto principal"],
                  ["textoSec", "Texto secundário"],
                ].map(([campo, rotulo]) => (
                  <Grid item xs={6} md={4} key={campo}>
                    <FieldLabel>{rotulo}</FieldLabel>
                    <VuiBox display="flex" alignItems="center" gap="8px">
                      <input
                        type="color"
                        aria-label={rotulo}
                        value={cores[campo]}
                        onChange={(ev) => setCor(campo)(ev.target.value)}
                        style={{ width: 40, height: 30, padding: 0, border: `1px solid ${themeConfig.cards.borderColor}`, borderRadius: 8, background: "transparent", cursor: "pointer" }}
                      />
                      <VuiTypography variant="caption" color="text">
                        {cores[campo]}
                      </VuiTypography>
                    </VuiBox>
                  </Grid>
                ))}
                <Grid item xs={12} md={8}>
                  <VuiBox display="flex" justifyContent="space-between">
                    <FieldLabel>Transparência dos cards</FieldLabel>
                    <VuiTypography variant="caption" color="text">
                      {Math.round(cores.opacidade * 100)}% opacos
                    </VuiTypography>
                  </VuiBox>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    step={1}
                    aria-label="Transparência dos cards"
                    value={Math.round(cores.opacidade * 100)}
                    onChange={(ev) => setCor("opacidade")(Number(ev.target.value) / 100)}
                    style={{ width: "100%", accentColor: cores.destaque }}
                  />
                </Grid>
              </Grid>

              <VuiBox sx={{ borderRadius: "16px", p: 2, background: previa.gradient, border: `1px solid ${themeConfig.cards.borderColor}` }} aria-label="Prévia do tema">
                <VuiBox sx={{ borderRadius: "16px", p: 2, background: previa.cardBackground, border: `1px solid ${previa.cardBorder}` }}>
                  <div style={{ color: previa.fonts.primary, fontWeight: 700, fontSize: 15 }}>Prévia do card</div>
                  <div style={{ color: previa.fonts.secondary, fontSize: 12, margin: "4px 0 10px" }}>Texto secundário de exemplo</div>
                  <span style={{ background: previa.primary, color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 12 }}>Destaque</span>
                </VuiBox>
              </VuiBox>
              {previa.contraste < 4.5 && (
                <VuiTypography variant="caption" color="warning" sx={{ display: "block", mt: 1 }}>
                  Contraste baixo entre o texto principal e os cards ({previa.contraste.toFixed(1)}:1). O texto pode ficar difícil de ler.
                </VuiTypography>
              )}
              {erroCores && (
                <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                  {erroCores}
                </VuiTypography>
              )}
              <VuiBox display="flex" gap="8px" mt={2}>
                <VuiButton size="small" color="info" variant="contained" onClick={aplicarCoresTema}>
                  Aplicar tema
                </VuiButton>
                <VuiButton size="small" color="info" variant="outlined" onClick={restaurarCores}>
                  Restaurar padrão
                </VuiButton>
              </VuiBox>
            </Card>
          </Grid>

          {exigeLogin && usuario && (
            <Grid item xs={12} xl={6}>
              <Card sx={{ height: "100%" }}>
                {titulo("Conta", "Acesso protegido por login do Google")}
                <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                  {usuario.nome}
                </VuiTypography>
                <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: 2 }}>
                  {usuario.email}
                </VuiTypography>
                <VuiBox>
                  <VuiButton size="small" color="info" variant="outlined" onClick={sair}>
                    Sair
                  </VuiButton>
                </VuiBox>
              </Card>
            </Grid>
          )}

          <Grid item xs={12} xl={6}>
            <Card>
              {titulo(
                "Funcionalidades",
                "Desligar esconde o bloco no dashboard; os dados continuam salvos."
              )}
              <VuiBox display="flex" alignItems="center" gap="16px" mb={2}>
                <VuiSwitch
                  color="info"
                  checked={Boolean(form.mediaAutomatica)}
                  onChange={(ev) => set("mediaAutomatica")(ev.target.checked)}
                  inputProps={{ "aria-label": "Estimativa automática pela média" }}
                />
                <VuiBox>
                  <VuiTypography variant="button" color="white" fontWeight="medium" sx={{ display: "block" }}>
                    Estimativa automática pela média
                  </VuiTypography>
                  <VuiTypography variant="caption" color="text" fontWeight="regular">
                    Desligado, o estimado é só o que você previu mais parcelas, faturas e recorrências. Ligado, itens que se repetem todo mês (2 dos últimos 3 meses) e não têm previsão também entram pela média; gastos esporádicos não.
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
