const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();
const { processTrigger } = require("../automations/helpers/helper");
const { getClientData, formatEvaluationResults } = require("./helpers/evaluationHelper");

// ============================================================================
// TRIGGERS (Gatilhos do Firestore)
// ============================================================================

/**
 * Gatilho executado ao GRAVAR (criar ou atualizar) uma avaliação.
 * Caminho: tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/evaluations/{idEvaluation}
 *
 * Função:
 * 1. Verifica se houve alteração válida.
 * 2. Prepara os dados do aluno e formata o resultado da avaliação.
 * 3. Dispara a automação 'EVALUATION_RESULT' (se aplicável).
 *
 * OBS: Atualmente o disparo da automação está COMENTADO neste trigger pois
 * estamos garantindo o disparo diretamente na função `saveEvaluation` para maior confiabilidade.
 */
exports.onEvaluationWrite = functions
    .region("us-central1")
    .firestore.document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/evaluations/{idEvaluation}")
    .onWrite(async (change, context) => {
        const { idTenant, idBranch, idClient } = context.params;
        const evaluation = change.after.exists ? change.after.data() : null;

        // Se deletado, ignorar
        if (!evaluation) return;

        try {
            // Nota: Lógica abaixo centralizada nos helpers, pronta para uso se reativar este trigger.
            // Para reativar, descomente o bloco abaixo.

            /*
            const { firstName, phone } = await getClientData(idTenant, idBranch, idClient);
            const resultsText = formatEvaluationResults(evaluation.levelsByTopicId);

            if (resultsText) {
                const triggerData = {
                    name: firstName,
                    student: firstName,
                    phone: phone,
                    date: new Date().toLocaleDateString("pt-BR"),
                    results: resultsText
                };

                // await processTrigger(idTenant, idBranch, "EVALUATION_RESULT", triggerData);
            }
            */

        } catch (error) {
            console.error("[onEvaluationWrite] Error:", error);
        }
    });


// ============================================================================
// CALLABLES (Funções chamadas pelo Frontend)
// ============================================================================

/**
 * Função Callable para SALVAR Avaliação (Criar ou Atualizar).
 * Nome: saveEvaluation
 *
 * Função:
 * 1. Recebe os dados da avaliação do frontend.
 * 2. Salva no Firestore (create ou update).
 * 3. Busca dados do aluno.
 * 4. Formata o resultado da avaliação.
 * 5. Executa explicitamente o disparador de automação 'EVALUATION_RESULT'.
 *
 * Motivo do trigger explícito: Garantir que a automação rode mesmo em emulação local
 * ou quando os triggers de background do Firestore tiverem delay.
 */
exports.saveEvaluation = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Usuário deve estar logado");
        }

        const { idTenant, idBranch, idClient, idEvaluation, action, payload } = data;

        if (!idTenant || !idBranch || !idClient || !payload) {
            throw new functions.https.HttpsError("invalid-argument", "Campos obrigatórios faltando");
        }

        const evaluationsRef = db
            .collection("tenants")
            .doc(idTenant)
            .collection("branches")
            .doc(idBranch)
            .collection("clients")
            .doc(idClient)
            .collection("evaluations");

        let docRef;
        let finalData = { ...payload };

        try {
            const { FieldValue } = require("firebase-admin/firestore");

            if (action === "update" && idEvaluation) {
                // Atualizar existente
                docRef = evaluationsRef.doc(idEvaluation);
                finalData.updatedAt = FieldValue.serverTimestamp();
                finalData.updatedByUserId = context.auth.uid;
                await docRef.update(finalData);
            } else {
                // Criar nova
                finalData.createdAt = FieldValue.serverTimestamp();
                finalData.createdBy = context.auth.uid;
                finalData.eventTypeName = finalData.eventTypeName || "avaliação";

                docRef = await evaluationsRef.add(finalData);
            }

            // --- DISPARO DE AUTOMAÇÃO: EVALUATION_RESULT ---

            // 1. Validar se há resultados para formatar
            const levelsByTopicId = finalData.levelsByTopicId || {};

            // 2. Formatar Texto
            const resultsText = formatEvaluationResults(levelsByTopicId);

            if (resultsText) {
                // 3. Buscar Nome e Telefone do Aluno
                const { firstName, phone } = await getClientData(idTenant, idBranch, idClient);

                const triggerData = {
                    name: firstName,
                    student: firstName,
                    phone: phone,
                    date: new Date().toLocaleDateString("pt-BR"),
                    results: resultsText
                };

                // 4. Disparar Automação
                await processTrigger(idTenant, idBranch, "EVALUATION_RESULT", triggerData);
            }

            return { id: docRef.id, ...finalData };

        } catch (error) {
            console.error("Error saving evaluation:", error);
            throw new functions.https.HttpsError("internal", "Error saving evaluation");
        }
    });

