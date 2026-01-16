const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");
const { toISODate, addDays, toMonthKey } = require("../helpers/date");
const { saveAuditLog } = require("../shared/audit");

/**
 * Processa suspensões programadas cuja data de início já chegou.
 * Roda diariamente às 00:01 (America/Sao_Paulo).
 */
module.exports = createScheduledTrigger("1 0 * * *", "processScheduledSuspensions", async () => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());
    const scheduledSnapshot = await db
        .collectionGroup("suspensions")
        .where("status", "==", "scheduled")
        .get();

    let processedCount = 0;

    const processPromises = scheduledSnapshot.docs.map(async (docSnap) => {
        const suspension = docSnap.data();
        if (!suspension?.startDate || suspension.startDate > todayIso) {
            return;
        }

        const contractRef = docSnap.ref.parent.parent;
        if (!contractRef) {
            return;
        }

        await db.runTransaction(async (tx) => {
            const contractSnap = await tx.get(contractRef);
            if (!contractSnap.exists) {
                return;
            }

            const contract = contractSnap.data();
            const currentEndDateStr = contract.endDate || contract.endAt;
            if (!currentEndDateStr) {
                return;
            }

            const daysRequested = Number(suspension.daysUsed || 0);
            if (!daysRequested) {
                return;
            }

            const currentEndDate = new Date(currentEndDateStr);
            if (Number.isNaN(currentEndDate.getTime())) {
                return;
            }

            const newEndDate = addDays(currentEndDate, daysRequested);
            const newEndDateStr = toISODate(newEndDate);

            tx.update(docSnap.ref, {
                status: "active",
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                previousEndDate: currentEndDateStr,
                newEndDate: newEndDateStr,
            });

            const pendingBefore = Number(contract.pendingSuspensionDays || 0);
            const pendingAfter = Math.max(pendingBefore - daysRequested, 0);

            tx.update(contractRef, {
                endDate: newEndDateStr,
                totalSuspendedDays:
                    Number(contract.totalSuspendedDays || 0) + daysRequested,
                pendingSuspensionDays: pendingAfter,
                status: "suspended",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Atualizar summaries quando a suspensão for ativada
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

            // Garante existência dos documentos
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

            // Incrementa contadores de suspensos
            await dailyRef.update({
                suspendedCount: admin.firestore.FieldValue.increment(1),
            });
            await monthlyRef.update({
                suspendedCount: admin.firestore.FieldValue.increment(1),
            });

            // Auditoria (Dentro da transação para garantir idTenant/idBranch)
            await saveAuditLog({
                idTenant: contract.idTenant,
                idBranch: contract.idBranch,
                uid: "system",
                action: "SYSTEM_CONTRACT_SUSPEND_SCHEDULED",
                targetId: contractRef.id,
                description: `Suspensão programada ativada pelo sistema para o contrato ${contractRef.id}`,
                metadata: { startDate: suspension.startDate, endDate: suspension.endDate, days: daysRequested }
            });
        });

        processedCount += 1;
    });

    await Promise.all(processPromises);
    console.log(`[processScheduledSuspensions] Finalizado. Processados: ${processedCount}`);
});
