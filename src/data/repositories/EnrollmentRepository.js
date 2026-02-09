import { getFirebaseBackend } from '../../helpers/firebase_helper'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
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
export const enrollmentRepository = {
    /**
     * Getter para o banco de dados
     */
    get db() {
        const backend = getFirebaseBackend()
        if (!backend) {
            throw new Error("Firebase Backend não inicializado. Verifique a configuração.")
        }
        return backend.db
    },

    /**
     * Referência para a coleção de matrículas
     */
    getCollectionRef: (idTenant, idBranch) => {
        return collection(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'enrollments')
    },

    /**
     * Referência para a subcoleção de clientes matriculados em uma sessão
     */
    getSessionEnrolledClientsRef: (idTenant, idBranch, sessionId) => {
        return collection(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients')
    },

    /**
     * Cria uma nova matrícula
     */
    create: async (idTenant, idBranch, data) => {
        const collectionRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        const docRef = await addDoc(collectionRef, {
            ...data,
            idTenant,
            idBranch,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deletedAt: null,
            deletedBy: null,
            deleted: false
        })

        return { id: docRef.id, ...data }
    },

    /**
     * Busca uma matrícula por ID
     */
    findById: async (idTenant, idBranch, id) => {
        const docRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'enrollments', id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists() && !docSnap.data().deleted) {
            return { id: docSnap.id, ...docSnap.data() }
        }

        return null
    },

    /**
     * Lista todas as matrículas de um cliente
     */
    findByClient: async (idTenant, idBranch, idClient) => {
        const collectionRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        const q = query(
            collectionRef,
            where('idClient', '==', idClient)
        )

        const querySnapshot = await getDocs(q)
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

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
    },

    /**
     * Lista apenas matrículas ativas de um cliente
     */
    findActiveByClient: async (idTenant, idBranch, idClient) => {
        const collectionRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        const q = query(
            collectionRef,
            where('idClient', '==', idClient)
        )

        const querySnapshot = await getDocs(q)
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

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
    },

    /**
     * Lista todos os alunos matriculados em uma turma (com status ativo)
     */
    findByClass: async (idTenant, idBranch, idClass) => {
        const collectionRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        const q = query(
            collectionRef,
            where('idClass', '==', idClass)
        )

        const querySnapshot = await getDocs(q)
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

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
    },

    /**
     * Atualiza uma matrícula
     */
    update: async (idTenant, idBranch, id, data) => {
        const docRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'enrollments', id)
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        })

        return { id, ...data }
    },

    /**
     * Soft delete de uma matrícula
     */
    softDelete: async (idTenant, idBranch, id, userId) => {
        const docRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'enrollments', id)
        await updateDoc(docRef, {
            deleted: true,
            deletedAt: serverTimestamp(),
            deletedBy: userId,
            updatedAt: serverTimestamp()
        })
    },

    // ===== OPERAÇÕES NA SUBCOLEÇÃO enrolledClients =====

    /**
     * Adiciona um cliente a uma sessão específica
     */
    addClientToSession: async (idTenant, idBranch, sessionId, enrollmentData) => {
        const subcollectionRef = enrollmentRepository.getSessionEnrolledClientsRef(idTenant, idBranch, sessionId)

        // Usar enrollmentId como document ID para facilitar remoção
        const docRef = doc(subcollectionRef, enrollmentData.enrollmentId)

        await setDoc(docRef, {
            ...enrollmentData,
            enrolledAt: enrollmentData.enrolledAt || serverTimestamp(),
            deleted: false
        })

        return { id: enrollmentData.enrollmentId, ...enrollmentData }
    },

    /**
     * Remove um cliente de uma sessão específica
     */
    removeClientFromSession: async (idTenant, idBranch, sessionId, enrollmentId) => {
        const docRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients', enrollmentId)

        // Soft delete na subcoleção
        await updateDoc(docRef, {
            deleted: true,
            deletedAt: serverTimestamp()
        })
    },

    /**
     * Lista todos os clientes matriculados em uma sessão
     */
    listSessionEnrolledClients: async (idTenant, idBranch, sessionId) => {
        const subcollectionRef = enrollmentRepository.getSessionEnrolledClientsRef(idTenant, idBranch, sessionId)
        const q = query(subcollectionRef, where('deleted', '==', false))

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    },

    /**
     * Atualiza o status de presença de um cliente em uma sessão
     */
    updateSessionAttendance: async (idTenant, idBranch, sessionId, enrollmentId, attended) => {
        const docRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId, 'enrolledClients', enrollmentId)

        await updateDoc(docRef, {
            attended
        })
    },

    /**
     * Incrementa contadores de uma sessão (enrolledCount, trialCount)
     */
    incrementSessionCounters: async (idTenant, idBranch, sessionId, isTrialClass = false) => {
        const sessionRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId)

        const updateData = {
            enrolledCount: increment(1),
            updatedAt: serverTimestamp()
        }

        if (isTrialClass) {
            updateData.trialCount = increment(1)
        }

        await updateDoc(sessionRef, updateData)
    },

    /**
     * Incrementa contadores de uma turma (class)
     */
    incrementClassCounters: async (idTenant, idBranch, classId) => {
        const classRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'classes', classId)
        await updateDoc(classRef, {
            enrolledCount: increment(1),
            updatedAt: serverTimestamp()
        })
    },

    /**
     * Decrementa contadores de uma turma (class)
     */
    decrementClassCounters: async (idTenant, idBranch, classId) => {
        const classRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'classes', classId)
        await updateDoc(classRef, {
            enrolledCount: increment(-1),
            updatedAt: serverTimestamp()
        })
    },

    /**
     * Decrementa contadores de uma sessão
     */
    decrementSessionCounters: async (idTenant, idBranch, sessionId, isTrialClass = false) => {
        const sessionRef = doc(enrollmentRepository.db, 'tenants', idTenant, 'branches', idBranch, 'sessions', sessionId)

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
