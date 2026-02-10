const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");

// Inicialização segura do admin (para redundância)
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function agendada para enviar lembretes de aulas experimentais do dia.
 * Roda diariamente às 08:00 (Horário de Brasília/São Paulo).
 * 
 * Lógica:
 * 1. Busca todas as matrículas do tipo 'trial' (experimental) marcadas para HOJE.
 * 2. Filtra apenas as que o horário de início ainda não passou.
 * 3. Recupera os dados de contato do aluno e as configurações de WhatsApp da unidade.
 * 4. Envia a mensagem personalizada.
 * 
 * DESIGN ROBUSTO (v1): Percorre tenants e branches para compatibilidade total e evitar erros de índice.
 */
module.exports = createScheduledTrigger("00 08 * * *", "checkExperimentalClassAutomations", async (context) => {
    const db = admin.firestore();

    // Obter data atual no formato YYYY-MM-DD em São Paulo
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    console.log(`[checkExperimentalClassAutomations] Iniciando lembretes para ${today}`);

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;

            // 1. Buscar configurações de Integração do Tenant
            const settingsDoc = await db.collection("tenants").doc(idTenant)
                .collection("settings").doc("integrations").get();

            if (!settingsDoc.exists) continue;
            const settings = settingsDoc.data();

            // Verificar se o gatilho está ativo e se tem Evolution API configurada
            const isTriggerActive = settings?.activeTriggers?.EXPERIMENTAL_REMINDER !== false;
            if (!isTriggerActive || !settings.evolutionUrl || !settings.evolutionInstanceName) continue;

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // 2. Buscar aulas experimentais de HOJE
                const trialsSnap = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("enrollments")
                    .where("enrollmentType", "==", "trial")
                    .where("status", "==", "active")
                    .where("startDate", "==", today)
                    .get();

                if (trialsSnap.empty) continue;

                for (const trialDoc of trialsSnap.docs) {
                    try {
                        const enrollment = trialDoc.data();
                        const { startTime, clientName, idClient } = enrollment;

                        // Pular se o horário já passou (margem 15min)
                        if (startTime && startTime < "08:15") {
                            console.log(`[checkExperimentalClassAutomations] Pulo: ${clientName} (${startTime}) - já passou.`);
                            continue;
                        }

                        // 3. Buscar telefone
                        const clientDoc = await db.collection("tenants").doc(idTenant)
                            .collection("branches").doc(idBranch)
                            .collection("clients").doc(idClient).get();

                        if (!clientDoc.exists) continue;
                        const clientData = clientDoc.data();
                        const phone = clientData.phone || clientData.mobile || clientData.cellPhone || clientData.responsavelPhone;

                        if (!phone) continue;

                        // 4. Enviar mensagem
                        const message = `Oi ${clientName}! 🏊‍♂️ Passando para lembrar da sua aula experimental hoje na *A2 Aquática*!\n\n⏰ Horário: *${startTime}*\n\n📌 *Dicas importantes:*\n- Traga sua *touca* e óculos de natação. 🏊‍♂️\n- Procure chegar uns 10 minutos antes da aula.\n\nEstamos ansiosos para te ver na água! Qualquer dúvida, é só responder aqui. Até logo! 🌊\n\nAtenciosamente,\n*Cibelly* - Sua assistente A2 Aquática 🤖`;

                        await sendWhatsApp(settings, phone, message);
                        console.log(`[checkExperimentalClassAutomations] Lembrete enviado para ${clientName} (${idTenant}/${idBranch})`);

                    } catch (trialErr) {
                        console.error(`[checkExperimentalClassAutomations] Erro na matrícula ${trialDoc.id}:`, trialErr);
                    }
                }
            }
        }

    } catch (error) {
        console.error("[checkExperimentalClassAutomations] Erro fatal:", error);
        throw error;
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

    // Usando fetch nativo do Node 22 (conforme package.json engines)
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
