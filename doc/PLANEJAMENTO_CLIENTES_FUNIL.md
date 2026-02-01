# Planejamento Modular: Sistema de Gestão de Clientes e Funil de Vendas

## 1. Visão Geral da Arquitetura

### Princípios
- ✅ **Fonte Única de Verdade**: Status vive apenas no documento do cliente
- ✅ **Modular**: Cada funcionalidade (Trial, Contract, Status) é independente
- ✅ **Extensível**: Adicionar etapas não quebra o que já existe
- ✅ **Auditável**: Todo evento é registrado com quem/quando/por quê
- ✅ **Econômico**: Agregações pré-calculadas para dashboards

---

## 2. Estrutura de Dados

### 2.1. Cliente (Coleção: `clients`)

```javascript
{
  // === IDENTIFICAÇÃO ===
  id: "CLIENT_001",
  friendlyId: "0001",
  idTenant: "TENANT_01",
  idBranch: "BRANCH_01",
  
  // === DADOS PESSOAIS ===
  firstName: "João",
  lastName: "Silva",
  fullName: "João Silva", // Computed
  birthDate: "1990-05-15",
  phone: "11999999999",
  email: "joao@example.com",
  cpf: "12345678900",
  gender: "M",
  
  // === ENDEREÇO ===
  address: {
    zipCode: "01234-567",
    street: "Rua Exemplo",
    number: "123",
    complement: "Apto 45",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP"
  },
  
  // === CONTATO DE EMERGÊNCIA ===
  emergency: {
    name: "Maria Silva",
    phone: "11988888888",
    relation: "Esposa"
  },
  
  // === SAÚDE ===
  health: {
    observations: "Dor no joelho esquerdo",
    restrictions: ["Evitar impacto"],
    lastUpdate: "2024-02-01"
  },
  
  // === CICLO DE VIDA (FUNIL) ===
  lifecycle: {
    status: "lead",              // lead | scheduled | attended | active | suspended | inactive | lost
    source: "instagram",         // Como chegou (instagram, google, indicacao)
    referredBy: "CLIENT_200",    // Se foi indicado, id de quem indicou
    
    // Etapa: Aula Experimental (Trial)
    trial: {
      scheduled: false,
      scheduledDate: null,
      scheduledBy: null,
      attended: false,
      attendedDate: null,
      confirmedBy: null,
      feedback: null              // Notas do consultor pós-trial
    },
    
    // Conversão
    convertedAt: null,            // Data da primeira venda
    convertedBy: null,            // Quem fez a primeira venda
    firstContractId: null,        // ID do primeiro contrato
    
    // Perda
    lostAt: null,
    lostReason: null,             // motivo_preco | nao_compareceu | desistiu
    lostNotes: null
  },
  
  // === FOTO ===
  photoURL: "https://...",
  
  // === AUDITORIA ===
  createdBy: "USER_123",
  createdByName: "Maria Vendedora",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-02-01T15:00:00Z",
  
  // === FLAGS ===
  isActive: true,                 // Computed: tem contrato ativo?
  hasTrialScheduled: false,       // Computed helper
  hasAttendedTrial: false         // Computed helper
}
```

### 2.2. Contrato (Coleção: `clientContracts`)

```javascript
{
  // === IDENTIFICAÇÃO ===
  id: "CONTRACT_001",
  idTenant: "TENANT_01",
  idBranch: "BRANCH_01",
  idClient: "CLIENT_001",
  idSale: "SALE_045",             // Venda que originou
  
  // === PLANO ===
  idPlan: "PLAN_MUSCULACAO_MENSAL",
  planName: "Musculação Mensal",
  planType: "monthly",            // monthly | quarterly | annual | single
  
  // === VIGÊNCIA ===
  startDate: "2024-02-01",
  endDate: "2025-02-01",
  
  // === STATUS DO CONTRATO ===
  status: "active",               // pending | active | suspended | canceled | expired
  
  // === SUSPENSÃO (se aplicável) ===
  suspension: {
    isSuspended: false,
    suspendedAt: null,
    suspendedBy: null,
    suspensionDays: 0,
    suspensionEndDate: null,
    reason: null
  },
  
  // === CANCELAMENTO (se aplicável) ===
  cancellation: {
    canceledAt: null,
    canceledBy: null,
    reason: null,                 // motivo_financeiro | mudanca_cidade | insatisfacao
    notes: null
  },
  
  // === FINANCEIRO ===
  value: 150.00,
  installments: 12,
  paidInstallments: 0,
  
  // === AUDITORIA ===
  createdBy: "USER_123",
  createdAt: "2024-02-01T10:00:00Z",
  updatedAt: "2024-02-01T10:00:00Z"
}
```

### 2.3. Dashboard Summary (Doc: `dashboardSummary/{tenant}/{branch}/current`)

```javascript
{
  // === FUNIL DE CONVERSÃO ===
  leads: 150,                     // Total de leads ativos
  trialsScheduled: 45,            // Agendaram experimental
  trialsAttended: 30,             // Compareceram
  converted: 25,                  // Viraram clientes ativos
  
  // === BASE ATUAL ===
  activeStudents: 1250,           // Tem contrato ativo
  suspendedStudents: 42,          // Suspensos temporariamente
  canceledStudents: 8,            // Cancelaram este mês
  
  // === NOVOS (MÊS ATUAL) ===
  newLeads: 35,                   // Novos leads este mês
  newStudents: 25,                // Novas conversões este mês
  
  // === TAXA DE CONVERSÃO ===
  conversionRate: 0.167,          // 25/150 = 16.7%
  trialShowUpRate: 0.667,         // 30/45 = 66.7%
  trialConversionRate: 0.833,     // 25/30 = 83.3%
  
  // === META ===
  lastUpdated: "2024-02-01T15:30:00Z",
  month: "2024-02"
}
```

---

## 3. Máquina de Estados (Lifecycle Status)

### 3.1. Estados Possíveis
```javascript
const LIFECYCLE_STATUS = {
  LEAD: "lead",                   // Cadastrado, nunca interagiu
  SCHEDULED: "scheduled",         // Agendou aula experimental
  ATTENDED: "attended",           // Compareceuna experimental
  ACTIVE: "active",               // Tem contrato ativo
  SUSPENDED: "suspended",         // Contrato suspenso temporariamente
  INACTIVE: "inactive",           // Sem contrato (ex-aluno)
  LOST: "lost"                    // Perdido, não quer mais contato
};
```

### 3.2. Transições Válidas
```javascript
const VALID_TRANSITIONS = {
  "lead": ["scheduled", "active", "lost"],
  "scheduled": ["attended", "active", "lost"],
  "attended": ["active", "lost"],
  "active": ["suspended", "inactive"],
  "suspended": ["active", "inactive"],
  "inactive": ["active", "lost"],
  "lost": []  // Estado final
};
```

### 3.3. Gatilhos Automáticos
```javascript
// ClientService.updateLifecycleStatus()
TRIGGERS = {
  // Quando agenda experimental
  scheduleTrialClass: "lead" → "scheduled",
  
  // Quando confirma presença
  confirmTrialAttendance: "scheduled" → "attended",
  
  // Quando compra primeiro contrato
  createFirstContract: ["lead", "scheduled", "attended"] → "active",
  
  // Quando suspende contrato
  suspendContract: "active" → "suspended",
  
  // Quando reativa suspensão
  reactivateSuspension: "suspended" → "active",
  
  // Quando cancela contrato
  cancelContract: "active" → "inactive",
  
  // Quando marca como perdido
  markAsLost: "*" → "lost"
};
```

---

## 4. Módulos (Services)

### 4.1. ClientService (Gestão de Dados Pessoais)
```javascript
// services/Clients/ClientService.js

- create()                      // Cria lead
- update()                      // Atualiza dados pessoais
- getById()
- list()
- delete()
- updateLifecycleStatus()       // ⭐ ÚNICA função que muda status
```

### 4.2. ClientTrialService (Aula Experimental)
```javascript
// services/Clients/ClientTrialService.js

- scheduleTrial()               // Agenda experimental
- confirmAttendance()           // Marca presença
- cancelTrial()                 // Cancela agendamento
- addFeedback()                 // Consultor registra feedback
```

### 4.3. ClientContractService (Contratos)
```javascript
// services/Clients/ClientContractService.js

- create()                      // Cria contrato (na venda)
- suspend()                     // Suspende temporariamente
- reactivate()                  // Reativa suspensão
- cancel()                      // Cancela definitivamente
- listByClient()                // Lista contratos de um cliente
```

### 4.4. DashboardSummaryService (Agregações)
```javascript
// services/Dashboard/DashboardSummaryService.js

- increment()                   // Incrementa contador
- decrement()                   // Decrementa contador
- getCurrent()                  // Lê summary atual
- recalculate()                 // Reconciliação (cron semanal)
```

---

## 5. Fluxos Principais

### 5.1. Criar Lead
```
UI: ClientAddModal
  ↓
ClientService.create()
  ├─ Valida com ClientSchema
  ├─ Salva: clients/{id}
  │  └─ lifecycle.status = "lead"
  ├─ Auditoria
  └─ DashboardSummary.increment({ leads: 1, newLeads: 1 })
```

### 5.2. Agendar Experimental
```
UI: ClientProfile (botão "Agendar Experimental")
  ↓
ClientTrialService.scheduleTrial(idClient, date)
  ├─ Valida se status permite
  ├─ Atualiza: lifecycle.trial.scheduled = true
  ├─ ClientService.updateLifecycleStatus("scheduled")
  ├─ Auditoria
  └─ DashboardSummary.increment({ trialsScheduled: 1 })
```

### 5.3. Confirmar Presença
```
UI: Trial Dashboard (lista de experimentais do dia)
  ↓
ClientTrialService.confirmAttendance(idClient)
  ├─ Atualiza: lifecycle.trial.attended = true
  ├─ ClientService.updateLifecycleStatus("attended")
  ├─ Auditoria
  └─ DashboardSummary.increment({ trialsAttended: 1 })
```

### 5.4. Vender Contrato (Conversão)
```
UI: SalesPoint
  ↓
SalesService.create()
  ├─ Cria Sale
  ├─ ClientContractService.create()
  │  ├─ Salva: clientContracts/{id}
  │  ├─ Se é primeiro contrato:
  │  │  ├─ ClientService.updateLifecycleStatus("active")
  │  │  └─ Atualiza: lifecycle.convertedAt, firstContractId
  │  └─ Auditoria
  └─ DashboardSummary.increment({ 
       activeStudents: 1,
       newStudents: 1,
       converted: 1
     })
```

### 5.5. Suspender Contrato
```
UI: ClientProfile > Contrato (botão "Suspender")
  ↓
ClientContractService.suspend(idContract, days, reason)
  ├─ Transação Firestore {
  │  ├─ Atualiza Contract: status = "suspended"
  │  ├─ ClientService.updateLifecycleStatus("suspended")
  │  └─ DashboardSummary: { activeStudents: -1, suspendedStudents: +1 }
  │ }
  └─ Auditoria
```

---

## 6. UI/Visualização

### 6.1. Lista de Clientes
- Badge colorido conforme `lifecycle.status`
- Filtros: "Todos", "Leads", "Agendados", "Ativos", "Suspensos"
- Colunas: Nome | Telefone | Status | Última Atividade

### 6.2. Perfil do Cliente
- Header: Nome + Badge de Status
- Seção "Aula Experimental" (se aplicável)
  - Data agendada
  - Botão "Confirmar Presença"
  - Feedback do consultor
- Seção "Contratos"
  - Lista de todos os contratos
  - Status de cada contrato
  - Ações: Suspender, Cancelar
- Timeline de Histórico
  - Lead criado em...
  - Experimental agendado em...
  - Compareceu em...
  - Converteu em...

### 6.3. Dashboard Gerencial
- Funil Visual (Leads → Agendados → Atendidos → Convertidos)
- Taxas de Conversão
- Base Atual (Ativos, Suspensos, Cancelados)

---

## 7. Blindagens Contra Erros

### 7.1. Validação de Transições
```javascript
// Antes de mudar status
if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
  throw new Error("Transição inválida");
}
```

### 7.2. Transações Atômicas
```javascript
// Sempre usar ao atualizar múltiplos docs
await firestore.runTransaction(async (t) => {
  t.update(clientRef, {...});
  t.update(summaryRef, {...});
});
```

### 7.3. Reconciliação Semanal
```javascript
// Cloud Function (cron)
const realCount = await countActiveContracts();
const cachedCount = summary.activeStudents;

if (realCount !== cachedCount) {
  await correctSummary(realCount);
  await alertAdmin();
}
```

---

## 8. Ordem de Implementação (MVP)

### Fase 1: Base (AGORA)
1. ✅ Atualizar ClientSchema com novos campos
2. ✅ Criar ClientContractSchema
3. ✅ Criar DashboardSummaryService
4. ✅ Atualizar ClientService.updateLifecycleStatus()
5. ✅ Integrar no SalesService

### Fase 2: Experimental (DEPOIS, quando precisar)
1. Criar ClientTrialService
2. Criar UI de agendamento
3. Criar Dashboard de experimentais do dia

### Fase 3: Otimizações (FUTURO)
1. Cloud Function de reconciliação
2. Automação de expiração de suspensão
3. Alertas de leads frios

---

## 9. Custo Estimado (10k alunos)

| Operação | Frequência | Leituras | Escritas | Custo/mês |
|----------|-----------|----------|----------|-----------|
| Criar Lead | 100/dia | 1 | 2 | $0.04 |
| Vender Contrato | 30/dia | 3 | 4 | $0.06 |
| Dashboard Load | 1000/dia | 1 | 0 | $0.02 |
| Reconciliação | 4/mês | 10000 | 10 | $0.14 |
| **TOTAL** | | | | **$0.26/mês** |

💰 **Praticamente de graça!**

---

## 10. Próximos Passos

Vou implementar **FASE 1** agora:
1. Atualizar ClientSchema com campos de lifecycle
2. Criar ClientContractSchema completo
3. Criar ClientContractService com transações
4. Criar DashboardSummaryService
5. Integrar tudo no SalesService

Os campos de `trial` já estarão no schema, mas os services virão depois (Fase 2), quando você precisar. Isso evita 100% de retrabalho.

**Posso começar?**
