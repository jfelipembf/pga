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
     * Suporta operação em Batch para atomicidade
     */
    async addClientToSession(idTenant, idBranch, sessionId, enrollmentData, batch = null) {
        const subcollectionRef = this.getSessionEnrolledClientsRef(idTenant, idBranch, sessionId)

        // Usar enrollmentId como document ID para facilitar remoção
        const docRef = doc(subcollectionRef, enrollmentData.enrollmentId)

        const data = {
            ...enrollmentData,
            enrolledAt: enrollmentData.enrolledAt || serverTimestamp(),
            deleted: false
        }

        if (batch) {
            batch.set(docRef, data);
        } else {
            await setDoc(docRef, data);
        }

        return { id: enrollmentData.enrollmentId, ...enrollmentData }
    }

    /**
     * Remove um cliente de uma sessão específica
     * Suporta operação em Batch
     */
    async removeClientFromSession(idTenant, idBranch, sessionId, enrollmentId, batch = null) {
        const docRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients', enrollmentId)

        const data = {
            deleted: true,
            deletedAt: serverTimestamp()
        }

        if (batch) {
            batch.update(docRef, data);
        } else {
            await updateDoc(docRef, data);
        }
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
     * Suporta operação em Batch
     */
    async incrementSessionCounters(idTenant, idBranch, sessionId, isTrialClass = false, batch = null) {
        const sessionRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId)

        const updateData = {
            enrolledCount: increment(1),
            updatedAt: serverTimestamp()
        }

        if (isTrialClass) {
            updateData.trialCount = increment(1)
        }

        if (batch) {
            batch.update(sessionRef, updateData);
        } else {
            await updateDoc(sessionRef, updateData)
        }
    }

    /**
     * Incrementa contadores de uma turma (class)
     * Suporta operação em Batch
     */
    async incrementClassCounters(idTenant, idBranch, classId, batch = null) {
        const classRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'classes', classId)
        const data = {
            enrolledCount: increment(1),
            updatedAt: serverTimestamp()
        }

        if (batch) {
            batch.update(classRef, data);
        } else {
            await updateDoc(classRef, data);
        }
    }

    /**
     * Decrementa contadores de uma turma (class)
     * Suporta operação em Batch
     */
    async decrementClassCounters(idTenant, idBranch, classId, batch = null) {
        const classRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'classes', classId)
        const data = {
            enrolledCount: increment(-1),
            updatedAt: serverTimestamp()
        }

        if (batch) {
            batch.update(classRef, data);
        } else {
            await updateDoc(classRef, data);
        }
    }

    /**
     * Decrementa contadores de uma sessão
     * Suporta operação em Batch
     */
    async decrementSessionCounters(idTenant, idBranch, sessionId, isTrialClass = false, batch = null) {
        const sessionRef = doc(this.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId)

        const updateData = {
            enrolledCount: increment(-1),
            updatedAt: serverTimestamp()
        }

        if (isTrialClass) {
            updateData.trialCount = increment(-1)
        }

        if (batch) {
            batch.update(sessionRef, updateData);
        } else {
            await updateDoc(sessionRef, updateData)
        }
    }
}

export const enrollmentRepository = new EnrollmentRepository()
