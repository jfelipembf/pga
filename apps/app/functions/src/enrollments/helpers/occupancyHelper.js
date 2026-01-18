const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const { toISODate, addDays } = require("../../helpers/date");

/**
 * Atualiza o contador de matriculados em uma sessão específica.
 */
const bumpSession = async ({ idTenant, idBranch, idSession, delta }) => {
    if (!idTenant || !idBranch || !idSession) return 0;

    const ref = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("sessions")
        .doc(idSession);

    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        tx.update(ref, {
            enrolledCount: FieldValue.increment(delta),
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
    return 1;
};

/**
 * Atualiza o contador de matriculados em sessões futuras de uma turma.
 */
const bumpFutureSessionsByClass = async ({
    idTenant,
    idBranch,
    idClass,
    startIso,
    endIso,
    delta,
}) => {
    if (!idTenant || !idBranch || !idClass || !startIso || !endIso) return 0;

    const sessionsCol = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("sessions");



    const snap = await sessionsCol
        .where("idClass", "==", String(idClass)) // ID da turma é sempre String (gerado pelo Firestore/UUID)
        .where("sessionDate", ">=", startIso)
        .where("sessionDate", "<=", endIso)
        .get();



    if (snap.empty) {
        functions.logger.warn(`[bumpFutureSessionsByClass] No sessions found to update.`);
        return 0;
    }

    const CHUNK_SIZE = 450;
    const chunks = [];

    // Split docs into chunks
    for (let i = 0; i < snap.docs.length; i += CHUNK_SIZE) {
        chunks.push(snap.docs.slice(i, i + CHUNK_SIZE));
    }



    let ops = 0;

    // Process each chunk
    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((d) => {
            batch.set(d.ref, {
                enrolledCount: FieldValue.increment(delta),
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        });

        await batch.commit();
        ops += chunk.length;
    }

    return ops;
};

const normalizeStart = (enrollment, isUpdate = false) => {
    const s = enrollment?.startDate || enrollment?.start || null;
    const today = toISODate(new Date());

    if (isUpdate) return today;

    // Se enrollment tiver data de início, respeita ela (convertendo para ISO)
    // toISODate lida com String, Date e Timestamp.
    if (!s) return today;
    const isoS = toISODate(s);
    return isoS || today;
};

const normalizeEnd = (enrollment) => {
    const e = enrollment?.endDate || enrollment?.end || null;
    const start = normalizeStart(enrollment);
    const maxWindowEnd = toISODate(addDays(start, 730)); // 2 anos

    if (!e) return maxWindowEnd;
    const isoE = toISODate(e);
    if (!isoE) return maxWindowEnd;

    return isoE > maxWindowEnd ? maxWindowEnd : isoE;
};

/**
 * Gerencia a atualização de ocupação baseada no tipo de matrícula.
 */
const handleEnrollmentBump = async ({ enrollment, delta, isUpdate = false }) => {
    const idTenant = enrollment?.idTenant ? String(enrollment.idTenant) : null;
    const idBranch = enrollment?.idBranch ? String(enrollment.idBranch) : null;
    const type = enrollment?.type || null;



    if (!idTenant || !idBranch) return 0;

    if (type === "experimental") {
        const idSession = enrollment?.idSession ? String(enrollment.idSession) : null;
        const sessionDate = enrollment?.sessionDate ? String(enrollment.sessionDate) : null;
        const startIso = toISODate(new Date());

        // Check validity
        if (!idSession || !sessionDate || sessionDate < startIso) return 0;

        return bumpSession({ idTenant, idBranch, idSession, delta });
    }

    if (type === "recurring") {
        const idClass = enrollment?.idClass ? String(enrollment.idClass) : null;
        if (!idClass) return 0;

        const startIso = normalizeStart(enrollment, isUpdate);
        const endIso = normalizeEnd(enrollment);

        return bumpFutureSessionsByClass({
            idTenant,
            idBranch,
            idClass,
            startIso,
            endIso,
            delta,
        });
    }

    return 0;
};

module.exports = {
    bumpSession,
    bumpFutureSessionsByClass,
    normalizeStart,
    normalizeEnd,
    handleEnrollmentBump,
};
