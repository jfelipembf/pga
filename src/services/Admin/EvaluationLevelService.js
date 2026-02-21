import { evaluationLevelRepository } from '../../data/repositories/EvaluationLevelRepository'
import { EvaluationLevelAuditLogger } from './audit/EvaluationLevelAuditLogger'
import { EvaluationLevelRules } from './domain/EvaluationLevelRules'
import { EvaluationLevelSchema } from '../../data/schemas/Admin/EvaluationLevelSchema'
import { normalizeDate } from '../../utils/date'

/**
 * Serviço para Gestão de Níveis de Avaliação
 */
export const EvaluationLevelService = {
    /**
     * Cria um novo nível de avaliação
     */
    createLevel: async (idTenant, idBranch, userId, levelData) => {
        await EvaluationLevelSchema.validate(levelData, { abortEarly: false })

        const payload = EvaluationLevelRules.buildCreationPayload(levelData, userId)

        const newLevel = await evaluationLevelRepository.create(idTenant, idBranch, {
            ...payload,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        })

        await EvaluationLevelAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: levelData.userName,
            entityId: newLevel.id,
            title: levelData.title,
            value: levelData.value
        })

        return newLevel
    },

    /**
     * Lista todos os níveis de avaliação ordenados
     */
    listAll: async (idTenant, idBranch) => {
        return await evaluationLevelRepository.findAllOrdered(idTenant, idBranch)
    },

    /**
     * Lista níveis com filtros
     */
    listWithFilters: async (idTenant, idBranch, filters = {}, limitCount = 100) => {
        const allLevels = await evaluationLevelRepository.findAllOrdered(idTenant, idBranch)

        let levels = allLevels.filter(level => !level.deletedAt)

        if (filters.isActive !== undefined) {
            levels = levels.filter(level => level.isActive === filters.isActive)
        }

        return levels.slice(0, limitCount)
    },

    /**
     * Busca nível por ID
     */
    findById: async (idTenant, idBranch, id) => {
        return await evaluationLevelRepository.findById(idTenant, idBranch, id)
    },

    /**
     * Atualiza um nível de avaliação
     */
    updateLevel: async (idTenant, idBranch, userId, id, data) => {
        const oldData = await evaluationLevelRepository.findById(idTenant, idBranch, id)

        const result = await evaluationLevelRepository.update(idTenant, idBranch, id, {
            ...data,
            updatedAt: normalizeDate(new Date())
        })

        await EvaluationLevelAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData: data
        })

        return result
    },

    /**
     * Reordena níveis de avaliação
     */
    reorderLevels: async (idTenant, idBranch, userId, orderedIds, userName) => {
        await evaluationLevelRepository.updateOrder(idTenant, idBranch, orderedIds)

        await EvaluationLevelAuditLogger.logReorder({
            idTenant, idBranch, userId, userName
        })

        return { success: true }
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteLevel: async (idTenant, idBranch, userId, id, userName) => {
        const level = await evaluationLevelRepository.findById(idTenant, idBranch, id)
        EvaluationLevelRules.validateForDeletion(level)

        const result = await evaluationLevelRepository.softDelete(idTenant, idBranch, id, userId)

        await EvaluationLevelAuditLogger.logDeletion({
            idTenant, idBranch, userId, userName,
            entityId: id,
            title: level.title,
            snapshot: level
        })

        return result
    }
}
