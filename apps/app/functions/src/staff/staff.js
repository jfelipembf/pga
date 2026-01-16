const functions = require("firebase-functions/v1");
const { createStaffUserLogic, updateStaffUserLogic } = require("./helpers/staff.service");

/**
 * Cria um usuário no Authentication e um documento na coleção Staff.
 * Deve ser chamado apenas por usuários com permissão de administrador (ou gerente).
 */
exports.criarUsuarioEquipe = functions.region("us-central1").https.onCall(createStaffUserLogic);

/**
 * Atualiza um usuário da equipe.
 */
exports.atualizarUsuarioEquipe = functions.region("us-central1").https.onCall(updateStaffUserLogic);
