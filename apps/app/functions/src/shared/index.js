/**
 * Backend Shared Utilities - Re-exports from @pga/shared package
 * 
 * Este arquivo re-exporta tudo do pacote @pga/shared (schemas, builders, utils)
 * para manter compatibilidade com imports relativos usados no backend.
 * 
 * IMPORTANTE: Esta pasta (functions/src/shared/) contém APENAS utilitários
 * específicos do backend (Firebase Admin SDK, auditoria, etc).
 * Todo o resto vem de packages/shared/ via @pga/shared.
 */

// Re-exportar TUDO de @pga/shared (schemas, builders, utils compartilhados)
module.exports = {
    ...require("@pga/shared"),
};
