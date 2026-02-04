import { BaseRepository } from './BaseRepository';

class AreaRepository extends BaseRepository {
    constructor() {
        super('areas');
    }

    // Métodos herdados do BaseRepository: findAll, findById, findWhere, create, update, delete
}

export const areaRepository = new AreaRepository();
