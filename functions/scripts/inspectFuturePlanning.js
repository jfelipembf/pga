const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: "pgasistema"
    });
}

const db = admin.firestore();

// ID DA TURMA QUE VOCÊ QUER INSPECIONAR
const TARGET_CLASS_ID = 'NkKxUmAYO8n2bbdMAR0J'; // Peguei do seu log anterior
const TENANT_ID = 'rfu0CcAjKx2eonYksTYw'; // Peguei do log
const BRANCH_ID = 'QVWiKcua8qCzrx9XzC2p'; // Peguei do log

async function inspectFuturePlanning() {
    console.log(`🔍 Inspecionando planejamento futuro para a turma: ${TARGET_CLASS_ID}`);
    const today = new Date().toISOString().split('T')[0];

    try {
        const sessionsRef = db.collection(`tenants/${TENANT_ID}/branches/${BRANCH_ID}/sessions`);

        // Buscar sessões futuras
        const snapshot = await sessionsRef
            .where('idClass', '==', TARGET_CLASS_ID)
            .where('sessionDate', '>=', today)
            .orderBy('sessionDate')
            .limit(10) // Ver as próximas 10 sessões
            .get();

        if (snapshot.empty) {
            console.log('Nenhuma sessão futura encontrada.');
            return;
        }

        console.log(`Encontradas ${snapshot.size} sessões futuras. Verificando planejamentos...`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const sessionId = doc.id;
            const date = data.sessionDate;

            // Buscar planejamento da sessão (subcoleção 'planning')
            const planningRef = sessionsRef.doc(sessionId).collection('planning')
                .orderBy('createdAt', 'desc')
                .limit(1);

            const planSnap = await planningRef.get();

            console.log(`\n📅 Sessão: ${date} (${sessionId})`);

            if (planSnap.empty) {
                console.log('   ❌ Nenhum planejamento definido.');
            } else {
                const plan = planSnap.docs[0].data();
                const objectives = plan.objectives || [];
                const objTitles = objectives.map(o => `[${o.id}] ${o.title} (${o.type})`).join(', ');

                console.log(`   ✅ Planejamento (${plan.status}) - Criado em: ${plan.createdAt?.toDate?.()?.toISOString()}`);
                console.log(`   🎯 Objetivos: ${objTitles || 'Nenhum'}`);
                if (plan.inheritedFromSessionId) {
                    console.log(`   🔗 Herdado de: ${plan.inheritedFromSessionId}`);
                }
                if (plan.weekSequenceIndex !== undefined) {
                    console.log(`   🔢 Índice Sequência: ${plan.weekSequenceIndex}`);
                }
            }
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

inspectFuturePlanning();
