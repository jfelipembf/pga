import { BaseRepository } from './BaseRepository'
import { query, where, getDocs, orderBy } from 'firebase/firestore'

/**
 * Repositório para Eventos (Eventos de Avaliação e Testes)
 * local: tenants/{idTenant}/branches/{idBranch}/events
 */
class EventRepository extends BaseRepository {
    constructor() {
        super('events')
    }

    /**
     * Busca um evento ativo do tipo especificado que englobe a data atual
     */
    async findActiveByType(idTenant, idBranch, type, isoDate) {
        // Firestore não permite múltiplos filtros de desigualdade em campos diferentes facilmente 
        // em índices automáticos simples. Vamos buscar os ativos e filtrar data em memória ou usar query composta.
        // Dado o volume baixo de eventos de configuração por branch, filtramos status no banco e datas no código.

        const q = query(
            this.getCollectionRef(idTenant, idBranch),
            where('type', '==', type),
            where('status', '==', 'active'),
            orderBy('startDate', 'desc')
        )

        const snapshot = await getDocs(q)
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Filtro de data: startDate <= isoDate <= endDate
        return events.find(e => {
            const start = e.startDate.split('T')[0]
            const end = e.endDate.split('T')[0]
            const today = isoDate.split('T')[0]
            return today >= start && today <= end
        })
    }

    /**
     * Lista eventos por tipo
     */
    async listByType(idTenant, idBranch, type) {
        return this.findWhere(idTenant, idBranch, [
            ['type', '==', type],
            ['deletedAt', '==', null]
        ], { field: 'startDate', direction: 'desc' })
    }
}

export const eventRepository = new EventRepository()
