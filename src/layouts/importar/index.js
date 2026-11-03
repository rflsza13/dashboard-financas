import { useMemo, useRef, useState } from "react";
import { Card } from "@mui/material";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import YearBar from "layouts/dashboard/components/YearBar";
import { NativeSelect } from "layouts/dashboard/components/fields";

import { useFinance } from "context/finance";
import { MESES, brl, norm } from "utils/finance";
import { lerExtrato, sugerirItem } from "utils/importar";
import themeConfig from "themeConfig";

const BORDA = `1px solid ${themeConfig.cards.borderColor}`;
const th = { padding: "8px", fontSize: 12, fontWeight: 500, color: themeConfig.fonts.secondary, borderBottom: BORDA, textAlign: "left", whiteSpace: "nowrap" };
const td = { padding: "6px 8px", fontSize: 13, color: themeConfig.fonts.primary };

function Importar() {
  const { loading, ano, itensAno, regras, importados, importarLancamentos } = useFinance();
  const [arquivo, setArquivo] = useState("");
  const [linhas, setLinhas] = useState([]);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef(null);

  const jaImportados = useMemo(() => new Set(importados.map((i) => i.id)), [importados]);

  const ler = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setResultado(null);
    const texto = await f.text();
    const { lancamentos, erro: msg } = lerExtrato(f.name, texto);
    setArquivo(f.name);
    setErro(msg);
    setLinhas(
      lancamentos.map((l) => {
        const itemId = sugerirItem(l, itensAno, regras);
        const foraDoAno = Number(l.data.slice(0, 4)) !== ano;
        const duplicado = jaImportados.has(l.hash);
        return { ...l, itemId, lembrar: false, foraDoAno, duplicado, incluir: Boolean(itemId) && !foraDoAno && !duplicado };
      })
    );
  };

  const muda = (hash, patch) => setLinhas((ls) => ls.map((l) => (l.hash === hash ? { ...l, ...patch } : l)));
  const opcoes = (l) => itensAno.filter((i) => (l.valor > 0 ? i.bloco === "Receita" : i.bloco !== "Receita"));

  const escolhidos = linhas.filter((l) => l.incluir && l.itemId && !l.foraDoAno && !l.duplicado);
  const totalReceita = escolhidos.filter((l) => l.valor > 0).reduce((a, l) => a + l.valor, 0);
  const totalSaida = escolhidos.filter((l) => l.valor < 0).reduce((a, l) => a + Math.abs(l.valor), 0);

  const aplicar = async () => {
    const mapa = {};
    escolhidos.forEach((l) => {
      const mes = Number(l.data.slice(5, 7)) - 1;
      const chave = `${l.itemId}|${mes}`;
      if (!mapa[chave]) mapa[chave] = { item: itensAno.find((i) => i.id === l.itemId), mes, valor: 0 };
      mapa[chave].valor += Math.abs(l.valor);
    });
    const regrasNovas = escolhidos
      .filter((l) => l.lembrar)
      .map((l) => {
        const it = itensAno.find((i) => i.id === l.itemId);
        return { id: norm(l.descricao).slice(0, 40), bloco: it.bloco, categoria: it.categoria, item: it.descricao };
      })
      .filter((r) => r.id);
    setEnviando(true);
    const res = await importarLancamentos({
      lista: Object.values(mapa).map((x) => ({ ...x, valor: Math.round(x.valor * 100) / 100 })),
      hashes: escolhidos.map((l) => l.hash),
      regras: regrasNovas,
    });
    setEnviando(false);
    if (res.ok) {
      setResultado(`${escolhidos.length} lançamentos importados e somados à planilha.`);
      setLinhas([]);
      setArquivo("");
      if (entrada.current) entrada.current.value = "";
    } else {
      setErro(res.erro);
    }
  };

  return (
    <DashboardLayout>
      <VuiBox py={3}>
        <YearBar titulo="Importar extrato" />
        {loading && <VuiTypography variant="button" color="text">Carregando planilha…</VuiTypography>}
        {!loading && ano && (
          <>
            <Card sx={{ mb: 3 }}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="4px">Arquivo do banco</VuiTypography>
              <VuiTypography variant="caption" color="text" sx={{ display: "block", mb: "12px" }}>
                Aceita CSV (colunas Data, Descrição e Valor, ou Débito/Crédito) e OFX. Só entram lançamentos de {ano}; os valores são
                SOMADOS ao que já está lançado em cada mês. Lançamentos já importados antes são reconhecidos e ignorados.
              </VuiTypography>
              <input ref={entrada} type="file" accept=".csv,.ofx,.txt" aria-label="Arquivo de extrato" onChange={ler} style={{ color: themeConfig.fonts.primary }} />
              {erro && <VuiTypography variant="caption" color="error" sx={{ display: "block", mt: "8px" }}>{erro}</VuiTypography>}
              {resultado && <VuiTypography variant="caption" color="success" sx={{ display: "block", mt: "8px" }}>{resultado}</VuiTypography>}
            </Card>

            {linhas.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <VuiBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="12px" mb="12px">
                  <VuiBox>
                    <VuiTypography variant="lg" color="white" fontWeight="bold">{arquivo}</VuiTypography>
                    <VuiTypography variant="caption" color="text">
                      {escolhidos.length} de {linhas.length} selecionados · entradas {brl(totalReceita)} · saídas {brl(totalSaida)}
                    </VuiTypography>
                  </VuiBox>
                  <VuiButton color="info" variant="contained" disabled={!escolhidos.length || enviando} onClick={aplicar}>
                    {enviando ? "Importando…" : `Importar ${escolhidos.length} lançamentos`}
                  </VuiButton>
                </VuiBox>
                <VuiBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th style={th} />
                        <th style={th}>Data</th>
                        <th style={th}>Descrição</th>
                        <th style={{ ...th, textAlign: "right" }}>Valor</th>
                        <th style={{ ...th, minWidth: 240 }}>Item da planilha</th>
                        <th style={th}>Lembrar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => {
                        const bloqueado = l.foraDoAno || l.duplicado;
                        return (
                          <tr key={l.hash} style={{ borderBottom: BORDA, opacity: bloqueado ? 0.5 : 1 }}>
                            <td style={td}>
                              <input type="checkbox" aria-label={`Importar ${l.descricao}`} checked={l.incluir && !bloqueado} disabled={bloqueado || !l.itemId} onChange={(e) => muda(l.hash, { incluir: e.target.checked })} />
                            </td>
                            <td style={td}>{l.data.slice(8, 10)}/{MESES[Number(l.data.slice(5, 7)) - 1]}</td>
                            <td style={td}>
                              {l.descricao}
                              {l.duplicado && <span style={{ color: themeConfig.fonts.secondary, fontSize: 11 }}> · já importado</span>}
                              {l.foraDoAno && <span style={{ color: themeConfig.fonts.secondary, fontSize: 11 }}> · fora de {ano}</span>}
                            </td>
                            <td style={{ ...td, textAlign: "right", color: l.valor > 0 ? "#01b574" : themeConfig.fonts.primary }}>{brl(l.valor)}</td>
                            <td style={td}>
                              <NativeSelect value={l.itemId} disabled={bloqueado} aria-label={`Item de ${l.descricao}`} onChange={(e) => muda(l.hash, { itemId: e.target.value, incluir: Boolean(e.target.value) })}>
                                <option value="">— escolher item —</option>
                                {opcoes(l).map((i) => <option key={i.id} value={i.id}>{i.bloco === "Receita" ? "" : `${i.bloco === "Investimento" ? "Invest. · " : ""}`}{i.categoria} — {i.descricao}</option>)}
                              </NativeSelect>
                            </td>
                            <td style={td}>
                              <input type="checkbox" aria-label={`Lembrar regra de ${l.descricao}`} checked={l.lembrar} disabled={bloqueado || !l.itemId} onChange={(e) => muda(l.hash, { lembrar: e.target.checked })} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </VuiBox>
              </Card>
            )}

            {regras.length > 0 && (
              <Card>
                <VuiTypography variant="button" color="white" fontWeight="medium" mb="4px">Regras aprendidas</VuiTypography>
                <VuiTypography variant="caption" color="text">
                  {regras.length} regra(s): descrições que contêm “{regras.slice(0, 3).map((r) => r.id).join("”, “")}”{regras.length > 3 ? "…" : ""} já são sugeridas automaticamente.
                </VuiTypography>
              </Card>
            )}
          </>
        )}
      </VuiBox>
    </DashboardLayout>
  );
}

export default Importar;
