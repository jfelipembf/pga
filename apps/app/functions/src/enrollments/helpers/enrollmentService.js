const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const { formatDate } = require("../../helpers/date");
const { processTrigger } = require("../../automations/helpers/helper");

/**
 * Lógica interna para soft delete de matrícula.
 */
const deleteEnrollmentInternal = async ({ idTenant, idBranch, idEnrollment }) => {
    const enrollmentRef = db
        .collection("tenants")
        .doc(idTenant)
        .collection("branches")
        .doc(idBranch)
        .collection("enrollments")
        .doc(idEnrollment);

    const snap = await enrollmentRef.get();

    if (!snap.exists) {
        throw new Error("Matrícula não encontrada");
    }

    const enrollmentData = { id: snap.id, ...snap.data() };

    // Soft delete: muda status para canceled em vez de apagar
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

    const ref = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const docRef = await ref.add(payload);
    return { id: docRef.id, ...payload };
};

/**
 * Lógica interna para criar matrícula avulsa (single-session) e disparar automações.
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

    const ref = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const docRef = await ref.add(payload);

    // --- AUTOMATION TRIGGER: EXPERIMENTAL_SCHEDULED ---
    if (payload.type === "experimental" || payload.type === "aula_experimental" || payload.subtype === "experimental") {
        try {
            const formattedDate = formatDate(data.sessionDate);

            const getFirstName = (fullName) => {
                if (!fullName) return "";
                return fullName.split(" ")[0];
            };

            let teacherName = data.professionalName || "";
            let teacherPhone = "";

            // Pre-fetch Teacher Info if available
            const idInstructor = payload.instructorId || payload.idStaff;
            if (idInstructor) {
                try {
                    const staffRef = db
                        .collection("tenants")
                        .doc(idTenant)
                        .collection("branches")
                        .doc(idBranch)
                        .collection("staff")
                        .doc(idInstructor);

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
                name: studentFirstName, // Default name variable is often student name in student templates
                student: studentFirstName,
                teacher: teacherFirstName,
                professional: teacherFirstName, // Legacy variable support
                date: formattedDate,
                time: data.sessionTime || data.startTime || "",
                phone: data.clientPhone
            };

            // 1. Notify Student
            await processTrigger(idTenant, idBranch, "EXPERIMENTAL_SCHEDULED", triggerData);

            // 2. Notify Teacher (if valid phone found)
            if (teacherPhone) {
                const teacherTriggerData = {
                    ...triggerData,
                    phone: teacherPhone,
                    name: teacherFirstName // In teacher context, {name} usually addresses the recipient (teacher)
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
 * Cancela matrículas de um cliente (usado ao cancelar contrato).
 * Remove matrículas recorrentes e sessões futuras.
 */
const cleanEnrollmentsOnCancellation = async ({ idTenant, idBranch, idClient }) => {
    // Usar a data atual simples (YYYY-MM-DD) para comparações
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;

    const enrollmentsRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");

    const snapshot = await enrollmentsRef
        .where("idClient", "==", idClient)
        // Idealmente filtraríamos por status 'active', mas sem índice composto pode falhar.
        // Vamos buscar todos e filtrar em memória, como no código original.
        .get();

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc) => {
        const e = doc.data();
        const isActive = (e.status || "active") === "active";

        // Limpar apenas matrículas ativas.
        // O código original verificava tipo recorrente ou sessões futuras.

        if (isActive) {
            if (e.type === "recurring" || (e.type === "single-session" && e.sessionDate >= todayIso)) {
                // Soft delete / Cancelar
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
