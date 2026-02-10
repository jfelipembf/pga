const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function agendada para enviar lembretes de aulas experimentais do dia.
 * Roda diariamente às 08:00 (Horário de Brasília/São Paulo).
 * 
 * DESIGN ROBUSTO: Percorre tenants e branches para evitar dependência de índices compostos de Collection Group.
 */
module.exports = onSchedule({
    schedule: "00 08 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 5,
}, async (event) => {
    const db = admin.firestore();

    // Obter data atual no formato YYYY-MM-DD em São Paulo
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    logger.info(`[checkExperimentalClassAutomations] Iniciando rotina de lembretes para ${today}`);

    try {
        const tenantsSnap = await db.collection("tenants").get();
        logger.info(`[checkExperimentalClassReminders] Processando ${tenantsSnap.size} tenants.`);

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;

            // 1. Buscar configurações do Tenant (Previamente para evitar chamadas repetidas por trial)
            const settingsDoc = await db.collection("tenants").doc(idTenant)
                .collection("settings").doc("integrations").get();

            if (!settingsDoc.exists) continue;
            const settings = settingsDoc.data();

            // Verificar se o gatilho está ativo (se houver essa config) e se tem Evolution API
            const isTriggerActive = settings?.activeTriggers?.EXPERIMENTAL_REMINDER !== false;
            if (!isTriggerActive || !settings.evolutionUrl || !settings.evolutionInstanceName) continue;

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // 2. Buscar aulas experimentais de HOJE neste branch
                const trialsSnap = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("enrollments")
                    .where("enrollmentType", "==", "trial")
                    .where("status", "==", "active")
                    .where("startDate", "==", today)
                    .get();

                if (trialsSnap.empty) continue;

                logger.info(`[checkExperimentalClassReminders] Tenant: ${idTenant}, Branch: ${idBranch} -> ${trialsSnap.size} trials encontrados.`);

                for (const trialDoc of trialsSnap.docs) {
                    try {
                        const enrollment = trialDoc.data();
                        const { startTime, clientName, idClient } = enrollment;

                        // Pular aulas que já começaram ou estão prestes a começar (margem até 08:15)
                        if (startTime && startTime < "08:15") {
                            logger.info(`[checkExperimentalClassReminders] Pulo: ${clientName} (${startTime}) - horário já passou.`);
                            continue;
                        }

                        // 3. Buscar telefone do aluno
                        const clientDoc = await db.collection("tenants").doc(idTenant)
                            .collection("branches").doc(idBranch)
                            .collection("clients").doc(idClient).get();

                        if (!clientDoc.exists) continue;
                        const clientData = clientDoc.data();
                        const phone = clientData.phone || clientData.mobile || clientData.cellPhone || clientData.responsavelPhone;

                        if (!phone) continue;

                        // 4. Montar e enviar mensagem
                        const message = `Oi ${clientName}! 🏊‍♂️ Passando para lembrar da sua aula experimental hoje na *A2 Aquática*!\n\n⏰ Horário: *${startTime}*\n\n📌 *Dicas importantes:*\n- Traga sua *touca* e óculos de natação. 🏊‍♂️\n- Procure chegar uns 10 minutos antes da aula.\n\nEstamos ansiosos para te ver na água! Qualquer dúvida, é só responder aqui. Até logo! 🌊\n\nAtenciosamente,\n*Cibelly* - Sua assistente A2 Aquática 🤖`;

                        await sendWhatsApp(settings, phone, message);
                        logger.info(`[checkExperimentalClassReminders] Enviado para ${clientName} em ${idBranch}`);

                    } catch (trialErr) {
                        logger.error(`[checkExperimentalClassReminders] Erro trial ${trialDoc.id}:`, trialErr);
                    }
                }
            }
        }

        logger.info("[checkExperimentalClassReminders] Rotina finalizada com sucesso.");

    } catch (error) {
        logger.error("[checkExperimentalClassReminders] Erro fatal:", error);
    }
});

async function sendWhatsApp(settings, phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        formattedPhone = `55${cleanPhone}`;
    }

    const baseUrl = settings.evolutionUrl.replace(/\/$/, '');
    const url = `${baseUrl}/message/sendText/${settings.evolutionInstanceName}`;
    const token = settings.evolutionInstanceToken || settings.evolutionKey || settings.apiKey;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': token
        },
        body: JSON.stringify({
            number: formattedPhone,
            options: { delay: 1200, presence: "composing", linkPreview: false },
            text: message
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EvolutionAPI Error ${response.status}: ${errorText}`);
    }
}
