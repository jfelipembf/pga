const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Inicialização segura do admin
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Utilitário: Converte data para ISO (YYYY-MM-DD)
 */
function toISODate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Processa cancelamentos que foram programados para hoje.
 * Roda diariamente às 00:05 (America/Sao_Paulo).
 * 
 * IMPACTO CENTRALIZADO:
 * 1. Cancela Contratos (status -> cancelled)
 * 2. Inativa Clientes (lifeCycleStatus -> inactive)
 * 3. Remove Matrículas Futuras (Agradecimento de ocupação)
 * 4. Sincroniza Dashboard (dashboardSummary/current)
 * 5. Gera Log de Auditoria
 * 6. (Opcional) Cancela Dívidas Vincendas
 */
module.exports = onSchedule({
    schedule: "05 0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
}, async (event) => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());

    logger.info(`[processScheduledCancellations] Iniciando check de cancelamentos para ${todayIso}...`);

    try {
        // Correção do nome da coleção para 'clientContracts'
        const scheduledSnapshot = await db
            .collectionGroup("clientContracts")
            .where("status", "==", "scheduled_cancellation")
            .where("cancelDate", "<=", todayIso)
            .get();

        if (scheduledSnapshot.empty) {
            logger.info("[processScheduledCancellations] Nenhum cancelamento programado para hoje.");
            return;
        }

        logger.info(`[processScheduledCancellations] Encontrados ${scheduledSnapshot.size} cancelamentos.`);

        for (const docSnap of scheduledSnapshot.docs) {
            const contract = docSnap.data();
            const contractRef = docSnap.ref;
            const { idTenant, idBranch, idClient, idSale } = contract;

            try {
                await db.runTransaction(async (tx) => {
                    // 1. Matrículas Futuras (Ocupação)
                    const enrollmentsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/enrollments`);
                    const enrollmentsSnap = await tx.get(enrollmentsRef.where("idClient", "==", idClient));

                    enrollmentsSnap.forEach(eDoc => {
                        const eData = eDoc.data();
                        if (eData.type === "recurring" || (eData.type === "single-session" && eData.sessionDate >= todayIso)) {
                            tx.delete(eDoc.ref);
                        }
                    });

                    // 2. Atualizar Status do Contrato
                    tx.update(contractRef, {
                        status: "cancelled",
                        canceledAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp(),
                    });

                    // 3. Atualizar Status do Cliente (Centralizado)
                    if (idClient) {
                        const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
                        tx.update(clientRef, {
                            lifecycleStatus: 'inactive',
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }

                    // 4. Cancelar Dívidas (se configurado)
                    if (idSale) {
                        const settingsRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/settings/general`);
                        const settingsSnap = await tx.get(settingsRef);
                        const autoCancelDebt = settingsSnap.exists && settingsSnap.data().finance?.cancelDebtOnCancelledContracts === true;

                        if (autoCancelDebt) {
                            const receivablesRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);
                            const debtsSnap = await tx.get(
                                receivablesRef
                                    .where("idSale", "==", idSale)
                                    .where("status", "==", "open")
                            );

                            debtsSnap.forEach(dDoc => {
                                tx.update(dDoc.ref, {
                                    status: "cancelled",
                                    canceledAt: FieldValue.serverTimestamp(),
                                    cancelReason: "Cancelamento automático de contrato",
                                    updatedAt: FieldValue.serverTimestamp()
                                });
                            });
                        }
                    }

                    // 5. Sincronizar Dashboard (Centralizado)
                    const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
                    tx.set(dashboardRef, {
                        activeclients: FieldValue.increment(-1),
                        canceledclients: FieldValue.increment(1),
                        lastUpdated: FieldValue.serverTimestamp()
                    }, { merge: true });

                    // 6. Audit Log (Centralizado)
                    const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                    tx.set(auditRef, {
                        idTenant, idBranch,
                        uid: "system",
                        action: "CONTRACT_CANCEL_AUTO",
                        entityType: "clientContract",
                        entityId: contractRef.id,
                        description: `Cancelamento programado executado automaticamente. Cliente inativado e matrículas futuras removidas.`,
                        createdAt: FieldValue.serverTimestamp(),
                        metadata: { idClient, idSale }
                    });
                });

                logger.info(`[processScheduledCancellations] Sucesso: Contrato ${contractRef.id} cancelado.`);
            } catch (err) {
                logger.error(`[processScheduledCancellations] Erro p/ contrato ${contractRef.id}:`, err);
            }
        }

        logger.info("[processScheduledCancellations] Finalizado.");

    } catch (error) {
        logger.error("[processScheduledCancellations] Erro fatal:", error);
    }
});
