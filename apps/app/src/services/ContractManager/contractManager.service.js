import { validateContractDates as validateContractDatesCore } from "@pga/shared"


export const validateContractDates = (clientId, startDate, endDate) => validateContractDatesCore(clientId, startDate, endDate)
