
export const RATE_PRESETS = {
    STANDARD: {
        name: 'Taxas de Mercado (Padrão)',
        debit: 1.49,
        cc1x: 3.19,
        cc2x: 4.59,
        cc3x: 5.19,
        cc4x: 5.79,
        cc5x: 6.39,
        cc6x: 6.99,
        cc7x: 7.99,
        cc8x: 8.59,
        cc9x: 9.19,
        cc10x: 9.79,
        cc11x: 10.39,
        cc12x: 10.99
    },
    PREMIUM: {
        name: 'Taxas Premium/Corporativo',
        debit: 1.99,
        cc1x: 3.89,
        cc2x: 5.29,
        cc3x: 5.89,
        cc4x: 6.49,
        cc5x: 7.09,
        cc6x: 7.69,
        cc7x: 8.69,
        cc8x: 9.29,
        cc9x: 9.89,
        cc10x: 10.49,
        cc11x: 11.09,
        cc12x: 11.69
    },
    LOW_COST: {
        name: 'Taxas Personalizadas (Visa/Master)',
        debit: 0.84,
        cc1x: 1.71,
        // Parcelado 2x a 6x = 1.72%
        cc2x: 1.72,
        cc3x: 1.72,
        cc4x: 1.72,
        cc5x: 1.72,
        cc6x: 1.72,
        // Parcelado 7x a 12x = 1.91%
        cc7x: 1.91,
        cc8x: 1.91,
        cc9x: 1.91,
        cc10x: 1.91,
        cc11x: 1.91,
        cc12x: 1.91
    },
    ANTECIPACAO: {
        name: 'Plano com Antecipação (D+1)',
        debit: 0.80, // Visa/Master Débito
        cc1x: 2.35,  // Crédito à Vista
        cc2x: 3.63,
        cc3x: 4.23,
        cc4x: 4.83,
        cc5x: 5.43,
        cc6x: 6.03,
        cc7x: 6.45,
        cc8x: 7.05,
        cc9x: 7.65,
        cc10x: 8.25,
        cc11x: 8.85,
        cc12x: 9.45
    }
}

// Helper to generate fee structure for any installment count
export const calculateFee = (preset, installment) => {
    const market = RATE_PRESETS[preset] || RATE_PRESETS.STANDARD

    if (installment === 'debit') return market.debit

    const instNum = parseInt(installment)
    if (isNaN(instNum)) return 0

    const key = `cc${instNum}x`
    if (market[key] !== undefined) return market[key]

    // Extrapolate for > 12x
    return parseFloat((market.cc12x + (instNum - 12) * 0.7).toFixed(2))
}

export const BASIC_BRANDS = [
    { id: 'visa', label: 'Visa', icon: 'fab fa-cc-visa fa-2x text-primary' },
    { id: 'mastercard', label: 'Mastercard', icon: 'fab fa-cc-mastercard fa-2x text-warning' },
    { id: 'elo', label: 'Elo', icon: 'fas fa-credit-card fa-2x text-dark' },
    { id: 'hipercard', label: 'Hipercard', icon: 'fas fa-credit-card fa-2x text-danger' },
    { id: 'amex', label: 'Amex', icon: 'fab fa-cc-amex fa-2x text-info' },
    { id: 'banese', label: 'Banese', icon: 'fas fa-credit-card fa-2x text-success' }
]
