const functions = require("firebase-functions/v1");
const { FieldValue } = require("firebase-admin/firestore");

// Shared utilities
const { requireAuthContext } = require("../shared/context");
const { getBranchCollectionRef } = require("../shared/references");
const { saveAuditLog } = require("../shared/audit");
const { getActorSnapshot, getTargetSnapshot } = require("../shared/snapshots");
const { validate } = require("../shared/validator");
const { ClassSchema } = require("./validation/class.validation");

// Class-specific helpers
const { validateClassDaysAgainstContracts, validateEndDateConflicts } = require("./helpers/validator");
const { cleanupFutureSessions, syncSessionUpdates } = require("./helpers/sessionUpdater");
const { computeEndTime } = require("../helpers/date");

/**
 * ============================================================================
 * GERENCIAMENTO DE TURMAS
 * ____________________________________________________________________________
 *
 * 1. updateClass: Atualiza turma e trata conflitos de horário/contrato.
 * 2. deleteClass: Deleta turma (com validações de segurança).
 *
 * ============================================================================
 */

/**
 * Atualiza uma turma.
 * - Trata lógica de `endDate`: remove sessões futuras e encerra matrículas.
 * - Valida restrições de dias dos contratos dos alunos.
 * - Atualiza horários das sessões futuras se houver mudança.
 */
exports.updateClass = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        const { idTenant, idBranch } = requireAuthContext(data, context);

        const id = data.id || data.idClass;
        let rawUpdates = data.classData ||
            (({ id, idClass, idTenant, idBranch, ...rest }) => rest)(data);

        if (!id) throw new functions.https.HttpsError("invalid-argument", "ID da turma é obrigatório");

        const updates = validate(ClassSchema, rawUpdates);
        const classRef = getBranchCollectionRef(idTenant, idBranch, "classes", id);

        // 1. Validar Contratos (Se houver mudança de dias)
        if (updates.weekDays && Array.isArray(updates.weekDays)) {
            const newDays = updates.weekDays.map(Number);
            await validateClassDaysAgainstContracts({ idTenant, idBranch, idClass: id, newDays });
        }

        // 2. Validar Conflitos de EndDate (PRIORITÁRIO)
        if (updates.endDate) {
            await validateEndDateConflicts({ idTenant, idBranch, idClass: id, endDate: updates.endDate });
        }

        // Preparar Updates de Sessão
        const doc = await classRef.get();
        if (!doc.exists) throw new functions.https.HttpsError("not-found", "Turma não encontrada");
        const currentData = doc.data();

        const sessionFields = ["idActivity", "idArea", "idStaff", "maxCapacity", "startTime", "durationMinutes"];
        const sessionUpdates = {};
        let shouldUpdateSessions = false;

        sessionFields.forEach(field => {
            if (updates[field] !== undefined && updates[field] !== currentData[field]) {
                shouldUpdateSessions = true;
                sessionUpdates[field] = updates[field];
            }
        });

        if (sessionUpdates.startTime || sessionUpdates.durationMinutes) {
            const start = sessionUpdates.startTime || currentData.startTime;
            const duration = sessionUpdates.durationMinutes || currentData.durationMinutes;
            const newEndTime = computeEndTime(start, duration);
            updates.endTime = newEndTime;
            sessionUpdates.endTime = newEndTime;
        }

        // 3. Executar Limpeza de Sessões (Se tiver endDate e passou na validação)
        if (updates.endDate) {
            await cleanupFutureSessions({ idTenant, idBranch, idClass: id, endDate: updates.endDate });
        }

        // 4. Sincronizar Sessões Futuras (Se houver mudanças)
        if (shouldUpdateSessions) {
            await syncSessionUpdates({ idTenant, idBranch, idClass: id, updates, sessionUpdates });
        }

        // 5. FINALMENTE: Atualizar a Turma
        await classRef.update({
            ...updates,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Audit log
        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot("class", { id, ...currentData }, id);

        await saveAuditLog({
            idTenant,
            idBranch,
            action: "CLASS_UPDATE",
            actor,
            target,
            description: `Atualizou dados da turma: ${currentData.title || currentData.name || id}`,
            metadata: { updates: Object.keys(updates) }
        });

        return { success: true };

    } catch (error) {
        console.error("Erro ao atualizar turma:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", error.message || "Erro ao atualizar turma");
    }
});


/**
 * Deleta uma turma com segurança.
 * - Impede exclusão se houver alunos ativos.
 * - Impede exclusão se houver histórico de aulas realizadas.
 */
exports.deleteClass = functions.region("us-central1").https.onCall(async (data, context) => {
    try {
        const { idTenant, idBranch } = requireAuthContext(data, context);

        // Resolver ID (flat ou wrapped)
        const id = data.id || data.idClass;

        if (!id) {
            throw new functions.https.HttpsError("invalid-argument", "ID da turma é obrigatório");
        }

        // Get references
        const classRef = getBranchCollectionRef(idTenant, idBranch, "classes", id);
        const enrollmentsCol = getBranchCollectionRef(idTenant, idBranch, "enrollments");
        const sessionsCol = getBranchCollectionRef(idTenant, idBranch, "sessions");

        // Get class data for audit log
        const classDoc = await classRef.get();
        if (!classDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Turma não encontrada");
        }
        const classData = classDoc.data();

        // 1. Verificar Matrículas Ativas
        const activeEnr = await enrollmentsCol
            .where("idClass", "==", id)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (!activeEnr.empty) {
            throw new functions.https.HttpsError("failed-precondition", "Não é possível excluir: Existem alunos matriculados ativos nesta turma.");
        }

        // 2. Verificar Histórico de Presença (Sessões com status realizado/fechado)
        const historySessions = await sessionsCol
            .where("idClass", "==", id)
            .where("status", "in", ["completed", "held"])
            .limit(1)
            .get();

        if (!historySessions.empty) {
            throw new functions.https.HttpsError("failed-precondition", "Não é possível excluir: Existem aulas realizadas com histórico para esta turma.");
        }

        // 3. Deletar Turma e Sessões
        await classRef.delete();

        // Deletar TODAS as sessões desta turma
        const sessions = await sessionsCol.where("idClass", "==", id).get();

        if (!sessions.empty) {
            const batch = classRef.firestore.batch();
            sessions.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        // Audit log
        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot("class", { id, ...classData }, id);

        await saveAuditLog({
            idTenant,
            idBranch,
            action: "CLASS_DELETE",
            actor,
            target,
            description: `Removeu a turma: ${classData.title || classData.name || id}`
        });

        return { success: true };

    } catch (error) {
        console.error("Erro ao deletar turma:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", error.message || "Erro ao deletar turma");
    }
});

