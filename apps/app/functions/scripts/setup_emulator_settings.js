const admin = require("firebase-admin");

// Configura para usar o emulador local
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.GCLOUD_PROJECT = "pgasistema";

if (!admin.apps.length) {
    admin.initializeApp({ projectId: "pgasistema" });
}

const db = admin.firestore();

async function enableAutoClose() {
    console.log("🔍 Buscando tenants...");
    const tenantsSnap = await db.collection("tenants").get();

    if (tenantsSnap.empty) {
        console.log("❌ Nenhum tenant encontrado no banco de dados.");
        return;
    }

    for (const tenantDoc of tenantsSnap.docs) {
        const tenantId = tenantDoc.id;
        console.log(`📂 Tenant encontrado: ${tenantId}`);

        const branchesSnap = await db.collection(`tenants/${tenantId}/branches`).get();

        if (branchesSnap.empty) {
            console.log(`   ⚠️ Nenhuma filial encontrada neste tenant.`);
            continue;
        }

        for (const branchDoc of branchesSnap.docs) {
            const branchId = branchDoc.id;
            console.log(`   🏢 Configurando filial: ${branchId}`);

            const settingsRef = db.doc(`tenants/${tenantId}/branches/${branchId}/settings/general`);

            // Habilita autoCloseCashier e cancelamento automático (para matar 2 problemas de uma vez)
            await settingsRef.set({
                finance: {
                    autoCloseCashier: true,
                    cancelContractAfterDays: 5,
                    cancelDebtOnCancelledContracts: true
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`      ✅ Configurações salvas: autoCloseCashier = true`);
        }
    }
    console.log("\n🚀 Script finalizado com sucesso!");
}

enableAutoClose().catch(console.error);
