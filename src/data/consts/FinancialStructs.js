export const DEFAULT_CHART_OF_ACCOUNTS = [
    {
        id: '1', code: '1', name: 'RECEITAS', type: 'revenue', children: [
            {
                id: '1.1', code: '1.1', name: 'Receitas Operacionais', children: [
                    { id: '1.1.1', code: '1.1.1', name: 'Venda de Produtos' },
                    { id: '1.1.2', code: '1.1.2', name: 'Prestação de Serviços' },
                    { id: '1.1.3', code: '1.1.3', name: 'Mensalidades/Assinaturas' },
                    { id: '1.1.4', code: '1.1.4', name: 'Receitas de Eventos' },
                ]
            },
            {
                id: '1.2', code: '1.2', name: 'Receitas Financeiras', children: [
                    { id: '1.2.1', code: '1.2.1', name: 'Rendimentos de Aplicações' },
                    { id: '1.2.2', code: '1.2.2', name: 'Descontos Obtidos' },
                ]
            },
            {
                id: '1.3', code: '1.3', name: 'Outras Receitas', children: [
                    { id: '1.3.1', code: '1.3.1', name: 'Recuperação de Despesas' },
                    { id: '1.3.2', code: '1.3.2', name: 'Venda de Ativos' },
                ]
            }
        ]
    },
    {
        id: '2', code: '2', name: 'DESPESAS', type: 'expense', children: [
            {
                id: '2.1', code: '2.1', name: 'Despesas Administrativas', children: [
                    { id: '2.1.1', code: '2.1.1', name: 'Aluguel e Condomínio' },
                    { id: '2.1.2', code: '2.1.2', name: 'Energia Elétrica' },
                    { id: '2.1.3', code: '2.1.3', name: 'Água e Esgoto' },
                    { id: '2.1.4', code: '2.1.4', name: 'Internet e Telefonia' },
                    { id: '2.1.5', code: '2.1.5', name: 'Sistemas e Software (SaaS)' },
                    { id: '2.1.6', code: '2.1.6', name: 'Material de Escritório' },
                    { id: '2.1.7', code: '2.1.7', name: 'Material de Limpeza' },
                    { id: '2.1.8', code: '2.1.8', name: 'Correios e Sedex' },
                    { id: '2.1.9', code: '2.1.9', name: 'Serviços Contábeis' },
                    { id: '2.1.10', code: '2.1.10', name: 'Serviços Jurídicos' },
                ]
            },
            {
                id: '2.2', code: '2.2', name: 'Despesas com Pessoal', children: [
                    { id: '2.2.1', code: '2.2.1', name: 'Salários' },
                    { id: '2.2.2', code: '2.2.2', name: 'Pró-Labore' },
                    { id: '2.2.3', code: '2.2.3', name: 'FGTS' },
                    { id: '2.2.4', code: '2.2.4', name: 'INSS' },
                    { id: '2.2.5', code: '2.2.5', name: 'Vale Transporte' },
                    { id: '2.2.6', code: '2.2.6', name: 'Vale Alimentação/Refeição' },
                    { id: '2.2.7', code: '2.2.7', name: 'Plano de Saúde' },
                    { id: '2.2.8', code: '2.2.8', name: 'Treinamentos e Capacitação' },
                    { id: '2.2.9', code: '2.2.9', name: 'Rescisões' },
                ]
            },
            {
                id: '2.3', code: '2.3', name: 'Despesas Comerciais/Vendas', children: [
                    { id: '2.3.1', code: '2.3.1', name: 'Comissões de Vendas' },
                    { id: '2.3.2', code: '2.3.2', name: 'Marketing e Publicidade' },
                    { id: '2.3.3', code: '2.3.3', name: 'Google Ads / Meta Ads' },
                    { id: '2.3.4', code: '2.3.4', name: 'Brindes e Materiais Promocionais' },
                    { id: '2.3.5', code: '2.3.5', name: 'Eventos e Feiras' },
                ]
            },
            {
                id: '2.4', code: '2.4', name: 'Despesas Operacionais', children: [
                    { id: '2.4.1', code: '2.4.1', name: 'Manutenção de Equipamentos' },
                    { id: '2.4.2', code: '2.4.2', name: 'Manutenção Predial' },
                    { id: '2.4.3', code: '2.4.3', name: 'Combustível e Fretes' },
                    { id: '2.4.4', code: '2.4.4', name: 'Seguro Patrimonial' },
                    { id: '2.4.5', code: '2.4.5', name: 'Vigilância e Segurança' },
                ]
            },
            {
                id: '2.5', code: '2.5', name: 'Impostos e Taxas', children: [
                    { id: '2.5.1', code: '2.5.1', name: 'DAS / Simples Nacional' },
                    { id: '2.5.2', code: '2.5.2', name: 'IPTU' },
                    { id: '2.5.3', code: '2.5.3', name: 'Taxas de Cartão de Crédito' },
                    { id: '2.5.4', code: '2.5.4', name: 'Tarifas Bancárias' },
                    { id: '2.5.5', code: '2.5.5', name: 'ISS' },
                    { id: '2.5.6', code: '2.5.6', name: 'Outros Impostos' },
                ]
            },
            {
                id: '2.6', code: '2.6', name: 'Despesas Financeiras', children: [
                    { id: '2.6.1', code: '2.6.1', name: 'Juros e Multas' },
                    { id: '2.6.2', code: '2.6.2', name: 'Juros de Empréstimos' },
                    { id: '2.6.3', code: '2.6.3', name: 'IOF' },
                    { id: '2.6.4', code: '2.6.4', name: 'Descontos Concedidos' },
                ]
            },
            {
                id: '2.7', code: '2.7', name: 'Outras Despesas', children: [
                    { id: '2.7.1', code: '2.7.1', name: 'Doações' },
                    { id: '2.7.2', code: '2.7.2', name: 'Despesas Eventuais' },
                    { id: '2.7.3', code: '2.7.3', name: 'Perdas e Quebras' },
                ]
            }
        ]
    }
];

export const DEFAULT_COST_CENTERS = [
    { id: 'CC_ADM', name: 'Administrativo' },
    { id: 'CC_VENDAS', name: 'Comercial / Vendas' },
    { id: 'CC_OPS', name: 'Operacional' },
    { id: 'CC_MKT', name: 'Marketing' },
    { id: 'CC_RH', name: 'Recursos Humanos' },
    { id: 'CC_TI', name: 'Tecnologia da Informação' },
];
