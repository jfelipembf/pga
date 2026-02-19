const admin = require("firebase-admin");
const { createScheduledTrigger, toISODate } = require("./utils");

// Inicialização segura do admin
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function agendada para enviar o planejamento diário aos professores.
 * Roda diariamente às 08:05 (Horário de Brasília/São Paulo).
 * 
 * Lógica:
 * 1. Busca todas as sessões do dia via Collection Group.
 * 2. Agrupa por Professor.
 * 3. Para cada professor, compõe a agenda e os objetivos do planejamento.
 * 4. Envia via Evolution API.
 */
module.exports = createScheduledTrigger("05 08 * * *", "sendTeacherDailyPlanning", async (context) => {
    const db = admin.firestore();

    // Obter data de hoje no contexto de São Paulo
    const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const today = toISODate(nowSP);

    console.log(`[sendTeacherDailyPlanning] Iniciando envio de planejamentos para: ${today}`);

    try {
        // 1. Buscar todas as sessões do dia (Collection Group para ser eficiente)
        // Filtramos por data e status 'scheduled' ou sem status (vazio é implicitamente scheduled)
        const sessionsSnap = await db.collectionGroup("sessions")
            .where("sessionDate", "==", today)
            .get();

        if (sessionsSnap.empty) {
            console.log("[sendTeacherDailyPlanning] Nenhuma sessão encontrada para hoje.");
            return;
        }

        // 2. Agrupar sessões por Professor (idStaff) e Tenant
        const teacherAgendas = {};

        for (const sessionDoc of sessionsSnap.docs) {
            const session = sessionDoc.data();
            const { idStaff, idTenant, idBranch, idActivity, startTime } = session;

            if (!idStaff) continue;

            const key = `${idTenant}_${idStaff}`;
            if (!teacherAgendas[key]) {
                teacherAgendas[key] = {
                    idStaff,
                    idTenant,
                    idBranch,
                    sessions: []
                };
            }

            teacherAgendas[key].sessions.push({
                id: sessionDoc.id,
                ref: sessionDoc.ref,
                idActivity,
                startTime,
                idBranch // Pode variar no mesmo tenant se o professor rodar várias unidades
            });
        }

        // 3. Processar cada agenda de professor
        for (const key in teacherAgendas) {
            try {
                const agenda = teacherAgendas[key];
                const { idStaff, idTenant, idBranch } = agenda;

                // Ordenar sessões por horário
                agenda.sessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

                // Buscar detalhes do professor
                const staffDoc = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("staff").doc(idStaff).get();

                if (!staffDoc.exists) continue;
                const staffData = staffDoc.data();
                const phone = staffData.phone || staffData.mobile || staffData.cellPhone;
                if (!phone) continue;

                // Buscar configurações de integração para o Token do WhatsApp
                const settingsDoc = await db.collection("tenants").doc(idTenant)
                    .collection("settings").doc("integrations").get();

                if (!settingsDoc.exists) continue;
                const settings = settingsDoc.data();
                if (!settings.evolutionUrl || !settings.evolutionInstanceName) continue;

                // Compor a mensagem do dia
                let message = `Olá *${staffData.name}*, aqui é a *Cibelly*, sua agente de IA! 🤖✨\n\nPassando para te desejar um excelente dia de trabalho. Estas são as suas turmas para hoje:\n\n`;

                for (const sessInfo of agenda.sessions) {
                    // Buscar nome da atividade (Cachear idealmente, mas por professor o custo é baixo)
                    const activityDoc = await db.collection("tenants").doc(idTenant)
                        .collection("branches").doc(sessInfo.idBranch)
                        .collection("activities").doc(sessInfo.idActivity).get();

                    const activityName = activityDoc.exists ? activityDoc.data().name : "Atividade";

                    // Buscar planejamento da sessão
                    const planningSnap = await sessInfo.ref.collection("planning")
                        .where("status", "==", "active")
                        .get();

                    let objectivesText = "_Nenhum objetivo definido para hoje_";
                    if (!planningSnap.empty) {
                        const plans = planningSnap.docs.map(d => d.data());
                        plans.sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) - (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)));

                        const plan = plans[0];
                        if (plan.objectives && plan.objectives.length > 0) {
                            objectivesText = plan.objectives.map(o => o.title).join(", ");
                        }
                    }

                    message += `🕒 *${sessInfo.startTime || "--:--"}* - *${activityName}*\n`;
                    message += `🎯 *Objetivos:* ${objectivesText}\n\n`;
                }

                message += `---\n💡 *Informativo:* Professor, esses objetivos são replanejados a cada avaliação. Verifique com a gestão qual a frequência ideal de avaliação para que o planejamento esteja sempre atualizado e consiga direcionar suas aulas para os pontos mais fracos dos alunos.\n\n`;
                message += `Tudo é feito de forma inteligente, assim como você! Estou sempre aqui para te ajudar. 👋🏊‍♂️`;

                // Enviar
                await sendWhatsApp(settings, phone, message);
                console.log(`[sendTeacherDailyPlanning] Planejamento enviado para ${staffData.name} (${idTenant})`);

            } catch (innerErr) {
                console.error(`[sendTeacherDailyPlanning] Erro processando professor ${key}:`, innerErr);
            }
        }

    } catch (error) {
        console.error("[sendTeacherDailyPlanning] Erro fatal:", error);
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
