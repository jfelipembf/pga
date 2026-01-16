const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");
const { toISODate } = require("../helpers/date");
const { saveAuditLog } = require("../shared/audit");

/**
 * Rotina diária para finalizar contratos expirados.
 * Roda às 00:03 (America/Sao_Paulo).
 *
 * Lógica:
 * 1. Busca contratos com status="active" e endDate < hoje.
 * 2. Atualiza status para "finished".
 * 3. Remove matrículas futuras (sessões ou recorrentes) que excedem a data de término.
 */
module.exports = createScheduledTrigger("3 0 * * *", "processExpiredContracts", async () => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());
    const expiredSnapshot = await db
        .collectionGroup("clientsContracts")
        .where("status", "==", "active")
        .where("endDate", "<", todayIso)
        .get();

    let processedCount = 0;

    const processPromises = expiredSnapshot.docs.map(async (docSnap) => {
        const contract = docSnap.data();
        const contractRef = docSnap.ref;
        const { idTenant, idBranch, idClient, endDate } = contract;

        if (!endDate) return;

        await db.runTransaction(async (tx) => {
            // 1. Mark as finished
            tx.update(contractRef, {
                status: "finished",
                finishedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                finishedBy: "system",
            });

            // Auditoria
            await saveAuditLog({
                idTenant, idBranch,
                uid: "system",
                action: "SYSTEM_CONTRACT_EXPIRED",
                targetId: contractRef.id,
                description: `Contrato ${contractRef.id} finalizado automaticamente por atingir a data de término (${endDate})`,
                metadata: { endDate }
            });
        });

        // 2. Clean up future enrollments
        try {
            const enrollmentsRef = db
                .collection("tenants")
                .doc(idTenant)
                .collection("branches")
                .doc(idBranch)
                .collection("enrollments");

            const enrollmentsSnap = await enrollmentsRef
                .where("idClient", "==", idClient)
                .get();

            const batch = db.batch();
            let batchCount = 0;

            enrollmentsSnap.docs.forEach((enrollDoc) => {
                const enroll = enrollDoc.data();
                if (enroll.type === "single-session" && enroll.sessionDate > endDate) {
                    batch.delete(enrollDoc.ref);
                    batchCount++;
                }
                if (enroll.type === "recurring") {
                    batch.delete(enrollDoc.ref);
                    batchCount++;
                }
            });

            if (batchCount > 0) {
                await batch.commit();
            }
        } catch (err) {
            console.error(`Error cleaning enrollments for expired contract ${docSnap.id}:`, err);
        }

        processedCount++;
    });

    await Promise.all(processPromises);
    console.log(`[processExpiredContracts] Finalizado. Processados: ${processedCount}`);
});
