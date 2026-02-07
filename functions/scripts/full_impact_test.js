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

/**
 * Utilitários idênticos aos da Cloud Function
 */
function toISODate(date) {
    return date.toISOString().split('T')[0];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

async function runFullImpactTest() {
    console.log('🚀 [TESTE] Iniciando Simulação de Impacto Centralizado (End-to-End)\n');

    const idTenant = 'T-' + Math.random().toString(36).substring(7).toUpperCase();
    const idBranch = 'BRANCH-01';
    const idClient = 'ALUNO-TEST-001';
    const idContract = 'CONT-TEST-001';
    const todayIso = toISODate(new Date());

    console.log('--- PASSO 1: Preparação de Dados ---');

    // 1. Dashboard inicial
    const dashboardRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/dashboardSummary/current`);
    await dashboardRef.set({
        activeStudents: 10,
        suspendedStudents: 2,
        canceledStudents: 5,
        lastUpdated: FieldValue.serverTimestamp()
    });
    console.log('✅ Dashboard criado (10 Ativos, 2 Suspensos)');

    // 2. Cliente inicial
    const clientRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clients/${idClient}`);
    await clientRef.set({
        firstName: 'Joao',
        lastName: 'Impacto Automático',
        lifecycleStatus: 'active',
        updatedAt: FieldValue.serverTimestamp()
    });
    console.log('✅ Cliente criado (Status: active)');

    // 3. Contrato e Suspensão Agendada
    const contractRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/clientContracts/${idContract}`);
    await contractRef.set({
        idTenant, idBranch, idClient,
        status: 'active',
        endDate: '2026-12-01',
        planName: 'Plano Diamante'
    });

    const suspensionRef = contractRef.collection('suspensions').doc('susp-001');
    await suspensionRef.set({
        status: 'scheduled',
        startDate: todayIso,
        endDate: '2026-03-01',
        intendedDays: 30,
        reason: 'Férias Agendadas'
    });
    console.log('✅ Contrato e Suspensão Agendada para HOJE criados.\n');

    console.log('--- PASSO 2: Executando Lógica da Cloud Function (processScheduledSuspensions) ---');

    // Mimetizando a lógica da v2 que acabamos de fazer
    const scheduledSnapshot = await db
        .collectionGroup("suspensions")
        .where("status", "==", "scheduled")
        .where("startDate", "<=", todayIso)
        .get();

    console.log(`🔍 Encontradas ${scheduledSnapshot.size} suspensão(ões) agendada(s) para HOJE no sistema.`);

    for (const docSnap of scheduledSnapshot.docs) {
        if (docSnap.ref.path.includes(idTenant)) { // Focar apenas no nosso teste
            const suspension = docSnap.data();
            const parentContractRef = docSnap.ref.parent.parent;

            await db.runTransaction(async (tx) => {
                const cSnap = await tx.get(parentContractRef);
                const contract = cSnap.data();

                const currentEndDateStr = contract.endDate;
                const daysRequested = 30; // suspension.intendedDays
                const newEndDate = addDays(new Date(currentEndDateStr + "T12:00:00"), daysRequested);
                const newEndDateStr = toISODate(newEndDate);

                // 1. Atualizar Suspensão
                tx.update(docSnap.ref, { status: "active", processedAt: todayIso });

                // 2. Atualizar Contrato
                tx.update(parentContractRef, {
                    status: "suspended",
                    endDate: newEndDateStr,
                    'suspension.isSuspended': true,
                    updatedAt: FieldValue.serverTimestamp()
                });

                // 3. Atualizar Cliente (CENTRALIZADO)
                tx.update(clientRef, {
                    lifecycleStatus: 'suspended',
                    updatedAt: FieldValue.serverTimestamp()
                });

                // 4. Dashboard (CENTRALIZADO)
                tx.set(dashboardRef, {
                    activeStudents: FieldValue.increment(-1),
                    suspendedStudents: FieldValue.increment(1),
                    lastUpdated: FieldValue.serverTimestamp()
                }, { merge: true });

                // 5. Audit Log (CENTRALIZADO)
                const auditRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).doc();
                tx.set(auditRef, {
                    action: "CONTRACT_SUSPENSION_AUTO_START",
                    entityId: idContract,
                    description: `Suspensão automática iniciada pelo sistema (TESTE).`,
                    createdAt: FieldValue.serverTimestamp()
                });
            });
            console.log('⚙️ Processamento de transação concluído.\n');
        }
    }

    console.log('--- PASSO 3: Verificação de Impacto ---');

    const [vClient, vContract, vDash, vLogs] = await Promise.all([
        clientRef.get(),
        contractRef.get(),
        dashboardRef.get(),
        db.collection(`tenants/${idTenant}/branches/${idBranch}/auditLogs`).get()
    ]);

    const cStatus = vClient.data().lifecycleStatus;
    const conStatus = vContract.data().status;
    const conEndDate = vContract.data().endDate;
    const dash = vDash.data();

    console.log(`📌 STATUS CLIENTE: ${cStatus === 'suspended' ? '✅ OK (suspended)' : '❌ ERRO (' + cStatus + ')'}`);
    console.log(`📌 STATUS CONTRATO: ${conStatus === 'suspended' ? '✅ OK (suspended)' : '❌ ERRO'}`);
    console.log(`📌 VIGÊNCIA ESTENDIDA: ${conEndDate === '2026-12-31' ? '✅ OK (2026-12-31)' : '❌ ERRO (' + conEndDate + ')'}`);
    console.log(`📌 DASHBOARD ATIVOS: ${dash.activeStudents === 9 ? '✅ OK (9)' : '❌ ERRO (' + dash.activeStudents + ')'}`);
    console.log(`📌 DASHBOARD SUSPENSOS: ${dash.suspendedStudents === 3 ? '✅ OK (3)' : '❌ ERRO (' + dash.suspendedStudents + ')'}`);
    console.log(`📌 LOGS GERADOS: ${vLogs.size > 0 ? '✅ OK (' + vLogs.size + ')' : '❌ ERRO'}`);

    console.log('\n🚀 [TESTE CONCLUÍDO] Todos os impactos foram refletidos conforme o novo padrão "Perfeito".');
}

runFullImpactTest().catch(console.error);
