import { useNavigate } from "react-router-dom"
import { createSale } from "../../../services/Sales"
import { listReceivablesByClient } from "../../../services/Receivables"
import { useToast } from "../../../components/Common/ToastProvider"
import { useLoading } from "../../../hooks/useLoading"
import { useSystemSettings } from "../../../hooks/useSystemSettings"
import { getAuthUser } from "../../../helpers/permission_helper"

export const useSalesActions = ({
    idClient,
    clientName, // Added
    saleTab,
    selectedItem,
    diff,
    dueDate,
    computedQuantity,
    baseAmount,
    totalDue,
    discount,
    payments,
    contractStartDate,
    contractEndDate,
    setPayments,
    setDiscount,
    setQuantity,
    setDueDate
}) => {
    const navigate = useNavigate()
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()
    const { settings } = useSystemSettings()

    const handleFinalize = async () => {
        try {
            await withLoading('save', async () => {
                // Validação Financeira (Inadimplência)
                const allowDebt = settings?.sales?.allowEnrollmentWithDebt === true

                if (!allowDebt && idClient) {
                    const receivables = await listReceivablesByClient(idClient, { status: "open" })
                    const toleranceDays = Number(settings?.finance?.considerInadimplentAfterDays || 0)

                    const limitDate = new Date()
                    limitDate.setDate(limitDate.getDate() - toleranceDays)
                    const limitDateISO = limitDate.toISOString().split('T')[0]

                    const hasOverdue = receivables.some(r => {
                        if (!r.dueDate) return false
                        return r.dueDate < limitDateISO
                    })

                    if (hasOverdue) {
                        throw new Error(`Cliente possui pendências financeiras vencidas há mais de ${toleranceDays} dias. Venda bloqueada pelas configurações do sistema.`)
                    }
                }

                const item = selectedItem
                if (!item?.id) throw new Error("Selecione um item")
                if (diff < 0 && !dueDate) throw new Error("Informe a data para quitar o saldo devedor.")

                const itemType =
                    saleTab === "contratos" ? "contract" : saleTab === "produtos" ? "product" : "service"
                const gross = baseAmount
                const net = totalDue
                const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
                const user = getAuthUser()

                await createSale({
                    idClient: idClient || null,
                    clientName: clientName || "", // Added
                    idStaff: user?.uid || null,
                    staffName: user?.displayName || "",
                    requiresEnrollment: itemType === "contract" ? Boolean(item.raw?.requiresEnrollment) : false,
                    enrollmentStatus: itemType === "contract" ? "pending" : null,
                    payments, // Passando pagamentos para processamento no backend
                    dueDate,  // Passando data de vencimento (se houver saldo devedor)
                    totals: {
                        gross,
                        discount,
                        net,
                        paid: totalPaid,
                        pending: diff < 0 ? Math.abs(diff) : 0,
                        creditUsed: 0,
                        creditGenerated: diff > 0 ? diff : 0,
                    },
                    items: [
                        {
                            ...item.raw, // Passa todos os campos do template (suspensão, dias, etc)
                            itemType,
                            itemId: item.id,
                            description: item.label,
                            quantity: computedQuantity,
                            unitValue: item.total,
                            totalValue: net,
                            idContract: itemType === "contract" ? item.id : null,
                            startDate: contractStartDate,
                            endDate: contractEndDate,
                            creditUsed: 0,
                            creditGenerated: diff > 0 ? diff : 0,
                        },
                    ],
                })

                // O contrato já é criado automaticamente pela Cloud Function saveSale no backend.
                // Não é necessário chamar createClientContract aqui no frontend para evitar duplicidade.

                toast.show({ title: "Venda registrada", color: "success" })
                // reset
                setPayments([])
                setDiscount(0)
                setQuantity(1)
                setDueDate("")

                // Se for venda de contrato, voltar para página anterior (perfil)
                if (itemType === "contract") {
                    navigate(-1)
                }
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao finalizar", description: e?.message || String(e), color: "danger" })
        }
    }

    return {
        handleFinalize,
        isLoading: isLoading('save')
    }
}
