import React, { useState } from "react"
import {
    Form,
    Row,
    Col,
    Label,
    Input,
    CardTitle,
    FormFeedback,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
} from "reactstrap"
import classnames from "classnames"
import ButtonLoader from "../../../components/Common/ButtonLoader"
import { GENDER } from "../../../constants/gender"
import PropTypes from "prop-types"

import { fetchAddressByCep } from "../../../helpers/cep_helper"
import { slugify } from "../../../helpers/url_sanitizer"

const AcademyForm = ({ onSubmit, submitting, onCheckSlug }) => {
    const [activeTab, setActiveTab] = useState("1")
    const [slugAvailable, setSlugAvailable] = useState(null)
    const [slugLoading, setSlugLoading] = useState(false)
    const [cepLoading, setCepLoading] = useState(null) // 'company' or 'owner' or null

    const [formData, setFormData] = useState({
        // Company Info
        photo: null,
        photoPreview: null,
        businessName: "",
        tradeName: "",
        slug: "",
        cnpj: "",
        email: "",
        phone: "",
        website: "",

        // Company Address
        addressZip: "",
        addressState: "",
        addressCity: "",
        addressNeighborhood: "",
        addressStreet: "",
        addressNumber: "",

        // Owner Info
        ownerFirstName: "",
        ownerLastName: "",
        ownerGender: "",
        ownerBirthdate: "",
        ownerEmail: "", // Required for auth
        ownerPhone: "",

        // Owner Address
        ownerAddressZip: "",
        ownerAddressState: "",
        ownerAddressCity: "",
        ownerAddressNeighborhood: "",
        ownerAddressStreet: "",
        ownerAddressNumber: "",
    })

    const handleCepBlur = async (prefix) => {
        const fieldName = prefix === "company" ? "addressZip" : "ownerAddressZip"
        const cep = formData[fieldName]

        if (!cep) return

        setCepLoading(prefix)
        const addressData = await fetchAddressByCep(cep)
        setCepLoading(null)

        if (addressData) {
            setFormData((prev) => {
                const newData = { ...prev }
                if (prefix === "company") {
                    newData.addressState = addressData.state || ""
                    newData.addressCity = addressData.city || ""
                    newData.addressNeighborhood = addressData.neighborhood || ""
                    newData.addressStreet = addressData.street || ""
                } else {
                    newData.ownerAddressState = addressData.state || ""
                    newData.ownerAddressCity = addressData.city || ""
                    newData.ownerAddressNeighborhood = addressData.neighborhood || ""
                    newData.ownerAddressStreet = addressData.street || ""
                }
                return newData
            })
        }
    }

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        const nextValue = name === "slug" ? slugify(value) : value
        setFormData((prev) => ({ ...prev, [name]: nextValue }))

        if (name === "tradeName" && !formData.slug) {
            const baseSlug = slugify(value)
            if (baseSlug) {
                setFormData(prev => ({ ...prev, slug: `${baseSlug}/unidade-1` }))
            }
        }
    }

    const handleSlugBlur = async () => {
        if (!formData.slug) return
        setSlugLoading(true)
        const available = await onCheckSlug(formData.slug)
        setSlugAvailable(available)
        setSlugLoading(false)
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData((prev) => ({
                ...prev,
                photo: file,
                photoPreview: URL.createObjectURL(file),
            }))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (slugAvailable === false) return // Prevent submit if slug taken

        // Transform flat state to structured payload
        const payload = {
            slug: formData.slug,
            companyInfo: {
                photo: formData.photo, // Will be handled by helper/controller if file? Controller expects URL?
                // Logic: Similar to Users, we need to upload first? 
                // The implementation plan says useAcademies hook handles API calls.
                // But usually we upload image first. 
                // Let's pass the File object, and let the hook/controller handle it?
                // Controller handles transaction, but it can't handle File object upload to Storage.
                // WE NEED TO UPLOAD PHOTO IN FRONTEND (Hook) before calling createAcademy.
                // Controller 'photo' field expects string URL.
                businessName: formData.businessName,
                tradeName: formData.tradeName,
                cnpj: formData.cnpj,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
            },
            address: {
                zip: formData.addressZip,
                state: formData.addressState,
                city: formData.addressCity,
                neighborhood: formData.addressNeighborhood,
                street: formData.addressStreet,
                number: formData.addressNumber,
            },
            owner: {
                firstName: formData.ownerFirstName,
                lastName: formData.ownerLastName,
                email: formData.ownerEmail,
                phone: formData.ownerPhone,
                birthdate: formData.ownerBirthdate,
                gender: formData.ownerGender,
            },
            ownerAddress: {
                zip: formData.ownerAddressZip,
                state: formData.ownerAddressState,
                city: formData.ownerAddressCity,
                neighborhood: formData.ownerAddressNeighborhood,
                street: formData.ownerAddressStreet,
                number: formData.ownerAddressNumber,
            }
        }

        onSubmit(payload)
    }

    return (
        <React.Fragment>
            <Nav tabs className="nav-tabs-custom">
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => toggleTab("1")}
                    >
                        Dados da Academia
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === "2" })}
                        onClick={() => toggleTab("2")}
                    >
                        Responsável
                    </NavLink>
                </NavItem>
            </Nav>

            <Form onSubmit={handleSubmit} className="p-3">
                <TabContent activeTab={activeTab}>
                    {/* --- TAB 1: ACADEMY DATA --- */}
                    <TabPane tabId="1">
                        <CardTitle className="mb-4">Informações da Empresa</CardTitle>

                        {/* Photo */}
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
                                        <i className="mdi mdi-domain fs-1 text-secondary"></i>
                                    )}
                                </div>
                                <Label
                                    htmlFor="academy-photo-upload"
                                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
                                    style={{ width: "30px", height: "30px", cursor: "pointer", border: "2px solid white" }}
                                >
                                    <i className="mdi mdi-camera fs-6"></i>
                                </Label>
                                <Input
                                    type="file"
                                    id="academy-photo-upload"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={handlePhotoChange}
                                />
                            </div>
                        </div>

                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Razão Social</Label>
                                <Input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required />
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Nome Fantasia</Label>
                                <Input type="text" name="tradeName" value={formData.tradeName} onChange={handleChange} required />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Slug (URL)</Label>
                                <Input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    onBlur={handleSlugBlur}
                                    invalid={slugAvailable === false}
                                    valid={slugAvailable === true}
                                    required
                                />
                                {slugLoading && <small className="text-muted">Verificando...</small>}
                                <FormFeedback>Este slug já está em uso.</FormFeedback>
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>CNPJ</Label>
                                <Input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Email da Empresa</Label>
                                <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Telefone</Label>
                                <Input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12} className="mb-3">
                                <Label>Site</Label>
                                <Input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." />
                            </Col>
                        </Row>

                        <hr />
                        <CardTitle className="mb-3">Endereço da Empresa</CardTitle>
                        <Row>
                            <Col xs={12} md={4} lg={3} className="mb-3">
                                <Label>CEP {cepLoading === 'company' && <small className="text-muted ms-2">Buscando...</small>}</Label>
                                <Input
                                    type="text"
                                    name="addressZip"
                                    value={formData.addressZip}
                                    onChange={handleChange}
                                    onBlur={() => handleCepBlur("company")}
                                    placeholder="00000-000"
                                />
                            </Col>
                            <Col xs={12} md={8} lg={9} className="mb-3 d-flex gap-3">
                                <div className="flex-grow-1">
                                    <Label>Cidade</Label>
                                    <Input type="text" name="addressCity" value={formData.addressCity} onChange={handleChange} />
                                </div>
                                <div style={{ width: '100px' }}>
                                    <Label>UF</Label>
                                    <Input type="text" name="addressState" value={formData.addressState} onChange={handleChange} />
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={4} lg={4} className="mb-3">
                                <Label>Bairro</Label>
                                <Input type="text" name="addressNeighborhood" value={formData.addressNeighborhood} onChange={handleChange} />
                            </Col>
                            <Col xs={12} md={6} lg={6} className="mb-3">
                                <Label>Rua</Label>
                                <Input type="text" name="addressStreet" value={formData.addressStreet} onChange={handleChange} />
                            </Col>
                            <Col xs={12} md={2} className="mb-3">
                                <Label>Número</Label>
                                <Input type="text" name="addressNumber" value={formData.addressNumber} onChange={handleChange} />
                            </Col>
                        </Row>
                    </TabPane>

                    {/* --- TAB 2: OWNER DATA --- */}
                    <TabPane tabId="2">
                        <CardTitle className="mb-4">Dados do Responsável</CardTitle>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Nome</Label>
                                <Input type="text" name="ownerFirstName" value={formData.ownerFirstName} onChange={handleChange} required />
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Sobrenome</Label>
                                <Input type="text" name="ownerLastName" value={formData.ownerLastName} onChange={handleChange} required />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Email (Login)</Label>
                                <Input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} required />
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Telefone</Label>
                                <Input type="text" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} required />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Data de Nascimento</Label>
                                <Input type="date" name="ownerBirthdate" value={formData.ownerBirthdate} onChange={handleChange} required />
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Sexo</Label>
                                <Input type="select" name="ownerGender" value={formData.ownerGender} onChange={handleChange} required>
                                    <option value="">Selecione...</option>
                                    {Object.values(GENDER).map(g => (
                                        <option key={g.value} value={g.value}>{g.label}</option>
                                    ))}
                                </Input>
                            </Col>
                        </Row>

                        <hr />
                        <CardTitle className="mb-3">Endereço do Responsável</CardTitle>
                        <Row>
                            <Col xs={12} md={4} lg={3} className="mb-3">
                                <Label>CEP {cepLoading === 'owner' && <small className="text-muted ms-2">Buscando...</small>}</Label>
                                <Input
                                    type="text"
                                    name="ownerAddressZip"
                                    value={formData.ownerAddressZip}
                                    onChange={handleChange}
                                    onBlur={() => handleCepBlur("owner")}
                                    placeholder="00000-000"
                                />
                            </Col>
                            <Col xs={12} md={8} lg={9} className="mb-3 d-flex gap-3">
                                <div className="flex-grow-1">
                                    <Label>Cidade</Label>
                                    <Input type="text" name="ownerAddressCity" value={formData.ownerAddressCity} onChange={handleChange} />
                                </div>
                                <div style={{ width: '100px' }}>
                                    <Label>UF</Label>
                                    <Input type="text" name="ownerAddressState" value={formData.ownerAddressState} onChange={handleChange} />
                                </div>
                            </Col>
                            <Col xs={12} md={4} className="mb-3">
                                <Label>Bairro</Label>
                                <Input type="text" name="ownerAddressNeighborhood" value={formData.ownerAddressNeighborhood} onChange={handleChange} />
                            </Col>
                            <Col xs={12} md={6} className="mb-3">
                                <Label>Rua</Label>
                                <Input type="text" name="ownerAddressStreet" value={formData.ownerAddressStreet} onChange={handleChange} />
                            </Col>
                            <Col xs={12} md={2} className="mb-3">
                                <Label>Número</Label>
                                <Input type="text" name="ownerAddressNumber" value={formData.ownerAddressNumber} onChange={handleChange} />
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            <ButtonLoader color="primary" type="submit" loading={submitting}>
                                Salvar Academia
                            </ButtonLoader>
                        </div>
                    </TabPane>
                </TabContent>
            </Form>
        </React.Fragment>
    )
}

AcademyForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    submitting: PropTypes.bool,
    onCheckSlug: PropTypes.func.isRequired
}

export default AcademyForm
