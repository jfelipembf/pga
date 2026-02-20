const admin = require('firebase-admin');
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    admin.initializeApp({
        projectId: 'pgasistema'
    });
}

const db = admin.firestore();

async function migrateAllTenantsAndBranches() {
    console.log("Iniciando migração global de 'computed' fields...");
    const tenantsSnapshot = await db.collection("tenants").get();

    for (const tenantDoc of tenantsSnapshot.docs) {
        const idTenant = tenantDoc.id;
        const branchesSnapshot = await db.collection(`tenants/${idTenant}/branches`).get();

        for (const branchDoc of branchesSnapshot.docs) {
            const idBranch = branchDoc.id;
            await migrateClientComputedFields(idTenant, idBranch);
        }
    }
}

async function migrateClientComputedFields(idTenant, idBranch, idClient = null) {
    console.log(`\n[Migration] -> ${idTenant} / ${idBranch}`);

    const clientsRef = db.collection('tenants').doc(idTenant).collection('branches').doc(idBranch).collection('clients');
    const contractsRef = db.collection('tenants').doc(idTenant).collection('branches').doc(idBranch).collection('clientContracts');
    const enrollmentsRef = db.collection('tenants').doc(idTenant).collection('branches').doc(idBranch).collection('enrollments');

    let clientsQuery = clientsRef;
    if (idClient) {
        clientsQuery = clientsRef.where(admin.firestore.FieldPath.documentId(), '==', idClient);
    }

    const clientsSnapshot = await clientsQuery.get();
    if (clientsSnapshot.empty) {
        console.log(`[Migration] Ninguém para processar aqui.`);
        return;
    }

    console.log(`[Migration] Processando ${clientsSnapshot.size} clientes...`);

    for (const clientDoc of clientsSnapshot.docs) {
        const clientId = clientDoc.id;
        const clientData = clientDoc.data();

        // 1. Buscar Contrato Ativo
        const contractsSnapshot = await contractsRef
            .where('idClient', '==', clientId)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        const activeContract = contractsSnapshot.empty ? null : contractsSnapshot.docs[0].data();

        // 2. Buscar Matrículas Ativas
        const enrollmentsSnapshot = await enrollmentsRef
            .where('idClient', '==', clientId)
            .where('status', '==', 'active')
            .get();

        const activeActivities = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().activityName).filter(Boolean))];
        const activeInstructors = [...new Set(enrollmentsSnapshot.docs.map(doc => doc.data().idStaff).filter(Boolean))];

        // 3. Montar objeto Computed
        const computed = {
            activeContractId: activeContract ? contractsSnapshot.docs[0].id : null,
            activePlanName: activeContract?.planName || 'Sem Plano',
            contractEndDate: activeContract?.endDate || null,
            monthlyValue: activeContract?.value || 0,
            activeActivities: activeActivities,
            activeInstructors: activeInstructors,
            lastMigrationAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // 4. Atualizar o documento do Cliente
        await clientDoc.ref.update({ computed });
        console.log(`[Migration] OK: ${clientData.name || clientId}`);
    }
}

migrateAllTenantsAndBranches()
    .then(() => {
        console.log("\n[Migration] Migração global finalizada com sucesso!");
        process.exit(0);
    })
    .catch(err => {
        console.error("\n[Migration] Erro fatal:", err);
        process.exit(1);
    });
