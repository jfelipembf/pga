# 🧪 Estratégia de Testes Completa

## 📋 Índice

1. [Pirâmide de Testes](#pirâmide-de-testes)
2. [Testes Unitários](#testes-unitários)
3. [Testes de Integração](#testes-de-integração)
4. [Testes E2E](#testes-e2e)
5. [Configuração](#configuração)
6. [Boas Práticas](#boas-práticas)

---

## 🔺 Pirâmide de Testes

```
           /\
          /  \
         / E2E \         ← Poucos, lentos, caros
        /--------\
       /          \
      / Integration \    ← Médio número, médio tempo
     /--------------\
    /                \
   /   Unit Tests     \  ← Muitos, rápidos, baratos
  /____________________\

  70% Unit | 20% Integration | 10% E2E
```

### **Distribuição Recomendada**

| Tipo | Quantidade | Velocidade | Custo | Cobertura |
|------|-----------|------------|-------|-----------|
| **Unit** | 70% | ⚡ Rápido | 💰 Baixo | Funções/Lógica |
| **Integration** | 20% | ⏱️ Médio | 💰💰 Médio | Services/API |
| **E2E** | 10% | 🐌 Lento | 💰💰💰 Alto | Fluxos Críticos |

---

## 🧩 Testes Unitários

### **O que Testar**

- ✅ **Business Logic** - Regras de negócio puras
- ✅ **Validators** - Validações de dados
- ✅ **Calculators** - Cálculos e métricas
- ✅ **Utilities** - Funções auxiliares
- ✅ **Formatters** - Formatação de dados

### **Configuração - Vitest**

```javascript
// vitest.config.js

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/__tests__/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

```javascript
// src/setupTests.js

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

### **Exemplo 1: Testar Business Logic**

```javascript
// business/Clients/ClientStatusEngine.test.js

import { describe, it, expect } from 'vitest'
import { 
  determineClientStatus,
  canConvertFromLead,
  calculateLeadScore 
} from './ClientStatusEngine'

describe('ClientStatusEngine', () => {
  describe('determineClientStatus', () => {
    it('deve retornar "lead" quando não tem contratos', () => {
      const result = determineClientStatus([])
      expect(result).toBe('lead')
    })
    
    it('deve retornar "active" quando tem contrato ativo', () => {
      const contracts = [
        { status: 'active' },
        { status: 'expired' }
      ]
      const result = determineClientStatus(contracts)
      expect(result).toBe('active')
    })
    
    it('deve retornar "inactive" quando todos contratos cancelados', () => {
      const contracts = [
        { status: 'cancelled' },
        { status: 'cancelled' }
      ]
      const result = determineClientStatus(contracts)
      expect(result).toBe('inactive')
    })
    
    it('deve retornar "pending" quando tem contratos pendentes', () => {
      const contracts = [
        { status: 'pending' }
      ]
      const result = determineClientStatus(contracts)
      expect(result).toBe('pending')
    })
  })
  
  describe('canConvertFromLead', () => {
    it('deve permitir conversão de lead com contrato ativo', () => {
      const client = { status: 'lead' }
      const contract = { status: 'active', value: 1000 }
      
      const result = canConvertFromLead(client, contract)
      
      expect(result.valid).toBe(true)
    })
    
    it('deve rejeitar se cliente não é lead', () => {
      const client = { status: 'active' }
      const contract = { status: 'active', value: 1000 }
      
      const result = canConvertFromLead(client, contract)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Cliente já não é mais lead')
    })
    
    it('deve rejeitar se contrato não está ativo', () => {
      const client = { status: 'lead' }
      const contract = { status: 'pending', value: 1000 }
      
      const result = canConvertFromLead(client, contract)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Contrato deve estar ativo')
    })
    
    it('deve rejeitar se contrato não tem valor', () => {
      const client = { status: 'lead' }
      const contract = { status: 'active', value: 0 }
      
      const result = canConvertFromLead(client, contract)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Contrato deve ter valor válido')
    })
  })
  
  describe('calculateLeadScore', () => {
    it('deve calcular score 100 para lead completo', () => {
      const lead = {
        email: 'test@test.com',
        phone: '11999999999',
        interest: 'Musculação',
        budget: 500,
        expectedDate: '2025-02-01'
      }
      
      const result = calculateLeadScore(lead)
      
      expect(result.score).toBe(100)
      expect(result.classification).toBe('hot')
    })
    
    it('deve calcular score 40 para lead básico', () => {
      const lead = {
        email: 'test@test.com',
        phone: '11999999999'
      }
      
      const result = calculateLeadScore(lead)
      
      expect(result.score).toBe(40)
      expect(result.classification).toBe('cold')
    })
  })
})
```

### **Exemplo 2: Testar Validators**

```javascript
// business/Clients/ClientValidator.test.js

import { describe, it, expect } from 'vitest'
import { validateClientData, validateLeadData } from './ClientValidator'

describe('ClientValidator', () => {
  describe('validateClientData', () => {
    it('deve validar cliente com dados corretos', () => {
      const data = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999'
      }
      
      const result = validateClientData(data)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('deve rejeitar nome muito curto', () => {
      const data = {
        name: 'Jo',
        email: 'joao@email.com'
      }
      
      const result = validateClientData(data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Nome deve ter pelo menos 3 caracteres')
    })
    
    it('deve rejeitar sem email e sem telefone', () => {
      const data = {
        name: 'João Silva'
      }
      
      const result = validateClientData(data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Informe email ou telefone')
    })
    
    it('deve rejeitar email inválido', () => {
      const data = {
        name: 'João Silva',
        email: 'email-invalido'
      }
      
      const result = validateClientData(data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Email inválido')
    })
    
    it('deve rejeitar CPF inválido', () => {
      const data = {
        name: 'João Silva',
        email: 'joao@email.com',
        cpf: '111.111.111-11'
      }
      
      const result = validateClientData(data)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('CPF inválido')
    })
  })
})
```

### **Exemplo 3: Testar Utilities**

```javascript
// utils/format.test.js

import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatPhone } from './format'

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor positivo', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00')
    })
    
    it('deve formatar valor negativo', () => {
      expect(formatCurrency(-500)).toBe('-R$ 500,00')
    })
    
    it('deve formatar zero', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00')
    })
    
    it('deve formatar centavos', () => {
      expect(formatCurrency(10.5)).toBe('R$ 10,50')
    })
  })
  
  describe('formatDate', () => {
    it('deve formatar data ISO', () => {
      expect(formatDate('2025-01-30')).toBe('30/01/2025')
    })
    
    it('deve retornar vazio para data inválida', () => {
      expect(formatDate('invalid')).toBe('')
    })
  })
  
  describe('formatPhone', () => {
    it('deve formatar celular com DDD', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
    })
    
    it('deve formatar telefone fixo', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
    })
  })
})
```

### **Exemplo 4: Testar React Hooks**

```javascript
// hooks/useClientList.test.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useClientList } from './useClientList'
import { ClientService } from '../services/Clients/clients.service'

// Mock do service
vi.mock('../services/Clients/clients.service')

describe('useClientList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('deve carregar clientes na inicialização', async () => {
    const mockClients = [
      { id: '1', name: 'Cliente 1' },
      { id: '2', name: 'Cliente 2' }
    ]
    
    ClientService.listClients = vi.fn().mockResolvedValue(mockClients)
    
    const { result } = renderHook(() => useClientList())
    
    expect(result.current.loading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.clients).toEqual(mockClients)
    expect(result.current.error).toBeNull()
  })
  
  it('deve tratar erro ao carregar', async () => {
    ClientService.listClients = vi.fn().mockRejectedValue(
      new Error('Erro ao carregar')
    )
    
    const { result } = renderHook(() => useClientList())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.error).toBe('Erro ao carregar')
    expect(result.current.clients).toEqual([])
  })
})
```

---

## 🔗 Testes de Integração

### **O que Testar**

- ✅ **Services** - Integração com Firestore
- ✅ **Repositories** - Queries ao banco
- ✅ **Fluxos Completos** - Service → Repository → Firestore

### **Configuração - Firebase Emulator**

```json
// firebase.json

{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "auth": {
      "port": 9099
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

```javascript
// vitest.integration.config.js

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './src/__tests__/integration/setup.js',
    include: ['**/*.integration.test.{js,ts}'],
    testTimeout: 10000
  }
})
```

```javascript
// src/__tests__/integration/setup.js

import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

// Configuração para emulador
const firebaseConfig = {
  projectId: 'test-project',
  apiKey: 'fake-api-key'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Conectar aos emuladores
connectFirestoreEmulator(db, 'localhost', 8080)
connectAuthEmulator(auth, 'http://localhost:9099')

// Exportar para testes
global.db = db
global.auth = auth
```

### **Exemplo: Teste de Integração Completo**

```javascript
// services/Clients/__tests__/clients.integration.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { collection, getDocs, deleteDoc } from 'firebase/firestore'
import { ClientService } from '../clients.service'
import { ClientRepository } from '../../../data/repositories/ClientRepository'

describe('ClientService Integration', () => {
  const testContext = {
    idTenant: 'test-tenant',
    idBranch: 'test-branch'
  }
  
  // Limpar dados antes de cada teste
  beforeEach(async () => {
    await clearTestData()
  })
  
  // Limpar dados após cada teste
  afterEach(async () => {
    await clearTestData()
  })
  
  async function clearTestData() {
    const ref = collection(
      global.db,
      'tenants', testContext.idTenant,
      'branches', testContext.idBranch,
      'clients'
    )
    
    const snap = await getDocs(ref)
    const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
  }
  
  describe('createClient', () => {
    it('deve criar cliente no Firestore', async () => {
      const clientData = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        status: 'lead'
      }
      
      // Criar via service
      const created = await ClientService.createClient(clientData, testContext)
      
      expect(created).toHaveProperty('id')
      expect(created.name).toBe('João Silva')
      expect(created.email).toBe('joao@email.com')
      
      // Verificar se foi salvo no Firestore
      const fromDb = await ClientRepository.findById(created.id, testContext)
      
      expect(fromDb).not.toBeNull()
      expect(fromDb.name).toBe('João Silva')
    })
    
    it('deve rejeitar dados inválidos', async () => {
      const invalidData = {
        name: 'Jo', // Nome muito curto
        email: 'email-invalido'
      }
      
      await expect(
        ClientService.createClient(invalidData, testContext)
      ).rejects.toThrow()
    })
  })
  
  describe('updateClient', () => {
    it('deve atualizar cliente existente', async () => {
      // Criar cliente
      const client = await ClientService.createClient({
        name: 'João Silva',
        email: 'joao@email.com',
        status: 'lead'
      }, testContext)
      
      // Atualizar
      const updated = await ClientService.updateClient(
        client.id,
        { status: 'active' },
        testContext
      )
      
      expect(updated.status).toBe('active')
      
      // Verificar no banco
      const fromDb = await ClientRepository.findById(client.id, testContext)
      expect(fromDb.status).toBe('active')
    })
  })
  
  describe('listClients', () => {
    it('deve listar clientes com filtros', async () => {
      // Criar múltiplos clientes
      await Promise.all([
        ClientService.createClient({ name: 'Cliente 1', email: 'c1@email.com', status: 'active' }, testContext),
        ClientService.createClient({ name: 'Cliente 2', email: 'c2@email.com', status: 'active' }, testContext),
        ClientService.createClient({ name: 'Cliente 3', email: 'c3@email.com', status: 'lead' }, testContext)
      ])
      
      // Listar todos
      const all = await ClientService.listClients({}, testContext)
      expect(all).toHaveLength(3)
      
      // Listar apenas ativos
      const active = await ClientService.listClients({ status: 'active' }, testContext)
      expect(active).toHaveLength(2)
      
      // Listar apenas leads
      const leads = await ClientService.listClients({ status: 'lead' }, testContext)
      expect(leads).toHaveLength(1)
    })
  })
  
  describe('deleteClient', () => {
    it('deve fazer soft delete', async () => {
      const client = await ClientService.createClient({
        name: 'João Silva',
        email: 'joao@email.com'
      }, testContext)
      
      // Deletar
      await ClientService.deleteClient(client.id, testContext)
      
      // Não deve aparecer em listagens
      const clients = await ClientService.listClients({}, testContext)
      expect(clients).toHaveLength(0)
      
      // Mas ainda existe no banco (soft delete)
      const ref = ClientRepository.getDocRef(global.db, testContext, client.id)
      const snap = await getDoc(ref)
      expect(snap.exists()).toBe(true)
      expect(snap.data().deleted).toBe(true)
    })
  })
})
```

---

## 🌐 Testes E2E (End-to-End)

### **O que Testar**

- ✅ **Fluxos Críticos** - Login → Dashboard → Operação
- ✅ **Jornadas de Usuário** - Criar cliente → Criar contrato → Pagamento
- ✅ **Cenários Reais** - Simulação completa de uso

### **Configuração - Playwright**

```javascript
// playwright.config.js

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

### **Exemplo: Teste E2E Completo**

```javascript
// src/__tests__/e2e/client-flow.e2e.test.js

import { test, expect } from '@playwright/test'

test.describe('Fluxo Completo de Cliente', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/academia-teste/unidade-centro/login')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'senha123')
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard')
  })
  
  test('deve criar, editar e deletar cliente', async ({ page }) => {
    // 1. Navegar para clientes
    await page.click('text=Clientes')
    await page.waitForURL('**/clients')
    
    // 2. Abrir formulário de novo cliente
    await page.click('button:has-text("Novo Cliente")')
    
    // 3. Preencher formulário
    await page.fill('[name="name"]', 'João Silva E2E')
    await page.fill('[name="email"]', 'joao.e2e@test.com')
    await page.fill('[name="phone"]', '11999999999')
    await page.selectOption('[name="status"]', 'lead')
    
    // 4. Salvar
    await page.click('button:has-text("Salvar")')
    
    // 5. Verificar toast de sucesso
    await expect(page.locator('.toast-success')).toContainText('Cliente criado')
    
    // 6. Verificar cliente na lista
    await expect(page.locator('text=João Silva E2E')).toBeVisible()
    
    // 7. Abrir perfil do cliente
    await page.click('text=João Silva E2E')
    await page.waitForURL('**/clients/**')
    
    // 8. Editar cliente
    await page.click('button:has-text("Editar")')
    await page.fill('[name="phone"]', '11988888888')
    await page.click('button:has-text("Salvar")')
    
    // 9. Verificar atualização
    await expect(page.locator('text=(11) 98888-8888')).toBeVisible()
    
    // 10. Voltar para lista
    await page.click('text=Clientes')
    
    // 11. Deletar cliente
    await page.click('[data-testid="delete-client-João Silva E2E"]')
    await page.click('button:has-text("Confirmar")')
    
    // 12. Verificar remoção
    await expect(page.locator('text=João Silva E2E')).not.toBeVisible()
  })
  
  test('deve validar formulário de cliente', async ({ page }) => {
    await page.click('text=Clientes')
    await page.click('button:has-text("Novo Cliente")')
    
    // Tentar salvar sem preencher
    await page.click('button:has-text("Salvar")')
    
    // Verificar mensagens de erro
    await expect(page.locator('text=Nome obrigatório')).toBeVisible()
    await expect(page.locator('text=Email ou telefone obrigatório')).toBeVisible()
  })
  
  test('deve buscar cliente', async ({ page }) => {
    await page.click('text=Clientes')
    
    // Digitar na busca
    await page.fill('[placeholder="Buscar cliente"]', 'João')
    
    // Aguardar resultados
    await page.waitForTimeout(500)
    
    // Verificar filtro
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('João')
  })
})
```

---

## ✅ Boas Práticas

### **1. Arrange-Act-Assert (AAA)**

```javascript
test('deve calcular total corretamente', () => {
  // Arrange (Preparar)
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ]
  
  // Act (Agir)
  const total = calculateTotal(items)
  
  // Assert (Verificar)
  expect(total).toBe(250)
})
```

### **2. Testes Independentes**

```javascript
// ❌ Testes dependentes
test('criar cliente', () => {
  client = createClient({ name: 'João' })
})

test('atualizar cliente', () => {
  updateClient(client.id, { name: 'Maria' }) // Depende do teste anterior!
})

// ✅ Testes independentes
test('criar cliente', () => {
  const client = createClient({ name: 'João' })
  expect(client).toHaveProperty('id')
})

test('atualizar cliente', () => {
  const client = createClient({ name: 'João' })
  const updated = updateClient(client.id, { name: 'Maria' })
  expect(updated.name).toBe('Maria')
})
```

### **3. Nomes Descritivos**

```javascript
// ❌ Nome vago
test('teste 1', () => { })

// ✅ Nome descritivo
test('deve retornar erro quando email é inválido', () => { })
```

### **4. Um Conceito por Teste**

```javascript
// ❌ Teste fazendo muitas coisas
test('cliente', () => {
  // Testa criação
  const client = createClient(data)
  expect(client).toBeDefined()
  
  // Testa atualização
  const updated = updateClient(client.id, updates)
  expect(updated.name).toBe('Novo Nome')
  
  // Testa deleção
  deleteClient(client.id)
  const deleted = getClient(client.id)
  expect(deleted).toBeNull()
})

// ✅ Um teste para cada conceito
test('deve criar cliente', () => {
  const client = createClient(data)
  expect(client).toBeDefined()
})

test('deve atualizar cliente', () => {
  const client = createClient(data)
  const updated = updateClient(client.id, updates)
  expect(updated.name).toBe('Novo Nome')
})

test('deve deletar cliente', () => {
  const client = createClient(data)
  deleteClient(client.id)
  const deleted = getClient(client.id)
  expect(deleted).toBeNull()
})
```

### **5. Mocks Apropriados**

```javascript
// Mock de service externo
vi.mock('../services/EmailService', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}))

// Mock de Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      { id: '1', data: () => ({ name: 'Cliente 1' }) }
    ]
  })
}))
```

### **6. Cobertura de Código**

```bash
# Rodar testes com cobertura
npm run test:coverage

# Verificar relatório
open coverage/index.html
```

**Metas de Cobertura:**
- ✅ Business Logic: 90%+
- ✅ Services: 80%+
- ✅ Repositories: 70%+
- ✅ Components: 60%+

---

## 📊 Scripts Package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:integration": "firebase emulators:exec --only firestore 'vitest run --config vitest.integration.config.js'",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 🎯 Checklist de Testes

### **Antes de Fazer PR**

- [ ] Todos os testes unitários passando
- [ ] Todos os testes de integração passando
- [ ] Testes E2E dos fluxos críticos passando
- [ ] Cobertura de código acima de 80%
- [ ] Nenhum teste ignorado (skip/only)
- [ ] Nenhum console.log/debugger

### **Para Cada Feature**

- [ ] Testes unitários para business logic
- [ ] Testes de integração para services
- [ ] Teste E2E para fluxo principal
- [ ] Testes de validação
- [ ] Testes de erro/edge cases

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Framework:** Vitest + Playwright
