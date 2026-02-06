const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

/**
 * Altera a senha de um usuário no Firebase Auth.
 * Somente administradores (usuários com permissão ou via backend) podem executar.
 * No ambiente do cliente, esta função será chamada via SDK.
 */
exports.updateUserPassword = onCall(async (request) => {
    // 1. Verificação de Autenticação
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "O usuário deve estar logado.");
    }

    const { uid, newPassword } = request.data;

    // 2. Validação básica
    if (!uid || !newPassword) {
        throw new HttpsError("invalid-argument", "UID e nova senha são obrigatórios.");
    }

    if (newPassword.length < 6) {
        throw new HttpsError("invalid-argument", "A senha deve ter pelo menos 6 caracteres.");
    }

    try {
        // 3. Atualizar no Auth
        await admin.auth().updateUser(uid, {
            password: newPassword
        });

        return { success: true, message: "Senha atualizada com sucesso." };
    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        throw new HttpsError("internal", error.message || "Erro desconhecido ao atualizar senha.");
    }
});
