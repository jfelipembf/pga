const admin = require('firebase-admin');

// Configuração para o Emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8180';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'pgasistema'
    });
}

const db = admin.firestore();

async function verifyImpact() {
    console.log('🔍 Verificando Impacto do Processamento...');

    // Vamos buscar o último Tenant de teste criado (pelo prefixo ou timestamp)
    const tenantsSnap = await db.collectionGroup('clients')
        .where('lastName', '==', 'Teste de Impacto')
        .get();

    if (tenantsSnap.empty) {
        console.error('❌ Nenhum dado de teste encontrado. Rode o script de preparação primeiro e execute a função no shell.');
        return;
    }

    const clientDoc = tenantsSnap.docs[0];
    const pathSegments = clientDoc.ref.path.split('/');
    const idTenant = pathSegments[1];
    const idBranch = pathSegments[3];
    const idClient = clientDoc.id;
    const idContract = 'CONT-TEST-001';

    console.log(`\nVerificando Unidade: ${idBranch} no Tenant: ${idTenant}`);

    // 1. Verificar Status do Cliente
    console.log('\n--- 1. Status do Cliente ---');
    if (clientDoc.data().lifecycleStatus === 'suspended') {
        console.log('✅ SUCESSO: Status do cliente mudou para "suspended".');
    } else {
        console.log(`❌ FALHA: Status do cliente é "${clientDoc.data().lifecycleStatus}" (esperado: suspended).`);
    }

    // 2. Verificar Status do Contrato
    console.log('\n--- 2. Status do Contrato ---');
    const contractSnap = await db.doc(`tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`).get();
    const contractData = contractSnap.data();
    if (contractData.status === 'suspended' && contractData.suspension?.isSuspended === true) {
        console.log('✅ SUCESSO: Contrato está marcado como "suspended".');
        console.log(`📅 Nova data de término calculada: ${contractData.endDate}`);
    } else {
        console.log(`❌ FALHA: Status do contrato é "${contractData?.status}".`);
    }

    // 3. Verificar Dashboard
    console.log('\n--- 3. Dashboard Centralizado ---');
    const dashSnap = await db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`).get();
    const dashData = dashSnap.data();
    console.log('Dados do Dashboard:', dashData);
    if (dashData.activeStudents === 9 && dashData.suspendedStudents === 3) {
        console.log('✅ SUCESSO: Dashboard refletiu a mudança (+1 suspenso, -1 ativo).');
    } else {
        console.log('❌ FALHA: Os números do dashboard não batem com o esperado.');
    }

    // 4. Verificar Logs de Auditoria
    console.log('\n--- 4. Logs de Auditoria ---');
    const auditLogsSnap = await db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`)
        .where('action', '==', 'CONTRACT_SUSPENSION_AUTO_START')
        .get();

    if (!auditLogsSnap.empty) {
        console.log('✅ SUCESSO: Log de auditoria gerado pelo sistema.');
        console.log(`📝 Descrição: ${auditLogsSnap.docs[0].data().description}`);
    } else {
        console.log('❌ FALHA: Nenhum log de auditoria encontrado para esta ação.');
    }
}

verifyImpact().catch(console.error);
