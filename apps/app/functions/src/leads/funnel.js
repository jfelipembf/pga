const functions = require("firebase-functions/v1");
const {
    handleNewLead,
    handleExperimentalScheduled,
    handleConversion,
    handleExperimentalAttendance,
    handleExperimentalDeletion
} = require("./helpers/funnel.service");

/**
 * 1. Monitorar Novos Leads
 * Acionado quando um documento em 'clients' é criado ou atualizado com status 'lead'.
 */
exports.monitorarNovosLeads = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}")
    .onWrite(handleNewLead);

/**
 * 2. Monitorar Agendamento Experimental
 * Acionado quando um novo agendamento experimental é criado em 'enrollments'.
 */
exports.monitorarAgendamentoExperimental = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onCreate(handleExperimentalScheduled);

/**
 * 3. Monitorar Conversão (Venda)
 * Acionado quando um novo contrato é criado em 'clientsContracts'.
 */
exports.monitorarConversao = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clientsContracts/{idContract}")
    .onCreate(handleConversion);

/**
 * 4. Monitorar Presença Experimental
 * Acionado quando a lista de presença ('attendance') de um cliente é atualizada.
 */
exports.monitorarPresencaExperimental = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/clients/{idClient}/attendance/{idSession}")
    .onWrite(handleExperimentalAttendance);

/**
 * 5. Monitorar Remoção de Experimental
 * Acionado quando um agendamento experimental é excluído.
 * Verifica se deve reverter o status de "Agendado" do funil.
 */
exports.monitorarRemocaoExperimental = functions
    .region("us-central1")
    .firestore
    .document("tenants/{idTenant}/branches/{idBranch}/enrollments/{idEnrollment}")
    .onDelete(handleExperimentalDeletion);
