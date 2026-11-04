import { useEffect, useRef, useState } from "react";

import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";

import { useAuth } from "context/auth";
import { CLIENT_ID } from "services/auth";
import themeConfig from "themeConfig";

const GIS_URL = "https://accounts.google.com/gsi/client";

function carregarGoogle() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      resolve();
      return;
    }
    let script = document.querySelector(`script[src="${GIS_URL}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GIS_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Falha ao carregar o login do Google.")));
  });
}

function Login() {
  const { modo, erro, verificando, entrar } = useAuth();
  const botao = useRef(null);
  const entrarRef = useRef(entrar);
  entrarRef.current = entrar;
  const [erroLocal, setErroLocal] = useState("");
  const { login } = themeConfig;

  useEffect(() => {
    if (modo !== "google") return undefined;
    let ativo = true;
    carregarGoogle()
      .then(() => {
        if (!ativo || !botao.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resposta) => entrarRef.current(resposta.credential),
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(botao.current, {
          theme: "filled_black",
          shape: "pill",
          size: "large",
          width: 280,
          locale: "pt-BR",
        });
      })
      .catch(() => ativo && setErroLocal("Não foi possível carregar o login do Google. Verifique sua conexão e recarregue a página."));
    return () => {
      ativo = false;
    };
  }, [modo]);

  const mensagem =
    modo === "config"
      ? "O login ainda não foi configurado: defina REACT_APP_GOOGLE_CLIENT_ID (veja o COMO-CONFIGURAR.md)."
      : erro || erroLocal;

  const imagem = login.imageUrl
    ? `${login.imageOverlay}, url("${login.imageUrl}") center / cover no-repeat`
    : login.fallbackBackground;

  return (
    <VuiBox
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        background: themeConfig.background.gradient,
      }}
    >
      <VuiBox
        aria-hidden="true"
        sx={{
          flex: { xs: "0 0 28vh", lg: "0 0 55%" },
          background: imagem,
        }}
      />
      <VuiBox
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          background: themeConfig.background.gradient,
        }}
      >
        <VuiBox
          sx={{
            width: "100%",
            maxWidth: 440,
            borderRadius: "24px",
            p: { xs: 3, sm: 5 },
            background: themeConfig.cards.background,
            backdropFilter: login.panelBlur,
            WebkitBackdropFilter: login.panelBlur,
            border: `1px solid ${themeConfig.cards.borderColor}`,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          }}
        >
          <VuiTypography variant="h3" color="white" fontWeight="bold" mb="8px">
            {login.title}
          </VuiTypography>
          <VuiTypography variant="button" color="text" fontWeight="regular" sx={{ display: "block", mb: "28px" }}>
            {login.message}
          </VuiTypography>

          {modo === "google" && (
            <VuiBox display="flex" justifyContent="center" sx={{ minHeight: 44, opacity: verificando ? 0.5 : 1 }}>
              <div ref={botao} />
            </VuiBox>
          )}
          {verificando && (
            <VuiTypography variant="caption" color="text" sx={{ display: "block", textAlign: "center", mt: "12px" }}>
              Verificando acesso…
            </VuiTypography>
          )}
          {mensagem && (
            <VuiBox
              role="alert"
              mt={3}
              p="12px 16px"
              sx={{ borderRadius: "15px", border: "1px solid #E31A1A", background: "rgba(227, 26, 26, 0.12)" }}
            >
              <VuiTypography variant="button" color="error" fontWeight="regular">
                {mensagem}
              </VuiTypography>
            </VuiBox>
          )}
        </VuiBox>
      </VuiBox>
    </VuiBox>
  );
}

export default Login;
