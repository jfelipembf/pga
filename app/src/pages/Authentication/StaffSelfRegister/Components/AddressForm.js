import React from "react"
import { Row, Col, Label, Input, FormFeedback } from "reactstrap"
import InputMask from "react-input-mask"

const AddressForm = ({ validation, handleCepBlur }) => {
    return (
        <>
            <h5 className="font-size-14 mb-3 mt-4">Endereço</h5>

            <Row>
                <Col md={4}>
                    <div className="mb-3">
                        <Label>CEP</Label>
                        <InputMask
                            mask="99999-999"
                            onChange={validation.handleChange}
                            onBlur={handleCepBlur}
                            value={validation.values.cep}
                        >
                            {(inputProps) => (
                                <Input
                                    {...inputProps}
                                    name="cep"
                                    placeholder="00000-000"
                                    invalid={!!(validation.touched.cep && validation.errors.cep)}
                                />
                            )}
                        </InputMask>
                        {validation.touched.cep && validation.errors.cep && <FormFeedback>{validation.errors.cep}</FormFeedback>}
                    </div>
                </Col>
                <Col md={8}>
                    <div className="mb-3">
                        <Label>Cidade</Label>
                        <Input
                            name="city"
                            placeholder="Cidade"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.city}
                            invalid={!!(validation.touched.city && validation.errors.city)}
                        />
                        {validation.touched.city && validation.errors.city && <FormFeedback>{validation.errors.city}</FormFeedback>}
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={4}>
                    <div className="mb-3">
                        <Label>Estado</Label>
                        <Input
                            name="state"
                            placeholder="UF"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.state}
                            invalid={!!(validation.touched.state && validation.errors.state)}
                        />
                        {validation.touched.state && validation.errors.state && <FormFeedback>{validation.errors.state}</FormFeedback>}
                    </div>
                </Col>
                <Col md={8}>
                    <div className="mb-3">
                        <Label>Bairro</Label>
                        <Input
                            name="neighborhood"
                            placeholder="Bairro"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.neighborhood}
                            invalid={!!(validation.touched.neighborhood && validation.errors.neighborhood)}
                        />
                        {validation.touched.neighborhood && validation.errors.neighborhood && <FormFeedback>{validation.errors.neighborhood}</FormFeedback>}
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={8}>
                    <div className="mb-3">
                        <Label>Endereço</Label>
                        <Input
                            name="address"
                            placeholder="Rua, Av..."
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.address}
                            invalid={!!(validation.touched.address && validation.errors.address)}
                        />
                        {validation.touched.address && validation.errors.address && <FormFeedback>{validation.errors.address}</FormFeedback>}
                    </div>
                </Col>
                <Col md={4}>
                    <div className="mb-3">
                        <Label>Número</Label>
                        <Input
                            name="number"
                            placeholder="Nº"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.number}
                            invalid={!!(validation.touched.number && validation.errors.number)}
                        />
                        {validation.touched.number && validation.errors.number && <FormFeedback>{validation.errors.number}</FormFeedback>}
                    </div>
                </Col>
            </Row>
        </>
    )
}

export default AddressForm
