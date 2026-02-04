const { createScheduledTrigger } = require("./utils");
const { processDailyBirthdays } = require("../automations/helpers/birthday.service");

/**
 * Função agendada para verificar automações de aniversário.
 * Executa todos os dias às 09:00 (Horário de São Paulo).
 */
module.exports = createScheduledTrigger("10 2 * * *", "checkBirthdayAutomations", async () => {
    await processDailyBirthdays();
});
