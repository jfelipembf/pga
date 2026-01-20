const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { createScheduledTrigger } = require("./utils");
const { toISODate, addDays } = require("../helpers/date");
const { saveAuditLog } = require("../shared/audit");

/**
 * Gatilho diário para arquivar contratos cancelados antigos.
 * 
 * Regra: Contratos com status 'canceled' há mais de 15 dias são movidos para status 'inactive'.
 * Frequência: Diariamente às 02:00 AM (Horário de Brasília).
 */
module.exports = createScheduledTrigger("0 2 * * *", "processInactiveContracts", async () => {
    const db = admin.firestore();
    const today = new Date();
    // Data limite: 15 dias atrás
    const limitDate = addDays(today, -15);
    // Precisamos comparar com o Timestamp do Firestore (canceledAt). 
    // O Timestamp do Firestore é comparável com Date objects em queries.

    console.log(`[processInactiveContracts] Buscando contratos cancelados antes de ${limitDate.toISOString()} para inativar.`);

    try {
        // Busca em group collection é mais eficiente para varrer todos os branches
        const oldCanceledSnapshot = await db.collectionGroup("clientsContracts")
            .where("status", "==", "canceled")
            .where("canceledAt", "<=", limitDate)
            .get();

        if (oldCanceledSnapshot.empty) {
            console.log("[processInactiveContracts] Nenhum contrato encontrado para inativar.");
            return;
        }

        let processedCount = 0;
        const batchSize = 400; // Limite seguro para batch
        let batch = db.batch();
        let opsCount = 0;

        for (const doc of oldCanceledSnapshot.docs) {
            const contractRef = doc.ref;
            const contractData = doc.data();
            const { idTenant, idBranch, idClient } = contractData;

            // Atualiza status para inactive
            batch.update(contractRef, {
                status: "inactive",
                inactivatedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                inactivatedBy: "system",
                inactivationReason: "Cancelado há mais de 15 dias"
            });
            opsCount++;

            // Commit do batch quando atinge o limite
            if (opsCount >= batchSize) {
                await batch.commit();
                batch = db.batch();
                opsCount = 0;
            }

            processedCount++;
        }

        // Commit final dos restantes
        if (opsCount > 0) {
            await batch.commit();
        }

        console.log(`[processInactiveContracts] Sucesso. ${processedCount} contratos alterados para 'inactive'.`);

    } catch (error) {
        console.error("[processInactiveContracts] Erro ao processar contratos inativos:", error);
    }
});
