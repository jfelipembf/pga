const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Inicialização segura do admin
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Utilitário: Subtrai dias de uma data
 */
function subtractDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

/**
 * Utilitário: Converte data para ISO (YYYY-MM-DD)
 */
function toISODate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Processa Alunos "Estacionados" no Funil (Aulas Experimentais Expiradas).
 * Roda diariamente de madrugada.
 * 
 * LÓGICA:
 * Pega clientes com lifecycleStatus 'waiting', 'attended' ou 'scheduled' 
 * que não tiveram atualização no funil há mais de X dias.
 * Se o aluno NÃO comprou, altera o ciclo de vida para 'lost'.
 * Além disso, marca matrículas Trial ativas de N dias atrás como 'expired'.
 */
module.exports = onSchedule({
    schedule: "10 0 * * *", // Roda 00:10 
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
}, async (event) => {
    const db = admin.firestore();

    // Define o prazo limite (default: 10 dias sem atualizar funil)
    const DAYS_TO_EXPIRE = 10;
    const targetDate = subtractDays(new Date(), DAYS_TO_EXPIRE);
    const targetDateIso = toISODate(targetDate);

    logger.info(`[processStaleLeads] Buscando clientes estacionados no funil e aulas experimentais expiradas em ou antes de ${targetDateIso}...`);

    try {
        // PARTE 1: Processar Matrículas Trial Antigas (Faxina)
        const trialsSnapshot = await db
            .collectionGroup("enrollments")
            .where("enrollmentType", "==", "trial")
            .where("status", "==", "active")
            .where("startDate", "<=", targetDateIso)
            .get();

        if (!trialsSnapshot.empty) {
            logger.info(`[processStaleLeads] Encontradas ${trialsSnapshot.size} matrículas trial não finalizadas.`);
            const batch = db.batch();
            let batchCount = 0;
            for (const trialDoc of trialsSnapshot.docs) {
                batch.update(trialDoc.ref, {
                    status: "expired",
                    expiredAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                });
                batchCount++;
                if (batchCount >= 500) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
            if (batchCount > 0) {
                await batch.commit();
            }
        }

        // PARTE 2: Processar Funil de Vendas Travado (Oportunidades Perdidas)
        const staleClientsSnapshot = await db
            .collectionGroup("clients")
            .where("lifecycleStatus", "in", ["scheduled", "attended", "waiting"])
            .get();

        if (staleClientsSnapshot.empty) {
            logger.info("[processStaleLeads] Nenhum cliente no funil precisando de processamento.");
            return;
        }

        let processCount = 0;

        for (const clientDoc of staleClientsSnapshot.docs) {
            const clientData = clientDoc.data();
            const clientRef = clientDoc.ref;

            // Verifica data de última atualização
            // Se o funnel não tiver 'lifecycle.updatedAt', usa a data de criação.
            let lastUpdateDate = clientData.lifecycle?.updatedAt || clientData.lifecycle?.createdAt || clientData.createdAt || clientData.updatedAt;

            if (!lastUpdateDate) continue; // Cliente anômalo

            // Converte pra Date com safety check
            let lastUpdateObj;
            if (typeof lastUpdateDate.toDate === 'function') {
                lastUpdateObj = lastUpdateDate.toDate();
            } else if (typeof lastUpdateDate === 'string') {
                lastUpdateObj = new Date(lastUpdateDate);
            } else {
                continue; // Formato desconhecido
            }

            const lastUpdateIso = toISODate(lastUpdateObj);

            // Se a atualização foi ANTES ou NO DIA do target (Ex: 10 dias atrás)
            if (lastUpdateIso <= targetDateIso) {
                try {
                    await db.runTransaction(async (tx) => {
                        const currentSnap = await tx.get(clientRef);
                        if (!currentSnap.exists) return;

                        const currentData = currentSnap.data();

                        // Safety check: só altera se ainda for status de funil
                        if (["scheduled", "attended", "waiting"].includes(currentData.lifecycleStatus)) {
                            tx.update(clientRef, {
                                lifecycleStatus: "lost",
                                "lifecycle.lostAt": FieldValue.serverTimestamp(),
                                "lifecycle.lostReason": `Estacionado no estágio '${currentData.lifecycleStatus}' por mais de ${DAYS_TO_EXPIRE} dias.`,
                                updatedAt: FieldValue.serverTimestamp(),
                            });

                            // Audit Logger
                            const pathParts = clientRef.path.split('/');
                            const idTenant = pathParts[1];
                            const idBranch = pathParts[3];
                            const idClient = clientRef.id;

                            const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                            tx.set(auditRef, {
                                idTenant, idBranch,
                                uid: "system",
                                action: "LIFECYCLE_LOST_AUTO",
                                entityType: "client",
                                entityId: idClient,
                                description: `Ciclo de vida alterado para Perdido (LOST) automático por inatividade (${DAYS_TO_EXPIRE} dias). Estava como '${currentData.lifecycleStatus}'.`,
                                createdAt: FieldValue.serverTimestamp(),
                            });
                            processCount++;
                        }
                    });
                } catch (err) {
                    logger.error(`[processStaleLeads] Erro processando cliente ${clientRef.id}:`, err);
                }
            }
        }

        logger.info(`[processStaleLeads] Finalizado. ${processCount} clientes movidos para LOST.`);

    } catch (error) {
        logger.error("[processStaleLeads] Erro fatal:", error);
    }
});
