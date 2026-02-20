const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function findClientsWithIdGym() {
    console.log("🔍 Iniciando varredura de clientes para identificar uso de 'idGym', 'friendlyId' ou 'gymId'...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                console.log(`\n--- Unidade: ${idTenant} / ${idBranch} ---`);

                const clientsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clients")
                    .get();

                if (clientsSnap.empty) {
                    console.log(`    (Sem clientes cadastrados)`);
                    continue;
                }

                let foundCount = 0;
                clientsSnap.docs.forEach((doc) => {
                    const client = doc.data();
                    // Verifica os 3 possíveis campos de ID customizado
                    if (client.idGym || client.friendlyId || client.gymId) {
                        foundCount++;
                        console.log(`   ✅ Cliente: ${client.name || 'Sem Nome'} (DocID: ${doc.id})`);
                        if (client.idGym) console.log(`      - idGym: ${client.idGym}`);
                        if (client.friendlyId) console.log(`      - friendlyId: ${client.friendlyId}`);
                        if (client.gymId) console.log(`      - gymId: ${client.gymId}`);
                    }
                });

                if (foundCount === 0) {
                    console.log(`    ℹ️ Nenhum cliente com ID customizado encontrado.`);
                } else {
                    console.log(`    📊 Total nesta branch: ${foundCount}`);
                }
            }
        }
        console.log("\n✅ Varredura completa.");

    } catch (error) {
        console.error("❌ Erro ao executar script:", error);
    }
}

findClientsWithIdGym();
