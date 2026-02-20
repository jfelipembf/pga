const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

// Funções utils locais simulando ClientHelper do Front
function normalizeDate(date) {
    if (!date) return null;
    return new Date(date).toISOString();
}

function generateSearchTextClient(client) {
    return [
        client.name,
        client.email,
        client.cpf,
        client.phone,
        client.mobile,
        client.idClient ? String(client.idClient) : ''
    ].filter(Boolean).map(s => String(s).toLowerCase().trim());
}

async function migrateClientComputed() {
    console.log("🚀 Iniciando migração e recalculo do 'computed' para o novo formato de multi-contratos...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalMigrated = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                console.log(`\n--- Unidade: ${idTenant} / ${idBranch} ---`);

                // Pegando todos os clients
                const clientsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients");
                const clientsSnap = await clientsRef.get();

                if (clientsSnap.empty) {
                    console.log(`    (Sem clientes cadastrados)`);
                    continue;
                }

                // Carregando Contracts de toda a unidade para otimizar queries
                const contractsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clientContracts");
                const contractsSnap = await contractsRef.get();
                const branchContracts = contractsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Carregando Enrollments de toda a unidade
                const enrollmentsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
                const enrollmentsSnap = await enrollmentsRef.get();
                const branchEnrollments = enrollmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                let branchMigratedCount = 0;
                let batch = db.batch();
                let batchCount = 0;

                for (const doc of clientsSnap.docs) {
                    const client = doc.data();
                    const clientId = client.id;
                    const finalIdClient = client.idClient || client.friendlyId;

                    // 1. Filtrar Contratos desse aluno
                    const myContracts = branchContracts.filter(c => c.idClient === finalIdClient || c.idClient === clientId || c.idClient === client.friendlyId);

                    // Ordenar como no Front
                    myContracts.sort((a, b) => {
                        const dateA = a.endDate?.toDate ? a.endDate.toDate() : new Date(a.endDate || 0);
                        const dateB = b.endDate?.toDate ? b.endDate.toDate() : new Date(b.endDate || 0);
                        return dateB - dateA;
                    });

                    const activeContracts = myContracts.filter(c => c.status === 'active' || c.status === 'scheduled_cancellation');

                    // 2. Filtrar Matriculas desse aluno
                    const myEnrollments = branchEnrollments.filter(e => e.idClient === finalIdClient || e.idClient === clientId || e.idClient === client.friendlyId);

                    const activeEnrollments = myEnrollments.filter(e =>
                        e.status === 'active' &&
                        (e.deletedAt === null || e.deletedAt === undefined) &&
                        e.deleted !== true
                    );

                    const activeActivities = [...new Set(activeEnrollments.map(e => e.activityName).filter(Boolean))];
                    const activeInstructors = [...new Set(activeEnrollments.map(e => e.instructorName).filter(Boolean))];

                    // 3. Montar novo formato activeContracts
                    const activeContractsInfo = activeContracts.map(c => ({
                        idClientContract: c.id,
                        idContract: c.idContract || null,
                        planName: c.planName || null,
                        planType: c.planType || null,
                        value: c.value || null,
                        endDate: c.endDate?.toDate ? c.endDate.toDate().toISOString() : (c.endDate || null)
                    }));

                    // 4. Montar objeto computed
                    const computed = {
                        activeContracts: activeContractsInfo,
                        activeActivities: activeActivities,
                        activeInstructors: activeInstructors,
                        searchText: generateSearchTextClient({ ...client, idClient: finalIdClient }),
                        updatedAt: normalizeDate(new Date())
                    };

                    // Atualiza substituindo o field `computed` base
                    batch.update(doc.ref, { computed });

                    branchMigratedCount++;
                    totalMigrated++;
                    batchCount++;

                    // Print log para visualizarmos a mudança
                    const hasActiveLabel = activeContractsInfo.length > 0 ? `(${activeContractsInfo.length} Contratos ATIVOS)` : "(Sem contratos ativos)";
                    console.log(`   ✅ ${client.name || 'Sem Nome'} recalculado. ${hasActiveLabel}`);

                    // Commit se passar do limite
                    if (batchCount >= 400) {
                        await batch.commit();
                        batch = db.batch();
                        batchCount = 0;
                    }
                }

                // Commit sobressalente
                if (batchCount > 0) {
                    await batch.commit();
                }

                console.log(`    📊 Total recalculado nesta branch: ${branchMigratedCount} `);
            }
        }
        console.log(`\n✅ Recalculo completo com sucesso! Total geral de clientes alterados: ${totalMigrated} `);

    } catch (error) {
        console.error("❌ Erro ao executar script de recalculo do computed:", error);
    }
}

migrateClientComputed();
