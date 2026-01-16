const admin = require("firebase-admin");
const db = admin.firestore();
const { FieldValue } = require("firebase-admin/firestore");
const { generateEntityId } = require("../../shared/id");
const { createTransactionInternal } = require("../../financial/transactions");
const { buildClientContractPayload } = require("../../shared/payloads");
const { toISODate } = require("../../helpers/date");
const { getContractsColl } = require("./utils");

/**
 * ============================================================================
 * CLIENT CONTRACT SERVICE
 * ____________________________________________________________________________
 *
 * 1. createClientContractInternal: Lógica interna para criação de contratos.
 *
 * ============================================================================
 */

/**
 * Função interna para criar um contrato de cliente.
 */
const createClientContractInternal = async ({ idTenant, idBranch, uid, data, batch, token }) => {
    // 1. Validar Datas
    const todayStr = toISODate(new Date());
    if (data.endDate && data.startDate && data.endDate <= data.startDate) {
        throw new Error("Data de fim deve ser posterior à data de início.");
    }

    // 2. Gerar código do contrato
    const contractCode = await generateEntityId(idTenant, idBranch, "contract", { sequential: true });

    const rawPayload = buildClientContractPayload({
        ...data,
        contractCode,
        contractTitle: data.contractTitle || data.title || null,
    });

    const payload = {
        ...rawPayload,
        idTenant,
        idBranch,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
    };

    const contractsRef = getContractsColl(idTenant, idBranch);
    const contractDocRef = contractsRef.doc();

    const internalBatch = batch || db.batch();
    internalBatch.set(contractDocRef, payload);

    // Financeiro
    if (!data.idSale && Number(data.value) > 0) {
        try {
            await createTransactionInternal({
                idTenant,
                idBranch,
                batch: internalBatch,
                payload: {
                    type: "sale",
                    saleType: "contract",
                    source: "contract",
                    amount: Number(data.value),
                    date: toISODate(new Date()),
                    category: "Venda",
                    description: `Contrato ${contractCode} - ${data.contractTitle || "Sem título"}`,
                    idContract: contractDocRef.id,
                    idClient: data.idClient,
                    method: data.paymentMethod || "Outros",
                    metadata: {
                        contractType: data.contractTitle || "generic",
                        startDate: data.startDate,
                        endDate: data.endDate,
                        idSale: data.idSale || null,
                        registeredBy: token?.name || token?.email || "user",
                        uid,
                    },
                },
            });
        } catch (err) {
            console.error("Falha ao preparar receita do contrato (ignorado):", err);
        }
    }

    // Atualizar status do cliente para "active"
    const clientRef = db.collection("tenants").doc(idTenant).collection("branches").doc(idBranch).collection("clients").doc(data.idClient);
    internalBatch.update(clientRef, {
        status: "active",
        updatedAt: FieldValue.serverTimestamp(),
    });

    if (!batch) {
        await internalBatch.commit();
    }

    return {
        id: contractDocRef.id,
        ...payload,
    };
};

module.exports = {
    createClientContractInternal,
};
