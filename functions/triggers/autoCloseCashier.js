const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

/**
 * Fecha automaticamente os caixas abertos se a configuração permitir.
 * Executa todo dia às 23:55 (Horário de Brasília).
 */
module.exports = onSchedule({
    schedule: "55 23 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
}, async (event) => {
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

                console.log(`[DEBUG] Processando fechamento automático para Branch ${branchId}`);

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
                        // Use expectedBalance as the truth for auto-closing
                        actualBalance: data.expectedBalance || 0,
                        difference: 0,
                        closingNotes: "Fechamento Automático pelo Sistema",
                        updatedAt: now,
                        updatedBy: "SYSTEM"
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
