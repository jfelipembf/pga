const { buildAddress } = require("../../shared/payloads");

/**
 * Constrói o payload padronizado para criação/atualização de cliente
 */
exports.buildClientPayload = (data) => {
    const {
        firstName,
        lastName,
        name,
        email,
        phone,
        birthDate,
        gender,
        document,
        status,
        funnel
    } = data;

    const fullName = name || [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
        firstName: firstName || "",
        lastName: lastName || "",
        name: fullName,
        email: email || "",
        phone: phone || "",
        birthDate: birthDate || null,
        gender: gender || "",
        document: document || "",
        address: buildAddress(data),
        photo: data.photo || "",
        status: status || "lead",
        funnel: funnel || {}
    };
};

/**
 * Deriva o nome completo a partir de firstName/lastName ou name
 */
exports.deriveFullName = (data) => {
    const { firstName, lastName, name } = data;
    return name || [firstName, lastName].filter(Boolean).join(" ").trim();
};
