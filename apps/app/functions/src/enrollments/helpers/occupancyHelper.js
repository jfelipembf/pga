const admin = require("firebase-admin");
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
        .where("idClass", "==", idClass)
        .where("sessionDate", ">=", startIso)
        .where("sessionDate", "<=", endIso)
        .get();

    if (snap.empty) return 0;

    const batch = db.batch();
    let ops = 0;

    snap.docs.forEach((d) => {
        batch.set(d.ref, {
            enrolledCount: FieldValue.increment(delta),
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        ops += 1;
    });

    if (ops > 0) {
        await batch.commit();
    }

    return ops;
};

const normalizeStart = (enrollment, isUpdate = false) => {
    const s = enrollment?.startDate || enrollment?.start || null;
    const today = toISODate(new Date());

    // Se for uma atualização (cancelamento), usamos 'today' como início
    // para não afetar sessões passadas.
    if (isUpdate) return today;

    if (!s) return today;
    return String(s) < today ? today : String(s);
};

const normalizeEnd = (enrollment) => {
    const e = enrollment?.endDate || enrollment?.end || null;
    const start = normalizeStart(enrollment);
    const maxWindowEnd = addDays(start, 27); // 4 semanas (28 dias contando o start)
    if (!e) return maxWindowEnd;
    return String(e) > maxWindowEnd ? maxWindowEnd : String(e);
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
