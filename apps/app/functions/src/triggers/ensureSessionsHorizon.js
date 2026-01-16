const admin = require("firebase-admin");
const { createScheduledTrigger } = require("./utils");
const { toISODate } = require("../classes/helpers/dateUtils");
const { generateSessionsForClass } = require("../classes/helpers/sessionGenerator");

/**
 * Garante que existam sessões criadas para os próximos 6 meses.
 * Roda diariamente às 00:10 para manter o horizonte sempre preenchido.
 */
module.exports = createScheduledTrigger("10 0 * * *", "ensureSessionsHorizon", async () => {
    const db = admin.firestore();
    const fromIso = toISODate(new Date());
    const weeks = 26; // ~6 meses

    const tenantsSnap = await db.collection("tenants").get();

    let createdTotal = 0;

    for (const tenantDoc of tenantsSnap.docs) {
        const idTenant = tenantDoc.id;
        const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

        for (const branchDoc of branchesSnap.docs) {
            const idBranch = branchDoc.id;
            const classesSnap = await db
                .collection("tenants")
                .doc(idTenant)
                .collection("branches")
                .doc(idBranch)
                .collection("classes")
                .get();

            for (const classDoc of classesSnap.docs) {
                const classData = classDoc.data() || {};
                const res = await generateSessionsForClass({
                    idTenant,
                    idBranch,
                    idClass: classDoc.id,
                    classData,
                    weeks,
                    fromDate: fromIso,
                });
                createdTotal += res.created;
            }
        }
    }

    console.log(`[ensureSessionsHorizon] Finalizado. Sessões criadas: ${createdTotal}`);
});
