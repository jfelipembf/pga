const { z } = require("../zod-setup");
const { AddressSchema, buildAddress } = require("../address");
const { deriveFullName, sanitizeDate } = require("../common");

const ClientStatus = {
    LEAD: 'lead',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked'
};

const ClientSchema = z.object({
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    name: z.string().default(""),
    email: z.string().email("Email inválido").or(z.literal("")).default(""),
    phone: z.string().default(""),
    birthDate: z.preprocess(sanitizeDate, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null)),
    gender: z.string().default(""),
    document: z.string().default(""),
    status: z.nativeEnum(ClientStatus).default(ClientStatus.LEAD),
    photo: z.string().default(""),
    funnel: z.record(z.any()).default({}),
    address: AddressSchema.default({}),
}).passthrough();

const buildClientPayload = (data) => {
    const firstName = data.firstName || "";
    const lastName = data.lastName || "";
    const name = deriveFullName({ firstName, lastName, name: data.name });

    return {
        firstName,
        lastName,
        name,
        email: data.email || "",
        phone: data.phone || "",
        birthDate: sanitizeDate(data.birthDate),
        gender: data.gender || "",
        document: data.document || "",
        status: data.status || ClientStatus.LEAD,
        photo: data.photo || "",
        funnel: data.funnel || {},
        address: buildAddress(data)
    };
};

module.exports = {
    ClientStatus,
    ClientSchema,
    buildClientPayload
};
