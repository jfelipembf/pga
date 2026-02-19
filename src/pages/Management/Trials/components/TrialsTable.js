import React from "react"
import { Table, Badge } from "reactstrap"
import { LIFECYCLE_STATUS_CONFIG } from "../../../../data/schemas/Clients/ClientSchema"
import { ENROLLMENT_STATUS_CONFIG } from "../../../../data/schemas/Clients/EnrollmentSchema"
import moment from "moment"
import { Link } from "react-router-dom"
import { useTenant } from "../../../../hooks/useTenant"

const TrialsTable = ({ trials, loading }) => {
    const { tenantSlug, branchSlug } = useTenant()

    const getLifecycleBadge = (status) => {
        const config = LIFECYCLE_STATUS_CONFIG[status] || { label: status, color: 'secondary' }
        return <Badge color={config.color} className="p-2">{config.label}</Badge>
    }

    const getStatusBadge = (status, attended) => {
        if (attended) return <Badge color="success" className="p-2">Realizada</Badge>
        const config = ENROLLMENT_STATUS_CONFIG[status] || { label: status, badge: 'bg-secondary' }
        return <Badge color={config.color} className={`p-2 ${config.badge}`}>{config.label}</Badge>
    }

    if (loading) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Carregando...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="table-responsive">
            <Table className="table-centered table-nowrap mb-0">
                <thead className="thead-light">
                    <tr>
                        <th>Nome</th>
                        <th>Atividade</th>
                        <th>Passo Atual</th>
                        <th>Horário</th>
                        <th>Professor</th>
                        <th>Origem</th>
                        <th>Data</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {trials.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="text-center text-muted p-4">
                                Nenhuma aula experimental encontrada para este período.
                            </td>
                        </tr>
                    ) : (
                        trials.map((t) => (
                            <tr key={t.id}>
                                <td>
                                    <Link
                                        to={`/${tenantSlug}/${branchSlug}/clients/${t.idClient}`}
                                        className="text-body font-weight-bold"
                                    >
                                        {t.clientName}
                                    </Link>
                                    {t.isConverted && (
                                        <i className="mdi mdi-check-decagram text-primary ms-1" title="Convertido em Contrato"></i>
                                    )}
                                </td>
                                <td>{t.activityName || '—'}</td>
                                <td>{getLifecycleBadge(t.lifecycleStatus)}</td>
                                <td>{t.startTime || '—'}</td>
                                <td>{t.instructorName || '—'}</td>
                                <td>
                                    <Badge color="light" className="text-muted border">
                                        {t.origin}
                                    </Badge>
                                </td>
                                <td>{moment(t.startDate).format('DD/MM/YYYY')}</td>
                                <td>{getStatusBadge(t.status, t.attendedSessions > 0)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </div>
    )
}

export default TrialsTable
