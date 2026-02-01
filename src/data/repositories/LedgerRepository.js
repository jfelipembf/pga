import { getFirebaseBackend } from '../../helpers/firebase_helper'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'

/**
 * Repositório para Lançamentos Contábeis (Ledger Entries)
 * Sistema de Partidas Dobradas
 * 
 * Estrutura de um lançamento:
 * {
 *   date: Date,
 *   description: string,
 *   sourceType: 'sale' | 'receivable' | 'payable' | 'transfer' | 'adjustment',
 *   sourceId: string,
 *   entries: [
 *     { account: string, debit: number, credit: number },
 *     { account: string, debit: number, credit: number }
 *   ],
 *   createdAt: Date
 * }
 */
export class LedgerRepository {
    constructor() {
        this.collectionName = 'ledger_entries'
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

    getCollectionRef(idTenant, idBranch) {
        return collection(
            this.db,
            'tenants',
            idTenant,
            'branches',
            idBranch,
            this.collectionName
        )
    }

    /**
     * Cria um novo lançamento contábil (sempre em partidas dobradas)
     */
    async create(idTenant, idBranch, ledgerData) {
        const ref = this.getCollectionRef(idTenant, idBranch)

        // Validar balanceamento (débitos = créditos)
        const totalDebit = ledgerData.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0)
        const totalCredit = ledgerData.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0)

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Lançamento desbalanceado! Débitos: ${totalDebit}, Créditos: ${totalCredit}`)
        }

        const docData = {
            ...ledgerData,
            date: ledgerData.date instanceof Date ? Timestamp.fromDate(ledgerData.date) : ledgerData.date,
            createdAt: Timestamp.now()
        }

        const docRef = await addDoc(ref, docData)
        return { id: docRef.id, ...ledgerData }
    }

    /**
     * Busca lançamentos por período
     */
    async findByPeriod(idTenant, idBranch, startDate, endDate) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        const q = query(
            ref,
            where('date', '>=', Timestamp.fromDate(new Date(startDate))),
            where('date', '<=', Timestamp.fromDate(new Date(endDate)))
        )

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            createdAt: doc.data().createdAt?.toDate()
        }))
    }

    /**
     * Busca lançamentos de uma fonte específica (ex: payable, receivable)
     */
    async findBySource(idTenant, idBranch, sourceType, sourceId) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        const q = query(
            ref,
            where('sourceType', '==', sourceType),
            where('sourceId', '==', sourceId)
        )

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate(),
            createdAt: doc.data().createdAt?.toDate()
        }))
    }
}

export const ledgerRepository = new LedgerRepository()
