import { calculateFee } from "../constants/AcquirerDefaults"

/**
 * Gera o objeto de taxas a partir de taxas existentes ou defaults
 * @param {Object} sourceFees - Taxas atuais (opcional)
 * @param {string} presetName - Nome do preset (STANDARD, PREMIUM, etc)
 * @param {number} startInstallment - Parcela inicial para loop
 * @param {number} endInstallment - Parcela final para loop
 * @returns {Object} Objeto de taxas formatado
 */
export const generateFees = (sourceFees = null, presetName = 'STANDARD', startInstallment = 2, endInstallment = 12) => {
    const newFees = {
        debitCard: sourceFees?.debitCard || calculateFee(presetName, 'debit'),
        creditCard1x: sourceFees?.creditCard1x || calculateFee(presetName, 1)
    }

    // Helper to safely get value: explicit > legacy range > default preset
    const getVal = (key, legacyRangeKey, instNum) => {
        if (sourceFees?.[key] !== undefined && sourceFees?.[key] !== null) {
            return sourceFees[key]
        }
        if (sourceFees?.[legacyRangeKey] !== undefined) {
            return sourceFees[legacyRangeKey]
        }
        // If no source fees, calculate from preset
        return !sourceFees ? calculateFee(presetName, instNum) : 0
    }

    for (let i = startInstallment; i <= endInstallment; i++) {
        // CORREÇÃO CRÍTICA: Removendo o espaço errado que existia antes (`creditCard${i} x`)
        const key = `creditCard${i}x`

        let legacy = null
        if (i >= 2 && i <= 6) legacy = 'creditCard2to6'
        if (i >= 7 && i <= 12) legacy = 'creditCard7to12'

        newFees[key] = getVal(key, legacy, i)
    }

    // Preserve extra keys if strictly migration
    if (sourceFees) {
        Object.keys(sourceFees).forEach(key => {
            if (key.startsWith('creditCard') && !newFees[key] && !['creditCard2to6', 'creditCard7to12'].includes(key)) {
                newFees[key] = sourceFees[key]
            }
        })
    }

    return newFees
}

/**
 * Calcula os valores iniciais do formulário (incluindo migração de dados antigos)
 */
export const calculateInitialValues = (initialData) => {
    let configs = []

    if (initialData?.rateConfigs && initialData.rateConfigs.length > 0) {
        // Already using new structure
        configs = initialData.rateConfigs
    } else if (initialData?.cardBrands || initialData?.fees) {
        // Migrate legacy structure to first config
        configs = [{
            id: 'default',
            name: 'Grupo Padrão',
            brands: initialData?.cardBrands || [],
            fees: generateFees(initialData?.fees, 'STANDARD'),
            maxInstallment: 12
        }]
    } else {
        // Fresh start - Create Examples
        configs = [
            {
                id: Date.now(),
                name: 'Grupo Padrão (Visa/Master)',
                brands: ['visa', 'mastercard', 'elo', 'hipercard', 'banese'],
                fees: generateFees(null, 'STANDARD'),
                maxInstallment: 12
            },
            {
                id: Date.now() + 1,
                name: 'Grupo Premium (Amex)',
                brands: ['amex'],
                fees: generateFees(null, 'PREMIUM'),
                maxInstallment: 12
            }
        ]
    }

    // Ensure maxInstallment is set for UI logic in each config
    configs = configs.map(c => {
        if (!c.maxInstallment) {
            let max = 12
            if (c.fees) {
                Object.keys(c.fees).forEach(k => {
                    if (k.startsWith('creditCard') && k.endsWith('x')) {
                        const num = parseInt(k.replace('creditCard', '').replace('x', ''))
                        if (!isNaN(num) && num > max) max = num
                    }
                })
            }
            c.maxInstallment = max
        }
        return c
    })

    return {
        name: initialData?.name || '',
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
        rateConfigs: configs
    }
}
