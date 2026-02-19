const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function listClassesWithEndDate() {
    console.log("📊 [RELATÓRIO] Listando Turmas com Data Fim configurada...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalFound = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const branchesSnap = await tenantDoc.ref.collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const classesSnap = await branchDoc.ref.collection("classes").get();

                if (classesSnap.empty) continue;

                for (const classDoc of classesSnap.docs) {
                    const classData = classDoc.data();

                    // Apenas turmas ativas e com endDate
                    if (!classData.endDate || classData.status === 'deleted' || classData.deletedAt) continue;

                    totalFound++;

                    // Verificar sessões
                    const sessionsSnap = await branchDoc.ref.collection("sessions")
                        .where("idClass", "==", classDoc.id)
                        .where("sessionDate", ">", classData.endDate)
                        .get();

                    const activeOrphans = sessionsSnap.docs.filter(s => {
                        const d = s.data();
                        return !d.deletedAt && d.status !== 'deleted' && d.status !== 'canceled';
                    });

                    const statusIcon = activeOrphans.length > 0 ? "⚠️" : "✅";

                    console.log(`${statusIcon} [TURMA] ${classDoc.id}`);
                    console.log(`   📅 Data Fim: ${classData.endDate}`);
                    console.log(`   📍 Atividade: ${classData.activityName || classData.idActivity}`);

                    if (activeOrphans.length > 0) {
                        console.log(`   ❌ PROBLEMA: ${activeOrphans.length} sessões ativas APÓS a data fim.`);
                        console.log(`      (De ${activeOrphans[0].data().sessionDate} até ${activeOrphans[activeOrphans.length - 1].data().sessionDate})`);
                    } else {
                        console.log(`   ✨ Nenhuma sessão excedente encontrada.`);
                    }
                    console.log("---------------------------------------------------");
                }
            }
        }

        if (totalFound === 0) {
            console.log("\nℹ️ Nenhuma turma ativa com Data Fim encontrada.");
        } else {
            console.log(`\n📋 Relatório concluído. ${totalFound} turmas analisadas.`);
        }

    } catch (error) {
        console.error("Erro ao listar turmas:", error);
    }
}

listClassesWithEndDate();
