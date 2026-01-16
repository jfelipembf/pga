import React, { useState, useEffect } from "react"
import {
    Form,
    Row,
    Col,
    Label,
    Input,
    Card,
    CardBody,
} from "reactstrap"
import ButtonLoader from "./ButtonLoader"
import { GENDER } from "../../constants/gender"
import PropTypes from "prop-types"

const PersonalDataForm = ({ initialValues = {}, onSubmit, submitting }) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        birthdate: "",
        gender: "",
        email: "",
        phone: "",
        address: "",
        photo: null,
        photoPreview: null,
        ...initialValues,
    })

    // Update form data if initialValues change
    useEffect(() => {
        setFormData((prev) => ({ ...prev, ...initialValues }))
    }, [initialValues])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData((prev) => ({
                ...prev,
                photo: file,
                photoPreview: URL.createObjectURL(file), // Create preview URL
            }))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (onSubmit) {
            onSubmit(formData)
        }
    }

    return (
        <Card>
            <CardBody>
                <Form onSubmit={handleSubmit}>
                    {/* Photo Upload Section */}
                    <div className="d-flex align-items-center mb-4">
                        <div className="position-relative me-4">
                            <div
                                className="avatar-xl rounded-circle bg-light d-flex justify-content-center align-items-center overflow-hidden"
                                style={{ width: "100px", height: "100px", border: "2px solid #eee" }}
                            >
                                {formData.photoPreview || formData.photo ? (
                                    <img
                                        src={formData.photoPreview || formData.photo}
                                        alt="Preview"
                                        className="img-fluid"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <i className="mdi mdi-account fs-1 text-secondary"></i>
                                )}
                            </div>
                            <Label
                                htmlFor="photo-upload"
                                className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    cursor: "pointer",
                                    margin: 0,
                                    border: "2px solid white",
                                }}
                            >
                                <i className="mdi mdi-camera fs-6"></i>
                            </Label>
                            <Input
                                type="file"
                                id="photo-upload"
                                accept="image/*"
                                className="d-none"
                                onChange={handlePhotoChange}
                            />
                        </div>
                        <div>
                            <h5 className="mb-1">Foto de Perfil</h5>
                            <p className="text-muted mb-0">Clique na câmera para alterar</p>
                        </div>
                    </div>

                    <Row>
                        <Col md={6} className="mb-3">
                            <Label for="firstName">Nome</Label>
                            <Input
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={formData.firstName || ""}
                                onChange={handleChange}
                                placeholder="Nome"
                            />
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label for="lastName">Sobrenome</Label>
                            <Input
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={formData.lastName || ""}
                                onChange={handleChange}
                                placeholder="Sobrenome"
                            />
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6} className="mb-3">
                            <Label for="dob">Data de Nascimento</Label>
                            <Input
                                type="date"
                                name="birthdate"
                                id="dob"
                                value={formData.birthdate || ""}
                                onChange={handleChange}
                            />
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label for="gender">Sexo</Label>
                            <Input
                                type="select"
                                name="gender"
                                id="gender"
                                value={formData.gender || ""}
                                onChange={handleChange}
                            >
                                <option value="">Selecione...</option>
                                {Object.values(GENDER).map((g) => (
                                    <option key={g.value} value={g.value}>
                                        {g.label}
                                    </option>
                                ))}
                            </Input>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6} className="mb-3">
                            <Label for="email">Email</Label>
                            <Input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email || ""}
                                onChange={handleChange}
                                placeholder="exemplo@email.com"
                            />
                        </Col>
                        <Col md={6} className="mb-3">
                            <Label for="phone">Telefone</Label>
                            <Input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                            />
                        </Col>
                    </Row>

                    <Col className="mb-3">
                        <Label for="address">Endereço Completo</Label>
                        <Input
                            type="textarea"
                            name="address"
                            id="address"
                            value={formData.address || ""}
                            onChange={handleChange}
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                            rows={3}
                        />
                    </Col>

                    <div className="d-flex justify-content-end mt-3">
                        <ButtonLoader color="primary" type="submit" loading={submitting}>
                            Salvar
                        </ButtonLoader>
                    </div>
                </Form>
            </CardBody>
        </Card>
    )
}

PersonalDataForm.propTypes = {
    initialValues: PropTypes.object,
    onSubmit: PropTypes.func,
}

export default PersonalDataForm
