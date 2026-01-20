const functions = require("firebase-functions/v1");
const { getBranchCollectionRef } = require("../../shared/references");

/**
 * Valida se os novos dias da semana são permitidos pelos contratos dos alunos matriculados.
 * @param {object} params
 * @param {string} params.idTenant
 * @param {string} params.idBranch
 * @param {string} params.idClass
 * @param {number[]} params.newDays - Array de dias da semana (0-6)
 * @returns {Promise<void>} - Lança erro se inválido
 */
const validateClassDaysAgainstContracts = async ({ idTenant, idBranch, idClass, newDays }) => {
    const enrollmentsCol = getBranchCollectionRef(idTenant, idBranch, "enrollments");
    const clientsContractsCol = getBranchCollectionRef(idTenant, idBranch, "clientsContracts");

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

const { toISODate } = require("../../helpers/date");

/**
 * Valida se definir um endDate causaria conflitos com matrículas recorrentes ativas.
 * @param {object} params
 * @param {string} params.idTenant
 * @param {string} params.idBranch
 * @param {string} params.idClass
 * @param {string} params.endDate - YYYY-MM-DD
 * @returns {Promise<void>} - Lança erro se inválido
 */
const validateEndDateConflicts = async ({ idTenant, idBranch, idClass, endDate }) => {
    const limitIso = toISODate(endDate);
    if (!limitIso) return; // Se data inválida, ignorar validação (outros checks pegam dps)

    const enrollmentsCol = getBranchCollectionRef(idTenant, idBranch, "enrollments");

    const enrollmentsSnap = await enrollmentsCol
        .where("idClass", "==", idClass)
        .where("status", "==", "active")
        .get();

    if (enrollmentsSnap.empty) return;

    const conflictingEnrollments = [];

    enrollmentsSnap.docs.forEach(d => {
        const enr = d.data();
        if (enr.type === "recurring") {
            const enrEnd = enr.endDate;
            // Se o aluno não tem data fim OU tem data fim posterior à nova data da turma
            if (!enrEnd || enrEnd > limitIso) {
                conflictingEnrollments.push(enr);
            }
        }
    });

    if (conflictingEnrollments.length > 0) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            `Não é possível salvar. Esta data final deixaria ${conflictingEnrollments.length} alunos sem aula. Remova ou transfira os alunos antes de encerrar a turma.`
        );
    }
};

module.exports = { validateClassDaysAgainstContracts, validateEndDateConflicts };
