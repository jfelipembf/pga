const admin = require("firebase-admin");
const db = admin.firestore();
const { processTrigger } = require("./helper");

/**
 * Processa diariamente os aniversariantes.
 * 
 * 1. Itera sobre todos os branches.
 * 2. Atualiza o cache do Dashboard com os aniversariantes DE HOJE (Horário de SP).
 * 3. Verifica se há automações de aniversário configuradas e processa (ex: 3 dias antes).
 */
async function processDailyBirthdays() {


    // 1. Iterar sobre todos os Tenants/Branches
    // Nota: Em escala muito grande, isso deve processado via PubSub/Queue por branch.
    // Para o escopo atual, collectionGroup deve funcionar se não houver milhares de branches.
    const branchesSnap = await db.collectionGroup("branches").get();

    if (branchesSnap.empty) {

        return;
    }

    const promises = branchesSnap.docs.map(async (branchDoc) => {
        try {
            const idBranch = branchDoc.id;
            const branchPath = branchDoc.ref.path; // tenants/{idTenant}/branches/{idBranch}
            const pathSegments = branchPath.split("/");
            const idTenant = pathSegments[1];

            await processBranchBirthdays(idTenant, idBranch);

        } catch (err) {
            console.error(`[BirthdayCheck] Error processing branch ${branchDoc.id}:`, err);
        }
    });

    await Promise.all(promises);

}

/**
 * Processa um único branch: Atualiza dashboard e roda automações.
 */
async function processBranchBirthdays(idTenant, idBranch) {
    // Definir "HOJE" em SP para o Dashboard
    const now = new Date();
    const spDateString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const todaySP = new Date(spDateString);
    const todayMonth = todaySP.getMonth() + 1;
    const todayDay = todaySP.getDate();

    // Buscar clientes ativos desse branch
    const clientsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients");
    const clientsSnap = await clientsRef.where("status", "==", "active").get();

    if (clientsSnap.empty) return;

    const clients = [];
    clientsSnap.forEach(doc => {
        const d = doc.data();
        if (d.birthDate && typeof d.birthDate === "string") {
            const parts = d.birthDate.split("-");
            if (parts.length === 3) {
                clients.push({
                    id: doc.id,
                    ...d,
                    dobMonth: Number(parts[1]),
                    dobDay: Number(parts[2])
                });
            }
        }
    });

    // ---------------------------------------------------------------------
    // 1. Atualizar Dashboard (Aniversariantes de HOJE)
    // ---------------------------------------------------------------------
    const todaysBirthdays = clients.filter(c => c.dobMonth === todayMonth && c.dobDay === todayDay);
    const dashboardList = todaysBirthdays.map(c => ({
        id: c.id,
        name: c.name || "Cliente",
        photo: c.photo || "",
        role: "Aluno",
        date: `${String(todayDay).padStart(2, '0')}/${String(todayMonth).padStart(2, '0')}`,
        messageSent: undefined // Será atualizado se houver automação rodando hoje
    }));

    // ---------------------------------------------------------------------
    // 2. Processar Automações de Aniversário (Se houver)
    // ---------------------------------------------------------------------
    const automationsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("automations");
    const autosSnap = await automationsRef.where("type", "==", "BIRTHDAY").where("active", "==", true).get();

    // Mapa para controlar status de envio no dashboard
    const sentStatusMap = {};

    if (!autosSnap.empty) {
        for (const autoDoc of autosSnap.docs) {
            const automation = autoDoc.data();
            const daysBefore = automation.config?.daysBefore || 0;

            // Calcular data alvo para ESSA automação
            // Ex: se daysBefore = 3, buscamos quem faz niver daqui a 3 dias
            const targetDate = new Date(todaySP);
            targetDate.setDate(targetDate.getDate() + daysBefore);

            const targetMonth = targetDate.getMonth() + 1;
            const targetDay = targetDate.getDate();



            // Filtrar clientes para esta automação
            const matches = clients.filter(c => c.dobMonth === targetMonth && c.dobDay === targetDay);

            await Promise.all(matches.map(async (client) => {
                const data = {
                    name: client.name || "Aluno",
                    professional: "",
                    date: `${String(targetDay).padStart(2, '0')}/${String(targetMonth).padStart(2, '0')}`,
                    time: "",
                    phone: client.phone || client.mobile || client.whatsapp
                };

                const sent = await processTrigger(idTenant, idBranch, "BIRTHDAY", data);

                // Se a automação for para HOJE (daysBefore=0), atualizamos o status no dashboard
                if (daysBefore === 0) {
                    sentStatusMap[client.id] = sent;
                }
            }));
        }
    }

    // Atualizar status de envio na lista do dashboard (somente se coincidir com data da automação)
    dashboardList.forEach(item => {
        if (sentStatusMap[item.id] !== undefined) {
            item.messageSent = sentStatusMap[item.id];
        } else if (autosSnap.empty) {
            // Se não tem automação nenhuma, messageSent fica undefined (ícone relógio/cinza)
            // ou podemos forçar null para não mostrar ícone nenhum, dependendo do requisito.
            // Mantendo undefined conforme lógica original.
        }
    });

    // Salvar Cache no Firestore para o Dashboard
    // Caminho: branches/{branchId}/operationalSummary/birthdays
    const summaryRef = db.collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("operationalSummary").doc("birthdays");

    if (dashboardList.length > 0) {
        await summaryRef.set({
            list: dashboardList,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
        // Limpar lista se vazio
        await summaryRef.set({
            list: [],
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
}

module.exports = {
    processDailyBirthdays
};
