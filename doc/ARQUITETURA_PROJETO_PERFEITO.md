# 🏗️ Arquitetura do Projeto Perfeito - Sistema Multitenant

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Multitenant](#arquitetura-multitenant)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estrutura de Pastas](#estrutura-de-pastas)
5. [Camadas da Aplicação](#camadas-da-aplicação)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Este documento define a arquitetura completa para um sistema multitenant profissional usando React + Firebase, hospedado na Vercel, com separação clara de responsabilidades e código escalável.

### **Características Principais**

- ✅ **Multitenant** - Múltiplos clientes (tenants) com múltiplas unidades (branches)
- ✅ **Roteamento por URL** - `/:tenant/:branch/*` para isolamento de dados
- ✅ **Autenticação Firebase** - Firebase Authentication integrado
- ✅ **Firestore Estruturado** - Dados organizados por tenant/branch
- ✅ **Gerenciamento de Estado** - Redux para estado global
- ✅ **Arquitetura em Camadas** - Separação clara de responsabilidades
- ✅ **Auditoria Profissional** - Logs detalhados de todas as operações
- ✅ **Testes Abrangentes** - Unitários, integração e E2E

---

## 🏢 Arquitetura Multitenant

### **1. Estrutura de URL**

```
https://app.seudominio.com/:tenant/:branch/dashboard
                            └─────┘ └─────┘
                            Tenant  Branch
                            (Cliente) (Unidade)
```

**Exemplos:**
```
/academia-fit/unidade-centro/dashboard
/academia-fit/unidade-sul/clients
/escola-tech/matriz/financial
```

### **2. Estrutura do Firestore**

```
firestore/
├── tenants/
│   ├── {idTenant}/                    # Cliente/Academia
│   │   ├── info: { name, slug, ... }
│   │   └── branches/
│   │       ├── {idBranch}/            # Unidade/Filial
│   │       │   ├── info: { name, slug, ... }
│   │       │   ├── clients/           # Dados isolados por unidade
│   │       │   ├── contracts/
│   │       │   ├── financial/
│   │       │   ├── enrollments/
│   │       │   ├── staff/
│   │       │   └── auditLogs/
│   │       └── {idBranch2}/
│   └── {idTenant2}/
└── users/                             # Usuários globais
    └── {userId}/
        ├── profile: { name, email, ... }
        └── tenantAccess/              # Permissões por tenant/branch
            └── {idTenant}/
                └── {idBranch}/
                    └── roles: ['admin', 'instructor']
```

### **3. Isolamento de Dados**

**REGRA FUNDAMENTAL:** Todos os dados devem estar isolados por `tenant` e `branch`.

```javascript
// ❌ ERRADO - Acesso direto sem contexto
const clientsRef = collection(db, 'clients')

// ✅ CORRETO - Acesso com contexto
const clientsRef = collection(
  db, 
  'tenants', idTenant, 
  'branches', idBranch, 
  'clients'
)
```

---

## 🛠️ Stack Tecnológica

### **Frontend**

```json
{
  "framework": "React 18+",
  "routing": "React Router v6",
  "stateManagement": "Redux Toolkit",
  "styling": "TailwindCSS + shadcn/ui",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts / ApexCharts",
  "icons": "Lucide React",
  "dateTime": "date-fns",
  "http": "Axios (para APIs externas)"
}
```

### **Backend/Infraestrutura**

```json
{
  "auth": "Firebase Authentication",
  "database": "Cloud Firestore",
  "storage": "Firebase Storage",
  "hosting": "Vercel",
  "functions": "Firebase Cloud Functions (opcional)",
  "monitoring": "Firebase Analytics + Sentry"
}
```

### **Testes**

```json
{
  "unitTests": "Vitest",
  "componentTests": "React Testing Library",
  "e2eTests": "Playwright",
  "coverage": "Vitest Coverage"
}
```

---

## 📁 Estrutura de Pastas

```
src/
├── app/                              # 🚀 CONFIGURAÇÃO DO APP
│   ├── App.jsx                       # Componente raiz
│   ├── Router.jsx                    # Configuração de rotas
│   └── providers/                    # Providers globais
│       ├── ReduxProvider.jsx
│       ├── AuthProvider.jsx
│       └── TenantProvider.jsx
│
├── business/                         # 🧠 LÓGICA DE NEGÓCIO PURA
│   ├── Clients/
│   │   ├── ClientStatusEngine.js     # Regras de status
│   │   ├── ClientMetrics.js          # Cálculos
│   │   └── ClientValidator.js        # Validações
│   ├── Financial/
│   │   ├── PaymentEngine.js
│   │   ├── InstallmentCalculator.js
│   │   └── FinancialValidator.js
│   └── Contracts/
│       ├── ContractStatusEngine.js
│       └── ContractValidator.js
│
├── data/                             # 💾 CAMADA DE DADOS
│   ├── repositories/                 # Acesso ao Firestore
│   │   ├── ClientRepository.js
│   │   ├── ContractRepository.js
│   │   ├── FinancialRepository.js
│   │   └── AuditLogRepository.js
│   ├── schemas/                      # Schemas Zod
│   │   ├── clientSchema.js
│   │   ├── contractSchema.js
│   │   └── financialSchema.js
│   └── firebase/                     # Configuração Firebase
│       ├── config.js
│       ├── auth.js
│       └── firestore.js
│
├── services/                         # 🔗 ORQUESTRAÇÃO
│   ├── Clients/
│   │   ├── clients.service.js        # CRUD básico
│   │   └── client-aggregator.service.js
│   ├── Financial/
│   │   ├── financial.service.js
│   │   ├── payment-processor.service.js
│   │   └── receivables.service.js
│   ├── Audit/
│   │   └── audit.service.js          # Sistema de auditoria
│   └── _core/                        # Serviços compartilhados
│       ├── context.js                # Gerenciamento de contexto
│       ├── refs.js                   # Helpers Firestore
│       └── mappers.js                # Mapeadores
│
├── store/                            # 🗄️ REDUX STORE
│   ├── index.js                      # Configuração da store
│   ├── rootReducer.js
│   ├── tenant/                       # Slice de tenant
│   │   ├── tenantSlice.js
│   │   └── tenantSelectors.js
│   ├── auth/                         # Slice de autenticação
│   │   ├── authSlice.js
│   │   └── authSelectors.js
│   └── ui/                           # Slice de UI
│       └── uiSlice.js
│
├── features/                         # 📦 FEATURES (Módulos)
│   ├── clients/
│   │   ├── components/               # Componentes específicos
│   │   │   ├── ClientList.jsx
│   │   │   ├── ClientProfile.jsx
│   │   │   └── ClientForm.jsx
│   │   ├── hooks/                    # Hooks específicos do módulo
│   │   │   ├── useClientList.js
│   │   │   ├── useClientProfile.js
│   │   │   └── useClientActions.js
│   │   ├── pages/                    # Páginas
│   │   │   ├── ClientsListPage.jsx
│   │   │   └── ClientProfilePage.jsx
│   │   ├── utils/                    # Utilitários específicos
│   │   │   ├── clientFormatters.js
│   │   │   └── clientHelpers.js
│   │   └── constants/                # Constantes do módulo
│   │       ├── clientStatus.js
│   │       └── clientDefaults.js
│   ├── financial/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── constants/
│   ├── contracts/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── constants/
│   ├── dashboard/
│   └── settings/
│
├── components/                       # 🧩 COMPONENTES COMPARTILHADOS
│   ├── ui/                           # Componentes UI base (shadcn)
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   └── Table.jsx
│   ├── layout/                       # Layout components
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── Footer.jsx
│   └── common/                       # Componentes comuns
│       ├── LoadingSpinner.jsx
│       ├── ErrorBoundary.jsx
│       └── ProtectedRoute.jsx
│
├── hooks/                            # 🪝 HOOKS GLOBAIS
│   ├── useAuth.js
│   ├── useTenant.js
│   ├── usePermissions.js
│   └── useAuditLog.js
│
├── utils/                            # 🛠️ UTILITÁRIOS GLOBAIS
│   ├── date.js                       # Funções de data
│   ├── format.js                     # Formatação (moeda, telefone, etc)
│   ├── validation.js                 # Validações genéricas
│   └── helpers.js                    # Helpers diversos
│
├── constants/                        # 📌 CONSTANTES GLOBAIS
│   ├── app.js                        # Constantes da aplicação
│   ├── routes.js                     # Rotas da aplicação
│   ├── permissions.js                # Permissões e roles
│   └── status.js                     # Status globais
│
├── types/                            # 📝 TIPOS TYPESCRIPT (opcional)
│   ├── client.types.ts
│   ├── financial.types.ts
│   └── common.types.ts
│
└── __tests__/                        # 🧪 TESTES
    ├── unit/                         # Testes unitários
    ├── integration/                  # Testes de integração
    └── e2e/                          # Testes E2E
```

---

## 📂 Organização de Hooks, Utils e Constants

### **Regra de Organização**

A estrutura segue o princípio de **proximidade**: código específico fica próximo ao módulo que o usa, código compartilhado fica em pastas globais.

#### **1. Hooks**

```
📁 Hooks Específicos (dentro de features/)
└─ features/clients/hooks/
   ├── useClientList.js          # Hook para lista de clientes
   ├── useClientProfile.js       # Hook para perfil do cliente
   └── useClientActions.js       # Hook para ações do cliente

📁 Hooks Globais (raiz)
└─ hooks/
   ├── useAuth.js                # Autenticação (usado em todo app)
   ├── useTenant.js              # Contexto tenant/branch
   ├── usePermissions.js         # Verificação de permissões
   └── useAuditLog.js            # Sistema de auditoria
```

**Quando usar cada um:**
- ✅ **Hooks Específicos**: Usados apenas dentro do módulo (ex: `useClientList` só em clients)
- ✅ **Hooks Globais**: Usados em múltiplos módulos (ex: `useAuth` em toda aplicação)

#### **2. Utils (Utilitários)**

```
📁 Utils Específicos (dentro de features/)
└─ features/clients/utils/
   ├── clientFormatters.js       # Formatação específica de clientes
   ├── clientHelpers.js          # Helpers específicos
   └── clientCalculations.js     # Cálculos específicos

📁 Utils Globais (raiz)
└─ utils/
   ├── date.js                   # Funções de data (usado em todo app)
   ├── format.js                 # Formatação genérica (moeda, telefone)
   ├── validation.js             # Validações genéricas
   └── helpers.js                # Helpers diversos
```

**Exemplos:**

```javascript
// ❌ ERRADO - Função específica em utils global
// utils/format.js
export function formatClientName(client) { ... }

// ✅ CORRETO - Função específica em utils do módulo
// features/clients/utils/clientFormatters.js
export function formatClientName(client) { ... }

// ✅ CORRETO - Função genérica em utils global
// utils/format.js
export function formatCurrency(value) { ... }
export function formatPhone(phone) { ... }
```

#### **3. Constants (Constantes)**

```
📁 Constants Específicas (dentro de features/)
└─ features/clients/constants/
   ├── clientStatus.js           # Status específicos de clientes
   ├── clientDefaults.js         # Valores padrão
   └── clientMessages.js         # Mensagens específicas

📁 Constants Globais (raiz)
└─ constants/
   ├── app.js                    # Constantes da aplicação
   ├── routes.js                 # Rotas da aplicação
   ├── permissions.js            # Permissões e roles
   └── status.js                 # Status globais
```

**Exemplos:**

```javascript
// features/clients/constants/clientStatus.js
export const CLIENT_STATUS = {
  LEAD: 'lead',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked'
}

export const CLIENT_STATUS_LABELS = {
  [CLIENT_STATUS.LEAD]: 'Lead',
  [CLIENT_STATUS.ACTIVE]: 'Ativo',
  [CLIENT_STATUS.INACTIVE]: 'Inativo',
  [CLIENT_STATUS.BLOCKED]: 'Bloqueado'
}

export const CLIENT_STATUS_COLORS = {
  [CLIENT_STATUS.LEAD]: 'info',
  [CLIENT_STATUS.ACTIVE]: 'success',
  [CLIENT_STATUS.INACTIVE]: 'secondary',
  [CLIENT_STATUS.BLOCKED]: 'danger'
}

// constants/permissions.js (global)
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  INSTRUCTOR: 'instructor',
  RECEPTIONIST: 'receptionist'
}

export const PERMISSIONS = {
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_DELETE: 'clients:delete',
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_MANAGE: 'financial:manage'
}
```

### **Decisão: Específico vs Global**

Use este fluxograma para decidir onde colocar seu código:

```
┌─────────────────────────────────────────┐
│ Este código é usado em mais de         │
│ um módulo/feature?                      │
└─────────────┬───────────────────────────┘
              │
         ┌────┴────┐
         │   SIM   │   ──────>  📁 Pasta Global (hooks/, utils/, constants/)
         └─────────┘
              │
         ┌────┴────┐
         │   NÃO   │   ──────>  📁 Pasta do Módulo (features/[module]/)
         └─────────┘
```

**Exemplos Práticos:**

| Código | Onde Colocar | Motivo |
|--------|--------------|--------|
| `useClientList()` | `features/clients/hooks/` | Usado apenas em clients |
| `useAuth()` | `hooks/` | Usado em toda aplicação |
| `formatClientName()` | `features/clients/utils/` | Específico de clientes |
| `formatCurrency()` | `utils/format.js` | Usado em vários módulos |
| `CLIENT_STATUS` | `features/clients/constants/` | Específico de clientes |
| `ROLES` | `constants/permissions.js` | Usado em toda aplicação |

---

## 🏛️ Camadas da Aplicação

### **1. Business Logic Layer (Lógica Pura)**

**Responsabilidade:** Regras de negócio sem dependências externas.

```javascript
// business/Clients/ClientStatusEngine.js

/**
 * Determina status do cliente baseado em contratos
 * LÓGICA PURA - Testável isoladamente
 */
export function determineClientStatus(contracts) {
  if (!contracts || contracts.length === 0) return 'lead'
  
  const hasActive = contracts.some(c => c.status === 'active')
  if (hasActive) return 'active'
  
  const allCancelled = contracts.every(c => c.status === 'cancelled')
  if (allCancelled) return 'inactive'
  
  return 'pending'
}
```

**Características:**
- ✅ Sem dependências de banco, UI ou frameworks
- ✅ Funções puras (mesma entrada = mesma saída)
- ✅ Fácil de testar
- ✅ Reutilizável em qualquer contexto

---

### **2. Data Layer (Repositórios)**

**Responsabilidade:** Acesso ao banco de dados.

```javascript
// data/repositories/ClientRepository.js

import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getTenantContext } from '../../hooks/useTenant'

export class ClientRepository {
  /**
   * Lista clientes com contexto automático
   */
  static async findAll(filters = {}) {
    const { idTenant, idBranch } = getTenantContext()
    
    const ref = collection(
      db,
      'tenants', idTenant,
      'branches', idBranch,
      'clients'
    )
    
    let q = query(ref, where('deleted', '==', false))
    
    if (filters.status) {
      q = query(q, where('status', '==', filters.status))
    }
    
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
  
  static async findById(id) {
    // Implementação...
  }
  
  static async create(data) {
    // Implementação...
  }
  
  static async update(id, data) {
    // Implementação...
  }
}
```

**Características:**
- ✅ Apenas queries e operações de persistência
- ✅ Contexto tenant/branch automático
- ✅ Sem lógica de negócio
- ✅ Retorna dados brutos

---

### **3. Service Layer (Orquestração)**

**Responsabilidade:** Coordenar operações compPGAs.

```javascript
// services/Clients/clients.service.js

import { ClientRepository } from '../../data/repositories/ClientRepository'
import { validateClientData } from '../../business/Clients/ClientValidator'
import { auditLog } from '../Audit/audit.service'

export class ClientService {
  /**
   * Cria cliente com validação e auditoria
   */
  static async createClient(data, userId) {
    // 1. Validar (Business Logic)
    const validation = validateClientData(data)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }
    
    // 2. Salvar (Repository)
    const client = await ClientRepository.create(data)
    
    // 3. Auditar (Audit Service)
    await auditLog({
      action: 'CLIENT_CREATED',
      entityType: 'client',
      entityId: client.id,
      userId,
      changes: data
    })
    
    return client
  }
  
  /**
   * Busca dados agregados
   */
  static async getClientAggregated(id) {
    const [client, contracts, enrollments] = await Promise.all([
      ClientRepository.findById(id),
      ContractRepository.findByClient(id),
      EnrollmentRepository.findByClient(id)
    ])
    
    // Calcular métricas (Business Logic)
    const metrics = calculateClientMetrics({ contracts, enrollments })
    
    return { client, contracts, enrollments, metrics }
  }
}
```

**Características:**
- ✅ Orquestra múltiplas operações
- ✅ Valida antes de persistir
- ✅ Registra auditoria
- ✅ Agrega dados de múltiplas fontes

---

### **4. UI Layer (Componentes e Hooks)**

**Responsabilidade:** Interface e interação com usuário.

```javascript
// features/clients/hooks/useClientList.js

import { useState, useEffect } from 'react'
import { ClientService } from '../../../services/Clients/clients.service'
import { useToast } from '../../../hooks/useToast'

export function useClientList(filters = {}) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const toast = useToast()
  
  useEffect(() => {
    loadClients()
  }, [filters])
  
  async function loadClients() {
    try {
      setLoading(true)
      const data = await ClientService.listClients(filters)
      setClients(data)
    } catch (err) {
      setError(err.message)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }
  
  async function createClient(data) {
    try {
      const newClient = await ClientService.createClient(data)
      setClients(prev => [newClient, ...prev])
      toast.success('Cliente criado com sucesso')
      return newClient
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }
  
  return {
    clients,
    loading,
    error,
    createClient,
    refreshClients: loadClients
  }
}
```

```jsx
// features/clients/pages/ClientsListPage.jsx

import { useClientList } from '../hooks/useClientList'
import { ClientList } from '../components/ClientList'
import { ClientForm } from '../components/ClientForm'

export function ClientsListPage() {
  const { clients, loading, createClient } = useClientList()
  const [showForm, setShowForm] = useState(false)
  
  return (
    <div>
      <h1>Clientes</h1>
      <button onClick={() => setShowForm(true)}>
        Novo Cliente
      </button>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ClientList clients={clients} />
      )}
      
      {showForm && (
        <ClientForm
          onSubmit={createClient}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
```

---

## 🔄 Fluxo de Dados

### **Fluxo Completo: Criar Cliente**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI Layer                                                 │
│    ClientForm.jsx                                           │
│    └─> onSubmit(formData)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. Hook Layer                                               │
│    useClientList.js                                         │
│    └─> createClient(data)                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. Service Layer                                            │
│    ClientService.createClient(data, userId)                 │
│    ├─> validateClientData(data)        [Business Logic]    │
│    ├─> ClientRepository.create(data)   [Data Layer]        │
│    └─> auditLog(...)                   [Audit Service]     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. Repository Layer                                         │
│    ClientRepository.create(data)                            │
│    ├─> getTenantContext()              [Context]           │
│    ├─> collection(db, path)            [Firestore Ref]     │
│    └─> setDoc(ref, payload)            [Firestore Write]   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. Firestore                                                │
│    tenants/{idTenant}/branches/{idBranch}/clients/{id}      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Boas Práticas

### **1. Contexto Tenant/Branch**

```javascript
// ❌ NUNCA faça isso
const clients = await getDocs(collection(db, 'clients'))

// ✅ SEMPRE use contexto
import { useTenant } from '@/hooks/useTenant'

function MyComponent() {
  const { idTenant, idBranch } = useTenant()
  
  // Agora o repository usa automaticamente o contexto
  const clients = await ClientRepository.findAll()
}
```

### **2. Validação de Dados**

```javascript
// ❌ Validação na UI apenas
function ClientForm() {
  const handleSubmit = (data) => {
    if (!data.name) {
      alert('Nome obrigatório')
      return
    }
    createClient(data)
  }
}

// ✅ Validação em múltiplas camadas
// 1. UI (feedback imediato)
// 2. Business Logic (regras de negócio)
// 3. Schema Zod (validação estrutural)
```

### **3. Tratamento de Erros**

```javascript
// ❌ Erro genérico
catch (error) {
  console.error(error)
  alert('Erro')
}

// ✅ Erro específico e informativo
catch (error) {
  console.error('[ClientService.create]', error)
  
  if (error.code === 'permission-denied') {
    toast.error('Você não tem permissão para criar clientes')
  } else if (error.code === 'network-error') {
    toast.error('Erro de conexão. Verifique sua internet.')
  } else {
    toast.error(`Erro ao criar cliente: ${error.message}`)
  }
  
  // Registrar no Sentry
  Sentry.captureException(error, {
    tags: { feature: 'clients', action: 'create' }
  })
}
```

### **4. Performance**

```javascript
// ❌ Múltiplas queries sequenciais
const client = await getClient(id)
const contracts = await getContracts(id)
const enrollments = await getEnrollments(id)

// ✅ Queries paralelas
const [client, contracts, enrollments] = await Promise.all([
  getClient(id),
  getContracts(id),
  getEnrollments(id)
])
```

### **5. Nomenclatura**

```javascript
// ❌ Nomes genéricos
function get(id) { }
function save(data) { }

// ✅ Nomes descritivos
function getClientById(id) { }
function createClient(data) { }
function updateClientStatus(id, status) { }
```

---

## 📚 Documentos Relacionados

- [Gerenciamento de Estado (Redux vs Context)](./GERENCIAMENTO_ESTADO.md)
- [Sistema de Auditoria Profissional](./SISTEMA_AUDITORIA.md)
- [Estratégia de Testes](./ESTRATEGIA_TESTES.md)
- [Estrutura de Páginas e Rotas](./ESTRUTURA_PAGINAS.md)
- [Guia de Segurança](./GUIA_SEGURANCA.md)

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Autor:** Arquitetura de Sistema Multitenant
