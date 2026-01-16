const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Retrieves integration config internally (server-side).
 * Does NOT check auth context, assumes caller has permission.
 * @param {string} idTenant 
 * @param {string} idBranch 
 * @param {string} integrationId 
 * @returns {Promise<object>} Config object or null
 */
exports.getIntegrationConfigInternal = async (idTenant, idBranch, integrationId) => {
    if (!idTenant || !idBranch || !integrationId) {
        throw new Error("Missing required params: idTenant, idBranch, integrationId");
    }

    try {
        const targetRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("integrations")
            .doc(integrationId);

        const doc = await targetRef.get();

        if (!doc.exists) {
            return null;
        }

        return doc.data();
    } catch (error) {
        console.error(`Error fetching integration ${integrationId}:`, error);
        throw error;
    }
};
