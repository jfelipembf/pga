const admin = require("firebase-admin");


if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Entrypoint central das Cloud Functions.
 * Cada função fica em um submódulo dentro de /src.
 */
exports.processScheduledSuspensions =
  require("./src/triggers/processScheduledSuspensions");
exports.processScheduledCancellations =
  require("./src/triggers/processScheduledCancellations");
exports.processSuspensionEnds =
  require("./src/triggers/processSuspensionEnds");
exports.processExpiredContracts =
  require("./src/triggers/processExpiredContracts");

exports.generateSessionsOnClassCreate =
  require("./src/classes/generateSessionsOnClassCreate");

exports.incrementSessionOccupancy =
  require("./src/classes/sessionOccupancy").incrementSessionOccupancy;
exports.decrementSessionOccupancy =
  require("./src/classes/sessionOccupancy").decrementSessionOccupancy;


exports.enrollmentOccupancyOnCreate =
  require("./src/enrollments/occupancyTriggers");
exports.enrollmentOccupancyOnDelete =
  require("./src/enrollments/occupancyTriggers").onDelete;
exports.enrollmentOccupancyOnUpdate =
  require("./src/enrollments/occupancyTriggers").onUpdate;

exports.autoAttendanceProcess =
  require("./src/enrollments/autoAttendanceTrigger");

exports.attendanceMonthlyOnAttendanceWrite =
  require("./src/attendance/attendanceMonthlyTriggers").onAttendanceWrite;


exports.enrollmentClientCountersOnCreate =
  require("./src/enrollments/clientEnrollmentCounters").onCreate;

exports.enrollmentClientCountersOnDelete =
  require("./src/enrollments/clientEnrollmentCounters").onDelete;
exports.enrollmentClientCountersOnUpdate =
  require("./src/enrollments/clientEnrollmentCounters").onUpdate;

exports.funnelMonitorarNovosLeads = require("./src/leads/funnel").monitorarNovosLeads;
exports.funnelMonitorarAgendamentoExperimental = require("./src/leads/funnel").monitorarAgendamentoExperimental;
exports.funnelMonitorarConversao = require("./src/leads/funnel").monitorarConversao;
exports.funnelMonitorarPresencaExperimental = require("./src/leads/funnel").monitorarPresencaExperimental;
exports.funnelMonitorarRemocaoExperimental = require("./src/leads/funnel").monitorarRemocaoExperimental;

// Financeiro
exports.autoCloseCashier = require("./src/triggers/autoCloseCashier");
exports.processContractDefaultCancellation = require("./src/triggers/processContractDefaultCancellation");

exports.onFinancialTransactionWrite = require("./src/financial/financialTriggers").onFinancialTransactionWrite;
exports.onSaleWrite = require("./src/financial/financialTriggers").onSaleWrite;
exports.onClientContractWrite = require("./src/clientContracts/clientContractTriggers").onClientContractWrite;
exports.openCashier = require("./src/financial/cashier").openCashier;
exports.closeCashier = require("./src/financial/cashier").closeCashier;
exports.addExpense = require("./src/financial/transactions").addExpense;
exports.addSaleRevenue = require("./src/financial/transactions").addSaleRevenue;
exports.updateFinancialTransaction = require("./src/financial/transactions").updateFinancialTransaction;
exports.deleteFinancialTransaction = require("./src/financial/transactions").deleteFinancialTransaction;
exports.addReceivable = require("./src/financial/receivables").addReceivable;
exports.updateReceivable = require("./src/financial/receivables").updateReceivable;
exports.deleteReceivable = require("./src/financial/receivables").deleteReceivable;
exports.payReceivables = require("./src/financial/receivables").payReceivables;
exports.addClientCredit = require("./src/financial/credits").addClientCredit;
exports.consumeClientCredit = require("./src/financial/credits").consumeClientCredit;
exports.deleteClientCredit = require("./src/financial/credits").deleteClientCredit;

// Vendas
exports.createSale = require("./src/sales/sales").saveSale;

// Contratos do Cliente
exports.createClientContract = require("./src/clientContracts/clientContracts").createClientContract;
exports.scheduleContractSuspension = require("./src/clientContracts/clientContracts").scheduleContractSuspension;
exports.stopClientContractSuspension = require("./src/clientContracts/clientContracts").stopClientContractSuspension;
exports.cancelClientContract = require("./src/clientContracts/clientContracts").cancelClientContract;

// Attendance
exports.markAttendance = require("./src/attendance/attendance").markAttendance;
exports.saveSessionSnapshot = require("./src/attendance/attendance").saveSessionSnapshot;
exports.addExtraParticipantToSession = require("./src/attendance/attendance").addExtraParticipantToSession;

// Classes
exports.generateClassSessions = require("./src/classes/classes").generateClassSessions;
exports.createClass = require("./src/classes/classes").createClass;
exports.updateClass = require("./src/classes/manageClass").updateClass;
exports.deleteClass = require("./src/classes/manageClass").deleteClass;
exports.ensureSessionsHorizon = require("./src/triggers/ensureSessionsHorizon");

// Events
exports.createEvent = require("./src/events/events").createEvent;
exports.updateEvent = require("./src/events/events").updateEvent;
exports.deleteEvent = require("./src/events/events").deleteEvent;

// Clients
exports.getNextClientGymId = require("./src/clients/clients").getNextClientGymId;
exports.createClient = require("./src/clients/clients").createClient;
exports.updateClient = require("./src/clients/clients").updateClient;

// Enrollments
// Enrollments
exports.deleteEnrollment = require("./src/enrollments/enrollments").deleteEnrollment;
exports.createRecurringEnrollment = require("./src/enrollments/enrollments").createRecurringEnrollment;
exports.createSingleSessionEnrollment = require("./src/enrollments/enrollments").createSingleSessionEnrollment;

// Evaluations
exports.onEvaluationWrite = require("./src/evaluations/evaluations").onEvaluationWrite;
exports.saveEvaluation = require("./src/evaluations/evaluations").saveEvaluation;

// Catalog Contracts (Templates)
exports.createContract = require("./src/contracts/contracts").createContract;
exports.updateContract = require("./src/contracts/contracts").updateContract;
exports.staffCriarUsuario = require("./src/staff/staff").criarUsuarioEquipe;
exports.staffAtualizarUsuario = require("./src/staff/staff").atualizarUsuarioEquipe;

// Integrations
exports.saveIntegrationConfig = require("./src/integrations/integrations").saveIntegrationConfig;
exports.getIntegrationConfig = require("./src/integrations/integrations").getIntegrationConfig;
exports.financialWebhook = require("./src/integrations/whatsapp/financialWebhook").financialWebhook;

// Notifications
// Notifications
exports.sendWhatsAppMessage = require("./src/notifications/whatsapp").sendWhatsAppMessage;

// Automations
exports.saveAutomation = require("./src/automations/automations").saveAutomation;
exports.getAutomations = require("./src/automations/automations").getAutomations;
exports.deleteAutomation = require("./src/automations/automations").deleteAutomation;
exports.checkBirthdayAutomations = require("./src/triggers/checkBirthdayAutomations");
exports.checkExperimentalClassAutomations = require("./src/triggers/checkExperimentalClassAutomations");

// Tasks
exports.completeTask = require("./src/tasks/tasks").completeTask;
exports.createTask = require("./src/tasks/tasks").createTask;
exports.checkExpiringContracts = require("./src/triggers/checkExpiringContracts");






