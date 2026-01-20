const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { createScheduledTrigger } = require("./utils");

/**
 * Fecha automaticamente os caixas abertos se a configuração permitir.
 * Executa todo dia às 23:59.
 */
module.exports = createScheduledTrigger("50 8 * * *", "autoCloseCashier", async () => {
    const db = admin.firestore();

    try {
        const tenantsSnap = await db.collection("tenants").get();

        // Processa todos os tenants em paralelo
        await Promise.all(tenantsSnap.docs.map(async (tenantDoc) => {
            const tenantId = tenantDoc.id;
            const branchesSnap = await db.collection(`tenants/${tenantId}/branches`).get();

            // Processa todas as branches em paralelo
            await Promise.all(branchesSnap.docs.map(async (branchDoc) => {
                const branchId = branchDoc.id;

                const settingsRef = db.doc(`tenants/${tenantId}/branches/${branchId}/settings/general`);
                const settingsSnap = await settingsRef.get();

                if (!settingsSnap.exists) {
                    console.log(`[DEBUG] Settings não encontradas para ${branchId}`);
                    return;
                }

                const settings = settingsSnap.data();
                const autoClose = settings.finance?.autoCloseCashier === true;

                console.log(`[DEBUG] Branch ${branchId} - AutoClose Habilitado: ${autoClose}`);

                if (!autoClose) return;

                const cashierRef = db.collection(`tenants/${tenantId}/branches/${branchId}/cashierSessions`);
                const openSessionsSnap = await cashierRef.where("status", "==", "open").get();

                console.log(`[DEBUG] Caixas abertos encontrados: ${openSessionsSnap.size}`);

                if (openSessionsSnap.empty) return;

                const batch = db.batch();
                const now = FieldValue.serverTimestamp();
                let ops = 0;

                openSessionsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    batch.update(doc.ref, {
                        status: "closed",
                        closedAt: now,
                        autoClosed: true,
                        closingBalance: data.currentBalance || data.openingBalance || 0,
                        updatedAt: now,
                    });
                    ops++;
                });

                if (ops > 0) {
                    await batch.commit();
                }
            }));
        }));

        console.log("[autoCloseCashier] Execução finalizada.");
    } catch (error) {
        console.error("Erro no fechamento automático de caixas:", error);
        throw error;
    }
});
