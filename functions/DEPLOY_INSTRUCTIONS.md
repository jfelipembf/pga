
# Instruções para Ativar a Baixa Automática de Recebíveis

A função `autoSettleReceivables` foi criada para processar automaticamente os recebíveis de cartão de crédito.

## O que ela faz?
1. Roda diariamente às 04:00 da manhã.
2. Verifica todos os recebíveis de cartão (`type: 'acquirer'`) que estão em aberto (`status: 'open'`).
3. Confere se a data de vencimento (`dueDate`) é hoje ou anterior.
4. Realiza a baixa (`status: 'paid'`) e cria o lançamento financeiro na conta bancária da adquirente.

## Como ativar?
Execute o comando abaixo no terminal, dentro da pasta `Admin/functions`:

```bash
firebase deploy --only functions:autoSettleReceivables
```

## Como testar agora?
Você pode forçar a execução via Firebase Console > Functions > autoSettleReceivables > Test, ou aguardar a próxima execução agendada (04:00 AM).
