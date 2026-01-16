export const INITIAL_ACQUIRERS = [
    {
        id: "acq-stone",
        name: "Stone",
        inactive: false,
        brands: ["visa", "mastercard", "elo"],
        otherBrandName: "",
        debitFeePercent: 1.79,
        creditOneShotFeePercent: 3.2,
        anticipateReceivables: true,
        installmentFees: Array.from({ length: 12 }, (_, idx) => ({
            installments: idx + 1,
            feePercent: idx === 0 ? 3.1 : 3.6 + idx * 0.25,
        })),
    },
    {
        id: "acq-cielo",
        name: "Cielo",
        inactive: false,
        brands: ["visa", "mastercard", "amex"],
        otherBrandName: "",
        debitFeePercent: 1.65,
        creditOneShotFeePercent: 3.1,
        anticipateReceivables: false,
        installmentFees: Array.from({ length: 12 }, (_, idx) => ({
            installments: idx + 1,
            feePercent: idx === 0 ? 3.0 : 3.4 + idx * 0.22,
        })),
    },
    {
        id: "acq-pagseguro",
        name: "PagSeguro",
        inactive: true,
        brands: ["visa", "mastercard", "elo", "hipercard"],
        otherBrandName: "",
        debitFeePercent: 1.99,
        creditOneShotFeePercent: 3.4,
        anticipateReceivables: true,
        installmentFees: Array.from({ length: 12 }, (_, idx) => ({
            installments: idx + 1,
            feePercent: idx === 0 ? 3.3 : 3.7 + idx * 0.24,
        })),
    },
]

export const BRAND_OPTIONS = [
    { id: "visa", label: "Visa" },
    { id: "mastercard", label: "Mastercard" },
    { id: "elo", label: "Elo" },
    { id: "amex", label: "Amex" },
    { id: "hipercard", label: "Hipercard" },
    { id: "banesecard", label: "Banesecard" },
    { id: "others", label: "Outras" },
]



export const createBlankAcquirer = () => ({
    id: `acquirer-${Date.now()}`,
    name: "",
    inactive: false,
    brands: [],
    otherBrandName: "",
    debitFeePercent: 1.99,
    creditOneShotFeePercent: 3.49,
    anticipateReceivables: false,
    installmentFees: [
        { installments: 1, feePercent: 3.49 },
        { installments: 2, feePercent: 3.99 },
        { installments: 3, feePercent: 4.19 },
        { installments: 4, feePercent: 4.39 },
        { installments: 5, feePercent: 4.59 },
        { installments: 6, feePercent: 4.79 },
        { installments: 7, feePercent: 4.99 },
        { installments: 8, feePercent: 5.19 },
        { installments: 9, feePercent: 5.39 },
        { installments: 10, feePercent: 5.59 },
        { installments: 11, feePercent: 5.79 },
        { installments: 12, feePercent: 5.99 },
    ],
})
