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
    const tenantsSnapshot = await db.collection("tenants").get();
    let updatedSummaries = 0;

    for (const tenantDoc of tenantsSnapshot.docs) {
        const branchesSnapshot = await db.collection(`tenants/${tenantDoc.id}/branches`).get();
        for (const branchDoc of branchesSnapshot.docs) {

            const summariesSnap = await db.collection(`tenants/${tenantDoc.id}/branches/${branchDoc.id}/dashboardSummary`).get();
            for (const doc of summariesSnap.docs) {
                const data = doc.data();
                console.log(`Lendo doc: ${doc.id}`);
                const updates = {};
                if (data.activeStudents !== undefined) { updates.activeclients = data.activeStudents; updates.activeStudents = admin.firestore.FieldValue.delete(); }
                if (data.suspendedStudents !== undefined) { updates.suspendedclients = data.suspendedStudents; updates.suspendedStudents = admin.firestore.FieldValue.delete(); }
                if (data.canceledStudents !== undefined) { updates.canceledclients = data.canceledStudents; updates.canceledStudents = admin.firestore.FieldValue.delete(); }
                if (data.newStudents !== undefined) { updates.newclients = data.newStudents; updates.newStudents = admin.firestore.FieldValue.delete(); }

                if (Object.keys(updates).length > 0) {
                    await doc.ref.update(updates);
                    updatedSummaries++;
                }
            }
        }
    }

    console.log(`- Dashboard Summaries atualizados: ${updatedSummaries}`);
}

migrate().catch(console.error);
