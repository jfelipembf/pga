import React, { useState } from "react"
import { Button, Card, CardBody, CardHeader, Col, Form, FormGroup, Input, Label, Row, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap"
import ButtonLoader from "../../../../components/Common/ButtonLoader"
import AcquirerFeesFields from "./AcquirerFeesFields"

const AcquirerForm = ({
  value,
  onChange,
  onSave,
  onClear,
  onToggleActive,
  onToggleBrand,
  onToggleAnticipate,
  onInstallmentChange,
  onAddInstallment,
  onRemoveInstallment,
  brandOptions,
  saving = false,
  // Brand Fees Logic
  getBrandFeeState,
  initializeBrandFees,
  removeBrandFees,
  onBrandFeeChange,
  onBrandToggleAnticipate,
  onBrandInstallmentChange,
  onBrandAddInstallment,
  onBrandRemoveInstallment
}) => {
  const formState = value || {}
  const [editingBrandId, setEditingBrandId] = useState(null)

  const updateField = (field, transform = v => v) => e => {
    const next = { ...formState, [field]: transform(e.target.value) }
    onChange?.(next)
  }

  const handleEditBrandFees = (brandId) => {
    if (!getBrandFeeState?.(brandId)) {
      initializeBrandFees?.(brandId)
    }
    setEditingBrandId(brandId)
  }

  const handleCloseBrandModal = () => {
    setEditingBrandId(null)
  }

  const handleRemoveBrandFees = () => {
    if (editingBrandId) {
      removeBrandFees?.(editingBrandId)
      setEditingBrandId(null)
    }
  }

  const currentBrandFees = editingBrandId ? getBrandFeeState?.(editingBrandId) : null
  const editingBrandLabel = brandOptions.find(b => b.id === editingBrandId)?.label || "Bandeira"

  return (
    <Card className="shadow-sm h-100">
      <CardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 className="mb-1">{formState.name ? formState.name : "Nova adquirente"}</h5>
          <p className="text-muted mb-0 small">Informe as taxas e bandeiras aceitas pela adquirente.</p>
        </div>
        <div className="d-flex gap-2">
          <Button color="light" onClick={onClear} disabled={saving}>
            Limpar
          </Button>
          <ButtonLoader
            color="primary"
            onClick={() => onSave?.(formState)}
            loading={saving}
          >
            Salvar
          </ButtonLoader>
        </div>
      </CardHeader>
      <CardBody>
        <Form>
          <Row className="g-3">
            <Col md="8">
              <FormGroup>
                <Label>Nome</Label>
                <Input value={formState.name || ""} onChange={updateField("name")} required />
              </FormGroup>
            </Col>
            <Col md="4">
              <FormGroup>
                <Label>Status</Label>
                <div className="form-check form-switch mt-2">
                  <Input type="switch" id="acquirerStatus" checked={!formState.inactive} onChange={onToggleActive} />
                  <Label className="form-check-label ms-2" htmlFor="acquirerStatus">
                    {formState.inactive ? "Inativo" : "Ativo"}
                  </Label>
                </div>
              </FormGroup>
            </Col>

            <Col md="12">
              <Label className="d-block">Bandeiras</Label>
              <div className="d-flex flex-wrap gap-3">
                {brandOptions.map(brand => {
                  const isChecked = (formState.brands || []).includes(brand.id)
                  const hasCustomFees = !!formState.brandFees?.[brand.id]

                  return (
                    <div className="d-flex align-items-center gap-1" key={brand.id}>
                      <div className="form-check mb-0">
                        <Input
                          type="checkbox"
                          id={`brand-${brand.id}`}
                          checked={isChecked}
                          onChange={() => onToggleBrand?.(brand.id)}
                        />
                        <Label className="form-check-label ms-1" htmlFor={`brand-${brand.id}`}>
                          {brand.label}
                        </Label>
                      </div>
                      {isChecked && (
                        <Button
                          color={hasCustomFees ? "primary" : "light"}
                          size="sm"
                          className="py-0 px-1"
                          style={{ lineHeight: "1.5", fontSize: "0.7rem" }}
                          onClick={() => handleEditBrandFees(brand.id)}
                          title={hasCustomFees ? "Taxas personalizadas configuradas" : "Configurar taxas específicas"}
                        >
                          <i className="mdi mdi-cog" />
                        </Button>
                      )}
                    </div>
                  )
                })}
                {formState.brands?.includes("others") && (
                  <Input
                    className="mt-2"
                    placeholder="Outra bandeira"
                    value={formState.otherBrandName || ""}
                    onChange={updateField("otherBrandName")}
                  />
                )}
              </div>
            </Col>

            <Col md="12">
              <hr />
              <h6 className="mb-3">Taxas Padrão (Aplicadas a todas as bandeiras sem configuração específica)</h6>
              <AcquirerFeesFields
                values={formState}
                onChange={(field, val) => updateField(field, () => val)()}
                onInstallmentChange={onInstallmentChange}
                onAddInstallment={onAddInstallment}
                onRemoveInstallment={onRemoveInstallment}
                onToggleAnticipate={onToggleAnticipate}
              />
            </Col>
          </Row>
        </Form>
      </CardBody>

      {/* Modal de Edição de Taxas por Bandeira */}
      <Modal isOpen={!!editingBrandId} toggle={handleCloseBrandModal} size="lg">
        <ModalHeader toggle={handleCloseBrandModal}>
          Taxas específicas para {editingBrandLabel}
        </ModalHeader>
        <ModalBody>
          <p className="text-muted">
            Configure taxas exclusivas para esta bandeira. Se remover a personalização, serão usadas as taxas padrão.
          </p>
          {currentBrandFees && (
            <AcquirerFeesFields
              values={currentBrandFees}
              onChange={(field, val) => onBrandFeeChange?.(editingBrandId, field, val)}
              onInstallmentChange={(idx, field, val) => onBrandInstallmentChange?.(editingBrandId, idx, field, val)}
              onAddInstallment={() => onBrandAddInstallment?.(editingBrandId)}
              onRemoveInstallment={(idx) => onBrandRemoveInstallment?.(editingBrandId, idx)}
              onToggleAnticipate={() => onBrandToggleAnticipate?.(editingBrandId)}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" outline onClick={handleRemoveBrandFees}>
            Usar Taxas Padrão
          </Button>
          <Button color="primary" onClick={handleCloseBrandModal}>
            Concluir Edição
          </Button>
        </ModalFooter>
      </Modal>
    </Card>
  )
}

export default AcquirerForm
