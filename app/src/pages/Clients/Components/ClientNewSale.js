import React from "react"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Container,
} from "reactstrap"
import { useLocation } from "react-router-dom"

import { getAuthBranchContext } from "../../../services/Summary/index"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { useSalesData } from "../Hooks/useSalesData"
import { useSalesForm } from "../Hooks/useSalesForm"
import { useSalesActions } from "../Hooks/useSalesActions"
import { paymentTabs } from "../Constants/salesDefaults"
import { getClient } from "../../../services/Clients/clients.service"
import { useState, useEffect } from "react"

const formatCurrency = value =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))

const ClientNewSale = () => {
  const ctx = getAuthBranchContext()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const idClient = searchParams.get("idClient") || ctx?.idClient || null

  const { itemsByTab, isLoading: isLoadingData } = useSalesData()
  const [clientName, setClientName] = useState("")

  useEffect(() => {
    if (idClient) {
      getClient(idClient).then(c => {
        if (c?.name) setClientName(c.name)
      }).catch(err => console.warn("Erro ao carregar nome do cliente para auditoria", err))
    }
  }, [idClient])

  const {
    saleTab, setSaleTab,
    selectedItemId, setSelectedItemId,
    contractStartDate, setContractStartDate,
    discount, setDiscount,
    quantity, setQuantity,
    paymentTab, setPaymentTab,
    paymentForm, setPaymentForm,
    payments, setPayments,
    dueDate, setDueDate,
    selectedItem,
    computedQuantity,
    baseAmount,
    totalDue,
    diff,
    addPayment,
    removePayment,
    contractEndDate
  } = useSalesForm(itemsByTab)

  const { handleFinalize, isLoading: isLoadingAction } = useSalesActions({
    idClient,
    clientName, // Passando nome para auditoria
    saleTab,
    selectedItem,
    diff,
    dueDate,
    computedQuantity,
    baseAmount,
    totalDue,
    discount,
    payments,
    contractStartDate,
    contractEndDate,
    setPayments,
    setDiscount,
    setQuantity,
    setDueDate
  })

  const isLoading = (key) => {
    if (key === 'load') return isLoadingData
    if (key === 'save') return isLoadingAction
    return false
  }

  const onAttemptFinalize = () => {
    // 1. Alerta se preencheu valor mas não adicionou
    if (Number(paymentForm.amount || 0) > 0) {
      if (!window.confirm("Você digitou um valor de pagamento mas não clicou em 'Adicionar Pagamento'.\n\nSe continuar, esse valor será ignorado.\n\nDeseja continuar mesmo assim?")) {
        return
      }
    }

    // 2. Alerta se não tem pagamentos (Dívida Total)
    if (payments.length === 0 && totalDue > 0) {
      if (!window.confirm("ATENÇÃO: Nenhum pagamento foi registrado.\n\nEssa venda gerará um SALDO DEVEDOR (Dívida) para o cliente.\n\nDeseja confirmar a venda a prazo?")) {
        return
      }
    }

    handleFinalize()
  }

  const renderPaymentFields = () => {
    const common = (
      <Col md="6">
        <FormGroup>
          <Label>Valor</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={paymentForm.amount}
            onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
          />
        </FormGroup>
      </Col>
    )

    if (paymentTab === "credito") {
      return (
        <>
          {common}
          <Col md="6">
            <FormGroup>
              <Label>Autorização</Label>
              <Input
                value={paymentForm.authorization}
                onChange={e => setPaymentForm(prev => ({ ...prev, authorization: e.target.value }))}
              />
            </FormGroup>
          </Col>
          <Col md="4">
            <FormGroup>
              <Label>Adquirente</Label>
              <Input
                value={paymentForm.acquirer}
                onChange={e => setPaymentForm(prev => ({ ...prev, acquirer: e.target.value }))}
              />
            </FormGroup>
          </Col>
          <Col md="4">
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
          <Col md="4">
            <FormGroup>
              <Label>Bandeira</Label>
              <Input
                value={paymentForm.brand}
                onChange={e => setPaymentForm(prev => ({ ...prev, brand: e.target.value }))}
              />
            </FormGroup>
          </Col>
        </>
      )
    }

    if (paymentTab === "debito") {
      return (
        <>
          {common}
          <Col md="6">
            <FormGroup>
              <Label>Adquirente</Label>
              <Input
                value={paymentForm.acquirer}
                onChange={e => setPaymentForm(prev => ({ ...prev, acquirer: e.target.value }))}
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Autorização</Label>
              <Input
                value={paymentForm.authorization}
                onChange={e => setPaymentForm(prev => ({ ...prev, authorization: e.target.value }))}
              />
            </FormGroup>
          </Col>
          <Col md="6">
            <FormGroup>
              <Label>Bandeira</Label>
              <Input
                value={paymentForm.brand}
                onChange={e => setPaymentForm(prev => ({ ...prev, brand: e.target.value }))}
              />
            </FormGroup>
          </Col>
        </>
      )
    }

    return (
      <>
        {common}
      </>
    )
  }

  return (
    <Container fluid className="client-new-sale">
      <Row className="g-4">
        <Col lg="8">
          <Card className="shadow-sm h-100">
            <CardHeader className="d-flex flex-wrap gap-2 align-items-center">
              <div className="client-contracts__tabs">
                {["contratos", "produtos", "servicos"].map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`client-profile__tab ${saleTab === key ? "client-profile__tab--active" : ""}`}
                    onClick={() => setSaleTab(key)}
                    disabled={isLoading('load')}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardBody>
              <Form>
                <Row className="g-3">
                  <Col md="8">
                    <FormGroup>
                      <Label>
                        {saleTab === "contratos" ? "Contrato" : saleTab === "produtos" ? "Produto" : "Serviço"}
                      </Label>
                      <Input
                        type="select"
                        value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}
                        disabled={isLoading('load')}
                      >
                        {saleTab === "contratos" && (
                          <option value="">Selecione um contrato</option>
                        )}
                        {(itemsByTab[saleTab] || []).map(item => (
                          <option key={item.id} value={item.id}>
                            {item.label} — {formatCurrency(item.total)}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  {saleTab === "contratos" && (
                    <Col md="4">
                      <FormGroup>
                        <Label>Início do contrato</Label>
                        <Input
                          type="date"
                          value={contractStartDate}
                          onChange={e => setContractStartDate(e.target.value)}
                        />
                      </FormGroup>
                    </Col>
                  )}
                  {saleTab === "produtos" && (
                    <Col md="4">
                      <FormGroup>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={e => setQuantity(Number(e.target.value) || 1)}
                        />
                      </FormGroup>
                    </Col>
                  )}
                  <Col md="4">
                    <FormGroup>
                      <Label>Desconto</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={e => setDiscount(Number(e.target.value) || 0)}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <div className="client-contracts__tabs mt-3">
                  {paymentTabs.map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`client-profile__tab ${paymentTab === tab.key ? "client-profile__tab--active" : ""}`}
                      onClick={() => setPaymentTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <Row className="g-3 mt-2">{renderPaymentFields()}</Row>
                <div className="d-flex justify-content-end mt-3">
                  <Button color="primary" size="sm" onClick={addPayment}>
                    Adicionar pagamento
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg="4">
          <Card className="shadow-sm h-100 client-new-sale__resume">
            <CardHeader>
              <h6 className="mb-0">Resumo</h6>
            </CardHeader>
            <CardBody className="d-grid gap-2">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Valor do item</span>
                <span className="fw-semibold">
                  {saleTab === "produtos" ? `${formatCurrency(selectedItem.total)} × ${computedQuantity}` : formatCurrency(selectedItem.total)}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Desconto</span>
                <span className="fw-semibold text-danger">{formatCurrency(discount || 0)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">Total a pagar</span>
                <span className="fw-semibold">{formatCurrency(totalDue)}</span>
              </div>

              <div className="client-summary__label mt-2">Pagamentos</div>
              <div className="d-grid gap-2 client-new-sale__payments">
                {payments.length === 0 && <div className="text-muted small">Nenhum pagamento adicionado.</div>}
                {payments.map(pay => (
                  <div className="d-flex justify-content-between align-items-center small" key={pay.id}>
                    <div>
                      <div className="fw-semibold text-capitalize">
                        {paymentTabs.find(t => t.key === pay.type)?.label || pay.type}
                      </div>
                      <div className="text-muted">
                        {pay.brand || pay.acquirer ? `${pay.brand || ""} ${pay.acquirer || ""}` : ""}
                        {pay.installments ? ` · ${pay.installments}x` : ""}
                        {pay.authorization ? ` · Aut: ${pay.authorization}` : ""}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-semibold">{formatCurrency(pay.amount)}</span>
                      <Button color="link" className="text-danger px-2" onClick={() => removePayment(pay.id)}>
                        <i className="mdi mdi-trash-can-outline" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {diff < 0 && (
                <div className="alert alert-warning py-2 px-3 mb-1">
                  Falta pagar {formatCurrency(Math.abs(diff))}
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <i className="mdi mdi-calendar" />
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                  {!dueDate && (
                    <div className="text-danger small mt-1">Informe uma data para quitar o saldo devedor.</div>
                  )}
                </div>
              )}
              {diff > 0 && (
                <div className="alert alert-info py-2 px-3 mb-1">
                  Gerado saldo credor de {formatCurrency(diff)}.
                </div>
              )}

              <ButtonLoader color="success" className="w-100" onClick={onAttemptFinalize} loading={isLoading('save')}>
                Finalizar venda
              </ButtonLoader>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ClientNewSale
