import React, { useMemo } from 'react';
import { Button } from 'reactstrap';
import { formatDate } from '../../../../utils/date';
import AuditActionBadge from '../components/AuditActionBadge';

export const useAuditTableColumns = ({ staff, onViewDetails }) => {
    const columns = useMemo(() => [
        {
            label: "Horário",
            key: "timestamp",
            render: (log) => (
                <div className="text-nowrap">
                    <span className="fw-medium d-block text-dark">{formatDate(log.timestamp, 'time')}</span>
                    <small className="text-muted font-size-11">{formatDate(log.timestamp, 'short')}</small>
                </div>
            )
        },
        {
            label: "Usuário",
            key: "userId",
            render: (log) => {
                const staffMember = staff[log.userId];
                const name = staffMember?.name || log.userName || log.userId || 'Usuário Desconhecido';
                const photo = staffMember?.photo;

                return (
                    <div className="d-flex align-items-center">
                        <div className="avatar-xs me-2">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt={name}
                                    className="avatar-title rounded-circle"
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                            ) : (
                                <span className="avatar-title rounded-circle bg-soft-primary text-primary font-size-11">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="d-block text-truncate fw-medium" style={{ maxWidth: '140px' }}>
                                {name}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            label: "Ação",
            key: "action",
            render: (log) => <AuditActionBadge action={log.action} severity={log.severity} />
        },
        {
            label: "Entidade",
            key: "entityType",
            render: (log) => (
                <span className="badge bg-light text-muted border text-uppercase font-size-10">
                    {log.entityType}
                </span>
            )
        },
        {
            label: "Descrição",
            key: "description",
            render: (log) => (
                <div className="font-size-13 text-muted" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                    {log.description}
                </div>
            )
        },
        {
            label: "",
            key: "actions",
            render: (log) => (
                <div className="text-end">
                    <Button
                        color="light"
                        size="sm"
                        onClick={() => onViewDetails(log)}
                    >
                        <i className="mdi mdi-eye-outline text-primary font-size-14"></i>
                    </Button>
                </div>
            )
        }
    ], [staff, onViewDetails]);

    return columns;
};
