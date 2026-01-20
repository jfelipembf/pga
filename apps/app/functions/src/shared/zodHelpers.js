const { z } = require("zod");

/**
 * Helpers para schemas Zod padronizados
 */

/**
 * String opcional que aceita null, undefined ou string vazia
 */
const optionalString = () => z.string().nullable().optional();

/**
 * String obrigatória (não aceita null ou undefined)
 */
const requiredString = () => z.string().min(1, "Campo obrigatório");

/**
 * Número opcional que aceita null, undefined ou número
 * Converte automaticamente strings para números
 */
const optionalNumber = (defaultValue = 0) =>
    z.preprocess((v) => {
        if (v === null || v === undefined || v === "") return defaultValue;
        return Number(v);
    }, z.number().default(defaultValue));

/**
 * Número obrigatório (não aceita null ou undefined)
 * Converte automaticamente strings para números
 */
const requiredNumber = () =>
    z.preprocess((v) => Number(v), z.number());

/**
 * Boolean opcional que aceita null, undefined ou boolean
 */
const optionalBoolean = (defaultValue = false) =>
    z.boolean().default(defaultValue).optional();

/**
 * Data ISO opcional (YYYY-MM-DD)
 * Aceita null, undefined ou string no formato ISO
 */
const optionalISODate = () =>
    z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)")
        .or(z.literal(""))
        .nullable()
        .optional();

/**
 * Array opcional que aceita null, undefined ou array
 */
const optionalArray = (itemSchema) =>
    z.array(itemSchema).nullable().optional().default([]);

module.exports = {
    optionalString,
    requiredString,
    optionalNumber,
    requiredNumber,
    optionalBoolean,
    optionalISODate,
    optionalArray,
};
