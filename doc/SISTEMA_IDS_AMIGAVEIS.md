# 🆔 Sistema de IDs Amigáveis - Documentação

## **Visão Geral**

Sistema centralizado de geração de IDs únicos, sequenciais e amigáveis para todas as entidades do sistema.

**Inspiração:** Stripe, Shopify, Salesforce (padrão enterprise)

---

## **📋 Padrão de IDs por Entidade**

| Entidade          | Prefixo | Exemplo     | Contador        | Função                  |
|-------------------|---------|-------------|-----------------|-------------------------|
| **Cliente**       | (vazio) | `0001`      | `clients`       | `generateClientId()`    |
| **Venda**         | V       | `V00001`    | `sales`         | `generateSaleId()`      |
| **Contrato**      | C       | `C00001`    | `clientContracts` | `generateContractId()` |
| **Recebível**     | R       | `R00001`    | `receivables`   | `generateReceivableId()`|
| **Despesa**       | D       | `D00001`    | `expenses`      | `generateExpenseId()`   |
| **Pagável**       | P       | `P00001`    | `payables`      | `generatePayableId()`   |

---

## **🔧 Implementação**

### **Local:** `src/utils/sequence.js`

**Função Base:**
```javascript
generateFriendlyId(idTenant, idBranch, counterName, { prefix, padding })
```

**Funções Específicas:**
```javascript
// Cliente (GYM ID)
const gymId = await generateClientId(idTenant, idBranch)
// Retorna: "0001", "0002", etc

// Venda
const saleNumber = await generateSaleId(idTenant, idBranch)
// Retorna: "V00001", "V00002", etc

// Contrato
const contractId = await generateContractId(idTenant, idBranch)
// Retorna: "C00001", "C00002", etc
```

---

## **💾 Estrutura no Firestore**

```
tenants/{idTenant}/branches/{idBranch}/counters/
  ├─ clients          → { lastValue: 42 }
  ├─ sales            → { lastValue: 153 }
  ├─ clientContracts  → { lastValue: 28 }
  ├─ receivables      → { lastValue: 89 }
  └─ expenses         → { lastValue: 12 }
```

**Atomicidade:** Usa `runTransaction()` para evitar IDs duplicados mesmo com requisições simultâneas.

---

## **✅ Vantagens**

1. **IDs Únicos e Sequenciais** – Sem duplicação, mesmo com alta concorrência
2. **Visualmente Identificáveis** – Prefixo indica o tipo de entidade
3. **Amigáveis ao Usuário** – Fácil de ler, digitar e comunicar (ex: "Venda V00123")
4. **Compatível com Firestore** – IDs se tornam os próprios `docId`
5. **Centralizado** – Uma única fonte de verdade para todos os IDs

---

## **🔄 Migração de Código Antigo**

### **❌ ANTES (Incorreto)**
```javascript
// Timestamp como ID (NÃO sequencial)
const id = Date.now() // 1738434623456

// Função antiga baseada em tempo
generateSaleNumber(date, generateDailySequential(date))
// Retornava: V20250201-143025 (baseado em hora, não contador)
```

### **✅ AGORA (Correto)**
```javascript
// ID sequencial real
const saleId = await generateSaleId(idTenant, idBranch)
// Retorna: V00001, V00002, V00003...
```

---

## **📝 Uso nos Services**

### **ClientService:**
```javascript
const friendlyId = await generateClientId(idTenant, idBranch)
const client = await clientRepository.create(idTenant, idBranch, {
    ...clientData,
    friendlyId // ID do documento = friendlyId
})
```

### **SalesService:**
```javascript
const saleNumber = await generateSaleId(idTenant, idBranch)
const sale = await salesRepository.create(idTenant, idBranch, {
    ...saleData,
    saleNumber,
    friendlyId: saleNumber
})
```

### **ClientContractService:**
```javascript
const friendlyId = await generateContractId(idTenant, idBranch)
const contractRef = doc(db, `...clientContracts/${friendlyId}`)
transaction.set(contractRef, { ...contract, friendlyId })
```

---

## **🚀 Próximas Implementações**

- [ ] `generateReceivableId()` → ReceivableService
- [ ] `generateExpenseId()` → ExpenseService/PayableService
- [ ] Relatórios usando IDs amigáveis
- [ ] Busca por ID amigável na UI

---

## **⚠️ IMPORTANTE**

**NÃO** usar mais:
- ❌ `Date.now()` como ID
- ❌ `generateSaleNumber()` do `idGenerators.js` (deprecated)
- ❌ Firestore auto-ID para entidades com ID amigável

**SEMPRE** usar:
- ✅ Funções específicas de `sequence.js`
- ✅ `friendlyId` como docId no Firestore
- ✅ Exibir `friendlyId` na UI
