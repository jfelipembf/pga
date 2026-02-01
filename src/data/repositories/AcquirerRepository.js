import { BaseRepository } from "./BaseRepository";

export class AcquirerRepository extends BaseRepository {
    constructor() {
        super("acquirers");
    }

    async findActive(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true]
        ]);
    }
}

export const acquirerRepository = new AcquirerRepository();
