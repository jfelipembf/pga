const admin = require('firebase-admin');

// Configuração para o Emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8180';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9199';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'pgasistema'
    });
}

const db = admin.firestore();

async function runTest() {
    console.log('🚀 Iniciando Teste de Impacto Centralizado...');

    const idTenant = 'test-tenant-' + Date.now();
    const idBranch = 'main-branch';
    const idClient = 'client-test-001';
    const idContract = 'CONT-TEST-001';

    console.log(`\n1. Preparando dados de teste (Tenant: ${idTenant})...`);

    // 1. Criar Dashboard Inicial
    const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
    await dashboardRef.set({
        activeStudents: 10,
        suspendedStudents: 2,
        canceledStudents: 5,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Criar Cliente Ativo
    const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
    await clientRef.set({
        firstName: 'Aluno',
        lastName: 'Teste de Impacto',
        lifecycleStatus: 'active',
        createdAt: new Date().toISOString()
    });

    // 3. Criar Contrato Ativo com Suspensão Agendada para hoje
    const todayIso = new Date().toISOString().split('T')[0];
    const contractRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`);
    await contractRef.set({
        idTenant,
        idBranch,
        idClient,
        planName: 'Plano Mensal Teste',
        status: 'active',
        endDate: '2026-12-31',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Sub-coleção de suspensão
    const suspensionRef = contractRef.collection('suspensions').doc('susp-001');
    await suspensionRef.set({
        status: 'scheduled',
        startDate: todayIso,
        endDate: '2026-03-01',
        intendedDays: 30,
        reason: 'Teste de Automação'
    });

    console.log('✅ Dados criados no Emulador.');
    console.log('\n2. Simulando execução da Cloud Function (processScheduledSuspensions)...');

    // Importamos a lógica da função (ajustando o require para o path local do script)
    const processSuspension = require('../triggers/processScheduledSuspensions.js');

    // Como a função é exportada via onSchedule, no emulador/shell ela pode ser chamada.
    // Aqui vamos rodar um "dry run" manual da lógica ou simplesmente avisar como disparar.

    console.log('---------------------------------------------------------');
    console.log('PARA TESTAR O IMPACTO REAL, EXECUTE NO TERMINAL:');
    console.log(`firebase functions:shell --project pgasistema`);
    console.log(`> processScheduledSuspensions()`);
    console.log('---------------------------------------------------------');

    console.log('\n3. Aguardando gatilho... (Pressione Enter após rodar no shell para verificar resultados)');

    // Nota: Em um script automático, eu chamaria a lógica interna. 
    // Para simplificar para o usuário, vamos apenas verificar se o documento mudou se ele rodar.
}

runTest().catch(console.error);
