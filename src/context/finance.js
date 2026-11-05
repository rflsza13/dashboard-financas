import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import PropTypes from "prop-types";

import api, { isDemo, TABELAS } from "services/sheetsApi";
import { mesclarConfig, recursosDe } from "utils/config";
import { calcularAno } from "utils/finance";

const FinanceContext = createContext();
FinanceContext.displayName = "FinanceContext";

const dadosVazios = () => TABELAS.reduce((acc, t) => ({ ...acc, [t]: [] }), {});

const initialState = {
  loading: true,
  loadingYear: false,
  erro: null,
  anos: [],
  ano: null,
  mes: new Date().getMonth(),
  itens: {},
  recorrencias: [],
  dados: dadosVazios(),
  pendentes: 0,
  config: mesclarConfig(),
};

const trocaItem = (state, ano, id, fn) => ({
  ...state,
  itens: { ...state.itens, [ano]: (state.itens[ano] || []).map((i) => (i.id === id ? fn(i) : i)) },
});

const trocaRec = (state, fn) => ({ ...state, recorrencias: fn(state.recorrencias) });

function reducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: action.value };
    case "LOADING_YEAR":
      return { ...state, loadingYear: action.value };
    case "ERROR":
      return { ...state, erro: action.value };
    case "INIT":
      return {
        ...state,
        loading: false,
        erro: null,
        anos: action.anos,
        ano: action.ano,
        itens: action.ano ? { [action.ano]: action.itens } : {},
        recorrencias: action.recorrencias,
        dados: action.dados,
        config: action.config,
      };
    case "INIT_ERROR":
      return { ...state, loading: false, erro: action.error };
    case "SET_META":
      return {
        ...state,
        anos: action.anos,
        recorrencias: action.recorrencias,
        dados: action.dados,
        config: action.config,
      };
    case "SET_LINHAS": {
      const atual = state.dados[action.tabela] || [];
      const mapa = new Map(atual.map((l) => [l.id, l]));
      action.linhas.forEach((l) => mapa.set(l.id, l));
      return { ...state, dados: { ...state.dados, [action.tabela]: [...mapa.values()] } };
    }
    case "BATCH_UNDO": {
      const ids = action.novos.map((l) => l.id);
      const base = (state.dados[action.tabela] || []).filter((l) => !ids.includes(l.id));
      const mapa = new Map(base.map((l) => [l.id, l]));
      action.anteriores.forEach((l) => mapa.set(l.id, l));
      return { ...state, dados: { ...state.dados, [action.tabela]: [...mapa.values()] } };
    }
    case "REMOVE_LINHAS":
      return {
        ...state,
        dados: {
          ...state.dados,
          [action.tabela]: (state.dados[action.tabela] || []).filter((l) => !action.ids.includes(l.id)),
        },
      };
    case "SET_CONFIG":
      return { ...state, config: action.config };
    case "SET_YEAR":
      return { ...state, ano: action.ano };
    case "SET_MES":
      return { ...state, mes: action.mes };
    case "SET_ITENS":
      return { ...state, itens: { ...state.itens, [action.ano]: action.itens } };
    case "ADD_YEAR":
      return {
        ...state,
        anos: [...state.anos, action.ano].sort((a, b) => a - b),
        ano: action.ano,
        itens: { ...state.itens, [action.ano]: action.itens },
      };
    case "SET_CELL":
      return trocaItem(state, action.ano, action.id, (i) => {
        const lista = [...i[action.campo]];
        lista[action.mes] = action.valor;
        return { ...i, [action.campo]: lista };
      });
    case "ADD_REC":
      return trocaRec(state, (lista) => [...lista, action.rec]);
    case "UPDATE_REC":
      return trocaRec(state, (lista) => lista.map((r) => (r.id === action.rec.id ? action.rec : r)));
    case "REMOVE_REC":
      return trocaRec(state, (lista) => lista.filter((r) => r.id !== action.id));
    case "PENDING":
      return { ...state, pendentes: Math.max(0, state.pendentes + action.delta) };
    default:
      throw new Error(`Ação desconhecida: ${action.type}`);
  }
}

const normalizaAnos = (anos) => anos.map(Number).sort((a, b) => a - b);

const normalizaDados = (dados) => ({ ...dadosVazios(), ...(dados || {}) });

const recVazia = (rec) => ({
  ...rec,
  dia: Number(rec.dia) >= 1 && Number(rec.dia) <= 31 ? Math.floor(Number(rec.dia)) : null,
  valor: Number(rec.valor) || 0,
  parcelas: rec.parcelas === "" || rec.parcelas === null ? null : Number(rec.parcelas) || null,
  parcelaInicial: Number(rec.parcelaInicial) || 1,
});

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const carregarAno = useCallback(async (ano) => {
    dispatch({ type: "LOADING_YEAR", value: true });
    try {
      const itens = await api.listarAno(ano);
      dispatch({ type: "SET_ITENS", ano, itens });
      return true;
    } catch (e) {
      dispatch({ type: "ERROR", value: `Erro ao ler ${ano}: ${e.message}` });
      return false;
    } finally {
      dispatch({ type: "LOADING_YEAR", value: false });
    }
  }, []);

  const iniciar = useCallback(async () => {
    dispatch({ type: "LOADING", value: true });
    try {
      const meta = await api.bootstrap();
      const anos = normalizaAnos(meta.anos);
      const hoje = new Date().getFullYear();
      let ano = null;
      if (anos.length) ano = anos.includes(hoje) ? hoje : anos[anos.length - 1];
      const itens = ano ? await api.listarAno(ano) : [];
      dispatch({
        type: "INIT",
        anos,
        ano,
        itens,
        recorrencias: (meta.recorrencias || []).map(recVazia),
        dados: normalizaDados(meta.dados),
        config: mesclarConfig(meta.config),
      });
    } catch (e) {
      dispatch({ type: "INIT_ERROR", error: `Não foi possível carregar a planilha: ${e.message}` });
    }
  }, []);

  useEffect(() => {
    iniciar();
  }, [iniciar]);

  const selecionarAno = useCallback(
    (ano) => {
      dispatch({ type: "SET_YEAR", ano });
      if (!stateRef.current.itens[ano]) carregarAno(ano);
    },
    [carregarAno]
  );

  const selecionarMes = useCallback((mes) => dispatch({ type: "SET_MES", mes }), []);

  const recarregar = useCallback(async () => {
    dispatch({ type: "LOADING_YEAR", value: true });
    try {
      const meta = await api.bootstrap();
      dispatch({
        type: "SET_META",
        anos: normalizaAnos(meta.anos),
        recorrencias: (meta.recorrencias || []).map(recVazia),
        dados: normalizaDados(meta.dados),
        config: mesclarConfig(meta.config),
      });
      const { ano } = stateRef.current;
      if (ano) {
        const itens = await api.listarAno(ano);
        dispatch({ type: "SET_ITENS", ano, itens });
      }
      dispatch({ type: "ERROR", value: null });
    } catch (e) {
      dispatch({ type: "ERROR", value: `Erro ao recarregar: ${e.message}` });
    } finally {
      dispatch({ type: "LOADING_YEAR", value: false });
    }
  }, []);

  // Atualiza a tela na hora e confirma na planilha em segundo plano; desfaz se falhar.
  const executar = useCallback(async (otimista, desfazer, requisicao) => {
    dispatch(otimista);
    dispatch({ type: "PENDING", delta: 1 });
    dispatch({ type: "ERROR", value: null });
    try {
      await requisicao();
      return true;
    } catch (e) {
      dispatch(desfazer);
      dispatch({ type: "ERROR", value: `Não foi possível salvar na planilha: ${e.message}` });
      return false;
    } finally {
      dispatch({ type: "PENDING", delta: -1 });
    }
  }, []);

  // Operações que mexem na estrutura da planilha: confirma primeiro e relê o ano
  // (as linhas podem ter mudado de posição).
  const estrutural = useCallback(
    async (requisicao) => {
      dispatch({ type: "PENDING", delta: 1 });
      try {
        await requisicao();
        await carregarAno(stateRef.current.ano);
        dispatch({ type: "ERROR", value: null });
        return { ok: true };
      } catch (e) {
        return { ok: false, erro: e.message };
      } finally {
        dispatch({ type: "PENDING", delta: -1 });
      }
    },
    [carregarAno]
  );

  const setCelula = useCallback(
    (item, mes, campo, valor) => {
      const { ano } = stateRef.current;
      const anterior = item[campo][mes];
      const novo = Number(valor) || 0;
      if (novo === anterior) return Promise.resolve(true);
      return executar(
        { type: "SET_CELL", ano, id: item.id, campo, mes, valor: novo },
        { type: "SET_CELL", ano, id: item.id, campo, mes, valor: anterior },
        () => api.setCelula(ano, item, mes, campo, novo)
      );
    },
    [executar]
  );

  const criarItem = useCallback(
    (dados) => estrutural(() => api.criarItem(stateRef.current.ano, dados)),
    [estrutural]
  );

  const editarItem = useCallback(
    (item, dados) => estrutural(() => api.editarItem(stateRef.current.ano, item, dados)),
    [estrutural]
  );

  const excluirItem = useCallback(
    (item) => estrutural(() => api.excluirItem(stateRef.current.ano, item)),
    [estrutural]
  );

  const criarRecorrencia = useCallback(async (dados) => {
    dispatch({ type: "PENDING", delta: 1 });
    try {
      const rec = await api.criarRecorrencia(recVazia(dados));
      dispatch({ type: "ADD_REC", rec: recVazia(rec) });
      dispatch({ type: "ERROR", value: null });
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e.message };
    } finally {
      dispatch({ type: "PENDING", delta: -1 });
    }
  }, []);

  const atualizarRecorrencia = useCallback(
    (dados) => {
      const rec = recVazia(dados);
      const anterior = stateRef.current.recorrencias.find((r) => r.id === rec.id);
      if (!anterior) return Promise.resolve(false);
      return executar(
        { type: "UPDATE_REC", rec },
        { type: "UPDATE_REC", rec: anterior },
        () => api.atualizarRecorrencia(rec)
      );
    },
    [executar]
  );

  const excluirRecorrencia = useCallback(
    (id) => {
      const anterior = stateRef.current.recorrencias.find((r) => r.id === id);
      if (!anterior) return Promise.resolve(false);
      return executar({ type: "REMOVE_REC", id }, { type: "ADD_REC", rec: anterior }, () =>
        api.excluirRecorrencia(id)
      );
    },
    [executar]
  );

  const criarAno = useCallback(async () => {
    const { anos } = stateRef.current;
    const novo = anos.length ? anos[anos.length - 1] + 1 : new Date().getFullYear();
    dispatch({ type: "PENDING", delta: 1 });
    try {
      await api.criarAno(novo);
      const itens = await api.listarAno(novo);
      dispatch({ type: "ADD_YEAR", ano: novo, itens });
      dispatch({ type: "ERROR", value: null });
      return novo;
    } catch (e) {
      dispatch({ type: "ERROR", value: `Não foi possível criar o ano ${novo}: ${e.message}` });
      return null;
    } finally {
      dispatch({ type: "PENDING", delta: -1 });
    }
  }, []);

  const garantirAno = useCallback(
    async (alvo) => {
      if (!alvo || stateRef.current.itens[alvo]) return true;
      try {
        const itens = await api.listarAno(alvo);
        dispatch({ type: "SET_ITENS", ano: alvo, itens });
        return true;
      } catch (e) {
        dispatch({ type: "ERROR", value: `Erro ao ler ${alvo}: ${e.message}` });
        return false;
      }
    },
    []
  );

  // Cria ou atualiza linhas de uma tabela auxiliar (metas, cartões, compras...).
  const salvarLinhas = useCallback(
    (tabela, linhas) => {
      const anteriores = (stateRef.current.dados[tabela] || []).filter((l) => linhas.some((n) => n.id === l.id));
      const novos = linhas.filter((n) => !anteriores.some((a) => a.id === n.id));
      return executar(
        { type: "SET_LINHAS", tabela, linhas },
        { type: "BATCH_UNDO", tabela, anteriores, novos },
        () => api.salvarLinhas(tabela, linhas)
      );
    },
    [executar]
  );

  const excluirLinhas = useCallback(
    (tabela, ids) => {
      const anteriores = (stateRef.current.dados[tabela] || []).filter((l) => ids.includes(l.id));
      return executar(
        { type: "REMOVE_LINHAS", tabela, ids },
        { type: "SET_LINHAS", tabela, linhas: anteriores },
        () => api.excluirLinhas(tabela, ids)
      );
    },
    [executar]
  );

  const marcarPago = useCallback(
    (chave, pago) => (pago ? salvarLinhas("pagos", [{ id: chave }]) : excluirLinhas("pagos", [chave])),
    [salvarLinhas, excluirLinhas]
  );

  // Soma valores aos realizados (importação de extrato) e registra o que já foi importado.
  const importarLancamentos = useCallback(
    async ({ lista, hashes, regras }) => {
      dispatch({ type: "PENDING", delta: 1 });
      try {
        const { ano: alvo } = stateRef.current;
        if (lista.length) await api.somarCelulas(alvo, lista);
        if (hashes.length) await api.salvarLinhas("importados", hashes.map((id) => ({ id })));
        if (regras.length) await api.salvarLinhas("regras", regras);
        dispatch({ type: "SET_LINHAS", tabela: "importados", linhas: hashes.map((id) => ({ id })) });
        if (regras.length) dispatch({ type: "SET_LINHAS", tabela: "regras", linhas: regras });
        await carregarAno(alvo);
        return { ok: true };
      } catch (e) {
        return { ok: false, erro: e.message };
      } finally {
        dispatch({ type: "PENDING", delta: -1 });
      }
    },
    [carregarAno]
  );

  const salvarConfig = useCallback(async (config) => {
    try {
      const salva = await api.salvarConfig(config);
      dispatch({ type: "SET_CONFIG", config: mesclarConfig(salva || config) });
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e.message };
    }
  }, []);

  const itensAno = state.itens[state.ano];
  const calc = useMemo(
    () =>
      calcularAno(itensAno || [], state.recorrencias, state.ano, {
        mediaAutomatica: Boolean(state.config.mediaAutomatica),
        cartoes: state.dados.cartoes,
        compras: state.dados.compras,
      }),
    [itensAno, state.recorrencias, state.ano, state.config.mediaAutomatica, state.dados.cartoes, state.dados.compras]
  );

  const calcularOutroAno = useCallback(
    (alvo) =>
      state.itens[alvo]
        ? calcularAno(state.itens[alvo], state.recorrencias, alvo, {
            mediaAutomatica: Boolean(state.config.mediaAutomatica),
            cartoes: state.dados.cartoes,
            compras: state.dados.compras,
          })
        : null,
    [state.itens, state.recorrencias, state.config.mediaAutomatica, state.dados.cartoes, state.dados.compras]
  );

  const value = useMemo(
    () => ({
      ...state,
      calc,
      itensAno: itensAno || [],
      ...state.dados,
      calcularOutroAno,
      recursos: recursosDe(state.config),
      isDemo,
      selecionarAno,
      selecionarMes,
      recarregar,
      setCelula,
      criarItem,
      editarItem,
      excluirItem,
      criarRecorrencia,
      atualizarRecorrencia,
      excluirRecorrencia,
      criarAno,
      salvarConfig,
      garantirAno,
      salvarLinhas,
      excluirLinhas,
      marcarPago,
      importarLancamentos,
    }),
    [
      state,
      calc,
      itensAno,
      selecionarAno,
      selecionarMes,
      recarregar,
      setCelula,
      criarItem,
      editarItem,
      excluirItem,
      criarRecorrencia,
      atualizarRecorrencia,
      excluirRecorrencia,
      criarAno,
      salvarConfig,
      garantirAno,
      salvarLinhas,
      excluirLinhas,
      marcarPago,
      importarLancamentos,
      calcularOutroAno,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

FinanceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  return ctx;
}
