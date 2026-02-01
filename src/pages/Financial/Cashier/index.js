import React from 'react'
import { Row, Col, Card, CardBody, Button, Input, Label, Modal, ModalHeader, ModalBody, FormFeedback, Badge } from 'reactstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { formatCurrency } from '../../../utils/format'
import { formatDate } from '../../../utils/date'
import { useCashier } from './hooks/useCashier'
import { CashierTransactionsTable } from './components/CashierTransactionsTable'
import { CashierMovementModal } from './components/CashierMovementModal'

const CashierPage = () => {
    document.title = "Caixa | Lexa Admin"

    const {
        loading,
        user,
        currentSession,
        setCurrentSession,
        activeSessions,
        isAdmin,
        displayUserName,
        modalOpen,
        setModalOpen,
        modalClose,
        setModalClose,
        handleOpenCashier,
        handleCloseCashier,
        transactions,
        movementModalType,
        setMovementModalType,
        handleMovement
    } = useCashier()

    // Formik: Abrir Caixa
    const formikOpen = useFormik({
        initialValues: { openingBalance: '0', notes: '' },
        validationSchema: Yup.object({
            openingBalance: Yup.number().min(0, 'Valor inválido').required('Obrigatório'),
        }),
        onSubmit: handleOpenCashier
    })

    // Formik: Fechar Caixa
    const formikClose = useFormik({
        initialValues: { actualBalance: '', notes: '' },
        validationSchema: Yup.object({
            actualBalance: Yup.number().min(0).required('Informe o valor em caixa'),
        }),
        onSubmit: handleCloseCashier
    })

    if (loading) return (
        <div className="p-5 text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Carregando informações do caixa...</p>
        </div>
    )

    return (
        <React.Fragment>
            <div className="cashier-page d-print-none">
                <Row className="g-4">
                    <Col xl="12">
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                {/* Header Superior */}
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="font-size-18 text-uppercase mb-0 fw-bold">Gestão de Caixa</h4>
                                    <div className="d-flex gap-2">
                                        <Button color="light" className="btn-md border">
                                            <i className="mdi mdi-history me-1"></i> Histórico
                                        </Button>
                                        {!currentSession && (
                                            <Button color="primary" className="btn-md shadow-sm" onClick={() => setModalOpen(true)}>
                                                Abertura de Caixa
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Filtros em Barra */}
                                <div className="d-flex flex-wrap gap-2 mb-4 bg-light p-3 rounded align-items-center">
                                    <div className="text-primary fw-medium font-size-13 me-3">
                                        <i className="mdi mdi-calendar-check me-1"></i> Hoje: <strong>{formatDate(new Date())}</strong>
                                    </div>
                                    <div className="text-muted fw-medium font-size-13 me-3">
                                        Operador: <strong>{currentSession?.idUser === user?.uid ? displayUserName : (currentSession?.userName || displayUserName)}</strong>
                                    </div>

                                    {isAdmin && activeSessions.length > 1 && (
                                        <div className="ms-auto d-flex align-items-center gap-2">
                                            <Label className="mb-0 font-size-12 text-muted fw-bold text-uppercase">Alternar Caixa:</Label>
                                            <Input
                                                type="select"
                                                className="form-select-sm border-0 shadow-sm"
                                                style={{ width: '200px' }}
                                                value={currentSession?.id || ''}
                                                onChange={(e) => {
                                                    const session = activeSessions.find(s => s.id === e.target.value)
                                                    if (session) setCurrentSession(session)
                                                }}
                                            >
                                                {activeSessions.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.userName}
                                                    </option>
                                                ))}
                                            </Input>
                                        </div>
                                    )}
                                </div>

                                {/* Conteúdo da Sessão */}
                                {!currentSession ? (
                                    <div className="text-center py-5 border rounded bg-white shadow-sm border-dashed">
                                        <div className="mb-4">
                                            <div className="avatar-lg mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center text-primary display-4">
                                                <i className="mdi mdi-cash-register"></i>
                                            </div>
                                        </div>
                                        <h5 className="text-dark fw-bold">Seu caixa está fechado</h5>
                                        <p className="text-muted">Abra o caixa para começar a registrar vendas e recebimentos.</p>
                                        <Button color="primary" size="lg" className="mt-2" onClick={() => setModalOpen(true)}>
                                            ABRIR MEU CAIXA AGORA
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border rounded p-4 bg-white shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                                            <div>
                                                <Badge color="success" className="mb-2">CAIXA ABERTO</Badge>
                                                <h5 className="font-size-16 text-uppercase fw-bold mb-0 text-dark">
                                                    {currentSession?.idUser === user?.uid ? displayUserName : currentSession.userName}
                                                </h5>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <Button color="success" outline className="fw-medium" onClick={() => setMovementModalType('income')}>
                                                    <i className="mdi mdi-plus-circle-outline me-1"></i> Suprimento
                                                </Button>
                                                <Button color="danger" outline className="fw-medium" onClick={() => setMovementModalType('expense')}>
                                                    <i className="mdi mdi-minus-circle-outline me-1"></i> Sangria
                                                </Button>
                                                <Button color="outline-danger" className="fw-medium ms-2" onClick={() => setModalClose(true)}>
                                                    <i className="mdi mdi-lock-open-outline me-1"></i> Encerrar Expediente
                                                </Button>
                                            </div>
                                        </div>

                                        <Row className="g-4 mb-4">
                                            <Col md={3}>
                                                <div className="p-3 border rounded bg-light">
                                                    <p className="text-muted mb-1 font-size-12 uppercase fw-bold">Saldo Inicial</p>
                                                    <h4 className="mb-0 text-dark">{formatCurrency(currentSession.openingBalance)}</h4>
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="p-3 border rounded bg-success-subtle">
                                                    <p className="text-success mb-1 font-size-12 uppercase fw-bold">Entradas (Dinheiro/Pix)</p>
                                                    <h4 className="mb-0 text-success">+{formatCurrency(currentSession.totalIncome)}</h4>
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="p-3 border rounded bg-danger-subtle">
                                                    <p className="text-danger mb-1 font-size-12 uppercase fw-bold">Saídas / Sangrias</p>
                                                    <h4 className="mb-0 text-danger">-{formatCurrency(currentSession.totalExpenses)}</h4>
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="p-3 border rounded bg-primary text-white shadow-sm">
                                                    <p className="text-white-50 mb-1 font-size-12 uppercase fw-bold">Saldo em Gaveta</p>
                                                    <h4 className="mb-0">{formatCurrency(currentSession.expectedBalance)}</h4>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* EXTRATO DE MOVIMENTAÇÕES */}
                                        <CashierTransactionsTable transactions={transactions} />
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* MODAIS */}
                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered>
                    <ModalHeader toggle={() => setModalOpen(!modalOpen)} className="bg-primary text-white">Abrir Caixa</ModalHeader>
                    <ModalBody className="p-4">
                        <form onSubmit={formikOpen.handleSubmit}>
                            <div className="mb-4">
                                <Label className="fw-bold">Saldo Inicial (Fundo de Troco)</Label>
                                <Input
                                    name="openingBalance"
                                    type="number"
                                    step="0.01"
                                    className="form-control-lg text-primary fw-bold"
                                    placeholder="0,00"
                                    onChange={formikOpen.handleChange}
                                    onBlur={formikOpen.handleBlur}
                                    value={formikOpen.values.openingBalance}
                                    invalid={!!(formikOpen.touched.openingBalance && formikOpen.errors.openingBalance)}
                                />
                                {formikOpen.touched.openingBalance && formikOpen.errors.openingBalance && (
                                    <FormFeedback>{formikOpen.errors.openingBalance}</FormFeedback>
                                )}
                            </div>
                            <Button type="submit" color="primary" block size="lg" className="fw-bold">
                                CONFIRMAR ABERTURA
                            </Button>
                        </form>
                    </ModalBody>
                </Modal>

                <Modal isOpen={modalClose} toggle={() => setModalClose(!modalClose)} centered>
                    <ModalHeader toggle={() => setModalClose(!modalClose)} className="bg-danger text-white">Fechar Caixa</ModalHeader>
                    <ModalBody className="p-4">
                        <div className="text-center mb-4 p-3 bg-light rounded border border-dashed">
                            <p className="mb-1 text-muted text-uppercase font-size-11 fw-bold">Saldo Esperado em Gaveta</p>
                            <h3 className="text-dark fw-bold m-0">{formatCurrency(currentSession?.expectedBalance)}</h3>
                        </div>
                        <form onSubmit={formikClose.handleSubmit}>
                            <div className="mb-3">
                                <Label className="fw-bold">Valor Conferido Fisicamente</Label>
                                <Input
                                    name="actualBalance"
                                    type="number"
                                    step="0.01"
                                    className="form-control-lg fw-bold"
                                    placeholder="0,00"
                                    onChange={formikClose.handleChange}
                                    value={formikClose.values.actualBalance}
                                    invalid={!!(formikClose.touched.actualBalance && formikClose.errors.actualBalance)}
                                />
                            </div>
                            <div className="mb-4">
                                <Label className="fw-bold">Observações do Fechamento</Label>
                                <Input
                                    name="notes"
                                    type="textarea"
                                    rows="3"
                                    placeholder="Caso haja diferença, explique aqui..."
                                    onChange={formikClose.handleChange}
                                    value={formikClose.values.notes}
                                />
                            </div>
                            <Button type="submit" color="danger" block size="lg" className="fw-bold">
                                CONFIRMAR FECHAMENTO E TRAVAR
                            </Button>
                        </form>
                    </ModalBody>
                </Modal>

                <CashierMovementModal
                    isOpen={!!movementModalType}
                    toggle={() => setMovementModalType(null)}
                    onSave={handleMovement}
                    type={movementModalType}
                />
            </div>
        </React.Fragment>
    )
}

export default CashierPage
