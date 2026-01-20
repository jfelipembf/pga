const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const { requireAuthContext } = require("../../shared/context");
const { saveAuditLog } = require("../../shared/audit");
const { getActorSnapshot, getTargetSnapshot } = require("../../shared/snapshots");
const { validate } = require("../../shared/validator");
const { StaffSchema } = require("../validation/staff.validation");

// Local utilities
const { buildStaffPayload } = require("./staff.payloads");
const { deriveFullName } = require("../../shared/payloads");
const { getOrCreateAuthUser, updateAuthUser, buildAuthUpdates } = require("../../shared/auth");
const { getStaffRef } = require("../../shared/references");
const { resolveRoleData } = require("./roleResolver");

// =========================
// CREATE
// =========================
async function createStaffUserLogic(data, context) {
    const { idTenant, idBranch } = requireAuthContext(data, context);
    const validatedData = validate(StaffSchema, data);

    try {
        // Strict Mode: Only trusted Role Data
        const { finalRole, finalIsInstructor } = await resolveRoleData(
            idTenant,
            idBranch,
            validatedData.roleId
        );

        // Create or get Auth user
        const displayName = deriveFullName(validatedData);

        const userRecord = await getOrCreateAuthUser({
            email: validatedData.email,
            password: validatedData.password,
            displayName,
            disabled: validatedData.status === "inactive",
        });

        // Build Firestore payload
        const basePayload = buildStaffPayload(validatedData);
        const staffRef = getStaffRef(idTenant, idBranch, userRecord.uid);
        const now = FieldValue.serverTimestamp();

        const finalPayload = {
            ...basePayload,
            id: userRecord.uid,
            idTenant,
            idBranch,
            role: finalRole,
            isInstructor: finalIsInstructor,
            isFirstAccess: true,
            createdAt: now,
            updatedAt: now,
        };

        await staffRef.set(finalPayload);

        // Audit log
        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot(
            "staff",
            { id: userRecord.uid, name: displayName, email: validatedData.email, role: finalRole },
            userRecord.uid
        );

        await saveAuditLog({
            idTenant,
            idBranch,
            action: "STAFF_CREATE",
            actor,
            target,
            description: `Criou o colaborador ${displayName} (${finalRole})`,
            metadata: { email: validatedData.email, role: finalRole, roleId: validatedData.roleId },
        });

        return { success: true, uid: userRecord.uid, message: "Colaborador criado com sucesso." };
    } catch (error) {
        console.error("[createStaffUserLogic] Erro:", error);
        if (error instanceof functions.https.HttpsError) throw error;

        throw new functions.https.HttpsError(
            "internal",
            "Erro interno ao criar colaborador.",
            { message: error.message, code: error.code, stack: error.stack }
        );
    }
}

// =========================
// UPDATE
// =========================
async function updateStaffUserLogic(data, context) {
    const { idTenant, idBranch } = requireAuthContext(data, context);
    const validatedUpdates = validate(StaffSchema.partial(), data);

    if (!validatedUpdates.id) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "O ID do colaborador é obrigatório para atualização."
        );
    }

    try {
        const staffRef = getStaffRef(idTenant, idBranch, validatedUpdates.id);
        const staffSnap = await staffRef.get();

        if (!staffSnap.exists) {
            throw new functions.https.HttpsError(
                "not-found",
                "Colaborador não encontrado para atualização."
            );
        }

        const currentData = staffSnap.data() || {};

        // Resolve role (Strict)
        // Se o roleId mudou, buscamos os dados novos. Se não mudou, mantemos os atuais (ou revalidamos).
        // Aqui optamos por SEMPRE revalidar se tivermos um roleId disponível, para garantir consistência.
        const targetRoleId = validatedUpdates.roleId ?? currentData.roleId;

        const { finalRole, finalIsInstructor } = await resolveRoleData(
            idTenant,
            idBranch,
            targetRoleId
        );

        // Build Firestore payload
        const firestorePayload = buildStaffPayload(validatedUpdates, currentData);
        firestorePayload.role = finalRole;
        firestorePayload.isInstructor = finalIsInstructor;
        firestorePayload.updatedAt = FieldValue.serverTimestamp();

        // Remove undefined values
        Object.keys(firestorePayload).forEach((k) => {
            if (firestorePayload[k] === undefined) delete firestorePayload[k];
        });

        // Legacy address fields cleanup
        const legacyAddressFieldsToRemove = {
            zip: FieldValue.delete(),
            state: FieldValue.delete(),
            city: FieldValue.delete(),
            neighborhood: FieldValue.delete(),
            number: FieldValue.delete(),
            complement: FieldValue.delete(),
        };

        // Update Auth if needed
        const authUpdates = buildAuthUpdates(
            {
                ...validatedUpdates,
                displayName: firestorePayload.displayName,
                photo: firestorePayload.photo,
            },
            currentData
        );

        if (Object.keys(authUpdates).length > 0) {
            await updateAuthUser(validatedUpdates.id, authUpdates);
        }

        // Update Firestore
        await staffRef.set(
            { ...firestorePayload, ...legacyAddressFieldsToRemove },
            { merge: true }
        );

        // Audit log
        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot(
            "staff",
            {
                id: validatedUpdates.id,
                name: firestorePayload.displayName,
                email: firestorePayload.email,
                role: finalRole
            },
            validatedUpdates.id
        );

        await saveAuditLog({
            idTenant,
            idBranch,
            action: "STAFF_UPDATE",
            actor,
            target,
            description: `Atualizou os dados do colaborador ${firestorePayload.displayName}`,
            metadata: {
                updates: Object.keys(firestorePayload),
                email: firestorePayload.email,
            },
        });

        return { success: true, message: "Colaborador atualizado com sucesso." };
    } catch (error) {
        console.error("[updateStaffUserLogic] Erro:", error);
        if (error instanceof functions.https.HttpsError) throw error;

        throw new functions.https.HttpsError(
            "internal",
            "Erro interno ao atualizar colaborador.",
            { message: error.message, code: error.code, stack: error.stack }
        );
    }
}

module.exports = {
    createStaffUserLogic,
    updateStaffUserLogic,
};

