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

        const snapshot = await getDocs(ref)

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    async findById(idTenant, idBranch, id) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        const snapshot = await getDoc(ref)
        return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
    }

    /**
     * Busca registros com base em condições (where clauses).
     * @param {Array} filters - Array de arrays: [['field', 'op', 'value'], ...]
     * @param {Object} sort - { field: 'name', direction: 'asc' }
     */
    async findWhere(idTenant, idBranch, filters = [], sort = null, limitCount = null) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        let q = query(ref)

        // Adicionar filtros
        filters.forEach(([field, op, value]) => {
            q = query(q, where(field, op, value))
        })

        // Adicionar ordenação
        if (sort) {
            q = query(q, orderBy(sort.field, sort.direction || 'asc'))
        }

        // Adicionar limite
        if (limitCount) {
            q = query(q, limit(limitCount))
        }

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
            updatedAt: timestamp
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

    async delete(idTenant, idBranch, id) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), id)
        await deleteDoc(ref)
        return id
    }
}
