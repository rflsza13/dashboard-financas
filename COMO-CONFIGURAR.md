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

## 3. Login com Google (Cloud Console)
O acesso é protegido por login do Google, conferido **no servidor** (Apps Script). Só os e-mails da sua lista entram.

1. Acesse https://console.cloud.google.com e crie um projeto (ou use um existente).
2. **APIs e serviços → Tela de permissão OAuth**: tipo **Externo**, informe nome do app e seu e-mail.
   Em "Usuários de teste", adicione os e-mails que vão usar (enquanto o app estiver em "Teste", só eles conseguem entrar).
3. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   Em **Origens JavaScript autorizadas** adicione, sem barra no final:
   - `http://localhost:3000` (para testar na sua máquina)
   - `https://SEU-APP.vercel.app` (o endereço de produção do Vercel; domínio próprio também, se usar)
4. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).

> Cada endereço do app precisa estar nas origens autorizadas. Os endereços de "preview" do Vercel mudam a cada deploy;
> use o login só no endereço de produção.

## 4. Script que grava na planilha (Apps Script)
1. Na planilha: **Extensões → Apps Script**. Apague o conteúdo e cole `apps-script/Code.gs`.
2. No topo do arquivo preencha:
   - `CLIENT_ID`: o ID do cliente do passo 3;
   - `EMAILS_PERMITIDOS`: a lista de e-mails Google que podem entrar (ex.: `['voce@gmail.com']`);
   - `TOKEN`: deixe vazio `''` (só serve para desenvolvimento sem login).
3. **Implantar → Nova implantação → tipo "App da Web"**:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa** (quem não tiver login válido e e-mail permitido recebe "acesso negado")
4. Autorize quando o Google pedir (o script precisa consultar o Google para validar o login) e copie a URL `/exec`.
5. Se alterar o código depois: **Implantar → Gerenciar implantações → editar → nova versão**.

## 5. Ligar o React (local e Vercel)
**Local:** copie `.env.example` para `.env` e preencha `REACT_APP_SCRIPT_URL` e `REACT_APP_GOOGLE_CLIENT_ID`.
Reinicie o `npm start`.

**Vercel:** o arquivo `.env` não vai para o GitHub (está no `.gitignore`), então cadastre as variáveis no painel:
1. Projeto → **Settings → Environment Variables**.
2. Crie `REACT_APP_SCRIPT_URL` e `REACT_APP_GOOGLE_CLIENT_ID` (Production e, se quiser, Preview).
3. Faça **Redeploy**: as variáveis entram no código durante o build, então mudar o valor exige novo deploy.

Sem as variáveis, o app abre em modo demonstração (dados fictícios). Com a URL mas sem o Client ID, a tela de login avisa
que falta configurar. O `vercel.json` já cuida das rotas (atualizar a página em `/mes`, por exemplo).

Sobre a sessão: o login do Google vale cerca de 1 hora; depois disso o app volta para a tela de login (um clique).
O botão **Sair** fica em Configurações → Conta.

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
- **Tema claro e cores do tema:** Configurações → Aparência. O tema claro é uma inversão aproximada das cores. Em "Cores do
  tema" você escolhe um tema pronto ou ajusta destaque, fundo, cards, textos e transparência; "Aplicar tema" recarrega a
  página. A escolha fica só no navegador.

## Segurança
- A URL do script é pública, mas toda chamada precisa de um login do Google válido **e** de um e-mail da lista
  `EMAILS_PERMITIDOS`; o servidor confere isso a cada chamada. Não há senha embutida no código do site.
- Não coloque `REACT_APP_SCRIPT_TOKEN` em produção (ele ficaria legível no código do navegador).
- O tema de cores e o tema claro ficam guardados só no navegador de quem os escolheu.
