const functions = require("firebase-functions/v1");
const { createClientLogic, updateClientLogic } = require("./helpers/clients.service");

/**
 * Cria um cliente.
 */
exports.createClient = functions.region("us-central1").https.onCall(createClientLogic);

/**
 * Atualiza um cliente.
 */
exports.updateClient = functions.region("us-central1").https.onCall(updateClientLogic);
