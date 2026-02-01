import { BaseRepository } from "./BaseRepository";
import { doc, getDoc } from "firebase/firestore";

export class StaffRepository extends BaseRepository {
    constructor() {
        super("staff");
    }

    /**
     * Busca o perfil do staff pelo UID dentro do contexto do tenant/branch
     */
    async findByUid(idTenant, idBranch, uid) {
        const ref = doc(this.getCollectionRef(idTenant, idBranch), uid);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    }
}

export const staffRepository = new StaffRepository();
