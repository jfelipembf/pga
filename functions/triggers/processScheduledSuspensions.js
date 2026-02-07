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
 * Processa suspensões programadas cuja data de início já chegou.
 * Roda diariamente às 00:01 (America/Sao_Paulo).
 * 
 * IMPACTO CENTRALIZADO:
 * 1. Atualiza Status do Contrato p/ 'suspended'
 * 2. Atualiza Status do Cliente p/ 'suspended'
 * 3. Sincroniza Dashboard (dashboardSummary/current)
 * 4. Gera Log de Auditoria
 */
module.exports = onSchedule({
    schedule: "01 0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "256MiB",
}, async (event) => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());

    logger.info(`[processScheduledSuspensions] Iniciando check de suspensões para ${todayIso}...`);

    try {
        const scheduledSnapshot = await db
            .collectionGroup("suspensions")
            .where("status", "==", "scheduled")
            .where("startDate", "<=", todayIso)
            .get();

        if (scheduledSnapshot.empty) {
            logger.info("[processScheduledSuspensions] Nenhuma suspensão agendada para hoje.");
            return;
        }

        logger.info(`[processScheduledSuspensions] Encontradas ${scheduledSnapshot.size} suspensões para processar.`);

        for (const docSnap of scheduledSnapshot.docs) {
            const suspension = docSnap.data();
            const contractRef = docSnap.ref.parent.parent;

            if (!contractRef) {
                logger.warn(`[processScheduledSuspensions] Suspensão ${docSnap.id} órfã.`);
                continue;
            }

            try {
                await db.runTransaction(async (tx) => {
                    const contractSnap = await tx.get(contractRef);
                    if (!contractSnap.exists) return;

                    const contract = contractSnap.data();
                    const { idTenant, idBranch, idClient } = contract;
                    const currentEndDateStr = contract.endDate || contract.endAt;

                    if (!currentEndDateStr) {
                        logger.error(`[processScheduledSuspensions] Contrato ${contractRef.id} sem data de término.`);
                        return;
                    }

                    const daysRequested = Number(suspension.daysUsed || suspension.intendedDays || 0);
                    const currentEndDate = new Date(currentEndDateStr + "T12:00:00");
                    const newEndDate = addDays(currentEndDate, daysRequested);
                    const newEndDateStr = toISODate(newEndDate);

                    // 1. Atualizar documento da suspensão
                    tx.update(docSnap.ref, {
                        status: "active",
                        processedAt: FieldValue.serverTimestamp(),
                        previousEndDate: currentEndDateStr,
                        newEndDate: newEndDateStr,
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    // 2. Atualizar contrato
                    tx.update(contractRef, {
                        endDate: newEndDateStr,
                        totalSuspendedDays: FieldValue.increment(daysRequested),
                        status: "suspended",
                        'suspension.isSuspended': true,
                        'suspension.current': { ...suspension, status: 'active', processedAt: todayIso },
                        updatedAt: FieldValue.serverTimestamp(),
                    });

                    // 3. Atualizar Cliente (Centralizado)
                    if (idClient) {
                        const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
                        tx.update(clientRef, {
                            lifecycleStatus: 'suspended',
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }

                    // 4. Sincronizar Dashboard em Tempo Real (Centralizado)
                    const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
                    tx.set(dashboardRef, {
                        activeStudents: FieldValue.increment(-1),
                        suspendedStudents: FieldValue.increment(1),
                        lastUpdated: FieldValue.serverTimestamp()
                    }, { merge: true });

                    // 5. Audit Log (Centralizado)
                    const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                    tx.set(auditRef, {
                        idTenant, idBranch,
                        uid: "system",
                        action: "CONTRACT_SUSPENSION_AUTO_START",
                        entityType: "clientContract",
                        entityId: contractRef.id,
                        description: `Suspensão programada iniciada automaticamente. Vigência estendida até ${newEndDateStr}.`,
                        createdAt: FieldValue.serverTimestamp(),
                        metadata: { idClient, suspensionId: docSnap.id }
                    });

                });
                logger.info(`[processScheduledSuspensions] Sucesso: Contrato ${contractRef.id} processado.`);
            } catch (err) {
                logger.error(`[processScheduledSuspensions] Erro no processamento individual:`, err);
            }
        }

        logger.info("[processScheduledSuspensions] Finalizado.");

    } catch (error) {
        logger.error("[processScheduledSuspensions] Erro fatal:", error);
    }
});
