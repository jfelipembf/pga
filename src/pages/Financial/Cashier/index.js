import React from 'react'
import { Row, Col, Card, CardBody, Button, Input, Label, Badge } from 'reactstrap'
import { formatCurrency } from '../../../utils/format'
import { formatDate } from '../../../utils/date'
import { useCashier } from './hooks/useCashier'
import { CashierTransactionsTable } from './components/CashierTransactionsTable'
import { CashierMovementModal } from './components/CashierMovementModal'
import CashierOpenModal from './components/CashierOpenModal'
import CashierCloseModal from './components/CashierCloseModal'
import CashierPrintTemplate from './components/CashierPrintTemplate'
import Flatpickr from "react-flatpickr"
import "flatpickr/dist/themes/material_blue.css"
import { Portuguese } from 'flatpickr/dist/l10n/pt.js'
import PageLoader from '../../../components/Common/PageLoader'


const CashierPage = () => {
    document.title = "Caixa | PGA Admin"

    const {
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
        liveSummary,
        movementModalType,
        setMovementModalType,
        handleMovement,
        selectedDate,
        setSelectedDate,
        loading,
        myActiveSession
    } = useCashier()



    const isSessionOpen = currentSession?.status === 'open'
    const isToday = selectedDate.toDateString() === new Date().toDateString()

    return (
        <React.Fragment>
            <div className="cashier-page d-print-none">
                <Row className="g-4">
                    <Col xl="12">
                        <Card className="shadow-sm border-0 position-relative" style={{ minHeight: '400px' }}>
                            <CardBody>
                                {/* Header Superior */}
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="font-size-18 text-uppercase mb-0 fw-bold">Gestão de Caixa</h4>
                                    <div className="d-flex gap-2">
                                        <div className="d-inline-block me-2" style={{ width: '140px' }}>
                                            <Flatpickr
                                                className="form-control text-center"
                                                value={selectedDate}
                                                onChange={([date]) => setSelectedDate(date)}
                                                options={{
                                                    locale: Portuguese,
                                                    dateFormat: "d/m/Y",
                                                    disableMobile: true
                                                }}
                                            />
                                        </div>
                                        <Button color="secondary" className="btn-md shadow-sm text-white" onClick={() => window.print()}>
                                            <i className="mdi mdi-printer me-1"></i> Imprimir
                                        </Button>
                                        {(isToday && !myActiveSession) && (
                                            <Button color="primary" className="btn-md shadow-sm" onClick={() => setModalOpen(true)}>
                                                Abertura de Caixa
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Filtros em Barra - Exibidos apenas se houver sessões no dia */}
                                {loading ? (
                                    <div style={{ minHeight: '400px', position: 'relative' }}>
                                        <PageLoader isFullScreen={false} />
                                    </div>
                                ) : (
                                    <>
                                        {currentSession && (
                                            <div className="d-flex flex-wrap gap-2 mb-4 bg-light p-3 rounded align-items-center">
                                                <div className="text-primary fw-medium font-size-13 me-3">
                                                    <i className="mdi mdi-calendar-check me-1"></i> Data: <strong>{formatDate(selectedDate)}</strong>
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
                                        )}

                                        {/* Conteúdo da Sessão */}
                                        {!currentSession ? (
                                            <div className="text-center py-5 border rounded bg-white shadow-sm border-dashed">
                                                <h5 className="text-dark fw-bold">Nenhum caixa registrado para este dia</h5>
                                                <p className="text-muted mb-0">Abra o caixa para começar a registrar vendas e recebimentos.</p>
                                            </div>
                                        ) : (
                                            <div className="border rounded p-4 bg-white shadow-sm">
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                                                    <div>
                                                        <Badge
                                                            color={currentSession.isConsolidated ? "info" : isSessionOpen ? "success" : "danger"}
                                                            className="mb-2"
                                                        >
                                                            {currentSession.isConsolidated ? "VISÃO CONSOLIDADA" : isSessionOpen ? "CAIXA ABERTO" : "CAIXA FECHADO"}
                                                        </Badge>
                                                        <h5 className="font-size-16 text-uppercase fw-bold mb-0 text-dark">
                                                            {currentSession?.idUser === user?.uid ? displayUserName : currentSession.userName}
                                                        </h5>
                                                    </div>
                                                    {isSessionOpen && !currentSession.isConsolidated ? (
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
                                                    ) : (
                                                        <div className="text-muted font-size-12 italic">
                                                            <i className="mdi mdi-information-outline me-1"></i>
                                                            {currentSession.isConsolidated ? "Modo Visualização Geral (Ações desabilitadas)" : "Caixa Encerrado (Ações desabilitadas)"}
                                                        </div>
                                                    )}
                                                </div>

                                                <Row className="g-4 mb-4">
                                                    <Col md={3}>
                                                        <div className="cashier-summary-card">
                                                            <div className="cashier-summary-card__icon bg-light text-dark">
                                                                <i className="mdi mdi-bank-outline"></i>
                                                            </div>
                                                            <div className="cashier-summary-card__data">
                                                                <p className="cashier-summary-card__label">Saldo Inicial</p>
                                                                <h4 className="cashier-summary-card__value">{formatCurrency(liveSummary?.openingBalance || 0)}</h4>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className="cashier-summary-card">
                                                            <div className="cashier-summary-card__icon bg-success-subtle text-success">
                                                                <i className="mdi mdi-trending-up"></i>
                                                            </div>
                                                            <div className="cashier-summary-card__data">
                                                                <p className="cashier-summary-card__label text-success">Entradas</p>
                                                                <h4 className="cashier-summary-card__value text-success">+{formatCurrency(liveSummary?.totalIncome || 0)}</h4>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className="cashier-summary-card">
                                                            <div className="cashier-summary-card__icon bg-danger-subtle text-danger">
                                                                <i className="mdi mdi-trending-down"></i>
                                                            </div>
                                                            <div className="cashier-summary-card__data">
                                                                <p className="cashier-summary-card__label text-danger">Saídas / Sangrias</p>
                                                                <h4 className="cashier-summary-card__value text-danger">-{formatCurrency(liveSummary?.totalExpenses || 0)}</h4>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div className="cashier-summary-card is-highlighted">
                                                            <div className="cashier-summary-card__icon bg-white-50 text-white">
                                                                <i className="mdi mdi-cash-multiple"></i>
                                                            </div>
                                                            <div className="cashier-summary-card__data">
                                                                <p className="cashier-summary-card__label text-white-50">Esperado em Espécie</p>
                                                                <h4 className="cashier-summary-card__value text-white">{formatCurrency(liveSummary?.expectedBalance || 0)}</h4>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>

                                                {/* EXTRATO DE MOVIMENTAÇÕES */}
                                                <CashierTransactionsTable transactions={transactions} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* MODAIS */}
                {/* MODAIS */}
                <CashierOpenModal
                    isOpen={modalOpen}
                    toggle={() => setModalOpen(!modalOpen)}
                    onConfirm={handleOpenCashier}
                />

                <CashierCloseModal
                    isOpen={modalClose}
                    toggle={() => setModalClose(!modalClose)}
                    onConfirm={handleCloseCashier}
                    expectedBalance={currentSession?.expectedBalance}
                />

                <CashierMovementModal
                    isOpen={!!movementModalType}
                    toggle={() => setMovementModalType(null)}
                    onSave={handleMovement}
                    type={movementModalType}
                />

            </div>
            <CashierPrintTemplate
                summary={liveSummary}
                transactions={transactions}
                user={user}
                session={currentSession}
            />
        </React.Fragment>
    )
}

export default CashierPage
