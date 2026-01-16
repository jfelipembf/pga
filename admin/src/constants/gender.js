export const GENDER = {
    MALE: {
        value: "male",
        label: "Masculino",
    },
    FEMALE: {
        value: "female",
        label: "Feminino",
    },
    OTHER: {
        value: "other",
        label: "Outro",
    },
}

export const getGenderLabel = (genderValue) => {
    const gender = Object.values(GENDER).find((g) => g.value === genderValue)
    return gender ? gender.label : genderValue
}
