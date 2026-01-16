const admin = require("firebase-admin");
const { toISODate, addDays } = require("../../helpers/date");
const { sendWhatsAppMessageInternal } = require("../../notifications/whatsapp");

/**
 * Processa aulas experimentais do dia seguinte e envia lembretes.
 */
exports.processDailyExperimentalClasses = async () => {
    const db = admin.firestore();
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const tomorrowIso = toISODate(tomorrow);

    console.log(`[ExperimentalAutomation] Buscando aulas experimentais para: ${tomorrowIso}`);

    // Busca tenant/branch para iterar e verificar configs de automação
    const tenantsSnap = await db.collection("tenants").get();

    for (const tenantDoc of tenantsSnap.docs) {
        const idTenant = tenantDoc.id;
        const branchesSnap = await db.collection(`tenants/${idTenant}/branches`).get();

        for (const branchDoc of branchesSnap.docs) {
            const idBranch = branchDoc.id;

            // 1. Verificar se a automação está ativa para esta filial
            const automationSnap = await db
                .collection(`tenants/${idTenant}/branches/${idBranch}/automations`)
                .where("trigger", "==", "EXPERIMENTAL_CLASS_DAY_BEFORE")
                .where("active", "==", true)
                .limit(1)
                .get();

            if (automationSnap.empty) {
                continue; // Automação não configurada para esta filial
            }

            const automation = automationSnap.docs[0].data();
            // Template padrão definido pelo usuário, caso não tenha personalizado no banco
            const defaultMessage = "Olá {name}, sua aula experimental é amanhã! Lembre-se de trazer touca e óculos. Para natação baby, responsável também usa touca. Chegue no horário! 🏊‍♂️";
            const messageTemplate = automation.message || defaultMessage;

            // 2. Buscar matrículas experimentais (single-session) para amanhã
            const enrollmentsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/enrollments`);
            const snapshot = await enrollmentsRef
                .where("type", "==", "single-session") // Assumindo que experimental usa single-session
                .where("sessionDate", "==", tomorrowIso)
                .where("status", "==", "active")
                .get();

            if (snapshot.empty) continue;

            const batchPromises = snapshot.docs.map(async (doc) => {
                const enrollment = doc.data();
                const { idClient, clientName, clientPhone } = enrollment;

                if (!clientPhone) return;

                // Montar mensagem
                let message = messageTemplate
                    .replace(/{name}/g, clientName || "Cliente")
                    .replace(/{date}/g, tomorrowIso.split("-").reverse().join("/"))
                    .replace(/{time}/g, enrollment.startTime || "")
                    .replace(/{activity}/g, enrollment.activityName || "");

                // Enviar WhatsApp
                try {
                    await sendWhatsAppMessageInternal(
                        idTenant,
                        idBranch,
                        clientPhone,
                        message,
                        null // urlImage
                    );

                    console.log(`[ExperimentalAutomation] Mensagem enviada para ${clientName} (${idClient})`);
                } catch (err) {
                    console.error(`[ExperimentalAutomation] Erro ao enviar para ${clientName}:`, err);
                }
            });

            await Promise.all(batchPromises);
        }
    }
};
