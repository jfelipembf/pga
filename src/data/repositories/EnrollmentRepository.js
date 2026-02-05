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
    orderBy,
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
            where('idClient', '==', idClient),
            where('deleted', '==', false),
            orderBy('enrolledAt', 'desc')
        )

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    },

    /**
     * Lista apenas matrículas ativas de um cliente
     */
    findActiveByClient: async (idTenant, idBranch, idClient) => {
        const collectionRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        const q = query(
            collectionRef,
            where('idClient', '==', idClient),
            where('status', '==', 'active'),
            where('deleted', '==', false),
            orderBy('enrolledAt', 'desc')
        )

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    },

    /**
     * Lista todos os alunos matriculados em uma turma
     */
    findByClass: async (idTenant, idBranch, idClass) => {
        const collectionRef = enrollmentRepository.getCollectionRef(idTenant, idBranch)
        const q = query(
            collectionRef,
            where('idClass', '==', idClass),
            where('deleted', '==', false),
            orderBy('enrolledAt', 'desc')
        )

        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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
