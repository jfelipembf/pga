const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { requireAuthContext } = require("../shared/context");
const { generateEntityId } = require("../shared/id");
const { saveAuditLog } = require("../shared/audit");
const { createTransactionInternal } = require("../financial/transactions");
const { createReceivableInternal } = require("../financial/receivables");
const { addClientCreditInternal } = require("../financial/credits");
const { createClientContractInternal } = require("../clientContracts/clientContracts");
const { toISODate, addDays } = require("../helpers/date");

const db = admin.firestore();


const getSalesColl = (idTenant, idBranch) =>
  db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("sales");

const getSaleRef = (idTenant, idBranch, idSale) =>
  getSalesColl(idTenant, idBranch).doc(idSale);

const detectSaleType = (items) => {
  if (!items || !items.length) return "generic";
  // Se tiver pelo menos um contrato, é contract
  if (items.some((i) => i.itemType === "contract" || i.type === "contract")) {
    return "contract";
  }
  // Se tiver serviço
  if (items.some((i) => i.itemType === "service" || i.type === "service")) {
    return "service";
  }
  // Se tiver produto
  if (items.some((i) => i.itemType === "product" || i.type === "product")) {
    return "product";
  }
  return "generic";
};

const getSessionsColl = (idTenant, idBranch) =>
  db
    .collection("tenants")
    .doc(idTenant)
    .collection("branches")
    .doc(idBranch)
    .collection("cashierSessions");

/**
 * Cria ou Atualiza uma venda (Sale).
 * Gerencia também os itens da venda (subcoleção 'items').
 */
exports.saveSale = functions.https.onCall(async (data, context) => {
  const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

  // Validar se há caixa aberto
  const sessionsRef = getSessionsColl(idTenant, idBranch);
  const openSnapshot = await sessionsRef
    .where("status", "==", "open")
    .limit(1)
    .get();

  if (openSnapshot.empty) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Não há caixa aberto para realizar vendas. Por favor, abra o caixa antes de continuar.",
    );
  }

  const { idSale: providedIdSale, items, payments, dueDate } = data;




  // 1. Determinar ID e SaleCode
  let saleRef;
  let saleCode = data.saleCode;
  let isNew = false;

  if (providedIdSale) {
    saleRef = getSaleRef(idTenant, idBranch, providedIdSale);
  } else {
    saleRef = getSalesColl(idTenant, idBranch).doc();
    isNew = true;
  }

  // Se for nova venda e não tiver código, gerar
  if (isNew && !saleCode) {
    const saleType = detectSaleType(items);
    saleCode = await generateEntityId(
      idTenant,
      idBranch,
      "sale",
      { subtype: saleType, sequential: true },
    );
  }

  // 2. Preparar payload da venda
  const salePayload = {
    saleCode,
    idClient: data.idClient || null,
    idEmployeeSale: data.idEmployeeSale || data.idStaff || null,
    idStaff: data.idStaff || null,
    staffName: data.staffName || "",
    saleDate: data.saleDate || toISODate(new Date()),
    status: data.status || "open",
    requiresEnrollment: Boolean(data.requiresEnrollment),
    enrollmentStatus: data.enrollmentStatus || "pending",
    totals: {
      gross: Number(data.totals?.gross || 0),
      discount: Number(data.totals?.discount || 0),
      net: Number(data.totals?.net || 0),
      creditUsed: Number(data.totals?.creditUsed || 0),
      creditGenerated: Number(data.totals?.creditGenerated || 0),
      // Recalcular no backend para garantir consistência
      paid: Array.isArray(payments) ? payments.reduce((acc, p) => acc + Number(p.amount || 0), 0) : 0,
      pending: 0, // Será ajustado abaixo
    },
    notes: data.notes || "",
    idTenant,
    idBranch,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  };

  // Ajustar pending
  const net = salePayload.totals.net;
  const paid = salePayload.totals.paid;
  salePayload.totals.pending = Math.max(0, net - paid);
  // Se pagou a mais, creditGenerated deveria ser ajustado? 
  // O frontend já manda creditGenerated calculado, vamos confiar ou recalcular?
  // Vamos focar no bug do "pending" (dívida).

  if (isNew) {
    salePayload.createdAt = FieldValue.serverTimestamp();
    salePayload.createdBy = uid;
  }

  // 3. Executar gravação (Venda + Itens + Financeiro)
  // Como pode ter muitos itens e transações, vamos usar batch
  const batch = db.batch();

  // Salvar Venda
  batch.set(saleRef, salePayload, { merge: true });

  // Salvar Itens (Subcoleção)
  if (Array.isArray(items)) {
    const itemsRef = saleRef.collection("items");

    // Se for update, buscar itens atuais para deletar
    if (!isNew) {
      const existingItems = await itemsRef.get();
      existingItems.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    // Adicionar novos itens
    // Adicionar novos itens
    for (const item of items) {
      const newItemRef = itemsRef.doc(); // Auto ID
      let createdContractId = null;

      // Se for item do tipo contrato e estamos criando a venda, gerar o contrato.
      // E apenas se tiver idClient (venda identificada).
      if (isNew && data.idClient && (item.itemType === "contract" || item.type === "contract")) {
        try {
          const contractRes = await createClientContractInternal({
            idTenant,
            idBranch,
            uid,
            token,
            batch,
            data: {
              ...item, // Passa tudo (allowSuspension, allowedWeekDays, etc)
              idClient: data.idClient,
              contractTitle: item.name || item.description || item.label || "Contrato via Venda",
              startDate: item.startDate || data.saleDate || toISODate(new Date()),
              endDate: item.endDate,
              value: 0, // Já contabilizado na venda
              idSale: saleRef.id,
              idSaleItem: newItemRef.id,
              status: "active",
            }
          });
          createdContractId = contractRes.id;
        } catch (err) {
          console.error("Erro ao criar contrato automático na venda:", err);
          // Não vamos travar a venda inteira? Ou vamos?
          // Melhor logar e seguir, ou throw?
          // Se o usuário comprou um contrato e ele não for criado, é gravíssimo.
          throw err;
        }
      }

      batch.set(newItemRef, {
        idSale: saleRef.id,
        ...item,
        idContract: createdContractId || null,
        itemType: item.itemType || item.type || "contract",
        creditUsed: Number(item.creditUsed || 0),
        creditGenerated: Number(item.creditGenerated || 0),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // 4. Processar Financeiro
  if (isNew && Array.isArray(payments) && payments.length > 0) {
    for (const payment of payments) {
      const amount = Number(payment.amount || 0);
      if (amount <= 0) continue;

      const method = payment.type || "Outros";
      const isCard = method === "credito" || method === "debito";
      const idAcquirer = payment.idAcquirer;

      let acquirerConfig = null;
      if (isCard && idAcquirer) {
        const acqDoc = await db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("acquirers").doc(idAcquirer).get();
        if (acqDoc.exists) {
          acquirerConfig = acqDoc.data();
          console.log(`[saveSale] Acquirer found: ${acquirerConfig.name}. Anticipate: ${acquirerConfig.anticipateReceivables}`);
        } else {
          console.warn(`[saveSale] Acquirer not found: ${idAcquirer}`);
        }
      }

      // Se for crédito parcelado E NÃO antecipar, gerar múltiplas transações
      const installments = Number(payment.installments || 1);
      const shouldSplit = method === "credito" && installments > 1 && !acquirerConfig?.anticipateReceivables;

      if (shouldSplit) {
        const installmentAmount = amount / installments;

        // Calcular taxa por parcela (simplificado: MDR proporcional)
        const instFee = (acquirerConfig?.installmentFees || []).find(f => Number(f.installments) === installments);
        const feePercent = Number(instFee?.feePercent || 0);

        for (let i = 1; i <= installments; i++) {
          const receiptDate = addDays(salePayload.saleDate, i * 30);
          const feeAmount = (installmentAmount * feePercent) / 100;
          const netAmount = installmentAmount - feeAmount;

          await createTransactionInternal({
            idTenant, idBranch, batch,
            payload: {
              type: "sale",
              saleType: detectSaleType(items),
              source: "contract",
              amount: netAmount, // Valor que realmente entra
              grossAmount: installmentAmount,
              feeAmount,
              date: toISODate(receiptDate),
              category: "Venda",
              description: `Venda ${saleCode} (Parcela ${i}/${installments})`,
              idSale: saleRef.id,
              idClient: data.idClient || null,
              method,
              metadata: { ...payment, installment: i, totalInstallments: installments, uid },
            },
          });
        }
      } else {
        // Caso normal (Dinheiro, Pix, Débito ou Crédito Antecipado/À Vista)
        let receiptDate = salePayload.saleDate;
        let feeAmount = 0;

        if (isCard && acquirerConfig) {
          const days = Number(acquirerConfig.receiptDays || 1);
          receiptDate = toISODate(addDays(salePayload.saleDate, days));

          let feePercent = 0;
          if (method === "debito") {
            feePercent = Number(acquirerConfig.debitFeePercent || 0);
          } else if (method === "credito") {
            if (installments === 1) {
              feePercent = Number(acquirerConfig.creditOneShotFeePercent || 0);
            } else {
              const instFee = (acquirerConfig.installmentFees || []).find(f => Number(f.installments) === installments);
              feePercent = Number(instFee?.feePercent || 0);
            }
            // Se antecipar, somar taxa extra de antecipação
            if (acquirerConfig.anticipateReceivables) {
              feePercent += Number(acquirerConfig.anticipationFeePercent || 0) * installments;
            }
          }
          feeAmount = (amount * feePercent) / 100;
          console.log(`[saveSale] Standard transaction: method=${method}, installments=${installments}, feePercent=${feePercent}%, feeAmount=${feeAmount}`);
        }

        const netAmount = amount - feeAmount;

        await createTransactionInternal({
          idTenant,
          idBranch,
          batch,
          payload: {
            type: "sale",
            saleType: detectSaleType(items),
            source: "contract",
            amount: netAmount, // Valor que realmente entra (Líquido)
            grossAmount: amount,
            feeAmount,
            date: receiptDate,
            category: "Venda",
            description: `Venda ${saleCode}`,
            idSale: saleRef.id,
            idClient: data.idClient || null,
            method,
            metadata: {
              ...payment,
              receiptDate,
              idAcquirer,
              acquirerName: acquirerConfig?.name || payment.acquirer,
              uid,
            },
          },
        });
      }
    }
  }

  // 5. Processar Recebíveis (Se houver saldo devedor)
  const pending = Number(data.totals?.pending || 0);

  if (isNew && pending > 0) {

    await createReceivableInternal({
      idTenant,
      idBranch,
      batch,
      uid,
      userToken: token,
      payload: {
        idSale: saleRef.id,
        idClient: data.idClient || null,
        amount: Number(data.totals.pending),
        dueDate: dueDate || toISODate(new Date()),
        status: "open",
        description: `Saldo venda ${saleCode}`,
      },
    });
  }

  // 6. Processar Crédito (Se houver troco/crédito gerado)
  if (isNew && Number(data.totals?.creditGenerated || 0) > 0 && data.idClient) {
    await addClientCreditInternal({
      idTenant,
      idBranch,
      idClient: data.idClient,
      batch,
      uid,
      userToken: token,
      payload: {
        idSale: saleRef.id,
        amount: Number(data.totals.creditGenerated),
        description: "Saldo credor gerado na venda",
      },
    });
  }

  try {
    await batch.commit();

    // Auditoria
    if (isNew) {
      try {
        const clientName = data.clientName || (data.client?.name) || (data.client ? `${data.client?.firstName || ''} ${data.client?.lastName || ''}`.trim() : null);
        const staffName = token?.name || token?.email || uid;

        const saleType = detectSaleType(items);
        await saveAuditLog({
          idTenant, idBranch, uid,
          userName: staffName,
          action: "SALE_CREATE",
          targetId: saleRef.id,
          description: `Nova venda realizada (${saleCode}). Total: ${salePayload.totals.net}`,
          metadata: {
            idClient: data.idClient,
            clientName: clientName,
            items: Array.isArray(items) ? items.map(i => ({ type: i.itemType || i.type, name: i.name || i.description })) : []
          }
        });

        // Se houver contrato na venda, logamos também a criação do contrato para visibilidade clara no log
        const contractItems = Array.isArray(items) ? items.filter(i => i.itemType === "contract" || i.type === "contract") : [];
        if (contractItems.length > 0) {
          for (const item of contractItems) {
            await saveAuditLog({
              idTenant, idBranch, uid,
              userName: staffName,
              action: "CLIENT_CONTRACT_CREATE",
              targetId: data.idClient,
              description: `Contrato criado via venda ${saleCode}: ${item.name || item.description}`,
              metadata: {
                idSale: saleRef.id,
                idClient: data.idClient,
                clientName: clientName
              }
            });
          }
        }
        // Se houver saldo devedor na venda, logamos também a criação do recebível
        if (isNew && Number(data.totals?.pending || 0) > 0) {
          await saveAuditLog({
            idTenant, idBranch, uid,
            userName: staffName,
            action: "FINANCIAL_RECEIVABLE_ADD",
            targetId: saleRef.id,
            description: `Saldo devedor gerado via venda ${saleCode}: R$ ${Number(data.totals.pending).toFixed(2)}`,
            metadata: {
              idSale: saleRef.id,
              idClient: data.idClient,
              clientName: clientName,
              amount: Number(data.totals.pending)
            }
          });
        }
      } catch (auditError) {
        console.error("Falha silenciosa na auditoria da venda:", auditError);
      }
    }

    return {
      id: saleRef.id,
      saleCode,
      ...salePayload,
    };
  } catch (error) {
    console.error("Erro ao salvar venda:", error);
    throw new functions.https.HttpsError("internal", "Erro ao processar venda.");
  }
});
