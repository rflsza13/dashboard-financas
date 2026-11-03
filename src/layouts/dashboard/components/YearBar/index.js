import { modoAcesso } from "services/auth";
import PropTypes from "prop-types";

import { IoAdd, IoRefresh } from "react-icons/io5";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiButton from "components/VuiButton";

import { useFinance } from "context/finance";

function YearBar({ titulo, children }) {
  const { anos, ano, selecionarAno, criarAno, recarregar, pendentes, erro, loadingYear, isDemo } =
    useFinance();

  const proximo = anos.length ? anos[anos.length - 1] + 1 : new Date().getFullYear();

  const handleNovoAno = async () => {
    if (window.confirm(`Criar a aba ${proximo} na planilha?`)) await criarAno();
  };

  let status = { texto: "Sincronizado", cor: "#01B574" };
  if (pendentes > 0 || loadingYear) status = { texto: "Salvando…", cor: "#ffb547" };
  else if (erro) status = { texto: "Atenção", cor: "#E31A1A" };

  return (
    <VuiBox mb={3}>
      {isDemo && (
        <VuiBox
          className="no-print"
          mb={2}
          p="12px 16px"
          sx={{ borderRadius: "15px", border: "1px solid #F6AD55", background: "rgba(246,173,85,0.08)" }}
        >
          <VuiTypography variant="button" color="warning" fontWeight="regular">
            Modo demonstração: dados fictícios guardados apenas neste navegador. Para usar a sua
            planilha, configure REACT_APP_SCRIPT_URL e REACT_APP_GOOGLE_CLIENT_ID no arquivo .env.
          </VuiTypography>
        </VuiBox>
      )}
      {modoAcesso === "token" && (
        <VuiBox
          className="no-print"
          mb={2}
          p="12px 16px"
          sx={{ borderRadius: "15px", border: "1px solid #F6AD55", background: "rgba(246,173,85,0.08)" }}
        >
          <VuiTypography variant="button" color="warning" fontWeight="regular">
            Modo desenvolvimento: acesso por senha fixa, sem login. Não publique assim; configure
            REACT_APP_GOOGLE_CLIENT_ID para ativar o login do Google.
          </VuiTypography>
        </VuiBox>
      )}
      {erro && (
        <VuiBox
          mb={2}
          p="12px 16px"
          sx={{ borderRadius: "15px", border: "1px solid #E31A1A", background: "rgba(227,26,26,0.08)" }}
        >
          <VuiTypography variant="button" color="error" fontWeight="regular">
            {erro}
          </VuiTypography>
        </VuiBox>
      )}
      <VuiBox display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="16px">
        <VuiBox>
          <VuiTypography variant="h4" color="white" fontWeight="bold">
            {titulo || `Finanças ${ano || ""}`}
          </VuiTypography>
          <VuiBox display="flex" alignItems="center" gap="8px" mt="4px">
            <VuiBox sx={{ width: 8, height: 8, borderRadius: "50%", background: status.cor }} />
            <VuiTypography variant="caption" color="text">
              {status.texto}
            </VuiTypography>
          </VuiBox>
        </VuiBox>
        <VuiBox display="flex" flexWrap="wrap" alignItems="center" gap="8px" className="no-print">
          {anos.map((a) => (
            <VuiButton
              key={a}
              size="small"
              color="info"
              variant={a === ano ? "contained" : "outlined"}
              onClick={() => selecionarAno(a)}
            >
              {a}
            </VuiButton>
          ))}
          <VuiButton size="small" color="info" variant="outlined" onClick={handleNovoAno}>
            <IoAdd size="14px" style={{ marginRight: 4 }} />
            Novo ano
          </VuiButton>
          <VuiButton size="small" color="info" variant="text" onClick={recarregar}>
            <IoRefresh size="14px" style={{ marginRight: 4 }} />
            Recarregar
          </VuiButton>
          {children}
        </VuiBox>
      </VuiBox>
    </VuiBox>
  );
}

YearBar.propTypes = {
  titulo: PropTypes.string,
  children: PropTypes.node,
};

YearBar.defaultProps = {
  titulo: "",
  children: null,
};

export default YearBar;
