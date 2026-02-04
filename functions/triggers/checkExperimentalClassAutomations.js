const { createScheduledTrigger } = require("./utils");
const { processDailyExperimentalClasses } = require("../automations/helpers/experimental.service");

/**
 * Trigger agendado para verificar aulas experimentais e enviar lembretes.
 * Executa todos os dias às 09:00 de segunda a sexta.
 */
module.exports = createScheduledTrigger("25 2 * * *", "checkExperimentalClassAutomations", async () => {
    await processDailyExperimentalClasses();
});
