const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp(); // Usa as credenciais padrão do ambiente
}

const db = admin.firestore();

async function checkNegativeParanoid() {
    console.log(`🔍 [PARANOID CHECK] Iniciando varredura em Project: ${process.env.GCLOUD_PROJECT || 'default'}`);
    console.log("   Buscando enrolledCount < 0 (numérico) OU strings negativas em SESSÕES e TURMAS...\n");

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let issuesFound = 0;

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // 1. CHECAR SESSÕES (SESSIONS)
                const sessionsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");
                const sessionsSnap = await sessionsRef.get(); // Pega tudo para checar tipo manualmente (lento mas seguro)

                sessionsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    const val = data.enrolledCount;

                    let isNegative = false;

                    if (typeof val === 'number' && val < 0) isNegative = true;
                    if (typeof val === 'string' && parseFloat(val) < 0) isNegative = true;

                    if (isNegative) {
                        console.error(`❌ [SESSION] ID: ${doc.id} | Date: ${data.sessionDate} | Enrolled: ${val} (Type: ${typeof val}) | Branch: ${idBranch}`);
                        issuesFound++;
                    }
                });

                // 2. CHECAR TURMAS (CLASSES)
                const classesRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("classes");
                const classesSnap = await classesRef.get();

                classesSnap.docs.forEach(doc => {
                    const data = doc.data();
                    // Turmas as vezes não tem enrolledCount explícito, mas se tiver, checamos
                    if (data.enrolledCount !== undefined) {
                        const val = data.enrolledCount;
                        let isNegative = false;

                        if (typeof val === 'number' && val < 0) isNegative = true;
                        if (typeof val === 'string' && parseFloat(val) < 0) isNegative = true;

                        if (isNegative) {
                            console.error(`❌ [CLASS] ID: ${doc.id} | Weekday: ${data.weekday} | Enrolled: ${val} (Type: ${typeof val}) | Branch: ${idBranch}`);
                            issuesFound++;
                        }
                    }
                });
            }
        }

        if (issuesFound === 0) {
            console.log("\n✅ Varredura PARANOICA concluída. Absolutamente NENHUM valor negativo encontrado.");
        } else {
            console.log(`\n❌ Varredura concluída. Total de inconsistências: ${issuesFound}`);
        }

    } catch (error) {
        console.error("Fatal Error during scan:", error);
    }
}

checkNegativeParanoid();
