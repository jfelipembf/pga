const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");

/**
 * Fecha automaticamente os caixas abertos se a configuração permitir.
 * Executa todo dia às 23:59.
 */
module.exports = createScheduledTrigger("59 23 * * *", "autoCloseCashier", async () => {
    const db = admin.firestore();

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;
            const branchesSnap = await db.collection(`tenants/${tenantId}/branches`).get();

            for (const branchDoc of branchesSnap.docs) {
                const branchId = branchDoc.id;

                const settingsRef = db.doc(`tenants/${tenantId}/branches/${branchId}/settings/general`);
                const settingsSnap = await settingsRef.get();

                if (!settingsSnap.exists) continue;

                const settings = settingsSnap.data();
                const autoClose = settings.finance?.autoCloseCashier === true;

                if (!autoClose) continue;

                const cashierRef = db.collection(`tenants/${tenantId}/branches/${branchId}/cashierSessions`);
                const openSessionsSnap = await cashierRef.where("status", "==", "open").get();

                if (openSessionsSnap.empty) continue;

                const batch = db.batch();
                const now = admin.firestore.FieldValue.serverTimestamp();

                openSessionsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    batch.update(doc.ref, {
                        status: "closed",
                        closedAt: now,
                        autoClosed: true,
                        closingBalance: data.currentBalance || data.openingBalance || 0,
                        updatedAt: now,
                    });
                });

                await batch.commit();
            }
        }
    } catch (error) {
        console.error("Erro no fechamento automático de caixas:", error);
        throw error;
    }
});
