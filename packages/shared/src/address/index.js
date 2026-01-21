const { z } = require("../zod-setup");



const AddressSchema = z.object({
    street: z.string().default(""),
    number: z.string().default(""),
    complement: z.string().default(""),
    neighborhood: z.string().default(""),
    city: z.string().default(""),
    state: z.string().default(""),
    zip: z.string().default("")
});

const buildAddress = (data) => {
    let source = data;
    let street = "";

    if (data.address && typeof data.address === 'object') {
        source = { ...data, ...data.address };
        street = source.street || source.address || "";
    } else {
        street = data.street || data.address || "";
    }

    if (typeof street === 'object') street = "";

    return {
        street: street,
        number: source.number || "",
        complement: source.complement || "",
        neighborhood: source.neighborhood || "",
        city: source.city || "",
        state: source.state || "",
        zip: source.zip || ""
    };
};

module.exports = {
    AddressSchema,
    buildAddress
};
