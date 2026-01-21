const { z } = require("../zod-setup");
const { sanitizeDate } = require("../common");

const SaleStatus = {
    OPEN: "open",
    COMPLETED: "completed",
    CANCELED: "canceled",
    REFUNDED: "refunded"
};

const SaleOrigin = {
    MANUAL: "manual",
    AB: "ab",
    CHECKOUT: "checkout",
    RECURRING: "recurring"
};

const SaleItemType = {
    PRODUCT: "product",
    SERVICE: "service",
    CONTRACT: "contract",
    GENERIC: "generic"
};

const SaleSchema = z.object({
    idClient: z.string().min(1, "ID do cliente é obrigatório"),
    idSeller: z.string().optional().nullable(),
    status: z.nativeEnum(SaleStatus).default(SaleStatus.OPEN),

    // Totals
    grossAmount: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    netAmount: z.number().min(0).default(0),

    date: z.string().or(z.date()).transform(val => sanitizeDate(val)),
    origin: z.nativeEnum(SaleOrigin).default(SaleOrigin.MANUAL),
});

const buildSalePayload = (data) => {
    return {
        idClient: data.idClient || null,
        clientName: data.clientName || null,
        idSeller: data.idSeller || data.idStaff || null,
        idStaff: data.idStaff || null,
        staffName: data.staffName || null,

        status: data.status || SaleStatus.OPEN,

        grossAmount: Number(data.grossAmount || data.totals?.gross || 0),
        discountAmount: Number(data.discountAmount || data.totals?.discount || 0),
        netAmount: Number(data.netAmount || data.totals?.net || 0),

        date: sanitizeDate(data.date || data.saleDate) || sanitizeDate(new Date()),
        origin: data.origin || SaleOrigin.MANUAL,
    };
};

const buildSaleItemPayload = (data) => {
    return {
        itemType: data.itemType || SaleItemType.GENERIC,
        description: data.description || "",
        name: data.name || data.description || "",

        value: Number(data.value || 0),
        quantity: Number(data.quantity || 1),

        idContract: data.idContract || null,
        idProduct: data.idProduct || null,
        idService: data.idService || null,
    };
};

const buildSalePaymentPayload = (data) => {
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

/**
 * Detecta o tipo de venda com base nos itens vendidos
 * @param {Array} items - Lista de itens da venda
 * @returns {string} - Tipo da venda: 'contract', 'service', 'product', 'enrollment', ou 'generic'
 */
const detectSaleType = (items) => {
    if (!items?.length) return "generic";

    // Verifica contratos
    if (items.some(item => item.idContract || item.type === "contract" || item.itemType === "contract")) {
        return "contract";
    }

    // Verifica serviços
    if (items.some(item => item.idService || item.type === "service" || item.itemType === "service")) {
        return "service";
    }

    // Verifica produtos
    if (items.some(item => item.idProduct || item.type === "product" || item.itemType === "product")) {
        return "product";
    }

    // Verifica matrículas/enrollments
    if (items.some(item => item.idClass || item.idActivity || item.type === "enrollment" || item.itemType === "enrollment")) {
        return "enrollment";
    }

    return "generic";
};

module.exports = {
    SaleStatus,
    SaleOrigin,
    SaleItemType,
    SaleSchema,
    buildSalePayload,
    buildSaleItemPayload,
    buildSalePaymentPayload,
    detectSaleType
};
