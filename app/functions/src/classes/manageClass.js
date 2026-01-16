const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { requireAuthContext } = require("../shared/context");
const { FieldValue } = require("firebase-admin/firestore");
const { validateClassDaysAgainstContracts } = require("./helpers/validator");
const { computeEndTime, toISODate } = require("./helpers/dateUtils");
const { saveAuditLog } = require("../shared/audit");


const db = admin.firestore();

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
    const { idTenant, idBranch } = requireAuthContext(data, context);

    // Resolver ID e Updates baseados na estrutura (flat vs wrapped)
    const id = data.id || data.idClass;
    let updates = data.classData;

    // Se classData não for fornecido, assumir estrutura plana e remover campos de sistema
    if (!updates) {
        const { id: _id, idClass: _idClass, idTenant: _t, idBranch: _b, ...rest } = data;
        updates = rest;
    }

    if (!id) {
        throw new functions.https.HttpsError("invalid-argument", "ID da turma é obrigatório");
    }

    const classRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("classes").doc(id);
    const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");
    const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");

    try {
        let shouldUpdateSessions = false;
        const sessionUpdates = {};

        // VALIDAÇÃO: Checar restrições de contrato se os dias mudarem
        if (updates.weekDays && Array.isArray(updates.weekDays)) {
            const newDays = updates.weekDays.map(Number);
            await validateClassDaysAgainstContracts({ db, idTenant, idBranch, idClass: id, newDays });
        }

        await db.runTransaction(async (t) => {
            const doc = await t.get(classRef);
            if (!doc.exists) {
                throw new functions.https.HttpsError("not-found", "Turma não encontrada");
            }

            const currentData = doc.data();

            // Verificar mudanças em campos que afetam sessões
            const sessionFields = ["idActivity", "idArea", "idStaff", "maxCapacity", "startTime", "durationMinutes"];

            sessionFields.forEach(field => {
                if (updates[field] !== undefined && updates[field] !== currentData[field]) {
                    shouldUpdateSessions = true;
                    sessionUpdates[field] = updates[field];
                }
            });

            // Recalcular endTime se necessário
            if (sessionUpdates.startTime || sessionUpdates.durationMinutes) {
                const start = sessionUpdates.startTime || currentData.startTime;
                const duration = sessionUpdates.durationMinutes || currentData.durationMinutes;
                const newEndTime = computeEndTime(start, duration);
                updates.endTime = newEndTime;
                sessionUpdates.endTime = newEndTime; // Atualizar endTime da sessão também
            }

            // Atualizar Turma
            t.update(classRef, {
                ...updates,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        // PÓS-TRANSAÇÃO: Atualizações de Sessão
        if (shouldUpdateSessions) {
            const nowIso = toISODate(new Date());


            // Buscar sessões futuras para atualizar
            const sessionsSnap = await sessionsCol
                .where("idClass", "==", id)
                .where("sessionDate", ">=", nowIso)
                .get();

            if (!sessionsSnap.empty) {
                const batch = db.batch();
                let params = { ...sessionUpdates };

                // Remover chaves undefined
                Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

                params.updatedAt = FieldValue.serverTimestamp();

                sessionsSnap.docs.forEach(doc => {
                    batch.update(doc.ref, params);
                });

                await batch.commit();
            }
        }

        // PÓS-TRANSAÇÃO: Limpeza de End Date (Lógica Existente)
        if (updates.endDate) {
            const limitIso = updates.endDate; // Formato: YYYY-MM-DD

            // Validar formato de data (verificação simples regex para YYYY-MM-DD)
            if (!limitIso || !/^\d{4}-\d{2}-\d{2}$/.test(limitIso)) {
                console.warn(`Formato de endDate inválido: ${limitIso}. Pulando processamento de data final.`);
            } else {

                // 1. Deletar sessões após endDate
                const sessionsToDeleteSnap = await sessionsCol
                    .where("idClass", "==", id)
                    .where("sessionDate", ">", limitIso)
                    .get();

                if (!sessionsToDeleteSnap.empty) {
                    const batch = db.batch();
                    sessionsToDeleteSnap.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }

                // 2. Encerrar Matrículas Ativas
                const enrollmentsSnap = await enrollmentsCol
                    .where("idClass", "==", id)
                    .where("status", "==", "active")
                    .get();

                if (!enrollmentsSnap.empty) {
                    const batch = db.batch();
                    let updatedCount = 0;

                    enrollmentsSnap.docs.forEach(d => {
                        const enr = d.data();
                        const enrEnd = enr.endDate;
                        if (!enrEnd || enrEnd > limitIso) {
                            batch.update(d.ref, {
                                endDate: limitIso,
                                updatedAt: FieldValue.serverTimestamp()
                            });
                            updatedCount++;
                        }
                    });

                    if (updatedCount > 0) {
                        await batch.commit();
                    }
                }
            }
        }
        // Auditoria
        await saveAuditLog({
            idTenant, idBranch,
            uid: context.auth.uid,
            action: "CLASS_UPDATE",
            targetId: id,
            description: `Atualizou dados da turma: ${id}`,
            metadata: { updates: Object.keys(updates) }
        });

        return { success: true };

    } catch (error) {
        console.error("Erro ao atualizar turma:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});


/**
 * Deleta uma turma com segurança.
 * - Impede exclusão se houver alunos ativos.
 * - Impede exclusão se houver histórico de aulas realizadas.
 */
exports.deleteClass = functions.region("us-central1").https.onCall(async (data, context) => {
    const { idTenant, idBranch } = requireAuthContext(data, context);

    // Resolver ID (flat ou wrapped)
    const id = data.id || data.idClass;

    if (!id) {
        throw new functions.https.HttpsError("invalid-argument", "ID da turma é obrigatório");
    }

    const classRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("classes").doc(id);
    const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");

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
        .where("status", "in", ["completed", "held"]) // Ajuste conforme seus status de "Realizada"
        .limit(1)
        .get();

    if (!historySessions.empty) {
        throw new functions.https.HttpsError("failed-precondition", "Não é possível excluir: Existem aulas realizadas com histórico para esta turma.");
    }

    // 3. Deletar Turma e Sessões Futuras/Vazias
    try {
        // Deletar Turma
        await classRef.delete();

        // Deletar TODAS as sessões desta turma (já que não há histórico impeditivo)
        const sessions = await sessionsCol.where("idClass", "==", id).get();

        const batch = db.batch();
        let count = 0;
        sessions.docs.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        if (count > 0) await batch.commit();

        // Auditoria
        await saveAuditLog({
            idTenant, idBranch,
            uid: context.auth.uid,
            action: "CLASS_DELETE",
            targetId: id,
            description: `Removeu a turma: ${id}`
        });

        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar turma:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
