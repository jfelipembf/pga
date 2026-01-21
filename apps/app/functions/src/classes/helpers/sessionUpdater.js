const { FieldValue } = require("firebase-admin/firestore");
const { getBranchCollectionRef } = require("../../shared/references");
const { toISODate } = require("../../shared");

/**
 * Remove sessões futuras que excedem a nova Data Fim da turma.
 * @param {object} params
 */
const cleanupFutureSessions = async ({ idTenant, idBranch, idClass, endDate }) => {
    if (!endDate) return;

    const limitIso = toISODate(endDate);
    if (!limitIso) return;

    const sessionsCol = getBranchCollectionRef(idTenant, idBranch, "sessions");

    const sessionsToDeleteSnap = await sessionsCol
        .where("idClass", "==", idClass)
        .where("sessionDate", ">", limitIso)
        .get();

    if (!sessionsToDeleteSnap.empty) {
        const batch = sessionsCol.firestore.batch();
        sessionsToDeleteSnap.docs.forEach(d => {
            batch.delete(d.ref);
        });
        await batch.commit();
    }
};

/**
 * Sincroniza atualizações de horário/capacidade nas sessões futuras.
 * @param {object} params
 */
const syncSessionUpdates = async ({ idTenant, idBranch, idClass, updates, sessionUpdates }) => {
    if (Object.keys(sessionUpdates).length === 0) return;

    const sessionsCol = getBranchCollectionRef(idTenant, idBranch, "sessions");
    const nowIso = toISODate(new Date());

    const sessionsSnap = await sessionsCol
        .where("idClass", "==", idClass)
        .where("sessionDate", ">=", nowIso)
        .get();

    if (sessionsSnap.empty) return;

    const batch = sessionsCol.firestore.batch();
    const params = { ...sessionUpdates };

    // Limpar campos undefined
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    params.updatedAt = FieldValue.serverTimestamp();

    sessionsSnap.docs.forEach(doc => {
        // Se houver endDate e a sessão for posterior, ignora (já deve ter sido deletada pelo cleanup)
        if (updates.endDate && doc.data().sessionDate > toISODate(updates.endDate)) return;

        batch.update(doc.ref, params);
    });

    await batch.commit();
};

module.exports = { cleanupFutureSessions, syncSessionUpdates };
