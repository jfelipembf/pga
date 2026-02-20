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
 * Script to verify discrepancies in session enrolledCount vs actual subcollection size
 * THIS SCRIPT IS READ-ONLY AND DOES NOT ALTER ANY DATA.
 */
async function inspectSessionEnrolledCounts() {
    console.log('--- Iniciando inspeção de enrolledCount nas sessões ---');
    console.log('NOTA: Este script é APENAS DE LEITURA. Nenhuma alteração será feita.');

    // Obter data de uma semana atrás até o futuro para não varrer sessões muito antigas (opcional)
    // Vamos varrer todas que não estejam deletadas.
    let totalSessionsChecked = 0;
    let totalDiscrepancies = 0;

    try {
        const tenantsSnapshot = await db.collection('tenants').get();

        for (const tenantDoc of tenantsSnapshot.docs) {
            const tenantId = tenantDoc.id;
            console.log(`\nVerificando Tenant: ${tenantId}`);

            const branchesSnapshot = await db.collection(`tenants/${tenantId}/branches`).get();

            for (const branchDoc of branchesSnapshot.docs) {
                const branchId = branchDoc.id;
                console.log(`  Verificando Branch: ${branchId}`);

                // Buscar sessões (pegando de uma semana atrás para frente para otimizar, ou todas se preferir)
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const dateStr = oneWeekAgo.toISOString().split('T')[0];

                const sessionsSnapshot = await db.collection(`tenants/${tenantId}/branches/${branchId}/sessions`)
                    .where('sessionDate', '>=', dateStr)
                    .get();

                console.log(`    Sessões encontradas (desde ${dateStr}): ${sessionsSnapshot.size}`);

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

                    // Contar quantos realmente estão matriculados (excluindo os que foram deletados logicamente, se houver)
                    let actualEnrolledCount = 0;
                    for (const enrolledDoc of enrolledClientsSnapshot.docs) {
                        const enrolledData = enrolledDoc.data();
                        if (enrolledData.deleted !== true) {
                            actualEnrolledCount++;
                        }
                    }

                    // Comparar
                    if (reportedEnrolledCount !== actualEnrolledCount) {
                        totalDiscrepancies++;
                        console.log(`\n⚠️ DESCOBERTA DE DISCREPÂNCIA`);
                        console.log(`-> Sessão ID: ${sessionId}`);
                        console.log(`-> Data / Turma: ${session.sessionDate} / ${session.className || session.idClass}`);
                        console.log(`-> Contagem reportada (enrolledCount): ${reportedEnrolledCount}`);
                        console.log(`-> Contagem REAL (subcoleção): ${actualEnrolledCount}`);
                    }
                }
            }
        }

        console.log('\n=================================================');
        console.log('INSPEÇÃO CONCLUÍDA');
        console.log(`Total de sessões verificadas: ${totalSessionsChecked}`);
        console.log(`Total de discrepâncias encontradas: ${totalDiscrepancies}`);
        console.log('=================================================');

    } catch (error) {
        console.error('Erro durante a inspeção:', error);
    }
}

// Executar
inspectSessionEnrolledCounts();
