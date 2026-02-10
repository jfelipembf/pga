const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Script de Verificação Completa (E2E)
 * Cria dados temporários para validar o funcionamento do lembrete.
 */
async function fullVerification() {
    console.log("=== INICIANDO VERIFICAÇÃO E2E ===");

    const idTenant = "TEST_TENANT_" + Date.now();
    const idBranch = "TEST_BRANCH";
    const idClient = "TEST_CLIENT";
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    try {
        // 1. Criar dados de teste
        console.log("1. Criando dados temporários...");
        await db.collection("tenants").doc(idTenant).set({ name: "A2 Aquática TEST" });
        await db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).set({ name: "Unidade Teste" });

        // Configurações de Integração (Simuladas)
        await db.collection("tenants").doc(idTenant).collection("settings").doc("integrations").set({
            evolutionUrl: "https://mock.evolution.com",
            evolutionInstanceName: "test_instance",
            evolutionInstanceToken: "test_token",
            activeTriggers: { EXPERIMENTAL_REMINDER: true }
        });

        // Cliente com telefone
        await db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient).set({
            name: "Aluno Teste",
            phone: "(11) 99999-9999"
        });

        // Matrícula Trial para HOJE
        await db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments").doc("TEST_TRIAL").set({
            enrollmentType: "trial",
            status: "active",
            startDate: today,
            startTime: "10:00",
            clientName: "Aluno Teste",
            idClient: idClient
        });

        console.log("2. Executando lógica de lembrete (Simulada)...");

        // Aqui simulamos a função importada ou a lógica direta
        const result = await runLogicSimulated(idTenant, today);

        if (result) {
            console.log("\n✅ SUCESSO: A lógica identificou o aluno e preparou a mensagem!");
        } else {
            console.log("\n❌ FALHA: A lógica não encontrou o aluno teste.");
        }

    } catch (error) {
        console.error("Erro na verificação:", error);
    } finally {
        console.log("\n3. Limpando dados de teste...");
        await db.recursiveDelete(db.collection("tenants").doc(idTenant));
        console.log("Limpeza concluída.");
    }
}

async function runLogicSimulated(targetTenant, targetDate) {
    const tenantsSnap = await db.collection("tenants").doc(targetTenant).get();
    if (!tenantsSnap.exists) return false;

    const settingsDoc = await db.collection("tenants").doc(targetTenant).collection("settings").doc("integrations").get();
    const settings = settingsDoc.data();

    const branchesSnap = await db.collection("tenants").doc(targetTenant).collection("branches").get();
    let found = false;

    for (const branchDoc of branchesSnap.docs) {
        const trialsSnap = await branchDoc.ref.collection("enrollments")
            .where("enrollmentType", "==", "trial")
            .where("status", "==", "active")
            .where("startDate", "==", targetDate)
            .get();

        for (const trialDoc of trialsSnap.docs) {
            const enrollment = trialDoc.data();
            console.log(`   - Identificado: ${enrollment.clientName} às ${enrollment.startTime}`);

            const clientDoc = await branchDoc.ref.collection("clients").doc(enrollment.idClient).get();
            const clientData = clientDoc.data();
            console.log(`   - Telefone: ${clientData.phone}`);

            const message = `Oi ${enrollment.clientName}! 🏊‍♂️ Passando para lembrar...`;
            console.log(`   - Mensagem montada com sucesso.`);
            found = true;
        }
    }
    return found;
}

fullVerification().then(() => process.exit(0));
