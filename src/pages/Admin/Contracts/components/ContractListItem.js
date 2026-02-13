import React from "react"

export const ContractListItem = ({ contract, active, onClick }) => {
    const translateDuration = (type, value) => {
        const labels = {
            'months': value === 1 ? 'Mês' : 'Meses',
            'days': value === 1 ? 'Dia' : 'Dias',
            'years': value === 1 ? 'Ano' : 'Anos'
        }
        return labels[type] || type
    }

    return (
        <div
            className={`d-flex align-items-center p-3 border-bottom cursor-pointer ${active ? 'bg-light' : ''}`}
            onClick={onClick}
            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
        >
            <div className="flex-grow-1 overflow-hidden">
                <h5 className="font-size-14 text-truncate mb-1">{contract.title}</h5>
                <p className="text-muted font-size-12 mb-0">
                    R$ {parseFloat(contract.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - {contract.duration} {translateDuration(contract.durationType, contract.duration)}
                </p>
                <div className="mt-1">
                    <span className={`badge bg-${contract.isActive ? 'success' : 'danger'} font-size-10`}>
                        {contract.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>
            <div className="flex-shrink-0 ms-2">
                <i className={`mdi mdi-chevron-right font-size-18 ${active ? 'text-primary' : 'text-muted opacity-50'}`}></i>
            </div>
        </div>
    )
}
