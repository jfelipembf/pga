const admin = require("firebase-admin");
const moment = require("moment");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function cleanupOrphanSessions() {
    console.log("🧹 [CLEANUP] Iniciando limpeza de sessões órfãs (post data-fim da turma)...");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalDeleted = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;
            console.log(`🏢 Tenant: ${tenantId}`);

            const branchesSnap = await tenantDoc.ref.collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const branchId = branchDoc.id;
                console.log(`  📍 Branch: ${branchId}`);

                // 1. Carregar todas as turmas (incluindo inativas/deletadas se o endDate definir o fim)
                // Vamos focar nas ativas ou inativas (mas não deletadas logicamente?), 
                // na verdade queremos limpar TODAS as sessões de turmas que tenham endDate definido.
                // Mas se a turma foi deletada, as sessões deveriam ter sido deletadas. 
                // Se não foram, é outro problema. Vamos focar no caso relatado: Turma com EndDate definido.

                const classesRef = branchDoc.ref.collection("classes");
                const classesSnap = await classesRef.get(); // Pega tudo

                for (const classDoc of classesSnap.docs) {
                    const classData = classDoc.data();
                    const classEndDate = classData.endDate;

                    if (!classEndDate) continue; // Sem data fim, segue a vida

                    // Buscar sessões dessa turma que são POSTERIORES a data fim
                    const sessionsRef = branchDoc.ref.collection("sessions");

                    // Query: idClass == classId AND sessionDate > classEndDate
                    // Precisa de index composto? Sim: idClass + sessionDate
                    // Se der erro, iteramos na força bruta (filtrando em memória)

                    // Tentar query otimizada primeiro? Não, script de manutenção pode ser lento.
                    // Vamos buscar por idClass e filtrar em memória para evitar erros de index.

                    const sessionsQuery = await sessionsRef
                        .where("idClass", "==", classDoc.id)
                        .get();

                    if (sessionsQuery.empty) continue;

                    const batch = db.batch();
                    let batchCount = 0;

                    sessionsQuery.forEach(sessionDoc => {
                        const sessionData = sessionDoc.data();

                        // Ignorar se já deletada
                        if (sessionData.deletedAt || sessionData.status === 'deleted' || sessionData.status === 'canceled') return;

                        if (sessionData.sessionDate > classEndDate) {
                            console.log(`    ❌ Deletando sessão excedente: ${sessionDoc.id} (${sessionData.sessionDate}) > Turma Fim: ${classEndDate}`);

                            batch.update(sessionDoc.ref, {
                                deletedAt: admin.firestore.FieldValue.serverTimestamp(),
                                deletedBy: 'script-cleanup',
                                status: 'deleted',
                                reason: 'Exceeded class endDate'
                            });
                            batchCount++;
                            totalDeleted++;
                        }
                    });

                    if (batchCount > 0) {
                        await batch.commit();
                        console.log(`    ✅ Commit: ${batchCount} sessões deletadas na turma ${classDoc.id}`);
                    }
                }
            }
        }

        console.log(`\n🎉 Limpeza concluída! Total de sessões removidas: ${totalDeleted}`);

    } catch (error) {
        console.error("Erro no script de limpeza:", error);
    }
}

cleanupOrphanSessions();
