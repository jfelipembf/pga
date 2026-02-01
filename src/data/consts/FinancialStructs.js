export const DEFAULT_CHART_OF_ACCOUNTS = [
    {
        id: '1', code: '1', name: 'RECEITAS', type: 'revenue', children: [
            { id: '1.1', code: '1.1', name: 'Receita Operacional', children: [] },
            { id: '1.2', code: '1.2', name: 'Receita Financeira', children: [] }
        ]
    },
    {
        id: '2', code: '2', name: 'DESPESAS', type: 'expense', children: [
            {
                id: '2.1', code: '2.1', name: 'Despesas Fixas', children: [
                    { id: '2.1.1', code: '2.1.1', name: 'Aluguel e Condomínio' },
                    { id: '2.1.2', code: '2.1.2', name: 'Energia Elétrica' },
                    { id: '2.1.3', code: '2.1.3', name: 'Água e Esgoto' },
                    { id: '2.1.4', code: '2.1.4', name: 'Internet e Telefonia' },
                    { id: '2.1.5', code: '2.1.5', name: 'Sistemas e Software' },
                ]
            },
            {
                id: '2.2', code: '2.2', name: 'Despesas Variáveis', children: [
                    { id: '2.2.1', code: '2.2.1', name: 'Manutenção Predial' },
                    { id: '2.2.2', code: '2.2.2', name: 'Materiais de Consumo' },
                    { id: '2.2.3', code: '2.2.3', name: 'Comarketing e Publicidade' },
                ]
            },
            {
                id: '2.3', code: '2.3', name: 'Pessoal', children: [
                    { id: '2.3.1', code: '2.3.1', name: 'Salários' },
                    { id: '2.3.2', code: '2.3.2', name: 'Pró-Labore' },
                    { id: '2.3.3', code: '2.3.3', name: 'Benefícios' },
                ]
            },
            {
                id: '2.4', code: '2.4', name: 'Impostos e Taxas', children: [
                    { id: '2.4.1', code: '2.4.1', name: 'DAS / Simples Nacional' },
                    { id: '2.4.2', code: '2.4.2', name: 'Taxas Bancárias' },
                ]
            }
        ]
    }
];

export const DEFAULT_COST_CENTERS = [
    { id: 'CC_ADM', name: 'Administrativo / Geral' },
    { id: 'CC_SALES', name: 'Comercial / Vendas' },
    { id: 'CC_OPS', name: 'Operacional / Treino' },
    { id: 'CC_MKT', name: 'Marketing' },
];
