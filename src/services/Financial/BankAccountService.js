import { bankAccountRepository } from "../../data/repositories/BankAccountRepository"
import { BankAccountSchema } from "../../data/schemas/FinancialSchemas"

export const BankAccountService = {

    createAccount: async (idTenant, idBranch, data) => {
        try {
            const validated = await BankAccountSchema.validate(data, { abortEarly: false })
            const payload = {
                ...validated,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            return await bankAccountRepository.create(idTenant, idBranch, payload)
        } catch (error) {
            console.error("BankAccountService error:", error)
            throw error
        }
    },

    listActive: async (idTenant, idBranch) => {
        return await bankAccountRepository.findActive(idTenant, idBranch)
    },

    listAll: async (idTenant, idBranch) => {
        return await bankAccountRepository.findAll(idTenant, idBranch)
    },

    update: async (idTenant, idBranch, id, data) => {
        const payload = { ...data, updatedAt: new Date() }
        return await bankAccountRepository.update(idTenant, idBranch, id, payload)
    },

    deactivate: async (idTenant, idBranch, id) => {
        return await bankAccountRepository.update(idTenant, idBranch, id, {
            isActive: false,
            updatedAt: new Date()
        })
    }
}
