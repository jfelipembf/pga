# Análise Completa do Fluxo Contábil - Sistema PGA

## 📊 REGIME CONTÁBIL UTILIZADO

**REGIME HÍBRIDO (Competência + Caixa)**

O sistema utiliza **DOIS regimes simultâneos**, cada um com sua finalidade:

### 1. Regime de Competência
- **Quando:** Registra a receita no momento da venda (quando o contrato é assinado)
- **Finalidade:** Mensuração de desempenho, faturamento, metas
- **Campo:** `data_movimento` ou `date`

### 2. Regime de Caixa
- **Quando:** Registra quando o dinheiro realmente entra (ou entrará) na conta
- **Finalidade:** Controle de fluxo financeiro real, disponibilidade de recursos
- **Campo:** `data_pagamento` ou `settlementDate`

---

## 💰 CENÁRIOS DE VENDA E PROCESSAMENTO CONTÁBIL

### CENÁRIO 1: À Vista em Dinheiro
**Cliente paga R$ 1.000 em dinheiro**

```
REGIME DE COMPETÊNCIA:
✓ Receita: R$ 1.000 (data da venda)

REGIME DE CAIXA:
✓ Entrada Imediata no Caixa Físico: R$ 1.000 (mesmo dia)

DADOS GERADOS:
1. Sale {
     total: 1000,
     date: "2025-01-31",
     payments: [{ method: "cash", value: 1000 }]
   }
   
2. CashierEntry {
     type: "IN",
     value: 1000,
     method: "cash",
     idSale: "SALE_123",
     timestamp: "2025-01-31T10:00:00Z"
   }

EXIBIÇÃO NAS PÁGINAS:
- Caixa: +R$ 1.000 (imediato)
- Fluxo de Caixa: +R$ 1.000 (dia atual)
- Receivables: Nenhum (pago integralmente)
```

---

### CENÁRIO 2: PIX
**Cliente paga R$ 1.000 via PIX**

```
REGIME DE COMPETÊNCIA:
✓ Receita: R$ 1.000 (data da venda)

REGIME DE CAIXA:
✓ Entrada na Conta Bancária: R$ 1.000 (D+0, instantâneo)

DADOS GERADOS:
1. Sale {
     total: 1000,
     date: "2025-01-31",
     payments: [{ 
       method: "pix", 
       value: 1000,
       destination: "BANK_ACCOUNT_ID",
       status: "CONFIRMED"
     }]
   }
   
2. BankTransaction {
     type: "IN",
     value: 1000,
     method: "pix",
     idSale: "SALE_123",
     idBankAccount: "BANK_ACCOUNT_ID",
     timestamp: "2025-01-31T10:01:00Z"
   }

EXIBIÇÃO NAS PÁGINAS:
- Caixa: Não aparece (foi direto pro banco)
- Fluxo de Caixa: +R$ 1.000 (dia atual, conta bancária)
- Receivables: Nenhum (pago integralmente)
- Reconciliação Bancária: Pendente matching com extrato
```

---

### CENÁRIO 3: Cartão de Débito
**Cliente paga R$ 1.000 no débito (Stone, taxa 2.5%)**

```
REGIME DE COMPETÊNCIA:
✓ Receita: R$ 1.000 (data da venda)

REGIME DE CAIXA:
✓ Entrada Líquida na Conta: R$ 975 (D+1, 1 dia útil depois)
✗ Taxa da Adquirente: -R$ 25 (custo operacional)

DADOS GERADOS:
1. Sale {
     total: 1000,
     date: "2025-01-31",
     payments: [{ 
       method: "debit_card", 
       value: 1000,
       brand: "visa",
       idAcquirer: "STONE_ID",
       auth: "123456"
     }]
   }
   
2. Receivable {
     grossAmount: 1000,
     feeAmount: 25,        // 2.5% de taxa
     netAmount: 975,       // Valor líquido
     dueDate: "2025-02-01", // D+1
     settlementDate: "2025-02-01",
     status: "open",
     type: "acquirer",     // Recebível da adquirente (risco ZERO)
     idSale: "SALE_123",
     idAcquirer: "STONE_ID"
   }
   
3. Expense {
     category: "Taxas de Cartão",
     value: 25,
     date: "2025-02-01",   // Quando a taxa será debitada
     idSale: "SALE_123"
   }

EXIBIÇÃO NAS PÁGINAS:
- Caixa: Não aparece (não é físico)
- Fluxo de Caixa: 
  * Previsão: +R$ 975 (amanhã, D+1)
  * Efetivado: +R$ 975 (quando cair no banco)
- Receivables: 1 parcela de R$ 975 (vence amanhã, status "verde" = garantido)
- Despesas: -R$ 25 (taxa operacional)
```

---

### CENÁRIO 4: Cartão de Crédito Parcelado
**Cliente paga R$ 1.200 em 12x no crédito (Stone, taxa 5.5%)**

```
REGIME DE COMPETÊNCIA:
✓ Receita: R$ 1.200 (data da venda, integralmente)

REGIME DE CAIXA:
✓ 12 parcelas futuras de R$ 100 (bruto)
✗ 12 parcelas com taxa de R$ 5.50 cada
✓ Recebimento líquido: R$ 94.50/mês durante 12 meses

DADOS GERADOS:
1. Sale {
     total: 1200,
     date: "2025-01-31",
     payments: [{ 
       method: "credit_card", 
       value: 1200,
       installments: 12,
       brand: "mastercard",
       idAcquirer: "STONE_ID",
       auth: "789123",
       status: "PENDING_SETTLEMENT"
     }]
   }
   
2. Receivables (12 registros):
   Parcela 1/12 {
     installmentNumber: 1,
     totalInstallments: 12,
     grossAmount: 100,
     feeAmount: 5.50,      // 5.5% da parcela
     netAmount: 94.50,
     dueDate: "2025-02-28", // D+30 (primeira parcela)
     settlementDate: "2025-02-28",
     status: "open",
     type: "acquirer",
     idSale: "SALE_123",
     idAcquirer: "STONE_ID"
   }
   Parcela 2/12 {
     ...
     dueDate: "2025-03-30", // D+60
     ...
   }
   ... (até 12/12)
   
3. Expenses (12 lançamentos de taxa):
   {
     category: "Taxas de Cartão",
     value: 5.50,
     date: "2025-02-28",  // Mesma data do recebimento
     description: "Taxa Stone - Parcela 1/12 - SALE_123"
   }
   ... (12 vezes)

EXIBIÇÃO NAS PÁGINAS:
- Caixa: Não aparece (não é físico)
- Fluxo de Caixa (Modo Competência): 
  * Receita: +R$ 1.200 (Janeiro)
- Fluxo de Caixa (Modo Caixa):
  * Fevereiro: +R$ 94.50 (líquido)
  * Março: +R$ 94.50
  * ... até Janeiro próximo ano
- Receivables: 12 parcelas listadas (status "verde" = garantido pela adquirente)
- Despesas: 12 lançamentos de R$ 5.50 distribuídos
```

---

### CENÁRIO 5: Valor Parcelado "Fiado" (Promissória/Cheque)
**Cliente paga R$ 500 à vista + R$ 500 em 5 promissórias de R$ 100**

```
REGIME DE COMPETÊNCIA:
✓ Receita Total: R$ 1.000 (data da venda)

REGIME DE CAIXA:
✓ Entrada Imediata: R$ 500 (à vista)
? Recebimentos Futuros: 5x R$ 100 (RISCO DO CLIENTE)

DADOS GERADOS:
1. Sale {
     total: 1000,
     date: "2025-01-31",
     payments: [
       { method: "cash", value: 500, status: "CONFIRMED" },
       { 
         method: "promissory_note", 
         value: 500,
         installments: 5,
         status: "PENDING_CLIENT_PAYMENT"
       }
     ]
   }
   
2. CashierEntry {
     type: "IN",
     value: 500,  // Só o que foi pago à vista
     method: "cash",
     idSale: "SALE_123"
   }
   
3. Receivables (5 registros):
   Parcela 1/5 {
     installmentNumber: 1,
     totalInstallments: 5,
     amount: 100,
     netAmount: 100,      // Sem taxa (não tem adquirente)
     feeAmount: 0,
     dueDate: "2025-02-28",
     status: "open",
     type: "client",      // ⚠️ RISCO: Depende do cliente pagar
     idClient: "CLIENT_456",
     idSale: "SALE_123"
   }
   ... (5 vezes)

EXIBIÇÃO NAS PÁGINAS:
- Caixa: +R$ 500 (só o que entrou em dinheiro)
- Fluxo de Caixa:
  * Hoje: +R$ 500 (confirmado)
  * Previsão: +R$ 100/mês (status "amarelo" = risco de inadimplência)
- Receivables: 5 parcelas de R$ 100 (status "amarelo" ou "laranja")
- Inadimplência: Se vencido, aparecer na lista de cobrança
```

---

### CENÁRIO 6: Misto (Multi-Pagamento)
**Cliente paga R$ 1.500 sendo: R$ 300 dinheiro + R$ 700 PIX + R$ 500 cartão 5x**

```
REGIME DE COMPETÊNCIA:
✓ Receita Total: R$ 1.500 (data da venda)

REGIME DE CAIXA:
✓ Entrada Imediata Caixa: R$ 300
✓ Entrada Imediata Banco: R$ 700
✓ Recebimentos Futuros: 5x R$ 100 (com taxas)

DADOS GERADOS:
1. Sale {
     total: 1500,
     payments: [
       { method: "cash", value: 300 },
       { method: "pix", value: 700, destination: "BANK_ID" },
       { 
         method: "credit_card", 
         value: 500, 
         installments: 5,
         idAcquirer: "STONE_ID"
       }
     ]
   }
   
2. CashierEntry { value: 300, method: "cash" }
   
3. BankTransaction { value: 700, method: "pix" }
   
4. Receivables (5 parcelas de cartão):
   {
     grossAmount: 100,
     feeAmount: 5.50,
     netAmount: 94.50,
     dueDate: "2025-02-28",
     type: "acquirer"
   }
   ... (5 vezes)

EXIBIÇÃO:
- Caixa: +R$ 300
- Fluxo de Caixa:
  * Hoje: +R$ 1.000 (R$ 300 + R$ 700)
  * Futuro: 5x R$ 94.50 (líquido)
- Receivables: 5 parcelas a receber
```

---

## 📈 COMO OS DADOS SÃO EXIBIDOS NAS PÁGINAS

### 1. **Página de Caixa** (`/financial/cashier`)
**Exibe:** Movimentações do caixa FÍSICO ou de uma sessão específica

```javascript
// Dados exibidos:
{
  openingBalance: 100,        // Troco inicial
  entries: [
    { type: "IN", value: 300, method: "cash", sale: "SALE_123" },
    { type: "IN", value: 150, method: "cash", sale: "SALE_124" },
    { type: "OUT", value: 50, reason: "Sangria para banco" }
  ],
  calculatedBalance: 500,     // 100 + 300 + 150 - 50
  closingBalance: 500,        // O que o operador informa
  difference: 0               // Quebra de caixa
}
```

**Regras:**
- ✅ Dinheiro em espécie entra aqui
- ❌ PIX não entra (vai direto pro banco)
- ❌ Cartão não entra (vai pra adquirente)
- ✅ Despesas em dinheiro saem daqui

---

### 2. **Página de Fluxo de Caixa** (`/financial/cashflow`)
**Exibe:** Visão consolidada de TODAS as movimentações (passadas e futuras)

**Toggle de Visualização:**
```
[ Modo Competência ] [ Modo Caixa ]
```

**Modo Competência:**
```
Janeiro 2025:
+ Receitas: R$ 10.000 (todas as vendas do mês)
- Despesas: R$ 3.000
= Resultado: R$ 7.000 (lucro contábil)
```

**Modo Caixa:**
```
Janeiro 2025:
+ Entradas Efetivas: R$ 6.000 (só o que realmente entrou)
- Saídas Efetivas: R$ 3.000
= Saldo: R$ 3.000 (dinheiro disponível)

Fevereiro 2025 (Previsão):
+ Entradas Previstas: R$ 2.500 (parcelas de cartão)
- Saídas Previstas: R$ 1.500
= Saldo Projetado: R$ 4.000
```

**Dados Utilizados:**
- Vendas no regime de competência
- Recebimentos (Receivables) quando pagos
- Despesas quando pagas
- Previsões baseadas em vencimentos futuros

---

### 3. **Página de Contas a Receber** (`/financial/receivables`)
**Exibe:** Lista de TUDO que ainda não entrou na conta

```javascript
// Exemplo de visualização:
[
  {
    client: "João Silva",
    dueDate: "2025-02-28",
    amount: 94.50,
    type: "acquirer",  // Verde (garantido)
    status: "open",
    description: "Parcela 1/12 - Cartão Mastercard"
  },
  {
    client: "Maria Santos",
    dueDate: "2025-02-15",
    amount: 100,
    type: "client",    // Amarelo (risco)
    status: "overdue", // Atrasado!
    description: "Parcela 2/5 - Promissória"
  }
]
```

**Filtros Disponíveis:**
- Por tipo (Cartão vs Cliente)
- Por status (Aberto, Atrasado, Pago, Cancelado)
- Por data de vencimento
- Por cliente

**Ações:**
- Marcar como pago (baixa o recebível)
- Cancelar (estorno)
- Enviar cobrança (WhatsApp/Email)

---

### 4. **Dashboard Financeiro** (Home)
**Exibe:** Visão executiva consolidada

```
┌─────────────────────────────────────────┐
│ FATURAMENTO (Competência)               │
│ Janeiro: R$ 10.000                      │
│                                         │
│ ENTRADA EFETIVA (Caixa)                 │
│ Janeiro: R$ 6.000                       │
│                                         │
│ A RECEBER                               │
│ Total: R$ 4.500 (Verde: R$ 3.000, 
│                  Amarelo: R$ 1.500)     │
│                                         │
│ GRÁFICO: Fluxo Projetado (próximos 6m) │
└─────────────────────────────────────────┘
```

---

## 🔄 PROCESSO TÉCNICO DE FINALIZAÇÃO

Quando clicam em **"Finalizar Venda"**, o backend executa:

### Cloud Function: `createSale`

```javascript
async function createSale(saleData) {
  const batch = firestore.batch();
  
  // 1. Criar a Venda
  const saleRef = firestore.collection('sales').doc();
  batch.set(saleRef, {
    ...saleData,
    date: new Date(),          // Competência
    status: 'completed'
  });
  
  // 2. Processar cada Pagamento
  for (const payment of saleData.payments) {
    if (payment.method === 'cash') {
      // Entrada imediata no caixa
      const cashierEntryRef = firestore.collection('cashierEntries').doc();
      batch.set(cashierEntryRef, {
        type: 'IN',
        value: payment.value,
        method: 'cash',
        idSale: saleRef.id,
        timestamp: new Date()
      });
    }
    
    else if (payment.method === 'pix') {
      // Entrada na conta bancária
      const bankTxRef = firestore.collection('bankTransactions').doc();
      batch.set(bankTxRef, {
        type: 'IN',
        value: payment.value,
        idBankAccount: payment.destination,
        idSale: saleRef.id,
        timestamp: new Date()
      });
    }
    
    else if (payment.method === 'credit_card' || payment.method === 'debit_card') {
      // Criar Recebíveis
      const acquirer = await getAcquirer(payment.idAcquirer);
      const rate = calculateRate(acquirer, payment);
      const installments = payment.installments || 1;
      const valuePerInstallment = payment.value / installments;
      
      for (let i = 1; i <= installments; i++) {
        const receivableRef = firestore.collection('receivables').doc();
        const dueDate = calculateDueDate(payment.method, i, acquirer);
        const feeAmount = valuePerInstallment * (rate / 100);
        const netAmount = valuePerInstallment - feeAmount;
        
        batch.set(receivableRef, {
          idSale: saleRef.id,
          idAcquirer: payment.idAcquirer,
          installmentNumber: i,
          totalInstallments: installments,
          grossAmount: valuePerInstallment,
          feeAmount: feeAmount,
          netAmount: netAmount,
          dueDate: dueDate,
          settlementDate: dueDate,
          status: 'open',
          type: 'acquirer'
        });
        
        // Lançar despesa de taxa
        const expenseRef = firestore.collection('expenses').doc();
        batch.set(expenseRef, {
          category: 'Taxas de Cartão',
          value: feeAmount,
          date: dueDate,
          idSale: saleRef.id
        });
      }
    }
    
    else if (payment.method === 'promissory_note') {
      // Criar recebíveis do CLIENTE (risco)
      const installments = payment.installments || 1;
      const valuePerInstallment = payment.value / installments;
      
      for (let i = 1; i <= installments; i++) {
        const receivableRef = firestore.collection('receivables').doc();
        const dueDate = calculateClientDueDate(i); // 30, 60, 90 dias...
        
        batch.set(receivableRef, {
          idSale: saleRef.id,
          idClient: saleData.idClient,
          installmentNumber: i,
          totalInstallments: installments,
          amount: valuePerInstallment,
          netAmount: valuePerInstallment,
          feeAmount: 0,
          dueDate: dueDate,
          status: 'open',
          type: 'client'  // ⚠️ Risco
        });
      }
    }
  }
  
  // 3. Criar Lançamento Contábil (Ledger)
  const ledgerRef = firestore.collection('ledger').doc();
  batch.set(ledgerRef, {
    type: 'CREDIT',
    account: 'Receita de Vendas',
    value: saleData.total,
    date: new Date(),
    idSale: saleRef.id
  });
  
  // 4. Audit Trail
  const auditRef = firestore.collection('audit').doc();
  batch.set(auditRef, {
    action: 'CREATE_SALE',
    userId: saleData.idSeller,
    timestamp: new Date(),
    metadata: { saleId: saleRef.id, total: saleData.total }
  });
  
  // COMMIT ATÔMICO
  await batch.commit();
  
  return { success: true, saleId: saleRef.id };
}
```

---

## ⚠️ PONTOS CRÍTICOS DE ATENÇÃO

### 1. **Diferença entre Recebível de Adquirente vs Cliente**
- **Adquirente** (Verde): Dinheiro GARANTIDO. A Stone vai pagar.
- **Cliente** (Amarelo): Dinheiro EM RISCO. Pode virar inadimplência.

### 2. **Taxas são Despesas, não Descontos**
- ❌ Errado: Venda de R$ 1.000 com taxa de R$ 50 = Receita de R$ 950
- ✅ Certo: Receita de R$ 1.000 + Despesa de R$ 50 = Lucro Líquido de R$ 950

### 3. **Antecipação de Recebíveis**
Se a academia antecipar as parcelas futuras:
- Trazer os recebíveis para "hoje" no fluxo de caixa
- Lançar a taxa de antecipação como Despesa Financeira adicional

### 4. **Cancelamentos e Estornos**
- NUNCA deletar venda
- Criar contra-lançamento
- Marcar recebíveis como "cancelados"

---

## 📊 RESUMO EXECUTIVO

| Cenário | Regime Competência | Regime Caixa | Receivables | Risco |
|---------|-------------------|--------------|-------------|-------|
| Dinheiro | Receita imediata | Entrada imediata | Nenhum | Zero |
| PIX | Receita imediata | Entrada D+0 | Nenhum | Zero |
| Débito | Receita imediata | Entrada D+1 (líquido) | 1 parcela | Zero |
| Crédito 12x | Receita total imediata | 12 entradas mensais (líquido) | 12 parcelas | Zero |
| Promissória | Receita total imediata | Entradas futuras incertas | N parcelas | ALTO |

**Status Visual:**
- 🟢 Verde = Garantido pela adquirente
- 🟡 Amarelo = Depende do cliente pagar
- 🔴 Vermelho = Atrasado

---

**Este é o modelo contábil profissional e completo que o sistema PGA implementará.**
