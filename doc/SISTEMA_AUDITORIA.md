# 🔍 Sistema de Auditoria Profissional

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Implementação](#implementação)
4. [Tipos de Eventos](#tipos-de-eventos)
5. [Consultas e Relatórios](#consultas-e-relatórios)
6. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Um sistema de auditoria profissional registra **TODAS** as operações críticas do sistema, permitindo rastreabilidade completa, conformidade legal e debugging avançado.

### **Objetivos**

- ✅ **Rastreabilidade** - Quem fez o quê, quando e por quê
- ✅ **Conformidade** - Atender LGPD e requisitos legais
- ✅ **Segurança** - Detectar acessos não autorizados
- ✅ **Debugging** - Investigar problemas em produção
- ✅ **Analytics** - Entender uso do sistema

### **O que Auditar**

```
✅ SEMPRE auditar:
- Criação, edição, exclusão de registros
- Login/Logout
- Mudanças de permissões
- Operações financeiras
- Acesso a dados sensíveis
- Exportação de dados
- Mudanças de configuração

❌ NÃO auditar:
- Leituras simples (GET)
- Operações de UI (abrir modal, etc)
- Requisições de assets
```

---

## 📊 Estrutura de Dados

### **Schema do Audit Log**

```javascript
// data/schemas/auditLogSchema.js

import { z } from 'zod'

export const auditLogSchema = z.object({
  // Identificação
  id: z.string(),
  timestamp: z.date(),
  
  // Contexto
  idTenant: z.string(),
  idBranch: z.string(),
  
  // Usuário
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  userIp: z.string().optional(),
  userAgent: z.string().optional(),
  
  // Ação
  action: z.enum([
    // CRUD
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    // Auth
    'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE',
    // Financial
    'PAYMENT_CREATED', 'PAYMENT_CANCELLED', 'REFUND_ISSUED',
    // Permissions
    'PERMISSION_GRANTED', 'PERMISSION_REVOKED',
    // Data
    'DATA_EXPORTED', 'DATA_IMPORTED',
    // System
    'CONFIG_CHANGED', 'BACKUP_CREATED'
  ]),
  
  // Entidade afetada
  entityType: z.string(), // 'client', 'contract', 'payment', etc
  entityId: z.string(),
  entityName: z.string().optional(),
  
  // Detalhes
  description: z.string(),
  changes: z.object({
    before: z.record(z.any()).optional(),
    after: z.record(z.any()).optional()
  }).optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  
  // Resultado
  success: z.boolean(),
  errorMessage: z.string().optional(),
  
  // Severidade
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
})

export type AuditLog = z.infer<typeof auditLogSchema>
```

### **Estrutura no Firestore**

```
firestore/
└── tenants/
    └── {idTenant}/
        └── branches/
            └── {idBranch}/
                └── auditLogs/
                    └── {logId}/
                        ├── id: "log_123"
                        ├── timestamp: Timestamp
                        ├── userId: "user_456"
                        ├── action: "CLIENT_UPDATED"
                        ├── entityType: "client"
                        ├── entityId: "CLI-001"
                        ├── changes: { before: {...}, after: {...} }
                        └── ...
```

---

## 🛠️ Implementação

### **1. Audit Service**

```javascript
// services/Audit/audit.service.js

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../data/firebase/config'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'

class AuditService {
  /**
   * Registra um evento de auditoria
   */
  static async log({
    action,
    entityType,
    entityId,
    entityName = null,
    description,
    changes = null,
    metadata = null,
    severity = 'medium',
    success = true,
    errorMessage = null
  }) {
    try {
      // Obter contexto
      const { idTenant, idBranch } = this.getTenantContext()
      const user = this.getUserContext()
      
      // Preparar payload
      const auditLog = {
        // Identificação
        timestamp: serverTimestamp(),
        
        // Contexto
        idTenant,
        idBranch,
        
        // Usuário
        userId: user.uid,
        userName: user.displayName || user.name,
        userEmail: user.email,
        userIp: await this.getUserIp(),
        userAgent: navigator.userAgent,
        
        // Ação
        action,
        
        // Entidade
        entityType,
        entityId,
        entityName,
        
        // Detalhes
        description,
        changes: changes ? {
          before: this.sanitizeData(changes.before),
          after: this.sanitizeData(changes.after)
        } : null,
        
        // Metadata
        metadata,
        
        // Resultado
        success,
        errorMessage,
        severity
      }
      
      // Salvar no Firestore
      const ref = collection(
        db,
        'tenants', idTenant,
        'branches', idBranch,
        'auditLogs'
      )
      
      await addDoc(ref, auditLog)
      
      // Log no console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', action, entityType, entityId)
      }
      
    } catch (error) {
      // NUNCA falhar a operação principal por erro de auditoria
      console.error('[AuditService] Erro ao registrar log:', error)
      
      // Enviar para Sentry
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: { feature: 'audit' }
        })
      }
    }
  }
  
  /**
   * Remove dados sensíveis antes de salvar
   */
  static sanitizeData(data) {
    if (!data) return null
    
    const sanitized = { ...data }
    
    // Remover campos sensíveis
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'creditCard',
      'cvv',
      'ssn',
      'cpf'
    ]
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***'
      }
    })
    
    return sanitized
  }
  
  /**
   * Obtém IP do usuário (via API externa)
   */
  static async getUserIp() {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
  
  /**
   * Helpers para obter contexto
   */
  static getTenantContext() {
    const idTenant = localStorage.getItem('idTenant')
    const idBranch = localStorage.getItem('idBranch')
    
    if (!idTenant || !idBranch) {
      throw new Error('Contexto tenant/branch não encontrado')
    }
    
    return { idTenant, idBranch }
  }
  
  static getUserContext() {
    const authUser = localStorage.getItem('authUser')
    
    if (!authUser) {
      throw new Error('Usuário não autenticado')
    }
    
    return JSON.parse(authUser)
  }
}

export default AuditService
```

### **2. Hook de Auditoria**

```javascript
// hooks/useAuditLog.js

import { useCallback } from 'react'
import AuditService from '../services/Audit/audit.service'

export function useAuditLog() {
  const log = useCallback(async (params) => {
    return AuditService.log(params)
  }, [])
  
  // Helpers para ações comuns
  const logCreate = useCallback((entityType, entityId, data) => {
    return log({
      action: 'CREATE',
      entityType,
      entityId,
      description: `${entityType} criado`,
      changes: { after: data },
      severity: 'medium'
    })
  }, [log])
  
  const logUpdate = useCallback((entityType, entityId, before, after) => {
    return log({
      action: 'UPDATE',
      entityType,
      entityId,
      description: `${entityType} atualizado`,
      changes: { before, after },
      severity: 'medium'
    })
  }, [log])
  
  const logDelete = useCallback((entityType, entityId, data) => {
    return log({
      action: 'DELETE',
      entityType,
      entityId,
      description: `${entityType} deletado`,
      changes: { before: data },
      severity: 'high'
    })
  }, [log])
  
  const logLogin = useCallback(() => {
    return log({
      action: 'LOGIN',
      entityType: 'auth',
      entityId: 'session',
      description: 'Usuário fez login',
      severity: 'low'
    })
  }, [log])
  
  const logLogout = useCallback(() => {
    return log({
      action: 'LOGOUT',
      entityType: 'auth',
      entityId: 'session',
      description: 'Usuário fez logout',
      severity: 'low'
    })
  }, [log])
  
  return {
    log,
    logCreate,
    logUpdate,
    logDelete,
    logLogin,
    logLogout
  }
}
```

### **3. Integração com Services**

```javascript
// services/Clients/clients.service.js

import { ClientRepository } from '../../data/repositories/ClientRepository'
import { validateClientData } from '../../business/Clients/ClientValidator'
import AuditService from '../Audit/audit.service'

export class ClientService {
  /**
   * Cria cliente com auditoria automática
   */
  static async createClient(data) {
    // 1. Validar
    const validation = validateClientData(data)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }
    
    try {
      // 2. Salvar
      const client = await ClientRepository.create(data)
      
      // 3. Auditar SUCESSO
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
      
      return client
      
    } catch (error) {
      // 4. Auditar ERRO
      await AuditService.log({
        action: 'CREATE',
        entityType: 'client',
        entityId: 'unknown',
        description: `Falha ao criar cliente`,
        changes: { after: data },
        severity: 'high',
        success: false,
        errorMessage: error.message
      })
      
      throw error
    }
  }
  
  /**
   * Atualiza cliente com auditoria de mudanças
   */
  static async updateClient(id, updates) {
    try {
      // 1. Buscar estado anterior
      const before = await ClientRepository.findById(id)
      
      if (!before) {
        throw new Error('Cliente não encontrado')
      }
      
      // 2. Atualizar
      const after = await ClientRepository.update(id, updates)
      
      // 3. Auditar com diff
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'client',
        entityId: id,
        entityName: after.name,
        description: `Cliente "${after.name}" atualizado`,
        changes: {
          before: this.extractChangedFields(before, updates),
          after: this.extractChangedFields(after, updates)
        },
        severity: 'medium',
        success: true
      })
      
      return after
      
    } catch (error) {
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'client',
        entityId: id,
        description: `Falha ao atualizar cliente`,
        severity: 'high',
        success: false,
        errorMessage: error.message
      })
      
      throw error
    }
  }
  
  /**
   * Extrai apenas campos que mudaram
   */
  static extractChangedFields(obj, updates) {
    const changed = {}
    
    Object.keys(updates).forEach(key => {
      if (obj[key] !== updates[key]) {
        changed[key] = obj[key]
      }
    })
    
    return changed
  }
}
```

---

## 📝 Tipos de Eventos

### **Eventos de CRUD**

```javascript
// Cliente criado
{
  action: 'CREATE',
  entityType: 'client',
  entityId: 'CLI-001',
  description: 'Cliente "João Silva" criado',
  changes: {
    after: { name: 'João Silva', email: 'joao@email.com', ... }
  }
}

// Cliente atualizado
{
  action: 'UPDATE',
  entityType: 'client',
  entityId: 'CLI-001',
  description: 'Cliente "João Silva" atualizado',
  changes: {
    before: { status: 'lead', phone: '11999999999' },
    after: { status: 'active', phone: '11988888888' }
  }
}

// Cliente deletado
{
  action: 'DELETE',
  entityType: 'client',
  entityId: 'CLI-001',
  description: 'Cliente "João Silva" deletado',
  changes: {
    before: { name: 'João Silva', status: 'inactive', ... }
  }
}
```

### **Eventos Financeiros**

```javascript
// Pagamento criado
{
  action: 'PAYMENT_CREATED',
  entityType: 'payment',
  entityId: 'PAY-001',
  description: 'Pagamento de R$ 500,00 criado',
  metadata: {
    amount: 500,
    method: 'credit_card',
    installments: 3,
    clientId: 'CLI-001'
  },
  severity: 'high'
}

// Pagamento cancelado
{
  action: 'PAYMENT_CANCELLED',
  entityType: 'payment',
  entityId: 'PAY-001',
  description: 'Pagamento de R$ 500,00 cancelado',
  metadata: {
    reason: 'Solicitação do cliente',
    refundAmount: 500
  },
  severity: 'critical'
}
```

### **Eventos de Autenticação**

```javascript
// Login bem-sucedido
{
  action: 'LOGIN',
  entityType: 'auth',
  entityId: 'session_123',
  description: 'Login realizado com sucesso',
  severity: 'low',
  success: true
}

// Tentativa de login falha
{
  action: 'LOGIN',
  entityType: 'auth',
  entityId: 'session_failed',
  description: 'Tentativa de login falhou',
  severity: 'medium',
  success: false,
  errorMessage: 'Senha incorreta'
}

// Mudança de senha
{
  action: 'PASSWORD_CHANGE',
  entityType: 'user',
  entityId: 'user_456',
  description: 'Senha alterada',
  severity: 'high',
  success: true
}
```

### **Eventos de Permissões**

```javascript
// Permissão concedida
{
  action: 'PERMISSION_GRANTED',
  entityType: 'user',
  entityId: 'user_456',
  description: 'Permissão "admin" concedida',
  changes: {
    before: { roles: ['instructor'] },
    after: { roles: ['instructor', 'admin'] }
  },
  severity: 'critical'
}
```

### **Eventos de Dados**

```javascript
// Exportação de dados
{
  action: 'DATA_EXPORTED',
  entityType: 'report',
  entityId: 'export_789',
  description: 'Relatório de clientes exportado',
  metadata: {
    format: 'xlsx',
    recordCount: 150,
    filters: { status: 'active' }
  },
  severity: 'high'
}
```

---

## 📊 Consultas e Relatórios

### **Repository de Audit Logs**

```javascript
// data/repositories/AuditLogRepository.js

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

export class AuditLogRepository {
  /**
   * Lista logs com filtros
   */
  static async findAll(filters = {}) {
    const { idTenant, idBranch } = this.getTenantContext()
    
    const ref = collection(
      db,
      'tenants', idTenant,
      'branches', idBranch,
      'auditLogs'
    )
    
    let q = query(ref, orderBy('timestamp', 'desc'))
    
    // Filtro por usuário
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId))
    }
    
    // Filtro por ação
    if (filters.action) {
      q = query(q, where('action', '==', filters.action))
    }
    
    // Filtro por entidade
    if (filters.entityType) {
      q = query(q, where('entityType', '==', filters.entityType))
    }
    
    if (filters.entityId) {
      q = query(q, where('entityId', '==', filters.entityId))
    }
    
    // Filtro por severidade
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity))
    }
    
    // Filtro por sucesso/erro
    if (filters.success !== undefined) {
      q = query(q, where('success', '==', filters.success))
    }
    
    // Limite
    if (filters.limit) {
      q = query(q, limit(filters.limit))
    }
    
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
  
  /**
   * Busca histórico de uma entidade específica
   */
  static async findByEntity(entityType, entityId) {
    return this.findAll({ entityType, entityId })
  }
  
  /**
   * Busca ações de um usuário
   */
  static async findByUser(userId, limitTo = 100) {
    return this.findAll({ userId, limit: limitTo })
  }
  
  /**
   * Busca logs críticos
   */
  static async findCritical(limitTo = 50) {
    return this.findAll({ severity: 'critical', limit: limitTo })
  }
  
  /**
   * Busca erros
   */
  static async findErrors(limitTo = 50) {
    return this.findAll({ success: false, limit: limitTo })
  }
}
```

### **Hook para Consultas**

```javascript
// hooks/useAuditLogs.js

import { useState, useEffect } from 'react'
import { AuditLogRepository } from '../data/repositories/AuditLogRepository'

export function useAuditLogs(filters = {}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    loadLogs()
  }, [JSON.stringify(filters)])
  
  async function loadLogs() {
    try {
      setLoading(true)
      const data = await AuditLogRepository.findAll(filters)
      setLogs(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return { logs, loading, error, refresh: loadLogs }
}
```

---

## ✅ Boas Práticas

### **1. Sempre Auditar Operações Críticas**

```javascript
// ❌ Sem auditoria
async function deleteClient(id) {
  await ClientRepository.delete(id)
}

// ✅ Com auditoria
async function deleteClient(id) {
  const client = await ClientRepository.findById(id)
  await ClientRepository.delete(id)
  
  await AuditService.log({
    action: 'DELETE',
    entityType: 'client',
    entityId: id,
    entityName: client.name,
    description: `Cliente "${client.name}" deletado`,
    changes: { before: client },
    severity: 'high'
  })
}
```

### **2. Registrar Antes e Depois**

```javascript
// ✅ Capturar estado antes e depois
const before = await getClient(id)
const after = await updateClient(id, updates)

await auditLog({
  action: 'UPDATE',
  changes: { before, after }
})
```

### **3. Sanitizar Dados Sensíveis**

```javascript
// ✅ Remover dados sensíveis
function sanitize(data) {
  const clean = { ...data }
  delete clean.password
  delete clean.creditCard
  delete clean.ssn
  return clean
}

await auditLog({
  changes: {
    before: sanitize(before),
    after: sanitize(after)
  }
})
```

### **4. Severidade Apropriada**

```javascript
// Operações normais
severity: 'low'    // Login, logout, leituras

// Operações importantes
severity: 'medium' // CRUD de dados

// Operações críticas
severity: 'high'   // Deleções, mudanças financeiras

// Operações de segurança
severity: 'critical' // Mudanças de permissões, exportação de dados
```

### **5. Descrições Claras**

```javascript
// ❌ Descrição vaga
description: 'Atualização realizada'

// ✅ Descrição específica
description: 'Cliente "João Silva" teve status alterado de "lead" para "active"'
```

### **6. Metadata Útil**

```javascript
// ✅ Adicionar contexto relevante
metadata: {
  source: 'web_app',
  feature: 'client_management',
  duration: 150, // ms
  affectedRecords: 5
}
```

### **7. Nunca Falhar Operação Principal**

```javascript
try {
  // Operação principal
  const result = await saveData(data)
  
  // Auditoria (não deve falhar a operação)
  try {
    await auditLog({ ... })
  } catch (auditError) {
    console.error('Erro ao auditar:', auditError)
    // NÃO propagar o erro
  }
  
  return result
} catch (error) {
  throw error
}
```

---

## 📈 Relatórios Úteis

### **1. Atividade por Usuário**

```javascript
const userActivity = await AuditLogRepository.findByUser(userId, 100)
console.log(`Usuário realizou ${userActivity.length} ações`)
```

### **2. Histórico de Entidade**

```javascript
const clientHistory = await AuditLogRepository.findByEntity('client', 'CLI-001')
// Mostra todas as mudanças no cliente
```

### **3. Logs Críticos**

```javascript
const critical = await AuditLogRepository.findCritical(50)
// Mudanças de permissões, deleções, etc
```

### **4. Erros Recentes**

```javascript
const errors = await AuditLogRepository.findErrors(50)
// Operações que falharam
```

---

## 🔒 Conformidade LGPD

### **Direitos do Titular**

```javascript
// Exportar dados do usuário (direito de portabilidade)
async function exportUserData(userId) {
  const logs = await AuditLogRepository.findByUser(userId)
  
  // Auditar a exportação
  await AuditService.log({
    action: 'DATA_EXPORTED',
    entityType: 'user',
    entityId: userId,
    description: 'Dados do usuário exportados (LGPD)',
    severity: 'critical'
  })
  
  return logs
}

// Deletar dados do usuário (direito ao esquecimento)
async function deleteUserData(userId) {
  // Auditar ANTES de deletar
  await AuditService.log({
    action: 'DATA_DELETED',
    entityType: 'user',
    entityId: userId,
    description: 'Dados do usuário deletados (LGPD - Direito ao Esquecimento)',
    severity: 'critical'
  })
  
  // Deletar dados
  await UserRepository.delete(userId)
}
```

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Conformidade:** LGPD
