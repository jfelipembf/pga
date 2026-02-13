
import React from 'react';
import { Row, Col, Card, CardBody } from "reactstrap";
import { FormikProvider } from "formik";

// Components
import OverlayLoader from "../../../components/Common/OverlayLoader";
import PageLoader from "../../../components/Common/PageLoader";
import CompanyForm from "./components/CompanyForm";

// Hooks
import { useCompanyForm } from "./hooks/useCompanyForm";

const CompanySettings = () => {
    const {
        formik,
        loading,
        saving,
        photoPreview,
        handlePhotoChange
    } = useCompanyForm();

    return (
        <React.Fragment>
            <Row>
                <Col lg="12">
                    <Card className="position-relative" style={{ minHeight: '400px' }}>
                        <OverlayLoader show={saving} label="Salvando dados..." />

                        <CardBody>
                            <h4 className="card-title mb-4">Informações da Empresa</h4>

                            {loading ? (
                                <PageLoader isFullScreen={false} />
                            ) : (
                                <FormikProvider value={formik}>
                                    <CompanyForm
                                        formik={formik}
                                        saving={saving}
                                        photoPreview={photoPreview}
                                        handlePhotoChange={handlePhotoChange}
                                    />
                                </FormikProvider>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default CompanySettings;
