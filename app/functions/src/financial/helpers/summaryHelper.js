const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const { toMonthKey } = require("../../helpers/date");

/**
 * Atualiza os contadores em dailySummary e monthlySummary.
 * 
 * @param {object} params
 * @param {string} params.idTenant
 * @param {string} params.idBranch
 * @param {string} params.dateStr - Data no formato YYYY-MM-DD
 * @param {number} params.revenueDelta - Valor a adicionar/subtrair da receita total (ex: payments)
 * @param {number} params.expenseDelta - Valor a adicionar/subtrair das despesas
 * @param {number} params.salesDelta - Valor a adicionar/subtrair do volume de vendas (valor bruto contratado)
 */
const updateSummaries = async ({
    idTenant,
    idBranch,
    dateStr,
    revenueDelta = 0,
    expenseDelta = 0,
    salesDelta = 0,
}) => {
    if (!idTenant || !idBranch || !dateStr) {
        return;
    }

    if (revenueDelta === 0 && expenseDelta === 0 && salesDelta === 0) return;

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

    // 1. Atualizações Diárias
    const dailyUpdates = { updatedAt: FieldValue.serverTimestamp() };
    if (revenueDelta !== 0) {
        dailyUpdates.totalRevenue = FieldValue.increment(revenueDelta);
    }
    if (expenseDelta !== 0) {
        dailyUpdates.totalExpenses = FieldValue.increment(expenseDelta);
        dailyUpdates.expenses = FieldValue.increment(expenseDelta);
    }
    if (salesDelta !== 0) {
        dailyUpdates.salesDay = FieldValue.increment(salesDelta);
    }

    // 2. Atualizações Mensais
    const monthlyUpdates = { updatedAt: FieldValue.serverTimestamp() };
    if (revenueDelta !== 0) {
        monthlyUpdates.totalRevenue = FieldValue.increment(revenueDelta);
    }
    if (expenseDelta !== 0) {
        monthlyUpdates.totalExpenses = FieldValue.increment(expenseDelta);
        monthlyUpdates.expenses = FieldValue.increment(expenseDelta);
    }
    if (salesDelta !== 0) {
        monthlyUpdates.salesMonth = FieldValue.increment(salesDelta);
    }

    batch.set(dailyRef, dailyUpdates, { merge: true });
    batch.set(monthlyRef, monthlyUpdates, { merge: true });

    try {
        await batch.commit();
    } catch (err) {
        console.error("[updateSummaries] Error committing batch:", err);
    }
};

module.exports = {
    updateSummaries
};
