const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { saveSaleLogic } = require("./helpers/sales.service");

// Inicializa Firestore se ainda não estiver
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const { withMonitoring } = require("../helpers/monitoringHelper");

/**
 * Cria ou Atualiza uma venda (Sale).
 * Wrapper para o SalesService Logic.
 */
exports.saveSale = functions.https.onCall(withMonitoring("saveSale", saveSaleLogic));

// Listener (Trigger) para atualizações pós-venda
exports.onSaleWrite = functions.firestore
  .document("tenants/{idTenant}/branches/{idBranch}/sales/{idSale}")
  .onWrite(async (change, context) => {
    // Log para fins de debug
    console.log(`[onSaleWrite] Sale ${context.params.idSale} updated.`, {
      before: change.before.exists,
      after: change.after.exists
    });
    return null;
  });
