const functions = require("firebase-functions/v1");

/**
 * Cria uma Cloud Function agendada com configurações padronizadas.
 * 
 * @param {string} cron - Expressão cron do agendamento.
 * @param {string} taskName - Nome da tarefa para logging e identificação.
 * @param {Function} handler - Função assíncrona que contém a lógica do trigger.
 * @returns {functions.CloudFunction<any>}
 */
exports.createScheduledTrigger = (cron, taskName, handler) => {
    return functions
        .region("us-central1")
        .pubsub.schedule(cron)
        .timeZone("America/Sao_Paulo")
        .onRun(async (context) => {
            try {
                await handler(context);
            } catch (error) {
                console.error(`[${taskName}] Erro durante a execução:`, error);
                throw error; // Re-throw para garantir que o erro apareça no console/logs
            }
            return null;
        });
};

/**
 * Retorna a data no formato YYYY-MM-DD
 */
exports.toISODate = (date) => {
    return date.toISOString().split('T')[0];
};

/**
 * Adiciona dias a uma data
 */
exports.addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
