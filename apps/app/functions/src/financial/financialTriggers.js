const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();
const { toISODate } = require("../helpers/date");
const { updateSummaries } = require("./helpers/summaryHelper");

// ============================================================================
// TRIGGERS (Gatilhos do Firestore)
// ============================================================================


/**
 * Trigger para Transações Financeiras (Fluxo de Caixa)
 * Afeta: totalRevenue, totalExpenses, expenses
 */
exports.onFinancialTransactionWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/financialTransactions/{idTransaction}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const getValues = (data) => {
      if (!data) return { revenue: 0, expense: 0, grossRevenue: 0, fees: 0, date: null };

      // Ignore pending or cancelled transactions
      if (data.status === 'pending' || data.status === 'cancelled') return { revenue: 0, expense: 0, grossRevenue: 0, fees: 0, date: null };

      const amount = parseFloat(data.amount) || 0;
      const grossAmount = parseFloat(data.grossAmount || data.amount) || 0;
      const feeAmount = parseFloat(data.feeAmount) || 0;

      let date = data.date;
      if (!date && data.createdAt && data.createdAt.toDate) {
        date = toISODate(data.createdAt.toDate());
      }
      if (!date) date = toISODate(new Date());

      // Sale = receita positiva
      if (data.type === "sale") {
        return { revenue: amount, expense: 0, grossRevenue: grossAmount, fees: feeAmount, date };
      }

      // Expense = despesa positiva
      if (data.type === "expense") {
        return { revenue: 0, expense: amount, grossRevenue: 0, fees: 0, date };
      }

      // receivablePayment = entrada de dinheiro (receita positiva)
      if (data.type === "receivablePayment") {
        return {
          revenue: Math.abs(amount),
          expense: 0,
          grossRevenue: Math.abs(grossAmount),
          fees: Math.abs(feeAmount),
          date
        };
      }

      return { revenue: 0, expense: 0, grossRevenue: 0, fees: 0, date };
    };

    const valBefore = getValues(before);
    const valAfter = getValues(after);



    // Se mudou de dia
    if (before && after && valBefore.date !== valAfter.date) {
      // Subtrai do antigo

      await updateSummaries({
        idTenant, idBranch, dateStr: valBefore.date,
        revenueDelta: -valBefore.revenue,
        expenseDelta: -valBefore.expense,
        grossRevenueDelta: -valBefore.grossRevenue,
        feesDelta: -valBefore.fees
      });
      // Adiciona no novo

      await updateSummaries({
        idTenant, idBranch, dateStr: valAfter.date,
        revenueDelta: valAfter.revenue,
        expenseDelta: valAfter.expense,
        grossRevenueDelta: valAfter.grossRevenue,
        feesDelta: valAfter.fees
      });
    } else {
      // Mesmo dia ou criação/deleção

      const date = valAfter.date || valBefore.date;

      await updateSummaries({
        idTenant, idBranch, dateStr: date,
        revenueDelta: valAfter.revenue - valBefore.revenue,
        expenseDelta: valAfter.expense - valBefore.expense,
        grossRevenueDelta: valAfter.grossRevenue - valBefore.grossRevenue,
        feesDelta: valAfter.fees - valBefore.fees
      });
    }
  });

/**
 * Trigger para Vendas (Volume de Vendas)
 * Afeta: salesDay, salesMonth
 */
exports.onSaleWrite = functions
  .region("us-central1")
  .firestore
  .document("tenants/{idTenant}/branches/{idBranch}/sales/{idSale}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const getVal = (data) => {
      if (!data) return { amount: 0, date: null };
      // Usamos o valor líquido da venda (net) para as estatísticas de vendas
      let amount = parseFloat(data.totals?.net) || 0;
      if (amount === 0 && data.amount) amount = parseFloat(data.amount) || 0;

      let date = data.saleDate;
      if (!date && data.createdAt && data.createdAt.toDate) {
        date = toISODate(data.createdAt.toDate());
      }
      if (!date) date = toISODate(new Date());

      return { amount, date };
    };

    const valBefore = getVal(before);
    const valAfter = getVal(after);



    if (before && after && valBefore.date !== valAfter.date) {
      await updateSummaries({ idTenant, idBranch, dateStr: valBefore.date, salesDelta: -valBefore.amount });
      await updateSummaries({ idTenant, idBranch, dateStr: valAfter.date, salesDelta: valAfter.amount });
    } else {
      const date = valAfter.date || valBefore.date;
      const salesDelta = valAfter.amount - valBefore.amount;

      await updateSummaries({
        idTenant, idBranch, dateStr: date,
        salesDelta: salesDelta
      });
    }
  });
