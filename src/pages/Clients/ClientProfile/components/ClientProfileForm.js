import React from 'react'
import { Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap'

const ClientProfileForm = ({ client }) => {
    return (
        <div className="profile-section">
            <div className="profile-section__title">
                <i className="mdi mdi-account-edit-outline" />
                Editar Perfil
            </div>

            <Form>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label for="firstName">Primeiro Nome</Label>
                            <Input type="text" id="firstName" defaultValue={client?.firstName} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label for="lastName">Sobrenome</Label>
                            <Input type="text" id="lastName" defaultValue={client?.lastName} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label for="birthDate">Data de Nascimento</Label>
                            <Input type="date" id="birthDate" defaultValue={client?.birthDate} />
                        </FormGroup>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="email">E-mail</Label>
                            <Input type="email" id="email" defaultValue={client?.email} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label for="phone">Telefone</Label>
                            <Input type="text" id="phone" defaultValue={client?.phone} />
                        </FormGroup>
                    </Col>
                </Row>

                <hr className="my-4" />

                <div className="profile-section__title">
                    <i className="mdi mdi-map-marker-outline" />
                    Endereço
                </div>

                <Row>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="zipCode">CEP</Label>
                            <Input type="text" id="zipCode" defaultValue={client?.zipCode} />
                        </FormGroup>
                    </Col>
                    <Col md={7}>
                        <FormGroup>
                            <Label for="street">Rua</Label>
                            <Input type="text" id="street" defaultValue={client?.street} />
                        </FormGroup>
                    </Col>
                    <Col md={2}>
                        <FormGroup>
                            <Label for="number">Número</Label>
                            <Input type="text" id="number" defaultValue={client?.number} />
                        </FormGroup>
                    </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button color="light">Cancelar</Button>
                    <Button color="primary" className="px-4">Salvar Alterações</Button>
                </div>
            </Form>
        </div>
    )
}

export default ClientProfileForm
