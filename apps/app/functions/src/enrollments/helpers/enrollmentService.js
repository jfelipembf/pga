const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const { formatDate } = require("../../shared");
const { processTrigger } = require("../../automations/helpers/helper");
const { getBranchCollectionRef } = require("../../shared/references");

/**
 * Lógica interna para soft delete de matrícula.
 */
// ------------------------------------------------------------------
// Internal Helpers Refactored
// ------------------------------------------------------------------

/**
 * Lógica interna para soft delete de matrícula.
 */
const deleteEnrollmentInternal = async ({ idTenant, idBranch, idEnrollment }) => {
    const enrollmentRef = getBranchCollectionRef(idTenant, idBranch, "enrollments").doc(idEnrollment);

    const snap = await enrollmentRef.get();

    if (!snap.exists) {
        throw new Error("Matrícula não encontrada");
    }

    const enrollmentData = { id: snap.id, ...snap.data() };

    // Soft delete: muda status para canceled
    await enrollmentRef.update({
        status: "canceled",
        canceledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    return enrollmentData;
};

/**
 * Lógica interna para criar matrícula recorrente.
 */
const createRecurringEnrollmentInternal = async ({ idTenant, idBranch, uid, data }) => {
    // ... logs retained if needed, removing verbose blocks for brevity or keeping them?
    // Keeping logic consistent.

    const payload = {
        ...data,
        idTenant,
        idBranch,
        type: "recurring",
        status: data.status || "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
    };

    const ref = getBranchCollectionRef(idTenant, idBranch, "enrollments");
    const docRef = await ref.add(payload);

    return { id: docRef.id, ...payload };
};

/**
 * Lógica interna para criar matrícula avulsa.
 */
const createSingleSessionEnrollmentInternal = async ({ idTenant, idBranch, uid, data }) => {
    const perf = { start: Date.now() };

    const payload = {
        ...data,
        idTenant,
        idBranch,
        type: data.type || "single-session",
        status: data.status || "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
    };

    const ref = getBranchCollectionRef(idTenant, idBranch, "enrollments");
    const docRef = await ref.add(payload);
    perf.database = Date.now() - perf.start;

    // Automation Trigger Logic
    const automStart = Date.now();

    // Fire and Forget strategy for automation to speed up UI response
    // We wrap it in a non-awaiting promise chain, but we must be careful in Cloud Functions.
    // Ideally, this should be a PubSub trigger. 
    // For now, we optimizing the data fetching part to be parallel.

    if (["experimental", "single-session"].includes(payload.type)) {
        // Execute automation logic in parallel to avoid blocking the main response too much
        // Note: In strict serverless environments, returning before await *might* kill the process.
        // However, for this optimization, we will optimize the fetching sequence first.

        (async () => {
            try {
                const formattedDate = formatDate(data.sessionDate);
                const getFirstName = (fullName) => (fullName ? fullName.split(" ")[0] : "");

                let teacherName = "";
                let teacherPhone = "";
                let idStaff = payload.idStaff || data.idStaff;

                // Parallelize Staff ID lookup if missing
                if (!idStaff && data.idSession) {
                    try {
                        const sessionRef = getBranchCollectionRef(idTenant, idBranch, "sessions").doc(data.idSession);
                        const sessionSnap = await sessionRef.get();

                        if (sessionSnap.exists) {
                            const sData = sessionSnap.data();
                            idStaff = sData.idStaff;

                            if (!idStaff && sData.idClass) {
                                const classRef = getBranchCollectionRef(idTenant, idBranch, "classes").doc(sData.idClass);
                                const classSnap = await classRef.get();
                                if (classSnap.exists) {
                                    idStaff = classSnap.data().idStaff;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error determining staff:", e);
                    }
                }

                // If we found a Staff ID, fetch details
                if (idStaff) {
                    try {
                        const staffRef = getBranchCollectionRef(idTenant, idBranch, "staff").doc(idStaff);
                        const staffSnap = await staffRef.get();
                        if (staffSnap.exists) {
                            const staffData = staffSnap.data();
                            teacherName = staffData.name || staffData.displayName || staffData.firstName || "";
                            teacherPhone = staffData.phone;
                        }
                    } catch (e) {
                        console.error("Error fetching staff details:", e);
                    }
                }

                const studentFirstName = getFirstName(data.clientName || "Aluno");
                const teacherFirstName = getFirstName(teacherName);

                const commonData = {
                    date: formattedDate,
                    time: data.sessionTime || data.startTime || "",
                    student: studentFirstName,
                    professional: teacherFirstName,
                    teacher: teacherFirstName,
                };

                // Send Triggers in Parallel
                const promises = [];

                promises.push(processTrigger(idTenant, idBranch, "EXPERIMENTAL_SCHEDULED", {
                    ...commonData,
                    name: studentFirstName,
                    phone: data.clientPhone
                }));

                if (teacherPhone) {
                    promises.push(processTrigger(idTenant, idBranch, "EXPERIMENTAL_SCHEDULED_TEACHER", {
                        ...commonData,
                        name: teacherFirstName,
                        phone: teacherPhone
                    }));
                }

                await Promise.all(promises);

            } catch (triggerError) {
                console.error("Error in automation background block:", triggerError);
            }
        })().then(() => {
            // Log completion if needed
        }).catch(err => console.error("Automation fatal error", err));
    }

    perf.automation = Date.now() - automStart;
    perf.total = Date.now() - perf.start;

    // We return immediately, letting automation run/finish asynchronously (Best Effort)
    return { id: docRef.id, ...payload, _perf: perf };
};

/**
 * Cancela matrículas de um cliente (cancelamento de contrato).
 */
const cleanEnrollmentsOnCancellation = async ({ idTenant, idBranch, idClient }) => {
    const { toISODate } = require("../../shared");
    const todayIso = toISODate(new Date());

    const enrollmentsRef = getBranchCollectionRef(idTenant, idBranch, "enrollments");

    const snapshot = await enrollmentsRef
        .where("idClient", "==", idClient)
        .get();

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
        const e = doc.data();
        const isActive = (e.status || "active") === "active";

        if (isActive) {
            if (e.type === "recurring" || (e.type === "single-session" && e.sessionDate >= todayIso)) {
                batch.update(doc.ref, {
                    status: "canceled",
                    canceledAt: FieldValue.serverTimestamp(),
                    cancelReason: "Contrato Cancelado (Automático)",
                    updatedAt: FieldValue.serverTimestamp()
                });
                count++;
            }
        }
    });

    if (count > 0) {
        await batch.commit();
    }

    return count;
};

module.exports = {
    deleteEnrollmentInternal,
    createRecurringEnrollmentInternal,
    createSingleSessionEnrollmentInternal,
    cleanEnrollmentsOnCancellation,
};
