import { BaseRepository } from "./BaseRepository";

export class TrainingRepository extends BaseRepository {
    constructor() {
        super("trainings");
    }

    /**
     * Busca treinos ativos (não deletados logicamente)
     */
    async findActive(idTenant, idBranch) {
        return this.findWhere(idTenant, idBranch, [["deletedAt", "==", null]], {
            field: "createdAt",
            direction: "desc",
        });
    }
}

export const trainingRepository = new TrainingRepository();
