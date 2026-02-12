
/**
 * Mocks de Adquirentes Populares
 * Estrutura compatível com o AcquirerSchema.
 * As taxas são ilustrativas bases de mercado, mas podem ser editadas pelo usuário após a criação.
 */

// ITAU (Rede) - Com Antecipação
export const MOCK_ITAU = {
    name: 'ITAU',
    isActive: true,
    settlementDays: 1, // D+1 Antecipado

    rateConfigs: [
        {
            id: 'config_visa_master',
            name: 'Visa/Master',
            brands: ['visa', 'mastercard'],
            fees: {
                debitCard: 0.80,
                creditCard1x: 2.35,
                creditCard2x: 3.63,
                creditCard3x: 4.23,
                creditCard4x: 4.83,
                creditCard5x: 5.43,
                creditCard6x: 6.03,
                creditCard7x: 6.45,
                creditCard8x: 7.05,
                creditCard9x: 7.65,
                creditCard10x: 8.25,
                creditCard11x: 8.85,
                creditCard12x: 9.45
            }
        },
        {
            id: 'config_elo',
            name: 'Elo',
            brands: ['elo'],
            fees: {
                debitCard: 1.60, creditCard1x: 3.15,
                creditCard2x: 4.43, creditCard3x: 5.03, creditCard4x: 5.63, creditCard5x: 6.23,
                creditCard6x: 6.83, creditCard7x: 7.25, creditCard8x: 7.85, creditCard9x: 8.45,
                creditCard10x: 9.05, creditCard11x: 9.65, creditCard12x: 10.25
            }
        },
        {
            id: 'config_amex',
            name: 'Amex',
            brands: ['amex'],
            fees: {
                debitCard: 0, creditCard1x: 3.15,
                creditCard2x: 4.43, creditCard3x: 5.03, creditCard4x: 5.63, creditCard5x: 6.23,
                creditCard6x: 6.83, creditCard7x: 7.25, creditCard8x: 7.85, creditCard9x: 8.45,
                creditCard10x: 9.05, creditCard11x: 9.65, creditCard12x: 10.25
            }
        }
    ],

    standardFees: {
        debitCard: 0.84, creditCard1x: 1.71,
        creditCard2x: 1.72, creditCard3x: 1.72, creditCard4x: 1.72, creditCard5x: 1.72, creditCard6x: 1.72,
        creditCard7x: 1.91, creditCard8x: 1.91, creditCard9x: 1.91, creditCard10x: 1.91, creditCard11x: 1.91, creditCard12x: 1.91
    }
};

// CIELO - Configurada conforme Imagem (D+1)
export const MOCK_CIELO = {
    name: 'Cielo',
    isActive: true,
    settlementDays: 1, // Recebimento em 1 dia (Antecipado)
    rateConfigs: [
        {
            id: 'config_main',
            name: 'Padrão Cielo 1 Dia',
            brands: ['visa', 'mastercard', 'elo', 'hipercard'],
            fees: {
                debitCard: 1.99,
                creditCard1x: 3.49,
                creditCard2x: 4.04,
                creditCard3x: 4.90,
                creditCard4x: 5.60,
                creditCard5x: 6.37,
                creditCard6x: 7.06,
                creditCard7x: 8.00,
                creditCard8x: 8.71,
                creditCard9x: 9.38,
                creditCard10x: 10.11,
                creditCard11x: 10.82,
                creditCard12x: 11.51
            }
        }
    ]
};

// STONE - Padrão D+30
export const MOCK_STONE = {
    name: 'Stone',
    isActive: true,
    settlementDays: 30,
    rateConfigs: [
        {
            id: 'config_main',
            name: 'Padrão',
            brands: ['visa', 'mastercard', 'hipercard'],
            fees: {
                debitCard: 1.99,
                creditCard1x: 3.49,
                creditCard2x: 4.99,
                creditCard3x: 5.49,
                creditCard4x: 5.99,
                creditCard5x: 6.49,
                creditCard6x: 6.99,
                creditCard7x: 7.49,
                creditCard8x: 7.99,
                creditCard9x: 8.49,
                creditCard10x: 8.99,
                creditCard11x: 9.49,
                creditCard12x: 9.99
            }
        }
    ]
};

// PAGSEGURO - Padrão D+14
export const MOCK_PAGSEGURO = {
    name: 'PagSeguro',
    isActive: true,
    settlementDays: 14, // Padrão PagBank
    rateConfigs: [
        {
            id: 'config_main',
            name: 'Padrão',
            brands: ['visa', 'mastercard', 'elo', 'amex', 'hipercard'],
            fees: {
                debitCard: 1.99,
                creditCard1x: 4.99,
                creditCard2x: 5.59,
                creditCard3x: 5.59,
                creditCard4x: 5.59,
                creditCard5x: 5.59,
                creditCard6x: 5.59,
                creditCard7x: 5.59,
                creditCard8x: 5.59,
                creditCard9x: 5.59,
                creditCard10x: 5.59,
                creditCard11x: 5.59,
                creditCard12x: 5.59 // PagSeguro tem parcelado fixo geralmente
            }
        }
    ]
};

// GETNET - Padrão D+2
export const MOCK_GETNET = {
    name: 'Getnet',
    isActive: true,
    settlementDays: 2,
    rateConfigs: [
        {
            id: 'config_main',
            name: 'Padrão Santander',
            brands: ['visa', 'mastercard'],
            fees: {
                debitCard: 1.89,
                creditCard1x: 2.99,
                creditCard2x: 3.99,
                creditCard3x: 4.59,
                creditCard4x: 5.19,
                creditCard5x: 5.79,
                creditCard6x: 6.39,
                creditCard7x: 6.99,
                creditCard8x: 7.59,
                creditCard9x: 8.19,
                creditCard10x: 8.79,
                creditCard11x: 9.39,
                creditCard12x: 9.99
            }
        }
    ]
};

// MULVI - Configurada conforme Imagem (D+1)
export const MOCK_MULVI = {
    name: 'Mulvi Pay',
    isActive: true,
    settlementDays: 1, // Recebimento em 1 dia (Antecipado)
    rateConfigs: [
        {
            id: 'config_main',
            name: 'Padrão Mulvi 1 Dia',
            brands: ['visa', 'mastercard', 'elo', 'hipercard'],
            fees: {
                debitCard: 1.99,
                creditCard1x: 3.49,
                creditCard2x: 4.04,
                creditCard3x: 4.90,
                creditCard4x: 5.60,
                creditCard5x: 6.37,
                creditCard6x: 7.06,
                creditCard7x: 8.00,
                creditCard8x: 8.71,
                creditCard9x: 9.38,
                creditCard10x: 10.11,
                creditCard11x: 10.82,
                creditCard12x: 11.51
            }
        }
    ]
};


export const ALL_MOCKS = [MOCK_ITAU, MOCK_CIELO, MOCK_STONE, MOCK_PAGSEGURO, MOCK_GETNET, MOCK_MULVI];
