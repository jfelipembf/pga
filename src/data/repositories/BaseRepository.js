import { getFirebaseBackend } from '../../helpers/firebase_helper'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
} from 'firebase/firestore'

/**
 * Repositório Base para operações Firestore Multitenant usando SDK Modular.
 */
export class BaseRepository {
    constructor(collectionName) {
        this.collectionName = collectionName
    }

    /**
     * Getter para o banco de dados (lazy loading)
     */
    get db() {
        const backend = getFirebaseBackend()
        if (!backend) {
            throw new Error("Firebase Backend não inicializado. Verifique a configuração.")
        }
        return backend.db
    }

    /**
     * Retorna a referência da coleção baseada no contexto do idTenant/idBranch.
     */
    getCollectionRef(idTenant, idBranch) {
        if (!idTenant || !idBranch) {
            throw new Error("Contexto de idTenant/idBranch é obrigatório para esta operação.")
        }

        const colRef = collection(
            this.db,
            'tenants',
            idTenant,
            'branches',
            idBranch,
            this.collectionName
        )
        return colRef;
    }

    async findAll(idTenant, idBranch) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        const q = query(ref)
        const snapshot = await getDocs(q)

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    async findById(idTenant, idBranch, id) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        const snapshot = await getDoc(ref)
        const data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null

        // Se estiver "deletado", retorna null (mimetiza não encontrado), a menos que tratemos isso na UI
        if (data && data.deletedAt) return null;

        return data
    }

    /**
     * Busca registros com base em condições (where clauses).
     * @param {Array} filters - Array de arrays: [['field', 'op', 'value'], ...]
     * @param {Object} sort - { field: 'name', direction: 'asc' }
     */
    async findWhere(idTenant, idBranch, filters = [], sort = null, limitCount = null) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        const constraints = []

        // Adicionar filtros
        filters.forEach(([field, op, value]) => {
            constraints.push(where(field, op, value))
        })

        // Adicionar ordenação
        if (sort) {
            constraints.push(orderBy(sort.field, sort.direction || 'asc'))
        }

        // Adicionar limite
        if (limitCount) {
            constraints.push(limit(limitCount))
        }

        const q = query(ref, ...constraints)

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    async create(idTenant, idBranch, data) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch))
        const timestamp = serverTimestamp()
        const newData = {
            ...data,
            id: ref.id,
            idTenant,
            idBranch,
            createdAt: timestamp,
            updatedAt: timestamp,
            deletedAt: null // Inicializa como nulo
        }
        await setDoc(ref, newData)
        return newData
    }

    async set(idTenant, idBranch, id, data) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        const timestamp = serverTimestamp()
        const newData = {
            ...data,
            id: ref.id,
            idTenant,
            idBranch,
            createdAt: timestamp,
            updatedAt: timestamp,
            deletedAt: null
        }
        await setDoc(ref, newData)
        return newData
    }

    async update(idTenant, idBranch, id, data) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        const timestamp = serverTimestamp()
        await updateDoc(ref, {
            ...data,
            updatedAt: timestamp
        })
        return { id, ...data }
    }

    /**
     * Realiza a Exclusão Lógica (Soft Delete).
     * O registro permanece no banco, mas fica invisível para consultas padrão.
     */
    async softDelete(idTenant, idBranch, id, userId = null) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        const timestamp = serverTimestamp()

        await updateDoc(ref, {
            deletedAt: timestamp,
            deletedBy: userId,
            isActive: false, // Força inativação
            status: 'deleted', // Atualiza status se houver campo
            updatedAt: timestamp
        })

        return id
    }

    /**
     * Exclusão Física (Hard Delete) - USAR COM EXTREMA CAUTELA
     * Apenas para limpeza de dados irrelevantes ou GDPR.
     */
    async hardDelete(idTenant, idBranch, id) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        await deleteDoc(ref)
        return id
    }
}
