const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * ============================================================================
 * CLIENT CONTRACTS UTILS
 * ____________________________________________________________________________
 *
 * 1. getContractsColl: Retorna a coleção de contratos de clientes.
 * 2. getEnrollmentsColl: Retorna a coleção de matrículas.
 * 3. isActiveLike: Verifica se um status de contrato é considerado ativo.
 *
 * ============================================================================
 */

/**
 * Retorna a referência da coleção de contratos de clientes.
 */
const getContractsColl = (idTenant, idBranch) =>
    db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clientsContracts");


/**
 * Helper para verificar se um status conta como 'ativo' para fins de contagem.
 */
const isActiveLike = (status) => {
    return ["active", "pending_setup", "expiring"].includes(status);
};

module.exports = {
    getContractsColl,

    isActiveLike,
};
