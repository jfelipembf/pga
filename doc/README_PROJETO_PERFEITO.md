# 🚀 Guia Completo - Projeto Perfeito Multitenant

## 📚 Documentação Completa

Este é o **guia mestre** para construir um sistema multitenant profissional usando React + Firebase + Vercel, sem os erros cometidos no projeto anterior.

---

## 📋 Índice de Documentos

### **1. [Arquitetura do Projeto](./ARQUITETURA_PROJETO_PERFEITO.md)** ⭐ COMECE AQUI
- Visão geral da arquitetura
- Stack tecnológica completa
- Estrutura de pastas detalhada
- Camadas da aplicação (Business Logic, Data, Service, UI)
- Fluxo de dados
- Boas práticas fundamentais

### **2. [Gerenciamento de Estado](./GERENCIAMENTO_ESTADO.md)**
- Redux Toolkit vs Context API
- Configuração da Store
- Slices principais (Tenant, Auth, Permissions, UI)
- Hooks customizados
- Padrões e boas práticas

### **3. [Sistema de Auditoria Profissional](./SISTEMA_AUDITORIA.md)**
- Estrutura de dados de auditoria
- Implementação completa
- Tipos de eventos
- Consultas e relatórios
- Conformidade LGPD

### **4. [Estratégia de Testes](./ESTRATEGIA_TESTES.md)**
- Pirâmide de testes
- Testes unitários (Vitest)
- Testes de integração (Firebase Emulator)
- Testes E2E (Playwright)
- Configuração e boas práticas

### **5. [Estrutura de Páginas e Rotas](./ESTRUTURA_PAGINAS.md)**
- Mapa completo de rotas
- Módulos principais
- Sistema de permissões
- Layouts e navegação
- Componentes de proteção

---

## 🎯 Começando do Zero

### **Passo 1: Inicializar Projeto**

```bash
# Criar projeto React com Vite
npm create vite@latest meu-projeto -- --template react

cd meu-projeto

# Instalar dependências principais
npm install react-router-dom@6 \
  @reduxjs/toolkit react-redux redux-persist \
  firebase \
  zod react-hook-form \
  axios \
  date-fns \
  lucide-react

# Instalar dependências de desenvolvimento
npm install -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/jest-dom \
  @playwright/test \
  tailwindcss postcss autoprefixer

# Configurar TailwindCSS
npx tailwindcss init -p
```

### **Passo 2: Estrutura de Pastas**

```bash
mkdir -p src/{app,business,data,services,store,features,components,hooks,utils,types,__tests__}
mkdir -p src/business/{Clients,Financial,Contracts}
mkdir -p src/data/{repositories,schemas,firebase}
mkdir -p src/services/{Clients,Financial,Audit,_core}
mkdir -p src/store/{tenant,auth,permissions,ui}
mkdir -p src/features/{dashboard,clients,financial,settings}
mkdir -p src/components/{ui,layout,common}
mkdir -p src/__tests__/{unit,integration,e2e}
```

### **Passo 3: Configurar Firebase**

```javascript
// src/data/firebase/config.js

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
```

### **Passo 4: Configurar Redux**

```javascript
// src/store/index.js

import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import rootReducer from './rootReducer'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['tenant', 'auth', 'ui']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})

export const persistor = persistStore(store)
```

### **Passo 5: Configurar Rotas**

```javascript
// src/app/Router.jsx

import { Routes, Route, Navigate } from 'react-router-dom'
import { TenantLayout } from '@/components/layout/TenantLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'

export function AppRouter() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      
      {/* Rotas com contexto tenant/branch */}
      <Route path="/:tenant/:branch" element={<TenantLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute permissions={['dashboard_view']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Adicionar mais rotas aqui */}
      </Route>
    </Routes>
  )
}
```

---

## 🏗️ Arquitetura em Camadas

### **Fluxo Completo de Dados**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI LAYER (Componentes React)                            │
│    - ClientForm.jsx                                         │
│    - Coleta dados do usuário                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. HOOK LAYER (Custom Hooks)                               │
│    - useClientList.js                                       │
│    - Gerencia estado local e chamadas                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE LAYER (Orquestração)                            │
│    - ClientService.createClient()                           │
│    - Valida, salva, audita                                  │
│    ├─> validateClientData() [Business Logic]               │
│    ├─> ClientRepository.create() [Data Layer]              │
│    └─> AuditService.log() [Audit]                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. BUSINESS LOGIC LAYER (Lógica Pura)                      │
│    - ClientValidator.validateClientData()                   │
│    - Regras de negócio sem dependências                     │
│    - Testável isoladamente                                  │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DATA LAYER (Repositories)                               │
│    - ClientRepository.create()                              │
│    - Acesso ao Firestore com contexto tenant/branch         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. FIRESTORE                                                │
│    tenants/{idTenant}/branches/{idBranch}/clients/{id}      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Conceitos Fundamentais

### **1. Multitenant por URL**

```javascript
// URL determina o contexto
// /:tenant/:branch/*
// /academia-fit/unidade-centro/clients

// Hook para acessar contexto
const { idTenant, idBranch, tenantSlug, branchSlug } = useTenant()

// Todas as queries usam contexto automaticamente
const clients = await ClientRepository.findAll()
// Busca em: tenants/{idTenant}/branches/{idBranch}/clients
```

### **2. Isolamento de Dados**

```javascript
// ❌ NUNCA faça isso
const ref = collection(db, 'clients')

// ✅ SEMPRE use contexto
const ref = collection(
  db,
  'tenants', idTenant,
  'branches', idBranch,
  'clients'
)
```

### **3. Separação de Camadas**

```javascript
// ❌ Tudo misturado
function createClient(data) {
  // Validação
  if (!data.name) throw new Error('Nome obrigatório')
  
  // Salvar
  await setDoc(doc(db, 'clients', id), data)
  
  // Auditoria
  await addDoc(collection(db, 'logs'), { ... })
}

// ✅ Separado em camadas
// Business Logic
export function validateClientData(data) {
  if (!data.name) return { valid: false, errors: ['Nome obrigatório'] }
  return { valid: true, errors: [] }
}

// Service
export async function createClient(data) {
  const validation = validateClientData(data)
  if (!validation.valid) throw new Error(validation.errors.join(', '))
  
  const client = await ClientRepository.create(data)
  await AuditService.log({ action: 'CREATE', entityType: 'client', ... })
  
  return client
}

// Repository
export class ClientRepository {
  static async create(data) {
    const { idTenant, idBranch } = getTenantContext()
    const ref = doc(db, 'tenants', idTenant, 'branches', idBranch, 'clients', data.id)
    await setDoc(ref, data)
    return data
  }
}
```

### **4. Auditoria Automática**

```javascript
// Toda operação crítica deve ser auditada
await AuditService.log({
  action: 'CREATE',
  entityType: 'client',
  entityId: client.id,
  entityName: client.name,
  description: `Cliente "${client.name}" criado`,
  changes: { after: client },
  severity: 'medium',
  success: true
})
```

### **5. Permissões Granulares**

```javascript
// Proteger rotas
<Route 
  path="clients" 
  element={
    <ProtectedRoute permissions={['clients_view']}>
      <ClientsListPage />
    </ProtectedRoute>
  } 
/>

// Proteger ações
function ClientActions() {
  const { hasPermission } = usePermissions()
  
  return (
    <>
      {hasPermission('clients_create') && (
        <Button onClick={handleCreate}>Novo Cliente</Button>
      )}
      {hasPermission('clients_delete') && (
        <Button onClick={handleDelete}>Deletar</Button>
      )}
    </>
  )
}
```

---

## ✅ Checklist de Implementação

### **Setup Inicial**
- [ ] Criar projeto com Vite
- [ ] Instalar dependências
- [ ] Configurar TailwindCSS
- [ ] Criar estrutura de pastas
- [ ] Configurar Firebase
- [ ] Configurar Redux
- [ ] Configurar rotas

### **Infraestrutura**
- [ ] Implementar sistema de contexto tenant/branch
- [ ] Criar repositories base
- [ ] Implementar sistema de auditoria
- [ ] Configurar sistema de permissões
- [ ] Criar hooks globais (useTenant, useAuth, usePermissions)

### **Features Core**
- [ ] Autenticação (login, logout, recuperar senha)
- [ ] Dashboard principal
- [ ] Gestão de clientes
- [ ] Gestão de usuários
- [ ] Configurações

### **Qualidade**
- [ ] Configurar Vitest
- [ ] Configurar Firebase Emulator
- [ ] Configurar Playwright
- [ ] Criar testes unitários para business logic
- [ ] Criar testes de integração para services
- [ ] Criar testes E2E para fluxos críticos
- [ ] Configurar CI/CD

### **Documentação**
- [ ] README do projeto
- [ ] Documentação de API
- [ ] Guia de contribuição
- [ ] Changelog

---

## 🚨 Erros Comuns a Evitar

### **1. Não Usar Contexto Tenant/Branch**

```javascript
// ❌ ERRO: Acesso direto sem contexto
const clients = await getDocs(collection(db, 'clients'))

// ✅ CORRETO: Sempre usar contexto
const clients = await ClientRepository.findAll()
```

### **2. Lógica de Negócio na UI**

```javascript
// ❌ ERRO: Validação apenas na UI
function ClientForm() {
  const handleSubmit = (data) => {
    if (!data.name) {
      alert('Nome obrigatório')
      return
    }
    createClient(data)
  }
}

// ✅ CORRETO: Validação em múltiplas camadas
// UI: feedback imediato
// Business Logic: regras de negócio
// Schema: validação estrutural
```

### **3. Não Auditar Operações**

```javascript
// ❌ ERRO: Sem auditoria
async function deleteClient(id) {
  await ClientRepository.delete(id)
}

// ✅ CORRETO: Com auditoria
async function deleteClient(id) {
  const client = await ClientRepository.findById(id)
  await ClientRepository.delete(id)
  await AuditService.log({
    action: 'DELETE',
    entityType: 'client',
    entityId: id,
    changes: { before: client },
    severity: 'high'
  })
}
```

### **4. Estado Duplicado**

```javascript
// ❌ ERRO: Dados duplicados
const [clients, setClients] = useState([])
const [activeClients, setActiveClients] = useState([])
const [inactiveClients, setInactiveClients] = useState([])

// ✅ CORRETO: Derive do estado
const [clients, setClients] = useState([])
const activeClients = useMemo(() => 
  clients.filter(c => c.status === 'active'), 
  [clients]
)
```

### **5. Não Tratar Erros**

```javascript
// ❌ ERRO: Erro genérico
try {
  await createClient(data)
} catch (error) {
  alert('Erro')
}

// ✅ CORRETO: Erro específico
try {
  await createClient(data)
} catch (error) {
  if (error.code === 'permission-denied') {
    toast.error('Você não tem permissão')
  } else if (error.code === 'network-error') {
    toast.error('Erro de conexão')
  } else {
    toast.error(`Erro: ${error.message}`)
  }
  
  Sentry.captureException(error)
}
```

### **6. Queries Ineficientes**

```javascript
// ❌ ERRO: Queries sequenciais
const client = await getClient(id)
const contracts = await getContracts(id)
const enrollments = await getEnrollments(id)

// ✅ CORRETO: Queries paralelas
const [client, contracts, enrollments] = await Promise.all([
  getClient(id),
  getContracts(id),
  getEnrollments(id)
])
```

---

## 📊 Métricas de Qualidade

### **Cobertura de Testes**
- Business Logic: **90%+**
- Services: **80%+**
- Repositories: **70%+**
- Components: **60%+**

### **Performance**
- First Contentful Paint: **< 1.5s**
- Time to Interactive: **< 3.5s**
- Lighthouse Score: **90+**

### **Segurança**
- Todas as rotas protegidas por permissões
- Dados sensíveis sanitizados em logs
- Firestore Rules configuradas
- HTTPS obrigatório

### **Auditoria**
- 100% das operações críticas auditadas
- Logs retidos por 12 meses
- Conformidade LGPD

---

## 🎓 Recursos de Aprendizado

### **React + Firebase**
- [React Docs](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Router](https://reactrouter.com)

### **Redux**
- [Redux Toolkit](https://redux-toolkit.js.org)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

### **Testes**
- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Playwright](https://playwright.dev)

### **Boas Práticas**
- [Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## 🤝 Contribuindo

### **Workflow**

1. **Criar Branch**
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. **Desenvolver**
   - Seguir estrutura de camadas
   - Escrever testes
   - Documentar código

3. **Testar**
   ```bash
   npm run test:all
   npm run test:coverage
   ```

4. **Commit**
   ```bash
   git commit -m "feat: adiciona funcionalidade X"
   ```

5. **Pull Request**
   - Descrever mudanças
   - Incluir screenshots se UI
   - Aguardar review

### **Padrões de Commit**

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

---

## 📞 Suporte

- **Documentação:** Leia os documentos específicos
- **Issues:** Abra uma issue no GitHub
- **Discussões:** Use GitHub Discussions

---

## 📄 Licença

Este projeto é privado e proprietário.

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Última Atualização:** 30/01/2025

---

## 🎯 Próximos Passos

1. ✅ Ler [Arquitetura do Projeto](./ARQUITETURA_PROJETO_PERFEITO.md)
2. ✅ Configurar ambiente de desenvolvimento
3. ✅ Implementar infraestrutura base
4. ✅ Criar primeira feature (Clientes)
5. ✅ Escrever testes
6. ✅ Deploy em staging
7. ✅ Review e ajustes
8. ✅ Deploy em produção

**Boa sorte! 🚀**
