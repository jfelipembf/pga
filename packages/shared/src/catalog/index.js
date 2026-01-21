const { z } = require("../zod-setup");

const ProductSchema = z.object({
    name: z.string().min(1, "Nome do produto é obrigatório"),
    description: z.string().optional(),
    price: z.number().min(0).default(0),
    cost: z.number().min(0).default(0),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    stock: z.number().min(0).default(0),
    category: z.string().default("Geral"),
    active: z.boolean().default(true),
    photo: z.string().optional()
});

const ServiceSchema = z.object({
    name: z.string().min(1, "Nome do serviço é obrigatório"),
    description: z.string().optional(),
    price: z.number().min(0).default(0),
    durationMinutes: z.number().min(1).default(60),
    category: z.string().default("Geral"),
    active: z.boolean().default(true),
    photo: z.string().optional()
});

const buildProductPayload = (data) => {
    return {
        name: data.name || "Produto",
        description: data.description || "",
        price: Number(data.price || 0),
        cost: Number(data.cost || 0),
        sku: data.sku || "",
        barcode: data.barcode || "",
        stock: Number(data.stock || 0),
        category: data.category || "Geral",
        active: data.active !== false,
        photo: data.photo || ""
    };
};

const buildServicePayload = (data) => {
    return {
        name: data.name || "Serviço",
        description: data.description || "",
        price: Number(data.price || 0),
        durationMinutes: Number(data.durationMinutes || 60),
        category: data.category || "Geral",
        active: data.active !== false,
        photo: data.photo || ""
    };
};

module.exports = {
    ProductSchema,
    ServiceSchema,
    buildProductPayload,
    buildServicePayload
};
