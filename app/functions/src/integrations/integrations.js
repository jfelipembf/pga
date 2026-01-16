const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const axios = require("axios");

/**
 * Salva a configuração de uma integração e gerencia recursos externos (Evolution API).
 * @param {object} data - Dados da requisição { idTenant, idBranch, integrationId, config }
 * @param {object} context - Contexto da autenticação
 */
exports.saveIntegrationConfig = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário deve estar autenticado."
      );
    }

    const { idTenant, idBranch, integrationId, config } = data;

    if (!idTenant || !idBranch || !integrationId || !config) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tenant, Branch, ID da integração e configuração são obrigatórios."
      );
    }

    // Helper Service Import (Lazy load or top level)
    const { ensureEvolutionInstance } = require("./helpers/evolution.service");

    try {
      // --- Evolution API & Financial Bot Logic ---
      // Agora suporta tanto 'evolution' (Geral/Clientes) quanto 'evolution_financial' (Despesas)
      if (['evolution', 'evolution_financial'].includes(integrationId) && config.baseUrl && config.apiKey && config.instanceName) {
        // O service cuida de validar e criar a instância
        await ensureEvolutionInstance(config.baseUrl, config.apiKey, config.instanceName);
      }
      // -------------------------------------------
      // ------------------------------------

      // Salva na subcoleção do branch
      const targetRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("integrations")
        .doc(integrationId);

      const payload = {
        ...config,
        updatedAt: new Date(), // Replacing serverTimestamp to avoid version compatibility issues
        updatedBy: context.auth.uid
      };

      await targetRef.set(payload, { merge: true });

      return { success: true, message: "Configuração salva com sucesso." };
    } catch (error) {
      console.error("Erro ao salvar configuração de integração:", error);
      throw new functions.https.HttpsError("internal", "Erro ao salvar configuração: " + error.message);
    }
  });

/**
 * Recupera a configuração de uma integração.
 * @param {object} data - Dados da requisição { idTenant, idBranch, integrationId }
 * @param {object} context - Contexto da autenticação
 */
exports.getIntegrationConfig = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário deve estar autenticado."
      );
    }

    const { idTenant, idBranch, integrationId } = data;

    if (!idTenant || !idBranch || !integrationId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tenant, Branch e ID da integração são obrigatórios."
      );
    }

    try {
      const targetRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("integrations")
        .doc(integrationId);

      const doc = await targetRef.get();

      if (!doc.exists) {
        return { config: {} };
      }

      return { config: doc.data() };
    } catch (error) {
      console.error("Erro ao recuperar configuração:", error);
      throw new functions.https.HttpsError("internal", "Erro ao recuperar configuração.");
    }
  });
