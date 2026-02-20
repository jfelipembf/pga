const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "pgasistema",
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

/**
 * Script to fix discrepancies in session enrolledCount vs actual subcollection size
 */
async function fixSessionEnrolledCounts() {
    console.log('--- Iniciando CORREÇÃO de enrolledCount nas sessões ---');
    console.log('Este script VAI ALTERAR o banco de dados.');

    // Obter data de uma semana atrás até o futuro para não varrer sessões muito antigas
    let totalSessionsChecked = 0;
    let totalFixed = 0;

    try {
        const tenantsSnapshot = await db.collection('tenants').get();

        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantId = tenantDoc.id;
            console.log(`\nVerificando Tenant: ${tenantId}`);

            const branchesSnapshot = await db.collection(`tenants/${tenantId}/branches`).get();

            for (const branchDoc of branchesSnapshot.docs) {
                const branchId = branchDoc.id;
                console.log(`  Verificando Branch: ${branchId}`);

                // Buscar sessões (pegando de uma semana atrás para frente)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const dateStr = oneWeekAgo.toISOString().split('T')[0];

                const sessionsSnapshot = await db.collection(`tenants/${tenantId}/branches/${branchId}/sessions`)
                    .where('sessionDate', '>=', dateStr)
                    .get();

                console.log(`    Sessões encontradas (desde ${dateStr}): ${sessionsSnapshot.size}`);

                let batch = db.batch();
                let batchCount = 0;

                for (const sessionDoc of sessionsSnapshot.docs) {
                    const session = sessionDoc.data();
                    const sessionId = sessionDoc.id;
                    totalSessionsChecked++;

                    // Pular sessões deletadas
                    if (session.deleted === true || session.deletedAt) {
                        continue;
                    }

                    const reportedEnrolledCount = session.enrolledCount || 0;

                    // Buscar o tamanho real da subcoleção de clientes matriculados
                    const enrolledClientsSnapshot = await sessionDoc.ref.collection('enrolledClients').get();

                    // Contar quantos realmente estão matriculados (excluindo os que foram deletados logicamente)
                    let actualEnrolledCount = 0;
                    for (const enrolledDoc of enrolledClientsSnapshot.docs) {
                        const enrolledData = enrolledDoc.data();
                        if (enrolledData.deleted !== true) {
                            actualEnrolledCount++;
                        }
                    }

                    // Se encontrou discrepância, prepara a correção
                    if (reportedEnrolledCount !== actualEnrolledCount) {
                        console.log(`\n🔧 CORRIGINDO DISCREPÂNCIA:`);
                        console.log(`-> Sessão ID: ${sessionId}`);
                        console.log(`-> Contagem reportada: ${reportedEnrolledCount} | Contagem REAL: ${actualEnrolledCount}`);

                        // Agenda a correção no batch
                        batch.update(sessionDoc.ref, { enrolledCount: actualEnrolledCount });
                        totalFixed++;
                        batchCount++;

                        if (batchCount >= 400) {
                            await batch.commit();
                            batch = db.batch();
                            batchCount = 0;
                        }
                    }
                }

                // Commita o que sobrar no batch na unidade atual
                if (batchCount > 0) {
                    await batch.commit();
                }
            }
        }

        console.log('\n=================================================');
        console.log('CORREÇÃO CONCLUÍDA');
        console.log(`Total de sessões verificadas: ${totalSessionsChecked}`);
        console.log(`Total de sessões CORRIGIDAS: ${totalFixed}`);
        console.log('=================================================');

    } catch (error) {
        console.error('Erro durante a correção:', error);
    }
}

// Executar
fixSessionEnrolledCounts();
