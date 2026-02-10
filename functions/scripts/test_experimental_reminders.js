const admin = require("firebase-admin");

// Inicialização (usa credenciais do ambiente ou private key)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Script de Teste para Lembrete de Aula Experimental
 * Simulando a lógica da Cloud Function localmente.
 */
async function testReminderLogic() {
    console.log("=== INICIANDO TESTE DE LEMBRETE EXPERIMENTAL ===");

    // 1. Data de hoje (YYYY-MM-DD)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    console.log(`Buscando aulas para: ${today}`);

    try {
        const tenantsSnap = await db.collection("tenants").get();
        console.log(`Total de Tenants: ${tenantsSnap.size}`);

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;

            // Buscar Configurações
            const settingsDoc = await db.collection("tenants").doc(idTenant)
                .collection("settings").doc("integrations").get();

            if (!settingsDoc.exists) {
                console.log(` - [${idTenant}] Sem configurações de integração. Pulando.`);
                continue;
            }

            const settings = settingsDoc.data();
            console.log(` - [${idTenant}] Verificando branches...`);

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                const trialsSnap = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("enrollments")
                    .where("enrollmentType", "==", "trial")
                    .where("status", "==", "active")
                    .where("startDate", "==", today)
                    .get();

                if (trialsSnap.empty) {
                    console.log(`    - [${idBranch}] Nenhuma aula experimental para hoje.`);
                    continue;
                }

                console.log(`    - [${idBranch}] !!! ENCONTRADAS ${trialsSnap.size} AULAS !!!`);

                for (const trialDoc of trialsSnap.docs) {
                    const enrollment = trialDoc.data();
                    const { startTime, clientName, idClient } = enrollment;

                    // Log do que seria enviado
                    console.log(`      > SIMULANDO ENVIO: Aluno: ${clientName}, Hora: ${startTime}`);

                    // Buscar telefone para validar se o fluxo de dados está ok
                    const clientDoc = await db.collection("tenants").doc(idTenant)
                        .collection("branches").doc(idBranch)
                        .collection("clients").doc(idClient).get();

                    if (clientDoc.exists) {
                        const clientData = clientDoc.data();
                        const phone = clientData.phone || clientData.mobile || clientData.cellPhone || clientData.responsavelPhone;
                        console.log(`      > Telefone encontrado: ${phone || 'NÃO POSSUI'}`);
                    } else {
                        console.log(`      > [ERRO] Cliente ${idClient} não encontrado.`);
                    }
                }
            }
        }

        console.log("\n=== TESTE CONCLUÍDO ===");
        console.log("Se os resultados acima baterem com o esperado, a automação está pronta para o deploy.");

    } catch (error) {
        console.error("Erro durante o teste:", error);
    }
}

testReminderLogic().then(() => process.exit(0));
