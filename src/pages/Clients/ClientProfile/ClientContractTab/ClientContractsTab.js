import React, { useState } from 'react'
import { Card, CardBody, Alert } from 'reactstrap'
import { useParams } from 'react-router-dom'

// Hooks
import { useClientFinancial } from '../ClientFinancialTab/hooks/useClientFinancial'
import { useClientContractActions } from './hooks/useClientContractActions'

// Components
import ActiveContractCard from './components/ActiveContractCard'
import ContractHistoryTable from './components/ContractHistoryTable'
import ConfirmDialog from '../../../../components/Common/ConfirmDialog'
import SalesReceiptModal from '../../../../components/Common/SalesReceiptModal'

// Modals
import ContractAdjustDaysModal from './ClientContractModals/ContractAdjustDaysModal'
import ContractSuspendModal from './ClientContractModals/ContractSuspendModal'
import ContractCancelModal from './ClientContractModals/ContractCancelModal'
import ContractTransferModal from './ClientContractModals/ContractTransferModal'

const ClientContractsTab = () => {
    const { idTenant, idBranch, idClient } = useParams()
    const { contracts, loading, client } = useClientFinancial(idClient)

    // Estado local para o recibo (já que o hook pode ser focado em ações de contrato)
    const [receiptData, setReceiptData] = useState(null)

    const {
        modals,
        selectedContract,
        toggleModal,
        handleReactivate,
        handlePrintReceipt
    } = useClientContractActions(idTenant, idBranch, idClient)

    // Interceptar a impressão para abrir o modal de recibo
    const onPrintReceipt = async (idSale) => {
        const data = await handlePrintReceipt(idSale)
        if (data) setReceiptData(data)
    }

    if (loading) return <div>Carregando contratos...</div>

    const activeContracts = contracts.filter(c => ['active', 'suspended', 'scheduled_cancellation'].includes(c.status))
    const historicalContracts = contracts.filter(c => !['active', 'suspended', 'scheduled_cancellation'].includes(c.status))

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Contratos em Vigência */}
            {activeContracts.length > 0 ? (
                <div className="mb-4">
                    <h5 className="font-size-16 fw-bold mb-3 text-primary">
                        <i className="mdi mdi-shield-check-outline me-2"></i>Contratos em Vigência
                    </h5>
                    {activeContracts.map(contract => (
                        <ActiveContractCard
                            key={contract.id}
                            contract={contract}
                            onAdjustDays={(c, mode) => toggleModal('adjust', c, { mode })}
                            onSuspend={() => toggleModal('suspend', contract)}
                            onReactivate={() => toggleModal('reactivate', contract)}
                            onTransfer={() => toggleModal('transfer', contract)}
                            onCancel={() => toggleModal('cancel', contract)}
                            onPrint={onPrintReceipt}
                        />
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-sm mb-4 bg-soft-light border-dashed">
                    <CardBody className="py-5 text-center">
                        <h5 className="text-dark fw-bold">Nenhum contrato ativo</h5>
                        <p className="text-muted">Este cliente não possui uma matrícula ativa no momento.</p>
                    </CardBody>
                </Card>
            )}

            {/* Histórico de Contratos */}
            <h5 className="font-size-16 fw-bold mb-3 mt-4">
                <i className="mdi mdi-history me-2 text-muted"></i>Histórico de Contratos
            </h5>
            <Card className="border-0 shadow-sm">
                <CardBody className="p-0">
                    <ContractHistoryTable
                        contracts={historicalContracts}
                        onPrint={onPrintReceipt}
                        onShowDetails={(c) => console.log("Show details for", c)}
                    />
                </CardBody>
            </Card>

            {/* Modals Implementation */}
            {modals.adjust && (
                <ContractAdjustDaysModal
                    isOpen={modals.adjust}
                    toggle={() => toggleModal('adjust')}
                    contract={selectedContract}
                />
            )}
            {modals.suspend && (
                <ContractSuspendModal
                    isOpen={modals.suspend}
                    toggle={() => toggleModal('suspend')}
                    contract={selectedContract}
                />
            )}
            {modals.cancel && (
                <ContractCancelModal
                    isOpen={modals.cancel}
                    toggle={() => toggleModal('cancel')}
                    contract={selectedContract}
                />
            )}
            {modals.transfer && (
                <ContractTransferModal
                    isOpen={modals.transfer}
                    toggle={() => toggleModal('transfer')}
                    contract={selectedContract}
                />
            )}

            {/* Reativação Confirm Dialog */}
            <ConfirmDialog
                isOpen={modals.reactivate}
                toggle={() => toggleModal('reactivate')}
                title="Reativar Matrícula"
                description={
                    <div>
                        <p>Deseja reativar esta matrícula agora?</p>
                        <Alert color="soft-info" className="small border-0 mb-0">
                            A data de término do contrato será <strong>postergada proporcionalmente</strong> ao tempo em que o aluno ficou afastado.
                        </Alert>
                    </div>
                }
                confirmText="Sim, Reativar"
                confirmColor="success"
                onConfirm={() => handleReactivate(selectedContract)}
            />

            {/* Modal de Recibo */}
            {receiptData && (
                <SalesReceiptModal
                    isOpen={!!receiptData}
                    toggle={() => setReceiptData(null)}
                    saleData={receiptData.sale}
                    clientName={client?.name || 'Cliente'}
                />
            )}
        </div>
    )
}

export default ClientContractsTab
