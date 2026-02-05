import { contractRepository } from '../../data/repositories/ContractRepository'
import { ContractSchema } from '../../data/schemas/Financial/ContractSchema'
import { AuditService } from '../Core/AuditService'

/**
 * Serviço de Contratos (Planos)
 * Segue o padrão: Repository -> Schema -> Service -> Hook
 */
export const ContractService = {
    /**
     * Lista todos os contratos
     */
    async listAllContracts(idTenant, idBranch) {
        try {
            const contracts = await contractRepository.findAll(idTenant, idBranch)
            return contracts.filter(c => !c.deleted)
        } catch (error) {
            console.error('Erro ao listar contratos:', error)
            throw error
        }
    },

    /**
     * Lista contratos com filtros
     */
    async listWithFilters(idTenant, idBranch, filters = {}) {
        try {
            const whereConditions = []
            
            if (filters.isActive !== undefined) {
                whereConditions.push({ field: 'isActive', operator: '==', value: filters.isActive })
            }
            
            if (filters.durationType) {
                whereConditions.push({ field: 'durationType', operator: '==', value: filters.durationType })
            }

            const contracts = await contractRepository.findWhere(idTenant, idBranch, whereConditions)
            return contracts.filter(c => !c.deleted)
        } catch (error) {
            console.error('Erro ao listar contratos com filtros:', error)
            throw error
        }
    },

    /**
     * Busca contrato por ID
     */
    async getContractById(idTenant, idBranch, idContract) {
        try {
            return await contractRepository.findById(idTenant, idBranch, idContract)
        } catch (error) {
            console.error('Erro ao buscar contrato:', error)
            throw error
        }
    },

    /**
     * Cria novo contrato
     */
    async createContract(idTenant, idBranch, userId, contractData) {
        try {
            // Validação com schema
            await ContractSchema.validate(contractData, { abortEarly: false })

            const newContract = await contractRepository.create(idTenant, idBranch, {
                ...contractData,
                createdAt: new Date(),
                updatedAt: new Date(),
                deleted: false,
                deletedAt: null
            })

            // Auditoria
            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName: contractData.userName || 'Sistema',
                action: 'CONTRACT_CREATED',
                entityType: 'contract',
                entityId: newContract.id,
                entityName: contractData.title,
                changes: { created: contractData }
            })

            return newContract
        } catch (error) {
            console.error('Erro ao criar contrato:', error)
            throw error
        }
    },

    /**
     * Atualiza contrato existente
     */
    async updateContract(idTenant, idBranch, userId, idContract, contractData) {
        try {
            // Validação com schema
            await ContractSchema.validate(contractData, { abortEarly: false })

            const oldContract = await contractRepository.findById(idTenant, idBranch, idContract)

            const updatedContract = await contractRepository.update(idTenant, idBranch, idContract, {
                ...contractData,
                updatedAt: new Date()
            })

            // Auditoria
            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName: contractData.userName || 'Sistema',
                action: 'CONTRACT_UPDATED',
                entityType: 'contract',
                entityId: idContract,
                entityName: contractData.title,
                changes: {
                    before: oldContract,
                    after: updatedContract
                }
            })

            return updatedContract
        } catch (error) {
            console.error('Erro ao atualizar contrato:', error)
            throw error
        }
    },

    /**
     * Deleta contrato (soft delete)
     */
    async deleteContract(idTenant, idBranch, userId, idContract) {
        try {
            const contract = await contractRepository.findById(idTenant, idBranch, idContract)

            await contractRepository.softDelete(idTenant, idBranch, idContract)

            // Auditoria
            await AuditService.log({
                idTenant,
                idBranch,
                userId,
                userName: 'Sistema',
                action: 'CONTRACT_DELETED',
                entityType: 'contract',
                entityId: idContract,
                entityName: contract.title,
                changes: { deleted: true }
            })

            return true
        } catch (error) {
            console.error('Erro ao deletar contrato:', error)
            throw error
        }
    }
}
