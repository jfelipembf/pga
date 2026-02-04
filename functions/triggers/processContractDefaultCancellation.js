const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { createScheduledTrigger } = require("./utils");
const { toISODate, addDays } = require("../shared");

/**
 * Rotina diária para cancelar contratos com inadimplência superior ao configurado.
 * Frequência: Diariamente às 01:00 AM (Brasília).
 */
module.exports = createScheduledTrigger("40 1 * * *", "processContractDefaultCancellation", async () => {
    const db = admin.firestore();

    try {
        const tenantsSnap = await db.collection("tenants").get();

        await Promise.all(tenantsSnap.docs.map(async (tenantDoc) => {
            const tenantId = tenantDoc.id;
            const branchesSnap = await db.collection(`tenants/${tenantId}/branches`).get();

            await Promise.all(branchesSnap.docs.map(async (branchDoc) => {
                const branchId = branchDoc.id;

                const settingsRef = db.doc(`tenants/${tenantId}/branches/${branchId}/settings/general`);
                const settingsSnap = await settingsRef.get();
                if (!settingsSnap.exists) return;

                const settings = settingsSnap.data();
                const cancelDays = Number(settings.finance?.cancelContractAfterDays || 0);

                if (cancelDays <= 0) return;

                const limitDateIso = toISODate(addDays(new Date(), -cancelDays));
                const receivablesRef = db.collection(`tenants/${tenantId}/branches/${branchId}/receivables`);

                const overdueSnap = await receivablesRef
                    .where("status", "==", "open")
                    .where("dueDate", "<=", limitDateIso)
                    .get();

                if (overdueSnap.empty) return;

                const clientIds = new Set();
                overdueSnap.docs.forEach(d => {
                    const data = d.data();
                    if (data.idClient) clientIds.add(data.idClient);
                });

                // Processa clientes em paralelo
                await Promise.all(Array.from(clientIds).map(async (clientId) => {
                    const contractsRef = db.collection(`tenants/${tenantId}/branches/${branchId}/clientsContracts`);
                    const activeContractsSnap = await contractsRef
                        .where("idClient", "==", clientId)
                        .where("status", "==", "active")
                        .get();

                    if (activeContractsSnap.empty) return;

                    const batch = db.batch();
                    let batchCount = 0;

                    activeContractsSnap.docs.forEach(c => {
                        batch.update(c.ref, {
                            status: "canceled",
                            cancelReason: `Inadimplência automática (> ${cancelDays} dias)`,
                            canceledAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp(),
                            canceledBy: "system"
                        });
                        batchCount++;
                    });

                    if (batchCount > 0) await batch.commit();
                }));
            }));
        }));

        console.log("[processContractDefaultCancellation] Execução finalizada.");
    } catch (e) {
        console.error("Erro na rotina de cancelamento por inadimplência:", e);
        throw e;
    }
});
