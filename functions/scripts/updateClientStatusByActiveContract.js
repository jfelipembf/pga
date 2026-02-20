const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function updateClientStatusByActiveContract() {
    console.log("🚀 Iniciando atualização de status dos clientes com base em contratos ATIVOS...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalUpdated = 0;

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

                let batch = db.batch();
                let batchCount = 0;
                const processedClients = new Set();

                for (const contractDoc of activeContractsSnap.docs) {
                    const contract = contractDoc.data();
                    const idClient = contract.idClient;

                    if (!idClient || processedClients.has(idClient)) continue;

                    const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(idClient);
                    const clientSnap = await clientRef.get();

                    if (clientSnap.exists) {
                        const clientData = clientSnap.data();

                        // Verificar se já está ativo para não queimar batch desnecessário
                        if (clientData.status !== 'active' || clientData.lifecycleStatus !== 'converted') {
                            batch.update(clientRef, {
                                status: 'active',
                                lifecycleStatus: 'converted',
                                updatedAt: new Date().toISOString()
                            });

                            console.log(`   ✅ Cliente atualizado para ATIVO: ${clientData.name || idClient}`);
                            batchCount++;
                            totalUpdated++;
                            processedClients.add(idClient);
                        }
                    }

                    if (batchCount >= 400) {
                        await batch.commit();
                        batch = db.batch();
                        batchCount = 0;
                    }
                }

                if (batchCount > 0) {
                    await batch.commit();
                }
            }
        }

        console.log(`\n================================================================`);
        console.log(`📊 TOTAL DE CLIENTES ATUALIZADOS PARA ATIVO: ${totalUpdated}`);
        console.log(`================================================================\n`);

    } catch (error) {
        console.error("❌ Erro ao atualizar status dos clientes:", error);
    }
}

updateClientStatusByActiveContract();
