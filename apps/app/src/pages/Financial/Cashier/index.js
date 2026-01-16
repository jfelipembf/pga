import React, { useEffect, useState } from "react"

import { connect } from "react-redux"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Table,
} from "reactstrap"

import { CashierPrintContent } from "./Components/Print"
import { setBreadcrumbItems } from "../../../store/actions"
import { getSettings } from "../../../services/Settings/index"
import PageLoader from "../../../components/Common/PageLoader"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import OverlayLoader from "../../../components/Common/OverlayLoader"

import { formatCurrency, formatDateTime } from "./Utils/cashierUtils"
import { formatDate } from "../../../helpers/date"
import { useCashierLogic } from "./Hooks/useCashierLogic"

const CashierPage = ({ setBreadcrumbItems }) => {
  const {
    isLoading,
    isPrinting,
    setIsPrinting,
    startDate,
    endDate,
    setDateRange,
    transactions,
    cashierStatus,
    isOpen,
    session,
    expenseModalOpen,
    toggleExpenseModal,
    openCashierModalOpen,
    setOpenCashierModalOpen,
    closeCashierModalOpen,
    setCloseCashierModalOpen,
    expenseForm,
    handleExpenseChange,
    handleExpenseSubmit,
    openingBalance,
    setOpeningBalance,
    handleOpenSubmit,
    closingObservation,
    setClosingObservation,
    handleCloseSubmit,
    filteredTransactions,
    totals,
    loadStatus,
    loadTransactions,
  } = useCashierLogic()

  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings()
        setSettings(data)
      } catch (err) {
        console.error("Erro ao carregar configs para impressão", err)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    const breadcrumbs = [
      { title: "Financeiro", link: "/financial" },
      { title: "Caixa", link: "/financial/cashier" },
    ]
    setBreadcrumbItems("Caixa", breadcrumbs)
  }, [setBreadcrumbItems])

  const renderActionButton = (actionId) => {
    if (actionId === "open" && isOpen) return null
    if (actionId === "close" && !isOpen) return null

    const actionMap = {
      open: {
        label: "Abrir Caixa",
        icon: "mdi-lock-open",
        onClick: () => setOpenCashierModalOpen(true),
      },
      close: {
        label: "Fechar Caixa",
        icon: "mdi-lock",
        onClick: () => setCloseCashierModalOpen(true),
      },
      print: {
        label: "Imprimir",
        icon: "mdi-printer",
        onClick: () => setIsPrinting(true),
      },
    }

    const action = actionMap[actionId]
    if (!action) return null

    const isActionLoading =
      (actionId === "open" && isLoading("openCashier")) ||
      (actionId === "close" && isLoading("closeCashier")) ||
      (actionId === "print" && isPrinting)

    return (
      <ButtonLoader
        key={actionId}
        color="light"
        className="cashier-icon-btn"
        title={action.label}
        onClick={action.onClick}
        loading={isActionLoading}
        disabled={isLoading("openCashier") || isLoading("closeCashier") || isPrinting}
      >
        <i className={`mdi ${action.icon} font-size-18`} />
      </ButtonLoader>
    )
  }

  const opening = Number(cashierStatus.session?.openingBalance || 0)
  const finalCalculated = totals.revenue - totals.expenses + opening

  if (isLoading("page") && !transactions.length) {
    return <PageLoader />
  }

  return (
    <>
      <Container fluid className="cashier-page d-print-none">
        <Row className="g-4">
          <Col xl="12">
            <Card className="shadow-sm">
              <CardBody>
                <div className="cashier-operations-bar d-flex flex-column flex-lg-row align-items-lg-center gap-3">
                  <div className="cashier-status-info d-flex flex-wrap align-items-center gap-3 text-muted small flex-grow-1">
                    <Badge color={isOpen ? "success" : "danger"} pill className="px-3 py-2">
                      {isOpen ? "Caixa aberto" : "Caixa fechado"}
                    </Badge>

                    <span className="dot-separator" />

                    <span>
                      <strong>Responsável:</strong> {session.responsible || "--"}
                    </span>

                    <span className="dot-separator" />

                    <span>
                      <strong>{isOpen ? "Aberto em:" : "Último fechamento:"}</strong>{" "}
                      {formatDateTime(isOpen ? session.openedAt : session.closedAt)}
                    </span>
                  </div>

                  <div className="cashier-actions-icons d-flex align-items-center gap-2 ms-lg-auto">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small d-none d-lg-inline">Período</span>
                      <DatePicker
                        selectsRange
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(range) => setDateRange(range)}
                        isClearable
                        dateFormat="dd/MM/yyyy"
                        locale="pt-BR"
                        className="form-control"
                        placeholderText="Selecione um período"
                      />
                    </div>

                    {["print", "open", "close"].map((actionId) => renderActionButton(actionId))}

                    <ButtonLoader
                      color="danger"
                      className="d-flex align-items-center gap-2"
                      type="button"
                      onClick={toggleExpenseModal}
                      loading={isLoading("expense")}
                    >
                      <i className="mdi mdi-minus-circle-outline" />
                      Registrar despesa
                    </ButtonLoader>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mt-1">
          <Col md="4">
            <Card className="shadow-sm cashier-summary-card">
              <CardBody>
                <p className="text-muted text-uppercase fw-semibold mb-1">Receita (período)</p>
                <h3 className="mb-0 text-success">{formatCurrency(totals.revenue)}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md="4">
            <Card className="shadow-sm cashier-summary-card">
              <CardBody>
                <p className="text-muted text-uppercase fw-semibold mb-1">Despesas (período)</p>
                <h3 className="mb-0 text-danger">{formatCurrency(totals.expenses)}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md="4">
            <Card className="shadow-sm cashier-summary-card">
              <CardBody>
                <p className="text-muted text-uppercase fw-semibold mb-1">Saldo (período)</p>
                <h3 className="mb-0 text-primary">
                  {formatCurrency(totals.revenue - totals.expenses)}
                </h3>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm mt-3">
          <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h4 className="mb-1">Movimentações financeiras</h4>
            </div>
          </CardHeader>

          {/* importante: position-relative + minHeight pro overlay ter "onde" ficar */}
          <CardBody className="p-0 position-relative" style={{ minHeight: 220 }}>
            <OverlayLoader show={isLoading("page")} />
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Pagamento</th>
                    <th className="text-end">Valor</th>
                    <th className="text-center">Data</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        {isLoading("page")
                          ? "Carregando..."
                          : "Nenhuma transação encontrada para o período selecionado"}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, idx) => (
                      <tr key={tx.idTransaction || tx.id || idx}>
                        <td className="fw-semibold">{tx.idTransaction || tx.id || "--"}</td>
                        <td>
                          <Badge color={tx.type === "sale" ? "success" : "danger"} pill>
                            {tx.type === "sale" ? "Entrada" : "Saída"}
                          </Badge>
                        </td>
                        <td>{tx.category || "--"}</td>
                        <td>{tx.description || "--"}</td>
                        <td>{tx.method || "--"}</td>
                        <td className="text-end fw-semibold">{formatCurrency(tx.amount)}</td>
                        <td className="text-center">{formatDate(tx.date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </Container >

      {/* MODAL DESPESA */}
      < Modal isOpen={expenseModalOpen} toggle={toggleExpenseModal} >
        <ModalHeader toggle={toggleExpenseModal}>Registrar despesa</ModalHeader>
        <Form onSubmit={handleExpenseSubmit}>
          <ModalBody>
            <FormGroup>
              <Label>Descrição</Label>
              <Input name="description" value={expenseForm.description} onChange={handleExpenseChange} required />
            </FormGroup>

            <FormGroup>
              <Label>Categoria</Label>
              <Input
                name="category"
                value={expenseForm.category}
                onChange={handleExpenseChange}
                placeholder="Ex.: Manutenção, Compras, Tributos"
                required
              />
            </FormGroup>

            <Row className="g-3">
              <Col md="6">
                <FormGroup>
                  <Label>Forma de pagamento</Label>
                  <Input type="select" name="method" value={expenseForm.method} onChange={handleExpenseChange}>
                    <option>Dinheiro</option>
                    <option>Pix</option>
                    <option>Transferência</option>
                    <option>Cartão de débito</option>
                    <option>Cartão de crédito</option>
                  </Input>
                </FormGroup>
              </Col>

              <Col md="6">
                <FormGroup>
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={handleExpenseChange}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter>
            <Button color="secondary" onClick={toggleExpenseModal}>
              Cancelar
            </Button>
            <ButtonLoader color="danger" type="submit" loading={isLoading("expense")}>
              Salvar despesa
            </ButtonLoader>
          </ModalFooter>
        </Form>
      </Modal >

      {/* MODAL ABRIR CAIXA */}
      < Modal isOpen={openCashierModalOpen} toggle={() => setOpenCashierModalOpen(!openCashierModalOpen)}>
        <ModalHeader toggle={() => setOpenCashierModalOpen(!openCashierModalOpen)}>Abrir Caixa</ModalHeader>
        <Form onSubmit={handleOpenSubmit}>
          <ModalBody>
            <p>Informe o saldo inicial para abertura do caixa.</p>
            <FormGroup>
              <Label>Saldo Inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0,00"
                required
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button color="secondary" onClick={() => setOpenCashierModalOpen(false)}>
              Cancelar
            </Button>
            <ButtonLoader color="success" type="submit" loading={isLoading("openCashier")}>
              Confirmar Abertura
            </ButtonLoader>
          </ModalFooter>
        </Form>
      </Modal >

      {/* MODAL FECHAR CAIXA */}
      < Modal isOpen={closeCashierModalOpen} toggle={() => setCloseCashierModalOpen(!closeCashierModalOpen)}>
        <ModalHeader toggle={() => setCloseCashierModalOpen(!closeCashierModalOpen)}>Fechar Caixa</ModalHeader>
        <Form onSubmit={handleCloseSubmit}>
          <ModalBody>
            <div className="alert alert-info">
              <h6 className="alert-heading">Resumo do Fechamento</h6>
              <p className="mb-0">
                Saldo Inicial: <strong>{formatCurrency(opening)}</strong>
                <br />
                Entradas: <strong>{formatCurrency(totals.revenue)}</strong>
                <br />
                Saídas: <strong>{formatCurrency(totals.expenses)}</strong>
                <br />
                <hr />
                Saldo Final Calculado: <strong>{formatCurrency(finalCalculated)}</strong>
              </p>
            </div>

            <FormGroup>
              <Label>Observações de fechamento</Label>
              <Input
                type="textarea"
                rows="3"
                value={closingObservation}
                onChange={(e) => setClosingObservation(e.target.value)}
                placeholder="Diferenças de caixa, justificativas, etc."
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button color="secondary" onClick={() => setCloseCashierModalOpen(false)}>
              Cancelar
            </Button>
            <ButtonLoader color="danger" type="submit" loading={isLoading("closeCashier")}>
              Confirmar Fechamento
            </ButtonLoader>
          </ModalFooter>
        </Form>
      </Modal >

      {/* PRINT (aparece só no print via CSS) */}
      < div className="cashier-print-only d-none" >
        <Container fluid className="cashier-print-page">
          <Card className="shadow-sm border-0">
            <CardBody>
              <CashierPrintContent
                transactions={filteredTransactions}
                totals={totals}
                session={session}
                settings={settings}
                dateRange={[startDate, endDate]}
              />
            </CardBody>
          </Card>
        </Container>
      </div >
    </>
  )
}

export default connect(null, { setBreadcrumbItems })(CashierPage)
