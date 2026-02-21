import { areaRepository } from '../../data/repositories/AreaRepository'
import { AreaAuditLogger } from './audit/AreaAuditLogger'
import { AreaRules } from './domain/AreaRules'

/**
 * Serviço para Gestão de Áreas/Espaços
 */
export const AreaService = {
    /**
     * Lista todas as áreas de uma unidade (excluindo deletadas)
     */
    listAreas: async (idTenant, idBranch) => {
        const allAreas = await areaRepository.findAll(idTenant, idBranch)
        return allAreas.filter(a => !a.deletedAt)
    },

    /**
     * Salva ou atualiza uma área
     */
    saveArea: async (idTenant, idBranch, userId, data) => {
        const isUpdate = !!data.id
        let result
        let oldData = null

        if (isUpdate) {
            oldData = await areaRepository.findById(idTenant, idBranch, data.id)
            const { id, ...updateData } = data
            await areaRepository.update(idTenant, idBranch, id, updateData)
            result = { id, ...updateData }
        } else {
            const id = await areaRepository.create(idTenant, idBranch, data)
            result = { id, ...data }
        }

        // Auditoria
        if (isUpdate) {
            await AreaAuditLogger.logUpdate({
                idTenant, idBranch, userId,
                userName: data.userName,
                entityId: data.id,
                oldData,
                newData: data,
                areaName: result.name
            })
        } else {
            await AreaAuditLogger.logCreation({
                idTenant, idBranch, userId,
                userName: data.userName,
                entityId: result.id,
                areaName: result.name
            })
        }

        return result
    },

    /**
     * Remove uma área (Soft Delete)
     */
    deleteArea: async (idTenant, idBranch, userId, area, userName) => {
        AreaRules.validateForDeletion(area)

        await areaRepository.softDelete(idTenant, idBranch, area.id, userId)

        await AreaAuditLogger.logDeletion({
            idTenant, idBranch, userId, userName,
            entityId: area.id,
            areaName: area.name,
            snapshot: area
        })

        return true
    }
}
