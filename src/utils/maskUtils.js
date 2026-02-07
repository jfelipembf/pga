/**
 * Utilitários de Máscaras e Formatação de Inputs
 * Centraliza a lógica de tratamento de dados enquanto o usuário digita.
 */

/**
 * Máscara de CPF (000.000.000-00)
 */
export const maskCPF = (value) => {
    if (!value) return ""
    return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .substring(0, 14)
}

/**
 * Máscara de Telefone Celular/Fixo (00) 00000-0000
 */
export const maskPhone = (value) => {
    if (!value) return ""
    const numbers = value.replace(/\D/g, "")

    if (numbers.length <= 10) {
        // Fixo: (00) 0000-0000
        return numbers
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2")
            .substring(0, 14)
    } else {
        // Celular: (00) 00000-0000
        return numbers
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2")
            .substring(0, 15)
    }
}

/**
 * Máscara de CEP (00000-000)
 */
export const maskCEP = (value) => {
    if (!value) return ""
    return value
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 9)
}

/**
 * Máscara de CNPJ (00.000.000/0000-00)
 */
export const maskCNPJ = (value) => {
    if (!value) return ""
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 18)
}

/**
 * Máscara para Moeda (R$ 0,00)
 * Transforma centavos em valor decimal formatado durante a digitação.
 */
export const maskCurrency = (value) => {
    if (value === undefined || value === null) return ""

    let v = String(value).replace(/\D/g, "")
    v = (Number(v) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    })
    return v
}

/**
 * Remove toda a formatação (apenas números)
 */
export const unmask = (value) => {
    if (!value) return ""
    return value.replace(/\D/g, "")
}
