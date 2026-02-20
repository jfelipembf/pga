const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function inspectContracts() {
    console.log("🔍 Buscando amostras de Contratos de Clientes na base...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let samplesCaptured = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // Busca os ultimos 3 contratos salvos nesta unidade apenas como amostragem
                const contractsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("clientContracts")
                    .limit(3)
                    .get();

                if (!contractsSnap.empty) {
                    console.log(`\n--- Unidade Central Encontrada: ${idBranch} ---`);
                    contractsSnap.docs.forEach(doc => {
                        console.log(`\n📄 Contrato ID: ${doc.id}`);
                        console.log(JSON.stringify(doc.data(), null, 2));
                        samplesCaptured++;
                    });
                }

                if (samplesCaptured >= 3) break; // Para após achar 3 apenas para analisar
            }
            if (samplesCaptured >= 3) break;
        }

    } catch (error) {
        console.error("❌ Erro ao inspecionar contratos:", error);
    }
}

inspectContracts();
