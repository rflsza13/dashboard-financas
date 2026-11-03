import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import api from "services/sheetsApi";
import { aoEncerrar, encerrarSessao, exigeLogin, iniciarSessao, modoAcesso, restaurarSessao } from "services/auth";

const AuthContext = createContext({
  exigeLogin: false,
  liberado: true,
  usuario: null,
  erro: "",
  verificando: false,
  entrar: async () => {},
  sair: () => {},
});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const s = exigeLogin ? restaurarSessao() : null;
    return s ? s.usuario : null;
  });
  const [erro, setErro] = useState("");
  const [verificando, setVerificando] = useState(false);

  useEffect(
    () =>
      aoEncerrar((motivo) => {
        setUsuario(null);
        if (motivo) setErro(motivo);
      }),
    []
  );

  const entrar = useCallback(async (credencial) => {
    setErro("");
    setVerificando(true);
    const sessao = iniciarSessao(credencial);
    if (!sessao) {
      setVerificando(false);
      setErro("Não foi possível ler o login do Google. Tente novamente.");
      return;
    }
    try {
      await api.quemSou();
      setUsuario(sessao.usuario);
    } catch (e) {
      encerrarSessao();
      setUsuario(null);
      setErro(e.message);
    } finally {
      setVerificando(false);
    }
  }, []);

  const sair = useCallback(() => {
    setErro("");
    encerrarSessao();
  }, []);

  const value = useMemo(
    () => ({
      exigeLogin,
      modo: modoAcesso,
      liberado: !exigeLogin || Boolean(usuario),
      usuario,
      erro,
      verificando,
      entrar,
      sair,
    }),
    [usuario, erro, verificando, entrar, sair]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  return useContext(AuthContext);
}
