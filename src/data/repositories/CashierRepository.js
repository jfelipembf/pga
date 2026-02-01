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
}

export const cashierRepository = new CashierRepository()
