const { getRoleRef } = require("../../shared/references");
const functions = require("firebase-functions/v1");

/**
 * Resolve role data strictly from roleId.
 * No fallbacks allowed to ensure consistency.
 */
exports.resolveRoleData = async (idTenant, idBranch, roleId) => {
    if (!roleId) {
        throw new functions.https.HttpsError("invalid-argument", "roleId é obrigatório para definir o cargo.");
    }

    try {
        const roleRef = getRoleRef(idTenant, idBranch, roleId);
        const roleSnap = await roleRef.get();

        if (!roleSnap.exists) {
            throw new functions.https.HttpsError("not-found", `Cargo com ID ${roleId} não encontrado.`);
        }

        const rData = roleSnap.data() || {};

        return {
            finalRole: rData.label || "Cargo Desconhecido", // Label oficial
            finalIsInstructor: !!rData.isInstructor // Definição estrita
        };

    } catch (error) {
        console.error(`[resolveRoleData] Erro ao buscar cargo ${roleId}:`, error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "Erro ao validar cargo do colaborador.");
    }
};
