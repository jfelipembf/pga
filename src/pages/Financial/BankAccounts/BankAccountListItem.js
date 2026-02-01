import React from "react"
import { Badge } from "reactstrap"

export const BankAccountListItem = ({ account, active, onClick }) => {
    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${active ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
            <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex align-items-center mb-1">
                    <h5 className="font-size-14 text-truncate mb-0 me-2">{account.name}</h5>
                    {account.isPrimary && <Badge color="primary" className="font-size-10">Principal</Badge>}
                </div>
                <p className="text-muted font-size-12 mb-0">
                    {account.bankCode && `${account.bankCode} - `}{account.bank}
                </p>
            </div>

            <div className="text-end ms-2">
                <h5 className={`font-size-14 mb-1 ${account.currentBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.currentBalance || 0)}
                </h5>
                {!account.isActive && (
                    <Badge color="danger" pill>Inativo</Badge>
                )}
            </div>
        </div>
    )
}
