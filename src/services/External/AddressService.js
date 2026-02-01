import axios from "axios"

export const getAddressByCep = async (cep) => {
    if (!cep) return null
    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) return null

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`)
        if (response.data.erro) {
            return null
        }
        return response.data
    } catch (error) {
        console.error("Erro ao buscar CEP:", error)
        return null
    }
}
