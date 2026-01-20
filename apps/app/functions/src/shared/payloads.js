const { toISODate } = require("../helpers/date");

/**
 * ============================================================================
 * SHARED PAYLOAD HELPERS
 * ____________________________________________________________________________
 * 
 * Este arquivo contém APENAS helpers genéricos usados por múltiplos módulos.
 * Payloads específicos devem estar em seus respectivos módulos:
 * 
 * - clients/helpers/clients.payloads.js
 * - sales/helpers/sales.payloads.js
 * - financial/helpers/financial.payloads.js
 * - staff/helpers/staff.payloads.js
 * - contracts/helpers/contracts.payloads.js
 * - clientContracts/helpers/clientContracts.payloads.js
 * 
 * ============================================================================
 */

/**
 * Constrói objeto de endereço padronizado
 * Helper genérico usado por múltiplos módulos
 */
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

exports.buildAddress = buildAddress;

/**
 * Deriva nome completo a partir de firstName/lastName ou name
 * Helper genérico usado por múltiplos módulos
 */
const deriveFullName = (data) => {
    const { firstName, lastName, name } = data;
    return name || [firstName, lastName].filter(Boolean).join(" ").trim();
};

exports.deriveFullName = deriveFullName;

/**
 * Normaliza photo/avatar field
 * Helper genérico usado por múltiplos módulos
 */
exports.normalizePhoto = (data, currentData = null) => {
    if (data.photo !== undefined) return data.photo || null;
    if (data.avatar !== undefined) return data.avatar || null;
    return (currentData?.photo || currentData?.avatar) ?? null;
};
