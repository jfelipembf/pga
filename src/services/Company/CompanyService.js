import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";

const db = getFirestore();
const storage = getStorage();

class CompanyService {
    /**
     * Get company data for a tenant
     * @param {string} idTenant
     * @returns {Promise<Object>} Company data
     */
    async getCompanyData(idTenant) {
        if (!idTenant) return null;

        try {
            const tenantRef = doc(db, "tenants", idTenant);
            const tenantSnap = await getDoc(tenantRef);

            if (tenantSnap.exists()) {
                const data = tenantSnap.data();
                return data.company || {}; // Return company field or empty object
            }
            return null;
        } catch (error) {
            console.error("Error fetching company data:", error);
            toast.error("Erro ao carregar dados da empresa.");
            throw error;
        }
    }

    /**
     * Update company data for a tenant
     * @param {string} idTenant
     * @param {Object} data
     * @returns {Promise<void>}
     */
    async updateCompanyData(idTenant, data) {
        if (!idTenant) throw new Error("Tenant ID is required");

        try {
            const tenantRef = doc(db, "tenants", idTenant);
            // Update the 'company' field in the tenant document
            await updateDoc(tenantRef, {
                company: data
            });
            toast.success("Dados da empresa atualizados com sucesso!");
        } catch (error) {
            console.error("Error updating company data:", error);
            toast.error("Erro ao atualizar dados da empresa.");
            throw error;
        }
    }

    /**
     * Upload company logo
     * @param {string} idTenant
     * @param {File} file
     * @returns {Promise<string>} Download URL
     */
    async uploadLogo(idTenant, file) {
        if (!idTenant || !file) throw new Error("Tenant ID and file are required");

        try {
            const storageRef = ref(storage, `tenants/${idTenant}/company/logo_${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast.error("Erro ao fazer upload da logo.");
            throw error;
        }
    }
}

const companyService = new CompanyService();
export default companyService;
