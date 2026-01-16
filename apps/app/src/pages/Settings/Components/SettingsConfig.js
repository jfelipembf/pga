import React, { useState } from "react"
import {
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
} from "reactstrap"

const SettingsConfig = ({
  finance,
  sales,
  onFinanceChange,
  onSalesChange,
  onAddBankAccount,
  onSelectBankAccount,
}) => {
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [bankForm, setBankForm] = useState({
    bank: "",
    agency: "",
    account: "",
    type: "",
    pix: "",
  })

  const toggleBankModal = () => {
    setBankModalOpen(prev => !prev)
    setBankForm({ bank: "", agency: "", account: "", type: "", pix: "" })
  }

  const handleAddBank = e => {
    e.preventDefault()
    onAddBankAccount?.(bankForm)
    toggleBankModal()
  }

  return (
    <>
      <Form>
        <Row className="g-3">
          <Col xs={12} md={12}>
            <FormGroup check className="mb-3">
              <Input
                type="checkbox"
                id="autoCloseCashier"
                checked={finance.autoCloseCashier}
                onChange={e => onFinanceChange("autoCloseCashier", e.target.checked)}
              />
              <Label for="autoCloseCashier" check>
                Fechar o caixa automaticamente às 00:00
              </Label>
            </FormGroup>
          </Col>
          <Col xs={12} md={6}>
            <FormGroup>
              <Label>Contas bancárias</Label>
              <div className="d-flex gap-2">
                <Input
                  type="select"
                  value={finance.selectedBankAccount}
                  onChange={e => onSelectBankAccount?.(e.target.value)}
                >
                  {finance.bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank} — {acc.account}
                    </option>
                  ))}
                </Input>
                <Button color="primary" type="button" onClick={toggleBankModal}>
                  Nova conta
                </Button>
              </div>
            </FormGroup>
          </Col>
          <Col xs={12} md={6} className="d-flex align-items-center">
            <div className="text-muted small">Gerencie as contas usadas em repasses e recebimentos.</div>
          </Col>
          <Col xs={12} md={6}>
            <FormGroup>
              <Label>Cancelar contrato após quantos dias de inadimplência?</Label>
              <Input
                type="number"
                min="0"
                value={finance.cancelContractAfterDays}
                onChange={e => onFinanceChange("cancelContractAfterDays", Number(e.target.value) || 0)}
              />
            </FormGroup>
          </Col>
          <Col xs={12} md={6}>
            <FormGroup>
              <Label>Excluir vendas após quantos dias sem pagamento?</Label>
              <Input
                type="number"
                min="0"
                value={finance.deleteSalesAfterDays}
                onChange={e => onFinanceChange("deleteSalesAfterDays", Number(e.target.value) || 0)}
              />
            </FormGroup>
          </Col>
          <Col xs={12} md={6}>
            <FormGroup check>
              <Input
                type="checkbox"
                id="cancelDebt"
                checked={finance.cancelDebtOnCancelledContracts}
                onChange={e => onFinanceChange("cancelDebtOnCancelledContracts", e.target.checked)}
              />
              <Label for="cancelDebt" check>
                Cancelar saldo devedor em contratos cancelados por inadimplência
              </Label>
            </FormGroup>
          </Col>
          <Col xs={12} md={6}>
            <FormGroup>
              <Label>Considerar cliente inadimplente após quantos dias de atraso?</Label>
              <Input
                type="number"
                min="0"
                value={finance.considerInadimplentAfterDays}
                onChange={e => onFinanceChange("considerInadimplentAfterDays", Number(e.target.value) || 0)}
              />
            </FormGroup>
          </Col>
        </Row>

        <hr className="my-4" />
        <h6 className="fw-semibold mb-3">Vendas</h6>
        <Row className="g-3">
          <Col xs={12} md={12}>
            <FormGroup check>
              <Input
                type="checkbox"
                id="treatRenewal"
                checked={sales.treatNewSaleAsRenewal}
                onChange={e => onSalesChange("treatNewSaleAsRenewal", e.target.checked)}
              />
              <Label for="treatRenewal" check>
                Considerar nova venda como renovação
              </Label>
            </FormGroup>
          </Col>
          <Col xs={12} md={12}>
            <FormGroup check>
              <Input
                type="checkbox"
                id="sendReceipt"
                checked={sales.sendReceiptEmail}
                onChange={e => onSalesChange("sendReceiptEmail", e.target.checked)}
              />
              <Label for="sendReceipt" check>
                Enviar recibo por email
              </Label>
            </FormGroup>
          </Col>
          <Col xs={12} md={12}>
            <FormGroup check>
              <Input
                type="checkbox"
                id="allowDebtEnrollment"
                checked={sales.allowEnrollmentWithDebt}
                onChange={e => onSalesChange("allowEnrollmentWithDebt", e.target.checked)}
              />
              <Label for="allowDebtEnrollment" check>
                Permitir matricular gerando um saldo devedor
              </Label>
            </FormGroup>
          </Col>
        </Row>
      </Form>

      <Modal isOpen={bankModalOpen} toggle={toggleBankModal}>
        <ModalHeader toggle={toggleBankModal}>Nova conta bancária</ModalHeader>
        <Form onSubmit={handleAddBank}>
          <ModalBody>
            <FormGroup>
              <Label>Banco</Label>
              <Input value={bankForm.bank} onChange={e => setBankForm(prev => ({ ...prev, bank: e.target.value }))} required />
            </FormGroup>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <FormGroup>
                  <Label>Agência</Label>
                  <Input value={bankForm.agency} onChange={e => setBankForm(prev => ({ ...prev, agency: e.target.value }))} required />
                </FormGroup>
              </Col>
              <Col xs={12} md={6}>
                <FormGroup>
                  <Label>Conta</Label>
                  <Input value={bankForm.account} onChange={e => setBankForm(prev => ({ ...prev, account: e.target.value }))} required />
                </FormGroup>
              </Col>
            </Row>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <FormGroup>
                  <Label>Tipo</Label>
                  <Input value={bankForm.type} onChange={e => setBankForm(prev => ({ ...prev, type: e.target.value }))} />
                </FormGroup>
              </Col>
              <Col xs={12} md={6}>
                <FormGroup>
                  <Label>Chave Pix</Label>
                  <Input value={bankForm.pix} onChange={e => setBankForm(prev => ({ ...prev, pix: e.target.value }))} />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={toggleBankModal}>
              Cancelar
            </Button>
            <Button color="primary" type="submit">
              Salvar conta
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </>
  )
}

export default SettingsConfig
