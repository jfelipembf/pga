const functions = require("firebase-functions/v1");

/**
 * Extrai e valida o contexto de Tenant/Branch para Callable Functions.
 *
 * O Frontend deve enviar { idTenant, idBranch } no corpo da requisição.
 * O usuário deve estar autenticado.
 *
 * @param {Object} data - Payload enviado pelo cliente
 * @param {Object} context - Contexto da Cloud Function (auth)
 * @return {{ idTenant: string, idBranch: string, uid: string, token: Object }}
 * @throws {functions.https.HttpsError}
 */
exports.requireAuthContext = (data, context) => {
  // 1. Autenticação obrigatória
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "A operação requer um usuário autenticado.",
    );
  }

  // 2. Contexto obrigatório
  const idTenant = data.idTenant || data.tenantId;
  const idBranch = data.idBranch || data.branchId;

  if (!idTenant || !idBranch) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "É necessário fornecer 'idTenant' e 'idBranch' para " +
        "realizar esta operação.",
    );
  }

  // TODO: Futuramente, validar se context.auth.token.claims possui acesso
  // a este tenant/branch. Por enquanto, confiamos que as Security Rules
  // do Firestore impedem acesso indevido aos dados,
  // mas a Cloud Function deve ser blindada também.

  return {
    idTenant: String(idTenant),
    idBranch: String(idBranch),
    uid: context.auth.uid,
    token: context.auth.token,
  };
};
