# 📐 ARCHITECTURE - Estrutura de Serviços

## Visão Geral

Este documento descreve a arquitetura de serviços do sistema PGA Admin.

```
services/
├── Core/           # Serviços base compartilhados
├── Admin/          # Cadastros administrativos
├── Classes/        # Turmas e Aulas
├── Clients/        # Clientes
├── Dashboard/      # Dashboards
├── Evaluations/    # Avaliações
├── Events/         # Eventos
├── External/       # Integrações externas
├── Financial/      # Financeiro
├── Ledger/         # Contabilidade
└── Sales/          # Vendas
```

---

## 📏 PADRÃO DE SERVIÇO

### Estrutura Obrigatória

```javascript
import { someRepository } from '../../data/repositories/SomeRepository'
import { SomeSchema } from '../../data/schemas/SomeSchema'
import { AuditService } from '../Core/AuditService'

/**
 * Descrição do serviço.
 * O que ele gerencia e qual o domínio de responsabilidade.
 */
export const SomeService = {
    /**
     * Descrição do método.
     * @param {string} idTenant - ID do tenant
     * @param {string} idBranch - ID da filial
     * @param {string} userId - ID do usuário logado
     * @param {object} data - Dados de entrada
     * @returns {Promise<object>} - Retorno esperado
     */
    create: async (idTenant, idBranch, userId, data) => {
        // 1. Validação com Schema
        const validated = await SomeSchema.validate(data, { abortEarly: false })

        // 2. Lógica de negócio
        // (verificações, cálculos, etc)

        // 3. Persistência via Repository
        const result = await someRepository.create(idTenant, idBranch, validated)

        // 4. Auditoria
        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName || 'Sistema',
            action: 'ENTITY_CREATED',
            entityType: 'entity',
            entityId: result.id,
            description: 'Descrição da ação',
            details: { ...data }
        })

        // 5. Retorno
        return result
    },

    // Outros métodos...
}
```

### Regras de Tamanho

| Métrica | Limite | Ação |
|---------|--------|------|
| Linhas por arquivo | < 300 | Dividir em sub-serviços |
| Linhas por método | < 50 | Extrair helpers |
| Responsabilidades | 1 domínio | Criar novo serviço |

---

## 📊 STATUS DOS SERVIÇOS

### ✅ Dentro do Padrão (<300 linhas)

| Serviço | Linhas | Status |
|---------|--------|--------|
| AuditService | 116 | ✅ |
| SessionService | 116 | ✅ |
| StorageService | ~100 | ✅ |
| BankAccountService | 155 | ✅ |
| CashierService | 189 | ✅ |
| StaffService | 159 | ✅ |
| CatalogService | 162 | ✅ |
| EvaluationService | 177 | ✅ |
| AttendanceService | 268 | ✅ |
| ActivityService | 278 | ✅ |

### ⚠️ Grandes mas Aceitáveis (300-400 linhas)

| Serviço | Linhas | Justificativa |
|---------|--------|---------------|
| EnrollmentService | 303 | Domínio complexo (matrícula + sessões) |
| ClassService | 313 | Geração de grade + sessões |
| ClientService | 325 | CRUD + lifecycle |
| SalesService | 343 | Processamento de vendas |
| ReceivableService | 368 | Contas a receber + parcelas |

### 🔴 Candidatos a Refatoração (>400 linhas)

| Serviço | Linhas | Proposta |
|---------|--------|----------|
| LedgerService | 466 | ✅ OK - Domínio contábil é inerentemente complexo |
| ClientContractService | 465 | ⚠️ Dividir: ContractLifecycleService + ContractCancellationService |

---

## 📁 Domínios

### Core (Serviços Base)
- **AuditService**: Log de auditoria
- **StorageService**: Upload de arquivos
- **SessionCounterFixer**: Ferramenta de manutenção

### Admin (Cadastros)
- **ActivityService**: Atividades/Modalidades
- **AreaService**: Áreas/Espaços
- **CatalogService**: Catálogo de produtos
- **EvaluationLevelService**: Níveis de avaliação
- **RoleService**: Cargos/Perfis
- **StaffService**: Colaboradores

### Classes (Turmas/Aulas)
- **ClassService**: Gestão de turmas (grade)
- **SessionService**: Sessões individuais
- **AttendanceService**: Controle de presença

### Clients (Clientes)
- **ClientService**: CRUD e lifecycle
- **EnrollmentService**: Matrículas
- **ClientContractService**: Contratos de clientes

### Financial (Financeiro)
- **CashierService**: Caixa
- **ContractService**: Planos/Templates
- **ReceivableService**: Contas a receber
- **PayableService**: Contas a pagar
- **BankAccountService**: Contas bancárias
- **AcquirerService**: Adquirentes (Stone, etc)

---

## Changelog

- **2026-02-05**: Reestruturação completa
  - Criado Core/ com AuditService, StorageService, SessionCounterFixer
  - Consolidado Admin/ com index.js
  - Removidas pastas legadas (Activity, Areas, Staff, Roles, Maintenance)
  - Criado AttendanceService e SessionService
