import React from "react"
import { Row, Col, Label, Input, FormFeedback } from "reactstrap"
import InputMask from "react-input-mask"

const PersonalData = ({ validation }) => {
    return (
        <>
            <h5 className="font-size-14 mb-3">Dados Pessoais</h5>

            <Row>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Nome</Label>
                        <Input
                            name="firstName"
                            placeholder="Nome"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.firstName}
                            invalid={!!(validation.touched.firstName && validation.errors.firstName)}
                        />
                        {validation.touched.firstName && validation.errors.firstName && <FormFeedback>{validation.errors.firstName}</FormFeedback>}
                    </div>
                </Col>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Sobrenome</Label>
                        <Input
                            name="lastName"
                            placeholder="Sobrenome"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.lastName}
                            invalid={!!(validation.touched.lastName && validation.errors.lastName)}
                        />
                        {validation.touched.lastName && validation.errors.lastName && <FormFeedback>{validation.errors.lastName}</FormFeedback>}
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Data de Nascimento</Label>
                        <Input
                            name="birthDate"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.birthDate}
                            invalid={!!(validation.touched.birthDate && validation.errors.birthDate)}
                        />
                        {validation.touched.birthDate && validation.errors.birthDate && <FormFeedback>{validation.errors.birthDate}</FormFeedback>}
                    </div>
                </Col>
                <Col md={6}>
                    <div className="mb-3">
                        <Label>Sexo</Label>
                        <Input
                            type="select"
                            name="gender"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.gender}
                        >
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                        </Input>
                    </div>
                </Col>
            </Row>

            <div className="mb-3">
                <Label>Telefone</Label>
                <InputMask
                    mask="(99) 99999-9999"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.phone}
                >
                    {(inputProps) => (
                        <Input
                            {...inputProps}
                            name="phone"
                            placeholder="(00) 00000-0000"
                            invalid={!!(validation.touched.phone && validation.errors.phone)}
                        />
                    )}
                </InputMask>
                {validation.touched.phone && validation.errors.phone && <FormFeedback>{validation.errors.phone}</FormFeedback>}
            </div>

            <div className="mb-3">
                <Label>E-mail</Label>
                <Input
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.email}
                    invalid={!!(validation.touched.email && validation.errors.email)}
                />
                {validation.touched.email && validation.errors.email && <FormFeedback>{validation.errors.email}</FormFeedback>}
            </div>
        </>
    )
}

export default PersonalData
