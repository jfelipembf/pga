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
  console.log('[cancelClientContract] ========== INÍCIO DO CANCELAMENTO ==========');
  console.log('[cancelClientContract] Dados recebidos:', JSON.stringify(data, null, 2));

  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const { idClientContract, reason, refundRevenue, schedule, cancelDate } = data;

  console.log('[cancelClientContract] Contexto:', { idTenant, idBranch, uid });
  console.log('[cancelClientContract] Parâmetros principais:', {
    idClientContract,
    reason,
    refundRevenue,
    schedule,
    cancelDate
  });
  console.log('[cancelClientContract] Flags de cancelamento:', {
    cancelOpenReceivables: data.cancelOpenReceivables,
    cancelFutureSessions: data.cancelFutureSessions,
    generateCredit: data.generateCredit,
    creditAmount: data.creditAmount,
    applyFine: data.applyFine,
    fineAmount: data.fineAmount
  });

  if (!idClientContract) {
    console.error('[cancelClientContract] ERRO: ID do contrato não fornecido!');
    throw new functions.https.HttpsError("invalid-argument", "ID do contrato é obrigatório.");
  }

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
        return {
          status: "scheduled_cancellation",
          idClient: contract.idClient,
          idSale: contract.idSale
        };
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
    console.log(">>> [CANCELAMENTO] Iniciando limpeza pós-cancelamento para Contrato:", idClientContract, "Cliente:", result.idClient);
    console.log(">>> [CANCELAMENTO] Opções recebidas:", {
      cancelFutureSessions: data.cancelFutureSessions,
      generateCredit: data.generateCredit,
      creditAmount: data.creditAmount,
      applyFine: data.applyFine,
      fineAmount: data.fineAmount,
      cancelOpenReceivables: data.cancelOpenReceivables
    });

    try {
      // Garantir acesso aos dados do contrato para todos os blocos
      const contractData = result.contract || {};

      // 1. Matrículas (Using helper)
      const { cleanEnrollmentsOnCancellation } = require("../enrollments/helpers/enrollmentService");
      console.log(">>> [CANCELAMENTO] Removendo matrículas...");
      await cleanEnrollmentsOnCancellation({ idTenant, idBranch, idClient: result.idClient });

      // 1.1 Remover sessões futuras avulsas (Agenda) se solicitado (cancelFutureSessions)
      if (data.cancelFutureSessions) {
        console.log(">>> [CANCELAMENTO] Flag 'cancelFutureSessions' ativa. (TODO: Implementar remoção granular de agenda futura)");
      }

      // 2. Acerto Financeiro: Crédito
      if (data.generateCredit && Number(data.creditAmount) > 0) {
        console.log(">>> [CANCELAMENTO] Gerando Crédito de R$", data.creditAmount);
        try {
          const { addClientCreditInternal } = require("../financial/credits");
          await addClientCreditInternal({
            idTenant,
            idBranch,
            idClient: result.idClient,
            uid,
            userToken: token,
            payload: {
              amount: Number(data.creditAmount),
              description: `Crédito por cancelamento de contrato ${contractData.contractCode || idClientContract}`,
              origin: "cancellation_credit",
              idSale: contractData.idSale // Vincular à venda original se houver
            }
          });
          console.log(">>> [CANCELAMENTO] Crédito gerado com sucesso.");

          // 2.1 Gerar Transação de Estorno (Refund) para abater do relatório de vendas
          try {
            const { createTransactionInternal } = require("../financial/transactions");
            // Necessário data atual YYYY-MM-DD
            const dateHelpers = require("../helpers/date");
            const todayISO = dateHelpers.toISODate ? dateHelpers.toISODate(new Date()) : new Date().toISOString().split('T')[0];

            await createTransactionInternal({
              idTenant,
              idBranch,
              payload: {
                type: "expense",
                category: "Estorno (Crédito)",
                description: `Estorno (Crédito) - Cancelamento ${contractData.contractCode || idClientContract}`,
                amount: Number(data.creditAmount),
                date: todayISO,
                method: "credit_generation",
                status: "paid",
                createdBy: uid,
                metadata: {
                  reason: "Refund", // Key for dashboard filter
                  uid: uid,
                  idClient: result.idClient,
                  origin: "cancellation",
                  idContract: idClientContract
                }
              }
            });
            console.log(">>> [CANCELAMENTO] Transação de Estorno (Refund) registrada com sucesso.");
          } catch (txError) {
            console.error(">>> [CANCELAMENTO] ERRO ao gerar transação de estorno:", txError);
            // Não falha o processo todo, apenas loga erro
          }

        } catch (creditError) {
          console.error(">>> [CANCELAMENTO] ERRO ao gerar crédito:", creditError);
        }
      }

      // 3. Acerto Financeiro: Multa
      // 3. Acerto Financeiro: Multa
      if (data.applyFine && Number(data.fineAmount) > 0) {
        console.log(">>> [CANCELAMENTO] Aplicando Multa de R$", data.fineAmount);
        try {
          // Importar a função correta
          const { createReceivableInternal } = require("../financial/receivables");

          await createReceivableInternal({
            idTenant,
            idBranch,
            uid,
            userToken: token,
            payload: {
              idClient: result.idClient,
              // Campos obrigatórios padronizados
              description: `Multa rescisória - Contrato ${contractData.contractCode || idClientContract}`,
              amount: Number(data.fineAmount),
              dueDate: toISODate(new Date()),
              status: "open",

              // Relacionamentos
              idContract: idClientContract,
              idSale: contractData.idSale || null,

              // Metadados
              notes: "Gerado automaticamente pelo cancelamento de contrato.",
              receivableCode: null // Será gerado
            }
          });

          console.log(">>> [CANCELAMENTO] Multa aplicada com sucesso (Recebível criado via createReceivableInternal).");

        } catch (fineError) {
          console.error(">>> [CANCELAMENTO] ERRO CRÍTICO ao gerar multa:", fineError);
        }
      }

      // 4. Financeiro (Dívidas em Aberto)
      // Prioridade: Decisão manual do usuário (data.cancelOpenReceivables) > Configuração do sistema
      let shouldCancelDebt = false;

      if (typeof data.cancelOpenReceivables === 'boolean') {
        shouldCancelDebt = data.cancelOpenReceivables;
      } else {
        // Fallback para configuração global se não informado
        const settingsRef = db.doc(`tenants/${idTenant}/branches/${idBranch}/settings/general`);
        const settingsSnap = await settingsRef.get();
        shouldCancelDebt = settingsSnap.exists && settingsSnap.data().finance?.cancelDebtOnCancelledContracts === true;
      }

      console.log(">>> [CANCELAMENTO] Cancelar dívidas em aberto?", shouldCancelDebt);

      if (shouldCancelDebt) {
        // Buscar recebíveis em aberto ligados ao contrato ou venda
        const receivablesRef = db
          .collection(`tenants/${idTenant}/branches/${idBranch}/receivables`);

        let docsToCancel = [];

        // Estratégia de busca robusta: Buscar por Venda E por Contrato, unindo resultados
        const queryPromises = [];
        const statusList = ["open", "pending", "overdue"];

        if (result.idSale) {
          queryPromises.push(
            receivablesRef
              .where("idSale", "==", result.idSale)
              .where("status", "in", statusList)
              .get()
          );
        }

        if (idClientContract) {
          queryPromises.push(
            receivablesRef
              .where("idContract", "==", idClientContract)
              .where("status", "in", statusList)
              .get()
          );
        }

        const snapshots = await Promise.all(queryPromises);

        // Unificar e remover duplicatas
        const uniqueDocs = new Map();
        snapshots.forEach(snap => {
          snap.docs.forEach(doc => {
            uniqueDocs.set(doc.id, doc);
          });
        });

        docsToCancel = Array.from(uniqueDocs.values());

        console.log(`>>> [CANCELAMENTO] Encontrados ${docsToCancel.length} recebíveis para cancelar.`);

        if (docsToCancel.length > 0) {
          const batch = db.batch();

          docsToCancel.forEach(doc => {
            const rData = doc.data();
            console.log(`>>> [CANCELAMENTO] Cancelando Recebível ID: ${doc.id}, Valor: ${rData.amount}, Pendente: ${rData.pending}`);

            batch.update(doc.ref, {
              status: "canceled",
              canceledAt: FieldValue.serverTimestamp(),
              cancelReason: "Cancelamento de contrato (Vinculado)",
              updatedAt: FieldValue.serverTimestamp(),
              canceledBy: uid
            });
          });
          await batch.commit();
          console.log(">>> [CANCELAMENTO] Recebíveis cancelados com sucesso via batch.");
        }

        // 4.1 Cancelar Transações Financeiras Futuras (ex: Parcelas de Cartão)
        if (result.idSale) {
          try {
            const txRef = db.collection(`tenants/${idTenant}/branches/${idBranch}/financialTransactions`);
            const txSnapshot = await txRef.where("idSale", "==", result.idSale).get();

            if (!txSnapshot.empty) {
              const txBatch = db.batch();
              let txCount = 0;
              const todayISO = new Date().toISOString().split('T')[0];

              txSnapshot.forEach(doc => {
                const tx = doc.data();
                // Cancela se for data futura OU se status não for consolidado/pago (embora venda cartao nasca como paid as vezes, precisamos checar a data)
                // Se a data é futura, é previsão.
                if (tx.date > todayISO && tx.status !== 'cancelled') {
                  txBatch.update(doc.ref, {
                    status: 'cancelled',
                    cancelledAt: FieldValue.serverTimestamp(),
                    cancelReason: 'Cancelamento de Contrato Vinculado'
                  });
                  txCount++;
                }
              });

              if (txCount > 0) {
                await txBatch.commit();
                console.log(`>>> [CANCELAMENTO] ${txCount} Transações futuras (cartão) canceladas.`);
              }
            }
          } catch (txErr) {
            console.error(">>> [CANCELAMENTO] Erro ao cancelar transações futuras:", txErr);
          }
        }
      }
    } catch (e) {
      console.error(">>> [CANCELAMENTO] ERRO CRÍTICO na limpeza pós-cancelamento:", e);
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
