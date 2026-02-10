import { BaseRepository } from "./BaseRepository";

/**
 * Repositório para Planejamento de Treinos (Calendário).
 * 
 * Estrutura: tenants/{idTenant}/branches/{idBranch}/training_plans
 */
export class TrainingPlanRepository extends BaseRepository {
    constructor() {
        super("training_plans");
    }

    /**
     * Busca planos de treino por data
     */
    async findByDate(idTenant, idBranch, dateString) {
        return this.findWhere(idTenant, idBranch, [
            ["dateString", "==", dateString],
            ["deletedAt", "==", null]
        ], {
            field: "createdAt",
            direction: "desc"
        });
    }
}

export const trainingPlanRepository = new TrainingPlanRepository();
