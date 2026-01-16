const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * ============================================================================
 * AUTOMATION ACTIONS
 * ____________________________________________________________________________
 *
 * 1. saveAutomation: Salvar ou Atualizar uma Automação.
 * 2. getAutomations: Buscar Automações de uma Filial.
 * 3. deleteAutomation: Excluir uma Automação.
 *
 * ============================================================================
 */

/**
 * Salvar ou Atualizar uma Automação
 * @param {object} data - { idTenant, idBranch, automationId (optional), automationData }
 */
exports.saveAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { idTenant, idBranch, automationId, automationData } = data;

    if (!idTenant || !idBranch || !automationData) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }

    try {
        const automationsRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("automations");

        const payload = {
            ...automationData,
            updatedAt: new Date(),
            updatedBy: context.auth.uid
        };

        if (automationId) {
            await automationsRef.doc(automationId).set(payload, { merge: true });
            return { success: true, id: automationId };
        } else {
            payload.createdAt = new Date();
            const docRef = await automationsRef.add(payload);
            return { success: true, id: docRef.id };
        }
    } catch (error) {
        console.error("Error saving automation:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

/**
 * Buscar Automações de uma Filial
 * @param {object} data - { idTenant, idBranch }
 */
exports.getAutomations = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { idTenant, idBranch } = data;

    if (!idTenant || !idBranch) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }

    try {
        const snapshot = await db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("automations")
            .orderBy("updatedAt", "desc")
            .get();

        const automations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: automations };
    } catch (error) {
        console.error("Error getting automations:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

/**
 * Excluir uma Automação
 * @param {object} data - { idTenant, idBranch, automationId }
 */
exports.deleteAutomation = functions.region("us-central1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { idTenant, idBranch, automationId } = data;

    if (!idTenant || !idBranch || !automationId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }

    try {
        await db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("automations")
            .doc(automationId)
            .delete();

        return { success: true };
    } catch (error) {
        console.error("Error deleting automation:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
