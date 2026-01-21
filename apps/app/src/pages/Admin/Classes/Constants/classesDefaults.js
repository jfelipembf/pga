export const CLASS_FORM_DEFAULTS = {
  idActivity: "",
  idStaff: "",
  idArea: "",
  weekday: null,
  startTime: "",
  durationMinutes: "",
  endTime: "",
  maxCapacity: "",
  startDate: "",
  endDate: "",
}

export const createEmptyClassForm = () => ({ ...CLASS_FORM_DEFAULTS })
