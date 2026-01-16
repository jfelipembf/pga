import { normalizeDate, getToday, isDateBefore, parseFirestoreDate } from "../../helpers/date"

/**
 * Verifica se um cliente pode ter um novo contrato nas datas informadas
 * e sugere ajustes quando necessário.
 */
export const validateContractDates = async (clientId, startDate, endDate) => {
  if (!clientId || !startDate || !endDate) {
    return { canCreate: false, message: "clientId, startDate e endDate são obrigatórios" }
  }

  const newStartDate = normalizeDate(parseFirestoreDate(startDate))
  const newEndDate = normalizeDate(parseFirestoreDate(endDate))
  const today = getToday()

  if (isDateBefore(newStartDate, today)) {
    return {
      canCreate: false,
      message: "Data de início não pode ser anterior a hoje",
    }
  }

  if (newEndDate <= newStartDate) {
    return {
      canCreate: false,
      message: "Data de fim deve ser posterior à data de início",
    }
  }

  return { canCreate: true }
}

/**
 * Valida e ajusta datas de contrato para uso em formulários
 */
export const validateAndAdjustContractDates = async (clientId, startDate, endDate) => {
  try {
    const validation = await validateContractDates(clientId, startDate, endDate)

    if (!validation.canCreate) {
      return {
        valid: false,
        message: validation.message,
      }
    }

    return {
      valid: true,
      needsAdjustment: false,
    }
  } catch (error) {
    console.error("Erro ao validar datas do contrato:", error)
    return {
      valid: false,
      message: "Erro ao validar datas do contrato",
    }
  }
}

/**
 * Prepara dados do contrato com datas validadas
 */
export const prepareContractData = async (clientId, contractData) => {
  if (!clientId || !contractData) {
    throw new Error("clientId e contractData são obrigatórios")
  }

  const validation = await validateAndAdjustContractDates(
    clientId,
    contractData.startDate,
    contractData.endDate
  )

  if (!validation.valid) {
    throw new Error(validation.message)
  }

  return {
    ...contractData,
    startDate: contractData.startDate,
    endDate: contractData.endDate,
    dateAdjustmentNotice: null,
  }
}
