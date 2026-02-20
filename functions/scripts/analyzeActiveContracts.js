const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function analyzeActiveContracts() {
    console.log("🔍 Analisando alunos que possuem contratos ATIVOS no sistema...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalActiveFound = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // 1. Buscar contratos com status 'active'
                const contractsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clientContracts");
                const activeContractsSnap = await contractsRef.where('status', '==', 'active').get();

                if (activeContractsSnap.empty) continue;

                console.log(`\n📍 Unidade: ${idTenant} / ${idBranch}`);
                console.log(`   Encontrados ${activeContractsSnap.size} contratos ativos.`);

                // Cache de clientes da branch para evitar múltiplas chamadas de rede individuais
                const clientsSnap = await db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").get();
                const clientsMap = {};
                clientsSnap.forEach(d => clientsMap[d.id] = d.data());

                for (const doc of activeContractsSnap.docs) {
                    const contract = doc.data();
                    const client = clientsMap[contract.idClient] || { name: "Cliente não encontrado" };

                    const endDate = contract.endDate?.toDate ? contract.endDate.toDate().toLocaleDateString('pt-BR') : contract.endDate;

                    console.log(`     ✅ Aluno: ${client.name.padEnd(30)} | Plano: ${contract.planName.padEnd(20)} | Vence em: ${endDate}`);
                    totalActiveFound++;
                }
            }
        }

        console.log(`\n================================================================`);
        console.log(`📊 TOTAL GERAL DE CONTRATOS ATIVOS: ${totalActiveFound}`);
        console.log(`================================================================\n`);

    } catch (error) {
        console.error("❌ Erro ao analisar contratos ativos:", error);
    }
}

analyzeActiveContracts();
