import { BaseRepository } from "./BaseRepository";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";

export class TenantRepository extends BaseRepository {
    constructor() {
        super("tenants");
    }

    /**
     * Busca detalhes de um tenant específico pelo ID
     */
    async findTenantById(idTenant) {
        const ref = doc(this.db, 'tenants', idTenant);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
            return { idTenant: snapshot.id, ...snapshot.data() };
        }
        return null;
    }

    /**
     * Busca detalhes de uma branch específica dentro de um tenant
     */
    async findBranchById(idTenant, idBranch) {
        const ref = doc(this.db, 'tenants', idTenant, 'branches', idBranch);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
            return { idBranch: snapshot.id, ...snapshot.data() };
        }
        return null;
    }

    /**
     * Busca todas as unidades (branches) de um tenant
     */
    async findBranches(idTenant) {
        const ref = collection(this.db, 'tenants', idTenant, 'branches');
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({
            idBranch: doc.id,
            ...doc.data()
        }));
    }

    /**
     * Resolve o ID do Tenant a partir de um Slug ou ID
     */
    async resolveTenantId(slugOrId) {
        // 1. Tenta buscar por campo 'slug' na coleção de tenants
        const tenantsRef = collection(this.db, 'tenants');
        const q = query(tenantsRef, where("slug", "==", slugOrId), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }

        // 2. Se não achar, verifica se é um ID direto
        const tenantRef = doc(this.db, 'tenants', slugOrId);
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
            return slugOrId;
        }

        return null;
    }

    /**
     * Resolve o ID da Branch a partir de um Slug ou ID, dentro de um Tenant
     */
    async resolveBranchId(idTenant, slugOrId) {
        // 1. Tenta buscar por campo 'slug' na coleção de branches
        const branchesRef = collection(this.db, 'tenants', idTenant, 'branches');
        const q = query(branchesRef, where("slug", "==", slugOrId), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }

        // 2. Se não achar, verifica se é um ID direto
        const branchRef = doc(this.db, 'tenants', idTenant, 'branches', slugOrId);
        const branchSnap = await getDoc(branchRef);

        if (branchSnap.exists()) {
            return slugOrId;
        }

        return null;
    }
}

export const tenantRepository = new TenantRepository();
