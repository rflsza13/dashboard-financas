const SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL;
export const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
export const TOKEN_DEV = process.env.REACT_APP_SCRIPT_TOKEN;

/**
 * demo   : sem planilha configurada, dados fictícios, sem login
 * google : login com conta Google verificado no servidor (Apps Script)
 * token  : só para desenvolvimento local, senha fixa no .env (sem login)
 * config : planilha configurada, mas falta REACT_APP_GOOGLE_CLIENT_ID
 */
export const modoAcesso = !SCRIPT_URL ? "demo" : CLIENT_ID ? "google" : TOKEN_DEV ? "token" : "config";
export const exigeLogin = modoAcesso === "google" || modoAcesso === "config";

const CHAVE = "financas-sessao";
const ouvintes = new Set();
let sessao = null;

export function decodificarJwt(credencial) {
  try {
    const parte = String(credencial).split(".")[1];
    const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  } catch (e) {
    return null;
  }
}

const valida = (s) => Boolean(s && s.token && s.expira && s.expira * 1000 > Date.now() + 5000);

function persistir() {
  try {
    if (sessao) window.sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
    else window.sessionStorage.removeItem(CHAVE);
  } catch (e) {
    // sem sessionStorage: a sessão vale só enquanto a aba estiver aberta
  }
}

export function restaurarSessao() {
  if (sessao && valida(sessao)) return sessao;
  try {
    const bruto = window.sessionStorage.getItem(CHAVE);
    const s = bruto ? JSON.parse(bruto) : null;
    sessao = valida(s) ? s : null;
  } catch (e) {
    sessao = null;
  }
  if (!sessao) persistir();
  return sessao;
}

/** Guarda a credencial do Google; devolve os dados do usuário ou null se ela for inválida. */
export function iniciarSessao(credencial) {
  const dados = decodificarJwt(credencial);
  if (!dados || !dados.exp || !dados.email) return null;
  sessao = {
    token: credencial,
    expira: Number(dados.exp),
    usuario: { email: dados.email, nome: dados.name || dados.email, foto: dados.picture || "" },
  };
  persistir();
  return sessao;
}

export function tokenAtual() {
  const s = restaurarSessao();
  return s ? s.token : null;
}

export function encerrarSessao(motivo = "") {
  sessao = null;
  persistir();
  ouvintes.forEach((fn) => fn(motivo));
}

export function aoEncerrar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function erroDeAcesso(mensagem) {
  const e = new Error(mensagem);
  e.codigo = "AUTH";
  return e;
}
