import { collection } from "firebase/firestore";
import { BaseRepository } from "./BaseRepository";

/**
 * Repositório para Sessões de Aulas (Sessions).
 * 
 * ATENÇÃO: As sessões estão na coleção RAIZ 'sessions', não aninhadas.
 * Estrutura: /sessions/{idSession}
 * Campos de filtro: idTenant, idBranch
 */
export class SessionRepository extends BaseRepository {
    constructor() {
        super("sessions");
    }

    // getCollectionRef removed to default to BaseRepository implementation (nested structure)
    // Testing if data is in tenants/{id}/branches/{id}/sessions instead of root

    /**
     * Busca sessões por intervalo de data
     */
    async findByDateRange(idTenant, idBranch, startDate, endDate) {
        // Try querying with 'deleted' boolean first (more likely based on user data)
        const q1 = await this.findWhere(idTenant, idBranch, [
            ['idTenant', '==', idTenant],
            ['idBranch', '==', idBranch],
            ['sessionDate', '>=', startDate],
            ['sessionDate', '<=', endDate],
            ['deleted', '==', false]
        ]);

        // If empty, try legacy 'deletedAt' check
        if (!q1 || q1.length === 0) {
            return await this.findWhere(idTenant, idBranch, [
                ['idTenant', '==', idTenant],
                ['idBranch', '==', idBranch],
                ['sessionDate', '>=', startDate],
                ['sessionDate', '<=', endDate],
                ['deletedAt', '==', null]
            ]);
        }

        return q1;
    }

    /**
     * Busca sessões ativas
     */
    async findActive(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['idTenant', '==', idTenant],
            ['idBranch', '==', idBranch],
            ['isActive', '==', true],
            ['deletedAt', '==', null]
        ]);
    }
}

export const sessionRepository = new SessionRepository();
