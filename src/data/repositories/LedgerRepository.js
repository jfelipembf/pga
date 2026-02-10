import { BaseRepository } from './BaseRepository'
import { Timestamp } from 'firebase/firestore'

/**
 * Repositório para Lançamentos Contábeis (Ledger Entries)
 * Sistema de Partidas Dobradas
 * 
 * Herda BaseRepository para reusar infra multitenant.
 * Sobrescreve `create` para incluir validação de balanceamento.
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
export class LedgerRepository extends BaseRepository {
    constructor() {
        super('ledger_entries')
    }

    /**
     * Cria um novo lançamento contábil (sempre em partidas dobradas)
     * Sobrescreve BaseRepository.create para incluir validação de balanceamento.
     */
    async create(idTenant, idBranch, ledgerData) {
        // Validar balanceamento (débitos = créditos)
        const totalDebit = ledgerData.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0)
        const totalCredit = ledgerData.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0)

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Lançamento desbalanceado! Débitos: ${totalDebit}, Créditos: ${totalCredit}`)
        }

        // Normalizar data para Timestamp do Firestore
        const normalizedData = {
            ...ledgerData,
            date: ledgerData.date instanceof Date ? Timestamp.fromDate(ledgerData.date) : ledgerData.date,
        }

        // Delegar para BaseRepository.create (que adiciona id, idTenant, idBranch, timestamps)
        return super.create(idTenant, idBranch, normalizedData)
    }

    /**
     * Busca lançamentos por período
     */
    async findByPeriod(idTenant, idBranch, startDate, endDate) {
        const results = await this.findWhere(idTenant, idBranch, [
            ['date', '>=', Timestamp.fromDate(new Date(startDate))],
            ['date', '<=', Timestamp.fromDate(new Date(endDate))]
        ])

        return results.map(entry => ({
            ...entry,
            date: entry.date?.toDate ? entry.date.toDate() : entry.date,
            createdAt: entry.createdAt?.toDate ? entry.createdAt.toDate() : entry.createdAt
        }))
    }

    /**
     * Busca lançamentos de uma fonte específica (ex: payable, receivable)
     */
    async findBySource(idTenant, idBranch, sourceType, sourceId) {
        const results = await this.findWhere(idTenant, idBranch, [
            ['sourceType', '==', sourceType],
            ['sourceId', '==', sourceId]
        ])

        return results.map(entry => ({
            ...entry,
            date: entry.date?.toDate ? entry.date.toDate() : entry.date,
            createdAt: entry.createdAt?.toDate ? entry.createdAt.toDate() : entry.createdAt
        }))
    }
}

export const ledgerRepository = new LedgerRepository()
