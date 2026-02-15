import React from 'react';
import { Row, Col, Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane, Label, Input, Button } from 'reactstrap';
import classnames from 'classnames';
import { PAYMENT_METHODS } from '../../../../utils/constants';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../constants/salesMockData';
import { useSalesSelection } from '../hooks/useSalesSelection';

const SalesSelectionPanel = ({
    activeTab,
    toggleTab,
    onAddPayment,
    onAddItem,
    contracts = [],
    acquirers = [],
    suggestedValue = 0,
    saleDate,
    setSaleDate,
    startDate,
    setStartDate,
    isRenewal,
    setIsRenewal,
    discount,
    setDiscount
}) => {

    const {
        paymentMethod,
        setPaymentMethod,
        paymentData,
        handleInputChange,
        availableBrands,
        estimatedFee,
        netValueDisplay,
        handleAddPaymentClick,
        handleSelectionChange
    } = useSalesSelection({
        acquirers,
        suggestedValue,
        onAddPayment,
        onAddItem
    });

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
                                <Label className="form-label fw-semibold text-dark">Escolha o contrato *</Label>
                                <Input
                                    type="select"
                                    className="form-select border-light shadow-sm"
                                    onChange={(e) => handleSelectionChange(contracts, e.target.value, 'contract')}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecionar...</option>
                                    {contracts.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} - {c.isScholarship ? 'BOLSISTA' : `R$ ${c.price}`}
                                        </option>
                                    ))}
                                </Input>
                            </Col>
                        </Row>
                        <Row className="mb-3 g-3">
                            <Col md={3}>
                                <Label className="form-label fw-semibold text-dark">Data da Venda</Label>
                                <Input
                                    type="date"
                                    className="form-control border-light shadow-sm bg-light"
                                    value={saleDate || ''}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                />
                                <small className="text-muted" style={{ fontSize: '9px' }}>Mude para migrar dados históricos</small>
                            </Col>
                            <Col md={3}>
                                <Label className="form-label fw-semibold text-dark">Data de Início *</Label>
                                <Input
                                    type="date"
                                    className="form-control border-light shadow-sm"
                                    value={startDate || ''}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <small className="text-muted" style={{ fontSize: '9px' }}>Início da vigência/acesso</small>
                            </Col>
                            <Col md={3}>
                                <Label className="form-label fw-semibold text-dark">Desconto (R$)</Label>
                                <Input
                                    type="number"
                                    className="form-control border-light shadow-sm"
                                    placeholder="0,00"
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Label className="form-label fw-semibold text-dark">Renovação?</Label>
                                <Input
                                    type="select"
                                    className="form-select border-light shadow-sm"
                                    value={isRenewal ? "1" : "0"}
                                    onChange={(e) => setIsRenewal(e.target.value === "1")}
                                >
                                    <option value="0">Não</option>
                                    <option value="1">Sim</option>
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
                                    onChange={(e) => handleSelectionChange(MOCK_PRODUCTS, e.target.value, 'product')}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Buscar produto...</option>
                                    {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
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
                                    onChange={(e) => handleSelectionChange(MOCK_SERVICES, e.target.value, 'service')}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Selecionar...</option>
                                    {MOCK_SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
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
                                        value={paymentData.provider || ''}
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
                                        value={paymentData.brand || ''}
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
                                    <Input type="text" placeholder="Nº" className="form-control form-control-sm" value={paymentData.auth || ''} onChange={(e) => handleInputChange('auth', e.target.value)} />
                                </Col>
                                {paymentMethod === PAYMENT_METHODS.CREDIT_CARD && (
                                    <Col md={3}>
                                        <Label className="mb-1">Parcelas</Label>
                                        <Input type="select" className="form-select form-select-sm" value={paymentData.installments || '1'} onChange={(e) => handleInputChange('installments', e.target.value)}>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}x</option>
                                            ))}
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
                                        <Input type="number" placeholder="0,00" className="form-control fw-bold" value={paymentData.value || ''} onChange={(e) => handleInputChange('value', e.target.value)} />
                                        {estimatedFee !== null && (
                                            <small className="text-muted d-block mt-1">
                                                Taxa: {estimatedFee}% | Líquido: <span className="text-success fw-bold">R$ {netValueDisplay?.toFixed(2)}</span>
                                            </small>
                                        )}
                                    </div>
                                    <Button color="primary" className="fw-bold px-4" onClick={handleAddPaymentClick} disabled={!paymentData.value && paymentData.value !== 0 && paymentData.value !== "0"}>
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
