import React from 'react';

const AuditActionBadge = ({ action, severity }) => {
    const actionUpper = String(action || '').toUpperCase();
    let color = "secondary";
    let icon = "circle-outline";

    if (severity === 'CRITICAL') {
        color = "danger";
        icon = "alert-octagon";
    }
    else if (actionUpper.includes('CREATE')) {
        color = "success";
        icon = "plus-circle-outline";
    }
    else if (actionUpper.includes('DELETE')) {
        color = "danger";
        icon = "delete-outline";
    }
    else if (actionUpper.includes('UPDATE')) {
        color = "warning";
        icon = "pencil-outline";
    }
    else if (actionUpper.includes('CANCEL')) {
        color = "danger";
        icon = "close-circle-outline";
    }
    else if (actionUpper.includes('PAID') || actionUpper.includes('SUCCESS') || actionUpper.includes('SETTLED')) {
        color = "success";
        icon = "check-all";
    }
    else if (actionUpper.includes('INCOME')) {
        color = "success";
        icon = "arrow-down-circle-outline";
    }
    else if (actionUpper.includes('EXPENSE')) {
        color = "danger";
        icon = "arrow-up-circle-outline";
    }

    return (
        <span className={`badge badge-soft-${color} font-size-12 fw-bold px-2 py-1`}>
            <i className={`mdi mdi-${icon} me-1`}></i>
            {action}
        </span>
    );
};

export default AuditActionBadge;
