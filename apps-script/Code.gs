/**
 * Backend do dashboard de finanças pessoais (Google Apps Script).
 * Fica "preso" à planilha: Extensões > Apps Script, dentro do arquivo da planilha.
 *
 * Estrutura esperada (modelo Base_Dashboard_Financeiro):
 *  - Uma aba por ano, com o nome do ano (ex.: 2026). Blocos RECEITAS, DESPESAS e INVESTIMENTOS,
 *    cada linha = um item (A = categoria, B = descrição).
 *    REALIZADO nas colunas C a N (Jan–Dez), total em O e média em P.
 *    PREVISTO nas colunas R a AC (Jan–Dez), total em AD e média em AE (criadas sozinhas se faltarem).
 *  - Uma aba "Recorrências" (criada sozinha) com parcelamentos e contas fixas.
 *  - Uma aba "Ajustes" (criada sozinha ao salvar em Configurações): Parâmetro | Valor | O que faz.
 */

// TROQUE por uma senha longa. Use o mesmo valor em REACT_APP_SCRIPT_TOKEN no .env do React.
const TOKEN = 'TROQUE-ESTA-SENHA';

const ABA_AJUSTES = 'Ajustes';
const ABA_REC = 'Recorrências';

const COL_CAT = 1;
const COL_DESC = 2;
const COL_REAL = 3; // C
const COL_PREV = 18; // R
const COL_ULTIMA = 31; // AE
const REC_PRIMEIRA_LINHA = 5;
const REC_COLUNAS = 12;

const BLOCOS = [
  { chave: 'Receita', titulo: 'RECEITAS', total: 'Total receitas' },
  { chave: 'Despesa', titulo: 'DESPESAS', total: 'Total despesas' },
  { chave: 'Investimento', titulo: 'INVESTIMENTOS', total: 'Total investimentos' }
];

function doGet() {
  return saida({ ok: true, msg: 'API de finanças ativa. Use POST.' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (TOKEN === 'TROQUE-ESTA-SENHA') throw new Error('Defina o TOKEN no Code.gs antes de usar.');
    if (req.token !== TOKEN) throw new Error('Não autorizado.');

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (req.action) {
        case 'bootstrap':
          return saida({ ok: true, anos: nomesAnos(), recorrencias: listarRecorrencias(), dados: lerTabelas(), config: lerAjustes() });
        case 'listarAno':
          return saida({ ok: true, itens: listarItens(req.ano) });
        case 'setCelula':
          setCelula(req.ano, req.item, req.mes, req.campo, req.valor);
          return saida({ ok: true });
        case 'criarItem':
          return saida({ ok: true, item: criarItem(req.ano, req) });
        case 'editarItem':
          editarItem(req.ano, req.item, req);
          return saida({ ok: true });
        case 'excluirItem':
          excluirItem(req.ano, req.item);
          return saida({ ok: true });
        case 'criarAno':
          criarAno(req.ano);
          return saida({ ok: true });
        case 'somarCelulas':
          somarCelulas(req.ano, req.lista);
          return saida({ ok: true });
        case 'salvarLinhas':
          salvarLinhas(req.tabela, req.linhas);
          return saida({ ok: true });
        case 'excluirLinhas':
          excluirLinhas(req.tabela, req.ids);
          return saida({ ok: true });
        case 'criarRecorrencia':
          return saida({ ok: true, rec: criarRecorrencia(req.rec) });
        case 'atualizarRecorrencia':
          atualizarRecorrencia(req.rec);
          return saida({ ok: true });
        case 'excluirRecorrencia':
          excluirRecorrencia(req.id);
          return saida({ ok: true });
        case 'salvarConfig':
          return saida({ ok: true, config: salvarAjustes(req.config) });
        default:
          throw new Error('Ação desconhecida: ' + req.action);
      }
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return saida({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ---------- utilidades ---------- */

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function planilha() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function novoId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function norm(s) {
  return String(s === undefined || s === null ? '' : s).trim().toLowerCase();
}

// Texto que começa com = + @ viraria fórmula na planilha; o apóstrofo força texto.
function seguro(s) {
  s = String(s === undefined || s === null ? '' : s);
  return /^[=+@]/.test(s) ? "'" + s : s;
}

function paraNumero(v) {
  if (typeof v === 'number') return v;
  let s = String(v || '').replace(/[R$\s]/g, '');
  if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function arredonda(n) {
  return Math.round(n * 100) / 100;
}

function nomesAnos() {
  return planilha().getSheets().map(function (s) { return s.getName(); })
    .filter(function (n) { return /^\d{4}$/.test(n); }).sort();
}

function abaAno(ano) {
  const aba = planilha().getSheetByName(String(ano));
  if (!aba) throw new Error('A aba "' + ano + '" não existe na planilha.');
  return aba;
}

/* ---------- estrutura da aba do ano ---------- */

// Acha, pelos textos da coluna A, onde começa e termina cada bloco (sem depender de números de linha fixos).
function estruturaAno(aba) {
  const ultima = aba.getLastRow();
  const colA = aba.getRange(1, 1, ultima, 1).getValues().map(function (r) { return String(r[0]).trim(); });
  const est = {};
  BLOCOS.forEach(function (b) {
    const cab = colA.indexOf(b.titulo);
    if (cab < 0) throw new Error('Não achei o bloco "' + b.titulo + '" na coluna A da aba.');
    let tot = -1;
    for (let i = cab + 1; i < colA.length; i++) {
      if (colA[i] === b.total) { tot = i; break; }
    }
    if (tot < 0) throw new Error('Não achei a linha "' + b.total + '" na coluna A da aba.');
    est[b.chave] = { primeira: cab + 2, ultima: tot, total: tot + 1 };
  });
  return est;
}

// Garante as colunas do PREVISTO (R:AE). Em planilhas antigas, copia o formato e as fórmulas de C:P.
function garantirPrevisto(aba) {
  if (String(aba.getRange(3, COL_PREV).getValue()).trim() !== '') return;
  const est = estruturaAno(aba);
  const linhas = aba.getLastRow();
  aba.getRange(1, COL_REAL, linhas, 14).copyTo(aba.getRange(1, COL_PREV, linhas, 14));
  BLOCOS.forEach(function (b) {
    const e = est[b.chave];
    aba.getRange(e.primeira, COL_PREV, e.ultima - e.primeira + 1, 12).clearContent();
  });
  aba.getRange(3, COL_REAL).setValue('REALIZADO');
  aba.getRange(3, COL_PREV).setValue('PREVISTO (estimativa do mês — preencha as células azuis)');
  aba.getRange(4, 30).setValue('Total previsto');
  aba.getRange(4, 31).setValue('Média/mês prev.');
}

function limparLinha(aba, linha) {
  aba.getRange(linha, COL_CAT, 1, 14).clearContent(); // A:N (mantém as fórmulas de O e P)
  aba.getRange(linha, COL_PREV, 1, 12).clearContent(); // R:AC (mantém as fórmulas de AD e AE)
}

function doze(vals, ini) {
  const out = [];
  for (let m = 0; m < 12; m++) out.push(arredonda(paraNumero(vals[ini + m])));
  return out;
}

/* ---------- itens (linhas) ---------- */

function listarItens(ano) {
  const aba = abaAno(ano);
  garantirPrevisto(aba);
  const est = estruturaAno(aba);
  const itens = [];
  BLOCOS.forEach(function (b) {
    const e = est[b.chave];
    const n = e.ultima - e.primeira + 1;
    const vals = aba.getRange(e.primeira, 1, n, COL_PREV + 11).getValues();
    vals.forEach(function (row, i) {
      const cat = String(row[COL_CAT - 1]).trim();
      const desc = String(row[COL_DESC - 1]).trim();
      const real = doze(row, COL_REAL - 1);
      const prev = doze(row, COL_PREV - 1);
      const temValor = real.concat(prev).some(function (v) { return v !== 0; });
      if (!cat && !desc && !temValor) return; // linha livre
      const linha = e.primeira + i;
      itens.push({
        id: 'r' + linha,
        linha: linha,
        bloco: b.chave,
        categoria: cat || 'Sem categoria',
        descricao: desc || '(sem descrição)',
        real: real,
        prev: prev
      });
    });
  });
  return itens;
}

// Confere se a linha ainda é o item que o dashboard enviou (a planilha pode ter sido editada à mão).
function conferirItem(aba, est, ref) {
  const e = est[ref && ref.bloco];
  const linha = Number(ref && ref.linha);
  if (!e || !(linha >= e.primeira && linha <= e.ultima)) {
    throw new Error('A planilha mudou. Recarregue o dashboard e tente de novo.');
  }
  const cat = String(aba.getRange(linha, COL_CAT).getValue()).trim() || 'Sem categoria';
  const desc = String(aba.getRange(linha, COL_DESC).getValue()).trim() || '(sem descrição)';
  if (norm(cat) !== norm(ref.categoria) || norm(desc) !== norm(ref.descricao)) {
    throw new Error('A planilha mudou. Recarregue o dashboard e tente de novo.');
  }
  return linha;
}

function validarItem(d) {
  const cat = String(d.categoria === undefined ? '' : d.categoria).trim();
  const desc = String(d.descricao === undefined ? '' : d.descricao).trim();
  if (!cat || !desc) throw new Error('Informe a categoria e a descrição.');
  if (cat.length > 40 || desc.length > 60) throw new Error('Categoria: até 40 caracteres. Descrição: até 60.');
  return { categoria: seguro(cat), descricao: seguro(desc) };
}

function existeItem(aba, e, cat, desc, ignorarLinha) {
  const n = e.ultima - e.primeira + 1;
  const vals = aba.getRange(e.primeira, 1, n, 2).getValues();
  for (let i = 0; i < n; i++) {
    if (e.primeira + i === ignorarLinha) continue;
    if (norm(vals[i][0]) === norm(cat) && norm(vals[i][1]) === norm(desc)) return true;
  }
  return false;
}

function setCelula(ano, ref, mes, campo, valor) {
  const aba = abaAno(ano);
  garantirPrevisto(aba);
  const est = estruturaAno(aba);
  const linha = conferirItem(aba, est, ref);
  const m = Number(mes);
  const v = Number(valor);
  if (!(m % 1 === 0) || m < 0 || m > 11) throw new Error('Mês inválido.');
  if (!isFinite(v) || v < 0) throw new Error('O valor deve ser zero ou positivo.');
  if (campo !== 'real' && campo !== 'prev') throw new Error('Campo inválido.');
  const celula = aba.getRange(linha, (campo === 'prev' ? COL_PREV : COL_REAL) + m);
  if (v === 0) celula.clearContent();
  else celula.setValue(arredonda(v));
}

function criarItem(ano, d) {
  const aba = abaAno(ano);
  garantirPrevisto(aba);
  const est = estruturaAno(aba);
  const b = BLOCOS.filter(function (x) { return x.chave === d.bloco; })[0];
  if (!b) throw new Error('Bloco inválido.');
  const dados = validarItem(d);
  const e = est[b.chave];
  if (existeItem(aba, e, dados.categoria, dados.descricao, -1)) {
    throw new Error('Já existe um item com essa categoria e descrição neste bloco.');
  }
  // 1) usa a primeira linha livre do bloco
  const n = e.ultima - e.primeira + 1;
  const vals = aba.getRange(e.primeira, 1, n, COL_PREV + 11).getValues();
  let alvo = -1;
  for (let i = 0; i < n; i++) {
    const vazia = String(vals[i][0]).trim() === '' && String(vals[i][1]).trim() === '' &&
      doze(vals[i], COL_REAL - 1).concat(doze(vals[i], COL_PREV - 1)).every(function (v) { return v === 0; });
    if (vazia) { alvo = e.primeira + i; break; }
  }
  // 2) sem linha livre: insere uma DENTRO do bloco (as somas passam a incluí-la)
  if (alvo < 0) {
    if (n < 2) throw new Error('O bloco precisa de ao menos duas linhas para crescer. Insira uma linha na planilha.');
    aba.insertRowBefore(e.ultima);
    alvo = e.ultima;
    aba.getRange(alvo - 1, 1, 1, COL_ULTIMA).copyTo(aba.getRange(alvo, 1, 1, COL_ULTIMA));
    limparLinha(aba, alvo);
  }
  aba.getRange(alvo, COL_CAT, 1, 2).setValues([[dados.categoria, dados.descricao]]);
  const zeros = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  return {
    id: 'r' + alvo, linha: alvo, bloco: b.chave,
    categoria: dados.categoria, descricao: dados.descricao, real: zeros.slice(), prev: zeros.slice()
  };
}

function editarItem(ano, ref, d) {
  const aba = abaAno(ano);
  const est = estruturaAno(aba);
  const linha = conferirItem(aba, est, ref);
  const dados = validarItem(d);
  if (existeItem(aba, est[ref.bloco], dados.categoria, dados.descricao, linha)) {
    throw new Error('Já existe um item com essa categoria e descrição neste bloco.');
  }
  aba.getRange(linha, COL_CAT, 1, 2).setValues([[dados.categoria, dados.descricao]]);
}

function excluirItem(ano, ref) {
  const aba = abaAno(ano);
  const est = estruturaAno(aba);
  const linha = conferirItem(aba, est, ref);
  limparLinha(aba, linha); // a linha vira um espaço livre; as fórmulas e somas continuam intactas
}

function criarAno(ano) {
  const n = String(ano);
  if (!/^\d{4}$/.test(n)) throw new Error('Ano inválido.');
  const ss = planilha();
  if (ss.getSheetByName(n)) throw new Error('A aba "' + n + '" já existe.');
  const anos = nomesAnos();
  if (!anos.length) throw new Error('Não há uma aba de ano para usar como modelo.');
  const base = ss.getSheetByName(anos[anos.length - 1]);
  const nova = base.copyTo(ss);
  nova.setName(n);
  garantirPrevisto(nova);
  const est = estruturaAno(nova);
  BLOCOS.forEach(function (b) {
    const e = est[b.chave];
    for (let r = e.primeira; r <= e.ultima; r++) {
      nova.getRange(r, COL_REAL, 1, 12).clearContent();
      nova.getRange(r, COL_PREV, 1, 12).clearContent();
    }
  });
  const titulo = String(nova.getRange(1, 1).getValue());
  if (titulo.indexOf(anos[anos.length - 1]) > -1) {
    nova.getRange(1, 1).setValue(titulo.replace(anos[anos.length - 1], n));
  }
}

/* ---------- recorrências (aba "Recorrências") ---------- */

function abaRecorrencias() {
  const ss = planilha();
  let aba = ss.getSheetByName(ABA_REC);
  if (!aba) {
    aba = ss.insertSheet(ABA_REC);
    aba.getRange(1, 1).setValue('Recorrências e parcelamentos');
    aba.getRange(4, 1, 1, REC_COLUNAS).setValues([[
      'ID', 'Bloco', 'Categoria', 'Item da planilha', 'Nome', 'Valor da parcela',
      'Total de parcelas', 'Início (AAAA-MM)', 'Parcela inicial', 'Ativa', 'Observações', 'Dia do vencimento'
    ]]).setFontWeight('bold');
    aba.setFrozenRows(4);
  } else if (String(aba.getRange(4, REC_COLUNAS).getValue()).trim() === '') {
    aba.getRange(4, REC_COLUNAS).setValue('Dia do vencimento').setFontWeight('bold');
  }
  return aba;
}

function canonBloco(v) {
  const s = norm(v);
  const b = BLOCOS.filter(function (x) { return norm(x.chave) === s; })[0];
  return b ? b.chave : '';
}

function paraInicio(v) {
  if (v instanceof Date) return Utilities.formatDate(v, planilha().getSpreadsheetTimeZone(), 'yyyy-MM');
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2);
  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return m[2] + '-' + ('0' + m[1]).slice(-2);
  return '';
}

function simNao(v) {
  const s = norm(v);
  return !(s === 'não' || s === 'nao' || s === 'n' || s === '0' || s === 'false');
}

function listarRecorrencias() {
  const aba = planilha().getSheetByName(ABA_REC);
  if (!aba || aba.getLastRow() < REC_PRIMEIRA_LINHA) return [];
  const n = aba.getLastRow() - REC_PRIMEIRA_LINHA + 1;
  const vals = aba.getRange(REC_PRIMEIRA_LINHA, 1, n, REC_COLUNAS).getValues();
  const recs = [];
  vals.forEach(function (r, i) {
    if (String(r[0]).trim() === '' && String(r[4]).trim() === '') return;
    let id = String(r[0]).trim();
    if (!id) { // linha digitada à mão: ganha um ID
      id = novoId();
      aba.getRange(REC_PRIMEIRA_LINHA + i, 1).setValue(id);
    }
    const parcelas = r[6] === '' || r[6] === null ? null : Math.floor(paraNumero(r[6])) || null;
    recs.push({
      id: id,
      bloco: canonBloco(r[1]) || 'Despesa',
      categoria: String(r[2] || '').trim(),
      item: String(r[3] || '').trim(),
      nome: String(r[4] || '').trim(),
      valor: Math.abs(arredonda(paraNumero(r[5]))),
      parcelas: parcelas,
      inicio: paraInicio(r[7]),
      parcelaInicial: Math.max(1, Math.floor(paraNumero(r[8])) || 1),
      ativa: simNao(r[9] === '' ? 'sim' : r[9]),
      obs: String(r[10] || ''),
      dia: Math.floor(paraNumero(r[11])) >= 1 && Math.floor(paraNumero(r[11])) <= 31 ? Math.floor(paraNumero(r[11])) : null
    });
  });
  return recs;
}

function validarRecorrencia(r) {
  if (!r) throw new Error('Recorrência vazia.');
  const bloco = canonBloco(r.bloco);
  if (!bloco) throw new Error('Bloco inválido.');
  const categoria = String(r.categoria || '').trim();
  const item = String(r.item || '').trim();
  if (!categoria || !item) throw new Error('Escolha o item da planilha.');
  const nome = String(r.nome || '').trim();
  if (!nome || nome.length > 60) throw new Error('O nome deve ter de 1 a 60 caracteres.');
  const valor = Number(r.valor);
  if (!isFinite(valor) || valor <= 0) throw new Error('O valor da parcela deve ser maior que zero.');
  let parcelas = null;
  if (r.parcelas !== null && r.parcelas !== undefined && r.parcelas !== '') {
    parcelas = Number(r.parcelas);
    if (!(parcelas % 1 === 0) || parcelas < 1 || parcelas > 600) throw new Error('Total de parcelas inválido (1 a 600).');
  }
  const parcelaInicial = Number(r.parcelaInicial === undefined ? 1 : r.parcelaInicial);
  if (!(parcelaInicial % 1 === 0) || parcelaInicial < 1 || (parcelas && parcelaInicial > parcelas)) {
    throw new Error('Parcela inicial inválida.');
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(r.inicio || ''))) throw new Error('Início inválido (use AAAA-MM).');
  if (typeof r.ativa !== 'boolean') throw new Error('Situação inválida.');
  const obs = String(r.obs || '').trim();
  if (obs.length > 120) throw new Error('Observações: até 120 caracteres.');
  let dia = null;
  if (r.dia !== null && r.dia !== undefined && r.dia !== '') {
    dia = Number(r.dia);
    if (!(dia % 1 === 0) || dia < 1 || dia > 31) throw new Error('Dia do vencimento inválido (1 a 31).');
  }
  return {
    bloco: bloco, categoria: categoria, item: item, nome: seguro(nome), valor: arredonda(valor),
    parcelas: parcelas, inicio: String(r.inicio), parcelaInicial: parcelaInicial, ativa: r.ativa, obs: seguro(obs), dia: dia
  };
}

function linhaDaRecorrencia(r, id) {
  return [id, r.bloco, r.categoria, r.item, r.nome, r.valor, r.parcelas === null ? '' : r.parcelas,
    r.inicio, r.parcelaInicial, r.ativa ? 'Sim' : 'Não', r.obs, r.dia === null || r.dia === undefined ? '' : r.dia];
}

function escreverRecorrencia(aba, linha, r, id) {
  aba.getRange(linha, 8).setNumberFormat('@'); // evita que "2026-04" vire data
  aba.getRange(linha, 1, 1, REC_COLUNAS).setValues([linhaDaRecorrencia(r, id)]);
}

function achaLinhaRec(aba, id) {
  if (aba.getLastRow() < REC_PRIMEIRA_LINHA) return -1;
  const n = aba.getLastRow() - REC_PRIMEIRA_LINHA + 1;
  const ids = aba.getRange(REC_PRIMEIRA_LINHA, 1, n, 1).getValues();
  for (let i = 0; i < n; i++) {
    if (String(ids[i][0]).trim() === String(id)) return REC_PRIMEIRA_LINHA + i;
  }
  return -1;
}

function criarRecorrencia(dados) {
  const r = validarRecorrencia(dados);
  const aba = abaRecorrencias();
  const id = novoId();
  const linha = Math.max(aba.getLastRow() + 1, REC_PRIMEIRA_LINHA);
  escreverRecorrencia(aba, linha, r, id);
  r.id = id;
  return r;
}

function atualizarRecorrencia(dados) {
  const r = validarRecorrencia(dados);
  const aba = abaRecorrencias();
  const linha = achaLinhaRec(aba, dados.id);
  if (linha < 0) throw new Error('Recorrência não encontrada. Recarregue o dashboard.');
  escreverRecorrencia(aba, linha, r, dados.id);
}

function excluirRecorrencia(id) {
  const aba = abaRecorrencias();
  const linha = achaLinhaRec(aba, id);
  if (linha < 0) throw new Error('Recorrência não encontrada. Recarregue o dashboard.');
  aba.deleteRow(linha);
}

/* ---------- somar valores em lote (importação de extrato) ---------- */

function somarCelulas(ano, lista) {
  if (!lista || !lista.length) return;
  const aba = abaAno(ano);
  garantirPrevisto(aba);
  const est = estruturaAno(aba);
  const alvos = lista.map(function (x) {
    const linha = conferirItem(aba, est, x.item);
    const m = Number(x.mes);
    const v = Number(x.valor);
    if (!(m % 1 === 0) || m < 0 || m > 11) throw new Error('Mês inválido.');
    if (!isFinite(v) || v <= 0) throw new Error('Valor inválido na importação.');
    return { linha: linha, mes: m, valor: v };
  });
  alvos.forEach(function (a) {
    const celula = aba.getRange(a.linha, COL_REAL + a.mes);
    celula.setValue(arredonda(paraNumero(celula.getValue()) + a.valor));
  });
}

/* ---------- tabelas auxiliares (metas, cartões, compras, objetivos, contas...) ---------- */

// t: s texto, n número, i inteiro, b Sim/Não, d data AAAA-MM-DD, m mês AAAA-MM, e lista fixa
const TABELAS = {
  metas: { aba: 'Metas', titulos: ['Categoria', 'Limite mensal'], cols: [
    { k: 'id', t: 's', req: 1, max: 60 }, { k: 'limite', t: 'n', min: 0.01 }] },
  classificacao: { aba: 'Classificação', titulos: ['Categoria', 'Grupo'], cols: [
    { k: 'id', t: 's', req: 1, max: 60 }, { k: 'grupo', t: 'e', lista: ['Necessidades', 'Desejos'] }] },
  cartoes: { aba: 'Cartões', titulos: ['ID', 'Nome', 'Fechamento', 'Vencimento', 'Limite', 'Categoria', 'Item', 'Ativo'], cols: [
    { k: 'id', t: 's', req: 1, max: 40 }, { k: 'nome', t: 's', req: 1, max: 40 },
    { k: 'fechamento', t: 'i', req: 1, min: 1, max: 31 }, { k: 'vencimento', t: 'i', req: 1, min: 1, max: 31 },
    { k: 'limite', t: 'n', min: 0 }, { k: 'categoria', t: 's', req: 1, max: 40 }, { k: 'item', t: 's', req: 1, max: 60 },
    { k: 'ativo', t: 'b' }] },
  compras: { aba: 'Compras', titulos: ['ID', 'Cartão (ID)', 'Data', 'Descrição', 'Categoria', 'Valor total', 'Parcelas', '1ª fatura (AAAA-MM)', 'Observações'], cols: [
    { k: 'id', t: 's', req: 1, max: 40 }, { k: 'cartaoId', t: 's', req: 1, max: 40 }, { k: 'data', t: 'd', req: 1 },
    { k: 'descricao', t: 's', req: 1, max: 60 }, { k: 'categoria', t: 's', max: 40 }, { k: 'total', t: 'n', req: 1, min: 0.01 },
    { k: 'parcelas', t: 'i', req: 1, min: 1, max: 60 }, { k: 'fatura', t: 'm', req: 1 }, { k: 'obs', t: 's', max: 120 }] },
  objetivos: { aba: 'Objetivos', titulos: ['ID', 'Nome', 'Valor alvo', 'Prazo (AAAA-MM)', 'Valor atual', 'Aporte mensal', 'Observações'], cols: [
    { k: 'id', t: 's', req: 1, max: 40 }, { k: 'nome', t: 's', req: 1, max: 60 }, { k: 'alvo', t: 'n', req: 1, min: 0.01 },
    { k: 'prazo', t: 'm' }, { k: 'atual', t: 'n', min: 0 }, { k: 'aporte', t: 'n', min: 0 }, { k: 'obs', t: 's', max: 120 }] },
  contas: { aba: 'Contas', titulos: ['ID', 'Nome', 'Tipo', 'Ativa'], cols: [
    { k: 'id', t: 's', req: 1, max: 40 }, { k: 'nome', t: 's', req: 1, max: 40 },
    { k: 'tipo', t: 'e', lista: ['Conta', 'Investimento', 'Imóvel', 'Outro', 'Dívida'] }, { k: 'ativa', t: 'b' }] },
  saldos: { aba: 'Saldos', titulos: ['Conta|Mês', 'Saldo'], cols: [
    { k: 'id', t: 's', req: 1, max: 80 }, { k: 'valor', t: 'n' }] },
  pagos: { aba: 'Pagos', titulos: ['Chave'], cols: [{ k: 'id', t: 's', req: 1, max: 80 }] },
  regras: { aba: 'Regras', titulos: ['Padrão', 'Bloco', 'Categoria', 'Item'], cols: [
    { k: 'id', t: 's', req: 1, max: 40 }, { k: 'bloco', t: 'e', lista: ['Receita', 'Despesa', 'Investimento'] },
    { k: 'categoria', t: 's', req: 1, max: 40 }, { k: 'item', t: 's', req: 1, max: 60 }] },
  importados: { aba: 'Importados', titulos: ['Hash'], cols: [{ k: 'id', t: 's', req: 1, max: 40 }] }
};

function especTabela(nome) {
  const e = TABELAS[nome];
  if (!e) throw new Error('Tabela desconhecida: ' + nome);
  return e;
}

function abaTabela(nome, criar) {
  const e = especTabela(nome);
  const ss = planilha();
  let aba = ss.getSheetByName(e.aba);
  if (!aba && criar) {
    aba = ss.insertSheet(e.aba);
    aba.getRange(1, 1, 1, e.titulos.length).setValues([e.titulos]).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function paraData(v) {
  if (v instanceof Date) return Utilities.formatDate(v, planilha().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}

function lerTabela(nome) {
  const e = especTabela(nome);
  const aba = abaTabela(nome, false);
  if (!aba || aba.getLastRow() < 2) return [];
  const n = aba.getLastRow() - 1;
  const vals = aba.getRange(2, 1, n, e.cols.length).getValues();
  const out = [];
  vals.forEach(function (row) {
    const o = {};
    e.cols.forEach(function (c, i) {
      const v = row[i];
      if (c.t === 'n') o[c.k] = arredonda(paraNumero(v));
      else if (c.t === 'i') o[c.k] = Math.floor(paraNumero(v));
      else if (c.t === 'b') o[c.k] = simNao(v === '' ? 'sim' : v);
      else if (c.t === 'd') o[c.k] = paraData(v);
      else if (c.t === 'm') o[c.k] = paraInicio(v);
      else o[c.k] = String(v === undefined || v === null ? '' : v).trim();
    });
    if (o.id !== '') out.push(o);
  });
  return out;
}

function lerTabelas() {
  const dados = {};
  Object.keys(TABELAS).forEach(function (nome) { dados[nome] = lerTabela(nome); });
  return dados;
}

function validarLinha(nome, obj) {
  const e = especTabela(nome);
  const rot = e.titulos;
  const limpo = {};
  e.cols.forEach(function (c, i) {
    let v = obj ? obj[c.k] : undefined;
    const vazio = v === undefined || v === null || v === '';
    if (vazio && c.req) throw new Error('Campo obrigatório vazio: ' + rot[i] + '.');
    if (c.t === 'n' || c.t === 'i') {
      if (vazio) { limpo[c.k] = 0; return; }
      v = Number(v);
      if (!isFinite(v)) throw new Error('Número inválido em ' + rot[i] + '.');
      if (c.t === 'i' && !(v % 1 === 0)) throw new Error(rot[i] + ' deve ser inteiro.');
      if (c.min !== undefined && v < c.min) throw new Error(rot[i] + ' deve ser no mínimo ' + c.min + '.');
      if (c.max !== undefined && v > c.max) throw new Error(rot[i] + ' deve ser no máximo ' + c.max + '.');
      limpo[c.k] = c.t === 'n' ? arredonda(v) : v;
    } else if (c.t === 'b') {
      if (!vazio && typeof v !== 'boolean') throw new Error('Valor inválido em ' + rot[i] + '.');
      limpo[c.k] = vazio ? true : v;
    } else if (c.t === 'd') {
      if (vazio) { limpo[c.k] = ''; return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) throw new Error('Data inválida em ' + rot[i] + ' (AAAA-MM-DD).');
      limpo[c.k] = String(v);
    } else if (c.t === 'm') {
      if (vazio) { limpo[c.k] = ''; return; }
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v))) throw new Error('Mês inválido em ' + rot[i] + ' (AAAA-MM).');
      limpo[c.k] = String(v);
    } else if (c.t === 'e') {
      v = String(vazio ? '' : v);
      if (c.lista.indexOf(v) < 0) throw new Error('Valor inválido em ' + rot[i] + '.');
      limpo[c.k] = v;
    } else {
      v = String(vazio ? '' : v).trim();
      if (c.max && v.length > c.max) throw new Error(rot[i] + ': até ' + c.max + ' caracteres.');
      if (/^[=+@]/.test(v) && c.k !== 'id') v = "'" + v; // evita que o texto vire fórmula na planilha
      limpo[c.k] = v;
    }
  });
  return limpo;
}

function paraLinha(nome, o) {
  return especTabela(nome).cols.map(function (c) {
    if (c.t === 'b') return o[c.k] ? 'Sim' : 'Não';
    return o[c.k] === undefined || o[c.k] === null ? '' : o[c.k];
  });
}

function formatarTextoColunas(aba, e, linha, n) {
  e.cols.forEach(function (c, i) {
    if (c.t === 'd' || c.t === 'm' || c.k === 'id') aba.getRange(linha, i + 1, n, 1).setNumberFormat('@');
  });
}

function salvarLinhas(nome, linhas) {
  const e = especTabela(nome);
  if (!linhas || !linhas.length) return;
  if (linhas.length > 2000) throw new Error('Linhas demais em uma só chamada.');
  const limpas = linhas.map(function (l) { return validarLinha(nome, l); });
  const aba = abaTabela(nome, true);
  const n = Math.max(aba.getLastRow() - 1, 0);
  const ids = n ? aba.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  const novas = [];
  limpas.forEach(function (o) {
    const i = ids.indexOf(o.id);
    if (i >= 0) {
      formatarTextoColunas(aba, e, 2 + i, 1);
      aba.getRange(2 + i, 1, 1, e.cols.length).setValues([paraLinha(nome, o)]);
    } else {
      ids.push(o.id);
      novas.push(paraLinha(nome, o));
    }
  });
  if (novas.length) {
    const ini = Math.max(aba.getLastRow() + 1, 2);
    formatarTextoColunas(aba, e, ini, novas.length);
    aba.getRange(ini, 1, novas.length, e.cols.length).setValues(novas);
  }
}

function excluirLinhas(nome, idsExcluir) {
  especTabela(nome);
  const aba = abaTabela(nome, false);
  if (!aba || aba.getLastRow() < 2 || !idsExcluir || !idsExcluir.length) return;
  const n = aba.getLastRow() - 1;
  const ids = aba.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).trim(); });
  for (let i = n - 1; i >= 0; i--) {
    if (idsExcluir.indexOf(ids[i]) > -1) aba.deleteRow(2 + i);
  }
}

/* ---------- ajustes (aba "Ajustes") ---------- */

// rótulo da linha na aba -> chave usada pelo dashboard
const CONFIG_CHAVES = {
  'Nome do sistema': 'nomeSistema',
  'Categorias no gráfico': 'topCategorias',
  'Cor das receitas': 'corReceitas',
  'Cor das despesas': 'corDespesas',
  'Cor do saldo acumulado': 'corSaldo',
  'Pontos de atenção': 'alertas',
  'Gráfico de categorias': 'categorias',
  'Investimentos por categoria': 'investimentos',
  'Realizado × estimado': 'previsto',
  'Estimar pela média': 'estimarMedia',
  'Contas a vencer': 'vencimentos',
  'Página Cartões': 'cartoes',
  'Página Orçamento': 'orcamento',
  'Página Objetivos': 'objetivos',
  'Página Patrimônio': 'patrimonio',
  'Página Comparativo': 'comparativo',
  'Página Cenários': 'cenarios',
  'Página Importar extrato': 'importar'
};

const CONFIG_AJUDA = {
  nomeSistema: 'Nome exibido no topo do menu lateral (1 a 60 caracteres).',
  topCategorias: 'Quantas categorias aparecem no gráfico de despesas (1 a 20).',
  corReceitas: 'Cor das receitas no gráfico de fluxo mensal (#RRGGBB).',
  corDespesas: 'Cor das despesas no gráfico de fluxo mensal (#RRGGBB).',
  corSaldo: 'Cor da linha de saldo acumulado (#RRGGBB).',
  alertas: 'Sim/Não: mostra o card Pontos de atenção.',
  categorias: 'Sim/Não: mostra o gráfico de categorias.',
  investimentos: 'Sim/Não: mostra o gráfico de investimentos por categoria.',
  previsto: 'Sim/Não: mostra o gráfico realizado × estimado.',
  estimarMedia: 'Sim/Não: itens sem previsão nem parcela são estimados pela média dos meses anteriores.',
  vencimentos: 'Sim/Não: mostra o painel de contas a vencer no dashboard.',
  cartoes: 'Sim/Não: mostra a página de cartões de crédito.',
  orcamento: 'Sim/Não: mostra a página de orçamento (metas e 50/30/20).',
  objetivos: 'Sim/Não: mostra a página de objetivos.',
  patrimonio: 'Sim/Não: mostra a página de patrimônio.',
  comparativo: 'Sim/Não: mostra a página de comparativo entre anos.',
  cenarios: 'Sim/Não: mostra a página de cenários.',
  importar: 'Sim/Não: mostra a página de importação de extrato.'
};

const CONFIG_BOOLEANOS = ['alertas', 'categorias', 'investimentos', 'previsto', 'estimarMedia', 'vencimentos',
  'cartoes', 'orcamento', 'objetivos', 'patrimonio', 'comparativo', 'cenarios', 'importar'];

function chaveParaRotulo(chave) {
  return Object.keys(CONFIG_CHAVES).filter(function (r) { return CONFIG_CHAVES[r] === chave; })[0];
}

function lerAjustes() {
  const aba = planilha().getSheetByName(ABA_AJUSTES);
  const cfg = {};
  if (!aba || aba.getLastRow() < 2) return cfg;
  aba.getRange(2, 1, aba.getLastRow() - 1, 2).getValues().forEach(function (r) {
    const chave = CONFIG_CHAVES[String(r[0]).trim()];
    const valor = r[1];
    if (!chave || valor === '' || valor === null) return;
    if (CONFIG_BOOLEANOS.indexOf(chave) > -1) {
      const s = String(valor).trim().toLowerCase();
      cfg[chave] = !(s === 'não' || s === 'nao' || s === 'n' || s === '0' || s === 'false');
    } else if (chave === 'topCategorias') {
      cfg[chave] = Number(valor);
    } else {
      cfg[chave] = String(valor).trim();
    }
  });
  return cfg;
}

function validarAjustes(c) {
  if (!c) throw new Error('Configuração vazia.');
  const limpo = {};
  const nome = String(c.nomeSistema === undefined ? '' : c.nomeSistema).trim();
  if (nome.length < 1 || nome.length > 60) throw new Error('Nome do sistema deve ter de 1 a 60 caracteres.');
  limpo.nomeSistema = nome;
  const top = Number(c.topCategorias);
  if (!(top % 1 === 0) || top < 1 || top > 20) throw new Error('Categorias no gráfico deve ser um inteiro de 1 a 20.');
  limpo.topCategorias = top;
  ['corReceitas', 'corDespesas', 'corSaldo'].forEach(function (k) {
    if (!/^#[0-9a-fA-F]{6}$/.test(String(c[k] || ''))) throw new Error('Cor inválida em ' + chaveParaRotulo(k) + ' (use #RRGGBB).');
    limpo[k] = String(c[k]).toLowerCase();
  });
  CONFIG_BOOLEANOS.forEach(function (k) {
    if (typeof c[k] !== 'boolean') throw new Error('Valor inválido em ' + chaveParaRotulo(k) + '.');
    limpo[k] = c[k];
  });
  return limpo;
}

function abaAjustes() {
  const ss = planilha();
  let aba = ss.getSheetByName(ABA_AJUSTES);
  if (!aba) {
    aba = ss.insertSheet(ABA_AJUSTES);
    aba.getRange(1, 1, 1, 3).setValues([['Parâmetro', 'Valor', 'O que faz']]).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function salvarAjustes(c) {
  const limpo = validarAjustes(c);
  const aba = abaAjustes();
  const ultima = Math.max(aba.getLastRow(), 1);
  const rotulos = ultima > 1 ? aba.getRange(2, 1, ultima - 1, 1).getValues() : [];
  Object.keys(limpo).forEach(function (chave) {
    const rotulo = chaveParaRotulo(chave);
    let linha = -1;
    for (let i = 0; i < rotulos.length; i++) {
      if (String(rotulos[i][0]).trim() === rotulo) { linha = 2 + i; break; }
    }
    if (linha === -1) {
      linha = aba.getLastRow() + 1;
      rotulos.push([rotulo]);
      aba.getRange(linha, 1).setValue(rotulo);
      aba.getRange(linha, 3).setValue(CONFIG_AJUDA[chave]);
    }
    const valor = CONFIG_BOOLEANOS.indexOf(chave) > -1 ? (limpo[chave] ? 'Sim' : 'Não') : limpo[chave];
    aba.getRange(linha, 2).setValue(valor);
  });
  return lerAjustes();
}
