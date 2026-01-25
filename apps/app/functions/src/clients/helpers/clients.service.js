const functions = require("firebase-functions/v1");
const { FieldValue } = require("firebase-admin/firestore");

// Local utilities
const { buildClientPayload, deriveFullName, buildAddress } = require("../../shared");

const { saveAuditLog } = require("../../shared/audit");
const { getActorSnapshot, getTargetSnapshot } = require("../../shared/snapshots");
const { getBranchCollectionRef } = require("../../shared/references");
const { requireAuthContext } = require("../../shared/context");
const { validate } = require("../../shared/validator");

// Schemas
const { ClientSchema } = require("../../shared");

/**
 * Logic: Create a new Client
 */
exports.createClientLogic = async (data, context) => {
    try {
        const { idTenant, idBranch } = requireAuthContext(data, context);

        if (!data.clientData) {
            throw new functions.https.HttpsError("invalid-argument", "clientData é obrigatório");
        }

        // Validate and sanitize
        const perf = { start: Date.now() };

        // 1. Validation Step
        const validatedData = validate(ClientSchema, data.clientData);
        perf.validation = Date.now() - perf.start;

        // 2. Payload Build Step
        const step2Start = Date.now();
        const clientsRef = getBranchCollectionRef(idTenant, idBranch, "clients");
        const clientRef = clientsRef.doc();
        const basePayload = buildClientPayload(validatedData);
        const payload = {
            ...basePayload,
            idGym: null,
            idGymPending: true,
            idTenant,
            idBranch,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        perf.payloadBuild = Date.now() - step2Start;

        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot("client", { ...payload, id: clientRef.id }, clientRef.id);

        // 3. Database Step
        const step3Start = Date.now();
        await Promise.all([
            clientRef.set(payload),
            saveAuditLog({
                idTenant,
                idBranch,
                action: "CLIENT_CREATE",
                actor,
                target,
                description: `Criou o cliente ${payload.name} (ID pendente)`,
                metadata: { pendingIdGym: true }
            }).catch(err => console.error('[createClient] Audit log failed:', err))
        ]);
        perf.database = Date.now() - step3Start;
        perf.total = Date.now() - perf.start;

        // Return details for monitoring
        return {
            id: clientRef.id,
            ...payload,
            _perf: perf // This will be captured by monitoring wrapper
        };
    } catch (error) {
        console.error("[createClientLogic] Error creating client:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", error.message || "Erro interno ao criar cliente");
    }
};

/**
 * Logic: Update a Client
 */
exports.updateClientLogic = async (data, context) => {
    try {
        const { idTenant, idBranch } = requireAuthContext(data, context);

        if (!data.idClient) {
            throw new functions.https.HttpsError("invalid-argument", "idClient é obrigatório");
        }

        if (!data.clientData) {
            throw new functions.https.HttpsError("invalid-argument", "clientData é obrigatório");
        }

        const perf = { start: Date.now() };

        // 1. Validation Step
        const validatedData = validate(ClientSchema, data.clientData);
        perf.validation = Date.now() - perf.start;

        // Get client reference
        const clientRef = getBranchCollectionRef(idTenant, idBranch, "clients", data.idClient);

        const payload = {
            ...validatedData,
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Sync derived name if needed
        if (data.clientData.firstName !== undefined || data.clientData.lastName !== undefined || data.clientData.name !== undefined) {
            payload.name = deriveFullName(data.clientData);
        }

        // Sync address if needed
        if (data.clientData.address || data.clientData.street || data.clientData.city) {
            payload.address = buildAddress(data.clientData);
        }

        // Remove undefined values
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        // Audit log preparation
        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot("client", { ...payload, id: data.idClient }, data.idClient);

        // 2. Database Step
        const step2Start = Date.now();
        await Promise.all([
            clientRef.update(payload),
            saveAuditLog({
                idTenant,
                idBranch,
                action: "CLIENT_UPDATE",
                actor,
                target,
                description: `Atualizou o cliente ${payload.name || "..."}`,
                metadata: { updates: Object.keys(payload) }
            }).catch(err => console.error('[updateClient] Audit log failed:', err))
        ]);
        perf.database = Date.now() - step2Start;
        perf.total = Date.now() - perf.start;

        return {
            id: data.idClient,
            ...payload,
            _perf: perf
        };

    } catch (error) {
        console.error("[updateClientLogic] Error updating client:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", error.message || "Erro interno ao atualizar cliente");
    }
};

/**
 * Logic: Delete (Soft) a Client
 */
exports.deleteClientLogic = async (data, context) => {
    try {
        const { idTenant, idBranch } = requireAuthContext(data, context);

        if (!data.idClient) {
            throw new functions.https.HttpsError("invalid-argument", "idClient é obrigatório");
        }

        const idClient = data.idClient;
        const db = require("firebase-admin").firestore();

        // Check for active ENROLLMENTS
        const enrollmentsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
        const activeEnrollmentsSnap = await enrollmentsRef
            .where("idClient", "==", idClient)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (!activeEnrollmentsSnap.empty) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Não é possível excluir o cliente pois ele possui matrículas ativas em turmas."
            );
        }

        // Check for active CONTRACTS (Global contracts collection normally used for linking)
        const contractsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("contracts");
        const activeContractsSnap = await contractsRef
            .where("idClient", "==", idClient)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (!activeContractsSnap.empty) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Não é possível excluir o cliente pois ele possui contratos ativos."
            );
        }

        // Perform Soft Delete
        const clientRef = getBranchCollectionRef(idTenant, idBranch, "clients", idClient);

        // Fetch client name for audit log
        const clientDoc = await clientRef.get();
        const clientName = clientDoc.exists ? (clientDoc.data().name || "Cliente") : "Cliente";

        const updateData = {
            deleted: true,
            deletedAt: FieldValue.serverTimestamp(),
            status: "deleted",
            updatedAt: FieldValue.serverTimestamp()
        };

        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot("client", { id: idClient, name: clientName }, idClient);

        await Promise.all([
            clientRef.update(updateData),
            saveAuditLog({
                idTenant,
                idBranch,
                action: "CLIENT_DELETE",
                actor,
                target,
                description: `Excluiu (soft delete) o cliente ${clientName}`,
                metadata: { deleted: true }
            }).catch(err => console.error('[deleteClient] Audit log failed:', err))
        ]);

        return { success: true, id: idClient };

    } catch (error) {
        console.error("[deleteClientLogic] Error deleting client:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", error.message || "Erro interno ao excluir cliente");
    }
};
