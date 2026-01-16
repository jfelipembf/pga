const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Verifica se o status é considerado ativo.
 */
const isActive = (status) => {
    const s = String(status || "").toLowerCase();
    return s === "active";
};

const clientRef = ({ idTenant, idBranch, idClient }) =>
    db
        .collection("tenants")
        .doc(String(idTenant))
        .collection("branches")
        .doc(String(idBranch))
        .collection("clients")
        .doc(String(idClient));

/**
 * Aplica a mudança nos contadores do cliente.
 */
const applyDelta = async ({ idTenant, idBranch, idClient, activeDelta, pastDelta }) => {
    if (!idTenant || !idBranch || !idClient) return;

    const ref = clientRef({ idTenant, idBranch, idClient });

    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;

        const data = snap.data() || {};
        const nextActive = Math.max(Number(data.enrollmentsActiveCount || 0) + Number(activeDelta || 0), 0);
        const nextPast = Math.max(Number(data.enrollmentsPastCount || 0) + Number(pastDelta || 0), 0);

        tx.set(
            ref,
            {
                enrollmentsActiveCount: nextActive,
                enrollmentsPastCount: nextPast,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
    });
};

module.exports = {
    isActive,
    clientRef,
    applyDelta,
};
