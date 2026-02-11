import React, { useState } from "react"
import {
    Card,
    CardBody,
    CardTitle,
    Row,
    Col,
    Label,
    Input,
    Button,
    Collapse,
    Badge
} from "reactstrap"

export const CRMFilters = ({ filters, onChange, onApply, activities = [], staff = [], availableContracts = [] }) => {
    const [isOpen, setIsOpen] = useState(true)

    const handleChange = (field, value) => {
        onChange({ ...filters, [field]: value })
    }

    const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length

    // Filtramos staff por professores/instrutores se houver essa informação, caso contrário mostramos todos como fallback
    const instructorlist = staff.filter(s =>
        s.roleName?.toLowerCase().includes('prof') ||
        s.roleName?.toLowerCase().includes('instr')
    ).length > 0 ? staff.filter(s => s.roleName?.toLowerCase().includes('prof') || s.roleName?.toLowerCase().includes('instr')) : staff

    const saleslist = staff.filter(s =>
        s.roleName?.toLowerCase().includes('venda') ||
        s.roleName?.toLowerCase().includes('consul')
    ).length > 0 ? staff.filter(s => s.roleName?.toLowerCase().includes('venda') || s.roleName?.toLowerCase().includes('consul')) : staff

    return (
        <Card className="shadow-sm">
            <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <CardTitle className="mb-0 font-size-16">
                        <i className="mdi mdi-filter-variant me-1"></i> Filtros e Segmentação
                    </CardTitle>
                    <div className="d-flex gap-2">
                        {activeFiltersCount > 0 && (
                            <Badge color="primary" className="d-flex align-items-center">
                                {activeFiltersCount} ativos
                            </Badge>
                        )}
                        <Button color="link" size="sm" className="p-0" onClick={() => setIsOpen(!isOpen)}>
                            <i className={`mdi mdi-chevron-${isOpen ? 'up' : 'down'} font-size-20`}></i>
                        </Button>
                    </div>
                </div>

                <Collapse isOpen={isOpen}>
                    <div className="border-top pt-3">
                        <Row className="g-3">
                            {/* Buscar por Texto */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Busca Rápida</Label>
                                <div className="position-relative">
                                    <Input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nome, Email, CPF ou Telefone..."
                                        value={filters.searchTerm || ''}
                                        onChange={(e) => handleChange('searchTerm', e.target.value)}
                                    />
                                    <i className="mdi mdi-magnify search-icon position-absolute" style={{ right: '10px', top: '10px', color: '#aaa' }}></i>
                                </div>
                            </Col>

                            {/* Status e Sexo Lado a Lado */}
                            <Col md={6}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Situação</Label>
                                <Input
                                    type="select"
                                    value={filters.status || 'all'}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    <option value="all">Todos</option>
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                    <option value="suspended">Suspenso</option>
                                    <option value="lead">Lead</option>
                                    <option value="canceled">Cancelado</option>
                                </Input>
                            </Col>

                            <Col md={6}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Sexo</Label>
                                <Input
                                    type="select"
                                    value={filters.gender || 'all'}
                                    onChange={(e) => handleChange('gender', e.target.value)}
                                >
                                    <option value="all">Todos</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Feminino</option>
                                    <option value="other">Outro</option>
                                </Input>
                            </Col>

                            {/* Contrato Específico (Plano) */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Contrato / Plano</Label>
                                <Input
                                    type="select"
                                    value={filters.idPlan || 'all'}
                                    onChange={(e) => handleChange('idPlan', e.target.value)}
                                >
                                    <option value="all">Qualquer Contrato</option>
                                    {availableContracts.map(contract => (
                                        <option key={contract.id} value={contract.id}>
                                            {contract.title || contract.name}
                                        </option>
                                    ))}
                                </Input>
                            </Col>

                            {/* Tipo de Plano */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Duração do Plano</Label>
                                <Input
                                    type="select"
                                    value={filters.planType || 'all'}
                                    onChange={(e) => handleChange('planType', e.target.value)}
                                >
                                    <option value="all">Todos</option>
                                    <option value="monthly">Mensal / Recorrente</option>
                                    <option value="quarterly">Trimestral</option>
                                    <option value="semiannual">Semestral</option>
                                    <option value="annual">Anual</option>
                                    <option value="single">Diária / Avulsa</option>
                                </Input>
                            </Col>

                            {/* Vencimento de Contrato */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Vencimento do Contrato</Label>
                                <Row className="g-2">
                                    <Col xs={6}>
                                        <Input
                                            type="date"
                                            placeholder="De"
                                            value={filters.contractEndStart || ''}
                                            onChange={(e) => handleChange('contractEndStart', e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <Input
                                            type="date"
                                            placeholder="Até"
                                            value={filters.contractEndEnd || ''}
                                            onChange={(e) => handleChange('contractEndEnd', e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            </Col>

                            {/* Atividade Praticada */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Atividade / Modalidade</Label>
                                <Input
                                    type="select"
                                    value={filters.activity || 'all'}
                                    onChange={(e) => handleChange('activity', e.target.value)}
                                >
                                    <option value="all">Todas</option>
                                    {activities.map(act => (
                                        <option key={act.id} value={act.name}>{act.name}</option>
                                    ))}
                                </Input>
                            </Col>

                            {/* Faixa Etária */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Faixa Etária</Label>
                                <Row className="g-2">
                                    <Col xs={6}>
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.ageMin || ''}
                                            onChange={(e) => handleChange('ageMin', e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.ageMax || ''}
                                            onChange={(e) => handleChange('ageMax', e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            </Col>

                            {/* Professor Responsável */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Professor</Label>
                                <Input
                                    type="select"
                                    value={filters.instructor || 'all'}
                                    onChange={(e) => handleChange('instructor', e.target.value)}
                                >
                                    <option value="all">Todos</option>
                                    {instructorlist.map(s => (
                                        <option key={s.id} value={s.id || s.name}>{s.name}</option>
                                    ))}
                                </Input>
                            </Col>

                            {/* Consultor de Vendas */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Consultor (Venda)</Label>
                                <Input
                                    type="select"
                                    value={filters.salesRep || 'all'}
                                    onChange={(e) => handleChange('salesRep', e.target.value)}
                                >
                                    <option value="all">Todos</option>
                                    {saleslist.map(s => (
                                        <option key={s.id} value={s.id || s.name}>{s.name}</option>
                                    ))}
                                </Input>
                            </Col>

                            {/* Data da Venda */}
                            <Col md={12}>
                                <Label className="font-size-12 fw-bold text-muted text-uppercase">Data da Venda (Conversão)</Label>
                                <Row className="g-2">
                                    <Col xs={6}>
                                        <Input
                                            type="date"
                                            value={filters.saleDateStart || ''}
                                            onChange={(e) => handleChange('saleDateStart', e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={6}>
                                        <Input
                                            type="date"
                                            value={filters.saleDateEnd || ''}
                                            onChange={(e) => handleChange('saleDateEnd', e.target.value)}
                                        />
                                    </Col>
                                </Row>
                            </Col>

                            <Col md={12} className="pt-2">
                                <Button color="primary" block onClick={onApply}>
                                    Aplicar Filtros
                                </Button>
                                <Button
                                    color="link"
                                    block
                                    className="text-muted mt-1"
                                    size="sm"
                                    onClick={() => onChange({})}
                                >
                                    Limpar Filtros
                                </Button>
                            </Col>
                        </Row>
                    </div>
                </Collapse>
            </CardBody>
        </Card>
    )
}
