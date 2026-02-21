import { activityRepository } from '../../data/repositories/ActivityRepository'
import { objectiveRepository } from '../../data/repositories/ObjectiveRepository'
import { topicRepository } from '../../data/repositories/TopicRepository'
import { ActivityAuditLogger } from './audit/ActivityAuditLogger'
import { ActivityRules } from './domain/ActivityRules'
import { ActivitySchema } from '../../data/schemas/Admin/ActivitySchema'
import { normalizeDate } from '../../utils/date'
import { collection, getDocs, doc } from 'firebase/firestore'

/**
 * Serviço para Gestão de Atividades (Activities)
 */
export const ActivityService = {
    /**
     * Cria uma nova atividade com validação (com suporte a upload de foto)
     */
    createActivity: async (idTenant, idBranch, userId, activityData) => {
        await ActivitySchema.validate(activityData, { abortEarly: false })

        // Se há photoFile, fazer upload primeiro
        let photoUrl = null
        if (activityData.photoFile) {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
            const storage = getStorage()
            const tempPath = `activities/${idTenant}/${idBranch}/temp_${Date.now()}_${activityData.photoFile.name}`
            const storageRef = ref(storage, tempPath)
            const snapshot = await uploadBytes(storageRef, activityData.photoFile)
            photoUrl = await getDownloadURL(snapshot.ref)
        }

        const payload = ActivityRules.buildCreationPayload(activityData, userId, photoUrl)

        const newActivity = await activityRepository.create(idTenant, idBranch, {
            ...payload,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date())
        })

        await ActivityAuditLogger.logCreation({
            idTenant, idBranch, userId,
            userName: activityData.userName,
            entityId: newActivity.id,
            activityName: activityData.name
        })

        return newActivity
    },

    /**
     * Lista todas as atividades com objectives e topics
     */
    listAll: async (idTenant, idBranch) => {
        const data = await activityRepository.findAllWithObjectives(idTenant, idBranch)
        return data.filter(a => !a.deletedAt)
    },

    /**
     * Lista atividades com filtros (incluindo objectives e topics)
     */
    listWithFilters: async (idTenant, idBranch, filters = {}, limitCount = 100) => {
        const allActivities = await activityRepository.findAll(idTenant, idBranch)

        const activities = allActivities
            .filter(a => !a.deletedAt)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .slice(0, limitCount)

        if (activities.length === 0) {
            return []
        }

        // Busca objectives e topics apenas para as atividades filtradas
        const objectivesPromises = activities.map(async (activity) => {
            const activityDocRef = doc(activityRepository.getCollectionRef(idTenant, idBranch), activity.id)
            const objectivesRef = collection(activityDocRef, 'objectives')
            const objectivesSnapshot = await getDocs(objectivesRef)

            return {
                activityId: activity.id,
                objectives: objectivesSnapshot.docs
            }
        })

        const allObjectivesData = await Promise.all(objectivesPromises)

        const topicsPromises = allObjectivesData.flatMap(({ activityId, objectives }) =>
            objectives.map(async (objDoc) => {
                const topicsRef = collection(objDoc.ref, 'topics')
                const topicsSnapshot = await getDocs(topicsRef)

                return {
                    activityId,
                    objectiveId: objDoc.id,
                    objectiveData: objDoc.data(),
                    topics: topicsSnapshot.docs
                }
            })
        )

        const allTopicsData = await Promise.all(topicsPromises)

        const activitiesMap = new Map(activities.map(a => [a.id, { ...a, objectives: {} }]))

        allTopicsData.forEach(({ activityId, objectiveId, objectiveData, topics }) => {
            const activity = activitiesMap.get(activityId)
            if (!activity || objectiveData.deleted) return

            const topicsMap = {}
            topics.forEach(topicDoc => {
                const topicData = { id: topicDoc.id, ...topicDoc.data() }
                if (!topicData.deleted) {
                    topicsMap[topicDoc.id] = topicData
                }
            })

            activity.objectives[objectiveId] = {
                id: objectiveId,
                ...objectiveData,
                topics: topicsMap
            }
        })

        return Array.from(activitiesMap.values())
    },

    /**
     * Busca atividade por ID com objectives e topics
     */
    findById: async (idTenant, idBranch, id) => {
        return await activityRepository.findByIdWithObjectives(idTenant, idBranch, id)
    },

    /**
     * Atualiza uma atividade (com suporte a upload de foto)
     */
    updateActivity: async (idTenant, idBranch, userId, id, data) => {
        const oldData = await activityRepository.findById(idTenant, idBranch, id)

        let photoUrl = data.photo || data.photoUrl

        if (data.photoFile) {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
            const storage = getStorage()
            const path = `activities/${idTenant}/${idBranch}/${id}/${Date.now()}_${data.photoFile.name}`
            const storageRef = ref(storage, path)
            const snapshot = await uploadBytes(storageRef, data.photoFile)
            photoUrl = await getDownloadURL(snapshot.ref)
        }

        const newData = {
            ...ActivityRules.buildUpdatePayload(data, photoUrl),
            updatedAt: normalizeDate(new Date())
        }

        const result = await activityRepository.update(idTenant, idBranch, id, newData)

        await ActivityAuditLogger.logUpdate({
            idTenant, idBranch, userId,
            userName: data.userName,
            entityId: id,
            oldData,
            newData
        })

        return result
    },

    /**
     * Reordena atividades
     */
    reorderActivities: async (idTenant, idBranch, userId, orderedIds) => {
        const updates = orderedIds.map((id, index) =>
            activityRepository.update(idTenant, idBranch, id, { order: index })
        )

        await Promise.all(updates)
        return { success: true }
    },

    /**
     * Exclusão Lógica (Soft Delete)
     */
    deleteActivity: async (idTenant, idBranch, userId, id, userName) => {
        const activity = await activityRepository.findById(idTenant, idBranch, id)
        ActivityRules.validateForDeletion(activity)

        const result = await activityRepository.softDelete(idTenant, idBranch, id, userId)

        await ActivityAuditLogger.logDeletion({
            idTenant, idBranch, userId,
            userName,
            entityId: id,
            activityName: activity.name
        })

        return result
    },

    // ==================== OBJECTIVES CRUD ====================

    createObjective: async (idTenant, idBranch, userId, activityId, objectiveData) => {
        const objectiveId = objectiveData.id || `obj-${Date.now()}`

        await objectiveRepository.create(idTenant, idBranch, activityId, objectiveId, {
            ...objectiveData,
            deleted: false
        })

        return { id: objectiveId, ...objectiveData }
    },

    updateObjective: async (idTenant, idBranch, userId, activityId, objectiveId, objectiveData) => {
        await objectiveRepository.update(idTenant, idBranch, activityId, objectiveId, objectiveData)
        return { id: objectiveId, ...objectiveData }
    },

    deleteObjective: async (idTenant, idBranch, userId, activityId, objectiveId) => {
        await objectiveRepository.softDelete(idTenant, idBranch, activityId, objectiveId)
        return true
    },

    // ==================== TOPICS CRUD ====================

    createTopic: async (idTenant, idBranch, userId, activityId, objectiveId, topicData) => {
        const topicId = topicData.id || `topic-${Date.now()}`

        await topicRepository.create(idTenant, idBranch, activityId, objectiveId, topicId, {
            ...topicData,
            deleted: false
        })

        return { id: topicId, ...topicData }
    },

    updateTopic: async (idTenant, idBranch, userId, activityId, objectiveId, topicId, topicData) => {
        await topicRepository.update(idTenant, idBranch, activityId, objectiveId, topicId, topicData)
        return { id: topicId, ...topicData }
    },

    deleteTopic: async (idTenant, idBranch, userId, activityId, objectiveId, topicId) => {
        await topicRepository.softDelete(idTenant, idBranch, activityId, objectiveId, topicId)
        return true
    }
}
