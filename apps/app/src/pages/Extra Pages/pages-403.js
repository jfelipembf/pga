import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { Link, useParams } from 'react-router-dom';

const Pages403 = () => {
    document.title = "403 Acesso Negado | Painel Swim";
    const { tenant, branch } = useParams();
    const dashboardLink = tenant && branch ? `/${tenant}/${branch}/dashboard/operational` : "/dashboard/operational";

    return (
        <React.Fragment>
            <div className="account-pages my-5 pt-sm-5">
                <Container>
                    <Row className="justify-content-center">
                        <Col md="8" lg="6" xl="5">
                            <Card className="overflow-hidden">
                                <CardBody className="pt-0">

                                    <div className="ex-page-content text-center pt-4">
                                        <h1 className="text-dark display-1 fw-bold">403!</h1>
                                        <h3 className="mb-3">Acesso Negado</h3>
                                        <p className="text-muted mb-4">
                                            Sua conta não tem o nível de permissão necessário para visualizar esta página.
                                            Se acreditar que isso é um erro, entre em contato com o proprietário do sistema.
                                        </p>
                                        <br />

                                        <Link className="btn btn-primary mb-4 waves-effect waves-light" to={dashboardLink}>
                                            <i className="mdi mdi-home me-1"></i> Voltar ao Dashboard
                                        </Link>
                                    </div>

                                </CardBody>
                            </Card>
                            <div className="mt-5 text-center">
                                © {new Date().getFullYear()} Painel Swim
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    )
}

export default Pages403;
