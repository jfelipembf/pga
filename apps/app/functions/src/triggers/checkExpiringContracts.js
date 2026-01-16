const { createScheduledTrigger } = require("./utils");
const { processDailyExpirations } = require("../clientContracts/helpers/expiration.service");

/**
 * Cloud Function agendada para verificar contratos que vencem hoje.
 * Roda diariamente às 00:30 (America/Sao_Paulo).
 * [TEST] Temporariamente configurada para 15:47 para teste manual conforme solicitado pelo usuário.
 */
module.exports = createScheduledTrigger("47 15 * * *", "checkExpiringContracts", async () => {
    await processDailyExpirations();
});
