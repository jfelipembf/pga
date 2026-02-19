const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");

// Inicialização segura do admin (para redundância)
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Cloud Function agendada para enviar mensagens de aniversário automáticas.
 * Roda de Segunda a Sábado às 09:00 (Horário de Brasília).
 * 
 * Lógica:
 * 1. Verifica se hoje é domingo (0). Se for, encerra.
 * 2. Busca todos os clientes ativos de todos os branches.
 * 3. Filtra quem faz aniversário hoje (Month e Day batem).
 * 4. Recupera configurações de Evolution API do Tenant.
 * 5. Envia mensagem personalizada.
 */
module.exports = createScheduledTrigger("00 09 * * 1-6", "checkBirthdayAutomations", async (context) => {
    const db = admin.firestore();

    // Obter data atual em SP e extrair Mês e Dia (FORMATO: MM-DD)
    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
    const birthdaySuffix = today.substring(5); // MM-DD

    console.log(`[checkBirthdayAutomations] Iniciando busca de aniversariantes para o dia ${birthdaySuffix}`);

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;

            // 1. Buscar configurações de Integração do Tenant
            const settingsDoc = await db.collection("tenants").doc(idTenant)
                .collection("settings").doc("integrations").get();

            if (!settingsDoc.exists) continue;
            const settings = settingsDoc.data();

            // Verificar se o gatilho está ativo (Key: BIRTHDAY) e se tem Evolution API configurada
            const isTriggerActive = settings?.activeTriggers?.BIRTHDAY !== false;

            // Log de depuração se necessário: console.log(`Config for ${idTenant}: active=${isTriggerActive}, url=${settings.evolutionUrl}`);

            if (!isTriggerActive || !settings.evolutionUrl || !settings.evolutionInstanceName) {
                continue;
            }

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // 2. Buscar clientes do branch
                // Nota: Filtrar birthDate via Firestore query é difícil para MM-DD sem campo extra.
                // Buscamos TODOS os clientes e filtramos em memória.
                const clientsSnap = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("clients")
                    .get();

                if (clientsSnap.empty) continue;

                for (const clientDoc of clientsSnap.docs) {
                    try {
                        const client = clientDoc.data();
                        const { birthDate, name, firstName } = client;

                        if (!birthDate || !birthDate.endsWith(birthdaySuffix)) continue;

                        // VERIFICAÇÃO DE ATIVIDADE:
                        // O status do cliente no cadastro é ignorado.
                        // A única validação é se existe um contrato ATIVO na coleção clientContracts.
                        let isActive = false;

                        const activeContractsSnap = await db.collection("tenants").doc(idTenant)
                            .collection("branches").doc(idBranch)
                            .collection("clientContracts")
                            .where("idClient", "==", clientDoc.id)
                            .where("status", "==", "active")
                            .limit(1)
                            .get();

                        if (!activeContractsSnap.empty) {
                            isActive = true;
                        }

                        if (!isActive) {
                            // console.log(`[checkBirthdayAutomations] Ignorando aniversariante sem contrato ativo: ${name || firstName}`);
                            continue;
                        }

                        // 3. Identificar telefone
                        const phone = client.phone || client.mobile || client.cellPhone || client.responsavelPhone;
                        if (!phone) continue;

                        const displayName = firstName || name?.split(' ')[0] || "cliente";

                        // 4. Montar e enviar mensagem (Template ou Padrão)
                        let message = settings?.messageTemplates?.BIRTHDAY ||
                            `🎉 *Parabéns, {name}!* 🎂\n\nToda a equipe da *A2 Aquática* deseja a você um dia incrível, repleto de alegria, saúde e muitas realizações!\n\nQue este novo ciclo seja como um mergulho em águas cristalinas: renovador e cheio de boas energias. 🌊✨\n\nFeliz aniversário! 🎈🎊`;

                        // Substituir Variáveis
                        message = message.replace(/{name}/g, displayName);
                        // Suporte a {firstName} caso o usuário tenha colocado no template
                        message = message.replace(/{firstName}/g, displayName);

                        await sendWhatsApp(settings, phone, message);
                        console.log(`[checkBirthdayAutomations] Mensagem enviada para ${displayName} (${idTenant}/${idBranch})`);

                    } catch (clientErr) {
                        console.error(`[checkBirthdayAutomations] Erro no cliente ${clientDoc.id}:`, clientErr);
                    }
                }
            }
        }

        console.log(`[checkBirthdayAutomations] Processamento finalizado em ${new Date().toISOString()}`);

    } catch (error) {
        console.error("[checkBirthdayAutomations] Erro fatal:", error);
        throw error;
    }
});

/**
 * Helper para envio via Evolution API
 */
async function sendWhatsApp(settings, phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;

    // Garantir prefixo 55 se tiver apenas o DDD + número
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
