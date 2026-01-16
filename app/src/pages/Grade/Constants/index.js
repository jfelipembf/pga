export const GRID_START_MINUTES = 360 // 06:00
export const GRID_END_MINUTES = 1380 // 23:00

export const VIEW_OPTIONS = [
    { id: "day", label: "Dia" },
    { id: "week", label: "Semana" },
]

export const TURN_OPTIONS = [
    { id: "all", label: "Todos" },
    { id: "morning", label: "Manhã" },
    { id: "afternoon", label: "Tarde" },
    { id: "night", label: "Noite" },
]

export const isMinutesInTurn = (turn, minutes) => {
    if (!turn || turn === "all") return true
    const hour = minutes / 60
    if (turn === "morning") return hour < 12
    if (turn === "afternoon") return hour >= 12 && hour < 18
    if (turn === "night") return hour >= 18
    return true
}
