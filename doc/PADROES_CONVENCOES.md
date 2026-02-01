# 📐 Padrões e Convenções do Projeto

## 📋 Índice

1. [Campos Padrão](#campos-padrão)
2. [Status e Estados](#status-e-estados)
3. [Datas e Timestamps](#datas-e-timestamps)
4. [Flags Booleanos](#flags-booleanos)
5. [Identificadores](#identificadores)
6. [Nomenclatura](#nomenclatura)

---

## 📦 Campos Padrão

### **Todo Documento Firestore DEVE ter:**

```javascript
// Schema base para TODOS os documentos
const baseDocumentSchema = {
  // Identificação
  id: string,                    // ID único do documento
  
  // Contexto (multitenant)
  idTenant: string,              // ID do tenant
  idBranch: string,              // ID da branch/unidade
  
  // Timestamps
  createdAt: Timestamp,          // Data de criação
  updatedAt: Timestamp,          // Data da última atualização
  
  // Auditoria
  createdBy: string,             // ID do usuário que criou
  updatedBy: string,             // ID do usuário que atualizou
  
  // Soft Delete
  deleted: boolean,              // Flag de deleção (padrão: false)
  deletedAt: Timestamp | null,  // Data da deleção
  deletedBy: string | null       // Quem deletou
}
```

### **Exemplo Completo - Cliente**

```javascript
// data/schemas/clientSchema.js

import { z } from 'zod'

export const clientSchema = z.object({
  // ========== CAMPOS PADRÃO (OBRIGATÓRIOS) ==========
  id: z.string().min(1),
  idTenant: z.string().min(1),
  idBranch: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().nullable().default(null),
  
  // ========== CAMPOS ESPECÍFICOS ==========
  name: z.string().min(3),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  
  // Status
  status: z.enum(['lead', 'active', 'inactive', 'expired']),
  statusUpdatedAt: z.date().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
})
```

---

## 🎯 Status e Estados

### **Padrão de Status**

Todos os status devem seguir o padrão:

```javascript
// ✅ CORRETO: lowercase com underscore
status: 'active'
status: 'pending_approval'
status: 'cancelled'

// ❌ ERRADO: camelCase ou PascalCase
status: 'Active'
status: 'pendingApproval'
```

### **Status por Entidade**

#### **1. Cliente (Client)**
```javascript
const CLIENT_STATUS = {
  LEAD: 'lead',                    // Lead (ainda não é cliente)
  ACTIVE: 'active',                // Cliente ativo
  INACTIVE: 'inactive',            // Cliente inativo
  EXPIRED: 'expired',              // Contrato expirado
  SUSPENDED: 'suspended'           // Suspenso (inadimplência)
}

// Schema
status: z.enum(['lead', 'active', 'inactive', 'expired', 'suspended'])
```

#### **2. Contrato (Contract)**
```javascript
const CONTRACT_STATUS = {
  DRAFT: 'draft',                  // Rascunho
  PENDING: 'pending',              // Aguardando aprovação
  ACTIVE: 'active',                // Ativo
  SUSPENDED: 'suspended',          // Suspenso
  CANCELLED: 'cancelled',          // Cancelado
  EXPIRED: 'expired'               // Expirado
}

// Schema
status: z.enum(['draft', 'pending', 'active', 'suspended', 'cancelled', 'expired'])
```

#### **3. Pagamento (Payment)**
```javascript
const PAYMENT_STATUS = {
  PENDING: 'pending',              // Aguardando pagamento
  PROCESSING: 'processing',        // Processando
  PAID: 'paid',                    // Pago
  FAILED: 'failed',                // Falhou
  CANCELLED: 'cancelled',          // Cancelado
  REFUNDED: 'refunded'             // Reembolsado
}

// Schema
status: z.enum(['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'])
```

#### **4. Recebível (Receivable)**
```javascript
const RECEIVABLE_STATUS = {
  OPEN: 'open',                    // Em aberto
  OVERDUE: 'overdue',              // Vencido
  PAID: 'paid',                    // Pago
  PARTIALLY_PAID: 'partially_paid',// Parcialmente pago
  CANCELLED: 'cancelled'           // Cancelado
}

// Schema
status: z.enum(['open', 'overdue', 'paid', 'partially_paid', 'cancelled'])
```

#### **5. Matrícula (Enrollment)**
```javascript
const ENROLLMENT_STATUS = {
  PENDING: 'pending',              // Aguardando confirmação
  ACTIVE: 'active',                // Ativa
  SUSPENDED: 'suspended',          // Suspensa
  CANCELLED: 'cancelled',          // Cancelada
  COMPLETED: 'completed'           // Concluída
}

// Schema
status: z.enum(['pending', 'active', 'suspended', 'cancelled', 'completed'])
```

### **Helper para Status**

```javascript
// utils/status.js

/**
 * Retorna cor do badge baseado no status
 */
export function getStatusColor(status) {
  const colors = {
    // Positivos
    active: 'green',
    paid: 'green',
    completed: 'green',
    
    // Neutros
    pending: 'yellow',
    processing: 'yellow',
    draft: 'gray',
    
    // Negativos
    cancelled: 'red',
    failed: 'red',
    overdue: 'red',
    expired: 'red',
    
    // Especiais
    suspended: 'orange',
    lead: 'blue'
  }
  
  return colors[status] || 'gray'
}

/**
 * Retorna label traduzido do status
 */
export function getStatusLabel(status) {
  const labels = {
    // Cliente
    lead: 'Lead',
    active: 'Ativo',
    inactive: 'Inativo',
    expired: 'Expirado',
    suspended: 'Suspenso',
    
    // Pagamento
    pending: 'Pendente',
    processing: 'Processando',
    paid: 'Pago',
    failed: 'Falhou',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    
    // Recebível
    open: 'Em Aberto',
    overdue: 'Vencido',
    partially_paid: 'Parcialmente Pago',
    
    // Contrato
    draft: 'Rascunho',
    
    // Matrícula
    completed: 'Concluída'
  }
  
  return labels[status] || status
}

/**
 * Verifica se status é final (não pode mais mudar)
 */
export function isFinalStatus(status) {
  const finalStatuses = [
    'cancelled',
    'completed',
    'expired',
    'refunded',
    'paid'
  ]
  
  return finalStatuses.includes(status)
}
```

---

## 📅 Datas e Timestamps

### **Padrão de Nomenclatura**

```javascript
// ✅ CORRETO: usar sufixo "At" para timestamps
createdAt: Timestamp
updatedAt: Timestamp
deletedAt: Timestamp
paidAt: Timestamp
expiredAt: Timestamp
startedAt: Timestamp
completedAt: Timestamp

// ✅ CORRETO: usar sufixo "Date" para datas ISO
dueDate: '2025-02-15'        // YYYY-MM-DD
birthDate: '1990-05-20'      // YYYY-MM-DD
startDate: '2025-01-01'      // YYYY-MM-DD

// ❌ ERRADO: nomes inconsistentes
created: Timestamp           // Falta "At"
date: '2025-01-30'          // Muito genérico
payment_date: Timestamp      // Usar camelCase
```

### **Tipos de Data**

```javascript
// 1. Timestamp (Firestore) - para auditoria e ordenação
{
  createdAt: Timestamp,      // Firebase serverTimestamp()
  updatedAt: Timestamp
}

// 2. Date ISO String (YYYY-MM-DD) - para datas de negócio
{
  dueDate: '2025-02-15',     // Data de vencimento
  birthDate: '1990-05-20',   // Data de nascimento
  startDate: '2025-01-01'    // Data de início
}

// 3. DateTime ISO String - para eventos específicos
{
  scheduledAt: '2025-01-30T14:30:00Z'  // Agendamento
}
```

### **Helpers de Data**

```javascript
// utils/date.js

import { toISODate, addDays, getToday } from '@pga/shared'

/**
 * Retorna data de hoje em formato ISO
 */
export function getTodayISO() {
  return toISODate(new Date())
}

/**
 * Retorna data de ontem em formato ISO
 */
export function getYesterdayISO() {
  return toISODate(addDays(new Date(), -1))
}

/**
 * Retorna primeiro dia do mês atual
 */
export function getFirstDayOfMonth() {
  const today = new Date()
  return toISODate(new Date(today.getFullYear(), today.getMonth(), 1))
}

/**
 * Retorna último dia do mês atual
 */
export function getLastDayOfMonth() {
  const today = new Date()
  return toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
}

/**
 * Verifica se data está vencida
 */
export function isOverdue(dueDate) {
  if (!dueDate) return false
  return dueDate < getTodayISO()
}

/**
 * Calcula dias até vencimento
 */
export function daysUntilDue(dueDate) {
  if (!dueDate) return null
  
  const today = new Date(getTodayISO())
  const due = new Date(dueDate)
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24))
  
  return diff
}

/**
 * Formata data para exibição
 */
export function formatDate(date) {
  if (!date) return ''
  
  try {
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return ''
  }
}

/**
 * Formata timestamp para exibição
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('pt-BR')
  } catch {
    return ''
  }
}
```

---

## 🚩 Flags Booleanos

### **Padrão de Nomenclatura**

```javascript
// ✅ CORRETO: usar prefixos is/has/can
isActive: boolean
isDeleted: boolean
isPaid: boolean
hasContract: boolean
hasDebt: boolean
canEdit: boolean
canDelete: boolean

// ❌ ERRADO: sem prefixo
active: boolean              // Ambíguo
deleted: boolean             // Ambíguo
paid: boolean                // Ambíguo
```

### **Flags Comuns**

```javascript
// Soft Delete
deleted: boolean             // EXCEÇÃO: não usa "is" por convenção
deletedAt: Timestamp | null
deletedBy: string | null

// Estado
isActive: boolean
isEnabled: boolean
isVisible: boolean
isPublic: boolean

// Capacidades
canEdit: boolean
canDelete: boolean
canExport: boolean

// Posse
hasContract: boolean
hasDebt: boolean
hasAccess: boolean

// Verificação
isVerified: boolean
isApproved: boolean
isConfirmed: boolean
```

### **Valores Padrão**

```javascript
// Sempre definir valores padrão para booleanos
const schema = z.object({
  deleted: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  canEdit: z.boolean().default(false)
})
```

---

## 🔑 Identificadores

### **Padrão de IDs**

```javascript
// Formato: PREFIXO-NÚMERO
// Exemplos:
CLI-001          // Cliente
CTR-001          // Contrato
PAY-001          // Pagamento
REC-001          // Recebível
ENR-001          // Matrícula
STF-001          // Staff
EVA-001          // Avaliação

// Geração de ID
import { generateFriendlyId } from '@/services/_core/ids'

const clientId = await generateFriendlyId('clients', 'CLI')
// Retorna: CLI-001, CLI-002, etc
```

### **Prefixos Padrão**

```javascript
// constants/prefixes.js

export const ID_PREFIXES = {
  CLIENT: 'CLI',
  CONTRACT: 'CTR',
  PAYMENT: 'PAY',
  RECEIVABLE: 'REC',
  ENROLLMENT: 'ENR',
  STAFF: 'STF',
  EVALUATION: 'EVA',
  CLASS: 'CLS',
  ATTENDANCE: 'ATT',
  AUDIT_LOG: 'AUD',
  USER: 'USR',
  TENANT: 'TNT',
  BRANCH: 'BRN'
}
```

### **IDs de Referência**

```javascript
// Sempre usar prefixo "id" para referências
{
  id: 'CLI-001',              // ID do próprio documento
  idClient: 'CLI-001',        // Referência a cliente
  idContract: 'CTR-001',      // Referência a contrato
  idTenant: 'TNT-001',        // Referência a tenant
  idBranch: 'BRN-001',        // Referência a branch
  createdBy: 'USR-001',       // Referência a usuário
  updatedBy: 'USR-001'        // Referência a usuário
}
```

---

## 📝 Nomenclatura

### **Variáveis e Funções**

```javascript
// ✅ CORRETO: camelCase
const clientName = 'João Silva'
const isActive = true
function getClientById(id) { }
function createClient(data) { }

// ❌ ERRADO: snake_case ou PascalCase
const client_name = 'João Silva'
const ClientName = 'João Silva'
function get_client_by_id(id) { }
```

### **Componentes React**

```javascript
// ✅ CORRETO: PascalCase
function ClientList() { }
function ClientProfile() { }
function ClientForm() { }

// ❌ ERRADO: camelCase
function clientList() { }
```

### **Constantes**

```javascript
// ✅ CORRETO: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 20
const API_BASE_URL = 'https://api.example.com'

// ❌ ERRADO: camelCase
const maxUploadSize = 5 * 1024 * 1024
```

### **Arquivos**

```javascript
// ✅ CORRETO: camelCase para arquivos JS/TS
clientService.js
clientRepository.js
useClientList.js

// ✅ CORRETO: PascalCase para componentes React
ClientList.jsx
ClientProfile.jsx
ClientForm.jsx

// ✅ CORRETO: kebab-case para CSS/SCSS
client-list.module.css
client-profile.scss

// ❌ ERRADO: misturar padrões
Client_Service.js
client-repository.js
```

---

## 🎨 Metadata e Campos Extras

### **Campo metadata**

Use `metadata` para dados extras não estruturados:

```javascript
{
  id: 'CLI-001',
  name: 'João Silva',
  
  // Campos estruturados
  status: 'active',
  
  // Dados extras não estruturados
  metadata: {
    source: 'website',           // De onde veio o lead
    campaign: 'summer-2025',     // Campanha de marketing
    referredBy: 'CLI-050',       // Indicado por outro cliente
    notes: 'Cliente VIP',        // Notas internas
    tags: ['vip', 'premium'],    // Tags customizadas
    customFields: {              // Campos customizados
      shirtSize: 'M',
      preferredTime: 'morning'
    }
  }
}
```

### **Quando usar metadata**

```javascript
// ✅ Use metadata para:
- Dados de integração externa
- Campos customizados por tenant
- Informações temporárias
- Tags e categorias flexíveis
- Dados de marketing/analytics

// ❌ NÃO use metadata para:
- Dados críticos de negócio
- Campos que precisam de queries
- Dados que precisam de validação rígida
- Informações financeiras
```

---

## 📊 Schema Completo de Exemplo

```javascript
// data/schemas/clientSchema.js

import { z } from 'zod'

export const clientSchema = z.object({
  // ========== IDENTIFICAÇÃO ==========
  id: z.string().min(1),
  
  // ========== CONTEXTO MULTITENANT ==========
  idTenant: z.string().min(1),
  idBranch: z.string().min(1),
  
  // ========== TIMESTAMPS ==========
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // ========== AUDITORIA ==========
  createdBy: z.string(),
  updatedBy: z.string(),
  
  // ========== SOFT DELETE ==========
  deleted: z.boolean().default(false),
  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().nullable().default(null),
  
  // ========== DADOS PRINCIPAIS ==========
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional(),
  cpf: z.string().regex(/^\d{11}$/, 'CPF inválido').optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  
  // ========== STATUS ==========
  status: z.enum(['lead', 'active', 'inactive', 'expired', 'suspended']),
  statusUpdatedAt: z.date().optional(),
  
  // ========== FLAGS ==========
  isActive: z.boolean().default(true),
  hasContract: z.boolean().default(false),
  hasDebt: z.boolean().default(false),
  
  // ========== METADATA ==========
  metadata: z.record(z.any()).optional()
})

export type Client = z.infer<typeof clientSchema>
```

---

## ✅ Checklist de Validação

Ao criar um novo schema, verifique:

- [ ] Tem todos os campos padrão (id, idTenant, idBranch, timestamps, auditoria, soft delete)
- [ ] Status usa enum com valores lowercase
- [ ] Datas usam sufixo "At" ou "Date" apropriado
- [ ] Booleanos usam prefixo is/has/can
- [ ] IDs de referência usam prefixo "id"
- [ ] Valores padrão definidos para booleanos
- [ ] Validações Zod implementadas
- [ ] Metadata para campos extras

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Padrão:** Consistência em todo o projeto
