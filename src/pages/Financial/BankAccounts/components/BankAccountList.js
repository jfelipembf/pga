import React from "react"
import { BankAccountItem } from "./BankAccountItem"
import PageLoader from "../../../../components/Common/PageLoader"

export const BankAccountList = ({ accounts, loading, selectedId, onSelect }) => {
    return (
        <div className="position-relative" style={{ minHeight: '300px' }}>
            {loading && accounts.length === 0 ? (
                <PageLoader isFullScreen={false} />
            ) : accounts.length === 0 ? (
                <div className="p-3 text-center text-muted small">
                    <i className="mdi mdi-bank-off-outline d-block font-size-24 mb-2"></i>
                    Nenhuma conta cadastrada.
                </div>
            ) : null}
            {accounts.map(item => (
                <BankAccountItem
                    key={item.id}
                    account={item}
                    active={selectedId === item.id}
                    onClick={() => onSelect(item)}
                />
            ))}
        </div>
    )
}
