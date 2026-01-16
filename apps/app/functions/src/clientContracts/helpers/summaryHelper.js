const admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const { toMonthKey } = require("../../helpers/date");

/**
 * ============================================================================
 * CONTRACT SUMMARY HELPERS
 * ____________________________________________________________________________
 *
 * 1. updateContractSummaries: Atualiza contadores em dailySummary e monthlySummary.
 *
 * ============================================================================
 */

/**
 * Atualiza os contadores em dailySummary e monthlySummary para Contratos.
 */
const updateContractSummaries = async ({ idTenant, idBranch, dateStr, updates, monthlyUpdates }) => {
    if (!idTenant || !idBranch || !dateStr) return;
    if (Object.keys(updates).length === 0 && Object.keys(monthlyUpdates).length === 0) return;

    const monthId = toMonthKey(dateStr); // YYYY-MM

    const dailyRef = db
        .collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("dailySummary").doc(dateStr);

    const monthlyRef = db
        .collection("tenants").doc(idTenant)
        .collection("branches").doc(idBranch)
        .collection("monthlySummary").doc(monthId);

    const batch = db.batch();

    if (Object.keys(updates).length > 0) {
        updates.updatedAt = FieldValue.serverTimestamp();
        batch.set(dailyRef, updates, { merge: true });
    }

    if (Object.keys(monthlyUpdates).length > 0) {
        monthlyUpdates.updatedAt = FieldValue.serverTimestamp();
        batch.set(monthlyRef, monthlyUpdates, { merge: true });
    }

    await batch.commit();
};

module.exports = {
    updateContractSummaries,
};
