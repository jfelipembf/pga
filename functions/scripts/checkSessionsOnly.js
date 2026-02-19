const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function checkSessionsHierarchical() {
    console.log("🔍 [HIERARCHICAL SESSION CHECK] Iniciando varredura de enrolledCount < 0...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let totalChecked = 0;
        let totalNegative = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // Query específica dentro do branch (não precisa de índex composto global)
                const sessionsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("sessions")
                    .where("enrolledCount", "<", 0)
                    .get();

                if (!sessionsSnap.empty) {
                    console.log(`⚠️  ATENÇÃO: Tenant: ${idTenant} | Branch: ${idBranch}`);
                    console.log(`    Encontradas ${sessionsSnap.size} sessões com contagem negativa:`);

                    sessionsSnap.docs.forEach((doc) => {
                        const data = doc.data();
                        console.error(`       ❌ Session ID: ${doc.id} | Date: ${data.sessionDate} | Enrolled: ${data.enrolledCount}`);
                        totalNegative++;
                    });
                }

                totalChecked++; // Contando branches verificados para feedback
            }
        }

        if (totalNegative === 0) {
            console.log(`\n✅ Varredura concluída nos ${totalChecked} branches. Nenhuma sessão com enrolledCount negativo encontrada.`);
        } else {
            console.log(`\n❌ Varredura concluída. Total de sessões negativas encontradas: ${totalNegative}`);
        }

    } catch (error) {
        console.error("Fatal Error during scan:", error);
    }
}

checkSessionsHierarchical();
