import React, { useState } from "react"
import { Row, Col, Card, CardBody, Button, Input, Badge, Label, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Collapse } from "reactstrap"
import BasicTable from "../../../components/Common/BasicTable"
import { PayableFormVisual } from "./PayableFormVisual"
import PayablePaymentModal from "./PayablePaymentModal"
import Miniwidget from "../../Dashboard/Miniwidget"
import GenericModal from "../../../components/Common/GenericModal"
import { usePayables } from "./hooks/usePayables"
import { formatCurrency } from "../../../utils/format"
import { formatDate } from "../../../utils/date"

import {
    PAYABLE_STATUS,
    PAYABLE_STATUS_COLORS,
    PAYABLE_STATUS_LABELS
} from "../../../utils/constants"

const PayablesPage = () => {
    document.title = "Contas a Pagar | Lexa Admin"

    const {
        loading,
        modal,
        selectedPayable,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        filterStartDate,
        setFilterStartDate,
        filterEndDate,
        setFilterEndDate,
        searchTerm,
        setSearchTerm,
        filteredPayables,
        totals,
        toggleModal,
        handleEdit,
        handleSave,
        handlePay
    } = usePayables()

    const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
    const [paymentModal, setPaymentModal] = useState(false)
    const [selectedPayableForPayment, setSelectedPayableForPayment] = useState(null)

    const openPaymentModal = (payable) => {
        setSelectedPayableForPayment(payable);
        setPaymentModal(true);
    };

    const handlePaymentConfirm = async (paymentData) => {
        await handlePay(paymentData.id, paymentData);
        setPaymentModal(false);
    };

    // Pegar categorias únicas das contas para o filtro
    const categories = React.useMemo(() => Array.from(new Set(filteredPayables.map(p => p.category || 'Geral'))), [filteredPayables])

    // Definição de Colunas para BasicTable
    const columns = React.useMemo(() => [
        {
            label: "Fornecedor",
            key: "supplier",
            render: (payable) => (
                <div>
                    <h5 className="font-size-14 mb-1">{payable.supplier || "Sem fornecedor"}</h5>
                    {payable.expenseNumber && (
                        <span className="badge bg-soft-secondary text-secondary font-size-11">
                            #{payable.expenseNumber}
                        </span>
                    )}
                </div>
            )
        },
        {
            label: "Descrição",
            key: "description",
            render: (payable) => (
                <div className="text-muted font-size-13">
                    {payable.description || payable.title || '-'}
                </div>
            )
        },
        {
            label: "Vencimento",
            key: "dueDate",
            render: (payable) => (
                <div className="fw-medium">
                    {formatDate(payable.dueDate)}
                </div>
            )
        },
        {
            label: "Categoria",
            key: "category",
            render: (payable) => (
                <Badge color="light" className="text-muted border">
                    {payable.category || "Geral"}
                </Badge>
            )
        },
        {
            label: "Valor",
            key: "amount",
            render: (payable) => (
                <div className="fw-bold text-danger">
                    {formatCurrency(payable.amount)}
                </div>
            )
        },
        {
            label: "Status",
            key: "status",
            render: (payable) => (
                <div className="text-center">
                    <Badge color={PAYABLE_STATUS_COLORS[payable.status]} className="font-size-11">
                        {PAYABLE_STATUS_LABELS[payable.status]}
                    </Badge>
                </div>
            )
        },
        {
            label: "Ações",
            key: "actions",
            render: (payable) => (
                <div className="text-end">
                    <UncontrolledDropdown onClick={(e) => e.stopPropagation()}>
                        <DropdownToggle className="card-drop" tag="span" role="button">
                            <i className="mdi mdi-dots-horizontal font-size-18"></i>
                        </DropdownToggle>
                        <DropdownMenu className="dropdown-menu-end">
                            <DropdownItem onClick={() => handleEdit(payable)}>
                                <i className="mdi mdi-pencil font-size-16 text-primary me-1"></i> Editar
                            </DropdownItem>

                            {payable.status === 'open' && (
                                <DropdownItem onClick={() => openPaymentModal(payable)}>
                                    <i className="mdi mdi-check-circle-outline font-size-16 text-success me-1"></i> Baixar Pagamento
                                </DropdownItem>
                            )}

                            <DropdownItem divider />
                            <DropdownItem className="text-danger" onClick={() => {
                                if (window.confirm('Deseja realmente cancelar esta despesa?')) {
                                    // handleCancel(payable.id); // TODO: Implementar delete no hook se necessário
                                }
                            }}>
                                <i className="mdi mdi-trash-can-outline font-size-16 me-1"></i> Excluir
                            </DropdownItem>
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </div>
            )
        }
    ], [handleEdit]);

    if (loading && filteredPayables.length === 0) return (
        <div className="p-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Carregando contas a pagar...</p>
        </div>
    )

    return (
        <React.Fragment>
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="font-size-18 text-uppercase fw-bold">Contas a Pagar</h4>
                <Button color="success" className="waves-effect waves-light shadow-sm" onClick={toggleModal}>
                    <i className="mdi mdi-plus me-1"></i> Nova Despesa
                </Button>
            </div>

            {/* KPI CARDS */}
            <Miniwidget
                colSize={4}
                reports={[
                    { title: "A Vencer", iconClass: "clock-outline", total: formatCurrency(totals.pending), average: `${totals.countPending} contas`, badgecolor: "warning" },
                    { title: "Em Atraso", iconClass: "alert-circle-outline", total: formatCurrency(totals.overdue), average: `${totals.countOverdue} contas`, badgecolor: "danger" },
                    { title: "Pago no Mês", iconClass: "check-circle-outline", total: formatCurrency(totals.paid), average: "Fluxo", badgecolor: "success" },
                ]} />

            {/* FILTROS E TABELA */}
            <Card className="shadow-sm border-0">
                <CardBody>
                    <div className="d-flex flex-wrap gap-3 mb-4 bg-light p-3 rounded align-items-end">
                        <div className="flex-grow-1">
                            <Label className="form-label font-size-13 text-muted fw-bold">BUSCAR</Label>
                            <div className="position-relative">
                                <Input
                                    type="text"
                                    placeholder="Buscar por descrição, fornecedor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '35px' }}
                                />
                                <i className="mdi mdi-magnify position-absolute text-muted" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}></i>
                            </div>
                        </div>

                        <div style={{ minWidth: '150px' }}>
                            <Label className="form-label font-size-13 text-muted fw-bold">STATUS</Label>
                            <Input type="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">Todos</option>
                                <option value={PAYABLE_STATUS.OPEN}>{PAYABLE_STATUS_LABELS[PAYABLE_STATUS.OPEN]}</option>
                                <option value={PAYABLE_STATUS.PAID}>{PAYABLE_STATUS_LABELS[PAYABLE_STATUS.PAID]}</option>
                                <option value={PAYABLE_STATUS.OVERDUE}>{PAYABLE_STATUS_LABELS[PAYABLE_STATUS.OVERDUE]}</option>
                            </Input>
                        </div>

                        <div>
                            <Label className="d-block">&nbsp;</Label>
                            <Button
                                color="secondary"
                                outline
                                onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                                active={moreFiltersOpen}
                            >
                                <i className="mdi mdi-filter-variant me-1"></i> {moreFiltersOpen ? 'Ocultar Filtros' : 'Mais Filtros'}
                            </Button>
                        </div>
                    </div>

                    <Collapse isOpen={moreFiltersOpen} className="mb-4">
                        <div className="bg-light p-3 rounded border border-light border-dashed">
                            <Row className="g-3">
                                <Col md={3}>
                                    <Label className="font-size-11 fw-bold text-uppercase">Categoria</Label>
                                    <Input type="select" bsSize="sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                        <option value="all">Todas as Categorias</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={3}>
                                    <Label className="font-size-11 fw-bold text-uppercase">Início (Vencimento)</Label>
                                    <Input type="date" bsSize="sm" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                                </Col>
                                <Col md={3}>
                                    <Label className="font-size-11 fw-bold text-uppercase">Fim (Vencimento)</Label>
                                    <Input type="date" bsSize="sm" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                                </Col>
                                <Col md={3} className="d-flex align-items-end">
                                    <Button color="link" size="sm" className="text-danger p-0 fw-bold" onClick={() => {
                                        setFilterCategory('all');
                                        setFilterStartDate('');
                                        setFilterEndDate('');
                                        setSearchTerm('');
                                        setFilterStatus('all');
                                    }}>
                                        Limpar Tudo
                                    </Button>
                                </Col>
                            </Row>
                        </div>
                    </Collapse>

                    <BasicTable
                        columns={columns}
                        data={filteredPayables}
                        loading={loading}
                        searchKeys={["supplier", "description", "category"]}
                        searchPlaceholder="Buscar por fornecedor, descrição ou categoria..."
                        hideNew={true}
                        externalSearch={searchTerm}
                        onExternalSearchChange={setSearchTerm}
                    />
                </CardBody>
            </Card>

            {/* MODAL DE CADASTRO/EDIÇÃO */}
            <GenericModal
                isOpen={modal}
                toggle={toggleModal}
                size="lg"
                title={selectedPayable ? "Editar Despesa" : "Nova Despesa"}
            >
                <PayableFormVisual
                    initialData={selectedPayable}
                    onCancel={toggleModal}
                    hideTitle={true}
                    onSave={handleSave}
                />
            </GenericModal>

            {/* MODAL DE BAIXA DE PAGAMENTO */}
            <PayablePaymentModal
                isOpen={paymentModal}
                toggle={() => setPaymentModal(false)}
                payable={selectedPayableForPayment}
                onPay={handlePaymentConfirm}
            />
        </React.Fragment>
    )
}

export default PayablesPage
