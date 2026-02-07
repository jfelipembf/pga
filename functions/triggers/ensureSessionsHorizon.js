const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");

// Inicialização segura do admin
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Utilitário para adicionar dias a uma data (Standard JS)
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Formata data como YYYY-MM-DD
 */
function toISODate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Garante que existam sessões criadas para os próximos 6 meses.
 * Roda diariamente às 00:10 para manter o horizonte sempre preenchido.
 * 
 * Regra: Cria novas sessões com base na última sessão existente para manter a continuidade.
 */
module.exports = onSchedule({
    schedule: "10 0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 540, // 9 minutos (limite máximo permitindo processar mais dados)
}, async (event) => {
    const db = admin.firestore();
    const today = new Date();
    const horizonDate = addDays(today, 180); // 6 meses de horizonte
    const horizonIso = toISODate(horizonDate);

    logger.info("[ensureSessionsHorizon] Iniciando verificação de horizonte de sessões...");

    try {
        const tenantsSnap = await db.collection("tenants").get();

        for (const tenantDoc of tenantsSnap.docs) {
            const idTenant = tenantDoc.id;
            const branchesSnap = await db.collection("tenants").doc(idTenant).collection("branches").get();

            for (const branchDoc of branchesSnap.docs) {
                const idBranch = branchDoc.id;

                // Buscar turmas ativas
                const classesSnap = await db.collection("tenants")
                    .doc(idTenant)
                    .collection("branches")
                    .doc(idBranch)
                    .collection("classes")
                    .where("status", "==", "active")
                    .get();

                if (classesSnap.empty) continue;

                logger.info(`[ensureSessionsHorizon] Processando ${classesSnap.size} turmas para o branch ${idBranch}`);

                for (const classDoc of classesSnap.docs) {
                    const idClass = classDoc.id;
                    const classData = classDoc.data();

                    // Buscar a última sessão (não deletada) desta turma
                    const sessionsRef = db.collection("tenants")
                        .doc(idTenant)
                        .collection("branches")
                        .doc(idBranch)
                        .collection("sessions");

                    const lastSessionSnap = await sessionsRef
                        .where("idClass", "==", idClass)
                        .orderBy("sessionDate", "desc")
                        .limit(1)
                        .get();

                    let nextSessionDate;
                    if (lastSessionSnap.empty) {
                        // Se não houver sessões, começa do dia da semana correto a partir de hoje
                        let startSearch = new Date();
                        // Ajustar para o dia da semana da turma
                        while (startSearch.getDay() !== classData.weekday) {
                            startSearch = addDays(startSearch, 1);
                        }
                        nextSessionDate = startSearch;
                    } else {
                        const lastDateStr = lastSessionSnap.docs[0].data().sessionDate;
                        // Soma 7 dias à última sessão encontrada
                        nextSessionDate = addDays(new Date(lastDateStr + "T12:00:00"), 7);
                    }

                    // Gerar sessões até atingir o horizonte
                    const batch = db.batch();
                    let sessionsCreated = 0;
                    let current = nextSessionDate;

                    // Limitar a 52 sessões (1 ano) por rodada para uma mesma turma para evitar loops infinitos
                    let safetyCounter = 0;

                    while (toISODate(current) <= horizonIso && safetyCounter < 52) {
                        const dateStr = toISODate(current);
                        const sessionId = `${idClass}-${dateStr}`;

                        const sessionData = {
                            id: sessionId,
                            idSession: sessionId,
                            idClass: idClass,
                            idActivity: classData.idActivity,
                            idArea: classData.idArea,
                            idStaff: classData.idStaff,
                            sessionDate: dateStr,
                            startTime: classData.startTime,
                            endTime: classData.endTime,
                            durationMinutes: classData.durationMinutes,
                            weekday: classData.weekday,
                            maxCapacity: classData.maxCapacity,
                            enrolledCount: 0,
                            trialCount: 0,
                            presentCount: 0,
                            absentCount: 0,
                            attendanceRecorded: false,
                            status: 'scheduled',
                            isActive: true,
                            autoGenerated: true,
                            createdAt: FieldValue.serverTimestamp(),
                            updatedAt: FieldValue.serverTimestamp()
                        };

                        batch.set(sessionsRef.doc(sessionId), sessionData);

                        current = addDays(current, 7);
                        sessionsCreated++;
                        safetyCounter++;

                        // Commit parcial se o batch ficar muito grande (Firestore limit: 500)
                        if (sessionsCreated % 450 === 0) {
                            // Nota: Se fosse usar batch aqui, precisaria criar um novo. 
                            // Para simplificar, assumimos que por turma não passará de 500 num dia.
                        }
                    }

                    if (sessionsCreated > 0) {
                        await batch.commit();
                        logger.info(`[ensureSessionsHorizon] Turma ${idClass}: ${sessionsCreated} novas sessões criadas.`);
                    }
                }
            }
        }

        logger.info("[ensureSessionsHorizon] Processamento concluído.");

    } catch (error) {
        logger.error("[ensureSessionsHorizon] Erro fatal durante processamento:", error);
    }
});
