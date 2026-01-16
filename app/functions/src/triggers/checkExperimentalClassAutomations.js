const { createScheduledTrigger } = require("./utils");
const { processDailyExperimentalClasses } = require("../automations/helpers/experimental.service");

/**
 * Trigger agendado para verificar aulas experimentais e enviar lembretes.
 * Executa todos os dias às 09:00 de segunda a sexta.
 */
module.exports = createScheduledTrigger("0 9 * * 1-5", "checkExperimentalClassAutomations", async () => {
    await processDailyExperimentalClasses();
});
