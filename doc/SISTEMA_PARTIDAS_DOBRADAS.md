# Sistema de Partidas Dobradas - Documentação Contábil

## 📊 VISÃO GERAL

O sistema agora implementa **contabilidade por partidas dobradas** completa, garantindo que todos os lançamentos sejam balanceados e rastreáveis.

---

## 🎯 PRINCÍPIO FUNDAMENTAL

**Todo lançamento contábil afeta NO MÍNIMO 2 contas**  
**DÉBITO total = CRÉDITO total (SEMPRE!)**

---

## 📋 LANÇAMENTOS IMPLEMENTADOS

### **1. CRIAÇÃO DE DESPESA (Regime de Competência)**

**Quando:** Ao cadastrar uma nova conta a pagar  
**Objetivo:** Reconhecer a despesa incorrida, mesmo que não paga

**Lançamento Contábil:**
```
D - Despesa Administrativa     R$ 416,00
C - Contas a Pagar (Passivo)   R$ 416,00
```

**Efeitos:**
- ✅ DRE: Despesa reconhecida no mês da competência
- ✅ Balanço: Passivo circulante aumenta
- ❌ Caixa: NÃO afeta saldo bancário

**Código:**
```javascript
await LedgerService.createPayableEntry(idTenant, idBranch, payable)
```

---

### **2. PAGAMENTO DE DESPESA (Regime de Caixa)**

**Quando:** Ao dar baixa (pagar) efetivamente a conta  
**Objetivo:** Registrar a saída de dinheiro e baixar o passivo

**Lançamento Contábil:**
```
D - Contas a Pagar     R$ 416,00  (baixa o passivo)
C - Banco Santander    R$ 416,00  (saída de dinheiro)
```

**Efeitos:**
- ✅ Balanço: Passivo circulante diminui
- ✅ Balanço: Ativo (banco) diminui
- ✅ Caixa: Saldo bancário é DEBITADO
- ❌ DRE: NÃO afeta (despesa JÁ estava reconhecida)

**Código:**
```javascript
await LedgerService.payPayableEntry(idTenant, idBranch, payable, paymentData)
```

---

### **3. RECONHECIMENTO DE RECEITA (Venda)**

**Quando:** Ao criar uma venda  
**Objetivo:** Reconhecer a receita no regime de competência

**Lançamento Contábil:**
```
D - Contas a Receber  R$ 1.000,00
C - Receita de Vendas R$ 1.000,00
```

**Efeitos:**
- ✅ DRE: Receita reconhecida
- ✅ Balanço: Ativo (direito a receber) aumenta

---

### **4. RECEBIMENTO DE VENDA**

**Quando:** Ao receber/liquidar um valor  
**Objetivo:** Registrar entrada de dinheiro e baixar contas a receber

**Lançamento Contábil (SEM taxa):**
```
D - Contas a Receber  R$ 1.000,00  (baixa)
C - Banco             R$ 1.000,00  (entrada)
```

**Lançamento Contábil (COM taxa de cartão):**
```
D - Contas a Receber         R$ 1.000,00  (baixa)
D - Despesa com Taxas        R$    50,00  (taxa)
C - Banco                    R$ 1.050,00  (líquido + taxa)
```

**Efeitos:**
- ✅ Balanço: Ativo contas a receber diminui
- ✅ Balanço: Ativo banco aumenta (líquido)
- ✅ DRE: Despesa com taxas (se houver)

---

## 📈 PLANO DE CONTAS PADRÃO

### **ATIVOS**
```javascript
ATIVO_CIRCULANTE_BANCOS          // Contas bancárias
ATIVO_CIRCULANTE_CAIXA           // Caixa físico
ATIVO_CIRCULANTE_CONTAS_A_RECEBER // Direitos a receber
```

### **PASSIVOS**
```javascript
PASSIVO_CIRCULANTE_CONTAS_A_PAGAR  // Obrigações a pagar
PASSIVO_CIRCULANTE_SALARIOS        // Salários a pagar
PASSIVO_CIRCULANTE_IMPOSTOS        // Impostos a pagar
```

### **RECEITAS**
```javascript
RECEITA_VENDAS     // Receita de vendas de produtos
RECEITA_SERVICOS   // Receita de serviços
```

### **DESPESAS**
```javascript
DESPESA_ADMINISTRATIVA    // Despesas administrativas
DESPESA_OPERACIONAL       // Despesas operacionais
DESPESA_TAXAS_CARTAO      // Taxas de cartão
DESPESA_SALARIOS          // Folha de pagamento
```

---

## 🔍 BALANCETE (Trial Balance)

O sistema pode gerar o balancete de qualquer período:

```javascript
const balancete = await LedgerService.getTrialBalance(
    idTenant, 
    idBranch, 
    '2026-01-01', 
    '2026-01-31'
)

// Retorna:
[
    {
        account: 'DESPESA_ADMINISTRATIVA',
        accountName: 'Despesas Administrativas',
        debit: 5000.00,
        credit: 0.00,
        balance: 5000.00
    },
    {
        account: 'PASSIVO_CIRCULANTE_CONTAS_A_PAGAR',
        accountName: 'Contas a Pagar',
        debit: 1584.00,    // Pagamentos realizados
        credit: 5000.00,   // Despesas reconhecidas
        balance: -3416.00  // Ainda deve R$ 3.416
    },
    // ...
]
```

---

## ✅ VALIDAÇÕES AUTOMÁTICAS

### **1. Balanceamento**

```javascript
// LedgerRepository SEMPRE valida:
const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)

if (totalDebit !== totalCredit) {
    throw new Error('Lançamento desbalanceado!')
}
```

### **2. Rastreabilidade**

Cada lançamento armazena:
```javascript
{
    sourceType: 'payable',      // De onde veio
    sourceId: 'abc123',         // ID do documento
    documentNumber: 'D20260201-001', // Número amigável
    entries: [...]              // Contas afetadas
}
```

---

## 📊 IMPACTO NOS RELATÓRIOS

### **DRE (Demonstração do Resultado)**
```
RECEITAS
  Vendas                        R$ 10.000,00
(-) DESPESAS
  Despesas Administrativas      R$  5.000,00
  Taxas de Cartão              R$    200,00
(=) LUCRO LÍQUIDO              R$  4.800,00
```
⚠️ **Antes:** Só reconhecia quando PAGAVA  
✅ **Agora:** Reconhece quando INCORRE (competência)

### **BALANÇO PATRIMONIAL**
```
ATIVO
  Banco Santander              R$ 15.000,00
  Contas a Receber             R$  3.000,00
  
PASSIVO
  Contas a Pagar               R$  3.416,00  ← AGORA RASTREADO!
```
⚠️ **Antes:** Não controlava passivo  
✅ **Agora:** Controla corretamente

---

## 🎯 EXEMPLO COMPLETO DE FLUXO

### **Dia 01/02: Recebe conta de luz**
```javascript
// Usuário cria despesa
createPayable({ 
    supplier: 'Iguá',
    description: 'Agua',
    amount: 416,
    dueDate: '2026-02-04'
})

// Sistema faz automaticamente:
Ledger:
  D - Despesa Administrativa  R$ 416
  C - Contas a Pagar          R$ 416

Resultado:
  DRE: Despesa R$ 416 reconhecida ✅
  Balanço: Passivo R$ 416 registrado ✅
  Banco: Saldo NÃO muda ✅
```

### **Dia 04/02: Paga a conta**
```javascript
// Usuário dá baixa
payBill(payableId, {
    paymentDate: '2026-02-04',
    amount: 416,
    paymentMethod: 'pix',
    idBankAccount: 'santander'
})

// Sistema faz automaticamente:
Ledger:
  D - Contas a Pagar  R$ 416  (baixa passivo)
  C - Banco Santander R$ 416  (saída de $)

Resultado:
  Banco: R$ 5.000 → R$ 4.584 ✅
  Passivo: R$ 416 → R$ 0 ✅
  DRE: NÃO muda (já estava reconhecido) ✅
```

---

## 🚀 BENEFÍCIOS CONQUISTADOS

| Aspecto | Antes | Agora |
|---------|-------|-------|
| **DRE** | Só despesas pagas | ✅ Todas as despesas incorridas |
| **Balanço** | Sem passivos | ✅ Passivos rastreados |
| **Auditoria** | Difícil | ✅ Rastreabilidade total |
| **Regime** | Caixa | ✅ Competência + Caixa (híbrido) |
| **Compliance** | Básico | ✅ Profissional |

---

**Agora o sistema está em conformidade com as normas contábeis brasileiras!** 🎉
