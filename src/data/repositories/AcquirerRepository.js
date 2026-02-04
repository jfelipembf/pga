import { BaseRepository } from "./BaseRepository";

export class AcquirerRepository extends BaseRepository {
    constructor() {
        super("acquirers");
    }

    async findActive(idTenant, idBranch) {
        return await this.findWhere(idTenant, idBranch, [
            ['isActive', '==', true],
            ['deletedAt', '==', null]
        ]);
    }
}

export const acquirerRepository = new AcquirerRepository();
