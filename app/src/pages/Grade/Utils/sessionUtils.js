import { getStartOfWeekSunday } from "./dateUtils"

/**
 * Verifica se estamos na penúltima semana disponível e, portanto,
 * se devemos gerar mais sessões.
 */
export const needsMoreSessions = (sessions = [], referenceDate = new Date()) => {
  if (!sessions.length) return { shouldGenerate: false, fromDate: null, classesNeeding: [], latestByClass: {} }

  const { latestByClass } = computeLatestSessionByClass(sessions)
  const weekStart = getStartOfWeekSunday(referenceDate)

  const classesNeeding = []
  Object.entries(latestByClass).forEach(([idClass, latestDateStr]) => {
    if (!latestDateStr) return
    const latest = new Date(latestDateStr)
    const latestWeek = getStartOfWeekSunday(latest)
    const penultimate = new Date(latestWeek)
    penultimate.setDate(penultimate.getDate() - 7)
    if (weekStart >= penultimate) {
      classesNeeding.push({ idClass, fromDate: latestDateStr })
    }
  })

  const fromDate = classesNeeding.length ? classesNeeding.map(c => c.fromDate).sort()[0] : null
  return {
    shouldGenerate: classesNeeding.length > 0,
    fromDate,
    classesNeeding,
    latestByClass,
  }
}

/**
 * Retorna o menor maxDate entre as turmas e um map de último dia por turma.
 */
export const computeLatestSessionByClass = (sessions = []) => {
  const latestByClass = {}
  sessions.forEach(s => {
    const idClass = s.idClass || s.idActivity
    const date = s.sessionDate
    if (!idClass || !date) return
    if (!latestByClass[idClass] || date > latestByClass[idClass]) {
      latestByClass[idClass] = date
    }
  })
  const allDates = Object.values(latestByClass).filter(Boolean).sort()
  const minLatest = allDates.length ? allDates[0] : null
  return { latestByClass, minLatest }
}
