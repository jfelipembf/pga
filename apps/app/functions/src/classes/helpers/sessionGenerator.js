const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { addDays, toISODate, findFirstWeekdayOnOrAfter } = require("../../helpers/date");
const { getBranchCollectionRef } = require("../../shared/references");

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

    // Handle both weekday (singular) and weekDays (array) formats
    let weekday = classData.weekday;
    if (weekday === null || weekday === undefined) {
        // Try to get from weekDays array
        if (Array.isArray(classData.weekDays) && classData.weekDays.length > 0) {
            weekday = Number(classData.weekDays[0]);
        }
    }

    if (weekday === null || weekday === undefined) return { created: 0 };

    // Busca a última sessão existente para copiar o enrolledCount e OTIMIZAR a geração
    const sessionsCol = getBranchCollectionRef(idTenant, idBranch, "sessions");
    let lastEnrolledCount = 0;
    let lastSessionDate = null;

    const lastSessionSnap = await sessionsCol
        .where("idClass", "==", String(idClass))
        .orderBy("sessionDate", "desc")
        .limit(1)
        .get();

    if (!lastSessionSnap.empty) {
        const lastSession = lastSessionSnap.docs[0].data();
        lastEnrolledCount = Number(lastSession.enrolledCount || 0);
        lastSessionDate = lastSession.sessionDate;
    }

    const startIso = toISODate(fromDate || classData.startDate || new Date());
    if (!startIso) return { created: 0 };

    const endDateStr = classData.endDate ? toISODate(classData.endDate) : null;
    const totalDays = Math.max(1, Number(weeks || 0) * 7);

    // Otimização: Se já temos sessões futuras suficientes, começamos DEPOIS da última.
    // Isso evita ler centenas de documentos desnecessariamente com 'exists()'

    // Data alvo até onde queremos garantir sessões
    const targetHorizonDate = addDays(startIso, totalDays);

    let effectiveStart = startIso;

    if (lastSessionDate) {
        // Se a última sessão já cobre ou passa do horizonte desejado, não fazemos nada.
        if (lastSessionDate >= toISODate(targetHorizonDate)) {
            return { created: 0 };
        }

        // Se a última sessão está no futuro em relação ao startIso, começamos dela + 1 dia
        if (lastSessionDate >= startIso) {
            const dayAfterLast = addDays(lastSessionDate, 1);
            effectiveStart = toISODate(dayAfterLast);
        }
    }

    // Calcula o primeiro dia de aula a partir do NOVO início efetivo
    const first = findFirstWeekdayOnOrAfter(effectiveStart, weekday);

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

        // Se a sessão já existe, não fazemos nada
        if (existingSnap.exists) {
            continue;
        }

        // Cria nova sessão herdando o enrolledCount da última sessão
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
            enrolledCount: lastEnrolledCount, // Herda da última sessão
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
