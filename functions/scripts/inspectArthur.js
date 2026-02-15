const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function inspectArthur() {
    console.log("🔍 Procurando por 'Arthur' e inspecionando dados...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // Busca clientes que contenham "Arthur" no nome
                // Como Firestore não tem busca textual parcial nativa fácil sem unindex,
                // vamos buscar todos ativos e filtrar na memória, ou usar where se for nome exato.
                // Filtrando todos os ativos para garantir que pega variações.
                const clientsSnap = await db.collection("tenants").doc(idTenant)
                    .collection("branches").doc(idBranch)
                    .collection("clients")
                    .get(); // Traz tudo para garantir que achamos ele

                if (clientsSnap.empty) continue;

                clientsSnap.docs.forEach(doc => {
                    const client = doc.data();
                    const name = (client.name || client.firstName || "").toLowerCase();

                    if (name.includes("arthur")) {
                        console.log(`👤 ENCONTRADO: ${client.name} (ID: ${doc.id})`);
                        console.log(`   - Status: ${client.status}`);
                        console.log(`   - Data Nascimento (birthDate): ${client.birthDate}`);
                        console.log(`   - Data Nascimento (dataNascimento): ${client.dataNascimento}`);
                        console.log(`   - Telefone: ${client.phone || client.mobile}`);
                        console.log(`   -> Esperado para hoje (MM-DD): 02-15\n`);
                    }
                });
            }
        }
    } catch (error) {
        console.error("❌ Erro ao inspecionar:", error);
    }
}

inspectArthur();
