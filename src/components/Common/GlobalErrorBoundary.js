import React from 'react'
import { Card, CardBody, Container, Row, Col, Button } from 'reactstrap'

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Atualiza o state para que a próxima renderização mostre a UI alternativa.
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        // Você também pode registrar o erro em um serviço de relatório de erros (Sentry/LogRocket)
        console.error("Uncaught error:", error, errorInfo)
        this.setState({ error, errorInfo })
    }

    handleReload = () => {
        window.location.reload()
    }

    handleClearCache = () => {
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            // UI customizada de erro (Fallback UI)
            return (
                <div className="account-pages my-5 pt-5">
                    <Container>
                        <Row className="justify-content-center">
                            <Col md="8" lg="6" xl="5">
                                <Card className="overflow-hidden shadow-lg border-0">
                                    <div className="bg-soft-primary">
                                        <div className="row">
                                            <div className="col-7">
                                                <div className="text-primary p-4">
                                                    <h5 className="text-primary">Ops! Algo deu errado.</h5>
                                                    <p>Ocorreu um erro inesperado na aplicação.</p>
                                                </div>
                                            </div>
                                            <div className="col-5 align-self-end">
                                                <img src="assets/images/profile-img.png" alt="" className="img-fluid" />
                                            </div>
                                        </div>
                                    </div>
                                    <CardBody className="pt-0">
                                        <div className="p-2 mt-4">
                                            <div className="text-center">
                                                <div className="avatar-md mx-auto mb-4">
                                                    <span className="avatar-title rounded-circle bg-light text-primary font-size-24">
                                                        <i className="mdi mdi-alert-circle-outline"></i>
                                                    </span>
                                                </div>
                                                <h4 className="text-muted">Desculpe o transtorno</h4>
                                                <p className="tex-muted mb-4">
                                                    Nossa equipe técnica já foi notificada (simulação).
                                                    Por favor, tente recarregar a página.
                                                </p>

                                                <div className="d-grid gap-2">
                                                    <Button color="primary" onClick={this.handleReload}>
                                                        <i className="mdi mdi-refresh me-2"></i>
                                                        Tentar Novamente
                                                    </Button>

                                                    <Button color="link" className="text-muted btn-sm mt-2" onClick={this.handleClearCache}>
                                                        Limpar cache e reiniciar
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Detalhes técnicos (apenas em dev) */}
                                            {process.env.NODE_ENV === 'development' && (
                                                <div className="mt-4 text-start bg-light p-3 rounded overflow-auto" style={{ maxHeight: '200px', fontSize: '11px' }}>
                                                    <code className="text-danger">
                                                        {this.state.error && this.state.error.toString()}
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            )
        }

        return this.props.children
    }
}

export default GlobalErrorBoundary
