import { activityRepository } from '../../data/repositories/ActivityRepository'
import { objectiveRepository } from '../../data/repositories/ObjectiveRepository'
import { topicRepository } from '../../data/repositories/TopicRepository'
import { AuditService } from '../Audit/AuditService'
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

        // Se há photoFile, fazer upload primeiro (será atualizado com ID correto depois)
        let photoUrl = null
        if (activityData.photoFile) {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
            const storage = getStorage()
            const tempPath = `activities/${idTenant}/${idBranch}/temp_${Date.now()}_${activityData.photoFile.name}`
            const storageRef = ref(storage, tempPath)
            const snapshot = await uploadBytes(storageRef, activityData.photoFile)
            photoUrl = await getDownloadURL(snapshot.ref)
        }

        // Remove photoFile dos dados antes de salvar
        const { photoFile, ...dataToSave } = activityData

        const newActivity = await activityRepository.create(idTenant, idBranch, {
            ...dataToSave,
            photo: photoUrl,
            photoUrl: photoUrl,
            isActive: activityData.isActive !== false,
            status: activityData.status || 'active',
            createdBy: userId,
            createdAt: normalizeDate(new Date()),
            updatedAt: normalizeDate(new Date()),
            deletedAt: null
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: activityData.userName,
            action: 'ACTIVITY_CREATED',
            entityType: 'activity',
            entityId: newActivity.id,
            description: `Nova atividade criada: ${activityData.name}`
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
        // Busca todas as atividades e filtra em memória
        const allActivities = await activityRepository.findAll(idTenant, idBranch)
        
        // Filtra deletados em memória
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
        // Se há photoFile, fazer upload primeiro
        let photoUrl = data.photo || data.photoUrl
        
        if (data.photoFile) {
            const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
            const storage = getStorage()
            const path = `activities/${idTenant}/${idBranch}/${id}/${Date.now()}_${data.photoFile.name}`
            const storageRef = ref(storage, path)
            const snapshot = await uploadBytes(storageRef, data.photoFile)
            photoUrl = await getDownloadURL(snapshot.ref)
        }

        // Remove photoFile dos dados antes de salvar
        const { photoFile, ...dataToSave } = data

        const result = await activityRepository.update(idTenant, idBranch, id, {
            ...dataToSave,
            photo: photoUrl,
            photoUrl: photoUrl,
            updatedAt: normalizeDate(new Date())
        })

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: data.userName,
            action: 'ACTIVITY_UPDATED',
            entityType: 'activity',
            entityId: id,
            description: `Atividade atualizada: ${data.name || id}`
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
        if (!activity) throw new Error("Atividade não encontrada")
        if (activity.deletedAt) throw new Error("Atividade já foi excluída")

        const result = await activityRepository.softDelete(idTenant, idBranch, id, userId)

        await AuditService.log({
            idTenant, idBranch, userId,
            userName: userName,
            action: 'ACTIVITY_DELETED',
            entityType: 'activity',
            entityId: id,
            description: `Atividade excluída: ${activity.name || id}`
        })

        return result
    },

    // ==================== OBJECTIVES CRUD ====================

    /**
     * Cria um novo objetivo (sem audit log individual)
     */
    createObjective: async (idTenant, idBranch, userId, activityId, objectiveData) => {
        const objectiveId = objectiveData.id || `obj-${Date.now()}`
        
        await objectiveRepository.create(idTenant, idBranch, activityId, objectiveId, {
            ...objectiveData,
            deleted: false
        })

        return { id: objectiveId, ...objectiveData }
    },

    /**
     * Atualiza um objetivo (sem audit log individual)
     */
    updateObjective: async (idTenant, idBranch, userId, activityId, objectiveId, objectiveData) => {
        await objectiveRepository.update(idTenant, idBranch, activityId, objectiveId, objectiveData)
        return { id: objectiveId, ...objectiveData }
    },

    /**
     * Exclui um objetivo - soft delete (sem audit log individual)
     */
    deleteObjective: async (idTenant, idBranch, userId, activityId, objectiveId) => {
        await objectiveRepository.softDelete(idTenant, idBranch, activityId, objectiveId)
        return true
    },

    // ==================== TOPICS CRUD ====================

    /**
     * Cria um novo tópico (sem audit log individual)
     */
    createTopic: async (idTenant, idBranch, userId, activityId, objectiveId, topicData) => {
        const topicId = topicData.id || `topic-${Date.now()}`
        
        await topicRepository.create(idTenant, idBranch, activityId, objectiveId, topicId, {
            ...topicData,
            deleted: false
        })

        return { id: topicId, ...topicData }
    },

    /**
     * Atualiza um tópico (sem audit log individual)
     */
    updateTopic: async (idTenant, idBranch, userId, activityId, objectiveId, topicId, topicData) => {
        await topicRepository.update(idTenant, idBranch, activityId, objectiveId, topicId, topicData)
        return { id: topicId, ...topicData }
    },

    /**
     * Exclui um tópico - soft delete (sem audit log individual)
     */
    deleteTopic: async (idTenant, idBranch, userId, activityId, objectiveId, topicId) => {
        await topicRepository.softDelete(idTenant, idBranch, activityId, objectiveId, topicId)
        return true
    }
}
