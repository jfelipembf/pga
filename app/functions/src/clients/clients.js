const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { buildClientPayload } = require("../shared/payloads");
const { generateEntityId } = require("../shared/id");

/**
 * Gera um idGym sequencial (0001, 0002...) por UNIDADE (branch).
 * Armazena em: tenants/{t}/branches/{b}/counters/clients
 */
exports.getNextClientGymId = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
    }

    const { idTenant, idBranch } = data;

    if (!idTenant || !idBranch) {
      throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
    }

    const idGym = await generateEntityId(idTenant, idBranch, "client", {
      prefix: "",
      sequential: true,
      digits: 4
    });


    // Extract only the numeric part (padded) if it follows 'CLIENT-YYYY-NNN' or similar,
    // but the current generateEntityId for 'client' would use default prefix from TYPE_PREFIX_MAP.
    // Let's add 'client' to TYPE_PREFIX_MAP in id.js or use custom prefix here.
    return idGym.split('-').pop(); // Returns the sequential part
  });


/**
 * Cria um cliente.
 */
exports.createClient = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
      }

      const { idTenant, idBranch, clientData } = data;

      if (!idTenant || !idBranch) {
        throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
      }

      if (!clientData) {
        throw new functions.https.HttpsError("invalid-argument", "clientData é obrigatório");
      }

      const db = admin.firestore();

      // Gerar idGym sequencial usando utilitário padronizado
      const fullId = await generateEntityId(idTenant, idBranch, "client", {
        prefix: "",
        sequential: true,
        digits: 4
      });

      const idGym = fullId.split('-').pop();

      const clientRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc();

      // Use shared builder for consistency
      const basePayload = buildClientPayload(clientData);

      const payload = {
        ...basePayload,
        idGym,
        idTenant,
        idBranch,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await clientRef.set(payload);

      return { id: clientRef.id, ...payload };
    } catch (error) {
      console.error("Error creating client:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erro interno ao criar cliente");
    }
  });


/**
 * Atualiza um cliente.
 */
exports.updateClient = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
      }

      const { idTenant, idBranch, idClient, clientData } = data;

      if (!idTenant || !idBranch) {
        throw new functions.https.HttpsError("invalid-argument", "idTenant e idBranch são obrigatórios");
      }

      if (!idClient) {
        throw new functions.https.HttpsError("invalid-argument", "idClient é obrigatório");
      }

      if (!clientData) {
        throw new functions.https.HttpsError("invalid-argument", "clientData é obrigatório");
      }

      const db = admin.firestore();

      const clientRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("clients")
        .doc(idClient);

      const { deriveFullName, buildAddress } = require("../shared/payloads");

      const payload = {
        ...clientData,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Sincronizar nome derivado se necessário
      if (clientData.firstName !== undefined || clientData.lastName !== undefined || clientData.name !== undefined) {
        payload.name = deriveFullName(clientData);
      }

      // Sincronizar endereço se necessário
      if (clientData.address || clientData.street || clientData.city) {
        payload.address = buildAddress(clientData);
      }

      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      await clientRef.update(payload);

      return { id: idClient, ...payload };

    } catch (error) {

      console.error("Error updating client:", error);
      throw new functions.https.HttpsError("internal", error.message || "Erro interno ao atualizar cliente");
    }
  });
