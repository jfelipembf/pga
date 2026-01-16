import { httpsCallable } from "firebase/functions"
import { requireFunctions } from "../_core/functions"
import { requireBranchContext } from "../_core/context"
import { buildContractPayload } from "../payloads"

/**
 * Creates a new contract via Cloud Function.
 * @param {Object} data - The contract data.
 */
export const createContract = async (data) => {
    const functions = requireFunctions()
    const { idTenant, idBranch } = requireBranchContext()

    const createContractFn = httpsCallable(functions, "createContract")

    try {
        const payload = buildContractPayload(data)
        const result = await createContractFn({
            ...payload,
            idTenant,
            idBranch,
        })
        return result.data
    } catch (error) {
        console.error("Erro ao criar contrato via função:", error)
        throw error
    }
}

/**
 * Updates an existing contract via Cloud Function.
 * @param {string} idContract - The contract ID.
 * @param {Object} data - The data to update.
 */
export const updateContract = async (idContract, data) => {
    if (!idContract) throw new Error("idContract é obrigatório")

    const functions = requireFunctions()
    const { idTenant, idBranch } = requireBranchContext()

    const updateContractFn = httpsCallable(functions, "updateContract")

    try {
        const payload = buildContractPayload(data)
        const result = await updateContractFn({
            idContract,
            ...payload,
            idTenant,
            idBranch,
        })
        return result.data
    } catch (error) {
        console.error("Erro ao atualizar contrato via função:", error)
        throw error
    }
}
