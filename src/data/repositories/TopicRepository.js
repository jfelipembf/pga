import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'

/**
 * Repository para Topics (subcoleção de Objectives)
 * Estrutura: activities/{activityId}/objectives/{objectiveId}/topics/{topicId}
 */
class TopicRepository {
    get db() {
        const backend = getFirebaseBackend()
        if (!backend) {
            throw new Error("Firebase Backend não inicializado")
        }
        return backend.db
    }

    getTopicsRef(idTenant, idBranch, activityId, objectiveId) {
        return collection(
            this.db,
            'tenants', idTenant,
            'branches', idBranch,
            'activities', activityId,
            'objectives', objectiveId,
            'topics'
        )
    }

    getTopicDocRef(idTenant, idBranch, activityId, objectiveId, topicId) {
        return doc(this.getTopicsRef(idTenant, idBranch, activityId, objectiveId), topicId)
    }

    async create(idTenant, idBranch, activityId, objectiveId, topicId, data) {
        const docRef = this.getTopicDocRef(idTenant, idBranch, activityId, objectiveId, topicId)
        await setDoc(docRef, {
            ...data,
            idTopic: topicId,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return { id: topicId, ...data }
    }

    async update(idTenant, idBranch, activityId, objectiveId, topicId, data) {
        const docRef = this.getTopicDocRef(idTenant, idBranch, activityId, objectiveId, topicId)
        await setDoc(docRef, {
            ...data,
            updatedAt: new Date()
        }, { merge: true })
        return { id: topicId, ...data }
    }

    async delete(idTenant, idBranch, activityId, objectiveId, topicId) {
        const docRef = this.getTopicDocRef(idTenant, idBranch, activityId, objectiveId, topicId)
        await deleteDoc(docRef)
        return true
    }

    async softDelete(idTenant, idBranch, activityId, objectiveId, topicId) {
        return await this.update(idTenant, idBranch, activityId, objectiveId, topicId, {
            deleted: true,
            deletedAt: new Date()
        })
    }

    async findAll(idTenant, idBranch, activityId, objectiveId) {
        const ref = this.getTopicsRef(idTenant, idBranch, activityId, objectiveId)
        const snapshot = await getDocs(ref)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
}

export const topicRepository = new TopicRepository()
