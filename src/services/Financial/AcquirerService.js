import { acquirerRepository } from "../../data/repositories/AcquirerRepository"
import { AcquirerSchema } from "../../data/schemas/FinancialSchemas"
import { AuditService } from "../Core/AuditService"
import { normalizeDate } from "../../utils/date"

export const AcquirerService = {

    createAcquirer: async (idTenant, idBranch, userId, data) => {
        try {
            const validated = await AcquirerSchema.validate(data, { abortEarly: false })
            const payload = {
                ...validated,
                createdAt: normalizeDate(new Date()),
                updatedAt: normalizeDate(new Date()),
                deletedAt: null
            }
            const newAcquirer = await acquirerRepository.create(idTenant, idBranch, payload)

            await AuditService.log({
                idTenant, idBranch, userId,
                userName: data.userName,
                action: 'ACQUIRER_CREATED',
                entityType: 'acquirer',
                entityId: newAcquirer.id,
                description: `Nova credenciadora configurada: ${data.name}`
            });

            return newAcquirer
        } catch (error) {
            console.error("AcquirerService error:", error)
            throw error
        }
    },

    listActive: async (idTenant, idBranch) => {
        return await acquirerRepository.findActive(idTenant, idBranch)
    },

    listAll: async (idTenant, idBranch) => {
        const data = await acquirerRepository.findAll(idTenant, idBranch)
        return data.filter(a => !a.deletedAt)
    },

    update: async (idTenant, idBranch, userId, id, data) => {
        // 1. Snapshot
        const oldData = await acquirerRepository.findById(idTenant, idBranch, id)

        const payload = { ...data, updatedAt: normalizeDate(new Date()) }
        const result = await acquirerRepository.update(idTenant, idBranch, id, payload)

        await AuditService.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityType: 'acquirer',
            entityId: id,
            oldData,
            newData: payload,
            description: `Configuração da credenciadora atualizada: ${data.name || id}`
        });

        return result
    },

    deactivate: async (idTenant, idBranch, userId, id) => {
        const result = await acquirerRepository.update(idTenant, idBranch, id, {
            isActive: false,
            updatedAt: normalizeDate(new Date())
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'ACQUIRER_DEACTIVATED',
            entityType: 'acquirer',
            entityId: id,
            description: `Credenciadora desativada.`
        });

        return result
    },

    delete: async (idTenant, idBranch, userId, id) => {
        // 1. CHECK: Tem recebíveis pendentes?
        const { receivableRepository } = await import('../../data/repositories/ReceivableRepository')
        const pending = await receivableRepository.findWhere(idTenant, idBranch, [
            ['idAcquirer', '==', id],
            ['status', '==', 'open']
        ], null, 1)

        if (pending.length > 0) {
            throw new Error("SEGURANÇA: Esta credenciadora possui recebíveis pendentes. Você não pode excluí-la até que todos os títulos sejam liquidados ou transferidos. Sugestão: Apenas desative a credenciadora.")
        }

        const result = await acquirerRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            action: 'ACQUIRER_DELETED',
            entityType: 'acquirer',
            entityId: id,
            description: `Credenciadora excluída (soft delete).`,
            details: {
                snapshot: await acquirerRepository.findById(idTenant, idBranch, id) // Fetch if needed or assume we can't reliably get it if simple delete. But here we can fetch before delete if we want. But let's assume simple log for delete is ok OR enhance. Let's enhance.
                // Actually, AcquirerService.delete doesn't fetch 'acquirer' first in my previous view_file. Let's fetch it for snapshot.
            }
        });

        return result
    }
}
