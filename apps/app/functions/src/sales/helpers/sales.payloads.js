const { toISODate } = require("../../helpers/date");
const asString = (val) => (val !== undefined && val !== null ? String(val) : null);

/**
 * Constrói o payload padronizado para criação/atualização de venda
 */
exports.buildSalePayload = (data) => {
    return {
        idClient: asString(data.idClient),
        clientName: data.clientName || null,
        idSeller: asString(data.idSeller || data.idStaff),
        idStaff: asString(data.idStaff),
        staffName: data.staffName || null,
        status: data.status || "open",
        grossAmount: Number(data.grossAmount || data.totals?.gross || 0),
        discountAmount: Number(data.discountAmount || data.totals?.discount || 0),
        netAmount: Number(data.netAmount || data.totals?.net || 0),
        date: data.date || data.saleDate || toISODate(new Date()),
        origin: data.origin || "manual",
    };
};

/**
 * Constrói o payload de um item de venda
 */
exports.buildSaleItemPayload = (data) => {
    return {
        itemType: data.itemType || "generic",
        description: data.description || "",
        name: data.name || data.description || "",
        value: Number(data.value || 0),
        quantity: Number(data.quantity || 1),
        idContract: asString(data.idContract),
        idProduct: asString(data.idProduct),
        idService: asString(data.idService),
    };
};

/**
 * Constrói o payload de um pagamento de venda
 */
exports.buildSalePaymentPayload = (data) => {
    return {
        type: data.type || data.method || "dinheiro",
        method: data.method || data.type || "dinheiro",
        amount: Number(data.amount || 0),
        installments: Number(data.installments || 1),
        cardAcquirer: data.cardAcquirer || null,
        cardBrand: data.cardBrand || null,
        cardAuthorization: data.cardAuthorization || null,
    };
};
