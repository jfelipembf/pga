import React, { useEffect, useState } from "react"
import { Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row } from "reactstrap"

import PhotoPreview from "components/Common/PhotoPreview"
import { PLACEHOLDER_CAMERA } from "../../../Clients/Constants/defaults"

const ProductForm = ({ value, onChange, onSave }) => {
  const [formState, setFormState] = useState(value)

  useEffect(() => {
    setFormState(value)
  }, [value])

  const updateField =
    (field, transform = v => v) =>
      e => {
        const next = { ...formState, [field]: transform(e.target.value) }
        setFormState(next)
        onChange?.(next)
      }

  const handlePhotoChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const next = { ...formState, preview: reader.result, photo: file }
      setFormState(next)
      onChange?.(next)
    }
    reader.readAsDataURL(file)
  }

  if (!formState) {
    return (
      <Card className="shadow-sm h-100">
        <CardBody className="d-flex justify-content-center align-items-center text-muted">
          Selecione ou crie um produto.
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm h-100">
      <CardBody>
        <Form className="catalog-form">
          <Row className="g-3 align-items-start catalog-form__layout">
            <Col md="3" className="catalog-form__photo d-flex justify-content-start">
              <PhotoPreview
                inputId="productPhoto"
                preview={formState.preview || formState.photo}
                placeholder={PLACEHOLDER_CAMERA}
                onChange={handlePhotoChange}
                size={160}
              />
            </Col>
            <Col md="9">
              <Row className="g-3">
                <Col md="12">
                  <FormGroup>
                    <Label>Nome</Label>
                    <Input value={formState.name} onChange={updateField("name")} required />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Categoria</Label>
                    <Input value={formState.category} onChange={updateField("category")} />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>SKU</Label>
                    <Input value={formState.sku} onChange={updateField("sku")} />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Preço de venda</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.price}
                      onChange={updateField("price", Number)}
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Preço de compra</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.purchasePrice}
                      onChange={updateField("purchasePrice", Number)}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Estoque atual</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.stock}
                      onChange={updateField("stock", Number)}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Estoque mínimo</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.minStock}
                      onChange={updateField("minStock", Number)}
                    />
                  </FormGroup>
                </Col>
                <Col md="4">
                  <FormGroup>
                    <Label>Código de barras</Label>
                    <Input value={formState.barcode} onChange={updateField("barcode")} />
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label>Descrição</Label>
                    <Input
                      type="textarea"
                      rows="3"
                      value={formState.description}
                      onChange={updateField("description")}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </Col>
          </Row>
          <div className="d-flex justify-content-end mt-4">
            <Button
              color="primary"
              onClick={() =>
                onSave?.({
                  ...formState,
                  preview: formState.preview || formState.photo,
                })
              }
            >
              Salvar produto
            </Button>
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}

export default ProductForm
