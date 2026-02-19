const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "pgasistema"
    });
}

const db = admin.firestore();

async function findNegativeEnrollmentSessions() {
    console.log('Iniciando busca por sessões com enrolledCount negativo (MODO LEITURA)...');

    try {
        const tenantsSnapshot = await db.collection('tenants').get();
        let totalIssues = 0;

        for (const tenantDoc of tenantsSnapshot.docs) {
            const branchesSnapshot = await db.collection(`tenants/${tenantDoc.id}/branches`).get();

            for (const branchDoc of branchesSnapshot.docs) {
                // console.log(`Verificando unidade: ${branchDoc.id}...`);

                const sessionsRef = db.collection(`tenants/${tenantDoc.id}/branches/${branchDoc.id}/sessions`);
                const negativeSessionsSnapshot = await sessionsRef.where('enrolledCount', '<', 0).get();

                if (!negativeSessionsSnapshot.empty) {
                    console.log(`⚠️  Encontradas ${negativeSessionsSnapshot.size} sessões com contagem negativa na unidade ${branchDoc.id} (Tenant: ${tenantDoc.id})`);

                    negativeSessionsSnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        console.log(`   - ID: ${doc.id} | Data: ${data.sessionDate} | Count: ${data.enrolledCount}`);
                        totalIssues++;
                    });
                }
            }
        }

        console.log('---------------------------------------------------');
        if (totalIssues === 0) {
            console.log('✅ Nenhuma sessão com contagem negativa encontrada.');
        } else {
            console.log(`Busca finalizada. Total de sessões problemáticas: ${totalIssues}`);
        }

    } catch (error) {
        console.error('Erro ao buscar sessões:', error);
    }
}

findNegativeEnrollmentSessions();
