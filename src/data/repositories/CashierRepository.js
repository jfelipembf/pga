import { query, where, limit, getDocs } from 'firebase/firestore'
import { BaseRepository } from './BaseRepository'

/**
 * Repositório para Sessões de Caixa (CashierSessions).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/cashierSessions
 */
class CashierRepository extends BaseRepository {
    constructor() {
        super('cashierSessions')
    }

    /**
     * Encontra todas as sessões de caixa abertas na unidade.
     */
    async findActiveSessions(idTenant, idBranch) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        const q = query(
            ref,
            where("status", "==", "open")
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    }

    /**
     * Encontra a sessão de caixa aberta para um usuário específico.
     */
    async findOpenSession(idTenant, idBranch, userId) {
        const ref = this.getCollectionRef(idTenant, idBranch)
        const q = query(
            ref,
            where("idUser", "==", userId),
            where("status", "==", "open"),
            limit(1)
        )
        const snapshot = await getDocs(q)
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    }

    /**
     * Encontra sessões de caixa por data de abertura.
     */
    async findByDate(idTenant, idBranch, date) {
        // Importar normalizeDate dentro do método ou no topo se possível (mas create-react-app pode reclamar de imports fora)
        // Assumindo que o date passado já é um objeto Date válido ou string
        // Precisamos criar startOfDay e endOfDay
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        // ATENÇÃO: Queries com range na mesma data requerem indice composto se houver orderBy.
        // Aqui faremos simples.

        return await this.findWhere(idTenant, idBranch, [
            ['openedAt', '>=', start],
            ['openedAt', '<=', end]
        ], { field: 'openedAt', direction: 'desc' });
    }
}

export const cashierRepository = new CashierRepository()
