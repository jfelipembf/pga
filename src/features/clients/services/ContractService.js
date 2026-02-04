import { contractRepository } from "../repositories/ContractRepository"
import { ContractSchema } from "../../../data/schemas/FinancialSchemas"
import { AuditService } from "../../../services/Audit/AuditService"
import { normalizeDate } from "../../../utils/date"

/**
 * Service Layer para Contratos.
 * Responsável por:
 * 1. Validar dados usando Schemas (Blindagem)
 * 2. Aplicar regras de negócio (ex: não permitir valor negativo)
 * 3. Chamar o Repositório para persistência
 */
export const ContractService = {

    /**
     * Cria um novo contrato/plano
     */
    createContract: async (idTenant, idBranch, userId, contractData) => {
        try {
            // 1. Validação (Blindagem)
            const validatedData = await ContractSchema.validate(contractData, { abortEarly: false })

            // 3. Persistência
            const newPlan = await contractRepository.create(idTenant, idBranch, {
                ...validatedData,
                type: 'contract',
                createdAt: normalizeDate(new Date()),
                updatedAt: normalizeDate(new Date()),
                deletedAt: null
            })

            await AuditService.log({
                idTenant, idBranch, userId,
                userName: contractData.userName,
                action: 'PLAN_CREATED',
                entityType: 'plan',
                entityId: newPlan.id,
                description: `Novo plano/contrato criado: ${contractData.title}`
            });

            return newPlan

        } catch (error) {
            console.error("ContractService.createContract error:", error)
            throw error // Repassa erro para UI lidar (Toast)
        }
    },

    /**
     * Atualiza um contrato existente
     */
    updateContract: async (idTenant, idBranch, userId, idContract, changes) => {
        try {
            // Valida apenas os campos que estão sendo alterados
            // Em uma implementação mais estrita, validaríamos o objeto inteiro resultante

            const payload = {
                ...changes,
                updatedAt: normalizeDate(new Date())
            }

            const result = await contractRepository.update(idTenant, idBranch, idContract, payload)

            await AuditService.log({
                idTenant, idBranch, userId,
                userName: changes.userName,
                action: 'PLAN_UPDATED',
                entityType: 'plan',
                entityId: idContract,
                description: `Plano atualizado: ${changes.title || idContract}`
            });

            return result
        } catch (error) {
            console.error("ContractService.updateContract error:", error)
            throw error
        }
    },

    /**
     * Lista contratos ativos para o Select de Vendas
     */
    listActiveContracts: async (idTenant, idBranch) => {
        return await contractRepository.findActivePlans(idTenant, idBranch)
    },

    /**
     * Lista todos (incluindo desativados, mas não deletados) para Gestão
     */
    listAllContracts: async (idTenant, idBranch) => {
        return await contractRepository.findVisiblePlans(idTenant, idBranch)
    },

    /**
     * Soft Delete (apenas marca como deletado)
     */
    deleteContract: async (idTenant, idBranch, userId, idContract) => {
        // 1. CHECK: Existem alunos usando este plano?
        const { clientContractRepository } = await import('../repositories/ClientContractRepository')
        const usages = await clientContractRepository.findWhere(idTenant, idBranch, [
            ['idPlan', '==', idContract],
            ['status', '==', 'active']
        ])

        if (usages.length > 0) {
            throw new Error(`SEGURANÇA: Este plano possui ${usages.length} contratos de alunos ativos. Você deve cancelar ou migrar os alunos antes de excluir o plano. Sugestão: Apenas desative o plano (isActive = false).`)
        }

        // 2. Soft Delete
        const result = await contractRepository.softDelete(idTenant, idBranch, idContract, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'PLAN_DELETED',
            entityType: 'plan',
            entityId: idContract,
            description: `Plano excluído (soft delete).`
        });

        return result
    }
}
