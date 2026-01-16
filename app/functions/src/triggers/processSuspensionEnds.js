const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");
const { toISODate, toMonthKey } = require("../helpers/date");
const { saveAuditLog } = require("../shared/audit");

/**
 * Processa o fim de suspensões ativas cuja data de término já chegou.
 * Reativa contratos e atualiza summaries.
 * Roda diariamente às 00:03 (America/Sao_Paulo), após os cancelamentos.
 */
module.exports = createScheduledTrigger("3 0 * * *", "processSuspensionEnds", async () => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());
    const activeSuspensionsSnapshot = await db
        .collectionGroup("suspensions")
        .where("status", "==", "active")
        .where("endDate", "<=", todayIso)
        .get();

    let processedCount = 0;

    const processPromises = activeSuspensionsSnapshot.docs.map(
        async (docSnap) => {
            const suspension = docSnap.data();
            if (!suspension?.endDate || suspension.endDate > todayIso) {
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

                // Verificar se há outras suspensões ativas
                // ou agendadas para este contrato
                const otherSuspensionsRef = contractRef.collection("suspensions");
                const otherSuspensionsSnap = await tx.get(
                    otherSuspensionsRef.where("status", "in", ["active", "scheduled"]),
                );

                const hasOtherSuspensions = otherSuspensionsSnap.docs.some(
                    (otherDoc) => otherDoc.id !== docSnap.id,
                );

                // Marcar esta suspensão como concluída
                tx.update(docSnap.ref, {
                    status: "completed",
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Se não há outras suspensões, reativar o contrato
                if (!hasOtherSuspensions && contract.status === "suspended") {
                    tx.update(contractRef, {
                        status: "active",
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    // Atualizar summaries - decrementar suspensos
                    // e incrementar ativos
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

                    // Decrementa suspensos e incrementa ativos
                    await dailyRef.update({
                        suspendedCount: admin.firestore.FieldValue.increment(-1),
                        activeCount: admin.firestore.FieldValue.increment(1),
                    });
                    await monthlyRef.update({
                        suspendedCount: admin.firestore.FieldValue.increment(-1),
                        activeAvg: admin.firestore.FieldValue.increment(1),
                    });

                    // Auditoria
                    await saveAuditLog({
                        idTenant: contract.idTenant,
                        idBranch: contract.idBranch,
                        uid: "system",
                        action: "SYSTEM_CONTRACT_REACTIVATE_AFTER_SUSPENSION",
                        targetId: contractRef.id,
                        description: `Contrato ${contractRef.id} reativado automaticamente após fim da suspensão.`
                    });
                }
            });

            processedCount += 1;
        },
    );

    await Promise.all(processPromises);
    console.log(`[processSuspensionEnds] Finalizado. Processados: ${processedCount}`);
});
