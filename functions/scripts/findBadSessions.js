const admin = require("firebase-admin");
// Inicializa com credenciais padrão (requer login via gcloud auth application-default login ou ambiente configurado)
admin.initializeApp({
    projectId: "pgasistema" // Força o projectId correto se necessário
});

const db = admin.firestore();

async function findBadSessions() {
    console.log("🔍 Iniciando varredura de sessões com datas inválidas...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            console.log(`Processing Tenant: ${idTenant}`);

            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                console.log(`  Processing Branch: ${idBranch}`);

                const sessionsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("sessions")
                    .get();

                if (sessionsSnap.empty) {
                    console.log(`    (No sessions found)`);
                    continue;
                }

                let badCount = 0;

                sessionsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    const sessionDate = data.sessionDate;

                    // Validação 1: sessionDate existe?
                    if (!sessionDate) {
                        console.error(`    ❌ [MISSING DATE] Session ID: ${doc.id} | Class ID: ${data.idClass}`);
                        badCount++;
                        return;
                    }

                    // Validação 2: Formato YYYY-MM-DD
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(sessionDate)) {
                        console.error(`    ❌ [BAD FORMAT] Session ID: ${doc.id} | Date: "${sessionDate}" | Class ID: ${data.idClass}`);
                        badCount++;
                        return;
                    }

                    // Validação 3: Data válida js
                    const dateObj = new Date(sessionDate + "T12:00:00");
                    if (isNaN(dateObj.getTime())) {
                        console.error(`    ❌ [INVALID DATE] Session ID: ${doc.id} | Date: "${sessionDate}" | Class ID: ${data.idClass}`);
                        badCount++;
                    }
                });

                if (badCount === 0) {
                    console.log(`    ✅ All ${sessionsSnap.size} sessions are valid.`);
                } else {
                    console.log(`    ⚠️ Found ${badCount} invalid sessions in this branch.`);
                }
            }
        }

    } catch (error) {
        console.error("Fatal Error during scan:", error);
    }
}

findBadSessions();
