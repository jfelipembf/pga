import { acquirerRepository } from "../../data/repositories/AcquirerRepository"
import { AcquirerSchema } from "../../data/schemas/FinancialSchemas"

export const AcquirerService = {

    createAcquirer: async (idTenant, idBranch, data) => {
        try {
            const validated = await AcquirerSchema.validate(data, { abortEarly: false })
            const payload = {
                ...validated,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            return await acquirerRepository.create(idTenant, idBranch, payload)
        } catch (error) {
            console.error("AcquirerService error:", error)
            throw error
        }
    },

    listActive: async (idTenant, idBranch) => {
        return await acquirerRepository.findActive(idTenant, idBranch)
    },

    listAll: async (idTenant, idBranch) => {
        return await acquirerRepository.findAll(idTenant, idBranch)
    },

    update: async (idTenant, idBranch, id, data) => {
        const payload = { ...data, updatedAt: new Date() }
        return await acquirerRepository.update(idTenant, idBranch, id, payload)
    }
}
