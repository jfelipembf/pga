const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { addDays, toISODate, findFirstWeekdayOnOrAfter } = require("./dateUtils");

const db = admin.firestore();

/**
 * Gera sessões para uma turma em um horizonte de tempo.
 *
 * @param {object} params
 * @param {string} params.idTenant
 * @param {string} params.idBranch
 * @param {string} params.idClass
 * @param {object} params.classData
 * @param {number} params.weeks - Quantas semanas gerar
 * @param {string} params.fromDate - A partir de que data (ISO)
 * @returns {object} { created: number }
 */
const generateSessionsForClass = async ({
    idTenant,
    idBranch,
    idClass,
    classData,
    weeks = 2,
    fromDate = null,
}) => {
    if (!idTenant || !idBranch || !idClass || !classData) return { created: 0 };

    const weekday = classData.weekday ?? null;
    if (weekday === null || weekday === undefined) return { created: 0 };

    const startIso = toISODate(fromDate || classData.startDate || new Date());
    if (!startIso) return { created: 0 };

    const endDateStr = classData.endDate ? toISODate(classData.endDate) : null;

    const first = findFirstWeekdayOnOrAfter(startIso, weekday);
    const totalDays = Math.max(1, Number(weeks || 0) * 7);

    const sessionsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("sessions");

    // Calcular ocupação de recorrentes (se houver lógica de enrollments)
    // Aqui assumimos que precisamos calcular.
    const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const enrSnap = await enrollmentsCol
        .where("type", "==", "recurring")
        .where("idClass", "==", idClass)
        .where("status", "==", "active")
        .get();
    const recurring = enrSnap.docs.map((d) => d.data() || {});

    const recurringCountForDate = (iso) => {
        if (!iso) return 0;
        let count = 0;
        for (const e of recurring) {
            const start = e.startDate ? String(e.startDate) : null;
            const end = e.endDate ? String(e.endDate) : null;
            if (start && iso < start) continue;
            if (end && iso > end) continue;
            count += 1;
        }
        return count;
    };

    let ops = 0;
    let createdCount = 0;
    let batch = db.batch();

    const commitIfNeeded = async () => {
        if (ops >= 450) {
            await batch.commit();
            batch = db.batch();
            ops = 0;
        }
    };

    for (let i = 0; i < totalDays; i += 7) {
        const sessionDate = addDays(first, i);
        const iso = toISODate(sessionDate);
        if (!iso) continue;
        if (endDateStr && iso > endDateStr) break;

        const idSession = `${idClass}-${iso}`;
        const ref = sessionsCol.doc(idSession);

        const existingSnap = await ref.get();

        // Se já existe, atualizamos apensa contador se necessário?
        if (existingSnap.exists) {
            const existingData = existingSnap.data();
            const currentCount = recurringCountForDate(iso);

            if (existingData.enrolledCount !== currentCount) {
                batch.update(ref, {
                    enrolledCount: currentCount,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                ops += 1;
                await commitIfNeeded();
            }
            continue;
        }

        // Se não existe, cria
        const payload = {
            idSession,
            idClass,
            idActivity: classData.idActivity || null,
            idStaff: classData.idStaff || null,
            idArea: classData.idArea || null,
            idTenant,
            idBranch,
            sessionDate: iso,
            weekday: Number(weekday),
            startTime: classData.startTime || "",
            endTime: classData.endTime || "",
            durationMinutes: Number(classData.durationMinutes || 0),
            maxCapacity: Number(classData.maxCapacity || classData.capacity || 0),
            enrolledCount: recurringCountForDate(iso),
            status: "scheduled",
            attendanceRecorded: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };


        batch.set(ref, payload);
        ops += 1;
        createdCount += 1;
        await commitIfNeeded();
    }

    if (ops > 0) {
        await batch.commit();
    }

    return { created: createdCount };
};

module.exports = { generateSessionsForClass };
