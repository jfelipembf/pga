export const CLASS_FORM_DEFAULTS = {
  idActivity: "",
  idStaff: "",
  idArea: "",
  weekDays: [],
  startTime: "",
  durationMinutes: "",
  endTime: "",
  maxCapacity: "",
  startDate: "",
  endDate: "",
}

export const createEmptyClassForm = () => ({ ...CLASS_FORM_DEFAULTS })
