# ☑️ CHECKLIST DE AJUSTES — MÓDULO FINANCEIRO

**Referência:** `AUDITORIA_MODULO_FINANCEIRO.md`  
**Data:** 2026-02-10  
**Política:** Padronizar TODOS os valores internos (banco/código) em **inglês**. UI exibe em **português**.

---

## 🟢 N11. PADRONIZAÇÃO DE PAYMENT METHODS — ✅ CONCLUÍDO

> **Regra:** Valores internos em inglês. Labels de UI em português.  
> **Dados Firestore:** Descartáveis, não requerem migração.

### Mapeamento de Valores

| Antigo (PT) | Novo (EN) | Status |
|---|---|---|
| `'dinheiro'` | `'money'` | ✅ |
| `'cartao_credito'` | `'credit_card'` | ✅ |
| `'cartao_debito'` | `'debit_card'` | ✅ |
| `'boleto'` | `'bank_slip'` | ✅ |
| `'ted'` | `'transfer'` | ✅ |
| `'cartao_corporativo'` | `'corporate_card'` | ✅ |
| `'cheque'` | `'check'` | ✅ |
| `'transferencia'` | `'transfer'` | ✅ |
| `'pix'` | `'pix'` | ✅ (inalterado) |
| `'pending_payment'` | `'pending_payment'` | ✅ (já EN) |

### Arquivos Alterados

#### Fonte da Verdade
- [x] **`constants.js`** — `CREDIT_CARD: 'credit_card'`, `DEBIT_CARD: 'debit_card'`, `CASH: 'money'`, `BOLETO: 'bank_slip'`

#### Schemas
- [x] **`SaleSchema.js`** — `oneOf(['money', 'pix', 'debit_card', 'credit_card'])`
- [x] **`ReceivableSchema.js`** — `oneOf(['money', 'pix', 'debit_card', 'credit_card', 'pending_payment', 'bank_slip'])`

#### Services
- [x] **`SalesPaymentProcessor.js`** — `method: 'money'`, `paymentMethod: 'money'`, `'debit_card'` comparações
- [x] **`SalesService.js`** — `payment.methodId === 'money'`, `['debit_card', 'credit_card'].includes()`
- [x] **`CashierService.js`** — Removido fallback `|| 'dinheiro'`, manteve apenas `'money'`
- [x] **`FinancialDashboardService.js`** — Removido fallback `|| 'dinheiro'`
- [x] **`LedgerService.js`** — `'transferencia'` → `'transfer'`

#### Hooks
- [x] **`useCashier.js`** — Chaves: `money`, `credit_card`, `debit_card`. Removido fallback duplo.

#### Componentes UI (values internos alterados, labels PT mantidos)
- [x] **`CashierPrintTemplate.js`** — Chaves: `money`, `credit_card`, `debit_card` + refs `totals.*`
- [x] **`Receivables/index.js`** — `<option value="credit_card">`, `<option value="money">` etc + comparações
- [x] **`ReceivableSettlementModal.js`** — `<option value="credit_card">`, `<option value="money">`, `<option value="bank_slip">`
- [x] **`PayablePaymentModal.js`** — `<option value="money">`, `<option value="transfer">`, `<option value="bank_slip">`, `<option value="corporate_card">`, `<option value="check">`
- [x] **`SaleDetailsModal.js`** — `['credit_card', 'debit_card'].includes()`
- [x] **`SalesCartPanel.js`** — Removido `.includes('cartao')`, agora usa `PAYMENT_METHODS.*`
- [x] **`ClientFinancial.js`** — Corrigido `'cash'` → `'money'`

#### Validações
- [x] **`financialSchemas.js`** — Já usava `PAYMENT_METHODS.*` (auto-atualizado via constants)

---

## 🔴 PRIORIDADE 1 — RISCOS ALTOS (PENDENTE)

### N2. Saldo Bancário Atômico (Race Condition) — ✅ CONCLUÍDO
- [x] **`BankAccountRepository.js`** — Criado `adjustBalance(delta)` usando `increment()` do Firestore
- [x] **`PayableService.js`** — `payBill`: Trocado `read→calc→write` por `adjustBalance(-finalAmount)`
- [x] **`ReceivableService.js`** — `settleReceivable`: Trocado por `adjustBalance(+netAmount)`
- [x] **`ReceivableService.js`** — `anticipateReceivables`: Trocado por `adjustBalance(+totalNet)`

### N3. Erros Contábeis Silenciosos — ✅ CONCLUÍDO
- [x] **`LedgerErrorRepository.js`** — NOVO. Herda BaseRepository, coleção `ledger_errors`
- [x] **`LedgerService.js`** — Criada `safeLedgerCall()`: try/catch + persistência de erros no Firestore
- [x] **`PayableService.js`** — `createPayable` e `payBill`: try/catch → safeLedgerCall
- [x] **`ReceivableService.js`** — `settleReceivable` e `anticipateReceivables`: try/catch → safeLedgerCall
- [x] **`CashierService.js`** — `registerMovement`: try/catch → safeLedgerCall

### N1. Transações Atômicas (Firestore Batch/Transaction) — ⏸️ ADIADO
> **Motivo:** Requer refatoração profunda (CashierService, LedgerService, BankAccountRepository).
> O `increment()` (N2) e `safeLedgerCall` (N3) já mitigam os riscos mais graves.
> Agendar para fase dedicada de refatoração da camada de dados.
- [ ] `ReceivableService.js` — `settleReceivable`: Agrupar passos 3-7 em `runTransaction()`
- [ ] `PayableService.js` — `payBill`: Agrupar passos 1-5 em `runTransaction()`
- [ ] `ReceivableService.js` — `anticipateReceivables`: Agrupar passos 2-4 em `writeBatch()`
- [ ] `BaseRepository.js` — Criar variantes de `create/update` que aceitem `transaction` object
- [ ] `LedgerRepository.js` — Criar variante de `create` que aceite `transaction` object

---

## 🟡 PRIORIDADE 2 — RISCOS MÉDIOS (PENDENTE)

### N4. Hooks sem `isReady` — ✅ CONCLUÍDO
- [x] **`useFinancialDashboard.js`** — Adicionado `isReady` ao destructuring + guard + dependency array
- [x] **`useCashier.js`** — Adicionado `isReady` ao destructuring + guard + dependency array

### N5. LedgerRepository não herda BaseRepository — ✅ CONCLUÍDO
- [x] **`LedgerRepository.js`** — Refatorado para estender `BaseRepository`. Override de `create` mantém validação. `findByPeriod`/`findBySource` usam `findWhere`.

### N6. Duplicação no Plano de Contas — ✅ CONCLUÍDO
- [x] **`LedgerService.js`** — `CASH: '3.1.2'` (era `3.1.1` = mesmo que BANK_ACCOUNTS)
- [x] **`LedgerService.js`** — `SALARY_PAYABLE: '4.1.2'` (era `4.1.1` = mesmo que ACCOUNTS_PAYABLE)
- [x] **`LedgerService.js`** — `ACCOUNTS_RECEIVABLE: '3.1.3'` (renum por cascata)

### N7. Prazo fixo D+30 no cartão — ✅ CONCLUÍDO
- [x] **`AcquirerSchema.js`** — Adicionado `settlementDays: Yup.number().default(30)`
- [x] **`SalesPaymentProcessor.js`** — Trocado `30 * i` por `(activeAcquirer?.settlementDays || 30) * i`

### N8. `closeCashier` confia em saldo denormalizado — ✅ CONCLUÍDO
- [x] **`CashierService.js`** — `closeCashier` agora recalcula saldo baseado nas transações method='money'
- [x] **`CashierService.js`** — `registerMovement` corrigido: expense não reduz saldo físico se method != 'money'

---

## 🟢 PRIORIDADE 3 — MELHORIAS (PENDENTE)

### 🟢 N9. Repositórios com `findBy` Helpers — ✅ CONCLUÍDO
- [x] **`ReceivableRepository.js`** — Criar: `findBySaleId()`, `findPendingByClient()`, `findOverdue()`
- [x] **`PayableRepository.js`** — Criar: `findByStatus()`, `findOverdue()`

### 🟢 N10. TransactionSchema incompleto — ✅ CONCLUÍDO
- [x] **`TransactionSchema.js`** — Adicionar `amount: Yup.number().positive().required()`
- [x] **`TransactionSchema.js`** — Adicionar validação de `method` com `oneOf(PAYMENT_METHODS)`

### N12. DRE classifica por prefixo de conta
- [ ] **`DREService.js`** — Trocar `startsWith()` por map/set de contas explícitas

### N13. `findAll`/`findWhere` não filtram `deletedAt`
- [ ] **`BaseRepository.js`** — Avaliar filtro padrão `deletedAt == null`

### N14. Query com `!=` no Firestore
- [ ] **`ReceivableService.js`** — Remover `['status', '!=', 'cancelled']` e filtrar em memória

---

## 📊 RESUMO DO CHECKLIST

| Item | Status | Alterações |
|------|--------|------------|
| ✅ N11 — Padronização Payment Methods | **FEITO** | 18 arquivos, ~30 pontos alterados |
| ✅ N2 — Saldo Atômico | **FEITO** | 4 arquivos, adjustBalance com increment() |
| ✅ N3 — Erros Contábeis | **FEITO** | 6 arquivos, safeLedgerCall + ledger_errors |
| ⏸️ N1 — Transações Atômicas | **ADIADO** | Requer refatoração profunda |
| ✅ N4 — isReady | **FEITO** | 2 hooks corrigidos |
| ✅ N5 — LedgerRepo | **FEITO** | 1 arquivo refatorado |
| ✅ N6 — Plano de Contas | **FEITO** | 3 contas diferenciadas |
| ✅ N7 — D+30 | **FEITO** | Prazo configurável por adquirente |
| ✅ N8 — Saldo Denormalizado | **FEITO** | Recálculo no closeCashier |
| ✅ N9 — Repositórios Helpers | **FEITO** | `findBySale`, `findOverdue`, etc. |
| ✅ N10 — TransactionSchema | **FEITO** | Validação estrita de amount e methods |
| 🟢 N12-N14 — Outras Melhorias | Pendente | 4 pontos |
