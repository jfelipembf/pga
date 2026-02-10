# 🔍 AUDITORIA — MÓDULO FINANCEIRO (PGA Sistema)
**Data:** 2026-02-10  
**Escopo:** Análise completa de serviços, repositórios, schemas, hooks e encadeamentos  
**Política:** Somente leitura — nenhum arquivo foi alterado  

---

## 📁 ARQUIVOS ANALISADOS

### Serviços (Services)
| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `ReceivableService.js` | 370 | Contas a Receber (Liquidação, Antecipação Bulk, Cancelamento) |
| `PayableService.js` | 257 | Contas a Pagar (CRUD, Pagamento com débito bancário) |
| `CashierService.js` | 190 | Gaveta de Caixa (Sessões, Movimentações) |
| `BankAccountService.js` | 157 | Contas Bancárias (CRUD, Ajuste de Saldo) |
| `AcquirerService.js` | 110 | Credenciadoras de Cartão (CRUD) |
| `DREService.js` | 86 | Demonstração do Resultado do Exercício |
| `FinancialDashboardService.js` | 169 | Dashboard Financeiro (Saldos, Inadimplência) |
| `LedgerService.js` | 467 | Partidas Dobradas (Plano de Contas, Balancete) |
| `SalesPaymentProcessor.js` | 228 | Processamento de Pagamentos de Vendas |

### Schemas (Yup)
| Arquivo | Campos-chave |
|---------|-------------|
| `ReceivableSchema.js` | type (acquirer/client), amount, paid, pending, dueDate, status |
| `PayableSchema.js` | amount, dueDate, chartOfAccountId, costCenterId, status |
| `SaleSchema.js` | items[], payments[], total, totalPaid, balance |
| `ContractSchema.js` | duration, durationType, price, maxInstallments, accessLimit |
| `TransactionSchema.js` | type (income/expense), amount, netAmount, method |
| `BankAccountSchema.js` | name, bank, currentBalance, isActive |
| `AcquirerSchema.js` | name, rateConfigs[{brands, fees}], isActive |
| `CashierSessionSchema.js` | openingBalance, status, totalIncome, totalExpenses |

### Repositórios
| Arquivo | Herda de | Métodos Especiais |
|---------|----------|-------------------|
| `BaseRepository.js` | — | findAll, findById, findWhere, create, update, softDelete, hardDelete |
| `ReceivableRepository.js` | BaseRepository | (nenhum adicional) |
| `PayableRepository.js` | BaseRepository | (nenhum adicional) |
| `CashierRepository.js` | BaseRepository | findActiveSessions, findOpenSession, findByDate |
| `BankAccountRepository.js` | BaseRepository | findActive, findVisible, updateBalance |
| `SalesRepository.js` | BaseRepository | (nenhum adicional) |
| `LedgerRepository.js` | — (standalone) | create (com validação de balanceamento), findByPeriod, findBySource |
| `TransactionRepository.js` | BaseRepository | (presumido) |

### Hooks (UI)
| Hook | Usa `isReady`? | Paginação? |
|------|---------------|------------|
| `useReceivablesList.js` | ✅ Sim | ✅ fetchLimit + handleLoadMore |
| `usePayables.js` | ✅ Sim | ✅ fetchLimit + handleLoadMore |
| `useCashFlow.js` | ✅ Sim | ✅ fetchLimit + hasMore |
| `useCashier.js` | ❌ Não | ❌ Não |
| `useDRE.js` | ✅ Sim | ❌ Não (DRE é resumo) |
| `useFinancialDashboard.js` | ❌ Não | ❌ Não |

---

## ✅ PONTOS POSITIVOS

### 1. Arquitetura em Camadas Consistente
O sistema segue uma separação clara: **Schema → Repository → Service → Hook → Page**. Isso facilita manutenção e testes. A `BaseRepository` centraliza operações genéricas de CRUD multitenant, evitando duplicação de código.

### 2. Sistema de Partidas Dobradas (Double-Entry Bookkeeping)
O `LedgerService` implementa um sistema contábil real com partidas dobradas. O `LedgerRepository.create()` valida o balanceamento (`|débito - crédito| < 0.01`), rejeitando lançamentos inconsistentes. Isso é raro em sistemas pequenos e demonstra maturidade contábil.

### 3. Plano de Contas Padronizado (STANDARD_ACCOUNTS)
O `LedgerService` define um plano de contas com grupos lógicos:
- **Grupo 1**: Receitas (1.1.x)
- **Grupo 2**: Despesas (2.x)
- **Grupo 3**: Ativos (3.x)
- **Grupo 4**: Passivos (4.x)
- **Grupo 5**: Patrimônio (5.x)

Isso permite gerar DRE, Balancete e eventualmente Balanço Patrimonial.

### 4. Diferenciação de Risco em Recebíveis
O schema `ReceivableSchema` diferencia `type: 'acquirer'` (risco zero — adquirente garante) vs `type: 'client'` (risco alto — inadimplência possível). Isso evita que valores de cartão poluam a métrica de inadimplência.

### 5. Auditoria Sistemática
Todos os serviços financeiros registram ações via `AuditService.log()` com snapshot, diff e dados de contexto (userId, userName, entityType, entityId). Isso cria uma trilha de auditoria completa para compliance.

### 6. Soft Delete Generalizado
O `BaseRepository.softDelete()` preserva registros financeiros com `deletedAt` + `deletedBy`, evitando perda de dados históricos. Operações sensíveis (excluir pago, excluir conta com transações) são bloqueadas no Service Layer.

### 7. Validação Defensiva nos Serviços
Os services validam estado antes de operar:
- `ReceivableService.settleReceivable` → verifica `status !== 'paid'` e `deletedAt`
- `PayableService.payBill` → verifica saldo bancário suficiente
- `PayableService.deletePayable` → bloqueia se já pago
- `BankAccountService.delete` → bloqueia se conta tem transações ou é primary
- `CashierService.openCashier` → impede caixa duplicado por operador

### 8. Hook `isReady` Pattern
A maioria dos hooks usa `isReady` do `useTenant()` para evitar chamadas prematuras (enquanto o contexto de tenant/branch não estiver disponível). Isso previne flickering e erros de dados.

### 9. Fallback Automático em Agregações Firestore
O `FinancialDashboardService` tenta usar `getAggregateFromServer()` (eficiente) e, em caso de falha (índice ausente), faz fallback para consulta manual (`findWhere` + reduce). Isso garante resiliência.

### 10. Processamento de Cartão com Taxas Dinâmicas
O `SalesPaymentProcessor.processCardPayment` busca taxas da adquirente ativa, suporta diferenciação por bandeira (`rateConfigs`), e calcula taxa proporcional por parcela — modelagem financeira realista.

---

## ⚠️ PONTOS NEGATIVOS / RISCOS IDENTIFICADOS

### 🔴 RISCO ALTO

---

#### N1. Ausência de Transações Atômicas (Firestore Batch/Transaction)

**Onde:** `ReceivableService.settleReceivable`, `PayableService.payBill`, `ReceivableService.anticipateReceivables`

**Problema:** Operações que envolvem múltiplas escritas (atualizar recebível + atualizar banco + criar transação + criar ledger + atualizar venda) são feitas como chamadas sequenciais independentes. Se uma falhar no meio, o sistema fica em estado inconsistente:
- Exemplo: `settleReceivable` debita `R$ 500` no caixa (passo 3) mas falha ao atualizar o recebível (passo 5) → dinheiro "sumiu" contabilmente.

**Gravidade:** 🔴 Alta — pode causar desbalanceamento financeiro real.

**Sugestão:** Usar `runTransaction()` ou `writeBatch()` do Firestore para agrupar escritas críticas em uma operação atômica.

**Impacto de alteração:**
- `ReceivableService.settleReceivable` → precisa receber o `transaction` object do Firestore e passar para todos os repositórios chamados internamente
- `receivableRepository`, `bankAccountRepository`, `transactionRepository` → precisariam de variantes que aceitam `transaction` como parâmetro
- `CashierService.registerMovement` → atualmente cria de forma independente; precisaria ser chamado dentro da mesma transaction ou ser refatorado
- `LedgerRepository.create` → precisaria aceitar `transaction` object
- **Risco de cascata:** Alto — muda a assinatura de vários métodos usados em múltiplos serviços

---

#### N2. Atualização de Saldo Bancário Não-Atômica

**Onde:** `PayableService.payBill` (linhas 76-103), `ReceivableService.settleReceivable` (linhas 51-57), `ReceivableService.anticipateReceivables` (linhas 349-354)

**Problema:** O saldo bancário é lido (`findById`), calculado no JS (`currentBalance - amount`), e gravado (`update`). Em cenário de concorrência (dois pagamentos simultâneos), ambos leem o mesmo saldo e escrevem valores errados (race condition clássica read-modify-write).

**Gravidade:** 🔴 Alta — pode corromper saldo bancário.

**Sugestão:** Usar `increment()` do Firestore ou `runTransaction()` para garantir atomicidade da atualização de saldo.

**Impacto de alteração:**
- `bankAccountRepository.updateBalance` já existe mas não é usado nos services (usa `update` direto)
- Trocar por `increment(-amount)` em `PayableService.payBill`, `ReceivableService.settleReceivable`, `ReceivableService.anticipateReceivables`
- **Risco de cascata:** Baixo — mudança isolada no repositório e nos 3 pontos de chamada

---

#### N3. Erro Contábil Silencioso (try/catch que engole o erro)

**Onde:** `PayableService.createPayable` (linhas 39-44), `PayableService.payBill` (linhas 109-118), `ReceivableService.settleReceivable` (linhas 80-92), `ReceivableService.anticipateReceivables` (linha 321), `CashierService.registerMovement` (linhas 121-137)

**Problema:** Todos os lançamentos contábeis estão dentro de `try/catch` que apenas fazem `console.error`. Se o `LedgerRepository.create()` falhar, a operação principal continua com sucesso, mas o livro razão (Ledger) fica incompleto. Isso quebra a integridade do Balancete e do DRE.

**Gravidade:** 🔴 Alta — DRE e Balancete desatualizados sem que ninguém perceba.

**Sugestão:**
1. Mínimo: Registrar o erro no Firestore (coleção `ledger_errors`) e criar um mecanismo de reconciliação
2. Ideal: Incluir o lançamento contábil dentro da mesma transação atômica (ver N1)

**Impacto de alteração:**
- Se optar por falhar a operação completa: pode gerar rollback complexo (ex: desfazer débito no caixa se o ledger falhou)
- Se optar por fila de erros: impacto baixo (apenas cria um novo repositório `LedgerErrorRepository`)

---

### 🟡 RISCO MÉDIO

---

#### N4. `useFinancialDashboard` e `useCashier` não usam `isReady`

**Onde:** `useFinancialDashboard.js` (linha 8), `useCashier.js` (linha 14)

**Problema:** Enquanto `useReceivablesList`, `usePayables`, `useCashFlow` e `useDRE` usam `isReady` do `useTenant()`, estes dois hooks fazem apenas `if (!idTenant || !idBranch) return`. Em cenários de navegação rápida, `idTenant` pode estar disponível antes do contexto estar totalmente pronto, causando chamadas com dados parciais.

**Gravidade:** 🟡 Média — pode causar flickering ou dados vazios no carregamento inicial.

**Sugestão:** Trocar por `const { idTenant, idBranch, isReady } = useTenant()` e adicionar `if (!isReady) return` no início do `loadData/loadDashboard`.

**Impacto de alteração:**
- `useFinancialDashboard.js`: Adicionar `isReady` na desestruturação e no guard clause (~2 linhas)
- `useCashier.js`: Mesmo tratamento (~2 linhas)
- **Risco de cascata:** Nenhum — mudança isolada dentro dos hooks

---

#### N5. `LedgerRepository` não herda de `BaseRepository`

**Onde:** `LedgerRepository.js`

**Problema:** O `LedgerRepository` reimplementa `db`, `getCollectionRef`, `create` e `findByPeriod` manualmente, sem herdar da `BaseRepository`. Isso causa:
1. Duplicação de código (getter `db`, `getCollectionRef`)
2. O `create` do `LedgerRepository` usa `addDoc` (ID automático), enquanto o `BaseRepository.create` usa `setDoc` (ref manual). Ambos funcionam, mas a inconsistência dificulta manutenção.
3. O `LedgerRepository` não tem `softDelete` — se precisar apagar um lançamento errado, não há mecanismo.

**Gravidade:** 🟡 Média — manutenção e consistência.

**Sugestão:** Estender `BaseRepository` e sobrescrever apenas `create` (para incluir validação de balanceamento).

**Impacto de alteração:**
- Muda apenas `LedgerRepository.js`
- Os métodos `findByPeriod` e `findBySource` podem ser convertidos para usar `findWhere` com os mesmos filtros
- `LedgerService` continua chamando os mesmos métodos → sem impacto externo
- DREService depende de `LedgerService.getTrialBalance` → sem impacto

---

#### N6. Duplicação de Contas no Plano de Contas (`STANDARD_ACCOUNTS`)

**Onde:** `LedgerService.js` (linhas 24-25, 29-30)

**Problema:**
```javascript
BANK_ACCOUNTS: '3.1.1',
CASH: '3.1.1',           // ← MESMA conta que BANK_ACCOUNTS!
ACCOUNTS_PAYABLE: '4.1.1',
SALARY_PAYABLE: '4.1.1', // ← MESMA conta que ACCOUNTS_PAYABLE!
```
Bancário e Caixa compartilham o código `3.1.1`, impossibilitando segregação no Balancete. Contas a Pagar e Salários também (`4.1.1`).

**Gravidade:** 🟡 Média — compromete a precisão do Balanço Patrimonial e pode confundir análises.

**Sugestão:** Diferenciar:
- `CASH: '3.1.2'` (Caixa Físico)
- `SALARY_PAYABLE: '4.1.2'` (Salários a Pagar)

**Impacto de alteração:**
- `LedgerService.registerSalePayment` usa `STANDARD_ACCOUNTS.CASH` → muda o código contábil de vendas em dinheiro
- `LedgerService.createCashierMovement` usa `STANDARD_ACCOUNTS.CASH` → mesma mudança
- Lançamentos antigos já gravados com `3.1.1` ficariam com código "errado" (migração de dados seria necessária ou aceitar que dados históricos misturaram Banco+Caixa)
- **Risco de cascata:** Médio — dados históricos do Ledger ficariam com código antigo

---

#### N7. `SalesPaymentProcessor.processCardPayment` — Simplificação do Prazo D+30*i

**Onde:** `SalesPaymentProcessor.js` (linha 130)

**Problema:**
```javascript
const daysToAdd = payment.methodId === 'cartao_debito'
    ? 1   // Débito = D+1
    : (30 * i); // Crédito = D+30 * i (simplificado)
```
Na realidade, adquirentes têm prazos variáveis (D+28, D+30, D+32 dependendo do feriado e da adquirente). O sistema usa multiplicação fixa `30 * i`, o que pode distorcer o fluxo de caixa projetado para parcelas longas (12x = 360 dias em vez dos reais ~365).

**Gravidade:** 🟡 Média — afeta projeção de fluxo de caixa mas não o valor.

**Sugestão:** Adicionar campo `settlementDays` no `AcquirerSchema` e usar como base: `daysToAdd = acquirer.settlementDays * i`.

**Impacto de alteração:**
- `AcquirerSchema` → adicionar campo `settlementDays` com default 30
- `SalesPaymentProcessor.processCardPayment` → trocar `30 * i` por `acquirer.settlementDays * i`
- `AcquirerForm.js` → adicionar campo no formulário
- Dados existentes de recebíveis não são afetados (datas já foram calculadas)

---

#### N8. `closeCashier` usa `session.expectedBalance` estático

**Onde:** `CashierService.closeCashier` (linha 64)

**Problema:** O `closeCashier` calcula `difference = actualBalance - session.expectedBalance`. Porém, `expectedBalance` é atualizado incrementalmente em `registerMovement` (somando/subtraindo). Se houve um bug ou race condition em algum `registerMovement`, o `expectedBalance` do documento estará errado.

O `useCashier.liveSummary` (hook da UI) já recalcula o saldo com base nas transações reais (correto!), mas o `closeCashier` do Service não faz isso — confia no campo denormalizado.

**Gravidade:** 🟡 Média — a diferença reportada no fechamento pode estar incorreta.

**Sugestão:** No `closeCashier`, recalcular o `expectedBalance` a partir das transações reais (igual ao hook), e só então comparar com `actualBalance`.

**Impacto de alteração:**
- Apenas `CashierService.closeCashier` → buscar transações da sessão, recalcular, comparar
- Precisa importar `transactionRepository` (já importado no arquivo)
- **Risco de cascata:** Nenhum

---

### 🟢 RISCO BAIXO / MELHORIAS

---

#### N9. Repositórios Financeiros sem Métodos Convenientes

**Onde:** `ReceivableRepository.js`, `PayableRepository.js`, `SalesRepository.js`

**Problema:** Esses repositórios são shells vazios que apenas herdam `BaseRepository`, sem métodos como `findBySaleId`, `findPending`, `findOverdue`, `findByClient`. Toda filtragem é feita via `findWhere` genérico nos Services, repetindo filtros como `['status', '==', 'open']` em múltiplos lugares.

**Sugestão:** Adicionar métodos semânticos:
```javascript
// ReceivableRepository
async findBySaleId(idTenant, idBranch, saleId) { ... }
async findPendingByClient(idTenant, idBranch, clientId) { ... }
async findOverdue(idTenant, idBranch) { ... }
```

**Impacto:** Nenhum risk — apenas adição de convenience methods.

---

#### N10. Falta de Schema `TransactionSchema` — Campos Mínimos

**Onde:** `TransactionSchema.js`

**Problema:** O schema define `amount` como obrigatório mas sem `min(0)`, permitindo valores negativos. Também não valida `method` contra uma lista de opções válidas (permite qualquer string). 

Comparado com `ReceivableSchema` e `PayableSchema`, que são detalhados, o `TransactionSchema` é muito enxuto (20 linhas vs 59).

**Sugestão:** Adicionar:
- `amount: Yup.number().min(0).required()`
- `method: Yup.string().oneOf(['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto', 'money']).required()`

**Impacto:** Pode quebrar transações legadas que usem `method: 'money'` (o CashierService usa `'money'` em sangrias mas `'dinheiro'` em outros lugares → inconsistência **N11**).

---

#### N11. Inconsistência no Nome do Método de Pagamento ('money' vs 'dinheiro')

**Onde:**  
- `CashierService.registerMovement` recebe `method: 'money'` (no `useCashier.handleMovement`, linha 189)  
- `SalesPaymentProcessor.processCashPayment` usa `method: 'dinheiro'`  
- `useCashier.liveSummary` verifica `method === 'money' || method === 'dinheiro'` (ambos!)  
- `FinancialDashboardService.getCurrentBalance` verifica `'money'` e `'dinheiro'`

**Problema:** Dois nomes para o mesmo conceito. O hook compensa com `||`, mas filtragens no Firestore (onde não dá pra fazer `||`) podem perder dados.

**Sugestão:** Padronizar para `'dinheiro'` em todo o sistema (é o que está no `ReceivableSchema.paymentMethod`).

**Impacto:** 
- `useCashier.handleMovement` → trocar `method: 'money'` por `method: 'dinheiro'`
- Dados existentes no Firestore com `method: 'money'` precisariam de migração ou filtro duplo permanente

---

#### N12. `DREService` classifica por prefixo de conta (startsWith)

**Onde:** `DREService.js` (linhas 36, 50)

**Problema:** O DRE classifica receita se `account.startsWith('1')` e despesa se `account.startsWith('2')`. Se alguém cadastrar uma conta `10.1` ou `100`, ela seria classificada como receita. Funciona com o `STANDARD_ACCOUNTS` atual, mas é frágil.

**Sugestão:** Usar enum/map em vez de prefixo:
```javascript
const REVENUE_ACCOUNTS = ['1.1.1', '1.1.2', '1.1.3', '1.1.4'];
```

**Impacto:** Apenas `DREService.js` — sem cascata.

---

#### N13. `BaseRepository.findById` filtra `deletedAt` mas `findAll`/`findWhere` não

**Onde:** `BaseRepository.js` (linhas 63-72 vs 55-61)

**Problema:** `findById` retorna `null` se `data.deletedAt` existir (soft-deleted invisível). Mas `findAll` e `findWhere` retornam TODOS os registros, incluindo os deletados. Isso obriga cada Service a filtrar em memória (`data.filter(p => !p.deletedAt)`), repetindo a mesma lógica em ~8 lugares.

**Sugestão:** Opção A: Adicionar filtro `deletedAt == null` por padrão no `findAll`/`findWhere`. Opção B: Criar `findAllVisible` que encapsula isso.

**Impacto:** Se adicionar `deletedAt == null` automaticamente, pode exigir índice composto no Firestore para cada combinação de filtro + `deletedAt`. Testar por índice.

---

#### N14. `ReceivableService.getSummaryByClient` faz query com `!=` + `==` no mesmo campo path

**Onde:** `ReceivableService.js` (linhas 161-169)

**Problema:**
```javascript
receivableRepository.findWhere(idTenant, idBranch, [
    ['idClient', '==', idClient],
    ['status', '!=', 'cancelled'],
    ['deletedAt', '==', null]
])
```
O Firestore não permite `!=` e `==` em campos diferentes sem índice composto adequado. Além disso, `!=` no Firestore exclui documentos sem o campo (`status` undefined).

**Sugestão:** Trocar para busca sem `!=` e filtrar em memória: buscar todos do cliente e filtrar `.filter(r => r.status !== 'cancelled')`.

**Impacto:** Apenas `ReceivableService.getSummaryByClient` — sem cascata.

---

## 📊 GRAFO DE DEPENDÊNCIAS (Encadeamento Crítico)

```
Venda (SalesService)
  └── SalesPaymentProcessor
        ├── processCashPayment → CashierService.registerMovement → TransactionRepo + CashierRepo
        │                        └── LedgerService.registerSalePayment → LedgerRepo
        ├── processPixPayment  → (mesma cadeia)
        ├── processCardPayment → ReceivableRepo.create (gera parcelas futuras)
        │                        ├── CashierService.registerMovement
        │                        └── AcquirerRepo (busca taxas)
        └── processRemainingBalance → ReceivableRepo.create (gera título de saldo devedor)

Liquidação de Recebível (ReceivableService.settleReceivable)
  ├── CashierService.registerMovement → TransactionRepo + CashierRepo (updates session)
  ├── BankAccountRepo.update (atualiza saldo)
  ├── ReceivableRepo.update (marca como paid)
  ├── LedgerService.settleReceivableEntry → LedgerRepo
  ├── SalesRepo.update (se último título do cliente for pago → venda "paid")
  └── AuditService.log

Pagamento de Conta (PayableService.payBill)
  ├── BankAccountRepo (verifica saldo)
  ├── CashierService.registerMovement → TransactionRepo + CashierRepo
  ├── BankAccountRepo.update (debita saldo)
  ├── LedgerService.payPayableEntry → LedgerRepo
  ├── PayableRepo.update (marca como paid)
  └── AuditService.log

DRE (DREService)
  └── LedgerService.getTrialBalance → LedgerRepo.findByPeriod
        └── Depende de TODOS os lançamentos acima estarem corretos
```

---

## 🏁 RESUMO EXECUTIVO

| Categoria | Quantidade |
|-----------|-----------|
| 🔴 Risco Alto | 3 (N1, N2, N3) |
| 🟡 Risco Médio | 5 (N4, N5, N6, N7, N8) |
| 🟢 Melhoria | 6 (N9, N10, N11, N12, N13, N14) |
| ✅ Pontos Positivos | 10 |

### Prioridade de Ação Recomendada:
1. **N2** (Saldo bancário atômico) — correção mais cirúrgica, alto impacto, baixo risco de cascata
2. **N3** (Erros contábeis silenciosos) — criar mecanismo de fila de erros
3. **N1** (Transações atômicas) — a mais complexa, mas a mais impactante para integridade
4. **N6** (Duplicação no Plano de Contas) — rápido, melhora precisão do Balancete
5. **N4** (isReady nos hooks faltantes) — rápido, 2 linhas por arquivo
6. **N11** (Padronizar 'dinheiro') — elimina ambiguidade permanente

### Nota Final:
O módulo financeiro é **estruturalmente sólido** e demonstra boas práticas para um sistema ERP em React/Firestore. A principal fragilidade está na **falta de atomicidade** em operações compostas (N1/N2) e na **tolerância silenciosa a falhas contábeis** (N3). Essas três questões, se endereçadas, elevariam significativamente a confiabilidade financeira do sistema.
