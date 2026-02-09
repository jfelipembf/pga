import { BaseRepository } from './BaseRepository'
import { collection, getDocs, doc } from 'firebase/firestore'

/**
 * Repositório para Atividades (Activities).
 * 
 * Estrutura: 
 * - tenants/{idTenant}/branches/{idBranch}/activities
 * - activities/{activityId}/objectives (subcoleção)
 * - objectives/{objectiveId}/topics (subcoleção)
 */
class ActivityRepository extends BaseRepository {
    constructor() {
        super('activities')
    }

    /**
     * Busca uma atividade com suas subcoleções de objectives e topics
     */
    async findByIdWithObjectives(idTenant, idBranch, activityId) {
        // Busca a atividade principal
        const activity = await this.findById(idTenant, idBranch, activityId)
        if (!activity) return null

        // Busca subcoleção de objectives
        const activityDocRef = doc(this.getCollectionRef(idTenant, idBranch), activityId)
        const objectivesRef = collection(activityDocRef, 'objectives')
        const objectivesSnapshot = await getDocs(objectivesRef)

        const objectives = {}

        // Para cada objective, busca seus topics
        for (const objDoc of objectivesSnapshot.docs) {
            const objectiveData = { id: objDoc.id, ...objDoc.data() }

            // ✅ Filtrar objectives deletados (soft delete)
            if (objectiveData.deleted) continue

            // Busca subcoleção de topics
            const topicsRef = collection(objDoc.ref, 'topics')
            const topicsSnapshot = await getDocs(topicsRef)

            const topics = {}
            topicsSnapshot.docs.forEach(topicDoc => {
                const topicData = { id: topicDoc.id, ...topicDoc.data() }
                // ✅ Filtrar topics deletados (soft delete)
                if (!topicData.deleted) {
                    topics[topicDoc.id] = topicData
                }
            })

            objectiveData.topics = topics
            objectives[objDoc.id] = objectiveData
        }

        activity.objectives = objectives
        return activity
    }

    /**
     * Busca todas as atividades com suas subcoleções
     * OTIMIZADO: Busca objectives e topics em batch para evitar N+1 queries
     */
    async findAllWithObjectives(idTenant, idBranch) {
        const activities = await this.findAll(idTenant, idBranch)

        if (activities.length === 0) return []

        // Busca objectives de todas as atividades em paralelo (batch)
        const objectivesPromises = activities.map(async (activity) => {
            const activityDocRef = doc(this.getCollectionRef(idTenant, idBranch), activity.id)
            const objectivesRef = collection(activityDocRef, 'objectives')
            const objectivesSnapshot = await getDocs(objectivesRef)

            return {
                idActivity: activity.id,
                objectives: objectivesSnapshot.docs
            }
        })

        const allObjectivesData = await Promise.all(objectivesPromises)

        // Para cada conjunto de objectives, busca seus topics em paralelo
        const topicsPromises = allObjectivesData.flatMap(({ idActivity, objectives }) =>
            objectives.map(async (objDoc) => {
                const topicsRef = collection(objDoc.ref, 'topics')
                const topicsSnapshot = await getDocs(topicsRef)

                return {
                    idActivity,
                    idObjective: objDoc.id,
                    objectiveData: objDoc.data(),
                    topics: topicsSnapshot.docs
                }
            })
        )

        const allTopicsData = await Promise.all(topicsPromises)

        // Monta a estrutura final
        const activitiesMap = new Map(activities.map(a => [a.id, { ...a, objectives: {} }]))

        allTopicsData.forEach(({ idActivity, idObjective, objectiveData, topics }) => {
            const activity = activitiesMap.get(idActivity)
            if (!activity) return

            // Filtrar objective deletado
            if (objectiveData.deleted) return

            // Montar topics do objective
            const topicsMap = {}
            topics.forEach(topicDoc => {
                const topicData = { id: topicDoc.id, idTopic: topicDoc.id, ...topicDoc.data() }
                // Filtrar topic deletado
                if (!topicData.deleted) {
                    topicsMap[topicDoc.id] = topicData
                }
            })

            // Adicionar objective com seus topics
            activity.objectives[idObjective] = {
                id: idObjective,
                idObjective: idObjective,
                ...objectiveData,
                topics: topicsMap
            }
        })

        return Array.from(activitiesMap.values())
    }
}

export const activityRepository = new ActivityRepository()
