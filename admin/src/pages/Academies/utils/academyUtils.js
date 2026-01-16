/**
 * Format phone number to E.164 standard.
 * @param {string} phone 
 * @returns {string}
 */
export const formatToE164 = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
};
