const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { monthRangeFromKey, isPresentStatus } = require("./utils");

/**
 * Recalcula o resumo mensal de presença do cliente.
 */
const recomputeClientMonthSummary = async ({ idTenant, idBranch, idClient, monthKey }) => {
    if (!idTenant || !idBranch || !idClient || !monthKey) return;
    const range = monthRangeFromKey(monthKey);
    if (!range) return;

    const db = admin.firestore();

    const attendanceCol = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc(idClient)
        .collection("attendance");

    const attSnap = await attendanceCol
        .where("sessionDate", ">=", range.start)
        .where("sessionDate", "<=", range.end)
        .get();

    let attended = 0;
    let absences = 0;
    for (const docSnap of attSnap.docs) {
        const d = docSnap.data() || {};
        if (isPresentStatus(d.status)) attended += 1;
        else absences += 1;
    }

    const summaryRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc(idClient)
        .collection("attendanceMonthly")
        .doc(monthKey);

    await summaryRef.set(
        {
            month: monthKey,
            attended,
            absences,
            updatedAt: FieldValue.serverTimestamp(),
            idTenant,
            idBranch,
            idClient,
        },
        { merge: true },
    );
};

module.exports = { recomputeClientMonthSummary };
