const functions = require("firebase-functions/v1");

/**
 * Valida se os novos dias da semana são permitidos pelos contratos dos alunos matriculados.
 * @param {object} params
 * @param {admin.firestore.Firestore} params.db
 * @param {string} params.idTenant
 * @param {string} params.idBranch
 * @param {string} params.idClass
 * @param {number[]} params.newDays - Array de dias da semana (0-6)
 * @returns {Promise<void>} - Lança erro se inválido
 */
const validateClassDaysAgainstContracts = async ({ db, idTenant, idBranch, idClass, newDays }) => {
    const enrollmentsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("enrollments");
    const clientsContractsCol = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clientsContracts");

    // 1. Buscar matrículas ativas
    const activeEnrollmentsSnap = await enrollmentsCol
        .where("idClass", "==", idClass)
        .where("status", "==", "active")
        .get();

    if (activeEnrollmentsSnap.empty) return;

    const enrollmentPromises = activeEnrollmentsSnap.docs.map(async (doc) => {
        const enrollment = doc.data();
        const clientId = enrollment.idClient;
        const clientName = enrollment.clientName || "Aluno";

        // 2. Buscar contrato ativo do aluno
        const contractsSnap = await clientsContractsCol
            .where("idClient", "==", clientId)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (!contractsSnap.empty) {
            const contract = contractsSnap.docs[0].data();
            const allowedDays = contract.allowedWeekDays;

            // Se o contrato tem restrição de dias
            if (allowedDays && Array.isArray(allowedDays) && allowedDays.length > 0) {
                // Verifica se TODOS os novos dias são permitidos
                const isAllowed = newDays.every(day => allowedDays.includes(Number(day)));

                if (!isAllowed) {
                    const dayMap = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
                    const allowedDayNames = allowedDays.map(d => dayMap[Number(d)] || d).join(", ");
                    return `O aluno(a) ${clientName} possui contrato restrito aos dias: ${allowedDayNames}.`;
                }
            }
        }
        return null;
    });

    const results = await Promise.all(enrollmentPromises);
    const errors = results.filter(error => error !== null);

    if (errors.length > 0) {
        throw new functions.https.HttpsError("failed-precondition", errors.join("\n"));
    }
};

module.exports = { validateClassDaysAgainstContracts };
