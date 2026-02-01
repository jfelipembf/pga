# Módulo Financeiro - Documentação Completa

## Índice
1. [Visão Geral](#visão-geral)
2. [Hierarquia e Dependências](#hierarquia-e-dependências)
3. [Sequência de Criação](#sequência-de-criação)
4. [Páginas do Módulo](#páginas-do-módulo)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Schemas e Estruturas de Dados](#schemas-e-estruturas-de-dados)

---

## Visão Geral

O módulo financeiro é composto por 6 páginas principais que gerenciam todo o ciclo financeiro da aplicação, desde a configuração de adquirentes até o controle de caixa e contas a receber.

### Páginas do Módulo
1. **Adquirentes** (`/financial/acquirers`)
2. **Contratos** (`/admin/contracts`)
3. **Vendas** (Integrado em `/clients/:id` - `ClientNewSale`)
4. **Caixa** (`/financial/cashier`)
5. **Fluxo de Caixa** (`/financial/cashflow`)
6. **Contas a Receber** (`/financial/receivables`)

---

## Hierarquia e Dependências

```
┌─────────────────┐
│  1. Adquirentes │ (Base - Sem dependências)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Contratos   │ (Base - Sem dependências)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   3. Vendas     │ (Depende de: Adquirentes + Contratos)
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┬────────────────┐
         ▼                  ▼                  ▼                ▼
┌────────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
│   4. Caixa     │  │ 5. Fluxo de  │  │ 6. Contas a │  │ Transações       │
│                │  │    Caixa     │  │    Receber  │  │ Financeiras      │
└────────────────┘  └──────────────┘  └─────────────┘  └──────────────────┘
```

### Relacionamentos

- **Adquirentes** → Fornece taxas e bandeiras para **Vendas**
- **Contratos** → Define planos que podem ser vendidos em **Vendas**
- **Vendas** → Gera transações que aparecem em **Caixa**, **Fluxo de Caixa** e **Contas a Receber**
- **Caixa** → Controla abertura/fechamento e registra despesas
- **Fluxo de Caixa** → Visualização consolidada de todas as movimentações
- **Contas a Receber** → Gerencia parcelas e recebíveis pendentes

---

## Sequência de Criação

### Ordem Recomendada

#### 1️⃣ **Adquirentes** (Primeiro)
**Por quê?** As adquirentes definem as taxas e bandeiras de cartão que serão usadas nas vendas.

**Ações:**
- Criar adquirentes (ex: Stone, Rede, PagSeguro)
- Configurar bandeiras aceitas (Visa, Mastercard, Elo, etc.)
- Definir taxas de débito e crédito
- Configurar taxas por parcelas

#### 2️⃣ **Contratos** (Segundo)
**Por quê?** Os contratos definem os planos/produtos que podem ser vendidos.

**Ações:**
- Criar contratos/planos (ex: Mensal, Trimestral, Anual)
- Definir valores e duração
- Configurar regras de matrícula
- Definir parcelamento máximo

#### 3️⃣ **Vendas** (Terceiro)
**Por quê?** As vendas dependem de adquirentes (para pagamentos) e contratos (para itens vendidos).

**Ações:**
- Selecionar cliente
- Escolher contrato/produto
- Definir forma de pagamento (usa adquirentes)
- Processar venda

#### 4️⃣ **Caixa, Fluxo de Caixa e Contas a Receber** (Automático)
**Por quê?** Estas páginas são alimentadas automaticamente pelas vendas.

**Ações:**
- **Caixa**: Abrir/fechar caixa, registrar despesas
- **Fluxo de Caixa**: Visualizar movimentações
- **Contas a Receber**: Acompanhar parcelas pendentes

---

## Páginas do Módulo

### 1. Adquirentes (`/financial/acquirers`)

**Localização:** `apps/app/src/pages/Financial/Acquirers/`

**Descrição:** Gerencia as operadoras de cartão (adquirentes) e suas taxas.

**Funcionalidades:**
- Cadastro de adquirentes
- Configuração de bandeiras aceitas
- Definição de taxas de débito
- Configuração de taxas de crédito por faixa de parcelas
- Ativação/desativação de adquirentes

**Quando usar:**
- **ANTES** de realizar vendas com cartão
- Para atualizar taxas das operadoras
- Para adicionar novas bandeiras

---

### 2. Contratos (`/admin/contracts`)

**Localização:** `apps/app/src/pages/Admin/Contracts/`

**Descrição:** Define os planos/contratos que podem ser vendidos aos clientes.

**Funcionalidades:**
- Criação de planos (Mensal, Trimestral, Anual, etc.)
- Definição de valores e duração
- Configuração de regras de matrícula
- Definição de parcelamento máximo
- Regras de suspensão
- Ativação/desativação de contratos

**Quando usar:**
- **ANTES** de realizar vendas
- Para criar novos planos
- Para ajustar valores de planos existentes

---

### 3. Vendas (ClientNewSale)

**Localização:** `apps/app/src/pages/Clients/Components/ClientNewSale.js`

**Descrição:** Página de processamento de vendas para clientes.

**Funcionalidades:**
- Seleção de contrato/produto
- Definição de quantidade e descontos
- Seleção de formas de pagamento
- Processamento de pagamentos com cartão (usa adquirentes)
- Geração de contas a receber
- Registro de transações no caixa

**Quando usar:**
- Após criar adquirentes e contratos
- Para registrar vendas de planos
- Para processar pagamentos

**Dependências:**
- ✅ Adquirentes cadastrados (para pagamentos com cartão)
- ✅ Contratos ativos (para selecionar o que vender)
- ✅ Caixa aberto (recomendado)

---

### 4. Caixa (`/financial/cashier`)

**Localização:** `apps/app/src/pages/Financial/Cashier/`

**Descrição:** Controle de abertura/fechamento de caixa e registro de despesas.

**Funcionalidades:**
- Abertura de caixa (com saldo inicial)
- Fechamento de caixa (com resumo)
- Registro de despesas
- Visualização de movimentações do período
- Impressão de relatório de caixa
- Filtro por período

**Quando usar:**
- No início do dia (abrir caixa)
- No fim do dia (fechar caixa)
- Para registrar despesas
- Para visualizar movimentações do dia

**Dados gerados automaticamente:**
- Entradas de vendas
- Saídas de despesas

---

### 5. Fluxo de Caixa (`/financial/cashflow`)

**Localização:** `apps/app/src/pages/Financial/CashFlow/`

**Descrição:** Visualização consolidada de todas as movimentações financeiras.

**Funcionalidades:**
- Visualização de entradas e saídas
- Gráfico de fluxo de caixa
- Filtro por período
- Cálculo de saldo acumulado
- Resumo de receitas, despesas e saldo

**Quando usar:**
- Para análise financeira
- Para visualizar tendências
- Para acompanhar saúde financeira

**Dados exibidos:**
- Vendas (entradas)
- Despesas (saídas)
- Saldo após cada transação

---

### 6. Contas a Receber (`/financial/receivables`)

**Localização:** `apps/app/src/pages/Financial/Receivables/`

**Descrição:** Gerenciamento de parcelas e recebíveis pendentes.

**Funcionalidades:**
- Visualização de parcelas pendentes
- Filtro por cliente, status, período
- Cancelamento de recebíveis
- Acompanhamento de vencimentos
- Cálculo de valores em aberto

**Quando usar:**
- Para acompanhar parcelas a receber
- Para identificar inadimplências
- Para cancelar recebíveis

**Dados gerados automaticamente:**
- Parcelas de vendas a prazo
- Parcelas de cartão de crédito

---

## Fluxo de Dados

### Fluxo de uma Venda Completa

```
1. CONFIGURAÇÃO (Pré-requisitos)
   ├─ Criar Adquirente (Stone)
   │  ├─ Bandeiras: Visa, Mastercard
   │  ├─ Taxa débito: 2.5%
   │  └─ Taxa crédito: 3.5% (1x), 4.5% (2-6x)
   │
   └─ Criar Contrato (Plano Mensal)
      ├─ Valor: R$ 150,00
      ├─ Duração: 1 mês
      └─ Parcelamento: até 3x

2. VENDA (ClientNewSale)
   ├─ Cliente: João Silva
   ├─ Item: Plano Mensal (R$ 150,00)
   ├─ Desconto: R$ 10,00
   ├─ Total: R$ 140,00
   └─ Pagamento:
      ├─ Cartão Crédito Visa (Stone)
      ├─ 2x de R$ 70,00
      └─ Taxa: 4.5%

3. PROCESSAMENTO AUTOMÁTICO
   ├─ Gera Transação Financeira
   │  ├─ Tipo: Venda
   │  ├─ Valor: R$ 140,00
   │  ├─ Método: Cartão de Crédito
   │  └─ Data: Hoje
   │
   ├─ Registra no Caixa
   │  └─ Entrada: R$ 140,00
   │
   ├─ Atualiza Fluxo de Caixa
   │  └─ Receita: +R$ 140,00
   │
   └─ Cria Contas a Receber
      ├─ Parcela 1/2: R$ 70,00 (venc: 30 dias)
      │  ├─ Taxa: R$ 3,15
      │  └─ Líquido: R$ 66,85
      └─ Parcela 2/2: R$ 70,00 (venc: 60 dias)
         ├─ Taxa: R$ 3,15
         └─ Líquido: R$ 66,85
```

---

## Schemas e Estruturas de Dados

### 1. Adquirente (Acquirer)

**Schema:** `packages/shared/src/financial/acquirer.schema.js`

```javascript
{
  id: string (opcional),
  name: string (obrigatório),
  active: boolean (default: true),
  brands: string[] (default: []),
  anticipate: boolean (default: false),
  
  // Débito
  debitRate: number (default: 0),
  debitSettlementDays: number (default: 1),
  
  // Crédito
  creditRates: [
    {
      installmentsStart: number (min: 1),
      installmentsEnd: number (min: 1),
      brands: string[] (opcional),
      mdrRate: number (opcional),
      rate: number (obrigatório),
      settlementDays: number (default: 30)
    }
  ],
  
  // Metadata
  deleted: boolean (default: false),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Campos Principais:**
- **name**: Nome da adquirente (ex: "Stone", "Rede")
- **active**: Se está ativa para uso
- **brands**: Bandeiras aceitas (ex: ["visa", "mastercard", "elo"])
- **debitRate**: Taxa de débito em % (ex: 2.5)
- **creditRates**: Array de faixas de parcelamento com suas taxas

**Exemplo:**
```javascript
{
  name: "Stone",
  active: true,
  brands: ["visa", "mastercard", "elo"],
  debitRate: 2.5,
  debitSettlementDays: 1,
  creditRates: [
    {
      installmentsStart: 1,
      installmentsEnd: 1,
      rate: 3.5,
      settlementDays: 30
    },
    {
      installmentsStart: 2,
      installmentsEnd: 6,
      rate: 4.5,
      settlementDays: 30
    }
  ]
}
```

---

### 2. Contrato (Contract)

**Schema:** `packages/shared/src/contracts/index.js`

```javascript
{
  title: string (obrigatório),
  status: "active" | "inactive" | "archived" (default: "active"),
  
  // Duração
  duration: number (default: 0),
  durationType: "Meses" | "Dias" | "Semanas" | "Anos" (default: "Meses"),
  
  // Retenção
  minPeriodStayMembership: number (default: 0),
  
  // Regras de Matrícula
  requiresEnrollment: boolean (default: false),
  maxWeeklyEnrollments: number (default: 0),
  allowedWeekDays: number[] (default: []),
  
  // Preços
  value: number (default: 0),
  maxAmountInstallments: number (default: 1),
  
  // Suspensão
  allowSuspension: boolean (default: false),
  suspensionMaxDays: number (default: 0)
}
```

**Campos Principais:**
- **title**: Nome do contrato (ex: "Plano Mensal Premium")
- **status**: Status do contrato (active, inactive, archived)
- **duration**: Duração do contrato (ex: 12)
- **durationType**: Tipo de duração (Meses, Dias, etc.)
- **value**: Valor do contrato em R$
- **maxAmountInstallments**: Máximo de parcelas permitidas

**Exemplo:**
```javascript
{
  title: "Plano Mensal Premium",
  status: "active",
  duration: 1,
  durationType: "Meses",
  minPeriodStayMembership: 3,
  value: 150.00,
  maxAmountInstallments: 3,
  requiresEnrollment: true,
  maxWeeklyEnrollments: 2,
  allowedWeekDays: [1, 3, 5]
}
```

---

### 3. Venda (Sale)

**Schema:** `packages/shared/src/sales/sale.schema.js`

```javascript
{
  id: string (opcional),
  
  // Cliente
  idClient: string (obrigatório),
  clientName: string (opcional),
  
  // Data
  date: timestamp,
  
  // Itens
  items: [
    {
      type: "product" | "service" | "contract",
      id: string,
      name: string,
      quantity: number (min: 1),
      unitPrice: number,
      total: number,
      discount: number (default: 0),
      duration: string (opcional)
    }
  ],
  
  // Totais
  subtotal: number,
  discount: number (default: 0),
  total: number,
  
  // Pagamentos
  payments: [
    {
      method: "cash" | "credit_card" | "debit_card" | "pix" | "boleto" | "other",
      amount: number,
      installments: number (default: 1),
      brand: string (opcional),
      authorization: string (opcional),
      idAcquirer: string (opcional),
      dueDate: string (opcional)
    }
  ],
  
  // Status
  status: "completed" | "cancelled" (default: "completed"),
  
  // Auditoria
  createdBy: string (opcional)
}
```

**Campos Principais:**
- **idClient**: ID do cliente
- **items**: Array de itens vendidos (contratos, produtos, serviços)
- **payments**: Array de formas de pagamento
- **total**: Valor total da venda
- **status**: Status da venda

**Exemplo:**
```javascript
{
  idClient: "client123",
  clientName: "João Silva",
  date: "2025-01-30T20:48:00Z",
  items: [
    {
      type: "contract",
      id: "contract456",
      name: "Plano Mensal Premium",
      quantity: 1,
      unitPrice: 150.00,
      total: 140.00,
      discount: 10.00
    }
  ],
  subtotal: 150.00,
  discount: 10.00,
  total: 140.00,
  payments: [
    {
      method: "credit_card",
      amount: 140.00,
      installments: 2,
      brand: "visa",
      authorization: "ABC123",
      idAcquirer: "acquirer789"
    }
  ],
  status: "completed"
}
```

---

### 4. Sessão de Caixa (Cashier Session)

**Schema:** `packages/shared/src/financial/cashier.schema.js`

```javascript
{
  id: string (opcional),
  
  // Status
  status: "open" | "closed" (default: "open"),
  
  // Timestamps
  openedAt: timestamp,
  closedAt: timestamp (opcional),
  
  // Operador
  openedBy: string,
  openedByName: string (opcional),
  closedBy: string (opcional),
  
  // Valores
  openingBalance: number (min: 0),
  closingBalance: number (opcional),
  calculatedBalance: number (opcional),
  difference: number (opcional),
  
  // Resumo
  summary: {
    totalRevenue: number (default: 0),
    totalExpenses: number (default: 0),
    totalCash: number (default: 0),
    totalCard: number (default: 0),
    totalPix: number (default: 0)
  },
  
  observations: string (opcional)
}
```

**Campos Principais:**
- **status**: Se o caixa está aberto ou fechado
- **openingBalance**: Saldo inicial (fundo de caixa)
- **closingBalance**: Saldo informado no fechamento
- **calculatedBalance**: Saldo calculado pelo sistema
- **difference**: Diferença entre informado e calculado (quebra de caixa)

**Exemplo:**
```javascript
{
  status: "open",
  openedAt: "2025-01-30T08:00:00Z",
  openedBy: "user123",
  openedByName: "Maria Santos",
  openingBalance: 100.00,
  summary: {
    totalRevenue: 1450.00,
    totalExpenses: 250.00,
    totalCash: 300.00,
    totalCard: 1150.00,
    totalPix: 0.00
  }
}
```

---

### 5. Conta a Receber (Receivable)

**Schema:** `packages/shared/src/financial/receivable.schema.js`

```javascript
{
  id: string (opcional),
  
  // Valores
  amount: number (obrigatório),
  pending: number (default: 0),
  paid: number (default: 0),
  feeAmount: number (default: 0),
  grossAmount: number (opcional),
  netAmount: number (opcional),
  settlementDate: string (opcional),
  
  // Datas
  dueDate: string (formato: YYYY-MM-DD),
  issueDate: string (opcional),
  payDate: string (opcional),
  
  // Status
  status: "open" | "paid" | "partial" | "overdue" | "cancelled" (default: "open"),
  
  // Meta
  description: string,
  installmentNumber: number (default: 1),
  totalInstallments: number (default: 1),
  method: string (opcional),
  category: string (opcional),
  
  // Relações
  idClient: string,
  clientName: string (opcional),
  idSale: string (opcional),
  idContract: string (opcional),
  idClientContract: string (opcional),
  createdBy: string (opcional),
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Campos Principais:**
- **amount**: Valor original da parcela
- **pending**: Valor pendente
- **paid**: Valor já pago
- **feeAmount**: Taxa da adquirente (MDR)
- **netAmount**: Valor líquido (amount - feeAmount)
- **dueDate**: Data de vencimento
- **status**: Status do recebível
- **installmentNumber**: Número da parcela atual
- **totalInstallments**: Total de parcelas

**Exemplo:**
```javascript
{
  amount: 70.00,
  pending: 70.00,
  paid: 0.00,
  feeAmount: 3.15,
  netAmount: 66.85,
  dueDate: "2025-02-28",
  issueDate: "2025-01-30",
  status: "open",
  description: "Parcela 1/2 - Plano Mensal Premium",
  installmentNumber: 1,
  totalInstallments: 2,
  method: "credit_card",
  idClient: "client123",
  clientName: "João Silva",
  idSale: "sale456"
}
```

---

## Boas Práticas

### 1. Ordem de Implementação
1. ✅ Configure **Adquirentes** primeiro
2. ✅ Crie **Contratos** em seguida
3. ✅ Abra o **Caixa** antes de vender
4. ✅ Realize **Vendas**
5. ✅ Acompanhe **Fluxo de Caixa** e **Contas a Receber**

### 2. Configuração de Adquirentes
- Configure todas as bandeiras aceitas
- Defina taxas realistas baseadas no contrato com a operadora
- Mantenha adquirentes inativos quando não estiverem em uso
- Configure faixas de parcelamento corretamente

### 3. Criação de Contratos
- Use nomes descritivos (ex: "Plano Mensal Premium")
- Defina valores e durações claramente
- Configure parcelamento máximo adequado
- Desative contratos antigos ao invés de deletá-los

### 4. Processo de Vendas
- Sempre verifique se o caixa está aberto
- Confirme os dados antes de finalizar
- Registre descontos quando aplicável
- Escolha a adquirente correta para cada venda

### 5. Gestão de Caixa
- Abra o caixa no início do expediente
- Registre todas as despesas
- Feche o caixa no fim do expediente
- Documente diferenças de caixa nas observações

### 6. Monitoramento
- Acompanhe o fluxo de caixa regularmente
- Monitore contas a receber vencidas
- Analise relatórios financeiros periodicamente
- Mantenha registros organizados

---

## Troubleshooting

### Problema: Não consigo realizar vendas
**Solução:**
1. Verifique se existem adquirentes cadastrados e ativos
2. Verifique se existem contratos ativos
3. Verifique se o caixa está aberto
4. Verifique se o cliente está cadastrado

### Problema: Taxas incorretas nas vendas
**Solução:**
1. Revise as configurações da adquirente
2. Verifique as faixas de parcelamento
3. Confirme a bandeira selecionada
4. Atualize as taxas se necessário

### Problema: Contas a receber não aparecem
**Solução:**
1. Verifique se a venda foi processada com sucesso
2. Confirme se houve parcelamento na venda
3. Verifique os filtros da página de contas a receber
4. Verifique se o status está correto

### Problema: Diferença no fechamento de caixa
**Solução:**
1. Revise todas as transações do dia
2. Verifique se todas as despesas foram registradas
3. Confirme se todas as vendas foram processadas
4. Documente a diferença nas observações

---

## Conclusão

O módulo financeiro segue uma hierarquia clara de dependências:

**Adquirentes** → **Contratos** → **Vendas** → **Caixa/Fluxo/Recebíveis**

Seguindo esta ordem e as boas práticas descritas, você terá um controle financeiro completo e organizado.

Para mais informações sobre cada componente, consulte os arquivos de schema em:
- `packages/shared/src/financial/`
- `packages/shared/src/contracts/`
- `packages/shared/src/sales/`
