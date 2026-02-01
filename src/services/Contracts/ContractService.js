import { contractRepository } from "../../data/repositories/ContractRepository"
import { ContractSchema } from "../../data/schemas/FinancialSchemas"

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
    createContract: async (idTenant, idBranch, contractData) => {
        try {
            // 1. Validação (Blindagem)
            const validatedData = await ContractSchema.validate(contractData, { abortEarly: false })

            // 2. Preparação dos dados
            const payload = {
                ...validatedData,
                type: 'contract', // ✅ Define tipo para identificação nas vendas
                createdAt: new Date(),
                updatedAt: new Date(),
                deleted: false
            }

            // 3. Persistência
            return await contractRepository.create(idTenant, idBranch, payload)

        } catch (error) {
            console.error("ContractService.createContract error:", error)
            throw error // Repassa erro para UI lidar (Toast)
        }
    },

    /**
     * Atualiza um contrato existente
     */
    updateContract: async (idTenant, idBranch, idContract, changes) => {
        try {
            // Valida apenas os campos que estão sendo alterados
            // Em uma implementação mais estrita, validaríamos o objeto inteiro resultante

            const payload = {
                ...changes,
                updatedAt: new Date()
            }

            return await contractRepository.update(idTenant, idBranch, idContract, payload)
        } catch (error) {
            console.error("ContractService.updateContract error:", error)
            throw error
        }
    },

    /**
     * Lista contratos ativos para o Select de Vendas
     */
    listActiveContracts: async (idTenant, idBranch) => {
        return await contractRepository.findActiveContracts(idTenant, idBranch)
    },

    /**
     * Lista todos (incluindo desativados, mas não deletados) para Gestão
     */
    listAllContracts: async (idTenant, idBranch) => {
        return await contractRepository.findAll(idTenant, idBranch)
    },

    /**
     * Soft Delete (apenas marca como deletado)
     */
    deleteContract: async (idTenant, idBranch, idContract) => {
        return await contractRepository.update(idTenant, idBranch, idContract, {
            deleted: true,
            isActive: false,
            updatedAt: new Date()
        })
    }
}
