import { getFirebaseFunctions } from "../../helpers/firebase_helper"

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
