const admin = require('firebase-admin');

// Configuração para o Emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'pgasistema'
    });
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

function toISODate(date) {
    return date.toISOString().split('T')[0];
}

async function runCancellationTest() {
    console.log('🚀 [TESTE] Iniciando Simulação de Cancelamento Programado\n');

    const idTenant = 'T-CANCEL-' + Math.random().toString(36).substring(7).toUpperCase();
    const idBranch = 'BRANCH-01';
    const idClient = 'ALUNO-CANCEL-001';
    const idContract = 'CONT-CANCEL-001';
    const todayIso = toISODate(new Date());

    // 1. Dashboard inicial
    const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
    await dashboardRef.set({
        activeStudents: 50,
        canceledStudents: 10,
        lastUpdated: FieldValue.serverTimestamp()
    });

    // 2. Cliente inicial
    const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
    await clientRef.set({
        firstName: 'Maria',
        lastName: 'Do Cancelamento',
        lifecycleStatus: 'active'
    });

    // 3. Contrato Agendado para Cancelar Hoje
    const contractRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`);
    await contractRef.set({
        idTenant, idBranch, idClient,
        status: 'scheduled_cancellation',
        cancelDate: todayIso,
        planName: 'Plano Anual'
    });

    // 4. Matrícula Futura (deve ser removida)
    const enrollmentRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/enrollments/enr-001`);
    await enrollmentRef.set({
        idClient,
        type: 'recurring',
        className: 'Yoga Matutino'
    });

    console.log('✅ Dados de teste criados. Disparando lógica de cancelamento...');

    // Simulando a Cloud Function
    const scheduledSnapshot = await db
        .collectionGroup("clientContracts")
        .where("status", "==", "scheduled_cancellation")
        .where("cancelDate", "<=", todayIso)
        .get();

    for (const docSnap of scheduledSnapshot.docs) {
        if (docSnap.ref.path.includes(idTenant)) {
            const contract = docSnap.data();

            await db.runTransaction(async (tx) => {
                // 1. Remover Matrículas
                const enrollmentsRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/enrollments`);
                const enrollmentsSnap = await tx.get(enrollmentsRef.where("idClient", "==", idClient));
                enrollmentsSnap.forEach(e => tx.delete(e.ref));

                // 2. Atualizar Contrato
                tx.update(docSnap.ref, {
                    status: "cancelled",
                    canceledAt: FieldValue.serverTimestamp()
                });

                // 3. Atualizar Cliente
                tx.update(clientRef, { lifecycleStatus: 'inactive' });

                // 4. Dashboard
                tx.set(dashboardRef, {
                    activeStudents: FieldValue.increment(-1),
                    canceledStudents: FieldValue.increment(1),
                    lastUpdated: FieldValue.serverTimestamp()
                }, { merge: true });

                // 5. Log
                const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                tx.set(auditRef, {
                    action: "CONTRACT_CANCEL_AUTO",
                    entityId: idContract,
                    description: "Cancelamento automático via teste.",
                    createdAt: FieldValue.serverTimestamp()
                });
            });
        }
    }

    console.log('\n--- VERIFICAÇÃO DE IMPACTO ---');
    const [vClient, vContract, vDash, vEnrollments] = await Promise.all([
        clientRef.get(),
        contractRef.get(),
        dashboardRef.get(),
        db.collection(`tenants/${idTenant}/branches/${idBranch}/enrollments`).where('idClient', '==', idClient).get()
    ]);

    console.log(`📌 STATUS CLIENTE: ${vClient.data().lifecycleStatus} (Esperado: inactive)`);
    console.log(`📌 STATUS CONTRATO: ${vContract.data().status} (Esperado: cancelled)`);
    console.log(`📌 MATRÍCULAS RESTANTES: ${vEnrollments.size} (Esperado: 0)`);
    console.log(`📌 DASHBOARD ATIVOS: ${vDash.data().activeStudents} (Esperado: 49)`);
    console.log(`📌 DASHBOARD CANCELADOS: ${vDash.data().canceledStudents} (Esperado: 11)`);

    if (vClient.data().lifecycleStatus === 'inactive' && vContract.data().status === 'cancelled' && vEnrollments.size === 0) {
        console.log('\n✅ TESTE DE CANCELAMENTO PASSOU COM SUCESSO!');
    } else {
        console.log('\n❌ FALHA NO TESTE DE CANCELAMENTO.');
    }
}

runCancellationTest().catch(console.error);
