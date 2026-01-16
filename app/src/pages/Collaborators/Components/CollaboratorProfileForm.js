import React from "react"
import { Col, Form, FormGroup, Input, Label, Row } from "reactstrap"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { formatTitleCase } from "../../../helpers/string"

const CollaboratorProfileForm = ({ value, onChange, passwordValue, onPasswordChange, onSave, saving, savingPassword, roles = [] }) => {
  const update = (field, val) => {
    let finalValue = val;
    const fieldsToFormat = [
      "firstName", "lastName",
      "city", "neighborhood", "address", "street", "complement", "state"
    ];

    if (fieldsToFormat.includes(field) && typeof val === "string") {
      finalValue = formatTitleCase(val);
    }

    onChange?.(field, finalValue)
  }
  const updatePwd = (field, val) => onPasswordChange?.(field, val)

  const handleSave = () => onSave?.()
  const handlePasswordSave = () => {
    if (!passwordValue?.current || !passwordValue?.next || passwordValue.next !== passwordValue.confirm) {
      return
    }
    // Chama a função de alterar senha do pai
    onSave?.('password')
  }

  return (
    <Form>
      <Row className="g-3">
        <Col md="6">
          <FormGroup>
            <Label>Nome</Label>
            <Input value={value.firstName} onChange={e => update("firstName", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Sobrenome</Label>
            <Input value={value.lastName} onChange={e => update("lastName", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Função (Cargo)</Label>
            <Input
              type="select"
              value={value.role}
              onChange={e => {
                const selectedRoleName = e.target.value;
                update("role", selectedRoleName);
                const roleObj = roles.find(r => (r.name || r.label) === selectedRoleName);
                if (roleObj) {
                  update("roleId", roleObj.id);
                  update("isInstructor", !!roleObj.isInstructor);
                }
              }}
            >
              <option value="">Selecione...</option>
              {roles.map(r => (
                <option key={r.id} value={r.name || r.label}>
                  {r.name || r.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Status</Label>
            <Input type="select" value={value.status} onChange={e => update("status", e.target.value)}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </Input>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Email</Label>
            <Input type="email" value={value.email} onChange={e => update("email", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Telefone</Label>
            <Input value={value.phone} onChange={e => update("phone", e.target.value)} />
          </FormGroup>
        </Col>
      </Row>

      <hr className="my-4" />
      <h6 className="fw-semibold mb-3">Informações Profissionais</h6>
      <Row className="g-3">
        <Col md="6">
          <FormGroup>
            <Label>Data de contratação</Label>
            <Input type="date" value={value.hireDate || ""} onChange={e => update("hireDate", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Conselho de classe</Label>
            <Input value={value.council || ""} onChange={e => update("council", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Regime</Label>
            <Input type="select" value={value.employmentType || ""} onChange={e => update("employmentType", e.target.value)}>
              <option value="">Selecione</option>
              <option value="clt">CLT</option>
              <option value="pj">PJ</option>
            </Input>
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Salário base</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={value.salary || ""}
              onChange={e => update("salary", e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>

      <hr className="my-4" />
      <h6 className="fw-semibold mb-3">Endereço</h6>
      <Row className="g-3">
        <Col md="3">
          <FormGroup>
            <Label>CEP</Label>
            <Input value={value.address?.zip || value.zip || ""} onChange={e => update("zip", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="6">
          <FormGroup>
            <Label>Rua</Label>
            <Input
              value={value.address?.street || value.address?.address || (typeof value.address === 'string' ? value.address : "") || ""}
              onChange={e => update("address", e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="3">
          <FormGroup>
            <Label>Número</Label>
            <Input value={value.address?.number || value.number || ""} onChange={e => update("number", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>Bairro</Label>
            <Input value={value.address?.neighborhood || value.neighborhood || ""} onChange={e => update("neighborhood", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>Cidade</Label>
            <Input value={value.address?.city || value.city || ""} onChange={e => update("city", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>Estado</Label>
            <Input value={value.address?.state || value.state || ""} onChange={e => update("state", e.target.value)} />
          </FormGroup>
        </Col>
        <Col md="12">
          <FormGroup>
            <Label>Complemento</Label>
            <Input value={value.address?.complement || value.complement || ""} onChange={e => update("complement", e.target.value)} />
          </FormGroup>
        </Col>
      </Row>

      <hr className="my-4" />
      <h6 className="fw-semibold mb-3">Alterar senha</h6>
      <Row className="g-3">
        <Col md="4">
          <FormGroup>
            <Label>Senha atual</Label>
            <Input
              type="password"
              value={passwordValue.current}
              onChange={e => updatePwd("current", e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={passwordValue.next}
              onChange={e => updatePwd("next", e.target.value)}
            />
          </FormGroup>
        </Col>
        <Col md="4">
          <FormGroup>
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              value={passwordValue.confirm}
              onChange={e => updatePwd("confirm", e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>
      <div className="d-flex justify-content-end mt-3 gap-2">
        <ButtonLoader color="primary" onClick={handleSave} loading={saving}>
          Salvar alterações
        </ButtonLoader>
        <ButtonLoader color="secondary" onClick={handlePasswordSave} loading={savingPassword}>
          Alterar senha
        </ButtonLoader>
      </div>
    </Form >
  )
}

export default CollaboratorProfileForm
