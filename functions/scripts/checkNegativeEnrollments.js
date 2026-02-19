const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function checkNegativeEnrollments() {
    console.log("🔍 Iniciando varredura de sessões com enrolledCount negativo...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                console.log(`Processing Tenant: ${idTenant} | Branch: ${idBranch}`);

                // Podemos usar a query diretamente do firestore para filtrar sessões com enrolledCount < 0
                const sessionsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("sessions")
                    .where("enrolledCount", "<", 0)
                    .get();

                if (sessionsSnap.empty) {
                    console.log(`    ✅ Nenhuma sessão com enrolledCount negativo encontrada.`);
                    continue;
                }

                console.log(`    ⚠️ Encontradas ${sessionsSnap.size} sessões com contagem negativa:`);

                sessionsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    console.error(`       ❌ Session ID: ${doc.id} | Class ID: ${data.idClass} | Date: ${data.sessionDate} | Enrolled: ${data.enrolledCount}`);
                });
            }
        }
        console.log("\n✅ Varredura concluída.");

    } catch (error) {
        console.error("Fatal Error during scan:", error);
    }
}

checkNegativeEnrollments();
