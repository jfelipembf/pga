const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// ID fornecido pelo user no log
const TARGET_ID = "Tzch2c7rDfyYp1PpBqUi-2026-02-20";

async function huntAndDestroy(sessionId) {
    console.log(`🗡️ [HUNT & DESTROY] Procurando sessão fantasma: ${sessionId} em locais inusitados...\n`);

    const pathsToCheck = [];

    // 1. Root level 'sessions'
    pathsToCheck.push(db.collection("sessions").doc(sessionId));

    // 2. Iterate tenants to check 'tenants/{id}/sessions' (wrong place)
    const tenantsSnap = await db.collection("tenants").get();
    for (const tenantDoc of tenantsSnap.docs) {
        pathsToCheck.push(tenantDoc.ref.collection("sessions").doc(sessionId));

        // 3. Check inside classes? 'tenants/{id}/classes/{id}/sessions/{sessionId}'
        // Too deep to guess class ID easily, but maybe if we iterate classes?
        // Let's stick to common mistakes first.
    }

    let found = false;

    for (const ref of pathsToCheck) {
        const snap = await ref.get();
        if (snap.exists) {
            console.log(`🚨 ENCONTRADA EM LOCAL ERRADO: ${ref.path}`);
            console.log("📄 Dados:", JSON.stringify(snap.data(), null, 2));

            // DELETAR
            await ref.delete();
            console.log("🗑️ SESSÃO FANTASMA DELETADA COM SUCESSO!");
            found = true;
        }
    }

    if (!found) {
        console.log("✅ Nada encontrado nos locais suspeitos (Root ou Tenant-Level).");
        console.log("⚠️ Se o erro persiste no frontend, é quase certo que é CACHE LOCAL do navegador/app.");
        console.log("👉 Por favor, peça para o usuário limpar o cache do navegador ou reinstalar o app se for mobile.");
    }
}

async function inspectSpecificSession(sessionId) {
    console.log(`🔍 [DEEP INSPECTION] Procurando sessão com campo id == "${sessionId}" ...\n`);

    try {
        const tenantsSnap = await db.collection("tenants").get();
        let found = false;

        for (const tenantDoc of tenantsSnap.docs) {
            const branchesSnap = await tenantDoc.ref.collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                // Busca por query no campo id
                const sessionsRef = branchDoc.ref.collection("sessions");
                const querySnap = await sessionsRef.where("id", "==", sessionId).get();

                if (!querySnap.empty) {
                    found = true;
                    querySnap.forEach(doc => {
                        console.log(`✅ ENCONTRADA por query field 'id'!`);
                        console.log("\n---------------------------------------------------");
                        console.log(`📂 Tenant: ${tenantDoc.id}`);
                        console.log(`📂 Branch: ${branchDoc.id}`);
                        console.log(`📂 Caminho (Doc ID): ${doc.id}`); // Doc ID pode ser diferente!
                        console.log("📄 Dados Completos:");
                        console.log(JSON.stringify(doc.data(), null, 2));
                        console.log("---------------------------------------------------\n");
                    });
                    // Não dá return aqui pois pode haver duplicatas em outros lugares (bizarro mas possível)
                }

                // Busca por query no campo idSession (as vezes muda)
                const querySnap2 = await sessionsRef.where("idSession", "==", sessionId).get();
                if (!querySnap2.empty) {
                    // Evitar duplicar log se for o mesmo doc
                    querySnap2.forEach(doc => {
                        if (querySnap.docs.some(d => d.id === doc.id)) return;

                        found = true;
                        console.log(`✅ ENCONTRADA por query field 'idSession'!`);
                        console.log("\n---------------------------------------------------");
                        console.log(`📂 Tenant: ${tenantDoc.id}`);
                        console.log(`📂 Branch: ${branchDoc.id}`);
                        console.log(`📂 Caminho (Doc ID): ${doc.id}`);
                        console.log("📄 Dados Completos:");
                        console.log(JSON.stringify(doc.data(), null, 2));
                        console.log("---------------------------------------------------\n");
                    });
                }
            }
        }

        if (!found) {
            console.log("❌ Nenhuma sessão encontrada após varredura completa (por campos internos).");
        }

    } catch (error) {
        console.error("Erro na inspeção:", error);
    }
}

huntAndDestroy(TARGET_ID);
