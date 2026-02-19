const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function auditClassEndDates() {
    console.log("📊 [AUDIT] Iniciando mapeamento de turmas com Data Fim e sessões excedentes...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalIssues = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const tenantId = tenantDoc.id;
            const branchesSnap = await tenantDoc.ref.collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const branchId = branchDoc.id;

                // Buscar todas as turmas
                const classesSnap = await branchDoc.ref.collection("classes").get();

                if (classesSnap.empty) continue;

                for (const classDoc of classesSnap.docs) {
                    const classData = classDoc.data();
                    const endDate = classData.endDate;

                    // Ignora turmas sem data fim definida
                    if (!endDate) continue;

                    // Busca sessões posteriores à data fim da turma
                    // Usando .where se possível, ou filtrando em memória se necessário para evitar index error
                    // Como é script de auditoria, vamos tentar filtrar em memória para garantir execução

                    const sessionsSnap = await branchDoc.ref.collection("sessions")
                        .where("idClass", "==", classDoc.id)
                        .get();

                    if (sessionsSnap.empty) continue;

                    const orphans = [];
                    sessionsSnap.forEach(s => {
                        const sData = s.data();
                        // Verifica se a sessão é ativa (não deletada) e posterior à data fim
                        const isDeleted = sData.deletedAt || sData.status === 'deleted' || sData.status === 'canceled';
                        if (!isDeleted && sData.sessionDate > endDate) {
                            orphans.push({
                                id: s.id,
                                date: sData.sessionDate,
                                status: sData.status
                            });
                        }
                    });

                    if (orphans.length > 0) {
                        totalIssues++;
                        console.log(`🚩 TURMA: ${classDoc.id} | Atividade: ${classData.idActivity}`);
                        console.log(`   📅 Data Fim da Turma: ${endDate}`);
                        console.log(`   ⚠️ Sessões Excedentes: ${orphans.length}`);
                        // Ordenar por data para mostrar range
                        orphans.sort((a, b) => a.date.localeCompare(b.date));
                        console.log(`   🔍 Período Excedente: De ${orphans[0].date} até ${orphans[orphans.length - 1].date}`);
                        console.log(`   ----------------------------------------------------------------`);
                    }
                }
            }
        }

        if (totalIssues === 0) {
            console.log("\n✅ Nenhuma inconsistência encontrada. Todas as sessões respeitam a data fim das turmas.");
        } else {
            console.log(`\n⚠️ Auditoria concluída. Encontradas ${totalIssues} turmas com sessões excedentes.`);
        }

    } catch (error) {
        console.error("Erro na auditoria:", error);
    }
}

auditClassEndDates();
