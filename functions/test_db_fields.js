const admin = require("firebase-admin");
try {
    const serviceAccountKey = require("./serviceAccountKey.json");
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccountKey) });
} catch (e) {
    if (!admin.apps.length) admin.initializeApp({ projectId: "pgasistema" });
}

const db = admin.firestore();

async function migrate() {
    console.log("Iniciando migração de Students para Clients no Banco de Dados...");
    const tenantId = "rfu0CcAjKx2eonYksTYw";
    const branchId = "QVWiKcua8qCzrx9XzC2p";

    const docSnap = await db.collection(`tenants/${tenantId}/branches/${branchId}/dashboardSummary`).doc("current").get();
    console.log("Data for current:", docSnap.data());
}

migrate().catch(console.error);
