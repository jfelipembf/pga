import React from "react"
import { Container, Row, Col, Card, CardBody, Form, Spinner } from "reactstrap"

// Components
import Header from "./Components/Header"
import PhotoUpload from "./Components/PhotoUpload"
import PersonalData from "./Components/PersonalData"
import AddressForm from "./Components/AddressForm"
import ButtonLoader from "../../../components/Common/ButtonLoader"

// Hook
import { useClientRegister } from "./Hooks/useClientRegister"

// Assets
import bg from "../../../assets/images/bg-1.png"
import happyBaby from "../../../assets/images/happyBaby.png"

const ClientSelfRegister = () => {
    const {
        loadingIds,
        loading,
        uploadingPhoto,
        validation,
        photoState,
        handlers,
        isSuccess
    } = useClientRegister()

    if (loadingIds) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner color="primary" />
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div
                className="d-flex justify-content-center align-items-center vh-100"
                style={{
                    backgroundImage: `url(${bg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <Container>
                    <Row className="justify-content-center">
                        <Col md={8} lg={6} xl={5}>
                            <Card className="overflow-hidden mb-0">
                                <CardBody className="p-4">
                                    <div className="p-2 text-center mt-3">
                                        <div className="mb-4">
                                            <img
                                                src={happyBaby}
                                                alt="Sucesso"
                                                className="img-fluid"
                                                style={{ height: '180px' }}
                                            />
                                        </div>
                                        <h4 className="text-primary text-uppercase fw-bold">Cadastro Recebido!</h4>
                                        <p className="text-muted mb-4 font-size-16">
                                            Obrigado por se registrar conosco. <br />
                                            Seus dados foram salvos com sucesso.
                                        </p>
                                        <div className="d-grid text-center">
                                            <button
                                                className="btn btn-primary waves-effect waves-light"
                                                onClick={() => window.location.reload()}
                                            >
                                                Fazer novo cadastro
                                            </button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        )
    }

    return (
        <div
            className="account-pages my-5 pt-sm-5 position-relative"
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '100vh',
                overflowX: 'hidden'
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <Card className="overflow-hidden">
                            <Header />
                            <CardBody className="pt-0">
                                <div className="p-2">
                                    <Form className="form-horizontal" onSubmit={(e) => {
                                        e.preventDefault()
                                        validation.handleSubmit()
                                        return false
                                    }}>

                                        <PhotoUpload
                                            preview={photoState.preview}
                                            handlePhotoClick={handlers.handlePhotoClick}
                                            handlePhotoChange={handlers.handlePhotoChange}
                                            fileInputRef={photoState.fileInputRef}
                                        />

                                        <PersonalData validation={validation} />

                                        <AddressForm
                                            validation={validation}
                                            handleCepBlur={handlers.handleCepBlur}
                                        />

                                        <div className="mt-4 d-grid">
                                            <ButtonLoader
                                                color="primary"
                                                type="submit"
                                                className="waves-effect waves-light"
                                                loading={loading || uploadingPhoto}
                                            >
                                                Cadastrar Cliente
                                            </ButtonLoader>
                                        </div>

                                    </Form>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default ClientSelfRegister
