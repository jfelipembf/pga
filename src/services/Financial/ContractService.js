import { contractRepository } from '../../data/repositories/ContractRepository'
import { ContractSchema } from '../../data/schemas/Financial/ContractSchema'
import { ContractAuditLogger } from './audit/ContractAuditLogger'
import { normalizeDate } from '../../utils/date'

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
     * Lista apenas contratos ativos para venda
     */
    async listActiveContracts(idTenant, idBranch) {
        return this.listWithFilters(idTenant, idBranch, { isActive: true })
    },

    /**
     * Lista contratos com filtros
     */
    async listWithFilters(idTenant, idBranch, filters = {}) {
        try {
            const whereConditions = []

            if (filters.isActive !== undefined) {
                whereConditions.push(['isActive', '==', filters.isActive])
            }

            if (filters.durationType) {
                whereConditions.push(['durationType', '==', filters.durationType])
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
            await ContractSchema.validate(contractData, { abortEarly: false })

            const newContract = await contractRepository.create(idTenant, idBranch, {
                ...contractData,
                createdAt: normalizeDate(new Date()),
                updatedAt: normalizeDate(new Date()),
                deleted: false,
                deletedAt: null
            })

            await ContractAuditLogger.logCreation({
                idTenant, idBranch, userId,
                userName: contractData.userName,
                entityId: newContract.id,
                title: contractData.title,
                contractData
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
            await ContractSchema.validate(contractData, { abortEarly: false })

            const oldContract = await contractRepository.findById(idTenant, idBranch, idContract)

            const updatedContract = await contractRepository.update(idTenant, idBranch, idContract, {
                ...contractData,
                updatedAt: normalizeDate(new Date())
            })

            await ContractAuditLogger.logUpdate({
                idTenant, idBranch, userId,
                userName: contractData.userName,
                entityId: idContract,
                oldData: oldContract,
                newData: contractData,
                title: contractData.title
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

            await ContractAuditLogger.logDeletion({
                idTenant, idBranch, userId,
                entityId: idContract,
                title: contract.title,
                snapshot: contract
            })

            return true
        } catch (error) {
            console.error('Erro ao deletar contrato:', error)
            throw error
        }
    }
}
