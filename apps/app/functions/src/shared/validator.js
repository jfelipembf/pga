const functions = require("firebase-functions/v1");
const { z } = require("zod");

/**
 * Validates data against a Zod schema.
 * Throws HttpsError('invalid-argument') if validation fails.
 * 
 * @param {z.ZodSchema} schema - The Zod schema to validate against.
 * @param {any} data - The data to validate.
 * @returns {any} The parsed/transformed data.
 */
const validate = (schema, data) => {
    const result = schema.safeParse(data);

    if (!result.success) {
        // Safely handle errors - result.error.errors may be undefined in some edge cases
        const errors = result.error?.errors || result.error?.issues || [];
        const errorMessages = Array.isArray(errors) && errors.length > 0
            ? errors.map((err) => `${err.path?.join(".") || "root"}: ${err.message}`).join(", ")
            : result.error?.message || "Erro de validação desconhecido";

        console.error("Validation Error:", errorMessages, "Data:", JSON.stringify(data, null, 2));
        throw new functions.https.HttpsError("invalid-argument", `Dados inválidos: ${errorMessages}`);
    }

    return result.data;
};

module.exports = { validate };
