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
