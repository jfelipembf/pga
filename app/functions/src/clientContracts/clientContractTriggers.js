const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const { toISODate } = require("../helpers/date");
const { isActiveLike } = require("./helpers/utils");
const { updateContractSummaries } = require("./helpers/summaryHelper");

/**
 * ============================================================================
 * CLIENT CONTRACT TRIGGERS
 * ____________________________________________________________________________
 *
 * 1. onClientContractWrite: Trigger Firestore para atualizar estatísticas 
 *    e contadores de contratos (novos, ativos, cancelados, etc).
 *
 * ============================================================================
 */


exports.onClientContractWrite = functions
  .region("us-central1")
  .firestore.document("tenants/{idTenant}/branches/{idBranch}/clientsContracts/{idContract}")
  .onWrite(async (change, context) => {
    const { idTenant, idBranch } = context.params;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    const dateStr = after ?
      (after.startDate || toISODate(new Date())) :
      (before.startDate || toISODate(new Date()));

    // Usar data de "hoje" para eventos de fluxo (churn, cancelamento, etc)
    // ou data do contrato?
    // O código original usava "getToday()" para eventos de fluxo, e data do contrato para contagem de ativos?
    // Vamos usar a data atual do processamento para eventos de mudança de status.
    const todayStr = toISODate(new Date());

    const updates = {};
    const monthlyUpdates = {};

    // We will use `todayStr` for all updates to simplify. Dashboard usually shows "Active Users Today".


    // 1. Create
    if (!before && after) {
      updates.newCount = FieldValue.increment(1);
      monthlyUpdates.newCount = FieldValue.increment(1);

      if (isActiveLike(after.status)) {
        updates.activeCount = FieldValue.increment(1);
        monthlyUpdates.activeAvg = FieldValue.increment(1);
      }
    }

    // 2. Delete
    if (before && !after) {
      if (isActiveLike(before.status)) {
        updates.activeCount = FieldValue.increment(-1);
        monthlyUpdates.activeAvg = FieldValue.increment(-1);
      }
    }

    // 3. Update
    if (before && after) {
      const statusBefore = before.status;
      const statusAfter = after.status;

      // Active Count transitions
      const wasActive = isActiveLike(statusBefore);
      const isActive = isActiveLike(statusAfter);

      if (!wasActive && isActive) {
        updates.activeCount = FieldValue.increment(1);
        monthlyUpdates.activeAvg = FieldValue.increment(1);
      } else if (wasActive && !isActive) {
        updates.activeCount = FieldValue.increment(-1);
        monthlyUpdates.activeAvg = FieldValue.increment(-1);
      }

      // Flow metrics (transitions)

      // Cancelled
      if (statusBefore !== "canceled" && statusAfter === "canceled") {
        updates.contractsCanceledDay = FieldValue.increment(1);
        updates.churnDay = FieldValue.increment(1);
        monthlyUpdates.contractsCanceledMonth = FieldValue.increment(1);
        monthlyUpdates.churnMonth = FieldValue.increment(1);
      }

      // Scheduled Cancellation
      if (statusBefore !== "scheduled_cancellation" && statusAfter === "scheduled_cancellation") {
        updates.contractsScheduledCancellationDay = FieldValue.increment(1);
        monthlyUpdates.contractsScheduledCancellationMonth = FieldValue.increment(1);
      }

      // Suspended (Stock - Currently Suspended)
      if (statusBefore !== "suspended" && statusAfter === "suspended") {
        updates.suspendedCount = FieldValue.increment(1);
        monthlyUpdates.suspendedCount = FieldValue.increment(1);
      } else if (statusBefore === "suspended" && statusAfter !== "suspended") {
        updates.suspendedCount = FieldValue.increment(-1);
        monthlyUpdates.suspendedCount = FieldValue.increment(-1);
      }

      // Refunded (Field check)
      if (!before.refunded && after.refunded) {
        updates.refundsDay = FieldValue.increment(1);
        monthlyUpdates.refundsMonth = FieldValue.increment(1);
      }

      // --- GATILHOS DE LIMPEZA ---
      // Se o contrato se tornar CANCELADO (por qualquer meio: manual, tarefa agendada, etc)
      // aciona a limpeza das matrículas.
      if (statusBefore !== "canceled" && statusAfter === "canceled") {
        try {
          // Carregamento preguiçoso do helper para evitar overhead em cold start se não for necessário
          const { cleanEnrollmentsOnCancellation } = require("../enrollments/helpers/enrollmentService");
          await cleanEnrollmentsOnCancellation({ idTenant, idBranch, idClient: after.idClient });
        } catch (cleanupError) {
          console.error("Erro ao limpar matrículas via trigger:", cleanupError);
        }
      }
    }

    await updateContractSummaries({
      idTenant,
      idBranch,
      dateStr: todayStr,
      updates,
      monthlyUpdates,
    });
  });
