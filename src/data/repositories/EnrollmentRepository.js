import { BaseRepository } from './BaseRepository'
import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    increment
} from 'firebase/firestore'

/**
 * Repository para gerenciar Matrículas (Enrollments)
 */
class EnrollmentRepository extends BaseRepository {
    constructor() {
        super('enrollments')
    }

    /**
     * Referência para a subcoleção de clientes matriculados em uma sessão
     */
    getSessionEnrolledClientsRef(idTenant, idBranch, sessionId) {
        return collection(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients')
    }

    /**
     * Lista todas as matrículas de um cliente
     */
    async findByClient(idTenant, idBranch, idClient) {
        const docs = await this.findWhere(idTenant, idBranch, [['idClient', '==', idClient]])

        // Filtro em memória (Robustez)
        const filtered = docs.filter(d =>
            (d.deletedAt === null || d.deletedAt === undefined) &&
            d.deleted !== true
        )

        return filtered.sort((a, b) => {
            const dateA = a.enrolledAt?.toDate ? a.enrolledAt.toDate() : new Date(a.enrolledAt || 0)
            const dateB = b.enrolledAt?.toDate ? b.enrolledAt.toDate() : new Date(b.enrolledAt || 0)
            return dateB - dateA
        })
    }

    /**
     * Lista apenas matrículas ativas de um cliente
     */
    async findActiveByClient(idTenant, idBranch, idClient) {
        const docs = await this.findWhere(idTenant, idBranch, [['idClient', '==', idClient]])

        // Filtro em memória (Robustez)
        const active = docs.filter(d =>
            d.status === 'active' &&
            (d.deletedAt === null || d.deletedAt === undefined) &&
            d.deleted !== true
        )

        return active.sort((a, b) => {
            const dateA = a.enrolledAt?.toDate ? a.enrolledAt.toDate() : new Date(a.enrolledAt || 0)
            const dateB = b.enrolledAt?.toDate ? b.enrolledAt.toDate() : new Date(b.enrolledAt || 0)
            return dateB - dateA
        })
    }

    /**
     * Lista todos os alunos matriculados em uma turma (com status ativo)
     */
    async findByClass(idTenant, idBranch, idClass) {
        const docs = await this.findWhere(idTenant, idBranch, [['idClass', '==', idClass]])

        // Filtro em memória (matrículas ativas e não deletadas)
        const filtered = docs.filter(d =>
            ['active', 'suspended'].includes(d.status) &&
            (d.deletedAt === null || d.deletedAt === undefined) &&
            d.deleted !== true
        )

        return filtered.sort((a, b) => {
            const dateA = a.enrolledAt?.toDate ? a.enrolledAt.toDate() : new Date(a.enrolledAt || 0)
            const dateB = b.enrolledAt?.toDate ? b.enrolledAt.toDate() : new Date(b.enrolledAt || 0)
            return dateB - dateA
        })
    }

    // ===== OPERAÇÕES NA SUBCOLEÇÃO enrolledClients =====

    /**
     * Adiciona um cliente a uma sessão específica
     */
    async addClientToSession(idTenant, idBranch, sessionId, enrollmentData) {
        const subcollectionRef = this.getSessionEnrolledClientsRef(idTenant, idBranch, sessionId)

        // Usar enrollmentId como document ID para facilitar remoção
        const docRef = doc(subcollectionRef, enrollmentData.enrollmentId)

        await setDoc(docRef, {
            ...enrollmentData,
            enrolledAt: enrollmentData.enrolledAt || serverTimestamp(),
            deleted: false
        })

        return { id: enrollmentData.enrollmentId, ...enrollmentData }
    }

    /**
     * Remove um cliente de uma sessão específica
     */
    async removeClientFromSession(idTenant, idBranch, sessionId, enrollmentId) {
        const docRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients', enrollmentId)

        // Soft delete na subcoleção
        await updateDoc(docRef, {
            deleted: true,
            deletedAt: serverTimestamp()
        })
    }

    /**
     * Lista todos os clientes matriculados em uma sessão
     */
    async listSessionEnrolledClients(idTenant, idBranch, sessionId) {
        const subcollectionRef = this.getSessionEnrolledClientsRef(idTenant, idBranch, sessionId)
        const q = query(subcollectionRef, where('deleted', '==', false))

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    /**
     * Atualiza o status de presença de um cliente em uma sessão
     */
    async updateSessionAttendance(idTenant, idBranch, sessionId, enrollmentId, attended) {
        const docRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients', enrollmentId)

        await updateDoc(docRef, {
            attended
        })
    }

    /**
     * Incrementa contadores de uma sessão (enrolledCount, trialCount)
     */
    async incrementSessionCounters(idTenant, idBranch, sessionId, isTrialClass = false) {
        const sessionRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId)

        const updateData = {
            enrolledCount: increment(1),
            updatedAt: serverTimestamp()
        }

        if (isTrialClass) {
            updateData.trialCount = increment(1)
        }

        await updateDoc(sessionRef, updateData)
    }

    /**
     * Incrementa contadores de uma turma (class)
     */
    async incrementClassCounters(idTenant, idBranch, classId) {
        const classRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'classes', classId)
        await updateDoc(classRef, {
            enrolledCount: increment(1),
            updatedAt: serverTimestamp()
        })
    }

    /**
     * Decrementa contadores de uma turma (class)
     */
    async decrementClassCounters(idTenant, idBranch, classId) {
        const classRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'classes', classId)
        await updateDoc(classRef, {
            enrolledCount: increment(-1),
            updatedAt: serverTimestamp()
        })
    }

    /**
     * Decrementa contadores de uma sessão
     */
    async decrementSessionCounters(idTenant, idBranch, sessionId, isTrialClass = false) {
        const sessionRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId)

        const updateData = {
            enrolledCount: increment(-1),
            updatedAt: serverTimestamp()
        }

        if (isTrialClass) {
            updateData.trialCount = increment(-1)
        }

        await updateDoc(sessionRef, updateData)
    }
}

export const enrollmentRepository = new EnrollmentRepository()
