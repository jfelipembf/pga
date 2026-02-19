const admin = require("firebase-admin");
const { createScheduledTrigger, addDays, toISODate } = require("./utils");

// Inicialização segura do admin (para redundância)
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function agendada para enviar lembretes de aulas experimentais.
 * Roda diariamente às 08:00 (Horário de Brasília/São Paulo).
 * 
 * Processa dois tipos de automação:
 * 1. Lembrete do Dia (EXPERIMENTAL_REMINDER_TODAY)
 * 2. Lembrete Dia Anterior (EXPERIMENTAL_CLASS_DAY_BEFORE)
 */
module.exports = createScheduledTrigger("00 08 * * *", "checkExperimentalClassAutomations", async (context) => {
    const db = admin.firestore();

    // Obter datas no contexto de São Paulo
    const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const today = toISODate(nowSP);
    const tomorrow = toISODate(addDays(nowSP, 1));

    console.log(`[checkExperimentalClassAutomations] Iniciando processamento. Hoje: ${today}, Amanhã: ${tomorrow}`);

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;

            // 1. Buscar configurações de Integração do Tenant
            const settingsDoc = await db.collection("tenants").doc(idTenant)
                .collection("settings").doc("integrations").get();

            if (!settingsDoc.exists) continue;
            const settings = settingsDoc.data();

            // Verificar se há Evolution API configurada
            if (!settings.evolutionUrl || !settings.evolutionInstanceName) continue;

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // Processar Lembrete de HOJE
                if (settings?.activeTriggers?.EXPERIMENTAL_REMINDER_TODAY !== false) {
                    await processTrials(db, idTenant, idBranch, today, settings, "EXPERIMENTAL_REMINDER_TODAY");
                }

                // Processar Lembrete de AMANHÃ
                if (settings?.activeTriggers?.EXPERIMENTAL_CLASS_DAY_BEFORE === true) {
                    await processTrials(db, idTenant, idBranch, tomorrow, settings, "EXPERIMENTAL_CLASS_DAY_BEFORE");
                }
            }
        }

    } catch (error) {
        console.error("[checkExperimentalClassAutomations] Erro fatal:", error);
        throw error;
    }
});

/**
 * Busca e envia lembretes para uma data específica
 */
async function processTrials(db, idTenant, idBranch, targetDate, settings, triggerKey) {
    const trialsSnap = await db.collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("enrollments")
        .where("enrollmentType", "==", "trial")
        .where("status", "==", "active")
        .where("startDate", "==", targetDate)
        .get();

    if (trialsSnap.empty) return;

    const isToday = triggerKey === "EXPERIMENTAL_REMINDER_TODAY";

    for (const trialDoc of trialsSnap.docs) {
        try {
            const enrollment = trialDoc.data();
            const { startTime, clientName, idClient } = enrollment;

            // Se for hoje, pular se o horário já passou (margem 15min)
            if (isToday && startTime && startTime < "08:15") {
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

            // 4. Definir Mensagem
            let message = settings?.messageTemplates?.[triggerKey];

            if (!message) {
                if (triggerKey === "EXPERIMENTAL_REMINDER_TODAY") {
                    message = `*HOJE É O DIA!* 🏊‍♂️🌊\n\nOlá, *{name}*! Tudo pronto para o seu mergulho?\n\nPassando para lembrar que sua aula experimental na *A2 Aquática* está confirmada para hoje!\n\n⏰ Horário: *{time}*\n\n📌 *Dicas para aproveitar ao máximo:*\n- Chegue com 10 minutos de antecedência ⌚\n- Traga touca, óculos e muita energia! 💪\n- Caso seja bebê, o responsável deve estar pronto para entrar na água.\n\nEstamos ansiosos para te ver! Qualquer dúvida, é só nos chamar. Até logo! 👋✨\n\n*A2 Aquática*`;
                } else {
                    message = `*CONTAGEM REGRESSIVA!* ⏳🏊‍♂️\n\nOi, *{name}*! Amanhã é o grande dia da sua aula experimental na *A2 Aquática*! 🎉\n\nEstamos preparando tudo para te receber com muito carinho.\n\n📅 Data: *{date}*\n⏰ Horário: *{time}*\n\n✅ *Checklist para amanhã:*\n- Muita disposição e alegria!\n- Chegar 10 minutinhos antes para conhecer o espaço.\n- Trazer materiais de natação (touca, óculos, sunga/maiô).\n\nNos vemos amanhã! Se precisar de algo, estamos à disposição. 💙🌊`;
                }
            }

            // Substituir Variáveis (Suporta múltiplos formatos de tags)
            const displayDate = targetDate.split('-').reverse().join('/');
            const displayName = clientName || 'Aluno(a)';

            message = message
                .replace(/{(name|student|studentName)}/g, displayName)
                .replace(/{time}/g, startTime || '--:--')
                .replace(/{date}/g, displayDate);

            await sendWhatsApp(settings, phone, message);
            console.log(`[checkExperimentalClassAutomations] [${triggerKey}] Enviado para ${displayName}`);

        } catch (trialErr) {
            console.error(`[checkExperimentalClassAutomations] Erro processando ${triggerKey} para ${trialDoc.id}:`, trialErr);
        }
    }
}

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
