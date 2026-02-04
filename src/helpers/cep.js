export const fetchAddressByCEP = async (cep) => {
    try {
        const cleanCEP = cep.replace(/\D/g, '')
        
        if (cleanCEP.length !== 8) {
            throw new Error('CEP inválido')
        }

        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
        const data = await response.json()

        if (data.erro) {
            throw new Error('CEP não encontrado')
        }

        return {
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
            zipCode: cleanCEP
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        throw error
    }
}

export const formatCEP = (cep) => {
    const cleanCEP = cep.replace(/\D/g, '')
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
}

// Aliases for compatibility
export const normalizeCep = formatCEP
export const fetchAddressByCep = fetchAddressByCEP
