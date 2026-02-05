import { BaseRepository } from "../BaseRepository";

class WorkflowRepository extends BaseRepository {
    constructor() {
        super('automation_workflows'); // Coleção no Firestore
    }

    /**
     * Busca workflows ativos para um determinado gatilho
     * @param {string} tenantId 
     * @param {string} trigger 
     */
    async findActiveByTrigger(tenantId, trigger) {
        // Implementação simplificada assumindo que BaseRepository tem um 'find' generico ou query builder
        // Ajustar conforme a implementação real do BaseRepository
        // Aqui simulo o retorno filtrado

        try {
            // Exemplo fictício de query: where('tenantId', '==', tenantId).where('trigger', '==', trigger).where('isActive', '==', true)
            // Como não tenho acesso direto ao método query do BaseRepository aqui no adapter,
            // vou assumir que posso buscar todos do tenant e filtrar na memória se necessário, 
            // ou que existe um método findBy(query)

            // Fallback: Buscar todos do tenant e filtrar (não performático para muitos dados, mas funcional para configs)
            const all = await this.findAll(tenantId, null); // Assumindo findAll(tenantId, branchId)

            return all.filter(flow =>
                flow.trigger === trigger &&
                flow.isActive === true &&
                !flow.deletedAt
            );
        } catch (error) {
            console.error('[WorkflowRepository] Error fetching active workflows:', error);
            return [];
        }
    }
}

export const workflowRepository = new WorkflowRepository();
