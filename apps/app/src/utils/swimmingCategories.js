
export const SWIMMING_CATEGORIES = [
    { name: "Pre-Mirim", min: 0, max: 8 },
    { name: "Mirim", min: 9, max: 10 },
    { name: "Petiz", min: 11, max: 12 },
    { name: "Infantil", min: 13, max: 14 },
    { name: "Juvenil", min: 15, max: 16 },
    { name: "Junior", min: 17, max: 19 },
    { name: "Senior", min: 20, max: 24 },
    { name: "Master", min: 25, max: 120 },
]

export const getCategory = (birthDate) => {
    if (!birthDate) return "Sem Categoria"

    // Calculate age based on current year (Swimming standard usually considers the year)
    // Age = Current Year - Birth Year
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()

    const category = SWIMMING_CATEGORIES.find(c => age >= c.min && age <= c.max)
    return category ? category.name : "Master"
}

export const calculateAge = (birthDate) => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    return today.getFullYear() - birth.getFullYear()
}
