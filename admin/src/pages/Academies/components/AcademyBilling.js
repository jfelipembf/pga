import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Row, Col, Badge, Alert, Spinner } from 'reactstrap';
import { getFunctions, httpsCallable } from 'firebase/functions';
import PropTypes from 'prop-types';
import useTenant from '../../../hooks/useTenant';

const AcademyBilling = ({ academy }) => {
    const { tenant, loading: tenantLoading } = useTenant(academy?.tenantId);

    // States
    const [plans, setPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            const functions = getFunctions();
            try {
                const listSubscriptionPlans = httpsCallable(functions, 'listSubscriptionPlans');
                const result = await listSubscriptionPlans();
                setPlans(result.data || []);
            } catch (error) {
                console.error("Error fetching plans details:", error);
                // No more hardcoded fallback, just leave empty or show error
            } finally {
                setPlansLoading(false);
            }
        };
        fetchPlans();
    }, []);

    useEffect(() => {
        const fetchInvoices = async () => {
            const functions = getFunctions();
            if (!tenant?.stripeCustomerId) return;
            setInvoicesLoading(true);
            try {
                const getStripeInvoices = httpsCallable(functions, 'getStripeInvoices');
                const result = await getStripeInvoices({ customerId: tenant.stripeCustomerId });
                setInvoices(result.data || []);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setInvoicesLoading(false);
            }
        };
        fetchInvoices();
    }, [tenant?.stripeCustomerId]);

    const handleSubscribe = async (selectedPriceId) => {
        const functions = getFunctions();
        setLoading(true);
        setError(null);
        try {
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

            const result = await createCheckoutSession({
                tenantId: academy.tenantId,
                priceId: selectedPriceId
            });

            if (result.data?.url) {
                window.location.href = result.data.url;
            } else {
                throw new Error("Não foi possível gerar a sessão de checkout.");
            }
        } catch (err) {
            console.error("Billing error:", err);
            setError(err.message || "Erro ao processar assinatura.");
        } finally {
            setLoading(false);
        }
    };

    if (tenantLoading) {
        return (
            <Card>
                <CardBody className="text-center p-5">
                    <Spinner color="primary" />
                    <p className="mt-2 text-muted">Carregando informações de faturamento...</p>
                </CardBody>
            </Card>
        );
    }

    const status = tenant?.subscriptionStatus || 'unpaid';

    const statusMap = {
        'active': { color: 'success', text: 'Ativa' },
        'past_due': { color: 'warning', text: 'Atrasada' },
        'unpaid': { color: 'danger', text: 'Não Assinada' },
        'canceled': { color: 'secondary', text: 'Cancelada' }
    };

    const currentStatus = statusMap[status] || statusMap['unpaid'];

    return (
        <Card>
            <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Planos e Assinatura</h5>
                    <Badge color={currentStatus.color} pill className="px-3 py-2">
                        Status: {currentStatus.text}
                    </Badge>
                </div>

                {error && <Alert color="danger">{error}</Alert>}

                <div className="mb-5">
                    {plansLoading ? (
                        <div className="text-center p-5 border rounded-3">
                            <Spinner color="primary" />
                            <p className="mt-2 text-muted">Buscando melhores planos para você...</p>
                        </div>
                    ) : (
                        <Row className="g-4">
                            {plans.map((plan) => (
                                <Col key={plan.id} md={plans.length === 1 ? "12" : plans.length === 2 ? "6" : "4"}>
                                    <div className={`p-4 border rounded-3 h-100 d-flex flex-column ${status === 'active' ? 'bg-light bg-opacity-10' : 'shadow-sm'}`}>
                                        <div className="mb-3 d-flex justify-content-between align-items-center">
                                            <h6 className="fw-bold mb-0">{plan.productName}</h6>
                                            {status === 'active' && (
                                                <Badge color="success" className="font-size-11">Seu Plano</Badge>
                                            )}
                                        </div>

                                        <p className="text-muted small mb-4 flex-grow-1">
                                            {plan.productDescription || 'Acesso total à plataforma, suporte prioritário e todas as funcionalidades de gestão.'}
                                        </p>

                                        <div className="d-flex align-items-baseline mb-4">
                                            <span className="fs-2 fw-bold">
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: plan.currency.toUpperCase()
                                                }).format(plan.amount)}
                                            </span>
                                            <span className="text-muted ms-1">
                                                {plan.interval === 'month' ? '/mês' :
                                                    plan.interval === 'year' ? '/ano' : ''}
                                            </span>
                                        </div>

                                        <Button
                                            color={status === 'active' ? "outline-primary" : "primary"}
                                            className="w-100 py-2 fw-bold"
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={loading || status === 'active'}
                                        >
                                            {loading ? "Processando..." : (status === 'active' ? "Plano Atual" : "Assinar Agora")}
                                        </Button>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>

                <Row className="g-4 border-top pt-5">
                    <Col md="12">
                        <div className="p-4 border rounded-3 bg-light bg-opacity-25">
                            <h6 className="fw-bold mb-3">Vantagens da Assinatura</h6>
                            <Row>
                                <Col md="4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="mdi mdi-check-circle-outline text-success me-2 fs-5" />
                                        <span className="small">Renovação Automática</span>
                                    </div>
                                </Col>
                                <Col md="4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="mdi mdi-check-circle-outline text-success me-2 fs-5" />
                                        <span className="small">Cancelamento a qualquer momento</span>
                                    </div>
                                </Col>
                                <Col md="4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="mdi mdi-check-circle-outline text-success me-2 fs-5" />
                                        <span className="small">Notas fiscais por e-mail</span>
                                    </div>
                                </Col>
                            </Row>

                            {tenant?.stripeCustomerId && (
                                <div className="mt-3 pt-3 border-top d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="small text-muted mb-0">ID do Cliente Stripe:</p>
                                        <code className="text-primary">{tenant.stripeCustomerId}</code>
                                    </div>
                                    {status === 'active' && (
                                        <span className="text-muted small text-italic">
                                            Assinatura gerenciada via Stripe Dashboard
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>

                <div className="mt-5">
                    <h6 className="fw-bold mb-3">Histórico de Pagamentos</h6>
                    <div className="table-responsive">
                        <table className="table table-nowrap align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Data</th>
                                    <th>Nº da Fatura</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Documento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoicesLoading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <Spinner size="sm" color="primary" className="me-2" />
                                            Carregando histórico...
                                        </td>
                                    </tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            Nenhum pagamento encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>{new Date(inv.date * 1000).toLocaleDateString('pt-BR')}</td>
                                            <td><code className="text-primary">{inv.number}</code></td>
                                            <td>
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: inv.currency.toUpperCase()
                                                }).format(inv.amount)}
                                            </td>
                                            <td>
                                                <Badge
                                                    color={inv.status === 'paid' ? 'success' : 'warning'}
                                                    className="font-size-11"
                                                >
                                                    {inv.status === 'paid' ? 'Pago' : inv.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                {inv.pdf ? (
                                                    <a href={inv.pdf} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                        <i className="mdi mdi-download me-1" /> PDF
                                                    </a>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

AcademyBilling.propTypes = {
    academy: PropTypes.object.isRequired
};

export default AcademyBilling;
