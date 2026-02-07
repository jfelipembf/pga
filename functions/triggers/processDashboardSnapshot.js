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
 * Trigger diário para criar Snapshots de Dashboard.
 * Executa diariamente às 23:55 (Brasília) para fechar o dia.
 * Cria/Atualiza o documento de resumo DIÁRIO e MENSAL.
 */
module.exports = onSchedule({
    schedule: "55 23 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
}, async (event) => {
    const db = admin.firestore();
    const todayIso = toISODate(new Date());
    const currentMonth = todayIso.substring(0, 7); // YYYY-MM

    logger.info(`[processDashboardSnapshot] Iniciando snapshot para ${todayIso}...`);

    try {
        // 1. Buscar todos os Branches (Units) ativos via Collection Group
        const branchesSnap = await db.collectionGroup("branches").get();

        if (branchesSnap.empty) {
            logger.info("[processDashboardSnapshot] Nenhuma unidade encontrada.");
            return;
        }

        const batchLimit = 400;
        let batch = db.batch();
        let opsCount = 0;

        for (const doc of branchesSnap.docs) {
            // Extrair caminhos seguros
            const path = doc.ref.path;
            const segments = path.split("/");
            if (segments.length < 4) continue;

            const tenantId = segments[1];
            const branchId = segments[3];

            // --- Calcular Dados do Dia ---
            // Pegamos do 'dashboardSummary/current' que é atualizado em tempo real pelos hooks e salvamos o snapshot do estado final.
            const summaryRef = db.doc(`tenants/${tenantId}/branches/${branchId}/dashboardSummary/current`);
            const summarySnap = await summaryRef.get();

            if (!summarySnap.exists) {
                continue;
            }

            const currentData = summarySnap.data();

            // Salvar Snapshot Diário (tenants/.../dashboardDaily/{YYYY-MM-DD})
            const dailyRef = db.doc(`tenants/${tenantId}/branches/${branchId}/dashboardDaily/${todayIso}`);
            batch.set(dailyRef, {
                ...currentData,
                date: todayIso,
                snapshotAt: FieldValue.serverTimestamp()
            });
            opsCount++;

            // Salvar/Atualizar Snapshot Mensal (tenants/.../dashboardSummary/{YYYY-MM})
            const monthlyRef = db.doc(`tenants/${tenantId}/branches/${branchId}/dashboardSummary/${currentMonth}`);
            batch.set(monthlyRef, {
                ...currentData,
                month: currentMonth,
                lastSnapshotAt: FieldValue.serverTimestamp()
            }, { merge: true });
            opsCount++;

            // Commit em lotes
            if (opsCount >= batchLimit) {
                await batch.commit();
                batch = db.batch();
                opsCount = 0;
            }
        }

        if (opsCount > 0) {
            await batch.commit();
        }

        logger.info("[processDashboardSnapshot] Finalizado com sucesso.");

    } catch (err) {
        logger.error("[processDashboardSnapshot] Erro fatal:", err);
    }
});
