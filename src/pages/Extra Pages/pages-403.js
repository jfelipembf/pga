import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { Link, useParams } from 'react-router-dom';

const Pages403 = () => {
    document.title = "Acesso Negado | PGA Admin";
    const { idTenant, idBranch } = useParams();

    // Link de volta para o dashboard seguro
    const backToDashboard = idTenant && idBranch ? `/${idTenant}/${idBranch}/dashboard` : "/login";

    return (
        <React.Fragment>
            <div className="account-pages my-5 pt-sm-5">
                <Container>
                    <Row className="justify-content-center">
                        <Col md="8" lg="6" xl="5">
                            <Card className="overflow-hidden shadow-lg border-0 rounded-4">
                                <div className="bg-soft-danger p-4 text-center">
                                    <div className="display-1 text-danger fw-bold">403</div>
                                    <h4 className="text-danger mt-2 uppercase fw-bold">Acesso Negado</h4>
                                </div>
                                <CardBody className="p-4 text-center">
                                    <div className="avatar-lg mx-auto mb-4">
                                        <div className="avatar-title rounded-circle bg-light">
                                            <i className="mdi mdi-lock-outline display-4 text-danger"></i>
                                        </div>
                                    </div>

                                    <h5 className="fw-bold mb-3">Ops! Você não tem permissão.</h5>
                                    <p className="text-muted mb-4">
                                        Você não possui as permissões necessárias para acessar esta funcionalidade.
                                        Por favor, entre em contato com o seu <strong>gestor ou administrador</strong> para solicitar acesso.
                                    </p>

                                    <div className="d-grid">
                                        <Link
                                            className="btn btn-primary btn-lg waves-effect waves-light shadow-sm"
                                            to={backToDashboard}
                                        >
                                            <i className="mdi mdi-home me-1"></i> Voltar ao Início
                                        </Link>
                                    </div>
                                </CardBody>
                            </Card>

                            <div className="mt-5 text-center text-muted">
                                <p>©{new Date().getFullYear()} PGA Admin - Sistema de Gestão Esportiva</p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default Pages403
