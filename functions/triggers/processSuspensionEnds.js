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
 * Processa o fim de suspensões ativas cuja data de término já chegou.
 * Roda diariamente às 00:03 (America/Sao_Paulo).
 * 
 * IMPACTO CENTRALIZADO:
 * 1. Reativa Contratos (status -> active)
 * 2. Reativa Clientes (lifeCycleStatus -> active)
 * 3. Sincroniza Dashboard (dashboardSummary/current)
 * 4. Gera Log de Auditoria
 */
module.exports = onSchedule({
    schedule: "03 0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "256MiB",
}, async (event) => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());

    logger.info(`[processSuspensionEnds] Iniciando check de reativações para ${todayIso}...`);

    try {
        const activeSuspensionsSnapshot = await db
            .collectionGroup("suspensions")
            .where("status", "==", "active")
            .where("endDate", "<=", todayIso)
            .get();

        if (activeSuspensionsSnapshot.empty) {
            logger.info("[processSuspensionEnds] Nenhuma suspensão terminando hoje.");
            return;
        }

        for (const docSnap of activeSuspensionsSnapshot.docs) {
            const suspension = docSnap.data();
            const contractRef = docSnap.ref.parent.parent;

            if (!contractRef) continue;

            try {
                await db.runTransaction(async (tx) => {
                    const contractSnap = await tx.get(contractRef);
                    if (!contractSnap.exists) return;

                    const contract = contractSnap.data();
                    const { idTenant, idBranch, idClient } = contract;

                    // Verificar se há outras suspensões ativas (raro, mas segurança)
                    const otherSuspensionsSnap = await db.collection(docSnap.ref.parent.path)
                        .where("status", "==", "active")
                        .get();

                    const hasOtherActiveSuspensions = otherSuspensionsSnap.docs.some(
                        (otherDoc) => otherDoc.id !== docSnap.id && otherDoc.data().endDate > todayIso
                    );

                    // 1. Finalizar esta suspensão
                    tx.update(docSnap.ref, {
                        status: "completed",
                        completedAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    // 2. Se não houver outras pausas, reativa o contrato e o cliente
                    if (!hasOtherActiveSuspensions && contract.status === "suspended") {

                        // Atualiza Contrato
                        tx.update(contractRef, {
                            status: "active",
                            'suspension.isSuspended': false,
                            updatedAt: FieldValue.serverTimestamp(),
                        });

                        // Atualiza Cliente
                        if (idClient) {
                            const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
                            tx.update(clientRef, {
                                lifecycleStatus: 'active',
                                updatedAt: FieldValue.serverTimestamp()
                            });
                        }

                        // 3. Sincroniza Dashboard (Centralizado)
                        const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
                        tx.set(dashboardRef, {
                            activeclients: FieldValue.increment(1),
                            suspendedclients: FieldValue.increment(-1),
                            lastUpdated: FieldValue.serverTimestamp()
                        }, { merge: true });

                        // 4. Audit Log (Centralizado)
                        const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                        tx.set(auditRef, {
                            idTenant, idBranch,
                            uid: "system",
                            action: "CONTRACT_SUSPENSION_AUTO_END",
                            entityType: "clientContract",
                            entityId: contractRef.id,
                            description: `Suspensão finalizada automaticamente pelo sistema. Aluno reativado.`,
                            createdAt: FieldValue.serverTimestamp(),
                            metadata: { idClient, suspensionId: docSnap.id }
                        });

                        logger.info(`[processSuspensionEnds] Sucesso: Reativado contrato ${contractRef.id}`);
                    }
                });
            } catch (err) {
                logger.error(`[processSuspensionEnds] Erro no processamento individual:`, err);
            }
        }

        logger.info("[processSuspensionEnds] Finalizado.");

    } catch (error) {
        logger.error("[processSuspensionEnds] Erro fatal:", error);
    }
});
