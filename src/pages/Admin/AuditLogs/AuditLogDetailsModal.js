import React from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge } from 'reactstrap'
import { formatDate } from '../../../utils/date'

const AuditLogDetailsModal = ({ isOpen, toggle, log, userName }) => {
    if (!log) return null;

    const renderDetails = (details) => {
        if (!details || Object.keys(details).length === 0) return <p className="text-muted">Sem detalhes adicionais.</p>;

        // Tratamento especial para Diffs (changes)
        if (details.changes) {
            return (
                <div className="table-responsive border rounded">
                    <table className="table table-nowrap table-sm mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th style={{ width: '20%' }}>Campo</th>
                                <th style={{ width: '40%' }}>Antes</th>
                                <th style={{ width: '40%' }}>Depois</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(details.changes).map(([key, change]) => (
                                <tr key={key}>
                                    <td className="fw-bold text-dark">{key}</td>
                                    <td className="text-danger bg-soft-danger">
                                        {typeof change.from === 'object' ? JSON.stringify(change.from) : (String(change.from || 'Vazio'))}
                                    </td>
                                    <td className="text-success bg-soft-success">
                                        {typeof change.to === 'object' ? JSON.stringify(change.to) : (String(change.to || 'Vazio'))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }

        // Fallback para JSON normal
        return (
            <pre className="bg-light p-3 rounded border" style={{ maxHeight: '400px', overflow: 'auto', fontSize: '13px' }}>
                {JSON.stringify(details, null, 2)}
            </pre>
        );
    };

    const getActionBadge = (action) => {
        const actionUpper = action?.toUpperCase() || '';
        if (actionUpper.includes('CREATE') || actionUpper.includes('SUCCESS') || actionUpper.includes('PAID')) return <Badge color="success">{action}</Badge>;
        if (actionUpper.includes('DELETE') || actionUpper.includes('CANCEL') || actionUpper.includes('ERROR')) return <Badge color="danger">{action}</Badge>;
        if (actionUpper.includes('UPDATE')) return <Badge color="warning">{action}</Badge>;
        return <Badge color="info">{action}</Badge>;
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
            <ModalHeader toggle={toggle}>
                Detalhes do Log de Auditoria
            </ModalHeader>
            <ModalBody>
                <Row className="mb-3">
                    <Col md={6}>
                        <label className="text-muted mb-1 d-block">Ação</label>
                        <h5>{getActionBadge(log.action)}</h5>
                    </Col>
                    <Col md={6}>
                        <label className="text-muted mb-1 d-block">Data e Hora</label>
                        <p className="fw-bold">{formatDate(log.timestamp, 'full')}</p>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={6}>
                        <label className="text-muted mb-1 d-block">Usuário</label>
                        <p className="fw-bold">{userName || log.userId}</p>
                    </Col>
                    <Col md={6}>
                        <label className="text-muted mb-1 d-block">Entidade</label>
                        <p>
                            <span className="badge bg-soft-primary text-primary text-uppercase me-2">{log.entityType}</span>
                            <code className="text-muted">{log.entityId}</code>
                        </p>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col sm={12}>
                        <label className="text-muted mb-1 d-block">Descrição</label>
                        <p className="font-size-15">{log.description}</p>
                    </Col>
                </Row>

                <hr />

                <label className="text-muted mb-2 d-block">Dados Técnicos (Details)</label>
                {renderDetails(log.details)}

                {log.metadata && (
                    <div className="mt-3 p-2 bg-soft-secondary rounded">
                        <small className="text-muted d-block">
                            <strong>Navegador:</strong> {log.metadata.userAgent}
                        </small>
                        <small className="text-muted d-block">
                            <strong>Plataforma:</strong> {log.metadata.platform}
                        </small>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Fechar</Button>
            </ModalFooter>
        </Modal>
    );
};

export default AuditLogDetailsModal;
