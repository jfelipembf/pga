import { acquirerRepository } from "../../data/repositories/AcquirerRepository"
import { AcquirerSchema } from "../../data/schemas/FinancialSchemas"
import { AcquirerAuditLogger } from "./audit/AcquirerAuditLogger"
import { AcquirerRules } from "./domain/AcquirerRules"
import { normalizeDate } from "../../utils/date"

export const AcquirerService = {

    createAcquirer: async (idTenant, idBranch, userId, data) => {
        const validated = await AcquirerSchema.validate(data, { abortEarly: false })
        const payload = {
            ...validated,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
            deletedAt: null
        }
        const newAcquirer = await acquirerRepository.create(idTenant, idBranch, payload)

        await AcquirerAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: newAcquirer.id,
            acquirerName: data.name
        })

        return newAcquirer
    },

    listActive: async (idTenant, idBranch) => {
        return await acquirerRepository.findActive(idTenant, idBranch)
    },

    listAll: async (idTenant, idBranch) => {
        const data = await acquirerRepository.findAll(idTenant, idBranch)
        return data.filter(a => !a.deletedAt)
    },

    update: async (idTenant, idBranch, userId, id, data) => {
        const oldData = await acquirerRepository.findById(idTenant, idBranch, id)

        const payload = { ...data, updatedAt: normalizeDate(new Date()) }
        const result = await acquirerRepository.update(idTenant, idBranch, id, payload)

        await AcquirerAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData: payload
        })

        return result
    },

    deactivate: async (idTenant, idBranch, userId, id) => {
        const result = await acquirerRepository.update(idTenant, idBranch, id, {
            isActive: false,
            updatedAt: normalizeDate(new Date())
        })

        await AcquirerAuditLogger.logDeactivation({
            idTenant, idBranch, userId,
            entityId: id
        })

        return result
    },

    delete: async (idTenant, idBranch, userId, id) => {
        await AcquirerRules.validateForDeletion(idTenant, idBranch, id)

        const acquirer = await acquirerRepository.findById(idTenant, idBranch, id)
        const result = await acquirerRepository.softDelete(idTenant, idBranch, id, userId)

        await AcquirerAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            entityId: id,
            snapshot: acquirer
        })

        return result
    }
}
