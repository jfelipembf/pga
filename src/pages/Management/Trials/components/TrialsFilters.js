import React from "react"
import { Row, Col, Input, FormGroup, Label, Button } from "reactstrap"

const TrialsFilters = ({ filters, onFilterChange, onApply, activities = [], staff = [] }) => {
    return (
        <Row className="align-items-end mb-4">
            <Col md={3}>
                <FormGroup className="mb-md-0">
                    <Label className="form-label">Pesquisar</Label>
                    <div className="search-box position-relative">
                        <Input
                            type="text"
                            placeholder="Nome do aluno..."
                            value={filters.search}
                            onChange={(e) => onFilterChange({ search: e.target.value })}
                        />
                        <i className="mdi mdi-magnify search-icon position-absolute" style={{ right: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 4 }}></i>
                    </div>
                </FormGroup>
            </Col>

            <Col md={2}>
                <FormGroup className="mb-md-0">
                    <Label className="form-label">Data Início</Label>
                    <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => onFilterChange({ startDate: e.target.value })}
                    />
                </FormGroup>
            </Col>

            <Col md={2}>
                <FormGroup className="mb-md-0">
                    <Label className="form-label">Data Fim</Label>
                    <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => onFilterChange({ endDate: e.target.value })}
                    />
                </FormGroup>
            </Col>

            <Col md={2}>
                <FormGroup className="mb-md-0">
                    <Label className="form-label">Atividade</Label>
                    <Input
                        type="select"
                        value={filters.idActivity}
                        onChange={(e) => onFilterChange({ idActivity: e.target.value })}
                    >
                        <option value="">Todas</option>
                        {activities.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </Input>
                </FormGroup>
            </Col>

            <Col md={2}>
                <FormGroup className="mb-md-0">
                    <Label className="form-label">Professor</Label>
                    <Input
                        type="select"
                        value={filters.idStaff}
                        onChange={(e) => onFilterChange({ idStaff: e.target.value })}
                    >
                        <option value="">Todos</option>
                        {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </Input>
                </FormGroup>
            </Col>

            <Col md={1}>
                <Button
                    color="primary"
                    className="w-100"
                    onClick={onApply}
                >
                    Filtrar
                </Button>
            </Col>
        </Row>
    )
}

export default TrialsFilters
