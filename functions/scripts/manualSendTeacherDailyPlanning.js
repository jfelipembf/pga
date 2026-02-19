const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema"
    });
}

const db = admin.firestore();

// Helper functions (copied from triggers/utils.js)
const toISODate = (date) => {
    return date.toISOString().split('T')[0];
};

async function sendWhatsApp(settings, phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        formattedPhone = `55${cleanPhone}`;
    }

    const baseUrl = settings.evolutionUrl.replace(/\/$/, '');
    const url = `${baseUrl}/message/sendText/${settings.evolutionInstanceName}`;
    const token = settings.evolutionInstanceToken || settings.evolutionKey || settings.apiKey;

    try {
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
        return true;
    } catch (err) {
        console.error(`Error sending to ${phone}:`, err.message);
        return false;
    }
}

async function runManualDailyPlanning() {
    // Obter data de hoje no contexto de São Paulo
    const nowSP = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const today = toISODate(nowSP);

    console.log(`🚀 [MANUAL] Iniciando envio de planejamentos para: ${today}`);

    try {
        const tenantsSnapshot = await db.collection("tenants").get();
        const teacherAgendas = {};
        let totalSessionsFound = 0;

        for (const tenantDoc of tenantsSnapshot.docs) {
            const branchesSnapshot = await db.collection(`tenants/${tenantDoc.id}/branches`).get();

            for (const branchDoc of branchesSnapshot.docs) {
                const sessionsSnap = await db.collection(`tenants/${tenantDoc.id}/branches/${branchDoc.id}/sessions`)
                    .where("sessionDate", "==", today)
                    .get();

                if (sessionsSnap.empty) continue;

                totalSessionsFound += sessionsSnap.size;

                for (const sessionDoc of sessionsSnap.docs) {
                    const session = sessionDoc.data();
                    const { idStaff, idActivity, startTime } = session;

                    if (!idStaff) continue;

                    const idTenant = tenantDoc.id;
                    const idBranch = branchDoc.id;

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
                        idBranch
                    });
                }
            }
        }

        if (totalSessionsFound === 0) {
            console.log("❌ Nenhuma sessão encontrada para hoje.");
            return;
        }

        console.log(`📦 Encontradas ${totalSessionsFound} sessões para o dia.`);

        console.log(`👨‍🏫 Agrupado para ${Object.keys(teacherAgendas).length} professores.`);

        for (const key in teacherAgendas) {
            try {
                const agenda = teacherAgendas[key];
                const { idStaff, idTenant, idBranch } = agenda;

                agenda.sessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

                const staffDoc = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("staff").doc(idStaff).get();

                if (!staffDoc.exists) {
                    console.log(`⚠️ Staff ${idStaff} não encontrado no tenant ${idTenant}`);
                    continue;
                }

                const staffData = staffDoc.data();
                const phone = staffData.phone || staffData.mobile || staffData.cellPhone;

                if (!phone) {
                    console.log(`⚠️ Telefone não encontrado para o professor ${staffData.name}`);
                    continue;
                }

                const settingsDoc = await db.collection("tenants").doc(idTenant)
                    .collection("settings").doc("integrations").get();

                if (!settingsDoc.exists) {
                    console.log(`⚠️ Configurações de integração não encontradas para o tenant ${idTenant}`);
                    continue;
                }

                const settings = settingsDoc.data();
                if (!settings.evolutionUrl || !settings.evolutionInstanceName) {
                    console.log(`⚠️ Evolution API não configurada corretamente para o tenant ${idTenant}`);
                    continue;
                }

                let message = `Olá *${staffData.name}*, aqui é a *Cibelly*, sua agente de IA! 🤖✨\n\nPassando para te desejar um excelente dia de trabalho. Estas são as suas turmas para hoje:\n\n`;

                for (const sessInfo of agenda.sessions) {
                    const activityDoc = await db.collection("tenants").doc(idTenant)
                        .collection("branches").doc(sessInfo.idBranch)
                        .collection("activities").doc(sessInfo.idActivity).get();

                    const activityName = activityDoc.exists ? activityDoc.data().name : "Atividade";

                    const planningSnap = await sessInfo.ref.collection("planning")
                        .where("status", "==", "active")
                        .get();

                    let objectivesText = "_Nenhum objetivo definido para hoje_";
                    if (!planningSnap.empty) {
                        // Ordenar em memória para evitar necessidade de índice composto
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

                console.log(`📤 Enviando para ${staffData.name}...`);
                const sent = await sendWhatsApp(settings, phone, message);

                if (sent) {
                    console.log(`✅ Planejamento enviado para ${staffData.name} (${idTenant})`);
                }

            } catch (innerErr) {
                console.error(`❌ Erro no professor ${key}:`, innerErr);
            }
        }

        console.log("\n✨ Processo manual finalizado.");

    } catch (error) {
        console.error("💥 Erro fatal:", error);
    }
}

runManualDailyPlanning();
