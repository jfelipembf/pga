import React from "react"
import { Badge } from "reactstrap"
import { formatDate } from "../../../utils/date"

export const PayableListItem = ({ payable, active, onClick }) => {
    // Helper status colors
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'success';
            case 'pending': return 'warning';
            case 'overdue': return 'danger';
            default: return 'secondary';
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid': return 'Pago';
            case 'pending': return 'A Vencer';
            case 'overdue': return 'Atrasado';
            default: return status;
        }
    }

    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${active ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
            <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <h5 className="font-size-14 text-truncate mb-0 me-2">{payable.title}</h5>
                    <span className="fw-bold font-size-13">R$ {payable.amount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <p className="text-muted font-size-12 mb-0">
                        Vencto: {formatDate(payable.dueDate)}
                    </p>
                    <Badge color={getStatusColor(payable.status)} pill className="font-size-10">
                        {getStatusLabel(payable.status)}
                    </Badge>
                </div>
            </div>
        </div>
    )
}
