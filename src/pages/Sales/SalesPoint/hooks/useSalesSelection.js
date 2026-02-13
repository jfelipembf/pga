import { useState, useEffect, useMemo } from 'react';
import { PAYMENT_METHODS } from '../../../../utils/constants';

export const useSalesSelection = ({
    acquirers = [],
    suggestedValue = 0,
    onAddPayment,
    onAddItem
}) => {
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);

    // Estado local para o formulário de pagamento atual
    const [paymentData, setPaymentData] = useState({
        value: '',
        installments: '1',
        provider: '', // ID da Adquirente
        brand: '',
        auth: '',
        netValue: 0
    });

    // Atualizar valor sugerido quando o saldo muda
    useEffect(() => {
        if (suggestedValue > 0) {
            setPaymentData(prev => ({ ...prev, value: suggestedValue.toFixed(2) }));
        }
    }, [suggestedValue]);

    // 1. Filtrar bandeiras disponíveis com base na Adquirente selecionada
    const availableBrands = useMemo(() => {
        if (!paymentData.provider || !acquirers.length) return [];
        const selectedAcquirer = acquirers.find(a => a.id === paymentData.provider);
        if (!selectedAcquirer) return [];

        const brands = [];
        selectedAcquirer.rateConfigs?.forEach(config => {
            config.brands?.forEach(brandId => {
                if (!brands.find(b => b.id === brandId)) {
                    brands.push(brandId); // Simplificado para apenas o ID string por enquanto
                }
            });
        });
        return brands;
    }, [paymentData.provider, acquirers]);

    // Calcular taxa estimada
    const estimatedFee = useMemo(() => {
        if (!paymentData.provider || !paymentData.brand || !acquirers.length) return null
        if (paymentMethod !== PAYMENT_METHODS.CREDIT_CARD && paymentMethod !== PAYMENT_METHODS.DEBIT_CARD) return null

        const acquirer = acquirers.find(a => a.id === paymentData.provider)
        if (!acquirer) return null

        // Encontrar a config que contém a bandeira
        const config = acquirer.rateConfigs?.find(c => c.brands?.includes(paymentData.brand))
        if (!config) return null // ou default

        let rate = 0
        if (paymentMethod === PAYMENT_METHODS.DEBIT_CARD) {
            rate = config.fees?.debitCard || 0
        } else {
            const inst = parseInt(paymentData.installments) || 1
            if (inst === 1) rate = config.fees?.creditCard1x || 0
            else rate = config.fees?.[`creditCard${inst}x`] || 0
        }
        return rate
    }, [paymentData, acquirers, paymentMethod])

    const netValueDisplay = useMemo(() => {
        const val = parseFloat(paymentData.value) || 0
        if (val <= 0 || estimatedFee === null) return null
        const discount = val * (estimatedFee / 100)
        return val - discount
    }, [paymentData.value, estimatedFee])

    // 2. Definir bandeira padrão ao trocar de adquirente
    useEffect(() => {
        if (availableBrands.length > 0 && !availableBrands.includes(paymentData.brand)) {
            setPaymentData(prev => ({ ...prev, brand: availableBrands[0] }));
        }
    }, [availableBrands, paymentData.brand]);

    const handleInputChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
    };

    const getMethodLabel = (id) => {
        const labels = {
            [PAYMENT_METHODS.CASH]: 'Dinheiro',
            [PAYMENT_METHODS.PIX]: 'Pix',
            [PAYMENT_METHODS.DEBIT_CARD]: 'Débito',
            [PAYMENT_METHODS.CREDIT_CARD]: 'Crédito'
        };
        return labels[id] || id;
    };

    const handleAddPaymentClick = () => {
        // Obter nome da adquirente para label
        const providerName = acquirers.find(a => a.id === paymentData.provider)?.name || paymentData.provider;

        onAddPayment({
            methodId: paymentMethod,
            methodLabel: getMethodLabel(paymentMethod),
            ...paymentData,
            netValue: netValueDisplay || parseFloat(paymentData.value) || 0, // Envia o líquido calculado ou bruto
            providerName // Adiciona nome legível
        });
        setPaymentData({
            value: '',
            installments: '1',
            provider: '',
            brand: '',
            auth: '',
            netValue: 0
        });
    };

    const handleSelectionChange = (list, id, itemType) => {
        const selected = list.find(item => item.id === id);
        if (selected) {
            // Passa o item COMPLETO com o tipo explícito
            onAddItem({ ...selected, type: itemType });
        }
    };

    return {
        paymentMethod,
        setPaymentMethod,
        paymentData,
        handleInputChange,
        availableBrands,
        estimatedFee,
        netValueDisplay,
        handleAddPaymentClick,
        handleSelectionChange
    };
};
