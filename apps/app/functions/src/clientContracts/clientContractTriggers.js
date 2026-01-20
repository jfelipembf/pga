const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");

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
      let type = "new";

      // Check for history
      try {
        const historySnap = await db
          .collection("tenants").doc(idTenant)
          .collection("branches").doc(idBranch)
          .collection("clientsContracts")
          .where("idClient", "==", after.idClient)
          .get();

        const otherContracts = historySnap.docs.filter(d => d.id !== context.params.idContract);

        if (otherContracts.length > 0) {
          // Find newest previous
          const sorted = otherContracts
            .map(d => d.data())
            .sort((a, b) => (b.endDate || "").localeCompare(a.endDate || ""));

          const last = sorted[0];
          const lastEnd = last.endDate;
          const currentStart = after.startDate;

          if (lastEnd && currentStart) {
            const diffTime = (new Date(currentStart) - new Date(lastEnd));
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            type = diffDays <= 30 ? "renewal" : "return";
          } else {
            type = "renewal";
          }
        }
      } catch (e) {
        console.error("Error checking contract history:", e);
      }

      if (type === "new") {
        updates.newCount = FieldValue.increment(1);
        monthlyUpdates.newCount = FieldValue.increment(1);
      } else if (type === "renewal") {
        monthlyUpdates.renewalsMonth = FieldValue.increment(1);
      } else if (type === "return") {
        monthlyUpdates.returnsMonth = FieldValue.increment(1);
      }

      // Check if this client is ALREADY active (has other active contracts)
      let alreadyActive = false;
      try {
        const otherActiveSnap = await db
          .collection("tenants").doc(idTenant)
          .collection("branches").doc(idBranch)
          .collection("clientsContracts")
          .where("idClient", "==", after.idClient)
          .where("status", "in", ["active", "trial"]) // Adjust based on isActiveLike logic
          .get();

        // Filter out current contract ID just in case
        const others = otherActiveSnap.docs.filter(d => d.id !== context.params.idContract);
        if (others.length > 0) alreadyActive = true;
      } catch (err) {
        console.error("Error checking other active contracts:", err);
      }

      if (isActiveLike(after.status) && !alreadyActive) {
        updates.activeCount = FieldValue.increment(1);
        monthlyUpdates.activeAvg = FieldValue.increment(1);
      }
    }

    // 2. Delete
    if (before && !after) {
      // Check if client REMAINS active (has other active contracts)
      let remainsActive = false;
      try {
        const otherActiveSnap = await db
          .collection("tenants").doc(idTenant)
          .collection("branches").doc(idBranch)
          .collection("clientsContracts")
          .where("idClient", "==", before.idClient)
          .where("status", "in", ["active", "trial"])
          .get();

        if (!otherActiveSnap.empty) remainsActive = true;
      } catch (err) {
        console.error("Error checking remaining active contracts:", err);
      }

      if (isActiveLike(before.status) && !remainsActive) {
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
        // Became active. Check if ALREADY active
        let alreadyActive = false;
        try {
          const otherActiveSnap = await db
            .collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("clientsContracts")
            .where("idClient", "==", after.idClient)
            .where("status", "in", ["active", "trial"])
            .get();

          const others = otherActiveSnap.docs.filter(d => d.id !== context.params.idContract);
          if (others.length > 0) alreadyActive = true;
        } catch (err) { console.error(err); }

        if (!alreadyActive) {
          updates.activeCount = FieldValue.increment(1);
          monthlyUpdates.activeAvg = FieldValue.increment(1);
        }

      } else if (wasActive && !isActive) {
        // Became inactive. Check if REMAINS active
        let remainsActive = false;
        try {
          const otherActiveSnap = await db
            .collection("tenants").doc(idTenant)
            .collection("branches").doc(idBranch)
            .collection("clientsContracts")
            .where("idClient", "==", after.idClient) // use after.idClient as it shouldn't change
            .where("status", "in", ["active", "trial"])
            .get();

          // Filter out current contract (which is now inactive in memory but DB query might reflect current status depending on race condition? 
          // Query filters by 'status in [active]'. If this contract was updated to 'inactive', it shouldn't appear in the query if query is consistent.
          // But 'after' is the new state. The DB might not be fully consistent for a read immediately after write in same transaction? 
          // Triggers run AFTER write. So DB *should* have the new status 'inactive'.
          // So if I query for 'active', this contract will NOT show up.
          // So `otherActiveSnap` contains ONLY OTHER contracts.
          // So:
          if (!otherActiveSnap.empty) remainsActive = true;
        } catch (err) { console.error(err); }

        if (!remainsActive) {
          updates.activeCount = FieldValue.increment(-1);
          monthlyUpdates.activeAvg = FieldValue.increment(-1);
        }
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
