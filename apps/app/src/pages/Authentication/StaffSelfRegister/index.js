import React from "react"
import { Container, Row, Col, Card, CardBody, Form, Spinner } from "reactstrap"

// Components
import Header from "./Components/Header"
import PhotoUpload from "./Components/PhotoUpload"
import PersonalData from "./Components/PersonalData"
import AddressForm from "./Components/AddressForm"
import SecurityForm from "./Components/SecurityForm"
import ButtonLoader from "../../../components/Common/ButtonLoader"

// Hook
import { useStaffRegister } from "./Hooks/useStaffRegister"

// Assets
import bg from "../../../assets/images/bg-1.png"

const StaffSelfRegister = () => {
    const {
        loadingIds,
        loading,
        uploadingPhoto,
        validation,
        photoState,
        handlers
    } = useStaffRegister()

    if (loadingIds) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner color="primary" />
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

                                        <SecurityForm validation={validation} />

                                        <div className="mt-4 d-grid">
                                            <ButtonLoader
                                                color="primary"
                                                type="submit"
                                                className="waves-effect waves-light"
                                                loading={loading || uploadingPhoto}
                                            >
                                                Cadastrar
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

export default StaffSelfRegister
