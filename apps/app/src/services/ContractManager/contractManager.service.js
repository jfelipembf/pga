import { validateContractDates as validateContractDatesCore } from "../../validators/contracts/dates"


export const validateContractDates = (clientId, startDate, endDate) => validateContractDatesCore(clientId, startDate, endDate)
