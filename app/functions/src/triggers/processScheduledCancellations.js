const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");
const { toISODate, toMonthKey } = require("../helpers/date");
const { saveAuditLog } = require("../shared/audit");

/**
 * Processa cancelamentos que foram programados para hoje.
 * Roda diariamente às 00:02 (America/Sao_Paulo).
 */
module.exports = createScheduledTrigger("2 0 * * *", "processScheduledCancellations", async () => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());
    const scheduledSnapshot = await db
        .collectionGroup("clientsContracts")
        .where("status", "==", "scheduled_cancellation")
        .where("cancelDate", "<=", todayIso)
        .get();

    let processedCount = 0;

    const processPromises = scheduledSnapshot.docs.map(async (docSnap) => {
        const contract = docSnap.data();
        if (!contract?.cancelDate || contract.cancelDate > todayIso) {
            return;
        }

        const contractRef = docSnap.ref;
        if (!contractRef) return;

        // 1. Remover matrículas futuras
        const enrollmentsRef = db
            .collection("tenants")
            .doc(contract.idTenant)
            .collection("branches")
            .doc(contract.idBranch)
            .collection("enrollments");
        const enrollmentsSnap = await enrollmentsRef
            .where("idClient", "==", contract.idClient)
            .get();
        const enrollmentsToRemove = enrollmentsSnap.docs.filter((e) => {
            const data = e.data();
            if (data.type === "recurring") return true;
            if (data.type === "single-session" && data.sessionDate >= todayIso) {
                return true;
            }
            return false;
        });

        for (const enrollmentDoc of enrollmentsToRemove) {
            await enrollmentDoc.ref.delete();
        }

        // 2. Atualizar status do contrato
        await contractRef.update({
            status: "canceled",
            canceledAt: admin.firestore.FieldValue.serverTimestamp(),
            previousStatus: contract.previousStatus || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2.1 Cancelar dívidas se configurado
        try {
            const settingsRef = db.doc(`tenants/${contract.idTenant}/branches/${contract.idBranch}/settings/general`);
            const settingsSnap = await settingsRef.get();
            const autoCancelDebt = settingsSnap.exists && settingsSnap.data().finance?.cancelDebtOnCancelledContracts === true;

            if (autoCancelDebt && contract.idSale) {
                const receivablesRef = db.collection(`tenants/${contract.idTenant}/branches/${contract.idBranch}/receivables`);
                const debtsSnap = await receivablesRef
                    .where("idSale", "==", contract.idSale)
                    .where("status", "==", "open")
                    .get();

                const debtBatch = db.batch();
                let debtCount = 0;
                debtsSnap.forEach(d => {
                    debtBatch.update(d.ref, {
                        status: "canceled",
                        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
                        cancelReason: "Cancelamento programado de contrato",
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    debtCount++;
                });
                if (debtCount > 0) await debtBatch.commit();
            }
        } catch (err) {
            console.error(`Erro ao cancelar dívidas do contrato ${contractRef.id}:`, err);
        }

        // 3. Atualizar summaries (daily/monthly)
        const dailyRef = db
            .collection("tenants")
            .doc(contract.idTenant)
            .collection("branches")
            .doc(contract.idBranch)
            .collection("dailySummary")
            .doc(todayIso);
        const monthId = toMonthKey(todayIso);
        const monthlyRef = db
            .collection("tenants")
            .doc(contract.idTenant)
            .collection("branches")
            .doc(contract.idBranch)
            .collection("monthlySummary")
            .doc(monthId);

        await dailyRef.set({
            idTenant: contract.idTenant,
            idBranch: contract.idBranch,
            id: todayIso,
        }, { merge: true });
        await monthlyRef.set({
            idTenant: contract.idTenant,
            idBranch: contract.idBranch,
            id: monthId,
        }, { merge: true });

        await dailyRef.update({
            contractsCanceledDay: admin.firestore.FieldValue.increment(1),
            churnDay: admin.firestore.FieldValue.increment(1),
            activeCount: admin.firestore.FieldValue.increment(-1),
        });
        await monthlyRef.update({
            contractsCanceledMonth: admin.firestore.FieldValue.increment(1),
            churnMonth: admin.firestore.FieldValue.increment(1),
            activeAvg: admin.firestore.FieldValue.increment(-1),
        });

        // Auditoria
        await saveAuditLog({
            idTenant: contract.idTenant,
            idBranch: contract.idBranch,
            uid: "system",
            action: "SYSTEM_CONTRACT_CANCEL_SCHEDULED",
            targetId: docSnap.id,
            description: `Cancelamento programado efetivado pelo sistema para o contrato ${docSnap.id}`,
            metadata: { cancelDate: contract.cancelDate, reason: contract.cancelReason }
        });

        processedCount += 1;
    });

    await Promise.all(processPromises);
    console.log(`[processScheduledCancellations] Finalizado. Processados: ${processedCount}`);
});
