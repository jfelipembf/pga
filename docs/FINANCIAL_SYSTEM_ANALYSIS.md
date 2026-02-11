# 📊 Análise Completa do Sistema Financeiro — Lexa Admin

**Data:** 2026-02-11  
**Commit Base:** `87ea44d8c` (snapshot pré-reorganização)

---

## 1. Mapa da Arquitetura Atual

### 1.1 Camadas do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                         PÁGINAS (UI)                         │
│  Cashier │ CashFlow │ Payables │ Receivables │ DRE │ Sales  │
└──────┬───────┬────────┬──────────┬────────────┬────────┬─────┘
       │       │        │          │            │        │
┌──────┴───────┴────────┴──────────┴────────────┴────────┴─────┐
│                      HOOKS (Lógica de UI)                    │
│ useCashier│useCashFlow│usePayables│useReceivablesList│useDRE │
└──────┬───────┬────────┬──────────┬────────────┬────────┬─────┘
       │       │        │          │            │        │
┌──────┴───────┴────────┴──────────┴────────────┴────────┴─────┐
│                     SERVICES (Regras de Negócio)             │
│ CashierService │ PayableService │ ReceivableService │ DRE    │
│ SalesService   │ SalesPaymentProcessor │ BankAccountService  │
│ FinancialDashboardService │ ContractCancellationService      │
│ FinancialCalculator │ ContractService │ AcquirerService      │
└──────┬───────┬────────┬──────────┬────────────┬──────────────┘
       │       │        │          │            │
┌──────┴───────┴────────┴──────────┴────────────┴──────────────┐
│                 LEDGER SERVICE (Ponto Central Contábil)       │
│          Sistema de Partidas Dobradas (Double-Entry)          │
│          safeLedgerCall (wrapper com fallback de erro)        │
└──────┬───────────────────────────────────────────────────────┘
       │
┌──────┴───────────────────────────────────────────────────────┐
│                     REPOSITORIES (Firestore)                 │
│ LedgerRepository │ TransactionRepository │ CashierRepository │
│ PayableRepository │ ReceivableRepository │ SalesRepository   │
│ BankAccountRepository │ AcquirerRepository │ ContractRepo    │
│ LedgerErrorRepository                                        │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Arquivos por Módulo

| Módulo | Service | Hook | Repository |
|--------|---------|------|------------|
| **Ledger** | `LedgerService.js` (553 linhas) | — | `LedgerRepository.js`, `LedgerErrorRepository.js` |
| **Caixa** | `CashierService.js` (232 linhas) | `useCashier.js` (295 linhas) | `CashierRepository.js`, `TransactionRepository.js` |
| **Contas a Pagar** | `PayableService.js` (249 linhas) | `usePayables.js` (179 linhas) | `PayableRepository.js` |
| **Contas a Receber** | `ReceivableService.js` (312 linhas) | `useReceivablesList.js` (241 linhas) | `ReceivableRepository.js` |
| **DRE** | `DREService.js` (92 linhas) | `useDRE.js` (73 linhas) | — (usa LedgerRepository via LedgerService) |
| **Vendas** | `SalesService.js` (341 linhas), `SalesPaymentProcessor.js` (254 linhas) | — | `SalesRepository.js` |
| **Contas Bancárias** | `BankAccountService.js` (157 linhas) | `useBankAccounts.js` | `BankAccountRepository.js` |
| **Fluxo de Caixa** | — | `useCashFlow.js` (181 linhas) | — (usa CashierService) |
| **Dashboard Financeiro** | `FinancialDashboardService.js` (156 linhas) | `useFinancialDashboard.js` | — |
| **Calculadora** | `FinancialCalculator.js` (238 linhas) | — | — |
| **Cancelamento** | `ContractCancellationService.js` (314 linhas) | — | — |

---

## 2. ✅ O que está CORRETO

### 2.1 Padrão de Partidas Dobradas (Double-Entry)
O **LedgerService** implementa corretamente o modelo contábil de partidas dobradas:
- ✅ **Plano de contas padronizado** (`STANDARD_ACCOUNTS`) com hierarquia brasileira
- ✅ **Todos os lançamentos são balanceados** (Débito = Crédito validado no `LedgerRepository.create`)
- ✅ **Receitas identificadas por tipo** (Produto 1.1.1, Serviço 1.1.2, Assinatura 1.1.3, Multa 1.1.4)
- ✅ **Despesas segregadas** (Administrativas 2.1, Operacionais 2.4, Taxas de Cartão 2.5.3, Tarifas Bancárias 2.5.4)

### 2.2 Integração com Ledger
Os seguintes serviços **JÁ passam pelo Ledger**:
- ✅ **PayableService** → `createPayableEntry` (ao criar) + `payPayableEntry` (ao pagar)
- ✅ **ReceivableService** → `settleReceivableEntry` (ao liquidar) + antecipação
- ✅ **SalesService** → `createSaleEntry` (ao registrar venda)
- ✅ **SalesPaymentProcessor** → `registerSalePayment` (pagamento à vista)
- ✅ **CashierService** → `createCashierMovement` (sangria/suprimento) + `createGenericMovementEntry` (movimentações avulsas)
- ✅ **BankAccountService** → `createOpeningBalanceEntry` (saldo inicial/ajuste)
- ✅ **ContractCancellationService** → `createPenaltyEntry` + `createCancellationDeductionEntry`

### 2.3 DRE (Demonstração do Resultado do Exercício)
- ✅ **DREService** busca diretamente do **balancete** (via `LedgerService.getTrialBalance`)
- ✅ **Receitas (Grupo 1)**: Calcula Crédito - Débito corretamente
- ✅ **Despesas (Grupo 2)**: Calcula Débito - Crédito corretamente
- ✅ **Não duplica dados** — lê apenas do Ledger

### 2.4 Wrapper Seguro (safeLedgerCall)
- ✅ Implementação com fallback: se o lançamento contábil falhar, **a operação principal não é bloqueada**
- ✅ Erros são persistidos no `LedgerErrorRepository` para correção posterior
- ✅ Contexto completo (sourceType, sourceId, operation) é salvo para diagnóstico

---

## 3. ⚠️ PONTOS FALHOS E INCONSISTÊNCIAS

### 3.1 🔴 CRÍTICO: Fluxo de Caixa (CashFlow) NÃO usa o Ledger

**Arquivo:** `useCashFlow.js` → `CashierService.listTransactions`

O Fluxo de Caixa lê diretamente da coleção `transactions` (via `CashierService.listTransactions`), **NÃO do Ledger**. Isso cria uma **fonte de verdade paralela**:

```
FLUXO DE CAIXA (HOJE):    TransactionRepository → useCashFlow
DRE (HOJE):                LedgerRepository → DREService → useDRE
```

**Problema:** Se um lançamento contábil falhar (e cair no `LedgerErrorRepository`), a DRE ficará divergente do Fluxo de Caixa. O Fluxo de Caixa mostra movimentações brutas, enquanto a DRE mostra apenas o que foi corretamente contabilizado.

**Impacto:** O gestor pode ver receitas no Fluxo de Caixa que não aparecem na DRE, gerando confusão.

---

### 3.2 🔴 CRÍTICO: Dashboard Financeiro ignora o Ledger completamente

**Arquivo:** `FinancialDashboardService.js`

O serviço de dashboard financeiro:
- `getCurrentBalance()` → Lê de `bankAccountRepository` + `cashierRepository` + `transactionRepository`
- `getMonthData()` → Lê diretamente da coleção `transactions` (query Firestore crua)
- `getOverdueReceivables()` → Lê de `receivableRepository`
- `getOverduePayables()` → Lê de `payableRepository`

**Nenhum dado** vem do Ledger. O dashboard deveria usar o balancete para ter consistência com a DRE.

---

### 3.3 🟡 MODERADO: SalesPaymentProcessor.processCardPayment — dupla contabilização de taxa

**Arquivo:** `SalesPaymentProcessor.js` (linhas 199-215)

Ao processar pagamento com cartão, o processador:
1. Cria recebíveis (correto)
2. Registra movimentação no caixa via `CashierService.registerMovement` (correto)
3. Registra **outra** movimentação de "Taxas de Cartão" como expense no caixa (linhas 202-215)

O problema é que essa segunda movimentação (`type: 'expense'`, `category: 'Taxas Financeiras'`) **NÃO tem `idSale`** como propriedade. Olhando o `CashierService.registerMovement` (linhas 159), a condição para criar lançamento genérico no Ledger é:

```js
else if (!fullMovement.idSale && !fullMovement.idPayable)
```

Como a movimentação de taxa **não tem** `idSale` (não foi passado), ela vai disparar `createGenericMovementEntry`, que cria um lançamento contábil com conta `2.5.3` (Taxas de Cartão).

Porém, quando o recebível for **liquidado** no futuro (via `ReceivableService.settleReceivable`), o `LedgerService.settleReceivableEntry` **também** registra a taxa como `CARD_FEES`:

```js
if (feeAmount > 0) {
    entries.push({ account: STANDARD_ACCOUNTS.CARD_FEES, debit: feeAmount })
}
```

**Resultado: A taxa de cartão é contabilizada DUAS vezes no Ledger — uma no momento da venda e outra na liquidação:**
1. Momento da venda: `createGenericMovementEntry` → D: 2.5.3 (Taxa) / C: 3.1.2 (Caixa)
2. Liquidação: `settleReceivableEntry` → D: 2.5.3 (Taxa) como parte do lançamento de recebimento

---

### 3.4 🟡 MODERADO: Regime de Competência vs Caixa inconsistente

O sistema mistura conceitos:

| Operação | Regime Esperado | Regime Implementado |
|----------|----------------|---------------------|
| Criar conta a pagar | Competência (despesa no mês do fato gerador) | ✅ Competência |
| Pagar conta | Caixa (saída no mês do pagamento) | ✅ Caixa |
| Criar venda | Competência (receita no mês da venda) | ✅ Competência |
| Receber pagamento à vista | Caixa | ✅ Caixa |
| Taxa de cartão na venda | Competência (reconhecer no mês da venda) OU Caixa (quando liquidar) | ⚠️ **AMBOS** (duplo) |
| Movimentação avulsa no caixa | Caixa | ✅ Caixa |
| Sangria/Suprimento | Patrimonial (não afeta DRE) | ✅ Correto |
| Saldo inicial | Patrimonial | ✅ Correto |

---

### 3.5 🟡 MODERADO: PayableService.payBill registra no CashierService + Ledger (possível duplicação)

**Arquivo:** `PayableService.js` (linhas 82-95 + 100-110)

Ao pagar uma conta:
1. `CashierService.registerMovement(...)` → Registra despesa no caixa
2. `LedgerService.payPayableEntry(...)` → Registra lançamento contábil

O problema é que `CashierService.registerMovement` tem uma condicional (linha 159):
```js
else if (!fullMovement.idSale && !fullMovement.idPayable) {
    await safeLedgerCall(...)  // createGenericMovementEntry
}
```

No `payBill`, o campo passado é `sourceType: 'payable'` mas **NÃO** é `idPayable`, é `idSource`. Então a condição `!fullMovement.idPayable` é `true`, e o `CashierService` tentará criar um lançamento genérico no Ledger.

**Mas olhando mais de perto:** O campo passado é `idSource`, não `idPayable`. Isso significa que a condição `!fullMovement.idPayable` será `true` e o `CashierService` **VAI** criar um lançamento genérico duplicado.

**Evidência no código (PayableService.js linhas 82-95):**
```js
await CashierService.registerMovement(idTenant, idBranch, userId, {
    type: 'expense',
    ...
    idBankAccount: idBankAccount,
    idSource: idPayable,      // ← NÃO é idPayable no schema do CashierService
    sourceType: 'payable',
    ...
})
```

O campo é `idSource`, mas o `CashierService` verifica `idPayable`. **FALHA DE NOMENCLATURA** gera lançamento duplicado no Ledger.

---

### 3.6 🟡 MODERADO: ReceivableService.settleReceivable registra no Caixa + Ledger

Mesma lógica do `PayableService`: ao liquidar um recebível, o `ReceivableService` chama:
1. `CashierService.registerMovement(...)` — com `idReceivable: idReceivable`
2. `LedgerService.settleReceivableEntry(...)` — lançamento contábil

O `CashierService.registerMovement` não tem validação para `idReceivable`. A condição que evita duplicação é `!fullMovement.idSale && !fullMovement.idPayable`. Como esse é um recebível (não uma venda direta e não um payable), a condição é `true`, e o `CashierService` **cria outro lançamento no Ledger** via `createGenericMovementEntry`.

**Resultado: DUPLICAÇÃO** — o mesmo recebimento gera dois lançamentos contábeis.

---

### 3.7 🟢 MENOR: AcquirerService não tem Ledger

**Arquivo:** `AcquirerService.js`

O serviço de adquirentes (máquinas de cartão) é puramente cadastral — OK, não precisa de Ledger.

---

### 3.8 🟢 MENOR: O Ledger não tem método de estorno/reversão genérico

Se uma venda for excluída (soft delete), o `SalesService.deleteSale` faz soft delete nos recebíveis, mas **NÃO estorna o lançamento contábil** correspondente. Isso deixa na DRE uma receita que não deveria mais existir.

---

### 3.9 🟢 MENOR: Falta lançamento contábil na transferência entre bancos

O `LedgerService.createBankTransfer` existe, mas **nenhum service** chama ele atualmente. Se o sistema tem funcionalidade de transferência entre bancos na UI, ela não está contabilizada.

---

## 4. Diagnóstico: O que PRECISA passar pelo Ledger?

### Operações que JÁ passam:
| # | Operação | LedgerService Method | Quem Chama |
|---|----------|---------------------|------------|
| 1 | Criar conta a pagar | `createPayableEntry` | PayableService.createPayable |
| 2 | Pagar conta | `payPayableEntry` | PayableService.payBill |
| 3 | Registrar venda | `createSaleEntry` | SalesService.processSale |
| 4 | Pagamento à vista (dinheiro/PIX) | `registerSalePayment` | SalesPaymentProcessor |
| 5 | Liquidar recebível | `settleReceivableEntry` | ReceivableService.settleReceivable |
| 6 | Antecipação de recebíveis | `settleReceivableEntry` | ReceivableService.anticipateReceivables |
| 7 | Sangria/Suprimento | `createCashierMovement` | CashierService.registerMovement |
| 8 | Movimentação avulsa | `createGenericMovementEntry` | CashierService.registerMovement |
| 9 | Saldo inicial | `createOpeningBalanceEntry` | BankAccountService |
| 10 | Ajuste de saldo | `createOpeningBalanceEntry` | BankAccountService |
| 11 | Multa rescisória | `createPenaltyEntry` | ContractCancellationService |
| 12 | Estorno por cancelamento | `createCancellationDeductionEntry` | ContractCancellationService |

### Operações que NÃO passam mas DEVERIAM:
| # | Operação | Impacto |
|---|----------|---------|
| 1 | **Exclusão de venda** (soft delete) | Não estorna a receita no Ledger → DRE incorreta |
| 2 | **Transferência entre bancos** | Método existe mas não é chamado → Saldos bancários no Ledger ficam incorretos |
| 3 | **Tarifa bancária** | `createBankFee` existe mas não é chamado de lugar nenhum |

### Operações DUPLICADAS no Ledger:
| # | Operação | Onde duplica |
|---|----------|-------------|
| 1 | **Pagar conta a pagar** | PayableService chama CashierService.registerMovement (que tenta Ledger genérico) + LedgerService.payPayableEntry |
| 2 | **Liquidar recebível** | ReceivableService chama CashierService.registerMovement (que tenta Ledger genérico) + LedgerService.settleReceivableEntry |
| 3 | **Taxa de cartão** | SalesPaymentProcessor registra taxa no CashierService + Liquidação futura em settleReceivableEntry |

---

## 5. Diagrama de Fluxo: Como deveria funcionar

```
VENDA → SalesService
    │
    ├─ [1] createSaleEntry (Ledger: D: AR | C: Receita)
    │
    ├─ Dinheiro/PIX → SalesPaymentProcessor
    │   ├─ [2] CashierService.registerMovement (Extrato do dia)
    │   └─ [3] registerSalePayment (Ledger: D: Caixa/Banco | C: AR)
    │
    ├─ Cartão → SalesPaymentProcessor
    │   ├─ [4] Cria Receivables (recebíveis futuros)
    │   └─ [5] CashierService.registerMovement (Extrato do dia) ← SEM LEDGER
    │
    └─ Saldo Devedor → processRemainingBalance
        └─ [6] Cria Receivable tipo 'client'

LIQUIDAÇÃO DE RECEBÍVEL → ReceivableService.settleReceivable
    ├─ [7] CashierService.registerMovement (Extrato) ← SEM LANÇAMENTO LEDGER
    ├─ [8] bankAccountRepository.adjustBalance (Saldo bancário)
    └─ [9] settleReceivableEntry (Ledger: D: Banco | C: AR | D: Taxa)

CONTA A PAGAR → PayableService.createPayable
    └─ [10] createPayableEntry (Ledger: D: Despesa | C: AP)

PAGAMENTO DE CONTA → PayableService.payBill
    ├─ [11] CashierService.registerMovement (Extrato) ← SEM LANÇAMENTO LEDGER
    ├─ [12] bankAccountRepository.adjustBalance (Saldo bancário)
    └─ [13] payPayableEntry (Ledger: D: AP | C: Banco)

MOVIMENTAÇÃO AVULSA (Manual no Caixa)
    └─ [14] CashierService.registerMovement
        ├─ Se sangria/suprimento com banco → createCashierMovement (Ledger)
        └─ Se avulsa (sem idSale/idPayable) → createGenericMovementEntry (Ledger)
```

---

## 6. PLANO DE AÇÃO: Reorganização do Sistema Financeiro

### Fase 1: Corrigir Duplicações no Ledger (URGENTE)

**Problema:** `CashierService.registerMovement` cria lançamento Ledger genérico quando `!idSale && !idPayable`, mas o `PayableService` e `ReceivableService` também criam seus próprios lançamentos.

**Solução:** Adicionar flags para impedir que o `CashierService` crie lançamentos Ledger quando quem chamou já vai fazer o seu.

#### Mudanças necessárias:

**A. `CashierService.registerMovement`** — Adicionar flag `skipLedger`:
```js
registerMovement: async (idTenant, idBranch, userId, movementData) => {
    // ... código existente ...
    
    // ✅ LANÇAMENTO CONTÁBIL (apenas se quem chamou NÃO vai fazer o próprio lançamento)
    if (!fullMovement.skipLedger) {
        if (/* sangria/suprimento */) {
            await safeLedgerCall(...)
        } else if (!fullMovement.idSale && !fullMovement.idPayable && !fullMovement.idReceivable) {
            await safeLedgerCall(...)
        }
    }
}
```

**B. `PayableService.payBill`** — Passar `skipLedger: true`:
```js
await CashierService.registerMovement(idTenant, idBranch, userId, {
    ...
    idPayable: idPayable,  // ← CORRIGIR: era idSource
    skipLedger: true        // ← NOVO: evita duplicação
})
```

**C. `ReceivableService.settleReceivable`** — Passar `skipLedger: true`:
```js
await CashierService.registerMovement(idTenant, idBranch, userId, {
    ...
    skipLedger: true        // ← NOVO: evita duplicação
})
```

**D. `SalesPaymentProcessor.processCardPayment`** — Remover a movimentação de taxa como expense separada (linhas 199-215), pois a taxa será contabilizada na liquidação futura:

```js
// REMOVER este bloco (linhas 199-215):
// const totalFee = receivables.reduce(...)
// if (totalFee > 0) { await CashierService.registerMovement(...) }
```

### Fase 2: Adicionar Лançamentos Contábeis Faltantes

**A. Estorno de Venda (SalesService.deleteSale):**
```js
await safeLedgerCall(idTenant, idBranch,
    () => LedgerService.createCancellationDeductionEntry(idTenant, idBranch, {
        contractId: sale.id,
        clientName: sale.clientName,
        saleNumber: sale.saleNumber,
        amount: sale.total
    }),
    { sourceType: 'sale_reversal', sourceId: idSale }
)
```

### Fase 3: Alinhar Dashboard e CashFlow com o Ledger

**A. `FinancialDashboardService.getMonthData`** — Converter para usar o Ledger:
- Receitas e Despesas do mês devem vir do `LedgerService.getTrialBalance`
- Saldos de caixa podem continuar vindo do `CashierService` (operacional)

**B. `useCashFlow`** — Decisão arquitetural:
- O Fluxo de Caixa mostra **movimentações operacionais** (extrato do dia) → `TransactionRepository` é correto para isso
- A DRE mostra **resultado contábil** → `LedgerRepository` é correto para isso
- **NÃO é necessário** que o CashFlow leia do Ledger, desde que o CashFlow seja claramente um "extrato operacional" e a DRE seja o "demonstrativo contábil"

### Fase 4: Organização de Arquivos

A estrutura atual é:
```
src/services/
├── Financial/
│   ├── Core/FinancialCalculator.js
│   ├── AcquirerService.js
│   ├── BankAccountService.js
│   ├── CashierService.js
│   ├── ContractService.js
│   ├── DREService.js
│   ├── FinancialDashboardService.js
│   ├── PayableService.js
│   └── ReceivableService.js
├── Ledger/
│   └── LedgerService.js
└── Sales/
    ├── SalesService.js
    └── SalesPaymentProcessor.js
```

**A estrutura proposta** (fase futura, sem urgência):
```
src/services/
├── Financial/
│   ├── Core/
│   │   ├── FinancialCalculator.js     ← (sem mudança)
│   │   └── STANDARD_ACCOUNTS.js       ← (extrair do LedgerService para reuso)
│   ├── Cashier/
│   │   └── CashierService.js          ← (sem mudança funcional)
│   ├── Payables/
│   │   └── PayableService.js          ← (sem mudança funcional)
│   ├── Receivables/
│   │   └── ReceivableService.js       ← (sem mudança funcional)
│   ├── Sales/
│   │   ├── SalesService.js            ← (mover para cá)
│   │   └── SalesPaymentProcessor.js   ← (mover para cá)
│   ├── Accounting/
│   │   ├── LedgerService.js           ← (mover para cá)
│   │   └── DREService.js              ← (mover para cá)
│   ├── Banking/
│   │   ├── BankAccountService.js      ← (mover para cá)
│   │   └── AcquirerService.js         ← (mover para cá)
│   └── Dashboard/
│       └── FinancialDashboardService.js
```

> **⚠️ ATENÇÃO:** Mover arquivos é **de baixo impacto funcional** mas **alto impacto em imports**. Cada mudança de caminho quebra dezenas de imports. Recomendação: fazer isso **apenas** se também configurar path aliases no webpack/vite.

---

## 7. Tabela-Resumo de Decisões

| Decisão | Status Atual | Recomendação | Prioridade |
|---------|-------------|--------------|------------|
| CashierService cria Ledger entries para movimentações avulsas | ✅ Correto | Manter | — |
| CashierService cria Ledger entries para movimentos que JÁ tem Ledger próprio | ❌ Duplica | Adicionar flag `skipLedger` | 🔴 ALTA |
| PayableService.payBill usa `idSource` em vez de `idPayable` | ❌ Bug de nomenclatura | Corrigir para `idPayable` | 🔴 ALTA |
| SalesPaymentProcessor registra taxa como movimentação separada no caixa | ❌ Duplica em regime duplo | Remover (taxa será reconhecida na liquidação) | 🔴 ALTA |
| SalesService.deleteSale não estorna Ledger | ❌ DRE incorreta | Adicionar estorno | 🟡 MÉDIA |
| FinancialDashboardService ignora Ledger | ⚠️ Aceitável | Alinhar receita/despesa com balancete | 🟡 MÉDIA |
| CashFlow (Fluxo de Caixa) lê de transactions | ✅ Aceitável | Manter (é extrato operacional) | — |
| DRE lê do Ledger | ✅ Correto | Manter | — |
| LedgerService.createBankTransfer nunca é chamado | ⚠️ Código morto | Implementar se UI de transferência existir | 🟢 BAIXA |
| LedgerService.createBankFee nunca é chamado | ⚠️ Código morto | Implementar se UI de tarifa existir | 🟢 BAIXA |
| Reorganização de pastas (mover arquivos) | — | Postergar (alto risco de quebrar imports) | 🟢 BAIXA |

---

## 8. Fluxo Correto Após Correções

```
                    ┌──────────────────────────┐
                    │      VENDA (SalesServ.)   │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
         Dinheiro/PIX       Cartão              Saldo Devedor
              │                  │                   │
    ┌─────────┴──────┐   ┌──────┴──────┐    ┌───────┴───────┐
    │ Caixa (extrato)│   │Cria Receivable│   │Cria Receivable│
    │ skipLedger=    │   │(futuro)       │   │type='client'  │
    │ false (tem     │   │               │   │               │
    │ registerSale   │   └──────┬────────┘   └───────────────┘
    │ Payment)       │          │
    └────────────────┘   Na LIQUIDAÇÃO:
                         │
                    ┌────┴──────────────────────┐
                    │SettleReceivable            │
                    │  → Caixa (skipLedger=true) │
                    │  → Banco (adjustBalance)   │
                    │  → Ledger (settle + taxa)  │
                    └───────────────────────────┘
    
                    ┌──────────────────────────┐
                    │   CONTA A PAGAR          │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────┐
              │                  │               │
         Criar Conta       Pagar Conta      Excluir Conta
              │                  │               │
    ┌─────────┴──────┐   ┌──────┴──────────┐   Soft Delete
    │Ledger:         │   │Caixa(skipLedger) │   (sem Ledger)
    │D:Despesa       │   │Banco(adjustBal)  │
    │C:AP            │   │Ledger:           │
    └────────────────┘   │D:AP C:Banco     │
                         └─────────────────┘
```

---

## 9. Status de Implementação

✅ **Todas as correções foram aplicadas em 2026-02-11.**

| Fase | Descrição | Status | Commit |
|------|-----------|--------|--------|
| **Fase 1** | Corrigir duplicações no Ledger (`skipLedger`, `idPayable`, remover taxa duplicada) | ✅ Implementado | Veja abaixo |
| **Fase 2** | Estorno contábil na exclusão de venda | ✅ Implementado | Veja abaixo |
| **Fase 3** | Alinhar Dashboard com Ledger | ✅ Implementado | Veja abaixo |
| **Fase 4** | Reorganização de pastas | 📝 Postergado (baixa prioridade) | — |

### Arquivos Modificados:

| Arquivo | Mudança |
|---------|---------|
| `CashierService.js` | Adicionado guard `if (!skipLedger)` + verificação de `idReceivable` |
| `PayableService.js` | Corrigido `idSource` → `idPayable` + `skipLedger: true` |
| `ReceivableService.js` | Adicionado `skipLedger: true` na chamada ao CashierService |
| `SalesPaymentProcessor.js` | Removido bloco de taxa de cartão duplicada (linhas 199-215) |
| `SalesService.js` | Adicionado estorno contábil (`createCancellationDeductionEntry`) no `deleteSale` |
| `FinancialDashboardService.js` | `getMonthData` agora usa `LedgerService.getTrialBalance` com fallback para transactions |

### Build: ✅ Compilação bem-sucedida (Exit code: 0)
