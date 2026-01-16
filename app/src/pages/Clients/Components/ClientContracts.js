import React, { useMemo } from "react"
import { Button, Card, CardBody, CardHeader, Col, Form, FormGroup, Input, Label, Row, Alert } from "reactstrap"

import SideMenu from "components/Common/SideMenu"
import StatusBadge from "components/Common/StatusBadge"
import { formatDate } from "../../../helpers/date"

import ButtonLoader from "../../../components/Common/ButtonLoader"
import ConfirmDialog from "../../../components/Common/ConfirmDialog"

import { CONTRACT_ACTION_TABS as ACTION_TABS } from "../Constants/defaults"
import {
  buildContractKey,
  getContractName,
  computeRemainingDays,
  getSuspensionDaysRemaining
} from "../Utils/contractsUtils"
import { useClientContracts } from "../Hooks/useClientContracts"
import { getStatusLabel } from "../../../helpers/status"

// Inline functions removed (buildContractKey)

const ClientContracts = ({ contracts = [], idClient = null, clientName = "", onRefresh = null }) => {
  const {
    selectedId,
    setSelectedId,
    activeAction,
    setActiveAction,
    adjustAddForm,
    setAdjustAddForm,
    adjustDebitForm,
    setAdjustDebitForm,
    cancelForm,
    setCancelForm,
    transferForm,
    setTransferForm,
    suspendForm,
    setSuspendForm,
    suspensions,
    selected,
    handleSuspend,
    handleStopSuspension,
    confirmStop,
    setConfirmStop,
    handleCancel,
    isLoading,
    selectedOverride
  } = useClientContracts(contracts, idClient, clientName, onRefresh)


  const handlePlaceholderSubmit = e => {
    e?.preventDefault?.()
  }

  // suspensionDaysRemaining removed (use getSuspensionDaysRemaining from utils)

  const renderContent = () => {
    if (!selected) {
      return (
        <Row>
          <Col>
            <p className="text-muted mb-0">Nenhum contrato selecionado.</p>
          </Col>
        </Row>
      )
    }

    switch (activeAction) {
      case "Dados":
        const remainingDays = computeRemainingDays(selected)
        return (
          <div className="d-grid gap-2 client-contracts__details">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Plano</span>
              <span>{getContractName(selected)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Contrato</span>
              <span className="fw-semibold">{selected.contractCode || selected.id}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Início</span>
              <span>{formatDate(selected.startDate)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Término</span>
              <span>{formatDate(selected.endDate)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Cobrança</span>
              <span>{selected.billing || "--"}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Saldo de dias</span>
              <span className="fw-semibold">
                {remainingDays !== null ? `${remainingDays} dias` : `${selected.balanceDays ?? "--"} dias`}
              </span>
            </div>
          </div>
        )
      case "Suspender":
        return (
          <div className="d-grid gap-3">
            {selected?.allowSuspension ? (
              <Alert color="light" className="mb-0" fade={false}>
                <div className="fw-semibold mb-2">Política de suspensão</div>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    {
                      label: "Máximo permitido",
                      value: `${selected.suspensionMaxDays || 0} dia(s)`,
                    },
                    {
                      label: "Já utilizados",
                      value: `${selected.totalSuspendedDays || 0} dia(s)`,
                    },
                    {
                      label: "Restantes",
                      value: `${getSuspensionDaysRemaining(selected) ?? (selected.suspensionMaxDays || 0)
                        } dia(s)`,
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="px-3 py-2 border rounded bg-white"
                      style={{ minWidth: 160 }}
                    >
                      <div className="text-uppercase text-muted small">{item.label}</div>
                      <div className="fw-semibold">{item.value}</div>
                    </div>
                  ))}
                </div>
              </Alert>
            ) : (
              <Alert color="warning" className="mb-0" fade={false}>
                Este contrato não permite suspensões.
              </Alert>
            )}
            <Form onSubmit={handleSuspend} className="d-grid gap-3">
              <Row className="g-3">
                <Col md="4">
                  <FormGroup>
                    <Label>Início</Label>
                    <Input
                      type="date"
                      value={suspendForm.start}
                      onChange={e => setSuspendForm(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Fim</Label>
                    <Input
                      type="date"
                      value={suspendForm.end}
                      onChange={e => setSuspendForm(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label>Justificativa</Label>
                    <Input
                      type="textarea"
                      rows="2"
                      value={suspendForm.reason}
                      onChange={e => setSuspendForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <div className="d-flex justify-content-end">
                <ButtonLoader color="primary" size="sm" type="submit" disabled={!selected?.allowSuspension} loading={isLoading('suspend')}>
                  Registrar suspensão
                </ButtonLoader>
              </div>
            </Form>
            <div>
              <h6 className="fw-semibold">Histórico</h6>
              {isLoading('suspensions') ? (
                <p className="text-muted mb-0">Carregando...</p>
              ) : suspensions.length === 0 ? (
                <p className="text-muted mb-0">Nenhuma suspensão registrada.</p>
              ) : (
                <div className="d-grid gap-2">
                  {suspensions.map(susp => (
                    <div key={susp.id} className="border rounded px-3 py-2 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-semibold">{formatDate(susp.startDate)} — {formatDate(susp.endDate)}</div>
                        <div className="text-muted small">
                          {susp.daysUsed} dia(s) • Status: <span className={`text-${(susp.status || "").toLowerCase() === 'active' ? 'success' : (susp.status || "").toLowerCase() === 'scheduled' ? 'warning' : 'secondary'}`}>{getStatusLabel(susp.status, 'suspension')}</span>
                          {(susp.status || "").toLowerCase() === 'stopped' && ` • Interrompido`}
                        </div>
                        {susp.reason && <div className="small">Motivo: {susp.reason}</div>}
                      </div>
                      {((susp.status || "").toLowerCase() === "active" || (susp.status || "").toLowerCase() === "scheduled") && (
                        <ButtonLoader
                          color="outline-danger"
                          size="sm"
                          className="px-2 py-0 d-flex align-items-center gap-1"
                          title="Interromper/Cancelar Suspensão"
                          onClick={() => setConfirmStop({ open: true, idSuspension: susp.id })}
                          loading={isLoading('stop-suspension')}
                        >
                          <i className="mdi mdi-stop-circle-outline"></i>
                          <span style={{ fontSize: '11px' }}>PARAR</span>
                        </ButtonLoader>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ConfirmDialog
              isOpen={confirmStop.open}
              title="Interromper Suspensão"
              message="Deseja realmente interromper esta suspensão? O contrato voltará a ficar ativo e a data de término será reajustada com base nos dias não utilizados."
              confirmText="Sim, interromper"
              confirmColor="danger"
              onConfirm={() => {
                handleStopSuspension(confirmStop.idSuspension)
                setConfirmStop({ open: false, idSuspension: null })
              }}
              onCancel={() => setConfirmStop({ open: false, idSuspension: null })}
            />
          </div>
        )
      case "Adicionar dias":
        return (
          <Form onSubmit={handlePlaceholderSubmit} className="d-grid gap-3">
            <Row className="g-3">
              <Col md="4">
                <FormGroup>
                  <Label>Dias a adicionar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustAddForm.days}
                    onChange={e => setAdjustAddForm(prev => ({ ...prev, days: e.target.value }))}
                  />
                </FormGroup>
              </Col>
              <Col md="8">
                <FormGroup>
                  <Label>Justificativa</Label>
                  <Input
                    value={adjustAddForm.reason}
                    onChange={e => setAdjustAddForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </FormGroup>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button color="primary" size="sm" type="submit">
                Adicionar
              </Button>
            </div>
          </Form>
        )
      case "Debitar dias":
        return (
          <Form onSubmit={handlePlaceholderSubmit} className="d-grid gap-3">
            <Row className="g-3">
              <Col md="4">
                <FormGroup>
                  <Label>Dias a debitar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustDebitForm.days}
                    onChange={e => setAdjustDebitForm(prev => ({ ...prev, days: e.target.value }))}
                  />
                </FormGroup>
              </Col>
              <Col md="8">
                <FormGroup>
                  <Label>Justificativa</Label>
                  <Input
                    value={adjustDebitForm.reason}
                    onChange={e => setAdjustDebitForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </FormGroup>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button color="danger" size="sm" type="submit">
                Debitar
              </Button>
            </div>
          </Form>
        )
      case "Cancelar":
        return (
          <Form onSubmit={handleCancel} className="d-grid gap-3">
            <Row className="g-3">
              <Col md="6">
                <FormGroup>
                  <Label>Quando</Label>
                  <Input
                    type="select"
                    value={cancelForm.mode}
                    onChange={e => setCancelForm(prev => ({ ...prev, mode: e.target.value }))}
                  >
                    <option value="now">Cancelar agora</option>
                    <option value="schedule">Agendar cancelamento</option>
                  </Input>
                </FormGroup>
              </Col>
              {cancelForm.mode === "schedule" && (
                <Col md="6">
                  <FormGroup>
                    <Label>Data de cancelamento</Label>
                    <Input
                      type="date"
                      value={cancelForm.date}
                      onChange={e => setCancelForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </FormGroup>
                </Col>
              )}
              <Col md="12">
                <FormGroup>
                  <Label>Motivo</Label>
                  <Input
                    type="textarea"
                    rows="2"
                    value={cancelForm.reason}
                    onChange={e => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </FormGroup>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <ButtonLoader color="primary" size="sm" type="submit" loading={isLoading('cancel')}>
                Confirmar cancelamento
              </ButtonLoader>
            </div>
          </Form>
        )
      case "Transferir":
        return (
          <Form onSubmit={handlePlaceholderSubmit} className="d-grid gap-3">
            <Row className="g-3">
              <Col md="6">
                <FormGroup>
                  <Label>Transferir para</Label>
                  <Input
                    type="text"
                    value={transferForm.target}
                    onChange={e => setTransferForm(prev => ({ ...prev, target: e.target.value }))}
                    placeholder="Nome do aluno"
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label>Observações</Label>
                  <Input
                    type="textarea"
                    rows="2"
                    value={transferForm.note}
                    onChange={e => setTransferForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </FormGroup>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button color="primary" size="sm" type="submit">
                Confirmar transferência
              </Button>
            </div>
          </Form>
        )
      default:
        return null
    }
  }

  const sideMenuItems = useMemo(
    () =>
      contracts.map((item, index) => {
        const uniqueKey = buildContractKey(item, index)
        const displayItem =
          uniqueKey === selectedId && selectedOverride ? { ...item, ...selectedOverride } : item
        return {
          id: uniqueKey,
          originalId: item.id,
          title: getContractName(displayItem),
          subtitle: getStatusLabel(displayItem.status, "contract"),
          meta: `${formatDate(displayItem.startDate)} • ${formatDate(
            displayItem.endDate
          )}`,
        }
      }),
    [contracts, selectedId, selectedOverride]
  )

  return (
    <Row className="g-4">
      <Col lg="4">
        <SideMenu
          title="Contratos"
          description="Histórico e status dos contratos do cliente."
          items={sideMenuItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyLabel="Nenhum contrato registrado."
        />
      </Col>
      <Col lg="8">
        <Card className="shadow-sm h-100 client-contracts">
          <CardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="text-uppercase text-muted mb-1">Contrato selecionado</h6>
              <h4 className="mb-0">{getContractName(selected)}</h4>
              {selected?.status && (
                <StatusBadge status={selected.status} type="contract" />
              )}
            </div>
            <div className="client-contracts__tabs">
              {ACTION_TABS.map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`client-profile__tab ${activeAction === tab ? "client-profile__tab--active" : ""}`}
                  onClick={() => setActiveAction(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody>{renderContent()}</CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default ClientContracts
