const { deriveFullName, normalizePhoto } = require("../../shared/payloads");

/**
 * Constrói o payload padronizado para criação/atualização de staff
 * @param {Object} data - Dados brutos do staff
 * @param {Object} currentData - Dados atuais (para updates)
 * @returns {Object} Payload sanitizado e validado
 */
exports.buildStaffPayload = (data, currentData = null) => {
    const {
        firstName,
        lastName,
        email,
        phone,
        role,
        roleId,
        status,
        isInstructor,
        gender,
        birthDate,
        address,
        hireDate,
        council,
        employmentType,
        salary,
    } = data;

    const displayName = deriveFullName({
        firstName: firstName ?? currentData?.firstName,
        lastName: lastName ?? currentData?.lastName
    });

    const photo = normalizePhoto(data, currentData);

    return {
        firstName: firstName ?? currentData?.firstName ?? "",
        lastName: lastName ?? currentData?.lastName ?? "",
        displayName,
        email: email ?? currentData?.email ?? "",
        phone: phone ?? currentData?.phone ?? null,
        role: role ?? currentData?.role ?? null,
        roleId: roleId ?? currentData?.roleId ?? null,
        status: status ?? currentData?.status ?? "active",
        photo,
        avatar: photo, // Keep both for backward compatibility
        isInstructor: isInstructor ?? currentData?.isInstructor ?? false,
        gender: gender ?? currentData?.gender ?? null,
        birthDate: birthDate ?? currentData?.birthDate ?? null,
        address: address ?? currentData?.address ?? null,
        hireDate: hireDate ?? currentData?.hireDate ?? null,
        council: council ?? currentData?.council ?? null,
        employmentType: employmentType ?? currentData?.employmentType ?? null,
        salary: salary ?? currentData?.salary ?? null,
    };
};
