import { httpsCallable } from "firebase/functions"
import { getFirebaseFunctions } from "../../helpers/firebase_helper"
import { requireBranchContext } from "./context"

export const getFunctions = () => {
    const fns = getFirebaseFunctions()
    if (!fns) {
        console.warn("Firebase Functions não inicializado")
        return null
    }
    return fns
}

export const requireFunctions = () => {
    const fns = getFunctions()
    if (!fns) throw new Error("Firebase Functions não inicializado")
    return fns
}

/**
 * Generic helper to call Cloud Functions with automatic context injection.
 * 
 * @param {string} functionName - Name of the Cloud Function to call
 * @param {object} payload - Data to send to the function
 * @param {object} options - Configuration options
 * @param {boolean} options.contextRequired - Whether tenant/branch context is required (default: true)
 * @param {object} options.ctxOverride - Override context (for public functions or special cases)
 * @returns {Promise<any>} The function result data
 */
export const callFunction = async (functionName, payload = {}, options = {}) => {
    const { contextRequired = true, ctxOverride = null } = options

    const functions = requireFunctions()
    const ctx = ctxOverride || (contextRequired ? requireBranchContext() : {})

    if (contextRequired && (!ctx?.idTenant || !ctx?.idBranch)) {
        throw new Error("Contexto de tenant/unidade não encontrado.")
    }

    const fn = httpsCallable(functions, functionName)

    try {
        const result = await fn({
            idTenant: ctx.idTenant,
            idBranch: ctx.idBranch,
            ...payload
        })
        return result.data
    } catch (error) {
        console.error(`Erro ao executar ${functionName}:`, error)
        throw error
    }
}
