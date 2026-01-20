const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Shared Utilities
const { requireAuthContext } = require("../../shared/context");
const { saveAuditLog } = require("../../shared/audit");
const { getActorSnapshot, getTargetSnapshot } = require("../../shared/snapshots");
const { validate } = require("../../shared/validator"); // Validator
const { generateEntityId } = require("../../shared/id");
const { getBranchCollectionRef } = require("../../shared/references");
const { toISODate } = require("../../helpers/date");

// Schema
const { SaleSchema } = require("../validation/sales.validation");

// Internal Services
const { createTransactionInternal } = require("../../financial/transactions");
const { createReceivableInternal } = require("../../financial/receivables");
const { addClientCreditInternal } = require("../../financial/credits");
const { createClientContractInternal } = require("../../clientContracts/clientContracts");
const { processPayments } = require("../services/paymentProcessor");

const db = admin.firestore();

// Helper local
const detectSaleType = (items) => {
    if (!items || !items.length) return "generic";
    if (items.some((i) => i.itemType === "contract" || i.type === "contract")) return "contract";
    if (items.some((i) => i.itemType === "service" || i.type === "service")) return "service";
    if (items.some((i) => i.itemType === "product" || i.type === "product")) return "product";
    return "generic";
};

// =========================
// SAVE SALE (CREATE/UPDATE)
// =========================
async function saveSaleLogic(data, context) {
    const { idTenant, idBranch, uid, token } = requireAuthContext(data, context);

    // 1. Validation Layer
    const validatedData = validate(SaleSchema, data);

    // 2. Business Rules (Cashier Check)
    const sessionsRef = getBranchCollectionRef(idTenant, idBranch, "cashierSessions");
    const openSnapshot = await sessionsRef
        .where("status", "==", "open")
        .where("idStaff", "==", uid)
        .limit(1)
        .get();

    if (openSnapshot.empty) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Você não possui um caixa aberto. Por favor, abra o seu caixa antes de realizar vendas."
        );
    }

    try {
        // 3. Prepare IDs & Refs
        const salesColl = getBranchCollectionRef(idTenant, idBranch, "sales");
        let saleRef;
        let isNew = false;

        let saleCode = validatedData.saleCode;

        if (validatedData.idSale) {
            saleRef = salesColl.doc(validatedData.idSale);
        } else {
            saleRef = salesColl.doc(); // Auto-ID
            isNew = true;
        }

        if (isNew && !saleCode) {
            const saleType = detectSaleType(validatedData.items);
            saleCode = await generateEntityId(idTenant, idBranch, "sale", { subtype: saleType, sequential: true });
        }

        // 4. Build Payload
        // Re-calculate paid strictly from execution logic to avoid frontend manipulation
        const calculatedPaid = Array.isArray(validatedData.payments)
            ? validatedData.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
            : 0;

        const salePayload = {
            saleCode,
            idClient: validatedData.idClient || null,
            idEmployeeSale: validatedData.idStaff || uid, // Se não vier, assume quem está logado
            idStaff: validatedData.idStaff || uid,
            staffName: validatedData.staffName || "",

            saleDate: validatedData.saleDate || toISODate(new Date()),
            status: validatedData.status || "open",

            requiresEnrollment: Boolean(validatedData.requiresEnrollment),
            enrollmentStatus: validatedData.enrollmentStatus || "pending",

            totals: {
                ...validatedData.totals,
                paid: calculatedPaid, // Enforce backend calculation
                pending: Math.max(0, validatedData.totals.net - calculatedPaid), // Enforce pending
            },

            notes: validatedData.notes || "",
            idTenant,
            idBranch,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: uid,
        };

        if (isNew) {
            salePayload.createdAt = FieldValue.serverTimestamp();
            salePayload.createdBy = uid;
        }

        // 5. Batch Execution
        const batch = db.batch();

        // 5.1 Save Main Document
        batch.set(saleRef, salePayload, { merge: true });

        // 5.2 Save Items (Subcollection)
        if (Array.isArray(validatedData.items)) {
            const itemsRef = saleRef.collection("items");

            // Cleaning old items on update
            if (!isNew) {
                const existingItems = await itemsRef.get();
                existingItems.forEach((doc) => batch.delete(doc.ref));
            }

            for (const item of validatedData.items) {
                const newItemRef = itemsRef.doc();
                let createdContractId = null;

                // Automatic Contract Generation
                if (isNew && validatedData.idClient && (item.itemType === "contract" || item.type === "contract")) {
                    const contractRes = await createClientContractInternal({
                        idTenant, idBranch, uid, token, batch,
                        data: {
                            ...item,
                            idClient: validatedData.idClient,
                            contractTitle: item.name || item.description || "Contrato via Venda",
                            startDate: item.startDate || salePayload.saleDate,
                            endDate: item.endDate,
                            value: 0, // Accounting done here in sales
                            idSale: saleRef.id,
                            idSaleItem: newItemRef.id,
                            status: "active",
                        }
                    });
                    createdContractId = contractRes.id;
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

        // 5.3 Financial Processing (Payment Processor)
        if (isNew && Array.isArray(validatedData.payments) && validatedData.payments.length > 0) {
            const saleType = detectSaleType(validatedData.items);

            const saleTypeMap = {
                contract: "Venda de Contrato",
                service: "Venda de Serviço",
                product: "Venda de Produto",
                generic: "Venda Diversa"
            };
            const categoryName = saleTypeMap[saleType] || "Venda";

            const transactions = await processPayments({
                idTenant, idBranch, db,
                payments: validatedData.payments,
                saleDate: salePayload.saleDate,
                saleCode
            });

            for (const tx of transactions) {
                await createTransactionInternal({
                    idTenant, idBranch, batch,
                    payload: {
                        ...tx,
                        idSale: saleRef.id,
                        idClient: validatedData.idClient || null,
                        category: tx.category || categoryName,
                        source: "contract",
                        saleType,
                        metadata: { ...tx.metadata, uid }
                    }
                });
            }
        }

        // 5.4 Ensure Pending Debt (Receivables)
        const pendingValue = salePayload.totals.pending;
        if (isNew && pendingValue > 0.01) {
            await createReceivableInternal({
                idTenant, idBranch, batch, uid, userToken: token,
                payload: {
                    idSale: saleRef.id,
                    idClient: validatedData.idClient || null,
                    amount: pendingValue,
                    dueDate: validatedData.dueDate || toISODate(new Date()), // TODO: Add dueDate to Schema if needed
                    status: "open",
                    description: `Saldo venda ${saleCode}`,
                },
            });
        }

        // 5.5 Credit Generation
        if (isNew && Number(validatedData.totals.creditGenerated || 0) > 0 && validatedData.idClient) {
            await addClientCreditInternal({
                idTenant, idBranch, idClient: validatedData.idClient, batch, uid, userToken: token,
                payload: {
                    idSale: saleRef.id,
                    amount: Number(validatedData.totals.creditGenerated),
                    description: "Saldo credor gerado na venda",
                },
            });
        }

        // Commit Batch
        await batch.commit();

        // 6. Audit Log (Async)
        const actor = getActorSnapshot(context.auth);
        const target = getTargetSnapshot(
            "sale",
            {
                id: saleRef.id,
                code: saleCode,
                amount: salePayload.totals.net,
                client: validatedData.clientName
            },
            saleRef.id
        );

        await saveAuditLog({
            idTenant, idBranch,
            action: isNew ? "SALE_CREATE" : "SALE_UPDATE",
            actor, target,
            description: `${isNew ? "Criou" : "Atualizou"} venda ${saleCode} (R$ ${salePayload.totals.net})`,
            metadata: {
                itemsCount: validatedData.items?.length,
                paymentsCount: validatedData.payments?.length
            }
        }).catch(console.error);

        return {
            id: saleRef.id,
            saleCode,
            ...salePayload
        };

    } catch (error) {
        console.error("[saveSaleLogic] Erro:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError(
            "internal",
            "Erro interno ao salvar venda.",
            { message: error.message }
        );
    }
}

module.exports = {
    saveSaleLogic
};
