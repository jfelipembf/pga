export const DEFAULT_FINANCE_SETTINGS = {
    autoCloseCashier: true,
    cancelContractAfterDays: 30,
    deleteSalesAfterDays: 15,
    cancelDebtOnCancelledContracts: true,
    considerInadimplentAfterDays: 5,
    bankAccounts: [
        { id: "default", bank: "Banco 001", agency: "0001", account: "12345-6", type: "Conta corrente" },
    ],
    selectedBankAccount: "default",
}

export const DEFAULT_SALES_SETTINGS = {
    treatNewSaleAsRenewal: true,
    sendReceiptEmail: true,
    allowEnrollmentWithDebt: false,
}

export const DEFAULT_GENERAL_SETTINGS = {
    name: "",
    cnpj: "",
    zip: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    logo: "",
    openingDate: "",
    responsibles: "",
    workingHours: "",
    workingDays: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    areaSize: "",
    whatsapp: "",
}
