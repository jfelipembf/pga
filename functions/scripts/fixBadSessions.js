const admin = require("firebase-admin");

// Inicializa com credenciais padrão
admin.initializeApp({
    projectId: "pgasistema"
});

const db = admin.firestore();

async function fixBadSessions() {
    console.log("🧹 Iniciando limpeza de sessões corrompidas...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;
                const sessionsSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("sessions")
                    .get();

                if (sessionsSnap.empty) continue;

                const batch = db.batch();
                let badCount = 0;

                sessionsSnap.docs.forEach((doc) => {
                    const data = doc.data();
                    const sessionDate = data.sessionDate;

                    let isBad = false;

                    if (!sessionDate) {
                        isBad = true;
                    } else {
                        // Formato YYYY-MM-DD
                        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                        if (!dateRegex.test(sessionDate)) {
                            isBad = true;
                        } else {
                            const dateObj = new Date(sessionDate + "T12:00:00");
                            if (isNaN(dateObj.getTime())) {
                                isBad = true;
                            } else if (dateObj.getFullYear() > 2100) {
                                // Proteção contra anos absurdos como 20263
                                isBad = true;
                            }
                        }
                    }

                    if (isBad) {
                        console.log(`    🗑️ Deletando Sessão Corrompida: ${doc.id} | Data: "${sessionDate}"`);
                        batch.delete(doc.ref);
                        badCount++;
                    }
                });

                if (badCount > 0) {
                    await batch.commit();
                    console.log(`    ✅ Removidas ${badCount} sessões inválidas no branch ${idBranch}.\n`);
                }
            }
        }
        console.log("✨ Limpeza concluída.");

    } catch (error) {
        console.error("❌ Erro fatal durante a limpeza:", error);
    }
}

fixBadSessions();
