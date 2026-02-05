import React from "react"
import { Row, Col, Label, Input, Button, Form, InputGroup, InputGroupText, FormFeedback, Card, CardBody, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import { useAcquirerForm } from "../hooks/useAcquirerForm"

export const AcquirerForm = ({ initialData, onSave, onCancel }) => {

    // Use the custom hook that separates Logic from View
    const {
        formik,
        customBrand,
        setCustomBrand,
        actions
    } = useAcquirerForm(initialData, onSave)

    const {
        handleAddCustomBrand,
        toggleBrandInConfig,
        addRateGroup,
        removeRateGroup,
        addNextInstallment,
        getAllBrands,
        isBrandSelectedInOther
    } = actions

    return (
        <div className="acquirer-form-container animate__animated animate__fadeIn">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title mb-0">
                    {initialData ? `Editar: ${initialData.name}` : 'Nova Adquirente'}
                </h4>
                <div>
                    <Button color="secondary" outline className="me-2 waves-effect" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button color="success" className="waves-effect waves-light" onClick={formik.handleSubmit}>
                        <i className="mdi mdi-check me-1"></i> Salvar
                    </Button>
                </div>
            </div>

            <Form onSubmit={formik.handleSubmit}>
                {/* 1. Global Data */}
                <h5 className="font-size-14 mb-3 text-uppercase fw-bold text-muted border-bottom pb-2">Dados Cadastrais</h5>
                <Row>
                    <Col md={12} className="mb-4">
                        <Label>Nome da Adquirente (Ex: Stone)</Label>
                        <Input
                            name="name"
                            type="text"
                            placeholder="Identificação interna"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            invalid={!!(formik.touched.name && formik.errors.name)}
                        />
                        {formik.errors.name && <FormFeedback>{formik.errors.name}</FormFeedback>}
                    </Col>
                </Row>

                {/* 2. Brand Pool Tool */}
                <div className="mb-4 bg-light p-3 rounded">
                    <Label className="mb-2 fw-bold">1. Cadastrar Bandeiras Disponíveis</Label>
                    <div className="d-flex align-items-center">
                        <InputGroup style={{ maxWidth: '300px' }}>
                            <Input
                                placeholder="Nova bandeira (ex: Cabal)..."
                                value={customBrand}
                                onChange={(e) => setCustomBrand(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomBrand())}
                            />
                            <Button color="primary" onClick={handleAddCustomBrand}>
                                <i className="mdi mdi-plus"></i>
                            </Button>
                        </InputGroup>
                        <small className="text-muted ms-3">Adicione bandeiras extras se não estiverem na lista padrão.</small>
                    </div>
                </div>

                {/* 3. Rate Configs */}
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <h5 className="font-size-14 mb-0 text-uppercase fw-bold text-muted">Configurações de Taxas</h5>
                    <Button color="info" size="sm" onClick={addRateGroup}>
                        <i className="mdi mdi-plus-circle-outline me-1"></i> Novo Grupo de Taxas
                    </Button>
                </div>

                {formik.errors.rateConfigs && typeof formik.errors.rateConfigs === 'string' && (
                    <div className="alert alert-danger">{formik.errors.rateConfigs}</div>
                )}

                {formik.values.rateConfigs.map((config, idx) => (
                    <Card key={config.id || idx} className="border shadow-none mb-3">
                        <CardBody className="p-3 bg-soft-light border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="m-0 text-primary">
                                    <i className="mdi mdi-format-list-checks me-2"></i>
                                    Configuração #{idx + 1}
                                </h6>
                                {formik.values.rateConfigs.length > 1 && (
                                    <Button color="danger" size="sm" outline onClick={() => removeRateGroup(idx)}>
                                        <i className="mdi mdi-trash-can"></i>
                                    </Button>
                                )}
                            </div>
                        </CardBody>

                        <CardBody>
                            {/* Brands Selection */}
                            <Label className="fw-bold mb-2">Bandeiras deste grupo:</Label>
                            <Row className="g-2 mb-4">
                                {config.brands.map(brandId => {
                                    // Helper function in hook or here to get full object
                                    const allBrands = getAllBrands()
                                    const brand = allBrands.find(b => b.id === brandId) || { id: brandId, label: brandId, icon: 'fas fa-credit-card' }

                                    return (
                                        <Col xs={6} md={3} lg={2} key={brand.id}>
                                            <div
                                                className="card border border-primary bg-primary text-white mb-0"
                                                style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '80px', position: 'relative' }}
                                            >
                                                {/* Remove Button Overlay */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleBrandInConfig(idx, brand.id)
                                                    }}
                                                    style={{ position: 'absolute', top: '2px', right: '5px', cursor: 'pointer', zIndex: 10 }}
                                                    className="text-white opacity-75 hover-opacity-100"
                                                >
                                                    <i className="mdi mdi-close"></i>
                                                </div>

                                                <div className="card-body p-2 text-center d-flex flex-column align-items-center justify-content-center">
                                                    <i className={`${brand.icon} mb-1 text-white`}></i>
                                                    <small className="fw-bold text-truncate w-100">{brand.label}</small>
                                                </div>
                                            </div>
                                        </Col>
                                    )
                                })}

                                {/* Add Brand Button */}
                                <Col xs={6} md={3} lg={2}>
                                    <UncontrolledDropdown className="h-100 w-100">
                                        <DropdownToggle tag="div" className="h-100 w-100" style={{ cursor: 'pointer' }}>
                                            <div
                                                className="card border border-dashed border-secondary mb-0 h-100 d-flex align-items-center justify-content-center text-muted hover-bg-light"
                                                style={{ minHeight: '80px' }}
                                            >
                                                <div className="text-center">
                                                    <i className="mdi mdi-plus fa-2x"></i>
                                                    <div className="small mt-1">Add Bandeira</div>
                                                </div>
                                            </div>
                                        </DropdownToggle>
                                        <DropdownMenu className="w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <DropdownItem header>Selecione para adicionar</DropdownItem>
                                            {getAllBrands()
                                                .filter(b => !config.brands.includes(b.id))
                                                .map(brand => {
                                                    const taken = isBrandSelectedInOther(idx, brand.id)
                                                    return (
                                                        <DropdownItem
                                                            key={brand.id}
                                                            onClick={() => toggleBrandInConfig(idx, brand.id)}
                                                            disabled={taken}
                                                            className="d-flex align-items-center justify-content-between"
                                                        >
                                                            <span>
                                                                <i className={`${brand.icon} me-2 font-size-12`}></i>
                                                                {brand.label}
                                                            </span>
                                                            {taken && <small className="text-danger ms-2" style={{ fontSize: '0.7em' }}>(Em uso)</small>}
                                                        </DropdownItem>
                                                    )
                                                })}
                                            {getAllBrands().filter(b => !config.brands.includes(b.id)).length === 0 && (
                                                <DropdownItem disabled>Nenhuma bandeira disponível</DropdownItem>
                                            )}
                                        </DropdownMenu>
                                    </UncontrolledDropdown>
                                </Col>
                            </Row>
                            {formik.errors.rateConfigs?.[idx]?.brands && (
                                <div className="text-danger mb-3">{formik.errors.rateConfigs[idx].brands}</div>
                            )}

                            {/* Fees Grid */}
                            <div className="p-3 bg-white border rounded">
                                <div className="d-flex justify-content-between mb-3">
                                    <strong className="text-muted">Tabela de Taxas (%)</strong>
                                    <Button color="link" size="sm" onClick={() => addNextInstallment(idx)}>
                                        + Add Parcela ({config.maxInstallment + 1}x)
                                    </Button>
                                </div>

                                <Row className="g-3">
                                    <Col md={3}>
                                        <Label className="font-size-11 mb-1">Débito</Label>
                                        <InputGroup size="sm">
                                            <Input
                                                type="number" step="0.01"
                                                name={`rateConfigs.${idx}.fees.debitCard`}
                                                value={config.fees.debitCard}
                                                onChange={formik.handleChange}
                                            />
                                            <InputGroupText>%</InputGroupText>
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Label className="font-size-11 mb-1">Crédito 1x</Label>
                                        <InputGroup size="sm">
                                            <Input
                                                type="number" step="0.01"
                                                name={`rateConfigs.${idx}.fees.creditCard1x`}
                                                value={config.fees.creditCard1x}
                                                onChange={formik.handleChange}
                                            />
                                            <InputGroupText>%</InputGroupText>
                                        </InputGroup>
                                    </Col>
                                    {Array.from({ length: config.maxInstallment - 1 }, (_, k) => k + 2).map(num => (
                                        <Col xs={6} md={3} lg={2} key={num}>
                                            <Label className="font-size-11 mb-1">Crédito {num}x</Label>
                                            <InputGroup size="sm">
                                                <Input
                                                    type="number" step="0.01"
                                                    name={`rateConfigs.${idx}.fees.creditCard${num}x`}
                                                    value={config.fees[`creditCard${num}x`] || 0}
                                                    onChange={formik.handleChange}
                                                />
                                                <InputGroupText>%</InputGroupText>
                                            </InputGroup>
                                        </Col>
                                    ))}
                                </Row>
                            </div>

                        </CardBody>
                    </Card>
                ))}

                <Row className="mt-4">
                    <Col md={12}>
                        <div className="form-check mb-3">
                            <input
                                name="isActive"
                                type="checkbox"
                                className="form-check-input"
                                id="isActive"
                                checked={formik.values.isActive}
                                onChange={() => formik.setFieldValue('isActive', !formik.values.isActive)}
                            />
                            <label className="form-check-label fw-semibold" htmlFor="isActive">
                                Ativo no sistema
                            </label>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    )
}
