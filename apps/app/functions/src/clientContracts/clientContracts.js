const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { saveAuditLog } = require("../shared/audit");

const db = admin.firestore();

const { parseDate, toISODate, getToday, addDays } = require("../helpers/date");
const { getContractsColl } = require("./helpers/utils");
const { createClientContractInternal } = require("./helpers/contractService");

/**
 * ============================================================================
 * CLIENT CONTRACTS ACTIONS
 * ____________________________________________________________________________
 *
 * 1. createClientContract: Cria um novo contrato de cliente.
 * 2. scheduleContractSuspension: Agenda ou ativa suspensão de contrato.
 * 3. cancelClientContract: Cancela um contrato de cliente e limpa pendências.
 * 4. stopClientContractSuspension: Interrompe uma suspensão ativa ou agendada.
 *
 * ============================================================================
 */

// Export internal for use in SALES (maintaining contract if any other file is importing directly from here)
exports.createClientContractInternal = createClientContractInternal;



/**
 * Cria um novo contrato de cliente.
 */
exports.createClientContract = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

  if (!data.idClient) {
    throw new functions.https.HttpsError("invalid-argument", "idClient é obrigatório.");
  }

  try {
    const result = await createClientContractInternal({
      idTenant, idBranch, uid, token, data
    });

    // Auditoria
    try {
      const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim() : null);
      const staffName = token?.name || token?.email || uid;

      await saveAuditLog({
        idTenant, idBranch, uid,
        userName: staffName,
        action: "CLIENT_CONTRACT_CREATE",
        targetId: result.id,
        description: `Venda de contrato realizada para o cliente ${data.idClient}: ${result.contractTitle || 'Sem título'}`,
        metadata: {
          idClient: data.idClient,
          clientName: clientName,
          value: data.value,
          title: result.contractTitle
        }
      });
    } catch (auditError) {
      console.error("Falha silenciosa na auditoria de criação de contrato:", auditError);
    }

    return result;
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    throw new functions.https.HttpsError("internal", "Erro ao criar contrato.");
  }
});

/**
 * Agendar ou ativar suspensão de contrato.
 */
exports.scheduleContractSuspension = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const { idClientContract, startDate, endDate, reason } = data;

  if (!idClientContract) throw new functions.https.HttpsError("invalid-argument", "ID do contrato é obrigatório.");
  if (!startDate || !endDate) throw new functions.https.HttpsError("invalid-argument", "Datas são obrigatórias.");

  const parsedStart = parseDate(startDate);
  const parsedEnd = parseDate(endDate);

  if (!parsedStart || !parsedEnd) throw new functions.https.HttpsError("invalid-argument", "Datas inválidas.");
  if (parsedEnd < parsedStart) throw new functions.https.HttpsError("invalid-argument", "Data final deve ser posterior à inicial.");

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRequested = Math.floor((parsedEnd.getTime() - parsedStart.getTime()) / msPerDay) + 1;

  const contractsRef = getContractsColl(idTenant, idBranch);
  const contractRef = contractsRef.doc(idClientContract);
  const suspRef = contractRef.collection("suspensions").doc();

  const today = getToday();
  const shouldActivateNow = parsedStart.getTime() <= today.getTime();
  let newEndDateStr = null;

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(contractRef);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Contrato não encontrado.");

      const contract = snap.data();
      if (!contract.allowSuspension) throw new functions.https.HttpsError("failed-precondition", "Contrato não permite suspensão.");

      const maxDays = Number(contract.suspensionMaxDays || 0);
      const totalSuspendedDays = Number(contract.totalSuspendedDays || 0);
      const pendingSuspensionDays = Number(contract.pendingSuspensionDays || 0);

      if (maxDays > 0 && totalSuspendedDays + pendingSuspensionDays + daysRequested > maxDays) {
        throw new functions.https.HttpsError("failed-precondition", "Limite de dias de suspensão excedido.");
      }

      if (shouldActivateNow) {
        const currentEndDate = parseDate(contract.endDate || contract.endAt);
        if (!currentEndDate) throw new functions.https.HttpsError("failed-precondition", "Contrato sem data de término.");

        newEndDateStr = toISODate(addDays(currentEndDate, daysRequested));
      }

      const payload = {
        idClientContract,
        startDate,
        endDate,
        reason: reason || null,
        status: shouldActivateNow ? "active" : "scheduled",
        daysUsed: daysRequested,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        processedAt: shouldActivateNow ? FieldValue.serverTimestamp() : null,
        previousEndDate: contract.endDate || null,
        newEndDate: newEndDateStr,
      };

      t.set(suspRef, payload);

      const updates = shouldActivateNow ?
        {
          endDate: newEndDateStr,
          totalSuspendedDays: totalSuspendedDays + daysRequested,
          status: "suspended",
          updatedAt: FieldValue.serverTimestamp(),
        } :
        {
          pendingSuspensionDays: pendingSuspensionDays + daysRequested,
          updatedAt: FieldValue.serverTimestamp(),
        };

      t.update(contractRef, updates);
    });

    // Auditoria
    try {
      const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim() : null);
      const staffName = token?.displayName || token?.name || token?.email || uid;

      await saveAuditLog({
        idTenant, idBranch, uid,
        userName: staffName,
        action: "CLIENT_CONTRACT_SUSPEND",
        targetId: idClientContract,
        description: `Agendou suspensão do contrato ${idClientContract} (${startDate} a ${endDate})`,
        metadata: {
          idClient: data.idClient,
          clientName: clientName,
          startDate,
          endDate,
          reason,
          status: shouldActivateNow ? "active" : "scheduled"
        }
      });
    } catch (auditError) {
      console.error("Falha silenciosa na auditoria de suspensão:", auditError);
    }

    return {
      success: true,
      id: suspRef.id,
      startDate,
      endDate,
      reason,
      status: shouldActivateNow ? "active" : "scheduled",
      daysUsed: daysRequested,
      newEndDate: newEndDateStr,
    };
  } catch (error) {
    console.error("Erro ao agendar suspensão:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro ao processar suspensão.");
  }
});

/**
 * Cancelar contrato.
 */
exports.cancelClientContract = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const { idClientContract, reason, refundRevenue, schedule, cancelDate } = data;

  if (!idClientContract) throw new functions.https.HttpsError("invalid-argument", "ID do contrato é obrigatório.");

  const contractRef = getContractsColl(idTenant, idBranch).doc(idClientContract);
  const today = getToday();

  let result = null;

  try {
    result = await db.runTransaction(async (t) => {
      const snap = await t.get(contractRef);
      if (!snap.exists) throw new functions.https.HttpsError("not-found", "Contrato não encontrado.");

      const contract = snap.data();
      if (contract.status === "canceled") return { status: "canceled" };

      if (schedule) {
        const target = parseDate(cancelDate);
        if (!target || target < today) throw new functions.https.HttpsError("invalid-argument", "Data inválida para cancelamento agendado.");

        t.update(contractRef, {
          status: "scheduled_cancellation",
          cancelDate,
          cancelReason: reason || null,
          canceledBy: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { status: "scheduled_cancellation" };
      }

      // Cancelamento imediato
      t.update(contractRef, {
        status: "canceled",
        canceledAt: FieldValue.serverTimestamp(),
        canceledBy: uid,
        cancelReason: reason || null,
        updatedAt: FieldValue.serverTimestamp(),
        refunded: Boolean(refundRevenue),
      });

      return {
        status: "canceled",
        idClient: contract.idClient,
        idSale: contract.idSale,
        contract, // Return full contract to be safe if needed
      };
    });
  } catch (error) {
    console.error("Erro ao cancelar contrato:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro ao cancelar contrato.");
  }

  // Limpeza de matrículas e financeiro (fora da transação)
  if (!schedule && result?.status === "canceled") {
    try {
      // 1. Matrículas (Using helper)
      const { cleanEnrollmentsOnCancellation } = require("../enrollments/helpers/enrollmentService");
      await cleanEnrollmentsOnCancellation({ idTenant, idBranch, idClient: result.idClient });

      // 2. Financeiro (Dívidas), se configurado
      const settingsRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/settings/general`);
      const settingsSnap = await settingsRef.get();
      const cancelDebt = settingsSnap.exists && settingsSnap.data().finance?.cancelDebtOnCancelledContracts === true;

      if (cancelDebt) {
        // Buscar recebíveis em aberto ligados ao contrato ou venda
        const receivablesRef = db
          .collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);

        let debtsQuery = receivablesRef.where("status", "==", "open");

        // Tenta filtrar por idContract se existir, ou idSale
        // Como o Firestore não faz OR nativo entre campos diferentes facilmente na mesma query sem indices complexos,
        // vamos priorizar idSale se houver, ou buscar ambos se necessário.
        // Simplificação: Se tiver idSale, usa. Se não, tenta idContract se o receivable tiver esse campo (nosso model tem idSale e metadata).

        let docsToCancel = [];

        if (result.idSale) {
          const saleDebts = await receivablesRef
            .where("idSale", "==", result.idSale)
            .where("status", "==", "open")
            .get();
          docsToCancel = [...saleDebts.docs];
        }

        // Se idSale não cobriu, podemos tentar achar por metadados se o contrato tiver gerado.
        // Para evitar complexidade e leituras excessivas, vamos cancelar apenas se linkado à venda por enquanto.
        // Opcional: Se quiser ser agressivo, buscar por idClient e filtrar memory? Pode ser pesado.

        if (docsToCancel.length > 0) {
          const batch = db.batch(); // Re-instantiate batch for this separate op

          docsToCancel.forEach(doc => {
            batch.update(doc.ref, {
              status: "canceled",
              canceledAt: FieldValue.serverTimestamp(),
              cancelReason: "Cancelamento de contrato (Automático)",
              updatedAt: FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }
      }
    } catch (e) {
      console.error("Erro na limpeza pós-cancelamento:", e);
      // Não falha a requisição principal pois o contrato já foi cancelado
    }
  }

  // Auditoria
  if (result?.status === "canceled" || result?.status === "scheduled_cancellation") {
    try {
      const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim() : null);
      const staffName = token?.displayName || token?.name || token?.email || uid;

      await saveAuditLog({
        idTenant, idBranch, uid,
        userName: staffName,
        action: result.status === "canceled" ? "CLIENT_CONTRACT_CANCEL" : "CLIENT_CONTRACT_SCHEDULE_CANCEL",
        targetId: idClientContract,
        description: `Cancelamento de contrato: ${idClientContract} (Motivo: ${reason || 'Não informado'})`,
        metadata: {
          idClient: result.idClient,
          clientName: clientName,
          reason,
          refundRevenue,
          schedule
        }
      });
    } catch (auditError) {
      console.error("Falha silenciosa na auditoria de cancelamento:", auditError);
    }
  }

  return { success: true, ...result };
});

/**
 * Interromper uma suspensão ativa ou agendada.
 */
exports.stopClientContractSuspension = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idClientContract, idSuspension } = data;

  if (!idClientContract || !idSuspension) {
    throw new functions.https.HttpsError("invalid-argument", "ID do contrato e da suspensão são obrigatórios.");
  }

  const contractsRef = getContractsColl(idTenant, idBranch);
  const contractRef = contractsRef.doc(idClientContract);
  const suspRef = contractRef.collection("suspensions").doc(idSuspension);

  try {
    return await db.runTransaction(async (t) => {
      const contractSnap = await t.get(contractRef);
      const suspSnap = await t.get(suspRef);

      if (!contractSnap.exists) throw new functions.https.HttpsError("not-found", "Contrato não encontrado.");
      if (!suspSnap.exists) throw new functions.https.HttpsError("not-found", "Suspensão não encontrada.");

      const contract = contractSnap.data();
      const suspension = suspSnap.data();

      const statusLower = (suspension.status || "").toLowerCase();
      const isScheduled = statusLower === "scheduled";
      const isActive = statusLower === "active";

      if (!isScheduled && !isActive) {
        throw new functions.https.HttpsError("failed-precondition", `Apenas suspensões ativas ou agendadas podem ser interrompidas. Status atual: ${suspension.status}`);
      }

      // Se for agendada: Apenas cancela o agendamento
      if (isScheduled) {
        const daysToReturn = Number(suspension.daysUsed || 0);

        t.update(suspRef, {
          status: "cancelled", // Mudando para cancelled para diferenciar de stopped
          stoppedAt: FieldValue.serverTimestamp(),
          stoppedBy: uid,
          unusedDays: daysToReturn,
          daysUsed: 0,
        });

        // Devolver dias para pendingSuspensionDays do contrato
        t.update(contractRef, {
          pendingSuspensionDays: Math.max(0, (Number(contract.pendingSuspensionDays || 0) - daysToReturn)),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          type: "scheduled_cancelled",
          unusedDays: daysToReturn,
        };
      }

      // Se for ativa: Interrompe hoje e reajusta o contrato
      const today = getToday();
      const startDate = parseDate(suspension.startDate);
      const originalEndDate = parseDate(suspension.endDate);

      if (!startDate || !originalEndDate) {
        throw new functions.https.HttpsError("internal", "Dados de data da suspensão corrompidos.");
      }

      const msPerDay = 1000 * 60 * 60 * 24;

      // Dias que seriam usados originalmente
      const originalDaysRequested = Number(suspension.daysUsed || 0);

      // Calcular dias efetivamente usados (startDate até hoje inclusive? ou até ontem?)
      // Se paramos hoje, o aluno volta a contar hoje. Então ele usou de startDate até ONTEM.
      let actuallyUsedDays = Math.floor((today.getTime() - startDate.getTime()) / msPerDay);
      if (actuallyUsedDays < 0) actuallyUsedDays = 0;

      const unusedDays = originalDaysRequested - actuallyUsedDays;

      if (unusedDays <= 0) {
        throw new functions.https.HttpsError("failed-precondition", "A suspensão já está no fim ou já expirou.");
      }

      // Reajustar data final do contrato
      const currentContractEndDate = parseDate(contract.endDate || contract.endAt);
      if (!currentContractEndDate) {
        throw new functions.https.HttpsError("failed-precondition", "Contrato sem data de término (plano infinito?)");
      }

      const newContractEndDateStr = toISODate(addDays(currentContractEndDate, -unusedDays));

      // Atualizar Suspensão
      t.update(suspRef, {
        status: "stopped",
        endDate: toISODate(addDays(today, -1)), // Novo fim da suspensão foi ontem
        daysUsed: actuallyUsedDays,
        unusedDays: unusedDays,
        stoppedAt: FieldValue.serverTimestamp(),
        stoppedBy: uid,
      });


      // Atualizar Contrato
      t.update(contractRef, {
        status: "active",
        endDate: newContractEndDateStr,
        totalSuspendedDays: Math.max(0, (Number(contract.totalSuspendedDays || 0) - unusedDays)),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        type: "active_stopped",
        actuallyUsedDays,
        unusedDays,
        newContractEndDate: newContractEndDateStr,
      };
    });

    // Auditoria
    try {
      await saveAuditLog({
        idTenant, idBranch, uid,
        action: "CLIENT_CONTRACT_SUSPEND_STOP",
        targetId: idClientContract,
        description: `Interrompeu suspensão do contrato ${idClientContract}`,
        metadata: { idSuspension, result }
      });
    } catch (auditError) {
      console.error("Falha silenciosa na auditoria de interrupção de suspensão:", auditError);
    }

    return result;
  } catch (error) {
    console.error("ERRO [stopClientContractSuspension]:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro desconhecido ao interromper suspensão.");
  }
});
