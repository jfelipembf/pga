import React, { useMemo, useState, useEffect } from "react"
import { Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalHeader, ModalFooter, Row, Table, Form, FormGroup, Label, Input } from "reactstrap"
import { formatDate } from "../../../helpers/date"
import { getStatusColor, getStatusLabel } from "../../../helpers/status"
import { useToast } from "../../../components/Common/ToastProvider"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { useLoading } from "../../../hooks/useLoading"
import { payReceivables } from "../../../services/Receivables"
import { listReceivablesByClient } from "../../../services/Receivables"
import { listAcquirers } from "../../../services/Acquirers"
import { BRAND_OPTIONS } from "../../Financial/Acquirers/Constants/acquirersDefaults"

import { formatCurrency, renderMethod, calculateFinancialSummary } from "../Utils/financialUtils"

const ClientFinancial = ({ financial = [], idClient, clientName, onRefresh }) => {
  const [selected, setSelected] = useState(null)
  const [paymentModal, setPaymentModal] = useState(false)
  const [receivables, setReceivables] = useState([])
  const [acquirers, setAcquirers] = useState([])
  const [paymentForm, setPaymentForm] = useState({
    method: 'pix',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    authorization: '',
    acquirer: '',
    brand: '',
    installments: 1,
    nextDueDate: ''
  })

  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  const summary = useMemo(() => calculateFinancialSummary(financial), [financial])

  const totalPending = useMemo(() =>
    summary.find(s => s.id === "open-balance")?.value || 0
    , [summary])

  // Filter available brands based on selected acquirer
  const availableBrands = useMemo(() => {
    if (!paymentForm.acquirer) return BRAND_OPTIONS

    const selectedAcquirer = acquirers.find(acq => acq.name === paymentForm.acquirer)
    if (!selectedAcquirer || !selectedAcquirer.brands || selectedAcquirer.brands.length === 0) {
      return BRAND_OPTIONS
    }

    return BRAND_OPTIONS.filter(brand => selectedAcquirer.brands.includes(brand.id))
  }, [paymentForm.acquirer, acquirers])

  const loadAcquirers = React.useCallback(async () => {
    try {
      const data = await listAcquirers()
      setAcquirers(data.filter(acq => !acq.inactive))
    } catch (error) {
      console.error("Erro ao carregar adquirentes:", error)
    }
  }, [])

  const loadReceivables = React.useCallback(async () => {
    try {
      const data = await listReceivablesByClient(idClient, { status: 'open' })
      setReceivables(data)
    } catch (error) {
      console.error("Erro ao carregar receivables:", error)
      toast.show({ title: "Erro ao carregar débitos", color: "danger" })
    }
  }, [idClient, toast])

  useEffect(() => {
    loadAcquirers()
  }, [loadAcquirers])

  useEffect(() => {
    if (paymentModal && idClient) {
      loadReceivables()
      // Inicializar valor com o total pendente para habilitar o botão
      setPaymentForm(prev => ({ ...prev, amount: totalPending }))
    }
  }, [paymentModal, idClient, totalPending, loadReceivables])

  const handlePayment = async () => {
    if (!idClient) return

    const paymentAmount = paymentForm.amount || totalPending

    try {
      await withLoading('pay', async () => {
        await payReceivables({
          idClient,
          clientName, // Added
          amount: paymentAmount,
          paymentMethod: paymentForm.method,
          paymentDate: paymentForm.date,
          // Card-specific fields
          authorization: paymentForm.authorization,
          acquirer: paymentForm.acquirer,
          brand: paymentForm.brand,
          installments: paymentForm.installments,
          // Partial payment
          nextDueDate: paymentForm.nextDueDate,
        })

        toast.show({
          title: "Pagamento realizado",
          description: `${formatCurrency(paymentAmount)} pago com sucesso`,
          color: "success"
        })

        setPaymentModal(false)
        setPaymentForm({
          method: 'pix',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          authorization: '',
          acquirer: '',
          brand: '',
          installments: 1,
          nextDueDate: ''
        })

        if (onRefresh) onRefresh()
      })
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      toast.show({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente",
        color: "danger"
      })
    }
  }

  // Inline functions formatCurrency and renderMethod removed

  return (
    <Card className="shadow-sm">
      <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h5 className="mb-0">Financeiro</h5>
          <p className="text-muted mb-0 small">Compras, serviços e contratos do cliente.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {totalPending > 0 && (
            <Button
              color="danger"
              size="sm"
              onClick={() => setPaymentModal(true)}
              className="d-flex align-items-center gap-1"
            >
              <i className="mdi mdi-cash-multiple"></i>
              Quitar Saldo ({formatCurrency(totalPending)})
            </Button>
          )}
          <Badge color="light" className="text-muted">
            Total registrado: {formatCurrency(summary.find(s => s.id === "total-spent")?.value || 0)}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <Row className="g-3 mb-3">
          {summary.map(item => (
            <Col md="4" key={item.id}>
              <Card className="h-100 shadow-sm">
                <CardBody className="py-3">
                  <p className="text-muted text-uppercase fw-semibold mb-1 fs-12">{item.label}</p>
                  <h4 className={`mb - 0 text - ${item.color} `}>{formatCurrency(item.value)}</h4>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Data</th>
                <th>ID</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Pagamento</th>
                <th className="text-end">Valor Total</th>
                <th className="text-end">Valor Pago</th>
                <th className="text-end">Saldo Devedor</th>
                <th className="text-center">Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {financial.map(item => (
                <tr key={item.idTransaction || item.id}>
                  <td className="fw-semibold">{formatDate(item.date)}</td>
                  <td>{item.idTransaction || item.id}</td>
                  <td>{item.type || "--"}</td>
                  <td>{item.description || "--"}</td>
                  <td>{renderMethod(item.method) || "--"}</td>
                  <td className={`text-end fw-semibold ${Number(item.amount) < 0 ? "text-success" : ""}`}>
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="text-end">
                    {formatCurrency(item.paid || 0)}
                  </td>
                  <td className={`text-end fw-semibold ${Number(item.pending || 0) > 0 ? "text-danger" : "text-success"}`}>
                    {formatCurrency(item.pending || 0)}
                  </td>
                  <td className="text-center">
                    <Badge color={getStatusColor(item.status)} pill>
                      {getStatusLabel(item.status, "sale")}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button color="link" className="px-2" onClick={() => setSelected(item)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </CardBody>

      <Modal isOpen={!!selected} toggle={() => setSelected(null)} centered size="md">
        <ModalHeader toggle={() => setSelected(null)}>Detalhes da transação</ModalHeader>
        <ModalBody>
          {selected ? (
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between">
                <span className="text-muted">ID</span>
                <span className="fw-semibold">{selected.idTransaction || selected.id}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Data</span>
                <span>{formatDate(selected.date)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Tipo</span>
                <span>{selected.type}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Descrição</span>
                <span className="text-end">{selected.description}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Quantidade</span>
                <span>{selected.quantity || 1}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Pagamento</span>
                <span className="text-end">{renderMethod(selected.method)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Valor Total</span>
                <span className="fw-semibold">{formatCurrency(selected.amount)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Valor Pago</span>
                <span className="fw-semibold text-success">{formatCurrency(selected.paid || 0)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Saldo Devedor</span>
                <span className={`fw - semibold ${Number(selected.pending || 0) > 0 ? "text-danger" : "text-success"} `}>
                  {formatCurrency(selected.pending || 0)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Status</span>
                <Badge color={getStatusColor(selected.status)} pill>
                  {getStatusLabel(selected.status, "sale")}
                </Badge>
              </div>
            </div>
          ) : null}
        </ModalBody>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} toggle={() => setPaymentModal(false)} centered size="md">
        <ModalHeader toggle={() => setPaymentModal(false)}>Quitar Saldo Devedor</ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <div className="alert alert-info mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <span><strong>Total em Aberto:</strong></span>
                <span className="fs-5 fw-bold text-danger">{formatCurrency(totalPending)}</span>
              </div>
            </div>

            {receivables.length > 0 && (
              <details className="mb-3">
                <summary className="text-muted" style={{ cursor: 'pointer' }}>Ver débitos detalhados ({receivables.length})</summary>
                <div className="mt-2 d-grid gap-1">
                  {receivables.map(rec => (
                    <div key={rec.id} className="border-bottom pb-1 d-flex justify-content-between small">
                      <span>{formatDate(rec.dueDate)} - {rec.description}</span>
                      <span className="fw-semibold text-danger">{formatCurrency(rec.pending)}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <Form>
              <Row>
                <Col md="12">
                  <FormGroup>
                    <Label>Forma de Pagamento</Label>
                    <Input
                      type="select"
                      value={paymentForm.method}
                      onChange={e => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="debito">Cartão de Débito</option>
                      <option value="credito">Cartão de Crédito</option>
                      <option value="boleto">Boleto</option>
                    </Input>
                  </FormGroup>
                </Col>

                <Col md="6">
                  <FormGroup>
                    <Label>Valor a Pagar</Label>
                    <Input
                      type="number"
                      min="0"
                      max={totalPending}
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder={formatCurrency(totalPending)}
                    />
                    <small className="text-muted">Máximo: {formatCurrency(totalPending)}</small>
                  </FormGroup>
                </Col>

                <Col md="6">
                  <FormGroup>
                    <Label>Data do Pagamento</Label>
                    <Input
                      type="date"
                      value={paymentForm.date}
                      onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </FormGroup>
                </Col>

                {/* Card-specific fields */}
                {paymentForm.method === 'credito' && (
                  <>
                    <Col md="6">
                      <FormGroup>
                        <Label>Autorização</Label>
                        <Input
                          value={paymentForm.authorization}
                          onChange={e => setPaymentForm(prev => ({ ...prev, authorization: e.target.value }))}
                          placeholder="Código de autorização"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Adquirente</Label>
                        <Input
                          type="select"
                          value={paymentForm.acquirer}
                          onChange={e => setPaymentForm(prev => ({ ...prev, acquirer: e.target.value }))}
                        >
                          <option value="">Selecione...</option>
                          {acquirers.map(acq => (
                            <option key={acq.id} value={acq.name}>{acq.name}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Parcelas</Label>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={paymentForm.installments}
                          onChange={e => setPaymentForm(prev => ({ ...prev, installments: Number(e.target.value) }))}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Bandeira</Label>
                        <Input
                          type="select"
                          value={paymentForm.brand}
                          onChange={e => setPaymentForm(prev => ({ ...prev, brand: e.target.value }))}
                        >
                          <option value="">Selecione...</option>
                          {availableBrands.map(brand => (
                            <option key={brand.id} value={brand.label}>{brand.label}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </>
                )}

                {paymentForm.method === 'debito' && (
                  <>
                    <Col md="6">
                      <FormGroup>
                        <Label>Adquirente</Label>
                        <Input
                          type="select"
                          value={paymentForm.acquirer}
                          onChange={e => setPaymentForm(prev => ({ ...prev, acquirer: e.target.value }))}
                        >
                          <option value="">Selecione...</option>
                          {acquirers.map(acq => (
                            <option key={acq.id} value={acq.name}>{acq.name}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Autorização</Label>
                        <Input
                          value={paymentForm.authorization}
                          onChange={e => setPaymentForm(prev => ({ ...prev, authorization: e.target.value }))}
                          placeholder="Código de autorização"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label>Bandeira</Label>
                        <Input
                          type="select"
                          value={paymentForm.brand}
                          onChange={e => setPaymentForm(prev => ({ ...prev, brand: e.target.value }))}
                        >
                          <option value="">Selecione...</option>
                          {availableBrands.map(brand => (
                            <option key={brand.id} value={brand.label}>{brand.label}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </>
                )}

                {/* Next due date for partial payments */}
                {(paymentForm.amount > 0 && paymentForm.amount < totalPending) && (
                  <Col md="12">
                    <div className="alert alert-warning mb-0">
                      <strong>Pagamento Parcial Detectado</strong>
                      <p className="mb-2">Restante a pagar: {formatCurrency(totalPending - (paymentForm.amount || 0))}</p>
                      <FormGroup className="mb-0">
                        <Label>Data prevista para próximo pagamento</Label>
                        <Input
                          type="date"
                          value={paymentForm.nextDueDate}
                          onChange={e => setPaymentForm(prev => ({ ...prev, nextDueDate: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormGroup>
                    </div>
                  </Col>
                )}
              </Row>
            </Form>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPaymentModal(false)}>
            Cancelar
          </Button>
          <ButtonLoader
            color="primary"
            onClick={handlePayment}
            loading={isLoading('pay')}
            disabled={totalPending <= 0 || (paymentForm.amount || 0) <= 0}
          >
            Confirmar Pagamento ({formatCurrency(paymentForm.amount || totalPending)})
          </ButtonLoader>
        </ModalFooter>
      </Modal>
    </Card>
  )
}

export default ClientFinancial
