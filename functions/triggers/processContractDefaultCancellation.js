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
 * Utilitário: Adiciona dias a uma data
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Rotina diária para cancelar contratos com inadimplência superior ao configurado.
 * Frequência: Diariamente às 01:00 AM (Brasília).
 * 
 * IMPACTO CENTRALIZADO:
 * 1. Cancela Contratos por Inadimplência
 * 2. Inativa Clientes
 * 3. Sincroniza Dashboard (dashboardSummary/current)
 * 4. Gera Log de Auditoria
 */
module.exports = onSchedule({
    schedule: "00 1 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
}, async (event) => {
    const db = admin.firestore();

    logger.info("[processContractDefaultCancellation] Iniciando processamento de inadimplência...");

    try {
        const branchesSnap = await db.collectionGroup("branches").get();

        for (const branchDoc of branchesSnap.docs) {
            // Extrair caminhos seguros
            const path = branchDoc.ref.path;
            const segments = path.split("/");
            if (segments.length < 4) continue;

            const idTenant = segments[1];
            const idBranch = segments[3];

            const settingsRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/settings/general`);
            const settingsSnap = await settingsRef.get();
            if (!settingsSnap.exists) continue;

            const settings = settingsSnap.data();
            const cancelDays = Number(settings.finance?.cancelContractAfterDays || 0);

            if (cancelDays <= 0) continue;

            const limitDateIso = toISODate(addDays(new Date(), -cancelDays));
            const receivablesRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);

            const overdueSnap = await receivablesRef
                .where("status", "==", "open")
                .where("dueDate", "<=", limitDateIso)
                .get();

            if (overdueSnap.empty) continue;

            const clientIds = new Set();
            overdueSnap.docs.forEach(d => {
                const data = d.data();
                if (data.idClient) clientIds.add(data.idClient);
            });

            logger.info(`[processContractDefaultCancellation] Branch ${idBranch}: ${clientIds.size} clientes inadimplentes detectados.`);

            for (const idClient of clientIds) {
                try {
                    await db.runTransaction(async (tx) => {
                        const contractsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/clientContracts`);
                        const activeContractsSnap = await tx.get(contractsRef
                            .where("idClient", "==", idClient)
                            .where("status", "==", "active")
                        );

                        if (activeContractsSnap.empty) return;

                        let canceledInThisTx = 0;

                        activeContractsSnap.docs.forEach(c => {
                            tx.update(c.ref, {
                                status: "cancelled",
                                cancelReason: `Inadimplência automática (> ${cancelDays} dias)`,
                                canceledAt: FieldValue.serverTimestamp(),
                                updatedAt: FieldValue.serverTimestamp(),
                                canceledBy: "system"
                            });
                            canceledInThisTx++;
                        });

                        if (canceledInThisTx > 0) {
                            // 1. Atualizar Cliente (Centralizado)
                            const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
                            tx.update(clientRef, {
                                updatedAt: FieldValue.serverTimestamp()
                            });

                            // 1.1. Sincronizar campos computados (Computed)
                            const { syncClientComputedFields } = require("./clientComputedFields");
                            await syncClientComputedFields(tx, idTenant, idBranch, idClient);

                            // 2. Sincronizar Dashboard (Centralizado)
                            const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
                            tx.set(dashboardRef, {
                                activeclients: FieldValue.increment(-canceledInThisTx),
                                canceledclients: FieldValue.increment(canceledInThisTx),
                                lastUpdated: FieldValue.serverTimestamp()
                            }, { merge: true });

                            // 3. Audit Log (Centralizado)
                            const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                            tx.set(auditRef, {
                                idTenant, idBranch,
                                uid: "system",
                                action: "CONTRACT_CANCEL_DEFAULT",
                                entityType: "clientContract",
                                entityId: activeContractsSnap.docs[0].id,
                                description: `Cancelamento automático por inadimplência (> ${cancelDays} dias).`,
                                createdAt: FieldValue.serverTimestamp(),
                                metadata: { idClient, totalCanceled: canceledInThisTx }
                            });
                        }
                    });
                } catch (txErr) {
                    logger.error(`[processContractDefaultCancellation] Erro ao processar cliente ${idClient}:`, txErr);
                }
            }
        }

        logger.info("[processContractDefaultCancellation] Finalizado.");
    } catch (e) {
        logger.error("[processContractDefaultCancellation] Erro fatal:", e);
    }
});
