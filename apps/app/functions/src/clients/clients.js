const functions = require("firebase-functions/v1");
const { createClientLogic, updateClientLogic } = require("./helpers/clients.service");
const { withMonitoring } = require("../helpers/monitoringHelper");

/**
 * Cria um cliente.
 */
exports.createClient = functions.region("us-central1").https.onCall(withMonitoring("createClient", createClientLogic));

/**
 * Atualiza um cliente.
 */
exports.updateClient = functions.region("us-central1").https.onCall(withMonitoring("updateClient", updateClientLogic));

/**
 * Exclui logicamente ("soft delete") um cliente, se não tiver pendências.
 */
exports.deleteClient = functions.region("us-central1").https.onCall(withMonitoring("deleteClient", require("./helpers/clients.service").deleteClientLogic));
