import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { getFirebaseBackend } from '../../helpers/firebase_helper'

/**
 * Repository para Objectives (subcoleção de Activities)
 * Estrutura: activities/{activityId}/objectives/{objectiveId}
 */
class ObjectiveRepository {
    get db() {
        const backend = getFirebaseBackend()
        if (!backend) {
            throw new Error("Firebase Backend não inicializado")
        }
        return backend.db
    }

    getObjectivesRef(idTenant, idBranch, activityId) {
        return collection(
            this.db,
            'tenants', idTenant,
            'branches', idBranch,
            'activities', activityId,
            'objectives'
        )
    }

    getObjectiveDocRef(idTenant, idBranch, activityId, objectiveId) {
        return doc(this.getObjectivesRef(idTenant, idBranch, activityId), objectiveId)
    }

    async create(idTenant, idBranch, activityId, objectiveId, data) {
        const docRef = this.getObjectiveDocRef(idTenant, idBranch, activityId, objectiveId)
        await setDoc(docRef, {
            ...data,
            idObjective: objectiveId,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return { id: objectiveId, ...data }
    }

    async update(idTenant, idBranch, activityId, objectiveId, data) {
        const docRef = this.getObjectiveDocRef(idTenant, idBranch, activityId, objectiveId)
        await setDoc(docRef, {
            ...data,
            updatedAt: new Date()
        }, { merge: true })
        return { id: objectiveId, ...data }
    }

    async delete(idTenant, idBranch, activityId, objectiveId) {
        const docRef = this.getObjectiveDocRef(idTenant, idBranch, activityId, objectiveId)
        await deleteDoc(docRef)
        return true
    }

    async softDelete(idTenant, idBranch, activityId, objectiveId) {
        return await this.update(idTenant, idBranch, activityId, objectiveId, {
            deleted: true,
            deletedAt: new Date()
        })
    }

    async findAll(idTenant, idBranch, activityId) {
        const ref = this.getObjectivesRef(idTenant, idBranch, activityId)
        const snapshot = await getDocs(ref)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }
}

export const objectiveRepository = new ObjectiveRepository()
