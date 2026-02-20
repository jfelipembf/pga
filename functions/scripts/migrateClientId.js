const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function migrateClientId() {
    console.log("🚀 Iniciando migração de 'friendlyId', 'idGym' ou 'gymId' para o novo campo 'idClient'...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalMigrated = 0;

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

                let branchMigratedCount = 0;

                // Usando batch para envios em lote e melhor performance
                let batch = db.batch();
                let batchCount = 0;

                for (const doc of clientsSnap.docs) {
                    const client = doc.data();

                    // Se ele já possui o padrao novo da refatoração perfeitamente feito, nós pulamos a escrita
                    if (client.idClient && (!client.friendlyId && !client.idGym && !client.gymId)) {
                        continue;
                    }

                    // Encontra qualquer valor anterior que possa servir como o id principal de negocio
                    const legacyId = client.friendlyId || client.idGym || client.gymId;

                    if (legacyId) {
                        const docRef = doc.ref;

                        // Atualiza populando no local correto mantendo o original lá por segurança a pedido seu
                        batch.update(docRef, { idClient: legacyId });

                        branchMigratedCount++;
                        totalMigrated++;
                        batchCount++;

                        console.log(`   ✅ Cliente: ${client.name || 'Sem Nome'} migrado com ID: ${legacyId}`);

                        // Limite do Firestore Batch é 500 operacoes, a cada 400 commita pra garantir
                        if (batchCount >= 400) {
                            await batch.commit();
                            batch = db.batch();
                            batchCount = 0;
                        }
                    }
                }

                // Commita o resto sobressalente
                if (batchCount > 0) {
                    await batch.commit();
                }

                console.log(`    📊 Total migrado nesta branch: ${branchMigratedCount}`);
            }
        }
        console.log(`\n✅ Migração completa com sucesso! Total geral de clientes atualizados: ${totalMigrated}`);

    } catch (error) {
        console.error("❌ Erro ao executar script de migração:", error);
    }
}

migrateClientId();
