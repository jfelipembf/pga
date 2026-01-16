import { parseDate, getToday } from "../../../helpers/date"

export const buildContractKey = (contract, index = 0) => {
    const id = contract.id
    return `${id}-${index}-${contract.contractCode || ""}`.replace(/\s+/g, "-")
}

export const getContractName = contract =>
    contract?.contractTitle || contract?.name || contract?.title || contract?.plan || "Contrato"

export const computeRemainingDays = contract => {
    if (!contract) return null
    const endDate = parseDate(contract.endDate)
    if (!endDate || Number.isNaN(endDate.getTime())) return null
    const today = getToday()
    const diffMs = endDate.getTime() - today.getTime()
    if (diffMs <= 0) return 0
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export const getSuspensionDaysRemaining = (contract) => {
    if (!contract?.allowSuspension) return null
    const max = Number(contract?.suspensionMaxDays || 0)
    if (!max) return null
    const used = Number(contract?.totalSuspendedDays || 0)
    return Math.max(max - used, 0)
}
