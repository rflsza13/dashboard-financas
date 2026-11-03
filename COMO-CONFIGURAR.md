# Minhas Finanças — como colocar para rodar

## 1. Rodar o projeto
No terminal, dentro da pasta: `npm install` e `npm start`.

Sem configurar nada, o app abre em **modo demonstração** (dados fictícios, salvos só no navegador).
Serve para testar as telas antes de ligar a planilha.

## 2. Planilha no Google Drive
1. Envie `Base_Dashboard_Financeiro_v3.xlsx` para o Google Drive e abra com o Google Planilhas
   (**Arquivo → Salvar como Planilhas Google**).
2. Estrutura que o dashboard espera:
   - **Uma aba por ano** (nome = ano, ex.: `2026`) com os blocos `RECEITAS`, `DESPESAS` e `INVESTIMENTOS`
     (os textos da coluna A, incluindo `Total receitas`, `Total despesas` e `Total investimentos`, não podem ser trocados).
   - **Realizado** nas colunas C a N (Jan–Dez) e **Previsto** nas colunas R a AC. Se a sua aba ainda não tiver
     o Previsto, o dashboard cria as colunas sozinho no primeiro acesso.
   - Abas auxiliares (`Recorrências`, `Metas`, `Classificação`, `Cartões`, `Compras`, `Objetivos`, `Contas`, `Saldos`,
     `Pagos`, `Regras`, `Importados`) e `Ajustes` (tela Configurações): o dashboard cria as que faltarem.
3. Pode editar direto na planilha ou pelo dashboard; os dois funcionam.

## 3. Script que grava na planilha (Apps Script)
1. Na planilha: **Extensões → Apps Script**. Apague o conteúdo e cole `apps-script/Code.gs`.
2. Troque `TROQUE-ESTA-SENHA` no topo por uma senha longa (guarde-a).
3. **Implantar → Nova implantação → tipo "App da Web"**:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. Autorize quando o Google pedir e copie a URL que termina em `/exec`.
5. Se alterar o código depois: **Implantar → Gerenciar implantações → editar → nova versão**.

## 4. Ligar o React à planilha
1. Copie `.env.example` para `.env` e preencha:
   ```
   REACT_APP_SCRIPT_URL=<URL /exec>
   REACT_APP_SCRIPT_TOKEN=<a mesma senha do Code.gs>
   ```
2. Reinicie o `npm start`. O aviso de modo demonstração some.

## Como o dashboard usa a planilha
- **Planilha (página):** edita qualquer célula do realizado ou do previsto; cria, renomeia e exclui itens (linhas).
  Excluir um item apaga os valores dele e deixa a linha livre para reaproveitar.
- **Resumo mensal:** estimado × realizado do mês, tabelas por bloco e gráficos.
- **Recorrências:** cada parcela (ex.: 4/10) entra no **estimado** do item escolhido nos meses seguintes.
  Estimado do item no mês = previsto manual + parcelas ligadas ao item. Sem nenhum dos dois, usa a média dos meses
  anteriores (dá para desligar em Configurações).
- **Novo ano:** copia a aba do último ano, mantém os itens e zera os valores.
- **Cartões:** cada compra parcelada vira uma parcela por fatura (a 1ª fatura é calculada pelo fechamento e vencimento,
  mas pode ser ajustada). A fatura do mês entra no estimado do item escolhido no cartão.
- **Contas a vencer:** informe o "Dia do vencimento" na recorrência (e o vencimento no cartão). O dashboard mostra o que
  vence em 7 dias e o que está atrasado; marcar como pago grava na aba `Pagos`.
- **Orçamento:** metas mensais por categoria (alerta a partir de 80%) e regra 50/30/20 com classificação editável.
- **Objetivos, Patrimônio, Comparativo e Cenários:** cada um usa as abas indicadas acima; Cenários só calcula e não grava.
- **Importar extrato:** CSV (Data, Descrição, Valor ou Débito/Crédito) ou OFX. Os valores são SOMADOS ao realizado do mês.
  Lançamentos já importados são ignorados nas próximas vezes (aba `Importados`).
- **Exportar PDF:** botão no Resumo mensal; abre a impressão do navegador, escolha "Salvar como PDF".
- **Tema claro:** Configurações → Aparência (guarda a escolha só no navegador; é uma inversão aproximada das cores).

## Segurança
A senha (token) vai embutida no código do React, e a URL do script é aberta a "qualquer pessoa".
Para uso pessoal, rodando na sua máquina, é suficiente. Não publique o app na internet
com esse token sem antes colocar uma camada de login ou um backend no meio.
