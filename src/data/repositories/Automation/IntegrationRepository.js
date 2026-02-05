import { BaseRepository } from "../BaseRepository";
import { doc, getDoc, setDoc } from "firebase/firestore";

export class IntegrationRepository extends BaseRepository {
    constructor() {
        super("settings");
    }

    /**
     * Recupera as configurações de integração (Evolution, IA) do tenant
     */
    async getSettings(tenantId) {
        if (!tenantId) return null;
        try {
            // Caminho: tenants/{id}/settings/integrations
            const ref = doc(this.db, 'tenants', tenantId, 'settings', 'integrations');
            const snap = await getDoc(ref);
            if (snap.exists()) {
                return snap.data();
            }
            return null;
        } catch (error) {
            console.error("Error fetching integration settings:", error);
            return null;
        }
    }

    /**
     * Salva as configurações de integração
     */
    async saveSettings(tenantId, data) {
        if (!tenantId) throw new Error("Tenant ID required");
        try {
            const ref = doc(this.db, 'tenants', tenantId, 'settings', 'integrations');
            await setDoc(ref, {
                ...data,
                updatedAt: new Date()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving integration settings:", error);
            throw error;
        }
    }
}

export const integrationRepository = new IntegrationRepository();
