const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { saveAuditLog } = require("../shared/audit");
const { generateEntityId } = require("../shared/id");
const { buildReceivablePayload } = require("../shared/payloads");
const { toISODate } = require("../helpers/date");
const { distributePaymentToReceivables } = require("./helpers/paymentHelper");

const db = admin.firestore();


// Helper to get receivables collection
const getReceivablesColl = (idTenant, idBranch) =>
  db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("receivables");

/**
 * Função interna para criar recebível.
 * Suporta batch opcional.
 */
const createReceivableInternal = async (
  {
    idTenant,
    idBranch,
    payload,
    uid,
    userToken,
    batch,
    transaction, // New support for transaction
  },
) => {
  // If specific code provided in payload, use it (useful for partial payments pre-calc), else generate.
  const receivableCode = payload.receivableCode || await generateEntityId(
    idTenant,
    idBranch,
    "receivable",
    { sequential: true },
  );

  const rawPayload = buildReceivablePayload({
    ...payload,
    receivableCode
  });

  // System Metadata (campos de auditoria não devem ir no builder genérico)
  const finalPayload = {
    ...rawPayload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: uid,
    createdByName: userToken?.name || userToken?.email || "System",
    idTenant,
    idBranch,
  };

  const ref = getReceivablesColl(idTenant, idBranch);

  if (transaction) {
    const docRef = ref.doc();
    transaction.set(docRef, finalPayload);
    return { id: docRef.id, ...finalPayload };
  } else if (batch) {
    const docRef = ref.doc();
    batch.set(docRef, finalPayload);
    return { id: docRef.id, ...finalPayload };
  } else {
    const docRef = await ref.add(finalPayload);
    return { id: docRef.id, ...finalPayload };
  }
};

/**
 * Adiciona um novo recebível (Conta a Receber).
 */
exports.addReceivable = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

  const amount = Number(data.amount);
  if (!amount || amount < 0) {
    throw new functions.https.HttpsError("invalid-argument", "O valor deve ser positivo.");
  }

  try {
    const result = await createReceivableInternal({
      idTenant,
      idBranch,
      payload: data,
      uid,
      userToken: token,
    });

    // Auditoria
    try {
      const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim() : null);
      const staffName = token?.name || token?.email || uid;

      await saveAuditLog({
        idTenant, idBranch, uid,
        userName: staffName,
        action: "FINANCIAL_RECEIVABLE_ADD",
        targetId: result.id,
        description: `Criou conta a receber manual para o cliente ${data.idClient}: R$ ${amount.toFixed(2)}`,
        metadata: {
          idClient: data.idClient,
          clientName: clientName,
          amount,
          dueDate: data.dueDate
        }
      });
    } catch (auditError) {
      console.error("Falha silenciosa na auditoria de recebível:", auditError);
    }

    return result;
  } catch (error) {
    console.error("Erro ao criar recebível:", error);
    throw new functions.https.HttpsError("internal", "Erro ao salvar conta a receber.");
  }
});

exports.createReceivableInternal = createReceivableInternal;

/**
 * Atualiza um recebível.
 */
exports.updateReceivable = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid } = requireAuthContext(data, context);
  const { idReceivable, ...updates } = data;

  if (!idReceivable) throw new functions.https.HttpsError("invalid-argument", "ID do recebível é obrigatório.");

  const ref = getReceivablesColl(idTenant, idBranch).doc(idReceivable);

  const payload = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  };

  // Remover campos protegidos
  delete payload.idTenant;
  delete payload.idBranch;
  delete payload.idReceivable;
  delete payload.receivableCode;
  delete payload.createdAt;

  try {
    await ref.update(payload);

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch, uid,
      action: "FINANCIAL_RECEIVABLE_UPDATE",
      targetId: idReceivable,
      description: `Atualizou conta a receber ${idReceivable}`,
      metadata: { updates: Object.keys(payload) }
    });

    return { id: idReceivable, ...payload };
  } catch (error) {
    console.error("Erro ao atualizar recebível:", error);
    throw new functions.https.HttpsError("internal", "Erro ao atualizar recebível.");
  }
});

/**
 * Remove um recebível.
 */
exports.deleteReceivable = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch } = requireAuthContext(data, context);
  const { idReceivable } = data;

  if (!idReceivable) throw new functions.https.HttpsError("invalid-argument", "ID do recebível é obrigatório.");

  const ref = getReceivablesColl(idTenant, idBranch).doc(idReceivable);

  try {
    await ref.delete();

    // Auditoria
    await saveAuditLog({
      idTenant, idBranch, uid,
      action: "FINANCIAL_RECEIVABLE_DELETE",
      targetId: idReceivable,
      description: `Removeu conta a receber ${idReceivable}`
    });

    return { success: true, id: idReceivable };
  } catch (error) {
    console.error("Erro ao remover recebível:", error);
    throw new functions.https.HttpsError("internal", "Erro ao remover recebível.");
  }
});



/**
 * Paga recebíveis em aberto (saldo devedor).
 * Cria uma transação financeira e atualiza os receivables.
 * Se for pagamento parcial, cria um novo receivable para o saldo restante.
 */
exports.payReceivables = functions.region("us-central1").https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);
  const {
    idClient,
    amount,
    paymentMethod,
    paymentDate,
    receivableIds,
    // Card payment fields
    authorization,
    acquirer,
    brand,
    installments,
    // Partial payment
    nextDueDate
  } = data;

  if (!idClient) {
    throw new functions.https.HttpsError("invalid-argument", "ID do cliente é obrigatório.");
  }

  const paymentAmount = Number(amount);
  if (!paymentAmount || paymentAmount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Valor do pagamento deve ser positivo.");
  }

  if (!paymentMethod) {
    throw new functions.https.HttpsError("invalid-argument", "Forma de pagamento é obrigatória.");
  }

  // Gerar IDs estruturados antes da transação para evitar nested transactions
  const transactionCode = await generateEntityId(idTenant, idBranch, "transaction", { sequential: true });
  // Gerar código de receivable preventivamente (caso precise para pagamento parcial)
  const newReceivableCode = await generateEntityId(idTenant, idBranch, "receivable", { sequential: true });

  try {
    return await db.runTransaction(async (t) => {
      const receivablesRef = getReceivablesColl(idTenant, idBranch);

      // 1. Buscar receivables em aberto
      // Buscar por balance > 0 (campo usado nas vendas) ou pending > 0
      let query = receivablesRef
        .where("idClient", "==", idClient)
        .where("status", "==", "open");

      if (receivableIds && receivableIds.length > 0) {
        // Se IDs específicos foram fornecidos, buscar apenas esses
        query = receivablesRef.where(admin.firestore.FieldPath.documentId(), "in", receivableIds);
      }

      const receivablesSnap = await t.get(query);



      if (receivablesSnap.empty) {
        console.error(`[payReceivables] No receivables found for client ${idClient}`);
        throw new functions.https.HttpsError("not-found", "Nenhum recebível em aberto encontrado.");
      }

      const receivables = receivablesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));



      // Calcular total em aberto (compatibilidade balance/pending)
      const totalPending = receivables.reduce((sum, rec) =>
        sum + Number(rec.balance || rec.pending || 0), 0
      );



      // 2. Distribuir pagamento
      const { distribution, remainingAmount, totalDistributed } = distributePaymentToReceivables(
        receivables,
        paymentAmount,
      );



      if (totalDistributed === 0) {
        console.error(`[payReceivables] totalDistributed is 0. Receivables:`, receivables.map(r => ({
          id: r.id,
          pending: r.pending,
          paid: r.paid,
          amount: r.amount
        })));
        throw new functions.https.HttpsError("failed-precondition", "Nenhum valor foi distribuído. Verifique os receivables.");
      }

      // 3. Criar transação financeira
      // 3. Criar transação financeira
      // Import lazy to avoid circular dependency issues at top level if any (though likely none)
      const { createTransactionInternal } = require("./transactions");

      const { id: transactionId } = await createTransactionInternal({
        idTenant,
        idBranch,
        transaction: t,
        payload: {
          transactionCode, // ID Estruturado pré-gerado
          type: "receivablePayment",
          description: `Pagamento de saldo devedor - ${distribution.length} recebível(is)`,
          idClient,
          method: paymentMethod,
          amount: -totalDistributed, // Negativo pois é pagamento (saída do cliente)
          date: paymentDate || toISODate(new Date()),
          status: "completed",
          receivableIds: distribution.map(d => d.idReceivable),

          // Card fields
          cardAuthorization: authorization,
          cardAcquirer: acquirer,
          cardBrand: brand,
          cardInstallments: installments,

          metadata: {
            registeredBy: token?.name || token?.email || "System",
            uid
          }
        }
      });
      // const transactionRef = transactionsRef.doc(); -- handled by internal
      // t.set(transactionRef, transactionPayload);

      // 4. Atualizar cada receivable
      const updatedReceivables = [];
      for (const item of distribution) {
        const recRef = receivablesRef.doc(item.idReceivable);
        const currentRec = receivables.find(r => r.id === item.idReceivable);

        const newPaid = Number(currentRec.paid || currentRec.amountPaid || 0) + item.amountToPay;
        const newPending = item.newPending;
        const newStatus = item.willBeFullyPaid ? "paid" : "open";

        const updatePayload = {
          paid: newPaid,
          amountPaid: newPaid, // Keeping both for compatibility
          pending: newPending,
          balance: newPending, // Balance = pending (usado nas vendas)
          status: newStatus,
          lastPaymentAt: FieldValue.serverTimestamp(),
          lastPaymentMethod: paymentMethod,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        };

        t.update(recRef, updatePayload);

        updatedReceivables.push({
          id: item.idReceivable,
          ...updatePayload,
          amountPaid: item.amountToPay,
        });
      }

      // 5. Se for pagamento parcial (totalPaid < totalPending), criar novo receivable
      let newReceivableId = null;
      const stillPending = totalPending - totalDistributed;

      if (stillPending > 0 && nextDueDate) {
        if (stillPending > 0 && nextDueDate) {
          // Usar a função internal com transaction para reuso seguro de código
          const { id } = await createReceivableInternal({
            idTenant,
            idBranch,
            uid,
            userToken: token,
            transaction: t,
            payload: {
              receivableCode: newReceivableCode, // ID Estruturado pré-gerado
              idClient,
              description: "Saldo devedor remanescente - Pagamento parcial",
              amount: stillPending,
              pending: stillPending,
              dueDate: nextDueDate,
              notes: `Criado automaticamente após pagamento parcial de R$ ${totalDistributed.toFixed(2)} em ${paymentDate || toISODate(new Date())}`,
            }
          });
          newReceivableId = id;
        }
      }

      return {
        success: true,
        transactionId,
        totalPaid: totalDistributed,
        totalPending,
        stillPending,
        isPartialPayment: stillPending > 0,
        newReceivableId,
        receivablesUpdate: updatedReceivables.length,
        receivables: updatedReceivables,
      };
    });

    // Auditoria
    try {
      const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim() : null);
      const staffName = token?.name || token?.email || uid;

      await saveAuditLog({
        idTenant, idBranch, uid,
        userName: staffName,
        action: "FINANCIAL_RECEIVABLE_PAY",
        targetId: idClient,
        description: `Realizou quitação de saldo devedor para o cliente ${idClient}. Total pago: R$ ${amount.toFixed(2)}`,
        metadata: {
          idClient,
          clientName: clientName,
          paymentMethod,
          amount,
          receivablesCount: receivableIds?.length || 0,
          isPartial: (result.stillPending || 0) > 0
        }
      });
    } catch (auditError) {
      console.error("Falha silenciosa na auditoria de pagamento:", auditError);
    }

    // Auditoria do Novo Recebível (se for pagamento parcial)
    if (result.isPartialPayment && result.newReceivableId) {
      try {
        const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim() : null);
        const staffName = token?.name || token?.email || uid;

        await saveAuditLog({
          idTenant, idBranch, uid,
          userName: staffName,
          action: "FINANCIAL_RECEIVABLE_ADD",
          targetId: idClient,
          description: `Novo saldo devedor gerado após pagamento parcial para o cliente ${idClient}: R$ ${result.stillPending.toFixed(2)}`,
          metadata: {
            idClient,
            clientName: clientName,
            amount: result.stillPending,
            isPartialRemainder: true
          }
        });
      } catch (auditError) {
        console.error("Falha silenciosa na auditoria do recebível remanescente:", auditError);
      }
    }

    return result;
  } catch (error) {
    console.error("ERRO [payReceivables]:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", error.message || "Erro ao processar pagamento de receivables.");
  }
});
