import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane, Label, Input, Button } from 'reactstrap';
import classnames from 'classnames';
import { PAYMENT_METHODS } from '../../../../utils/constants';

const SalesSelectionPanel = ({ activeTab, toggleTab, onAddPayment, onAddItem, contracts = [], acquirers = [], suggestedValue = 0 }) => {
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CREDIT_CARD);

    const products = [
        { id: 'p1', name: 'Whey Protein (900g)', price: 150.00, category: 'Produto' },
        { id: 'p2', name: 'Creatina (300g)', price: 95.00, category: 'Produto' },
        { id: 'p3', name: 'Garrafa de Água', price: 5.00, category: 'Produto' },
    ];

    const services = [
        { id: 's1', name: 'Avaliação Física', price: 70.00, category: 'Serviço' },
        { id: 's2', name: 'Personal Trainer (Hora)', price: 120.00, category: 'Serviço' },
    ];

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
    }, [availableBrands, paymentData.brand]); // adicionado paymentData.brand dependency

    const handleInputChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
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

    const handleSelectionChange = (list, id) => {
        const selected = list.find(item => item.id === id);
        if (selected) {
            // Passa o item COMPLETO, preservando o ID original do Firestore
            onAddItem(selected);
        }
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

    return (
        <Card className="shadow-sm border-0">
            <CardBody className="d-flex flex-column">
                {/* TABS DE SELEÇÃO PRINCIPAL */}
                <Nav tabs className="nav-tabs-custom mb-4">
                    <NavItem>
                        <NavLink className={classnames({ active: activeTab === '1' })} onClick={() => toggleTab('1')} style={{ cursor: 'pointer' }}>
                            <span className="fw-bold">CONTRATO</span>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={classnames({ active: activeTab === '2' })} onClick={() => toggleTab('2')} style={{ cursor: 'pointer' }}>
                            <span className="fw-bold">PRODUTOS</span>
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink className={classnames({ active: activeTab === '3' })} onClick={() => toggleTab('3')} style={{ cursor: 'pointer' }}>
                            <span className="fw-bold">SERVIÇOS</span>
                        </NavLink>
                    </NavItem>
                </Nav>

                <TabContent activeTab={activeTab} className="flex-grow-1">
                    {/* ABA CONTRATO */}
                    <TabPane tabId="1">
                        <Row className="mb-3">
                            <Col md={12}>
                                <Label className="form-label fw-semibold">Escolha o contrato *</Label>
                                <Input
                                    type="select"
                                    className="form-select border-light"
                                    onChange={(e) => handleSelectionChange(contracts, e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecionar...</option>
                                    {contracts.map(c => <option key={c.id} value={c.id}>{c.title} - R$ {c.price}</option>)}
                                </Input>
                            </Col>
                        </Row>
                        <hr className="my-4 opacity-50" />
                    </TabPane>

                    {/* ABA PRODUTOS */}
                    <TabPane tabId="2">
                        <Row className="mb-3">
                            <Col md={12}>
                                <Label className="form-label fw-semibold">Produto</Label>
                                <Input
                                    type="select"
                                    className="form-select"
                                    onChange={(e) => handleSelectionChange(products, e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Buscar produto...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
                                </Input>
                            </Col>
                        </Row>
                    </TabPane>

                    {/* ABA SERVIÇOS */}
                    <TabPane tabId="3">
                        <Row className="mb-3">
                            <Col md={12}>
                                <Label className="form-label fw-semibold">Serviço</Label>
                                <Input
                                    type="select"
                                    className="form-select"
                                    onChange={(e) => handleSelectionChange(services, e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecionar...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                                </Input>
                            </Col>
                        </Row>
                    </TabPane>
                </TabContent>

                {/* SEÇÃO DE PAGAMENTO */}
                <div className="p-3 bg-light rounded-3 border border-light-subtle mt-3">
                    <h6 className="text-dark fw-bold mb-3 d-flex align-items-center">
                        <i className="mdi mdi-cash-register me-2 text-primary font-size-18"></i>
                        Confirmar Pagamento
                    </h6>

                    <Nav pills className="nav-justified bg-white rounded-pill p-1 mb-3 shadow-sm">
                        {[
                            { id: PAYMENT_METHODS.CASH, label: 'Dinheiro', icon: 'mdi-cash' },
                            { id: PAYMENT_METHODS.PIX, label: 'Pix', icon: 'mdi-qrcode' },
                            { id: PAYMENT_METHODS.DEBIT_CARD, label: 'Débito', icon: 'mdi-credit-card-check' },
                            { id: PAYMENT_METHODS.CREDIT_CARD, label: 'Crédito', icon: 'mdi-credit-card' }
                        ].map((method) => (
                            <NavItem key={method.id}>
                                <NavLink
                                    className={classnames({ active: paymentMethod === method.id, 'rounded-pill': true, 'active-payment': paymentMethod === method.id })}
                                    onClick={() => setPaymentMethod(method.id)}
                                    style={{ cursor: 'pointer', padding: '8px' }}
                                >
                                    <i className={`mdi ${method.icon} font-size-14 me-1`}></i>
                                    <span className="font-size-11 fw-bold">{method.label}</span>
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    <TabContent activeTab={paymentMethod}>
                        {(paymentMethod === PAYMENT_METHODS.CREDIT_CARD || paymentMethod === PAYMENT_METHODS.DEBIT_CARD) && (
                            <Row className="g-2 font-size-12">
                                <Col md={3}>
                                    <Label className="mb-1">Máquina</Label>
                                    <Input
                                        type="select"
                                        className="form-select form-select-sm"
                                        value={paymentData.provider}
                                        onChange={(e) => handleInputChange('provider', e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {acquirers.map(acq => (
                                            <option key={acq.id} value={acq.id}>{acq.name}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={3}>
                                    <Label className="mb-1">Bandeira</Label>
                                    <Input
                                        type="select"
                                        className="form-select form-select-sm"
                                        value={paymentData.brand}
                                        onChange={(e) => handleInputChange('brand', e.target.value)}
                                        disabled={!paymentData.provider}
                                    >
                                        <option value="">Selecione...</option>
                                        {availableBrands.map(b => (
                                            <option key={b} value={b}>{b.toUpperCase()}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={3}>
                                    <Label className="mb-1">Autorização</Label>
                                    <Input type="text" placeholder="Nº" className="form-control form-control-sm" value={paymentData.auth} onChange={(e) => handleInputChange('auth', e.target.value)} />
                                </Col>
                                {paymentMethod === PAYMENT_METHODS.CREDIT_CARD && (
                                    <Col md={3}>
                                        <Label className="mb-1">Parcelas</Label>
                                        <Input type="select" className="form-select form-select-sm" value={paymentData.installments} onChange={(e) => handleInputChange('installments', e.target.value)}>
                                            <option value="1">1x</option>
                                            <option value="2">2x</option>
                                            <option value="3">3x</option>
                                            <option value="4">4x</option>
                                            <option value="5">5x</option>
                                            <option value="6">6x</option>
                                            <option value="10">10x</option>
                                            <option value="12">12x</option>
                                        </Input>
                                    </Col>
                                )}
                            </Row>
                        )}
                        <Row className="mt-2">
                            <Col md={12}>
                                <Label className="font-size-11 fw-bold text-muted text-uppercase mb-1">Valor do Pagamento</Label>
                                <div className="d-flex gap-2">
                                    <div className="flex-grow-1">
                                        <Input type="number" placeholder="0,00" className="form-control fw-bold" value={paymentData.value} onChange={(e) => handleInputChange('value', e.target.value)} />
                                        {estimatedFee !== null && (
                                            <small className="text-muted d-block mt-1">
                                                Taxa: {estimatedFee}% | Líquido: <span className="text-success fw-bold">R$ {netValueDisplay?.toFixed(2)}</span>
                                            </small>
                                        )}
                                    </div>
                                    <Button color="primary" className="fw-bold px-4" onClick={handleAddPaymentClick} disabled={!paymentData.value}>
                                        ADICIONAR
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </TabContent>
                </div>
            </CardBody>
            <style>
                {`
                    .active-payment { background-color: var(--bs-primary) !important; color: white !important; }
                    .nav-tabs-custom .nav-link.active { color: var(--bs-primary) !important; border-bottom: 2px solid var(--bs-primary) !important; }
                `}
            </style>
        </Card>
    );
};

export default SalesSelectionPanel;
