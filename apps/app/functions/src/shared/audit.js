const admin = require("firebase-admin");

/**
 * Salva um registro de auditoria no Firestore.
 *
 * @param {Object} params - Parâmetros do log
 * @param {string} params.idTenant - ID do tenant
 * @param {string} params.idBranch - ID da unidade
 * @param {string} params.uid - UID do usuário que realizou a ação
 * @param {string} params.action - Tipo da ação (ex: STAFF_CREATE)
 * @param {string} params.targetId - ID da entidade afetada (ex: staffId)
 * @param {string} params.description - Descrição humanizada da ação
 * @param {Object} [params.metadata] - Dados adicionais (diffs, payloads, etc)
 */
exports.saveAuditLog = async ({
    idTenant,
    idBranch,
    uid,
    userName,
    action,
    targetId,
    description,
    metadata = {},
}) => {
    if (!idTenant || !idBranch) {
        console.warn("Auditoria: idTenant ou idBranch ausentes.");
        return;
    }

    const db = admin.firestore();
    const logRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("auditLog")
        .doc();

    const logEntry = {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userId: uid || "system",
        userName: userName || metadata.userName || metadata.registeredBy || null,
        action: action || "UNKNOWN_ACTION",
        targetId: targetId || null,
        description: description || "",
        metadata,
    };

    try {
        await logRef.set(logEntry);
    } catch (err) {
        // Falha silenciosa para não quebrar a transação principal,
        // mas loga no console para monitoramento.
        console.error(`Erro ao salvar log de auditoria (${action}):`, err);
    }
};
