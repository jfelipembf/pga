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

    // Automation Trigger Logic
    if (["experimental", "single-session"].includes(payload.type)) { // Standardized check
        try {
            const formattedDate = formatDate(data.sessionDate);

            const getFirstName = (fullName) => {
                if (!fullName) return "";
                return fullName.split(" ")[0];
            };

            let teacherName = data.professionalName || "";
            let teacherPhone = "";

            // Pre-fetch Teacher Info
            const idInstructor = payload.instructorId || payload.idStaff;
            if (idInstructor) {
                try {
                    const staffRef = getBranchCollectionRef(idTenant, idBranch, "staff").doc(idInstructor);
                    const staffSnap = await staffRef.get();
                    if (staffSnap.exists) {
                        const staffData = staffSnap.data();
                        teacherName = staffData.name || staffData.firstName || teacherName;
                        teacherPhone = staffData.phone;
                    }
                } catch (e) {
                    console.error("Error fetching staff data:", e);
                }
            }

            const studentFirstName = getFirstName(data.clientName || "Aluno");
            const teacherFirstName = getFirstName(teacherName);

            const triggerData = {
                name: studentFirstName,
                student: studentFirstName,
                teacher: teacherFirstName,
                professional: teacherFirstName,
                date: formattedDate,
                time: data.sessionTime || data.startTime || "",
                phone: data.clientPhone
            };

            await processTrigger(idTenant, idBranch, "EXPERIMENTAL_SCHEDULED", triggerData);

            if (teacherPhone) {
                const teacherTriggerData = {
                    ...triggerData,
                    phone: teacherPhone,
                    name: teacherFirstName
                };
                await processTrigger(idTenant, idBranch, "EXPERIMENTAL_SCHEDULED_TEACHER", teacherTriggerData);
            }

        } catch (triggerError) {
            console.error("Error triggering automation:", triggerError);
        }
    }

    return { id: docRef.id, ...payload };
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
