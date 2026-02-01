import { BaseRepository } from './BaseRepository'

/**
 * Repositório para gerenciar logs de auditoria no Firestore.
 */
class AuditRepository extends BaseRepository {
    constructor() {
        super('audit_logs')
    }

    /**
     * Sobrescreve o create para garantir que logs de auditoria 
     * tenham uma estrutura específica se necessário.
     */
    async log(idTenant, idBranch, logData) {
        return await this.create(idTenant, idBranch, logData)
    }
}

export const auditRepository = new AuditRepository()
